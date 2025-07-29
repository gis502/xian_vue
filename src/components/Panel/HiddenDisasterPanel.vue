<!-- 左键实体显示内容 -->
<template>
  <div
      class="cesium-info-window"
      :style="styleObject"
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
<!--        <button @click="emit('removeBaseInfoBox')" class="close-btn">-->
<!--          关闭-->
<!--        </button>-->
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
        :options="options"
      ></Hazards>
    </div>
  </div>
</template>

<script setup name="BaseInfo">
import { computed, onMounted, ref } from "vue";
import DebrisFlow from "@/components/Earthquake/DebrisFlow.vue";
import Landslide from "@/components/Earthquake/Landslide.vue";
import RiskPoints from "@/components/Earthquake/RiskPoints.vue";
import Hazards from "@/components/Earthquake/Hazards.vue";
import { staticHazardsDatas } from "@/api/earthquake/datas";
import {getHazardOptions} from "@/api/earthquake/hazards.js";

const emit = defineEmits(["removeBaseInfoBox"]);
const props = defineProps({
  title: String,
  position: Object,
  showDisasterInformation: Boolean,
  disasterInformation: Object,
  showdebrisFlowInformation: Boolean,
  debrisFlowInformation: Object,
  showRiskPointsInformation: Boolean,
  riskPointsInformation: Object,
});
// 获取致灾因子下拉列表选项


let options = ref([]);
getHazardOptions().then((res) => {
  options.value = res;
});


const positionEntity = ref({ x: 0, y: 0 });

watch(() => props.position.x, (newX) => {
  positionEntity.value.x = newX;
  // console.log(props.position,"props.position")
});

watch(() => props.position.y, (newY) => {
  positionEntity.value.y = newY;
});

const styleObject = computed(() => ({
  position: 'absolute',
  left: `${positionEntity.value.x}px`,
  top: `${positionEntity.value.y}px`,
}));


const displayDisasterCausingFactors = ref(false);

const hazards = computed(() => {
  if (props.showDisasterInformation) {
    props.disasterInformation.factorVoList.forEach((element) => {
      element.type = element.unit == "" ? "select" : "input:number";
      element.isModified = true;
      element.isShow = true;

      // 隐藏降雨量
      if(element.attributeNameAlias	== 'rainfall') {
        element.isShow = false;
      }
    });
    return props.disasterInformation;
  } else if (props.showdebrisFlowInformation) {
    props.debrisFlowInformation.factorVoList = staticHazardsDatas;
    return props.debrisFlowInformation;
  } else if (props.showRiskPointsInformation) {
    props.riskPointsInformation.factorVoList = staticHazardsDatas;
    return props.riskPointsInformation;
  }
});

function displayComponents() {
  displayDisasterCausingFactors.value = !displayDisasterCausingFactors.value;
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
  font-weight: normal;
  background: none;
  border: none;
  padding: 5px 10px;
  cursor: pointer;
  font-size: 14px; /* 减小标题字体大小 */
  color: #6c757d;
  transition: color 0.2s;
}
</style>
