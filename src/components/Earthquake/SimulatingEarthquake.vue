<!-- 模拟地震 -->
<template>
  <!-- 收集内容 -->
  <div
    class="earthquake-info-panel"
    :style="{
      top: position.y + 'px',
      left: position.x + 'px',
    }"
  >
    <div class="panel-title">地震信息</div>
    <div class="panel-content">
      <div>
        震级:
        <input
          v-model.number="form.magnitude"
          type="number"
          min="0"
          max="10"
          step="0.1"
        />
        ms
      </div>
      <div>震中位置:</div>
      <div>
        {{
          position
            ? `北纬:${position.latitude.toFixed(
                4
              )}, 东经:${position.longitude.toFixed(4)}`
            : ""
        }}
      </div>
      <el-row type="flex" :gutter="36">
        <el-col :span="24">
          <button @click="confirmEarthquake">确认添加</button>
          <button @click="emit('cancelEarthquake')">取消</button>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup name="SimulatingEarthquake">
import { reactive } from "vue";
import { useSimulationPointStore } from "../../store/earthquake/simulation_points";
import { obtainTheProbabilityOfSimulatedPointRisk } from "../../api/earthquake/hazards";
import layers from "../../cesium/layers";
import { pulseUtils } from "../../cesium/pulse";

let form = reactive({
  magnitude: 6,
});

// 获取位置以及表格中要呈现的内容
const { position, dataTypes } = defineProps(["position", "dataTypes"]);
const emit = defineEmits(["cancelEarthquake", "displayTable"]);
// 添加模拟
async function confirmEarthquake() {
  layers.DrawEllipse(position.longitude, position.latitude, form.magnitude);
  emit("cancelEarthquake");

  // 显示表格
  emit("displayTable");

  // 处理各个模拟点
  let inEllipsePoints = [];
  useSimulationPointStore().simulationPoints.forEach((item) => {
    // 将模拟点的预测值全部清空，重新获取
    item.predict = null;

    // 判断在不在震圈内
    if (
      layers.isPointInEllipse([
        item.geologicalDisasterHideDTO.lon,
        item.geologicalDisasterHideDTO.lat,
      ])
    ) {
      inEllipsePoints.push(item);
    }
  });

  // 获取各个点的风险概率
  const [points, probabilityPoints] =
    await obtainTheProbabilityOfSimulatedPointRisk(inEllipsePoints);

  // 清除全部脉冲实体
  pulseUtils.removePulseEntity(useSimulationPointStore(), window.viewer);

  // 添加脉冲实体
  pulseUtils.createPause(points, useSimulationPointStore(), window.viewer);

  // 处理表格数据
  addDatasToTable(probabilityPoints);
}

// 处理表格数据
function addDatasToTable(probabilityPoints) {
  // 清空表格数据
  dataTypes.type1.data = [];
  dataTypes.type2.data = [];
  dataTypes.type3.data = [];

  // 风险区数据，滑坡数据，泥石流数据
  probabilityPoints.forEach((item) => {
    switch (item.geologicalDisasterHideDTO.disasterType) {
      case "滑坡":
        dataTypes.type2.data.push({
          field1: item.geologicalDisasterHideDTO.disasterName,
          field2: item.geologicalDisasterHideDTO.position,
          field3: item.geologicalDisasterHideDTO.scaleGrade,
          field4: item.geologicalDisasterHideDTO.riskGrade,
          field5: item.geologicalDisasterHideDTO.lon,
          field6: item.geologicalDisasterHideDTO.lat,
        });
        break;
      case "泥石流":
        dataTypes.type3.data.push({
          field1: item.geologicalDisasterHideDTO.disasterName,
          field2: item.geologicalDisasterHideDTO.position,
          field3: item.geologicalDisasterHideDTO.scaleGrade,
          field4: item.geologicalDisasterHideDTO.riskGrade,
          field5: item.geologicalDisasterHideDTO.lon,
          field6: item.geologicalDisasterHideDTO.lat,
        });
        break;
      default:
        dataTypes.type1.data.push({
          field1: item.geologicalDisasterHideDTO.disasterName,
          field2: item.geologicalDisasterHideDTO.position,
          field3: item.geologicalDisasterHideDTO.inspectorName,
          field4: item.geologicalDisasterHideDTO.inspectorTele,
          field5: item.geologicalDisasterHideDTO.lon,
          field6: item.geologicalDisasterHideDTO.lat,
        });
    }
  });
}
</script>

<style scoped>
.earthquake-info-panel {
  position: absolute;
  background-color: rgba(40, 40, 40, 0.9);
  color: white;
  padding: 15px;
  border-radius: 4px;
  z-index: 1000;
  width: 250px;
}

.earthquake-info-panel input {
  width: 60px;
  margin-left: 10px;
  padding: 5px;
  background-color: rgba(255, 255, 255, 0.1);
  border: 1px solid #666;
  color: white;
}

.earthquake-info-panel button {
  margin-top: 10px;
  margin-right: 30px;
  padding: 8px 15px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.earthquake-info-panel button:first-child {
  background-color: #386641;
  color: white;
  width: 100%;
}

.earthquake-info-panel button:last-child {
  background-color: #bc4749;
  color: white;
  width: 100%;
}
</style>
