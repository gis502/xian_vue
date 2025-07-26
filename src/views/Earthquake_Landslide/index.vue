<template>
  <div id="cesium-container" ref="cesiumContainer">
    <!-- 图例 -->
    <Legend></Legend>

    <!-- 表格 -->
    <Table v-if="showTable" :dataTypes="dataTypes"></Table>

    <!-- 图表容器 -->
    <div class="chart-container">
      <div id="main" style="height: 100%"></div>
    </div>

    <!-- 点击弹窗 -->
    <BaseInfo
      v-if="showBaseInfo"
      :title="baseInfoTitle"
      :position="baseInfoPosition"
      :showDisasterInformation="showDisasterInformation"
      :disasterInformation="disasterInformation"
      :showdebrisFlowInformation="showdebrisFlowInformation"
      :debrisFlowInformation="debrisFlowInformation"
      :showRiskPointsInformation="showRiskPointsInformation"
      :riskPointsInformation="riskPointsInformation"
      @removeBaseInfoBox="removeBaseInfoBox"
    />

    <!-- 地震模拟 -->
    <div class="btns-box">
      <el-button type="warning" @click="startEarthquakeSimulation"
        >地震模拟
      </el-button>
      <el-button type="danger" @click="removeEarthquakeSimulation"
        >清除地震模拟
      </el-button>
    </div>

    <!-- 模拟地震弹窗 -->
    <SimulatingEarthquake
      v-if="showEarthquakeSimulation"
      :position="earthquakeSimulationPosition"
      :dataTypes="dataTypes"
      @displayTable="displayTable"
      @cancelEarthquake="cancelEarthquake"
    ></SimulatingEarthquake>

    <!-- 引入各个模拟点：滑坡、泥石流、风险点 -->
    <SimulationPoint></SimulationPoint>
  </div>
</template>

<script setup>
import * as Cesium from "cesium";

import { initCesium } from "@/cesium/initLayer.js";
import * as echarts from "echarts";
import { onMounted, reactive, ref } from "vue";
import BaseInfo from "../../components/Earthquake/BaseInfo.vue";
import SimulatingEarthquake from "../../components/Earthquake/SimulatingEarthquake.vue";
import SimulationPoint from "../../components/Earthquake/SimulationPoint.vue";
import basicLayers from "../../cesium/basicLayers";
import { init_cesium_navigation } from "../../cesium/initLayer";
import layers from "../../cesium/layers";
import { pulseUtils } from "../../cesium/pulse";
import { useSimulationPointStore } from "../../store/earthquake/simulation_points";
import Table from "../../components/Earthquake/Table.vue";
import Legend from "../../components/Earthquake/Legend.vue";

// 表格数据
const dataTypes = reactive({
  filterCriteria: [
    {
      name: "风险区预警点",
      value: "type1",
    },
    {
      name: "滑坡预警点",
      value: "type2",
    },
    {
      name: "泥石流预警点",
      value: "type3",
    },
  ],
  type1: {
    headers: ["风险区名称", "位置", "巡查员姓名", "联系方式"],
    data: [],
  },
  type2: {
    headers: ["滑坡灾害名称", "位置", "规模等级", "险情等级"],
    data: [],
  },
  type3: {
    headers: ["泥石流灾害名称", "位置", "规模等级", "险情等级"],
    data: [],
  },
});

// 显示表格
const showTable = ref(false);

// 弹窗信息
let showBaseInfo = ref(false);
// 弹窗位置
let baseInfoPosition = reactive({
  top: 0,
  left: 0,
});
// 弹窗标题
let baseInfoTitle = ref("");

// 显示滑坡
let showDisasterInformation = ref(false);
let disasterInformation = ref({});
// 显示泥石流
let showdebrisFlowInformation = ref(false);
let debrisFlowInformation = ref({});
// 风险点
let showRiskPointsInformation = ref(false);
let riskPointsInformation = ref({});

// 模拟地震
let showEarthquakeSimulation = ref(false);
let earthquakeSimulationPosition = ref({});
let isMonitoringEarthquake = false;
let earthquakeClickHandler = null;

let entityClickHandler = ref(null);

// 显示表格
function displayTable() {
  showTable.value = true;
}

onMounted(() => {
  load();
});

