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
    <!-- 点击弹窗 -->
    <HiddenDisasterPanel
        v-show="showBaseInfo"
        :title="baseInfoTitle"
        :position="PanelPosition"
        :showDisasterInformation="showDisasterInformation"
        :dataTypeHiddenDisaster="dataTypeHiddenDisaster"
        :disasterInformation="disasterInformation"
        :showdebrisFlowInformation="showdebrisFlowInformation"
        :debrisFlowInformation="debrisFlowInformation"
        :showRiskPointsInformation="showRiskPointsInformation"
        :riskPointsInformation="riskPointsInformation"
        :showWaterDisasterInformation="showWaterDisasterInformation"
        :waterDisasterInformation="waterDisasterInformation"
        :showFloodDisasterInformation="showFloodDisasterInformation"
        :floodDisasterInformation="floodDisasterInformation"
        :trigger="'暴雨'"
        :rainInfo="rainInfo"
    />
    <PlotPanel
        :visible="PlotPanelVisible"
        :position="PanelPosition"
        :popupData="PanelData"
        :ifedit="false"
    />

    <timeLinePlay
        :viewer="viewer"
        :disasterEvent="disasterEvent"
        :currentTime="currentTimeString"
        :RealDisasterPlots="realDisasterPoint"
        :firstStartTimeLine="firstStartTimeLine"
    />
    <timeLineLayer
        :viewer="viewer"
        :disasterEvent="disasterEvent"
        :currentTime="currentTimeString"
        :onceLoadLayer="onceLoadLayer"
        @update:onceLoadLayer="onceLoadLayer = $event"
        @update:realDisasterPoint="handleRealDisasterPointUpdate"
        @update:realDisasterPointWithInfo="handleRealDisasterPointUpdateWithInfo"
        @update:hiddenDisasterPoint="handleHiddenDisasterPointUpdate"
    />
    <timeLineLegend/>
    <!--    表格-->
    <RealDisasterTable
        :dataTypes="dataTypesRealDisater"
        :currentTime="currentTime"
    />
    <Table :show="true" :dataTypes="dataTypeHiddenDisaster"></Table>
    <RainInfoTable
        v-if="trigger === '暴雨'"
        :disasterEvent="disasterEvent"
        :currentTime="currentTime"
    />
  </div>
</template>

