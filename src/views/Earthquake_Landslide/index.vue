<template>
  <div id="cesium-container" ref="cesiumContainer">
    <div class="legend">
      <div class="legend-title">图例</div>
      <div class="legend-item"><span class="legend-color" id="centerstar"></span>震中位置</div>
      <div class="legend-item"><div class="legend-color" id="landslide"></div>滑坡隐患点</div>
      <div class="legend-item"><div class="legend-color" id="debrisflow"></div>泥石流隐患点</div>
      <div class="legend-item"><div class="legend-color" id="riskArea"></div>风险区域</div>
      <div class="legend-item"><div class="legend-color" id="earthquakeline"></div>断裂带</div>
    </div>
    <!-- 新增的表格区域 -->
    <div class="data-table">
      <button @click="toggleTableVisibility" class="toggle-table-btn">{{ isTableVisible ? '-' : '+' }}</button>
      <div class="table-title">灾害链影响点列表</div>
      <div class="table-header" v-if="isTableVisible">

        <div class="search-box">
          <input type="text" v-model="searchQuery" placeholder="搜索表格数据..." />
          <button @click="performSearch">搜索</button>
        </div>
        <select v-model="selectedDataType" @change="changeDataType">
          <option value="type1">风险区预警点</option>
          <option value="type2">滑坡预警点</option>
          <option value="type3">泥石流预警点</option>
        </select>
      </div>

      <table v-if="isTableVisible" style="table-layout: fixed;">
        <thead >
          <tr >
            <th style="text-align: center" v-for="(header, index) in tableHeaders" :key="index">{{ header }}</th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="(item, index) in paginatedTableData" :key="index" @click="handleTableClick(item)" >
            <template v-for="(value, key) in item">
              <td v-if="key!=='field5'&&key!=='field6'" style= "white-space:nowrap;overflow:hidden;text-overflow: ellipsis;" :title="value">{{ value }}</td>
            </template>
          </tr>
        </tbody>

      </table>
      <div class="pagination-controls" v-if="isTableVisible">
        <button @click="prevPage" :disabled="currentPage === 1">上一页</button>
        <span>{{ currentPage }} / {{ totalPages }}</span>
        <button @click="nextPage" :disabled="currentPage === totalPages">下一页</button>
        <span class="total-items">共 {{ tableData.length }} 条</span>
      </div>
    </div>


<!--    <div class="container">-->

      <!-- 图表容器 -->
      <div class="chart-container">

        <div id="main" style="height: 100%"></div>
      </div>
<!--    </div>-->
  </div>
</template>

<script setup>
import * as Cesium from 'cesium'
import landslide from '@/assets/landslide/landslide.json'
import landslideIcon from '@/assets/images/landslide.png'
import debrisFlowIcon from '@/assets/images/DebrisFlow.png'
import centerstar from "@/assets/icons/TimeLine/黄点点.png";
import riskArea from '@/assets/images/riskArea.png'
import earthquakeline from '@/assets/images/earthquakeline.png'
import landslide_surface01 from '@/assets/images/landslide_surface01.jpg'
// import lineData from "@/assets/西安断层数据.json";
// import DebrisFlow from "@/assets/西安泥石流灾害点.json"
import DangerAreaData from '@/assets/static/disaster/xian_risk.json'
import CesiumNavigation from "cesium-navigation-es6";
const tdtToken = "31f4628fd3dd7fa4d98dd14042665db1"

// 引入西安行政区划数据
import BaQiaoArea from '@/assets/static/area/BaQiao.json';
import BeiLin from '@/assets/static/area/BeiLin.json';
import ChangAn from '@/assets/static/area/ChangAn.json';
import GaoLing from '@/assets/static/area/GaoLing.json';
import HuYi from '@/assets/static/area/HuYi.json';
import LanTIan from '@/assets/static/area/LanTIan.json';
import LianHu from '@/assets/static/area/LianHu.json';
import LinTong from '@/assets/static/area/LinTong.json';
import WeiYang from '@/assets/static/area/WeiYang.json';
import XinCheng from '@/assets/static/area/XinCheng.json';
import YanLiang from '@/assets/static/area/YanLiang.json';
import YanTa from '@/assets/static/area/YanTa.json';
import ZhouZhi from '@/assets/static/area/ZhouZhi.json';

