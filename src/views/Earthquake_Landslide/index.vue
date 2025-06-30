<template>
  <div id="cesium-container" ref="cesiumContainer">
    <div class="legend">
      <div class="legend-title">图例</div>
      <div class="legend-item"><span class="legend-color" id="earthquake"></span>震中位置</div>
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

      <table v-if="isTableVisible">
        <thead >
          <tr >
            <th style="text-align: center" v-for="(header, index) in tableHeaders" :key="index">{{ header }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, index) in paginatedTableData" :key="index" @click="handleTableClick(item)">
            <template v-for="(value, key) in item">
              <td v-if="key!=='field5'&&key!=='field6'">{{ value }}</td>
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
  </div>
</template>

<script setup>
import * as Cesium from 'cesium';
import landslide from '@/assets/landslide/landslide.json'
import landslideIcon from '@/assets/images/landslide.png'
import debrisFlowIcon from '@/assets/images/DebrisFlow.png'
import earthquake from '@/assets/images/earthquake.png'
import riskArea from '@/assets/images/riskArea.png'
import earthquakeline from '@/assets/images/earthquakeline.png'
import landslide_surface01 from '@/assets/images/landslide_surface01.jpg'
import lineData from "@/assets/西安断层数据.json";
import DebrisFlow from "@/assets/西安泥石流灾害点.json"
import DangerAreaData from '@/assets/static/disaster/xian_risk.json'
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


let administrationData = reactive([BaQiaoArea, BeiLin, ChangAn, GaoLing, HuYi, LanTIan, LianHu, LinTong, WeiYang, XinCheng, YanLiang, YanTa, ZhouZhi])
let districtColors = ref(null)
let weinan = {longitude: 109.7,latitude:34.5}
let EllipseAxis = {a:null,b:null}

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
    headers: [ '风险区名称','位置', '巡查员', '联系方式'],
    data: [
      { field1: '师村六组1(B1)', field2: '陕西省西安市长安区鸣犊街道师村', field3: '赵战民', field4: '17392247317',field5:109.090619,field6:34.164977},
      { field1: '砲里村十组关家(B1)', field2: '陕西省西安市长安区砲里街道砲里村', field3: '王民利', field4: '13892847490',field5:109.142453,field6:34.166387},
      { field1: '白庙村七组北侧(B2)', field2: '陕西省西安市长安区魏寨街道白庙村', field3: '郝旭', field4: '15389237891',field5:109.199251,field6:34.107647},
      { field1: '郭村六组砖厂(C1)', field2: '陕西省西安市长安区鸣犊街道郭村', field3: '肖波', field4: '13002999944',field5:109.110843,field6:34.152221},
      { field1: '三友村七组三联村(B1)', field2: '陕西省西安市长安区大兆街道三友村', field3: '王利军', field4: '15319425419',field5:109.085019,field6:34.144710},
    ]
  },
  type2: {
    headers: ['滑坡灾害名称','位置', '险情等级', '影响面积'],
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
  console.log(item.field5,item)
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
  const viewer = new Cesium.Viewer("cesium-container", {
    imageryProvider: false,
    animation: false,
    homeButton: false,
    navigationHelpButton: false,
    timeline: false,
    selectionIndicator: false,
    sceneModePicker: false,
    infoBox: false,
    geocoder: false,
    vrButton: false,
    fullscreenButton: false,
    baseLayerPicker: false,
  });
  window.viewer = viewer

  loadTDT(0)
  DrawEllipse(weinan.longitude, weinan.latitude)
  loadLandSlide(landslide)
  weiNanEarthquake()
  earthquakeLine()
  earthquakeLine()
  AddHazardSource()
  loadAdminData(administrationData)
  AddDangerAreaDataSource(DangerAreaData)
  setupEntityClickHandler()
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

function weiNanEarthquake() {
  // console.log(Cesium.Cartesian3.fromDegrees(109.7, 34.5),111)
  window.viewer.entities.add({
    // fromDegrees（经度，纬度，高度，椭球，结果）从以度为单位的经度和纬度值返回Cartesian3位置
    position: Cesium.Cartesian3.fromDegrees(109.7, 34.5),
    billboard: {
      image: earthquake,
      width: 100, // 图片宽度,单位px
      height: 100, // 图片高度，单位px
      eyeOffset: new Cesium.Cartesian3(0, 0, 0), // 与坐标位置的偏移距离
      color: Cesium.Color.WHITE.withAlpha(1), // 固定颜色
      scale: 0.8, // 缩放比例
      heightReference: Cesium.HeightReference.CLAMP_TO_GROUND, // 绑定到地形高度
      scaleByDistance: new Cesium.NearFarScalar(500, 1, 5e5, 0.1),
      depthTest: false, // 禁止深度测试
      disableDepthTestDistance: Number.POSITIVE_INFINITY // 不进行深度测试
    },
    label: {
      text: "陕西省渭南市华州区8.0级地震（模拟）",
      font: '40px',
      fillColor: Cesium.Color.BLACK,
      backgroundColor: Cesium.Color.WHITE.withAlpha(0.7),
      padding: new Cesium.Cartesian2(5, 5),
      showBackground: true,
      verticalOrigin: Cesium.VerticalOrigin.CENTER, // 将垂直原点设置为中心
      eyeOffset: new Cesium.Cartesian3(100, 500, 0), // 像素偏移量设置为0
      // heightReference: Cesium.HeightReference.CLAMP_TO_GROUND, // 移除此行，因为position已经确定了高度
      show: true, // 使用统一的显示控制
      zIndex: 10000, // 调整z-index值
    },
    properties: {

    }
  })
}

function earthquakeLine(){
  let line_data = []
  lineData.features.forEach(line => {
    // console.log(line.geometry)
    line_data.push(line.geometry)
  })

  line_data.forEach(Lon_Lat => {
    let FaultZone = []
    Lon_Lat.coordinates.forEach(LonLat => {
      LonLat.forEach(point => {
        FaultZone.push(Number(point))
      })
    })
    window.viewer.entities.add({
      polyline: {
        positions: Cesium.Cartesian3.fromDegreesArray(FaultZone),
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
      },
      // label
    });
  })
}

function loadTDT(type) {

  window.viewer.imageryLayers.removeAll();

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
      url: `https://{s}.tianditu.gov.cn/img_w/wmts?tk=${tdtToken}`,
      layer: "img",
      ...option
    });

    const annotationProvider = new Cesium.WebMapTileServiceImageryProvider({
      url: `https://{s}.tianditu.gov.cn/cia_w/wmts?tk=${tdtToken}`,
      layer: "cia",
      ...option
    });

    window.viewer.imageryLayers.addImageryProvider(imageryProvider);
    window.viewer.imageryLayers.addImageryProvider(annotationProvider);
  } else if(type === 1){
    const vectorProvider = new Cesium.WebMapTileServiceImageryProvider({
      url: `https://shaanxi.tianditu.gov.cn/ServiceSystem/Tile/rest/service/SxlmgMap/dHfE9g-4JJ2angLq/TileServer`,
      layer: "raster",
      ...option
    });
    window.viewer.imageryLayers.addImageryProvider(vectorProvider);
  } else {
    const vectorProvider = new Cesium.WebMapTileServiceImageryProvider({
      url: `https://{s}.tianditu.gov.cn/vec_w/wmts?tk=cc`,
      layer: "vec",
      ...option
    });
    window.viewer.imageryLayers.addImageryProvider(vectorProvider);
    // const annotationProvider = new Cesium.WebMapTileServiceImageryProvider({
    //   url: `https://{s}.tianditu.gov.cn/cva_w/wmts?tk=${tdtToken}`,
    //   layer: "cva",
    //   ...option
    // });
    // window.viewer.imageryLayers.addImageryProvider(annotationProvider);
  }

}

