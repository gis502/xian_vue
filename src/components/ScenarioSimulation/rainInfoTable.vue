<template>
  <div class="data-table">
    <button @click="toggleTableVisibility" class="toggle-table-btn">
      {{ isTableVisible ? "-" : "+" }}
    </button>
    <div class="table-title">降雨信息</div>
    <table v-if="isTableVisible" style="table-layout: fixed; width: 100%">
      <thead>
      <tr>
        <th style="width: 20%;">区域</th>
        <th style="width: 20%;">累计降雨量</th>
<!--        <th style="width: 20%;">累计时长</th>-->
        <th style="width: 20%;">预计降雨量</th>
<!--        <th style="width: 20%;">预计时长</th>-->
      </tr>
      </thead>
      <tbody>
      <tr v-for="(item, index) in showData" :key="index">
        <td style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">{{ item.area }}</td>
        <td style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">{{ item.totalRainfall }}mm</td>
<!--        <td style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">{{ item.duration }}小时</td>-->
        <td style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">{{ item.predictTotalRainfall}}mm</td>
<!--        <td style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">{{ item.predictDuration}}小时</td>-->
      </tr>
      </tbody>
    </table>
  </div>
</template>
<script>
import {getRainPeriodInfoByDisasterId} from "@/api/system/disasterEvents.js";
import { throttle, debounce} from "lodash";

