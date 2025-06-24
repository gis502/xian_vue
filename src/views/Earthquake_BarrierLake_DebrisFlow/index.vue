<template>
<div id="cesiumContainer">
  <RouterPanel
      :visible="popupVisible"
      :position="popupPosition"
      :popupData="popupData"
  />
  <div v-if="isShowMessage"
       style="position: fixed; top: 150px; left: 50%; transform: translate(-50%, -50%); z-index: 9999; display: flex; align-items: center; justify-content: center; width: 200px; height: 50px; background-color: rgba(13, 50, 95, 0.7);border-radius: 10px;">
    <p style="color: #fff; margin: 0;">请添加受灾点</p>
  </div>
  <div class="navbar">
    <h2 class="zhts-title">
      <div class="logo">
        <span class="text">地震-堰塞湖-泥石流</span>
      </div>
    </h2>
    <el-row type="flex" :gutter="24">
      <el-col :span="36">
        <div class="grid-content bg-purple">
          <el-button type="primary" @click="draw('point')">绘制点</el-button>
          <el-button type="primary" @click="draw('polyline')">绘制线</el-button>
          <el-button type="primary" @click="draw('polygon')">绘制面</el-button>
          <el-button type="primary" @click="clearDrawEntities">清空</el-button>
        </div>
      </el-col>
    </el-row>
  </div>
<!--  <div class="controls" v-if="viewer">-->
<!--    <button @click="toggleDebrisFlow">-->
<!--      {{ isDebrisFlowActive ? '停止模拟' : '开始泥石流模拟' }}-->
<!--    </button>-->
<!--    <div class="slider-container">-->
<!--      <label>流速: {{ flowSpeed }}</label>-->
<!--      <input-->
<!--          type="range"-->
<!--          min="1"-->
<!--          max="10"-->
<!--          v-model.number="flowSpeed"-->
<!--          @input="updateDebrisFlow"-->
<!--      >-->
<!--    </div>-->
<!--  </div>-->
</div>

</template>

