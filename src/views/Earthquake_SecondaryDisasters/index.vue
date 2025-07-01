<template>
  <div class="cesium-container" ref="cesiumContainer">
    <!-- 地震触发按钮 -->
    <div class="earthquake-btn" @click="toggleEarthquakeMode">
      {{ earthquakeMode ? '取消地震标记' : '触发地震模拟' }}
    </div>

    <!-- 清除地震按钮 -->
    <div v-if="earthquakeEntities.length > 0" class="clear-earthquake-btn" @click="clearEarthquake">
      清除地震
    </div>

    <!-- 光晕状态显示 -->
    <div v-if="isHaloActive" class="halo-status">
      光晕效果已激活
    </div>

    <!-- 次生灾害控制面板 -->
    <div class="secondary-panel">
      <div class="panel-title">次生灾害</div>
      <div class="panel-content">
        <label><input type="checkbox" v-model="showFaultLines" @change="toggleFaultLines" /> 显示断裂带 </label>
        <label><input type="checkbox" v-model="showDisasterLayer" @change="toggleDisasterPoints" /> 显示灾害点 </label>
        <label><input type="checkbox" v-model="showDangerPoints" @change="toggleDangerPoints" /> 显示加油站 </label>
        <label><input type="checkbox" v-model="showRiskArea" @change="toggleRiskVisibility"> 显示村庄 </label>
      </div>
    </div>
    <!-- 地震信息面板 -->
    <div v-if="showInfoPanel" class="earthquake-info-panel">
      <div class="panel-title">地震信息</div>
      <div class="panel-content">
        <div>震级: <input v-model.number="magnitude" type="number" min="0" max="10" step="0.1" /> Ms</div>
        <div>深度: <input v-model.number="depth" type="number" min="0" max="1000" step="1" /> km</div>
        <div>震中位置：</div>
        <div>北纬：{{ selectedPosition ? selectedPosition.longitude.toFixed(4) + '°' : '' }}</div>
        <div>东经：{{ selectedPosition ? selectedPosition.latitude.toFixed(4) + '°' : '' }}</div>
<!--        <div>震中位置: {{ selectedPosition ? `${selectedPosition.latitude.toFixed(4)}, ${selectedPosition.longitude.toFixed(4)}` : '' }}</div>-->
        <button @click="confirmEarthquake">确认添加</button>
        <button @click="cancelEarthquake">取消</button>
      </div>
    </div>

    <!-- 图例 -->
    <div class="legend">
      <div class="legend-title">图例</div>
      <div class="legend-item"><span class="legend-color" style="background: rgba(255, 0, 0, 0.6);"></span>Ⅻ度</div>
      <div class="legend-item"><span class="legend-color" style="background: rgba(255, 69, 0, 0.5);"></span>Ⅺ度</div>
      <div class="legend-item"><span class="legend-color" style="background: rgba(255, 140, 0, 0.45);"></span>Ⅹ度</div>
      <div class="legend-item"><span class="legend-color" style="background: rgba(255, 215, 0, 0.4);"></span>Ⅸ度</div>
      <div class="legend-item"><span class="legend-color" style="background: rgba(124, 252, 0, 0.35);"></span>Ⅷ度</div>
      <div class="legend-item"><span class="legend-color" style="background: rgba(0, 191, 255, 0.3);"></span>Ⅶ度</div>
      <div class="legend-item"><span class="legend-color" style="background: rgba(138, 43, 226, 0.25);"></span>Ⅵ度</div>
      <!--      <div class="legend-item"><span class="legend-color" style="background: #ff0000;"></span> 地震点</div>-->
      <div class="legend-item"><span class="legend-color circle" style="background: #ff0000;"></span> 滑坡点</div>
      <div class="legend-item"><span class="legend-color circle" style="background: #ffea00;"></span> 泥石流点</div>
      <div class="legend-item"><span class="legend-color circle" style="background: #f89c2b;"></span> 村庄</div>
      <div class="legend-item"><span class="legend-line" style="background: #ff0000;"></span> 断裂带</div>
      <div class="legend-item"><img class="legend-icon" src="@/assets/images/gasstation.png" alt="隐患点" /> 加油站</div>

    </div>

  </div>
</template>

<script>
import * as Cesium from 'cesium';
import HuapoData from '@/assets/disaster/Huapo.json';
import NishiliuData from '@/assets/disaster/Nishiliu.json';
import FaultZoneData from '@/assets/disaster/faultZone.json';
import RiskAreaData from '@/assets/static/disaster/xian_risk.json';
import CesiumNavigation from 'cesium-navigation-es6';
import {initCesium} from "@/cesium/initLayer.js";