export default {
  data() {
    return {
      tableData: [],
      isTableVisible: true,
      showData: [],
      lastTimeData:[],
      predictRain:[],
      RainPeriodInfo: null,
      countyStartRainTimeMap: new Map(),
      stopWatchCurrentTime: null,
      stopWatchDisasterEvent: null,
    }
  },
  props: ['disasterEvent', 'currentTime'],

  // watch: {
  //   currentTime() {
  //     this.throttledTimeSelect(); // 调用节流后的函数
  //   },
  //   disasterEvent() {
  //     this.throttledgetRainPeriodInfo()
  //   }
  // },

  mounted() {
    // 对 timeSelect 方法进行节流包装
    this.throttledTimeSelect = throttle(this.timeSelect, 1000);
    this.throttledgetRainPeriodInfo = throttle(this.getRainPeriodInfo, 1000);
    // 手动创建监听
    this.stopWatchCurrentTime = this.$watch('currentTime', () => {
      this.throttledTimeSelect();
    });
    this.stopWatchDisasterEvent = this.$watch('disasterEvent', () => {
      this.throttledgetRainPeriodInfo();
    });
  },
  beforeUnmount() {
    // 停止监听
    this.stopWatchCurrentTime?.();
    this.stopWatchDisasterEvent?.();
    // console.log('✅ 所有 watch 已停止');
  },
  methods: {
    toggleTableVisibility() {
      this.isTableVisible = !this.isTableVisible;
    },

    async getRainPeriodInfo() {
      this.showData=[]
      this.predictRain=[]
      // console.log(this.disasterEvent, "this.disasterEvent.disasterId)")

// 将字符串分割成数组
      const positions = this.disasterEvent.position.split(',');
      const rainfalls = this.disasterEvent.rainfall.split(',');
      // const durations = this.disasterEvent.duration.split(',');


// 遍历数组，提取数据并创建新对象
      positions.forEach((position, index) => {
        const rainfall = parseFloat(rainfalls[index]);
        // const duration = parseInt(durations[index]);
        const newDisasterData = {
          area: position.trim(), // 移除可能的空格
          predictTotalRainfall: rainfall,
          // predictDuration: duration // 假设duration是小时数
        };
        this.predictRain.push(newDisasterData);
      });

      // console.log(" this.predictRain", this.predictRain)
      let res = await getRainPeriodInfoByDisasterId({id: this.disasterEvent.disasterId});
      this.RainPeriodInfo = res.data
      // console.log(this.RainPeriodInfo, "this.RainPeriodInfo")
      if(this.RainPeriodInfo.length!=0){

        // 步骤 1: 找到每个区县的最早开始时间
        this.RainPeriodInfo.forEach(item => {
          const {position, rainPeriodStart} = item;
          const startTime = new Date(rainPeriodStart);

          // 初始化或更新最早开始时间和最晚结束时间
          if (!this.countyStartRainTimeMap.has(position) || startTime < this.countyStartRainTimeMap.get(position)) {
            this.countyStartRainTimeMap.set(position, startTime);
          }
        });

        // console.log(this.countyStartRainTimeMap, "this.countyStartRainTimeMap")
      }
      //无实际下雨数据时的处理
      else {
        this.predictRain.forEach(item=>{
          this.showData.push({
            area:item.area,
            totalRainfall:"/",
            duration:"/",
            predictTotalRainfall:item.predictTotalRainfall,
            // predictDuration:item.predictDuration,
          })
        })
        // console.log(this.showData,"this.showData")
      }
    },

    timeSelect() {
      if (!this.RainPeriodInfo) {
        return;
      }
      let currentTime = new Date(this.currentTime);
      // console.log("timeselect")
      let dataIntime = this.RainPeriodInfo.filter(item => {
        // console.log(item, "item")
        let occurTime = new Date(item.rainPeriodEnd);
        // console.log(currentTime, occurTime, "currentTime,occurTime")
        if (!occurTime || !currentTime) {
          console.error(`Invalid date format for field2: ${item.field2}`);
          return false;
        }
        return occurTime < currentTime;
      });

      // console.log(dataIntime, "dataIntime")

      // 步骤 2: 累加每个区县的降雨量
      const countyRainfallTotalMap = new Map();
      const countyRainfallEndMap = new Map();


      dataIntime.forEach(item => {
        const {position, rainfall, rainPeriodEnd} = item;

        const endTime = new Date(rainPeriodEnd);
        // 累加降雨量
        if (countyRainfallTotalMap.has(position)) {
          countyRainfallTotalMap.set(position, countyRainfallTotalMap.get(position) + rainfall);
        } else {
          countyRainfallTotalMap.set(position, rainfall);
        }

        //之后时间
        if (!countyRainfallEndMap.has(position) || endTime > countyRainfallEndMap.get(position)) {
          countyRainfallEndMap.set(position, endTime);
        }
      });
      // console.log(this.countyStartRainTimeMap, countyRainfallTotalMap, countyRainfallEndMap, "this.countyStartRainTimeMap,countyRainfallTotalMap，countyRainfallEndMap")

      const countyRainDurationMap = new Map();
      // 计算每个区域的降雨持续时间
      countyRainfallEndMap.forEach((endTime, position) => {
        // console.log(endTime, position, "endTime, position")
        const startTime = this.countyStartRainTimeMap.get(position);
        if (!startTime) {
          console.error(`未找到区域 ${position} 的开始时间`);
          return;
        }
        // 计算持续时间（单位：分钟）
        const duration = (endTime - startTime) / (1000 * 60 * 60);
        // console.log(`区域 ${position} 的持续时间：`, duration, '小时');
        // 更新持续时间映射
        countyRainDurationMap.set(position, duration);
      });

      // console.log(countyRainfallTotalMap,countyRainDurationMap,"countyRainfallTotalMap,countyRainDurationMap")

      //组成数据
      let newData = [];
      for (let [position, totalRainfall] of countyRainfallTotalMap) {
        let duration = countyRainDurationMap.get(position) || '0';
        let dataObject = {
          area: position,
          totalRainfall: totalRainfall,
          duration: duration
        };
        newData.push(dataObject);
      }
      if (this.hasDataChanged(newData, this.lastTimeData)) {
        this.lastTimeData = newData
        this.combineReadAndPredic()
      }
    },

    // 比较新旧数据是否有变化
    hasDataChanged(newData, oldData) {
      if (newData.length !== oldData.length) {
        return true; // 数据长度不同，肯定有变化
      }
      for (let i = 0; i < newData.length; i++) {
        let newDataItem = newData[i];
        let oldDataItem = oldData.find(item => item.area === newDataItem.area);
        if (!oldDataItem ||
            newDataItem.totalRainfall !== oldDataItem.totalRainfall ||
            newDataItem.duration !== oldDataItem.duration) {
          return true; // 数据内容有变化
        }
      }
      return false; // 数据没有变化
    },

    combineReadAndPredic(){
      this.showData=[]
      // 遍历 lastTimeData 数组
      this.lastTimeData.forEach(lastTimeItem => {
        // console.log(this.lastTimeData,"this.lastTimeData")
        // 查找 predictRain 中对应的 area
        let predictItem = this.predictRain.find(item => item.area === lastTimeItem.area);
        // 如果找到对应的 predictItem，则合并数据
        if (predictItem) {
          this.showData.push({
            area: lastTimeItem.area,
            totalRainfall: Number(lastTimeItem.totalRainfall).toFixed(2),
            duration: lastTimeItem.duration,
            predictTotalRainfall: Number(predictItem.predictTotalRainfall).toFixed(2),
            // predictDuration: predictItem.predictDuration
          });
        } else {
          // 如果没有找到对应的 predictItem，则只添加 lastTimeData 中的数据
          this.showData.push({
            area: lastTimeItem.area,
            totalRainfall:  Number(lastTimeItem.totalRainfall).toFixed(2),
            duration: lastTimeItem.duration,
            predictTotalRainfall: "-",
            // predictDuration: "-"
          });
        }
      });
    }
  }
}


