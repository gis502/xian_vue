<template>
  <div class="cesium-container"
       id="cesiumContainer"
       v-loading="loadingModel"
       :element-loading-spinner="svg"
       element-loading-svg-view-box="-10, -10, 50, 50"
       element-loading-background="rgba(122, 122, 122, 0.8)">

    <div v-if="isLoading" class="loading-indicator">
      {{ loadingText }}
    </div>
    <Table :show="showRiskTable" :dataTypes="dataTypeHiddenDisaster" />
    <AffectedChart v-if="showLegend" :dimensions="dimensions" :source="districtDisasterData" />
    <AddRain v-if="showInfoPanel"
             :selectedPositionLonAndLat="selectedPosition"
             :PanelPosition="PanelPosition"
             @update:show-info-panel="(value)=>{showInfoPanel = value}"
             @update:loading-model="(value)=>{loadingModel = value}"
             @update:handleWeather="handleWeather"
             @update:matched-huapo-entities="handleHiddenDisasterPointUpdate"
             @update:update-rain-info="(value)=>rainInfo = value" />
    <Legend ref="legendRef" />
    <TimeLine :timeDate="timeLabels" v-if="showRadarSatelliteMap" ref="timeLineRef" @radarIndex="radarIndex" />
    <div class="rain-btn-group">
      <div class="btn-group">
        <div class="rain-btn" @click="toggleRainMode">
          <!--          {{ rainMode ? '取消暴雨标记' : '标记暴雨点' }}-->
          暴雨模拟
        </div>
        <div class="weather-btn" @click="radars">
          卫星云图
          <!-- {{ showRadarSatelliteMap ? '隐藏卫星云图' : '卫星云图' }} -->
        </div>
        <div class="admin-btn" @click="toggleAdminLayer">
<!--          {{ showAdminLayer ? '隐藏行政区划' : '显示行政区划' }}-->
          行政区划
        </div>
        <div class="table-btn" @click="showRiskTable = !showRiskTable">
<!--          {{ showRiskTable ? '信息隐藏' : '信息展示' }}-->
          信息表格
        </div>
        <div class="table-btn" @click="downloadRainReport">
          报告下载
        </div>
        <div>
          <button class="table-btn " style="border: none;" @click="toggleFactorPanel">致灾因子信息</button>
        </div>
        <!--        <div class="weather-btn" @click="toggleWeatherEffect" :class="{ 'disabled': rainMode }">-->
        <!--          {{ weatherActive ? '停止降雨' : '模拟降雨' }}-->
        <!--        </div>-->
      </div>
    </div>
  </div>
</template>

<script setup>
/* 外部库 */
import * as Cesium from 'cesium';
import {onMounted,nextTick} from "vue";
import html2canvas from "html2canvas";
/* 封装组件 */
import Legend from "@/components/Earthquake/Legend.vue";
import Table from "@/components/Earthquake/Table.vue";
import AffectedChart from "@/components/Earthquake/AffectedChart.vue";
import TimeLine from "@/components/Rain/TimeLine.vue"
import AddRain from "@/components/Panel/addRain.vue";
/* 封装方法 */
import { initCesium } from '@/cesium/initLayer.js'
import clickPointsAndShowPanel from "@/cesium/clickPointsAndShowPanel.js";
import basicLayers from "@/cesium/basicLayers.js";
/* 请求接口 */
import { getRadarData } from '@/api/system/rainModel.js'
import { saveCanvas, generateRainReport } from '@/api/system/reportDownLoad.js'
/* 读取数据 */
import riverData from '@/assets/static/json/river.json';
import lakeData from '@/assets/static/json/lake.json';



let viewer = null
let rainEffect = null
let setRainIntensity = null
let eqCenterPanelVisible = false
let matchedHiddenHighlightEntities = []
let handler = null
let radarSatelliteEntity = null
let dimensions =  ['grade', '高', '中', '低']
let riverDataSource = null
let lakeDataSource = null
// let riverData = null

let baseInfoTitle = ref("")
let showBaseInfo = ref(false)
let rainMode = ref(false) /* 下雨特效 */
let rainCenterPanelVisible = ref(false)
let showDisasterInformation = ref(false)
let showdebrisFlowInformation = ref(false)
let showRiskPointsInformation = ref(false)
let showFloodDisasterInformation = ref(false)
let showWaterDisasterInformation = ref(false)
let showInfoPanel = ref(false)
let showRadarSatelliteMap = ref(false)
let timeLineRef = ref()
let legendRef = ref()
let showRiskTable = ref(true)
let showLegend = ref(false)
let weatherActive = ref(false)
let loadingModel = ref(false)
let isLoading = ref(false)
let loadingText = ref('加载数据中...')
let showAdminLayer = ref(true)

