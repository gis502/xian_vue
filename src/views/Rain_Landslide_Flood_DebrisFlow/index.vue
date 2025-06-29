<template>
  <div class="cesium-container" ref="cesiumContainer">
    <el-icon-location-information></el-icon-location-information>
    <div class="rain-btn" @click="toggleRainMode">
      {{ rainMode ? '取消暴雨标记' : '暴雨模拟' }}
    </div>
    <div v-if="rainEntities.length > 0" class="weather-btn" @click="toggleWeatherEffect">
      {{ weatherActive ? '关闭下雨效果' : '开启下雨效果' }}
    </div>
    <div v-if="rainEntities.length > 0" class="clear-btn" @click="clearRainSimulations">
      清除暴雨模拟
    </div>
    <!-- 新增：灾害图层控制按钮 -->
    <div class="disaster-btn" @click="toggleDisasterLayer">
      {{ showDisasterLayer ? '隐藏灾害点' : '显示灾害点' }}
    </div>

    <!-- 在template合适位置加 -->
    <div class="risk-village-btn" @click="toggleRiskVillageLayer">
      {{ showRiskVillageLayer ? '隐藏风险村庄' : '显示风险村庄' }}
    </div>

    <div v-if="showInfoPanel" class="rain-info-panel">
      <div class="panel-title">降雨信息</div>
      <div class="panel-content">
        <div>降雨强度: <input v-model.number="rainIntensity" type="number" min="0" max="1000" step="10" /> mm/h</div>
        <div>持续时间: <input v-model.number="duration" type="number" min="1" max="72" step="1" /> 小时</div>
        <div>降雨半径: <input v-model.number="rainRadius" type="number" min="1" max="50" step="1" /> km</div>
        <button @click="confirmRain">确认添加</button>
        <button @click="cancelRain">取消</button>
      </div>
    </div>

    <!--    指南针 -->
    <div class="compass-widget" @click="resetToNorth" :class="{ 'hovering': isCompassHovering }">
      <div
          class="compass-arrow"
          :style="{ transform: compassTransform }"
          @mouseenter="isCompassHovering = true"
          @mouseleave="isCompassHovering = false"
      >
        <svg width="50" height="90" viewBox="0 0 60 80">
          <!-- 指北箭头：白色边框，透明填充 -->
          <polygon points="30,12 44,52 30,38 16,52" fill="transparent" stroke="#fff" stroke-width="3"/>
          <!-- N字母：Times New Roman -->
          <text x="30" y="10" text-anchor="middle" font-size="26" fill="#fff" font-family="Times New Roman, Times, serif" font-weight="bold">N</text>
        </svg>
      </div>
    </div>

    <!-- 比例尺（左下角） -->
    <div class="map-widget">
      <div class="scale-bar">
        <div class="scale-distance">{{ scaleDistance }}</div>
        <div class="scale-line"></div>
      </div>
    </div>

    <!-- 图例面板（右下角） -->
    <div class="legend-panel">
      <div class="legend-title">图例</div>

      <div class="legend-item">
        <div class="legend-color rain-legend-color" style="background-color: rgba(0, 0, 255, 0.7); border: 2px solid rgba(0, 0, 255, 0.7);"></div>
        <div class="legend-name">降雨影响范围</div>
      </div>

      <div class="admin-legend-content" ref="adminLegendContent">
        <div class="legend-content" ref="legendContent">
          <!-- 使用v-for动态生成图例项 -->
          <div class="legend-item" v-for="(region, index) in adminRegions" :key="index">
            <div class="legend-color admin-legend-color"
                 :style="{ backgroundColor: colorToRgba(region.color) }">
            </div>
            <div class="legend-name">{{ region.name }}</div>
          </div>
      </div>

        <!-- 灾害点图例 -->
        <div ></div>
        <div class="disaster-legend-content">
          <div class="legend-item">
            <div class="legend-color disaster-legend-color" style="background-color: rgba(255, 0, 0, 1); border: 1px solid #fff;"></div>
            <div class="legend-name">历史滑坡灾害点</div>
          </div>
          <div class="legend-item">
            <div class="legend-color disaster-legend-color" style="background-color: rgba(255, 255, 0, 1); border: 1px solid #fff;"></div>
            <div class="legend-name">历史泥石流灾害点</div>
          </div>
        </div>

        <div ></div>
        <div class="risk-legend-content">
          <div class="legend-item">
            <div class="legend-color risk-legend-color" style="background-color: #FFA500; border: 1px solid #fff;"></div>
            <div class="legend-name">风险村庄</div>
          </div>
        </div>

      </div>
    </div>

    <!-- 图层控制按钮 -->
    <div class="layer-control" @click="toggleAdminLayer">
      {{ showAdminLayer ? '隐藏行政区划' : '显示行政区划' }}
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
// 引入滑坡，泥石流灾害点数据
import HuapoData from '@/assets/static/disaster/Huapo.json';
import NishiliuData from '@/assets/static/disaster/Nishiliu.json';
//引入村庄数据
import RiskArea from '@/assets/static/disaster/riskArea.json'

