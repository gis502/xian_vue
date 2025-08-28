<template>

  <div id="cesium-container">
    <!--历史灾害信息列表-->
    <HistoricalDisasterList
        :chartDatas="chartDatas"
        :disasterList="disasterList"
        @displayChart="displayChart"
        @hideChart="hideChart"
    ></HistoricalDisasterList>
    <!-- 图例 -->
    <Legend></Legend>
    <!-- chart -->
    <Chart v-if="showChart" :chartDatas="chartDatas"></Chart>
    <!-- 历史相似灾害匹配 -->
    <HistoricalDisasterMatch
        v-if="showChart"
        :disasterList="disasterList"
    ></HistoricalDisasterMatch>

  </div>

</template>

<script setup>
import * as Cesium from "cesium";
import { initCesium } from "@/cesium/initLayer.js";
import {onMounted, reactive, ref} from "vue";
import basicLayers from "@/cesium/basicLayers.js";
import HistoricalDisasterList from "@/components/HistoricalDisaster/HistoricalDisasterList.vue";
import Legend from "../../components/Earthquake/Legend.vue";
import Chart from "../../components/Earthquake/Chart.vue";
import HistoricalDisasterMatch from "@/components/HistoricalDisaster/HistoricalDisasterMatch.vue";

const showChart = ref(false);
const disasterList = ref([]);

console.log("disasterList",disasterList)
onMounted(async () => {
  window.viewer = initCesium("cesium-container");
  // 调整到指定位置
  window.viewer.cesiumWidget.creditContainer.style.display = "none";
  window.viewer.camera.setView({
    destination: Cesium.Cartesian3.fromDegrees(108.93, 34.27, 200000),
    orientation: {
      heading: Cesium.Math.toRadians(0),
      pitch: Cesium.Math.toRadians(-90),
      roll: 0.0,
    },
  });
  //加载西安行政区划
  basicLayers.loadAdminData();
});

// chart数据
const chartDatas = reactive({
  title: "历史地震影响分析",
  xAxis: {
    data: ["风险源", "医院"],
  },
  seriesDatas: [0, 0],
});

// 显示chart
function displayChart() {
  showChart.value = true;
}

// 隐藏chart
function hideChart() {
  showChart.value = false;
}

</script>

<style scoped lang="scss">

#cesium-container {
  width: 100%;
  height: calc(100vh - 50px);
  padding: 0;
  margin: 0;
  position: relative;
}
</style>