let selectedEntityPosition = reactive(null)
let PanelPosition = reactive({x: 0, y: 0})
let PanelData = reactive({})
let disasterInformation = reactive(null)
let debrisFlowInformation = reactive(null)
let riskPointsInformation = reactive(null)
let waterDisasterInformation = reactive(null)
let floodDisasterInformation = reactive(null)
let selectedPosition = reactive(null)
let timeLabels= reactive([])
let radarImages =  reactive([
  '/test/SEVP_AOC_RDCP_SLDAS3_ECREF_AZ9290_L88_PI_20250820135900000.PNG.png',
  '/test/SEVP_AOC_RDCP_SLDAS3_ECREF_AZ9290_L88_PI_20250820140500000.PNG.png',
  '/test/SEVP_AOC_RDCP_SLDAS3_ECREF_AZ9290_L88_PI_20250820141100000.PNG.png',
  '/test/SEVP_AOC_RDCP_SLDAS3_ECREF_AZ9290_L88_PI_20250820141700000.PNG.png',
  '/test/SEVP_AOC_RDCP_SLDAS3_ECREF_AZ9290_L88_PI_20250820142400000.PNG.png',
  '/test/SEVP_AOC_RDCP_SLDAS3_ECREF_AZ9290_L88_PI_20250820143000000.PNG.png',
  '/test/SEVP_AOC_RDCP_SLDAS3_ECREF_AZ9290_L88_PI_20250820143600000.PNG.png',
  '/test/SEVP_AOC_RDCP_SLDAS3_ECREF_AZ9290_L88_PI_20250820144200000.PNG.png',
  '/test/SEVP_AOC_RDCP_SLDAS3_ECREF_AZ9290_L88_PI_20250820144800000.PNG.png',
  '/test/SEVP_AOC_RDCP_SLDAS3_ECREF_AZ9290_L88_PI_20250820145400000.PNG.png',
  '/test/SEVP_AOC_RDCP_SLDAS3_ECREF_AZ9290_L88_PI_20250820150000000.PNG.png',
  '/test/SEVP_AOC_RDCP_SLDAS3_ECREF_AZ9290_L88_PI_20250820150700000.PNG.png',
  '/test/SEVP_AOC_RDCP_SLDAS3_ECREF_AZ9290_L88_PI_20250820151300000.PNG.png',
  '/test/SEVP_AOC_RDCP_SLDAS3_ECREF_AZ9290_L88_PI_20250820151900000.PNG.png',
  '/test/SEVP_AOC_RDCP_SLDAS3_ECREF_AZ9290_L88_PI_20250820152500000.PNG.png',
  '/test/SEVP_AOC_RDCP_SLDAS3_ECREF_AZ9290_L88_PI_20250820153100000.PNG.png',
  '/test/SEVP_AOC_RDCP_SLDAS3_ECREF_AZ9290_L88_PI_20250820153700000.PNG.png',
  '/test/SEVP_AOC_RDCP_SLDAS3_ECREF_AZ9290_L88_PI_20250820154300000.PNG.png',
  '/test/SEVP_AOC_RDCP_SLDAS3_ECREF_AZ9290_L88_PI_20250820155000000.PNG.png',
  '/test/SEVP_AOC_RDCP_SLDAS3_ECREF_AZ9290_L88_PI_20250820155600000.PNG.png'
])
let dataTypeHiddenDisaster = reactive({
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
    {
      name: "人口数据",
      value: "type4",
    },
    {
      name: "农作物数据",
      value: "type5",
    },
    {
      name: "管网数据",
      value: "type6",
    },
    {
      name: "道路数据",
      value: "type7",
    },
    {
      name: "高速数据",
      value: "type8",
    },
    {
      name: "水库数据",
      value: "type9",
    },
    {
      name: "桥梁数据",
      value: "type10",
    }
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
  type4: {
    headers: ["区县", "街道", "人口数量"],
    data: [],
  },
  type5: {
    headers: ["区县", "小麦", "水稻", "玉米"],
    data: [],
  },
  type6: {
    headers: ["区县", "预留位置"],
    data: [],
  },
  type7: {
    headers: ["道路名称", "起点名称", "终点名称"],
    data: [],
  },
  type8: {
    headers: ["高速名称", "高速长度"],
    data: [],
  },
  type9: {
    headers: ["水库名称", "位置"],
    data: [],
  },
  type10: {
    headers: ["桥梁名称", "位置", "类型"],
    data: [],
  }
})
let districtDisasterData =  reactive([
  {
    district: '',
    disasters: [
      { type: '滑坡', '高': 0, '中': 0, '低': 0 },
      { type: '泥石流', '高': 0, '中': 0, '低': 0 },
      { type: '山洪', '高': 0, '中': 0, '低': 0 },
      { type: '内涝', '高': 0, '中': 0, '低': 0 }
    ]
  }
])
let rainInfo = reactive([])


onMounted(()=>{
  viewer = initCesium("cesiumContainer")
  window.viewer = viewer
  init()
})
onBeforeUnmount(()=>{
  releaseAllResources();
})

