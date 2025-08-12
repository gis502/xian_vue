<template>
  <div class="rain-info-panel" :style="styleObject">
    <div class="panel-title">暴雨信息</div>
    <div class="panel-content">
      <!-- 一次性展示所有区县 -->
      <div
          v-for="(entry, index) in entries"
          :key="entry.code"
          class="form-item"
          :class="{ 'red-highlight': entry.rainfall > 30 }">
        <!--        <label class="form-label district-label">区县:</label>-->
        <span class="district-name">{{ entry.name }}</span>
        <label :for="'rainfall-' + index" class="form-label rain-label">降雨量:</label>
        <input style="margin-right: 10px;" v-model.number="entry.rainfall" type="number" min="0" max="500" step="1" :id="'rainfall-' + index"/>
        <span style="margin-right: 20px;">毫米</span>
        <label style="margin-right: 10px" :for="'duration-' + index" class="form-label duration-label">持续时间:</label>
        <input v-model.number="entry.duration" type="number" min="0" max="72" step="1" :id="'duration-' + index"/>
        <span style="margin-left: 5px ;margin-right: 5px;">小时</span>
      </div>

      <div class="button-group">
        <button @click="confirmRainPoint"
            :disabled="entries.length === 0 || entries.every((entry) => !entry.rainfall || !entry.duration)" style="width: 80px">确认添加</button>
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
    // PanelPosition: {
    //   type: Object,
    //   required: true
    // },
  },
  data() {
    return {
      positionEntity: {x: 580, y: 20},
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
      entries: [], // 初始化改为空数组
      adminArea: '',//标记点所属区域
      positionArry: [],
      rainfallArry: [],
      durationArry: [],
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
    // PanelPosition: {
    //   immediate: true,
    //   handler(newVal) {
    //     if (newVal) {
    //       this.positionEntity = newVal
    //     }
    //   }
    // }
  },
  computed: {
    styleObject() {
      return {
        position: "absolute", // 修复原拼写错误
        left: `${this.positionEntity.x}px`,
        top: `${this.positionEntity.y}px`
      };
    }
  },
  created() {
    // 初始化所有区县
    this.entries = this.districts.map(district => ({
      name: district.name,
      code: district.code,
      rainfall: 0,
      duration: 0
    }));
  },
  methods: {
    updateEntryDistrict(position) {
      this.adminArea = layers.getAdministrationByPoint(position.longitude, position.latitude);
      const district = this.districts.find((d) => d.name === this.adminArea?.name);
      if (district) {
        const index = this.entries.findIndex(item => item.code === district.code);
        if (index > -1) {
          this.entries[index].name = district.name;
        }
      }
    },
    async confirmRainPoint() {
      console.log("确认添加数据：", this.entries);
      this.$emit('update:update-rain-info', this.entries);
      if (!this.selectedPositionLonAndLat) return;
      let {longitude, latitude} = this.selectedPositionLonAndLat;

      this.$emit('update:handleWeather');

      // 过滤并收集有效数据（降雨量>0的才存储）
      this.positionArry = [];
      this.rainfallArry = [];
      this.durationArry = [];
      this.entries.forEach(item => {
        if (item.rainfall > 0) { // 降雨量为0不存入数组
          this.positionArry.push(item.name);
          this.rainfallArry.push(item.rainfall);
          this.durationArry.push(item.duration);
        }
      });

      let requestData = {
        "rainfall": this.rainfallArry.join(","),
        "duration": this.durationArry.join(","),
        "longitude": longitude,
        "latitude": latitude,
        "position": this.positionArry.join(","),
        "disasterName": timeTransfer.timestampToTimeChina(new Date) + this.adminArea + "暴雨",
        "occurrenceTime": timeTransfer.timestampToTimeWithT(new Date),
      };
      console.log(requestData, "requestData saveRain")
      let res = await saveRain(requestData);
      console.log(res, "saveRain")

      if (this.adminArea) {
        let entity = {
          position: this.adminArea.name,
          longitude: longitude,
          latitude: latitude,
          id: "test_rain",
          trigger: "暴雨",
          rainfall: this.rainfallArry[0] || 0,
          duration: this.durationArry[0] || 0,
          occurrenceTime: new Date(),
          disasterName: timeTransfer.timestampToTimeChina(new Date()) + "西安市暴雨"
        }
        basicLayers.addCenterPoint(entity)
        this.$emit('update:loading-model', true);
        await this.processAllDistricts();
        this.$emit('update:loading-model', false);
        this.$emit('update:show-info-panel', false);
      } else {
        console.log("未找到标记点所在的行政区划");
      }
    },
    async processAllDistricts() {
      let allMatchedHuapoData = [];
      let allPointSet = new Set();
      for (let i = 0; i < this.positionArry.length; i++) {
        const adminCoordinates = layers.getAdminCoordinatesByName(this.positionArry[i]);
        let allPointsInside = layers.findAllHiddenDisasterPointsInAffectedArea(adminCoordinates);
        let {matchedHuapoData, pointSet} = this.getHiddenDisasterPointswithCausingFactors(
            allPointsInside,
            i,
            this.rainfallArry
        );
        allMatchedHuapoData.push(...matchedHuapoData);
        Array.from(pointSet).forEach(key => allPointSet.add(key));
      }
      console.log("所有区县汇总数据：", allMatchedHuapoData, allPointSet);
      let matchedHuapoEntities = await this.caculateRainSlideTrigger(allMatchedHuapoData, allPointSet);
      this.$emit('update:matched-huapo-entities', matchedHuapoEntities);
      this.matchedHiddenHighlightEntities = matchedHuapoEntities;
      console.log(matchedHuapoEntities, "matchedHuapoEntities这是匹配的所有点")
      layers.flashHiddenDisasterPoints(matchedHuapoEntities);
    },
    cancelRainPoint() {
      this.$emit('update:show-info-panel', false);
      // 重置所有输入值
      this.entries.forEach(entry => {
        entry.rainfall = 0;
        entry.duration = 0;
      });
    },
    getHiddenDisasterPointswithCausingFactors(landslidePointsInside, index, rainfallArry) {
      console.log(landslidePointsInside, "getHiddenDisasterPointswithCausingFactors")
      let matchedHuapoData = [];
      let pointSet = new Set();
      if (landslidePointsInside.length > 0) {
        landslidePointsInside.forEach(point => {
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
          }
        });

        console.log(matchedHuapoData, pointSet, "matchedHuapoData,pointSet")
        matchedHuapoData.forEach(huapoItem => {
          if (Array.isArray(huapoItem.factorVoList)) {
            huapoItem.factorVoList.forEach(factor => {
              if (factor.attributeName === "降雨量") {
                factor.factorValue = rainfallArry[index];
              }
            });
          }
        });
      }
      return {matchedHuapoData, pointSet};
    },
    async caculateRainSlideTrigger(matchedHuapoData, pointSet) {
      console.log(matchedHuapoData, "汇总后的matchedHuapoData")
      let requestData = {
        data: []
      };
      matchedHuapoData.forEach(item => {
        let entityId = '';
        if (item.geologicalDisasterHideDTO.disasterType === "风险区域") {
          entityId = "风险区域" + item.geologicalDisasterHideDTO.unitCode;
        } else if (item.geologicalDisasterHideDTO.disasterType === "滑坡") {
          entityId = "滑坡隐患点" + item.geologicalDisasterHideDTO.id;
        } else if (item.geologicalDisasterHideDTO.disasterType === "泥石流"){
          entityId = "泥石流隐患点" + item.geologicalDisasterHideDTO.id;
        } else if (item.geologicalDisasterHideDTO.disasterType === "内涝"){
          entityId = "内涝隐患点" + item.geologicalDisasterHideDTO.id;
        } else if (item.geologicalDisasterHideDTO.disasterType === "山洪"){
          entityId = "山洪隐患点" + item.geologicalDisasterHideDTO.id;
        }

        let factors = Array.isArray(item.factorVoList) ? item.factorVoList : item.factorVoList ? [item.factorVoList] : [];
        let itemFormat = {
          entityId: entityId,
          probability: [],
          level: [],
          disaster: [],
          disasterType: item.geologicalDisasterHideDTO.disasterType,
          factors: factors,
          lon: item.geologicalDisasterHideDTO.lon,
          lat: item.geologicalDisasterHideDTO.lat,
          geologicalDisasterHideDTO: item.geologicalDisasterHideDTO,
        };

        requestData.data.push(itemFormat);
      });
      console.log("一次性发送的请求数据：", requestData);
      try {
        let matchedHuapoEntities = [];
        const res = await rainSlideTrigger(requestData);
        console.log(res.data, "rainSlideTrigger返回结果")
        let formatAnalyzedData = res.data || [];

        formatAnalyzedData.forEach(item => {
          matchedHuapoEntities.push(item);
        });

        return matchedHuapoEntities;
      } catch (error) {
        console.error("Error in rainSlideTrigger:", error);
        return [];
      }
    },
  },
}
</script>

<style scoped>
.rain-info-panel {
  position: absolute;
  background-color: rgba(40, 40, 40, 0.8);
  color: white;
  padding: 0;
  border-radius: 6px;
  width: auto;
  max-height: 80vh;
  overflow-y: auto;
  z-index: 100;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

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

/* 标红样式增强 */
.red-highlight {
  color: red !important;
}

.red-highlight input {
  color: red !important;
  border: 1px solid red !important;
}

.form-label {
  font-weight: 500;
  flex-shrink: 0;
  display: inline-block;
  margin-right: 2px;
  margin-left: 10px;
  white-space: nowrap;
}

.district-label {
  width: 37px;
}

.district-name {
  margin: 0 10px;
  min-width: 50px;
  display: inline-block;
}

.rain-label {
  width: 80px;
}

.duration-label {
  width: 70px;
}

.panel-content input {
  width: 60px;
  padding: 6px 8px;
  border: none;
  border-radius: 4px;
  text-align: center;
  background-color: rgba(255, 255, 255, 0.2);
  color: white;
  height: 25px;
  box-sizing: border-box;
  margin-left: 5px;
}

.panel-content select {
  height: 25px;
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
  justify-content: center;
  padding: 10px;
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
