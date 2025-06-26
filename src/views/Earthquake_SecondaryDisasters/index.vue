<template>
  <div class="cesium-container" ref="cesiumContainer">
    <!-- 地震触发按钮 -->
    <div class="earthquake-btn" @click="toggleEarthquakeMode">
      {{ earthquakeMode ? '取消地震标记' : '触发地震模拟' }}
    </div>

    <!-- 次生灾害控制面板 -->
    <div class="secondary-panel">
      <div class="panel-title">次生灾害控制</div>
      <div class="panel-content">
        <label><input type="checkbox" v-model="showFaultLines" @change="toggleFaultLines(showFaultLines)" /> 显示断裂带</label>
        <label><input type="checkbox" v-model="showDangerPoints" @change="toggleDangerPoints(showDangerPoints)" /> 显示隐患点</label>
        <label><input type="checkbox" v-model="showLandslideWarnings" @change="toggleLandslideWarnings(showLandslideWarnings)" /> 显示滑坡预警</label>
      </div>
    </div>

    <!-- 地震信息面板 -->
    <div v-if="showInfoPanel" class="earthquake-info-panel">
      <div class="panel-title">地震信息</div>
      <div class="panel-content">
        <div>震级: <input v-model.number="magnitude" type="number" min="0" max="10" step="0.1" /></div>
        <div>深度: <input v-model.number="depth" type="number" min="0" max="1000" step="1" /> km</div>
        <div>震中位置: {{ selectedPosition ? `${selectedPosition.latitude.toFixed(4)}, ${selectedPosition.longitude.toFixed(4)}` : '' }}</div>
        <button @click="confirmEarthquake">确认添加</button>
        <button @click="cancelEarthquake">取消</button>
      </div>
    </div>

    <!-- 图例 -->
    <!-- 图例部分修改 -->
    <div class="legend">
      <div class="legend-title">图例</div>
      <div class="legend-item"><span class="legend-color" style="background: rgba(220, 20, 60, 0.5);"></span> 12度</div>
      <div class="legend-item"><span class="legend-color" style="background: rgba(255, 0, 0, 0.4);"></span> 11度</div>
      <div class="legend-item"><span class="legend-color" style="background: rgba(255, 140, 0, 0.35);"></span> 10度</div>
      <div class="legend-item"><span class="legend-color" style="background: rgba(255, 215, 0, 0.3);"></span> 9度</div>
      <div class="legend-item"><span class="legend-color" style="background: rgba(0, 128, 0, 0.25);"></span> 8度</div>
      <div class="legend-item"><span class="legend-color" style="background: rgba(0, 0, 255, 0.2);"></span> 7度</div>
      <div class="legend-item"><span class="legend-color" style="background: rgba(75, 0, 130, 0.15);"></span> 6度</div>
      <div class="legend-item"><span class="legend-color" style="background: #ff0000;"></span> 地震点</div>
      <div class="legend-item"><span class="legend-color" style="background: #0000ff;"></span> 断裂带</div>
      <div class="legend-item"><span class="legend-color" style="background: #ffff00;"></span> 隐患点</div>
      <div class="legend-item"><span class="legend-color" style="background: #ff00ff;"></span> 滑坡预警</div>
    </div>
  </div>
</template>

<script>
import * as Cesium from 'cesium';
import HuapoData from '@/assets/disaster/Huapo.json';
import NishiliuData from '@/assets/disaster/Nishiliu.json';
// import faultZone from '@/assets/styles/faultZone.json'

