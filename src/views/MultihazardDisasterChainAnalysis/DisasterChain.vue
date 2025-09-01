<template>
  <div
      id="cesium-container"
      ref="cesiumContainer"
      v-loading="loading"
      :element-loading-spinner="svg"
      element-loading-svg-view-box="-10, -10, 50, 50"
      element-loading-background="rgba(122, 122, 122, 0.8)"
  >
    <div class="controls">
      <div class="rain-btn" @click="selectDisasterChain">
        灾害链模型选择
      </div>
    </div>
    <div v-if="showSelect" class="layerControl-panel">
      <div class="panel-content">
        <label><input type="checkbox" v-model="show" @change="toggle"> 暴雨滑坡 </label>
        <label><input type="checkbox" v-model="show" @change="toggle"> 暴雨泥石流 </label>
        <label><input type="checkbox" v-model="show" @change="toggle"> 暴雨内涝 </label>
        <label><input type="checkbox" v-model="show" @change="toggle"> 暴雨山洪 </label>
        <label><input type="checkbox" v-model="show" @change="toggle"> 地震滑坡 </label>
        <label><input type="checkbox" v-model="show" @change="toggle"> 地震泥石流 </label>
      </div>
    </div>
    <!-- 图例 -->
    <Legend></Legend>
    <!-- 表格 -->
    <Table v-if="showTable" :dataTypes="dataTypes"></Table>
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
    <!-- 引入各个模拟点：滑坡、泥石流、风险点 -->
    <SimulationPoint></SimulationPoint>
  </div>
</template>

<script setup>
import * as Cesium from "cesium";

import { initCesium } from "@/cesium/initLayer.js";
import { onMounted, reactive, ref } from "vue";
import SimulationPoint from "../../components/Earthquake/SimulationPoint.vue";
import basicLayers from "../../cesium/basicLayers";
import Table from "../../components/Earthquake/Table.vue";
import Legend from "../../components/Earthquake/Legend.vue";
import HiddenDisasterPanel from "@/components/Panel/HiddenDisasterPanel.vue";
import { nextTick } from 'vue';
import clickPointsAndShowPanel from "@/cesium/clickPointsAndShowPanel.js";

const show = ref(false);
// 加载
let loading = ref(false);

// 表格数据
const dataTypes = reactive({
  filterCriteria: [
    {
      name: "暴雨滑坡",
      value: "type1",
    },
    {
      name: "暴雨泥石流",
      value: "type2",
    },
    {
      name: "暴雨山洪",
      value: "type3",
    },
    {
      name: "暴雨内涝",
      value: "type4",
    },
    {
      name: "地震滑坡",
      value: "type5",
    },
    {
      name: "地震泥石流",
      value: "type6",
    },
  ],
  type1: {
    headers: ["灾害名称", "位置", "发生概率", "险情等级"],
    data: [],
  },
  type2: {
    headers: ["灾害名称", "位置", "发生概率", "险情等级"],
    data: [],
  },
  type3: {
    headers: ["灾害名称", "位置", "发生概率", "险情等级"],
    data: [],
  },
  type4: {
    headers: ["灾害名称", "位置", "发生概率", "险情等级"],
    data: [],
  },
  type5: {
    headers: ["灾害名称", "位置", "发生概率", "险情等级"],
    data: [],
  },
  type6: {
    headers: ["灾害名称", "位置", "发生概率", "险情等级"],
    data: [],
  }
});

// 显示表格
const showTable = ref(true);
const showSelect = ref(false);

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

let viewer = null;

onMounted(() => {
  viewer = initCesium("cesium-container");
  window.viewer = viewer;
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

// 隐藏表格
function hideTable() {
  showTable.value = false;
}

function selectDisasterChain() {
  showSelect.value = !showSelect.value;
}

function toggle(){

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

            console.log("地震中心...")
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

.legend {
  bottom: 10px;
}

.controls {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 100;
}

.rain-btn{
  background-color: #3c86ff;
  color: white;
  padding: 6px 12px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
  white-space: nowrap;
  min-width: 100px; /* 最小宽度确保按钮不挤压 */
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.rain-btn:hover {
  background-color: #3c86ff;
  transform: translateY(-2px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}


.layerControl-panel {
  position: absolute;
  top: 50px;
  right: 20px;
  background-color: rgba(255, 255, 255, 0.75);
  border: 1px solid #ffffff;
  border-radius: 16px;
  color: black;
  padding: 10px; /* 缩小内边距 */
  z-index: 1000;
  width: 160px; /* 缩小面板宽度 */
}

.panel-content {
  display: flex;
  flex-direction: column;
  font-size: 12px; /* 缩小字体 */
  gap: 6px; /* 缩小子元素间距 */
}

</style>
