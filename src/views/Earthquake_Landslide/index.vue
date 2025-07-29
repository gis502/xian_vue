<template>
  <div
      id="cesium-container"
      ref="cesiumContainer"
      v-loading="loading"
      :element-loading-spinner="svg"
      element-loading-svg-view-box="-10, -10, 50, 50"
      element-loading-background="rgba(122, 122, 122, 0.8)"
  >
    <!-- 图例 -->
    <Legend></Legend>

    <!-- 表格 -->
    <Table v-if="showTable" :dataTypes="dataTypes"></Table>

    <!-- chart -->
    <Chart v-if="showChart" :chartDatas="chartDatas"></Chart>

    <!-- 点击弹窗 -->
    <BaseInfo
        v-if="showBaseInfo"
        :title="baseInfoTitle"
        :position="baseInfoPosition"
        :showDisasterInformation="showDisasterInformation"
        :disasterInformation="disasterInformation"
        :showdebrisFlowInformation="showdebrisFlowInformation"
        :debrisFlowInformation="debrisFlowInformation"
        :showRiskPointsInformation="showRiskPointsInformation"
        :riskPointsInformation="riskPointsInformation"
        :options="options"
        @removeBaseInfoBox="removeBaseInfoBox"
    />

    <!-- 地震模拟 -->
    <div class="btns-box">
      <el-button type="warning" @click="startEarthquakeSimulation"
      >地震模拟
      </el-button>
      <el-button type="danger" @click="removeEarthquakeSimulation"
      >清除地震模拟
      </el-button>
    </div>

    <!-- 模拟地震弹窗 -->
    <SimulatingEarthquake
        v-if="showEarthquakeSimulation"
        :position="earthquakeSimulationPosition"
        :dataTypes="dataTypes"
        :chartDatas="chartDatas"
        @displayTable="displayTable"
        @hideTable="hideTable"
        @displayChart="displayChart"
        @hideChart="hideChart"
        @cancelEarthquake="cancelEarthquake"
        @startLoading="startLoading"
        @stopLoading="stopLoading"
    ></SimulatingEarthquake>

    <!-- 引入各个模拟点：滑坡、泥石流、风险点 -->
    <SimulationPoint></SimulationPoint>
  </div>
</template>

<script setup>
import * as Cesium from "cesium";

import { initCesium } from "@/cesium/initLayer.js";
import { onMounted, reactive, ref } from "vue";
import BaseInfo from "../../components/Earthquake/BaseInfo.vue";
import SimulatingEarthquake from "../../components/Earthquake/SimulatingEarthquake.vue";
import SimulationPoint from "../../components/Earthquake/SimulationPoint.vue";
import basicLayers from "../../cesium/basicLayers";
import { init_cesium_navigation } from "../../cesium/initLayer";
import layers from "../../cesium/layers";
import { pulseUtils } from "../../cesium/pulse";
import { useSimulationPointStore } from "../../store/earthquake/simulation_points";
import Table from "../../components/Earthquake/Table.vue";
import Legend from "../../components/Earthquake/Legend.vue";
import Chart from "../../components/Earthquake/Chart.vue";
import { getHazardOptions } from "../../api/earthquake/hazards";

// 加载
let loading = ref(false);

// 表格数据
const dataTypes = reactive({
  filterCriteria: [
    {
      name: "滑坡预警点",
      value: "type1",
    },
    {
      name: "泥石流预警点",
      value: "type2",
    },
    {
      name: "风险区预警点",
      value: "type3",
    },
  ],
  type1: {
    headers: ["滑坡灾害名称", "位置", "规模等级", "险情等级"],
    data: [],
  },
  type2: {
    headers: ["泥石流灾害名称", "位置", "规模等级", "险情等级"],
    data: [],
  },
  type3: {
    headers: ["风险区名称", "位置", "巡查员姓名", "联系方式"],
    data: [],
  },
});

// 显示表格
const showTable = ref(false);

// 显示chart
const showChart = ref(false);

