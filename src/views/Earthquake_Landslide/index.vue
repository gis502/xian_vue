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

    <eqCenterPanel
        v-show="eqCenterPanelVisible"
        :position="PanelPosition"
        :popupData="PanelData"
    />
    <HiddenDisasterPanel
        v-if="showBaseInfo"
        :title="baseInfoTitle"
        :position="PanelPosition"
        :showDisasterInformation="showDisasterInformation"
        :disasterInformation="disasterInformation"
        :showdebrisFlowInformation="showdebrisFlowInformation"
        :debrisFlowInformation="debrisFlowInformation"
        :showRiskPointsInformation="showRiskPointsInformation"
        :riskPointsInformation="riskPointsInformation"
        :trigger="'地震'"
        :rainfall="'0'"
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
import SimulatingEarthquake from "../../components/Earthquake/SimulatingEarthquake.vue";
import SimulationPoint from "../../components/Earthquake/SimulationPoint.vue";
import basicLayers from "../../cesium/basicLayers";
import { init_cesium_navigation } from "../../cesium/initLayer.js";
import layers from "../../cesium/layers";
import Table from "../../components/Earthquake/Table.vue";
import Legend from "../../components/Earthquake/Legend.vue";
import Chart from "../../components/Earthquake/Chart.vue";

import eqCenterPanel from "@/components/Panel/eqCenterPanel.vue";
import HiddenDisasterPanel from "@/components/Panel/HiddenDisasterPanel.vue";
import { nextTick } from 'vue';
import clickPointsAndShowPanel from "@/cesium/clickPointsAndShowPanel.js";
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

// 使用 ref 初始化基本类型的响应式引用
let selectedEntityPosition = ref(null); // 拾取的点的弹框位置
let eqCenterPanelVisible = ref(false);
let rainCenterPanelVisible = ref(false);
let showBaseInfo = ref(false);

