<template>
  <div class="cesium-container" ref="cesiumContainer">
    <!-- 功能按钮 -->
    <div class="controls">
        <div class="rain-btn" @click="toggleRainMode">
          {{ rainMode ? '取消区域分析' : '标记区域分析' }}
        </div>
      <div class="refresh" @click="refreshView">
        重置标记区域
      </div>
    </div>
    <rain-layer-control :viewer="viewer" :setupEntityClickHandler="setupEntityClickHandler"/>
    <!-- 加载状态提示 -->
    <div v-if="showInfoPanel" class="rain-info-panel">
      <div class="panel-title">选择区域</div>
      <div class="panel-content">
        <div class="form-item">
          <label class="jiangyuliang">半径:</label>
          <input v-model.number="rainfall" type="number" min="0" max="500" step="1" />
          <span>公里</span>
        </div>
        <div class="button-group">
          <button @click="confirmRainPoint" :disabled="!rainfall" style="width: 80px">确认添加</button>
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
    transform: popupVisible ? 'scale(1)' : 'scale(0.5)'}"
        @click.stop="stopPropagation">
      <div class="popup-header">
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
    <!-- 图例面板 -->
    <Legend ref="legendRef"></Legend>
    <!-- chart -->
    <Chart v-if="showChart" :chartDatas="chartDatas"></Chart>
    <!-- 表格 -->
    <Table v-if="showTable" :dataTypes="dataTypes"></Table>
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
import landslideIcon from "@/assets/images/landslide.png"
import flowIcon from "@/assets/images/DebrisFlow.png"
import riskAreaIcon from "@/assets/images/riskArea.png"
import {initCesium} from '@/cesium/initLayer.js'
import {getRisk, getSlide, getFlow} from "@/api/system/aroundanalysis.js";
import Chart from "../../components/Earthquake/Chart.vue";
import Table from "../../components/Earthquake/Table.vue";
import RainLayerControl from "@/components/ScenarioSimulation/rainLayerControl.vue";
import basicLayers from "@/cesium/basicLayers.js";
import Legend from "@/components/Earthquake/Legend.vue";
import {nextTick} from "vue";