function loadLandSlide(landslide) {
  for(let i=0;i<landslide.length;i++){
    console.log(landslide[i])
    let lon = landslide[i].lon
    let lat =landslide[i].lat
    if(isPointInEllipse(parseFloat(lon),parseFloat(lat),weinan.longitude,weinan.latitude,EllipseAxis.a,EllipseAxis.b)){
      console.log(landslide[i])
      window.viewer.entities.add({
        // fromDegrees（经度，纬度，高度，椭球，结果）从以度为单位的经度和纬度值返回Cartesian3位置
        position: Cesium.Cartesian3.fromDegrees(parseFloat(lon), parseFloat(lat)),
        billboard: {
          image: landslideIcon,
          width: 50, // 图片宽度,单位px
          height: 50, // 图片高度，单位px
          eyeOffset: new Cesium.Cartesian3(0, 0, 0), // 与坐标位置的偏移距离
          color: Cesium.Color.WHITE.withAlpha(1), // 固定颜色
          scale: 0.8, // 缩放比例
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND, // 绑定到地形高度
          scaleByDistance: new Cesium.NearFarScalar(500, 1, 5e5, 0.1),
          depthTest: false, // 禁止深度测试
          disableDepthTestDistance: Number.POSITIVE_INFINITY, // 不进行深度测试
          zIndex:99999999,
        },
        properties: {
          data:landslide[i]
        },
        // userData: {
        //   type: 'LandSlide',
        //   info: pointInfo,
        //   originalPosition: { lon, lat } // 保存原始经纬度
        // }
      })
      // 创建光晕实体
      const haloEntity = window.viewer.entities.add({
        position: Cesium.Cartesian3.fromDegrees(parseFloat(lon), parseFloat(lat)),
        point: {
          pixelSize: 40, // 增大光晕大小，使其更明显
          color: Cesium.Color.RED.withAlpha(0.4), // 提高透明度，使其更明显
          outlineColor: Cesium.Color.RED.withAlpha(1.0), // 完全不透明的边框
          outlineWidth: 3, // 适中的边框宽度
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
          disableDepthTestDistance: Number.POSITIVE_INFINITY // 确保不被地形遮挡
        }
      });
      addPulseAnimation(haloEntity,Cesium.Color.RED)
      // 添加脉冲动画效果

      // 根据点路线绘制多边形影响范围，如果没有点路线则绘制圆形
      if (landslide[i].点路线 && landslide[i].点路线.length > 0) {
        const routePoints = [];
        const polylinePositions = []; // 用于存储折线点的数组
        const bufferWidth = 20; // 缓冲区宽度（米），您可以根据需要调整此值

        // 收集并验证所有有效的路线点
        for (let j = 0; j < landslide[i].点路线.length; j++) {
          const currentPointData = landslide[i].点路线[j];
          // if (!Array.isArray(currentPointData) || currentPointData.length === 0 || !Array.isArray(currentPointData[0]) || currentPointData[0].length < 2) {
          //   console.warn(`无效的点数据结构，索引 ${i}，点路线索引 ${j}:`, currentPointData);
          //   continue;
          // }

          const point = currentPointData[0];
          const lon = parseFloat(point[0]);
          const lat = parseFloat(point[1]);

          if (!isNaN(lon) && !isNaN(lat) && lon >= -180 && lon <= 180 && lat >= -90 && lat <= 90) {

            routePoints.push(Cesium.Cartesian3.fromDegrees(lon, lat)); // 存储为Cesium.Cartesian3对象
            polylinePositions.push(lon, lat); // 添加到折线点数组
          } else {
            console.warn(`无效的坐标值，索引 ${i}，点路线索引 ${j}: lon=${point[0]}, lat=${point[1]}`);
          }
        }

        // console.log(polylinePositions)
        // 绘制原始点路线
        if (polylinePositions.length >= 4) { // 至少需要两个点（4个坐标值）才能绘制线
          window.viewer.entities.add({
            polyline: {
              positions: Cesium.Cartesian3.fromDegreesArray(polylinePositions),
              width: 20, // 线条宽度
              material: new Cesium.PolylineArrowMaterialProperty(Cesium.Color.YELLOW), // 使用箭头材质
              clampToGround: true // 贴地显示
            },
            properties: {
              data: landslide[i],
              type: 'landslide_route'
            }
          });
          console.log(window.viewer.entities,8989)
        }

        // 绘制影响范围多边形（缓冲区）
        if (routePoints.length >= 1) { // 至少一个点才能考虑扇形或圆形
          console.log(3333)
          // 将 generateSmoothBuffer 函数定义移动到此处，作为 loadLandSlide 的内部函数
          const generateSmoothBuffer = (routePoints, bufferWidth) => { // 移除 fanAngle 参数
            const interpolatedPoints = [];
            const segmentInterpolationCount = 50; // 每段插值点数

            // 如果只有一个点，直接生成圆形（360度扇形）
            if (routePoints.length === 1) {
              const centerPoint = routePoints[0];
              const radius = bufferWidth;
              const positions = [];
              const numSegments = 60; // 扇形分段数

              for (let k = 0; k <= numSegments; k++) {
                const angle = (k / numSegments) * 360; // 0到360度
                const radian = Cesium.Math.toRadians(angle);

                // 计算扇形边界点，使用更精确的地理坐标计算
                const cartographic = Cesium.Cartographic.fromCartesian(centerPoint);
                const longitude = cartographic.longitude + (radius / Cesium.Ellipsoid.WGS84.maximumRadius) * Math.sin(radian);
                const latitude = cartographic.latitude + (radius / Cesium.Ellipsoid.WGS84.maximumRadius) * Math.cos(radian);
                positions.push(Cesium.Cartesian3.fromRadians(longitude, latitude));
              }
              return new Cesium.PolygonHierarchy(positions);
            }

            // 处理多点路线的平滑缓冲区
            const leftPoints = [];
            const rightPoints = [];

            // 遍历所有线段，生成平滑缓冲区
            for (let j = 0; j < routePoints.length - 1; j++) { // 遍历到倒数第二个点
              const start = routePoints[j];
              const end = routePoints[j + 1];

              interpolatedPoints.push(start);

              for (let k = 1; k < segmentInterpolationCount; k++) {
                const ratio = k / segmentInterpolationCount;
                const interpolated = Cesium.Cartesian3.lerp(
                    start,
                    end,
                    ratio,
                    new Cesium.Cartesian3()
                );
                interpolatedPoints.push(interpolated);
              }
            }
            // 添加最后一个原始点
            interpolatedPoints.push(routePoints[routePoints.length - 1]);

            // 计算平滑的缓冲区边界点
            for (let j = 0; j < interpolatedPoints.length; j++) {
              const prev = j > 0 ? interpolatedPoints[j - 1] : interpolatedPoints[j];
              const next = j < interpolatedPoints.length - 1 ? interpolatedPoints[j + 1] : interpolatedPoints[j];

              const forwardVec = Cesium.Cartesian3.subtract(next, prev, new Cesium.Cartesian3());
              Cesium.Cartesian3.normalize(forwardVec, forwardVec);

              const normal = Cesium.Ellipsoid.WGS84.geodeticSurfaceNormal(interpolatedPoints[j], new Cesium.Cartesian3());
              const perpendicular = Cesium.Cartesian3.normalize(Cesium.Cartesian3.cross(normal, forwardVec, new Cesium.Cartesian3()), new Cesium.Cartesian3());

              const scaledPerpendicular = Cesium.Cartesian3.multiplyByScalar(
                  perpendicular,
                  bufferWidth,
                  new Cesium.Cartesian3()
              );

              const leftPoint = Cesium.Cartesian3.add(
                  interpolatedPoints[j],
                  scaledPerpendicular,
                  new Cesium.Cartesian3()
              );
              const rightPoint = Cesium.Cartesian3.subtract(
                  interpolatedPoints[j],
                  scaledPerpendicular,
                  new Cesium.Cartesian3()
              );

              leftPoints.push(leftPoint);
              rightPoints.push(rightPoint);
            }

            // 组合成闭合多边形：左侧点 + 右侧点（反向）
            const polygonPositions = [...leftPoints, ...rightPoints.reverse()];

            return new Cesium.PolygonHierarchy(polygonPositions);
          };

          // 调用新的平滑缓冲区生成方法
          const polygonHierarchy = generateSmoothBuffer(routePoints, bufferWidth);

          // 如果成功创建了多边形顶点，则添加实体
          if (polygonHierarchy.positions.length > 0) {
            console.log(4444)
            window.viewer.entities.add({
              polygon: {
                hierarchy: polygonHierarchy,
                // material: Cesium.Color.BLUE.withAlpha(0.3),
                material:new Cesium.ImageMaterialProperty({
                  image: landslide_surface01,
                  color: Cesium.Color.WHITE,
                  repeat: new Cesium.Cartesian2(4, 4),
                }),
                outline: true,
                outlineColor: Cesium.Color.BLUE,
                heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
              },
              properties: {
                data: landslide[i],
                type: 'influence_range_polygon'
              }
            });
          }

          // 如果是多点路线，单独为最后一个点绘制圆形缓冲区
          if (routePoints.length > 1) {
            const lastPoint = routePoints[routePoints.length - 1];
            const lastPointBufferRadius = bufferWidth; // 可以根据需要调整这个半径

            window.viewer.entities.add({
              position: lastPoint,
              ellipse: {
                semiMinorAxis: lastPointBufferRadius,
                semiMajorAxis: lastPointBufferRadius,
                material: new Cesium.ImageMaterialProperty({
                  image: landslide_surface01,
                  color: Cesium.Color.WHITE,
                  repeat: new Cesium.Cartesian2(4, 4),
                }),
                outline: true,
                outlineColor: Cesium.Color.BLUE,
                heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
              },
              properties: {
                data: landslide[i],
                type: 'last_point_circular_buffer'
              }
            });
          }

        } else {
          console.warn(`点路线点数不足，无法创建影响范围多边形，索引 ${i}`);
        }
      } else {
        // ... existing code ...
      }
    }else{
      window.viewer.entities.add({
        // fromDegrees（经度，纬度，高度，椭球，结果）从以度为单位的经度和纬度值返回Cartesian3位置
        position: Cesium.Cartesian3.fromDegrees(parseFloat(lon), parseFloat(lat)),
        billboard: {
          image: landslideIcon,
          width: 50, // 图片宽度,单位px
          height: 50, // 图片高度，单位px
          eyeOffset: new Cesium.Cartesian3(0, 0, 0), // 与坐标位置的偏移距离
          color: Cesium.Color.WHITE.withAlpha(1), // 固定颜色
          scale: 0.8, // 缩放比例
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND, // 绑定到地形高度
          scaleByDistance: new Cesium.NearFarScalar(500, 1, 5e5, 0.1),
          depthTest: false, // 禁止深度测试
          disableDepthTestDistance: Number.POSITIVE_INFINITY // 不进行深度测试
        },
        properties: {
          data:landslide[i]
        }
      })
    }

  }
}

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