export default {
  name: 'CesiumMap',

  data() {
    return {
      HuapoData: HuapoData,
      NishiliuData: NishiliuData,
      FaultZoneData: FaultZoneData,
      showDangerPoints: true,
      dangerPointEntities: [],
      showFaultLines: true, // 控制断裂带显隐
      faultLineEntities: [], // 存储断裂带实体
      showDisasterLayer: true,  // 控制显示/隐藏所有灾害点
      disasterEntities: [],     // 存储所有灾害点（滑坡 + 泥石流）
      riskEntities: [],
      showRiskArea: true, // 控制是否显示危险源点
      viewer: null,
      handler: null,
      tdtToken: "7f013d0186775b063d6a046977bbefc6",
      earthquakeMode: false,
      showInfoPanel: false,
      selectedPosition: null,
      magnitude: 5.0,
      depth: 10,
      earthquakeEntities: [],
      intensityCircles: [],
      // faultLines: [],
      dangerPoints: [],
      // 光晕效果相关变量
      haloEntities: [], // 存储光晕实体
      isHaloActive: false, // 光晕是否激活
      intensityConfig: {
        magnitudeRanges: [
          { min: 8.0, max: 8.9, intensities: [12, 11, 10] },
          { min: 7.5, max: 7.9, intensities: [11, 10, 9] },
          { min: 7.0, max: 7.4, intensities: [10, 9, 8] },
          { min: 6.5, max: 6.9, intensities : [9, 8, 7] },
          { min: 6.0, max: 6.4, intensities: [8, 7, 6] }
          // { min: 4.5, max: 5.9, intensities: [6, 5, 4] },
          // { min: 2.5, max: 4.4, intensities: [4, 3, 2] },
          // { min: 0.0, max: 2.4, intensities: [3, 2, 1] }
        ],
        // 注意此处用 rgba 数组代替 Cesium.Color 实例
        colorMap: [
          { level: 12, color: [220, 20, 60, 120] },
          { level: 11, color: [255, 0, 0, 100] },
          { level: 10, color: [255, 140, 0, 90] },
          { level: 9, color: [255, 215, 0, 80] },
          { level: 8, color: [0, 128, 0, 70] },
          { level: 7, color: [0, 0, 255, 60] },
          { level: 6, color: [75, 0, 130, 50] },
          { level: 5, color: [123, 104, 238, 40] },
          { level: 4, color: [173, 216, 230, 30] },
          { level: 3, color: [240, 248, 255, 20] },
          { level: 2, color: [200, 200, 255, 15] },
          { level: 1, color: [220, 220, 255, 10] }
        ],
        sizeConfig: {
          baseFactor: 30,
          magnitudeFactor: 1.2,
          intensityFactor: 0.8
        },

      },
      axisCalculationParams: {
        Ra: {
          offset: 4.0293,
          magnitudeFactor: 1.3003,
          decayFactor: 3.6404,
          minValue: 10,
          unitConversion: 27
        },
        Rb: {
          offset: 2.3816,
          magnitudeFactor: 1.3003,
          decayFactor: 2.8573,
          minValue: 5,
          unitConversion: 27
        }
      }

    }
  },

  mounted() {
    this.initViewer();
    this.initNavigation();    //初始化指南针和比例
    this.loadDisasterData();  // 加载灾害点数据
    this.loadFaultZoneData(); // 加载断裂带数据
    this.loadDangerPoints();  // 加载隐患点数据
    this.loadRiskAreas();
  },
  beforeDestroy() {
    this.cleanup();
  },
  methods: {
    // initNavigation() {
    //   if (!this.viewer) return;
    //
    //   new CesiumNavigation(this.viewer, {
    //     defaultResetView: Cesium.Cartesian3.fromDegrees(108.95, 34.26, 2000000), // 默认重置视角
    //     enableCompass: true,              // 显示指南针
    //     enableZoomControls: true,         // 缩放按钮
    //     enableDistanceLegend: true,       // 比例尺
    //     enableCompassOuterRing: true      // 指南针可旋转
    //   });
    // },
    initNavigation() {
      const options = {
        enableCompass: true,
        enableDistanceLegend: true,
        enableZoomControls: false,
        enableCompassOuterRing: false,
        enableResetButton: false
      };
      new CesiumNavigation(this.viewer, options);
    },

    setupEntityClickHandler() {
      const handler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);
      handler.setInputAction((movement) => {
        const pickedObject = this.viewer.scene.pick(movement.position);
        if (Cesium.defined(pickedObject) && pickedObject.id && pickedObject.id.description) {
          this.viewer.selectedEntity = pickedObject.id;
        }
      }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
    },

    loadDisasterData() {
      console.log('开始加载灾害点数据...');
      try {
        const huapoFeatures = this.HuapoData?.features || [];
        const nishiliuFeatures = this.NishiliuData?.features || [];

        // 清空灾害实体
        this.disasterEntities.forEach(e => this.viewer.entities.remove(e));
        this.disasterEntities = [];

        const loadPoints = (features, color, labelText) => {
          features.forEach(point => {
            const props = point.properties || {};
            const name = props.disasterName || '未知灾害点';
            const lon = parseFloat(point.geometry.coordinates[0]);
            const lat = parseFloat(point.geometry.coordinates[1]);

            const entity = this.viewer.entities.add({
              position: Cesium.Cartesian3.fromDegrees(lon, lat, 5),
              point: {
                color,
                outlineColor: Cesium.Color.BLACK,
                outlineWidth: 1,
                pixelSize: 12
              },
              label: {
                text: name,
                font: '14pt Source Han Sans CN',
                fillColor: Cesium.Color.WHITE,
                backgroundColor: color.withAlpha(0.7),
                showBackground: true,
                outline: true,
                outlineColor: Cesium.Color.BLACK,
                outlineWidth: 1,
                scale: 0.8,
                verticalOrigin: Cesium.VerticalOrigin.CENTER,
                horizontalOrigin: Cesium.HorizontalOrigin.LEFT,
                pixelOffset: new Cesium.Cartesian2(20, -20),
                distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 30000),
                show: this.showDisasterLayer
              },
              description: this.createDisasterDescription(props, labelText)
            });

            this.disasterEntities.push(entity);
          });
        };

        loadPoints(huapoFeatures, Cesium.Color.RED, '滑坡');
        loadPoints(nishiliuFeatures, Cesium.Color.YELLOW, '泥石流');

        this.setupEntityClickHandler && this.setupEntityClickHandler(); // 若存在

      } catch (err) {
        console.error('加载灾害数据出错:', err);
      }
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

    loadFaultZoneData() {
      try {
        // 清除之前的断裂带
        this.faultLineEntities.forEach(e => this.viewer.entities.remove(e));
        this.faultLineEntities = [];

        const faultFeatures = this.FaultZoneData?.features || [];

        faultFeatures.forEach((lineFeature, idx) => {
          const coords = lineFeature.geometry?.coordinates || [];
          if (!Array.isArray(coords) || coords.length < 2) return;

          const linePositions = coords.flatMap(coord => [coord[0], coord[1]]);

          const entity = this.viewer.entities.add({
            name: lineFeature.properties?.FN_En || `断裂带 ${idx + 1}`,
            polyline: {
              positions: Cesium.Cartesian3.fromDegreesArray(linePositions),
              width: 2,
              material: Cesium.Color.RED.withAlpha(0.8),
              clampToGround: true,
              distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0.0, 10000000.0),
              zIndex: 10,
              show: this.showFaultLines
            },
            description: `
          <div>
            <strong>名称:</strong> ${lineFeature.properties?.FN_En || '未知'}<br>
            <strong>类型:</strong> ${lineFeature.properties?.Fea_En || '未知'}<br>
            <strong>年代:</strong> ${lineFeature.properties?.AGE || '未知'}
          </div>
        `
          });

          this.faultLineEntities.push(entity);
        });

      } catch (err) {
        console.error('加载断裂带数据出错:', err);
      }
    },

    // 百度坐标 -> GCJ02
    bd09ToGcj02(bdLon, bdLat) {
      const x = bdLon - 0.0065;
      const y = bdLat - 0.006;
      const z = Math.sqrt(x * x + y * y) - 0.00002 * Math.sin(y * Math.PI);
      const theta = Math.atan2(y, x) - 0.000003 * Math.cos(x * Math.PI);
      const gcjLon = z * Math.cos(theta);
      const gcjLat = z * Math.sin(theta);
      return [gcjLon, gcjLat];
    },

    // GCJ02 -> WGS84
    gcj02ToWgs84(lon, lat) {
      const a = 6378245.0;
      const ee = 0.00669342162296594323;

      const transformLat = (x, y) => {
        let ret = -100.0 + 2.0 * x + 3.0 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x));
        ret += (20.0 * Math.sin(6.0 * x * Math.PI) + 20.0 * Math.sin(2.0 * x * Math.PI)) * 2.0 / 3.0;
        ret += (20.0 * Math.sin(y * Math.PI) + 40.0 * Math.sin(y / 3.0 * Math.PI)) * 2.0 / 3.0;
        ret += (160.0 * Math.sin(y / 12.0 * Math.PI) + 320 * Math.sin(y * Math.PI / 30.0)) * 2.0 / 3.0;
        return ret;
      };

      const transformLon = (x, y) => {
        let ret = 300.0 + x + 2.0 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x));
        ret += (20.0 * Math.sin(6.0 * x * Math.PI) + 20.0 * Math.sin(2.0 * x * Math.PI)) * 2.0 / 3.0;
        ret += (20.0 * Math.sin(x * Math.PI) + 40.0 * Math.sin(x / 3.0 * Math.PI)) * 2.0 / 3.0;
        ret += (150.0 * Math.sin(x / 12.0 * Math.PI) + 300.0 * Math.sin(x / 30.0 * Math.PI)) * 2.0 / 3.0;
        return ret;
      };

      const outOfChina = (lon, lat) => {
        return (lon < 72.004 || lon > 137.8347 || lat < 0.8293 || lat > 55.8271);
      };

      if (outOfChina(lon, lat)) return [lon, lat];

      let dLat = transformLat(lon - 105.0, lat - 35.0);
      let dLon = transformLon(lon - 105.0, lat - 35.0);
      const radLat = lat / 180.0 * Math.PI;
      let magic = Math.sin(radLat);
      magic = 1 - ee * magic * magic;
      const sqrtMagic = Math.sqrt(magic);
      dLat = (dLat * 180.0) / ((a * (1 - ee)) / (magic * sqrtMagic) * Math.PI);
      dLon = (dLon * 180.0) / (a / sqrtMagic * Math.cos(radLat) * Math.PI);
      const mgLat = lat + dLat;
      const mgLon = lon + dLon;
      return [lon * 2 - mgLon, lat * 2 - mgLat];
    },

    loadDangerPoints() {
      const dangerPoints = [
        {
          name: '中国石化加油站(太元路站)',
          bdLon: 108.99492305391442,
          bdLat: 34.30690256163939
        },
        {
          name: '延长壳牌加油站(西安先锋路站)',
          bdLon: 108.98221043775547,
          bdLat: 34.32570169842432
        },
        {
          name: '中国国际能源加油站(北辰路站)',
          bdLon: 109.0031126220631,
          bdLat: 34.341064693544226
        },
        {
          name: '延长壳牌西安北辰大道加油站',
          bdLon: 109.00167015610634,
          bdLat: 34.37288092372244
        },
        {
          name: '中国石油加油站(西安文景路站)',
          bdLon: 108.94179327706834,
          bdLat: 34.38828646526901
        },
        {
          name: '中国石油加油站(西安新筑大桥站)',
          bdLon: 109.04131103269133,
          bdLat: 34.40199099660507
        },
        {
          name: '延长壳牌加油站(北辰大道南段东站)',
          bdLon: 109.00301207898535,
          bdLat: 34.32648530954471
        },
        {
          name: '延长壳牌加油站(明光路站)',
          bdLon: 108.93563098951226,
          bdLat: 34.33498090209193
        },
      ];

      // 清除旧实体
      if (this.dangerPointEntities && this.dangerPointEntities.length) {
        this.dangerPointEntities.forEach(e => this.viewer.entities.remove(e));
      }
      this.dangerPointEntities = [];

      dangerPoints.forEach(pt => {
        const [gcjLon, gcjLat] = this.bd09ToGcj02(pt.bdLon, pt.bdLat);
        const [wgsLon, wgsLat] = this.gcj02ToWgs84(gcjLon, gcjLat);

        const entity = this.viewer.entities.add({
          position: Cesium.Cartesian3.fromDegrees(wgsLon, wgsLat, 0),

          //图标（始终显示 + 固定大小）
          billboard: {
            image: new URL('@/assets/images/gasstation.png', import.meta.url).href,
            scale: 0.2, // 控制图标大小
            verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
            disableDepthTestDistance: Number.POSITIVE_INFINITY, // 不被地形遮挡
            scaleByDistance: undefined, // 不随距离缩放
            distanceDisplayCondition: undefined, // 始终显示
            show: this.showDangerPoints
          },

          //标签（图标下方 + 缩小时隐藏，拉近才显示）
          label: {
            text: pt.name,
            font: '14pt Source Han Sans CN',
            fillColor: Cesium.Color.WHITE,
            backgroundColor: Cesium.Color.RED.withAlpha(0.7),
            showBackground: true,
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            outlineColor: Cesium.Color.BLACK,
            outlineWidth: 1,
            verticalOrigin: Cesium.VerticalOrigin.TOP, // 在图标下方
            pixelOffset: new Cesium.Cartesian2(0, 20),  // 往下偏移
            scaleByDistance: new Cesium.NearFarScalar(500, 1.2, 30000, 0), //缩小时隐藏
            show: this.showDangerPoints
          },

          // 弹窗信息
          description: `<strong>${pt.name}</strong><br/>类型：隐患点（加油站）<br/>坐标：${wgsLon.toFixed(6)}, ${wgsLat.toFixed(6)}`
        });

        this.dangerPointEntities.push(entity);
      });
    },

    loadRiskAreas() {
      console.log('开始加载危险源...');
      try {
        const features = RiskAreaData?.features || [];

        // 清除旧实体
        this.riskEntities.forEach(e => this.viewer.entities.remove(e));
        this.riskEntities = [];

        features.forEach((feature, idx) => {
          const coords = feature.geometry?.coordinates || [];
          const props = feature.properties || {};
          const name = props.position || `危险源${idx + 1}`;
          const grade = props.grade || '未知';
          const area = props.area_Km2 || '未知';

          const entity = this.viewer.entities.add({
            position: Cesium.Cartesian3.fromDegrees(coords[0], coords[1], 5),

            // 圆点样式（橙色）
            point: {
              color: Cesium.Color.ORANGE,
              outlineColor: Cesium.Color.BLACK,
              outlineWidth: 1,
              pixelSize: 12
            },

            // 标签样式
            label: {
              text: name,
              font: '14pt Source Han Sans CN',
              fillColor: Cesium.Color.WHITE,
              backgroundColor: Cesium.Color.ORANGE.withAlpha(0.7),
              showBackground: true,
              outline: true,
              outlineColor: Cesium.Color.BLACK,
              outlineWidth: 1,
              scale: 0.8,
              verticalOrigin: Cesium.VerticalOrigin.CENTER,
              horizontalOrigin: Cesium.HorizontalOrigin.LEFT,
              pixelOffset: new Cesium.Cartesian2(20, -20),
              distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 30000),
              show: this.showRiskArea
            },

            // 鼠标点击弹窗
            description: `
          <div style="font-family: Arial, sans-serif; padding: 10px;">
            <h3 style="color: orange; margin-top: 0;">${name}</h3>
            <p><strong>灾害类型:</strong> 危险源</p>
            <p><strong>危险等级:</strong> ${grade}</p>
            <p><strong>影响面积:</strong> ${area} km²</p>
            <p><strong>坐标:</strong> ${coords[0].toFixed(6)}, ${coords[1].toFixed(6)}</p>
          </div>
        `
          });

          this.riskEntities.push(entity);
        });
      } catch (err) {
        console.error('加载危险源数据出错:', err);
      }
    },

    initViewer() {
      Cesium.Ion.defaultAccessToken = '';
      try {
        const container = this.$refs.cesiumContainer;
        if (!container) {
          console.error("容器元素未找到");
          return;
        }

        // 初始化Viewer，使用影像底图
        // this.viewer = new Cesium.Viewer(container, {
        //   imageryProvider: new Cesium.UrlTemplateImageryProvider({
        //     url: 'http://t0.tianditu.gov.cn/img_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=img&TILEMATRIXSET=w&FORMAT=tiles&TILECOL={x}&TILEROW={y}&TILEMATRIX={z}&tk='+this.tdtToken,
        //     subdomains: ['t0', 't1', 't2', 't3', 't4', 't5', 't6', 't7'],
        //     minimumLevel: 1,
        //     maximumLevel: 18,
        //     credit: "天地图",
        //     layer: "img",
        //   }),
        //   baseLayerPicker: false,
        //   animation: false,
        //   timeline: false,
        //   shouldAnimate: true
        // });

        // 加载影像注记层
        // this.loadAnnotationLayer();

        this.viewer = initCesium(container)

        // 设置初始视角
        this.viewer.camera.flyTo({
          destination: Cesium.Cartesian3.fromDegrees(108.93, 34.27, 2000000),
          orientation: {
            heading: Cesium.Math.toRadians(0),
            pitch: Cesium.Math.toRadians(-90),
            roll: 0.0
          }
        });

        // 加载初始数据
        this.loadInitialData();

        console.log("Cesium初始化成功");
      } catch (error) {
        console.error("初始化失败:", error);
      }
    },

    loadAnnotationLayer() {
      // 影像注记层配置（cia_w图层）
      const annotationProvider = new Cesium.UrlTemplateImageryProvider({
        url: 'http://t0.tianditu.gov.cn/cia_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=cia&TILEMATRIXSET=w&FORMAT=tiles&TILECOL={x}&TILEROW={y}&TILEMATRIX={z}&tk='+this.tdtToken,
        subdomains: ['t0', 't1', 't2', 't3', 't4', 't5', 't6', 't7'],
        minimumLevel: 1,
        maximumLevel: 18,
        credit: "天地图注记",
        layer: "cia",
      });

      // 添加注记层
      this.viewer.imageryLayers.addImageryProvider(annotationProvider);
    },

    loadInitialData() {
      this.loadDangerPoints();
    },

    toggleEarthquakeMode() {
      this.earthquakeMode = !this.earthquakeMode;

      if (this.earthquakeMode) {
        // 进入地震模式
        this.setupClickHandler();
        document.body.style.cursor = 'crosshair';
        console.log("地震模式已激活");
      } else {
        // 退出地震模式
        this.removeClickHandler();
        document.body.style.cursor = '';
        this.showInfoPanel = false;
        console.log("地震模式已取消");
      }
    },

    setupClickHandler() {
      if (this.handler) {
        this.handler.destroy();
      }

      this.handler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);
      this.handler.setInputAction((movement) => {
        const position = this.getClickedPosition(movement.position);
        if (position) {
          this.selectedPosition = position;
          this.showInfoPanel = true;
          console.log("位置已选择:", position);
        }
      }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
    },

    getClickedPosition(screenPosition) {
      const ray = this.viewer.camera.getPickRay(screenPosition);
      if (!ray) return null;

      const cartesian = this.viewer.scene.globe.pick(ray, this.viewer.scene);
      if (!cartesian) return null;
      const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
      return {
        longitude: Cesium.Math.toDegrees(cartographic.longitude),
        latitude: Cesium.Math.toDegrees(cartographic.latitude),
        cartesian: cartesian
      };
    },

    removeClickHandler() {
      if (this.handler) {
        this.handler.destroy();
        this.handler = null;
      }
    },

    confirmEarthquake() {
      if (!this.selectedPosition) return;
      // 清除现有烈度圈
      this.clearIntensityCircles();
      // 创建地震点
      const entity = this.createEarthquakeEntity();
      this.earthquakeEntities.push(entity);
      // 绘制烈度圈
      this.drawIntensityCircles();
      // 重置状态
      this.showInfoPanel = false;
      this.earthquakeMode = false;
      this.removeClickHandler();
      document.body.style.cursor = '';
      // 飞行到震中
      this.flyToEarthquake(entity);
    },

    createEarthquakeEntity() {
      const { longitude, latitude, cartesian } = this.selectedPosition;

      return this.viewer.entities.add({
        position: cartesian,
        point: {
          pixelSize: this.magnitude * 3,
          color: Cesium.Color.RED,
          outlineColor: Cesium.Color.WHITE,
          outlineWidth: 2
        },
        label: {
          text: `震级: ${this.magnitude}\n深度: ${this.depth}km`,
          font: '14px sans-serif',
          fillColor: Cesium.Color.WHITE,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          outlineWidth: 2,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          pixelOffset: new Cesium.Cartesian2(0, -10)
        }
      });
    },

    // 更新烈度等级计算方法 - 包含6级及以上
    getIntensityLevels(M) {
      // 震级<6时不生成烈度圈
      if (M < 6.0) {
        return [];
      }
      // 查找对应的烈度范围
      const range = this.intensityConfig.magnitudeRanges.find(
          r => M >= r.min && M <= r.max
      );
      // 如果找不到匹配的范围，使用默认处理
      return range ? range.intensities : [7, 6, 5];
    },

    // 获取所有烈度圈的长短轴（明确最大圈为第三个）
    getAllEllipseAxes(M) {
      const intensityLevels = this.getIntensityLevels(M);
      const sizeMultiplier = 150;
      const baseMajorAxis = this.calculateRa(M, intensityLevels[0]) * sizeMultiplier;
      const baseMinorAxis = this.calculateRb(M, intensityLevels[0]) * sizeMultiplier;

      // 明确三个圈的比例（第一个圈最小，第三个圈最大）
      const scaleFactors = [1.0, 1.8, 3.0]; // 增大第三个圈的比例，确保范围足够大
      return scaleFactors.map(factor => ({
        major: baseMajorAxis * factor,
        minor: baseMinorAxis * factor
      }));
    },

    // 绘制烈度圈方法（调用统一参数）
    drawIntensityCircles() {
      const { longitude, latitude, cartesian: center } = this.selectedPosition;
      const M = this.magnitude;
      const depth = this.depth;

      // 清除现有烈度圈
      this.clearIntensityCircles();

      // 震级<6时不生成烈度圈
      if (M < 6.0) {
        return;
      }

      // 获取所有烈度圈长短轴
      const ellipses = this.getAllEllipseAxes(M);

      ellipses.forEach((ellipse, index) => {
        const entity = this.viewer.entities.add({
          position: center,
          ellipse: {
            semiMajorAxis: ellipse.major,
            semiMinorAxis: ellipse.minor,
            rotation: Cesium.Math.toRadians(0),
            material: this.getColorByIntensity(12 - index), // 颜色映射可自定义
            outline: true,
            outlineColor: Cesium.Color.BLACK,
            outlineWidth: 1
          }
        });
        this.intensityCircles.push(entity);
      });

      setTimeout(() => {
        this.addHaloEffect();
      }, 500);  // 延迟 300ms 更安全

    },

    calculateRa(M, Ia) {
      const { offset, magnitudeFactor, decayFactor, minValue, unitConversion } = this.axisCalculationParams.Ra;
      const value = Math.pow(10, (offset + magnitudeFactor * M - Ia) / decayFactor) - minValue;
      const result = value <= 0 ? 100 : value * unitConversion;
      console.log(`calculateRa: M=${M}, Ia=${Ia}, result=${result}`);
      return result;
    },

    calculateRb(M, Ib) {
      const { offset, magnitudeFactor, decayFactor, minValue, unitConversion } = this.axisCalculationParams.Rb;
      const value = Math.pow(10, (offset + magnitudeFactor * M - Ib) / decayFactor) - minValue;
      const result = value <= 0 ? 60 : value * unitConversion;
      console.log(`calculateRb: M=${M}, Ib=${Ib}, result=${result}`);
      return result;
    },

    getColorByIntensity(level) {
      const entry = this.intensityConfig.colorMap.find(item => item.level === level);
      if (entry) {
        const [r, g, b, a] = entry.color;
        return Cesium.Color.fromBytes(r, g, b, a);
      }
      // 默认为红色，便于调试
      return Cesium.Color.RED.withAlpha(0.5);
    },

    clearIntensityCircles() {
      this.intensityCircles.forEach(circle => {
        this.viewer.entities.remove(circle);
      });
      this.intensityCircles = [];

      // 清除光晕效果
      this.clearHaloEffect();
    },

    flyToEarthquake(entity) {
      this.viewer.flyTo(entity, {
        duration: 1.5,
        offset: new Cesium.HeadingPitchRange(0, Cesium.Math.toRadians(-30), 5000)
      });
    },

    toggleFaultLines() {
      this.faultLineEntities.forEach(entity => {
        entity.show = this.showFaultLines;
      });

      // 若首次加载（加载）
      if (this.faultLineEntities.length === 0 && this.showFaultLines) {
        this.loadFaultLines();
      }
    },

    toggleDangerPoints() {
      if (this.dangerPointEntities && this.dangerPointEntities.length > 0) {
        this.dangerPointEntities.forEach(entity => {
          entity.show = this.showDangerPoints;
        });
      } else if (this.showDangerPoints) {
        // 初次加载
        this.loadDangerPoints();
      }
    },

    toggleDisasterPoints() {
      this.disasterEntities.forEach(entity => {
        entity.show = this.showDisasterLayer;
      });
    },

    toggleRiskVisibility() {
      this.riskEntities.forEach(e => {
        e.show = this.showRiskArea;
      });
    },

    cancelEarthquake() {
      this.showInfoPanel = false;
      this.earthquakeMode = false;
      this.removeClickHandler();
      document.body.style.cursor = '';
    },

    // 清除地震
    clearEarthquake() {
      // 清除地震实体
      this.earthquakeEntities.forEach(entity => {
        this.viewer.entities.remove(entity);
      });
      this.earthquakeEntities = [];

      // 清除烈度圈和光晕效果
      this.clearIntensityCircles();

      console.log("地震已清除");
    },

    cleanup() {
      this.removeClickHandler();
      this.clearHaloEffect(); // 清除光晕效果
      if (this.viewer) {
        this.viewer.destroy();
      }
    },

    addHaloEffect() {
      if (this.isHaloActive) {
        this.clearHaloEffect();
      }

      const { longitude, latitude } = this.selectedPosition;
      const ellipses = this.getAllEllipseAxes(this.magnitude);
      if (!ellipses.length) return;

      // 取最大圈
      const outermost = ellipses[ellipses.length - 1];

      const viewer = this.viewer;
      const time = Cesium.JulianDate.now();

      const allEntities = [
        ...this.disasterEntities.map(e => ({ entity: e, color: Cesium.Color.RED })),
        ...this.riskEntities.map(e => ({ entity: e, color: Cesium.Color.ORANGE })),
        ...this.dangerPointEntities.map(e => ({ entity: e, color: Cesium.Color.YELLOW }))
      ];

      allEntities.forEach(({ entity, color }) => {
        let position;

        try {
          if (entity.position && typeof entity.position.getValue === 'function') {
            position = entity.position.getValue(time);
          } else if (entity.position) {
            position = entity.position;
          }
        } catch (e) {
          console.warn('实体坐标异常，跳过', e);
          return;
        }

        if (!position || !Cesium.defined(position)) {
          console.warn('实体位置无效，跳过');
          return;
        }

        const cartographic = Cesium.Cartographic.fromCartesian(position);
        const entityLon = Cesium.Math.toDegrees(cartographic.longitude);
        const entityLat = Cesium.Math.toDegrees(cartographic.latitude);


        console.log(outermost,1212)
        // ✅ 判断是否在最大烈度圈范围内
        const inEllipse = this.isPointInEllipse(
            entityLon, entityLat,
            longitude, latitude,
            outermost.major, outermost.minor
        );
        console.log(inEllipse)
        if (inEllipse) {
          this.addHaloToEntity(entity, color);
        } else {
          console.log(`❌ 点(${entityLon.toFixed(4)}, ${entityLat.toFixed(4)}) 未进入最大圈`);
        }
      });

      this.isHaloActive = true;
    },

    // 判断点是否在椭圆范围内（地理坐标转米，考虑地球曲率）
    isPointInEllipse(pointLon, pointLat, centerLon, centerLat, majorAxis, minorAxis) {
      // 1. 计算中心点和目标点的经纬度差
      const R = 6371000; // 地球半径（米）
      const dLat = (pointLat - centerLat) * Math.PI / 180;
      const avgLat = (pointLat + centerLat) / 2 * Math.PI / 180;

      const dLon = (pointLon - centerLon) * Math.PI / 180;
      // 2. 近似投影到平面（横向距离和纵向距离，单位米）
      const dx = dLon * R * Math.cos(avgLat);
      const dy = dLat * R;

      // 3. 椭圆方程 (x/a)^2 + (y/b)^2 <= 1
      const normX = dx / (majorAxis);
      const normY = dy / (minorAxis);
      const result = (normX * normX + normY * normY) <= 1;

      // 添加调试信息
      if (Math.abs(dx) < majorAxis && Math.abs(dy) < minorAxis) {
        console.log(`点(${pointLon.toFixed(4)}, ${pointLat.toFixed(4)}) 在椭圆范围内: ${result}, 距离: ${Math.sqrt(dx*dx + dy*dy).toFixed(0)}m, 椭圆大小: ${majorAxis.toFixed(0)}x${minorAxis.toFixed(0)}m`);
      }
      // 添加调试信息（明确打印圈的大小和点是否在圈内）
      console.log(`[光晕调试] 中心坐标: (${centerLon.toFixed(4)}, ${centerLat.toFixed(4)})`);
      console.log(`[光晕调试] 椭圆大小: 长轴 ${majorAxis.toFixed(0)}m, 短轴 ${minorAxis.toFixed(0)}m`);
      console.log(`[光晕调试] 检查点: (${pointLon.toFixed(4)}, ${pointLat.toFixed(4)})`);

      return result;
    },

    // 为单个实体添加光晕
    addHaloToEntity(entity, haloColor) {
      const position = entity.position.getValue(Cesium.JulianDate.now());
      if (!position) return;

      // 创建光晕实体
      const haloEntity = this.viewer.entities.add({
        position: position,
        point: {
          pixelSize: 40, // 增大光晕大小，使其更明显
          color: haloColor.withAlpha(0.4), // 提高透明度，使其更明显
          outlineColor: haloColor.withAlpha(1.0), // 完全不透明的边框
          outlineWidth: 3, // 适中的边框宽度
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
          disableDepthTestDistance: Number.POSITIVE_INFINITY // 确保不被地形遮挡
        }
      });

      // 添加脉冲动画效果
      this.addPulseAnimation(haloEntity, haloColor);

      this.haloEntities.push(haloEntity);
      console.log('光晕实体已添加:', haloEntity);
    },

    // 添加脉冲动画效果
    addPulseAnimation(haloEntity, baseColor) {
      let pulsePhase = 0;

      // 使用定时器创建脉冲效果
      const pulseInterval = setInterval(() => {
        pulsePhase += 0.2; // 稍微加快动画速度
        const alpha = 0.2 + 0.5 * Math.sin(pulsePhase); // 提高透明度范围
        const size = 35 + 20 * Math.sin(pulsePhase); // 增大尺寸变化范围

        haloEntity.point.color = baseColor.withAlpha(alpha);
        haloEntity.point.pixelSize = size;

        // 如果光晕被清除，停止动画
        if (!this.isHaloActive) {
          clearInterval(pulseInterval);
        }
      }, 100); // 适中的更新频率

      // 存储定时器引用以便清理
      haloEntity.pulseInterval = pulseInterval;
    },

    // 清除光晕效果
    clearHaloEffect() {
      this.haloEntities.forEach(entity => {
        // 清理定时器
        if (entity.pulseInterval) {
          clearInterval(entity.pulseInterval);
        }
        this.viewer.entities.remove(entity);
      });
      this.haloEntities = [];
      this.isHaloActive = false;
    },
  },
}
</script>