function load() {
  window.viewer = initCesium("cesium-container");

  // 断裂带
  basicLayers.addFaultZone();

  // 行政区
  basicLayers.loadAdminData();

  // 点击隐患点触发
  setupEntityClickHandler();

  // 罗盘
  init_cesium_navigation(108.948024, 34.263161, window.viewer);

  AddChart();

  window.viewer.cesiumWidget.creditContainer.style.display = "none";
  window.viewer.camera.setView({
    destination: Cesium.Cartesian3.fromDegrees(108.93, 34.27, 200000),
    orientation: {
      heading: Cesium.Math.toRadians(0),
      pitch: Cesium.Math.toRadians(-90),
      roll: 0.0,
    },
  });
}

// 添加chart
function AddChart() {
  let chartDom = document.getElementById("main");
  let myChart = echarts.init(chartDom);
  let option;

  // 定义柱状图形状基础配置
  const myShape = {
    x: 0,
    y: 0,
    width: 10, // 柱体宽度
  };

  // 注册自定义图形（斜角设计）
  const InclinedRoofColumn = echarts.graphic.extendShape({
    shape: myShape,
    buildPath: function (ctx, shape) {
      const xAxisPoint = shape.xAxisPoint;
      const c0 = [shape.x, shape.y - 0]; // 控制斜角倾斜度（-6 表示向左倾斜）
      const c1 = [shape.x - 10, shape.y];
      const c2 = [xAxisPoint[0] - 10, xAxisPoint[1]];
      const c3 = [xAxisPoint[0], xAxisPoint[1]];
      ctx
        .moveTo(c0[0], c0[1])
        .lineTo(c1[0], c1[1])
        .lineTo(c2[0], c2[1])
        .lineTo(c3[0], c3[1])
        .closePath();
    },
  });
  echarts.graphic.registerShape("InclinedRoofColumn", InclinedRoofColumn);

  const gradient = new echarts.graphic.LinearGradient(0, 0, 0, 1, [
    { offset: 0, color: "#438BFD" }, // 顶部颜色
    { offset: 0.5, color: "#13B0D7" }, // 中间颜色
    { offset: 1, color: "#13B0D7" }, // 底部颜色
  ]);

  // 网格配置
  const grid = {
    left: 50,
    right: 50, // 增加右侧边距，为外部标签留出空间
    top: 50,
    bottom: 50,
  };

  // 为每个柱子定义不同的颜色
  const colors = [
    "#e2ac07", // 泥石流受影响点 - 浅绿色
    "#fff700", // 滑坡受影响点 - 蓝色
    "#66c2a5", // 滑坡未受影响点 - 青绿色
    "#e6f598", // 泥石流未受影响点 - 黄绿色
    "#fee08b", // 风险区受影响点 - 浅黄色
    "#fdae61", // 风险区未受影响点 - 橙色
  ];

  // 准备带颜色的柱子数据
  const barData = [5, 1, 0].map((value, index) => ({
    value,
    itemStyle: {
      color: colors[index],
    },
  }));

  option = {
    // 添加标题配置
    title: {
      subtext: "长安区地震影响点统计",
      left: "center",
      top: 0,
      subtextStyle: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "bold", // 加粗字体
        marginBottom: 10, // 底部边距
        textAlign: "center", // 文本居中
        marginTop: 0, // 顶部边距
        paddingTop: 20, // 顶部内边距
      },
    },
    // grid,
    xAxis: {
      type: "category",
      data: ["风险区受影响点", "滑坡受影响点", "泥石流受影响点"],
      axisLabel: {
        textStyle: {
          fontSize: 12, // 设置字体大小为25
        },
        interval: 0,
        margin: 20,
        color: "#fff", // x轴标签保持白色
        rich: {
          wrap: {
            lineHeight: 18,
            align: "center",
            fontSize: 15,
          },
        },
        // formatter: function(params) {
        //   const textMap = {
        //     '滑坡受影响点': '滑坡受\n影响点',
        //     '滑坡未受影响点': '滑坡未受\n影响点',
        //     '泥石流受影响点': '泥石流\n受影响点',
        //     '泥石流未受影响点': '泥石流未受\n影响点',
        //     '风险区受影响点': '风险区\n受影响点',
        //     '风险区未受影响点': '风险区未受\n影响点',
        //   };
        //   return textMap[params] || params;
        // },
      },
      axisLine: {
        lineStyle: {
          color: "#888",
        },
      },
    },
    yAxis: {
      type: "value",
      axisLabel: {
        formatter: "{value}",
        color: "#fff", // y轴标签保持白色
      },
      axisLine: {
        lineStyle: {
          color: "#888",
        },
      },
      splitLine: {
        lineStyle: {
          color: "rgba(255,255,255,0.1)",
        },
      },
    },
    series: [
      {
        data: barData, // 使用带颜色的柱子数据
        type: "custom",
        renderItem: (params, api) => {
          const value = api.value(1);
          const location = api.coord([api.value(0), api.value(1)]); // 柱顶坐标
          const point = api.coord([api.value(0), 0]); // 柱底坐标
          const children = [];
          if (value !== 0) {
            // 只有值不为0时绘制自定义柱状图形
            children.push({
              type: "InclinedRoofColumn", // 使用自定义图形
              shape: {
                x: location[0] + 5, // 水平居中微调
                y: location[1],
                xAxisPoint: [point[0] + 5, point[1]], // 底部对齐
              },
              style: {
                fill: gradient, // 应用渐变色
                shadowColor: "rgba(0, 0, 0, 0.3)",
                shadowBlur: 10,
                shadowOffsetX: 3,
                shadowOffsetY: 3,
              },
            });
          }
          children.push({
            type: "text",
            style: {
              text: api.value(1),
              x: location[0],
              y: location[1] - 10,
              fill: "#fff",
              font: "12px sans-serif",
              textAlign: "center",
              textVerticalAlign: "bottom",
            },
          });
          return {
            type: "group",
            children,
          };
        },
      },
    ],
  };

  option && myChart.setOption(option);
  // 窗口大小变化时自适应图表
  window.addEventListener("resize", () => {
    myChart.resize();
  });
}

