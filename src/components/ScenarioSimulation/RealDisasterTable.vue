<template>
  <div class="data-table">
    <button @click="toggleTableVisibility" class="toggle-table-btn">
      {{ isTableVisible ? "-" : "+" }}
    </button>
    <div class="table-title">灾害发生点</div>
    <div class="table-header" v-if="isTableVisible">
      <div class="search-box">
        <input
            type="text"
            v-model="searchQuery"
            placeholder="搜索表格数据..."
        />
        <button @click="performSearch">搜索</button>
      </div>
      <select v-model="selectedDataType" @change="changeDataType">
        <option
            v-for="filterCriteria in dataTypes.filterCriteria"
            :key="filterCriteria.value"
            :value="filterCriteria.value"
        >
          {{ filterCriteria.name }}
        </option>
      </select>
    </div>
    <table v-if="isTableVisible" style="table-layout: fixed; width: 100%">
      <thead>
      <tr>
        <th
            v-for="(header, index) in tableHeaders.slice(0, 4)"
            :key="index"
            :style="{ width: header.width }"
            style="text-align: center"
        >
          {{ header.name }}
        </th>
      </tr>
      </thead>
      <tbody>
      <tr
          v-for="(item, index) in paginatedTableData"
          :key="index"
          @click="handleTableClick(item)"
      >
        <template v-for="(header, headerIndex) in tableHeaders.slice(0, 4)">
          <td
              :style="{ width: header.width }"
              style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;"
              :title="item[header.key]"
          >
            {{ item[header.key] }}
          </td>
        </template>
      </tr>
      </tbody>
    </table>
    <div class="pagination-controls" v-if="isTableVisible">
      <button @click="prevPage" :disabled="currentPage === 1">上一页</button>
      <span>{{ currentPage }} / {{ totalPages }}</span>
      <button @click="nextPage" :disabled="currentPage === totalPages">
        下一页
      </button>
      <span class="total-items">共 {{ tableData.length }} 条</span>
    </div>
  </div>
</template>

<script setup name="Table">
import {ref, watch, computed, onMounted} from "vue";
import * as Cesium from "cesium";
import timeTransfer from "@/cesium/timeTransfer.js";
import {isEqual, throttle, debounce} from "lodash";
import layers from "@/cesium/layers.js";
import { onUnmounted } from 'vue'

const props = defineProps({
  dataTypes: {
    type: Object,
    required: true
  },
  currentTime: {
    type: [String, Object],
    required: true
  },
  nowShowPlot:{
    type: Object,
    required: true
  },
});

const tableData = ref([]);
const isTableVisible = ref(true);
const selectedDataType = ref("type1");
const allData = ref([]);
const tableHeaders = ref([]);
const searchQuery = ref("");

const currentPage = ref(1);
const pageSize = 3;
const lastTimeData=ref([])
// 过滤后的数据
const filteredTableData = ref([]);
// let selectedDataType= ref("type1");
// 总页数
const totalPages = computed(() =>
    Math.ceil(tableData.value.length / pageSize)
);

// 当前页的数据
const paginatedTableData = computed(() => {
  const start = (currentPage.value - 1) * pageSize;
  const end = start + pageSize;
  return tableData.value.slice(start, end);
});

function changeDataType() {
  const typeData = props.dataTypes[selectedDataType.value];
  // const typeData = props.dataTypes[lastTimeData.value];

  tableHeaders.value = typeData.headers;
  // console.log(lastTimeData,"lastTimeData changeDataType")
  // tableData.value = typeData.data;
  // 1. 先取交集
  let intersection =typeData.data.filter(td =>
      lastTimeData.value.some(ltd =>
          ltd.field1 === td.field1 &&
          ltd.field2 === td.field2 &&
          ltd.field3 === td.field3
      )
  );
  // 2. 再按时间倒序排序（越晚越靠前）
  intersection.sort((a, b) => {
    const timeA = timeTransfer.timeChinaToNewDate(a.field1);
    const timeB = timeTransfer.timeChinaToNewDate(b.field1);
    return timeB - timeA;   // 晚 - 早  =>  晚的在前
  });
  // console.log(intersection,"intersection")
  tableData.value = intersection;
  searchQuery.value = "";
  currentPage.value = 1;
  // currentPage.value = totalPages.value;
}

function nextPage() {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
  }
}

function prevPage() {
  if (currentPage.value > 1) {
    currentPage.value--;
  }
}