<style scoped>
.cesium-container {
  position: relative;
  top: 0;
  left: 0;
  width: 100%;
  height: calc(100vh - 50px);
  margin: 0;
  padding: 0;
  /* overflow: hidden; */
}

.earthquake-btn {
  position: absolute;
  top: 20px;
  left: 20px;
  padding: 10px 15px;
  background-color: #d62828;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  z-index: 1000;
  font-size: 14px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.3);
}

.earthquake-btn:hover {
  background-color: #ba1f1f;
}

.clear-earthquake-btn {
  position: absolute;
  top: 20px;
  left: 150px;
  padding: 10px 15px;
  background-color: #6c757d;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  z-index: 1000;
  font-size: 14px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.3);
}

.clear-earthquake-btn:hover {
  background-color: #5a6268;
}

.secondary-panel {
  position: absolute;
  top: 70px;
  left: 20px;
  background-color: rgba(40, 40, 40, 0.8);
  color: white;
  padding: 15px;
  border-radius: 4px;
  z-index: 1000;
  width: 200px;
}

.panel-title {
  font-weight: bold;
  margin-bottom: 10px;
  font-size: 16px;
}

.panel-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.panel-content label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.earthquake-info-panel {
  position: absolute;
  top: 200px;
  left: 20px;
  background-color: rgba(40, 40, 40, 0.9);
  color: white;
  padding: 15px;
  border-radius: 4px;
  z-index: 1000;
  width: 250px;
}