export default {
  name: 'CesiumMap',
  data() {
    return {
      HuapoData: HuapoData,
      NishiliuData: NishiliuData,
      RiskArea:RiskArea,
      disasterEntities: [], // 存储灾害点实体
      showDisasterLayer: true, // 控制灾害点图层显示
      clickHandler: null, // 点击事件处理器
      viewer: null,
      tdtToken: "7f013d0186775b063d6a046977bbefc6",
      currentMapType: 0,
      rainMode: false,
      showInfoPanel: false,
      selectedPosition: null,
      rainIntensity: 100,
      duration: 6,
      rainEntities: [],
      weatherActive: false,
      handler: null, // 屏幕事件处理器
      scaleDistance: '1km', // 比例尺距离
      scaleUpdateInterval: null, // 比例尺更新定时器
      compassHeading: 0, // 指南针角度
      compassHandler: null,
      rainRadius: 10, // 新增，降雨半径，单位km
      rainRangeEntities: [], // 支持多个降雨范围实体
      rainParticleSystems: [], // 支持多个降雨粒子系统
      // 行政区划数据
      administrationData: [BaQiaoArea, BeiLin, ChangAn, GaoLing, HuYi, LanTIan, LianHu, LinTong, WeiYang, XinCheng, YanLiang, YanTa, ZhouZhi],
      adminDataSources:[],
      // 行政区图例数据
      adminRegions: [
        { name: '灞桥区', color: new Cesium.Color(255/255, 153/255, 0/255, 0.5) },
        { name: '碑林区', color: new Cesium.Color(255/255, 51/255, 102/255, 0.5) },
        { name: '长安区', color: new Cesium.Color(0/255, 178/255, 255/255, 0.5) },
        { name: '高陵区', color: new Cesium.Color(102/255, 255/255, 102/255, 0.5) },
        { name: '鄠邑区', color: new Cesium.Color(204/255, 102/255, 255/255, 0.5) },
        { name: '蓝田县', color: new Cesium.Color(255/255, 204/255, 0/255, 0.5) },
        { name: '莲湖区', color: new Cesium.Color(0/255, 204/255, 153/255, 0.5) },
        { name: '临潼区', color: new Cesium.Color(255/255, 102/255, 102/255, 0.5) },
        { name: '未央区', color: new Cesium.Color(102/255, 153/255, 255/255, 0.5) },
        { name: '新城区', color: new Cesium.Color(255/255, 178/255, 102/255, 0.5) },
        { name: '阎良区', color: new Cesium.Color(153/255, 255/255, 204/255, 0.5) },
        { name: '雁塔区', color: new Cesium.Color(255/255, 153/255, 204/255, 0.5) },
        { name: '周至县', color: new Cesium.Color(190/255, 255/255, 232/255, 0.5) }
      ],
      showAdminLayer: true, // 新增：控制行政区划图层显示
      isCompassHovering: false,
      orthographicPitch: Cesium.Math.toRadians(-90), // 正射视角的俯仰角
      rainRangePolygons: [], // 存储降雨范围的多边形表示
      isCheckingDisasters: false, // 避免同时进行多次检测
      rainRangeCheckInterval: null, // 新增：存储定时检查的定时器
      rippleEllipses: new Map(),// 存储每个灾害点的水波纹动画定时器和实体
      originalDisasterColors: new Map(), // 存储灾害点原始颜色
      isRainSimulationActive: false, // 标记暴雨模拟是否活跃
      riskVillageEntities: [], // 存储风险村庄实体
      riskVillageColor: new Cesium.Color(1, 165/255, 0, 1), // 绿色表示风险村庄
      showRiskVillageLayer: true, // 控制风险村庄图层显示
      rainEffect: null, // 降雨后处理效果
      rainDropCanvas: null, // 雨滴纹理画布
      isRainEffectInitialized: false, // 标记降雨效果是否初始化
      // 存储光晕效果的数组
      haloEffects: [], // 存储降雨范围内的光晕效果
    }
  },
  computed: {
    compassTransform() {
      const scale = this.isCompassHovering ? '1.05' : '1';
      let angle = this.compassHeading;
      while (angle < 0) angle += 360;
      while (angle >= 360) angle -= 360;
      return `rotate(${-angle}deg) scale(${scale})`;
    }
  },
  async mounted() {
    try {
      this.load();

      // 确保viewer完全初始化后再设置粒子系统
      await new Promise(resolve => setTimeout(resolve, 500));

      this.initScaleBar(); // 初始化比例尺
      this.loadAdminData(); // 加载行政区划数据
      this.loadDisasterData(); // 新增：加载灾害点数据

      // 新增：加载风险村庄数据
      this.loadRiskVillages();

      this.initRainEffect();

      document.addEventListener('keydown', this.onKeyDown);

      await this.$nextTick(() => {
        this.initCompassListener();
        // 用事件监听比例尺随缩放变化
        if (this.viewer) {
          this.viewer.camera.changed.addEventListener(this.updateScaleBar);
          // 页面加载后立即刷新一次比例尺，避免初始比例尺错误
          this.updateScaleBar();
        }
      });

      // 新增：定时检查降雨范围内的灾害点
      this.rainRangeCheckInterval = setInterval(() => {
      }, 1000);
    } catch (error) {
      // console.error("初始化失败:", error);
    }
  },

  beforeDestroy() {
    if (this.viewer && this.compassHandler) {
      this.viewer.camera.changed.removeEventListener(this.compassHandler);
      this.compassHandler = null;
    }
    if (this.viewer) {
      // 移除事件监听
      if (this.viewer.camera && this.updateScaleBar) {
        this.viewer.camera.changed.removeEventListener(this.updateScaleBar);
      }
      // 移除灾害点点击事件
      if (this.clickHandler) {
        this.clickHandler.destroy();
      }

      this.viewer.destroy();
      this.viewer = null;

      if (this.rainRangeCheckInterval) {
        clearInterval(this.rainRangeCheckInterval);
      }

      if (this.originalDisasterColors) {
        this.originalDisasterColors.clear();
        this.originalDisasterColors = null;
      }

      if (this.viewer) {
        this.viewer.destroy();
        this.viewer = null;
      }
    }
    // 移除键盘事件
    document.removeEventListener('keydown', this.onKeyDown);
    if (this.handler) {
      this.handler.destroy();
    }
    // 清除定时检查
    if (this.rainRangeCheckInterval) {
      clearInterval(this.rainRangeCheckInterval);
    }

    // 额外资源清理
    if (this.originalDisasterColors) {
      this.originalDisasterColors.clear();
      this.originalDisasterColors = null;
    }

    // 确保所有定时器已清除
    if (this.rainRangeCheckInterval) {
      clearInterval(this.rainRangeCheckInterval);
    }

    // 释放 Cesium 资源
    if (this.viewer) {
      this.viewer.destroy();
      this.viewer = null;
    }
  },

  methods: {
    // 将Cesium.Color转换为CSS rgba格式
    colorToRgba(color) {
      return `rgba(${Math.round(color.red*255)}, ${Math.round(color.green*255)}, ${Math.round(color.blue*255)}, ${color.alpha})`;
    },

    load() {
      try {
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
        // 设置初始正射视角
        this.viewer.camera.setView({
          destination: Cesium.Cartesian3.fromDegrees(108.93, 34.27, 300000),
          orientation: {
            heading: Cesium.Math.toRadians(0),
            pitch: Cesium.Math.toRadians(-90),
            roll: 0.0
          }
        });
        this.initScaleBar(); // 初始化比例尺
        document.addEventListener('keydown', this.onKeyDown);
        this.viewer.scene.globe.readyPromise;
      } catch (error) {
        // console.error("Cesium初始化错误:", error);
        throw error;
      }
    },
    // 初始化比例尺
    initScaleBar() {
      this.updateScaleBar();
    },
    // 更新比例尺
    updateScaleBar() {
      if (!this.viewer) return;

      const camera = this.viewer.camera;
      const canvas = this.viewer.canvas;
      const center = new Cesium.Cartesian2(canvas.width / 2, canvas.height / 2);

      // 获取屏幕中心点的世界坐标
      const ray = camera.getPickRay(center);
      if (!ray) return;

      const centerPosition = camera.pickEllipsoid(center, this.viewer.scene.globe.ellipsoid);
      if (!centerPosition) return;

      // 计算屏幕宽度对应的地面距离
      const leftRay = camera.getPickRay(new Cesium.Cartesian2(0, canvas.height / 2));
      const rightRay = camera.getPickRay(new Cesium.Cartesian2(canvas.width, canvas.height / 2));

      if (leftRay && rightRay) {
        const leftPosition = camera.pickEllipsoid(new Cesium.Cartesian2(0, canvas.height / 2), this.viewer.scene.globe.ellipsoid);
        const rightPosition = camera.pickEllipsoid(new Cesium.Cartesian2(canvas.width, canvas.height / 2), this.viewer.scene.globe.ellipsoid);

        if (leftPosition && rightPosition) {
          const distance = Cesium.Cartesian3.distance(leftPosition, rightPosition);
          this.scaleDistance = this.formatDistance(distance);
        }
      }
    },
    // 格式化距离显示
    formatDistance(meters) {
      if (meters >= 1000) {
        return `${Math.round(meters / 1000)}km`;
      } else {
        return `${Math.round(meters)}m`;
      }
    },

    // 加载行政区划数据
    loadAdminData() {
      // console.log('开始加载行政区划数据...');
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
          this.configureAdminStyles(dataSource,i);
          // 添加到地图
          this.viewer.dataSources.add(dataSource);
        }).catch(error => {
          // console.error(`加载行政区划数据失败 (${this.administrationData[i].name || "未知区域"}):`, error);
        });
      }
    },
    // 配置行政区划样式
    configureAdminStyles(dataSource,i) {
      if (!dataSource) return;
      const color = this.adminRegions[i].color; // 使用预定义的颜色
      const entities = dataSource.entities.values;
      entities.forEach(entity => {
        const name = entity.properties.name._value || dataSource.name;
        // console.log( name,"==================================================")
        entity.polygon = {
          hierarchy: entity.polygon.hierarchy,
          material: color,
          outline: true,
          outlineColor: Cesium.Color.BLUE.withAlpha(0.5), // 优化轮廓设置
          outlineWidth: 0.5, // 优化轮廓宽度
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

    // 新增：加载灾害点数据
    loadDisasterData() {
      // console.log('开始加载灾害点数据...');
      try {
        if (!(this.originalDisasterColors instanceof Map)) {
          this.originalDisasterColors = new Map();
        }
        // 确保数据存在且格式正确
        const huapoFeatures = this.HuapoData?.features || [];
        const nishiliuFeatures = this.NishiliuData?.features || [];

        // 清空之前的灾害点实体
        this.disasterEntities = [];
        this.originalDisasterColors.clear(); // 清空之前的颜色记录

        // 加载滑坡点
        huapoFeatures.forEach(point => {
          const properties = point.properties || {};
          const disasterNAME = properties.disasterName || '未知灾害点';
          const longitude = point.geometry.coordinates[0];
          const latitude = point.geometry.coordinates[1];

          // 创建灾害点实体
          const entity = this.viewer.entities.add({
            position: Cesium.Cartesian3.fromDegrees(longitude, latitude, 5),
            // 点
            point: {
              color: Cesium.Color.RED, // 红色表示滑坡
              outlineColor: Cesium.Color.WHITE,
              outlineWidth: 1,
              pixelSize: 12 // 像素点大小
            },
            // 文字
            label: {
              text: `${disasterNAME}`,
              font: '14pt Source Han Sans CN',
              fillColor: Cesium.Color.WHITE,
              backgroundColor: Cesium.Color.RED.withAlpha(0.7),
              showBackground: true,
              outline: true,
              outlineColor: Cesium.Color.BLACK,
              outlineWidth: 1,
              scale: 0.8,
              verticalOrigin: Cesium.VerticalOrigin.CENTER,
              horizontalOrigin: Cesium.HorizontalOrigin.LEFT,
              pixelOffset: new Cesium.Cartesian2(20, -20),
              distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 50000),
              show: this.showDisasterLayer // 控制显示/隐藏
            },
            // 添加灾害类型信息，用于弹窗显示
            description: this.createDisasterDescription(properties, '滑坡')
          });

          // 保存实体引用
          this.disasterEntities.push(entity);
          // 保存原始颜色
          this.originalDisasterColors.set(entity.id, Cesium.Color.RED);
        });

        // 加载泥石流点
        nishiliuFeatures.forEach(point => {
          const properties = point.properties || {};
          const disasterNAME = properties.disasterName || '未知灾害点';
          const longitude = parseFloat(point.geometry.coordinates[0]);
          const latitude = parseFloat(point.geometry.coordinates[1]);

          // 创建灾害点实体
          const entity = this.viewer.entities.add({
            position: Cesium.Cartesian3.fromDegrees(longitude, latitude, 5),
            // 点
            point: {
              color: Cesium.Color.YELLOW, // 黄色表示泥石流
              outlineColor: Cesium.Color.WHITE,
              outlineWidth: 1,
              pixelSize: 12 // 像素点大小
            },
            // 文字
            label: {
              text: `${disasterNAME}`,
              font: '14pt Source Han Sans CN',
              fillColor: Cesium.Color.WHITE,
              backgroundColor: Cesium.Color.YELLOW.withAlpha(0.7),
              showBackground: true,
              outline: true,
              outlineColor: Cesium.Color.BLACK,
              outlineWidth: 1,
              scale: 0.8,
              verticalOrigin: Cesium.VerticalOrigin.CENTER,
              horizontalOrigin: Cesium.HorizontalOrigin.LEFT,
              pixelOffset: new Cesium.Cartesian2(20, -20),
              distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 50000),
              show: this.showDisasterLayer // 控制显示/隐藏
            },
            // 添加灾害类型信息，用于弹窗显示
            description: this.createDisasterDescription(properties, '泥石流')
          });

          // 保存实体引用
          this.disasterEntities.push(entity);
          // 保存原始颜色
          this.originalDisasterColors.set(entity.id, Cesium.Color.YELLOW);
        });

        // 设置实体点击事件
        this.setupEntityClickHandler();

      } catch (error) {
        // console.error('处理灾害数据时出错:', error);
      }
    },

    // 加载风险村庄数据（独立方法）
    loadRiskVillages() {
      // console.log('开始加载风险村庄数据...');
      this.riskVillageEntities = [];

      // 确保数据存在且格式正确
      const riskVillageFeatures = this.RiskArea?.features || [];
      // console.log(`风险村庄数据点数: ${riskVillageFeatures.length}`);

      if (riskVillageFeatures.length === 0) {
       //  console.warn('riskArea.json中没有风险村庄数据');
        return;
      }

      riskVillageFeatures.forEach(point => {
        const properties = point.properties || {};
        const villageName = properties.position || '未知村庄';
        const longitude = parseFloat(point.geometry.coordinates[0]);
        const latitude = parseFloat(point.geometry.coordinates[1]);
        const grade = properties.grade || '未知等级';
        const area = properties.area_Km2 || '未知面积';

        const entity = this.viewer.entities.add({
          position: Cesium.Cartesian3.fromDegrees(longitude, latitude, 5),
          point: {
            color: this.riskVillageColor,
            outlineColor: Cesium.Color.WHITE,
            outlineWidth: 1,
            pixelSize: 10
          },
          label: {
            text: `${villageName}`,
            font: '14pt Source Han Sans CN',
            fillColor: Cesium.Color.WHITE,
            backgroundColor: this.riskVillageColor.withAlpha(0.7),
            showBackground: true,
            outline: true,
            outlineColor: Cesium.Color.BLACK,
            outlineWidth: 1,
            scale: 0.8,
            verticalOrigin: Cesium.VerticalOrigin.CENTER,
            horizontalOrigin: Cesium.HorizontalOrigin.LEFT,
            pixelOffset: new Cesium.Cartesian2(20, -20),
            distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 50000),
            show: this.showRiskVillageLayer // 独立控制显示/隐藏
          },
          description: `
            <div style="font-family: Arial, sans-serif; padding: 10px;">
              <h3 style="color: green; margin-top: 0;">${villageName}</h3>
              <p><strong>坐标:</strong> ${longitude.toFixed(6)}, ${latitude.toFixed(6)}</p>
              <p><strong>风险等级:</strong> ${grade}</p>
              <p><strong>区域面积:</strong> ${area} km²</p>
            </div>
          `
        });

        this.riskVillageEntities.push(entity);
      });

      // console.log(`成功加载 ${riskVillageFeatures.length} 个风险村庄`);
    },

    // 切换风险村庄显示
    toggleRiskVillageLayer() {
      this.showRiskVillageLayer = !this.showRiskVillageLayer;
      this.riskVillageEntities.forEach(entity => {
        entity.point.show = this.showRiskVillageLayer;
        entity.label.show = this.showRiskVillageLayer;
      });
    },

    // 创建灾害点详情描述
    createDisasterDescription(properties, disasterType) {
      return `
        <div style="font-family: Arial, sans-serif; padding: 10px;">
          <h3 style="color: ${disasterType === '滑坡' ? 'red' : 'yellow'}; margin-top: 0;">
            ${properties.disasterName || '未知灾害点'}
          </h3>
          <p><strong>灾害类型:</strong> ${disasterType}</p>
          <p><strong>坐标:</strong> ${properties.longitude || '未知'}, ${properties.latitude || '未知'}</p>
          <p><strong>灾害等级:</strong> ${properties.level || '未知'}</p>
          <p><strong>影响范围:</strong> ${properties.impactRange || '未知'}</p>
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

    // 新增：切换灾害点图层显示
    toggleDisasterLayer() {
      this.showDisasterLayer = !this.showDisasterLayer;
      if (this.disasterEntities && this.disasterEntities.length > 0) {
        this.disasterEntities.forEach(entity => {
          if (entity.point) entity.point.show = this.showDisasterLayer;
          if (entity.label) entity.label.show = this.showDisasterLayer;
        });
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
          // console.log(`点击了: ${entity.properties.name || "未知区域"}`);
        }
      }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

      // 存储处理器以便销毁
      entity.handler = handler;
    },
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
    toggleRainMode() {
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

    onMapClick(movement) {
      if (!this.rainMode) return;
      const ray = this.viewer.camera.getPickRay(movement.position);
      const cartesian = this.viewer.scene.globe.pick(ray, this.viewer.scene);

      // console.log('地图点击事件触发', { ray, cartesian });

      if (cartesian) {
        const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
        const longitude = Cesium.Math.toDegrees(cartographic.longitude);
        const latitude = Cesium.Math.toDegrees(cartographic.latitude);

        // console.log('计算得到的经纬度', { longitude, latitude });

        // 确保属性正确赋值并进行有效性检查
        if (Number.isFinite(longitude) && Number.isFinite(latitude)) {
          this.selectedPosition = {
            longitude,
            latitude,
            cartesian,
            timestamp: Date.now() // 添加时间戳，用于追踪数据变化
          };

          // console.log('selectedPosition 设置成功', this.selectedPosition);
          this.showInfoPanel = true;
        } else {
          // console.error('计算得到的经纬度无效', { longitude, latitude, cartographic });
          this.selectedPosition = null;
        }
      } else {
        // console.warn('未能获取点击位置的坐标');
        this.selectedPosition = null;
      }
    },

    //确认添加降雨
    confirmRain() {
      // console.log('confirmRain 方法调用时的 selectedPosition', this.selectedPosition);

      // 严格检查selectedPosition的完整性和有效性
      if (!this.selectedPosition || !this.selectedPosition.longitude || !this.selectedPosition.latitude) {
        // console.error('selectedPosition 数据不完整或无效', this.selectedPosition);
        // alert('请在地图上选择有效的位置！');
        return;
      }

      const { longitude, latitude, cartesian } = this.selectedPosition;

      // 再次验证经纬度有效性
      if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) {
        // console.error('经纬度数据无效', { longitude, latitude });
        // alert('所选位置的经纬度数据无效！');
        return;
      }

      // 添加暴雨标记点
      const entity = this.viewer.entities.add({
        position: cartesian,
        point: {
          pixelSize: this.rainIntensity / 10,
          color: Cesium.Color.BLUE,
          outlineColor: Cesium.Color.WHITE,
          outlineWidth: 2,
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
        },
        label: {
          text: `降雨: ${this.rainIntensity}mm/h\n持续: ${this.duration}h`,
          font: '14px sans-serif',
          fillColor: Cesium.Color.WHITE,
          backgroundColor: Cesium.Color.BLUE.withAlpha(0.7),
          padding: new Cesium.Cartesian2(7, 5),
          showBackground: true,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          pixelOffset: new Cesium.Cartesian2(0, -10),
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
        },
        description: `
          <div style="font-family: Arial, sans-serif;">
            <h3>暴雨信息</h3>
            <p><strong>位置:</strong> ${latitude.toFixed(4)}, ${longitude.toFixed(4)}</p>
            <p><strong>降雨强度:</strong> ${this.rainIntensity} mm/h</p>
            <p><strong>持续时间:</strong> ${this.duration} 小时</p>
            <p><strong>降雨半径:</strong> ${this.rainRadius} km</p>
            <p><strong>时间:</strong> ${new Date().toLocaleString()}</p>
          </div>
        `
      });
      this.rainEntities.push(entity);
      // 添加降雨范围圆（修复高度参考警告）
      const rangeEntity = this.viewer.entities.add({
        position: cartesian,
        ellipse: {
          semiMinorAxis: this.rainRadius * 1000,
          semiMajorAxis: this.rainRadius * 1000,
          material: Cesium.Color.BLUE.withAlpha(0.18),
          outline: true,
          outlineColor: Cesium.Color.BLUE.withAlpha(0.7),
          outlineWidth: 2,
          height: 0, // 明确设置高度
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
        }
      });
      this.rainRangeEntities.push(rangeEntity);
      // 异步创建粒子系统并等待其完成
      const particleSystem = this.addRainParticleSystem(cartesian, this.rainRadius, this.rainIntensity);
      if (!particleSystem) {
        // console.error('降雨粒子系统创建失败');
        // alert('降雨效果初始化失败，请重试');
        return;
      }

      // 激活降雨效果
      this.activateRainEffect(particleSystem);

      // 新增：相机飞行到降雨区域并设置45度角视角
      this.flyToRainArea(longitude, latitude, this.rainRadius);

      this.showInfoPanel = false;

      // 存储降雨范围
      const center = Cesium.Cartesian3.fromDegrees(longitude, latitude);
      const radius = this.rainRadius * 1000;

      this.rainRangePolygons.push({
        center: center,
        radius: radius,
        entity: rangeEntity // 存储对应的实体引用
      });

      // 开始检查灾害点
      this.updateRainRanges();

      // 检查降雨范围内的实体并添加光晕效果
      this.$nextTick(() => {
        this.checkEntitiesInRainRange();
      });
    },

    activateRainEffect(particleSystem) {
      this.weatherActive = true;
      if (particleSystem) {
        particleSystem.show = true;
      }
      // 直接控制所有降雨粒子系统的显示
      if (this.rainParticleSystems && this.rainParticleSystems.length > 0) {
        this.rainParticleSystems.forEach(ps => {
          if (ps) ps.show = true;
        });
      }
      // 直接控制后处理效果
      if (this.rainEffect) {
        this.rainEffect.enabled = true;
      }
      // 更新UI按钮状态
      this.$nextTick(() => {
        const weatherBtn = this.$el.querySelector('.weather-btn');
        if (weatherBtn) {
          weatherBtn.innerHTML = '关闭下雨效果';
        }
      });
    },


// 当降雨范围变化时更新检测（优化版）
    updateRainRanges() {
      if (this.rainRangeEntities.length > 0) {
        this.rainRangePolygons = [];
        this.rainRangeEntities.forEach((entity, index) => {
          const position = entity.position.getValue(Cesium.JulianDate.now());
          if (position) {
            const radius = entity.ellipse.semiMajorAxis.getValue(Cesium.JulianDate.now());

            this.rainRangePolygons.push({
              center: position,
              radius: radius,
              entity: entity
            });
          }
        });
      }
    },

    // 新增：相机飞行到降雨区域的方法
    flyToRainArea(longitude, latitude, radiusKm) {
      // 计算飞行高度（根据降雨半径动态调整）
      const height = Math.max(5000, radiusKm * 2000); // 最小高度5000米，最大为半径的2倍

      // 设置45度角视角（pitch为-45度，heading为0度）
      this.viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(
            longitude,
            latitude,
            height
        ),
        orientation: {
          heading: Cesium.Math.toRadians(0),       // 0度朝向（正东方向）
          pitch: Cesium.Math.toRadians(-90),      // -45度俯仰角（向下45度）
          roll: 0.0
        },
        duration: 3.0,                            // 飞行持续时间3秒
        easingFunction: Cesium.EasingFunction.EASE_IN_OUT  // 平滑过渡
      });
    },

    cancelRain() {
      this.showInfoPanel = false;
      // 删除所有降雨范围圆
      if (this.rainRangeEntities && this.rainRangeEntities.length > 0) {
        this.rainRangeEntities.forEach(entity => {
          this.viewer.entities.remove(entity);
        });
        this.rainRangeEntities = [];
      }
      // 删除所有降雨粒子系统
      if (this.rainParticleSystems && this.rainParticleSystems.length > 0) {
        this.rainParticleSystems.forEach(ps => {
          if (ps && this.viewer.scene.primitives.contains(ps)) {
            this.viewer.scene.primitives.remove(ps);
          }
        });
        this.rainParticleSystems = [];
      }
    },
    onKeyDown(event) {
      if (event.key === 'Escape' && this.rainMode) {
        this.toggleRainMode();
      }
    },

    toggleWeatherEffect() {
      this.weatherActive = !this.weatherActive;
      // 控制所有降雨粒子系统的显示/隐藏
      if (this.rainParticleSystems && this.rainParticleSystems.length > 0) {
        this.rainParticleSystems.forEach(ps => {
          if (ps) ps.show = this.weatherActive;
        });
      }
      // 控制后处理效果
      if (this.rainEffect) {
        this.rainEffect.enabled = this.weatherActive;
      }
    },

    // 清除暴雨模拟
    clearRainSimulations() {
      // 关闭下雨效果
      this.weatherActive = false;
      if (this.rainEffect) {
        this.rainEffect.enabled = false;
      }

      // 删除所有降雨相关实体（不影响后处理效果）
      if (this.rainEntities.length > 0) {
        this.rainEntities.forEach(entity => this.viewer.entities.remove(entity));
        this.rainEntities = [];
      }
      if (this.rainRangeEntities.length > 0) {
        this.rainRangeEntities.forEach(entity => this.viewer.entities.remove(entity));
        this.rainRangeEntities = [];
      }
      if (this.rainParticleSystems.length > 0) {
        this.rainParticleSystems.forEach(ps => {
          if (ps && this.viewer.scene.primitives.contains(ps)) {
            this.viewer.scene.primitives.remove(ps);
          }
        });
        this.rainParticleSystems = [];
      }

      // 恢复灾害点原始颜色
      this.restoreOriginalDisasterColors();


      // 清除所有光晕效果
      this.clearHaloEffects();

      // 停止降雨范围检查
      this.stopRainRangeChecking();

      // 重置状态
      this.showInfoPanel = false;
      this.rainMode = false;
      this.isRainSimulationActive = false;
      if (this.handler) this.handler.destroy();
      this.handler = null;
      document.body.style.cursor = '';
      this.selectedPosition = null;
      this.rainRangePolygons = [];

      // console.log('所有暴雨模拟已清除，灾害点恢复原始状态');
    },

    // 恢复灾害点原始颜色
    restoreOriginalDisasterColors() {
      this.disasterEntities.forEach(entity => {
        const originalColor = this.originalDisasterColors.get(entity.id);
        if (originalColor) {
          entity.point.color = originalColor;
        }
      });
    },

    // 停止降雨范围检查
    stopRainRangeChecking() {
      if (this.rainRangeCheckInterval) {
        clearInterval(this.rainRangeCheckInterval);
        this.rainRangeCheckInterval = null;
      }
      this.isCheckingDisasters = false;
    },


    initCompassListener() {
      if (!this.viewer) return;

      // 保存之前的事件监听器，避免重复添加
      if (this.compassHandler) {
        this.viewer.camera.changed.removeEventListener(this.compassHandler);
      }

      // 创建新的事件监听器
      this.compassHandler = () => {
        try {
          // 获取当前相机Heading（弧度）
          const heading = this.viewer.camera.heading;
          // 转换为角度并更新指南针角度
          this.compassHeading = Cesium.Math.toDegrees(heading);
          // 调试日志
          // console.log('指南针角度更新:', this.compassHeading);
        } catch (error) {
          // console.error('指南针角度更新错误:', error);
        }
      };

      // 添加事件监听
      this.viewer.camera.changed.addEventListener(this.compassHandler);
      // 恢复灾害点颜色
      this.restoreOriginalDisasterColors();

      // 清空降雨范围数据，停止检查
      this.rainRangePolygons = [];
    },

    // 新增：为每个降雨点添加独立粒子系统
    async addRainParticleSystem(cartesian, radiusKm, intensity) {
      return new Promise((resolve) => {
        try {
          const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
          const lon = Cesium.Math.toDegrees(cartographic.longitude);
          const lat = Cesium.Math.toDegrees(cartographic.latitude);
          const rainPosition = Cesium.Cartesian3.fromDegrees(lon, lat, 3000);
          const modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(rainPosition);
          const boxSize = radiusKm * 1000 * 2;
          const emissionRate = Math.max(50, Math.min(1500, Math.round(intensity * 1.5)));

          // 创建雨滴纹理
          if (!this.rainDropCanvas) {
            this.rainDropCanvas = this.createRaindropCanvas();
          }

          const rainParticleSystem = new Cesium.ParticleSystem({
            image: this.rainDropCanvas,
            startColor: new Cesium.Color(1.0, 1.0, 1.0, 0.8),
            endColor: new Cesium.Color(0.8, 0.9, 1.0, 0.4),
            startScale: 0.5,
            endScale: 1.0,
            minimumParticleLife: 3.0,
            maximumParticleLife: 5.0,
            minimumSpeed: 10.0,
            maximumSpeed: 20.0,
            emissionRate: emissionRate,
            imageSize: new Cesium.Cartesian2(8, 25),
            emitter: new Cesium.BoxEmitter(new Cesium.Cartesian3(boxSize, boxSize, 5000)),
            modelMatrix: modelMatrix,
            lifetime: 20.0,
            updateCallback: (particle, dt) => {
              particle.position.x += dt * (Math.random() - 0.5) * 8;
              particle.position.y += dt * (Math.random() - 0.5) * 8;
            },
            show: false // 初始设为false，由激活方法控制
          });

          if (this.viewer && this.viewer.scene) {
            this.viewer.scene.primitives.add(rainParticleSystem);
            this.rainParticleSystems.push(rainParticleSystem);
            // console.log(`降雨粒子系统已添加 - 位置: ${lon.toFixed(4)}, ${lat.toFixed(4)}, 强度: ${intensity}mm/h`);
          }
          resolve(rainParticleSystem);
        } catch (error) {
          // console.error('添加降雨粒子系统失败:', error);
          resolve(null);
        }
      });
    },

    // 创建雨滴纹理
    createRaindropCanvas() {
      const canvas = document.createElement('canvas');
      canvas.width = 20;
      canvas.height = 40;
      const ctx = canvas.getContext('2d');
      const gradient = ctx.createLinearGradient(0, 0, 0, 40);
      gradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
      gradient.addColorStop(0.4, 'rgba(255, 255, 255, 0.9)');
      gradient.addColorStop(1, 'rgba(200, 225, 255, 0.3)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.moveTo(10, 0);
      ctx.bezierCurveTo(15, 5, 15, 35, 10, 40);
      ctx.bezierCurveTo(5, 35, 5, 5, 10, 0);
      ctx.fill();
      return canvas;
    },


    //点击指南针回到正北方向
    resetToNorth() {
      const camera = this.viewer.camera;
      const currentPosition = camera.position;

      // 临时禁用事件监听
      if (this.compassHandler) {
        this.viewer.camera.changed.removeEventListener(this.compassHandler);
      }

      // 立即设置Heading并更新指南针角度
      camera.setView({
        destination: currentPosition,
        orientation: {
          heading: 0,
          pitch:  this.orthographicPitch,
          roll: 0
        }
      });

      // 手动更新指南针角度
      this.compassHeading = 0;

      // 重新添加事件监听
      this.initCompassListener();

      // 执行平滑过渡动画
      this.viewer.camera.flyTo({
        destination: currentPosition,
        orientation: {
          heading: 0,
          pitch:  this.orthographicPitch,
          roll: 0.0
        },
        duration: 3.0,
        easingFunction: Cesium.EasingFunction.EASE_IN_OUT,

      });
    },

    initRainEffect() {
      const rainFragmentShader = `
      #version 300 es
      precision highp float;
      uniform sampler2D colorTexture;
      in vec2 v_textureCoordinates;
      out vec4 fragColor;
      float hash(float x){
          return fract(sin(x*23.3)*13.13);
      }
      void main(){
          float time = czm_frameNumber / 100.0;
          vec2 resolution = czm_viewport.zw;
          vec2 uv=(gl_FragCoord.xy*2.-resolution.xy)/min(resolution.x,resolution.y);
          vec3 c=vec3(.6,.7,.8);
          float a=-.6;
          float si=sin(a),co=cos(a);
          uv*=mat2(co,-si,si,co);
          uv*=length(uv+vec2(0,8.9))*.3+1.;
          float v=1.-sin(hash(floor(uv.x*100.))*2.);
          float b=clamp(abs(sin(20.*time*v+uv.y*(5./(2.+v))))-.95,0.,1.)*20.;
          c*=v*b;
          fragColor = mix(texture(colorTexture, v_textureCoordinates), vec4(c, 1), 0.5);
      }
    `;
      this.rainEffect = new Cesium.PostProcessStage({
        fragmentShader: rainFragmentShader
      });
      if (this.viewer && this.viewer.scene) {
        this.viewer.scene.postProcessStages.add(this.rainEffect);
      }
      this.rainEffect.enabled = false;
    },

    // 新增：创建光晕效果的方法
    createHaloEffect(entity, entityType) {
      try {
        const position = entity.position.getValue(Cesium.JulianDate.now());
        if (!position) return null;

        // 根据实体类型设置不同的光晕颜色和大小
        let haloColor;
        let haloSize;
        if (entityType === 'disaster') {
          // 灾害点光晕：红色或黄色
          const originalColor = this.originalDisasterColors.get(entity.id);
          haloColor = originalColor || Cesium.Color.RED;
          haloSize = 200; // 增大光晕大小，单位：米
        } else if (entityType === 'village') {
          // 风险村庄光晕
          haloColor = new Cesium.Color(1, 165/255, 0, 1);
          haloSize = 150; // 增大光晕大小，单位：米
        } else {
          return null;
        }

        // 创建光晕实体（使用简单的椭圆实现光晕效果）
        const haloEntity = this.viewer.entities.add({
          position: position,
          ellipse: {
            semiMinorAxis: haloSize,
            semiMajorAxis: haloSize,
            material: haloColor.withAlpha(0.2), // 使用简单的半透明颜色
            outline: true,
            outlineColor: haloColor.withAlpha(0.6),
            outlineWidth: 3,
            height: 0,
            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
          }
        });

        // 创建第二个更大的光晕层，形成双层光晕效果
        const outerHaloEntity = this.viewer.entities.add({
          position: position,
          ellipse: {
            semiMinorAxis: haloSize * 1.5,
            semiMajorAxis: haloSize * 1.5,
            material: haloColor.withAlpha(0.1), // 外层更透明
            outline: true,
            outlineColor: haloColor.withAlpha(0.4),
            outlineWidth: 2,
            height: 0,
            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
          }
        });

        // 添加光晕动画效果
        const startTime = Date.now();
        const animationDuration = 2000; // 动画持续时间（毫秒）

        // 创建动画回调
        const animateHalo = () => {
          const currentTime = Date.now();
          const elapsed = (currentTime - startTime) % animationDuration;
          const normalizedTime = elapsed / animationDuration;

          // 使用正弦波创建脉冲效果
          const pulse = 0.5 + 0.5 * Math.sin(normalizedTime * Math.PI * 2);

          // 更新内层光晕大小和透明度
          const currentInnerSize = haloSize * (0.8 + 0.4 * pulse);
          haloEntity.ellipse.semiMinorAxis = currentInnerSize;
          haloEntity.ellipse.semiMajorAxis = currentInnerSize;

          // 更新外层光晕大小
          const currentOuterSize = haloSize * 1.5 * (0.9 + 0.2 * pulse);
          outerHaloEntity.ellipse.semiMinorAxis = currentOuterSize;
          outerHaloEntity.ellipse.semiMajorAxis = currentOuterSize;

          // 更新透明度
          const innerAlpha = 0.1 + 0.2 * pulse;
          const outerAlpha = 0.05 + 0.1 * pulse;

          haloEntity.ellipse.material = haloColor.withAlpha(innerAlpha);
          outerHaloEntity.ellipse.material = haloColor.withAlpha(outerAlpha);
        };

        // 启动动画
        const animationId = setInterval(animateHalo, 100); // 每100ms更新一次

        // 返回光晕信息对象
        return {
          entity: haloEntity,
          outerEntity: outerHaloEntity,
          originalEntity: entity,
          type: entityType,
          animationId: animationId
        };
      } catch (error) {
        // console.error('创建光晕效果失败:', error);
        return null;
      }
    },

    // 新增：检查实体是否在降雨范围内并添加光晕效果
    checkEntitiesInRainRange() {
      // console.log('开始检查降雨范围内的实体...');
      // console.log('当前降雨范围数量:', this.rainRangePolygons.length);
      // console.log('灾害点数量:', this.disasterEntities.length);
      // console.log('风险村庄数量:', this.riskVillageEntities.length);

      if (!this.rainRangePolygons || this.rainRangePolygons.length === 0) {
        // console.log('没有降雨范围，跳过光晕效果检查');
        return;
      }

      // 清除之前的光晕效果
      this.clearHaloEffects();

      let disasterCount = 0;
      let villageCount = 0;

      // 检查灾害点
      this.disasterEntities.forEach((entity, index) => {
        const position = entity.position.getValue(Cesium.JulianDate.now());
        if (position) {
          const isInRange = this.isPositionInRainRange(position);
          // console.log(`灾害点 ${index}: 位置 ${position.x.toFixed(2)}, ${position.y.toFixed(2)}, ${position.z.toFixed(2)}, 在范围内: ${isInRange}`);
          if (isInRange) {
            const haloEffect = this.createHaloEffect(entity, 'disaster');
            if (haloEffect) {
              this.haloEffects.push(haloEffect);
              disasterCount++;
              // console.log(`成功为灾害点 ${index} 创建光晕效果`);
            } else {
              // console.error(`为灾害点 ${index} 创建光晕效果失败`);
            }
          }
        } else {
          // console.warn(`灾害点 ${index} 无法获取位置信息`);
        }
      });

      // 检查风险村庄
      this.riskVillageEntities.forEach((entity, index) => {
        const position = entity.position.getValue(Cesium.JulianDate.now());
        if (position) {
          const isInRange = this.isPositionInRainRange(position);
          // console.log(`风险村庄 ${index}: 位置 ${position.x.toFixed(2)}, ${position.y.toFixed(2)}, ${position.z.toFixed(2)}, 在范围内: ${isInRange}`);
          if (isInRange) {
            const haloEffect = this.createHaloEffect(entity, 'village');
            if (haloEffect) {
              this.haloEffects.push(haloEffect);
              villageCount++;
              // console.log(`成功为风险村庄 ${index} 创建光晕效果`);
            } else {
              // console.error(`为风险村庄 ${index} 创建光晕效果失败`);
            }
          }
        } else {
          // console.warn(`风险村庄 ${index} 无法获取位置信息`);
        }
      });

      // console.log(`光晕效果检查完成: 灾害点 ${disasterCount} 个, 风险村庄 ${villageCount} 个, 总计 ${this.haloEffects.length} 个光晕效果`);
    },

    // 新增：检查位置是否在降雨范围内
    isPositionInRainRange(position) {
      for (let i = 0; i < this.rainRangePolygons.length; i++) {
        const rainRange = this.rainRangePolygons[i];
        const distance = Cesium.Cartesian3.distance(position, rainRange.center);
        // console.log(`检查位置与降雨范围 ${i}: 距离 ${distance.toFixed(2)}m, 半径 ${rainRange.radius.toFixed(2)}m, 在范围内: ${distance <= rainRange.radius}`);
        if (distance <= rainRange.radius) {
          return true;
        }
      }
      return false;
    },

    // 新增：清除所有光晕效果
    clearHaloEffects() {
      this.haloEffects.forEach(haloEffect => {
        // 停止动画
        if (haloEffect.animationId) {
          clearInterval(haloEffect.animationId);
        }
        // 移除内层光晕实体
        if (haloEffect.entity) {
          this.viewer.entities.remove(haloEffect.entity);
        }
        // 移除外层光晕实体
        if (haloEffect.outerEntity) {
          this.viewer.entities.remove(haloEffect.outerEntity);
        }
      });
      this.haloEffects = [];
    },

  }
}
</script>

<style scoped>
.cesium-container {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}
.rain-btn {
  width: 108px;
  text-align: center;
  position: absolute;
  top: 10px;
  left: 10px;
  background-color: rgba(33, 158, 188, 0.8);
  color: white;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  z-index: 100;
  transition: background-color 0.3s;
}
.rain-btn:hover {
  background-color: rgba(33, 158, 188, 1);
}
.weather-btn {
  position: absolute;
  top: 54px;
  left: 10px;
  background-color: rgba(33, 158, 188, 0.8);
  color: white;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  z-index: 100;
  transition: background-color 0.3s;
}
.weather-btn:hover {
  background-color: rgba(33, 158, 188, 1);
}
.clear-btn {
  position: absolute;
  top: 90px;
  left: 10px;
  background-color: #bc4749;
  color: white;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  z-index: 100;
  transition: background-color 0.3s;
}
.clear-btn:hover {
  background-color: #a83232;
}
.rain-info-panel {
  position: absolute;
  top: 130px;
  left: 10px;
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 15px;
  border-radius: 4px;
  width: 240px;
  z-index: 100;
}
/* 新增：灾害点图层控制按钮 */
.disaster-btn {
  position: absolute;
  top: 20px;
  left: 250px;
  background-color: #e63946;
  color: white;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  z-index: 100;
  transition: background-color 0.3s;
}
.disaster-btn:hover {
  background-color: #b5179e;
}
.rain-info-panel {
  position: absolute;
  top: 170px;
  left: 10px;
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 15px;
  border-radius: 4px;
  width: 240px;
  z-index: 100;
}

.panel-title {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 10px;
  border-bottom: 1px solid #ccc;
  padding-bottom: 5px;
}
.panel-content div {
  margin-bottom: 10px;
}
.panel-content input {
  width: 80px;
  margin-left: 10px;
  padding: 3px;
}
.panel-content button {
  margin-top: 10px;
  margin-right: 10px;
  padding: 5px 10px;
  background-color: #386641;
  color: white;
  border: none;
  border-radius: 3px;
  cursor: pointer;
}
.panel-content button:last-child {
  background-color: #bc4749;
}
/* 添加按钮样式 */
.rain-btn {
  margin-top: 10px;
  padding: 5px 10px;
  background-color: #219EBC;
  color: white;
  border: none;
  border-radius: 3px;
  cursor: pointer;
  transition: background-color 0.3s;
}
.rain-btn:hover {
  background-color: #023047;
}
/* 指南针右上角 */
.compass-widget {
  position: absolute;
  right: 20px;
  top: 20px;
  z-index: 100;
  pointer-events: auto;/* 允许点击事件 */
  cursor: pointer; /* 鼠标悬停时显示指针 */
}
.compass-arrow {
  width: 50px;
  height: 70px;
  transition: all 0.2s linear;
  will-change: transform;
}

.compass-arrow svg {
  display: block;
}

/* 地图控件容器（比例尺左下角） */
.map-widget {
  position: absolute;
  left: 20px;
  bottom: 20px;
  z-index: 100;
  display: flex;
  flex-direction: column;
  align-items: center;
  pointer-events: none;
}
.scale-bar {
  background: none;
  padding: 0;
  pointer-events: auto;
}
.scale-distance {
  color: #fff;
  font-size: 16px;
  text-align: center;
  margin-bottom: 0px;
  margin-top: 0px;
  line-height: 1;
  text-shadow: 0 0 3px #000, 0 0 2px #000;
}
.scale-line {
  width: 80px;
  height: 2px;
  background: #fff;
  margin: 2px auto 0 auto;
  position: relative;
}
.scale-line::before,
.scale-line::after {
  content: '';
  position: absolute;
  width: 2px;
  height: 12px;
  background: #fff;
  top: -5px;
}
.scale-line::before {
  left: 0;
}
.scale-line::after {
  right: 0;
}
/* 图例面板样式 */
.legend-panel {
  position: absolute;
  right: 20px;
  bottom: 20px;
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 10px 15px;
  border-radius: 5px;
  z-index: 100;
  max-width: 300px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
}

/* 降雨影响范围图例颜色块样式 */
.rain-legend-color {
  width: 16px;
  height: 16px;
  margin-right: 8px;
  box-shadow: 0 0 2px rgba(0, 0, 0, 0.5);
  border-radius: 3px;
  background-color: rgba(0, 0, 255, 0.18);
  border: 2px solid rgba(0, 0, 255, 0.7);
}

.legend-title {
  font-size: 14px;
  font-weight: bold;
  margin-bottom: 10px;
  text-align: center;
  border-bottom: 1px solid #ccc;
  padding-bottom: 5px;
}

.legend-content {
  font-size: 13px;
  display: grid;
  grid-template-columns: repeat(2, 1fr); /* 分为两列 */
  grid-gap: 3px; /* 列间距 */
}

.legend-item {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  padding: 2px 4px;
  transition: background-color 0.2s;
}

/* 确保小屏幕下自动合并为一列 */
@media (max-width: 480px) {
  .admin-legend-content {
    grid-template-columns: 1fr; /* 小屏幕下行政区划图例也转为单列 */
  }
  .legend-content {
    grid-template-columns: 1fr; /* 小屏幕下单列 */
  }
}

.legend-item:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.legend-color {
  width: 16px;
  height: 16px;
  margin-right: 8px;
  box-shadow: 0 0 2px rgba(0, 0, 0, 0.5);
}

.legend-name {
  font-size: 13px;
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 行政区划图例颜色块 - 圆角方形 */
.admin-legend-color {
  border-radius: 4px;
}

/* 灾害点图例颜色块 - 圆形（恢复原来的圆形） */
.disaster-legend-color {
  border-radius: 50%; /* 恢复圆形 */
}

/* 风险区域图例颜色块 - 保持原有样式或自定义 */
.risk-legend-color {
  border-radius: 50%; /* 保持圆形，或根据需要修改 */
}

/* 新增：图层控制按钮样式 */
.layer-control {
  position: absolute;
  top: 20px;
  left: 130px;
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  z-index: 100;
  transition: background-color 0.3s;
}

.layer-control:hover {
  background-color: rgba(0, 0, 0, 0.9);
}

.risk-village-btn {
  position: absolute;
  top: 20px;
  left: 360px;
  background-color: rgba(255, 165, 0, 0.9);
  color: white;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  z-index: 100;
  transition: background-color 0.3s;
}

.risk-village-btn:hover {
  background-color: #FFA500;
}
</style>