const toggleTableVisibility = () => {
  isTableVisible.value = !isTableVisible.value;
};

const performSearch = () => {
  currentPage.value = 1;
};

function timeSelect(){
  const currentTime = new Date(props.currentTime);
  // console.log(currentTime,"currentTime timeSelect")

  // console.log(allData.value,"allData")
  const newData = allData.value.filter(item => {
    const occurTime = timeTransfer.timeChinaToNewDate(item.field1);
    if (!occurTime || !currentTime) {
      // console.error(`Invalid date format for field2: ${item.field1}`);
      return false;
    }
    return occurTime <= currentTime;
  });
  // console.log(newData,currentTime,"newData")
  // 只有在数据实际发生变化时才更新 filteredTableData
  // 找出新添加或更新的数据
  // const changedData = newData.filter(item =>
  //     !lastTimeData.value.some(ldItem => (ldItem.field1 === item.field1)&&(ldItem.field2 === item.field2)&&(ldItem.field3 === item.field3))
  // );
  //

  let changedData = [];
  if (lastTimeData.value.length === 0) {
    lastTimeData.value = newData;
    changedData = newData;
    // console.log('No previous data, all new data is considered changed.');
  } else {
    changedData = newData.filter(item => {
      // console.log('Checking item:', item);
      const isMatch = lastTimeData.value.some(ldItem => {
        // console.log('Last Time Data item:', ldItem);
        return (ldItem.field1 === item.field1) && (ldItem.field2 === item.field2) && (ldItem.field3 === item.field3);
      });
      if (!isMatch) {
        // console.log('No match found for item:', item);
      }
      return !isMatch;
    });
    // 更新 lastTimeData.value
    lastTimeData.value = newData;
  }
// 在控制台中打印 changedData
//   console.log('Changed Data:', changedData);

  if (changedData.length > 0) {
    // 更新 lastTimeData.value，只添加新数据或更新变化的数据
    lastTimeData.value = newData
    // 获取变化数据的类型
    // const changedDataType = changedData[0].type;
    // console.log(changedDataType,"changedDataType")
    // // 如果变化的数据类型与当前显示的类型不同，则切换类型
    // if (changedDataType !== selectedDataType.value) {
    // selectedDataType.value = changedDataType;
    // console.log(selectedDataType.value,"selectedDataType.value")
    changeDataType();
    // }
  }
}

function handleTableClick(item) {
  const longitude = item.field5; // 获取经度
  const latitude = item.field6; // 获取纬度
  // console.log(item,longitude,latitude,"handleTableClick")
  // const cesiumViewer = this.cesiumViewer; // 假设你已经有一个 Cesium Viewer 实例
  // if (cesiumViewer) {
  window.viewer.scene.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(longitude, latitude, 2000),
    orientation: {
      heading: Cesium.Math.toRadians(0.0),
      pitch: Cesium.Math.toRadians(-90.0),
      roll: 0.0,
    },
    duration: 2, // 飞行动画持续时间（秒）
  });
  // }
}

onMounted(() => {
  changeDataType();
});
// 节流后的 updateTableData 函数
const throttledUpdateTableData = throttle(timeSelect, 1000);