import * as echarts from 'echarts';
import {initCesium,init_cesium_navigation, setupMouseCoordinateDisplay} from '@/cesium/initLayer.js';
import layers from "@/cesium/layers.js";
import basicLayers from "@/cesium/basicLayers.js";



let weinan = {id:1,disasterName:"陕西省渭南市华州区7.0级地震（模拟）",trigger:"地震",longitude: 109.7,latitude:34.5,magnitude:8}

// 表格数据和分页相关状态
// 新增数据相关状态
const selectedDataType = ref('type1');
const tableHeaders = ref(['风险区名称','位置', '巡查员姓名', '联系方式']);
const searchQuery = ref(''); // 新增搜索关键词

const tableData = ref([
  { field1: '师村六组1(B1)', field2: '陕西省西安市长安区鸣犊街道师村', field3: '赵战民', field4: '17392247317',field5:109.090619,field6:34.164977},
  { field1: '砲里村十组关家(B1)', field2: '陕西省西安市长安区砲里街道砲里村', field3: '王民利', field4: '13892847490',field5:109.142453,field6:34.166387},
  { field1: '白庙村七组北侧(B2)', field2: '陕西省西安市长安区魏寨街道白庙村', field3: '郝旭', field4: '15389237891',field5:109.199251,field6:34.107647},
  { field1: '郭村六组砖厂(C1)', field2: '陕西省西安市长安区鸣犊街道郭村', field3: '肖波', field4: '13002999944',field5:109.110843,field6:34.152221},
  { field1: '三友村七组三联村(B1)', field2: '陕西省西安市长安区大兆街道三友村', field3: '王利军', field4: '15319425419',field5:109.085019,field6:34.144710},
  // 更多数据...
]);

// 不同类型的数据
const dataTypes = {
  type1: {
    headers: [ '风险区名称','位置', '巡查员姓名', '联系方式'],
    data: [
      { field1: '师村六组1(B1)', field2: '陕西省西安市长安区鸣犊街道师村', field3: '赵战民', field4: '17392247317',field5:109.090619,field6:34.164977},
      { field1: '砲里村十组关家(B1)', field2: '陕西省西安市长安区砲里街道砲里村', field3: '王民利', field4: '13892847490',field5:109.142453,field6:34.166387},
      { field1: '白庙村七组北侧(B2)', field2: '陕西省西安市长安区魏寨街道白庙村', field3: '郝旭', field4: '15389237891',field5:109.199251,field6:34.107647},
      { field1: '郭村六组砖厂(C1)', field2: '陕西省西安市长安区鸣犊街道郭村', field3: '肖波', field4: '13002999944',field5:109.110843,field6:34.152221},
      { field1: '三友村七组三联村(B1)', field2: '陕西省西安市长安区大兆街道三友村', field3: '王利军', field4: '15319425419',field5:109.085019,field6:34.144710},
    ]
  },
  type2: {
    headers: ['滑坡灾害名称','位置', '险情等级', '影响面积(m2)'],
    data: [
      { field1: '向阳水库滑坡', field2: '西安市长安区炮里街道炮里村', field3: '小型', field4: '5742.99',field5:"109.13667",field6: "34.17667"},
    ]
  },
  type3: {
    headers: ['泥石流灾害名称', '位置', '规模等级', '影响面积'],
    data: [
      // { field1: 'DEV001', field2: '在线', field3: '区域A', field4: '无' },
      // { field1: 'DEV002', field2: '离线', field3: '区域B', field4: '连接中断' },
      // { field1: 'DEV003', field2: '在线', field3: '区域C', field4: '电量低' },
    ]
  },
};

// 切换数据类型
function changeDataType() {
  const typeData = dataTypes[selectedDataType.value];
  tableHeaders.value = typeData.headers;
  tableData.value = typeData.data;
  searchQuery.value = ''; // 切换数据类型时清空搜索框
  currentPage.value = 1; // 重置到第一页
}

const currentPage = ref(1);
const pageSize = 5; // 每页显示5条数据

// 过滤后的数据
const filteredTableData = computed(() => {
  if (!searchQuery.value) {
    return tableData.value;
  }
  const query = searchQuery.value.toLowerCase();
  return tableData.value.filter(item => {
    return Object.values(item).some(value =>
      String(value).toLowerCase().includes(query)
    );
  });
});

const totalPages = computed(() => Math.ceil(filteredTableData.value.length / pageSize));