export default {
  name: 'CesiumMap',

  data() {
    return {
      HuapoData: HuapoData,
      NishiliuData: NishiliuData,
      // faultZone: faultZone,
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
      showFaultLines: true,
      showDangerPoints: true,
      showLandslideWarnings: true,
      faultLines: [],
      dangerPoints: [],
      landslideWarnings: [],
      intensityConfig: {
        magnitudeRanges: [
          { min: 8.0, max: 8.9, intensities: [12, 11, 10] },
          { min: 7.5, max: 7.9, intensities: [11, 10, 9] },
          { min: 7.0, max: 7.4, intensities: [10, 9, 8] },
          { min: 6.5, max: 6.9, intensities: [9, 8, 7] },
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
  },
  beforeDestroy() {
    this.cleanup();
  },
  methods: {
    loadDisasterData() {
      this.isLoading = true;
      this.loadingText = '加载灾害点数据...';

      try {
        // 确保数据存在且格式正确
        const huapoFeatures = this.HuapoData?.features || [];
        const nishiliuFeatures = this.NishiliuData?.features || [];

        // 存储所有添加的实体，用于事件处理
        this.disasterEntities = [];

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
              pixelOffset: new Cesium.Cartesian2(20, -20),
              distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 100000),
              show: true
            },
            // 添加灾害类型信息，用于弹窗显示
            description: this.createDisasterDescription(properties, '滑坡')
          });

          // 保存实体引用
          this.disasterEntities.push(entity);
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
              pixelOffset: new Cesium.Cartesian2(20, -20),
              distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 100000),
              show: true
            },
            // 添加灾害类型信息，用于弹窗显示
            description: this.createDisasterDescription(properties, '泥石流')
          });

          // 保存实体引用
          this.disasterEntities.push(entity);
        });

        // 加载断裂带
        // faultZone.RECORDS.forEach(line => {
        //   this.faultZoneList.push(parseFloat(line.SmX)); // 转换为数值类型
        //   this.faultZoneList.push(parseFloat(line.SmY)); // 转换为数值类型
        // });
        //
        // console.log(this.faultZoneList, "转换后的数据类型：", this.faultZoneList.map(v => typeof v));
        // this.viewer.entities.add({
        //   polyline: {
        //     positions: Cesium.Cartesian3.fromDegreesArray(this.faultZoneList),
        //     // 宽度
        //     width: 2,
        //     // 线的颜色
        //     material: Cesium.Color.RED,
        //     // 线的顺序,仅当`clampToGround`为true并且支持地形上的折线时才有效。
        //     zIndex: 10,
        //     // 显示在距相机的距离处的属性，多少区间内是可以显示的
        //     distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 5000000),
        //     // 是否显示
        //     show: true
        //   }
        // });

        // 设置实体点击事件
        this.setupEntityClickHandler();

        this.isLoading = false;
      } catch (error) {
        this.isLoading = false;
        console.error('处理灾害数据时出错:', error);
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
        this.viewer = new Cesium.Viewer(container, {
          imageryProvider: new Cesium.UrlTemplateImageryProvider({
            url: 'http://t0.tianditu.gov.cn/img_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=img&TILEMATRIXSET=w&FORMAT=tiles&TILECOL={x}&TILEROW={y}&TILEMATRIX={z}&tk='+this.tdtToken,
            subdomains: ['t0', 't1', 't2', 't3', 't4', 't5', 't6', 't7'],
            minimumLevel: 1,
            maximumLevel: 18,
            credit: "天地图",
            layer: "img",
          }),
          baseLayerPicker: false,
          animation: false,
          timeline: false,
          shouldAnimate: true
        });

        // 加载影像注记层
        this.loadAnnotationLayer();

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
      this.loadFaultLines();
      this.loadDangerPoints();
      this.loadLandslideWarnings();
    },

    loadFaultLines() {
      const positions = [
        Cesium.Cartesian3.fromDegrees(108.5, 34.0),
        Cesium.Cartesian3.fromDegrees(109.0, 34.2),
        Cesium.Cartesian3.fromDegrees(109.5, 34.0),
        Cesium.Cartesian3.fromDegrees(110.0, 33.8)
      ];

      const entity = this.viewer.entities.add({
        polyline: {
          positions: positions,
          width: 3,
          material: Cesium.Color.BLUE.withAlpha(0.7),
          clampToGround: true
        }
      });
      this.faultLines.push(entity);
    },

    loadDangerPoints() {
      const points = [
        { lon: 108.8, lat: 34.1, name: '隐患点1' },
        { lon: 109.2, lat: 34.0, name: '隐患点2' },
        { lon: 109.5, lat: 33.9, name: '隐患点3' }
      ];

      points.forEach(point => {
        const entity = this.viewer.entities.add({
          position: Cesium.Cartesian3.fromDegrees(point.lon, point.lat),
          point: {
            pixelSize: 10,
            color: Cesium.Color.YELLOW,
            outlineColor: Cesium.Color.BLACK,
            outlineWidth: 1
          },
          label: {
            text: point.name,
            font: '12px sans-serif',
            fillColor: Cesium.Color.WHITE,
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            outlineWidth: 2,
            verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
            pixelOffset: new Cesium.Cartesian2(0, -10)
          }
        });
        this.dangerPoints.push(entity);
      });
    },

    loadLandslideWarnings() {
      const warnings = [
        { lon: 108.7, lat: 34.2, name: '滑坡预警1' },
        { lon: 109.0, lat: 34.1, name: '滑坡预警2' },
        { lon: 109.3, lat: 33.8, name: '滑坡预警3' }
      ];

      warnings.forEach(warning => {
        const entity = this.viewer.entities.add({
          position: Cesium.Cartesian3.fromDegrees(warning.lon, warning.lat),
          billboard: {
            image: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0iI2ZmMDBmZiIgZD0iTTEyLDJMMiwyMmgxMEwxMiwyWiIvPjwvc3ZnPg==',
            width: 32,
            height: 32
          },
          label: {
            text: warning.name,
            font: '12px sans-serif',
            fillColor: Cesium.Color.WHITE,
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            outlineWidth: 2,
            verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
            pixelOffset: new Cesium.Cartesian2(0, -20)
          }
        });
        this.landslideWarnings.push(entity);
      });
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

    // 更新后的烈度等级计算方法
    getIntensityLevels(M) {
      // 震级≤6时不生成烈度圈
      if (M <= 6.0) {
        return [];
      }
      // 查找对应的烈度范围
      const range = this.intensityConfig.magnitudeRanges.find(
          r => M >= r.min && M <= r.max
      );
      // 如果找不到匹配的范围，使用默认处理
      return range ? range.intensities : [7, 6, 5];
    },

    drawIntensityCircles() {
      const { longitude, latitude, cartesian: center } = this.selectedPosition;
      const M = this.magnitude;

      console.log("绘制烈度圈 - 震级:", M);

      // 清除现有烈度圈
      this.clearIntensityCircles();

      // 震级≤6时不生成烈度圈
      if (M <= 6.0) {
        console.log("震级≤6，不生成烈度圈");
        return;
      }

      const intensityLevels = this.getIntensityLevels(M);
      console.log("计算得到的烈度等级:", intensityLevels);

      intensityLevels.forEach((Ia, index) => {
        // 计算椭圆长短轴
        const semiMajorAxis = this.calculateRa(M, Ia);
        const semiMinorAxis = this.calculateRb(M, Ia);

        console.log(`烈度 ${Ia} 级 - 长轴: ${semiMajorAxis} 米, 短轴: ${semiMinorAxis} 米`);

        const ellipse = this.viewer.entities.add({
          position: center,
          ellipse: {
            semiMajorAxis,
            semiMinorAxis,
            rotation: Cesium.Math.toRadians(0),
            material: this.getColorByIntensity(Ia),
            outline: true,
            outlineColor: Cesium.Color.BLACK,
            outlineWidth: 1
          }
        });

        this.intensityCircles.push(ellipse);
      });
    },

    // // 绘制烈度圈方法修改
    // drawIntensityCircles() {
    //   const { longitude, latitude, cartesian: center } = this.selectedPosition;
    //   const M = this.magnitude;
    //
    //   // 清除现有烈度圈
    //   this.clearIntensityCircles();
    //
    //   // 震级≤6时不生成烈度圈
    //   if (M <= 6.0) {
    //     return;
    //   }
    //
    //   const intensityLevels = this.getIntensityLevels(M);
    //
    //   intensityLevels.forEach((Ia, index) => {
    //     // 计算椭圆长短轴
    //     const semiMajorAxis = this.calculateRa(M, Ia);
    //     const semiMinorAxis = this.calculateRb(M, Ia);
    //
    //     const ellipse = this.viewer.entities.add({
    //       position: center,
    //       ellipse: {
    //         semiMajorAxis,
    //         semiMinorAxis,
    //         rotation: Cesium.Math.toRadians(0),
    //         // material: this.getIntensityColor(Ia),
    //         material: this.getColorByIntensity(Ia),
    //         outline: true,
    //         outlineColor: Cesium.Color.BLACK,
    //         outlineWidth: 1
    //       }
    //     });
    //
    //     this.intensityCircles.push(ellipse);
    //   });
    // },
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

    // calculateRa(M, Ia) {
    //   const { offset, magnitudeFactor, decayFactor, minValue, unitConversion } = this.axisCalculationParams.Ra;
    //   const value = Math.pow(10, (offset + magnitudeFactor * M - Ia) / decayFactor) - minValue;
    //   return value <= 0 ? 100 : value * unitConversion;
    // },
    //
    // calculateRb(M, Ib) {
    //   const { offset, magnitudeFactor, decayFactor, minValue, unitConversion } = this.axisCalculationParams.Rb;
    //   const value = Math.pow(10, (offset + magnitudeFactor * M - Ib) / decayFactor) - minValue;
    //   return value <= 0 ? 60 : value * unitConversion;
    // },
    // // 更新后的颜色映射方法
    // getIntensityColor(level) {
    //   const colorConfig = this.intensityConfig.colorMap.find(c => c.level === level);
    //   return colorConfig ? colorConfig.color : Cesium.Color.WHITE.withAlpha(0.1);
    // },
    getColorByIntensity(level) {
      const entry = this.intensityConfig.colorMap.find(item => item.level === level);
      if (entry) {
        const [r, g, b, a] = entry.color;
        return Cesium.Color.fromBytes(r, g, b, a);
      }
      // 默认为红色，便于调试
      return Cesium.Color.RED.withAlpha(0.5);
    },
    // getColorByIntensity(level) {
    //   const entry = this.intensityConfig.colorMap.find(item => item.level === level);
    //   if (entry) {
    //     const [r, g, b, a] = entry.color;
    //     return Cesium.Color.fromBytes(r, g, b, a);
    //   }
    //   return Cesium.Color.GRAY.withAlpha(0.3);
    // },

    clearIntensityCircles() {
      this.intensityCircles.forEach(circle => {
        this.viewer.entities.remove(circle);
      });
      this.intensityCircles = [];
    },

    flyToEarthquake(entity) {
      this.viewer.flyTo(entity, {
        duration: 1.5,
        offset: new Cesium.HeadingPitchRange(0, Cesium.Math.toRadians(-30), 5000)
      });
    },

    toggleFaultLines(show) {
      this.faultLines.forEach(line => {
        line.show = show;
      });
    },

    toggleDangerPoints(show) {
      this.dangerPoints.forEach(point => {
        point.show = show;
      });
    },

    toggleLandslideWarnings(show) {
      this.landslideWarnings.forEach(warning => {
        warning.show = show;
      });
    },

    cancelEarthquake() {
      this.showInfoPanel = false;
      this.earthquakeMode = false;
      this.removeClickHandler();
      document.body.style.cursor = '';
    },

    cleanup() {
      this.removeClickHandler();
      if (this.viewer) {
        this.viewer.destroy();
      }
    }
  }
}
</script>

<style scoped>
.cesium-container {
  position: relative;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;

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
</style>
