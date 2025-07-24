<template>
  <div id="cesiumContainer" ref="cesiumContainer">
    <!--中心标绘信息-->
    <eqCenterPanel
        v-show="eqCenterPanelVisible"
        :position="PanelPosition"
        :popupData="PanelData"
    />
    <rainCenterPanel
        v-show="rainCenterPanelVisible"
        :position="PanelPosition"
        :popupData="PanelData"
    />
    <!--态势标绘信息-->
    <plotInfoOnlyShowPanel
        v-show="plotShowOnlyPanelVisible"
        :position="PanelPosition"
        :popupData="PanelData"
    />

    <!--聚合标绘信息-->
    <dataSourcePanel
        v-show="dataSourcePopupVisible"
        :position="PanelPosition"
        :popupData="dataSourcePopupData"
    />
    <!-- 鼠标悬停时显示的经纬度坐标 -->
    <div class="coordinate-box">
      经度: {{ coordinateBoxData.longitude }} &nbsp;&nbsp;纬度: {{ coordinateBoxData.latitude }}
    </div>
  </div>
</template>

<script>
import * as Cesium from "cesium";
import "cesium/Source/Widgets/widgets.css";
import {init_cesium_navigation, initCesium} from '@/cesium/initLayer.js'
import {getEarthquakeEventById, getDisasterRainById} from '@/api/system/disasterEvents'
import {parsePointString} from "@/cesium/geomTransfer.js";
import timeTransfer from "@/cesium/timeTransfer.js";
import timeLine from "@/cesium/timeLine.js";
//面板
import eqCenterPanel from "@/components/Panel/eqCenterPanel.vue";
import rainCenterPanel from "@/components/Panel/rainCenterPanel.vue";
import plotInfoOnlyShowPanel from "@/components/Panel/plotInfoOnlyShowPanel";
import dataSourcePanel from "@/components/Panel/dataSourcePanel.vue";