const paginatedTableData = computed(() => {
  const start = (currentPage.value - 1) * pageSize;
  const end = start + pageSize;
  return filteredTableData.value.slice(start, end);
});

function nextPage() {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
  }
}

function prevPage() {
  if (currentPage.value > 1) {
    currentPage.value--;
  }
}

function handleTableClick(item){
  // console.log(item.field5,item)
  window.viewer.camera.flyTo({
    destination:Cesium.Cartesian3.fromDegrees(parseFloat(item.field5), parseFloat(item.field6),1000),
    orientation: {
      heading: Cesium.Math.toRadians(0), // 水平偏角，默认正北 0
      pitch: Cesium.Math.toRadians(-90), // 俯视角，默认-90，垂直向下
      roll: 0, // 旋转角
    },
  })
}

const performSearch = () => {
  // 搜索逻辑已经在 filteredTableData 计算属性中实现
  // 这里可以添加其他搜索相关的操作，例如重置当前页码
  currentPage.value = 1;
};

const isTableVisible = ref(true); // 控制表格显示/隐藏的状态

const toggleTableVisibility = () => {
  isTableVisible.value = !isTableVisible.value;
};

onMounted(() => {
  load()
});

let entityClickHandler = ref(null)

function load(){
  // const viewer = new Cesium.Viewer("cesium-container", {
  //   imageryProvider: false,
  //   animation: false,
  //   homeButton: false,
  //   navigationHelpButton: false,
  //   timeline: false,
  //   selectionIndicator: false,
  //   sceneModePicker: false,
  //   infoBox: false,
  //   geocoder: false,
  //   vrButton: false,
  //   fullscreenButton: false,
  //   baseLayerPicker: false,
  // });
  // window.viewer = viewer

  window.viewer = initCesium("cesium-container")
  init_cesium_navigation(108.948024, 34.263161, window.viewer)


  // loadTDT(0)
  layers.DrawEllipse(weinan.longitude, weinan.latitude,weinan.magnitude)
  basicLayers.addCenterPoint(weinan)
  basicLayers.addFaultZone()
  basicLayers.loadAdminData()
  basicLayers.AddHazardSource()
  basicLayers.loadLandSlide()
  basicLayers.AddDangerAreaDataSource()
  layers.haloEntitiesHazardSource(weinan.longitude, weinan.latitude,weinan.magnitude)
  layers.haloEntitiesLandSlide(weinan.longitude, weinan.latitude,weinan.magnitude)
  layers.haloEntitiesDangerAreaDataSource(weinan.longitude, weinan.latitude,weinan.magnitude)

  setupEntityClickHandler()
  AddChart()
  viewer.cesiumWidget.creditContainer.style.display = "none";
  viewer.camera.setView({
    destination: Cesium.Cartesian3.fromDegrees(108.93, 34.27, 200000),
    orientation: {
      heading: Cesium.Math.toRadians(0),
      pitch: Cesium.Math.toRadians(-90),
      roll: 0.0
    }
  });
}


// function loadTDT(type) {
//
//   window.viewer.imageryLayers.removeAll();
//
//   const option = {
//     tileMatrixSetID: "w",
//     format: "tiles",
//     style: "default",
//     minimumLevel: 0,
//     maximumLevel: 18,
//     credit: "Tianditu",
//     subdomains: ["t0", "t1", "t2", "t3", "t4", "t5", "t6", "t7"]
//   };
//
//   if (type === 0) {
//     const imageryProvider = new Cesium.WebMapTileServiceImageryProvider({
//       url: `https://{s}.tianditu.gov.cn/img_w/wmts?tk=${tdtToken}`,
//       layer: "img",
//       ...option
//     });
//
//     const annotationProvider = new Cesium.WebMapTileServiceImageryProvider({
//       url: `https://{s}.tianditu.gov.cn/cia_w/wmts?tk=${tdtToken}`,
//       layer: "cia",
//       ...option
//     });
//
//     window.viewer.imageryLayers.addImageryProvider(imageryProvider);
//     window.viewer.imageryLayers.addImageryProvider(annotationProvider);
//   } else if(type === 1){
//     const vectorProvider = new Cesium.WebMapTileServiceImageryProvider({
//       url: `https://shaanxi.tianditu.gov.cn/ServiceSystem/Tile/rest/service/SxlmgMap/dHfE9g-4JJ2angLq/TileServer`,
//       layer: "raster",
//       ...option
//     });
//     window.viewer.imageryLayers.addImageryProvider(vectorProvider);
//   } else {
//     const vectorProvider = new Cesium.WebMapTileServiceImageryProvider({
//       url: `https://{s}.tianditu.gov.cn/vec_w/wmts?tk=cc`,
//       layer: "vec",
//       ...option
//     });
//     window.viewer.imageryLayers.addImageryProvider(vectorProvider);
//     // const annotationProvider = new Cesium.WebMapTileServiceImageryProvider({
//     //   url: `https://{s}.tianditu.gov.cn/cva_w/wmts?tk=${tdtToken}`,
//     //   layer: "cva",
//     //   ...option
//     // });
//     // window.viewer.imageryLayers.addImageryProvider(annotationProvider);
//   }
//
// }



