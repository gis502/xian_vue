<template>
  <div
      id="cesium-container"
      ref="cesiumContainer"
      v-loading="loading"
      :element-loading-spinner="svg"
      element-loading-svg-view-box="-10, -10, 50, 50"
      element-loading-background="rgba(122, 122, 122, 0.8)">

    <div
        v-if="selectedEntityData"
        class="disaster-popup"
        :style="{
    left: `${calculatePopupLeft()}px`,
    top: `${calculatePopupTop()}px`,
    display: popupVisible ? 'block' : 'none',
    opacity: popupVisible ? '1' : '0',
    transform: popupVisible ? 'scale(1)' : 'scale(0.5)'}"
        @click.stop="stopPropagation">
      <div class="popup-header">
        <h3 v-if="selectedEntityData.properties.disasterName">{{
            selectedEntityData.properties.disasterName || '隐患点'
          }} </h3>
        <h3 v-if="selectedEntityData.properties.teamName">{{
            selectedEntityData.properties.teamName || '消防站'
          }} </h3>
        <h3 v-if="selectedEntityData.properties.hospitalName">{{
            selectedEntityData.properties.hospitalName || '医院'
          }} </h3>
        <h3 v-if="selectedEntityData.properties.dangerName">{{
            selectedEntityData.properties.dangerName || '风险源'
          }} </h3>
        <h3 v-if="selectedEntityData.properties.storeName">{{
            selectedEntityData.properties.storeName || '储备点'
          }} </h3>
        <h3 v-if="selectedEntityData.properties.shelterName">{{
            selectedEntityData.properties.shelterName || '避难所'
          }} </h3>
        <h3 v-if="selectedEntityData.properties.stationName">{{
            selectedEntityData.properties.stationName || '地铁站'
          }} </h3>
        <h3 v-if="selectedEntityData.properties.bridgeName">{{
            selectedEntityData.properties.bridgeName || '桥梁'
          }} </h3>
        <h3 v-if="selectedEntityData.properties.reservoirName">{{
            selectedEntityData.properties.reservoirName || '水库'
          }} </h3>
        <h3 v-if="selectedEntityData.properties.schoolName">{{
            selectedEntityData.properties.schoolName || '学校'
          }} </h3>
        <button @click="closePopup"> 关闭</button>
      </div>
      <div class="popup-content">
        <table class="disaster-table">
          <tbody>
          <tr v-if="selectedEntityData.properties.disasterType">
            <th>灾害类型</th>
            <td>{{ selectedEntityData.properties.disasterType || '未知' }}</td>
          </tr>
          <tr v-if="selectedEntityData.properties.unitCode">
            <th>统一编号</th>
            <td>{{ selectedEntityData.properties.unitCode || '未知' }}</td>
          </tr>
          <tr v-if="selectedEntityData.properties.fieldCode">
            <th>野外编号</th>
            <td>{{ selectedEntityData.properties.fieldCode || '未知' }}</td>
          </tr>
          <tr v-if="selectedEntityData.properties.dangerName">
            <th>危险源名称</th>
            <td>{{ selectedEntityData.properties.dangerName || "未知" }}</td>
          </tr>
          <tr v-if="selectedEntityData.properties.hospitalName">
            <th>医院名称</th>
            <td>{{ selectedEntityData.properties.hospitalName || '未知' }}</td>
          </tr>
          <tr v-if="selectedEntityData.properties.teamName">
            <th>消防站/队名称</th>
            <td>{{ selectedEntityData.properties.teamName || '未知' }}</td>
          </tr>
          <tr v-if="selectedEntityData.properties.storeName">
            <th>储备站点名称</th>
            <td>{{ selectedEntityData.properties.storeName || '未知' }}</td>
          </tr>
          <tr v-if="selectedEntityData.properties.schoolName">
            <th>学校名称</th>
            <td>{{ selectedEntityData.properties.schoolName || '未知' }}</td>
          </tr>
          <tr v-if="selectedEntityData.properties.shelterName">
            <th>避难所名称</th>
            <td>{{ selectedEntityData.properties.shelterName || '未知' }}</td>
          </tr>
          <tr v-if="selectedEntityData.properties.level">
            <th>级别</th>
            <td>{{ selectedEntityData.properties.level }}</td>
          </tr>
          <tr v-if="selectedEntityData.properties.enterpriseType">
            <th>危险源类型</th>
            <td>{{ selectedEntityData.properties.enterpriseType }}</td>
          </tr>
          <tr v-if="selectedEntityData.properties.teamType">
            <th>消防站类型</th>
            <td>{{ selectedEntityData.properties.teamType }}</td>
          </tr>
          <tr v-if="selectedEntityData.properties.schoolType">
            <th>学校类型</th>
            <td>{{ selectedEntityData.properties.schoolType }}</td>
          </tr>
          <tr v-if="selectedEntityData.properties.storeType">
            <th>储备站类型</th>
            <td>{{ selectedEntityData.properties.storeType }}</td>
          </tr>
          <tr v-if="selectedEntityData.properties.shelterType">
            <th>避难所类型</th>
            <td>{{ selectedEntityData.properties.shelterType || '未知' }}</td>
          </tr>
          <tr v-if="selectedEntityData.properties.position">
            <th>地理位置</th>
            <td>{{ selectedEntityData.properties.position || '未知' }}</td>
          </tr>
          <tr>
            <th>经度</th>
            <td>东经{{ selectedEntityData.properties.lon || '未知' }}</td>
          </tr>
          <tr>
            <th>纬度</th>
            <td>北纬{{ selectedEntityData.properties.lat || '未知' }}</td>
          </tr>
          <tr v-if="selectedEntityData.properties.residentCounts">
            <th>居民户数</th>
            <td>{{ selectedEntityData.properties.residentCounts || '未知' }} 户</td>
          </tr>
          <tr v-if="selectedEntityData.properties.addressPopulation">
            <th>户籍人口</th>
            <td>{{ selectedEntityData.properties.addressPopulation || '未知' }} 人</td>
          </tr>
          <tr v-if="selectedEntityData.properties.riskProperty">
            <th>威胁财产</th>
            <td>{{ selectedEntityData.properties.riskProperty || '未知' }} 万元</td>
          </tr>
          <tr v-if="selectedEntityData.properties.permanentPopulation">
            <th>常住人口</th>
            <td>{{ selectedEntityData.properties.permanentPopulation || '未知' }} 人</td>
          </tr>
          <tr v-if="selectedEntityData.properties.housing">
            <th>住房</th>
            <td>{{ selectedEntityData.properties.housing || '未知' }} 间</td>
          </tr>
          <tr v-if="selectedEntityData.properties.scaleGrade">
            <th>规模等级</th>
            <td>{{ selectedEntityData.properties.scaleGrade || '未知' }}</td>
          </tr>
          <tr v-if="selectedEntityData.properties.students">
            <th>在校学生</th>
            <td>{{ selectedEntityData.properties.students || '未知' }}</td>
          </tr>
          <tr v-if="selectedEntityData.properties.isImportant">
            <th>是否有重点保护目标</th>
            <td>{{ selectedEntityData.properties.isImportant || '未知' }}</td>
          </tr>
          <tr v-if="selectedEntityData.properties.riskGrade">
            <th>风险等级</th>
            <td>{{ selectedEntityData.properties.riskGrade || '未知' }}</td>
          </tr>
          <tr v-if="selectedEntityData.properties.sumPeople">
            <th>年度诊疗人数</th>
            <td>{{ selectedEntityData.properties.sumPeople || '未知' }}</td>
          </tr>
          <tr v-if="selectedEntityData.properties.teamSumNum">
            <th>消防队人数</th>
            <td>{{ selectedEntityData.properties.teamSumNum || '未知' }}</td>
          </tr>
          <tr v-if="selectedEntityData.properties.fireCars">
            <th>消防车数量</th>
            <td>{{ selectedEntityData.properties.fireCars || '未知' }}</td>
          </tr>
          <tr v-if="selectedEntityData.properties.fireDevices">
            <th>消防器材数量</th>
            <td>{{ selectedEntityData.properties.fireDevices || '未知' }}</td>
          </tr>
          <tr v-if="selectedEntityData.properties.storeVolume">
            <th>储备站有效库容</th>
            <td>{{ selectedEntityData.properties.storeVolume || '未知' }}</td>
          </tr>
          <tr v-if="selectedEntityData.properties.tent">
            <th>救援帐篷数</th>
            <td>{{ selectedEntityData.properties.tent || '未知' }}</td>
          </tr>
          <tr v-if="selectedEntityData.properties.rubberBoat">
            <th>橡皮艇数</th>
            <td>{{ selectedEntityData.properties.rubberBoat || '未知' }}</td>
          </tr>
          <tr v-if="selectedEntityData.properties.egenerator">
            <th>发电机数</th>
            <td>{{ selectedEntityData.properties.egenerator || '未知' }}</td>
          </tr>
          <tr v-if="selectedEntityData.properties.emergencyLight">
            <th>紧急探照灯数</th>
            <td>{{ selectedEntityData.properties.emergencyLight || '未知' }}</td>
          </tr>
          <tr v-if="selectedEntityData.properties.effectiveNumber">
            <th>避难所最大容纳人数</th>
            <td>{{ selectedEntityData.properties.effectiveNumber || '未知' }}</td>
          </tr>

          <tr v-if="selectedEntityData.properties.username">
            <th>巡查员</th>
            <td>{{ selectedEntityData.properties.username || '未知' }}</td>
          </tr>
          <tr v-if="selectedEntityData.properties.unitHead">
            <th>负责人</th>
            <td>{{ selectedEntityData.properties.unitHead || '未知' }}</td>
          </tr>
          <tr v-if="selectedEntityData.properties.phone">
            <th>手机号</th>
            <td>{{ selectedEntityData.properties.phone || '未知' }}</td>
          </tr>
          </tbody>
        </table>
      </div>
    </div>
    <div class="btn-group">
      <!-- 地震模拟 -->
      <div class="simulator-earthquake"
           :class="{ active: activeBtn === 'simulator' }"
           @click="startEarthquakeSimulation">地震模拟
      </div>
      <div class="firmware"
           :class="{ active: activeBtn === 'firmware' }"
           :plain="true"
           @click="toggleReportPanel">图件下载
      </div>
      <div class="eliminate-earthquake"
           :class="{ active: activeBtn === 'eliminate' }"
           @click="removeEarthquakeSimulation">清除模拟
      </div>
      <div class="eliminate-earthquake"
           :class="{ active: activeBtn === 'eliminate' }"
           @click="homePosition">视角重置
      </div>
    </div>
    <!-- 图例 -->
    <rain-layer-control :viewer="viewer"/>
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
        :showWaterDisasterInformation="showWaterDisasterInformation"
        :waterDisasterInformation="waterDisasterInformation"
        :showFloodDisasterInformation="showFloodDisasterInformation"
        :floodDisasterInformation="floodDisasterInformation"
        :showHistorialDisaster="showHistorialDisaster"
        :historialDisasterInformation="historialDisasterInformation"
        :trigger="'地震'"
        :rainfall="'0'"
    />
    <div class="rain-btn-group">

    </div>

    <!-- 图件报告产出面板组件 -->
    <ThematicPanel
        v-if="isReportPanelVisible"
        :eventRequests="eqRequests"
        maxHeight="70vh">
    </ThematicPanel>

    <!-- 模拟地震弹窗 -->
    <SimulatingEarthquake
        v-if="showEarthquakeSimulation"
        :position="earthquakeSimulationPosition"
        :dataTypes="dataTypes"
        :chartDatas="chartDatas"
        :earthquakeID="earthquakeID"
        :pulse="pulse"
        @updateHypocenter="updateHypocenter"
        @displayTable="displayTable"
        @hideTable="hideTable"
        @displayChart="displayChart"
        @hideChart="hideChart"
        @cancelEarthquake="cancelEarthquake"
        @startLoading="startLoading"
        @stopLoading="stopLoading"
        @updateEqInfo="updateEqInfo"
        @thematicEqInfo="thematicEqInfo"
    ></SimulatingEarthquake>

    <!-- 震源信息 -->
    <div class="hypocenter"
         v-if="showHypocenter"
         :style="{top: hypocenterTop, left: hypocenterLeft}"
    >
      <button class="hypocenterBtn" @click="handleClickOutsideHypocenter">关闭</button>
      <table>
        <tbody>
          <tr>
            <td>名称</td>
            <td>{{ hypocenterForm.fullName }}</td>
          </tr>
          <tr>
            <td>震中位置</td>
            <td>{{ hypocenterForm.position }}</td>
          </tr>
          <tr>
            <td>震中经纬</td>
            <td>经度：{{ hypocenterForm.longitude }}°E，纬度：{{ hypocenterForm.latitude }}°N</td>
          </tr>
          <tr>
            <td>震级</td>
            <td>{{ hypocenterForm.magnitude }}级</td>
          </tr>
          <tr>
            <td>震源深度</td>
            <td>{{ hypocenterForm.depth }}</td>
          </tr>
          <tr>
            <td>时间</td>
            <td>{{ hypocenterForm.dateTime }}</td>
          </tr>
        </tbody>

      </table>
    </div>

    <!-- 引入各个模拟点：滑坡、泥石流、风险点 -->
    <SimulationPoint></SimulationPoint>
  </div>