// 触发点击实体事件
function setupEntityClickHandler() {
  // 清除旧的事件处理程序
  if (entityClickHandler.value) {
    entityClickHandler.value.destroy();
  }

  // 添加新的事件处理程序
  entityClickHandler = new Cesium.ScreenSpaceEventHandler(window.viewer.canvas);
  entityClickHandler.setInputAction((click) => {
    // 隐藏弹窗
    showBaseInfo.value = false;
    // 获取点击位置的实体
    const pickedObject = window.viewer.scene.pick(click.position);
    // console.log(pickedObject)

    try {
      if (pickedObject && Cesium.defined(pickedObject.id)) {
        const entity = pickedObject.id;
        // console.log(entity.properties);
        // 判断是不是风险区
        let isRisk = true;

        // 显示弹窗
        if (entity.properties) {
          if (
            entity.properties.data._value.geologicalDisasterHideDTO
              .disasterType === "滑坡" ||
            entity.properties.data._value.geologicalDisasterHideDTO
              .disasterType === "泥石流"
          ) {
            isRisk = false; // 不是风险区
          }

          //屏幕坐标转世界坐标
          let cartesian = window.viewer.scene.globe.pick(
            window.viewer.camera.getPickRay(click.position),
            window.viewer.scene
          );
          //世界坐标转经纬度
          let ellipsoid = window.viewer.scene.globe.ellipsoid;
          let cartographic = ellipsoid.cartesianToCartographic(cartesian);
          let lat = Cesium.Math.toDegrees(cartographic.latitude);
          let lon = Cesium.Math.toDegrees(cartographic.longitude);
          window.viewer.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(lon, lat, 5000),
            orientation: {
              // 指向
              heading: 6.283185307179581,
              // 视角
              pitch: -1.5688168484696687,
              roll: 0.0,
            },
            duration: 1.0, // 设置飞行持续时间为1秒（默认约3秒）
            complete: () => {
              // 飞行完成后显示信息窗口
              if (isRisk) {
                showInfoList(entity.properties.data._value, entity, "风险区");
              } else {
                showInfoList(
                  entity.properties.data._value,
                  entity,
                  entity.properties.data._value.geologicalDisasterHideDTO
                    .disasterType
                );
              }
            },
          });
        }
      }
    } catch (error) {}
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
}
// 显示信息
function showInfoList(info, entity, flag) {
  // 隐藏所有信息
  showDisasterInformation.value = false;
  showdebrisFlowInformation.value = false;
  showRiskPointsInformation.value = false;
  // 获取实体位置的屏幕坐标
  const position = entity.position.getValue(window.viewer.clock.currentTime);
  const canvasPosition =
    window.viewer.scene.cartesianToCanvasCoordinates(position);
  if (!canvasPosition) return; // 位置不可见时返回

  // 计算窗口位置（基于屏幕坐标偏移）
  const left = canvasPosition.x + 80; // 右侧显示
  const top = canvasPosition.y + 50; // 垂直居中

  // console.log(info.properties,entity,11111)
  baseInfoPosition.top = top;
  baseInfoPosition.left = left;

  // 构建信息列表内容
  showBaseInfo.value = true;
  if (flag === "滑坡") {
    showDisasterInformation.value = true;
    disasterInformation.value = info;
    baseInfoTitle.value = "灾害信息";
  } else if (flag === "泥石流") {
    showdebrisFlowInformation.value = true;
    debrisFlowInformation.value = info;
    baseInfoTitle.value = "灾害信息";
  } else if (flag === "风险区") {
    showRiskPointsInformation.value = true;
    riskPointsInformation.value = info;
    baseInfoTitle.value = "风险区信息";
  }
}

