<template>
  <div class="cesium-container" ref="cesiumContainer">
    <!-- 功能按钮 -->
    <div class="controls">
      <div class="rain-btn" @click="toggleRainMode">
        {{ rainMode ? '取消暴雨标记' : '标记暴雨点' }}
      </div>
      <div class="weather-btn" @click="toggleWeatherEffect" :class="{ 'disabled': rainMode }">
        {{ weatherActive ? '停止降雨' : '模拟降雨' }}
      </div>
      <div class="admin-btn" @click="toggleAdminLayer">
        {{ showAdminLayer ? '隐藏行政区划' : '显示行政区划' }}
      </div>
    </div>

    <!-- 加载状态提示 -->
    <div v-if="isLoading" class="loading-indicator">
      {{ loadingText }}
    </div>

    <!-- 暴雨信息面板 -->
    <div v-if="showInfoPanel" class="rain-info-panel">
      <div class="panel-title">暴雨信息</div>
      <div class="panel-content">
        <div>降雨量: <input v-model.number="rainfall" type="number" min="0" max="500" step="1"/> mm</div>
        <div>已持续时间: <input v-model.number="duration" type="number" min="0" max="72" step="1"/> 小时</div>
        <button @click="confirmRainPoint" :disabled="!rainfall || !duration">确认添加</button>
        <button @click="cancelRainPoint">取消</button>
      </div>
    </div>

    <!-- 图例面板 -->
    <div class="legend-panel">
      <div class="legend-title">图例</div>
      <div class="legend-content" ref="legendContent">
        <!-- 区县图例将通过JS动态生成 -->

        <div class="legend-item">
          <div class="legend-color" style="background-color: rgba(255,0,0,0.5); border: 1px solid #f00;"></div>
          <div class="legend-text">降雨区域</div>
        </div>

      </div>
    </div>
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
// 河流数据
import riverData from '@/assets/static/json/river.json';
import lakeData from '@/assets/static/json/lake.json'; // 湖面数据
// 引入滑坡，泥石流灾害点数据
import HuapoData from '@/assets/static/disaster/Huapo.json';
import NishiliuData from '@/assets/static/disaster/Nishiliu.json';
import DangerAreaData from '@/assets/static/disaster/riskArea.json'

