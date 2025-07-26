<!-- 左键实体显示内容 -->
<template>
  <div
    class="cesium-info-window"
    :style="{
      top: position.top + 'px',
      left: position.left + 'px',
    }"
    ref="cesiumInfoWindow"
  >
    <div class="disaster-popup">
      <div class="popup-header">
        <h3>{{ title }}</h3>
        <el-button
          type="info"
          v-text="
            displayDisasterCausingFactors ? '显示基本信息' : '显示致灾因子'
          "
          @click="displayComponents"
        ></el-button>
        <button @click="emit('removeBaseInfoBox')" class="close-btn">
          关闭
        </button>
      </div>

      <!-- 滑坡信息 -->
      <Landslide
        v-if="!displayDisasterCausingFactors && showDisasterInformation"
        :info="disasterInformation"
      ></Landslide>

      <!-- 泥石流 -->
      <DebrisFlow
        v-if="!displayDisasterCausingFactors && showdebrisFlowInformation"
        :info="debrisFlowInformation"
      ></DebrisFlow>

      <!-- 风险点 -->
      <RiskPoints
        v-if="!displayDisasterCausingFactors && showRiskPointsInformation"
        :info="riskPointsInformation"
      ></RiskPoints>

      <!-- 致灾因子信息 -->
      <Hazards
        v-if="displayDisasterCausingFactors"
        :hazardsDatas="hazards"
      ></Hazards>
    </div>
  </div>
</template>

<script setup name="BaseInfo">
import { computed, onMounted, ref } from "vue";
import DebrisFlow from "./DebrisFlow.vue";
import Landslide from "./Landslide.vue";
import RiskPoints from "./RiskPoints.vue";
import Hazards from "./Hazards.vue";
const emit = defineEmits(["removeBaseInfoBox"]);

const parentDatas = defineProps([
  "title",
  "position",
  "showDisasterInformation",
  "disasterInformation",
  "showdebrisFlowInformation",
  "debrisFlowInformation",
  "showRiskPointsInformation",
  "riskPointsInformation",
]);

// 是否显示致灾因子
const displayDisasterCausingFactors = ref(false);

// 致灾因子数据
let hazards = computed(() => {
  // 设置滑坡数据致灾因子数据
  if (parentDatas.showDisasterInformation) {
    parentDatas.disasterInformation.factorVoList.forEach((element) => {
      element.type = element.unit == "" ? "select" : "input:number";
      element.isModified = true;
    });
    return parentDatas.disasterInformation;
  }
  // 设置泥石流
  else if (parentDatas.showdebrisFlowInformation) {
    parentDatas.debrisFlowInformation.factorVoList = staticHazardsDatas;
    return parentDatas.debrisFlowInformation;
  }
  // 风险点
  else if (parentDatas.showRiskPointsInformation) {
    parentDatas.riskPointsInformation.factorVoList = staticHazardsDatas;
    return parentDatas.riskPointsInformation;
  }
});

// 监控dom
const cesiumInfoWindow = ref();

onMounted(() => {
  window.addEventListener("resize", resetWindowPosition());
});

// 显示组件
function displayComponents() {
  displayDisasterCausingFactors.value = !displayDisasterCausingFactors.value;
}

// 重新设置弹窗位置
function resetWindowPosition() {
  // 获取视口宽高
  const { viewWidth, viewHeight } = getViewportSize();

  // 获取元素宽高
  const { elementWidth, elementHeight } = getElementSize(
    cesiumInfoWindow.value
  );

  // 获取元素位置
  const { left: elementLeft, top: elementTop } = parentDatas.position;

  // 判断元素宽高是不是超过视口
  if (elementWidth > viewWidth) {
    cesiumInfoWindow.value.style.width = viewWidth + "px";
    parentDatas.position.left = 0;
  }
  if (elementHeight > viewHeight) {
    cesiumInfoWindow.value.style.height = viewHeight + "px";
    parentDatas.position.top = 0;
  }

  // 判断下右是否超出视口
  if (elementLeft + elementWidth > viewWidth) {
    parentDatas.position.left = viewWidth - elementWidth - 10;
  }
  if (elementTop + elementHeight > viewHeight) {
    parentDatas.position.top = viewHeight - elementHeight - 10;
  }
}

// 获取视口宽高
function getViewportSize() {
  return {
    viewWidth: window.innerWidth,
    viewHeight: window.innerHeight,
  };
}

// 获取元素宽高
function getElementSize(element) {
  return {
    elementWidth: element.offsetWidth,
    elementHeight: element.offsetHeight,
  };
}
</script>

<style>
.cesium-info-window {
  position: fixed;
  background: white;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  padding: 0px;
  z-index: 1000;
  max-height: 450px;
  overflow: auto;
}
.disaster-popup {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 0px;
  border-radius: 6px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1); /* 减小阴影 */
}

.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #f8f9fa;
  padding: 2px 15px;
  border-bottom: 1px solid #e9ecef;
}
.popup-header h3 {
  font-size: 14px;
  font-weight: bold;
  font-family: "Source Han Sans CN";
}
.disaster-info-table {
  width: 100%;
  border-collapse: collapse;
}
.disaster-info-table th,
.disaster-info-table td {
  padding: 8px;
  border-top: 1px solid #ddd; /* 保留上边框 */
  border-bottom: 1px solid #ddd; /* 保留底边框 */
  border-left: none; /* 去除左边框 */
  border-right: none; /* 去除右边框 */
  text-align: left;
  font-family: "Source Han Sans CN";
  font-size: 13px;
}
.disaster-info-table .label {
  color: #333;
  width: 30%;
  font-size: 13px;
}
.close-btn {
  font-weight: nom;
  background: none;
  border: none;
  padding: 5px 10px;
  cursor: pointer;
  font-size: 14px; /* 减小标题字体大小 */
  color: #6c757d;
  transition: color 0.2s;
}
</style>