// 隐藏弹窗
function removeBaseInfoBox() {
  showBaseInfo.value = false;
}

// 模拟地震
function startEarthquakeSimulation() {
  // 如果已经在监听则不再重复添加
  if (isMonitoringEarthquake) return;

  // 保存事件处理函数以便后续移除
  earthquakeClickHandler = new Cesium.ScreenSpaceEventHandler(
    window.viewer.canvas
  );

  // 设置事件监听
  earthquakeClickHandler.setInputAction((event) => {
    if (!showEarthquakeSimulation.value) {
      // 显示弹窗
      showEarthquakeSimulation.value = true;
      earthquakeSimulationPosition.value = event.position;
      const latitudeAndLongitude = getClickedPosition(event.position);
      earthquakeSimulationPosition.value.latitude =
        latitudeAndLongitude.latitude;
      earthquakeSimulationPosition.value.longitude =
        latitudeAndLongitude.longitude;
    }
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

  // 更新监听状态
  isMonitoringEarthquake = true;
}

// 获取点击位置的经纬度
function getClickedPosition(screenPosition) {
  const ray = window.viewer.camera.getPickRay(screenPosition);
  if (!ray) return null;

  const cartesian = window.viewer.scene.globe.pick(ray, window.viewer.scene);
  if (!cartesian) return null;
  const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
  return {
    longitude: Cesium.Math.toDegrees(cartographic.longitude),
    latitude: Cesium.Math.toDegrees(cartographic.latitude),
    cartesian: cartesian,
  };
}

// 隐藏地震模拟
function cancelEarthquake() {
  showEarthquakeSimulation.value = false;

  // 如果正在监听则移除事件
  if (isMonitoringEarthquake && earthquakeClickHandler) {
    earthquakeClickHandler.removeInputAction(
      Cesium.ScreenSpaceEventType.LEFT_CLICK
    );
    isMonitoringEarthquake = false;
    earthquakeClickHandler = null;
  }
}

// 清除地震模拟
function removeEarthquakeSimulation() {
  // 清除烈度圈实体
  layers.removeIsoseismalCircle();

  // 清除脉冲
  pulseUtils.removePulseEntity(useSimulationPointStore(), window.viewer);

  // 隐藏表格
  showTable.value = false;
}
</script>

<style scoped>
#cesium-container {
  width: 100%;
  height: calc(100vh - 50px);
  padding: 0;
  margin: 0;
  position: relative;
}

.chart-container {
  position: absolute;
  bottom: 10px; /* 距离顶部20px */
  left: 20px; /* 距离左侧20px */
  /*background-color: white; !* 与图例背景色一致 *!*/
  background-color: rgba(40, 40, 40, 0.8);
  color: white;
  padding: 15px;
  border-radius: 4px;
  z-index: 1000;
  height: 367px;
  width: 350px; /* 限制表格宽度 */
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3); /* 添加阴影效果 */
  font-size: 14px; /* 调整字体大小 */
  /* position: relative; /* 移除此行，因为子元素的绝对定位不需要它 */
}

.btns-box {
  position: absolute;
  top: 20px;
  left: 580px;
  z-index: 1000;
}
</style>