export default {
  name: 'CesiumRainMap',
  data() {
    return {
      viewer: null,
      tdtToken: "7f013d0186775b063d6a046977bbefc6",
      currentMapType: 0,
      rainMode: false,
      showInfoPanel: false,
      selectedPosition: null,
      rainfall: 50,
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
      disasterDataSource: null, // 灾害点数据源
      // 行政区划数据
      administrationData: [BaQiaoArea, BeiLin, ChangAn, GaoLing, HuYi, LanTIan, LianHu, LinTong, WeiYang, XinCheng, YanLiang, YanTa, ZhouZhi],
      adminDataSources: [],
      faultZoneList: [],
      // 河流数据
      riverData: riverData,
      lakeData: lakeData,
      // 灾害点数据
      HuapoData: HuapoData,
      NishiliuData: NishiliuData,
      // faultZone: faultZone,
      DangerAreaData: DangerAreaData,
      isLoading: false,
      loadingText: '加载数据中...',
      // 暴雨影响区域椭圆相关配置
      rainEllipseScale: 100, // 降雨量到椭圆半径的缩放系数
      rainEllipseRotation: 70, // 椭圆默认旋转角度
      // 图例相关
      districtColors: {}, // 存储各区县的颜色
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
    }
  },
  computed: {},
  mounted() {
    this.load();
    this.loadAdminData(); // 加载行政区划数据
    this.loadRiverData(); // 加载河流数据
    this.loadLakeData(); // 加载湖面数据
    this.loadDisasterData(); // 加载灾害点数据
    this.createLegend(); // 创建图例
  },
  beforeDestroy() {
    if (this.viewer) {
      this.viewer.destroy();
      this.viewer = null;
    }
    if (this.adminDataSource) {
      this.viewer.dataSources.remove(this.adminDataSource);
      this.adminDataSource = null;
    }
    if (this.riverDataSource) {
      this.viewer.dataSources.remove(this.riverDataSource);
      this.riverDataSource = null;
    }
    if (this.lakeDataSource) this.viewer.dataSources.remove(this.lakeDataSource);

    // 移除所有行政区划数据源
    if (this.adminDataSources && this.adminDataSources.length > 0) {
      this.adminDataSources.forEach(dataSource => {
        this.viewer.dataSources.remove(dataSource);
      });
      this.adminDataSources = [];
    }
    document.removeEventListener('keydown', this.onKeyDown);
  },

  methods: {

    load() {
      Cesium.Ion.defaultAccessToken = '';
      const container = this.$refs.cesiumContainer;
      this.viewer = new Cesium.Viewer(container, {
        imageryProvider: false,
        animation: false,
        homeButton: false,
        navigationHelpButton: false,
        timeline: false,
        selectionIndicator: false,
        sceneModePicker: false,
        infoBox: false,
        geocoder: false,
        vrButton: false,
        fullscreenButton: false,
        baseLayerPicker: false,
      });

      this.viewer.cesiumWidget.creditContainer.style.display = "none";
      this.loadTDT(0);
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
    // 加载天地图
    loadTDT(type) {
      this.viewer.imageryLayers.removeAll();

      const option = {
        tileMatrixSetID: "w",
        format: "tiles",
        style: "default",
        minimumLevel: 0,
        maximumLevel: 18,
        credit: "Tianditu",
        subdomains: ["t0", "t1", "t2", "t3", "t4", "t5", "t6", "t7"]
      };

      if (type === 0) {
        const imageryProvider = new Cesium.WebMapTileServiceImageryProvider({
          url: `https://{s}.tianditu.gov.cn/img_w/wmts?tk=${this.tdtToken}`,
          layer: "img",
          ...option
        });

        const annotationProvider = new Cesium.WebMapTileServiceImageryProvider({
          url: `https://{s}.tianditu.gov.cn/cia_w/wmts?tk=${this.tdtToken}`,
          layer: "cia",
          ...option
        });

        this.viewer.imageryLayers.addImageryProvider(imageryProvider);
        this.viewer.imageryLayers.addImageryProvider(annotationProvider);
      } else {
        const vectorProvider = new Cesium.WebMapTileServiceImageryProvider({
          url: `https://{s}.tianditu.gov.cn/vec_w/wmts?tk=${this.tdtToken}`,
          layer: "vec",
          ...option
        });

        const annotationProvider = new Cesium.WebMapTileServiceImageryProvider({
          url: `https://{s}.tianditu.gov.cn/cva_w/wmts?tk=${this.tdtToken}`,
          layer: "cva",
          ...option
        });

        this.viewer.imageryLayers.addImageryProvider(vectorProvider);
        this.viewer.imageryLayers.addImageryProvider(annotationProvider);
      }

      this.currentMapType = type;
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
      this.isLoading = true;
      this.loadingText = '加载灾害点数据...';

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
            point: {
              color: Cesium.Color.RED, // 点位颜色
              outlineColor: Cesium.Color.BLACK,
              outlineWidth: 1,
              pixelSize: 15 // 像素点大小
            },
            // 文字
            label: {
              text: `${disasterNAME}`,
              font: '15pt Source Han Sans CN',
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
              distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 40000),
              show: true
            },
            // 添加灾害类型信息，用于弹窗显示
            description: this.createDisasterDescription(properties, '滑坡'),
            // 保存原始样式，用于闪烁恢复
            originalColor: Cesium.Color.RED,
            originalPixelSize: 15,
            // 标记灾害类型
            disasterType: 'landslide'
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
            // 点
            point: {
              color: Cesium.Color.YELLOW, // 点位颜色
              outlineColor: Cesium.Color.BLACK,
              outlineWidth: 1,
              pixelSize: 15 // 像素点大小
            },
            // 文字
            label: {
              text: `${disasterNAME}`,
              font: '15pt Source Han Sans CN',
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
              pixelOffset: new Cesium.Cartesian2(-70, 35),
              distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 40000),
              show: true
            },
            // 添加灾害类型信息，用于弹窗显示
            description: this.createDisasterDescription(properties, '泥石流'),
            // 保存原始样式，用于闪烁恢复
            originalColor: Cesium.Color.YELLOW,
            originalPixelSize: 15,
            // 标记灾害类型
            disasterType: 'debrisFlow'
          });

          // 保存实体引用
          this.disasterEntities.push(entity);
          this.debrisFlowEntities.push(entity);
        });

        // 添加风险区点
        dangerAreaFeatures.forEach(point => {
          const area = point.properties.area_Km2 || {};   // 面积
          const position = point.properties.position;
          const longitude = parseFloat(point.geometry.coordinates[0]);  //经度
          const latitude = parseFloat(point.geometry.coordinates[1]);   //纬度
          const grade = point.properties.grade;  //  风险等级

          // 加入次生灾害点
          this.secondaryRiskPoints.push([longitude, latitude])
          // 创建灾害点实体
          const entity = this.viewer.entities.add({
            position: Cesium.Cartesian3.fromDegrees(longitude, latitude, 5),
            // 点
            point: {
              color: Cesium.Color.ORANGE, // 点位颜色
              outlineColor: Cesium.Color.BLACK,
              outlineWidth: 1,
              pixelSize: 15 // 像素点大小
            },
            // 文字
            label: {
              text: `${position}`,
              font: '15pt Source Han Sans CN',
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
              distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 40000),
              show: true
            },
            // 添加灾害类型信息，用于弹窗显示
            description: this.createDisasterDescription({grade, position}, '次生灾害风险区'),
            // 保存原始样式，用于闪烁恢复
            originalColor: Cesium.Color.ORANGE,
            originalPixelSize: 15,
            // 标记灾害类型
            disasterType: 'secondaryRisk'
          });

          // 保存实体引用
          this.disasterEntities.push(entity);
          this.secondaryRiskEntities.push(entity);
        });

        // 设置实体点击事件
        this.setupEntityClickHandler();

        this.isLoading = false;
      } catch (error) {
        this.isLoading = false;
        console.error('处理灾害数据时出错:', error);
      }
    },
    // 创建灾害点详情描述
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

        if (Cesium.defined(pickedObject) && Cesium.defined(pickedObject.id)) {
          const entity = pickedObject.id;

          console.log("点击率", entity, "=============")

          // 检查是否是灾害点实体
          if (this.disasterEntities.includes(entity)) {
            // 设置信息框显示内容
            this.viewer.selectedEntity = entity;
            // 如果信息框未显示，则显示它
            if (!this.viewer.infoBox._container.style.display === 'block') {
              this.viewer.infoBox._container.style.display = 'block';

            }
          }
        } else {
          // 如果点击在空白处，隐藏信息框
          this.viewer.selectedEntity = undefined;
        }
      }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
    },
    // 加载行政区划数据
    loadAdminData() {
      this.isLoading = true;
      console.log('开始加载行政区划数据...');
      // 重置数据源数组
      this.adminDataSources = [];
      // 使用for循环同步加载所有数据源
      for (let i = 0; i < this.administrationData.length; i++) {

        // 创建新的数据源
        const dataSource = new Cesium.GeoJsonDataSource();
        this.adminDataSources.push(dataSource);

        // 配置加载选项并加载数据
        dataSource.load(this.administrationData[i], {
          enableFeatureStyles: false,
          clampToGround: true,
          suppressPointLabels: true
        }).then(() => {
          // 配置当前数据源的样式
          const color = this.generateRandomColor(i);
          this.configureAdminStyles(dataSource, i, color);
          // 存储区县颜色
          const districtId = this.administrationData[i].name || `district${i}`;
          this.districtColors[districtId] = color;
          // 添加到地图
          this.viewer.dataSources.add(dataSource);
          this.updateLegend();
        }).catch(error => {
          console.error(`加载行政区划数据失败 (${this.administrationData[i].name || "未知区域"}):`, error);
        });
      }
    },
    // 配置行政区划样式
    configureAdminStyles(dataSource, i, color) {
      if (!dataSource) return;

      const entities = dataSource.entities.values;

      entities.forEach(entity => {
        const name = entity.properties.name._value || dataSource.name;

        entity.polygon = {
          hierarchy: entity.polygon.hierarchy,
          material: color,
          outline: true,
          outlineColor: Cesium.Color.BLUE,
          outlineWidth: 1,
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
          show: this.showAdminLayer, // 使用统一的显示控制
          fill: true,
          shadow: true,
          depthFailMaterial: color.withAlpha(0.2)
        };

        entity.label = {
          text: name,
          font: '12px sans-serif',
          fillColor: Cesium.Color.BLACK,
          backgroundColor: color.withAlpha(0.7),
          padding: new Cesium.Cartesian2(5, 5),
          showBackground: true,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          pixelOffset: new Cesium.Cartesian2(0, 10),
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
          show: this.showAdminLayer // 使用统一的显示控制
        };

        this.addEntityClickEvent(entity);
      });
    },
    // 添加切换行政区划图层显示的方法
    toggleAdminLayer() {
      this.showAdminLayer = !this.showAdminLayer;

      if (this.adminDataSources && this.adminDataSources.length > 0) {
        this.adminDataSources.forEach(dataSource => {
          const entities = dataSource.entities.values;
          entities.forEach(entity => {
            if (entity.polygon) entity.polygon.show = this.showAdminLayer;
            if (entity.label) entity.label.show = this.showAdminLayer;
          });
        });
      }
    },
    // 颜色生成器函数，增加透明度
    generateRandomColor(i) {
      // 定义13种不同的颜色
      const colors = [
        new Cesium.Color(255 / 255, 153 / 255, 0 / 255, 0.5),    // 活力橙
        new Cesium.Color(255 / 255, 51 / 255, 102 / 255, 0.5),   // 亮粉红
        new Cesium.Color(0 / 255, 178 / 255, 255 / 255, 0.5),    // 天蓝色
        new Cesium.Color(102 / 255, 255 / 255, 102 / 255, 0.5),  // 浅绿色
        new Cesium.Color(204 / 255, 102 / 255, 255 / 255, 0.5),  // 淡紫色
        new Cesium.Color(255 / 255, 204 / 255, 0 / 255, 0.5),    // 金黄色
        new Cesium.Color(0 / 255, 204 / 255, 153 / 255, 0.5),    // 青绿色
        new Cesium.Color(255 / 255, 102 / 255, 102 / 255, 0.5),  // 浅红色
        new Cesium.Color(102 / 255, 153 / 255, 255 / 255, 0.5),  // 淡蓝色
        new Cesium.Color(255 / 255, 178 / 255, 102 / 255, 0.5),  // 浅橙色
        new Cesium.Color(153 / 255, 255 / 255, 204 / 255, 0.5),  // 淡青色
        new Cesium.Color(255 / 255, 153 / 255, 204 / 255, 0.5),  // 浅粉色
        new Cesium.Color(190 / 255, 255 / 255, 232 / 255, 0.5),  // 淡靛紫
      ];

      // 确保索引在有效范围内
      if (i >= 0 && i < colors.length) {
        return colors[i];
      } else {
        // 如果索引超出范围，使用默认颜色或循环使用已有颜色
        return colors[i % colors.length];
      }
    },
    // 优化后的点击事件处理
    addEntityClickEvent(entity) {
      if (!entity.id) return;

      const handler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);
      handler.setInputAction((movement) => {
        const picked = this.viewer.scene.pick(movement.position);
        if (Cesium.defined(picked) && picked.id === entity) {
          this.viewer.flyTo(entity, {
            duration: 2,
            offset: new Cesium.HeadingPitchRange(0, Cesium.Math.toRadians(-45), 50000)
          });
          console.log(`点击了: ${entity.properties.name || "未知区域"}`);
        }
      }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

      // 存储处理器以便销毁
      entity.handler = handler;
    },
    // 开启下雨特效
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
    // 在地图上标记暴雨点
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

      // 计算降雨强度(mm/小时)
      const intensity = this.rainfall / (this.duration || 1);

      const entity = this.viewer.entities.add({
        position: cartesian,
        point: {
          // 根据降雨量调整点大小
          pixelSize: this.rainfall / 5,
          color: Cesium.Color.DARKRED,
          outlineColor: Cesium.Color.WHITE,
          outlineWidth: 1,
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
        },
        label: {
          text: `降雨量: ${this.rainfall}mm\n已持续: ${this.duration}小时`,
          // text: `降雨量: ${this.rainfall}mm\n持续: ${this.duration}小时`,
          font: '14px sans-serif',
          fillColor: Cesium.Color.WHITE,
          backgroundColor: Cesium.Color.RED.withAlpha(0.7),
          padding: new Cesium.Cartesian2(20, 20),
          showBackground: true,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          pixelOffset: new Cesium.Cartesian2(0, -10),
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
        },
        description: `
          <div style="font-family: Arial, sans-serif;">
            <h3>暴雨信息</h3>
            <p><strong>位置:</strong> ${latitude.toFixed(4)}, ${longitude.toFixed(4)}</p>
            <p><strong>降雨量:</strong> ${this.rainfall} mm</p>
            <p><strong>持续时间:</strong> ${this.duration} 小时</p>
            <p><strong>降雨强度:</strong> ${intensity.toFixed(2)} mm/小时</p>
            <p><strong>标记时间:</strong> ${new Date().toLocaleString()}</p>
          </div>
        `
      });

      // 添加暴雨影响区域椭圆面
      const ellipseEntity = this.addRainEllipse(cartesian, this.rainfall);

      this.rainPoints.push(entity);
      this.rainPoints.push({ellipse: ellipseEntity});
      this.showInfoPanel = false;

      // 标记后自动开启下雨效果
      this.weatherActive = true;
      this.rainEffect.enabled = this.weatherActive;

      // 禁止连续标记
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
    // 添加暴雨影响区域椭圆
    addRainEllipse(centerCartesian, rainfall) {
      // 根据降雨量计算椭圆半径 (mm -> 米)
      const majorRadius = rainfall * this.rainEllipseScale; // 长轴半径
      const minorRadius = majorRadius * 0.7; // 短轴半径，形成椭圆

      // 计算椭圆边界的经纬度坐标
      const ellipseCoordinates = this.calculateEllipseCoordinates(
          centerCartesian,
          majorRadius,
          minorRadius,
          this.rainEllipseRotation
      );

      // 创建椭圆实体
      const ellipseEntity = this.viewer.entities.add({
        position: centerCartesian,
        ellipse: {
          semiMajorAxis: majorRadius,
          semiMinorAxis: minorRadius,
          height: 0,
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
          material: new Cesium.Color(1, 0, 0, 0.2), // 半透明红色
          outline: true,
          outlineColor: Cesium.Color.RED,
          outlineWidth: 1,
          rotation: this.rainEllipseRotation, // 椭圆旋转角度
          shadow: true,
          show: true,
          depthFailMaterial: new Cesium.Color(0, 0, 1, 0.1)
        },
        description: `
        <div style="font-family: Arial, sans-serif;">
          <h3>暴雨影响区域</h3>
          <p><strong>降雨量:</strong> ${rainfall} mm</p>
          <p><strong>影响半径:</strong> 长轴 ${(majorRadius / 1000).toFixed(2)} km, 短轴 ${(minorRadius / 1000).toFixed(2)} km</p>
          <p><strong>标记时间:</strong> ${new Date().toLocaleString()}</p>
          <p><strong>边界点数:</strong> ${ellipseCoordinates.length}</p>
        </div>
      `
      });

      // 存储椭圆坐标数据
      ellipseEntity.coordinates = ellipseCoordinates;

      // 检测灾害点是否在椭圆范围内
      this.checkDisasterPointsInEllipse(ellipseEntity, centerCartesian, majorRadius, minorRadius, rainfall);

      return ellipseEntity;
    },
    // 计算椭圆边界的经纬度坐标
    calculateEllipseCoordinates(centerCartesian, majorRadius, minorRadius, rotation) {
      const centerCartographic = Cesium.Cartographic.fromCartesian(centerCartesian);
      const centerLon = centerCartographic.longitude;
      const centerLat = centerCartographic.latitude;

      const samples = 100; // 采样点数量，决定精度
      const coordinates = [];

      for (let i = 0; i < samples; i++) {
        const angle = (i / samples) * Math.PI * 2;

        // 考虑旋转的椭圆参数方程
        const cosAngle = Math.cos(angle);
        const sinAngle = Math.sin(angle);
        const cosRotation = Math.cos(rotation);
        const sinRotation = Math.sin(rotation);

        // 计算椭圆上的点在局部坐标系中的偏移
        const x = majorRadius * cosAngle * cosRotation - minorRadius * sinAngle * sinRotation;
        const y = majorRadius * cosAngle * sinRotation + minorRadius * sinAngle * cosRotation;

        // 将偏移转换为经纬度偏移
        const latOffset = y / 111320; // 1度纬度约等于111320米
        const lonOffset = x / (111320 * Math.cos(centerLat)); // 经度距离随纬度变化

        // 计算椭圆边界点的经纬度
        const lon = centerLon + lonOffset;
        const lat = centerLat + latOffset;

        // 存储坐标 [经度, 纬度]
        coordinates.push([Cesium.Math.toDegrees(lon), Cesium.Math.toDegrees(lat)]);
      }

      return coordinates;
    },
    // 检查灾害点是否在椭圆范围内
    checkDisasterPointsInEllipse(ellipseEntity, centerCartesian, majorRadius, minorRadius, rainfall) {
      // 获取椭圆中心点的经纬度
      const centerCartographic = Cesium.Cartographic.fromCartesian(centerCartesian);

      // 存储在椭圆内的灾害点坐标
      const landslidePointsInside = [];
      const debrisFlowPointsInside = [];
      const secondaryRiskPointsInside = [];

      // 检查所有滑坡点
      this.landslidePoints.forEach(point => {
        if (this.isPointInEllipse(point, centerCartesian, majorRadius, minorRadius, this.rainEllipseRotation)) {
          landslidePointsInside.push(point);
        }
      });

      // 检查所有泥石流点
      this.debrisFlowPoints.forEach(point => {
        if (this.isPointInEllipse(point, centerCartesian, majorRadius, minorRadius, this.rainEllipseRotation)) {
          debrisFlowPointsInside.push(point);
        }
      });

      // 检查所有次生灾害风险点
      this.secondaryRiskPoints.forEach(point => {
        if (this.isPointInEllipse(point, centerCartesian, majorRadius, minorRadius, this.rainEllipseRotation)) {
          secondaryRiskPointsInside.push(point);
        }
      });

      // 合并所有在椭圆内的灾害点坐标
      const allPointsInside = [
        ...landslidePointsInside,
        ...debrisFlowPointsInside,
        ...secondaryRiskPointsInside
      ];

      // 闪烁在椭圆内的灾害点
      if (allPointsInside.length > 0) {
        // 直接传递坐标数组到闪烁函数
        this.flashDisasterPoints(allPointsInside);

        console.log(`在椭圆内的灾害点数量: ${allPointsInside.length}`);
        console.log(`滑坡点: ${landslidePointsInside.length}`);
        console.log(`泥石流点: ${debrisFlowPointsInside.length}`);
        console.log(`次生灾害风险点: ${secondaryRiskPointsInside.length}`);

        // 更新椭圆描述，显示检测结果
        const description = ellipseEntity.description.getValue();
        ellipseEntity.description = description + `
  <p><strong>影响灾害点:</strong> ${allPointsInside.length}个</p>
  <p><strong>滑坡:</strong> ${landslidePointsInside.length}个</p>
  <p><strong>泥石流:</strong> ${debrisFlowPointsInside.length}个</p>
  <p><strong>次生灾害风险点:</strong> ${secondaryRiskPointsInside.length}个</p>
`;
      }
    },
    // 判断点是否在椭圆内 - 使用正确的椭圆方程
    isPointInEllipse(pointPosition, ellipseCenter, majorRadius, minorRadius, rotation) {
      // 将经纬度转换为笛卡尔坐标（世界坐标）
      const pointCartographic = Cesium.Cartographic.fromDegrees(
          pointPosition[0],
          pointPosition[1]
      );

      // 确保点高度与椭圆中心一致（消除高度影响）
      const centerCartographic = Cesium.Cartographic.fromCartesian(ellipseCenter);
      pointCartographic.height = centerCartographic.height;

      const pointCartesian = Cesium.Ellipsoid.WGS84.cartographicToCartesian(pointCartographic);

      // 计算点到椭圆中心的地表距离（沿地球表面）
      const geodesic = new Cesium.EllipsoidGeodesic();
      geodesic.setEndPoints(
          centerCartographic,
          pointCartographic
      );
      const surfaceDistance = geodesic.surfaceDistance;

      // 计算点相对于椭圆中心的方位角（弧度）
      const azimuth = geodesic.startHeading;

      // 计算椭圆在该方位角上的半径
      const cosAz = Math.cos(azimuth - rotation);
      const sinAz = Math.sin(azimuth - rotation);
      const ellipseRadiusAtAzimuth =
          (majorRadius * minorRadius) /
          Math.sqrt(
              Math.pow(minorRadius * cosAz, 2) +
              Math.pow(majorRadius * sinAz, 2)
          );

      // 比较距离与椭圆在该方向上的半径，增加容差值以解决浮点数精度问题
      const tolerance = 0.1; // 10厘米容差，可根据需要调整
      return surfaceDistance <= ellipseRadiusAtAzimuth + tolerance;
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
              color: entity.point.color.getValue(),
              outlineColor: Cesium.Color.RED,
              outlineWidth: 1,
              show: true,
              // 自定义材质用于光晕效果
              material: new Cesium.Material({
                fabric: {
                  type: 'Halo',
                  uniforms: {
                    color: entity.point.color.getValue(),
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
          const originalColor = entitiesToFlash[i].point.color.getValue();
          halo.color = new Cesium.Color(
              originalColor.red,
              originalColor.green,
              originalColor.blue,
              alphaFactor * 0.8
          );
        }
      }, 50); // 每50ms更新一次
    },
    // 创建图例（修改版，添加灾害点图例）
    createLegend() {
      const legendContent = this.$refs.legendContent;
      if (!legendContent) return;

      // 清空所有子元素
      while (legendContent.firstChild) {
        legendContent.removeChild(legendContent.firstChild);
      }
      // 新增：添加降雨区域图例项
      this.addRainAreaLegend(legendContent);

      // 添加行政区划图例
      const addedDistricts = new Set();
      const districtItems = []; // 存储所有行政区划图例项

      this.administrationData.forEach((district, index) => {
        const districtId = `district${index}`;
        const districtName = district.features[0].properties.name;

        if (addedDistricts.has(districtName)) {
          return;
        }
        addedDistricts.add(districtName);

        const color = this.districtColors[districtId];

        if (color) {
          const item = document.createElement('div');
          item.className = 'legend-item district-item';
          item.style.display = 'flex';
          item.style.alignItems = 'center';
          item.style.marginBottom = '10px';
          item.style.width = '45%'; // 占45%宽度，留5%间隙

          const colorDiv = document.createElement('div');
          colorDiv.className = 'legend-color';
          colorDiv.style.backgroundColor = `rgba(${Math.floor(color.red * 255)}, ${Math.floor(color.green * 255)}, ${Math.floor(color.blue * 255)}, ${color.alpha})`;
          colorDiv.style.border = `1px solid rgba(${Math.floor(color.red * 255)}, ${Math.floor(color.green * 255)}, ${Math.floor(color.blue * 255)}, 1)`;
          colorDiv.style.width = '60px';
          colorDiv.style.height = '20px';
          colorDiv.style.marginRight = '10px';

          const textDiv = document.createElement('div');
          textDiv.className = 'legend-text';
          textDiv.textContent = districtName;
          textDiv.style.fontSize = '14px';
          textDiv.style.lineHeight = '20px';

          item.appendChild(colorDiv);
          item.appendChild(textDiv);
          districtItems.push(item);
        }
      });

      // 创建两排两列的容器
      const gridContainer = document.createElement('div');
      gridContainer.style.display = 'flex';
      gridContainer.style.flexWrap = 'wrap';
      gridContainer.style.gap = '10px';
      gridContainer.style.marginTop = '10px';

      // 添加到容器中，实现两列布局
      districtItems.forEach((item, index) => {
        gridContainer.appendChild(item);
      });

      legendContent.appendChild(gridContainer);

      // 优化图例容器样式
      if (legendContent.style) {
        legendContent.style.padding = '10px';
        legendContent.style.borderRadius = '5px';
        legendContent.style.backgroundColor = 'rgba(255,255,255,0.9)';
        legendContent.style.maxWidth = '300px'; // 限制最大宽度
      }

      // 新增：添加灾害点图例
      this.addDisasterLegend(legendContent);
    },
    // 添加降雨区域图例项的函数
    addRainAreaLegend(container) {
      const item = document.createElement('div');
      item.className = 'legend-item';
      item.style.display = 'flex';
      item.style.alignItems = 'center';
      item.style.marginBottom = '15px';
      item.style.fontWeight = 'bold'; // 加粗标题

      const colorDiv = document.createElement('div');
      colorDiv.className = 'legend-color';
      colorDiv.style.backgroundColor = 'rgba(180, 30, 30, 0.7)'; // 暗红色（RGB: 180, 30, 30）
      colorDiv.style.border = '1px solid rgba(180, 30, 30, 1)';
      colorDiv.style.width = '60px';
      colorDiv.style.height = '20px';
      colorDiv.style.marginRight = '10px';
      colorDiv.style.borderRadius = '100px'; // 关键：设置圆角实现椭圆效果（高度的一半）
      colorDiv.style.boxSizing = 'border-box'; // 包含边框尺寸

      const textDiv = document.createElement('div');
      textDiv.className = 'legend-text';
      textDiv.textContent = '降雨影响范围';
      textDiv.style.fontSize = '15px';
      textDiv.style.lineHeight = '20px';
      textDiv.style.flex = '1';

      item.appendChild(colorDiv);
      item.appendChild(textDiv);
      container.appendChild(item);
    },
    // 添加灾害点图例项
    addDisasterLegend(container) {
      // 滑坡图例（红色圆形）
      const landslideItem = document.createElement('div');
      landslideItem.className = 'legend-item';
      landslideItem.style.display = 'flex';
      landslideItem.style.alignItems = 'center';
      landslideItem.style.marginBottom = '10px';

      const landslideColorDiv = document.createElement('div');
      landslideColorDiv.className = 'legend-point';
      landslideColorDiv.style.backgroundColor = 'rgba(255, 0, 0, 1)'; // 红色
      landslideColorDiv.style.width = '16px';
      landslideColorDiv.style.height = '16px';
      landslideColorDiv.style.marginRight = '10px';
      landslideColorDiv.style.borderRadius = '50%'; // 关键：添加圆角实现圆形
      landslideColorDiv.style.boxSizing = 'border-box'; // 包含边框尺寸

      const landslideTextDiv = document.createElement('div');
      landslideTextDiv.className = 'legend-text';
      landslideTextDiv.textContent = '历史滑坡灾害点';
      landslideTextDiv.style.fontSize = '14px';
      landslideTextDiv.style.lineHeight = '20px';

      landslideItem.appendChild(landslideColorDiv);
      landslideItem.appendChild(landslideTextDiv);
      container.appendChild(landslideItem);

      // 泥石流图例（黄色圆形）
      const debrisFlowItem = document.createElement('div');
      debrisFlowItem.className = 'legend-item';
      debrisFlowItem.style.display = 'flex';
      debrisFlowItem.style.alignItems = 'center';
      debrisFlowItem.style.marginBottom = '10px';

      const debrisFlowColorDiv = document.createElement('div');
      debrisFlowColorDiv.className = 'legend-point';
      debrisFlowColorDiv.style.backgroundColor = 'rgba(255, 255, 0, 1)'; // 黄色
      debrisFlowColorDiv.style.width = '16px';
      debrisFlowColorDiv.style.height = '16px';
      debrisFlowColorDiv.style.marginRight = '10px';
      debrisFlowColorDiv.style.border = '1px solid #333'; // 添加边框
      debrisFlowColorDiv.style.borderRadius = '50%'; // 关键：添加圆角实现圆形
      debrisFlowColorDiv.style.boxSizing = 'border-box'; // 包含边框尺寸

      const debrisFlowTextDiv = document.createElement('div');
      debrisFlowTextDiv.className = 'legend-text';
      debrisFlowTextDiv.textContent = '历史泥石流灾害点';
      debrisFlowTextDiv.style.fontSize = '14px';
      debrisFlowTextDiv.style.lineHeight = '20px';

      debrisFlowItem.appendChild(debrisFlowColorDiv);
      debrisFlowItem.appendChild(debrisFlowTextDiv);
      container.appendChild(debrisFlowItem);


      // 地质灾害风险区图例（黄色圆形）
      const dangerItem = document.createElement('div');
      dangerItem.className = 'legend-item';
      dangerItem.style.display = 'flex';
      dangerItem.style.alignItems = 'center';
      dangerItem.style.marginBottom = '10px';

      const dangerColorDiv = document.createElement('div');
      dangerColorDiv.className = 'legend-point';
      dangerColorDiv.style.backgroundColor = 'rgba(255,134,0,0.8)'; // 黄色
      dangerColorDiv.style.width = '16px';
      dangerColorDiv.style.height = '16px';
      dangerColorDiv.style.marginRight = '10px';
      dangerColorDiv.style.border = '1px solid #333'; // 添加边框
      dangerColorDiv.style.borderRadius = '50%'; // 关键：添加圆角实现圆形
      dangerColorDiv.style.boxSizing = 'border-box'; // 包含边框尺寸

      const dangerTextDiv = document.createElement('div');
      dangerTextDiv.className = 'legend-text';
      dangerTextDiv.textContent = '地质灾害风险点';
      dangerTextDiv.style.fontSize = '14px';
      dangerTextDiv.style.lineHeight = '20px';

      dangerItem.appendChild(dangerColorDiv);
      dangerItem.appendChild(dangerTextDiv);
      container.appendChild(dangerItem);


    },
    // 更新图例
    updateLegend() {
      this.createLegend();
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
  left: 10px;
  display: flex;
  flex-direction: column;
  z-index: 100;
}

.rain-btn, .weather-btn, .admin-btn {
  background-color: rgba(33, 158, 188, 0.8);
  color: white;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  margin-bottom: 8px;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
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
  z-index: 100;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.panel-title {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 10px;
  padding-bottom: 8px;
  border-bottom: 1px solid #444;
}

.panel-content div {
  margin-bottom: 12px;
  display: flex;
  align-items: center;
}

.panel-content label {
  min-width: 80px;
}

.panel-content input {
  width: 60px;
  margin-left: 10px;
  padding: 5px;
  border: none;
  border-radius: 3px;
  text-align: right;
  background-color: rgba(255, 255, 255, 0.2);
  color: white;
}

.panel-content button {
  margin-top: 10px;
  padding: 6px 12px;
  background-color: #386641;
  color: white;
  border: none;
  border-radius: 3px;
  cursor: pointer;
  transition: background-color 0.3s;
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


</style>
