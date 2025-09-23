<!-- 左键实体显示内容 -->
<template>
  <div
      class="cesium-info-window"
      :style="styleObject">
    <span>
    </span>
    <div class="disaster-popup">
      <div class="popup-header">
        <h3>{{ title }}</h3>
        <!--隐藏致灾因子-->
<!--        <el-button style="margin: 0 0 0 5px;"-->
<!--            type="info"-->
<!--            v-text="displayDisasterCausingFactors ? '显示基本信息' : '显示致灾因子'"-->
<!--            @click="displayComponents"-->
<!--        ></el-button>-->
        <el-button @click="landslideImpact">影响范围分析</el-button>
      </div>

      <!-- 滑坡信息 -->
      <Landslide v-if="!displayDisasterCausingFactors && showDisasterInformation" :info="disasterInformation"></Landslide>
      <!-- 泥石流 -->
      <DebrisFlow v-if="!displayDisasterCausingFactors && showdebrisFlowInformation" :info="debrisFlowInformation"></DebrisFlow>
      <!-- 风险点 -->
      <RiskPoints v-if="!displayDisasterCausingFactors && showRiskPointsInformation" :info="riskPointsInformation"></RiskPoints>
      <!--内涝-->
      <WaterDisaster v-if="!displayDisasterCausingFactors && showWaterDisasterInformation" :info="waterDisasterInformation"></WaterDisaster>
      <!--山洪-->
      <FloodDisaster v-if="!displayDisasterCausingFactors && showFloodDisasterInformation" :info="floodDisasterInformation"></FloodDisaster>
      <!--历史地震灾害-->
      <HistoricalEarthquake v-if="!displayDisasterCausingFactors && showHistorialDisaster" :info="historialDisasterInformation"></HistoricalEarthquake>
      <!-- 致灾因子信息 -->
      <Hazards
          v-if="displayDisasterCausingFactors"
          :hazardsDatas="hazards"
          :options="options"
      ></Hazards>
    </div>
  </div>
</template>

<script setup name="HiddenDisasterPanel">
import * as WKT from "wkt";
import {computed, onMounted, ref} from "vue";
import DebrisFlow from "@/components/Earthquake/DebrisFlow.vue";
import Landslide from "@/components/Earthquake/Landslide.vue";
import RiskPoints from "@/components/Earthquake/RiskPoints.vue";
import Hazards from "@/components/Earthquake/Hazards.vue";
import WaterDisaster from "@/components/Earthquake/WaterDisaster.vue"
import FloodDisaster from "@/components/Earthquake/FloodDisaster.vue"
import HistoricalEarthquake from "@/components/Earthquake/HistoricalEarthquake.vue";
import {staticHazardsDatas} from "@/api/earthquake/datas";
import {getAffectPoint, getHazardOptions, getPolieJiao} from "@/api/earthquake/hazards.js";
import * as Cesium from 'cesium';
import landslide_surface01 from '@/assets/images/landslide_surface01.jpg'
import layers from "@/cesium/layers.js";

const emit = defineEmits(["removeBaseInfoBox"]);
const props = defineProps({
  title: String,
  position: Object,
  showDisasterInformation: Boolean,
  disasterInformation: Object,
  showdebrisFlowInformation: Boolean,
  debrisFlowInformation: Object,
  showRiskPointsInformation: Boolean,
  riskPointsInformation: Object,
  showWaterDisasterInformation: Boolean,
  waterDisasterInformation: Object,
  showFloodDisasterInformation: Boolean,
  floodDisasterInformation: Object,
  showHistorialDisaster: Boolean,
  historialDisasterInformation: Object,
  trigger: String,
  rainfall: String,
  dataTypeHiddenDisaster: Object,
  rainInfo: Object,
});

watch(() => props, (newProps) => {
  //console.log('Props updated:', newProps);
}, {deep: true});
onMounted(() => {
  console.log('Initial props:', props);
});