const stopWatchNowShowPlot = watch(() => props.nowShowPlot, () => {
  // console.log(props.nowShowPlot,"props.nowShowPlot")
  let plotInfo=props.nowShowPlot
  if(plotInfo.plotType == "泥石流" ||plotInfo.plotType == "滑坡"||plotInfo.plotType == "地面沉降"||plotInfo.plotType == "崩塌"||plotInfo.plotType == "地面塌陷"){
    selectedDataType.value= "type1"
  }
  else if (plotInfo.plotType == "已出发队伍" || plotInfo.plotType == "正在参与队伍" || plotInfo.plotType == "待命队伍"|| plotInfo.plotType == "未搜索区域"|| plotInfo.plotType == "已搜索区域"|| plotInfo.plotType == "未营救区域"|| plotInfo.plotType == "已营救区域"|| plotInfo.plotType == "集结缓冲区"|| plotInfo.plotType == "正在营救区域"|| plotInfo.plotType == "攻击箭头"|| plotInfo.plotType == "钳击箭头"|| plotInfo.plotType == "直线箭头") {
    selectedDataType.value= "type2"
  }
  else if(plotInfo.plotType == "常备避险安置点" ||plotInfo.plotType == "救灾物资储备库" ||plotInfo.plotType == "临时避险安置点" ||plotInfo.plotType == "室外型避难场所" ||plotInfo.plotType == "室内型避难场所" ){
    selectedDataType.value= "type3"
  }
  else if (plotInfo.plotType == "失踪人员" || plotInfo.plotType == "轻伤人员" || plotInfo.plotType == "重伤人员" || plotInfo.plotType == "危重伤人员" || plotInfo.plotType == "死亡人员" || plotInfo.plotType === "被困人员") {
    selectedDataType.value= "type4"
  }
  else if(plotInfo.plotType == "中等破坏建筑物" ||plotInfo.plotType == "严重破坏建筑物" ||plotInfo.plotType == "毁坏或倒塌建筑物" ||plotInfo.plotType == "轻微破坏建筑物" ){
    selectedDataType.value= "type5"
  }
  else if(plotInfo.plotType == "不可通行公路" ||plotInfo.plotType == "公路破坏点" ||plotInfo.plotType == "交通管制点" ||plotInfo.plotType == "限制通行桥梁" ||plotInfo.plotType == "不可通行桥梁" ||plotInfo.plotType == "不可通行隧道" ||plotInfo.plotType == "限制通行公路" ||plotInfo.plotType == "不可通行铁路" ||plotInfo.plotType == "铁路破坏点" ||plotInfo.plotType == "可用机场" ||plotInfo.plotType == "不可用机场"){
    selectedDataType.value= "type6"
  }
  else if(plotInfo.plotType == "堰塞湖" ||plotInfo.plotType == "严重破坏堤防" ||plotInfo.plotType == "基本完好大坝" ||plotInfo.plotType == "中等破坏大坝" ||plotInfo.plotType == "严重破坏大坝" ||plotInfo.plotType == "基本完好堤防" ||plotInfo.plotType == "中等破坏堤防" ){
    selectedDataType.value= "type7"
  }
  else if(plotInfo.plotType == "不可用输、配电线路" ||plotInfo.plotType == "供水管线破坏点" ||plotInfo.plotType == "输、配电线路破坏点" ||plotInfo.plotType == "不可用输气管线" ||plotInfo.plotType == "不可用供水管网" ||plotInfo.plotType == "供气管线破坏点"){
    selectedDataType.value= "type8"
  }
  else if(plotInfo.plotType == "爆炸" ||plotInfo.plotType == "火灾" ||plotInfo.plotType == "有毒物质泄露" ||plotInfo.plotType == "核污染"){
    selectedDataType.value= "type9"
  }
  // console.log(changedDataType.value,"changedDataType.value  props.nowShowPlot")
  // // changedDataType.value
  // timeSelect();
  changeDataType();
});

// 监听 currentTime 的变化
const stopWatchCurrentTime =watch(() => props.currentTime, () => {
  throttledUpdateTableData();
});
// 监听 dataTypes 的变化
const stopWatchDataTypes =watch(() => props.dataTypes, (newDataTypes, oldDataTypes) => {
  // console.log(props.dataTypes,"props.dataTypes")
  if(newDataTypes){
    allData.value = [
      ...(newDataTypes.type1?.data || []),
      ...(newDataTypes.type2?.data || []),
      ...(newDataTypes.type3?.data || []),
      ...(newDataTypes.type4?.data || []),
      ...(newDataTypes.type5?.data || []),
      ...(newDataTypes.type6?.data || []),
      ...(newDataTypes.type7?.data || []),
      ...(newDataTypes.type8?.data || []),
      ...(newDataTypes.type9?.data || []),
    ];
    // console.log(allData.value,"allData.value")
    timeSelect();
  }
}, {deep: true});

// 组件卸载时清理所有 watch
onUnmounted(() => {
  // console.log('🧨 timeLinePlay 被销毁了');
  stopWatchNowShowPlot()
  stopWatchCurrentTime()
  stopWatchDataTypes()
  throttledUpdateTableData.cancel?.()
  // console.log('✅ 所有 watch 已清理')
})
</script>
<style scoped lang="scss">
.data-table {
  position: absolute;
  top: 56vh; /* 距离顶部20px */
  left: 20px; /* 距离左侧20px */
  background: rgba(14, 52, 98, 0.8);
  color: white;
  padding: 15px;
  border-radius: 2px;
  z-index: 1000;
  width: 550px; /* 限制表格宽度 */
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  font-size: 14px;
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
  font-size: 14px;
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
  flex-shrink: 0;
  color: white;
}
.data-table select option {
  background: rgba(15, 61, 118, 0.9);
  color: white;
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