</template>

<script setup>
import * as Cesium from "cesium";

import {initCesium} from "@/cesium/initLayer.js";
import {onMounted, reactive, ref} from "vue";
import SimulatingEarthquake from "../../components/Earthquake/SimulatingEarthquake.vue";
import SimulationPoint from "../../components/Earthquake/SimulationPoint.vue";
import basicLayers from "../../cesium/basicLayers";
import {init_cesium_navigation} from "../../cesium/initLayer.js";
import layers from "../../cesium/layers";
import {PulseTool} from "@/cesium/pulse.js";
import Table from "../../components/Earthquake/Table.vue";
import Legend from "../../components/Earthquake/Legend.vue";
import Chart from "../../components/Earthquake/Chart.vue";

import eqCenterPanel from "@/components/Panel/eqCenterPanel.vue";
import HiddenDisasterPanel from "@/components/Panel/HiddenDisasterPanel.vue";
import {nextTick} from 'vue';
import clickPointsAndShowPanel from "@/cesium/clickPointsAndShowPanel.js";
import ThematicPanel from "@/components/Panel/ThematicPanel.vue";


import RainLayerControl from "@/components/ScenarioSimulation/rainLayerControl.vue";
import {ElMessage} from "element-plus";

// 加载
let loading = ref(false);