function addPulseAnimation(haloEntity, baseColor){
  let pulsePhase = 0;
  // 使用定时器创建脉冲效果
  const pulseInterval = setInterval(() => {
    pulsePhase += 0.2; // 稍微加快动画速度
    const alpha = 0.2 + 0.5 * Math.sin(pulsePhase); // 提高透明度范围
    const size = 30 + 20 * Math.sin(pulsePhase); // 增大尺寸变化范围

    haloEntity.point.color = baseColor.withAlpha(alpha);
    haloEntity.point.pixelSize = size;

  }, 100); // 适中的更新频率

  // 存储定时器引用以便清理
  haloEntity.pulseInterval = pulseInterval;
}


function AddChart() {
  let chartDom = document.getElementById('main');
  let myChart = echarts.init(chartDom);
  let option;


  // 定义柱状图形状基础配置
  const myShape = {
    x: 0,
    y: 0,
    width: 10 // 柱体宽度
  };

// 注册自定义图形（斜角设计）
  const InclinedRoofColumn = echarts.graphic.extendShape({
    shape: myShape,
    buildPath: function(ctx, shape) {
      const xAxisPoint = shape.xAxisPoint;
      const c0 = [shape.x, shape.y - 0]; // 控制斜角倾斜度（-6 表示向左倾斜）
      const c1 = [shape.x - 10, shape.y];
      const c2 = [xAxisPoint[0] - 10, xAxisPoint[1]];
      const c3 = [xAxisPoint[0], xAxisPoint[1]];
      ctx.moveTo(c0[0], c0[1])
          .lineTo(c1[0], c1[1])
          .lineTo(c2[0], c2[1])
          .lineTo(c3[0], c3[1])
          .closePath();
    }
  });
  echarts.graphic.registerShape('InclinedRoofColumn', InclinedRoofColumn);

  const gradient = new echarts.graphic.LinearGradient(0, 0, 0, 1, [
    { offset: 0, color: '#438BFD' }, // 顶部颜色
    { offset: 0.5, color: '#13B0D7' }, // 中间颜色
    { offset: 1, color: '#13B0D7' }  // 底部颜色
  ]);


  // 网格配置
  const grid = {
    left: 50,
    right: 50, // 增加右侧边距，为外部标签留出空间
    top: 50,
    bottom: 50
  };

  // 为每个柱子定义不同的颜色
  const colors = [
    '#e2ac07', // 泥石流受影响点 - 浅绿色
    '#fff700', // 滑坡受影响点 - 蓝色
    '#66c2a5', // 滑坡未受影响点 - 青绿色
    '#e6f598', // 泥石流未受影响点 - 黄绿色
    '#fee08b', // 风险区受影响点 - 浅黄色
    '#fdae61', // 风险区未受影响点 - 橙色
  ];

  // 准备带颜色的柱子数据
  const barData = [5, 1, 0].map((value, index) => ({
    value,
    itemStyle: {
      color: colors[index]
    }
  }));

  option = {
    // 添加标题配置
    title: {
      subtext: '长安区地震影响点统计',
      left: 'center',
      top: 0,
      subtextStyle: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold', // 加粗字体
        marginBottom: 10, // 底部边距
        textAlign: 'center', // 文本居中
        marginTop: 0, // 顶部边距
        paddingTop: 20, // 顶部内边距
      }
    },
    // grid,
    xAxis: {
      type: 'category',
      data: ['风险区受影响点','滑坡受影响点','泥石流受影响点',],
      axisLabel: {
        textStyle: {
          fontSize: 12 // 设置字体大小为25
        },
        interval: 0,
        margin: 20,
        color: '#fff', // x轴标签保持白色
        rich: {
          wrap: {
            lineHeight: 18,
            align: 'center',
            fontSize: 15
          }
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
          color: '#888'
        }
      }
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: '{value}',
        color: '#fff' // y轴标签保持白色
      },
      axisLine: {
        lineStyle: {
          color: '#888'
        }
      },
      splitLine: {
        lineStyle: {
          color: 'rgba(255,255,255,0.1)'
        }
      }
    },
    series: [
      {
        data: barData, // 使用带颜色的柱子数据
        type: 'custom',
        renderItem: (params, api) => {

          const value = api.value(1);
          const location = api.coord([api.value(0), api.value(1)]); // 柱顶坐标
          const point = api.coord([api.value(0), 0]); // 柱底坐标
          const children = [];
          if (value !== 0) {
            // 只有值不为0时绘制自定义柱状图形
            children.push({
              type: 'InclinedRoofColumn', // 使用自定义图形
              shape: {
                x: location[0] + 5,  // 水平居中微调
                y: location[1],
                xAxisPoint: [point[0] + 5, point[1]] // 底部对齐
              },
              style: {
                fill: gradient,      // 应用渐变色
                shadowColor: 'rgba(0, 0, 0, 0.3)',
                shadowBlur: 10,
                shadowOffsetX: 3,
                shadowOffsetY: 3
              }
            },)
          }
          children.push({
            type: 'text',
            style: {
              text: api.value(1),
              x: location[0],
              y: location[1] - 10,
              fill: '#fff',
              font: '12px sans-serif',
              textAlign: 'center',
              textVerticalAlign: 'bottom'
            }
          })
          return {
            type: 'group',
            children
          };
        },
      }
    ]
  };

  option && myChart.setOption(option);
  // 窗口大小变化时自适应图表
  window.addEventListener('resize', () => {
    myChart.resize();
  });
}


