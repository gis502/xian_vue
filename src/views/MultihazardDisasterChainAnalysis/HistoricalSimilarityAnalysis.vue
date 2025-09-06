<template>

  <div
      id="cesium-container"
      v-loading="loading"
      element-loading-background="rgba(122, 122, 122, 0.8)">
    <!--历史灾害信息列表-->
    <HistoricalDisasterList
        :chartData="chartData"
        :disasterList="disasterList"
        @update:levelPoints="handleLevelPoints"
        @displayAnalysis="displayAnalysis"
        @hideAnalysis="hideAnalysis"
        @createPulseCircle="createPulseCircle"
        @loadingTrue="loadingTrue"
        @loadingFalse="loadingFalse"
    ></HistoricalDisasterList>
    <!-- 图例 -->
    <Legend></Legend>
    <!-- chart -->
    <Chart v-if="showAnalysis" :chartDatas="chartData"></Chart>
    <!-- 历史相似灾害匹配 -->
    <HistoricalDisasterMatch
        v-if="showAnalysis"
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


const showAnalysis = ref(false);
const disasterList = ref([]);
const rainLevelPoint = ref([]);
const loading = ref(false)
const maxRadius = 30;
const duration = 5;
const _circle = createCircleImage(maxRadius);
const handleLevelPoints = (data) => {
  rainLevelPoint.value = data;
  console.log('父组件接收的数据：', rainLevelPoint.value);
}

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
const chartData = reactive({
  title: "",
  xAxis: {
    data: [],
  },
  seriesData: [],
});

// 显示chart
function displayAnalysis() {
  showAnalysis.value = true;
}

// 隐藏chart
function hideAnalysis() {
  showAnalysis.value = false;
}

// 加载特效
function loadingTrue() {
  loading.value = true;
}

function loadingFalse() {
  loading.value = false;
}

//创建脉冲实体
function createPulseCircle() {
  const startTime = Cesium.JulianDate.now();
  rainLevelPoint.value.forEach(poin => {
    window.viewer.entities.add({
      position: Cesium.Cartesian3.fromDegrees(poin.lon, poin.lat),
      billboard: {
        image: _circle,
        width: new Cesium.CallbackProperty((time) => {
          const elapsed =
              Cesium.JulianDate.secondsDifference(time, startTime) % duration;
          const progress = elapsed / duration;
          return maxRadius * 2 * Math.abs(Math.sin(progress * Math.PI));
        }, false),
        height: new Cesium.CallbackProperty((time) => {
          const elapsed =
              Cesium.JulianDate.secondsDifference(time, startTime) % duration;
          const progress = elapsed / duration;
          return maxRadius * 2 * Math.abs(Math.sin(progress * Math.PI));
        }, false),
        color: new Cesium.CallbackProperty((time) => {
          const elapsed = Cesium.JulianDate.secondsDifference(time, startTime) % duration;
          const progress = elapsed / duration;
          // 透明度逻辑：与大小反向变化（大小最大时透明，最小时不透明）
          // Math.abs(Math.sin(progress * Math.PI)) → 0~1（大小系数）
          // 1 - 系数 → 透明度1~0（大小最大时透明度0.2，最小时0.8，避免完全透明消失）
          const alpha = 0.8 - 0.6 * Math.abs(Math.sin(progress * Math.PI));
          return new Cesium.Color(1, 0, 0, alpha); // 红色（RGB：1,0,0）+ 动态透明度
        }, false),
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
        verticalOrigin: Cesium.VerticalOrigin.CENTER,
        horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
      },
    });
  })
}

//创建脉冲图片
function createCircleImage(maxRadius) {
  // 创建一个虚拟的canvas
  const canvas = document.createElement('canvas');
  canvas.width = maxRadius * 2;
  canvas.height = maxRadius * 2;
  const context = canvas.getContext('2d');

  // 清空canvas，确保背景透明
  context.clearRect(0, 0, maxRadius, maxRadius);

  // 开始绘制圆
  context.beginPath();
  // 绘制圆，arc参数说明：x,y,半径,起始角度,结束角度,顺时针/逆时针
  // 绘制圆从canvas中心开始绘制，所以x,y坐标都为maxRadius
  // 半径为maxRadius
  context.arc(maxRadius, maxRadius, maxRadius, 0, Math.PI * 2, false);

  // 闭合路径
  context.closePath();

  // 填充颜色，透明
  context.fillStyle = 'rgba(255,255,255,0.7)';
  context.fill();
  return canvas.toDataURL('image/png');
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