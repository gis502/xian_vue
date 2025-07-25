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
    <!-- 鼠标悬停时显示的经纬度坐标 -->
    <div class="coordinate-box">
      经度: {{ coordinateBoxData.longitude }} &nbsp;&nbsp;纬度: {{ coordinateBoxData.latitude }}
    </div>
    <timeLinePlay
        :viewer="viewer"
        :disaterEvent="disaterEvent"
        :currentTime="currentTimeString"
    />
    <!--    :isMarkingLayer="isMarkingLayerLocal"-->
    <!--    :stopTimePlay="stopTimePlay"-->
    <!--    @startTimePlay="handleStartTimePlay"-->
    <timeLineLayer
        :viewer="viewer"
        :disaterEvent="disaterEvent"
        :currentTime="currentTimeString"
    />

  </div>
</template>

<script>
import * as Cesium from "cesium";
import "cesium/Source/Widgets/widgets.css";
import {initCesium,init_cesium_navigation, setupMouseCoordinateDisplay} from '@/cesium/initLayer.js'
import {getEarthquakeEventById, getDisasterRainById} from '@/api/system/disasterEvents'
import {parsePointString} from "@/cesium/geomTransfer.js";
import timeTransfer from "@/cesium/timeTransfer.js";
import timeLine from "@/cesium/timeLine.js";
//面板
import eqCenterPanel from "@/components/Panel/eqCenterPanel.vue";
import rainCenterPanel from "@/components/Panel/rainCenterPanel.vue";
//时间轴组件
import timeLinePlay from "@/components/ScenarioSimulation/timeLinePlay.vue";
import timeLineLayer from "@/components/ScenarioSimulation/timeLineLayer.vue";
import basicLayers from "@/cesium/basicLayers.js";
export default {
  name: "thdTimeLine",
  props: ['id', 'trigger'],
  data() {
    return {
      viewer: null,

      disaterEvent: null,
      centerpoint: null,
      //---信息弹框---
      hasUpdatedPosition: false,
      selectedEntityPosition: '', //拾取的点的弹框位置
      PanelPosition: {x: 0, y: 0}, // TimeLinePanel弹窗的位置
      PanelData: {}, // TimeLinePanel弹窗的数据
      eqCenterPanelVisible: false,
      rainCenterPanelVisible: false,
      //鼠标位置经纬度
      coordinateBoxData: {longitude: 108, latitude: 34},

      stopTimePlay: false,
      isTimeRunning: false,
      isMarkingLayerLocal: true,
      currentTime:new Date()
    };
  },
  computed: {
    // 在父组件中，将 JulianDate 转换为字符串
    currentTimeString() {
      if (this.currentTime) {
        // 使用 Cesium 的函数将 JulianDate 转换为 ISO 字符串
        return Cesium.JulianDate.toIso8601(this.currentTime);
      }
      return '';
    }
  },
  components: {
    eqCenterPanel,
    rainCenterPanel,

    timeLinePlay,
    timeLineLayer
  },
  beforeDestroy() {
    if (this.viewer) {
      this.viewer.destroy();
      this.viewer = null;
    }
    if (this.MouseCoordinateHandler) {
      this.MouseCoordinateHandler.destroy()
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
      if (this.trigger == "地震") {
        this.disaterEvent = await getEarthquakeEventById({id: this.id})
        this.disaterEvent.trigger = "地震"
      } else if (this.trigger == "暴雨") {
        this.disaterEvent = await getDisasterRainById({id: this.id})
        this.disaterEvent.trigger = "暴雨"
      }

      let {longitude, latitude} = parsePointString(this.disaterEvent.geom)
      this.disaterEvent.longitude = longitude
      this.disaterEvent.latitude = latitude

      if (!this.disaterEvent.occurrenceTime) {
        console.error("Invalid occurrenceTime:", this.disaterEvent.occurrenceTime);
        return;
      }

      let startTimetmp = new Date(this.disaterEvent.occurrenceTime);
      let startTime = Cesium.JulianDate.fromDate(startTimetmp);
      let stopTimetmp = new Date(startTimetmp.getTime() + 10 * 24 * 3600 * 1000);
      let stopTime = Cesium.JulianDate.fromDate(stopTimetmp);
      let clock = new Cesium.Clock({
        startTime:startTime,
        stopTime: stopTime,
        currentTime: startTime,
        clockRange: Cesium.ClockRange.CLAMPED,
      });


      let viewer = initCesium("cesiumContainer", clock)

      viewer.clock.startTime = startTime.clone();
      viewer.clock.stopTime = stopTime.clone();
      viewer.clock.currentTime = startTime.clone();

      // 同步更新时间轴
      viewer.timeline.zoomTo(startTime, stopTime);
      // 同步更新时间轴
      viewer._cesiumWidget._creditContainer.style.display = 'none' // 隐藏版权信息

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

      viewer.clock.shouldAnimate = false;
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

      init_cesium_navigation(this.disaterEvent.longitude, this.disaterEvent.latitude, viewer)
      this.MouseCoordinateHandler = setupMouseCoordinateDisplay(this.viewer, this.coordinateBoxData)
      this.centerpoint = basicLayers.addCenterPoint(this.disaterEvent)
      this.locatedCenter()
      this.entitiesClickPonpHandler()
    },
    async locatedCenter() {
      await timeLine.fly(this.disaterEvent.longitude, this.disaterEvent.latitude, 200000)
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
        viewer.clockViewModel.shouldAnimate = true;
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
          if (!entity.name) {
            this.eqCenterPanelVisible = false;
            this.rainCenterPanelVisible = false;
            return;
          }
          // 如果点击的是标绘点
          else if (entity.name === "地震中心") {
            this.eqCenterPanelVisible = true;
            this.rainCenterPanelVisible = false;
            this.PanelPosition = this.selectedEntityPosition; // 更新位置
            this.PanelData = {}
            this.PanelData = this.extractDataForRouter(entity)
          } else if (entity.name === "暴雨中心") {
            this.eqCenterPanelVisible = false;
            this.rainCenterPanelVisible = true;
            this.PanelPosition = this.selectedEntityPosition; // 更新位置
            this.PanelData = {}
            this.PanelData = this.extractDataForRouter(entity)
          } else {
            this.rainCenterPanelVisible = false;
            this.eqCenterPanelVisible = false;
          }
        }
        //没有拾取到实体
        else {
          this.eqCenterPanelVisible = false;
          this.rainCenterPanelVisible = false;
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


  },

  // //子-父-子，控制时间轴暂停与播放
  // handleStopTimePlay() {
  //   this.stopTimePlay = true; // 用于控制时间轴停止播放的变量
  //   console.log(this.stopTimePlay, "this.stopTimePlay")
  // },
  // handleStartTimePlay() {
  //   this.stopTimePlay = false;
  // },
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
  bottom: 26px;
  height: 25px;
  width: 205px;
  z-index: 5;
}
</style>
