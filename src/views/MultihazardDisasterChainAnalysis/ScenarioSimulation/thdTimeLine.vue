<template>
  <div id="cesiumContainer" ref="cesiumContainer">
    <!--中心标绘信息-->
    <eqCenterPanel
        v-show="eqCenterPanelVisible"
        :position="PanelPosition"
        :popupData="PanelData"
    />
<!--    <rainCenterPanel-->
<!--        v-show="rainCenterPanelVisible"-->
<!--        :position="PanelPosition"-->
<!--        :popupData="PanelData"-->
<!--    />-->
    <!-- 鼠标悬停时显示的经纬度坐标 -->
    <div class="coordinate-box">
      经度: {{ coordinateBoxData.longitude }} &nbsp;&nbsp;纬度: {{ coordinateBoxData.latitude }}
    </div>
    <!-- 点击弹窗 -->
    <HiddenDisasterPanel
        v-if="showBaseInfo"
        :title="baseInfoTitle"
        :position="PanelPosition"
        :showDisasterInformation="showDisasterInformation"
        :disasterInformation="disasterInformation"
        :showdebrisFlowInformation="showdebrisFlowInformation"
        :debrisFlowInformation="debrisFlowInformation"
        :showRiskPointsInformation="showRiskPointsInformation"
        :riskPointsInformation="riskPointsInformation"
        :trigger="disasterEvent.trigger"
        :rainfall="'0'"
    />


    <timeLinePlay
        :viewer="viewer"
        :disasterEvent="disasterEvent"
        :currentTime="currentTimeString"
        :RealDisasterPlots="realDisasterPoint"
    />
    <timeLineLayer
        :viewer="viewer"
        :disasterEvent="disasterEvent"
        :currentTime="currentTimeString"
        :onceLoadLayer="onceLoadLayer"
        @update:onceLoadLayer="onceLoadLayer = $event"
        @update:realDisasterPoint="handleRealDisasterPointUpdate"
        @update:hiddenDisasterPoint="handleHiddenDisasterPointUpdate"
    />

    <!--    表格-->
    <RealDisasterTable
        :dataTypes="dataTypesRealDisater"
        :currentTime="currentTime"
    />
    <Table :show="true" :dataTypes="dataTypeHiddenDisaster"></Table>
    <!-- 图例 -->
    <Legend></Legend>
  </div>
</template>

<script>
import * as Cesium from "cesium";
import "cesium/Source/Widgets/widgets.css";
import {initCesium, init_cesium_navigation, setupMouseCoordinateDisplay} from '@/cesium/initLayer.js'
import {getEarthquakeEventById, getDisasterRainById} from '@/api/system/disasterEvents'
import {parsePointString} from "@/cesium/geomTransfer.js";
import timeTransfer from "@/cesium/timeTransfer.js";
import timeLine from "@/cesium/timeLine.js";
import basicLayers from "@/cesium/basicLayers.js";
//面板
import eqCenterPanel from "@/components/Panel/eqCenterPanel.vue";
import rainCenterPanel from "@/components/Panel/rainCenterPanel.vue";
import HiddenDisasterPanel from "@/components/Panel/HiddenDisasterPanel.vue";
//时间轴组件
import timeLinePlay from "@/components/ScenarioSimulation/timeLinePlay.vue";
import timeLineLayer from "@/components/ScenarioSimulation/timeLineLayer.vue";
//组件
import Legend from "@/components/Earthquake/Legend.vue";
import RealDisasterTable from "@/components/ScenarioSimulation/RealDisasterTable.vue";
import Table from "@/components/Earthquake/Table.vue";
import clickPointsAndShowPanel from "@/cesium/clickPointsAndShowPanel.js";

