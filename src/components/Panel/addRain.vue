<template>
  <div class="rain-info-panel" :style="styleObject">
    <div class="panel-title">暴雨信息</div>
    <div class="panel-content">
      <div v-for="(entry, index) in entries" :key="entry.code" class="form-item">
        <label :for="'district-' + index" class="form-label district-label">区县:</label>
        <select
            v-model="entry.name"
            :id="'district-' + index"
            @change="handleDistrictChange(index)"
        >
          <option value="">请选择区县</option>
          <option v-for="district in availableDistricts" :key="district.code" :value="district.name">
            {{ district.name }}
          </option>
        </select>
        <label :for="'rainfall-' + index" class="form-label rain-label">降雨量:</label>
        <input
            v-model.number="entry.rainfall"
            type="number"
            min="0"
            max="500"
            step="1"
            :id="'rainfall-' + index"
        />
        <span>毫米</span>
        <label :for="'duration-' + index" class="form-label duration-label">持续时间:</label>
        <input
            v-model.number="entry.duration"
            type="number"
            min="0"
            max="72"
            step="1"
            :id="'duration-' + index"
        />
        <span>小时</span>
        <button v-if="index > 0" @click="removeEntry(index)" style="width: 80px; margin-left: 10px">删除</button>
      </div>
      <button @click="addEntry" style="width: 80px; margin-top: 10px">增加</button>
      <div class="button-group">
        <button
            @click="confirmRainPoint"
            :disabled="entries.length === 0 || entries.every((entry) => !entry.rainfall || !entry.duration)"
            style="width: 80px"
        >
          确认添加
        </button>
        <button @click="cancelRainPoint" style="width: 80px">取消</button>
      </div>
    </div>
  </div>
</template>

<script>

import layers from "@/cesium/layers.js";
import timeTransfer from "@/cesium/timeTransfer.js";
import {rainSlideTrigger, saveRain} from "@/api/system/rainModel.js";
import basicLayers from "@/cesium/basicLayers.js";
import * as Cesium from 'cesium';
import {useSimulationPointStore} from "@/store/earthquake/simulation_points.js";

