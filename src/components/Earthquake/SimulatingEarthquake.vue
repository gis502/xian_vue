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

let form = reactive({
  magnitude: 6,
});

const { position } = defineProps(["position"]);
const emit = defineEmits(["cancelEarthquake"]);

// 添加模拟
function confirmEarthquake() {
  layers.DrawEllipse(position.longitude, position.latitude, form.magnitude);
  emit("cancelEarthquake");

  // 处理各个模拟点
  let inEllipsePoints = [];
  useSimulationPointStore().simulationPoints.forEach((item) => {
    // 将模拟点的预测值全部清空，重新获取
    item.predict = null;
    
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
  obtainTheProbabilityOfSimulatedPointRisk(inEllipsePoints);
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
