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
      </div>
    </div>
    <!-- 加载状态提示 -->
    <div v-if="isLoading" class="loading-indicator">
      {{ loadingText }}
    </div>
    <!-- 风险区表格 - 固定在左下角 -->
    <div v-if="showRiskTable" class="risk-table-container">
      <div class="table-header">
        <span class="title-text">{{ currentTableConfig.title }}</span>
        <el-select
            class="title-text"
            v-model="selectedTableType"
            placeholder="请选择筛选条件"
            style="width: 200px;"
            @change="handleTableTypeChange">
          <el-option
              v-for="item in tableTypeOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
          ></el-option>
        </el-select>
      </div>
      <div class="rf_table">
        <el-table
            :data="displayData"
            border
            style="width: 100%; transition: width 0.3s ease;"
            height="320"
            highlight-current-row
            @row-click="handleRowClick">
          <el-table-column
              v-for="column in currentTableConfig.columns"
              :key="column.prop"
              :prop="column.prop"
              :label="column.label"
              :width="column.width"
              :align="column.align || 'center'"
              :show-overflow-tooltip="column.showOverflowTooltip || false"
          ></el-table-column>
        </el-table>
        <div class="table-pagination">
          <el-pagination
              v-model:current-page="currentPage"
              v-model:page-size="pageSize"
              :page-sizes="[ 10, 20, 50]"
              layout="total, sizes, prev, pager, next"
              :total="total"
              @size-change="handleSizeChange"
              @current-change="handleCurrentChange"
          />
        </div>
      </div>
    </div>
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


    <Legend></Legend>
  </div>
</template>

<script>
import * as Cesium from 'cesium';
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
import {initCesium} from '@/cesium/initLayer.js'
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
import {pulseUtils} from "@/cesium/pulse.js";
import {useSimulationPointStore} from "@/store/earthquake/simulation_points.js";
import clickPointsAndShowPanel from "@/cesium/clickPointsAndShowPanel.js";