watch(() => props.disasterInformation, (newVal, oldVal) => {
  console.log('disasterInformation u`pdated:', newVal);
});

watch(() => props.debrisFlowInformation, (newVal, oldVal) => {
  console.log('debrisFlowInformation updated:', newVal);
});

watch(() => props.riskPointsInformation, (newVal, oldVal) => {
  console.log('riskPointsInformation updated:', newVal);
});
watch(() => props.waterDisasterInformation, (newVal, oldVal) => {
  console.log('waterDisasterInformation updated:', newVal);
});
watch(() => props.floodDisasterInformation, (newVal, oldVal) => {
  console.log('floodDisasterInformation updated:', newVal);
});
watch(() => props.historialDisasterInformation, (newVal, oldVal) => {
  console.log('historialDisasterInformation updated:', newVal);
});
watch(() => props.position, (newVal, oldVal) => {
  // console.log('position updated:', newVal);
});

watch(() => props.position.y, (newY) => {
  positionEntity.value.y = newY;
});

let options = ref([]);
getHazardOptions().then((res) => {
  options.value = res;
  // console.log(props,"props")
});

const positionEntity = ref({x: 0, y: 0});

watch(() => props.position.x, (newX) => {
  positionEntity.value.x = newX;
  // console.log(props.position,"props.position")
});

watch(() => props.position.y, (newY) => {
  positionEntity.value.y = newY;
});

const styleObject = computed(() => ({
  position: 'absolute',
  left: `${positionEntity.value.x}px`,
  top: `${positionEntity.value.y}px`,
}));

const displayDisasterCausingFactors = ref(false);
const hazards = computed(() => {
  // console.log(props.disasterInformation,props.debrisFlowInformation,"hazards")
  if (props.showDisasterInformation) {
    handleRainfallAndDuration(props.disasterInformation, props.trigger);
    return {
      ...props.disasterInformation,
      title: '滑坡隐患点'
    };
  } else if (props.showdebrisFlowInformation) {
    handleRainfallAndDuration(props.debrisFlowInformation, props.trigger);
    return {
      ...props.debrisFlowInformation,
      title: '泥石流隐患点'
    };
  } else if (props.showRiskPointsInformation) {
    props.riskPointsInformation.factorVoList = staticHazardsDatas;
    handleRainfallAndDuration(props.riskPointsInformation, props.trigger);
    return {
      ...props.riskPointsInformation,
      title: '风险区域'
    };
  } else if (props.showWaterDisasterInformation) {
    handleRainfallAndDuration(props.waterDisasterInformation, props.trigger);
    return {
      ...props.waterDisasterInformation,
      title: '内涝隐患点'
    };
  } else if (props.showFloodDisasterInformation) {
    handleRainfallAndDuration(props.floodDisasterInformation, props.trigger)
    return {
      ...props.floodDisasterInformation,
      title: '山洪隐患点'
    };
  } else if (props.showHistorialDisaster) {
    handleRainfallAndDuration(props.historialDisasterInformation, props.trigger)
    return {
      ...props.historialDisasterInformation,
      title: '历史地震灾害'
    }
  }
});


function handleRainfallAndDuration(info, trigger) {
  info.factorVoList.forEach((element) => {
    element.type = element.unit == "" ? "select" : "input:number";
    element.isModified = true;
    if (trigger == "地震") {
      element.isShow = false;
    } else {
      element.isShow = true;
      if (props.rainInfo.length != 0) {

        let adminArea = layers.getAdministrationByPoint(info.geologicalDisasterHideDTO.lon, info.geologicalDisasterHideDTO.lat);
        let matchedIndex = props.rainInfo.findIndex((pos) => pos.name === adminArea.name);
        // console.log(props.rainInfo,adminArea,matchedIndex,"props.rainInfo")
        if (matchedIndex !== -1) {
          let rainfall = props.rainInfo[matchedIndex].rainfall;
          let duration = props.rainInfo[matchedIndex].duration;
          if (element.attributeNameAlias == 'rainfall') {
            element.factorValue = rainfall;
          } else if (element.attributeNameAlias == 'duration') {
            element.factorValue = duration;
          }
        }
      }
    }
  });
}
function displayComponents() {
  displayDisasterCausingFactors.value = !displayDisasterCausingFactors.value;
}

