<template>
  <div class="cesium-container" ref="cesiumContainer">
    <!-- 暴雨标记按钮 -->
    <div class="rain-btn" @click="toggleRainMode">
      {{ rainMode ? '取消暴雨标记' : '标记暴雨点' }}
    </div>

    <!-- 天气效果按钮 -->
    <div class="weather-btn" @click="toggleWeatherEffect" :class="{ 'disabled': rainMode }">
      {{ weatherActive ? '关闭下雨效果' : '开启下雨效果' }}
    </div>

    <!-- 暴雨信息面板 -->
    <div v-if="showInfoPanel" class="rain-info-panel">
      <div class="panel-title">暴雨信息</div>
      <div class="panel-content">
        <div>降雨量: <input v-model.number="rainfall" type="number" min="0" max="500" step="1" /> mm</div>
        <div>已持续时间: <input v-model.number="duration" type="number" min="0" max="72" step="1" /> 小时</div>
        <button @click="confirmRainPoint" :disabled="!rainfall || !duration">确认添加</button>
        <button @click="cancelRainPoint">取消</button>
      </div>
    </div>
  </div>
</template>

<script>
import * as Cesium from 'cesium';

export default {
  name: 'CesiumRainMap',
  data() {
    return {
      viewer: null,
      tdtToken: "7f013d0186775b063d6a046977bbefc6",
      currentMapType: 0,
      rainMode: false,             // 暴雨标记模式开关
      showInfoPanel: false,
      selectedPosition: null,
      rainfall: 50,                // 降雨量(mm)
      duration: 2,                 // 降雨持续时间(小时)
      rainPoints: [],              // 暴雨点实体数组
      weatherActive: false,
      rainEffect: null,
      canMarkAgain: true           // 是否允许再次标记
    }
  },
  computed: {
  },
  mounted() {
    this.load();
  },
  beforeDestroy() {
    if (this.viewer) {
      this.viewer.destroy();
      this.viewer = null;
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
        destination: Cesium.Cartesian3.fromDegrees(108.93, 34.27, 2000000),
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

    onMapClick(movement) {
      if (!this.rainMode || !this.canMarkAgain) return;

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

    confirmRainPoint() {
      if (!this.selectedPosition || !this.canMarkAgain) return;

      const { longitude, latitude, cartesian } = this.selectedPosition;

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
}

/* 暴雨标记按钮 */
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

/* 天气效果按钮 */
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

.weather-btn:hover:not(.disabled) {
  background-color: rgba(33, 158, 188, 1);
}

/* 暴雨信息面板 */
.rain-info-panel {
  position: absolute;
  top: 90px;
  left: 10px;
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 15px;
  border-radius: 4px;
  width: 220px;
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
</style>