<script>
import * as Cesium from "cesium";
import "cesium/Source/Widgets/widgets.css";
// import CesiumNavigation from "cesium-navigation-es6";
// import {initCesium} from "@/cesium/tool/initCesium.js";
// import RouterPanel from "@/components/Panel/RouterPanel.vue";
// import cesiumPlot from "@/cesium/plot/cesiumPlot.js";
export default {
  name: "index",
  data() {
    return {
      viewer: null,
      tiandituKey:"d95d09b97c69e142567ab3337caa7972",//天地图密钥
      handler: null, // 创建共享的 handler
      mapViewer: undefined,
      isDebrisFlowActive: false,
      debrisFlowPrimitive: null,
      flowSpeed: 5,
      flowProgress: 0,
      animationCallback: null,
      tempEntities: [],
      cesiumToken:"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI0YmIxOGFlMS1kMTM5LTQ2MzAtOGVhYy1kZTJkZDg2ODExZGUiLCJpZCI6MzE0NTgwLCJpYXQiOjE3NTA2Mzk2OTV9.MC2gkk7GvviYj3MguPK028Iux2DHX-riLEO-NaOC0WM\"",// 创建的cesiumtoken
      popupVisible: false, // 弹窗的显示与隐藏，传值给子组件
      popupPosition: {x: 0, y: 0}, // 弹窗显示位置，传值给子组件
      popupData: {}, // 弹窗内容，传值给子组件
      isShowMessage: false,  // 是否显示提示-添加受灾点
    };
  },
  mounted() {
    this.init();
    // this.handler = new Cesium.ScreenSpaceEventHandler(window.viewer.scene.canvas); // 初始化
  },
  beforeUnmount() {
    if (window.viewer) {
      let viewer = window.viewer
      let gl = viewer.scene.context._gl
      viewer.entities.removeAll()
      // viewer.scene.primitives.removeAll()
      // 不用写这个，viewer.destroy时包含此步，在DatasourceDisplay中
      viewer.destroy()
      gl.getExtension("WEBGL_lose_context").loseContext();
      console.log("webglcontext 已清除")
      gl = null
      window.viewer = null;
    }
  },
  methods: {
    init() {
      Cesium.Ion.defaultAccessToken = this.cesiumToken;
      this.viewer = new Cesium.Viewer("cesiumContainer", {
        homeButton: false,
        sceneModePicker: false,
        baseLayerPicker: false, // 影像切换
        animation: false, // 是否显示动画控件
        infoBox: false, // 是否显示点击要素之后显示的信息
        selectionIndicator: false, // 要素选中框
        geocoder: false, // 是否显示地名查找控件
        timeline: false, // 是否显示时间线控件
        fullscreenButton: false,
        shouldAnimate: false,
        navigationHelpButton: false, // 是否显示帮助信息控件
      });
      this.mapViewer = this.viewer

      //天地图导入
      const imageLayers = this.viewer.scene.imageryLayers;
      imageLayers.remove(imageLayers.get(0)); //移除默认影像图层
      this.addTianDiTuLayers();
      // 注释版权信息
      this.viewer._cesiumWidget._creditContainer.style.display = "none";

      //定位到西安
      this.locatedXiAn();
    },
    addTianDiTuLayers(){
      // 添加图层请求间隔
      setTimeout(() => {
        this.viewer.imageryLayers.addImageryProvider(tdtLayer);
      }, 1000);

      setTimeout(() => {
        this.viewer.imageryLayers.addImageryProvider(tdtAnnotionLayer);
      }, 1000);
      const subdomains = ['t0', 't1', 't2', 't3', 't4', 't5', 't6', 't7'];
      const randomSubdomain = subdomains[Math.floor(Math.random() * subdomains.length)];
      const tdtLayer = new Cesium.WebMapTileServiceImageryProvider({
        url: `http://${randomSubdomain}.tianditu.com/img_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=img&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={TileMatrix}&TILEROW={TileRow}&TILECOL={TileCol}&tk=${this.tiandituKey}`,
        layer: "tdt",
        style: "default",
        format: "image/jpeg",
        tileMatrixSetID: "w",
        maximumLevel: 18,
        show: false,
      });
      // 天地图注记
      const tdtAnnotionLayer = new Cesium.WebMapTileServiceImageryProvider({
        url: `http://${randomSubdomain}.tianditu.com/cia_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=cia&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={TileMatrix}&TILEROW={TileRow}&TILECOL={TileCol}&tk=${this.tiandituKey}`,
        layer: "tdtAnno",
        style: "default",
        format: "image/jpeg",
        tileMatrixSetID: "w",
        maximumLevel: 18,
        show: false,
      });
      // 将图层添加到地图
      this.viewer.imageryLayers.addImageryProvider(tdtLayer);
      this.viewer.imageryLayers.addImageryProvider(tdtAnnotionLayer);

    },
    locatedXiAn(){
      //默认定位到西安
      const savedView = localStorage.getItem('mapView');
      if (savedView) {
        const { destination, orientation } = JSON.parse(savedView);
        this.viewer.camera.setView({ destination, orientation });
      } else {
        this.viewer.camera.flyTo({
          destination: Cesium.Cartesian3.fromDegrees(108.0, 34.2, 40000.0),
          orientation: {
            // 指向
            heading: 6.283185307179581,
            // 视角
            pitch: -1.5688168484696687,
            roll: 0.0
          }
        });
      }
      // 添加视图变化监听器，保存当前视图到localStorage
      this.viewer.camera.changed.addEventListener(() => {
        const position = this.viewer.camera.position;
        const heading = this.viewer.camera.heading;
        //const pitch = this.viewer.camera.pitch;
        //const roll = this.viewer.camera.roll;
        localStorage.setItem('mapView', JSON.stringify({
          destination: position,
          orientation: {heading}
        }));
      });
    },
    // toggleDebrisFlow() {
    //   if (this.isDebrisFlowActive) {
    //     this.stopDebrisFlow();
    //   } else {
    //     this.startDebrisFlow();
    //   }
    //   this.isDebrisFlowActive = !this.isDebrisFlowActive;
    // },
    // startDebrisFlow() {
    //   // 定义泥石流起点位置
    //   const startPosition = Cesium.Cartesian3.fromDegrees(108.0, 34.2, 40000.0);
    //
    //   // 创建泥石流Primitive
    //   this.debrisFlowPrimitive = new Cesium.Primitive({
    //     geometryInstances: new Cesium.GeometryInstance({
    //       geometry: new Cesium.PlaneGeometry({
    //         vertexFormat: Cesium.VertexFormat.POSITION_AND_NORMAL,
    //         dimensions: new Cesium.Cartesian2(5000, 20000)
    //       }),
    //       modelMatrix: Cesium.Matrix4.multiplyByTranslation(
    //           Cesium.Transforms.eastNorthUpToFixedFrame(startPosition),
    //           new Cesium.Cartesian3(0, 0, -100),
    //           new Cesium.Matrix4()
    //       ),
    //       attributes: {
    //         color: Cesium.ColorGeometryInstanceAttribute.fromColor(
    //             Cesium.Color.fromCssColorString('#8B4513').withAlpha(0.7)
    //         )
    //       }
    //     }),
    //     appearance: new Cesium.PerInstanceColorAppearance({
    //       flat: true,
    //       translucent: true
    //     }),
    //     asynchronous: false
    //   });
    //
    //   // 添加到场景
    //   this.viewer.scene.primitives.add(this.debrisFlowPrimitive);
    //
    //   // 开始动画
    //   this.flowProgress = 0;
    //   this.animationCallback = (time) => {
    //     // 全面检查所有可能为空的对象
    //     if (!this.debrisFlowPrimitive ||
    //         !this.debrisFlowPrimitive.geometryInstances ||
    //         !this.debrisFlowPrimitive.geometryInstances.attributes ||
    //         !this.debrisFlowPrimitive.geometryInstances.attributes.position) {
    //       return;
    //     }
    //
    //     // 更新流动进度
    //     this.flowProgress += 0.005 * this.flowSpeed;
    //     if (this.flowProgress > 1) this.flowProgress = 0;
    //
    //     // 使用回调属性实现流动效果
    //     const positionAttribute = this.debrisFlowPrimitive.geometryInstances.attributes.position;
    //     const positions = positionAttribute.values;
    //
    //     // 创建一个动态位置回调
    //     const dynamicPositions = new Cesium.CallbackProperty((time, result) => {
    //       const animationOffset = Math.sin(this.flowProgress * Math.PI * 2) * 50;
    //
    //       // 如果结果数组不存在，创建一个新的
    //       if (!result) {
    //         result = new Float64Array(positions.length);
    //       }
    //
    //       // 应用流动效果
    //       for (let i = 0; i < positions.length; i += 3) {
    //         result[i] = positions[i];
    //         result[i + 1] = positions[i + 1] + animationOffset * (i / positions.length);
    //         result[i + 2] = positions[i + 2];
    //       }
    //
    //       return result;
    //     }, false);
    //
    //     // 更新位置属性
    //     positionAttribute.value = dynamicPositions;
    //
    //     // 标记属性需要重新计算
    //     positionAttribute.definitionChanged.raiseEvent();
    //
    //     // 强制场景重新渲染
    //     this.viewer.scene.requestRender();
    //   };
    //
    //   // 注册动画回调
    //   this.viewer.clock.onTick.addEventListener(this.animationCallback);
    // },
    // stopDebrisFlow() {
    //   // 先移除动画回调，确保不再执行
    //   if (this.animationCallback) {
    //     this.viewer.clock.onTick.removeEventListener(this.animationCallback);
    //     this.animationCallback = null;
    //   }
    //
    //   // 再移除Primitive
    //   if (this.debrisFlowPrimitive) {
    //     this.viewer.scene.primitives.remove(this.debrisFlowPrimitive);
    //     this.debrisFlowPrimitive = null;
    //   }
    // },
    // updateDebrisFlow() {
    //   // 当流速滑块更新时调用
    //   if (this.isDebrisFlowActive) {
    //     // 可以添加更复杂的流速调整逻辑
    //   }
    // },
    draw(type) {
      //绘制点
      let that = this;
      let viewer = this.mapViewer;
      let tempEntities = this.tempEntities;
      let position = [];
      let tempPoints = [];
      // 开启深度检测
      viewer.scene.globe.depthTestAgainstTerrain = true;
      let handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
      switch (type) {
        case "point":
          // 监听鼠标左键
          handler.setInputAction(function (movement) {
            // 从相机位置通过windowPosition 世界坐标中的像素创建一条射线。返回Cartesian3射线的位置和方向。
            let ray = viewer.camera.getPickRay(movement.position);
            // 查找射线与渲染的地球表面之间的交点。射线必须以世界坐标给出。返回Cartesian3对象
            position = viewer.scene.globe.pick(ray, viewer.scene);
            let point = that.drawPoint(position);
            tempEntities.push(point);
          }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
          // 左键双击停止绘制
          handler.setInputAction(function () {
            handler.destroy(); //关闭事件句柄
            handler = null;
          }, Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
          // 右击单击停止绘制
          handler.setInputAction(function () {
            handler.destroy(); //关闭事件句柄
            handler = null;
          }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
          break;
        case "polyline":
          //鼠标移动事件
          handler.setInputAction(function (movement) {},
              Cesium.ScreenSpaceEventType.MOUSE_MOVE);
          //左键点击操作
          handler.setInputAction(function (click) {
            //调用获取位置信息的接口
            let ray = viewer.camera.getPickRay(click.position);
            position = viewer.scene.globe.pick(ray, viewer.scene);
            tempPoints.push(position);
            let tempLength = tempPoints.length;
            //调用绘制点的接口
            let point = that.drawPoint(tempPoints[tempPoints.length - 1]);
            tempEntities.push(point);
            if (tempLength > 1) {
              let pointline = that.drawPolyline([
                tempPoints[tempPoints.length - 2],
                tempPoints[tempPoints.length - 1],
              ]);
              tempEntities.push(pointline);
            } else {
              // tooltip.innerHTML = "请绘制下一个点，右键结束";
            }
          }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
          //右键点击操作
          handler.setInputAction(function (click) {
            tempPoints = [];
            handler.destroy(); //关闭事件句柄
            handler = null;
          }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
          break;
        case "polygon":
          //鼠标移动事件
          handler.setInputAction(function (movement) {},
              Cesium.ScreenSpaceEventType.MOUSE_MOVE);
          //左键点击操作
          handler.setInputAction(function (click) {
            //调用获取位置信息的接口
            let ray = viewer.camera.getPickRay(click.position);
            position = viewer.scene.globe.pick(ray, viewer.scene);
            tempPoints.push(position);
            let tempLength = tempPoints.length;
            //调用绘制点的接口
            let point = that.drawPoint(position);
            tempEntities.push(point);
            if (tempLength > 1) {
              let pointline = that.drawPolyline([
                tempPoints[tempPoints.length - 2],
                tempPoints[tempPoints.length - 1],
              ]);
              tempEntities.push(pointline);
            } else {
              // tooltip.innerHTML = "请绘制下一个点，右键结束";
            }
          }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
          //右键点击操作
          handler.setInputAction(function (click) {
            let cartesian = viewer.camera.pickEllipsoid(
                click.position,
                viewer.scene.globe.ellipsoid
            );

            if (cartesian) {
              let tempLength = tempPoints.length;
              if (tempLength < 3) {
                alert("请选择3个以上的点再执行闭合操作命令");
              } else {
                //闭合最后一条线
                let pointline = that.drawPolyline([
                  tempPoints[tempPoints.length - 1],
                  tempPoints[0],
                ]);
                tempEntities.push(pointline);
                that.drawPolygon(tempPoints);
                tempEntities.push(tempPoints);
                handler.destroy(); //关闭事件句柄
                handler = null;
              }
            }
          }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
          break;
      }
    },
    drawPoint(position, config) {
      let viewer = this.mapViewer;
      let config_ = config ? config : {};
      return viewer.entities.add({
        name: "点几何对象",
        position: position,
        point: {
          color: Cesium.Color.SKYBLUE,
          pixelSize: 10,
          outlineColor: Cesium.Color.RED,
          outlineWidth: 3,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
        },
      });
    },
    drawPolyline(positions, config_) {
      let viewer = this.mapViewer;
      if (positions.length < 1) return;
      let config = config_ ? config_ : {};
      return viewer.entities.add({
        name: "线几何对象",
        polyline: {
          positions: positions,
          width: config.width ? config.width : 5.0,
          material: new Cesium.PolylineGlowMaterialProperty({
            color: config.color
                ? new Cesium.Color.fromCssColorString(config.color)
                : Cesium.Color.RED,
          }),
          depthFailMaterial: new Cesium.PolylineGlowMaterialProperty({
            color: config.color
                ? new Cesium.Color.fromCssColorString(config.color)
                : Cesium.Color.RED,
          }),
          clampToGround: true,
        },
      });
    },
    drawPolygon(positions, config_) {
      let viewer = this.mapViewer;
      if (positions.length < 2) return;
      let config = config_ ? config_ : {};
      return viewer.entities.add({
        name: "面几何对象",
        polygon: {
          hierarchy: positions,
          material: config.color
              ? new Cesium.Color.fromCssColorString(config.color).withAlpha(0.2)
              : new Cesium.Color.fromCssColorString("red").withAlpha(0.2),
        },
      });
    },
    /**
     * 清除实体
     */
    clearDrawEntities() {
      let viewer = this.mapViewer;
      this.tempEntities = [];
      // 清除之前的实体
      const entitys = viewer.entities._entities._array;
      let length = entitys.length;
      // 倒叙遍历防止实体减少之后entitys[f]不存在
      for (let f = length - 1; f >= 0; f--) {
        if (
            entitys[f]._name &&
            (entitys[f]._name === "点几何对象" ||
                entitys[f]._name === "线几何对象" ||
                entitys[f]._name === "面几何对象")
        ) {
          viewer.entities.remove(entitys[f]);
        }
      }
    },
    addVuex() {},
  },
  created() {},

  beforeDestroy() {
    this.stopDebrisFlow();
    if (this.viewer) {
      this.viewer.destroy();
      this.viewer = null;
    }
  }
}
</script>

<style scoped>
#cesiumContainer {
  width: 100%;
  height: calc(100vh - 50px);
  margin: 0;
  padding: 0;
  overflow: hidden;
}
.navbar {
  background-color: #283b4d;
  height: 8%;
  display: flex;
  align-items: center;
  padding: 0 20px;
  background-size: 30% 100%;
  z-index: 100;
}
.zhts-title {
  width: 18vw;
  background-size: 100% 100%;
  /*left: 2%;*/
  font-weight: 550;
  font-size: 1.8rem;
  position: relative;
  background-repeat: no-repeat;
  color: #fff;
  /*text-shadow: 0 3px 6px #1973c0;*/
  margin-right: 10px;
}
.text{
  font-size: 20px;
}
.controls {
  position: absolute;
  bottom: 20px;
  left: 20px;
  z-index: 100;
  background-color: rgba(0, 0, 0, 0.7);
  padding: 15px;
  border-radius: 8px;
  color: white;
}
button {
  background-color: #4CAF50;
  border: none;
  color: white;
  padding: 8px 16px;
  text-align: center;
  text-decoration: none;
  display: inline-block;
  font-size: 14px;
  margin-bottom: 10px;
  cursor: pointer;
  border-radius: 4px;
}
.slider-container {
  display: flex;
  align-items: center;
}
input[type="range"] {
  margin-left: 10px;
  width: 150px;
}
</style>