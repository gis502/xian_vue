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
       @passRainId="(value)=>{rainDisasterId = value}"
       @update:show-info-panel="(value)=>{showInfoPanel = value}"
       @update:loading-model="(value)=>{loadingModel = value}"
       @update:handleWeather="handleWeather"
       @update:matched-huapo-entities="handleHiddenDisasterPointUpdate"
       @update:update-rain-info="(value)=>rainInfo = value"
       @update:handle-step-status="(value)=>{stepStatus = value}"
       @update:handle-step-status-chain="(value)=>{stepStatus = value.status;stepChain = value.chain}"
       @update:handle-rain-cancel = "showStep=false"
       @update:handle-setId = "(v)=>{rainId=v.data.rainId;rainQueueId=v.data.rainQueueId}"
    />

    <div v-if="selectedEntityData" class="disaster-popup" :style="{
        left: `${calculatePopupLeft()}px`,
        top: `${calculatePopupTop()}px`,
        display: popupVisible ? 'block' : 'none',
        opacity: popupVisible ? '1' : '0',
        transform: popupVisible ? 'scale(1)' : 'scale(0.5)'
      }" @click.stop="stopPropagation">
      <div class="popup-header">
        <h3 v-if="selectedEntityData.properties.teamName">{{ selectedEntityData.properties.teamName || '消防站' }} </h3>
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

    <rainCenterPanel v-show="rainCenterPanelVisible" :position="PanelPosition" :popupData="PanelData" />

    <HiddenDisasterPanel v-if="showBaseInfo" :title="baseInfoTitle" :position="PanelPosition"
                         :showDisasterInformation="showDisasterInformation" :dataTypeHiddenDisaster="dataTypeHiddenDisaster"
                         :disasterInformation="disasterInformation" :showdebrisFlowInformation="showdebrisFlowInformation"
                         :debrisFlowInformation="debrisFlowInformation" :showRiskPointsInformation="showRiskPointsInformation"
                         :riskPointsInformation="riskPointsInformation" :showWaterDisasterInformation="showWaterDisasterInformation"
                         :waterDisasterInformation="waterDisasterInformation" :showFloodDisasterInformation="showFloodDisasterInformation"
                         :floodDisasterInformation="floodDisasterInformation" :trigger="'暴雨'" :rainInfo="rainInfo" />

    <Legend ref="legendRef" />

    <TimeLine :timeDate="timeLabels" v-if="showRadarSatelliteMap" ref="timeLineRef" @radarIndex="radarIndex" />

    <div class="rain-btn-group">
      <div class="rain-step" v-if="showStep">
        <el-steps :active="stepStatus" finish-status="success" simple style="margin-top: 0px;background-color: #ffffff00;">
          <el-step title="暴雨触发" />
          <el-step title="模型计算"  />
          <el-step title="灾害预警"  />
          <el-step :title="stepChain"  />
<!--          、暴雨-泥石流、暴雨-山洪、暴雨-内涝-->
        </el-steps>
      </div>
      <div class="btn-group">
        <div class="rain-btn" @click="toggleRainMode">
          暴雨触发
        </div>
        <div class="weather-btn" @click="radars">
          卫星云图
        </div>
        <div class="admin-btn" @click="toggleAdminLayer">
          行政区划
        </div>
        <div class="table-btn" @click="showRiskTable = !showRiskTable">
          信息表格
        </div>
        <div class="table-btn" @click="downloadRainReport">
          报告下载
        </div>
        <div class="table-btn" @click="refreshComponent">
          场景重置
        </div>
        <!--        <div>-->
        <!--          <button class="table-btn " style="border: none;" @click="toggleFactorPanel">致灾因子信息</button>-->
        <!--        </div>-->
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
import { ElMessage } from 'element-plus'
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
import { getRadarData,impactInsert } from '@/api/system/rainModel.js'
import { saveCanvas, generateRainReport } from '@/api/system/reportDownLoad.js'
/* 读取数据 */
import riverData from '@/assets/static/json/river.json';
import lakeData from '@/assets/static/json/lake.json';
import rainCenterPanel from "@/components/Panel/rainCenterPanel.vue";
import HiddenDisasterPanel from "@/components/Panel/HiddenDisasterPanel.vue";
import {getAffectPoint, getPolieJiao} from "@/api/earthquake/hazards.js";
import * as WKT from "wkt";
import landslide_surface01 from "@/assets/images/landslide_surface01.jpg";