// chart数据
const chartDatas = reactive({
  title: "地震模拟",
  xAxis: {
    data: ["滑坡受影响点", "泥石流受影响点", "风险区受影响点"],
  },
  seriesDatas: [0, 0, 0],
});

// 弹窗信息
let showBaseInfo = ref(false);
// 弹窗位置
let baseInfoPosition = reactive({
  top: 0,
  left: 0,
});
// 弹窗标题
let baseInfoTitle = ref("");

// 显示滑坡
let showDisasterInformation = ref(false);
let disasterInformation = ref({});
// 显示泥石流
let showdebrisFlowInformation = ref(false);
let debrisFlowInformation = ref({});
// 风险点
let showRiskPointsInformation = ref(false);
let riskPointsInformation = ref({});

// 模拟地震
let showEarthquakeSimulation = ref(false);
let earthquakeSimulationPosition = ref({});
let isMonitoringEarthquake = false;
let earthquakeClickHandler = null;

let entityClickHandler = ref(null);

// 下拉列表选项
let options = ref([]);

onMounted(() => {
  window.viewer = initCesium("cesium-container");

  // 断裂带
  basicLayers.addFaultZone();

  // 行政区
  basicLayers.loadAdminData();

  // 点击隐患点触发
  setupEntityClickHandler();

  // 获取致灾因子下拉列表选项
  getHazardOptions().then((res) => {
    options.value = res;
  });

  // 罗盘
  init_cesium_navigation(108.948024, 34.263161,200000, window.viewer);

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
});

// 显示表格
function displayTable() {
  showTable.value = true;
}

// 隐藏表格
function hideTable() {
  showTable.value = false;
}

// 显示chart
function displayChart() {
  showChart.value = true;
}

// 隐藏chart
function hideChart() {
  showChart.value = false;
}

// 触发点击实体事件
function setupEntityClickHandler() {
  // 清除旧的事件处理程序
  if (entityClickHandler.value) {
    entityClickHandler.value.destroy();
  }

  // 添加新的事件处理程序
  entityClickHandler = new Cesium.ScreenSpaceEventHandler(window.viewer.canvas);
  entityClickHandler.setInputAction((click) => {
    // 隐藏弹窗
    showBaseInfo.value = false;
    // 获取点击位置的实体
    const pickedObject = window.viewer.scene.pick(click.position);
    // console.log(pickedObject)

    try {
      if (pickedObject && Cesium.defined(pickedObject.id)) {
        const entity = pickedObject.id;
        // console.log(entity.properties);
        // 判断是不是风险区
        let isRisk = true;

        // 显示弹窗
        if (entity.properties) {
          if (
              entity.properties.data._value.geologicalDisasterHideDTO
                  .disasterType === "滑坡" ||
              entity.properties.data._value.geologicalDisasterHideDTO
                  .disasterType === "泥石流"
          ) {
            isRisk = false; // 不是风险区
          }

          //屏幕坐标转世界坐标
          let cartesian = window.viewer.scene.globe.pick(
              window.viewer.camera.getPickRay(click.position),
              window.viewer.scene
          );
          //世界坐标转经纬度
          let ellipsoid = window.viewer.scene.globe.ellipsoid;
          let cartographic = ellipsoid.cartesianToCartographic(cartesian);
          let lat = Cesium.Math.toDegrees(cartographic.latitude);
          let lon = Cesium.Math.toDegrees(cartographic.longitude);
          window.viewer.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(lon, lat, 5000),
            orientation: {
              // 指向
              heading: 6.283185307179581,
              // 视角
              pitch: -1.5688168484696687,
              roll: 0.0,
            },
            duration: 1.0, // 设置飞行持续时间为1秒（默认约3秒）
            complete: () => {
              // 飞行完成后显示信息窗口
              if (isRisk) {
                showInfoList(entity.properties.data._value, entity, "风险区");
              } else {
                showInfoList(
                    entity.properties.data._value,
                    entity,
                    entity.properties.data._value.geologicalDisasterHideDTO
                        .disasterType
                );
              }
            },
          });
        }
      }
    } catch (error) {}
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
}
// 显示信息
function showInfoList(info, entity, flag) {
  // 隐藏所有信息
  showDisasterInformation.value = false;
  showdebrisFlowInformation.value = false;
  showRiskPointsInformation.value = false;
  // 获取实体位置的屏幕坐标
  const position = entity.position.getValue(window.viewer.clock.currentTime);
  const canvasPosition =
      window.viewer.scene.cartesianToCanvasCoordinates(position);
  if (!canvasPosition) return; // 位置不可见时返回

  // 计算窗口位置（基于屏幕坐标偏移）
  const left = canvasPosition.x + 80; // 右侧显示
  const top = canvasPosition.y + 50; // 垂直居中

  // console.log(info.properties,entity,11111)
  baseInfoPosition.top = top;
  baseInfoPosition.left = left;

  // 构建信息列表内容
  showBaseInfo.value = true;
  if (flag === "滑坡") {
    showDisasterInformation.value = true;
    disasterInformation.value = info;
    baseInfoTitle.value = "灾害信息";
  } else if (flag === "泥石流") {
    showdebrisFlowInformation.value = true;
    debrisFlowInformation.value = info;
    baseInfoTitle.value = "灾害信息";
  } else if (flag === "风险区") {
    showRiskPointsInformation.value = true;
    riskPointsInformation.value = info;
    baseInfoTitle.value = "风险区信息";
  }
}