<script>
import * as Cesium from "cesium";
import "cesium/Source/Widgets/widgets.css";
import {initCesium, init_cesium_navigation, setupMouseCoordinateDisplay} from '@/cesium/initLayer.js'
import {getEarthquakeEventById, getDisasterRainById} from '@/api/system/disasterEvents'
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
import timeLineLegend from "@/components/ScenarioSimulation/timeLineLegend.vue";
//组件
import Legend from "@/components/Earthquake/Legend.vue";
import RealDisasterTable from "@/components/ScenarioSimulation/RealDisasterTable.vue";
import RainInfoTable from "@/components/ScenarioSimulation/rainInfoTable.vue";
import Table from "@/components/Earthquake/Table.vue";
import clickPointsAndShowPanel from "@/cesium/clickPointsAndShowPanel.js";
import PlotPanel from "@/components/Panel/PlotPanel.vue"
import {geomToCoordinates} from "../../../cesium/geomTransfer.js";

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
      PlotPanelVisible: false,
      baseInfoTitle: '',
      showDisasterInformation: false,
      showdebrisFlowInformation: false,
      showRiskPointsInformation: false,
      showWaterDisasterInformation: false,
      showFloodDisasterInformation: false,
      disasterInformation: null,
      debrisFlowInformation: null,
      riskPointsInformation: null,
      waterDisasterInformation: null,
      floodDisasterInformation: null,
      showBaseInfo: false,
      //鼠标位置经纬度
      coordinateBoxData: {longitude: 108, latitude: 34},
      //时间尺
      currentTime: new Date(),
      onceLoadLayer: false,

      //真实发生的灾害点列表
      realDisasterPoint: null,
      dataTypesRealDisater: {
        filterCriteria: [
          {
            name: "人员伤亡",
            value: "type1",
          },
          {
            name: "救援出队",
            value: "type2",
          },
          {
            name: "灾害点",
            value: "type3",
          },
        ],
        type1: {
          // headers: ["滑坡灾害名称", "发生时间", "人员伤亡情况","处置阶段"],
          headers: [
            {name: "发生时间", key: "field1", width: "30%"},
            {name: "位置", key: "field2", width: "15%"},
            {name: "伤亡情况", key: "field3", width: "30%"},
            {name: "人数", key: "field4", width: "15%"}],
          data: [],

        },
        type2: {
          // headers: ["泥石流灾害名称", "发生时间", "人员伤亡情况", "处置阶段"],
          headers: [
            {name: "到达时间", key: "field1", width: "30%"},
            {name: "队伍位置", key: "field2", width: "20%"},
            {name: "队伍状态", key: "field3", width: "15%"},
            {name: "队伍名称", key: "field4", width: "20%"},
            {name: "出队人数", key: "field5", width: "15%"},
          ],
          data: [],
        },
        type3: {
          // headers: ["风险区名称", "发生时间", "人员伤亡情况", "处置阶段"],
          headers: [
            {name: "发生时间", key: "field1", width: "30%"},
            {name: "灾害位置", key: "field2", width: "20%"},
            {name: "灾害类型", key: "field3", width: "20%"},
            {name: "人员伤亡", key: "field4", width: "15%"},
            {name: "处置阶段", key: "field5", width: "15%"}],
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
      matchedHiddenHighlightEntities: null,
      rainInfo: [
        {rainfall: 100, duration: 2, name: "长安区"}
      ],
      rainEffect: null,
      firstStartTimeLine:false,
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
    PlotPanel,
    timeLinePlay,
    timeLineLayer,
    timeLineLegend,
    Legend,

    //表格
    RealDisasterTable,
    RainInfoTable,
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
        let res = await getEarthquakeEventById({id: this.id})
        this.disasterEvent = res.data
        this.disasterEvent.trigger = "地震"
      } else if (this.trigger == "暴雨") {
        let res = await getDisasterRainById({id: this.id})
        this.disasterEvent = res.data
        this.disasterEvent.trigger = "暴雨"


        // 组装 rainInfo
        let rainfallArr = this.disasterEvent.rainfall.split(",");
        // let durationArr = this.disasterEvent.duration.split(",");
        let positionArr = this.disasterEvent.position.split(",");

        this.rainInfo = positionArr.map((name, index) => ({
          name,
          rainfall: Number(rainfallArr[index]),
          // duration: Number(durationArr[index])
        }));

      }
      console.log(this.disasterEvent, "this.disasterEvent")
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
      this.PanelData = {}
      this.PanelData = clickPointsAndShowPanel.extractDataForPanelWithOutGeo(this.centerpoint, this.matchedHiddenHighlightEntities)

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
        if (this.eqCenterPanelVisible || this.rainCenterPanelVisible || this.showBaseInfo || this.PlotPanelVisible) {
          this.updatePopupPosition();
        }
      }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

      setTimeout(() => {
        this.eqCenterPanelVisible = false;
        this.rainCenterPanelVisible = false;
        // viewer.clockViewModel.shouldAnimate = true;
        this.onceLoadLayer = true

        //开启下雨特效
        if (this.disasterEvent.trigger == "暴雨") {
          this.initRainEffect()
        }
      }, 3000);

    },
    initRainEffect() {
      const rainFragmentShader = `
    #version 300 es
    precision highp float;

    uniform sampler2D colorTexture;
    uniform float rainIntensity;
    uniform vec4 rainArea;
    in vec2 v_textureCoordinates;
    out vec4 fragColor;

    float hash(float x){
        return fract(sin(x*23.3)*13.13);
    }

    // 检查点是否在矩形区域内
    bool isInRainArea(vec2 uv, vec4 area) {
        return uv.x >= area.x && uv.x <= area.x + area.z &&
               uv.y >= area.y && uv.y <= area.y + area.w;
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

        // 归一化的屏幕坐标
        vec2 screenUV = gl_FragCoord.xy / resolution;

        // 控制雨滴参数
        float density = 5.0 * rainIntensity;
        float brightness = 20.0 * rainIntensity;
        float threshold = 0.95 - 0.1 * rainIntensity;

        float b=clamp(abs(sin(20.*time*v+uv.y*density))-threshold,0.,1.)*brightness;
        c*=v*b;

        fragColor = mix(
            texture(colorTexture, v_textureCoordinates),
            vec4(c, 1),
            0.5 * rainIntensity
        );
    }
  `;

      this.rainEffect = new Cesium.PostProcessStage({
        fragmentShader: rainFragmentShader,
        uniforms: {
          rainIntensity: 0.5,
          rainArea: new Cesium.Cartesian4(0.25, 0.25, 0.5, 0.5)
        }
      });

      // 添加到场景但默认禁用
      this.viewer.scene.postProcessStages.add(this.rainEffect);
      this.rainEffect.enabled = true;

      // 设置降雨量的方法
      this.setRainIntensity = (value) => {
        this.rainEffect.uniforms.rainIntensity = Math.max(0.0, Math.min(1.0, value));
        this.updateRainUI(value); // 更新UI显示
      };
    },
    //-------信息面板弹框-----
    entitiesClickPonpHandler() {
// 1. 改成带参函数
      const popMap = new Map([
        ['地震中心',  (e) => this.showEqCenter(e)],
        ['暴雨中心',  (e) => this.showRainCenter(e)],
        ['滑坡隐患点',(e) => this.showDisaster('滑坡隐患点', e)],
        ['泥石流隐患点',(e) => this.showDisaster('泥石流隐患点', e)],
        ['风险区域',  (e) => this.showDisaster('风险区域', e)],
        ['内涝隐患点',(e) => this.showDisaster('内涝隐患点', e)],
        ['山洪隐患点',(e) => this.showDisaster('山洪隐患点', e)],
        ['标绘点',    (e) => this.showPlot(e)]
      ]);

      window.viewer.screenSpaceEventHandler.setInputAction(click => {
        // 2. 拿到同像素所有实体
        const picks = viewer.scene.drillPick(click.position);
        if (!Cesium.defined(picks) || picks.length === 0) {
          this.hideAllPanels();
          return;
        }
        picks.forEach((p, idx) => {
          console.log(`[${idx}] 实体：`, p);
        });
        // 3. 找第一个命中业务类型的实体
        const hit = picks.find(p => popMap.has(p.id?.name));
        if (!hit) {
          this.hideAllPanels();
          return;
        }

        const entity = hit.id;
        const type   = entity.name;

        // 4. 触发对应弹框
        popMap.get(type)(entity);

        // 5. 通用：计算世界坐标并更新弹窗位置
        this.selectedEntityPosition = this.calculatePosition(click.position);
        this.updatePopupPosition();
      }, Cesium.ScreenSpaceEventType.LEFT_CLICK);


// 在屏幕空间事件处理器中添加鼠标移动事件的处理逻辑
      window.viewer.screenSpaceEventHandler.setInputAction(movement => {
        // 如果时间线弹窗或路由弹窗可见，则更新弹窗位置
        if (this.eqCenterPanelVisible || this.rainCenterPanelVisible || this.showBaseInfo || this.showInfoPanel || this.PlotPanelVisible) {
          this.updatePopupPosition();
        }
      }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
    },
    /* ---------- 下面是把所有弹框集中管理的辅助函数 ---------- */
    hideAllPanels() {
      this.eqCenterPanelVisible = false;
      this.rainCenterPanelVisible = false;
      this.showBaseInfo = false;
      this.PlotPanelVisible = false;
    },

    showEqCenter(entity) {
      this.hideAllPanels();
      this.eqCenterPanelVisible = true;
      this.PanelData = clickPointsAndShowPanel.extractDataForPanelWithOutGeo(entity, this.matchedHiddenHighlightEntities);
    },

    showRainCenter(entity) {
      this.hideAllPanels();
      this.rainCenterPanelVisible = true;
      this.PanelData = clickPointsAndShowPanel.extractDataForPanelWithOutGeo(entity, this.matchedHiddenHighlightEntities);
    },

    showDisaster(title, entity) {
      console.log(title,entity,"entity showDisaster")
      this.hideAllPanels();
      this.showBaseInfo  = true;
      this.baseInfoTitle = title;

      // 重置所有二级开关
      this.showDisasterInformation      = false;
      this.showdebrisFlowInformation    = false;
      this.showRiskPointsInformation    = false;
      this.showFloodDisasterInformation = false;
      this.showWaterDisasterInformation = false;

      // 重置所有数据
      this.disasterInformation      = null;
      this.debrisFlowInformation    = null;
      this.riskPointsInformation    = null;
      this.floodDisasterInformation = null;
      this.waterDisasterInformation = null;

      // 根据 title 打开对应二级面板 & 设置数据
      switch (title) {
        case '滑坡隐患点':
          this.showDisasterInformation = true;
          this.disasterInformation = clickPointsAndShowPanel.extractDataForPanelWithOutGeo(entity, this.matchedHiddenHighlightEntities);
          break;

        case '泥石流隐患点':
          this.showdebrisFlowInformation = true;
          this.debrisFlowInformation = clickPointsAndShowPanel.extractDataForPanelWithOutGeo(entity, this.matchedHiddenHighlightEntities);
          break;

        case '风险区域':
          this.showRiskPointsInformation = true;
          this.riskPointsInformation = clickPointsAndShowPanel.extractDataForPanelWithOutGeo(entity, this.matchedHiddenHighlightEntities);
          break;

        case '内涝隐患点':
          this.showWaterDisasterInformation = true;
          this.waterDisasterInformation = clickPointsAndShowPanel.extractDataForPanelWithOutGeo(entity, this.matchedHiddenHighlightEntities);
          break;

        case '山洪隐患点':
          this.showFloodDisasterInformation = true;
          this.floodDisasterInformation = clickPointsAndShowPanel.extractDataForPanelWithOutGeo(entity, this.matchedHiddenHighlightEntities);
          break;

        default:
          // 未来扩展
          break;
      }
    },
    showPlot(entity) {
      console.log(entity,"showPlot")
      this.hideAllPanels();
      this.PlotPanelVisible = true;
      this.PanelData = clickPointsAndShowPanel.extractDataForPanelWithOutGeo(entity, this.matchedHiddenHighlightEntities);
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
      this.realDisasterPoint = data
    },
    handleRealDisasterPointUpdateWithInfo(data) {
      this.firstStartTimeLine=true
      console.log(data, "handleRealDisasterPointUpdate")


      this.dataTypesRealDisater.type1.data = [];
      this.dataTypesRealDisater.type2.data = [];
      this.dataTypesRealDisater.type3.data = [];


      // 风险区数据，滑坡数据，泥石流数据
      data.forEach((item) => {
        let plotInfo = item.plotInfo
        let plotTypeInfo = item.plotTypeInfo

        // console.log(plotInfo,plotTypeInfo,"plotInfo,plotTypeInfo")
        if (plotInfo.plotType == "失踪人员" || plotInfo.plotType == "轻伤人员" || plotInfo.plotType == "重伤人员" || plotInfo.plotType == "危重伤人员" || plotInfo.plotType == "死亡人员" || plotInfo.plotType === "被困人员") {
          this.dataTypesRealDisater.type1.data.push({
            field1: timeTransfer.timestampToTimeChina(plotInfo.startTime),
            field2: plotInfo.belongCounty + plotInfo.belongTown,
            field3: plotInfo.plotType,
            field4: plotTypeInfo.newCount,
            field5: Number(geomToCoordinates(plotInfo.geom)[0][0]),
            field6: Number(geomToCoordinates(plotInfo.geom)[0][1]),
            type: "type1",
          });
        } else if (plotInfo.plotType == "已出发队伍" || plotInfo.plotType == "正在参与队伍" || plotInfo.plotType == "待命队伍") {
          this.dataTypesRealDisater.type2.data.push({
            field1: timeTransfer.timestampToTimeChina(plotInfo.startTime),
            field2: plotInfo.belongCounty + plotInfo.belongTown,
            field3: plotInfo.plotType,
            field4: plotTypeInfo.teamName,
            field5: Number(geomToCoordinates(plotInfo.geom)[0][0]),
            field6: Number(geomToCoordinates(plotInfo.geom)[0][1]),
            type: "type2",
          });
        } else {
          let casualties = "-"
          if (plotTypeInfo.casualties) {
            casualties = plotTypeInfo.casualties
          }
          this.dataTypesRealDisater.type3.data.push({
            field1: timeTransfer.timestampToTimeChina(plotInfo.startTime),
            field2: plotInfo.belongCounty + plotInfo.belongTown,
            field3: plotInfo.plotType,
            field4: casualties,
            field5: Number(geomToCoordinates(plotInfo.geom)[0][0]),
            field6: Number(geomToCoordinates(plotInfo.geom)[0][1]),
            type: "type3",
          });
        }
      });
    },
    handleHiddenDisasterPointUpdate(probabilityPoints) {
      // const disasterTypeMap = {
      //   "滑坡": "landslide",
      //   "泥石流": "debris_flow",
      //   "山洪": "torrential_flood",
      //   "内涝": "water_logging",
      //   "堰塞湖": "barrier_lake"
      // };
      console.log(probabilityPoints, "handleHiddenDisasterPointUpdate")
      this.matchedHiddenHighlightEntities = probabilityPoints;
      // 清空表格数据
      this.dataTypeHiddenDisaster.type1.data = [];
      this.dataTypeHiddenDisaster.type2.data = [];
      this.dataTypeHiddenDisaster.type3.data = [];
      this.dataTypeHiddenDisaster.type4.data = [];
      this.dataTypeHiddenDisaster.type5.data = [];
      probabilityPoints.forEach((item) => {
        // 跳过无效数据（检查必要字段是否存在）
        if (!item.disaster_type || !item.level[1] || !item.disaster_probability) {
          return;
        }
        // 获取当前disasterType对应的disaster数组元素
        // let disasterKey = disasterTypeMap[item.disasterType];
        // if (!disasterKey) {
        //   console.warn(`未找到与disasterType "${item.disasterType}" 匹配的映射`);
        //   return;
        // }

        // 找到对应的索引（disaster、level、probability数组顺序一一对应）
        // let index = item.disaster.indexOf(disasterKey);
        // if (index === -1 || index >= item.level.length || index >= item.probability.length) {
        //   console.warn(`在disaster数组中未找到 "${disasterKey}" 或索引超出范围`);
        //   return;
        // }

        // 获取对应的等级和概率
        const level = item.level[1];
        // let lon = item.lon
        // let lat = item.lat
        // let level = item.level[index];
        // let probability = disaster_probability;

        if (level == "高" || level == "中") {
          switch (item.disaster_type) {
            case "滑坡":
              this.dataTypeHiddenDisaster.type1.data.push({
                field1: item.disaster_name,
                field2: item.position,
                field3: item.scale_grade,
                field4: item.risk_grade,
                field5: item.lon,
                field6: item.lat,
              });
              break;
            case "泥石流":
              this.dataTypeHiddenDisaster.type2.data.push({
                field1: item.disaster_name,
                field2: item.position,
                field3: item.scale_grade,
                field4: item.risk_grade,
                field5: item.lon,
                field6: item.lat,
              });
              break;
            case "山洪":
              this.dataTypeHiddenDisaster.type3.data.push({
                field1: item.disaster_name,
                field2: item.position,
                field3: item.scale_grade,
                field4: item.risk_grade,
                field5: item.lon,
                field6: item.lat,
              });
              break;
            case "内涝":
              this.dataTypeHiddenDisaster.type4.data.push({
                field1: item.disaster_name,
                field2: item.position,
                field3: item.scale_grade,
                field4: item.risk_grade,
                field5: item.lon,
                field6: item.lat,
              });
              break;
            default:
              this.dataTypeHiddenDisaster.type5.data.push({
                field1: item.disaster_name,
                field2: item.position,
                field3: "",
                field4: "",
                // field3: item.inspectorName,
                // field4: item.inspectorTele,
                field5: item.lon,
                field6: item.lat,
              });
          }
        }
      })
    },

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