export default {
  name: "thdTimeLine",
  props: ['id', 'trigger'],
  data() {
    return {
      viewer: null,

      disasterEvent: null,
      centerpoint: null,

      //---信息弹框---
      selectedEntityPosition: '', //拾取的点的弹框位置
      PanelPosition: {x: 0, y: 0}, // TimeLinePanel弹窗的位置
      PanelData: {}, // TimeLinePanel弹窗的数据
      eqCenterPanelVisible: false,
      rainCenterPanelVisible: false,
      baseInfoTitle: false,
      showDisasterInformation: false,
      showdebrisFlowInformation: false,
      showRiskPointsInformation: false,
      disasterInformation: null,
      debrisFlowInformation: null,
      riskPointsInformation: null,
      showBaseInfo: false,
      //鼠标位置经纬度
      coordinateBoxData: {longitude: 108, latitude: 34},
      //时间尺
      // stopTimePlay: false,
      // isTimeRunning: false,
      // isMarkingLayerLocal: true,
      currentTime: new Date(),
      onceLoadLayer: false,

      //真实发生的灾害点列表
      realDisasterPoint: null,
      dataTypesRealDisater: {
        filterCriteria: [
          {
            name: "滑坡点",
            value: "type1",
          },
          {
            name: "泥石流点",
            value: "type2",
          },
          {
            name: "风险点",
            value: "type3",
          },
        ],
        type1: {
          // headers: ["滑坡灾害名称", "发生时间", "人员伤亡情况","处置阶段"],
          headers: [{name: "滑坡灾害名称", key: "field1", width: "30%"},
            {name: "发生时间", key: "field2", width: "30%"},
            {name: "人员伤亡", key: "field3", width: "15%"},
            {name: "处置阶段", key: "field4", width: "15%"}],
          data: [],

        },
        type2: {
          // headers: ["泥石流灾害名称", "发生时间", "人员伤亡情况", "处置阶段"],
          headers: [{name: "泥石流灾害名称", key: "field1", width: "30%"},
            {name: "发生时间", key: "field2", width: "30%"},
            {name: "人员伤亡", key: "field3", width: "15%"},
            {name: "处置阶段", key: "field4", width: "15%"}],
          data: [],
        },
        type3: {
          // headers: ["风险区名称", "发生时间", "人员伤亡情况", "处置阶段"],
          headers: [{name: "风险区名称", key: "field1", width: "30%"},
            {name: "发生时间", key: "field2", width: "30%"},
            {name: "人员伤亡", key: "field3", width: "15%"},
            {name: "处置阶段", key: "field4", width: "15%"}],
          data: [],
        },
      },
      //隐患点表格
      dataTypeHiddenDisaster: {
        filterCriteria: [
          {
            name: "滑坡预警点",
            value: "type1",
          },
          {
            name: "泥石流预警点",
            value: "type2",
          },
          {
            name: "山洪预警点",
            value: "type3",
          },
          {
            name: "内涝预警点",
            value: "type4",
          },
          {
            name: "风险区预警点",
            value: "type5",
          },
        ],
        type1: {
          headers: ["滑坡灾害名称", "位置", "规模等级", "险情等级"],
          data: [],
        },
        type2: {
          headers: ["泥石流灾害名称", "位置", "规模等级", "险情等级"],
          data: [],
        },
        type3: {
          headers: ["山洪流灾害名称", "位置", "发生概率", "险情等级"],
          data: [],
        },
        type4: {
          headers: ["内涝灾害名称", "位置", "规模等级", "险情等级"],
          data: [],
        },
        type5: {
          headers: ["风险区名称", "位置", "巡查员姓名", "联系方式"],
          data: [],
        },
      },
      matchedHiddenHighlightEntities:null,
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
    //信息面板
    eqCenterPanel,
    rainCenterPanel,
    HiddenDisasterPanel,

    timeLinePlay,
    timeLineLayer,

    Legend,
    //表格
    RealDisasterTable,
    Table
  },
  beforeDestroy() {
    // 1. 清空所有图形（点、线、面、标签）
    if (this.viewer && this.viewer.entities) {
      this.viewer.entities.removeAll();
    }

    // 2. 清空所有 GeoJSON / CZML / KML 等数据源
    if (this.viewer && this.viewer.dataSources) {
      this.viewer.dataSources.removeAll(true);
    }
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
        let res= await getEarthquakeEventById({id: this.id})
        this.disasterEvent=res.data
        this.disasterEvent.trigger = "地震"
      } else if (this.trigger == "暴雨") {
        let res= await getDisasterRainById({id: this.id})
        this.disasterEvent=res.data
        this.disasterEvent.trigger = "暴雨"
      }
      console.log(this.disasterEvent,"this.disasterEvent")
      if (!this.disasterEvent.occurrenceTime) {
        console.error("Invalid occurrenceTime:", this.disasterEvent.occurrenceTime);
        return;
      }

      let startTimetmp = new Date(this.disasterEvent.occurrenceTime);
      let startTime = Cesium.JulianDate.fromDate(startTimetmp);
      let stopTimetmp = new Date(startTimetmp.getTime() + 10 * 24 * 3600 * 1000);
      let stopTime = Cesium.JulianDate.fromDate(stopTimetmp);
      let clock = new Cesium.Clock({
        startTime: startTime,
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
        // if (viewer.clockViewModel.shouldAnimate) {
        //   that.isTimeRunning = true
        // } else {
        //   that.isTimeRunning = false
        // }
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

      init_cesium_navigation(this.disasterEvent.longitude, this.disasterEvent.latitude, 200000, viewer)
      this.MouseCoordinateHandler = setupMouseCoordinateDisplay(this.viewer, this.coordinateBoxData)
      this.centerpoint = basicLayers.addCenterPoint(this.disasterEvent)
      this.locatedCenter()
      this.entitiesClickPonpHandler()
    },
    async locatedCenter() {
      await timeLine.fly(this.disasterEvent.longitude, this.disasterEvent.latitude, 200000)
      //中心面板闪烁
      if (this.disasterEvent.trigger == "地震") {
        this.eqCenterPanelVisible = true;
      } else if (this.disasterEvent.trigger == "暴雨") {
        this.rainCenterPanelVisible = true;
      }
      this.PanelData =clickPointsAndShowPanel.extractDataForPanel(this.centerpoint,this.matchedHiddenHighlightEntities)

      this.selectedEntity = this.centerpoint
      this.selectedEntityPosition = {
        x: this.disasterEvent.longitude, // 经度
        y: this.disasterEvent.latitude,  // 纬度
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
        if (this.eqCenterPanelVisible || this.rainCenterPanelVisible || this.showBaseInfo) {
          this.updatePopupPosition();
        }
      }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

      setTimeout(() => {
        this.eqCenterPanelVisible = false;
        this.rainCenterPanelVisible = false;
        // viewer.clockViewModel.shouldAnimate = true;
        this.onceLoadLayer = true
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
              setTimeout(() => {
                this.updatePopupPosition();
              }, 10);
              // this.updatePopupPosition(); // 确保位置已更新


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
                this.showBaseInfo = false;
                // this.PanelPosition = this.selectedEntityPosition; // 更新位置

                this.PanelData = {}
                this.PanelData = clickPointsAndShowPanel.extractDataForPanel(entity, this.matchedHiddenHighlightEntities)
              }
              else if (entity.name === "暴雨中心") {
                this.eqCenterPanelVisible = false;
                this.rainCenterPanelVisible = true;
                console.log(this.rainCenterPanelVisible, "打开面板啊")
                this.showBaseInfo = false;
                // this.PanelPosition = this.selectedEntityPosition; // 更新位置

                this.PanelData = {}
                this.PanelData = clickPointsAndShowPanel.extractDataForPanel(entity, this.matchedHiddenHighlightEntities)
                console.log(this.PanelData, "显示数据")
              }
              else if (entity.name === "滑坡隐患点") {
                this.eqCenterPanelVisible = false;
                this.rainCenterPanelVisible = false;
                this.showBaseInfo = true;
                this.baseInfoTitle = entity.name;
                this.showDisasterInformation = true;
                this.showdebrisFlowInformation = false;
                this.showRiskPointsInformation = false;

                this.disasterInformation = clickPointsAndShowPanel.extractDataForPanel(entity, this.matchedHiddenHighlightEntities)

                this.debrisFlowInformation = null
                this.riskPointsInformation = null
              }
              else if (entity.name === "泥石流隐患点") {
                this.eqCenterPanelVisible = false;
                this.rainCenterPanelVisible = false;
                this.showBaseInfo = true;
                // this.PanelPosition = this.selectedEntityPosition; // 更新位置
                this.baseInfoTitle = entity.name;

                this.showDisasterInformation = false;
                this.showdebrisFlowInformation = true;
                this.showRiskPointsInformation = false;

                this.disasterInformation = null
                this.debrisFlowInformation = clickPointsAndShowPanel.extractDataForPanel(entity, this.matchedHiddenHighlightEntities)
                this.riskPointsInformation = null
              }
              else if (entity.name === "风险区域") {
                this.eqCenterPanelVisible = false;
                this.rainCenterPanelVisible = false;
                this.showBaseInfo = true;
                // this.PanelPosition = this.selectedEntityPosition; // 更新位置
                this.baseInfoTitle = entity.name;
                this.showDisasterInformation = false;
                this.showdebrisFlowInformation = false;
                this.showRiskPointsInformation = true;

                this.disasterInformation = null
                this.debrisFlowInformation = null
                this.riskPointsInformation = clickPointsAndShowPanel.extractDataForPanel(entity, this.matchedHiddenHighlightEntities)
              } else {
                this.rainCenterPanelVisible = false;
                this.eqCenterPanelVisible = false;
                this.showBaseInfo = false;
              }
            }
            //没有拾取到实体
            else {
              this.eqCenterPanelVisible = false;
              this.rainCenterPanelVisible = false;
              this.showBaseInfo = false;
            }
          }, Cesium.ScreenSpaceEventType.LEFT_CLICK
      );
// 在屏幕空间事件处理器中添加鼠标移动事件的处理逻辑
      window.viewer.screenSpaceEventHandler.setInputAction(movement => {
        // 如果时间线弹窗或路由弹窗可见，则更新弹窗位置
        if (this.eqCenterPanelVisible || this.rainCenterPanelVisible || this.showBaseInfo) {
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

    handleRealDisasterPointUpdate(data) {
      console.log(data,"handleRealDisasterPointUpdate")
      this.realDisasterPoint = data

      this.dataTypesRealDisater.type1.data = [];
      this.dataTypesRealDisater.type2.data = [];
      this.dataTypesRealDisater.type3.data = [];
      // 风险区数据，滑坡数据，泥石流数据
      this.realDisasterPoint.forEach((item) => {
        switch (item.disasterType) {
          case "滑坡":
            this.dataTypesRealDisater.type1.data.push({
              field1: item.disasterName,
              field2: timeTransfer.timestampToTimeChina(item.occurrenceTime),
              field3: item.peopleInjure,
              field4: item.state,
              field5: parsePointString(item.geom).longitude,
              field6: parsePointString(item.geom).latitude,
              type:"type1",
            });
            break;
          case "泥石流":
            this.dataTypesRealDisater.type2.data.push({
              field1: item.disasterName,
              field2: timeTransfer.timestampToTimeChina(item.occurrenceTime),
              field3: item.peopleInjure,
              field4: item.state,
              field5: parsePointString(item.geom).longitude,
              field6: parsePointString(item.geom).latitude,
              type:"type2",
            });
            break;
          default:
            this.dataTypesRealDisater.type3.data.push({
              field1: item.disasterName,
              field2: timeTransfer.timestampToTimeChina(item.occurrenceTime),
              field3: item.peopleInjure,
              field4: item.state,
              field5: parsePointString(item.geom).longitude,
              field6: parsePointString(item.geom).latitude,
              type:"type3",
            });
        }
      });
    },
    handleHiddenDisasterPointUpdate(probabilityPoints) {
      const disasterTypeMap = {
        "滑坡": "landslide",
        "泥石流": "debris_flow",
        "山洪": "torrential_flood",
        "内涝": "water_logging",
        "堰塞湖": "barrier_lake"
      };
      console.log(probabilityPoints,"handleHiddenDisasterPointUpdate")
      this.matchedHiddenHighlightEntities = probabilityPoints;
      // 清空表格数据
      this.dataTypeHiddenDisaster.type1.data = [];
      this.dataTypeHiddenDisaster.type2.data = [];
      this.dataTypeHiddenDisaster.type3.data = [];
      this.dataTypeHiddenDisaster.type4.data = [];
      this.dataTypeHiddenDisaster.type5.data = [];
      probabilityPoints.forEach((item) => {
        // 跳过无效数据（检查必要字段是否存在）
        if (!item?.disasterType || !Array.isArray(item.disaster) ||
            !Array.isArray(item.level) || !Array.isArray(item.probability)) {
          return;
        }

        // 获取当前disasterType对应的disaster数组元素
        let disasterKey = disasterTypeMap[item.disasterType];
        if (!disasterKey) {
          console.warn(`未找到与disasterType "${item.disasterType}" 匹配的映射`);
          return;
        }

        // 找到对应的索引（disaster、level、probability数组顺序一一对应）
        let index = item.disaster.indexOf(disasterKey);
        if (index === -1 || index >= item.level.length || index >= item.probability.length) {
          console.warn(`在disaster数组中未找到 "${disasterKey}" 或索引超出范围`);
          return;
        }

        // 获取对应的等级和概率
        let level = item.level[index];
        let probability = item.probability[index];

        if(level=="高"||level=="中"){
          switch (item.geologicalDisasterHideDTO.disasterType) {
            case "滑坡":
              this.dataTypeHiddenDisaster.type1.data.push({
                field1: item.geologicalDisasterHideDTO.disasterName,
                field2: item.geologicalDisasterHideDTO.position,
                field3: item.geologicalDisasterHideDTO.scaleGrade,
                field4: item.geologicalDisasterHideDTO.riskGrade,
                field5: item.geologicalDisasterHideDTO.lon,
                field6: item.geologicalDisasterHideDTO.lat,
              });
              break;
            case "泥石流":
              this.dataTypeHiddenDisaster.type2.data.push({
                field1: item.geologicalDisasterHideDTO.disasterName,
                field2: item.geologicalDisasterHideDTO.position,
                field3: item.geologicalDisasterHideDTO.scaleGrade,
                field4: item.geologicalDisasterHideDTO.riskGrade,
                field5: item.geologicalDisasterHideDTO.lon,
                field6: item.geologicalDisasterHideDTO.lat,
              });
              break;
            case "山洪":
              this.dataTypeHiddenDisaster.type3.data.push({
                field1: item.geologicalDisasterHideDTO.disasterName,
                field2: item.geologicalDisasterHideDTO.position,
                // field3: item.geologicalDisasterHideDTO.scaleGrade,
                // field4: item.geologicalDisasterHideDTO.riskGrade,
                field3: item.probability[2],
                field4: item.level[2],
                field5: item.geologicalDisasterHideDTO.lon,
                field6: item.geologicalDisasterHideDTO.lat,
              });
              break;
            case "内涝":
              this.dataTypeHiddenDisaster.type4.data.push({
                field1: item.geologicalDisasterHideDTO.disasterName,
                field2: item.geologicalDisasterHideDTO.position,
                field3: item.geologicalDisasterHideDTO.scaleGrade,
                field4: item.geologicalDisasterHideDTO.riskGrade,
                field5: item.geologicalDisasterHideDTO.lon,
                field6: item.geologicalDisasterHideDTO.lat,
              });
              break;
            default:
              this.dataTypeHiddenDisaster.type5.data.push({
                field1: item.geologicalDisasterHideDTO.disasterName,
                field2: item.geologicalDisasterHideDTO.position,
                field3: item.geologicalDisasterHideDTO.inspectorName,
                field4: item.geologicalDisasterHideDTO.inspectorTele,
                field5: item.geologicalDisasterHideDTO.lon,
                field6: item.geologicalDisasterHideDTO.lat,
              });
          }
        }
      })


      // // 风险区数据，滑坡数据，泥石流数据
      // probabilityPoints.forEach((item) => {
      //   // console.log(item, "probabilityPoints.forEach")
      //   switch (item.geologicalDisasterHideDTO.disasterType) {
      //     case "滑坡":
      //       this.dataTypeHiddenDisaster.type1.data.push({
      //         field1: item.geologicalDisasterHideDTO.disasterName,
      //         field2: item.geologicalDisasterHideDTO.position,
      //         field3: item.geologicalDisasterHideDTO.scaleGrade,
      //         field4: item.geologicalDisasterHideDTO.riskGrade,
      //         field5: item.geologicalDisasterHideDTO.lon,
      //         field6: item.geologicalDisasterHideDTO.lat,
      //       });
      //       break;
      //     case "泥石流":
      //       this.dataTypeHiddenDisaster.type2.data.push({
      //         field1: item.geologicalDisasterHideDTO.disasterName,
      //         field2: item.geologicalDisasterHideDTO.position,
      //         field3: item.geologicalDisasterHideDTO.scaleGrade,
      //         field4: item.geologicalDisasterHideDTO.riskGrade,
      //         field5: item.geologicalDisasterHideDTO.lon,
      //         field6: item.geologicalDisasterHideDTO.lat,
      //       });
      //       break;
      //     default:
      //       this.dataTypeHiddenDisaster.type3.data.push({
      //         field1: item.geologicalDisasterHideDTO.disasterName,
      //         field2: item.geologicalDisasterHideDTO.position,
      //         field3: item.geologicalDisasterHideDTO.inspectorName,
      //         field4: item.geologicalDisasterHideDTO.inspectorTele,
      //         field5: item.geologicalDisasterHideDTO.lon,
      //         field6: item.geologicalDisasterHideDTO.lat,
      //       });
      //   }
      // });
    },
    // handleHiddenDisasterPointUpdate(probabilityPoints) {
    //
    //   // 清空表格数据
    //   this.dataTypeHiddenDisaster.type1.data = [];
    //   this.dataTypeHiddenDisaster.type2.data = [];
    //   this.dataTypeHiddenDisaster.type3.data = [];
    //   // 风险区数据，滑坡数据，泥石流数据
    //   probabilityPoints.forEach((item) => {
    //     switch (item.geologicalDisasterHideDTO.disasterType) {
    //       case "滑坡":
    //         this.dataTypeHiddenDisaster.type1.data.push({
    //           field1: item.geologicalDisasterHideDTO.disasterName,
    //           field2: item.geologicalDisasterHideDTO.position,
    //           field3: item.geologicalDisasterHideDTO.scaleGrade,
    //           field4: item.geologicalDisasterHideDTO.riskGrade,
    //           field5: item.geologicalDisasterHideDTO.lon,
    //           field6: item.geologicalDisasterHideDTO.lat,
    //         });
    //         break;
    //       case "泥石流":
    //         this.dataTypeHiddenDisaster.type2.data.push({
    //           field1: item.geologicalDisasterHideDTO.disasterName,
    //           field2: item.geologicalDisasterHideDTO.position,
    //           field3: item.geologicalDisasterHideDTO.scaleGrade,
    //           field4: item.geologicalDisasterHideDTO.riskGrade,
    //           field5: item.geologicalDisasterHideDTO.lon,
    //           field6: item.geologicalDisasterHideDTO.lat,
    //         });
    //         break;
    //       default:
    //         this.dataTypeHiddenDisaster.type3.data.push({
    //           field1: item.geologicalDisasterHideDTO.disasterName,
    //           field2: item.geologicalDisasterHideDTO.position,
    //           field3: item.geologicalDisasterHideDTO.inspectorName,
    //           field4: item.geologicalDisasterHideDTO.inspectorTele,
    //           field5: item.geologicalDisasterHideDTO.lon,
    //           field6: item.geologicalDisasterHideDTO.lat,
    //         });
    //     }
    //   });
    // },
// //子-父-子，控制时间轴暂停与播放
// handleStopTimePlay() {
//   this.stopTimePlay = true; // 用于控制时间轴停止播放的变量
//   console.log(this.stopTimePlay, "this.stopTimePlay")
// },
// handleStartTimePlay() {
//   this.stopTimePlay = false;
  },


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

:deep(.legend) {
  bottom: 55px;
  right: 1vh;
  z-index: 1;
}

</style>