let selectedEntityData = ref(null);
let popupVisible = ref(false);
let popupPosition = ref({x: 0, y: 0});
let clickHandler = ref(null);
let earthquakeID = reactive({})
let activeBtn = ref('');

// 显示震源提示
let showHypocenter = ref(false);
let hypocenterTop = ref(0);
let hypocenterLeft = ref(0);
let hypocenterForm = ref({});

function updateHypocenter(childShowHypocenter, childHypocenterTop, childHypocenterLeft, childHypocenterForm) {
  showHypocenter.value = childShowHypocenter;
  hypocenterTop.value = childHypocenterTop;
  hypocenterLeft.value = childHypocenterLeft;
  hypocenterForm.value = childHypocenterForm;
}


// 脉冲
let pulse = null;

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
const showTable = ref(true);

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
let showWaterDisasterInformation = ref(false);
let showFloodDisasterInformation = ref(false);
let showHistorialDisaster = ref(false);
let debrisFlowInformation = ref({});
// 风险点
let showRiskPointsInformation = ref(false);
let riskPointsInformation = ref({});
let waterDisasterInformation = ref({});
let floodDisasterInformation = ref({});
let historialDisasterInformation = ref({});
let matchedHiddenHighlightEntities = ref([])
// 模拟地震
let showEarthquakeSimulation = ref(false);
let earthquakeSimulationPosition = ref({});
let isMonitoringEarthquake = false;
let earthquakeClickHandler = null;
let viewer = null;