/* 初始化地图和点击事件 */
function init(){
  /* 去除cesium的logo */
  viewer._cesiumWidget._creditContainer.style.display = "none";
  /* 加载图层数据 */
  basicLayers.loadAdminData(); // 加载行政区划数据
  basicLayers.loadLandSlide();
  basicLayers.Addmudslide();
  basicLayers.AddDangerAreaDataSource();
  basicLayers.loadFlashFlood();
  basicLayers.loadWater();
  loadRiverData()
  loadLakeData()

  viewer.camera.setView({
    destination: Cesium.Cartesian3.fromDegrees(108.93, 34.27, 300000),
    orientation: {
      heading: Cesium.Math.toRadians(0),
      pitch: Cesium.Math.toRadians(-90),
      roll: 0.0
    }
  });
  /* 初始化下雨效果，有作用吗？ */
  initRainEffect()
  // document.addEventListener('keydown', onKeyDown); ？？
  initEntitiesClickPonpHandler()
}

/* 初始化降雨 */
function initRainEffect(){
  /* cesium底层绘图方法 */
  const rainFragmentShader = `
    #version 300 es
    precision highp float;

    uniform sampler2D colorTexture;
    uniform float rainIntensity;
    uniform vec4 rainArea;
    in vec2 v_textureCoordinates;
    out vec4 fragColor;

    float hash(float x){
        return fract(sin(x*23.3)*13.13);
    }

    // 检查点是否在矩形区域内
    bool isInRainArea(vec2 uv, vec4 area) {
        return uv.x >= area.x && uv.x <= area.x + area.z &&
               uv.y >= area.y && uv.y <= area.y + area.w;
    }

    void main(){
        float time = czm_frameNumber / 120.0;
        vec2 resolution = czm_viewport.zw;
        vec2 uv=(gl_FragCoord.xy*2.-resolution.xy)/min(resolution.x,resolution.y);
        vec3 c=vec3(.6,.7,.8);
        float a=-.4;
        float si=sin(a),co=cos(a);
        uv*=mat2(co,-si,si,co);
        uv*=length(uv+vec2(0,8.9))*.3+1.;
        float v=1.-sin(hash(floor(uv.x*100.))*2.);

        // 归一化的屏幕坐标
        vec2 screenUV = gl_FragCoord.xy / resolution;

        // 控制雨滴参数
        float density = 5.0 * rainIntensity;
        float brightness = 20.0 * rainIntensity;
        float threshold = 0.95 - 0.1 * rainIntensity;

        float b=clamp(abs(sin(20.*time*v+uv.y*density))-threshold,0.,1.)*brightness;
        c*=v*b;

        fragColor = mix(
            texture(colorTexture, v_textureCoordinates),
            vec4(c, 1),
            0.5 * rainIntensity
        );
    }
  `
  rainEffect = new Cesium.PostProcessStage({
    fragmentShader: rainFragmentShader,
    uniforms: {
      rainIntensity: 0.5,
      rainArea: new Cesium.Cartesian4(0.25, 0.25, 0.5, 0.5)
    }
  })
  viewer.scene.postProcessStages.add(rainEffect)
  rainEffect.enabled = false;
  // 设置降雨量的方法
  // setRainIntensity = (value) => {
  //   this.rainEffect.uniforms.rainIntensity = Math.max(0.0, Math.min(1.0, value));
  //   this.updateRainUI(value); // 更新UI显示
  // };
}

