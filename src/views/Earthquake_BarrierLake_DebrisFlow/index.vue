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
          <el-button type="primary" @click="toggleFaultZone()">
            {{ showFaultZone ? '隐藏断裂带' : '显示断裂带' }}
          </el-button>
          <el-button type="primary" @click="draw('AddHypocenter')">添加震源</el-button>
          <el-button type="primary" @click="draw('point')">绘制点</el-button>
          <el-button type="primary" @click="draw('polyline')">绘制线</el-button>
          <el-button type="primary" @click="draw('polygon')">绘制面</el-button>
          <el-button type="primary" @click="clearDrawEntities">清空</el-button>
        </div>
      </el-col>
    </el-row>
  </div>
<!--  <img src="@/assets/images/landslide.png" alt="">-->
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
// import lineData from "@/assets/西安断层数据.json";
// import DebrisFlow from "@/assets/西安泥石流灾害点.json"
import landslideIcon from "@/assets/images/landslide.png"
import {renderList} from "vue";

export default {
  name: "index",
  data() {
    return {
      viewer: null,
      tdtToken:"07f071d2d20098468ee7697112e8fc58",//天地图密钥
      handler: null, // 创建共享的 handler
      mapViewer: undefined,
      isDebrisFlowActive: false,
      debrisFlowPrimitive: null,
      flowSpeed: 5,
      flowProgress: 0,
      animationCallback: null,
      tempEntities: [],
      popupVisible: false, // 弹窗的显示与隐藏，传值给子组件
      popupPosition: {x: 0, y: 0}, // 弹窗显示位置，传值给子组件
      popupData: {}, // 弹窗内容，传值给子组件
      isShowMessage: false,  // 是否显示提示-添加受灾点
      lineData: lineData,
      line_data: [],
      FaultZone: [],
      showFaultZone: false,  // 控制断裂带显示状态的变量
      DebrisFlow: DebrisFlow, // 泥石流隐患点
      HazardPoint: [], // 泥石流隐患点数组
    };
  },
  mounted() {
    this.init();
    this.AddHazardSource();
  },
  methods: {
    init() {
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
      this.addTianDiTuLayers(0);
      // 注释版权信息
      this.viewer._cesiumWidget._creditContainer.style.display = "none";

      //定位到西安
      this.locatedXiAn();
    },
    addTianDiTuLayers(type){
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

      // 添加图层请求间隔
      // setTimeout(() => {
      //   this.viewer.imageryLayers.addImageryProvider(tdtLayer);
      // }, 1000);
      //
      // setTimeout(() => {
      //   this.viewer.imageryLayers.addImageryProvider(tdtAnnotionLayer);
      // }, 1000);
      // const subdomains = ['t0', 't1', 't2', 't3', 't4', 't5', 't6', 't7'];
      // const randomSubdomain = subdomains[Math.floor(Math.random() * subdomains.length)];
      // // 天地图影像
      // const tdtLayer = new Cesium.WebMapTileServiceImageryProvider({
      //   url: `http://${randomSubdomain}.tianditu.com/img_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=img&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={TileMatrix}&TILEROW={TileRow}&TILECOL={TileCol}&tk=${this.tiandituKey}`,
      //   layer: "tdt",
      //   style: "default",
      //   format: "image/jpeg",
      //   tileMatrixSetID: "w",
      //   maximumLevel: 18,
      //   show: false,
      // });
      // // 天地图注记
      // const tdtAnnotionLayer = new Cesium.WebMapTileServiceImageryProvider({
      //   url: `http://${randomSubdomain}.tianditu.com/cia_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=cia&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={TileMatrix}&TILEROW={TileRow}&TILECOL={TileCol}&tk=${this.tiandituKey}`,
      //   layer: "tdtAnno",
      //   style: "default",
      //   format: "image/jpeg",
      //   tileMatrixSetID: "w",
      //   maximumLevel: 18,
      //   show: false,
      // });
      // // 将图层添加到地图
      // this.viewer.imageryLayers.addImageryProvider(tdtLayer);
      // this.viewer.imageryLayers.addImageryProvider(tdtAnnotionLayer);

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
    toggleFaultZone() {
      this.showFaultZone = !this.showFaultZone;

      // 根据状态显示或隐藏断裂带
      if (this.showFaultZone) {
        // 显示断裂带的逻辑
        this.AddFaultZone();
      } else {
        // 隐藏断裂带的逻辑
        this.HideFaultZone();
      }
    },
    AddFaultZone(){
      console.log('显示断裂带');
      console.log(lineData)
      this.lineData.features.forEach(line => {
        console.log(line.geometry)
        this.line_data.push(line.geometry)
      })
      let that = this
      this.line_data.forEach(Lon_Lat => {
        this.FaultZone = []
        Lon_Lat.coordinates.forEach(LonLat => {
          LonLat.forEach(point => {
            this.FaultZone.push(Number(point))
          })
        })
        console.log(this.FaultZone,123)
        this.viewer.entities.add({
          polyline: {
            // fromDegrees返回给定的经度和纬度值数组（以度为单位），该数组由Cartesian3位置组成。
            // Cesium.Cartesian3.fromDegreesArray([经度1, 纬度1, 经度2, 纬度2,])
            // Cesium.Cartesian3.fromDegreesArrayHeights([经度1, 纬度1, 高度1, 经度2, 纬度2, 高度2])
            positions: Cesium.Cartesian3.fromDegreesArray(this.FaultZone),
            // 宽度
            width: 2,
            // 线的颜色
            material: Cesium.Color.RED,
            // 线的顺序,仅当`clampToGround`为true并且支持地形上的折线时才有效。
            zIndex: 10,
            // 显示在距相机的距离处的属性，多少区间内是可以显示的
            distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0),
            // 是否显示
            show: true,
          }
        });
      })
      // console.log(this.FaultZone,123123)
    },
    HideFaultZone() {
      console.log('隐藏断裂带');

      // 清空数据数组
      this.line_data = [];
      this.FaultZone = [];

      // 移除所有断裂带实体
      const entities = this.viewer.entities.values;
      for (let i = entities.length - 1; i >= 0; i--) {
        const entity = entities[i];
        // if (entity.polyline && entity.polyline.material instanceof Cesium.Color &&
        //     entity.polyline.material.color.equals(Cesium.Color.RED)) {
          this.viewer.entities.remove(entity);
        // }
      }
      // 移除标签实体
      // for (let i = entities.length - 1; i >= 0; i--) {
      //   const entity = entities[i];
      //   if (entity.label && entity.label.text === '测试名称') {
      //     this.viewer.entities.remove(entity);
      //   }
      // }
    },
    AddHazardSource(){
      this.DebrisFlow.features.forEach(hazard_source => {
        this.HazardPoint.push(hazard_source.geometry)
      })
      this.HazardPoint.forEach(hazard_point => {
        let lon = hazard_point.coordinates[0]
        let lat = hazard_point.coordinates[1]
        this.viewer.entities.add({
          position: Cesium.Cartesian3.fromDegrees(lon, lat),
          billboard: {
            // 图像地址，URI或Canvas的属性   @/assets/images/landslide.png
            image: landslideIcon,
            width: 30, // 图片宽度,单位px
            height: 30, // 图片高度，单位px
            eyeOffset: new Cesium.Cartesian3(0, 0, 0), // 与坐标位置的偏移距离
            color: Cesium.Color.WHITE.withAlpha(1), // 固定颜色
            scale: 0.8, // 缩放比例
            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND, // 绑定到地形高度
            scaleByDistance: new Cesium.NearFarScalar(500, 1, 5e5, 0.1),
            depthTest: false, // 禁止深度测试
            disableDepthTestDistance: Number.POSITIVE_INFINITY, // 不进行深度测试
            show: true
          }
        });
      })
    },
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
        case "AddHypocenter":
          // 监听鼠标左键
          handler.setInputAction(function (movement) {
            // 从相机位置通过windowPosition 世界坐标中的像素创建一条射线。返回Cartesian3射线的位置和方向。
            let ray = viewer.camera.getPickRay(movement.position);
            // 查找射线与渲染的地球表面之间的交点。射线必须以世界坐标给出。返回Cartesian3对象
            position = viewer.scene.globe.pick(ray, viewer.scene);
            let point = that.drawHypocenter(position);
            let circle = that.drawCircle(position);
            tempEntities.push(circle);
            tempEntities.push(point);

            // 绘制完成后立即停止监听
            handler.destroy();
            handler = null;
          }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

          // 双击或右键点击仍可停止绘制
          handler.setInputAction(function () {
            handler.destroy();
            handler = null;
          }, Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);

          handler.setInputAction(function () {
            handler.destroy();
            handler = null;
          }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
          break;
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
          color: Cesium.Color.RED,
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
    drawHypocenter(position, config) {
      let viewer = this.mapViewer;
      let config_ = config ? config : {};
      return viewer.entities.add({
        name: "点几何对象",
        position: position,
        point: {
          color: Cesium.Color.YELLOW,
          pixelSize: 10,
          outlineColor: Cesium.Color.YELLOW,
          outlineWidth: 3,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
        },
      });
    },
    drawCircle(position){
      //绘制椭圆
      // 定义多个椭圆的参数数组
      // const circleParams = [
      //   { deviation: 0.15, numPoints: 48, extrudedHeight: 2000, alpha: 0.4 },
      //   { deviation: 0.20, numPoints: 48, extrudedHeight: 4000, alpha: 0.3 },
      //   { deviation: 0.25, numPoints: 64, extrudedHeight: 6000, alpha: 0.2 }
      // ];
      //
      // // 基础椭圆尺寸
      // const baseMinorAxis = 20000;
      // const baseMajorAxis = 30000;
      //
      // // 存储所有创建的不规则椭圆实体
      // const entities = [];
      //
      // // 循环创建多个不规则同心椭圆
      // circleParams.forEach((params, index) => {
      //   // 计算当前椭圆的尺寸（逐层放大）
      //   const scale = 1 + index * 0.5;
      //   const minorAxis = baseMinorAxis * scale;
      //   const majorAxis = baseMajorAxis * scale;
      //
      //   // 生成不规则椭圆的点集
      //   const points = [];
      //   for (let i = 0; i < params.numPoints; i++) {
      //     const angle = (i / params.numPoints) * Math.PI * 2;
      //
      //     // 计算基础椭圆上的点
      //     let x = majorAxis * Math.cos(angle);
      //     let y = minorAxis * Math.sin(angle);
      //
      //     // 添加随机偏移，创建不规则形状
      //     const randomDeviation = 1 + (Math.random() * 2 - 1) * params.deviation;
      //     x *= randomDeviation;
      //     y *= randomDeviation;
      //
      //     // 将局部坐标转换为世界坐标
      //     const cartographic = Cesium.Cartographic.fromCartesian(position);
      //     const offsetPosition = Cesium.Cartesian3.fromRadians(
      //         cartographic.longitude + x / Cesium.Ellipsoid.WGS84.maximumRadius,
      //         cartographic.latitude + y / Cesium.Ellipsoid.WGS84.maximumRadius,
      //         cartographic.height
      //     );
      //
      //     points.push(offsetPosition);
      //   }
      //   // 创建不规则多边形
      //   const polygon = new Cesium.Entity({
      //     position: position,
      //     name: "面几何对象",
      //     polygon: {
      //       hierarchy: new Cesium.PolygonHierarchy(points),
      //       extrudedHeight: params.extrudedHeight,
      //       material: Cesium.Color.RED.withAlpha(params.alpha),
      //       outline: false,
      //       outlineColor: Cesium.Color.BLUE
      //     }
      //   });
      //
      //   entities.push(this.viewer.entities.add(polygon));
      // });
      //
      // return entities;
      const circleParams = [
        { semiMinorAxis: 11873, semiMajorAxis: 21968, extrudedHeight: 952, alpha: 0.3 },
        { semiMinorAxis: 34567, semiMajorAxis: 45678, extrudedHeight: 4000, alpha: 0.2 },
        { semiMinorAxis: 40568, semiMajorAxis: 95666, extrudedHeight: 6000, alpha: 0.1 }
      ];
      // 存储所有创建的椭圆实体
      const entities = [];
      // 循环创建多个同心椭圆
      circleParams.forEach(params => {
        const ellipse = new Cesium.Entity({
          position: position,
          name: "面几何对象",
          ellipse: {
            semiMinorAxis: params.semiMinorAxis,
            semiMajorAxis: params.semiMajorAxis,
            extrudedHeight: params.extrudedHeight,
            material: Cesium.Color.RED.withAlpha(params.alpha),
            outline: false,
            outlineColor: Cesium.Color.BLUE,
            rotation: Cesium.Math.toRadians(0)
          }
        });

        entities.push(this.viewer.entities.add(ellipse));
      });

      return entities; // 返回创建的所有实体，方便后续操作
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
  beforeDestroy() {
    // this.stopDebrisFlow();
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
  margin: auto;
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
  /*margin-bottom: 10px;*/
  cursor: pointer;
  border-radius: 4px;
  margin: auto;
}

</style>