function landslideImpact() {
  let lon = hazards.value.geologicalDisasterHideDTO.lon;
  let lat = hazards.value.geologicalDisasterHideDTO.lat;
  getPolieJiao({
    lat,
    lon
  }).then((res) => {
    const routePoints = [];
    const polylinePositions = []; // 用于存储折线点的数组
    const position = [];
    const bufferWidth = 20;
    routePoints.push(Cesium.Cartesian3.fromDegrees(lon, lat)); // 存储为Cesium.Cartesian3对象
    polylinePositions.push(lon, lat);
    for (let i = 1; i < res.data.length; i++) {
      routePoints.push(Cesium.Cartesian3.fromDegrees(res.data[i].centerLon, res.data[i].centerLat)); // 存储为Cesium.Cartesian3对象
      polylinePositions.push(res.data[i].centerLon, res.data[i].centerLat);
    }
    // 绘制原始点路线
    if (polylinePositions.length >= 4) { // 至少需要两个点（4个坐标值）才能绘制线
      window.viewer.entities.add({
        polyline: {
          positions: Cesium.Cartesian3.fromDegreesArray(polylinePositions),
          width: 20, // 线条宽度
          material: new Cesium.PolylineArrowMaterialProperty(Cesium.Color.YELLOW), // 使用箭头材质
          clampToGround: true // 贴地显示
        },
      });
    }
    // 绘制影响范围多边形（缓冲区）
    if (routePoints.length >= 1) { // 至少一个点才能考虑扇形或圆形
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
      //计算影响范围面的经纬度
      const AffectBuffer = (routePoints, bufferWidth) => {
        const initialPoint = [];
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

        const leftPoints1 = [];
        const rightPoints2 = [];

        // 遍历所有线段，生成平滑缓冲区
        for (let j = 0; j < routePoints.length - 1; j++) { // 遍历到倒数第二个点
          const start = routePoints[j];
          initialPoint.push(start);
        }
        // 添加最后一个原始点
        initialPoint.push(routePoints[routePoints.length - 1]);
        console.log(868686,initialPoint)

        // 计算平滑的缓冲区边界点
        for (let q = 0; q < initialPoint.length; q++) {
          const prev1 = q > 0 ? initialPoint[q - 1] : initialPoint[q];
          const next1 = q < initialPoint.length - 1 ? initialPoint[q + 1] : initialPoint[q];

          const forwardVec1 = Cesium.Cartesian3.subtract(next1, prev1, new Cesium.Cartesian3());
          Cesium.Cartesian3.normalize(forwardVec1, forwardVec1);

          const normal1 = Cesium.Ellipsoid.WGS84.geodeticSurfaceNormal(initialPoint[q], new Cesium.Cartesian3());
          const perpendicular1 = Cesium.Cartesian3.normalize(Cesium.Cartesian3.cross(normal1, forwardVec1, new Cesium.Cartesian3()), new Cesium.Cartesian3());

          const scaledPerpendicular1 = Cesium.Cartesian3.multiplyByScalar(
              perpendicular1,
              bufferWidth,
              new Cesium.Cartesian3()
          );

          const leftaffect = Cesium.Cartesian3.add(
              initialPoint[q],
              scaledPerpendicular1,
              new Cesium.Cartesian3()
          );
          const rightaffect = Cesium.Cartesian3.subtract(
              initialPoint[q],
              scaledPerpendicular1,
              new Cesium.Cartesian3()
          );
          leftPoints1.push(leftaffect);
          rightPoints2.push(rightaffect);
        }
        // 组合成闭合多边形：左侧点 + 右侧点（反向）
        const polygonAffect = [...leftPoints1, ...rightPoints2.reverse()];
        return new Cesium.PolygonHierarchy(polygonAffect);
      };

      // 调用新的平滑缓冲区生成方法
      const polygonHierarchy = generateSmoothBuffer(routePoints, bufferWidth);//绘制缓冲区
      const affrctPoint = AffectBuffer(routePoints, bufferWidth);//得到经纬度


      //坐标转换
      let ellipsoid=window.viewer.scene.globe.ellipsoid;

      for (let i=0;i<affrctPoint.positions.length;i++){

        let cartographic=ellipsoid.cartesianToCartographic(affrctPoint.positions[i]);

        let lat=Cesium.Math.toDegrees(cartographic.latitude);
        let lon=Cesium.Math.toDegrees(cartographic.longitude);

        let currentPoint = {
          lat: lat,
          lon: lon,
        };

        position.push(currentPoint);

      }

      //渲染影响点
      fetchAndLogRoadList(position)

      async function fetchAndLogRoadList(position) {
        try {

          const data = await getAffectPoint(position); // 等待 Promise 解析
          console.log(1111, data);
          renderAllAffectedGeometries(viewer, data);
          pushTable(data);
        } catch (error) {
          console.error("Error:", error);
        }
      }
      function pushTable(data){
        Object.entries(data).forEach(([listName, items]) => {
          switch (listName){
            case 'peopleList':
              if(items.length > 0){
                items.forEach(item => {
                  props.dataTypeHiddenDisaster.type4.data.push({
                    field1: item.county,
                    field2: item.country,
                    field3: item.peopleNum,
                  });
                });
              }
              break;
            case 'cropsList':
              if(items.length > 0){
                items.forEach(item => {
                  props.dataTypeHiddenDisaster.type5.data.push({
                    field1: item.countyName,
                    field2: item.wheatArea,
                    field3: item.riceArea,
                    field4: item.maizArea,
                  });
                });
              }
              break;
            case 'waterPipeList':
              if(items.length > 0){
                items.forEach(item => {
                  props.dataTypeHiddenDisaster.type6.data.push({
                    field1: getDistrictName(item.fxpcXzqh3),
                    field2: null,
                  });
                });
              }
              break;
            case 'roadList':
              if(items.length > 0){
                items.forEach(item => {
                  props.dataTypeHiddenDisaster.type7.data.push({
                    field1: item.roadName,
                    field2: item.qdmc,
                    field3: item.zdmc,
                  });
                });
              }
              break;
            case 'highwayList':
              if(items.length > 0){
                items.forEach(item => {
                  props.dataTypeHiddenDisaster.type8.data.push({
                    field1: item.name,
                    field2: item.shapeLeng,
                  });
                });
              }
              break;
            case 'reservoirList':
              if(items.length > 0){
                items.forEach(item => {
                  props.dataTypeHiddenDisaster.type9.data.push({
                    field1: item.name,
                    field2: item.location,
                  });
                });
              }
              break;
            case 'bridgeList':
              if(items.length > 0){
                items.forEach(item => {
                  props.dataTypeHiddenDisaster.type10.data.push({
                    field1: item.bridgeName,
                    field2: item.location,
                    field3: item.bridgeType,
                  });
                });
              }
              break;
          }
        })
      }
      //判别区县代码
      function getDistrictName(code) {
        switch (code) {
          case '610102': return '新城区';
          case '610103': return '碑林区';
          case '610104': return '莲湖区';
          case '610111': return '灞桥区';
          case '610112': return '未央区';
          case '610113': return '雁塔区';
          case '610114': return '阎良区';
          case '610115': return '临潼区';
          case '610116': return '长安区';
          case '610117': return '高陵区';
          case '610118': return '鄠邑区';
          case '610122': return '蓝田县';
          case '610124': return '周至县';
          default: return '未知区县';
        }
      }
      //批量处理
      function renderAllAffectedGeometries(viewer, data, typeColors = {}) {
        // 默认颜色配置
        const defaultColors = {
          roadList: Cesium.Color.RED,
          highwayList: Cesium.Color.YELLOW,
          bridgeList: Cesium.Color.BLUE,
          reservoirList: Cesium.Color.CYAN,
          waterPipeList: Cesium.Color.GREEN,
          // 可以继续添加其他类型...
        };

        // 定义需要跳过的列表类型
        const SKIP_LIST_TYPES = ['peopleList', 'cropsList']; // 可以扩展其他类型,现在不显示人口与农作物网格。
        // 合并用户自定义颜色
        const colors = { ...defaultColors, ...typeColors };
        // 遍历data中的所有属性
        Object.entries(data).forEach(([listName, items]) => {
          // 跳过空数组
          if (!Array.isArray(items) || items.length === 0 || SKIP_LIST_TYPES.includes(listName)) {
            return;
          }
          // 获取该类型的颜色，如果没有配置则使用随机颜色
          const color = colors[listName] || Cesium.Color.fromRandom({
            alpha: 0.7
          });
          // 遍历该类型的所有项目
          items.forEach((item, index) => {
            if (!item.pointGeom) {
              console.warn(`Item ${index} in ${listName} has no pointGeom property`);
              return;
            }
            try {
              // 渲染几何图形
              renderGeometryToCesium(viewer, item.pointGeom, {
                color: color,
                width: 10,
              });
              // 可选：添加标签显示名称（如果有name字段）
              // if (item.roadName || item.qdmc || item.zdmc) {
              //   viewer.entities.add({
              //     position: getCenterPositionFromWKT(item.geomGeom),
              //     label: {
              //       text: item.roadName || item.qdmc || item.zdmc || listName,
              //       font: '14px sans-serif',
              //       fillColor: Cesium.Color.WHITE,
              //       outlineColor: Cesium.Color.BLACK,
              //       outlineWidth: 2,
              //       style: Cesium.LabelStyle.FILL_AND_OUTLINE,
              //       verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
              //       pixelOffset: new Cesium.Cartesian2(0, -10)
              //     }
              //   });
              // }
            } catch (error) {
              console.error(`Error rendering ${listName}[${index}]:`, error);
            }
          });
        });
      }
      //渲染
      function renderGeometryToCesium(viewer, wktString, options = {}) {
        const geometry = WKT.parse(wktString);
        const { color = Cesium.Color.RED, width = 2 } = options;
        if (geometry.type === 'LineString') {
          // 渲染线
          const positions = geometry.coordinates.map(coord =>
              Cesium.Cartesian3.fromDegrees(coord[0], coord[1])
          );
          viewer.entities.add({
            polyline: {
              positions: positions,
              width: width,
              material: new Cesium.PolylineGlowMaterialProperty({
                glowPower: 0.2,
                color: color
              })
            }
          });
        }
        else if (geometry.type === 'MultiLineString') {
          // 多条线（每条线单独渲染）
          geometry.coordinates.forEach(lineCoords => {
            const positions = lineCoords.map(coord =>
                Cesium.Cartesian3.fromDegrees(coord[0], coord[1])
            );
            viewer.entities.add({
              polyline: {
                positions: positions,
                width: width,
                material: new Cesium.PolylineGlowMaterialProperty({
                  glowPower: 0.2,
                  color: color
                })
              }
            });
          });
        }
        else if (geometry.type === 'MultiPolygon' || geometry.type === 'Polygon') {
          // 渲染多边形
          const polygons = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates;
          polygons.forEach(polygon => {
            const hierarchy = new Cesium.PolygonHierarchy(
                polygon[0].map(coord =>
                    Cesium.Cartesian3.fromDegrees(coord[0], coord[1])
                )
            );
            viewer.entities.add({
              polygon: {
                hierarchy: hierarchy,
                material: color.withAlpha(0.5),
                outline: true,
                outlineColor: color,
                outlineWidth: width
              }
            });
          });
        }
        else if (geometry.type === 'Point') {
          // 渲染点
          viewer.entities.add({
            position: Cesium.Cartesian3.fromDegrees(
                geometry.coordinates[0],
                geometry.coordinates[1]
            ),
            point: {
              pixelSize: 10,
              color: color,
              outlineColor: Cesium.Color.WHITE,
              outlineWidth: 2
            }
          });
        }
        else {
          console.warn('Unsupported geometry type:', geometry.type);
        }
      }

      //缓冲区画点测试
      // for (let i=0;i<affrctPoint.positions.length;i++){
      //   console.log(8888888)
      //   window.viewer.entities.add({
      //     // fromDegrees（经度，纬度，高度，椭球，结果）从以度为单位的经度和纬度值返回Cartesian3位置
      //     // position: Cesium.Cartesian3.fromDegrees(affectPolygon[i],affectPolygon[i+1]),
      //     position: affrctPoint.positions[i],
      //     point: {
      //       // 点的大小（像素）
      //       pixelSize: 5,
      //       // 点位颜色，fromCssColorString 可以直接使用CSS颜色
      //       color: Cesium.Color.fromCssColorString('#ee0000'),
      //       // 边框颜色
      //       outlineColor: Cesium.Color.fromCssColorString('#fff'),
      //       // 边框宽度(像素)
      //       outlineWidth: 2,
      //       // 是否显示
      //       show: true
      //     }
      //   });
      // }
      //
      //  //缓冲区画面测试
      // // window.viewer.entities.add({
      // //   polygon: {
      // //     hierarchy: {
      // //       positions: affrctPoint.positions,
      // //     },
      // //     // 边框
      // //     outline: true,
      // //     // 边框颜色
      // //     outlineColor: Cesium.Color.RED,
      // //     // 边框尺寸
      // //     outlineWidth: 2,
      // //     show: true,
      // //     zIndex: 10000000
      // //   }
      // // });


      // 如果成功创建了多边形顶点，则添加实体
      if (polygonHierarchy.positions.length > 0) {
        window.viewer.entities.add({
          polygon: {
            hierarchy: polygonHierarchy,
            // material: Cesium.Color.BLUE.withAlpha(0.3),
            material: new Cesium.ImageMaterialProperty({
              image: landslide_surface01,
              color: Cesium.Color.WHITE,
              repeat: new Cesium.Cartesian2(4, 4),
            }),
            outline: true,
            outlineColor: Cesium.Color.BLUE,
            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
          },
        });
      }

      // 如果是多点路线，单独为最后一个点绘制圆形缓冲区
      if (routePoints.length > 1) {
        const lastPoint = routePoints[routePoints.length - 1];
        const lastPointBufferRadius = bufferWidth; // 可以根据需要调整这个半径
        // const lastPointBufferRadius2 = bufferWidth_1;

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

        });

      }
      console.log(96321,routePolygon)
    }else {
      console.warn(`点路线点数不足，无法创建影响范围多边形，索引 ${i}`);
    }
  })

}

</script>
<style>
.cesium-info-window {
  position: fixed;
  background: white;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  padding: 0px;
  z-index: 1000;
  max-height: 450px;
  overflow: auto;
}

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
  font-family: "Source Han Sans CN";
}

.disaster-info-table {
  width: 100%;
  border-collapse: collapse;
}

.disaster-info-table th,
.disaster-info-table td {
  padding: 8px;
  border-top: 1px solid #ddd; /* 保留上边框 */
  border-bottom: 1px solid #ddd; /* 保留底边框 */
  border-left: none; /* 去除左边框 */
  border-right: none; /* 去除右边框 */
  text-align: left;
  font-family: "Source Han Sans CN";
  font-size: 13px;
}

.disaster-info-table .label {
  color: #333;
  width: 30%;
  font-size: 13px;
}

.close-btn {
  font-weight: normal;
  background: none;
  border: none;
  padding: 5px 10px;
  cursor: pointer;
  font-size: 14px; /* 减小标题字体大小 */
  color: #6c757d;
  transition: color 0.2s;
}
</style>