function AddHazardSource() {
  let HazardPoint = []
  //添加隐患点
  DebrisFlow.features.forEach(hazard_source => {
    HazardPoint.push(hazard_source)
  })
  HazardPoint.forEach(hazard_point => {
    let lon = hazard_point.geometry.coordinates[0]
    let lat = hazard_point.geometry.coordinates[1]
    window.viewer.entities.add({
      position: Cesium.Cartesian3.fromDegrees(lon, lat),
      billboard: {
        // 图像地址，URI或Canvas的属性   @/assets/images/landslide.png
        image: debrisFlowIcon,
        width: 50, // 图片宽度,单位px
        height: 50, // 图片高度，单位px
        eyeOffset: new Cesium.Cartesian3(0, 0, 0), // 与坐标位置的偏移距离
        color: Cesium.Color.WHITE.withAlpha(1), // 固定颜色
        scale: 0.8, // 缩放比例
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND, // 绑定到地形高度
        scaleByDistance: new Cesium.NearFarScalar(500, 1, 5e5, 0.1),
        depthTest: false, // 禁止深度测试
        disableDepthTestDistance: Number.POSITIVE_INFINITY, // 不进行深度测试
        show: true
      },
      properties:{
        data:hazard_point
      }
    });
  })
}

// 添加风险区
function AddDangerAreaDataSource(DangerAreaData) {
  let DangerAreaDataArr = []
  // let DangerAreaDataList = []
  //添加隐患点
  DangerAreaData.features.forEach(DangerAreaData_source => {
    DangerAreaDataArr.push(DangerAreaData_source)
    // DangerAreaDataList.push(DangerAreaData_source)
  })
  DangerAreaDataArr.forEach(DangerAreaData_point => {
    console.log(DangerAreaData_point)
    let lon = DangerAreaData_point.geometry.coordinates[0]
    let lat = DangerAreaData_point.geometry.coordinates[1]
    window.viewer.entities.add({
      position: Cesium.Cartesian3.fromDegrees(lon, lat),
      billboard: {
        // 图像地址，URI或Canvas的属性   @/assets/images/landslide.png
        image: riskArea,
        width: 50, // 图片宽度,单位px
        height: 50, // 图片高度，单位px
        eyeOffset: new Cesium.Cartesian3(0, 0, 0), // 与坐标位置的偏移距离
        color: Cesium.Color.WHITE.withAlpha(1), // 固定颜色
        scale: 0.8, // 缩放比例
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND, // 绑定到地形高度
        scaleByDistance: new Cesium.NearFarScalar(500, 1, 5e5, 0.1),
        depthTest: false, // 禁止深度测试
        disableDepthTestDistance: Number.POSITIVE_INFINITY, // 不进行深度测试
        show: true
      },
      properties:{
        data:DangerAreaData_point
      }
    });
    if(isPointInEllipse(parseFloat(lon),parseFloat(lat),weinan.longitude,weinan.latitude,EllipseAxis.a,EllipseAxis.b)){
      // 创建光晕实体
      const haloEntity = window.viewer.entities.add({
        position: Cesium.Cartesian3.fromDegrees(parseFloat(lon), parseFloat(lat)),
        point: {
          pixelSize: 40, // 增大光晕大小，使其更明显
          color: Cesium.Color.RED.withAlpha(0.4), // 提高透明度，使其更明显
          outlineColor: Cesium.Color.RED.withAlpha(1.0), // 完全不透明的边框
          outlineWidth: 3, // 适中的边框宽度
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
          disableDepthTestDistance: Number.POSITIVE_INFINITY // 确保不被地形遮挡
        }
      });
      addPulseAnimation(haloEntity,Cesium.Color.RED)
    }
  })

  // DangerAreaDataList.forEach(DangerAreaData_point => {
  //   let lon = DangerAreaData_point.geometry.coordinates[0]
  //   let lat = DangerAreaData_point.geometry.coordinates[1]
  //   let arr = []
  //   if(isPointInEllipse(parseFloat(lon),parseFloat(lat),weinan.longitude,weinan.latitude,EllipseAxis.a,EllipseAxis.b)){
  //     arr.push(DangerAreaData_point)
  //     // console.log(DangerAreaData_point)
  //   }
  // })
}

