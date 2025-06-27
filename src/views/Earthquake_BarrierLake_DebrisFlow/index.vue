<template>
  <div id="cesiumContainer">
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
            <el-button type="primary"
                       :disabled="isButtonDisabled"
                       @click="handleDraw('AddHypocenter')">
              {{ buttonText }}
            </el-button>
            <el-button type="primary" @click="toggleHazardSource()">
              {{ showHazardSource ? '隐藏隐患点' : '显示隐患点' }}
            </el-button>
            <!--          <el-button type="primary" @click="draw('point')">绘制点</el-button>-->
            <!--          <el-button type="primary" @click="draw('polyline')">绘制线</el-button>-->
            <!--          <el-button type="primary" @click="draw('polygon')">绘制面</el-button>-->
            <el-button type="primary" @click="clearDrawEntities">清空</el-button>
          </div>
        </el-col>
      </el-row>
    </div>
    <div class="legend">
      <div class="legend-title">图例</div>
      <div class="legend-item"><span class="legend-color" style="background: rgba(246,5,5,0.5);"></span>Ⅻ度</div>
      <div class="legend-item"><span class="legend-color" style="background: rgba(231,7,7,0.4);"></span>Ⅺ度</div>
      <div class="legend-item"><span class="legend-color" style="background: rgba(182,37,37,0.4);"></span>Ⅹ度</div>
      <div class="legend-item"><span class="legend-color" style="background: rgba(255, 215, 0, 0.3);"></span>Ⅸ度</div>
      <div class="legend-item"><span class="legend-color" style="background: rgba(0, 128, 0, 0.25);"></span>Ⅷ度</div>
      <div class="legend-item"><span class="legend-color" style="background: rgba(0, 0, 255, 0.2);"></span> Ⅶ度</div>
      <div class="legend-item"><span class="legend-color" style="background: rgba(75, 0, 130, 0.15);"></span>Ⅵ度</div>
      <div class="legend-item"><span class="legend-color" style="background: #ff0000;"></span> 地震点</div>
      <div class="legend-item"><span class="legend-color" style="background: #ff0000;"></span> 断裂带</div>
      <div class="legend-item"><span class="legend-color" style="background: #ff0000;"></span> 滑坡点</div>
      <div class="legend-item"><span class="legend-color" style="background: #ffea00;"></span> 泥石流点</div>
      <!--    <div class="legend-item"><span class="legend-color" style="background: #15a151;"></span> 隐患点</div>-->
      <div class="legend-item">
        <span class="legend-color"
              style="background-image: url('./src/assets/images/landslide.png'); background-size: cover;"></span>
        隐患点
      </div>
    </div>
  </div>

</template>

<script>
import * as Cesium from "cesium";
import "cesium/Source/Widgets/widgets.css";
import lineData from "@/assets/西安断层数据.json";
import DebrisFlow from "@/assets/西安泥石流灾害点.json"
import landslideIcon from "@/assets/images/landslide.png"
import {renderList} from "vue";