export default {
  name: "addRain",
  props: {
    selectedPositionLonAndLat: {
      type: Object,
      required: true
    },
    PanelPosition: {
      type: Object,
      required: true
    },
  },
  data() {
    return {
      positionEntity: {x: 0, y: 0},
      districts: [
        {name: "新城区", code: "610102"},
        {name: "碑林区", code: "610103"},
        {name: "莲湖区", code: "610104"},
        {name: "雁塔区", code: "610113"},
        {name: "灞桥区", code: "610111"},
        {name: "未央区", code: "610112"},
        {name: "阎良区", code: "610114"},
        {name: "临潼区", code: "610115"},
        {name: "长安区", code: "610116"},
        {name: "高陵区", code: "610117"},
        {name: "鄠邑区", code: "610118"},
        {name: "蓝田县", code: "610122"},
        {name: "周至县", code: "610124"}
      ],
      entries: [
        {
          name: "",
          rainfall: 0, // 初始值为 0
          duration: 0  // 初始值为 0
        }
      ],
      adminArea:'',//标记点所属区域
      positionArry:[],
      rainfallArry:[],
      durationArry:[],
    };
  },
  watch: {
    selectedPositionLonAndLat: {
      immediate: true,
      handler(newVal) {
        if (newVal) {
          this.updateEntryDistrict(newVal);
        }
      }
    },
    PanelPosition:{
      immediate: true,
      handler(newVal) {
        if (newVal) {
          this.positionEntity = newVal
        }
      }
    }
  },
  computed: {
    availableDistricts() {
      const selectedCodes = this.entries.map((entry) => entry.code).filter((code) => code !== null);
      return this.districts.filter((district) => !selectedCodes.includes(district.code));
    },
    styleObject() {
      return {
        positionEntity: "absolute",
        left: `${this.positionEntity.x}px`,
        top: `${this.positionEntity.y}px`
      };
    }
  },
  methods: {
    updateEntryDistrict(position) {
      this.adminArea = layers.getAdministrationByPoint(position.longitude, position.latitude);
      const district = this.districts.find((d) => d.name === this.adminArea.name);
      if (district && this.entries.length > 0) {
        this.entries[0].name = district.name;
      }
    },
    handleDistrictChange(index) {
      const selectedDistrict = this.districts.find((district) => district.name === this.entries[index].name);
      if (selectedDistrict) {
        if (this.entries.some((entry, i) => entry.name === selectedDistrict.name && i !== index)) {
          alert("该区县已经填写过，请选择其他区县");
          this.entries[index].name = "";
        } else {
          this.entries[index].name = selectedDistrict.name;
        }
      } else {
        this.entries[index].name = "";
      }
    },
    addEntry() {
      this.entries.push({
        name: "",
        rainfall: 0,
        duration: 0
      });
    },
    removeEntry(index) {
      console.log(index,this.entries)
      this.entries.splice(index, 1);
      console.log(this.entries)
    },
    async confirmRainPoint() {
      console.log("确认添加数据：", this.entries);
      this.$emit('update:update-rain-info', this.entries);
      if (!this.selectedPositionLonAndLat) return;
      let {longitude, latitude, cartesian} = this.selectedPositionLonAndLat;

      this.$emit('update:show-info-panel', false);

      // 标记后自动开启下雨效果
      // 触发事件，传递状态给父组件
      this.$emit('update:handleWeather');

      // 新增逻辑：获取标记点所在行政区划 标记点的位置

      this.entries.forEach(item => {
        this.positionArry.push(item.name)
        this.rainfallArry.push(item.rainfall)
        this.durationArry.push(item.duration)
      })

      let requestData = {
        "rainfall": this.rainfallArry.join(","), // 将数组转换为逗号分隔的字符串
        "duration": this.durationArry.join(","),
        "longitude": longitude,
        "latitude": latitude,
        "position": this.positionArry.join(","),
        "disasterName": timeTransfer.timestampToTimeChina(new Date) + this.adminArea + "暴雨",
        "occurrenceTime": timeTransfer.timestampToTimeWithT(new Date),
      };
      console.log(requestData, "requestData saveRain")
      let res =await saveRain(requestData)
      console.log(res, "saveRain")
      if (this.adminArea) {
        const matchedIndex =this.positionArry.findIndex((pos) => pos === this.adminArea.name);
        //显示标记点
        let entity = {
          position: this.adminArea.name,
          longitude: longitude,
          latitude: latitude,
          id: "test_rain",
          trigger: "暴雨",
          rainfall: this.rainfallArry[matchedIndex], // 使用匹配的索引获取降雨量
          duration: this.durationArry[matchedIndex], // 使用匹配的索引获取持续时间
          occurrenceTime: new Date(),
          disasterName: timeTransfer.timestampToTimeChina(new Date())+"西安市暴雨"
        }
        basicLayers.addCenterPoint(entity)


        this.$emit('update:loading-model', true);
        // console.log(adminCoordinates, "adminCoordinates")
        for (let i=0;i<this.positionArry.length;i++){
          this.DisasterPointsFlash(i,this.positionArry,this.rainfallArry);
        }
      }
      else {
        console.log("未找到标记点所在的行政区划");
      }
    },
    cancelRainPoint() {
      this.$emit('update:show-info-panel', false);
      this.entries = [
        {
          code: null,
          name: "",
          rainfall: 0,
          duration: 0
        }
      ];
      // 触发事件，传递状态给父组件
      // this.$emit('update:weather-active', false);
      // this.$emit('update:rain-mode', true);
    },
    async DisasterPointsFlash(i,positionArry,rainfallArry) {
      const adminCoordinates = layers.getAdminCoordinatesByName(positionArry[i]);
      let allPointsInside = layers.findAllHiddenDisasterPointsInAffectedArea(adminCoordinates);
      console.log(allPointsInside, "allPointsInside")
      let {matchedHuapoData, pointSet} = this.getHiddenDisasterPointswithCausingFactors(allPointsInside,i,rainfallArry); // 使用 await
      console.log(matchedHuapoData, pointSet, "matchedHuapoData,pointSet");
      // let matchedHuapoEntities = await this.caculateRainSlideTrigger(matchedHuapoData, pointSet); // 使用 await
      // this.$emit('update:matched-huapo-entities', matchedHuapoEntities);
      // this.matchedHiddenHighlightEntities = matchedHuapoEntities;
      // layers.flashHiddenDisasterPoints(matchedHuapoEntities);
      this.$emit('update:loading-model', false);
    },
    getHiddenDisasterPointswithCausingFactors(landslidePointsInside,index,rainfallArry) {
      console.log(landslidePointsInside, "getHiddenDisasterPointswithCausingFactors")
      let matchedHuapoData = [];
      let pointSet = new Set();
      if (landslidePointsInside.length > 0) {
        // 创建经纬度字符串集合用于快速匹配
        landslidePointsInside.forEach(point => {
          // 使用固定精度的字符串表示经纬度
          let lon = point[0];
          let lat = point[1];
          pointSet.add(`${lon},${lat}`);
        });
        useSimulationPointStore().simulationPoints.forEach((item) => {
          let lon = item.geologicalDisasterHideDTO.lon;
          let lat = item.geologicalDisasterHideDTO.lat;
          let key = `${lon},${lat}`;
          if (pointSet.has(key)) {
            matchedHuapoData.push(item);
            factorVoList
            console.log(item,"useSimulationPointStore")
            // item.
          }
        });

        console.log(matchedHuapoData, pointSet, "matchedHuapoData,pointSet")
        // 降雨量值放到致灾因子里面去
        for (var i = 0; i < matchedHuapoData.length; i++) {
          if (matchedHuapoData[i]) {
            for (var j = 0; j < matchedHuapoData[i].length; j++) {
              if (matchedHuapoData[i][j] && matchedHuapoData[i][j].attributeName === "降雨量") {
                matchedHuapoData[i][j].factorValue =rainfallArry[index] ;
              }
            }
          }

        }
      }
      return {matchedHuapoData, pointSet}; // 返回一个对象
    },
    async caculateRainSlideTrigger(matchedHuapoData, pointSet) {
      // console.log(matchedHuapoData,"matchedHuapoData")
      let requestData = {
        data: []
      };

      matchedHuapoData.forEach(item => {
        let entityId = '';
        if (item.geologicalDisasterHideDTO.disasterType == "风险区域") {
          entityId = "风险区域" + item.geologicalDisasterHideDTO.unitCode;
        } else if (item.geologicalDisasterHideDTO.disasterType == "滑坡") {
          entityId = "滑坡隐患点" + item.geologicalDisasterHideDTO.id;
        } else {
          entityId = "泥石流隐患点" + item.geologicalDisasterHideDTO.id;
        }

        // 确保 factors 是一个数组
        let factors = Array.isArray(item.factorVoList) ? item.factorVoList : [item.factorVoList];

        let itemFormat = {
          entityId: entityId,
          probability: [],
          level: [],
          disaster: [],
          disasterType: item.geologicalDisasterHideDTO.disasterType, // 添加 disasterType 字段
          factors: factors // 确保 factors 是一个数组
        };

        requestData.data.push(itemFormat);
      });


      console.log(requestData, "requestData");

      try {
        let matchedHuapoEntities = []
        const res = await rainSlideTrigger(requestData);
        console.log(res, "rainSlideTrigger")
        let formatAnalyzedData = res.data;

        formatAnalyzedData.forEach(item => {
          let lon = item.geologicalDisasterHideDTO.lon;
          let lat = item.geologicalDisasterHideDTO.lat;
          let key = `${lon},${lat}`;
          if (pointSet.has(key)) {
            matchedHuapoEntities.push(item);
          }
        });

        return matchedHuapoEntities;
      } catch (error) {
        console.error("Error in rainSlideTrigger:", error);
        return []; // 返回空数组或其他默认值
      }
    },
  },
}
</script>