function setupEntityClickHandler() {
  // 清除旧的事件处理程序
  if (entityClickHandler.value) {
    entityClickHandler.value.destroy();
  }

  // 添加新的事件处理程序
  entityClickHandler = new Cesium.ScreenSpaceEventHandler(window.viewer.canvas);
  entityClickHandler.setInputAction((click) => {
    // 清除现有信息窗口
    const existingWindows = document.querySelectorAll('.cesium-info-window');
    existingWindows.forEach(win => win.remove());
    // 获取点击位置的实体
    const pickedObject = window.viewer.scene.pick(click.position);
    // console.log(pickedObject)
    if (pickedObject && Cesium.defined(pickedObject.id)) {
      const entity = pickedObject.id;
      if (entity.name === "地震中心") {

      }
      else if (entity.properties && entity.properties.data._value.灾害类型 === '滑坡') {
        // console.log(entity.properties)

        //屏幕坐标转世界坐标
        let cartesian = window.viewer.scene.globe.pick(window.viewer.camera.getPickRay(click.position),window.viewer.scene);
        //世界坐标转经纬度
        let ellipsoid=window.viewer.scene.globe.ellipsoid;
        let cartographic=ellipsoid.cartesianToCartographic(cartesian);
        let lat=Cesium.Math.toDegrees(cartographic.latitude);
        let lon=Cesium.Math.toDegrees(cartographic.longitude);
        window.viewer.camera.flyTo({
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
            showInfoList(entity.properties,entity,"滑坡");
          }

        });
      }else if(entity.properties && entity.properties.data._value.properties.灾害类型 === "泥石流"){
        // console.log(entity.properties.data._value)
        //屏幕坐标转世界坐标
        let cartesian = window.viewer.scene.globe.pick(window.viewer.camera.getPickRay(click.position),window.viewer.scene);
        //世界坐标转经纬度
        let ellipsoid=window.viewer.scene.globe.ellipsoid;
        let cartographic=ellipsoid.cartesianToCartographic(cartesian);
        let lat=Cesium.Math.toDegrees(cartographic.latitude);
        let lon=Cesium.Math.toDegrees(cartographic.longitude);
        window.viewer.camera.flyTo({
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
            showInfoList(entity.properties.data._value,entity,"泥石流");
          }

          });
      }else if(entity.properties){
        try {
          // console.log(entity.properties.data._value)
          //屏幕坐标转世界坐标
          let cartesian = window.viewer.scene.globe.pick(window.viewer.camera.getPickRay(click.position),window.viewer.scene);
          //世界坐标转经纬度
          let ellipsoid=window.viewer.scene.globe.ellipsoid;
          let cartographic=ellipsoid.cartesianToCartographic(cartesian);
          let lat=Cesium.Math.toDegrees(cartographic.latitude);
          let lon=Cesium.Math.toDegrees(cartographic.longitude);
          window.viewer.camera.flyTo({
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
              showInfoList(entity.properties.data._value,entity,"风险区");
            }
          });
        }catch (e) {
          console.log(e)
        }
      }
    }else{

    }
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
}