export default {
  name: "index",
  data() {
    return {
      viewer: null,
      tdtToken: "07f071d2d20098468ee7697112e8fc58",//天地图密钥
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
      line_data: [], // 西安所有断裂带的数据
      FaultZone: [], // 西安所有断裂带点的数据
      showFaultZone: false,  // 控制断裂带显示状态的变量
      DebrisFlow: DebrisFlow, // 泥石流隐患点
      HazardPoint: [], // 泥石流隐患点数组
      showHazardSource: false,  // 控制隐患点显示状态的变量
      hasDrawn: false, // 标记是否已经点击过
      isButtonDisabled: false,
      buttonText: '添加震源',
      operationCompleted: false
    };
  },
  mounted() {
    this.init();
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
    handleDraw(action) {
      if (this.isButtonDisabled) return;

      this.isButtonDisabled = true;
      this.buttonText = '震源添加中...';

      // 调用绘制方法
      this.draw('AddHypocenter').then(() => {
        this.buttonText = '已添加震源';
        this.operationCompleted = true;
        this.resetButton();
      }).catch(err => {
        console.error('绘制失败:', err);
        this.resetButton(); // 失败时重置按钮
      });
    },

    resetButton() {
      // 重置按钮状态，允许再次点击
      this.isButtonDisabled = false;
      this.buttonText = '添加震源';
      this.operationCompleted = false;
    },
    addTianDiTuLayers(type) {
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
    locatedXiAn() {
      //默认定位到西安
      const savedView = localStorage.getItem('mapView');
      if (savedView) {
        const {destination, orientation} = JSON.parse(savedView);
        this.viewer.camera.setView({destination, orientation});
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
        if (entities.name=="隐藏断裂带"){
          this.HideFaultZone();
        }
      }
    },
    toggleHazardSource() {
      this.showHazardSource = !this.showHazardSource;

      // 根据状态显示或隐藏隐患点
      if (this.showHazardSource) {
        // 显示隐患点的逻辑
        this.AddHazardSource();
      } else {
        // 隐藏断裂带的逻辑
        if (entities.name=="隐藏隐患点"){
          this.HideHazardSource();
        }
      }
    },
    AddFaultZone() {
      // console.log('显示断裂带');
      this.lineData.features.forEach(line => {
        this.line_data.push(line.geometry)
      })
      this.line_data.forEach(Lon_Lat => {
        this.FaultZone = []
        Lon_Lat.coordinates.forEach(LonLat => {
          LonLat.forEach(point => {
            this.FaultZone.push(Number(point))
          })
        })
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
    },
    AddHazardSource() {
      //添加隐患点
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
    HideFaultZone() {
      // console.log('隐藏断裂带');
      name: "隐藏断裂带";

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
    HideHazardSource() {
      name: "隐藏隐患点";
      // 清空数据数组
      this.HazardPoint = [];
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
          return new Promise((resolve, reject) => {
            // 你的绘制逻辑
            // 监听鼠标左键
            handler.setInputAction(function (movement) {
              // 从相机位置通过windowPosition 世界坐标中的像素创建一条射线。返回Cartesian3射线的位置和方向。
              let ray = viewer.camera.getPickRay(movement.position);
              // 查找射线与渲染的地球表面之间的交点。射线必须以世界坐标给出。返回Cartesian3对象
              position = viewer.scene.globe.pick(ray, viewer.scene);
              let point = that.drawHypocenter(position);
              // let circle = that.drawCircle(position);
              that.pointToLineDistance(position);
              // tempEntities.push(circle);
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
            setTimeout(() => {
              // 模拟绘制成功
            resolve();
            }, 1500);
          });
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
          handler.setInputAction(function (movement) {
              },
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
          handler.setInputAction(function (movement) {
              },
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
          depthTest: false, // 禁止深度测试
          scale: 0.8, // 缩放比例
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
        },
      });
    },
    pointToLineDistance(position) {
      /**
       * point:线外点 longitude latitude height
       * linePoint1, linePoint2：线的两个端点   longitude latitude height
       * return  距离（m）  point ：笛卡尔
       */
      let point = position;
      let min_line_distance = 1000000000;
      let min_line = null
      let des;
      //坐标系转换
      let ellipsoid = this.viewer.scene.globe.ellipsoid;
      let cartographic = ellipsoid.cartesianToCartographic(point);
      let latitude = Cesium.Math.toDegrees(cartographic.latitude);
      let longitude = Cesium.Math.toDegrees(cartographic.longitude);
      let height = cartographic.height;
      point = {x: longitude, y: latitude}
      // console.log(point,123,point)
      const distancePointToLine = (point, linePoint1, linePoint2) => {
        let p = Cesium.Cartesian3.fromDegrees(point.x, point.y)
        let a = Cesium.Cartesian3.fromDegrees(linePoint1[0], linePoint1[1])
        let b = Cesium.Cartesian3.fromDegrees(linePoint2[0], linePoint2[1])

        //向量ab
        let ab = new Cesium.Cartesian3()
        Cesium.Cartesian3.subtract(b, a, ab)

        //向量ap
        let ap = new Cesium.Cartesian3()
        Cesium.Cartesian3.subtract(p, a, ap)

        //向量ap在ab上的投影
        let abNormalized = new Cesium.Cartesian3()
        Cesium.Cartesian3.normalize(ab, abNormalized)
        let apProjectionMagnitude = Cesium.Cartesian3.dot(ap, abNormalized)
        let apProjection = Cesium.Cartesian3.multiplyByScalar(abNormalized, apProjectionMagnitude, new Cesium.Cartesian3())

        //ap在zb投影的垂足坐标
        let footPoint = new Cesium.Cartesian3()
        Cesium.Cartesian3.add(a, apProjection, footPoint)

        let distanceToA = Cesium.Cartesian3.distance(footPoint, a)
        let distanceToB = Cesium.Cartesian3.distance(footPoint, b)

        let distanceAB = Cesium.Cartesian3.distance(a, b)

        // 浮点数的精度有限，可能会存在微小的误差  因此认为距离差小于0.1 的在ab上
        if (Math.abs(distanceToA + distanceToB - distanceAB) < 0.1) {
          // console.log("footPoint在ab上")
          let distance = Cesium.Cartesian3.distance(footPoint, p)
          return {point: footPoint, distance: distance}
        } else {
          // console.log("footPoint在ab延长线上")
          if (distanceToA < distanceToB) {
            //a距离footPoint最近 返回端点a
            let distance = Cesium.Cartesian3.distance(a, p)
            return {point: a, distance: distance}
          } else {
            //b距离footPoint最近 返回端点b
            let distance = Cesium.Cartesian3.distance(b, p)
            return {point: b, distance: distance}
          }
        }
      }
      // 断裂带数据导入
      this.lineData.features.forEach(line => {
        this.line_data.push(line.geometry)
      })
      this.line_data.forEach(lonlat => {
        let min = 100000000000
        for (let i = 0; i < lonlat.coordinates.length - 1; i++) {
          let linePoint1 = lonlat.coordinates[i]
          let linePoint2 = lonlat.coordinates[i + 1]
          des = distancePointToLine(point, linePoint1, linePoint2).distance
          if (des <= min) {
            min = des;
          }
        }
        if (min < min_line_distance) {
          min_line_distance = min
          //把距离最近的断裂带数组传递给min_line
          min_line = lonlat
        }
      })
      // console.log(min_line_distance,min_line,"==================")
      let first_point = min_line.coordinates[0]
      let last_point = min_line.coordinates[min_line.coordinates.length - 1]
      //计算角度
      let bearing = this.calculateStrikeDirection(first_point[1], first_point[0], last_point[1], last_point[0])
      console.log(bearing, "==================")
      // 绘制椭圆
      let circle = this.DrawCircle(point, bearing, 6);
      this.tempEntities.push(circle)
    },
    calculateStrikeDirection(lon1, lat1, lon2, lat2) {
      // 计算角度，将角度转换为弧度
      const radLat1 = Cesium.Math.toRadians(lat1);
      const radLon1 = Cesium.Math.toRadians(lon1);
      const radLat2 = Cesium.Math.toRadians(lat2);
      const radLon2 = Cesium.Math.toRadians(lon2);

      // 计算经纬度差
      const dLon = radLon2 - radLon1;

      // 计算方位角
      const y = Math.sin(dLon) * Math.cos(radLat2);
      const x = Math.cos(radLat1) * Math.sin(radLat2) -
          Math.sin(radLat1) * Math.cos(radLat2) * Math.cos(dLon);

      // 计算角度并转换为0-360度范围
      let bearing = Cesium.Math.toDegrees(Math.atan2(y, x));
      bearing = (bearing + 360) % 360;

      return bearing;
    },
    drawCircle(point, bearing) {
      //绘制椭圆
      let position = point;//地震源位置
      let strikeDirection = bearing;//根据断裂带计算的角度
      const ellipseParams = [
        {semiMinorAxis: 11873, semiMajorAxis: 21968, extrudedHeight: 952, alpha: 0.3},
        {semiMinorAxis: 34567, semiMajorAxis: 45678, extrudedHeight: 4000, alpha: 0.2},
        {semiMinorAxis: 40568, semiMajorAxis: 95666, extrudedHeight: 6000, alpha: 0.1}
      ];
      // 存储所有创建的椭圆实体
      const entities = [];
      // 循环创建多个同心椭圆，长轴方向与断裂带走向一致
      ellipseParams.forEach(params => {
        // 将角度转换为弧度（Cesium使用弧度）
        const rotation = Cesium.Math.toRadians(strikeDirection);
        console.log(rotation)
        console.log(position)
        let ellipse = new Cesium.Entity({
          position: Cesium.Cartesian3.fromDegrees(position.x, position.y),
          name: "面几何对象",
          ellipse: {
            semiMinorAxis: params.semiMinorAxis,
            semiMajorAxis: params.semiMajorAxis,
            extrudedHeight: params.extrudedHeight,
            material: Cesium.Color.RED.withAlpha(params.alpha),
            outline: false,
            outlineColor: Cesium.Color.BLUE,
            rotation: rotation // 设置椭圆旋转角度
          }
        });
        this.viewer.entities.add(ellipse)
        // console.log(ellipse)
      });
    },
    draw_Circle(point, bearing, magnitude) {
      // 地震源位置
      let position = point;
      // 根据断裂带计算的角度
      let strikeDirection = bearing;

      // 根据震级计算椭圆参数的函数
      function calculateEllipseParams(magnitude) {
        // 基础大小参数，可根据实际需求调整
        const baseMinor = 5000;
        const baseMajor = 10000;
        const baseHeight = 1000;

        // 使用指数函数让椭圆大小随震级增长
        const scaleFactor = Math.pow(2, magnitude - 4);

        // 创建三组不同透明度的椭圆参数
        return [
          {
            semiMinorAxis: baseMinor * scaleFactor,
            semiMajorAxis: baseMajor * scaleFactor,
            extrudedHeight: baseHeight * scaleFactor,
            alpha: 0.3
          },
          {
            semiMinorAxis: baseMinor * scaleFactor * 1.5,
            semiMajorAxis: baseMajor * scaleFactor * 1.5,
            extrudedHeight: baseHeight * scaleFactor * 2,
            alpha: 0.2
          },
          {
            semiMinorAxis: baseMinor * scaleFactor * 2,
            semiMajorAxis: baseMajor * scaleFactor * 3,
            extrudedHeight: baseHeight * scaleFactor * 3,
            alpha: 0.1
          }
        ];
      }

      // 根据震级计算椭圆参数
      const ellipseParams = calculateEllipseParams(magnitude);

      // 存储所有创建的椭圆实体
      const entities = [];

      // 循环创建多个同心椭圆，长轴方向与断裂带走向一致
      ellipseParams.forEach(params => {
        // 将角度转换为弧度（Cesium使用弧度）
        const rotation = Cesium.Math.toRadians(strikeDirection);

        let ellipse = new Cesium.Entity({
          position: Cesium.Cartesian3.fromDegrees(position.x, position.y),
          name: "面几何对象",
          ellipse: {
            semiMinorAxis: params.semiMinorAxis,
            semiMajorAxis: params.semiMajorAxis,
            extrudedHeight: params.extrudedHeight,
            material: Cesium.Color.RED.withAlpha(params.alpha),
            outline: false,
            outlineColor: Cesium.Color.BLUE,
            rotation: rotation // 设置椭圆旋转角度
          }
        });

        this.viewer.entities.add(ellipse);
        entities.push(ellipse); // 将实体添加到返回数组
      });

      return entities; // 返回创建的所有椭圆实体
    },
    DrawCircle(point, bearing, magnitude) {
      // 地震源位置
      let position = point;
      // 根据断裂带计算的角度
      let strikeDirection = bearing;

      // 根据震级计算椭圆参数
      const ellipseParams = this.calculateEllipseParams(magnitude);

      // 存储所有创建的椭圆实体
      // const entities = [];

      // 循环创建多个同心椭圆，长轴方向与断裂带走向一致
      ellipseParams.forEach(params => {
        // 将角度转换为弧度（Cesium使用弧度）
        const rotation = Cesium.Math.toRadians(strikeDirection);

        let ellipse = new Cesium.Entity({
          position: Cesium.Cartesian3.fromDegrees(position.x, position.y),
          name: "面几何对象",
          ellipse: {
            semiMinorAxis: params.semiMinorAxis,
            semiMajorAxis: params.semiMajorAxis,
            //extrudedHeight: params.extrudedHeight,
            material: Cesium.Color.RED.withAlpha(params.alpha),
            outline: false,
            outlineColor: Cesium.Color.BLUE,
            rotation: rotation // 设置椭圆旋转角度
          }
        });
        this.viewer.entities.add(ellipse);
        // entities.push(ellipse); // 将实体添加到返回数组
      });

      // return entities; // 返回创建的所有椭圆实体
    },
    clearDrawEntities() {
      //清除所有实体
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
    addVuex() {
    },
    calculateRa(M, Ia) {
      const a = (Math.pow(10, (4.0293 + 1.3003 * M - Ia) / 3.6404) - 10) * 27;
      console.log(a, "=============================")
      return a;
    },
    calculateRb(M, Ib) {
      const b = (Math.pow(10, (2.3816 + 1.3003 * M - Ib) / 2.8573) - 5) * 27;
      console.log(b, "=============================")

      return b;
    },
    // 根据震级和烈度计算椭圆参数的函数
    calculateEllipseParams(magnitude) {
      // 定义不同层级的烈度值
      const intensityLevels = [
        {ia: 6, ib: 6},  // 内层椭圆：较高烈度
        {ia: 7, ib: 7},  // 中层椭圆：中等烈度
        {ia: 8, ib: 8}   // 外层椭圆：较低烈度
      ];

      // 存储计算出的椭圆参数
      const params = intensityLevels.map(level => {
        // 使用提供的公式计算长短轴
        const semiMajorAxis = this.calculateRa(magnitude, level.ia);

        const semiMinorAxis= this.calculateRb(magnitude, level.ia);

        // 根据烈度级别设置透明度
        const alpha = 0.5 - (level.ia - 5) * 0.1;

        // 计算 extrusion height，使较大的椭圆有更高的 extrusion
        // const extrudedHeight = semiMajorAxis * 0.15;

        return {
          semiMinorAxis,
          semiMajorAxis,
          // extrudedHeight,
          alpha
        };
      });

      console.log("paramas:===================>", params);

      return params;
    },
  },
  beforeDestroy() {
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

.text {
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