// 隐藏弹窗
function removeBaseInfoBox() {
  showBaseInfo.value = false;
}

// 模拟地震
function startEarthquakeSimulation() {
  // 如果已经在监听则不再重复添加
  if (isMonitoringEarthquake) return;

  // 保存事件处理函数以便后续移除
  earthquakeClickHandler = new Cesium.ScreenSpaceEventHandler(
      window.viewer.canvas
  );

  // 设置事件监听
  earthquakeClickHandler.setInputAction((event) => {
    if (!showEarthquakeSimulation.value) {
      // 显示弹窗
      showEarthquakeSimulation.value = true;
      earthquakeSimulationPosition.value = event.position;
      const latitudeAndLongitude = getClickedPosition(event.position);
      earthquakeSimulationPosition.value.latitude =
          latitudeAndLongitude.latitude;
      earthquakeSimulationPosition.value.longitude =
          latitudeAndLongitude.longitude;
    }
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

  // 更新监听状态
  isMonitoringEarthquake = true;
}

// 获取点击位置的经纬度
function getClickedPosition(screenPosition) {
  const ray = window.viewer.camera.getPickRay(screenPosition);
  if (!ray) return null;

  const cartesian = window.viewer.scene.globe.pick(ray, window.viewer.scene);
  if (!cartesian) return null;
  const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
  return {
    longitude: Cesium.Math.toDegrees(cartographic.longitude),
    latitude: Cesium.Math.toDegrees(cartographic.latitude),
    cartesian: cartesian,
  };
}

// 取消地震模拟
function cancelEarthquake() {
  showEarthquakeSimulation.value = false;

  // 如果正在监听则移除事件
  if (isMonitoringEarthquake && earthquakeClickHandler) {
    earthquakeClickHandler.removeInputAction(
        Cesium.ScreenSpaceEventType.LEFT_CLICK
    );
    isMonitoringEarthquake = false;
    earthquakeClickHandler = null;
  }
}

// 清除地震模拟
function removeEarthquakeSimulation() {
  // 清除地震中心点
  basicLayers.removeCenterPoint("earthquakeCenter");

  // 清除烈度圈实体
  layers.removeIsoseismalCircle();

  // 清除脉冲
  pulseUtils.removePulseEntity(useSimulationPointStore(), window.viewer);

  // 隐藏表格
  showTable.value = false;

  // 隐藏chart
  showChart.value = false;
}

// 加载
function startLoading() {
  loading.value = true;
}

// 停止加载
function stopLoading() {
  loading.value = false;
}
</script>

<style scoped>
#cesium-container {
  width: 100%;
  height: calc(100vh - 50px);
  padding: 0;
  margin: 0;
  position: relative;
}

.btns-box {
  position: absolute;
  top: 20px;
  left: 580px;
  z-index: 1000;
}
</style>