function showInfoList(info,entity,flag) {
  // 清除现有信息窗口
  const existingWindows = document.querySelectorAll('.cesium-info-window');
  existingWindows.forEach(win => win.remove());

  // 获取实体位置的屏幕坐标
  const position = entity.position.getValue(window.viewer.clock.currentTime);
  const canvasPosition = window.viewer.scene.cartesianToCanvasCoordinates(position);
  if (!canvasPosition) return; // 位置不可见时返回

  // 创建信息列表DOM（可替换为框架组件）
  const container = document.createElement('div');
  container.className = 'cesium-info-window';

  // 计算窗口位置（基于屏幕坐标偏移）
  const left = canvasPosition.x + 240; // 右侧显示
  const top = canvasPosition.y + 60; // 垂直居中

  container.style.cssText = `
        position: fixed;
        left: ${left}px;
        top: ${top-10}px;

        background: white;
        border-radius: 4px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        padding: 0px;
        z-index: 1000;
        max-height: 450px;
        overflow-y: auto;
      `;

  // console.log(info.properties,entity,11111)

  // 构建信息列表内容
  if (flag === "滑坡" && info.data._value["灾害类型"] === '滑坡') {
    container.innerHTML = `
        <div class="disaster-popup">
            <div class="popup-header">
                <h3>灾害信息</h3>
                <button onclick="this.parentNode.parentNode.remove()" class="close-btn">关闭</button>
            </div>
            <table class="disaster-info-table">
                <tbody>
                    <tr>
                        <td class="label">野外编号</td>
                        <td>${info.data._value["野外编号"]}</td>
                    </tr>
                    <tr>
                        <td class="label">灾害点名称</td>
                        <td>${info.data._value["灾害点名称"]}</td>
                    </tr>
                    <tr>
                        <td class="label">规模等级</td>
                        <td>${info.data._value["规模等级"]}</td>
                    </tr>
                    <tr>
                        <td class="label">险情等级</td>
                        <td>${info.data._value["险情等级"]}</td>
                    </tr>
                    <tr>
                        <td class="label">受灾面积</td>
                        <td>${parseFloat(info.data._value["面积"]).toFixed(2)}平方米</td>
                    </tr>
                    <tr>
                        <td class="label">地理位置</td>
                        <td>${info.data._value["地理位置"]}</td>
                    </tr>
                    <tr>
                      <td class="label">经度</td>
                      <td>东经${info.data._value["lon"]}</td>
                    </tr>
                    <tr>
                      <td class="label">纬度</td>
                      <td>北纬${info.data._value["lat"]}</td>
                    </tr>
                </tbody>
            </table>
        </div>
    `;
  } else if (flag === "泥石流" && info.properties["灾害类型"] === '泥石流') {
    container.innerHTML = `
        <div class="disaster-popup">
            <div class="popup-header">
                <h3>灾害信息</h3>
                <button onclick="this.parentNode.parentNode.remove()" class="close-btn">关闭</button>
            </div>
            <table class="disaster-info-table">
                <tbody>
                    <tr>
                        <td class="label">灾害点名称</td>
                        <td>${info.properties["灾害点名称"]}</td>
                    </tr>
                    <tr>
                        <td class="label">野外编号</td>
                        <td>${info.properties["野外编号"]}</td>
                    </tr>
                    <tr>
                        <td class="label">规模等级</td>
                        <td>${info.properties["规模等级"]}</td>
                    </tr>
                    <tr>
                        <td class="label">险情等级</td>
                        <td>${info.properties["险情等级"]}</td>
                    </tr>
                    <tr>
                        <td class="label">地理位置</td>
                        <td>${info.properties["地理位置"]}</td>
                    </tr>
                    <tr>
                      <td class="label">经度</td>
                      <td>${info.properties["lon"]}</td>
                    </tr>
                    <tr>
                      <td class="label">纬度</td>
                      <td>${info.properties["lat"]}</td>
                    </tr>
                </tbody>
            </table>
        </div>
    `;
  } else if (flag === "风险区") {
    container.innerHTML = `
        <div class="disaster-popup">
            <div class="popup-header">
                <h3>风险区信息</h3>
                <button onclick="this.parentNode.parentNode.remove()" class="close-btn">关闭</button>
            </div>
            <table class="disaster-info-table">
                <tbody>
                    <tr>
                        <td class="label">风险区名称</td>
                        <td>${info.properties["disasterName"]}</td>
                    </tr>
                    <tr>
                        <td class="label">统一编号</td>
                        <td>${info.properties["unitCode"]}</td>
                    </tr>
                    <tr>
                        <td class="label">住房</td>
                        <td>${info.properties["housing"]} 间</td>
                    </tr>
                    <tr>
                        <td class="label">常住人口</td>
                        <td>${info.properties["permanentPopulation"]} 人</td>
                    </tr>
                    <tr>
                        <td class="label">居民户数</td>
                        <td>${info.properties["residentCounts"]} 户</td>
                    </tr>
                    <tr>
                        <td class="label">威胁财产</td>
                        <td>${info.properties["riskProperty"]} 万元</td>
                    </tr>
                    <tr>
                        <td class="label">巡查员姓名</td>
                        <td>${info.properties["username"]}</td>
                    </tr>
                    <tr>
                        <td class="label">巡查员手机号</td>
                        <td>${info.properties["phone"]}</td>
                    </tr>
                    <tr>
                        <td class="label">位置</td>
                        <td>${info.properties["position"]}</td>
                    </tr>
                    <tr>
                      <td class="label">经度</td>
                      <td>${info.properties["lon"]}</td>
                    </tr>
                    <tr>
                      <td class="label">纬度</td>
                      <td>${info.properties["lat"]}</td>
                    </tr>
                </tbody>
            </table>
        </div>
    `;
  }

// 添加以下 CSS 样式，让表格更美观
  const style = document.createElement('style');
  style.textContent = `
    .disaster-popup {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 0px;
        border-radius: 6px;
        overflow: hidden;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1); /* 减小阴影 */

    }
    .popup-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        background-color: #f8f9fa;
        padding: 2px 15px;
        border-bottom: 1px solid #e9ecef;
    }
    .popup-header h3 {
        font-size: 14px;
        font-weight: bold;
        font-family: 'Source Han Sans CN';
    }
    .disaster-info-table {
        width: 100%;
        border-collapse: collapse;

    }
    .disaster-info-table th, .disaster-info-table td {
        padding: 8px;
        border-top: 1px solid #ddd;  /* 保留上边框 */
        border-bottom: 1px solid #ddd;  /* 保留底边框 */
        border-left: none;  /* 去除左边框 */
        border-right: none;  /* 去除右边框 */
        text-align: left;
        font-family: 'Source Han Sans CN';
        font-size: 13px;
    }
    .disaster-info-table .label {
        color: #333;
        width: 30%;
        font-size: 13px;
    }
    .close-btn {
        font-weight: nom;
        background:none;
        border: none;
        padding: 5px 10px;
        cursor: pointer;
        font-size: 14px; /* 减小标题字体大小 */
        color: #6c757d;
        transition: color 0.2s;
    }

`;
  document.head.appendChild(style);

  // 添加到页面
  document.body.appendChild(container);
  // 检查是否超出视口边界并调整位置
  adjustWindowPosition(container);
  window.currentInfoWindow = {
    element: container,
    initialLeft: left,
    initialTop: top,
    entityId: entity.id
  };
}