let viewer = null
let rainEffect = null
let setRainIntensity = null
let eqCenterPanelVisible = false
let matchedHiddenHighlightEntities = []
let handler = null
let radarSatelliteEntity = null
// let dimensions =  ['grade', '高', '中', '低']
let dimensions =  ['grade', '高', '中']
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
let popupVisible = ref(false)
let stepStatus = ref(0)
let stepChain = ref("暴雨灾害链")
let showStep = ref(false)
let fenXiFanWei = ref([])
let rainId = ref("")
let rainQueueId = ref("")
let rainDisasterId = ref(null)

let selectedEntityData = reactive(null)
let selectedEntityPosition = reactive(null)
let popupPosition = reactive({x: 0, y: 0})
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
      name: "内涝预警点",
      value: "type3",
    },
    {
      name: "山洪",
      value: "type4",
    },
    // {
    //   name: "农作物数据",
    //   value: "type5",
    // },
    // {
    //   name: "管网数据",
    //   value: "type6",
    // },
    // {
    //   name: "道路数据",
    //   value: "type7",
    // },
    // {
    //   name: "高速数据",
    //   value: "type8",
    // },
    // {
    //   name: "水库数据",
    //   value: "type9",
    // },
    // {
    //   name: "桥梁数据",
    //   value: "type10",
    // }
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
  // type5: {
  //   headers: ["区县", "小麦", "水稻", "玉米"],
  //   data: [],
  // },
  // type6: {
  //   headers: ["区县", "预留位置"],
  //   data: [],
  // },
  // type7: {
  //   headers: ["道路名称", "起点名称", "终点名称"],
  //   data: [],
  // },
  // type8: {
  //   headers: ["高速名称", "高速长度"],
  //   data: [],
  // },
  // type9: {
  //   headers: ["水库名称", "位置"],
  //   data: [],
  // },
  // type10: {
  //   headers: ["桥梁名称", "位置", "类型"],
  //   data: [],
  // }
})
let districtDisasterData =  reactive([
  {
    district: '',
    disasters: [
      // { type: '滑坡', '高': 0, '中': 0, '低': 0 },
      // { type: '泥石流', '高': 0, '中': 0, '低': 0 },
      // { type: '山洪', '高': 0, '中': 0, '低': 0 },
      // { type: '内涝', '高': 0, '中': 0, '低': 0 }
      { type: '滑坡', '高': 0, '中': 0},
      { type: '泥石流', '高': 0, '中': 0},
      { type: '山洪', '高': 0, '中': 0},
      { type: '内涝', '高': 0, '中': 0}
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
          // console.log(entity, "拾取entity")
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
  stepStatus.value = 1
  showStep.value = true
  // 若不允许标记且当前为开启状态，则直接关闭
  if (rainMode.value) {
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

/* 返回弹窗位置 */
function calculatePopupLeft() {
  return popupPosition.x;
}

/* 计算弹出面板上坐标（带过渡动画） */
function calculatePopupTop() {
  return popupPosition.y;
}

// 阻止事件冒泡
function stopPropagation(e) {
  e.stopPropagation();
}

/* 关闭弹窗 */
function closePopup() {
  popupVisible.value = false;
  selectedEntityData = null;
}

/* 显示雷达图开关 */
function radars() {
  if (showRadarSatelliteMap.value) {
    // 隐藏卫星云图
    if (radarSatelliteEntity) {
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
      // that.radarImages.push()   图片在这添加
      timeLabels.push(time)
    })
    timeLabels.reverse()
    // console.log(timeLabels, 'radardata')
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
  // console.log(index, "radarsIndex");
  viewer.entities.remove(radarSatelliteEntity);
  addRadarSatelliteEntity(radarImages[index])
}

/* 子组件调用父组件的天气效果 */
function handleWeather() {
  // console.log("handleWeather")
  // 标记后自动开启下雨效果
  weatherActive.value = true;
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
  // dataTypeHiddenDisaster.type5.data = [];
  // 初始化一个临时对象用于统计每个区县的灾害数据
  const districtStats = {};

  let list = []
  // console.log(probabilityPoints)
  // 风险区数据，滑坡数据，泥石流数据
  probabilityPoints.forEach((item) => {
    // console.log(item, "probabilityPoints.forEach")
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
        // dataTypeHiddenDisaster.type5.data.push({
        //   field1: item.geologicalDisasterHideDTO.disasterName,
        //   field2: item.geologicalDisasterHideDTO.position,
        //   field3: item.geologicalDisasterHideDTO.inspectorName,
        //   field4: item.geologicalDisasterHideDTO.inspectorTele,
        //   field5: item.geologicalDisasterHideDTO.lon,
        //   field6: item.geologicalDisasterHideDTO.lat,
        // });
    }
    // console.log(item.entityId)
    // 获取区县名称
    const district = item.geologicalDisasterHideDTO.county;
    // console.log(district,"district")
    // 获取灾害类型
    const disasterType = item.disasterType;
    // console.log(disasterType,"disasterType")

    // 获取风险等级（默认取第一个等级）
    const level = item.level && item.level.length > 0 ? item.level[0] : '中'; // 默认中级
    // console.log(level,"level")

    // 如果该区县还没有统计数据，初始化
    if (!districtStats[district]) {
      districtStats[district] = {
        district: district,
        disasters: [
          // { type: '滑坡', '高': 0, '中': 0, '低': 0 },
          // { type: '泥石流', '高': 0, '中': 0, '低': 0 },
          // { type: '山洪', '高': 0, '中': 0, '低': 0 },
          // { type: '内涝', '高': 0, '中': 0, '低': 0 }
          { type: '滑坡', '高': 0, '中': 0},
          { type: '泥石流', '高': 0, '中': 0},
          { type: '山洪', '高': 0, '中': 0},
          { type: '内涝', '高': 0, '中': 0}
        ]
      };
    }
    // console.log(districtStats,123)
    // if(!list.includes(disasterType)){
    //   list.push(disasterType)
    // }
    // 找到对应的灾害类型对象并增加相应级别的计数
    const disasterItem = districtStats[district].disasters.find(d => d.type === disasterType);
    if (disasterItem) {
      // 确保等级是合法的（高、中、低）
      if (['高', '中', '低'].includes(level)) {
        disasterItem[level]++;
        /* 灾害链类型 */
        if(level==='高'||level==='中'){
          fenXiFanWei.value.push(item)
          if(!list.includes(disasterType)){
            list.push(disasterType)
          }
        }
      } else {
        // 未知等级默认计入中级
        // disasterItem['低']++;
      }
    } else if (disasterType) {
      // 处理可能存在的其他灾害类型
      districtStats[district].disasters.push({
        type: disasterType,
        '高': level === '高' ? 1 : 0,
        '中': level === '中' ? 1 : 0,
        // '低': level === '低' ? 1 : 0
      });
    }
  });
  // console.log(districtStats,123)
  // 统计结果转换为数组格式
  districtDisasterData = Object.values(districtStats);
  showLegend.value = !showLegend.value;

  console.log(fenXiFanWei,"fenXiFanWei")
  let impactAreaRequest = []
  new Promise((resolve, reject)=>{
    fenXiFanWei.value.forEach((item)=>{
      let lat = item.lat
      let lon = item.lon
      getPolieJiao({
        lat,
        lon
      }).then((res) => {
        //判别区县代码
        function getDistrictName(code) {
          switch (code) {
            case '610102': return '新城区';
            case '610103': return '碑林区';
            case '610104': return '莲湖区';
            case '610111': return '灞桥区';
            case '610112': return '未央区';
            case '610113': return '雁塔区';
            case '610114': return '阎良区';
            case '610115': return '临潼区';
            case '610116': return '长安区';
            case '610117': return '高陵区';
            case '610118': return '鄠邑区';
            case '610122': return '蓝田县';
            case '610124': return '周至县';
            default: return '未知区县';
          }
        }
        //批量处理
        function renderAllAffectedGeometries(viewer, data, typeColors = {}) {
          // 默认颜色配置
          const defaultColors = {
            roadList: Cesium.Color.RED,
            highwayList: Cesium.Color.YELLOW,
            bridgeList: Cesium.Color.BLUE,
            reservoirList: Cesium.Color.CYAN,
            waterPipeList: Cesium.Color.GREEN,
            // 可以继续添加其他类型...
          };

          // 定义需要跳过的列表类型
          const SKIP_LIST_TYPES = ['peopleList', 'cropsList']; // 可以扩展其他类型,现在不显示人口与农作物网格。
          // 合并用户自定义颜色
          const colors = { ...defaultColors, ...typeColors };
          // 遍历data中的所有属性
          Object.entries(data).forEach(([listName, items]) => {
            // 跳过空数组
            if (!Array.isArray(items) || items.length === 0 || SKIP_LIST_TYPES.includes(listName)) {
              return;
            }
            // 获取该类型的颜色，如果没有配置则使用随机颜色
            const color = colors[listName] || Cesium.Color.fromRandom({
              alpha: 0.7
            });
            // 遍历该类型的所有项目
            items.forEach((item, index) => {
              if (!item.pointGeom) {
                console.warn(`Item ${index} in ${listName} has no pointGeom property`);
                return;
              }
              try {
                // 渲染几何图形
                renderGeometryToCesium(viewer, item.pointGeom, {
                  color: color,
                  width: 10,
                });
              } catch (error) {
                console.error(`Error rendering ${listName}[${index}]:`, error);
              }
            });
          });
        }
        //渲染
        function renderGeometryToCesium(viewer, wktString, options = {}) {
          const geometry = WKT.parse(wktString);
          const { color = Cesium.Color.RED, width = 2 } = options;
          if (geometry.type === 'LineString') {
            // 渲染线
            const positions = geometry.coordinates.map(coord =>
                Cesium.Cartesian3.fromDegrees(coord[0], coord[1])
            );
            viewer.entities.add({
              polyline: {
                positions: positions,
                width: width,
                material: new Cesium.PolylineGlowMaterialProperty({
                  glowPower: 0.2,
                  color: color
                })
              }
            });
          }
          else if (geometry.type === 'MultiLineString') {
            // 多条线（每条线单独渲染）
            geometry.coordinates.forEach(lineCoords => {
              const positions = lineCoords.map(coord =>
                  Cesium.Cartesian3.fromDegrees(coord[0], coord[1])
              );
              viewer.entities.add({
                polyline: {
                  positions: positions,
                  width: width,
                  material: new Cesium.PolylineGlowMaterialProperty({
                    glowPower: 0.2,
                    color: color
                  })
                }
              });
            });
          }
          else if (geometry.type === 'MultiPolygon' || geometry.type === 'Polygon') {
            // 渲染多边形
            const polygons = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates;
            polygons.forEach(polygon => {
              const hierarchy = new Cesium.PolygonHierarchy(
                  polygon[0].map(coord =>
                      Cesium.Cartesian3.fromDegrees(coord[0], coord[1])
                  )
              );
              viewer.entities.add({
                polygon: {
                  hierarchy: hierarchy,
                  material: color.withAlpha(0.5),
                  outline: true,
                  outlineColor: color,
                  outlineWidth: width
                }
              });
            });
          }
          else if (geometry.type === 'Point') {
            // 渲染点
            viewer.entities.add({
              position: Cesium.Cartesian3.fromDegrees(
                  geometry.coordinates[0],
                  geometry.coordinates[1]
              ),
              point: {
                pixelSize: 10,
                color: color,
                outlineColor: Cesium.Color.WHITE,
                outlineWidth: 2
              }
            });
          }
          else {
            console.warn('Unsupported geometry type:', geometry.type);
          }
        }

        let request = {disasterId:"",type:"",polygon:[],entityId:"",county:""}
        let polygon = null
        const routePoints = [];
        const polylinePositions = []; // 用于存储折线点的数组
        const position = [];
        const bufferWidth = 20;
        routePoints.push(Cesium.Cartesian3.fromDegrees(lon, lat)); // 存储为Cesium.Cartesian3对象
        polylinePositions.push(lon, lat);
        for (let i = 1; i < res.data.length; i++) {
          routePoints.push(Cesium.Cartesian3.fromDegrees(res.data[i].centerLon, res.data[i].centerLat)); // 存储为Cesium.Cartesian3对象
          polylinePositions.push(res.data[i].centerLon, res.data[i].centerLat);
        }
        // 绘制原始点路线
        if (polylinePositions.length >= 4) { // 至少需要两个点（4个坐标值）才能绘制线
          window.viewer.entities.add({
            polyline: {
              positions: Cesium.Cartesian3.fromDegreesArray(polylinePositions),
              width: 20, // 线条宽度
              material: new Cesium.PolylineArrowMaterialProperty(Cesium.Color.YELLOW), // 使用箭头材质
              clampToGround: true // 贴地显示
            },
          });
        }
        // 绘制影响范围多边形（缓冲区）
        if (routePoints.length >= 1) { // 至少一个点才能考虑扇形或圆形

          // 将 generateSmoothBuffer 函数定义移动到此处，作为 loadLandSlide 的内部函数
          const generateSmoothBuffer = (routePoints, bufferWidth) => { // 移除 fanAngle 参数
            const interpolatedPoints = [];
            const segmentInterpolationCount = 50; // 每段插值点数
            // 如果只有一个点，直接生成圆形（360度扇形）
            if (routePoints.length === 1) {
              const centerPoint = routePoints[0];
              const radius = bufferWidth;
              const positions = [];
              const numSegments = 60; // 扇形分段数
              for (let k = 0; k <= numSegments; k++) {
                const angle = (k / numSegments) * 360; // 0到360度
                const radian = Cesium.Math.toRadians(angle);
                // 计算扇形边界点，使用更精确的地理坐标计算
                const cartographic = Cesium.Cartographic.fromCartesian(centerPoint);
                const longitude = cartographic.longitude + (radius / Cesium.Ellipsoid.WGS84.maximumRadius) * Math.sin(radian);
                const latitude = cartographic.latitude + (radius / Cesium.Ellipsoid.WGS84.maximumRadius) * Math.cos(radian);
                positions.push(Cesium.Cartesian3.fromRadians(longitude, latitude));
              }
              polygon = positions
              return new Cesium.PolygonHierarchy(positions);
            }
            // 处理多点路线的平滑缓冲区
            const leftPoints = [];
            const rightPoints = [];
            // 遍历所有线段，生成平滑缓冲区
            for (let j = 0; j < routePoints.length - 1; j++) { // 遍历到倒数第二个点
              const start = routePoints[j];
              const end = routePoints[j + 1];
              interpolatedPoints.push(start);
              for (let k = 1; k < segmentInterpolationCount; k++) {
                const ratio = k / segmentInterpolationCount;
                const interpolated = Cesium.Cartesian3.lerp(
                    start,
                    end,
                    ratio,
                    new Cesium.Cartesian3()
                );
                interpolatedPoints.push(interpolated);

              }
            }
            // 添加最后一个原始点
            interpolatedPoints.push(routePoints[routePoints.length - 1]);
            // 计算平滑的缓冲区边界点
            for (let j = 0; j < interpolatedPoints.length; j++) {
              const prev = j > 0 ? interpolatedPoints[j - 1] : interpolatedPoints[j];
              const next = j < interpolatedPoints.length - 1 ? interpolatedPoints[j + 1] : interpolatedPoints[j];
              const forwardVec = Cesium.Cartesian3.subtract(next, prev, new Cesium.Cartesian3());
              Cesium.Cartesian3.normalize(forwardVec, forwardVec);
              const normal = Cesium.Ellipsoid.WGS84.geodeticSurfaceNormal(interpolatedPoints[j], new Cesium.Cartesian3());
              const perpendicular = Cesium.Cartesian3.normalize(Cesium.Cartesian3.cross(normal, forwardVec, new Cesium.Cartesian3()), new Cesium.Cartesian3());
              const scaledPerpendicular = Cesium.Cartesian3.multiplyByScalar(
                  perpendicular,
                  bufferWidth,
                  new Cesium.Cartesian3()
              );
              const leftPoint = Cesium.Cartesian3.add(
                  interpolatedPoints[j],
                  scaledPerpendicular,
                  new Cesium.Cartesian3()
              );
              const rightPoint = Cesium.Cartesian3.subtract(
                  interpolatedPoints[j],
                  scaledPerpendicular,
                  new Cesium.Cartesian3()
              );
              leftPoints.push(leftPoint);
              rightPoints.push(rightPoint);
            }
            // 组合成闭合多边形：左侧点 + 右侧点（反向）
            const polygonPositions = [...leftPoints, ...rightPoints.reverse()];
            polygon = polygonPositions
            return new Cesium.PolygonHierarchy(polygonPositions);
          };
          //计算影响范围面的经纬度
          const AffectBuffer = (routePoints, bufferWidth) => {
            const initialPoint = [];
            // 如果只有一个点，直接生成圆形（360度扇形）
            if (routePoints.length === 1) {
              const centerPoint = routePoints[0];
              const radius = bufferWidth;
              const positions = [];
              const numSegments = 60; // 扇形分段数

              for (let k = 0; k <= numSegments; k++) {
                const angle = (k / numSegments) * 360; // 0到360度
                const radian = Cesium.Math.toRadians(angle);

                // 计算扇形边界点，使用更精确的地理坐标计算
                const cartographic = Cesium.Cartographic.fromCartesian(centerPoint);
                const longitude = cartographic.longitude + (radius / Cesium.Ellipsoid.WGS84.maximumRadius) * Math.sin(radian);
                const latitude = cartographic.latitude + (radius / Cesium.Ellipsoid.WGS84.maximumRadius) * Math.cos(radian);
                positions.push(Cesium.Cartesian3.fromRadians(longitude, latitude));
              }
              return new Cesium.PolygonHierarchy(positions);
            }

            const leftPoints1 = [];
            const rightPoints2 = [];

            // 遍历所有线段，生成平滑缓冲区
            for (let j = 0; j < routePoints.length - 1; j++) { // 遍历到倒数第二个点
              const start = routePoints[j];
              initialPoint.push(start);
            }
            // 添加最后一个原始点
            initialPoint.push(routePoints[routePoints.length - 1]);

            // 计算平滑的缓冲区边界点
            for (let q = 0; q < initialPoint.length; q++) {
              const prev1 = q > 0 ? initialPoint[q - 1] : initialPoint[q];
              const next1 = q < initialPoint.length - 1 ? initialPoint[q + 1] : initialPoint[q];

              const forwardVec1 = Cesium.Cartesian3.subtract(next1, prev1, new Cesium.Cartesian3());
              Cesium.Cartesian3.normalize(forwardVec1, forwardVec1);

              const normal1 = Cesium.Ellipsoid.WGS84.geodeticSurfaceNormal(initialPoint[q], new Cesium.Cartesian3());
              const perpendicular1 = Cesium.Cartesian3.normalize(Cesium.Cartesian3.cross(normal1, forwardVec1, new Cesium.Cartesian3()), new Cesium.Cartesian3());

              const scaledPerpendicular1 = Cesium.Cartesian3.multiplyByScalar(
                  perpendicular1,
                  bufferWidth,
                  new Cesium.Cartesian3()
              );

              const leftaffect = Cesium.Cartesian3.add(
                  initialPoint[q],
                  scaledPerpendicular1,
                  new Cesium.Cartesian3()
              );
              const rightaffect = Cesium.Cartesian3.subtract(
                  initialPoint[q],
                  scaledPerpendicular1,
                  new Cesium.Cartesian3()
              );
              leftPoints1.push(leftaffect);
              rightPoints2.push(rightaffect);
            }
            // 组合成闭合多边形：左侧点 + 右侧点（反向）
            const polygonAffect = [...leftPoints1, ...rightPoints2.reverse()];
            return new Cesium.PolygonHierarchy(polygonAffect);
          };
          // 调用新的平滑缓冲区生成方法
          const polygonHierarchy = generateSmoothBuffer(routePoints, bufferWidth);//绘制缓冲区
          const affrctPoint = AffectBuffer(routePoints, bufferWidth);//得到经纬度
          //坐标转换
          let ellipsoid=window.viewer.scene.globe.ellipsoid;
          for (let i=0;i<affrctPoint.positions.length;i++){
            let cartographic=ellipsoid.cartesianToCartographic(affrctPoint.positions[i]);
            let lat=Cesium.Math.toDegrees(cartographic.latitude);
            let lon=Cesium.Math.toDegrees(cartographic.longitude);
            let currentPoint = {
              lat: lat,
              lon: lon,
            };
            position.push(currentPoint);
          }
          //渲染影响点
          // fetchAndLogRoadList(position)

          // 如果成功创建了多边形顶点，则添加实体
          if (polygonHierarchy.positions.length > 0) {
            window.viewer.entities.add({
              polygon: {
                hierarchy: polygonHierarchy,
                // material: Cesium.Color.BLUE.withAlpha(0.3),
                material: new Cesium.ImageMaterialProperty({
                  image: landslide_surface01,
                  color: Cesium.Color.WHITE,
                  repeat: new Cesium.Cartesian2(4, 4),
                }),
                outline: true,
                outlineColor: Cesium.Color.BLUE,
                heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
              },
            });
          }
          // 如果是多点路线，单独为最后一个点绘制圆形缓冲区
          if (routePoints.length > 1) {
            const lastPoint = routePoints[routePoints.length - 1];
            const lastPointBufferRadius = bufferWidth; // 可以根据需要调整这个半径
            // const lastPointBufferRadius2 = bufferWidth_1;
            window.viewer.entities.add({
              position: lastPoint,
              ellipse: {
                semiMinorAxis: lastPointBufferRadius,
                semiMajorAxis: lastPointBufferRadius,
                material: new Cesium.ImageMaterialProperty({
                  image: landslide_surface01,
                  color: Cesium.Color.WHITE,
                  repeat: new Cesium.Cartesian2(4, 4),
                }),
                outline: true,
                outlineColor: Cesium.Color.BLUE,
                heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
              },

            });
          }
        }else {
          console.warn(`点路线点数不足，无法创建影响范围多边形，索引 ${i}`);
        }
        request.type = item.disasterType
        request.entityId = parseInt(item.entityId.split("点")[1])
        request.disasterId = rainDisasterId.value
        request.county = item.geologicalDisasterHideDTO.county

        // 将Cartesian3坐标转换为经纬度
        if (polygon && Array.isArray(polygon)) {
          const convertedPolygon = polygon.map(cartesian3Point => {
            // 使用Cesium的椭球体进行坐标转换
            const ellipsoid = window.viewer.scene.globe.ellipsoid;
            const cartographic = ellipsoid.cartesianToCartographic(cartesian3Point);
            return {
              lat: Cesium.Math.toDegrees(cartographic.latitude),
              lon: Cesium.Math.toDegrees(cartographic.longitude)
            };
          });
          request.polygon = convertedPolygon;
        } else {
          request.polygon = polygon; // 如果polygon不是数组，保持原值
        }

        impactAreaRequest.push(request)
        console.log(impactAreaRequest,"impactAreaRequest")
        if(impactAreaRequest.length===fenXiFanWei.value.length){
          resolve()
        }
      })
    })
  }).then(()=>{
    impactInsert(impactAreaRequest).then((res)=>{
      console.log(res)
    })
  })

  stepStatus.value = 4
  stepChain = "暴雨-"+list.join("、\n 暴雨-") + "灾害链"

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
  loadingText.value = '加载湖面数据...';

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
  if (viewer && !viewer.isDestroyed()) {
    try {
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
    } catch (error) {
      console.warn('清理 Cesium 资源时出错:', error)
    }
  }
  viewer = null;

  // 2. 清理事件处理器
  if (handler && !handler.isDestroyed()) {
    try {
      handler.destroy()
    } catch (error) {
      console.warn('清理事件处理器时出错:', error)
    }
  }
  handler = null

  // 3. 清理雨效
  if (rainEffect) {
    rainEffect = null
  }

  // 4. 清理数据源
  riverDataSource = null
  lakeDataSource = null
  radarSatelliteEntity = null
}

/* 行政区划按钮 */
function toggleAdminLayer() {
  showAdminLayer.value = !showAdminLayer.value;
  if (showAdminLayer.value) {
    basicLayers.loadAdminData()
  } else {
    basicLayers.removeAdminData()
  }
}

/* 刷新组件方法 */
async function refreshComponent(){
  try {
    // 显示加载状态
    loadingModel.value = true
    // loadingText.value = '正在刷新页面...'

    // 先停止所有可能的异步操作和事件监听
    if (handler) {
      handler.destroy()
      handler = null
    }

    // 移除所有事件监听器
    if (viewer && !viewer.isDestroyed()) {
      viewer.cesiumWidget.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK)
      viewer.cesiumWidget.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE)
    }

    // 清理所有资源
    releaseAllResources()

    // 重置所有状态变量
    resetAllStates()

    // 等待一小段时间确保资源清理完成
    await new Promise(resolve => setTimeout(resolve, 100))

    // 重新初始化
    viewer = initCesium("cesiumContainer")
    window.viewer = viewer

    // 确保 viewer 初始化完成后再调用 init
    await nextTick()
    init()

  } catch (error) {
    console.error('刷新组件时出错:', error)
  } finally {
    // 隐藏加载状态
    loadingModel.value = false
  }
}

/* 重置所有状态变量 */
function resetAllStates(){
  // 重置基本状态
  rainDisasterId.value = null
  baseInfoTitle.value = ""
  showBaseInfo.value = false
  rainMode.value = false
  rainCenterPanelVisible.value = false
  showDisasterInformation.value = false
  showdebrisFlowInformation.value = false
  showRiskPointsInformation.value = false
  showFloodDisasterInformation.value = false
  showWaterDisasterInformation.value = false
  showInfoPanel.value = false
  showRadarSatelliteMap.value = false
  showRiskTable.value = true
  showLegend.value = false
  weatherActive.value = false
  isLoading.value = false
  loadingText.value = '加载数据中...'
  showAdminLayer.value = true
  popupVisible.value = false
  stepStatus.value = 0
  showStep.value = false

  // 重置响应式对象 - 使用更安全的方式
  if (selectedEntityData) {
    Object.keys(selectedEntityData).forEach(key => {
      delete selectedEntityData[key]
    })
  }

  if (selectedEntityPosition) {
    Object.keys(selectedEntityPosition).forEach(key => {
      delete selectedEntityPosition[key]
    })
  }

  Object.assign(popupPosition, {x: 0, y: 0})
  Object.assign(PanelPosition, {x: 0, y: 0})

  // 清空对象
  Object.keys(PanelData).forEach(key => delete PanelData[key])

  // 重置为 null 的对象
  if (disasterInformation) {
    Object.keys(disasterInformation).forEach(key => delete disasterInformation[key])
  }
  if (debrisFlowInformation) {
    Object.keys(debrisFlowInformation).forEach(key => delete debrisFlowInformation[key])
  }
  if (riskPointsInformation) {
    Object.keys(riskPointsInformation).forEach(key => delete riskPointsInformation[key])
  }
  if (waterDisasterInformation) {
    Object.keys(waterDisasterInformation).forEach(key => delete waterDisasterInformation[key])
  }
  if (floodDisasterInformation) {
    Object.keys(floodDisasterInformation).forEach(key => delete floodDisasterInformation[key])
  }
  if (selectedPosition) {
    Object.keys(selectedPosition).forEach(key => delete selectedPosition[key])
  }

  // 清空数组
  timeLabels.splice(0)
  rainInfo.splice(0)

  // 重置数据类型
  dataTypeHiddenDisaster.type1.data.splice(0)
  dataTypeHiddenDisaster.type2.data.splice(0)
  dataTypeHiddenDisaster.type3.data.splice(0)
  dataTypeHiddenDisaster.type4.data.splice(0)
  // dataTypeHiddenDisaster.type5.data.splice(0)
  // dataTypeHiddenDisaster.type6.data.splice(0)
  // dataTypeHiddenDisaster.type7.data.splice(0)
  // dataTypeHiddenDisaster.type8.data.splice(0)
  // dataTypeHiddenDisaster.type9.data.splice(0)
  // dataTypeHiddenDisaster.type10.data.splice(0)

  // 重置灾害数据
  districtDisasterData.splice(0, districtDisasterData.length, {
    district: '',
    disasters: [
      // { type: '滑坡', '高': 0, '中': 0, '低': 0 },
      // { type: '泥石流', '高': 0, '中': 0, '低': 0 },
      // { type: '山洪', '高': 0, '中': 0, '低': 0 },
      // { type: '内涝', '高': 0, '中': 0, '低': 0 }
      { type: '滑坡', '高': 0, '中': 0,},
      { type: '泥石流', '高': 0, '中': 0, },
      { type: '山洪', '高': 0, '中': 0, },
      { type: '内涝', '高': 0, '中': 0,}
    ]
  })

  // 重置全局变量
  rainEffect = null
  setRainIntensity = null
  eqCenterPanelVisible = false
  matchedHiddenHighlightEntities = []
  radarSatelliteEntity = null
  riverDataSource = null
  lakeDataSource = null
}

/* 报告产出 */
async function downloadRainReport(){
  console.log(rainDisasterId.value)
  if(!rainDisasterId.value){
    ElMessage({
      message: '暂无报告，请先触发暴雨！',
      type: 'warning',
    })
    return;
  }
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
    console.log(rainDisasterId.value)
    let RainParams = {
      rainId: rainId.value,
      rainQueueId: rainQueueId.value,
      rainDisasterId:rainDisasterId.value
    }

    console.log(RainParams,"触发后的暴雨ID是，，，，，，，，，，")
    const wordRes = await generateRainReport(RainParams)
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
  /* overflow: hidden; */
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
.rain-step{
  position: absolute;
  height: 100%;
  width: 60%;
  top: 12px;
}
::v-deep .el-step__title.is-success{
  color: #52f700;
}
::v-deep .el-step__title.is-process{
  color: #FFFFFF;
}
::v-deep .el-step__title.is-wait{
  color: #FFFFFF;
}
::v-deep .el-step.is-simple .el-step__icon{
  border-color: #FFFFFF;
}
::v-deep .el-steps--simple{
  padding: 13px 3%;
}
::v-deep .el-step{
  max-width: 100% !important;
}
.btn-group {
  display: flex;
  flex-direction: row;   /*设置主轴方向是水平方向*/
  align-items: center;  /*设置侧轴上，子元素的排列方式为居中对齐*/
  gap: 5px;
  margin-left: 20px;
  position: absolute;
  right: 12px;
  top: 12px;
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
