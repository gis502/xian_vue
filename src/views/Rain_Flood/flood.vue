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
      rainEffect: null,
      canMarkAgain: true,
      adminDataSource: null,
      riverDataSource: null,
      lakeDataSource: null, // 湖面数据数据源
      dataSource: null,
      // 行政区划数据
      administrationData: [BaQiaoArea, BeiLin, ChangAn, GaoLing, HuYi, LanTIan, LianHu, LinTong, WeiYang, XinCheng, YanLiang, YanTa, ZhouZhi],
      adminDataSources:[],
      // 河流数据
      riverData: riverData,
      lakeData: lakeData,
      isLoading: false,
      loadingText: '加载数据中...'
    }
  },
  computed: {},
  mounted() {
    this.load();
    this.loadAdminData(); // 加载行政区划数据
    this.loadRiverData(); // 加载河流数据
    this.loadLakeData(); // 加载湖面数据
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
        destination: Cesium.Cartesian3.fromDegrees(108.93, 34.27, 1000000),
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
          this.configureAdminStyles(dataSource,i);
          // 添加到地图
          this.viewer.dataSources.add(dataSource);
        }).catch(error => {
          console.error(`加载行政区划数据失败 (${this.administrationData[i].name || "未知区域"}):`, error);
          // 继续检查是否所有数据源都已完成（包括失败的）
        });
      }
    },
    // 配置行政区划样式
    configureAdminStyles(dataSource,i) {
      if (!dataSource) return;

      const color = this.generateRandomColor(i);
      const entities = dataSource.entities.values;

      entities.forEach(entity => {
        const name = entity.properties.name._value || dataSource.name;
        console.log( name,"==================================================")


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
        new Cesium.Color(0.1, 0.5, 0.8, 0.5), // 蓝色
        new Cesium.Color(0.8, 0.1, 0.1, 0.5), // 红色
        new Cesium.Color(0.1, 0.8, 0.1, 0.5), // 绿色
        new Cesium.Color(0.8, 0.8, 0.1, 0.5), // 黄色
        new Cesium.Color(0.8, 0.1, 0.8, 0.5), // 紫色
        new Cesium.Color(0.1, 0.8, 0.8, 0.5), // 青色
        new Cesium.Color(0.5, 0.3, 0.8, 0.5), // 靛蓝色
        new Cesium.Color(0.8, 0.5, 0.1, 0.5), // 橙色
        new Cesium.Color(0.6, 0.2, 0.8, 0.5), // 深紫色
        new Cesium.Color(0.3, 0.8, 0.6, 0.5), // 绿松石色
        new Cesium.Color(0.8, 0.3, 0.5, 0.5), // 粉红色
        new Cesium.Color(0.5, 0.5, 0.5, 0.5), // 灰色
        new Cesium.Color(0.9, 0.6, 0.9, 0.5), // 淡紫色
      ];

      // 确保索引在有效范围内
      if (i >= 0 && i < colors.length) {
        return colors[i];
      } else {
        // 如果索引超出范围，使用默认颜色或循环使用已有颜色
        return colors[i % colors.length];
      }
    },
    // 检查所有数据源是否已加载完成

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
          color: Cesium.Color.BLUE,
          outlineColor: Cesium.Color.WHITE,
          outlineWidth: 2,
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
        },
        label: {
          text: `降雨量: ${this.rainfall}mm\n持续: ${this.duration}小时`,
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
            <p><strong>降雨量:</strong> ${this.rainfall} mm</p>
            <p><strong>持续时间:</strong> ${this.duration} 小时</p>
            <p><strong>降雨强度:</strong> ${intensity.toFixed(2)} mm/小时</p>
            <p><strong>标记时间:</strong> ${new Date().toLocaleString()}</p>
          </div>
        `
      });

      this.rainPoints.push(entity);
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
        in vec2 v_textureCoordinates;
        out vec4 fragColor;

        float hash(float x){
            return fract(sin(x*23.3)*13.13);
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
            float b=clamp(abs(sin(20.*time*v+uv.y*(5./(2.+v))))-.95,0.,1.)*20.;
            c*=v*b;
            fragColor = mix(texture(colorTexture, v_textureCoordinates), vec4(c, 1), 0.5);
        }
      `;

      this.rainEffect = new Cesium.PostProcessStage({
        fragmentShader: rainFragmentShader
      });

      // 添加到场景但默认禁用
      this.viewer.scene.postProcessStages.add(this.rainEffect);
      this.rainEffect.enabled = false;
    },
    // 切换天气效果
    toggleWeatherEffect() {
      if (!this.rainMode) {
        this.weatherActive = !this.weatherActive;
        this.rainEffect.enabled = this.weatherActive;
      }
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

</style>