.earthquake-info-panel input {
  width: 60px;
  margin-left: 10px;
  padding: 5px;
  background-color: rgba(255,255,255,0.1);
  border: 1px solid #666;
  color: white;
}

.earthquake-info-panel button {
  margin-top: 10px;
  margin-right: 10px;
  padding: 8px 15px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.earthquake-info-panel button:first-child {
  background-color: #386641;
  color: white;
}

.earthquake-info-panel button:last-child {
  background-color: #bc4749;
  color: white;
}

.legend-title {
  font-weight: bold;
  margin-bottom: 10px;
}

.legend {
  position: absolute;
  bottom: 30px;
  right: 20px;
  background-color: rgba(40, 40, 40, 0.8);
  color: white;
  padding: 15px;
  border-radius: 4px;
  z-index: 1000;
  max-width: 200px; /* 限制图例宽度 */
}

.legend-item {
  display: flex;
  align-items: center;
  margin: 4px 0; /* 减小行间距 */
  font-size: 12px; /* 缩小字体 */
}

.legend-color {
  width: 18px;
  height: 18px;
  margin-right: 8px; /* 调整颜色块与文字间距 */
  border: 1px solid rgba(255, 255, 255, 0.3); /* 浅色边框 */
}

.legend-color.circle {
  border-radius: 50%; /* 让色块变圆 */
}

.legend-line {
  width: 24px;
  height: 3px;
  margin-right: 8px;
  background-color: red;
  border-radius: 2px;
}

.legend-icon {
  width: 18px;
  height: 18px;
  margin-right: 8px;
  vertical-align: middle;
}


.halo-status {
  position: absolute;
  top: 60px;
  left: 20px;
  padding: 8px 12px;
  background-color: rgba(40, 40, 40, 0.8);
  color: #00ff00;
  border-radius: 4px;
  z-index: 1000;
  font-size: 12px;
  border: 1px solid #00ff00;
}

</style>
