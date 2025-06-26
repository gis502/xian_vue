<template>
  <div class="cesium-container" ref="cesiumContainer">
    <div class="rain-btn" @click="toggleRainMode">
      {{ rainMode ? '取消暴雨标记' : '暴雨模拟' }}
    </div>
    <div v-if="rainEntities.length > 0" class="weather-btn" @click="toggleWeatherEffect">
      {{ weatherActive ? '关闭下雨效果' : '开启下雨效果' }}
    </div>
    <div v-if="rainEntities.length > 0" class="clear-btn" @click="clearRainSimulations">
      清除暴雨模拟
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
    <div class="compass-widget">
      <div
          class="compass-arrow"
          :style="{ transform: `rotate(${-compassHeading}deg)` }"
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
      <div class="legend-title">行政区划图例</div>
      <div class="legend-content" ref="legendContent">
        <!-- 使用v-for动态生成图例项 -->
        <div class="legend-item" v-for="(region, index) in adminRegions" :key="index">
          <div class="legend-color"
               :style="{ backgroundColor: colorToRgba(region.color) }">
          </div>
          <div class="legend-name">{{ region.name }}</div>
        </div>
      </div>
    </div>

    <!-- 新增：图层控制按钮 -->
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

export default {
  name: 'CesiumMap',
  data() {
    return {
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
      rainEffect: null,
      gasStationEntities: [], // 存储加油站实体
      handler: null, // 屏幕事件处理器
      rainParticleSystem: null, // 新增粒子雨效系统
      scaleDistance: '1km', // 比例尺距离
      scaleUpdateInterval: null, // 比例尺更新定时器
      compassHeading: 0, // 指南针角度
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
      showAdminLayer: true // 新增：控制行政区划图层显示
    }
  },
  computed: {
  },
  async mounted() {
    try {
      this.load();

      // 确保viewer完全初始化后再设置粒子系统
      await new Promise(resolve => setTimeout(resolve, 500));

      this.initRainEffect();
      this.initScaleBar(); // 初始化比例尺
      this.loadAdminData(); // 加载行政区划数据
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
    } catch (error) {
      console.error("初始化失败:", error);
    }
  },
  beforeDestroy() {
    if (this.viewer) {
      // 移除事件监听
      if (this.viewer.camera && this.updateScaleBar) {
        this.viewer.camera.changed.removeEventListener(this.updateScaleBar);
      }
      this.viewer.destroy();
      this.viewer = null;
    }
    // 移除键盘事件
    document.removeEventListener('keydown', this.onKeyDown);
    if (this.handler) {
      this.handler.destroy();
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
          destination: Cesium.Cartesian3.fromDegrees(108.93, 34.27, 2000000),
          orientation: {
            heading: Cesium.Math.toRadians(0),
            pitch: Cesium.Math.toRadians(-90),
            roll: 0.0
          }
        });
        this.initRainEffect();
        this.initScaleBar(); // 初始化比例尺
        document.addEventListener('keydown', this.onKeyDown);
      } catch (error) {
        console.error("Cesium初始化错误:", error);
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
          this.configureAdminStyles(dataSource,i);
          // 添加到地图
          this.viewer.dataSources.add(dataSource);
        }).catch(error => {
          console.error(`加载行政区划数据失败 (${this.administrationData[i].name || "未知区域"}):`, error);
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
        console.log( name,"==================================================")
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
      if (cartesian) {
        const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
        const longitude = Cesium.Math.toDegrees(cartographic.longitude);
        const latitude = Cesium.Math.toDegrees(cartographic.latitude);
        this.selectedPosition = { longitude, latitude, cartesian };
        this.showInfoPanel = true;
      }
    },
    confirmRain() {
      if (!this.selectedPosition) return;
      const { longitude, latitude, cartesian } = this.selectedPosition;
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
      // 添加降雨粒子系统
      this.addRainParticleSystem(cartesian, this.rainRadius, this.rainIntensity);
      this.showInfoPanel = false;
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
          if (this.viewer.scene.primitives.contains(ps)) {
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
      this.viewer.scene.postProcessStages.add(this.rainEffect);
      this.rainEffect.enabled = false;
    },
    toggleWeatherEffect() {
      this.weatherActive = !this.weatherActive;
      // 控制所有降雨粒子系统的显示/隐藏
      if (this.rainParticleSystems && this.rainParticleSystems.length > 0) {
        this.rainParticleSystems.forEach(ps => {
          ps.show = this.weatherActive;
        });
      }
      // 控制后处理效果
      if (this.rainEffect) {
        this.rainEffect.enabled = this.weatherActive;
      }
    },
    clearRainSimulations() {
      // 删除所有降雨点
      if (this.rainEntities && this.rainEntities.length > 0) {
        this.rainEntities.forEach(entity => {
          this.viewer.entities.remove(entity);
        });
        this.rainEntities = [];
      }
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
          if (this.viewer.scene.primitives.contains(ps)) {
            this.viewer.scene.primitives.remove(ps);
          }
        });
        this.rainParticleSystems = [];
      }
    },
    initCompassListener() {
      if (!this.viewer) return;
      this.viewer.camera.changed.addEventListener(() => {
        // heading为弧度，转为角度
        const heading = this.viewer.camera.heading;
        this.compassHeading = Cesium.Math.toDegrees(heading);
      });
    },
    // 新增：为每个降雨点添加独立粒子系统
    addRainParticleSystem(cartesian, radiusKm, intensity) {
      const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
      const lon = Cesium.Math.toDegrees(cartographic.longitude);
      const lat = Cesium.Math.toDegrees(cartographic.latitude);
      const rainPosition = Cesium.Cartesian3.fromDegrees(lon, lat, 3000);
      const modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(rainPosition);
      const boxSize = radiusKm * 1000 * 2;
      const emissionRate = Math.max(50, Math.min(1500, Math.round(intensity * 1.5)));
      const rainParticleSystem = new Cesium.ParticleSystem({
        image: this.createRaindropCanvas(),
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
        updateCallback: function(particle, dt) {
          particle.position.x += dt * (Math.random() - 0.5) * 8;
          particle.position.y += dt * (Math.random() - 0.5) * 8;
        },
        show: this.weatherActive
      });
      this.viewer.scene.primitives.add(rainParticleSystem);
      this.rainParticleSystems.push(rainParticleSystem);
      console.log(`降雨粒子系统已添加 - 位置: ${lon.toFixed(4)}, ${lat.toFixed(4)}, 强度: ${intensity}mm/h`);
      return rainParticleSystem;
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
    focusGasStation(cartesian) {
      if (!cartesian) return;
      const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
      const lon = Cesium.Math.toDegrees(cartographic.longitude);
      const lat = Cesium.Math.toDegrees(cartographic.latitude);
      const rainPosition = Cesium.Cartesian3.fromDegrees(lon, lat, 300);
      const modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(rainPosition);
      if (this.rainParticleSystem) {
        this.rainParticleSystem.modelMatrix = modelMatrix;
        this.rainParticleSystem.show = true;
        console.log("更新后的雨粒子系统 modelMatrix：", this.rainParticleSystem.modelMatrix);
      }
      // 飞行到雨点
      this.viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(lon, lat, 2000),
        orientation: {
          heading: Cesium.Math.toRadians(0),
          pitch: Cesium.Math.toRadians(-30),
          roll: 0.0
        },
        duration: 2.0
      });
    }
  }
}
</script>

<style scoped>
.cesium-container {
  width: 100%;
  height: 100%;
  padding: 0;
  margin: 0;
  position: relative;
}
.rain-btn {
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
  top: 50px;
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
  pointer-events: none;
}
.compass-arrow {
  width: 50px;
  height: 70px;
  transition: transform 0.2s linear;
  will-change: transform;
  pointer-events: auto;
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
  max-width: 220px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
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
}

.legend-item {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  padding: 2px 4px;
  transition: background-color 0.2s;
}

.legend-item:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.legend-color {
  width: 16px;
  height: 16px;
  margin-right: 8px;
  border-radius: 2px;
  box-shadow: 0 0 2px rgba(0, 0, 0, 0.5);
}

.legend-name {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
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
</style>