export default {
  name: 'CesiumRainMap',
  components: {
    Chart,
    Legend,
    HiddenDisasterPanel,
    rainCenterPanel
  },
  data() {
    return {
      viewer: null,
      tdtToken: "7f013d0186775b063d6a046977bbefc6",
      currentMapType: 0,
      rainMode: false,
      showInfoPanel: false,
      selectedPosition: null,
      rainfall: 150,
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
      isLoading: false,
      loadingText: '加载数据中...',
      // 暴雨影响区域椭圆相关配置
      rainEllipseScale: 100, // 降雨量到椭圆半径的缩放系数
      rainEllipseRotation: 70, // 椭圆默认旋转角度
      districtColors: {}, // 存储各区县的颜色(图例)
      showDisasterLayer: true, // 控制灾害点显示/隐藏
      disasterStyleConfig: {
        '滑坡': {
          color: Cesium.Color.RED,
          pixelSize: 10,
          label: {
            text: '滑坡滑坡滑坡',
            font: '16px monospace',
            fillColor: Cesium.Color.RED,
            backgroundColor: Cesium.Color.WHITE.withAlpha(0.7),
            backgroundPadding: new Cesium.Cartesian2(5, 5),
            scale: 1.2
          }
        },
        '泥石流': {
          color: Cesium.Color.ORANGE,
          pixelSize: 10,
          label: {
            text: '泥石流泥石流',
            font: '16px monospace',
            fillColor: Cesium.Color.YELLOW,
            backgroundColor: Cesium.Color.BLACK.withAlpha(0.7),
            backgroundPadding: new Cesium.Cartesian2(5, 5),
            scale: 1.2
          }
        }
      },
      clickHandler: null,
      landslidePoints: [],     // 滑坡点
      debrisFlowPoints: [],    // 泥石流点
      secondaryRiskPoints: [], // 次生灾害风险点
      selectedEntityData: null,
      popupPosition: {x: 0, y: 0},
      popupVisible: false,
      lastPickedEntity: null,
      showRiskTable: false,
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
      factorVoList: {
        attributeId: [],
        valueIds: [],
        breakDistance: {
          attributeName: null,
          factorValue: null,
          unit: null,
        },
        elevation: {
          attributeName: null,
          factorValue: null,
          unit: null,
        },
        hideId: null,
        landUseType: {
          attributeName: null,
          factorValue: null,
          unit: null,
        },
        rainfall: {
          attributeName: null,
          factorValue: null,
          unit: null,
        },
        rockType: {
          attributeName: null,
          factorValue: null,
          unit: null,
        },
        slope: {
          attributeName: null,
          factorValue: null,
          unit: null,
        },
        slopeCurvature: {
          attributeName: null,
          factorValue: null,
          unit: null,
        },
        slopeType: {
          attributeName: null,
          factorValue: null,
          unit: null,
        },
        soilSandDegree: {
          attributeName: null,
          factorValue: null,
          unit: null,
        },
        vegetationCoverage: {
          attributeName: null,
          factorValue: null,
          unit: null,
        },
        waterDistance: {
          attributeName: null,
          factorValue: null,
          unit: null,
        },
      },
      factorOptions: { // 致灾因子可选下拉框
        rock: null,
        slope: null,
        landUse: null,
      },
      predict: {
        level: null,
        probability: null
      },
      formatAnalyzedData: null,
      formatUpdateAnalyzedData: null,
      formatUpdateAnalyzedDataList: null,
      attributeMap: [
        {
          hideId: 60,
          attributeId: 1,
          valueId: 122,
          attributeName: "高程",
          factorValue: "1022",
        },
        {
          hideId: 60,
          attributeId: 2,
          valueId: 123,
          attributeName: "坡度",
          factorValue: "21",
          unit: "度",
          attributeNameAlias: "slope"
        },
        {
          hideId: 60,
          attributeId: 3,
          valueId: 124,
          attributeName: "岩土类型",
          factorValue: "碎石土",
          unit: "",
          attributeNameAlias: "rockType"
        },
        {
          hideId: 60,
          attributeId: 4,
          valueId: 125,
          attributeName: "断层距离",
          factorValue: "800",
          unit: "米",
          attributeNameAlias: "breakDistance"
        },
        {
          hideId: 60,
          attributeId: 5,
          valueId: 126,
          attributeName: "土地利用类型",
          factorValue: "林地",
          unit: "",
          attributeNameAlias: "landUseType"
        },
        {
          hideId: 60,
          attributeId: 6,
          valueId: 127,
          attributeName: "水系距离",
          factorValue: "120",
          unit: "米",
          attributeNameAlias: "waterDistance"
        },
        {
          hideId: 60,
          attributeId: 7,
          valueId: 128,
          attributeName: "降雨量",
          factorValue: "820",
          unit: "mm",
          attributeNameAlias: "rainfall"
        },
        {
          hideId: 60,
          attributeId: 8,
          valueId: 129,
          attributeName: "植被覆盖率",
          factorValue: "60",
          unit: "%",
          attributeNameAlias: "vegetationCoverage"
        },
        {
          hideId: 60,
          attributeId: 9,
          valueId: 130,
          attributeName: "坡面曲率",
          factorValue: "3",
          unit: "%",
          attributeNameAlias: "slopeCurvature"
        },
        {
          hideId: 60,
          attributeId: 10,
          valueId: 131,
          attributeName: "坡型",
          factorValue: "阶梯",
          unit: "",
          attributeNameAlias: "slopeType"
        },
        {
          hideId: 60,
          attributeId: 11,
          valueId: 132,
          attributeName: "土壤沙砾度",
          factorValue: "30",
          unit: "%",
          attributeNameAlias: "soilSandDegree"
        }
        // 后期新增类型时，直接在这里添加映射关系即可
      ],
      flashEntities: [],
      // 新增：标记界面是否已关闭
      // isClosed: false,
      // 新增：存储所有定时器ID
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
      tableTypeOptions: [
        {label: '灾害风险区域', value: 'risk'},
        {label: '滑坡隐患点', value: 'slide'},
        {label: '泥石流隐患点', value: 'flow'}
      ],
      selectedTableType: 'risk',
      // 表格配置
      tableConfigs: {
        risk: {
          title: '地质灾害风险区列表',
          columns: [
            {prop: 'disasterName', label: '风险区名称', showOverflowTooltip: true},
            {prop: 'position', label: '地理位置', width: 150, showOverflowTooltip: true},
            {prop: 'inspectorName', label: '巡查员', width: 70},
            {prop: 'inspectorTele', label: '巡查人手机号', width: 115}
          ]
        },
        slide: {
          title: '滑坡隐患点列表',
          columns: [
            {prop: 'disasterName', label: '滑坡名称', showOverflowTooltip: true},
            {prop: 'position', label: '地理位置', width: 150, showOverflowTooltip: true},
            {prop: 'scaleGrade', label: '规模等级', width: 100},
            {prop: 'riskGrade', label: '险情等级', width: 100},
          ]
        },
        flow: {
          title: '泥石流隐患点列表',
          columns: [
            {prop: 'disasterName', label: '泥石流名称', showOverflowTooltip: true},
            {prop: 'position', label: '地理位置', width: 150, showOverflowTooltip: true},
            {prop: 'scaleGrade', label: '规模等级', width: 100},
            {prop: 'riskGrade', label: '险情等级', width: 100},
          ]
        }
      },
      // 当前表格配置
      currentTableConfig: {},
      allData: {
        risk: [],    // 风险区数据
        slide: [],  // 滑坡隐患点数据
        flow: [] // 泥石流隐患点数据
      },
      showChart: false,
      chartDatas: {
        title: "暴雨灾害链",
        xAxis: {
          data: ["滑坡影响", "泥石流影响", "风险区影响"],
        },
        seriesDatas: [0, 0, 0],
      }
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
    basicLayers.loadAdminData(); // 加载行政区划数据
    basicLayers.loadLandSlide();
    basicLayers.AddDangerAreaDataSource();
    basicLayers.loadAdminData();
    this.loadRiverData(); // 加载河流数据
    this.loadLakeData(); // 加载湖面数据
    this.total = this.tableData.length;
    this.loadData();
  },
  beforeDestroy() {
    // if (!this.isClosed) {
    this.releaseAllResources();
    // }
    // if (this.viewer && this.viewer.entities) {
    //   this.viewer.entities.removeAll();
    // }
    //
    // // 2. 清空所有 GeoJSON / CZML / KML 等数据源
    // if (this.viewer && this.viewer.dataSources) {
    //   this.viewer.dataSources.removeAll(true);
    // }
    // if (this.viewer) {
    //   this.viewer.destroy();
    //   this.viewer = null;
    // }
  },
  methods: {
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

    toggleAdminLayer() {
      this.showAdminLayer = !this.showAdminLayer;
      if (this.showAdminLayer) {
        basicLayers.loadAdminData()
      } else {
        basicLayers.removeAdminData()
      }
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
        this.findDisasterPointsFlash(adminCoordinates);
        // 检查灾害点是否在该行政区划内
        // this.checkDisasterPointsInAdministration(adminCoordinates);
      } else {
        console.log("未找到标记点所在的行政区划");
      }
    },

    async findDisasterPointsFlash(adminCoordinates) {

      let landslidePointsInside = this.findHiddenDisasterPointsInAdminCoordinates("滑坡隐患点", adminCoordinates)
      let mudslidePointsInside = this.findHiddenDisasterPointsInAdminCoordinates("泥石流隐患点", adminCoordinates)
      let riskVillageInside = this.findHiddenDisasterPointsInAdminCoordinates("风险区域", adminCoordinates)
      // 检查所有滑坡点

      let allPointsInside = [
        ...landslidePointsInside,
        // ...debrisFlowPointsInside
      ];

      // let { pointSet, matchedHuapoData } = await this.getGeologicalDisasterHide(landslidePointsInside);
      this.getGeologicalDisasterHide(landslidePointsInside);
      // this.replaceLandslidePoints(landslidePointsInside,matchedHuapoData,pointSet)
      // await this.replaceMudslidePoints(mudslidePointsInside)
      // await this.replaceRiskVillage(riskVillageInside)


    },
    //找一个区域里的隐患点
    findHiddenDisasterPointsInAdminCoordinates(type, adminCoordinates) {
      let pointsInside = []
      let points = window.viewer.entities.values.filter(
          e => e.name === type
      );
      console.log(points, adminCoordinates, "points")
      points.forEach(item => {
        let point = [item.properties.longitude, item.properties.latitude]
        if (layers.pointInPolygon(point, adminCoordinates)) {
          pointsInside.push(point);
        }
      });
      return pointsInside;
    },
    async getGeologicalDisasterHide(landslidePointsInside) {
      if (landslidePointsInside.length > 0) {
        // 创建经纬度字符串集合用于快速匹配
        let pointSet = new Set();
        landslidePointsInside.forEach(point => {
          // 使用固定精度的字符串表示经纬度
          let lon = point[0];
          let lat = point[1];
          pointSet.add(`${lon},${lat}`);
        });
        // 筛选匹配的滑坡点数据
        let matchedHuapoData = []
        let matchedHuapoEntities = []
        //获取滑坡和致灾因子 所有
        let res = await getGeologicalDisasterHideByLandSlideList()
        // console.log(res, "hides")
        let hides = res.data
        // console.log(hides, "hides")
        hides.forEach(item => {
          let lon = item.geologicalDisasterHideDTO.lon;
          let lat = item.geologicalDisasterHideDTO.lat;
          let key = `${lon},${lat}`;
          if (pointSet.has(key)) {
            matchedHuapoData.push(item.factorVoList);
          }
        });
        //降雨量值放到致灾因子里面去
        for (var i = 0; i < matchedHuapoData.length; i++) {
          for (var j = 0; j < matchedHuapoData[i].length; j++) {
            if (matchedHuapoData[i][j].attributeName === "降雨量") {
              matchedHuapoData[i][j].factorValue = this.rainfall
            }
          }
        }
        console.log(matchedHuapoData, "matchedHuapoData")
        rainSlideTrigger(matchedHuapoData).then(res => {
          // let res1 = await rainSlideTrigger(matchedHuapoData)
          // console.log(res1, "formatAnalyzedData")
          let formatAnalyzedData = res.data
          console.log(formatAnalyzedData, "formatAnalyzedData")
          // this.formatAnalyzedData = res.data;
          let landslideEntities = window.viewer.entities.values.filter(
              e => e.name === "滑坡隐患点"
          );
          console.log(landslideEntities, "landslideEntities")
          // 格式化
          formatAnalyzedData.forEach(item => {
            // let disasterNAME = item.geologicalDisasterHideDTO.disasterName || '未知灾害点';
            let lon = item.geologicalDisasterHideDTO.lon;
            let lat = item.geologicalDisasterHideDTO.lat;
            let key = `${lon},${lat}`;
            if (pointSet.has(key)) {
              matchedHuapoEntities.push(item)
            }
          });
          this.flashDisasterPoints(matchedHuapoEntities);
          this.stopLoading()
        })
      }
    },
    flashDisasterPoints(entities) {
      this.matchedHiddenHighlightEntities = entities
      console.log("传输过来的匹配实体是：", entities);

      if (!entities || entities.length === 0) return;
      pulseUtils.removePulseEntity(useSimulationPointStore(), window.viewer);
      pulseUtils.createPause(entities, useSimulationPointStore(), window.viewer);
      // 若界面已关闭，直接返回
      // if (this.isClosed) return;

      // 停止之前的闪烁动画
      // if (this.flashInterval) {
      //   if (typeof this.flashInterval === 'number') {
      //     clearInterval(this.flashInterval);
      //   } else {
      //     cancelAnimationFrame(this.flashInterval);
      //   }
      //   this.flashInterval = null;
      // }
      //
      // // 清除已有的光晕集合
      // if (this.haloCollection) {
      //   this.haloCollection.removeAll();
      //   this.viewer.scene.primitives.remove(this.haloCollection);
      // }

      // 如果没有需要处理的实体，直接返回


      // 创建光晕点集合
      // this.haloCollection = new Cesium.PointPrimitiveCollection();
      // this.viewer.scene.primitives.add(this.haloCollection);
      //
      // // 存储需要闪烁的实体及其对应的光晕配置
      // const flashConfigs = [];

      // 处理每个实体
      // entities.forEach(entity => {
      //   try {
      //     // 从实体数据中获取经纬度
      //     const lon = entity.geologicalDisasterHideDTO.lon;
      //     const lat = entity.geologicalDisasterHideDTO.lat;
      //     const level = entity.predict?.level || '低'; // 默认低风险
      //
      //     // 将经纬度转换为Cesium可用的坐标
      //     const position = Cesium.Cartesian3.fromDegrees(lon, lat);
      //
      //     // 根据风险等级确定颜色和是否闪烁
      //     let color, shouldFlash;
      //     switch (level) {
      //       case '高':
      //         color = Cesium.Color.RED;
      //         shouldFlash = true;
      //         break;
      //       case '中':
      //         color = Cesium.Color.YELLOW;
      //         shouldFlash = true;
      //         break;
      //       case '低':
      //       default:
      //         color = Cesium.Color.GREEN.withAlpha(0.5); // 低风险不闪烁，用半透明绿色标识
      //         shouldFlash = false;
      //         break;
      //     }
      //
      //     // 创建光晕点
      //     const halo = this.haloCollection.add({
      //       position: position,
      //       pixelSize: 15,
      //       color: color,
      //       outlineColor: Cesium.Color.WHITE,
      //       outlineWidth: 1,
      //       show: true,
      //       // 自定义材质用于光晕效果
      //       material: new Cesium.Material({
      //         fabric: {
      //           type: 'Halo',
      //           uniforms: {
      //             color: color,
      //             glowPower: 0.5,
      //             innerRadius: 0.5,
      //             outerRadius: 1.0
      //           },
      //           source: `
      //         uniform vec4 color;
      //         uniform float glowPower;
      //         uniform float innerRadius;
      //         uniform float outerRadius;
      //
      //         czm_material czm_getMaterial(czm_materialInput materialInput) {
      //           czm_material material = czm_getDefaultMaterial(materialInput);
      //           vec2 st = materialInput.st;
      //           float dist = distance(st, vec2(0.5, 0.5));
      //           float alpha = smoothstep(outerRadius, innerRadius, dist);
      //           alpha = pow(alpha, glowPower);
      //           material.diffuse = color.rgb;
      //           material.alpha = alpha * color.a;
      //           return material;
      //         }
      //       `
      //         }
      //       })
      //     });
      //
      //     // 只对需要闪烁的实体进行动画配置
      //     if (shouldFlash) {
      //       flashConfigs.push({
      //         halo: halo,
      //         baseColor: color,
      //         baseSize: 15
      //       });
      //     }
      //   } catch (error) {
      //     console.error("处理实体时出错:", error, "实体数据:", entity);
      //   }
      // });
      //
      // // 如果没有需要闪烁的实体，直接返回
      // if (flashConfigs.length === 0) return;
      //
      // // 动画控制变量
      // let animationTime = 0;
      // const animationDuration = 2000; // 动画周期，毫秒
      //
      // // 启动动画循环
      // this.flashInterval = setInterval(() => {
      //   animationTime = (animationTime + 50) % animationDuration;
      //   const normalizedTime = animationTime / animationDuration;
      //
      //   // 更新所有需要闪烁的光晕点
      //   flashConfigs.forEach(config => {
      //     const {halo, baseColor, baseSize} = config;
      //
      //     // 计算光晕大小（从原始大小到3倍）
      //     const sizeFactor = 1.0 + Math.sin(normalizedTime * Math.PI * 2) * 2;
      //     halo.pixelSize = baseSize * sizeFactor;
      //
      //     // 计算光晕透明度（大小最大时透明度最低）
      //     const alphaFactor = 1.0 - (sizeFactor - 1.0) / 2.0;
      //     halo.color = new Cesium.Color(
      //         baseColor.red,
      //         baseColor.green,
      //         baseColor.blue,
      //         alphaFactor * 0.8
      //     );
      //   });
      // }, 50);
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

    // 计算并显示弹出面板
    // async calculateAndShowPopup(entity, movementPosition) {
    //   try {
    //     const scene = this.viewer.scene;
    //     const clock = this.viewer.clock;
    //     // 获取当前时间
    //     const currentTime = clock.currentTime;
    //     // 使用当前时间获取位置值
    //     const position = entity.position.getValue(currentTime);
    //     // 正确检查位置有效性
    //     if (!position ||
    //         isNaN(position.x) || isNaN(position.y) || isNaN(position.z) ||
    //         !isFinite(position.x) || !isFinite(position.y) || !isFinite(position.z)) {
    //       console.log('位置无效或未定义');
    //       return;
    //     }
    //     // 转换为窗口坐标
    //     const windowPosition = scene.cartesianToCanvasCoordinates(position);
    //     if (windowPosition) {
    //       // 计算最终位置（添加偏移量）
    //       this.popupPosition = {
    //         x: windowPosition.x + 20,
    //         y: windowPosition.y - 10
    //       };
    //       // 检测边界防止面板超出视口
    //       this.checkPopupBoundary();
    //       // 显示弹出面板
    //       this.popupVisible = true;
    //       // 平滑定位到点击的实体
    //       await this.viewer.flyTo(entity, {
    //         duration: 0.5,
    //         offset: new Cesium.HeadingPitchRange(0, Cesium.Math.toRadians(-30), 5000)
    //       });
    //     }
    //   } catch (error) {
    //     console.error("计算弹出面板位置出错:", error);
    //   }
    // },
    // // 检测弹出面板边界
    // checkPopupBoundary() {
    //   const panelWidth = 280;
    //   const panelHeight = 200;
    //   const canvas = this.viewer.canvas;
    //   const rect = canvas.getBoundingClientRect();
    //   // 防止面板超出右边界
    //   if (this.popupPosition.x + panelWidth > rect.right) {
    //     this.popupPosition.x = rect.right - panelWidth - 10;
    //   }
    //   // 防止面板超出下边界
    //   if (this.popupPosition.y + panelHeight > rect.bottom) {
    //     this.popupPosition.y = rect.bottom - panelHeight - 10;
    //   }
    //   // 防止面板超出左边界
    //   if (this.popupPosition.x < 10) {
    //     this.popupPosition.x = 10;
    //   }
    //   // 防止面板超出上边界
    //   if (this.popupPosition.y < 10) {
    //     this.popupPosition.y = 10;
    //   }
    // },
    // 计算弹出面板左坐标
    // calculatePopupLeft() {
    //   return this.popupPosition.x;
    // },
    // 计算弹出面板上坐标
    // calculatePopupTop() {
    //   return this.popupPosition.y;
    // },
    // 关闭弹出面板
    // closePopup() {
    //   this.popupVisible = false;
    //   this.selectedEntityData = null;
    // },
    // 阻止事件冒泡
    // stopPropagation(e) {
    //   e.stopPropagation();
    // },
    // 获取灾害类型名称
    // getDisasterTypeName(type) {
    //   const typeMap = {
    //     'landslide': '滑坡',
    //     'debrisFlow': '泥石流',
    //     'secondaryRisk': '次生灾害风险区'
    //   };
    //   return typeMap[type] || type;
    // },
    toggleRiskTable() {
      this.showRiskTable = !this.showRiskTable;
    },
    // 行点击事件处理
    handleRowClick(row, event, column) {
      // console.log('点击行数据:', row);
      this.jumpToPosition(row);
    },
    // 跳转到指定位置
    jumpToPosition(row) {
      if (!this.viewer || !row.lon || !row.lat) return;
      // 从行数据获取经纬度
      const longitude = parseFloat(row.lon);
      const latitude = parseFloat(row.lat);

      // 设置视角参数
      const height = 1000; // 视角高度(米)
      const heading = 0;   // 方位角(弧度)
      const pitch = -Math.PI / 4; // 俯仰角(弧度)
      // 计算目标位置
      const target = Cesium.Cartesian3.fromDegrees(longitude, latitude, height);
      // 跳转到目标位置
      this.viewer.camera.setView({
        destination: target,
        orientation: {
          // heading: heading,
          // pitch: pitch,
          roll: 0
        },
        duration: 2.0 // 动画持续时间(秒)
      });
      // 可选：高亮显示该风险区
      // this.highlightRiskArea(row);
    },
    // 高亮显示风险区
    // highlightRiskArea(row) {
    //   // 这里可以添加高亮显示逻辑
    //   // 例如：在地图上标记该风险区位置
    //   console.log('高亮显示风险区:', row.disasterName);
    // },
    handleSizeChange(size) {
      this.pageSize = size;
      this.handlePagination(this.allData[this.selectedTableType] || []);
    },
    loadData() {
      this.loading = true;
      setTimeout(() => {
        this.loading = false;
        this.total = this.tableData.length;
      }, 500);
    },

    toggleTablePanel() {
      this.showRiskTable = !this.showRiskTable;
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
      this.disasterEntities = [];
      this.landslideEntities = [];
      this.debrisFlowEntities = [];
      this.secondaryRiskEntities = [];
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
              }
              else if (entity.name === "暴雨中心") {
                this.eqCenterPanelVisible = false;
                this.rainCenterPanelVisible = true;
                console.log(this.rainCenterPanelVisible, "打开面板啊")
                this.showBaseInfo = false;
                // this.PanelPosition = this.selectedEntityPosition; // 更新位置

                this.PanelData = {}
                this.PanelData = clickPointsAndShowPanel.extractDataForPanel(entity, this.matchedHiddenHighlightEntities)
                console.log(this.PanelData, "显示数据")
              }
              else if (entity.name === "滑坡隐患点") {
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
              }
              else if (entity.name === "泥石流隐患点") {
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
              }
              else if (entity.name === "风险区域") {
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

    // 表格类型改变时触发
    handleTableTypeChange(type) {
      this.selectedTableType = type;
      this.currentTableConfig = this.tableConfigs[type];
      this.currentPage = 1; // 重置页码
      this.loadTableData(type); // 加载对应类型的数据
    },
    // 加载表格数据
    loadTableData(type) {
      this.loading = true;
      // 这里根据类型加载不同的数据
      this.tableData = this.allData[type] || [];

      console.log(this.tableData, "当前的数据是：============")

      this.total = this.tableData.length;
      this.handlePagination(this.tableData);
      this.loading = false;
    },
    // 处理分页
    handlePagination(data) {
      this.displayData = data.slice(
          (this.currentPage - 1) * this.pageSize,
          this.currentPage * this.pageSize
      );
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


</style>