function adjustWindowPosition(container) {
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
  font-size: 16px; /* 缩小字体 */
}

.legend-color {
  width: 20px;
  height: 20px;
  margin-right: 8px; /* 调整颜色块与文字间距 */
  /*border: 1px solid rgba(255, 255, 255, 0.3);  浅色边框 */
}

#earthquake{
  background-image: url("../../assets/images/earthquake.png");
  background-size: cover;
}
#debrisflow{
  background-image: url("../../assets/images/DebrisFlow.png");
  background-size: cover;
}
#landslide{
  background-image: url("../../assets/images/landslide.png");
  background-size: cover;
}
#riskArea{
  background-image: url("../../assets/images/riskArea.png");
  background-size: cover;
}
#earthquakeline{
  background-image: url("../../assets/images/earthquakeline.png");
  background-size: cover;
}

.data-table {
  position: absolute;
  top: 20px; /* 距离顶部20px */
  left: 20px; /* 距离左侧20px */
  background-color: rgba(40, 40, 40, 0.8); /* 与图例背景色一致 */
  color: white;
  padding: 15px;
  border-radius: 4px;
  z-index: 1000;
  width: 550px; /* 限制表格宽度 */
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3); /* 添加阴影效果 */
  font-size: 14px; /* 调整字体大小 */
  /* position: relative; /* 移除此行，因为子元素的绝对定位不需要它 */
}