export default {
  name: 'AroundAnalysis',
  components: {
    Legend,
    RainLayerControl,
    Chart,
    Table
  },
  data() {
    return {
      disasterEntities: [],
      showChart: false,
      showTable: false,
      viewer: null,
      wmsLayers: [],
      currentMapType: 0,
      rainMode: false,
      showInfoPanel: false,
      selectedPosition: null,
      rainfall: 10,
      duration: 2,
      rainPoints: [],
      weatherActive: false,
      showAdminLayer: true,
      rainEffect: null,
      canMarkAgain: true,
      adminDataSource: null,
      riverDataSource: null,
      lakeDataSource: null, // 湖面数据数据源
      dataSource: null,
      administrationData: [BaQiaoArea, BeiLin, ChangAn, GaoLing, HuYi, LanTIan, LianHu, LinTong, WeiYang, XinCheng, YanLiang, YanTa, ZhouZhi],
      adminDataSources: [],
      faultZoneList: [],
      // 河流数据
      riverData: riverData,
      lakeData: lakeData,
      // 灾害点数据
      HuapoData: null,
      NishiliuData: null,
      DangerSourceData: null,//危险源数据
      isLoading: false,
      loadingText: '加载数据中...',
      rainEllipseScale: 1000, // 圆半径的缩放系数
      // 图例相关
      districtColors: {}, // 存储各区县的颜色
      clickHandler: null,
      layerHandler: null,
      landslidePoints: [],     // 滑坡点
      debrisFlowPoints: [],    // 泥石流点
      secondaryRiskPoints: [], // 次生灾害风险点
      selectedEntityData: null,
      popupPosition: {x: 0, y: 0},
      popupVisible: false,
      lastPickedEntity: null,
      currentPage: 1,
      pageSize: 10,
      loading: false,
      isExpanded: false, // 表格扩展状态，true为扩展，false为收缩
      chartDatas: {
        title: "各点数量统计",
        xAxis: {
          data: ["医院", "风险源", "避难所", "消防站", "物资储备点", "学校"],
        },
        attribute: {
          height: '400',
          width: '500',
        },
        seriesDatas: [0, 0, 0, 0, 0, 0],
      },
      dataTypes: {
        filterCriteria: [
          {
            name: "滑坡隐患点",
            value: "type1",
          },
          {
            name: "泥石流隐患点",
            value: "type2",
          },
          {
            name: "风险区",
            value: "type3",
          },
          {
            name: "医院",
            value: "type4",
          },
          {
            name: "风险源",
            value: "type5",
          },
          {
            name: "避难所",
            value: "type6",
          },
          {
            name: "消防站",
            value: "type7",
          },
          {
            name: "物资储备点",
            value: "type8",
          },
          {
            name: "学校",
            value: "type9",
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
        type4: {
          headers: ["医院名称", "位置", "医院等级", "所有床位"],
          data: [],
        },
        type5: {
          headers: ["风险源名称", "位置", "风险源类型", "等级"],
          data: [],
        },
        type6: {
          headers: ["避难所名称", "位置", "避难所类型", "容纳人数"],
          data: [],
        },
        type7: {
          headers: ["消防站名称", "位置", "消防站类型", "消防员人数"],
          data: [],
        },
        type8: {
          headers: ["储备点名称", "位置", "储备点类型", "有效库容"],
          data: [],
        },
        type9: {
          headers: ["学校名称", "位置", "在校学生数", "是否重要"],
          data: [],
        }
      },
    }
  },
  mounted() {
    this.load();
    this.getNum();//从后端读取数据，异步
    this.loadRiverData(); // 加载河流数据
    this.loadLakeData(); // 加载湖面数据
    basicLayers.loadFlashFlood();
    basicLayers.loadWater();
    basicLayers.loadAdminData();
    this.loadData();
  },
  beforeDestroy() {
    this.releaseAllResources();

    // 额外清理全局引用
    if (window.viewer === this.viewer) {
      window.viewer = null;
    }
  },
  methods: {
    getNum(){
      //获取滑坡点
      getSlide().then((res) =>{
        this.HuapoData = res.data;
      });
      //获取泥石流点
      getFlow().then((res) =>{
        this.NishiliuData = res.data;
      });
      //获取风险区点
      getRisk().then((res) =>{
        this.DangerAreaData = res.data;
        //放在此处确保前面的所有数据都读取到了，再渲染点。
        this.loadDisasterData();
      });
    },
    load() {
      // Cesium.Ion.defaultAccessToken = '';
      const container = this.$refs.cesiumContainer;
      this.viewer = initCesium(container)
      this.viewer._cesiumWidget._creditContainer.style.display = "none";
      window.viewer = this.viewer;//全局绑定viewer，此举是为了点击表格可以跳转对应的点。
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
    },
    async refreshView() {
      this.isLoading = true;

      try {
        // 1. 完全清理所有资源
        this.releaseAllResources();
        this.resetAllStates();

        // 2. 等待清理完成
        await new Promise(resolve => setTimeout(resolve, 200));

        // 3. 重新初始化
        const container = this.$refs.cesiumContainer;
        this.viewer = initCesium(container);
        window.viewer = this.viewer;

        await nextTick();

        // 4. 设置初始视图
        this.viewer.camera.setView({
          destination: Cesium.Cartesian3.fromDegrees(108.93, 34.27, 300000),
          orientation: {
            heading: Cesium.Math.toRadians(0),
            pitch: Cesium.Math.toRadians(-90),
            roll: 0.0
          }
        });

        // 5. 重新初始化所有组件
        this.initRainEffect();
        document.addEventListener('keydown', this.onKeyDown);

        // 6. 重新加载数据
        this.getNum();
        this.loadRiverData();
        this.loadLakeData();
        basicLayers.loadFlashFlood();
        basicLayers.loadWater();
        basicLayers.loadAdminData();
        this.loadData();

        // 7. 重新设置点击处理器（延迟执行确保viewer完全初始化）
        setTimeout(() => {
          this.setupEntityClickHandler();
        }, 500);

      } catch (error) {
        console.error('刷新视图失败:', error);
      } finally {
        this.isLoading = false;
      }
    },
    releaseAllResources() {
      // 1. 清理事件处理器
      if (this.clickHandler && !this.clickHandler.isDestroyed()) {
        try {
          this.clickHandler.destroy();
        } catch (error) {
          console.warn('清理点击处理器时出错:', error);
        }
        this.clickHandler = null;
      }

      if (this.handler && !this.handler.isDestroyed()) {
        try {
          this.handler.destroy();
        } catch (error) {
          console.warn('清理地图点击处理器时出错:', error);
        }
        this.handler = null;
      }

      // 2. 清理闪烁动画
      if (this.flashInterval) {
        clearInterval(this.flashInterval);
        this.flashInterval = null;
      }

      // 3. 清理光晕集合
      if (this.haloCollection) {
        try {
          this.viewer.scene.primitives.remove(this.haloCollection);
        } catch (error) {
          console.warn('清理光晕集合时出错:', error);
        }
        this.haloCollection = null;
      }

      // 4. 清理Cesium核心资源
      if (this.viewer && !this.viewer.isDestroyed()) {
        try {
          // 先移除所有事件监听器
          this.viewer.cesiumWidget.screenSpaceEventHandler.removeInputAction(
              Cesium.ScreenSpaceEventType.LEFT_CLICK
          );
          this.viewer.cesiumWidget.screenSpaceEventHandler.removeInputAction(
              Cesium.ScreenSpaceEventType.LEFT_UP
          );
          this.viewer.cesiumWidget.screenSpaceEventHandler.removeInputAction(
              Cesium.ScreenSpaceEventType.MOUSE_MOVE
          );
          // 停止所有动画
          this.viewer.clock.shouldAnimate = false;

          // 移除所有实体和数据源
          this.viewer.entities.removeAll();
          this.viewer.dataSources.removeAll();
          this.viewer.scene.primitives.removeAll();
          this.viewer.imageryLayers.removeAll();

          // 销毁viewer
          this.viewer.destroy();
        } catch (error) {
          console.warn('清理Cesium资源时出错:', error);
        }
      }
      this.viewer = null;
      // 5. 清理键盘事件
      document.removeEventListener('keydown', this.onKeyDown);
      // 6. 清理雨效
      this.rainEffect = null;
    },
    // 加载湖面数据
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
    // 加载灾害点数据
    loadDisasterData() {
      try {
        // 确保数据存在且格式正确
        const huapoFeatures = this.HuapoData?.features || [];
        const nishiliuFeatures = this.NishiliuData?.features || [];
        const dangerAreaFeatures = this.DangerAreaData?.features || [];

        // 存储所有添加的实体，用于事件处理
        this.disasterEntities = [];
        // 分别存储不同类型灾害点的实体引用
        this.landslideEntities = [];
        this.debrisFlowEntities = [];
        this.secondaryRiskEntities = [];
        // 加载滑坡点
        huapoFeatures.forEach(point => {
          const properties = point.properties || {};
          const disasterNAME = properties.disasterName || '未知灾害点';
          const longitude = point.geometry.coordinates[0];
          const latitude = point.geometry.coordinates[1];

          // 加入滑坡点到数组
          this.landslidePoints.push([longitude, latitude])

          // 创建灾害点实体
          const entity = this.viewer.entities.add({
            position: Cesium.Cartesian3.fromDegrees(longitude, latitude, 5),
            // 点
            billboard: {
              // 图像地址，URI或Canvas的属性   @/assets/images/landslide.png
              image: landslideIcon,
              width: 40, // 图片宽度,单位px
              height: 40, // 图片高度，单位px
              eyeOffset: new Cesium.Cartesian3(0, 0, 0), // 与坐标位置的偏移距离
              color: Cesium.Color.WHITE.withAlpha(1), // 固定颜色
              scale: 0.8, // 缩放比例
              heightReference: Cesium.HeightReference.CLAMP_TO_GROUND, // 绑定到地形高度
              scaleByDistance: new Cesium.NearFarScalar(500, 1, 5e5, 0.1),
              depthTest: false, // 禁止深度测试
              disableDepthTestDistance: Number.POSITIVE_INFINITY, // 不进行深度测试
              show: true
            },
            // 添加灾害类型信息，用于弹窗显示
            description: this.createDisasterDescription(properties, '滑坡'),
            // 保存原始样式，用于闪烁恢复
            originalColor: Cesium.Color.RED,
            originalPixelSize: 15,
            // 标记灾害类型
            disasterType: 'landslide',
            disasterData: point,
          });
          // 保存实体引用
          this.disasterEntities.push(entity);
          this.landslideEntities.push(entity);
        });
        // 加载泥石流点
        nishiliuFeatures.forEach(point => {
          const properties = point.properties || {};
          const disasterNAME = properties.disasterName || '未知灾害点';
          const longitude = parseFloat(point.geometry.coordinates[0]);
          const latitude = parseFloat(point.geometry.coordinates[1]);
          // 加入泥石流点
          this.debrisFlowPoints.push([longitude, latitude])
          // 创建灾害点实体
          const entity = this.viewer.entities.add({
            position: Cesium.Cartesian3.fromDegrees(longitude, latitude, 5),
            billboard: {
              // 图像地址，URI或Canvas的属性   @/assets/images/landslide.png
              image: flowIcon,
              width: 40, // 图片宽度,单位px
              height: 40, // 图片高度，单位px
              eyeOffset: new Cesium.Cartesian3(0, 0, 0), // 与坐标位置的偏移距离
              color: Cesium.Color.WHITE.withAlpha(1), // 固定颜色
              scale: 0.8, // 缩放比例
              heightReference: Cesium.HeightReference.CLAMP_TO_GROUND, // 绑定到地形高度
              scaleByDistance: new Cesium.NearFarScalar(500, 1, 5e5, 0.1),
              depthTest: false, // 禁止深度测试
              disableDepthTestDistance: Number.POSITIVE_INFINITY, // 不进行深度测试
              show: true
            },
            // 添加灾害类型信息，用于弹窗显示
            description: this.createDisasterDescription(properties, '泥石流'),
            // 保存原始样式，用于闪烁恢复
            originalColor: Cesium.Color.YELLOW,
            originalPixelSize: 15,
            // 标记灾害类型
            disasterType: 'debrisFlow',
            disasterData: point,
          });

          // 保存实体引用
          this.disasterEntities.push(entity);
          this.debrisFlowEntities.push(entity);
        });
        // 添加风险区点
        dangerAreaFeatures.forEach(point => {
          const disasterName = point.properties.disasterName; //  风险区名称
          const unitCode = point.properties.unitCode; // 单位代码
          const position = point.properties.position; // 位置
          const longitude = parseFloat(point.geometry.coordinates[0]);  //经度
          const latitude = parseFloat(point.geometry.coordinates[1]);   //纬度

          // 加入次生灾害点
          this.secondaryRiskPoints.push([longitude, latitude])
          // 创建灾害点实体
          const entity = this.viewer.entities.add({
            position: Cesium.Cartesian3.fromDegrees(longitude, latitude, 5),
            billboard: {
              // 图像地址，URI或Canvas的属性   @/assets/images/landslide.png
              image: riskAreaIcon,
              width: 40, // 图片宽度,单位px
              height: 40, // 图片高度，单位px
              eyeOffset: new Cesium.Cartesian3(0, 0, 0), // 与坐标位置的偏移距离
              color: Cesium.Color.WHITE.withAlpha(1), // 固定颜色
              scale: 0.8, // 缩放比例
              heightReference: Cesium.HeightReference.CLAMP_TO_GROUND, // 绑定到地形高度
              scaleByDistance: new Cesium.NearFarScalar(500, 1, 5e5, 0.1),
              depthTest: false, // 禁止深度测试
              disableDepthTestDistance: Number.POSITIVE_INFINITY, // 不进行深度测试
              show: true
            },
            // // 文字
            // label: {
            //   text: `${position}`,
            //   font: '15pt Source Han Sans CN',
            //   fillColor: Cesium.Color.WHITE,
            //   backgroundColor: Cesium.Color.AQUA,
            //   showBackground: false,
            //   outline: true,
            //   outlineColor: Cesium.Color.BLACK,
            //   outlineWidth: 10,
            //   scale: 1.0,
            //   style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            //   verticalOrigin: Cesium.VerticalOrigin.CENTER,
            //   horizontalOrigin: Cesium.HorizontalOrigin.LEFT,
            //   pixelOffset: new Cesium.Cartesian2(-70, -35),
            //   distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 40000),
            //   show: false
            // },
            // 添加灾害类型信息，用于弹窗显示
            description: this.createDisasterDescription({position}, '次生灾害风险区'),
            // 保存原始样式，用于闪烁恢复
            originalColor: Cesium.Color.ORANGE,
            originalPixelSize: 15,
            // 标记灾害类型
            disasterType: 'secondaryRisk',
            disasterData: point,
          });
          // 保存实体引用
          this.disasterEntities.push(entity);
          this.secondaryRiskEntities.push(entity);
        });
        // 设置实体点击事件
        this.setupEntityClickHandler();
      } catch (error) {
        console.error('处理灾害数据时出错:', error);
      }
    },
    // // 创建灾害点详情描述
    createDisasterDescription(properties, type) {

      var disasterType = type.includes("滑坡") ? "滑坡" : "泥石流"
      return `
    <div style="font-family: Arial, sans-serif; padding: 50px;">
      <h3 style="color: ${disasterType === '滑坡' ? 'red' : 'yellow'}; margin-top: 0;">
        ${type || '未知灾害点'}
      </h3>
      <p><strong>灾害类型:</strong> ${disasterType}</p>
      <p><strong>坐标:</strong> ${properties.longitude || '未知'}, ${properties.latitude || '未知'}</p>
    </div>
`;
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
        if (pickedObject.id.disasterData === undefined) {
          return;
        }
        // 隐藏之前的弹出面板
        this.closePopup();

        if (Cesium.defined(pickedObject) && Cesium.defined(pickedObject.id)) {
          const entity = pickedObject.id;
          // 获取实体的灾害数据
          this.selectedEntityData = entity.disasterData || {};
          // 计算弹出框位置并显示面板
          this.calculateAndShowPopup(entity, movement.position);
        } else {
          // 如果点击在空白处，隐藏信息框
          this.viewer.selectedEntity = undefined;
        }
      }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
    },
    // 准备开始点击事件
    toggleRainMode() {
      // 若不允许标记且当前为开启状态，则直接关闭
      if (!this.canMarkAgain && this.rainMode) {
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
    // 在地图上标记
    onMapClick(movement) {
      if (!this.rainMode || !this.canMarkAgain) return;

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
      if (!this.selectedPosition || !this.canMarkAgain) return;
      const {longitude, latitude, cartesian} = this.selectedPosition;
      const entity = this.viewer.entities.add({
        position: cartesian,
        point: {
          // 根据降雨量调整点大小
          pixelSize: 15,
          color: Cesium.Color.DARKRED,
          outlineColor: Cesium.Color.WHITE,
          outlineWidth: 1,
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
        }
      });

      // 添加暴雨影响区域椭圆面
      const ellipseEntity = this.addRainEllipse(cartesian, this.rainfall);
      this.rainPoints.push(entity);
      this.rainPoints.push({ellipse: ellipseEntity});
      this.showInfoPanel = false;

      this.canMarkAgain = false;
      this.rainMode = false;

      if (this.handler) {
        this.handler.destroy();
        this.handler = null;
      }
      document.body.style.cursor = '';

      this.viewer.flyTo(entity, {
        duration: 1.5,
        offset: new Cesium.HeadingPitchRange(0, Cesium.Math.toRadians(-30), 5000)
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
      //设置半径
      this.setRainIntensity = (value) => {
        this.rainEffect.uniforms.rainIntensity = Math.max(0.0, Math.min(1.0, value));
        this.updateRainUI(value); // 更新UI显示
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
    // 添加区域圆
    addRainEllipse(centerCartesian, rainfall) {
      // 根据所给量计算圆半径 (mm -> 米)
      const Radius = rainfall * this.rainEllipseScale; // 半径
      // 计算圆边界的经纬度坐标
      const ellipseCoordinates = this.calculateEllipseCoordinates(
          centerCartesian,
          Radius,
      );

      // 创建圆实体
      const ellipseEntity = this.viewer.entities.add({
        position: centerCartesian,
        ellipse: {
          semiMajorAxis: Radius,
          semiMinorAxis: Radius,
          height: 0,
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
          material: new Cesium.Color(1, 0, 0, 0.2), // 半透明红色
          outline: true,
          outlineColor: Cesium.Color.RED,
          outlineWidth: 1,
          shadow: true,
          show: true,
          depthFailMaterial: new Cesium.Color(0, 0, 1, 0.1)
        }
      });

      // 存储圆坐标数据
      ellipseEntity.coordinates = ellipseCoordinates;
      // 检测灾害点是否在圆范围内
      this.checkDisasterPointsInEllipse(centerCartesian, Radius);
      return ellipseEntity;
    },
    // 计算圆形边界的经纬度坐标
    calculateEllipseCoordinates(centerCartesian, majorRadius) {
      const centerCartographic = Cesium.Cartographic.fromCartesian(centerCartesian);
      const centerLon = centerCartographic.longitude;
      const centerLat = centerCartographic.latitude;

      const samples = 100; // 采样点数量
      const coordinates = [];

      for (let i = 0; i < samples; i++) {
        const angle = (i / samples) * Math.PI * 2;

        // 圆形情况：直接使用极坐标公式
        const x = majorRadius * Math.cos(angle);
        const y = majorRadius * Math.sin(angle);
        const lonOffset = x / (111320 * Math.cos(centerLat));
        const latOffset = y / 111320;
        coordinates.push([
          Cesium.Math.toDegrees(centerLon + lonOffset),
          Cesium.Math.toDegrees(centerLat + latOffset)
        ]);
      }

      return coordinates;
    },
    // 检查灾害点是否在圆范围内
    checkDisasterPointsInEllipse(centerCartesian, majorRadius) {
      // 存储在圆内的灾害点坐标
      const landslidePointsInside = [];
      const debrisFlowPointsInside = [];
      const secondaryRiskPointsInside = [];
      // 检查所有滑坡点
      this.landslidePoints.forEach(point => {
        if (this.isPointInCircle(point, centerCartesian, majorRadius)) {
          landslidePointsInside.push(point);
        }
      });
      // 检查所有泥石流点
      this.debrisFlowPoints.forEach(point => {
        if (this.isPointInCircle(point, centerCartesian, majorRadius)) {
          debrisFlowPointsInside.push(point);
        }
      });
      // 检查所有次生灾害风险点
      this.secondaryRiskPoints.forEach(point => {
        if (this.isPointInCircle(point, centerCartesian, majorRadius)) {
          secondaryRiskPointsInside.push(point);
        }
      });
      // 合并所有在圆内的灾害点坐标
      const allPointsInside = [
        ...landslidePointsInside,
        ...debrisFlowPointsInside,
        ...secondaryRiskPointsInside
      ];
      // 闪烁在椭圆内的灾害点
      if (allPointsInside.length > 0) {
        // 直接传递坐标数组到闪烁函数
        this.flashDisasterPoints(allPointsInside);

        console.log(`在圆内的灾害点数量: ${allPointsInside.length}`);
        console.log(`滑坡点: ${landslidePointsInside.length}`);
        console.log(`泥石流点: ${debrisFlowPointsInside.length}`);
        console.log(`次生灾害风险点: ${secondaryRiskPointsInside.length}`);

        // 预处理：将坐标数组转换为字符串集合
        const dangerA = new Set();
        secondaryRiskPointsInside.forEach(coords => {
          dangerA.add(coords.join(','));
        });

        const slideA = new Set();
        landslidePointsInside.forEach(coords => {
          slideA.add(coords.join(','));
        });

        const flowA = new Set();
        debrisFlowPointsInside.forEach(coords => {
          flowA.add(coords.join(','));
        });

        // 主逻辑
        const dangerAreaDates = this.DangerAreaData?.features || [];
        const landSlideDates = this.HuapoData?.features || [];
        const flowDates = this.NishiliuData?.features || [];
        //风险区表数据加载
        dangerAreaDates.forEach(entity => {
          const entityCoords1 = entity.geometry.coordinates;
          const coordsStr1 = entityCoords1.join(',');
          // 检查坐标字符串是否存在于集合中
          if (dangerA.has(coordsStr1)) {
            console.log("找到了匹配的坐标:", entityCoords1);
            this.dataTypes.type3.data.push({
              field1: entity.properties.disasterName,
              field2: entity.properties.position,
              field3: entity.properties.inspectorName,
              field4: entity.properties.inspectorTele,
              field5: entity.properties.lon,
              field6: entity.properties.lat,
            });
          }
        });
        //滑坡表数据加载
        landSlideDates.forEach(entity => {
          const entityCoords2 = entity.geometry.coordinates;
          const coordsStr2 = entityCoords2.join(',');
          // 检查坐标字符串是否存在于集合中
          if (slideA.has(coordsStr2)) {
            console.log("找到了匹配的坐标:", entityCoords2);
            this.dataTypes.type1.data.push({
              field1: entity.properties.disasterName,
              field2: entity.properties.position,
              field3: entity.properties.scaleGrade,
              field4: entity.properties.riskGrade,
              field5: entity.properties.lon,
              field6: entity.properties.lat,
            });
          }
        });
        //泥石流表数据加载
        flowDates.forEach(entity => {
          const entityCoords3 = entity.geometry.coordinates;
          const coordsStr3 = entityCoords3.join(',');
          // 检查坐标字符串是否存在于集合中
          if (flowA.has(coordsStr3)) {
            console.log("找到了匹配的坐标:", entityCoords3);
            this.dataTypes.type2.data.push({
              field1: entity.properties.disasterName,
              field2: entity.properties.position,
              field3: entity.properties.scaleGrade,
              field4: entity.properties.riskGrade,
              field5: entity.properties.lon,
              field6: entity.properties.lat,
            });
          }
        });
        this.showTable = true;
        this.checkOtherPointsInEllipse(centerCartesian, majorRadius);
      }
    },
    //检查其他店是否在圆内
    checkOtherPointsInEllipse(centerCartesian, radius){
      //储存各点坐标
      const hospitalPointsInside = [];
      const dangerSourcePointsInside = [];
      const shelterPointsInside = [];
      const storePointsInside = [];
      const fireFighterPointsInside = [];
      const schoolPointsInside = [];

      basicLayers.hospitalPoints.forEach(point =>{
        if(this.isPointInCircle(point, centerCartesian, radius)){
          hospitalPointsInside.push(point);
        }
      })

      basicLayers.dangerSourcePoints.forEach(point=>{
        if(this.isPointInCircle(point, centerCartesian, radius)){
          dangerSourcePointsInside.push(point);
        }
      })

      basicLayers.shelterPoints.forEach(point=>{
        if(this.isPointInCircle(point, centerCartesian, radius)){
          shelterPointsInside.push(point);
        }
      })

      basicLayers.storePoints.forEach(point=>{
        if(this.isPointInCircle(point, centerCartesian, radius)){
          storePointsInside.push(point);
        }
      })

      basicLayers.fireFighterPoints.forEach(point=>{
        if(this.isPointInCircle(point, centerCartesian, radius)){
          fireFighterPointsInside.push(point);
        }
      })

      basicLayers.schoolPoints.forEach(point=>{
        if(this.isPointInCircle(point, centerCartesian, radius)){
          schoolPointsInside.push(point);
        }
      })

      const allPointsInside = [
          ...fireFighterPointsInside,
          ...dangerSourcePointsInside,
          ...shelterPointsInside,
          ...storePointsInside,
          ...hospitalPointsInside,
          ...schoolPointsInside
      ];

      if(allPointsInside.length > 0){
        console.log(`在圆内的其他点数量: ${allPointsInside.length}`);
        console.log(`医院: ${hospitalPointsInside.length}`);
        console.log(`危险源 ${dangerSourcePointsInside.length}`);
        console.log(`避难所: ${shelterPointsInside.length}`);
        console.log(`消防站: ${fireFighterPointsInside.length}`);
        console.log(`物资储备点: ${storePointsInside.length}`);
        console.log(`学校: ${schoolPointsInside.length}`)

        // 预处理：将坐标数组转换为字符串集合
        const hospital = new Set();
        hospitalPointsInside.forEach(coords => {
          hospital.add(coords.join(','));
        });

        const danger = new Set();
        dangerSourcePointsInside.forEach(coords => {
          danger.add(coords.join(','));
        });

        const shelter = new Set();
        shelterPointsInside.forEach(coords => {
          shelter.add(coords.join(','));
        });

        const fire = new Set();
        fireFighterPointsInside.forEach(coords => {
          fire.add(coords.join(','));
        });

        const store = new Set();
        storePointsInside.forEach(coords => {
          store.add(coords.join(','));
        });

        const school = new Set();
        schoolPointsInside.forEach(coords => {
          school.add(coords.join(','));
        })

        // 主逻辑
        const hospitalDates = basicLayers.hospitalData?.features || [];
        const dangerSourceDates = basicLayers.dangerSourceData?.features || [];
        const shelterDates = basicLayers.shelterData?.features || [];
        const fireDates = basicLayers.fireFighterData?.features || [];
        const storeDates = basicLayers.storeData?.features || [];
        const schoolDates = basicLayers.schoolData?.features || [];


        //医院表数据加载
        hospitalDates.forEach(entity => {
          const entityCoords1 = entity.geometry.coordinates;
          const coordsStr1 = entityCoords1.join(',');
          // 检查坐标字符串是否存在于集合中
          if (hospital.has(coordsStr1)) {
            console.log("找到了匹配的坐标:", entityCoords1);
            this.dataTypes.type4.data.push({
              field1: entity.properties.hospitalName,
              field2: entity.properties.position,
              field3: entity.properties.level,
              field4: entity.properties.beds,
              field5: entity.properties.lon,
              field6: entity.properties.lat,
            });
          }
        });
        //风险源表数据加载
        dangerSourceDates.forEach(entity => {
          const entityCoords2 = entity.geometry.coordinates;
          const coordsStr2 = entityCoords2.join(',');
          // 检查坐标字符串是否存在于集合中
          if (danger.has(coordsStr2)) {
            console.log("找到了匹配的坐标:", entityCoords2);
            this.dataTypes.type5.data.push({
              field1: entity.properties.dangerName,
              field2: entity.properties.position,
              field3: entity.properties.enterpriseType,
              field4: entity.properties.level,
              field5: entity.properties.lon,
              field6: entity.properties.lat,
            });
          }
        });
        //避难所表数据加载
        shelterDates.forEach(entity => {
          const entityCoords3 = entity.geometry.coordinates;
          const coordsStr3 = entityCoords3.join(',');
          // 检查坐标字符串是否存在于集合中
          if (shelter.has(coordsStr3)) {
            console.log("找到了匹配的坐标:", entityCoords3);
            this.dataTypes.type6.data.push({
              field1: entity.properties.shelterName,
              field2: entity.properties.position,
              field3: entity.properties.shelterType,
              field4: entity.properties.effectiveNumber,
              field5: entity.properties.lon,
              field6: entity.properties.lat,
            });
          }
        });
        //消防站表数据加载
        fireDates.forEach(entity => {
          const entityCoords4 = entity.geometry.coordinates;
          const coordsStr4 = entityCoords4.join(',');
          // 检查坐标字符串是否存在于集合中
          if (fire.has(coordsStr4)) {
            console.log("找到了匹配的坐标:", entityCoords4);
            this.dataTypes.type7.data.push({
              field1: entity.properties.teamName,
              field2: entity.properties.position,
              field3: entity.properties.fireType,
              field4: entity.properties.teamSumNum,
              field5: entity.properties.lon,
              field6: entity.properties.lat,
            });
          }
        });
        //储备点表数据加载
        storeDates.forEach(entity => {
          const entityCoords5 = entity.geometry.coordinates;
          const coordsStr5 = entityCoords5.join(',');
          // 检查坐标字符串是否存在于集合中
          if (store.has(coordsStr5)) {
            console.log("找到了匹配的坐标:", entityCoords5);
            this.dataTypes.type8.data.push({
              field1: entity.properties.storeName,
              field2: entity.properties.position,
              field3: entity.properties.storeType,
              field4: entity.properties.storeVolume,
              field5: entity.properties.lon,
              field6: entity.properties.lat,
            });
          }
        });
        //学校表数据加载
        schoolDates.forEach(entity =>{
          const entityCode = entity.geometry.coordinates;
          const coordsStr = entityCode.join(',');
          if(school.has(coordsStr)) {
            console.log("找到了匹配的坐标:", entityCode);
            this.dataTypes.type9.data.push({
              field1: entity.properties.schoolName,
              field2: entity.properties.schoolAddress,
              field3: entity.properties.students,
              field4: entity.properties.isImportant,
              field5: entity.properties.lon,
              field6: entity.properties.lat,
            });
          }
        });
        this.initColumGraph(
            hospitalPointsInside, dangerSourcePointsInside, shelterPointsInside, fireFighterPointsInside, storePointsInside, schoolPointsInside
        );
      }
    },
    // 判断点是否在圆内（圆形是椭圆的特例，无需旋转参数）
    isPointInCircle(pointPosition, circleCenter, radius) {
      // 将点的经纬度转换为Cartographic
      const pointCartographic = Cesium.Cartographic.fromDegrees(
          pointPosition[0],
          pointPosition[1]
      );

      // 将圆心坐标转换为Cartographic（确保高度一致）
      const centerCartographic = Cesium.Cartographic.fromCartesian(circleCenter);
      pointCartographic.height = centerCartographic.height;

      // 计算两点间的地表距离（考虑地球曲率）
      const geodesic = new Cesium.EllipsoidGeodesic();
      geodesic.setEndPoints(centerCartographic, pointCartographic);
      const surfaceDistance = geodesic.surfaceDistance;

      // 比较距离与半径（增加容差防止浮点误差）
      const tolerance = 0.1; // 10厘米容差
      return surfaceDistance <= radius + tolerance;
    },
    // 闪烁灾害点 - 光晕扩散效果
    flashDisasterPoints(points) {
      // 停止之前的闪烁动画
      if (this.flashInterval) {
        clearInterval(this.flashInterval);
      }
      if (this.haloCollection) {
        this.haloCollection.removeAll();
      }

      // 创建光晕点集合
      this.haloCollection = new Cesium.PointPrimitiveCollection();
      this.viewer.scene.primitives.add(this.haloCollection);

      // 从所有灾害实体中查找匹配的点
      const entitiesToFlash = [];
      this.disasterEntities.forEach(entity => {
        const position = entity.position.getValue(Cesium.JulianDate.now());
        const cartographic = Cesium.Cartographic.fromCartesian(position);
        const entityPoint = [
          Cesium.Math.toDegrees(cartographic.longitude),
          Cesium.Math.toDegrees(cartographic.latitude)
        ];

        // 检查该实体是否在需要闪烁的点列表中
        for (const point of points) {
          if (Math.abs(point[0] - entityPoint[0]) < 0.00001 &&
              Math.abs(point[1] - entityPoint[1]) < 0.00001) {
            entitiesToFlash.push(entity);

            // 创建光晕点
            this.haloCollection.add({
              position: position,
              pixelSize: 15,
              color: Cesium.Color.RED,
              outlineColor: Cesium.Color.RED,
              outlineWidth: 1,
              show: true,
              // 自定义材质用于光晕效果
              material: new Cesium.Material({
                fabric: {
                  type: 'Halo',
                  uniforms: {
                    color: Cesium.Color.RED,
                    glowPower: 0.5,
                    innerRadius: 0.5,
                    outerRadius: 1.0
                  },
                  source: `
                uniform vec4 color;
                uniform float glowPower;
                uniform float innerRadius;
                uniform float outerRadius;

                czm_material czm_getMaterial(czm_materialInput materialInput) {
                  czm_material material = czm_getDefaultMaterial(materialInput);
                  vec2 st = materialInput.st;
                  float dist = distance(st, vec2(0.5, 0.5));
                  float alpha = smoothstep(outerRadius, innerRadius, dist);
                  alpha = pow(alpha, glowPower);
                  material.diffuse = color.rgb;
                  material.alpha = alpha * color.a;
                  return material;
                }
              `
                }
              })
            });

            break;
          }
        }
      });
      // 如果没有找到匹配的实体，直接返回
      if (entitiesToFlash.length === 0) return;
      // 动画控制变量
      let animationTime = 0;
      const animationDuration = 2000; // 动画周期，毫秒
      // 启动动画循环
      this.flashInterval = setInterval(() => {
        animationTime = (animationTime + 50) % animationDuration;
        const normalizedTime = animationTime / animationDuration;
        // 更新所有光晕点的大小和透明度
        for (let i = 0; i < this.haloCollection.length; i++) {
          const halo = this.haloCollection.get(i);

          // 计算光晕大小（从原始大小到3倍）
          const baseSize = 15;
          const sizeFactor = 1.0 + Math.sin(normalizedTime * Math.PI * 2) * 2;
          halo.pixelSize = baseSize * sizeFactor;

          // 计算光晕透明度（大小最大时透明度最低）
          const alphaFactor = 1.0 - (sizeFactor - 1.0) / 2.0;
          const originalColor = Cesium.Color.RED;
          halo.color = new Cesium.Color(
              originalColor.red,
              originalColor.green,
              originalColor.blue,
              alphaFactor * 0.8
          );
        }
      }, 50); // 每50ms更新一次
    },
    //加载柱状图
    initColumGraph(hospital, danger, shelter, fire, store, school){
      this.chartDatas.seriesDatas = [0, 0, 0, 0, 0, 0];

      this.chartDatas.seriesDatas[0] = hospital.length;
      this.chartDatas.seriesDatas[1] = danger.length;
      this.chartDatas.seriesDatas[2] = shelter.length;
      this.chartDatas.seriesDatas[3] = fire.length;
      this.chartDatas.seriesDatas[4] = store.length;
      this.chartDatas.seriesDatas[5] = school.length;

      this.showChart = true;
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
    // 计算弹出面板左坐标（带过渡动画）
    calculatePopupLeft() {
      return this.popupPosition.x;
    },
    // 计算弹出面板上坐标（带过渡动画）
    calculatePopupTop() {
      return this.popupPosition.y;
    },
    // 关闭弹出面板
    closePopup() {
      this.popupVisible = false;
      this.selectedEntityData = null;
    },
    // 阻止事件冒泡
    stopPropagation(e) {
      e.stopPropagation();
    },
    // 获取灾害类型名称
    getDisasterTypeName(type) {
      const typeMap = {
        'landslide': '滑坡',
        'debrisFlow': '泥石流',
        'secondaryRisk': '次生灾害风险区'
      };
      return typeMap[type] || type;
    },
    // 行点击事件处理
    handleRowClick(row, event, column) {
      console.log('点击行数据:', row);
      this.jumpToPosition(row);
    },
    // 跳转到指定位置
    jumpToPosition(row) {
      if (!this.viewer || !row.lon || !row.lat) return;
      // 从行数据获取经纬度
      const longitude = parseFloat(row.lon);
      const latitude = parseFloat(row.lat);

      console.log("====================lon,lat====================", longitude, latitude)

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
      this.highlightRiskArea(row);
    },
    // 高亮显示风险区(可选)
    highlightRiskArea(row) {
      // 这里可以添加高亮显示逻辑
      // 例如：在地图上标记该风险区位置
      console.log('高亮显示风险区:', row.disasterName);
    },
    loadData() {
      this.loading = true;
      setTimeout(() => {
        this.loading = false;
      }, 500);
    },
    resetAllStates() {
      // 重置基本状态
      this.rainMode = false;
      this.showInfoPanel = false;
      this.showLegend = false;
      this.weatherActive = false;
      this.isLoading = false;
      this.loadingText = '加载数据中...';
      this.showAdminLayer = true;
      this.popupVisible = false;
      this.eqCenterPanelVisible = false;

      // 重置数组
      this.disasterEntities = [];
      this.wmsLayers = [];
      this.rainPoints = [];
      this.faultZoneList = [];

      // 重置图表数据
      this.chartDatas.seriesDatas = [0, 0, 0, 0, 0, 0];

      // 重置数据类型的数据数组
      for (const key in this.dataTypes) {
        if (key !== 'filterCriteria' && Array.isArray(this.dataTypes[key].data)) {
          this.dataTypes[key].data = [];
        }
      }

      // 重置对象属性（不清除整个对象，只重置内容）
      this.selectedEntityData = null;
      this.selectedPosition = null;
      this.popupPosition = {x: 0, y: 0};
      this.PanelPosition = {x: 0, y: 0};

      // 重置灾害信息对象
      this.disasterInformation = {};
      this.debrisFlowInformation = {};
      this.riskPointsInformation = {};
      this.waterDisasterInformation = {};
      this.floodDisasterInformation = {};
      this.PanelData = {};

      // 重置数据源（不销毁，只置空引用）
      this.adminDataSource = null;
      this.riverDataSource = null;
      this.lakeDataSource = null;
      this.dataSource = null;
      this.adminDataSources = [];

      // 重置灾害数据
      this.HuapoData = null;
      this.NishiliuData = null;
      this.DangerAreaData = null;

      // 重置其他状态
      this.rainEffect = null;
      this.lastPickedEntity = null;
      this.currentPage = 1;
      this.isExpanded = false;
      this.canMarkAgain = true;
    }
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
  right: 190px;
  z-index: 100;
}


.rain-btn, .refresh{
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


.rain-btn, .refresh:hover {
  background-color: #3c86ff;
  transform: translateY(-2px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.secondary-panel {
  position: absolute;
  top: 10px;
  right: 20px;
  background-color: rgba(40, 40, 40, 0.8);
  color: white;
  padding: 10px; /* 缩小内边距 */
  border-radius: 4px;
  z-index: 1000;
  width: 160px; /* 缩小面板宽度 */
}

.panel-title1 {
  font-weight: bold;
  margin-bottom: 6px; /* 缩小标题与内容间距 */
  font-size: 12px; /* 缩小字体 */
}

.panel-content1 {
  display: flex;
  flex-direction: column;
  font-size: 12px; /* 缩小字体 */
  gap: 6px; /* 缩小子元素间距 */
}

.panel-content1 label {
  display: flex;
  align-items: center;
  gap: 6px; /* 缩小标签内元素间距 */
  font-size: 12px; /* 缩小字体 */
  cursor: pointer;
}


/* 响应式处理 - 小屏幕下换行 */
@media (max-width: 640px) {
  .btn-group {
    flex-direction: column; /* 小屏幕下垂直排列 */
    gap: 6px;
  }

  .rain-btn, .refresh {
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
  top: 250px;
  left: 10px;
  background-color: rgba(255, 255, 255, 0.75);
  color: black;
  padding: 15px;
  border: 1px solid #FFFFFF;
  border-radius: 16px;
  width: 240px;
  height: 150px;
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
.jiangyuliang{
  text-align-last: justify;
}
.panel-content input {
  width: 60px;
  padding: 6px 8px;
  border: none;
  border-radius: 4px;
  text-align: center;
  background-color: rgba(255, 255, 255, 0.2);
  color: black;
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
  top: 12%;
  left: 13%;
  width: 550px;
  max-height: 700px;
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
  background-color: rgba(43,47,51,0.6);
}

:deep(.el-table tr){
  background-color: rgba(43, 47, 51, 0.6);
  height: 55px;
}

.title-text {
  font-size: 16px;
  font-weight: 500;
  color: white;
  text-align: center;
  width: 100%;
  margin-top: 15px;
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
  background-color: rgba(43,47,51,0);
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
  background-color: rgba(43,47,51,0.6) !important;
}
.rf_table{
  background-color: rgba(43, 47, 51, 0.6);
  padding:15px 20px;
}
:deep(.el-pagination>.is-first) {
  margin-left: 0 !important;
  color: white!important  ;
}
:deep(.el-pagination__goto){
  color: white;
}
:deep(.el-pagination__classifier){
  color: white;
}
:deep(.el-table__row){
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
:deep(.el-table thead){
  height: 55px!important;
}
.form-item {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
  gap: 10px; /* 统一元素间距 */
}

.form-item {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
  gap: 10px; /* 统一元素间距 */
}

.legend {
  bottom: 10px;
}

</style>