export default {
  name: "thdTimeLine",
  props: ['id', 'trigger'],
  data() {
    return {
      viewer: null,
      isTimeRunning: false,
      disaterEvent: null,
      centerpoint: null,
      //---信息弹框---
      hasUpdatedPosition: false,
      selectedEntityPosition: '', //拾取的点的弹框位置
      PanelPosition: {x: 0, y: 0}, // TimeLinePanel弹窗的位置
      PanelData: {}, // TimeLinePanel弹窗的数据
      dataSourcePopupData: {}, // TimeLinePanel弹窗的数据
      eqCenterPanelVisible: false,
      rainCenterPanelVisible: false,
      plotShowOnlyPanelVisible: false,
      dataSourcePopupVisible: false,
      //鼠标位置经纬度
      coordinateBoxData: {longitude: 0, latitude: 0},
    };
  },
  components: {
    eqCenterPanel,
    rainCenterPanel,
    plotInfoOnlyShowPanel,
    dataSourcePanel
  },
  beforeDestroy() {
    if (this.viewer) {
      this.viewer.destroy();
      this.viewer = null;
    }
  },
  mounted() {
    this.$nextTick(() => {
      this.init();
    });
  },
  methods: {
    async init() {
      let that = this
      // console.log("this.id,this.trigger", this.id, this.trigger)
      if (this.trigger == "地震") {
        this.disaterEvent = await getEarthquakeEventById({id: this.id})
        this.disaterEvent.disasterName = this.disaterEvent.earthquakeName
        this.disaterEvent.trigger = "地震"
      } else if (this.trigger == "暴雨") {
        this.disaterEvent = await getDisasterRainById({id: this.id})
        this.disaterEvent.trigger = "暴雨"
      }

      let {longitude, latitude} = parsePointString(this.disaterEvent.geom)
      this.disaterEvent.longitude = longitude
      this.disaterEvent.latitude = latitude



      let startTime = new Date(this.disaterEvent.occurrenceTime);
      let stopTime = new Date(startTime.getTime() + 10 * 24 * 3600 * 1000);
      console.log( Cesium.JulianDate.fromDate(startTime)," Cesium.JulianDate.fromDate(startTime),")
      let clock = new Cesium.Clock({
        startTime: Cesium.JulianDate.fromDate(startTime),
        stopTime: Cesium.JulianDate.fromDate(stopTime),
        currentTime: Cesium.JulianDate.fromDate(startTime),
        clockRange: Cesium.ClockRange.CLAMPED,
      });

//

      let viewer = initCesium("cesiumContainer", clock)
      // 同步更新时间轴
      viewer.timeline.zoomTo(clock.startTime, clock.stopTime);
      viewer.clock.shouldAnimate = false;
      viewer._cesiumWidget._creditContainer.style.display = 'none' // 隐藏版权信息
      init_cesium_navigation(this.disaterEvent.longitude, this.disaterEvent.latitude, viewer)
      //取消双击视角定位
      viewer.trackedEntity = undefined;
      viewer.cesiumWidget.screenSpaceEventHandler.removeInputAction(
          Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK
      );

      // 设置相机高度和视角
      viewer.camera.setView({
        destination: Cesium.Cartesian3.fromDegrees(103.00, 29.98, 20000000),//足够高可以看到整个地球
        orientation: {
          // 指向
          heading: 6.283185307179581,
          // 视角
          pitch: -1.5688168484696687,
          roll: 0.0
        }
      });


      viewer.clock.multiplier = 3600
      viewer.clock.onTick.addEventListener(function (clock) {
        if (clock.currentTime) {
          that.currentTime = clock.currentTime;
        }
        if (viewer.clockViewModel.shouldAnimate) {
          that.isTimeRunning = true
        } else {
          that.isTimeRunning = false
        }
      })


      viewer.animation.viewModel.timeFormatter = timeTransfer.CesiumTimeFormatter;
      viewer.timeline.makeLabel = timeTransfer.CesiumDateTimeFormatter;
      viewer.animation.viewModel.dateFormatter = timeTransfer.CesiumDateFormatter;

      let realTime = new Date()
      if (realTime > startTime && realTime < stopTime) {
        console.log("还在更新的地震")
        document.getElementsByClassName('cesium-viewer-animationContainer')[0].style = 'visibility:hidden;z-index:1 ;left:40%;bottom: 3%;';
        document.getElementsByClassName('cesium-animation-rectButton')[0].style = 'visibility:hidden';
        document.getElementsByClassName('cesium-animation-rectButton')[1].style = 'visibility:hidden';
        document.getElementsByClassName('cesium-animation-rectButton')[2].style = 'visibility:hidden';
        document.getElementsByClassName('cesium-animation-rectButton')[3].style = 'visibility:hidden';
      } else {
        console.log("历史地震")
        document.getElementsByClassName('cesium-viewer-animationContainer')[0].style = 'visibility:hidden;z-index:1 ;left:40%;bottom: 3%;';
        document.getElementsByClassName('cesium-animation-rectButton')[0].style = 'visibility:hidden';
        document.getElementsByClassName('cesium-animation-rectButton')[1].style = 'visibility:hidden';
        document.getElementsByClassName('cesium-animation-rectButton')[2].style = 'visibility:hidden';
      }

      document.getElementsByClassName('cesium-timeline-main')[0].style = 'width: 100%';
      document.getElementsByClassName('cesium-timeline-bar')[0].style = 'background:rgba(0, 0, 0, 0.1);';

      window.viewer = viewer
      this.viewer = viewer


      this.setupMouseCoordinateDisplay()
      this.centerpoint = timeLine.addCenterPoint(this.disaterEvent)
      this.locatedCenter()
      this.entitiesClickPonpHandler()

    },
    //显示鼠标位置坐标
    setupMouseCoordinateDisplay() {
      var canvas = this.viewer.scene.canvas;
      var ellipsoid = this.viewer.scene.globe.ellipsoid;
      var handler = new Cesium.ScreenSpaceEventHandler(canvas);
      let that=this
      handler.setInputAction(function (movement) {
        var cartesian = that.viewer.camera.pickEllipsoid(movement.endPosition, ellipsoid);
        // console.log(cartesian,"cartesian")
        if (cartesian) {
          var cartographic = that.viewer.scene.globe.ellipsoid.cartesianToCartographic(cartesian);
          // console.log(cartographic,"cartographic")
          that.coordinateBoxData.latitude = Number(Cesium.Math.toDegrees(cartographic.latitude)).toFixed(6); // 纬度
          that.coordinateBoxData.longitude = Number(Cesium.Math.toDegrees(cartographic.longitude)).toFixed(6); // 经度
        }
      }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
    },

    async locatedCenter() {
      await timeLine.fly(this.disaterEvent.longitude, this.disaterEvent.latitude, 6000)
      //中心面板闪烁
      if (this.disaterEvent.trigger == "地震") {
        this.eqCenterPanelVisible = true;
      } else if (this.disaterEvent.trigger == "暴雨") {
        this.rainCenterPanelVisible = true;
      }
      this.PanelData = this.extractDataForRouter(this.centerpoint)

      this.selectedEntity = this.centerpoint
      this.selectedEntityPosition = {
        x: this.disaterEvent.longitude, // 经度
        y: this.disaterEvent.latitude,  // 纬度
        z: 0     // 高度
      };
      let position = this.centerpoint.position.getValue(Cesium.JulianDate.now());
      let screenPosition = Cesium.SceneTransforms.wgs84ToWindowCoordinates(viewer.scene, position);
      this.PanelPosition = {
        x: screenPosition.x + 10,
        y: screenPosition.y + 10
      };
      this.updatePopupPosition(); // 确保位置已更新
      window.viewer.screenSpaceEventHandler.setInputAction(movement => {
        // 如果时间线弹窗或路由弹窗可见，则更新弹窗位置
        if (this.eqCenterPanelVisible || this.rainCenterPanelVisible || this.plotShowOnlyPanelVisible || this.dataSourcePopupVisible) {
          this.updatePopupPosition();
        }
      }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

      setTimeout(() => {
        this.eqCenterPanelVisible = false;
        this.rainCenterPanelVisible = false;
        viewer.clock.shouldAnimate = true;
      }, 3000);
    },

    //-------信息面板弹框-----
    entitiesClickPonpHandler() {
      let that = this;
      // 在屏幕空间事件处理器中添加左键点击事件的处理逻辑
      window.viewer.screenSpaceEventHandler.setInputAction(async (click) => {
        // 检查点击位置是否拾取到实体
        let pickedEntity = window.viewer.scene.pick(click.position);
        window.selectedEntity = pickedEntity?.id;

        // 如果拾取到实体
        if (Cesium.defined(pickedEntity)) {
          let entity = window.selectedEntity;
          console.log(entity, "拾取entity")
          // 计算图标的世界坐标
          this.selectedEntityPosition = this.calculatePosition(click.position);
          this.updatePopupPosition(); // 确保位置已更新


          // 如果 entity 没有 _layer 字段，且当前选中图层是特定图层时跳过
          if (!entity._layer && !pickedEntity.id._properties.sourceName) {
            this.eqCenterPanelVisible = false;
            this.rainCenterPanelVisible = false;
            this.plotShowOnlyPanelVisible = false;
            this.dataSourcePopupVisible = false
            return;
          }

          // 如果点击的是标绘点
          else if (entity._layer === "地震中心") {
            this.eqCenterPanelVisible = true;
            this.rainCenterPanelVisible = false;
            this.plotShowOnlyPanelVisible = false;
            this.dataSourcePopupVisible = false

            this.PanelPosition = this.selectedEntityPosition; // 更新位置
            this.PanelData = {}
            this.PanelData = this.extractDataForRouter(entity)
          } else if (entity._layer === "暴雨中心") {
            this.eqCenterPanelVisible = false;
            this.rainCenterPanelVisible = true;
            this.plotShowOnlyPanelVisible = false;
            this.dataSourcePopupVisible = false

            this.PanelPosition = this.selectedEntityPosition; // 更新位置
            this.PanelData = {}
            this.PanelData = this.extractDataForRouter(entity)
          } else if (entity._layer === "标绘点") {
            this.eqCenterPanelVisible = false;
            this.rainCenterPanelVisible = false;
            this.plotShowOnlyPanelVisible = true;
            this.dataSourcePopupVisible = false

            this.PanelPosition = this.selectedEntityPosition; // 更新位置
            this.PanelData = {}
            // this.eqThemeData = {}
            // this.tableName = ""
            this.PanelData = this.extractDataForRouter(entity)
          }

          // //聚合图标
          else if (Object.prototype.toString.call(entity) === '[object Array]') {
            if (entity[0].entityCollection.owner.name === "label") {
              this.eqCenterPanelVisible = false;
              this.rainCenterPanelVisible = false;
              this.plotShowOnlyPanelVisible = false;
              this.dataSourcePopupVisible = false;
            } else {
              this.eqCenterPanelVisible = false;
              this.rainCenterPanelVisible = false;
              this.plotShowOnlyPanelVisible = false;
              this.dataSourcePopupVisible = true

              let popupPanelDatatmp = entity.filter(item => item.plottype !== undefined);
              const drawTypes = popupPanelDatatmp.map(obj => obj.plottype);
              console.log(drawTypes)
              this.data = drawTypes.reduce((acc, type) => {
                if (acc[type]) {
                  acc[type] += 1;
                } else {
                  acc[type] = 1;
                }
                return acc;
              }, {});

              this.dataSourcePopupData = Object.entries(this.data).map(([key, value]) => ({
                type: key,
                count: value
              }));

            }
          } else {
            this.eqCenterPanelVisible = false;
            this.plotShowOnlyPanelVisible = false;
            this.dataSourcePopupVisible = false
          }
        }
        //没有拾取到实体
        else {
          this.eqCenterPanelVisible = false;
          this.rainCenterPanelVisible = false;
          this.plotShowOnlyPanelVisible = false;
          this.dataSourcePopupVisible = false
        }
      }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
      // 在屏幕空间事件处理器中添加鼠标移动事件的处理逻辑
      window.viewer.screenSpaceEventHandler.setInputAction(movement => {
        // 如果时间线弹窗或路由弹窗可见，则更新弹窗位置
        if (this.eqCenterPanelVisible || this.rainCenterPanelVisible || this.plotShowOnlyPanelVisible || this.dataSourcePopupVisible) {
          this.updatePopupPosition();
        }
      }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
    },
    //计算点击位置的经纬度和高度
    calculatePosition(clickPosition) {
      // 根据点击位置获取射线
      let ray = viewer.camera.getPickRay(clickPosition);
      // 用射线在场景中拾取位置
      let position = viewer.scene.globe.pick(ray, viewer.scene);
      // 将拾取的位置转换为地理坐标
      let cartographic = Cesium.Cartographic.fromCartesian(position);
      // 将地理坐标的经纬度转换为度数
      let latitude = Cesium.Math.toDegrees(cartographic.latitude);
      let longitude = Cesium.Math.toDegrees(cartographic.longitude);
      // 根据地形是否加载来获取高度
      let height = 0;

      // 返回计算得到的经纬度和高度
      return {
        x: longitude, // 经度
        y: latitude,  // 纬度
        z: height     // 高度
      };
    },
    //更新弹窗位置
    updatePopupPosition() {
      // 使用$nextTick确保DOM更新后才执行位置计算
      this.$nextTick(() => {
        // 检查是否有选中的实体位置
        if (this.selectedEntityPosition) {
          // 将地理坐标转换为窗口坐标
          const canvasPosition = Cesium.SceneTransforms.wgs84ToWindowCoordinates(
              window.viewer.scene,
              Cesium.Cartesian3.fromDegrees(this.selectedEntityPosition.x, this.selectedEntityPosition.y, this.selectedEntityPosition.z)
          );
          // 如果转换成功，则更新弹窗位置
          if (canvasPosition) {
            this.PanelPosition = {
              x: canvasPosition.x + 10,
              y: canvasPosition.y + 10
            };
          }
        }
      });
    },
    extractDataForRouter(entity) {
      let properties = {};
      entity.properties.propertyNames.forEach(name => {
        properties[name] = entity.properties[name].getValue();
      });
      return properties;
    },
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

.coordinate-box {
  position: absolute;
  background: rgb(255, 255, 255);
  color: #6c6666;
  padding: 5px;
  border-radius: 5px;
  font-size: 12px;
  pointer-events: none;
  right: 0;
  bottom: 25px;
  height: 25px;
  width: 205px;
  z-index: 5;
}
</style>