// 使用 reactive 初始化对象类型的响应式状态
let PanelPosition = reactive({x: 0, y: 0}); // TimeLinePanel弹窗的位置
let PanelData = reactive({}); // TimeLinePanel弹窗的数据
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
let matchedHiddenHighlightEntities=ref([])
// 模拟地震
let showEarthquakeSimulation = ref(false);
let earthquakeSimulationPosition = ref({});
let isMonitoringEarthquake = false;
let earthquakeClickHandler = null;
let entityClickHandler = ref(null);
onMounted(() => {
  window.viewer = initCesium("cesium-container");

  // 断裂带
  basicLayers.addFaultZone();

  // 行政区
  basicLayers.loadAdminData();

  // 点击隐患点触发
  entitiesClickPonpHandler();

  // 罗盘
  // init_cesium_navigation(108.948024, 34.263161, 200000, window.viewer);

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

//面板
//-------信息面板弹框-----
function entitiesClickPonpHandler() {
  // 在屏幕空间事件处理器中添加左键点击事件的处理逻辑
  window.viewer.screenSpaceEventHandler.setInputAction(async (click) => {
        // 检查点击位置是否拾取到实体
        let pickedEntity = window.viewer.scene.pick(click.position);
        window.selectedEntity = pickedEntity?.id;

        // 如果拾取到实体
        if (Cesium.defined(pickedEntity)) {
          let entity = window.selectedEntity;
          console.log(entity, "拾取entity")
          // 计算图标的世界坐标
          selectedEntityPosition.value = calculatePosition(click.position);
          setTimeout(() => {
            updatePopupPosition();
          }, 10);



          // 如果 entity 没有 _layer 字段，且当前选中图层是特定图层时跳过
          if (!entity.name) {
            eqCenterPanelVisible.value = false;
            rainCenterPanelVisible.value = false;
            return;
          }
          // 如果点击的是标绘点
          else if (entity.name === "地震中心") {
            eqCenterPanelVisible.value = true;
            rainCenterPanelVisible.value = false;
            showBaseInfo.value = false;
            PanelData.value = clickPointsAndShowPanel.extractDataForPanel(entity, matchedHiddenHighlightEntities.value)
          } else if (entity.name === "暴雨中心") {
            eqCenterPanelVisible.value = false;
            rainCenterPanelVisible.value = true;
            showBaseInfo.value = false;
            PanelData.value = clickPointsAndShowPanel.extractDataForPanel(entity, matchedHiddenHighlightEntities.value)
          } else if (entity.name === "滑坡隐患点") {
            eqCenterPanelVisible.value = false;
            rainCenterPanelVisible.value = false;
            showBaseInfo.value = true;
            baseInfoTitle.value = entity.name;
            showDisasterInformation.value = true;
            showdebrisFlowInformation.value = false;
            showRiskPointsInformation.value = false;

            disasterInformation.value = clickPointsAndShowPanel.extractDataForPanel(entity, matchedHiddenHighlightEntities.value)

            debrisFlowInformation.value = null
            riskPointsInformation.value = null
          } else if (entity.name === "泥石流隐患点") {
            eqCenterPanelVisible.value = false;
            rainCenterPanelVisible.value = false;
            showBaseInfo.value = true;
            // this.PanelPosition = selectedEntityPosition.value; // 更新位置
            baseInfoTitle.value = entity.name;

            showDisasterInformation.value = false;
            showdebrisFlowInformation.value = true;
            showRiskPointsInformation.value = false;

            disasterInformation.value = null
            debrisFlowInformation.value = clickPointsAndShowPanel.extractDataForPanel(entity, matchedHiddenHighlightEntities.value)
            riskPointsInformation.value = null
          } else if (entity.name === "风险区域") {
            eqCenterPanelVisible.value = false;
            rainCenterPanelVisible.value = false;
            showBaseInfo.value = true;
            // this.PanelPosition = selectedEntityPosition.value; // 更新位置
            baseInfoTitle.value = entity.name;
            showDisasterInformation.value = false;
            showdebrisFlowInformation.value = false;
            showRiskPointsInformation.value = true;

            disasterInformation.value = null
            debrisFlowInformation.value = null
            riskPointsInformation.value = clickPointsAndShowPanel.extractDataForPanel(entity, matchedHiddenHighlightEntities.value)
          } else {
            rainCenterPanelVisible.value = false;
            eqCenterPanelVisible.value = false;
            showBaseInfo.value = false;
          }
        }
        //没有拾取到实体
        else {
          eqCenterPanelVisible.value = false;
          rainCenterPanelVisible.value = false;
          showBaseInfo.value = false;
        }
      }, Cesium.ScreenSpaceEventType.LEFT_CLICK
  );
// 在屏幕空间事件处理器中添加鼠标移动事件的处理逻辑
  window.viewer.screenSpaceEventHandler.setInputAction(movement => {
    // 如果时间线弹窗或路由弹窗可见，则更新弹窗位置
    if (eqCenterPanelVisible.value || rainCenterPanelVisible.value || showBaseInfo.value) {
      updatePopupPosition();
    }
  }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
}

//计算点击位置的经纬度和高度
function calculatePosition(clickPosition) {
  // 根据点击位置获取射线
  let ray = viewer.camera.getPickRay(clickPosition);
  // 用射线在场景中拾取位置
  let position = viewer.scene.globe.pick(ray, viewer.scene);
  // 将拾取的位置转换为地理坐标
  let cartographic = Cesium.Cartographic.fromCartesian(position);
  // 将地理坐标的经纬度转换为度数
  let latitude = Cesium.Math.toDegrees(cartographic.latitude);
  let longitude = Cesium.Math.toDegrees(cartographic.longitude);
  // 根据地形是否加载来获取高度
  let height = 0;

  // 返回计算得到的经纬度和高度
  return {
    x: longitude, // 经度
    y: latitude,  // 纬度
    z: height     // 高度
  };
}

//更新弹窗位置
function updatePopupPosition() {
  nextTick(() => {
    // console.log('Updating popup position');
    if (selectedEntityPosition.value) {
      const canvasPosition = Cesium.SceneTransforms.wgs84ToWindowCoordinates(
          window.viewer.scene,
          Cesium.Cartesian3.fromDegrees(selectedEntityPosition.value.x, selectedEntityPosition.value.y, selectedEntityPosition.value.z)
      );
      if (canvasPosition) {
        PanelPosition.x = canvasPosition.x + 10; // 注意这里的更新方式
        PanelPosition.y = canvasPosition.y + 10;
      }
      // if (canvasPosition) {
        // PanelPosition.value = {
        //   x: canvasPosition.x + 10,
        //   y: canvasPosition.y + 10
        // };
        // console.log(PanelPosition)
        // console.log('PanelPosition updated', PanelPosition.value);
      // }
    }
  });
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
      const pick = window.viewer.scene.pick(event.position);
      const entity = pick && pick.id;

      // 显示弹窗
      showEarthquakeSimulation.value = true;
      earthquakeSimulationPosition.value = event.position;
      const latitudeAndLongitude = getClickedPosition(event.position);
      earthquakeSimulationPosition.value.latitude =
        latitudeAndLongitude.latitude;
      earthquakeSimulationPosition.value.longitude =
        latitudeAndLongitude.longitude;

      // 添加地点
      earthquakeSimulationPosition.value.name = entity && entity._name;
    } else {
      cancelEarthquake();
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
