<template>
  <div class="cesium-container" ref="cesiumContainer"
       v-loading="loadingModel"
       :element-loading-spinner="svg"
       element-loading-svg-view-box="-10, -10, 50, 50"
       element-loading-background="rgba(122, 122, 122, 0.8)">
    <!-- 功能按钮 -->
    <div class="controls">
      <div class="btn-group">
        <div class="rain-btn" @click="toggleRainMode">
          {{ rainMode ? '取消暴雨标记' : '标记暴雨点' }}
        </div>
        <div class="weather-btn" @click="toggleWeatherEffect" :class="{ 'disabled': rainMode }">
          {{ weatherActive ? '停止降雨' : '模拟降雨' }}
        </div>
        <div class="admin-btn" @click="toggleAdminLayer">
          {{ showAdminLayer ? '隐藏行政区划' : '显示行政区划' }}
        </div>
        <div class="table-btn" @click="toggleTablePanel">
          {{ showRiskTable ? '信息隐藏' : '信息展示' }}
        </div>
        <div class="table-btn" @click="downloadRainReport">
          报告下载
        </div>
      </div>
    </div>
    <div class="secondary-panel">
      <div class="panel-title1">控制显示</div>
      <div class="panel-content1">
        <label><input type="checkbox" v-model="showHospital" @change="toggleHospitalPoints" /> 显示医院 </label>
        <label><input type="checkbox" v-model="showDangerSource" @change="toggleDangerPoints"> 显示风险源 </label>
        <label><input type="checkbox" v-model="showShelter" @change="toggleShelterPoints"> 显示避难所 </label>
        <label><input type="checkbox" v-model="showFire" @change="toggleFirePoints"> 显示消防站 </label>
        <label><input type="checkbox" v-model="showStore" @change="toggleStorePoints"> 显示储备点 </label>
        <label><input type="checkbox" v-model="showPeople" @change="togglePeople"> 显示人口网格 </label>
        <label><input type="checkbox" v-model="showCrops" @change="toggleCrops"> 显示农田网格 </label>
        <label><input type="checkbox" v-model="showPipe" @change="toggleWaterPipe"> 显示管网系统 </label>
        <label><input type="checkbox" v-model="showRoad" @change="toggleRoad"> 显示交通道路 </label>
        <label><input type="checkbox" v-model="showBridge" @change="toggleBridge"> 显示桥梁 </label>
        <label><input type="checkbox" v-model="showHighway" @change="toggleHighway"> 显示高速 </label>
        <label><input type="checkbox" v-model="showNationalRoad" @change="toggleNationalRoad"> 显示国道 </label>
        <label><input type="checkbox" v-model="showReservoir" @change="toggleReservoir"> 显示水库 </label>
        <label><input type="checkbox" v-model="showSubway" @change="toggleSubway"> 显示地铁站 </label>
      </div>
    </div>
    <!-- 加载状态提示 -->
    <div v-if="isLoading" class="loading-indicator">
      {{ loadingText }}
    </div>
    <!-- 风险区表格 - 固定在左下角 -->
    <Table :show="showRiskTable" :dataTypes="dataTypeHiddenDisaster"></Table>
    <!--表格-->
    <Chart v-if="showChart" :chartDatas="chartDatas"></Chart>
    <!-- 暴雨信息面板 -->
    <div v-if="showInfoPanel" class="rain-info-panel">
      <div class="panel-title">暴雨信息</div>
      <div class="panel-content">
        <div class="form-item">
          <label class="jiangyuliang">降雨量:</label>
          <input v-model.number="rainfall" type="number" min="0" max="500" step="1"/>
          <span>毫米</span>
        </div>
        <div class="form-item">
          <label>持续时间:</label>
          <input v-model.number="duration" type="number" min="0" max="72" step="1"/>
          <span>小时</span>
        </div>
        <div class="button-group">
          <button @click="confirmRainPoint" :disabled="!rainfall || !duration" style="width: 80px">确认添加</button>
          <button @click="cancelRainPoint" style="width: 80px">取消</button>
        </div>
      </div>
    </div>
    <!-- 自定义弹出面板 -->
    <div
        v-if="selectedEntityData"
        class="disaster-popup"
        :style="{
    left: `${calculatePopupLeft()}px`,
    top: `${calculatePopupTop()}px`,
    display: popupVisible ? 'block' : 'none',
    opacity: popupVisible ? '1' : '0',
    transform: popupVisible ? 'scale(1)' : 'scale(0.5)'
  }"
        @click.stop="stopPropagation">
      <div class="popup-header">
        <h3 v-if="selectedEntityData.properties.teamName">{{ selectedEntityData.properties.teamName || '消防站' }} </h3>
        <h3 v-if="selectedEntityData.properties.hospitalName">{{ selectedEntityData.properties.hospitalName || '医院' }} </h3>
        <h3 v-if="selectedEntityData.properties.dangerName">{{ selectedEntityData.properties.dangerName || '风险源' }} </h3>
        <h3 v-if="selectedEntityData.properties.storeName">{{ selectedEntityData.properties.storeName || '储备点' }} </h3>
        <h3 v-if="selectedEntityData.properties.shelterName">{{ selectedEntityData.properties.shelterName || '避难所' }} </h3>
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
            <td>{{ selectedEntityData.properties.dangerName || "未知"}}</td>
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
            <td>{{selectedEntityData.properties.level}}</td>
          </tr>
          <tr v-if="selectedEntityData.properties.enterpriseType">
            <th>危险源类型</th>
            <td>{{selectedEntityData.properties.enterpriseType}}</td>
          </tr>
          <tr v-if="selectedEntityData.properties.teamType">
            <th>消防站类型</th>
            <td>{{ selectedEntityData.properties.teamType }}</td>
          </tr>
          <tr v-if="selectedEntityData.properties.storeType">
            <th>储备站类型</th>
            <td>{{ selectedEntityData.properties.storeType}}</td>
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
    <!-- 点击弹窗 -->
    <rainCenterPanel
        v-show="rainCenterPanelVisible"
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
        :trigger="'暴雨'"
        :rainfall="rainfall"
    />

    <Legend ref="legendRef"></Legend>
  </div>
</template>

<script>
import * as Cesium from 'cesium';
import html2canvas from 'html2canvas';
// 引入西安行政区划数据
import BaQiaoArea from '@/assets/static/area/BaQiao.json';
import BeiLin from '@/assets/static/area/BeiLin.json';
import ChangAn from '@/assets/static/area/ChangAn.json';
import GaoLing from '@/assets/static/area/GaoLing.json';
import HuYi from '@/assets/static/area/HuYi.json';
import LanTIan from '@/assets/static/area/LanTIan.json';
import LianHu from '@/assets/static/area/LianHu.json';
import LinTong from '@/assets/static/area/LinTong.json';
import WeiYang from '@/assets/static/area/WeiYang.json';
import XinCheng from '@/assets/static/area/XinCheng.json';
import YanLiang from '@/assets/static/area/YanLiang.json';
import YanTa from '@/assets/static/area/YanTa.json';
import ZhouZhi from '@/assets/static/area/ZhouZhi.json';
// 河流、湖面数据
import riverData from '@/assets/static/json/river.json';
import lakeData from '@/assets/static/json/lake.json';
// 引入滑坡，泥石流灾害点数据
import landslide_surface01 from '@/assets/images/landslide_surface01.jpg'
import landslide from '@/assets/landslide/landslide.json'
import dangerSourceIcon from "@/assets/images/gasstation.png"
import hospitalIcon from "@/assets/images/hospital.png"
import fireIcon from "@/assets/images/firefighter.png"
import storePointsIcon from "@/assets/images/storePoints.jpg"
import shelterIcon from "@/assets/images/emergencyShelter.png"
import {initCesium} from '@/cesium/initLayer.js'
import {useSimulationPointStore} from "@/store/earthquake/simulation_points.js";
// 图标
import riskArea from '@/assets/images/riskArea.png'
import debrisFlowIcon from '@/assets/images/DebrisFlow.png'
import landslideIcon from '@/assets/images/landslide.png'
import centerstar from "@/assets/icons/TimeLine/黄点点.png";
// api
import {
  getGeologicalDisasterHideByLandSlideList,
  getGeologicalDisasterHideByFlowList
} from '@/api/system/disasterHide.js'
import {saveCanvas, generateRainReport} from '@/api/system/reportDownLoad.js'
import {
  getGeologicalDisasterRiskList
} from '@/api/system/disasterRisk.js'
import {
  getFactorValueList
} from '@/api/system/factorValues.js'
import {
  rainSlideTrigger,
  rainSlideFactorUpdata
} from '@/api/system/rainModel.js'
import Chart from "../../components/Earthquake/Chart.vue";
import {reactive} from "vue";
//封装函数
import layers from "@/cesium/layers.js";
import basicLayers from "@/cesium/basicLayers.js";
//组件
import Legend from "@/components/Earthquake/Legend.vue";
import rainCenterPanel from "@/components/Panel/rainCenterPanel.vue";
import HiddenDisasterPanel from "@/components/Panel/HiddenDisasterPanel.vue";


import clickPointsAndShowPanel from "@/cesium/clickPointsAndShowPanel.js";
import Table from "@/components/Earthquake/Table.vue";
//获取其他点数据
import {
  getDangerous,
  getFire,
  getHospital,
  getShelter,
  getStore
} from "@/api/system/aroundanalysis.js";