.toggle-table-btn {
  position: absolute;
  top: 5px; /* 调整按钮位置 */
  left: 5px; /* 调整按钮位置 */
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 50%; /* 圆形按钮 */
  width: 25px; /* 按钮宽度 */
  height: 25px; /* 按钮高度 */
  font-size: 14px;
  line-height: 1; /* 垂直居中文本 */
  text-align: center;
  cursor: pointer;
  z-index: 1001; /* 确保按钮在表格内容之上 */
  display: flex;
  justify-content: center;
  align-items: center;
}

.toggle-table-btn:hover {
  background-color: #0056b3;
}

.table-title {
  font-weight: bold;
  margin-bottom: 10px;
  font-size: 16px;
  text-align: center;
  margin-top: 0; /* 将 margin-top 设置为0，避免空白区域 */
  padding-top: 20px; /* 增加内边距，为按钮留出空间 */
}




.data-table table {
  width: 100%;
  border-collapse: collapse; /* 合并边框 */
}

.data-table th,
.data-table td {
  height: 50px;
  border: 1px solid rgba(255, 255, 255, 0.2); /* 浅色边框 */
  padding: 8px 12px;
  text-align: center;
  font-size: 14px;
}

.data-table th {
  background-color: rgba(60, 60, 60, 0.9); /* 表头背景色 */
  font-weight: bold;
}

.data-table tbody tr:nth-child(even) {
  background-color: rgba(50, 50, 50, 0.7); /* 斑马纹效果 */
}

.data-table tbody tr:hover {
  background-color: rgba(70, 70, 70, 0.9); /* 鼠标悬停效果 */
}

.pagination-controls {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 10px;
  gap: 10px;
}

.pagination-controls button {
  background-color: #007bff;
  color: white;
  border: none;
  padding: 5px 10px;
  border-radius: 3px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.pagination-controls button:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
}

.pagination-controls button:hover:not(:disabled) {
  background-color: #0056b3;
}

.pagination-controls span {
  font-size: 14px;
  font-weight: bold;
}

.total-items {
  margin-left: 10px;
  font-size: 14px;
  color: #ccc;
}

/* 新增样式 */
.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  gap: 10px; /* 增加整体元素之间的间距 */
}

.data-table select,
.search-box input {
  height: 34px; /* 统一高度 */
  padding: 5px 10px;
  border-radius: 4px;
  background-color: rgba(60, 60, 60, 0.9);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-sizing: border-box; /* 确保padding和border包含在height内 */
}

.search-box {
  display: flex; /* 使搜索框和按钮在同一行 */
  align-items: center;
  gap: 5px; /* 搜索框和按钮之间的间距 */
  flex-grow: 1; /* 允许搜索框占据更多空间 */
}

.search-box input {
  flex-grow: 1; /* 搜索框占据剩余空间 */
  width: auto; /* 移除固定宽度 */
}

.search-box button {
  background-color: #007bff;
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s ease;
  height: 34px; /* 统一高度 */
  box-sizing: border-box; /* 确保padding和border包含在height内 */
  white-space: nowrap; /* 防止按钮文字换行 */
}

.search-box button:hover {
  background-color: #0056b3;
}

.data-table select {
  flex-shrink: 0; /* 防止下拉菜单被压缩 */
}

::v-deep .compass {
  position: absolute;
  top: 15px;
}

::v-deep .navigation-controls {
  position: absolute;
  top: 120px;
}

.container {

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



</style>