</script>
<style scoped lang="scss">
.data-table {
  position: absolute;
  top: 2vh; /* 距离顶部20px */
  right: 4vw; /* 距离左侧20px */
  background: rgba(14, 52, 98, 0.8);
  color: white;
  padding: 15px;
  border-radius: 8px;
  z-index: 10;
  width: 300px; /* 限制表格宽度 */
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  font-size: 12px; /* 调整字体大小 */
  border: 1px solid rgba(0, 225, 255, 0.5);
}

.toggle-table-btn {
  position: absolute;
  top: 5px; /* 调整按钮位置 */
  left: 5px; /* 调整按钮位置 */
  //background-color: #007bff;
  background-image: linear-gradient(159deg, #1c9fff 2%, #9be7ff 128%);
  //border-radius: 24px;
  color: white;
  border: none;
  border-radius: 50%; /* 圆形按钮 */
  width: 25px; /* 按钮宽度 */
  height: 25px; /* 按钮高度 */
  font-size: 20px;
  line-height: 1; /* 垂直居中文本 */
  text-align: center;
  cursor: pointer;
  z-index: 1001; /* 确保按钮在表格内容之上 */
  display: flex;
  justify-content: center;
  align-items: center;
}

.toggle-table-btn:hover {
  background-color: #0056b3;
}

.table-title {
  font-weight: bold;
  margin-bottom: 5px;
  font-size: 16px;
  text-align: center;
  margin-top: 0; /* 将 margin-top 设置为0，避免空白区域 */
  padding-top: 0px; /* 增加内边距，为按钮留出空间 */
}

.data-table table {
  width: 100%;
  border-collapse: collapse; /* 合并边框 */
}

.data-table th,
.data-table td {
  height: 50px;
  border: 1px solid #FFFFFF; /* 浅色边框 */
  padding: 8px 12px;
  text-align: center;
  font-size: 12px;
}

.data-table th {
  background: linear-gradient(180deg, rgba(86, 204, 242, 1) 0%, rgba(47, 128, 237, 1) 100%);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  padding: 10px 12px;
  text-align: center;
  font-weight: bold;
}
.data-table td {
  background: rgba(14, 52, 98, 0.8);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 10px 12px;
  text-align: center;
  font-size: 14px;
  height: 50px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.data-table tbody tr:nth-child(even) {
  background-color: rgba(255,255,255,0.5); /* 斑马纹效果 */
}

.data-table tbody tr:hover {
  background-color: rgba(86, 204, 242, 0.3);
}

.pagination-controls {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 10px;
  gap: 10px;
}

.pagination-controls button {
  background-color: #3c86ff;
  color: white;
  border: none;
  padding: 5px 10px;
  border-radius: 3px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.pagination-controls button:disabled {
  background-color: #373e52;
  cursor: not-allowed;
}

.pagination-controls button:hover:not(:disabled) {
  background-color: #0056b3;
}

.pagination-controls span {
  font-size: 12px;
  font-weight: bold;
}

.total-items {
  margin-left: 10px;
  font-size: 12px;
  color: white;
}

/* 新增样式 */
.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  gap: 10px; /* 增加整体元素之间的间距 */
}

.data-table select,
.search-box input {
  height: 34px;
  padding: 6px 12px;
  border-radius: 4px;
  background: rgba(15, 61, 118, 0.6);
  color: white;
  border: 1px solid rgba(0, 225, 255, 1);
  box-sizing: border-box;
}

.search-box {
  display: flex; /* 使搜索框和按钮在同一行 */
  align-items: center;
  gap: 5px; /* 搜索框和按钮之间的间距 */
  flex-grow: 1; /* 允许搜索框占据更多空间 */
}

.search-box input {
  flex-grow: 1; /* 搜索框占据剩余空间 */
  width: auto; /* 移除固定宽度 */
}

.search-box button {
  background-color: #3c86ff;
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s ease;
  height: 34px; /* 统一高度 */
  box-sizing: border-box; /* 确保padding和border包含在height内 */
  white-space: nowrap; /* 防止按钮文字换行 */
}

.search-box button:hover {
  background-color: #0056b3;
}

.data-table select {
  flex-shrink: 0; /* 防止下拉菜单被压缩 */
}

::v-deep .compass {
  position: absolute;
  top: 15px;
}

::v-deep .navigation-controls {
  position: absolute;
  top: 120px;
}
</style>