export default {
  name: 'CesiumRainMap',
  components: {
    Chart,
    Legend,
    HiddenDisasterPanel,
    rainCenterPanel,
    Table
  },
  data() {
    return {
      geoUrl: '/geoserver/test/wms', //你的geoserverUrl,格式：/geoserver/工作空间名/wms
      peopleLayerName: 'test:xian_people', // 格式：工作空间名:图层名
      cropsLayerName: 'test:xian_crops',
      waterPipeLayerName: 'test:xian_water_pipe',
      roadLayerName: 'test:xian_road',
      bridgeLayerName: 'test:xian_bridge_points',
      highwayLayerName: 'test:xian_highway',
      nationalRoadLayerName: 'test:xian_national_road',
      reservoirLayerName: 'test:xian_reservoir_list',
      subwayLayerName: 'test:xian_subway',
      protectEntities: [],
      hospitalEntities: [],
      dangerEntities: [],
      dangerSourceEntities: [],
      storePointsEntities: [],
      saveTeamEntities: [],
      fireFighterEntities: [],
      shelterEntities: [],
      viewer: null,
      wmsLayers: [],
      tdtToken: "7f013d0186775b063d6a046977bbefc6",
      currentMapType: 0,
      rainMode: false,
      showInfoPanel: false,
      selectedPosition: null,
      rainfall: 0,
      duration: 2,
      rainPoints: [],
      weatherActive: false,
      showAdminLayer: true,
      rainEffect: null,
      adminDataSource: null,
      riverDataSource: null,
      lakeDataSource: null, // 湖面数据数据源
      dataSource: null,
      disasterDataSource: null, // 灾害点数据源
      // 行政区划数据
      administrationData: [BaQiaoArea, BeiLin, ChangAn, GaoLing, HuYi, LanTIan, LianHu, LinTong, WeiYang, XinCheng, YanLiang, YanTa, ZhouZhi],
      // adminDataSources: [],
      faultZoneList: [],
      // 河流数据
      riverData: riverData,
      lakeData: lakeData,
      // 灾害点数据
      HuapoData: [],
      NishiliuData: [],
      // faultZone: faultZone,
      DangerAreaData: [],
      DangerSourceData: null,//危险源数据
      HospitalData: null,
      FireFighterData: null,
      StorePointsData: null,
      ShelterData: null,
      peopleLayer: null,
      cropsLayer: null,
      waterPipeLayer: null,
      roadLayer: null,
      bridgeLayer: null,
      highwayLayer: null,
      nationalRoadLayer: null,
      reservoirLayer: null,
      subwayLayer: null,
      isLoading: false,
      loadingText: '加载数据中...',
      showHospital: false, // 控制医院显示/隐藏
      showDangerSource: false, // 控制风险源显示/隐藏
      showShelter: false, // 控制避难所显示/隐藏
      showFire: false, // 控制消防站显示/隐藏
      showStore: false, // 控制储备点显示/隐藏
      showPeople: false,
      showCrops: false,
      showPipe: false,
      showRoad: false,
      showBridge: false,
      showHighway: false,
      showNationalRoad: false,
      showReservoir: false,
      showSubway: false,
      // 暴雨影响区域椭圆相关配置
      // rainEllipseScale: 100, // 降雨量到椭圆半径的缩放系数
      // rainEllipseRotation: 70, // 椭圆默认旋转角度
      // districtColors: {}, // 存储各区县的颜色(图例)
      // showDisasterLayer: true, // 控制灾害点显示/隐藏
      // disasterStyleConfig: {
      //   '滑坡': {
      //     color: Cesium.Color.RED,
      //     pixelSize: 10,
      //     label: {
      //       text: '滑坡滑坡滑坡',
      //       font: '16px monospace',
      //       fillColor: Cesium.Color.RED,
      //       backgroundColor: Cesium.Color.WHITE.withAlpha(0.7),
      //       backgroundPadding: new Cesium.Cartesian2(5, 5),
      //       scale: 1.2
      //     }
      //   },
      //   '泥石流': {
      //     color: Cesium.Color.ORANGE,
      //     pixelSize: 10,
      //     label: {
      //       text: '泥石流泥石流',
      //       font: '16px monospace',
      //       fillColor: Cesium.Color.YELLOW,
      //       backgroundColor: Cesium.Color.BLACK.withAlpha(0.7),
      //       backgroundPadding: new Cesium.Cartesian2(5, 5),
      //       scale: 1.2
      //     }
      //   }
      // },
      clickHandler: null,
      layerHandler: null,
      landslidePoints: [],     // 滑坡点
      debrisFlowPoints: [],    // 泥石流点
      secondaryRiskPoints: [], // 次生灾害风险点
      dangerSourcePoints: [],
      hospitalPoints: [],
      fireFighterPoints: [],
      storePoints: [],
      shelterPoints: [],
      selectedEntityData: null,
      popupPosition: {x: 0, y: 0},
      popupVisible: false,
      lastPickedEntity: null,
      currentPage: 1,
      pageSize: 10,
      total: 0,
      loading: false,
      tableData: [],
      isExpanded: false, // 表格扩展状态，true为扩展，false为收缩
      isHazardFactorView: false,
      geologicalDisasterHideDTO: {
        disasterType: null,
        unitCode: null,
        fieldCode: null,
        disasterName: null,
        position: null,
        lon: null,
        lat: null,
        residentCounts: null,
        addressPopulation: null,
        riskProperty: '',
        permanentPopulation: null,
        housing: null,
        scaleGrade: null,
        riskGrade: null,
        inspectorName: null,
        inspectorTele: null,
      },
      formatAnalyzedData: null,
      formatUpdateAnalyzedData: null,
      formatUpdateAnalyzedDataList: null,
      timers: [],
      //---信息弹框---
      selectedEntityPosition: '', //拾取的点的弹框位置
      PanelPosition: {x: 0, y: 0}, // TimeLinePanel弹窗的位置
      PanelData: {}, // TimeLinePanel弹窗的数据
      eqCenterPanelVisible: false,
      rainCenterPanelVisible: false,
      baseInfoTitle: false,
      showDisasterInformation: false,
      showdebrisFlowInformation: false,
      showRiskPointsInformation: false,
      disasterInformation: null,
      debrisFlowInformation: null,
      riskPointsInformation: null,
      showBaseInfo: false,

      matchedHiddenHighlightEntities: [],
      loadingModel: false,

      dataTypeHiddenDisaster: {
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
      },
      showChart: false,
      chartDatas: {
        title: "暴雨灾害链",
        xAxis: {
          data: ["滑坡影响", "泥石流影响", "风险区影响"],
        },
        seriesDatas: [0, 0, 0],
      },

      //预警点表格显示隐藏
      showRiskTable: true,
    }
  },
  computed: {
    displayData() {
      const start = (this.currentPage - 1) * this.pageSize;
      const end = start + this.pageSize;
      return this.tableData.slice(start, end);
    }
  },

  mounted() {
    this.load();
    this.getNum();//从后端读取数据，异步
    basicLayers.loadAdminData(); // 加载行政区划数据
    basicLayers.loadLandSlide();
    basicLayers.Addmudslide();
    basicLayers.AddDangerAreaDataSource();
    basicLayers.loadAdminData();
    this.loadRiverData(); // 加载河流数据
    this.loadLakeData(); // 加载湖面数据
  },
  beforeDestroy() {
    this.releaseAllResources();
  },
  methods: {
    getNum(){
      //获取危险源点
      getDangerous().then((res)=>{
        this.DangerSourceData = res.data;
        // this.loadDangerSource();
      });
      //获取医院点
      getHospital().then((res)=>{
        this.HospitalData = res.data;
        // this.loadProtectTarget();
      })
      //获取消防站
      getFire().then((res)=>{
        this.FireFighterData = res.data;
        // this.loadSaveTeams();
      })
      //获取储备点
      getStore().then((res) =>{
        this.StorePointsData = res.data;
        // this.loadStorePoints();
      })
      //获取避难所
      getShelter().then((res) =>{
        this.ShelterData = res.data;
        // this.loadShelter();
      })
    },
    load() {
      const container = this.$refs.cesiumContainer;

      this.viewer = initCesium(container)
      this.viewer._cesiumWidget._creditContainer.style.display = "none";
      window.viewer = this.viewer

      this.viewer.camera.setView({
        destination: Cesium.Cartesian3.fromDegrees(108.93, 34.27, 300000),
        orientation: {
          heading: Cesium.Math.toRadians(0),
          pitch: Cesium.Math.toRadians(-90),
          roll: 0.0
        }
      });

      // 初始化下雨效果
      this.initRainEffect();
      document.addEventListener('keydown', this.onKeyDown);
      this.entitiesClickPonpHandler()
    },
    // 加载人口网格图层
    addPeopleLayer() {
      this.peopleLayer = this.viewer.imageryLayers.addImageryProvider(
          new Cesium.WebMapServiceImageryProvider({
            url: this.geoUrl,
            layers: this.peopleLayerName,
            parameters: {
              tiled: true,
              transparent: true,
              format: 'image/png',
              srs: 'EPSG:4490',
              version: '1.1.1',
            },
            flyTo: true,
            show: true,
          })
      );
      this.setupLayerClickHandler();
    },
    // 加载农作物网格
    addCropsLayer() {
      this.cropsLayer = this.viewer.imageryLayers.addImageryProvider(
          new Cesium.WebMapServiceImageryProvider({
            url: this.geoUrl,
            layers: this.cropsLayerName,
            parameters: {
              tiled: true,
              transparent: true,
              format: 'image/png',
              srs: 'EPSG:4490',
              version: '1.1.1',
            },
            flyTo: true,
            show: true,
          })
      );
      this.setupLayerClickHandler();
    },
    // 加载管网系统
    addWaterPipeLayer() {
      this.waterPipeLayer = this.viewer.imageryLayers.addImageryProvider(
          new Cesium.WebMapServiceImageryProvider({
            url: this.geoUrl,
            layers: this.waterPipeLayerName,
            parameters: {
              tiled: true,
              transparent: true,
              format: 'image/png',
              srs: 'EPSG:4490',
              version: '1.1.1',
            },
            flyTo: true,
            show: true,
          })
      );
      this.setupLayerClickHandler();
    },
    // 加载交通道路
    addRoadLayer() {
      this.roadLayer = this.viewer.imageryLayers.addImageryProvider(
          new Cesium.WebMapServiceImageryProvider({
            url: this.geoUrl,
            layers: this.roadLayerName,
            parameters: {
              tiled: true,
              transparent: true,
              format: 'image/png',
              srs: 'EPSG:4490',
              version: '1.1.1',
            },
            flyTo: true,
            show: true,
          })
      );
      this.setupLayerClickHandler();
    },
    // 加载桥梁
    addBridgeLayer() {
      this.bridgeLayer = this.viewer.imageryLayers.addImageryProvider(
          new Cesium.WebMapServiceImageryProvider({
            url: this.geoUrl,
            layers: this.bridgeLayerName,
            parameters: {
              tiled: true,
              transparent: true,
              format: 'image/png',
              srs: 'EPSG:4490',
              version: '1.1.1',
            },
            flyTo: true,
            show: true,
          })
      );
      this.setupLayerClickHandler();
    },
    // 加载高速
    addHighway() {
      this.highwayLayer = this.viewer.imageryLayers.addImageryProvider(
          new Cesium.WebMapServiceImageryProvider({
            url: this.geoUrl,
            layers: this.highwayLayerName,
            parameters: {
              tiled: true,
              transparent: true,
              format: 'image/png',
              srs: 'EPSG:4490',
              version: '1.1.1',
            },
            flyTo: true,
            show: true,
          })
      );
      this.setupLayerClickHandler();
    },
    // 加载国道
    addNationalRoad() {
      this.nationalRoadLayer = this.viewer.imageryLayers.addImageryProvider(
          new Cesium.WebMapServiceImageryProvider({
            url: this.geoUrl,
            layers: this.nationalRoadLayerName,
            parameters: {
              tiled: true,
              transparent: true,
              format: 'image/png',
              srs: 'EPSG:4490',
              version: '1.1.1',
            },
            flyTo: true,
            show: true,
          })
      );
      this.setupLayerClickHandler();
    },
    // 加载水库
    addReservoir() {
      this.reservoirLayer = this.viewer.imageryLayers.addImageryProvider(
          new Cesium.WebMapServiceImageryProvider({
            url: this.geoUrl,
            layers: this.reservoirLayerName,
            parameters: {
              tiled: true,
              transparent: true,
              format: 'image/png',
              srs: 'EPSG:4490',
              version: '1.1.1',
            },
            flyTo: true,
            show: true,
          })
      );
      this.setupLayerClickHandler();
    },
    // 加载地铁站
    addSubway() {
      this.subwayLayer = this.viewer.imageryLayers.addImageryProvider(
          new Cesium.WebMapServiceImageryProvider({
            url: this.geoUrl,
            layers: this.subwayLayerName,
            parameters: {
              tiled: true,
              transparent: true,
              format: 'image/png',
              srs: 'EPSG:4490',
              version: '1.1.1',
            },
            flyTo: true,
            show: true,
          })
      );
      this.setupLayerClickHandler();
    },
    // 控制人口网格显示
    togglePeople() {
      if (this.peopleLayer == null && this.showPeople) {
        this.addPeopleLayer();
      }
      this.peopleLayer.show = this.showPeople;
    },
    //控制农田显示
    toggleCrops(){
      if(this.cropsLayer == null && this.showCrops) {
        this.addCropsLayer();
      }
      this.cropsLayer.show = this.showCrops;
    },
    //控制管网系统显示
    toggleWaterPipe(){
      if(this.waterPipeLayer == null && this.showPipe) {
        this.addWaterPipeLayer();
      }
      this.waterPipeLayer.show = this.showPipe;
    },
    //控制道路显示
    toggleRoad(){
      if(this.roadLayer == null && this.showRoad) {
        this.addRoadLayer();
      }
      this.roadLayer.show = this.showRoad;
    },
    //控制桥梁显示
    toggleBridge(){
      if(this.bridgeLayer == null && this.showBridge) {
        this.addBridgeLayer();
      }
      this.bridgeLayer.show = this.showBridge;
    },
    //控制高速显示
    toggleHighway(){
      if(this.highwayLayer == null && this.showHighway) {
        this.addHighway();
      }
      this.highwayLayer.show = this.showHighway;
    },
    //控制国道显示
    toggleNationalRoad(){
      if(this.nationalRoadLayer == null && this.showNationalRoad) {
        this.addNationalRoad();
      }
      this.nationalRoadLayer.show = this.showNationalRoad;
    },
    //控制水库显示
    toggleReservoir(){
      if(this.reservoirLayer == null && this.showReservoir) {
        this.addReservoir();
      }
      this.reservoirLayer.show = this.showReservoir;
    },
    //控制地铁站显示
    toggleSubway(){
      if(this.subwayLayer == null && this.showSubway) {
        this.addSubway();
      }
      this.subwayLayer.show = this.showSubway;
    },
    //加载避难所
    loadShelter(){
      try{
        //避难点
        const shelterFeatures = this.ShelterData?.features || [];
        this.shelterEntities = [];
        //添加避难点
        shelterFeatures.forEach(point => {
          const properties = point.properties || {};
          const shelterName = properties.shelterName || '未知危险源';
          const longitude = point.geometry.coordinates[0];
          const latitude = point.geometry.coordinates[1];

          // 加入避难点到数组
          this.shelterPoints.push([longitude, latitude])

          // 创建灾害点实体
          const entity = this.viewer.entities.add({
            position: Cesium.Cartesian3.fromDegrees(longitude, latitude, 5),
            // 点
            billboard: {
              // 图像地址，URI或Canvas的属性   @/assets/images/landslide.png
              image: shelterIcon,
              width: 60, // 图片宽度,单位px
              height: 60, // 图片高度，单位px
              eyeOffset: new Cesium.Cartesian3(0, 0, 0), // 与坐标位置的偏移距离
              color: Cesium.Color.WHITE.withAlpha(1), // 固定颜色
              scale: 0.8, // 缩放比例
              heightReference: Cesium.HeightReference.CLAMP_TO_GROUND, // 绑定到地形高度
              scaleByDistance: new Cesium.NearFarScalar(500, 1, 5e5, 0.1),
              depthTest: false, // 禁止深度测试
              disableDepthTestDistance: Number.POSITIVE_INFINITY, // 不进行深度测试
              show: this.showShelter
            },
            // 文字
            label: {
              text: `${shelterName}`,
              font: '12pt Source Han Sans CN',
              fillColor: Cesium.Color.WHITE,
              backgroundColor: Cesium.Color.AQUA,
              showBackground: false,
              outline: true,
              outlineColor: Cesium.Color.BLACK,
              outlineWidth: 10,
              scale: 1.0,
              style: Cesium.LabelStyle.FILL_AND_OUTLINE,
              verticalOrigin: Cesium.VerticalOrigin.CENTER,
              horizontalOrigin: Cesium.HorizontalOrigin.LEFT,
              pixelOffset: new Cesium.Cartesian2(-70, -35),
              distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 20000),
              show: this.showShelter
            },
            // 添加灾害类型信息，用于弹窗显示
            // description: this.createDisasterDescription(properties, '滑坡'),
            // 保存原始样式，用于闪烁恢复
            originalColor: Cesium.Color.RED,
            originalPixelSize: 15,
            // 标记灾害类型
            disasterType: 'emergencyShelter',
            disasterData: point,
          });
          // 保存实体引用
          this.shelterEntities.push(entity);
        })
        //设置点击事件监听
        this.setupEntityClickHandler();
      }catch(error){
        console.error("处理避难所点数据失败.")
      }
    },
    //加载储备站点
    loadStorePoints(){
      try{
        //储备站点获取数据
        const storePointsFeatures = this.StorePointsData?.features || [];
        this.storePointsEntities = [];
        //添加储备站点
        storePointsFeatures.forEach(point => {
          const properties = point.properties || {};
          const storeName = properties.storeName || '未知危险源';
          const longitude = point.geometry.coordinates[0];
          const latitude = point.geometry.coordinates[1];

          // 加入储备点到数组
          this.storePoints.push([longitude, latitude])

          // 创建实体
          const entity = this.viewer.entities.add({
            position: Cesium.Cartesian3.fromDegrees(longitude, latitude, 5),
            // 点
            billboard: {
              // 图像地址，URI或Canvas的属性   @/assets/images/landslide.png
              image: storePointsIcon,
              width: 60, // 图片宽度,单位px
              height: 60, // 图片高度，单位px
              eyeOffset: new Cesium.Cartesian3(0, 0, 0), // 与坐标位置的偏移距离
              color: Cesium.Color.WHITE.withAlpha(1), // 固定颜色
              scale: 0.8, // 缩放比例
              heightReference: Cesium.HeightReference.CLAMP_TO_GROUND, // 绑定到地形高度
              scaleByDistance: new Cesium.NearFarScalar(500, 1, 5e5, 0.1),
              depthTest: false, // 禁止深度测试
              disableDepthTestDistance: Number.POSITIVE_INFINITY, // 不进行深度测试
              show: this.showStore
            },
            // 文字
            label: {
              text: `${storeName}`,
              font: '12pt Source Han Sans CN',
              fillColor: Cesium.Color.WHITE,
              backgroundColor: Cesium.Color.AQUA,
              showBackground: false,
              outline: true,
              outlineColor: Cesium.Color.BLACK,
              outlineWidth: 10,
              scale: 1.0,
              style: Cesium.LabelStyle.FILL_AND_OUTLINE,
              verticalOrigin: Cesium.VerticalOrigin.CENTER,
              horizontalOrigin: Cesium.HorizontalOrigin.LEFT,
              pixelOffset: new Cesium.Cartesian2(-70, -35),
              distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 20000),
              show: this.showStore
            },
            // 添加灾害类型信息，用于弹窗显示
            // description: this.createDisasterDescription(properties, '滑坡'),
            // 保存原始样式，用于闪烁恢复
            originalColor: Cesium.Color.RED,
            originalPixelSize: 15,
            // 标记灾害类型
            disasterType: 'storePoints',
            disasterData: point,
          });
          // 保存实体引用
          this.storePointsEntities.push(entity);
        })
        //设置点击事件监听
        this.setupEntityClickHandler();
      }catch(error){
        console.error("处理储备站点数据失败.")
      }
    },
    //加载救援队伍
    loadSaveTeams(){
      try{
        //消防队伍
        const fireFeatures = this.FireFighterData?.features || [];

        this.saveTeamEntities = [];
        this.fireFighterEntities = [];

        //添加消防站点
        fireFeatures.forEach(point => {
          const properties = point.properties || {};
          const teamName = properties.teamName || '未知危险源';
          const longitude = point.geometry.coordinates[0];
          const latitude = point.geometry.coordinates[1];

          // 加入消防队到数组
          this.fireFighterPoints.push([longitude, latitude])

          // 创建灾害点实体
          const entity = this.viewer.entities.add({
            position: Cesium.Cartesian3.fromDegrees(longitude, latitude, 5),
            // 点
            billboard: {
              // 图像地址，URI或Canvas的属性   @/assets/images/landslide.png
              image: fireIcon,
              width: 60, // 图片宽度,单位px
              height: 60, // 图片高度，单位px
              eyeOffset: new Cesium.Cartesian3(0, 0, 0), // 与坐标位置的偏移距离
              color: Cesium.Color.WHITE.withAlpha(1), // 固定颜色
              scale: 0.8, // 缩放比例
              heightReference: Cesium.HeightReference.CLAMP_TO_GROUND, // 绑定到地形高度
              scaleByDistance: new Cesium.NearFarScalar(500, 1, 5e5, 0.1),
              depthTest: false, // 禁止深度测试
              disableDepthTestDistance: Number.POSITIVE_INFINITY, // 不进行深度测试
              show: this.showFire
            },
            // 文字
            label: {
              text: `${teamName}`,
              font: '12pt Source Han Sans CN',
              fillColor: Cesium.Color.WHITE,
              backgroundColor: Cesium.Color.AQUA,
              showBackground: false,
              outline: true,
              outlineColor: Cesium.Color.BLACK,
              outlineWidth: 10,
              scale: 1.0,
              style: Cesium.LabelStyle.FILL_AND_OUTLINE,
              verticalOrigin: Cesium.VerticalOrigin.CENTER,
              horizontalOrigin: Cesium.HorizontalOrigin.LEFT,
              pixelOffset: new Cesium.Cartesian2(-70, -35),
              distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 20000),
              show: this.showFire
            },
            // 添加灾害类型信息，用于弹窗显示
            // description: this.createDisasterDescription(properties, '滑坡'),
            // 保存原始样式，用于闪烁恢复
            originalColor: Cesium.Color.RED,
            originalPixelSize: 15,
            // 标记灾害类型
            disasterType: 'saveTeam',
            disasterData: point,
          });
          // 保存实体引用
          this.saveTeamEntities.push(entity);
          this.fireFighterEntities.push(entity);
        })

        this.setupEntityClickHandler();

      }catch(error){
        console.error("处理消防站数据失败.")
      }
    },
    // 加载医院(保护目标
    loadProtectTarget(){

      try{
        const hospitalFeatures = this.HospitalData?.features || [];

        this.protectEntities = [];
        this.hospitalEntities = [];

        // 添加医院
        hospitalFeatures.forEach(point => {
          const properties = point.properties || {};
          const hospitalName = properties.hospitalName || '未知危险源';
          const longitude = point.geometry.coordinates[0];
          const latitude = point.geometry.coordinates[1];

          // 加入医院到数组
          this.hospitalPoints.push([longitude, latitude])

          // 创建实体
          const entity = this.viewer.entities.add({
            position: Cesium.Cartesian3.fromDegrees(longitude, latitude, 5),
            // 点
            billboard: {
              // 图像地址，URI或Canvas的属性   @/assets/images/landslide.png
              image: hospitalIcon,
              width: 60, // 图片宽度,单位px
              height: 60, // 图片高度，单位px
              eyeOffset: new Cesium.Cartesian3(0, 0, 0), // 与坐标位置的偏移距离
              color: Cesium.Color.WHITE.withAlpha(1), // 固定颜色
              scale: 0.8, // 缩放比例
              heightReference: Cesium.HeightReference.CLAMP_TO_GROUND, // 绑定到地形高度
              scaleByDistance: new Cesium.NearFarScalar(500, 1, 5e5, 0.1),
              depthTest: false, // 禁止深度测试
              disableDepthTestDistance: Number.POSITIVE_INFINITY, // 不进行深度测试
              show: this.showHospital
            },
            // 文字
            label: {
              text: `${hospitalName}`,
              font: '12pt Source Han Sans CN',
              fillColor: Cesium.Color.WHITE,
              backgroundColor: Cesium.Color.AQUA,
              showBackground: false,
              outline: true,
              outlineColor: Cesium.Color.BLACK,
              outlineWidth: 10,
              scale: 1.0,
              style: Cesium.LabelStyle.FILL_AND_OUTLINE,
              verticalOrigin: Cesium.VerticalOrigin.CENTER,
              horizontalOrigin: Cesium.HorizontalOrigin.LEFT,
              pixelOffset: new Cesium.Cartesian2(-70, -35),
              distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 20000),
              show: this.showHospital
            },
            // 添加灾害类型信息，用于弹窗显示
            // description: this.createDisasterDescription(properties, '滑坡'),
            // 保存原始样式，用于闪烁恢复
            originalColor: Cesium.Color.RED,
            originalPixelSize: 15,
            // 标记灾害类型
            disasterType: 'protectTarget',
            disasterData: point,
          });
          // 保存实体引用
          this.protectEntities.push(entity);
          this.hospitalEntities.push(entity);
        });

        // 设置实体点击事件
        this.setupEntityClickHandler();

      }catch (error) {
        console.error('处理保护目标数据时出错:', error);
      }
    },
    // 加载风险源
    loadDangerSource(){
      try{
        const dangerSourceFeatures = this.DangerSourceData?.features || [];

        this.dangerEntities = [];
        this.dangerSourceEntities = [];

        // 添加危险源点
        dangerSourceFeatures.forEach(point => {
          const properties = point.properties || {};
          const dangerNAME = properties.dangerName || '未知危险源';
          const longitude = point.geometry.coordinates[0];
          const latitude = point.geometry.coordinates[1];

          // 加入危险源到数组
          this.dangerSourcePoints.push([longitude, latitude])

          // 创建实体
          const entity = this.viewer.entities.add({
            position: Cesium.Cartesian3.fromDegrees(longitude, latitude, 5),
            // 点
            billboard: {
              // 图像地址，URI或Canvas的属性   @/assets/images/landslide.png
              image: dangerSourceIcon,
              width: 60, // 图片宽度,单位px
              height: 60, // 图片高度，单位px
              eyeOffset: new Cesium.Cartesian3(0, 0, 0), // 与坐标位置的偏移距离
              color: Cesium.Color.WHITE.withAlpha(1), // 固定颜色
              scale: 0.8, // 缩放比例
              heightReference: Cesium.HeightReference.CLAMP_TO_GROUND, // 绑定到地形高度
              scaleByDistance: new Cesium.NearFarScalar(500, 1, 5e5, 0.1),
              depthTest: false, // 禁止深度测试
              disableDepthTestDistance: Number.POSITIVE_INFINITY, // 不进行深度测试
              show: this.showDangerSource
            },
            // 保存原始样式，用于闪烁恢复
            originalColor: Cesium.Color.RED,
            originalPixelSize: 15,
            // 标记灾害类型
            disasterType: 'dangerSource',
            disasterData: point,
          });
          // 保存实体引用
          this.dangerEntities.push(entity);
          this.dangerSourceEntities.push(entity);
        });

        // 设置实体点击事件
        this.setupEntityClickHandler();

      }catch (error) {
        console.error('处理风险源数据时出错:', error);
      }
    },
    // 设置实体点击事件处理
    setupEntityClickHandler() {

      // 清除之前的点击事件处理程序
      if (this.clickHandler) {
        this.clickHandler.destroy();
      }

      // 为左键点击添加事件处理程序
      this.clickHandler = new Cesium.ScreenSpaceEventHandler(this.viewer.canvas);
      this.clickHandler.setInputAction((movement) => {
        // 检查点击是否在实体上
        const pickedObject = this.viewer.scene.pick(movement.position);
        // 判断是否有disasterName属性
        if (pickedObject.id._disasterData === undefined) {
          return;
        }
        // 隐藏之前的弹出面板
        this.closePopup();

        if (Cesium.defined(pickedObject) && Cesium.defined(pickedObject.id)) {
          const entity = pickedObject.id;
          // 获取实体的灾害数据
          this.selectedEntityData = entity._disasterData || {};
          // 计算弹出框位置并显示面板
          this.calculateAndShowPopup(entity, movement.position);
        } else {
          // 如果点击在空白处，隐藏信息框
          this.viewer.selectedEntity = undefined;
        }
      }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
    },
    // 计算并显示弹出面板
    async calculateAndShowPopup(entity, movementPosition) {
      try {
        const scene = this.viewer.scene;
        const clock = this.viewer.clock;
        // 获取当前时间
        const currentTime = clock.currentTime;
        // 使用当前时间获取位置值
        const position = entity.position.getValue(currentTime);
        // 正确检查位置有效性
        if (!position ||
            isNaN(position.x) || isNaN(position.y) || isNaN(position.z) ||
            !isFinite(position.x) || !isFinite(position.y) || !isFinite(position.z)) {
          console.log('位置无效或未定义');
          return;
        }
        // 转换为窗口坐标
        const windowPosition = scene.cartesianToCanvasCoordinates(position);
        if (windowPosition) {
          // 计算最终位置（添加偏移量）
          this.popupPosition = {
            x: windowPosition.x + 20,
            y: windowPosition.y - 10
          };
          // 检测边界防止面板超出视口
          this.checkPopupBoundary();
          // 显示弹出面板
          this.popupVisible = true;
          // 平滑定位到点击的实体
          await this.viewer.flyTo(entity, {
            duration: 0.5,
            offset: new Cesium.HeadingPitchRange(0, Cesium.Math.toRadians(-30), 5000)
          });
        }
      } catch (error) {
        console.error("计算弹出面板位置出错:", error);
      }
    },
    // 关闭弹出面板
    closePopup() {
      this.popupVisible = false;
      this.selectedEntityData = null;
    },
    // 检测弹出面板边界
    checkPopupBoundary() {
      const panelWidth = 280;
      const panelHeight = 200;
      const canvas = this.viewer.canvas;
      const rect = canvas.getBoundingClientRect();
      // 防止面板超出右边界
      if (this.popupPosition.x + panelWidth > rect.right) {
        this.popupPosition.x = rect.right - panelWidth - 10;
      }
      // 防止面板超出下边界
      if (this.popupPosition.y + panelHeight > rect.bottom) {
        this.popupPosition.y = rect.bottom - panelHeight - 10;
      }
      // 防止面板超出左边界
      if (this.popupPosition.x < 10) {
        this.popupPosition.x = 10;
      }
      // 防止面板超出上边界
      if (this.popupPosition.y < 10) {
        this.popupPosition.y = 10;
      }
    },
    // 图层点击事件处理
    setupLayerClickHandler() {
      // 清除之前的点击事件处理程序
      if (this.layerHandler) {
        this.layerHandler.destroy();
      }
      // 为左键点击添加事件处理程序
      this.layerHandler = new Cesium.ScreenSpaceEventHandler(this.viewer.canvas);

      this.layerHandler.setInputAction(async (click) => {
        // 1. 获取点击位置的经纬度和像素坐标
        const position = viewer.scene.pickPosition(click.position); // 三维坐标
        if (!position) return;
        const ray = this.viewer.camera.getPickRay(click.position);
        const cartesian = this.viewer.scene.globe.pick(ray, this.viewer.scene);

        if (cartesian) {
          const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
          const longitude = Cesium.Math.toDegrees(cartographic.longitude);
          const latitude = Cesium.Math.toDegrees(cartographic.latitude);

          console.log('经纬度', longitude, latitude);

          // 2. 获取点击位置的屏幕像素坐标
          const feature = viewer.scene.pick(click.position);
          if (!feature) return;
          // 3. 发送 GetFeatureInfo 请求,对每个Layer进行判别，若其显示，则请求
          //人口
          if(this.showPeople){
            const infoUrl = this.buildGetFeatureInfoUrl(longitude, latitude, this.peopleLayerName);
            const response = await fetch(infoUrl);
            const text = await response.text();
            console.log("人口信息:", JSON.parse(text)); // 打印 GeoServer 返回的属性
          }
          //农作物
          if(this.showCrops){
            const infoUrl = this.buildGetFeatureInfoUrl(longitude, latitude, this.cropsLayerName);
            const response = await fetch(infoUrl);
            const text = await response.text();
            console.log("农作物信息:", JSON.parse(text)); // 打印 GeoServer 返回的属性
          }
          //管网
          if(this.showPipe){
            const infoUrl = this.buildGetFeatureInfoUrl(longitude, latitude, this.waterPipeLayerName);
            const response = await fetch(infoUrl);
            const text = await response.text();
            console.log("管网信息:", JSON.parse(text));
          }
          //道路
          if(this.showRoad){
            const infoUrl = this.buildGetFeatureInfoUrl(longitude, latitude, this.roadLayerName);
            const response = await fetch(infoUrl);
            const text = await response.text();
            console.log("道路信息:", JSON.parse(text));
          }
          //桥梁
          if(this.showBridge){
            const infoUrl = this.buildGetFeatureInfoUrl(longitude, latitude, this.bridgeLayerName);
            const response = await fetch(infoUrl);
            const text = await response.text();
            console.log("桥梁信息:", JSON.parse(text));
          }
          //高速
          if(this.showHighway){
            const infoUrl = this.buildGetFeatureInfoUrl(longitude, latitude, this.highwayLayerName);
            const response = await fetch(infoUrl);
            const text = await response.text();
            console.log("高速信息:", JSON.parse(text));
          }
          //国道
          if(this.showNationalRoad){
            const infoUrl = this.buildGetFeatureInfoUrl(longitude, latitude, this.nationalRoadLayerName);
            const response = await fetch(infoUrl);
            const text = await response.text();
            console.log("国道信息:", JSON.parse(text));
          }
          //水库
          if(this.showReservoir){
            const infoUrl = this.buildGetFeatureInfoUrl(longitude, latitude, this.reservoirLayerName);
            const response = await fetch(infoUrl);
            const text = await response.text();
            console.log("水库信息:", JSON.parse(text));
          }
          //地铁站
          if(this.showSubway){
            const infoUrl = this.buildGetFeatureInfoUrl(longitude, latitude, this.subwayLayerName);
            const response = await fetch(infoUrl);
            const text = await response.text();
            console.log("地铁站信息:", JSON.parse(text));
          }

        }
      }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
    },
    //设置请求
    buildGetFeatureInfoUrl(lon, lat, layerName) {
      const wmsUrl = this.geoUrl;
      const params = {
        service: 'WMS',
        version: '1.1.1',
        request: 'GetFeatureInfo',
        layers: layerName,
        srs: 'EPSG:4490',
        bbox: `${lon-0.01},${lat-0.01},${lon+0.01},${lat+0.01}`, // 小范围查询
        width: 101,  // 必须为奇数（中心点即点击位置）
        height: 101,
        query_layers: layerName,
        info_format: 'application/json', // 或 'text/plain'
        x: 50,  // 点击位置在 bbox 中心的像素坐标
        y: 50,
      };

      return `${wmsUrl}?${new URLSearchParams(params).toString()}`;
    },
    loadLakeData() {
      if (!this.lakeData) {
        console.error('湖面GeoJSON数据加载失败');
        return;
      }
      this.isLoading = true;
      this.loadingText = '加载湖面数据...';

      this.lakeDataSource = new Cesium.GeoJsonDataSource();
      this.lakeDataSource.load(this.lakeData, {
        enableFeatureStyles: false,
        clampToGround: true,
        suppressPointLabels: true
      }).then(() => {
        this.isLoading = false;
        this.configureLakeStyles();
        this.viewer.dataSources.add(this.lakeDataSource);
        // 定位到湖面区域
        this.viewer.zoomTo(this.lakeDataSource);
      }).catch(error => {
        this.isLoading = false;
        console.error('加载湖面数据失败:', error);
      });
    },
    // 配置湖面样式
    configureLakeStyles() {
      if (!this.lakeDataSource) return;

      const entities = this.lakeDataSource.entities.values;

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
    },
    // 加载河流数据
    loadRiverData() {
      if (!this.riverData) {
        console.error('河流GeoJSON数据加载失败');
        return;
      }

      this.isLoading = true;
      this.loadingText = '加载河流数据...';

      // 使用Cesium原生GeoJsonDataSource加载
      this.riverDataSource = new Cesium.GeoJsonDataSource();

      // 配置加载选项
      this.riverDataSource.load(this.riverData, {
        enableFeatureStyles: false, // 禁用默认样式，使用自定义样式
        clampToGround: true,
        suppressPointLabels: true
      }).then(() => {
        this.isLoading = false;
        this.configureRiverStyles(); // 配置河流样式
        this.viewer.dataSources.add(this.riverDataSource);

        // 定位到河流区域
        this.viewer.zoomTo(this.riverDataSource);
      }).catch(error => {
        this.isLoading = false;
        console.error('加载河流数据失败:', error);
      });
    },
    // 配置河流样式
    configureRiverStyles() {
      if (!this.riverDataSource) return;

      const entities = this.riverDataSource.entities.values;

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
    },
    //控制行政区划显示
    toggleAdminLayer() {
      this.showAdminLayer = !this.showAdminLayer;
      if (this.showAdminLayer) {
        basicLayers.loadAdminData()
      } else {
        basicLayers.removeAdminData()
      }
    },
    //预警点面板
    toggleTablePanel() {
      this.showRiskTable = !this.showRiskTable;
    },
    // 开启下雨特效
    toggleRainMode() {
      // 若不允许标记且当前为开启状态，则直接关闭
      if (this.rainMode) {
        this.rainMode = false;
        if (this.handler) {
          this.handler.destroy();
          this.handler = null;
        }
        document.body.style.cursor = '';
        this.showInfoPanel = false;
        return;
      }

      this.rainMode = !this.rainMode;

      if (this.rainMode) {
        this.handler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);
        this.handler.setInputAction(this.onMapClick, Cesium.ScreenSpaceEventType.LEFT_CLICK);
        document.body.style.cursor = 'crosshair';
      } else {
        if (this.handler) {
          this.handler.destroy();
          this.handler = null;
        }
        document.body.style.cursor = '';
        this.showInfoPanel = false;
      }
    },
    // 在地图上标记暴雨点
    onMapClick(movement) {
      if (!this.rainMode) return;

      const ray = this.viewer.camera.getPickRay(movement.position);
      const cartesian = this.viewer.scene.globe.pick(ray, this.viewer.scene);

      if (cartesian) {
        const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
        const longitude = Cesium.Math.toDegrees(cartographic.longitude);
        const latitude = Cesium.Math.toDegrees(cartographic.latitude);

        this.selectedPosition = {longitude, latitude, cartesian};
        this.showInfoPanel = true;
      }
    },
    confirmRainPoint() {
      // this,rainfall=
      console.log('rainfall:', this.rainfall); // 调试输出
      console.log('duration:', this.duration); // 调试输出
      if (!this.selectedPosition) return;
      let {longitude, latitude, cartesian} = this.selectedPosition;

      // 计算降雨强度(mm/小时)
      const intensity = this.rainfall / (this.duration || 1);

      this.showInfoPanel = false;

      // 标记后自动开启下雨效果
      this.weatherActive = true;
      this.rainEffect.enabled = this.weatherActive;

      this.rainMode = false;

      if (this.handler) {
        this.handler.destroy();
        this.handler = null;
      }
      document.body.style.cursor = '';


      // 新增逻辑：获取标记点所在行政区划
      const adminArea = layers.getAdministrationByPoint(longitude, latitude);


      if (adminArea) {
        //显示标记点
        let entity = {
          position: adminArea.name,
          longitude: longitude,
          latitude: latitude,
          id: "test_rain",
          trigger: "暴雨",
          rainfall: this.rainfall + "mm",
          duration: this.duration + "小时",
          occurrenceTime: new Date(),
          disasterName: "降雨量" + this.rainfall + "毫米每小时,已持续" + this.duration + "小时"
        }
        basicLayers.addCenterPoint(entity)
        this.viewer.flyTo(entity, {
          duration: 1.5,
          offset: new Cesium.HeadingPitchRange(0, Cesium.Math.toRadians(-30), 5000)
        });
        this.rainPoints.push(entity);
        //计算预警点
        // console.log(`标记点位于行政区划: ${adminArea.name}`);
        // 获取该行政区划的经纬度范围
        const adminCoordinates = adminArea.geometry.coordinates;
        this.startLoading()
        console.log(adminCoordinates, "adminCoordinates")
        this.DisasterPointsFlash(adminCoordinates);
      } else {
        console.log("未找到标记点所在的行政区划");
      }
    },

    async DisasterPointsFlash(adminCoordinates) {
      let allPointsInside = layers.findAllHiddenDisasterPointsInAffectedArea(adminCoordinates);
      console.log(allPointsInside,"allPointsInside")
      let { matchedHuapoData, pointSet } = this.getHiddenDisasterPointswithCausingFactors(allPointsInside); // 使用 await
      console.log(matchedHuapoData, pointSet, "matchedHuapoData,pointSet");
      let matchedHuapoEntities = await this.caculateRainSlideTrigger(matchedHuapoData, pointSet); // 使用 await
      this.matchedHiddenHighlightEntities = matchedHuapoEntities;
      layers.flashHiddenDisasterPoints(matchedHuapoEntities);
      this.handleHiddenDisasterPointUpdate(matchedHuapoEntities);
      this.stopLoading();
    },
    getHiddenDisasterPointswithCausingFactors(landslidePointsInside) {
      console.log(landslidePointsInside,"getHiddenDisasterPointswithCausingFactors")
      let matchedHuapoData = [];
      let pointSet = new Set();
      if (landslidePointsInside.length > 0) {
        // 创建经纬度字符串集合用于快速匹配
        landslidePointsInside.forEach(point => {
          // 使用固定精度的字符串表示经纬度
          let lon = point[0];
          let lat = point[1];
          pointSet.add(`${lon},${lat}`);
        });
        useSimulationPointStore().simulationPoints.forEach((item) => {
          let lon = item.geologicalDisasterHideDTO.lon;
          let lat = item.geologicalDisasterHideDTO.lat;
          let key = `${lon},${lat}`;
          if (pointSet.has(key)) {
            matchedHuapoData.push(item.factorVoList);
          }
        });

        console.log(matchedHuapoData,pointSet,"matchedHuapoData,pointSet")
        // 降雨量值放到致灾因子里面去
        for (var i = 0; i < matchedHuapoData.length; i++) {
          if( matchedHuapoData[i]){
            for (var j = 0; j < matchedHuapoData[i].length; j++) {
              if (matchedHuapoData[i][j]&&matchedHuapoData[i][j].attributeName === "降雨量") {
                matchedHuapoData[i][j].factorValue = this.rainfall;
              }
            }
          }

        }
      }
      return { matchedHuapoData, pointSet }; // 返回一个对象
    },
    async caculateRainSlideTrigger(matchedHuapoData, pointSet) {
      try {
        let matchedHuapoEntities = []
        const res = await rainSlideTrigger(matchedHuapoData);
        console.log(res,"rainSlideTrigger")
        let formatAnalyzedData = res.data;

        formatAnalyzedData.forEach(item => {
          let lon = item.geologicalDisasterHideDTO.lon;
          let lat = item.geologicalDisasterHideDTO.lat;
          let key = `${lon},${lat}`;
          if (pointSet.has(key)) {
            matchedHuapoEntities.push(item);
          }
        });

        return matchedHuapoEntities;
      } catch (error) {
        console.error("Error in rainSlideTrigger:", error);
        return []; // 返回空数组或其他默认值
      }
    },

    handleHiddenDisasterPointUpdate(probabilityPoints) {
      // 清空表格数据
      this.dataTypeHiddenDisaster.type1.data = [];
      this.dataTypeHiddenDisaster.type2.data = [];
      this.dataTypeHiddenDisaster.type3.data = [];
      // 风险区数据，滑坡数据，泥石流数据
      probabilityPoints.forEach((item) => {
        // console.log(item, "probabilityPoints.forEach")
        switch (item.geologicalDisasterHideDTO.disasterType) {
          case "滑坡":
            this.dataTypeHiddenDisaster.type1.data.push({
              field1: item.geologicalDisasterHideDTO.disasterName,
              field2: item.geologicalDisasterHideDTO.position,
              field3: item.geologicalDisasterHideDTO.scaleGrade,
              field4: item.geologicalDisasterHideDTO.riskGrade,
              field5: item.geologicalDisasterHideDTO.lon,
              field6: item.geologicalDisasterHideDTO.lat,
            });
            break;
          case "泥石流":
            this.dataTypeHiddenDisaster.type2.data.push({
              field1: item.geologicalDisasterHideDTO.disasterName,
              field2: item.geologicalDisasterHideDTO.position,
              field3: item.geologicalDisasterHideDTO.scaleGrade,
              field4: item.geologicalDisasterHideDTO.riskGrade,
              field5: item.geologicalDisasterHideDTO.lon,
              field6: item.geologicalDisasterHideDTO.lat,
            });
            break;
          default:
            this.dataTypeHiddenDisaster.type3.data.push({
              field1: item.geologicalDisasterHideDTO.disasterName,
              field2: item.geologicalDisasterHideDTO.position,
              field3: item.geologicalDisasterHideDTO.inspectorName,
              field4: item.geologicalDisasterHideDTO.inspectorTele,
              field5: item.geologicalDisasterHideDTO.lon,
              field6: item.geologicalDisasterHideDTO.lat,
            });
        }
      });
    },

    cancelRainPoint() {
      this.showInfoPanel = false;
    },
    onKeyDown(event) {
      if (event.key === 'Escape' && this.rainMode) {
        this.toggleRainMode();
      }
    },
    // 初始化下雨效果
    initRainEffect() {
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
  `;

      this.rainEffect = new Cesium.PostProcessStage({
        fragmentShader: rainFragmentShader,
        uniforms: {
          rainIntensity: 0.5,
          rainArea: new Cesium.Cartesian4(0.25, 0.25, 0.5, 0.5)
        }
      });

      // 添加到场景但默认禁用
      this.viewer.scene.postProcessStages.add(this.rainEffect);
      this.rainEffect.enabled = false;

      // 设置降雨量的方法
      this.setRainIntensity = (value) => {
        this.rainEffect.uniforms.rainIntensity = Math.max(0.0, Math.min(1.0, value));
        this.updateRainUI(value); // 更新UI显示
      };


      // 初始化雨控制面板
      this.initRainControlUI();
    },
    // 初始化雨控制UI
    initRainControlUI() {
      // 创建控制容器
      const container = document.createElement('div');
      container.id = 'rain-control-panel';
      container.className = 'cesium-widget-credits'; // 使用Cesium风格
      container.style.cssText = `
    position: absolute;
    bottom: 20px;
    right: 20px;
    left : 25%;
    background: rgba(42, 42, 42, 0.8);
    color: white;
    padding: 10px;
    border-radius: 5px;
    width: 220px;
    z-index: 100;
  `;

      // 创建雨开关按钮
      const toggleBtn = document.createElement('button');
      toggleBtn.id = 'toggle-rain-btn';
      toggleBtn.className = 'cesium-button';
      toggleBtn.innerHTML = '<i class="cesium-icon-raindrop"></i> 雨';
      toggleBtn.style.cssText = `
    width: 100%;
    margin-bottom: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
  `;
      toggleBtn.onclick = () => this.toggleWeatherEffect();

      // 创建滑块容器
      const sliderContainer = document.createElement('div');
      sliderContainer.style.cssText = 'display: flex; align-items: center;';

      // 创建降雨量标签
      const intensityLabel = document.createElement('span');
      intensityLabel.id = 'rain-intensity-label';
      intensityLabel.textContent = '降雨量: 50%';
      intensityLabel.style.cssText = 'margin-right: 10px; min-width: 70px;';

      // 创建降雨量滑块
      const intensitySlider = document.createElement('input');
      intensitySlider.id = 'rain-intensity-slider';
      intensitySlider.type = 'range';
      intensitySlider.min = '0';
      intensitySlider.max = '100';
      intensitySlider.value = '50';
      intensitySlider.className = 'cesium-baseLayerPicker-itemIcon'; // 使用Cesium风格
      intensitySlider.style.cssText = 'width: 100%;';
      intensitySlider.oninput = (e) => {
        const value = parseFloat(e.target.value) / 100;
        this.setRainIntensity(value);
      };

      // 组装UI
      sliderContainer.appendChild(intensityLabel);
      sliderContainer.appendChild(intensitySlider);
      container.appendChild(toggleBtn);
      container.appendChild(sliderContainer);

      // 添加到DOM
      this.viewer.container.appendChild(container);

      // 保存UI引用
      this.rainControlUI = {
        container,
        toggleBtn,
        intensitySlider,
        intensityLabel
      };
    },
    // 更新雨UI显示
    updateRainUI(intensity) {
      if (this.rainControlUI) {
        const percentage = Math.round(intensity * 100);
        this.rainControlUI.intensityLabel.textContent = `降雨量: ${percentage}%`;
        this.rainControlUI.intensitySlider.value = percentage;

        // 根据雨的强度改变按钮颜色
        const hue = 100 - intensity * 50; // 从蓝色到深蓝色
        this.rainControlUI.toggleBtn.style.backgroundColor = `hsl(${hue}, 80%, 45%)`;
      }
    },
    // 切换天气效果
    toggleWeatherEffect() {
      if (!this.rainMode) {
        this.weatherActive = !this.weatherActive;
        this.rainEffect.enabled = this.weatherActive;

        // 更新按钮状态
        if (this.rainControlUI) {
          const icon = this.rainControlUI.toggleBtn.querySelector('i');
          if (this.weatherActive) {
            this.rainControlUI.toggleBtn.classList.add('cesium-button-selected');
            icon.classList.add('cesium-icon-raindrop-active');
          } else {
            this.rainControlUI.toggleBtn.classList.remove('cesium-button-selected');
            icon.classList.remove('cesium-icon-raindrop-active');
          }
        }
      }
    },

    // 关闭界面的方法（调用此方法时触发资源释放）
    // closeInterface() {
    //   this.isClosed = true;
    //   this.releaseAllResources();
    //   // 清空DOM引用
    //   const container = this.$refs.cesiumContainer;
    //   if (container) container.innerHTML = '';
    //   // 触发组件销毁
    //   this.$destroy();
    // },
    // 释放所有资源的核心方法
    releaseAllResources() {
      // 1. 清理Cesium核心资源
      if (this.viewer) {
        // 移除所有实体
        this.viewer.entities.removeAll();
        // 移除所有数据源
        this.viewer.dataSources.removeAll();
        // 移除所有图元
        this.viewer.scene.primitives.removeAll();
        // 移除所有 imagery图层
        this.viewer.imageryLayers.removeAll();
        // 销毁viewer实例
        this.viewer.destroy();
        this.viewer = null;
      }

      // 2. 清理定时器和动画帧
      this.timers.forEach(id => {
        if (typeof id === 'number') {
          clearInterval(id);
          clearTimeout(id);
        } else {
          cancelAnimationFrame(id);
        }
      });
      this.timers = [];

      // 3. 清理事件监听
      if (this.clickHandler) {
        this.clickHandler.destroy();
        this.clickHandler = null;
      }
      if (this.handler) {
        this.handler.destroy();
        this.handler = null;
      }
      document.removeEventListener('keydown', this.onKeyDown);
      if (this.viewer?.camera?.moveEnd) {
        this.viewer.camera.moveEnd.removeEventListener(this.handleCameraMoveEnd);
      }

      // 4. 清理自定义数据结构
      this.rainPoints = [];
      // this.entityCache.clear(); // 清空实体缓存

      // 5. 清理DOM元素
      const rainControl = document.getElementById('rain-control-panel');
      if (rainControl) rainControl.remove();
      const legend = this.$refs.legendContent;
      if (legend) legend.innerHTML = '';

      // 6. 强制垃圾回收（浏览器环境下触发）
      if (window.gc) {
        try {
          window.gc();
        } catch (e) {
          console.log('触发垃圾回收失败:', e);
        }
      }

      console.log('所有资源已释放');
    },
    // 重写定时器相关方法，统一管理定时器ID
    // setSafeInterval(fn, delay) {
    //   const id = setInterval(fn, delay);
    //   this.timers.push(id);
    //   return id;
    // },
    // setSafeTimeout(fn, delay) {
    //   const id = setTimeout(fn, delay);
    //   this.timers.push(id);
    //   return id;
    // },
    // requestSafeAnimationFrame(fn) {
    //   const id = requestAnimationFrame(fn);
    //   this.timers.push(id);
    //   return id;
    // },

    // 加载
    startLoading() {
      this.loadingModel = true;
    },
    // 停止加载
    stopLoading() {
      this.loadingModel = false;
    },

    //-------信息面板弹框-----
    entitiesClickPonpHandler() {

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
              this.selectedEntityPosition = this.calculatePosition(click.position);
              setTimeout(() => {
                this.updatePopupPosition();
              }, 10);
              // this.updatePopupPosition(); // 确保位置已更新


              // 如果 entity 没有 _layer 字段，且当前选中图层是特定图层时跳过
              if (!entity.name) {
                this.eqCenterPanelVisible = false;
                this.rainCenterPanelVisible = false;
                return;
              }
              // 如果点击的是标绘点
              else if (entity.name === "地震中心") {
                this.eqCenterPanelVisible = true;
                this.rainCenterPanelVisible = false;
                this.showBaseInfo = false;
                // this.PanelPosition = this.selectedEntityPosition; // 更新位置

                this.PanelData = {}
                this.PanelData = clickPointsAndShowPanel.extractDataForPanel(entity, this.matchedHiddenHighlightEntities)
              } else if (entity.name === "暴雨中心") {
                this.eqCenterPanelVisible = false;
                this.rainCenterPanelVisible = true;
                console.log(this.rainCenterPanelVisible, "打开面板啊")
                this.showBaseInfo = false;
                // this.PanelPosition = this.selectedEntityPosition; // 更新位置

                this.PanelData = {}
                this.PanelData = clickPointsAndShowPanel.extractDataForPanel(entity, this.matchedHiddenHighlightEntities)
                console.log(this.PanelData, "显示数据")
              } else if (entity.name === "滑坡隐患点") {
                this.eqCenterPanelVisible = false;
                this.rainCenterPanelVisible = false;
                this.showBaseInfo = true;
                this.baseInfoTitle = entity.name;
                this.showDisasterInformation = true;
                this.showdebrisFlowInformation = false;
                this.showRiskPointsInformation = false;

                this.disasterInformation = clickPointsAndShowPanel.extractDataForPanel(entity, this.matchedHiddenHighlightEntities)

                this.debrisFlowInformation = null
                this.riskPointsInformation = null
              } else if (entity.name === "泥石流隐患点") {
                this.eqCenterPanelVisible = false;
                this.rainCenterPanelVisible = false;
                this.showBaseInfo = true;
                // this.PanelPosition = this.selectedEntityPosition; // 更新位置
                this.baseInfoTitle = entity.name;

                this.showDisasterInformation = false;
                this.showdebrisFlowInformation = true;
                this.showRiskPointsInformation = false;

                this.disasterInformation = null
                this.debrisFlowInformation = clickPointsAndShowPanel.extractDataForPanel(entity, this.matchedHiddenHighlightEntities)
                this.riskPointsInformation = null
              } else if (entity.name === "风险区域") {
                this.eqCenterPanelVisible = false;
                this.rainCenterPanelVisible = false;
                this.showBaseInfo = true;
                // this.PanelPosition = this.selectedEntityPosition; // 更新位置
                this.baseInfoTitle = entity.name;
                this.showDisasterInformation = false;
                this.showdebrisFlowInformation = false;
                this.showRiskPointsInformation = true;

                this.disasterInformation = null
                this.debrisFlowInformation = null
                this.riskPointsInformation = clickPointsAndShowPanel.extractDataForPanel(entity, this.matchedHiddenHighlightEntities)
              } else {
                this.rainCenterPanelVisible = false;
                this.eqCenterPanelVisible = false;
                this.showBaseInfo = false;
              }
            }
            //没有拾取到实体
            else {
              this.eqCenterPanelVisible = false;
              this.rainCenterPanelVisible = false;
              this.showBaseInfo = false;
            }
          }, Cesium.ScreenSpaceEventType.LEFT_CLICK
      );
// 在屏幕空间事件处理器中添加鼠标移动事件的处理逻辑
      window.viewer.screenSpaceEventHandler.setInputAction(movement => {
        // 如果时间线弹窗或路由弹窗可见，则更新弹窗位置
        if (this.eqCenterPanelVisible || this.rainCenterPanelVisible || this.showBaseInfo) {
          this.updatePopupPosition();
        }
      }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
    },
    //计算点击位置的经纬度和高度
    calculatePosition(clickPosition) {
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
    },
    //更新弹窗位置
    updatePopupPosition() {
      // 使用$nextTick确保DOM更新后才执行位置计算
      this.$nextTick(() => {
        // 检查是否有选中的实体位置
        if (this.selectedEntityPosition) {
          // 将地理坐标转换为窗口坐标
          const canvasPosition = Cesium.SceneTransforms.worldToWindowCoordinates(
              window.viewer.scene,
              Cesium.Cartesian3.fromDegrees(this.selectedEntityPosition.x, this.selectedEntityPosition.y, this.selectedEntityPosition.z)
          );
          // 如果转换成功，则更新弹窗位置
          if (canvasPosition) {
            this.PanelPosition = {
              x: canvasPosition.x + 10,
              y: canvasPosition.y + 10
            };
          }
        }
      });
    },

    async downloadRainReport() {
      this.startLoading()
      // 1. 截三维画布
      const canvas3D = window.viewer.scene.canvas

      // 2. 截图例 DOM
      const legendEl = this.$refs.legendRef.$el
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
        const response = await saveCanvas(formData)
        const res = await response.json() // 关键：这里也要 await
        const imgUrl = res.data
        console.log(imgUrl, "imgUrl")

        // ✅ 生成 Word
        const wordRes = await generateRainReport(imgUrl)
        console.log(wordRes, "wordRes")
        const wordUrl = wordRes.data

        // ✅ 触发下载
        const link = document.createElement('a');
        link.href = 'http://localhost:8080/downloadReport/file/' + wordUrl;
        link.download = wordUrl;                         // 强制触发下载
        link.click();

        this.stopLoading()
      }, 'image/png', 1.0)
    },
    // 计算弹出面板左坐标（带过渡动画）
    calculatePopupLeft() {
      return this.popupPosition.x;
    },
    // 计算弹出面板上坐标（带过渡动画）
    calculatePopupTop() {
      return this.popupPosition.y;
    },
    // 阻止事件冒泡
    stopPropagation(e) {
      e.stopPropagation();
    },
    toggleHospitalPoints() {
      //首次加载
      if(this.hospitalEntities.length == 0 && this.showHospital){
        this.loadProtectTarget();
      }else{
        this.hospitalEntities.forEach(entity => {
          entity.show = this.showHospital;
        });
      }
    },
    toggleDangerPoints() {
      if(this.dangerEntities.length == 0 && this.showDangerSource){
        this.loadDangerSource();
      }else{
        this.dangerEntities.forEach(entity => {
          entity.show = this.showDangerSource;
        });
      }
    },
    toggleShelterPoints() {
      if(this.shelterEntities.length == 0 && this.showShelter){
        this.loadShelter();
      }else{
        this.shelterEntities.forEach(entity => {
          entity.show = this.showShelter;
        });
      }
    },
    toggleFirePoints() {
      if(this.fireFighterEntities.length == 0 && this.showFire){
        this.loadSaveTeams();
      }else{
        this.fireFighterEntities.forEach(entity => {
          entity.show = this.showFire;
        });
      }
    },
    toggleStorePoints() {
      if(this.storePointsEntities.length == 0 && this.showStore){
        this.loadStorePoints();
      }else{
        this.storePointsEntities.forEach(entity => {
          entity.show = this.showStore;
        });
      }
    },
  }
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

/* 控制面板样式优化 */
.controls {
  position: absolute;
  top: 10px;
  left: 35%;
  z-index: 100;
}

.btn-group {
  display: flex;
  gap: 8px; /* 按钮间距 */
}

.rain-btn, .weather-btn, .admin-btn, .table-btn {
  background-color: rgba(35, 158, 187, 1);
  color: white;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
  white-space: nowrap;
  min-width: 100px; /* 最小宽度确保按钮不挤压 */
  display: flex;
  align-items: center;
  justify-content: center;
}

.rain-btn:hover, .weather-btn:hover:not(.disabled), .admin-btn:hover {
  background-color: rgba(33, 158, 188, 1);
  transform: translateY(-2px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.weather-btn.disabled {
  background-color: rgba(150, 150, 150, 0.8);
  cursor: not-allowed;
}

/* 响应式处理 - 小屏幕下换行 */
@media (max-width: 640px) {
  .btn-group {
    flex-direction: column; /* 小屏幕下垂直排列 */
    gap: 6px;
  }

  .rain-btn, .weather-btn, .admin-btn {
    min-width: 80px;
  }
}

/* 加载指示器 */
.loading-indicator {
  position: absolute;
  top: 10px;
  right: 10px;
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 14px;
  z-index: 100;
}

/* 暴雨信息面板样式优化 */
.rain-info-panel {
  position: absolute;
  top: 130px;
  left: 10px;
  background-color: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 15px;
  border-radius: 6px;
  width: 240px;
  height: 190px;
  z-index: 100;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.panel-title {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 10px;
  padding-bottom: 8px;
  border-bottom: 1px solid #444;
  text-align: center;
}

.panel-content div {
  margin-bottom: 12px;
  display: flex;

}

.panel-content label {
  width: 70px;
  /* text-align: right; 标签文本右对齐 */
  font-weight: 500;
  flex-shrink: 0; /* 防止标签宽度被压缩 */
  display: inline-block; /* 确保宽度生效 */
}

.jiangyuliang {
  text-align-last: justify;
}

.panel-content input {
  width: 60px;
  padding: 6px 8px;
  border: none;
  border-radius: 4px;
  text-align: center;
  background-color: rgba(255, 255, 255, 0.2);
  color: white;
  height: 30px; /* 固定高度确保垂直居中 */
  box-sizing: border-box; /* 包含内边距 */
}

/* 优化单位文本样式，确保与输入框垂直对齐 */
.panel-content span {
  width: auto; /* 固定单位宽度，实现对齐 */
  text-align: left; /* 单位文本左对齐 */
  display: inline-block; /* 转为行内块元素便于设置宽度 */
  height: 30px; /* 与输入框等高，确保垂直对齐 */
  line-height: 30px; /* 垂直居中 */
}

/* 按钮组样式优化，确保按钮对齐 */
.button-group {
  display: flex;
  gap: 10px;
  margin-top: 10px;
}

.panel-content button {
  padding: 6px 12px;
  background-color: #386641;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
  height: 32px; /* 固定按钮高度，确保对齐 */
  line-height: normal; /* 重置行高 */
}

.panel-content button:last-child {
  background-color: #bc4749;
  margin-left: 10px;
}

.panel-content button:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

/* 图例面板样式 */
.legend-panel {
  position: absolute;
  bottom: 10px;
  right: 10px;
  background-color: rgba(255, 255, 255, 0.8);
  border-radius: 6px;
  padding: 10px;
  z-index: 100;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  max-height: 70%;
  overflow-y: auto;
}

.legend-title {
  font-size: 17px;
  font-weight: bold;
  margin-bottom: 8px;
  padding-bottom: 5px;
  border-bottom: 1px solid #ddd;
  text-align: center;
}

.legend-content {
  font-size: 12px;
}

.legend-item {
  display: flex;
  align-items: center;
  margin-bottom: 6px;
}

.legend-color {
  width: 16px;
  height: 16px;

  margin-right: 6px;
  border-radius: 2px;
}

.legend-text {
  white-space: nowrap;
}

.legend-panel {
  position: absolute;
  bottom: 10px;
  right: 10px;
  background-color: rgba(255, 255, 255, 0.8);
  border-radius: 6px;
  padding: 10px;
  z-index: 100;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  max-height: 70%;
  overflow-y: auto;
  max-width: 300px; /* 新增：限制图例最大宽度 */
}

.legend-title {
  font-size: 14px;
  font-weight: bold;
  margin-bottom: 8px;
  padding-bottom: 5px;
  border-bottom: 1px solid #ddd;
  text-align: center;
}

.legend-content {
  font-size: 12px;
}

.legend-item {
  display: flex;
  align-items: center;
  margin-bottom: 6px;
}

.legend-color {
  width: 16px;
  height: 16px;
  margin-right: 6px;
  border-radius: 2px;
}

.legend-text {
  white-space: nowrap;
}

.disaster-popup {
  position: absolute;
  z-index: 1000;
  width: 330px; /* 减小宽度 */
  background-color: white;
  border-radius: 6px; /* 减小圆角 */
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1); /* 减小阴影 */
  font-family: 'Source Han Sans CN', sans-serif;
  overflow: hidden;
  transition: opacity 0.2s, transform 0.2s;
  transform-origin: top left;
  opacity: 0;
  transform: scale(0.95);
  pointer-events: none;
  border: 1px solid #e0e0e0;
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
  background-color: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.popup-header h3 {
  margin: 0;
  font-size: 14px; /* 减小标题字体大小 */
  font-weight: 600;
  color: #333;
}

.popup-header button {
  background: none;
  border: none;
  font-size: 14px; /* 减小关闭按钮大小 */
  cursor: pointer;
  color: #6c757d;
  transition: color 0.2s;
}

.popup-header button:hover {
  color: #333;
}

.popup-content {
  padding: 10px 12px; /* 减小内边距 */
}

.disaster-table {
  width: 100%;
  border-collapse: collapse;
}

.disaster-table th,
.disaster-table td {
  padding: 6px 8px; /* 减小单元格内边距 */
  text-align: left;
  border-bottom: 1px solid #f0f0f0;
}

.disaster-table th {
  font-weight: 500;
  color: #495057;
  width: 35%; /* 固定标题列宽度 */
}

.disaster-table td {
  color: #333;
  word-break: break-all;
}

.disaster-table tr:last-child th,
.disaster-table tr:last-child td {
  border-bottom: none; /* 最后一行不显示底边 */
}

.popup-footer button {
  padding: 4px 10px; /* 减小按钮尺寸 */
  background-color: #409eff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
  font-size: 12px; /* 减小按钮字体大小 */
}

.popup-footer button:hover {
  background-color: #308ee0;
}

/* 风险区表格样式 */
.risk-table-container {
  position: fixed;
  top: 7%;
  left: 13%;
  width: 500px;
  max-height: 500px;
  overflow: hidden;
  z-index: 900;
  transition: all 0.3s ease;
  background-color: rgba(52, 152, 219, 0.1);
  border-radius: 6px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 15px;
  background-color: rgba(43, 47, 51, 0.6);
}

:deep(.el-table tr) {
  background-color: rgba(43, 47, 51, 0.6);
  height: 55px;
}

.title-text {
  font-size: 16px;
  font-weight: 500;
  color: white;
  text-align: center;
  width: 100%;
  margin-top: 5px;
}

/* 修改 el-table 的样式 */
:deep(.el-table) {
  background-color: transparent;
  border: 1px solid #ebeef5;
  border-radius: 4px;
}

:deep(.el-table th) {
  background-color: rgba(52, 73, 94, 0.2);
  border-top: 1px solid #ebeef5;
  border-bottom: 1px solid #ebeef5;
  color: white;
  font-weight: 500;
  font-size: 14px;
}

:deep(.el-table td) {
  background-color: rgba(43, 47, 51, 0.6);
  border-top: 1px solid #ebeef5;
  border-bottom: 1px solid #ebeef5;
  color: white;
}

:deep(.el-table--enable-row-hover .el-table__body tr:hover > td) {
  background-color: rgba(43, 47, 51, 0.6);
}

:deep(.el-table__body tr.current-row > td) {
  background-color: rgba(52, 152, 219, 0.1);
}

.table-pagination {
  color: white;
  padding: 15px 10px;
  background-color: rgba(43, 47, 51, 0);
  border-top: 1px solid #ebeef5;
  display: flex;
  justify-content: center;
}

/* 修改分页器样式 */
:deep(.el-pagination) {
  background-color: transparent;
}

:deep(.el-pagination button) {
  background-color: transparent;
  border: 1px solid #ebeef5;
}

:deep(.el-pagination .el-select .el-input) {
  background-color: transparent;
}

:deep(.el-pagination .el-input__inner) {
  background-color: transparent;
  border: 1px solid #ebeef5;
}

:deep(.el-table .el-table__header-wrapper th, .el-table .el-table__fixed-header-wrapper th) {
  background-color: rgba(43, 47, 51, 0.6) !important;
}

.rf_table {
  background-color: rgba(43, 47, 51, 0.6);
  padding: 15px 20px;
}

:deep(.el-pagination>.is-first) {
  margin-left: 0 !important;
  color: white !important;
}

:deep(.el-pagination__goto) {
  color: white;
}

:deep(.el-pagination__classifier) {
  color: white;
}

:deep(.el-table__row) {
  border: 1px solid #ebeef5;
}

.el-table__body-wrapper .cell {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.el-table__body-wrapper .cell:hover {
  overflow: visible;
  white-space: normal;
}

:deep(.el-table thead) {
  height: 55px !important;
}

.form-item {
  display: flex;
  align-items: self-start;
  margin-bottom: 15px;
}

/* 输入框与单位在同一行显示的样式 */
.input-with-unit {
  width: 200px;
  display: flex;
  gap: 8px; /* 输入框和单位之间的间距 */
}

/* 单位样式 */
.unit {
  white-space: nowrap; /* 防止单位换行 */
  color: #606266; /* 与Element UI表单文字颜色保持一致 */
}

.probability-level {
  margin-top: 10px;
  margin-bottom: 10px;
  font-size: 20px;
  color: red;
}

.secondary-panel {
  position: absolute;
  top: 20px;
  right: 20px;
  background-color: rgba(40, 40, 40, 0.8);
  color: white;
  padding: 15px;
  border-radius: 4px;
  z-index: 1000;
  width: 200px;
}

.panel-title1 {
  font-weight: bold;
  margin-bottom: 10px;
  font-size: 14px;
}

.panel-content1 {
  display: flex;
  flex-direction: column;
  font-size: 14px;
  gap: 8px;
}

.panel-content1 label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  cursor: pointer;
}


</style>