// 图件报告产出
let isReportPanelVisible = ref(false);
let eqRequests = {
  eventFullName: null,
  eventId: null,
  eventQueueId: null,
  eventTypeof: "地震"
}

const handleClickOutsideHypocenter = () => {
  showHypocenter.value = false;
};


onMounted(() => {
  viewer = initCesium("cesium-container");
  window.viewer = viewer;

  pulse = new PulseTool(window.viewer);
  // 断裂带
  basicLayers.addFaultZone();
  // 行政区
  basicLayers.loadAdminData();
  // 点击隐患点触发
  entitiesClickPonpHandler();
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

function stopPropagation(e) {
  e.stopPropagation();
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

function closePopup() {
  popupVisible.value = false;
  selectedEntityData.value = null;
}

async function calculateAndShowPopup(entity) {
  try {
    const scene = viewer.scene;
    const clock = viewer.clock;
    const currentTime = clock.currentTime;
    const position = entity.position.getValue(currentTime);

    if (!position ||
        isNaN(position.x) || isNaN(position.y) || isNaN(position.z) ||
        !isFinite(position.x) || !isFinite(position.y) || !isFinite(position.z)) {
      console.log('位置无效或未定义');
      return;
    }

    const windowPosition = scene.cartesianToCanvasCoordinates(position);
    if (windowPosition) {
      // 更新响应式变量
      popupPosition.value = {
        x: windowPosition.x + 20,
        y: windowPosition.y - 10
      };

      checkPopupBoundary();

      popupVisible.value = true;

      await viewer.flyTo(entity, {
        duration: 0.5,
        offset: new Cesium.HeadingPitchRange(0, Cesium.Math.toRadians(-30), 5000)
      });
    }
  } catch (error) {
    console.error("计算弹出面板位置出错:", error);
  }
}

// 检测弹出面板边界
function checkPopupBoundary() {
  const panelWidth = 280;
  const panelHeight = 200;

  if (!window.viewer || !window.viewer.canvas) return;

  const canvas = window.viewer.canvas;
  const rect = canvas.getBoundingClientRect();

  // 防止面板超出右边界
  if (popupPosition.value.x + panelWidth > rect.right) {
    popupPosition.value.x = rect.right - panelWidth - 10;
  }
  // 防止面板超出下边界
  if (popupPosition.value.y + panelHeight > rect.bottom) {
    popupPosition.value.y = rect.bottom - panelHeight - 10;
  }
  // 防止面板超出左边界
  if (popupPosition.value.x < 10) {
    popupPosition.value.x = 10;
  }
  // 防止面板超出上边界
  if (popupPosition.value.y < 10) {
    popupPosition.value.y = 10;
  }
}

function calculatePopupLeft() {
  checkPopupBoundary(); // 确保在返回前检查边界
  return popupPosition.value.x;
}

function calculatePopupTop() {
  checkPopupBoundary(); // 确保在返回前检查边界
  return popupPosition.value.y;
}

//面板
//-------信息面板弹框-----
function entitiesClickPonpHandler() {
  // 在屏幕空间事件处理器中添加左键点击事件的处理逻辑
  window.viewer.screenSpaceEventHandler.setInputAction(async (click) => {
        // 假设你想在点击时获取经纬度
        const scene = window.viewer.scene;
        const globe = scene.globe;
        try {
          const cartesianPosition = scene.pickPosition(click.position);
          if (cartesianPosition) {
            // 将笛卡尔坐标转换为弧度表示的制图坐标
            const cartographic = Cesium.Cartographic.fromCartesian(cartesianPosition);
            // 将弧度转换为度数得到经纬度，以及获取高度
            const longitude = Cesium.Math.toDegrees(cartographic.longitude);
            const latitude = Cesium.Math.toDegrees(cartographic.latitude);
            const height = cartographic.height;

            console.log("经度:", longitude, "纬度:", latitude, "高度 (米):", height);
          } else {
            console.warn("无法获取点击位置的三维坐标。");
          }
        } catch (error) {
          console.error("在坐标转换过程中发生错误:", error);
        }
        // 检查点击位置是否拾取到实体
        let pickedEntity = window.viewer.scene.pick(click.position);
        window.selectedEntity = pickedEntity?.id;

        // 如果拾取到实体
        if (Cesium.defined(pickedEntity)) {
          let entity = window.selectedEntity;
          console.log("拾取entity", entity)
          console.log(111, entity.disasterData)
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

            console.log("地震中心...")
            eqCenterPanelVisible.value = true;
            rainCenterPanelVisible.value = false;
            showHistorialDisaster.value = false;
            showBaseInfo.value = false;
            PanelData.value = clickPointsAndShowPanel.extractDataForPanel(entity, matchedHiddenHighlightEntities.value)
            historialDisasterInformation.value = null;
          } else if (entity.name === "暴雨中心") {
            eqCenterPanelVisible.value = false;
            showHistorialDisaster.value = false;
            rainCenterPanelVisible.value = true;
            showBaseInfo.value = false;
            PanelData.value = clickPointsAndShowPanel.extractDataForPanel(entity, matchedHiddenHighlightEntities.value)
            historialDisasterInformation.value = null;
          } else if (entity.name === "滑坡隐患点") {
            eqCenterPanelVisible.value = false;
            rainCenterPanelVisible.value = false;
            showHistorialDisaster.value = false;
            showBaseInfo.value = true;
            baseInfoTitle.value = entity.name;

            // 确保先重置所有显示状态
            showDisasterInformation.value = false;
            showdebrisFlowInformation.value = false;
            showRiskPointsInformation.value = false;

            // 使用 nextTick 确保状态更新
            await nextTick(() => {
              showDisasterInformation.value = true;
              showdebrisFlowInformation.value = false;
              showRiskPointsInformation.value = false;

              // 使用新的对象引用确保响应式更新
              disasterInformation.value = {...clickPointsAndShowPanel.extractDataForPanel(entity, matchedHiddenHighlightEntities.value)};
              debrisFlowInformation.value = null;
              riskPointsInformation.value = null;
            });

            historialDisasterInformation.value = null;
          } else if (entity.name === "泥石流隐患点") {
            eqCenterPanelVisible.value = false;
            rainCenterPanelVisible.value = false;
            showHistorialDisaster.value = false;
            showBaseInfo.value = true;
            // this.PanelPosition = selectedEntityPosition.value; // 更新位置
            baseInfoTitle.value = entity.name;

            showDisasterInformation.value = false;
            showdebrisFlowInformation.value = true;
            showRiskPointsInformation.value = false;

            historialDisasterInformation.value = null;
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
            showHistorialDisaster.value = false;
            showRiskPointsInformation.value = true;

            historialDisasterInformation.value = null;
            disasterInformation.value = null
            debrisFlowInformation.value = null
            riskPointsInformation.value = clickPointsAndShowPanel.extractDataForPanel(entity, matchedHiddenHighlightEntities.value)
          } else if (entity.name === "历史地震灾害") {
            eqCenterPanelVisible.value = false;
            rainCenterPanelVisible.value = false;
            showBaseInfo.value = true;
            baseInfoTitle.value = entity.name;
            showDisasterInformation.value = false;
            showdebrisFlowInformation.value = false;
            showRiskPointsInformation.value = false;
            showWaterDisasterInformation.value = false;
            showFloodDisasterInformation.value = false;
            showHistorialDisaster.value = true;

            floodDisasterInformation.value = null;
            disasterInformation.value = null
            debrisFlowInformation.value = null
            riskPointsInformation.value = null
            waterDisasterInformation.value = null
            historialDisasterInformation.value = entity.disasterData

          } else {
            // ============ 整合 setupEntityClickHandler 的逻辑到这里 ============
            rainCenterPanelVisible.value = false;
            eqCenterPanelVisible.value = false;
            showBaseInfo.value = false;

            // 隐藏之前的弹出面板
            closePopup();

            if (Cesium.defined(pickedEntity) && Cesium.defined(pickedEntity.id)) {
              const entity = pickedEntity.id;

              // 检查是否有 disasterData 属性（灾害点实体）
              if (entity.disasterData !== undefined) {
                // 获取实体的灾害数据
                selectedEntityData.value = entity.disasterData || {};

                // 计算弹出框位置并显示面板
                await calculateAndShowPopup(entity, click.position);
              }
            } else {
              // 如果点击在空白处，隐藏信息框
              window.viewer.selectedEntity = undefined;
              closePopup();
            }
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

// 更新地震信息
function updateEqInfo(data) {

  matchedHiddenHighlightEntities.value = [];

  data.forEach(item => {
    // console.log(item, "item...要点击的，，，")
    matchedHiddenHighlightEntities.value.push(item)
  })

  matchedHiddenHighlightEntities.value = [...matchedHiddenHighlightEntities.value];

}

function thematicEqInfo(data) {

  // 地震Id传给子组件
  eqRequests.eventId = data.eqId
  eqRequests.eventQueueId = data.eqqueueId
  eqRequests.eventFullName = data.earthquakeFullName
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
  activeBtn.value = 'simulator';
  resetAllPanelData();
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
  activeBtn.value = 'eliminate';
  // 清除地震中心点
  basicLayers.removeCenterPoint("earthquakeCenter");

  // 清除烈度圈实体
  layers.removeIsoseismalCircle();

  // 清除预警点脉冲
  pulse.removePulseEntity();

  // 隐藏chart
  showChart.value = false;
  activeBtn.value = '';
  resetAllPanelData();
}

// 视角重置
function homePosition() {
  window.viewer.camera.setView({
    destination: Cesium.Cartesian3.fromDegrees(108.93, 34.27, 200000),
    orientation: {
      heading: Cesium.Math.toRadians(0),
      pitch: Cesium.Math.toRadians(-90),
      roll: 0.0,
    },
  });
}

// 产出报告面板
function toggleReportPanel() {

  if (eqRequests.eventId == null && eqRequests.eventQueueId == null) {
    ElMessage({
      message: '暂无图件，请先模拟地震！',
      type: 'warning',
    })
    activeBtn.value = '';
    return;
  } else {
    isReportPanelVisible.value = !isReportPanelVisible.value
    if (isReportPanelVisible.value) {
      activeBtn.value = 'firmware'
    } else {
      activeBtn.value = ''
    }
  }
}

// 重置所有面板数据
function resetAllPanelData() {
  // 使用 ref 的 .value 赋值来确保响应式更新
  showBaseInfo.value = false;

  // 重置灾害信息数据
  disasterInformation.value = {};
  debrisFlowInformation.value = {};
  riskPointsInformation.value = {};
  waterDisasterInformation.value = {};
  floodDisasterInformation.value = {};
  historialDisasterInformation.value = {};

  // 重置显示状态
  showDisasterInformation.value = false;
  showdebrisFlowInformation.value = false;
  showRiskPointsInformation.value = false;
  showWaterDisasterInformation.value = false;
  showFloodDisasterInformation.value = false;
  showHistorialDisaster.value = false;

  // 重置匹配的高亮实体
  matchedHiddenHighlightEntities.value = [];

  // 强制触发更新
  nextTick(() => {
    console.log('所有面板数据已重置');
  });
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
  left: 38%;
  z-index: 1000;
}

.legend {
  bottom: 10px;
}

.disaster-popup {
  position: absolute;
  z-index: 1000;
  width: 330px; /* 减小宽度 */
  border-radius: 2px; /* 减小圆角 */
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1); /* 减小阴影 */
  font-family: 'Source Han Sans CN', sans-serif;
  overflow: hidden;
  transition: opacity 0.2s, transform 0.2s;
  transform-origin: top left;
  opacity: 0;
  transform: scale(0.95);
  pointer-events: none;
  border: 1px solid rgba(0, 225, 255, 1);
  font-size: 13px; /* 减小整体字体大小 */
}

.disaster-popup[style*="display: block"] {
  opacity: 1;
  transform: scale(1);
  pointer-events: auto;
  transition: all 0.3s ease;
}


.popup-header {
  padding: 8px 12px; /* 减小内边距 */
  background: rgba(14, 52, 98, 0.95);
  border-bottom: 1px solid #e9ecef;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.popup-header h3 {
  margin: 0;
  font-size: 14px; /* 减小标题字体大小 */
  font-weight: 600;
  color: white;
}

button {
  background-color: #3c86ff;
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s ease;
  height: 34px;
  /* 统一高度 */
  box-sizing: border-box;
  /* 确保padding和border包含在height内 */
  white-space: nowrap;
  /* 防止按钮文字换行 */
}

.popup-header button:hover {
  color: #333;
}

.popup-content {
  background: rgba(0, 94, 153, 1);
  color: white;
}


.disaster-table th,
.disaster-table td {
  padding: 6px 8px; /* 减小单元格内边距 */
  text-align: left;
  border-bottom: 1px solid #000;
}

.disaster-table th {
  font-weight: 500;
  width: 35%; /* 固定标题列宽度 */
}

.disaster-table td {
  word-break: break-all;
}

.disaster-table tr:last-child th,
.disaster-table tr:last-child td {
  border-bottom: none; /* 最后一行不显示底边 */
}

.eliminate-earthquake, .simulator-earthquake, .firmware {
  color: white;
  padding: 12px 12px;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.3s;
  white-space: nowrap;
  min-width: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 1;
  background-image: url("../../assets/images/按钮3.png");
  background-color: transparent;
  background-size: 100%;
  background-repeat: no-repeat;
  background-position: center;
  border: none;
  box-shadow: none;
  border-radius: 0;
  margin-right: -3px;
  width: 180px;
}

.eliminate-earthquake.active,
.simulator-earthquake.active,
.firmware.active {
  background-image: url("@/assets/images/按钮4.png");
}

.btn-group {
  position: absolute;
  top: 53px;
  right: 164px;
  z-index: 1000;
  width: 180px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  padding: 15px 0;
}

.rain-btn-group {
  /*width: 100%;*/
  width: 100%;
  height: 60px;
  position: absolute;
  /*bottom: 0px;
  background-color: rgba(255, 255, 255, 0.5);
  display: flex;
  align-items: center;
  */
  background: url(/images/background_image.png) center center no-repeat #fff;
  color: black;
  z-index: 1000;
  top: -60px;
}

.hypocenter {
  position: absolute; /* 配合top/left绝对定位 */
  background: #fff; /* 白色背景 */
  padding: 15px; /* 内边距 */
  border-radius: 8px; /* 圆角边框 */
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1); /* 轻微阴影增强层次感 */
  border: 1px solid #f0f0f0; /* 浅灰边框 */
  z-index: 10000; /* 确保在地图上方显示 */
  min-width: 300px; /* 最小宽度，避免内容过挤 */
}

.hypocenter table {
  width: 100%; /* 表格占满容器 */
  border-collapse: collapse; /* 合并边框 */
}

/* 单元格基础样式：加!important强制生效，文字居中 */
.hypocenter table td {
  padding: 8px 12px !important; /* 强制内边距 */
  border-bottom: 1px solid #f5f5f5 !important; /* 强制行分隔线 */
  font-size: 14px !important; /* 强制文字大小 */
  text-align: center !important; /* 文字居中 */
}

/* 最后一行去掉下边框（强制生效） */
.hypocenter table tr:last-child td {
  border-bottom: none !important;
}

/* 左侧标签列：强制样式+居中 */
.hypocenter table td:first-child {
  font-weight: 500 !important;
  color: #666 !important;
  width: 35% !important; /* 强制固定宽度 */
  text-align: center !important; /* 标签列也居中 */
}

/* 右侧内容列：强制样式+居中 */
.hypocenter table td:last-child {
  color: #333 !important;
  word-break: break-all !important; /* 强制长文本换行 */
  text-align: center !important; /* 内容列居中 */
}

.hypocenterBtn {
  float: right;
}
</style>
