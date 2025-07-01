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

            <el-button class="earthquake-btn" @click="toggleEarthquakeMode()">
              {{ earthquakeMode ? '取消地震模拟' : '地震模拟' }}
            </el-button>

            <el-button type="primary" @click="toggleHiddenDangerPoints()">
              {{ showHiddenDangerPoints ? '隐藏隐患点' : '显示隐患点' }}
            </el-button>
            <el-button type="primary" @click="draw('point')">添加危险源</el-button>
            <el-button type="primary" @click="toggleRiskArea()">
              {{ showriskArea ? '隐藏风险区' : '显示风险区' }}
            </el-button>
            <!--          <el-button type="primary" @click="draw('polygon')">绘制面</el-button>-->
            <el-button type="primary" @click="clearDrawEntities">清空</el-button>
<!--            <div class="SearchEarth">-->
              <el-select
                  v-model="eqlistName"
                  placeholder="请选择地震信息"
                  size="large"
                  style="width: 350px"
                  filterable
              >
<!--                <el-option-->
<!--                    v-for="item in tableNameOptions"-->
<!--                    :key="item.value"-->
<!--                    :label="item.label"-->
<!--                    :value="item.value"-->
<!--                    @click="handleEqListChange"-->
<!--                />-->
              </el-select>
<!--            </div>-->
          </div>
        </el-col>
      </el-row>
    </div>

    <div v-if="showInfoPanel" class="earthquake-info-panel">
      <div class="panel-title">地震信息</div>
      <div class="panel-content">
        <div>震级: <input v-model.number="this.magnitude" type="number" min="0" max="10" step="0.1" /> ms</div>
        <div>深度: <input v-model.number="depth" type="number" min="0" max="1000" step="1" /> km</div>
        <div>震中位置:</div>
        <div> {{ selectedPosition ? `北纬:${selectedPosition.latitude.toFixed(4)}, 东经:${selectedPosition.longitude.toFixed(4)}` : '' }}</div>
        <el-row type="flex" :gutter="36">
          <el-col :span="24">
          <button @click="confirm_Earthquake">确认添加</button>
          <button @click="cancel_Earthquake">取消</button>
          </el-col>
        </el-row>
      </div>
    </div>


    <div class="legend">
      <div class="legend-title">图例</div>
      <div class="legend-item"><span class="legend-color" style="background: rgba(246,5,5,0.5);"></span>Ⅻ度</div>
      <div class="legend-item"><span class="legend-color" style="background: rgba(231,7,7,0.4);"></span>Ⅺ度</div>
      <div class="legend-item"><span class="legend-color" style="background: rgba(182,37,37,0.4);"></span>Ⅹ度</div>
<!--      <div class="legend-item"><span class="legend-color" style="background: rgba(255, 215, 0, 0.3);"></span>Ⅸ度</div>-->
<!--      <div class="legend-item"><span class="legend-color" style="background: rgba(0, 128, 0, 0.25);"></span>Ⅷ度</div>-->
<!--      <div class="legend-item"><span class="legend-color" style="background: rgba(0, 0, 255, 0.2);"></span> Ⅶ度</div>-->
<!--      <div class="legend-item"><span class="legend-color" style="background: rgba(75, 0, 130, 0.15);"></span>Ⅵ度</div>-->
      <div class="legend-item"><span class="legend-circle" style="background: yellow;"></span> 震源</div>
      <div class="legend-item"><span class="legend-line" style="background: #ff0000;"></span>断裂带</div>
      <div class="legend-item"><span class="legend-circle" style="background: #ff0000;"></span> 危险源</div>
      <div class="legend-item">
        <div class="legend-icon" id="yhdlen"></div>
        隐患点
      </div>
      <div class="legend-item">
        <div class="legend-icon" id="risk_area"></div>
        风险区
      </div>
    </div>

  </div>
</template>

<script>
import * as Cesium from "cesium";
import "cesium/Source/Widgets/widgets.css";
import lineData from "@/assets/西安断层数据.json";
import DebrisFlow from "@/assets/static/disaster/Huapo.json"
import landslideIcon from "@/assets/images/landslide.png"
import riskArea from "@/assets/static/disaster/xian_risk.json"
import riskAreaIcon from "@/assets/images/riskArea.png"
import CesiumNavigation from "cesium-navigation-es6";