/* 初始化实体点击事件 */
function initEntitiesClickPonpHandler() {
  // 在屏幕空间事件处理器中添加左键点击事件的处理逻辑
  viewer.screenSpaceEventHandler.setInputAction(async (click) => {
        // 检查点击位置是否拾取到实体
        let pickedEntity = viewer.scene.pick(click.position);
        window.selectedEntity = pickedEntity?.id;

        // 如果拾取到实体
        if (Cesium.defined(pickedEntity)) {
          let entity = window.selectedEntity;
          console.log(entity, "拾取entity")
          // 计算图标的世界坐标
          selectedEntityPosition = calculatePosition(click.position);
          setTimeout(() => {
            updatePopupPosition();
          }, 10);

          // 如果 entity 没有 _layer 字段，且当前选中图层是特定图层时跳过
          if (!entity.name) {
            eqCenterPanelVisible = false;
            rainCenterPanelVisible.value = false;
            return;
          }
          // 如果点击的是标绘点
          else if (entity.name === "地震中心") {
            eqCenterPanelVisible = true;
            rainCenterPanelVisible.value = false;
            showBaseInfo.value = false;
            PanelData = {}
            PanelData = clickPointsAndShowPanel.extractDataForPanel(entity, matchedHiddenHighlightEntities)
          } else if (entity.name === "暴雨中心") {
            eqCenterPanelVisible = false;
            rainCenterPanelVisible.value = true;
            showBaseInfo.value = false;

            PanelData = {}
            PanelData = clickPointsAndShowPanel.extractDataForPanel(entity, matchedHiddenHighlightEntities)
          } else if (entity.name === "滑坡隐患点") {
            eqCenterPanelVisible = false;
            rainCenterPanelVisible.value = false;
            showBaseInfo.value = true;
            baseInfoTitle.value = entity.name;

            showDisasterInformation.value = true;
            showdebrisFlowInformation.value = false;
            showRiskPointsInformation.value = false;
            showFloodDisasterInformation.value = false;
            showWaterDisasterInformation.value = false;

            disasterInformation = clickPointsAndShowPanel.extractDataForPanel(entity, matchedHiddenHighlightEntities)

            debrisFlowInformation = null
            riskPointsInformation = null
            waterDisasterInformation = null
            floodDisasterInformation = null


          } else if (entity.name === "泥石流隐患点") {
            eqCenterPanelVisible = false;
            rainCenterPanelVisible.value = false;
            showBaseInfo.value = true;
            baseInfoTitle.value = entity.name;

            showDisasterInformation.value = false;
            showdebrisFlowInformation.value = true;
            showRiskPointsInformation.value = false;
            showFloodDisasterInformation.value = false;
            showWaterDisasterInformation.value = false;

            disasterInformation = null
            debrisFlowInformation = clickPointsAndShowPanel.extractDataForPanel(entity, matchedHiddenHighlightEntities)
            riskPointsInformation = null
            waterDisasterInformation = null
            floodDisasterInformation = null
          } else if (entity.name === "风险区域") {
            eqCenterPanelVisible = false;
            rainCenterPanelVisible.value = false;
            showBaseInfo.value = true;
            // PanelPosition = selectedEntityPosition; // 更新位置
            baseInfoTitle.value = entity.name;
            showDisasterInformation.value = false;
            showdebrisFlowInformation.value = false;
            showRiskPointsInformation.value = true;
            showFloodDisasterInformation.value = false;
            showWaterDisasterInformation.value = false;

            disasterInformation = null
            debrisFlowInformation = null
            riskPointsInformation = clickPointsAndShowPanel.extractDataForPanel(entity, matchedHiddenHighlightEntities)
            waterDisasterInformation = null
            floodDisasterInformation = null
          } else if (entity.name === "内涝隐患点") {
            eqCenterPanelVisible = false;
            rainCenterPanelVisible.value = false;
            showBaseInfo.value = true;
            // PanelPosition = selectedEntityPosition; // 更新位置
            baseInfoTitle.value = entity.name;
            showDisasterInformation.value = false;
            showdebrisFlowInformation.value = false;
            showRiskPointsInformation.value = false;
            showWaterDisasterInformation.value = true;
            showFloodDisasterInformation.value = false;

            disasterInformation = null
            debrisFlowInformation = null
            riskPointsInformation = null
            waterDisasterInformation = clickPointsAndShowPanel.extractDataForPanel(entity, matchedHiddenHighlightEntities)
            floodDisasterInformation = null

          } else if (entity.name === "山洪隐患点") {

            eqCenterPanelVisible = false;
            rainCenterPanelVisible.value = false;
            showBaseInfo.value = true;
            // PanelPosition = selectedEntityPosition; // 更新位置
            baseInfoTitle.value = entity.name;
            showDisasterInformation.value = false;
            showdebrisFlowInformation.value = false;
            showRiskPointsInformation.value = false;
            showWaterDisasterInformation.value = false;
            showFloodDisasterInformation.value = true;

            disasterInformation = null
            debrisFlowInformation = null
            riskPointsInformation = null
            waterDisasterInformation = null
            floodDisasterInformation = clickPointsAndShowPanel.extractDataForPanel(entity, matchedHiddenHighlightEntities)

          } else {
            rainCenterPanelVisible.value = false;
            eqCenterPanelVisible = false;
            showBaseInfo.value = false;
          }
        }
        //没有拾取到实体
        else {
          eqCenterPanelVisible = false;
          rainCenterPanelVisible.value = false;
          showBaseInfo.value = false;
        }
      }, Cesium.ScreenSpaceEventType.LEFT_CLICK
  );
  // 在屏幕空间事件处理器中添加鼠标移动事件的处理逻辑
  viewer.screenSpaceEventHandler.setInputAction(movement => {
    // 如果时间线弹窗或路由弹窗可见，则更新弹窗位置
    if (eqCenterPanelVisible || rainCenterPanelVisible.value || showBaseInfo.value || showInfoPanel.value) {
      updatePopupPosition();
    }
  }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
}

/* 获取点击事件的屏幕坐标 */
function calculatePosition(clickPosition){
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

/* 更新弹窗位置 */
function updatePopupPosition() {
  // 使用$nextTick确保DOM更新后才执行位置计算
  nextTick(() => {
    // 检查是否有选中的实体位置
    if (selectedEntityPosition) {
      // 将地理坐标转换为窗口坐标
      const canvasPosition = Cesium.SceneTransforms.wgs84ToWindowCoordinates(
          viewer.scene,
          Cesium.Cartesian3.fromDegrees(
              selectedEntityPosition.x,
              selectedEntityPosition.y,
              selectedEntityPosition.z
          )
      );
      // 如果转换成功，则更新弹窗位置
      if (canvasPosition) {
        PanelPosition.x = canvasPosition.x + 10
        PanelPosition.y = canvasPosition.y + 10
      }
    }
  });
}

/* 触发暴雨信息弹窗 */
function toggleRainMode() {
  // 若不允许标记且当前为开启状态，则直接关闭
  if (rainMode) {
    rainMode.value = false;
    if (handler) {
      handler.destroy();
      handler = null;
    }
    document.body.style.cursor = '';
    showInfoPanel.value = false;
    return;
  }
  rainMode.value = !rainMode.value;
  if (rainMode.value) {
    handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    handler.setInputAction(onMapClick, Cesium.ScreenSpaceEventType.LEFT_CLICK);
    document.body.style.cursor = 'crosshair';
  } else {
    if (handler) {
      handler.destroy();
      handler = null;
    }
    document.body.style.cursor = '';
    showInfoPanel.value = false;
  }
}

/* 触发暴雨信息弹窗 */
function onMapClick(movement){
  if (!rainMode.value) return;
  console.log(123)
  const ray = viewer.camera.getPickRay(movement.position);
  const cartesian = viewer.scene.globe.pick(ray, viewer.scene);
  selectedEntityPosition = calculatePosition(movement.position);
  setTimeout(() => {
    updatePopupPosition();
  }, 10);
  if (cartesian) {
    const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
    const longitude = Cesium.Math.toDegrees(cartographic.longitude);
    const latitude = Cesium.Math.toDegrees(cartographic.latitude);
    selectedPosition = { longitude, latitude, cartesian };
    showInfoPanel.value = true;
    viewer.screenSpaceEventHandler.setInputAction(movement => {
      // 如果时间线弹窗或路由弹窗可见，则更新弹窗位置
      if (eqCenterPanelVisible || rainCenterPanelVisible.value || showBaseInfo.value || showInfoPanel.value) {
        updatePopupPosition();
      }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
  }
}

/* 显示雷达图开关 */
function radars() {
  if (showRadarSatelliteMap.value) {
    // 隐藏卫星云图
    console.log(123)
    if (radarSatelliteEntity) {
      console.log(234)
      viewer.entities.remove(radarSatelliteEntity);
      timeLineRef.value.stopPlayback() // 清除时间轴的Interval
      radarSatelliteEntity = null;
      timeLabels = []
    }
    showRadarSatelliteMap.value = false;
  } else {
    showRadarSatelliteMap.value = true;
    new Promise((resolve) => {
      radarData()
      resolve()
    }).then(() => {
      viewer.entities.remove(radarSatelliteEntity);
      addRadarSatelliteEntity(radarImages[0])
    })
  }
}

/* 获取雷达时间轴时间和图片 */
function radarData() {
  getRadarData().then(res => {
    let data = res.data
    data.forEach(item => {
      let d = new Date(item.obsdate);
      let pad = n => n.toString().padStart(2, '0');
      // let alltime =`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
      let time = `${pad(d.getHours())}:${pad(d.getMinutes())}`
      // console.log(time);
      // that.radarImages.push()   图片在这添加
      timeLabels.push(time)
    })
    timeLabels.reverse()
    console.log(timeLabels, 'radardata')
  })
  // this.timeLabels = getRadarData()
}

/* 添加雷达云图 */
function addRadarSatelliteEntity(url) {
  // 提供的坐标点 - 最大和最小经纬度
  const minCoord = [106.3416, 32.2755] // [经度, 纬度]
  const maxCoord = [111.603, 36.6143]  // [经度, 纬度]

  // 从最大最小坐标计算矩形的四个顶点
  const rectanglePoints = [
    [minCoord[0], minCoord[1]],  // 左下角
    [maxCoord[0], minCoord[1]],  // 右下角
    [maxCoord[0], maxCoord[1]],  // 右上角
    [minCoord[0], maxCoord[1]],  // 左上角
    [minCoord[0], minCoord[1]]   // 闭合多边形，回到起点
  ]

  // 将经纬度转换为Cesium的Cartesian3坐标
  const positions = rectanglePoints.map(point => {
    return Cesium.Cartesian3.fromDegrees(point[0], point[1], 0) // 高度5000米
  })

  let radarPolygon = new Cesium.Entity({
    name: '雷达云图覆盖区域',
    polygon: {
      hierarchy: new Cesium.PolygonHierarchy(positions),
      // 使用图片作为多边形材质
      material: new Cesium.ImageMaterialProperty({
        image: url,
        transparent: true, // 若图片有透明通道，需开启
        repeat: new Cesium.Cartesian2(1, 1) // 图片在多边形内不重复，完整显示
      }),
      // 红色区域边框，加粗以突出显示范围
      outline: true,
      outlineColor: Cesium.Color.RED,
      outlineWidth: 4,
      // 半透明红色填充，清晰展示区域
      fill: true,
      // material: Cesium.Color.RED.withAlpha(0.2),
      zIndex: -99 // 层级，确保在其他图层上方
    }
  })

  // 将实体添加到视图中
  radarSatelliteEntity = viewer.entities.add(radarPolygon);
  // 视角定位到雷达区域
  // this.viewer.zoomTo(this.viewer.entities, new Cesium.HeadingPitchRange(0, -0.5, 100000))
}

/* 子组件传输雷达云图数据的index */
function radarIndex(index) {
  console.log(index, "radarsIndex");
  viewer.entities.remove(radarSatelliteEntity);
  addRadarSatelliteEntity(radarImages[index])
}

/* 子组件调用父组件的天气效果 */
function handleWeather() {
  console.log("handleWeather")
  // 标记后自动开启下雨效果
  weatherActive = true;
  rainEffect.enabled = weatherActive;

  rainMode.value = false;

  if (handler) {
    handler.destroy();
    handler = null;
  }
  document.body.style.cursor = '';
}

/* 细细看 */
function handleHiddenDisasterPointUpdate(probabilityPoints) {
  matchedHiddenHighlightEntities = probabilityPoints;
  // 清空表格数据
  dataTypeHiddenDisaster.type1.data = [];
  dataTypeHiddenDisaster.type2.data = [];
  dataTypeHiddenDisaster.type3.data = [];
  dataTypeHiddenDisaster.type4.data = [];
  dataTypeHiddenDisaster.type5.data = [];
  // 初始化一个临时对象用于统计每个区县的灾害数据
  const districtStats = {};

  // 风险区数据，滑坡数据，泥石流数据
  probabilityPoints.forEach((item) => {
    console.log(item, "probabilityPoints.forEach")
    switch (item.disasterType) {
      case "滑坡":
        dataTypeHiddenDisaster.type1.data.push({
          field1: item.geologicalDisasterHideDTO.disasterName,
          field2: item.geologicalDisasterHideDTO.position,
          field3: item.geologicalDisasterHideDTO.scaleGrade,
          field4: item.geologicalDisasterHideDTO.riskGrade,
          field5: item.geologicalDisasterHideDTO.lon,
          field6: item.geologicalDisasterHideDTO.lat,
        });
        break;
      case "泥石流":
        dataTypeHiddenDisaster.type2.data.push({
          field1: item.geologicalDisasterHideDTO.disasterName,
          field2: item.geologicalDisasterHideDTO.position,
          field3: item.geologicalDisasterHideDTO.scaleGrade,
          field4: item.geologicalDisasterHideDTO.riskGrade,
          field5: item.geologicalDisasterHideDTO.lon,
          field6: item.geologicalDisasterHideDTO.lat,
        });
        break;
      case "内涝":
        dataTypeHiddenDisaster.type3.data.push({
          field1: item.geologicalDisasterHideDTO.disasterName,
          field2: item.geologicalDisasterHideDTO.position,
          field3: item.geologicalDisasterHideDTO.scaleGrade,
          field4: item.geologicalDisasterHideDTO.riskGrade,
          field5: item.geologicalDisasterHideDTO.lon,
          field6: item.geologicalDisasterHideDTO.lat,
        })
        break;
      case "山洪":
        dataTypeHiddenDisaster.type4.data.push({
          field1: item.geologicalDisasterHideDTO.disasterName,
          field2: item.geologicalDisasterHideDTO.position,
          field3: item.geologicalDisasterHideDTO.scaleGrade,
          field4: item.geologicalDisasterHideDTO.riskGrade,
          field5: item.geologicalDisasterHideDTO.lon,
          field6: item.geologicalDisasterHideDTO.lat,
        })
        break;
      default:
        dataTypeHiddenDisaster.type5.data.push({
          field1: item.geologicalDisasterHideDTO.disasterName,
          field2: item.geologicalDisasterHideDTO.position,
          field3: item.geologicalDisasterHideDTO.inspectorName,
          field4: item.geologicalDisasterHideDTO.inspectorTele,
          field5: item.geologicalDisasterHideDTO.lon,
          field6: item.geologicalDisasterHideDTO.lat,
        });
    }

    // 获取区县名称
    const district = item.geologicalDisasterHideDTO.county;
    // 获取灾害类型
    const disasterType = item.disasterType;
    // 获取风险等级（默认取第一个等级）
    const level = item.level && item.level.length > 0 ? item.level[0] : '中'; // 默认中级

    // 如果该区县还没有统计数据，初始化
    if (!districtStats[district]) {
      districtStats[district] = {
        district: district,
        disasters: [
          { type: '滑坡', '高': 0, '中': 0, '低': 0 },
          { type: '泥石流', '高': 0, '中': 0, '低': 0 },
          { type: '山洪', '高': 0, '中': 0, '低': 0 },
          { type: '内涝', '高': 0, '中': 0, '低': 0 }
        ]
      };
    }
    // 找到对应的灾害类型对象并增加相应级别的计数
    const disasterItem = districtStats[district].disasters.find(d => d.type === disasterType);
    if (disasterItem) {
      // 确保等级是合法的（高、中、低）
      if (['高', '中', '低'].includes(level)) {
        disasterItem[level]++;
      } else {
        // 未知等级默认计入中级
        disasterItem['中']++;
      }
    } else if (disasterType) {
      // 处理可能存在的其他灾害类型
      districtStats[district].disasters.push({
        type: disasterType,
        '高': level === '高' ? 1 : 0,
        '中': level === '中' ? 1 : 0,
        '低': level === '低' ? 1 : 0
      });
    }
  });
  // 统计结果转换为数组格式
  districtDisasterData = Object.values(districtStats);
  showLegend = !showLegend;
}

/* 加载河流图层数据 */
function loadRiverData() {
  if (!riverData) {
    console.error('河流GeoJSON数据加载失败');
    return;
  }
  isLoading.value = true;
  loadingText.value = '加载河流数据...';

  // 使用Cesium原生GeoJsonDataSource加载
  riverDataSource = new Cesium.GeoJsonDataSource();

  // 配置加载选项
  riverDataSource.load(riverData, {
    enableFeatureStyles: false, // 禁用默认样式，使用自定义样式
    clampToGround: true,
    suppressPointLabels: true
  }).then(() => {
    isLoading.value = false;
    configureRiverStyles(); // 配置河流样式
    viewer.dataSources.add(riverDataSource);

    // 定位到河流区域
    viewer.zoomTo(riverDataSource);
  }).catch(error => {
    isLoading.value = false;
    console.error('加载河流数据失败:', error);
  });
}

/* 河流图层样式 */
function configureRiverStyles() {
  if (!riverDataSource) return;

  const entities = riverDataSource.entities.values;

  entities.forEach(entity => {
    // 获取属性
    const properties = entity.properties || {};
    const name = properties.NAME || `河流${entity.id}`;

    // 河流样式：蓝色半透明填充
    entity.polygon = {
      hierarchy: entity.polygon.hierarchy,
      material: new Cesium.Color(85 / 255, 130 / 255, 253 / 255, 0.65), // 浅蓝色
      outline: true,
      outlineColor: Cesium.Color.DARKBLUE, // 保持边框颜色不变
      outlineWidth: 1,
      show: false,
      fill: true,
      shadow: true,
      depthFailMaterial: new Cesium.Color(0, 0, 0, 0.2)
    };

    // 河流标签样式
    entity.label = {
      text: name,
      font: '12px sans-serif',
      fillColor: Cesium.Color.WHITE,
      backgroundColor: new Cesium.Color(0, 0, 1, 0.7), // 蓝色背景
      padding: new Cesium.Cartesian2(5, 5),
      showBackground: true,
      verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
      pixelOffset: new Cesium.Cartesian2(0, 10),
      heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
      show: false // 初始隐藏，通过toggleRiverLayer控制
    };
  });
}

/* 加载湖泊图层数据 */
function loadLakeData() {
  if (!lakeData) {
    console.error('湖面GeoJSON数据加载失败');
    return;
  }
  isLoading.value = true;
  loadingText = '加载湖面数据...';

  lakeDataSource = new Cesium.GeoJsonDataSource();
  lakeDataSource.load(lakeData, {
    enableFeatureStyles: false,
    clampToGround: true,
    suppressPointLabels: true
  }).then(() => {
    isLoading.value = false;
    configureLakeStyles();
    viewer.dataSources.add(lakeDataSource);
    // 定位到湖面区域
    viewer.zoomTo(lakeDataSource);
  }).catch(error => {
    isLoading.value = false;
    console.error('加载湖面数据失败:', error);
  });
}

/* 配置湖面样式 */
function configureLakeStyles() {
  if (!lakeDataSource) return;
  const entities = lakeDataSource.entities.values;
  entities.forEach(entity => {
    const properties = entity.properties || {};
    const name = properties.NAME || `湖面${entity.id}`;

    // 湖面样式：浅蓝色半透明填充
    entity.polygon = {
      hierarchy: entity.polygon.hierarchy,
      material: new Cesium.Color(85 / 255, 130 / 255, 253 / 255, 0.65), // 浅蓝色
      outline: true,
      outlineColor: Cesium.Color.DARKBLUE, // 保持边框颜色不变
      outlineWidth: 1,
      show: false,
      fill: true,
      shadow: true,
      depthFailMaterial: new Cesium.Color(0, 0, 0, 0.2)
    };

    // 湖面标签样式
    entity.label = {
      text: name,
      font: '12px sans-serif',
      fillColor: Cesium.Color.WHITE,
      backgroundColor: new Cesium.Color(0, 191, 255, 0.7), // 浅蓝色背景
      padding: new Cesium.Cartesian2(5, 5),
      showBackground: true,
      verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
      pixelOffset: new Cesium.Cartesian2(0, 10),
      heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
      show: false // 初始隐藏
    };
  });
}

/* 结束页面时释放所有 */
function releaseAllResources() {
  // 1. 清理Cesium核心资源
  if (viewer) {
    // 移除所有实体
    viewer.entities.removeAll();
    // 移除所有数据源
    viewer.dataSources.removeAll();
    // 移除所有图元
    viewer.scene.primitives.removeAll();
    // 移除所有 imagery图层
    viewer.imageryLayers.removeAll();
    // 销毁viewer实例
    viewer.destroy();
    viewer = null;
  }

  // 2. 清理定时器和动画帧
  // this.timers.forEach(id => {
  //   if (typeof id === 'number') {
  //     clearInterval(id);
  //     clearTimeout(id);
  //   } else {
  //     cancelAnimationFrame(id);
  //   }
  // });
  // this.timers = [];

  // 3. 清理事件监听
  // if (this.clickHandler) {
  //   this.clickHandler.destroy();
  //   this.clickHandler = null;
  // }
  // if (this.handler) {
  //   this.handler.destroy();
  //   this.handler = null;
  // }
  // document.removeEventListener('keydown', this.onKeyDown);
  // if (this.viewer?.camera?.moveEnd) {
  //   this.viewer.camera.moveEnd.removeEventListener(this.handleCameraMoveEnd);
  // }

  // 4. 清理自定义数据结构
  // this.rainPoints = [];
  // this.entityCache.clear(); // 清空实体缓存

  // 5. 清理DOM元素
  // const rainControl = document.getElementById('rain-control-panel');
  // if (rainControl) rainControl.remove();
  // const legend = this.$refs.legendContent;
  // if (legend) legend.innerHTML = '';

  // 6. 强制垃圾回收（浏览器环境下触发）
  if (window.gc) {
    try {
      window.gc();
    } catch (e) {
      console.log('触发垃圾回收失败:', e);
    }
  }

  console.log('所有资源已释放');
}

/* 行政区划按钮 */
function toggleAdminLayer() {
  showAdminLayer = !showAdminLayer;
  if (showAdminLayer) {
    basicLayers.loadAdminData()
  } else {
    basicLayers.removeAdminData()
  }
}

async function downloadRainReport(){
  loadingModel.value = true
  // 1. 截三维画布
  const canvas3D = viewer.scene.canvas

  // 2. 截图例 DOM
  const legendEl = legendRef.value.$el
  const legendCanvas = await html2canvas(legendEl, {
    backgroundColor: null, // 透明
    useCORS: true,
    scale: 1
  })

  // 3. 合并两个 canvas
  const finalCanvas = document.createElement('canvas')
  finalCanvas.width = canvas3D.width
  finalCanvas.height = canvas3D.height
  const ctx = finalCanvas.getContext('2d')

  // 三维场景
  ctx.drawImage(canvas3D, 0, 0)
  // 图例放右下角（可改）
  ctx.drawImage(
      legendCanvas,
      finalCanvas.width - legendCanvas.width - 20,
      finalCanvas.height - legendCanvas.height - 20
  )

  // 4. 转成 blob 并上传
  finalCanvas.toBlob(async blob => {
    const formData = new FormData()
    formData.append('file', blob, 'cesium_with_legend.png')

    // ✅ 正确解析 fetch 返回的 JSON
    // const response = await saveCanvas(formData)
    // const res = await response.json() // 关键：这里也要 await
    // const imgUrl = res.data
    // console.log(imgUrl, "imgUrl")

    // ✅ 生成 Word
    // const wordRes = await generateRainReport(imgUrl)
    const wordRes = await generateRainReport("1")
    console.log(wordRes, "wordRes")
    const wordUrl = wordRes.data

    // ✅ 触发下载
    const link = document.createElement('a');
    // link.href = 'http://10.22.245.246:8080/downloadReport/file/' + wordUrl;
    link.href = 'http://localhost:8080/downloadReport/file/' + wordUrl;
    link.download = wordUrl;                         // 强制触发下载
    link.click();

    loadingModel.value = false
  }, 'image/png', 1.0)
}

</script>

<style scoped>
.cesium-container {
  width: 100%;
  height: calc(100vh - 50px);
  padding: 0;
  margin: 0;
  position: relative;
  overflow: hidden;
}
.rain-btn-group {
  width: 100%;
  height: 65px;
  position: absolute;
  bottom: 0px;
  background-color: rgba(255, 255, 255, 0.5);
  color: black;
  z-index: 1000;
  display: flex;
  align-items: center;
}
.btn-group {
  display: flex;
  gap: 25px;
  margin-left: 20px;
}
.rain-btn,
.weather-btn,
.admin-btn,
.table-btn {
  background-color: rgb(60 134 255);
  color: white;
  padding: 12px 12px;
  border-radius: 12px;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.3s;
  white-space: nowrap;
  min-width: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