<style scoped>
.rain-info-panel {
  position: absolute;
  background-color: rgba(40, 40, 40, 0.8); /* 与图例背景色一致 */
  color: white;
  padding: 0;
  border-radius: 6px;
  width: auto;
  max-height: 80vh;
  overflow-y: auto;
  z-index: 100;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3); /* 添加阴影效果 */
}
/*top: 20vh;*/
/*left: 10px;*/
.panel-title {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 10px;
  padding-bottom: 8px;
  border-bottom: 1px solid #444;
  text-align: center;
}

.panel-content div {
  margin-bottom: 12px;
  display: flex;
  align-items: center;
}

.form-label {
  font-weight: 500;
  flex-shrink: 0;
  display: inline-block;
  margin-right: 2px; /* 移除label与右边元素之间的间隔 */
  margin-left: 10px; /* 移除label与右边元素之间的间隔 */

  white-space: nowrap; /* 防止文本换行 */
}

.district-label {
  width: 37px; /* 单独设置区县label的宽度 */
}

.rain-label {
  width: 80px; /* 单独设置降雨量label的宽度 */
}

.duration-label {
  width: 70px; /* 单独设置持续时间label的宽度 */
}

.panel-content input {

  width: 60px;
  padding: 6px 8px;
  border: none;
  border-radius: 4px;
  text-align: center;
  background-color: rgba(255, 255, 255, 0.2);
  color: white;
  height: 25px; /* 高度与输入框一致 */
  box-sizing: border-box;
  margin-left: 5px; /* label与输入框之间的间隔 */
}

.panel-content select {
  height: 25px; /* 高度与输入框一致 */
}

.panel-content span {
  width: auto;
  text-align: left;
  display: inline-block;
  height: 30px;
  line-height: 30px;
}

.button-group {
  display: flex;
  gap: 10px;
  margin-top: 10px;
}

.panel-content button {
  padding: 6px 12px;
  background-color: #386641;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
  height: 32px;
  line-height: normal;
}

.panel-content button:last-child {
  background-color: #bc4749;
}

.panel-content button:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}
</style>