function pointToLineDistance_getMinLine(position,lineData) {
  /**
   * point:线外点 longitude latitude height
   * linePoint1, linePoint2：线的两个端点   longitude latitude height
   * return  距离（m）  point ：笛卡尔
   */
  let point = null;
  let min_line_distance = 1000000000;
  let min_line = null
  let des;

  let line_data = []

  //坐标系转换
  // let ellipsoid = window.viewer.scene.globe.ellipsoid;
  // let cartographic = ellipsoid.cartesianToCartographic(point);
  // let latitude = Cesium.Math.toDegrees(cartographic.latitude);
  // let longitude = Cesium.Math.toDegrees(cartographic.longitude);
  // let height = cartographic.height;
  point = {x: position.longitude, y: position.latitude}

  //计算点到线的距离
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
  lineData.features.forEach(line => {
    line_data.push(line.geometry)
  })

  line_data.forEach(lonlat => {
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
  return min_line
}

function calculateStrikeDirection(lon1, lat1, lon2, lat2) {
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
}

function calculateEllipseParams(magnitude) {
  let sum = magnitude + 2
  // 定义不同层级的烈度值
  const intensityLevels = [
    {ia: sum-2, ib: sum-2},  // 内层椭圆：较高烈度
    {ia: sum-1, ib: sum-1},  // 中层椭圆：中等烈度
    {ia: sum, ib: sum}   // 外层椭圆：较低烈度
  ];

  const calculateRa = (M, Ia)=>{
      const a = (Math.pow(10, (4.0293 + 1.3003 * M - Ia) / 3.6404) - 10) * 27;
      // console.log(a, "=============================")
      return a;
    }

  const  calculateRb = (M, Ib) =>{
    const b = (Math.pow(10, (2.3816 + 1.3003 * M - Ib) / 2.8573) - 5) * 27;
    // console.log(b, "=============================")

    return b;
  }

  let plphas = [0.2,0.3,0.7]
  let i = 0
  // 存储计算出的椭圆参数
  const params = intensityLevels.map(level => {

    // 使用提供的公式计算长短轴
    const semiMajorAxis = calculateRa(magnitude, level.ia);

    const semiMinorAxis= calculateRb(magnitude, level.ib);

    // 根据烈度级别设置透明度
    // const alpha = 0.8 - (level.ia - 5) * 0.3;
    let alpha = plphas[i]
    i++
    // 计算 extrusion height，使较大的椭圆有更高的 extrusion
    // const extrudedHeight = semiMajorAxis * 0.15;

    return {
      semiMinorAxis,
      semiMajorAxis,
      // extrudedHeight,
      alpha
    };
  })

  EllipseAxis.a  = params[0].semiMajorAxis
  EllipseAxis.b  = params[0].semiMinorAxis
  return params;
}

function DrawCircle(point, bearing, magnitude) {
  // 地震源位置
  let position = point;
  // 根据断裂带计算的角度
  let strikeDirection = bearing;

  // 根据震级计算椭圆参数
  const ellipseParams = calculateEllipseParams(magnitude);

  // 循环创建多个同心椭圆，长轴方向与断裂带走向一致
  ellipseParams.forEach(params => {
    // 将角度转换为弧度（Cesium使用弧度）
    const rotation = Cesium.Math.toRadians(strikeDirection-90);

    let ellipse = new Cesium.Entity({
      position: Cesium.Cartesian3.fromDegrees(position.x, position.y),
      name: "面几何对象",
      ellipse: {
        semiMinorAxis: params.semiMinorAxis*50,
        semiMajorAxis: params.semiMajorAxis*70,
        //extrudedHeight: params.extrudedHeight,
        material: Cesium.Color.RED.withAlpha(params.alpha),
        height: 0,
        outline: true,
        outlineColor: Cesium.Color.RED,
        outlineWidth: 5,
        rotation: rotation, // 设置椭圆旋转角度
        zIndex: 999,
      }
    });
    window.viewer.entities.add(ellipse);
  });
}

function DrawEllipse(longitude,latitude) {
  let center = {longitude,latitude}
  let min_line = pointToLineDistance_getMinLine(center,lineData)
  // console.log(min_line,"==================")
  let first_point = min_line.coordinates[0]
  let last_point = min_line.coordinates[min_line.coordinates.length - 1]
  //计算角度
  let bearing = calculateStrikeDirection(first_point[0], first_point[1], last_point[0], last_point[1])
  // console.log(bearing, "==================")
  Cesium.Cartesian3.fromDegrees(109.7, 34.5)
  // 绘制椭圆
  DrawCircle({x:109.7,y:34.5}, bearing, 8);
}

// 加载行政区划数据
function loadAdminData(administrationData) {

  const generateRandomColor = (i)=>{
      // 定义13种不同的颜色
      const colors = [
        new Cesium.Color(255 / 255, 153 / 255, 0 / 255, 0.3),    // 活力橙
        new Cesium.Color(255 / 255, 51 / 255, 102 / 255, 0.3),   // 亮粉红
        new Cesium.Color(0 / 255, 178 / 255, 255 / 255, 0.3),    // 天蓝色
        new Cesium.Color(102 / 255, 255 / 255, 102 / 255, 0.3),  // 浅绿色
        new Cesium.Color(204 / 255, 102 / 255, 255 / 255, 0.3),  // 淡紫色
        new Cesium.Color(255 / 255, 204 / 255, 0 / 255, 0.3),    // 金黄色
        new Cesium.Color(0 / 255, 204 / 255, 153 / 255, 0.3),    // 青绿色
        new Cesium.Color(255 / 255, 102 / 255, 102 / 255, 0.3),  // 浅红色
        new Cesium.Color(102 / 255, 153 / 255, 255 / 255, 0.3),  // 淡蓝色
        new Cesium.Color(255 / 255, 178 / 255, 102 / 255, 0.3),  // 浅橙色
        new Cesium.Color(153 / 255, 255 / 255, 204 / 255, 0.3),  // 淡青色
        new Cesium.Color(255 / 255, 153 / 255, 204 / 255, 0.3),  // 浅粉色
        new Cesium.Color(190 / 255, 255 / 255, 232 / 255, 0.3),  // 淡靛紫
      ];

      // 确保索引在有效范围内
      if (i >= 0 && i < colors.length) {
        return colors[i];
      } else {
        // 如果索引超出范围，使用默认颜色或循环使用已有颜色
        return colors[i % colors.length];
      }
  }

  function configureAdminStyles(dataSource, color) {
    if (!dataSource) return;

    const entities = dataSource.entities.values;

    entities.forEach(entity => {
      const name = entity.properties.name._value || dataSource.name;
      entity.polygon = {
        hierarchy: entity.polygon.hierarchy,
        material: color,
        outline: true,
        outlineColor: Cesium.Color.BLUE,
        outlineWidth: 1,
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
        show: true, // 使用统一的显示控制
        fill: true,
        shadow: true,
        depthFailMaterial: color.withAlpha(0.2)
      };

      if(name !=="新城区"){
        // 计算多边形的中心点作为标签的位置
        const positions = entity.polygon.hierarchy.getValue(Cesium.JulianDate.now()).positions; // 输入一组坐标
        const boundingSphere = Cesium.BoundingSphere.fromPoints(positions); // 自动计算中心位置和半径
        entity.position = boundingSphere.center;
      }else{
        let point1 = entity.polygon.hierarchy.getValue(Cesium.JulianDate.now()).positions[0];
        let point2 = entity.polygon.hierarchy.getValue(Cesium.JulianDate.now()).positions[parseInt(entity.polygon.hierarchy.getValue(Cesium.JulianDate.now()).positions.length/6)];
        let point3 = entity.polygon.hierarchy.getValue(Cesium.JulianDate.now()).positions[parseInt(entity.polygon.hierarchy.getValue(Cesium.JulianDate.now()).positions.length/3)];
        entity.position = Cesium.BoundingSphere.fromPoints([point1, point2, point3]).center;
      }


      entity.label = {
        text: name,
        font: '40px',
        fillColor: Cesium.Color.BLACK,
        backgroundColor: color.withAlpha(0.7),
        padding: new Cesium.Cartesian2(5, 5),
        showBackground: true,
        verticalOrigin: Cesium.VerticalOrigin.CENTER, // 将垂直原点设置为中心
        pixelOffset: new Cesium.Cartesian2(0, 0), // 像素偏移量设置为0
        // heightReference: Cesium.HeightReference.CLAMP_TO_GROUND, // 移除此行，因为position已经确定了高度
        show: true // 使用统一的显示控制
      };
    });
  }

  // 重置数据源数组
  let adminDataSources = [];
  // 使用for循环同步加载所有数据源
  for (let i = 0; i < administrationData.length; i++) {
    // 创建新的数据源
    const dataSource = new Cesium.GeoJsonDataSource();
    adminDataSources.push(dataSource);

    // 配置加载选项并加载数据
    dataSource.load(administrationData[i], {
      enableFeatureStyles: false,
      clampToGround: true,
      suppressPointLabels: true
    }).then(() => {
      // 配置当前数据源的样式
      const color = generateRandomColor(i);
      configureAdminStyles(dataSource, color);
      // 存储区县颜色
      const districtId = administrationData[i].name || `district${i}`;
      districtColors[districtId] = color;
      // 添加到地图
      window.viewer.dataSources.add(dataSource);

    }).catch(error => {
      console.error(`加载行政区划数据失败 (${administrationData[i].name || "未知区域"}):`, error);
    });
  }
}

// 判断点是否在椭圆范围内（地理坐标转米，考虑地球曲率）
function isPointInEllipse(pointLon, pointLat, centerLon, centerLat, majorAxis, minorAxis) {
  // 1. 计算中心点和目标点的经纬度差
  const R = 6371000; // 地球半径（米）
  const dLat = (pointLat - centerLat) * Math.PI / 180;
  const avgLat = (pointLat + centerLat) / 2 * Math.PI / 180;

  const dLon = (pointLon - centerLon) * Math.PI / 180;
  // 2. 近似投影到平面（横向距离和纵向距离，单位米）
  const dx = dLon * R * Math.cos(avgLat);
  const dy = dLat * R;

  // 3. 椭圆方程 (x/a)^2 + (y/b)^2 <= 1
  const normX = dx / (majorAxis*66);
  const normY = dy / (minorAxis*46);
  const result = (normX * normX + normY * normY) <= 1;
  // console.log(normX * normX + normY * normY)
  return result;
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
    console.log(pickedObject)
    if (pickedObject && Cesium.defined(pickedObject.id)) {
      const entity = pickedObject.id;
      if (entity.properties && entity.properties.data._value.灾害类型 === '滑坡') {
        console.log(entity.properties)

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
          console.log(entity.properties.data._value)
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
      }else {
        console.log(entity.properties.data._value)
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
  const left = canvasPosition.x + 20; // 右侧显示
  const top = canvasPosition.y - 100; // 垂直居中

  container.style.cssText = `
        position: fixed;
        left: ${left}px;
        top: ${top-10}px;
        width: 350px;
        background: white;
        border-radius: 4px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        padding: 15px;
        z-index: 1000;
        max-height: 400px;
        overflow-y: auto;
      `;

  console.log(info.properties,entity,11111)

  // 构建信息列表内容
  if (flag==="滑坡" && info.data._value["灾害类型"] === '滑坡'){
    container.innerHTML = `
          <div style="font-weight: bold; font-size: 16px; margin-bottom: 10px;">灾害信息</div>
          <div style="margin-bottom: 10px;"><span style="color: #666;">野外编号:</span> ${info.data._value["野外编号"]}</div>
          <div style="margin-bottom: 10px;"><span style="color: #666;">灾害点名称:</span> ${info.data._value["灾害点名称"]}</div>
          <div style="margin-bottom: 10px;"><span style="color: #666;">规模等级:</span> ${info.data._value["规模等级"]}</div>
          <div style="margin-bottom: 10px;"><span style="color: #666;">险情等级:</span> ${info.data._value["险情等级"]}</div>
          <div style="margin-bottom: 10px;"><span style="color: #666;">面积:</span> ${parseFloat(info.data._value["面积"]).toFixed(2)}平方米</div>
          <div style="margin-bottom: 5px;"><span style="color: #666;">地理位置:</span> ${info.data._value["地理位置"]}</div>
          <button onclick="this.parentNode.remove()" style="background: #f0f0f0; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer;">关闭</button>
        `;
  }
  else if (flag === "泥石流" && info.properties["灾害类型"] === '泥石流'){
    container.innerHTML = `
        <!--    <div style="font-weight: bold; font-size: 16px; margin-bottom: 10px;">风险区信息</div>-->
            <div style="font-weight: bold; font-size: 16px; margin-bottom: 10px;">灾害信息</div>
            <div style="margin-bottom: 10px;"><span style="color: #666;">野外编号:</span> ${info.properties["野外编号"]}</div>
            <div style="margin-bottom: 10px;"><span style="color: #666;">灾害点名称:</span> ${info.properties["灾害点名称"]}</div>
            <div style="margin-bottom: 10px;"><span style="color: #666;">规模等级:</span> ${info.properties["规模等级"]}</div>
            <div style="margin-bottom: 10px;"><span style="color: #666;">险情等级:</span> ${info.properties["险情等级"]}</div>
            <div style="margin-bottom: 5px;"><span style="color: #666;">地理位置:</span> ${info.properties["地理位置"]}</div>
            <button onclick="this.parentNode.remove()" style="background: #f0f0f0; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer;">关闭</button>
          `;
  }else if (flag === "风险区" ){
    container.innerHTML = `
            <div style="font-weight: bold; font-size: 16px; margin-bottom: 10px;">风险区信息</div>
            <div style="margin-bottom: 10px;"><span style="color: #666;">风险区名称:</span> ${info.properties["disasterName"]}</div>
            <div style="margin-bottom: 10px;"><span style="color: #666;">住房（间）:</span> ${info.properties["housing"]}</div>
            <div style="margin-bottom: 10px;"><span style="color: #666;">常住人口（人）:</span> ${info.properties["permanentPopulation"]}</div>
            <div style="margin-bottom: 5px;"><span style="color: #666;">居民户数（户）:</span> ${info.properties["residentCounts"]}</div>
            <div style="margin-bottom: 5px;"><span style="color: #666;">威胁财产（万元）:</span> ${info.properties["riskProperty"]}</div>
            <div style="margin-bottom: 5px;"><span style="color: #666;">巡查员姓名:</span> ${info.properties["username"]}</div>
            <div style="margin-bottom: 5px;"><span style="color: #666;">巡查员手机号:</span> ${info.properties["phone"]}</div>
            <div style="margin-bottom: 10px;"><span style="color: #666;">位置:</span> ${info.properties["position"]}</div>
            <button onclick="this.parentNode.remove()" style="background: #f0f0f0; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer;">关闭</button>
          `;
  }


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
  border: 1px solid rgba(255, 255, 255, 0.2); /* 浅色边框 */
  padding: 8px 12px;
  text-align: left;
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
</style>