export default {
  name: "index",
  data() {
    return {
      image_landslideIcon:landslideIcon,
      viewer: null,
      handler: null, // 创建共享的 handler
      tdtToken: "07f071d2d20098468ee7697112e8fc58",//天地图密钥
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
      riskArea: riskArea, // 泥石流风险区
      HazardPoint: [], // 泥石流隐患点数组
      riskZone: [], // 风险区数组
      showHiddenDangerPoints: false,  // 控制隐患点显示状态的变量
      showriskArea: false, //控制风险区显示的变量
      hasDrawn: false, // 标记是否已经点击过
      isButtonDisabled: false,
      buttonText: '地震模拟',
      operationCompleted: false,
      FaultZone_entities: [],//断裂带实体数组
      HiddenDangerPoints_entities: [],//隐患点实体数组
      riskArea_entities: [],//风险区实体数组
      dialogVisible: false,
      showInfoPanel: false,
      magnitude: 6.0,
      depth: 10,
      selectedPosition: null,
      earthquakeMode: false,
      bearing: 0,//烈度圈偏转角度
      earthPoint:null,//地震点
      eqlistName: '',

    };
  },
  mounted() {
    this.init();
    this.AddCompass();
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

    AddCompass(){
      //添加罗盘功能
      const options = {};

      options.defaultResetView = Cesium.Cartographic.fromDegrees(108.948024, 34.263161, 40000.0);
      // 相机方向
      // options.orientation = {
      //   pitch: Cesium.Math.toRadians(-45)
      // };
      // 相机延时
      // options.duration = 4; // 默认为3s

      // 用于启用或禁用罗盘。true是启用罗盘，false是禁用罗盘。默认值为true。如果将选项设置为false，则罗盘将不会添加到地图中。
      options.enableCompass = true;
      // 用于启用或禁用缩放控件。true是启用，false是禁用。默认值为true。如果将选项设置为false，则缩放控件将不会添加到地图中。
      options.enableZoomControls = true;
      // 用于启用或禁用距离图例。true是启用，false是禁用。默认值为true。如果将选项设置为false，距离图例将不会添加到地图中。
      options.enableDistanceLegend = true;
      // 用于启用或禁用指南针外环。true是启用，false是禁用。默认值为true。如果将选项设置为false，则该环将可见但无效。
      options.enableCompassOuterRing = true;

      // 修改重置视图的tooltip
      options.resetTooltip = "重置视图";
      // 修改放大按钮的tooltip
      options.zoomInTooltip = "放大";
      // 修改缩小按钮的tooltip
      options.zoomOutTooltip = "缩小";

      new CesiumNavigation(this.viewer, options);
    },

    toggleEarthquakeMode() {
      this.earthquakeMode = !this.earthquakeMode;

      if (this.earthquakeMode) {
        // 进入地震模式
        this.setup_ClickHandler();
        // document.body.style.cursor = 'crosshair';//改变鼠标样式
        console.log("地震模式已激活");
      } else {
        // 退出地震模式
        this.remove_ClickHandler();
        // document.body.style.cursor = '';
        this.showInfoPanel = false;
        // this.showInfoPanel = !this.showInfoPanel;
        console.log("地震模式已取消");
      }
    },

    setup_ClickHandler() {
      if (this.handler) {
        this.handler.destroy();
      }
      this.handler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);
      this.handler.setInputAction((movement) => {
        this.earthPoint = this.get_ClickedPosition(movement.position);
        if (this.earthPoint) {
          this.selectedPosition = this.earthPoint;
          this.showInfoPanel = true;
          console.log("位置已选择:", this.earthPoint);
        }
      }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
    },

    get_ClickedPosition(screenPosition) {
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

    cancel_Earthquake() {
      this.showInfoPanel = false;
      this.earthquakeMode = false;
      this.remove_ClickHandler();
      document.body.style.cursor = '';
    },

    confirm_Earthquake() {
      let position = this.earthPoint;
      // console.log(this.earthPoint,"==============================")
      // if (!this.selectedPosition) return;
      // 清除现有烈度圈
      // this.clearIntensityCircles();
      this.drawHypocenter(position);
      this.pointToLineDistance(position);

      // 创建地震点
      // const entity = this.createEarthquakeEntity();
      // this.earthquakeEntities.push(entity);
      // // 绘制烈度圈
      // this.drawIntensityCircles();
      // 重置状态
      this.showInfoPanel = false;
      this.earthquakeMode = false;
      this.remove_ClickHandler();
      // document.body.style.cursor = '';
      // 飞行到震中
      // this.flyToEarthquake(entity);
    },

    remove_ClickHandler() {
      if (this.handler) {
        this.handler.destroy();
        this.handler = null;
      }
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

    toggleHiddenDangerPoints() {
      this.showHiddenDangerPoints = !this.showHiddenDangerPoints;

      // 根据状态显示或隐藏隐患点
      if (this.showHiddenDangerPoints) {
        // 显示隐患点的逻辑
        this.AddHiddenDangerPoints();
      } else {
        // 隐藏隐患点的逻辑

          this.HideHiddenDangerPoints();
      }
    },

    toggleRiskArea(){
      this.showriskArea = !this.showriskArea;
      // 根据状态显示或隐藏风险区
      if (this.showriskArea) {
        // 显示风险区的逻辑
        this.Addriskzone();
      } else {
        // 隐藏风险区的逻辑

        this.Hideriskzone();
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
        let f = this.viewer.entities.add({
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
        this.FaultZone_entities.push(f);
      })
    },

    AddHiddenDangerPoints() {
      //添加隐患点
      let pointInfo;
      this.DebrisFlow.features.forEach(hazard_source => {
        this.HazardPoint.push(hazard_source.geometry)

        // 存储点的详细信息（从原始数据中提取）
        pointInfo = {
          name: hazard_source.properties.disasterName || "灾害点名称",
          lon: hazard_source.properties.lon || "经度",
          lat: hazard_source.properties.lat || "纬度",
          // description: hazard_source.properties.description || '无描述信息'
          // 可根据实际数据结构添加更多字段
        };
        // console.log(pointInfo,"===================")
        this.HazardPoint.forEach(hazard_point => {
          let lon = hazard_point.coordinates[0]
          let lat = hazard_point.coordinates[1]
          let a = this.viewer.entities.add({
            position: Cesium.Cartesian3.fromDegrees(lon, lat),
            billboard: {
              // 图像地址，URI或Canvas的属性   @/assets/images/landslide.png
              image: landslideIcon,
              width: 60, // 图片宽度,单位px
              height: 60, // 图片高度，单位px
              eyeOffset: new Cesium.Cartesian3(0, 0, 0), // 与坐标位置的偏移距离
              color: Cesium.Color.WHITE.withAlpha(1), // 固定颜色
              scale: 0.8, // 缩放比例
              heightReference: Cesium.HeightReference.CLAMP_TO_GROUND, // 绑定到地形高度
              scaleByDistance: new Cesium.NearFarScalar(500, 1, 5e5, 0.1),
              depthTest: false, // 禁止深度测试
              disableDepthTestDistance: Number.POSITIVE_INFINITY, // 不进行深度测试
              show: true
            },
            // 绑定自定义数据，用于点击时获取信息
            userData: {
              type: 'hiddenDangerPoint',
              info: pointInfo,
              originalPosition: { lon, lat } // 保存原始经纬度
            }
          });
          this.HiddenDangerPoints_entities.push(a);
        })

      })

      // 设置点击事件处理
      this.setupEntityClickHandler();
    },

    setupEntityClickHandler() {
      // 清除旧的事件处理程序
      if (this.entityClickHandler) {
        this.entityClickHandler.destroy();
      }

      // 添加新的事件处理程序
      this.entityClickHandler = new Cesium.ScreenSpaceEventHandler(this.viewer.canvas);
      this.entityClickHandler.setInputAction((click) => {
        // 清除现有信息窗口
        const existingWindows = document.querySelectorAll('.cesium-info-window');
        existingWindows.forEach(win => win.remove());
        // 获取点击位置的实体
        const pickedObject = this.viewer.scene.pick(click.position);

        if (pickedObject && Cesium.defined(pickedObject.id)) {
          const entity = pickedObject.id;
          if (entity.userData && entity.userData.type === 'hiddenDangerPoint') {

            //屏幕坐标转世界坐标
            let cartesian = this.viewer.scene.globe.pick(this.viewer.camera.getPickRay(click.position),this.viewer.scene);
            //世界坐标转经纬度
            let ellipsoid=this.viewer.scene.globe.ellipsoid;
            let cartographic=ellipsoid.cartesianToCartographic(cartesian);
            let lat=Cesium.Math.toDegrees(cartographic.latitude);
            let lon=Cesium.Math.toDegrees(cartographic.longitude);
            this.viewer.camera.flyTo({
              destination: Cesium.Cartesian3.fromDegrees(lon, lat, 5000),
              orientation: {
                // 指向
                heading: 6.283185307179581,
                // 视角
                pitch: -1.5688168484696687,
                roll: 0.0
              },
              duration: 1.0, // 设置飞行持续时间为1秒（默认约3秒）
              complete: () => {
                // 飞行完成后显示信息窗口
                this.showInfoList(entity.userData.info,entity);
              }

            });
          }
        }
      }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
    },

    showInfoList(info,entity) {
      // 清除现有信息窗口
      const existingWindows = document.querySelectorAll('.cesium-info-window');
      existingWindows.forEach(win => win.remove());


      // 获取实体位置的屏幕坐标
      const position = entity.position.getValue(this.viewer.clock.currentTime);
      const canvasPosition = this.viewer.scene.cartesianToCanvasCoordinates(position);
      if (!canvasPosition) return; // 位置不可见时返回

      // 创建信息列表DOM（可替换为框架组件）
      const container = document.createElement('div');
      container.className = 'cesium-info-window';

      // 计算窗口位置（基于屏幕坐标偏移）
      const left = canvasPosition.x + 20; // 右侧显示
      const top = canvasPosition.y - 100; // 垂直居中

      container.style.cssText = `
        position: absolute;
        left: ${left}px;
        top: ${top-10}px;
        width: 300px;
        background: white;
        border-radius: 4px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        padding: 15px;
        z-index: 1000;
        max-height: 200px;
        overflow-y: auto;

      `;

      // 构建信息列表内容
      if (entity.userData.type == 'hiddenDangerPoint'){
        container.innerHTML = `
    <div style="font-weight: bold; font-size: 16px; margin-bottom: 10px;">灾害信息</div>
    <div style="margin-bottom: 5px;"><span style="color: #666;">名字:</span> ${info.name}</div>
    <div style="margin-bottom: 5px;"><span style="color: #666;">经度:</span> ${info.lon}</div>
    <div style="margin-bottom: 10px;"><span style="color: #666;">纬度:</span> ${info.lat}</div>
    <button onclick="this.parentNode.remove()" style="background: #f0f0f0; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer;">关闭</button>
  `;
      }
      else if (entity.userData.type == 'riskArea'){
        container.innerHTML = `
<!--    <div style="font-weight: bold; font-size: 16px; margin-bottom: 10px;">风险区信息</div>-->
    <div style="margin-bottom: 5px;"><span style="color: #666;">风险区名称:</span> ${info.name}</div>
    <div style="margin-bottom: 5px;"><span style="color: #666;">风险区经度:</span> 北纬${info.lon}</div>
    <div style="margin-bottom: 5px;"><span style="color: #666;">风险区纬度:</span> 东经${info.lat}</div>
    <div style="margin-bottom: 5px;"><span style="color: #666;">风险区面积:</span> ${parseFloat(info.area_Km2).toFixed(3)}平方米</div>
    <button onclick="this.parentNode.remove()" style="background: #f0f0f0; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer;">关闭</button>
  `;
      }


      // 添加到页面
      document.body.appendChild(container);
      // 检查是否超出视口边界并调整位置
      this.adjustWindowPosition(container);
      // this.currentInfoWindow = {
      //   element: container,
      //   initialLeft: left,
      //   initialTop: top,
      //   entityId: entity.id
      // };
    },

    adjustWindowPosition(container) {
      const rect = container.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      // 右侧溢出时调整
      if (rect.right > viewportWidth) {
        container.style.left = `${parseInt(container.style.left) - (rect.right - viewportWidth + 20)}px`;
      }

      // 底部溢出时调整
      if (rect.bottom > viewportHeight) {
        container.style.top = `${parseInt(container.style.top) - (rect.bottom - viewportHeight + 20)}px`;
      }

      // 顶部溢出时调整
      if (rect.top < 0) {
        container.style.top = '20px';
      }
    },

    Addriskzone() {
      let riskAreaInfo;
      //添加风险区
      this.riskArea.features.forEach(hazard_source => {
        this.riskZone.push(hazard_source.geometry)

        // 存储点的详细信息（从原始数据中提取）
        riskAreaInfo = {
          name: hazard_source.properties.position || "风险区名称",
          lon: hazard_source.properties.lon || "经度",
          lat: hazard_source.properties.lat || "纬度",
          area_Km2: hazard_source.properties.area || "风险区面积",
          // grade: hazard_source.properties.grade || "风险等级",
          // description: hazard_source.properties.description || '无描述信息'
          // 可根据实际数据结构添加更多字段
        };

        // console.log(riskAreaInfo,"====================================")

      })
      this.riskZone.forEach(hazard_point => {
        let lon = hazard_point.coordinates[0]
        let lat = hazard_point.coordinates[1]
        let a = this.viewer.entities.add({
          position: Cesium.Cartesian3.fromDegrees(lon, lat),
          billboard: {
            // 图像地址，URI或Canvas的属性   @/assets/images/landslide.png
            image: riskAreaIcon,
            width: 60, // 图片宽度,单位px
            height: 60, // 图片高度，单位px
            eyeOffset: new Cesium.Cartesian3(0, 0, 0), // 与坐标位置的偏移距离
            color: Cesium.Color.WHITE.withAlpha(1), // 固定颜色
            scale: 0.8, // 缩放比例
            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND, // 绑定到地形高度
            scaleByDistance: new Cesium.NearFarScalar(500, 1, 5e5, 0.1),
            depthTest: false, // 禁止深度测试
            disableDepthTestDistance: Number.POSITIVE_INFINITY, // 不进行深度测试
            show: true
          },
          // 绑定自定义数据，用于点击时获取信息
          userData: {
            type: 'riskArea',
            info: riskAreaInfo,
            originalPosition: { lon, lat } // 保存原始经纬度
          }
        });
        this.riskArea_entities.push(a);
      })

      // 设置点击事件处理
      this.setupEntityClickRiskArea();

    },

    setupEntityClickRiskArea() {
      // 清除旧的事件处理程序
      if (this.entityClickHandler) {
        this.entityClickHandler.destroy();
      }

      // 添加新的事件处理程序
      this.entityClickHandler = new Cesium.ScreenSpaceEventHandler(this.viewer.canvas);
      this.entityClickHandler.setInputAction((click) => {
        // 清除现有信息窗口
        const existingWindows = document.querySelectorAll('.cesium-info-window');
        existingWindows.forEach(win => win.remove());
        // 获取点击位置的实体
        const pickedObject = this.viewer.scene.pick(click.position);

        if (pickedObject && Cesium.defined(pickedObject.id)) {
          const entity = pickedObject.id;
          if (entity.userData && entity.userData.type === 'riskArea') {

            // //屏幕坐标转世界坐标
            // let cartesian = this.viewer.scene.globe.pick(this.viewer.camera.getPickRay(click.position),this.viewer.scene);
            // //世界坐标转经纬度
            // let ellipsoid=this.viewer.scene.globe.ellipsoid;
            // let cartographic=ellipsoid.cartesianToCartographic(cartesian);
            // let lat=Cesium.Math.toDegrees(cartographic.latitude);
            // let lon=Cesium.Math.toDegrees(cartographic.longitude);
            this.viewer.camera.flyTo({
              destination: Cesium.Cartesian3.fromDegrees(entity.userData.originalPosition.lon, entity.userData.originalPosition.lat, 5000),
              orientation: {
                // 指向
                heading: 6.283185307179581,
                // 视角
                pitch: -1.5688168484696687,
                roll: 0.0
              },
              duration: 1.0, // 设置飞行持续时间为1秒（默认约3秒）
              complete: () => {
                // 飞行完成后显示信息窗口
                this.showInfoList(entity.userData.info,entity);
              }

            });
          }
        }
      }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
    },

    HideFaultZone() {
      // console.log('隐藏断裂带');

      // 清空数据数组
      this.line_data = [];
      this.FaultZone = [];


      // 移除所有断裂带实体
      // const entities = this.viewer.entities.values;
      for (let i = 0; i <this.FaultZone_entities.length; i++) {
        // const entity = entities[i];
        // if (entity.polyline && entity.polyline.material instanceof Cesium.Color &&
        //     entity.polyline.material.color.equals(Cesium.Color.RED)) {
        this.viewer.entities.remove(this.FaultZone_entities[i]);
        // }
      }
    },

    HideHiddenDangerPoints() {
      // 清空数据数组
      this.HazardPoint = [];
      // 移除所有断裂带实体

      for (let i = 0; i < this.HiddenDangerPoints_entities.length; i++) {

        this.viewer.entities.remove(this.HiddenDangerPoints_entities[i]);
         }

    },

    Hideriskzone(){
      //隐藏风险区
      this.riskZone=[];

      // 移除所有断裂带实体
      for (let i = 0; i < this.riskArea_entities.length; i++) {
        this.viewer.entities.remove(this.riskArea_entities[i]);
      }
    },

    draw(type) {
      let that = this;
      let viewer = this.mapViewer;
      let tempEntities = this.tempEntities;
      let position = [];
      let tempPoints = [];
      // 开启深度检测
      viewer.scene.globe.depthTestAgainstTerrain = true;
      if (that.handler) {
        that.handler.destroy();
      }
      this.handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
      switch (type) {
        // case "AddHypocenter":
        //     // 监听鼠标左键
        //   this.handler.setInputAction(movement => {
        //     // 从相机位置通过windowPosition 世界坐标中的像素创建一条射线。返回Cartesian3射线的位置和方向。
        //     let ray = viewer.camera.getPickRay(movement.position);
        //     // 查找射线与渲染的地球表面之间的交点。射线必须以世界坐标给出。返回Cartesian3对象
        //     position = viewer.scene.globe.pick(ray, viewer.scene);
        //     if (position) {
        //       this.selectedPosition = position;
        //       this.showInfoPanel = true;
        //       // console.log(this.showInfoPanel)
        //       that.pointToLineDistance(position);
        //       // console.log("位置已选择:", position);
        //     }
        //     let Hypo = that.drawHypocenter(position);
        //     tempEntities.push(Hypo);
        //     // 绘制完成后立即停止监听
        //     this.handler.destroy();
        //     this.handler = null;
        //   }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
        //
        //     // 双击或右键点击仍可停止绘制
        //   this.handler.setInputAction(function () {
        //     this.handler.destroy();
        //     this. handler = null;
        //     }, Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
        //
        //   this. handler.setInputAction(function () {
        //     this.handler.destroy();
        //     this.handler = null;
        //     }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
        //   break;
        case "point":
          // 监听鼠标左键
          this.handler.setInputAction(function (movement) {
            // 从相机位置通过windowPosition 世界坐标中的像素创建一条射线。返回Cartesian3射线的位置和方向。
            let ray = viewer.camera.getPickRay(movement.position);
            // 查找射线与渲染的地球表面之间的交点。射线必须以世界坐标给出。返回Cartesian3对象
            position = viewer.scene.globe.pick(ray, viewer.scene);
            let point = that.drawPoint(position);
            tempEntities.push(point);
            that.handler.destroy();
            that.handler = null;
          }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
          // 左键双击停止绘制
          that.handler.setInputAction(function () {
            that.handler.destroy(); //关闭事件句柄
            that.handler = null;
          }, Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
          // 右击单击停止绘制
          that.handler.setInputAction(function () {
            that.handler.destroy(); //关闭事件句柄
            that.handler = null;
          }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
          break;
        case "polyline":
          //鼠标移动事件
          this.handler.setInputAction(function (movement) {
              },
              Cesium.ScreenSpaceEventType.MOUSE_MOVE);
          //左键点击操作
          this.handler.setInputAction(function (click) {
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
          this.handler.setInputAction(function (click) {
            tempPoints = [];
            this.handler.destroy(); //关闭事件句柄
            this.handler = null;
          }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
          break;
        case "polygon":
          //鼠标移动事件
          this.handler.setInputAction(function (movement) {
              },
              Cesium.ScreenSpaceEventType.MOUSE_MOVE);
          //左键点击操作
          this.handler.setInputAction(function (click) {
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
          this.handler.setInputAction(function (click) {
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
                this.handler.destroy(); //关闭事件句柄
                this.handler = null;
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
          pixelSize: 5,
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

    drawHypocenter(position) {
      // let config_ = config ? config : {};
      // console.log("123313132131",position)
      this.viewer.entities.add({
        name: "点几何对象",
        //输入笛卡尔坐标系
        position: position.cartesian,
        point: {
          color: Cesium.Color.YELLOW,
          pixelSize: 20,
          outlineColor: Cesium.Color.YELLOW,
          outlineWidth: 3,
          depthTest: false, // 禁止深度测试
          scale: 0.8, // 缩放比例
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
          scaleByDistance: new Cesium.NearFarScalar(500, 1, 5e5, 0.1),
        },
      });
    },

    pointToLineDistance(position) {
      /**
       * point:线外点 longitude latitude height
       * linePoint1, linePoint2：线的两个端点   longitude latitude height
       * return  距离（m）  point ：笛卡尔
       */
      let point = position.cartesian;
      let min_line_distance = 1000000000;
      let min_line = null
      let des;
      let magnitude = this.magnitude;
      let bearing = this.bearing;
      //坐标系转换
      let ellipsoid = this.viewer.scene.globe.ellipsoid;
      let cartographic = ellipsoid.cartesianToCartographic(point);
      let latitude = Cesium.Math.toDegrees(cartographic.latitude);
      let longitude = Cesium.Math.toDegrees(cartographic.longitude);
      // let height = cartographic.height;
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
      //测试用
      // this.viewer.entities.add({
      //   position: Cesium.Cartesian3.fromDegrees(first_point[0],first_point[1]),
      //   point: {
      //     color: Cesium.Color.YELLOW,
      //     pixelSize: 10,
      //     outlineColor: Cesium.Color.YELLOW,
      //     outlineWidth: 3,
      //     disableDepthTestDistance: Number.POSITIVE_INFINITY,
      //     heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
      //   },
      // });
      // this.viewer.entities.add({
      //   position: Cesium.Cartesian3.fromDegrees(last_point[0],last_point[1]),
      //   point: {
      //     color: Cesium.Color.RED,
      //     pixelSize: 10,
      //     outlineColor: Cesium.Color.RED,
      //     outlineWidth: 3,
      //     disableDepthTestDistance: Number.POSITIVE_INFINITY,
      //     heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
      //   },
      // });

      //计算角度
      // this.bearing = this.calculateStrikeDirection(last_point[1], last_point[0], first_point[1], first_point[0])
      bearing = this.calculateStrikeDirection(first_point[0], first_point[1], last_point[0], last_point[1])

      // console.log(bearing, "==================")
      // // 绘制椭圆
      let circle = this.DrawCircle(point, bearing, magnitude);
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
      const x = Math.cos(radLat1) * Math.sin(radLat2) - Math.sin(radLat1) * Math.cos(radLat2) * Math.cos(dLon);

      // 计算角度并转换为0-360度范围
      let bearing = Cesium.Math.toDegrees(Math.atan2(y, x));
      bearing = (bearing + 360) % 360;

      return bearing;
    },

    // drawCircle(point, bearing) {
    //   //绘制椭圆
    //   let position = point;//地震源位置
    //   let strikeDirection = bearing;//根据断裂带计算的角度
    //   const ellipseParams = [
    //     {semiMinorAxis: 11873, semiMajorAxis: 21968, extrudedHeight: 952, alpha: 0.3},
    //     {semiMinorAxis: 34567, semiMajorAxis: 45678, extrudedHeight: 4000, alpha: 0.2},
    //     {semiMinorAxis: 40568, semiMajorAxis: 95666, extrudedHeight: 6000, alpha: 0.1}
    //   ];
    //   // 存储所有创建的椭圆实体
    //   const entities = [];
    //   // 循环创建多个同心椭圆，长轴方向与断裂带走向一致
    //   ellipseParams.forEach(params => {
    //     // 将角度转换为弧度（Cesium使用弧度）
    //     // const rotation = Cesium.Math.toRadians(strikeDirection);
    //     console.log(rotation)
    //     console.log(position)
    //     let ellipse = new Cesium.Entity({
    //       position: Cesium.Cartesian3.fromDegrees(position.x, position.y),
    //       name: "面几何对象",
    //       ellipse: {
    //         semiMinorAxis: params.semiMinorAxis,
    //         semiMajorAxis: params.semiMajorAxis,
    //         extrudedHeight: params.extrudedHeight,
    //         material: Cesium.Color.RED.withAlpha(params.alpha),
    //         outline: false,
    //         outlineColor: Cesium.Color.BLUE,
    //         rotation: rotation // 设置椭圆旋转角度
    //       }
    //     });
    //     this.viewer.entities.add(ellipse)
    //     // console.log(ellipse)
    //   });
    // },
    // draw_Circle(point, bearing, magnitude) {
    //   // 地震源位置
    //   let position = point;
    //   // 根据断裂带计算的角度
    //   let strikeDirection = bearing;
    //
    //   // 根据震级计算椭圆参数的函数
    //   function calculateEllipseParams(magnitude) {
    //     // 基础大小参数，可根据实际需求调整
    //     const baseMinor = 5000;
    //     const baseMajor = 10000;
    //     const baseHeight = 1000;
    //
    //     // 使用指数函数让椭圆大小随震级增长
    //     const scaleFactor = Math.pow(2, magnitude - 4);
    //
    //     // 创建三组不同透明度的椭圆参数
    //     return [
    //       {
    //         semiMinorAxis: baseMinor * scaleFactor,
    //         semiMajorAxis: baseMajor * scaleFactor,
    //         extrudedHeight: baseHeight * scaleFactor,
    //         alpha: 0.3
    //       },
    //       {
    //         semiMinorAxis: baseMinor * scaleFactor * 1.5,
    //         semiMajorAxis: baseMajor * scaleFactor * 1.5,
    //         extrudedHeight: baseHeight * scaleFactor * 2,
    //         alpha: 0.2
    //       },
    //       {
    //         semiMinorAxis: baseMinor * scaleFactor * 2,
    //         semiMajorAxis: baseMajor * scaleFactor * 3,
    //         extrudedHeight: baseHeight * scaleFactor * 3,
    //         alpha: 0.1
    //       }
    //     ];
    //   }
    //
    //   // 根据震级计算椭圆参数
    //   const ellipseParams = calculateEllipseParams(magnitude);
    //
    //   // 存储所有创建的椭圆实体
    //   const entities = [];
    //
    //   // 循环创建多个同心椭圆，长轴方向与断裂带走向一致
    //   ellipseParams.forEach(params => {
    //     // 将角度转换为弧度（Cesium使用弧度）
    //     const rotation = Cesium.Math.toRadians(strikeDirection);
    //
    //     let ellipse = new Cesium.Entity({
    //       position: Cesium.Cartesian3.fromDegrees(position.x, position.y),
    //       name: "面几何对象",
    //       ellipse: {
    //         semiMinorAxis: params.semiMinorAxis,
    //         semiMajorAxis: params.semiMajorAxis,
    //         extrudedHeight: params.extrudedHeight,
    //         material: Cesium.Color.RED.withAlpha(params.alpha),
    //         outline: false,
    //         outlineColor: Cesium.Color.BLUE,
    //         rotation: rotation // 设置椭圆旋转角度
    //       }
    //     });
    //
    //     this.viewer.entities.add(ellipse);
    //     entities.push(ellipse); // 将实体添加到返回数组
    //   });
    //
    //   return entities; // 返回创建的所有椭圆实体
    // },

    DrawCircle(point, bearing, magnitude) {
      // console.log("88888888888888888")
      // 地震源位置
      let position = point;
      // 根据断裂带计算的角度
      let strikeDirection = bearing;
      let i = 0;

      // 根据震级计算椭圆参数
      const ellipseParams = this.calculateEllipseParams(magnitude);

      // 存储所有创建的椭圆实体
      // const entities = [];

      // 循环创建多个同心椭圆，长轴方向与断裂带走向一致
      ellipseParams.forEach(params => {
        // 将角度转换为弧度（Cesium使用弧度）
        const adjustedDegrees = -(strikeDirection - 90);
        const rotation = Cesium.Math.toRadians(adjustedDegrees);

        let ellipse = new Cesium.Entity({
          position: Cesium.Cartesian3.fromDegrees(position.x, position.y),
          name: "面几何对象",
          ellipse: {
            semiMinorAxis: params.semiMinorAxis*50,
            semiMajorAxis: params.semiMajorAxis*50,
            //extrudedHeight: params.extrudedHeight,
            material: Cesium.Color.RED.withAlpha(params.alpha[i]),
            outline: false,
            outlineColor: Cesium.Color.BLUE,
            rotation: rotation // 设置椭圆旋转角度
          }
        });
        // console.log(params.semiMajorAxis,"长轴")
        // console.log(params.semiMinorAxis,"短轴")
        // console.log(strikeDirection, "方位角(度)");
        // console.log(rotation, "方位角(弧度)");
        this.viewer.entities.add(ellipse);
        i++;
        this.tempEntities.push(ellipse)
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

    /**
     * @param M  震级
     * @param Ia 长轴烈度
     * @author: xiaodemos
     * @date: 2025/3/31 9:43
     * @description: 计算椭圆长轴
     * @return: 返回椭圆长轴
     */
    calculateRa(M, Ia) {
      const a = (Math.pow(10, (4.0293 + 1.3003 * M - Ia) / 3.6404) - 10) * 27;
      // console.log(a, "=============================")
      return a;
    },

    /**
     * @param M  震级
     * @param Ib 短轴烈度
     * @author: xiaodemos
     * @date: 2025/3/31 9:43
     * @description: 计算椭圆短轴
     * @return: 返回椭圆短轴
     */
    calculateRb(M, Ib) {
      const b = (Math.pow(10, (2.3816 + 1.3003 * M - Ib) / 2.8573) - 5) * 27;
      // console.log(b, "=============================")

      return b;
    },

    // 根据震级和烈度计算椭圆参数的函数
    calculateEllipseParams(magnitude) {
      let sum = magnitude+2;
      // 定义不同层级的烈度值

      let intensityLevels = [
        {ia: sum-2, ib: sum-2},  // 内层椭圆：较高烈度
        {ia: sum-1, ib: sum-1},  // 中层椭圆：中等烈度
        {ia: sum, ib: sum}   // 外层椭圆：较低烈度
      ];

      // 存储计算出的椭圆参数
      let params = intensityLevels.map(level => {
        // 使用提供的公式计算长短轴
        let semiMajorAxis = this.calculateRa(magnitude, level.ia);

        let semiMinorAxis= this.calculateRb(magnitude, level.ib);

        // 根据烈度级别设置透明度
        let alpha = [0.1,0.25,0.4];

        // 计算 extrusion height，使较大的椭圆有更高的 extrusion
        // const extrudedHeight = semiMajorAxis * 0.15;

        return {
          semiMinorAxis,
          semiMajorAxis,
          // extrudedHeight,
          alpha
        };
      });

      // console.log("paramas:===================>", params);

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

.legend-circle{
  width: 18px;
  height: 18px;
  border-radius: 50%;
  margin-right: 8px; /* 调整颜色块与文字间距 */
  border: 1px solid rgba(255, 255, 255, 0.3); /* 浅色边框 */
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

#yhdlen{
  background-image: url("../../assets/images/landslide.png");
  background-size: cover;
}

#risk_area{
  background-image:  url("../../assets/images/riskArea.png");
  background-size: cover;
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
  top: 70px;
  left: 300px;
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
  margin-right: 30px;
  padding: 8px 15px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.earthquake-info-panel button:first-child {
  background-color: #386641;
  color: white;
  width: 100%;

}

.earthquake-info-panel button:last-child {
  background-color: #bc4749;
  color: white;
  width: 100%;

}

.el-select--large {
  font-size: 14px;
  gap: 6px;
  line-height: 24px;
  min-height: 40px;
  padding: 8px 16px;
}

::v-deep .compass {
  position: absolute;
  top: 20px;
  left: 20px;
}

::v-deep .navigation-controls {
  position: absolute;
  top: 120px;
  left: 53px;
}

</style>
