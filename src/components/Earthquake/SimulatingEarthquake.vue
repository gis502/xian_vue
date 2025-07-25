<!-- 模拟地震 -->
<template>
  <!-- 收集内容 -->
  <div
    class="earthquake-info-panel"
    :style="{
      top: position.y + 'px',
      left: position.x + 'px',
    }"
  >
    <div class="panel-title">地震信息</div>
    <div class="panel-content">
      <div>
        震级:
        <input
          v-model.number="form.magnitude"
          type="number"
          min="0"
          max="10"
          step="0.1"
        />
        ms
      </div>
      <div>震中位置:</div>
      <div>
        {{
          position
            ? `北纬:${position.latitude.toFixed(
                4
              )}, 东经:${position.longitude.toFixed(4)}`
            : ""
        }}
      </div>
      <el-row type="flex" :gutter="36">
        <el-col :span="24">
          <button @click="confirmEarthquake">确认添加</button>
          <button @click="emit('cancelEarthquake')">取消</button>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup name="SimulatingEarthquake">
import { reactive } from "vue";
import * as Cesium from "cesium";
import lineData from "@/assets/西安断层数据.json";
import landslide from "@/assets/landslide/landslide.json";
import landslideIcon from "@/assets/images/landslide.png";
import earthquake from "@/assets/images/earthquake.png";
import riskArea from "@/assets/images/riskArea.png";
import landslide_surface01 from "@/assets/images/landslide_surface01.jpg";
import DangerAreaData from "@/assets/static/disaster/xian_risk.json";
import debrisFlowIcon from "@/assets/images/DebrisFlow.png";
import DebrisFlow from "@/assets/西安泥石流灾害点.json";

let form = reactive({
  magnitude: 6,
});

const { position } = defineProps(["position"]);
const emit = defineEmits(["cancelEarthquake"]);

// 添加模拟点
let addSimulationPoints = false

// 椭圆长短轴
let EllipseAxis = reactive({ a: null, b: null });

// 添加模拟
function confirmEarthquake() {
  DrawEllipse(position.longitude, position.latitude);
  emit("cancelEarthquake");

  // 添加模拟点
  if(!addSimulationPoints) {
    addSimulationPoints = true

    // 添加风险区
    AddDangerAreaDataSource(DangerAreaData)

    // 添加滑坡
    loadLandSlide(landslide)

    // 添加泥石流
    AddHazardSource()
  }
}

// 绘制地震
function DrawEllipse(longitude, latitude) {
  let center = { longitude, latitude };
  let min_line = pointToLineDistance_getMinLine(center, lineData);
  // console.log(min_line,"==================")
  let first_point = min_line.coordinates[0];
  let last_point = min_line.coordinates[min_line.coordinates.length - 1];
  //计算角度
  let bearing = calculateStrikeDirection(
    first_point[0],
    first_point[1],
    last_point[0],
    last_point[1]
  );
  // console.log(bearing, "==================")
  Cesium.Cartesian3.fromDegrees(longitude, latitude);
  // 绘制椭圆
  DrawCircle({ x: longitude, y: latitude }, bearing, form.magnitude);
}

function pointToLineDistance_getMinLine(position, lineData) {
  /**
   * point:线外点 longitude latitude height
   * linePoint1, linePoint2：线的两个端点   longitude latitude height
   * return  距离（m）  point ：笛卡尔
   */
  let point = null;
  let min_line_distance = 1000000000;
  let min_line = null;
  let des;

  let line_data = [];

  //坐标系转换
  // let ellipsoid = window.viewer.scene.globe.ellipsoid;
  // let cartographic = ellipsoid.cartesianToCartographic(point);
  // let latitude = Cesium.Math.toDegrees(cartographic.latitude);
  // let longitude = Cesium.Math.toDegrees(cartographic.longitude);
  // let height = cartographic.height;
  point = { x: position.longitude, y: position.latitude };

  //计算点到线的距离
  const distancePointToLine = (point, linePoint1, linePoint2) => {
    let p = Cesium.Cartesian3.fromDegrees(point.x, point.y);
    let a = Cesium.Cartesian3.fromDegrees(linePoint1[0], linePoint1[1]);
    let b = Cesium.Cartesian3.fromDegrees(linePoint2[0], linePoint2[1]);

    //向量ab
    let ab = new Cesium.Cartesian3();
    Cesium.Cartesian3.subtract(b, a, ab);

    //向量ap
    let ap = new Cesium.Cartesian3();
    Cesium.Cartesian3.subtract(p, a, ap);

    //向量ap在ab上的投影
    let abNormalized = new Cesium.Cartesian3();
    Cesium.Cartesian3.normalize(ab, abNormalized);
    let apProjectionMagnitude = Cesium.Cartesian3.dot(ap, abNormalized);
    let apProjection = Cesium.Cartesian3.multiplyByScalar(
      abNormalized,
      apProjectionMagnitude,
      new Cesium.Cartesian3()
    );

    //ap在zb投影的垂足坐标
    let footPoint = new Cesium.Cartesian3();
    Cesium.Cartesian3.add(a, apProjection, footPoint);

    let distanceToA = Cesium.Cartesian3.distance(footPoint, a);
    let distanceToB = Cesium.Cartesian3.distance(footPoint, b);

    let distanceAB = Cesium.Cartesian3.distance(a, b);

    // 浮点数的精度有限，可能会存在微小的误差  因此认为距离差小于0.1 的在ab上
    if (Math.abs(distanceToA + distanceToB - distanceAB) < 0.1) {
      // console.log("footPoint在ab上")
      let distance = Cesium.Cartesian3.distance(footPoint, p);
      return { point: footPoint, distance: distance };
    } else {
      // console.log("footPoint在ab延长线上")
      if (distanceToA < distanceToB) {
        //a距离footPoint最近 返回端点a
        let distance = Cesium.Cartesian3.distance(a, p);
        return { point: a, distance: distance };
      } else {
        //b距离footPoint最近 返回端点b
        let distance = Cesium.Cartesian3.distance(b, p);
        return { point: b, distance: distance };
      }
    }
  };

  // 断裂带数据导入
  lineData.features.forEach((line) => {
    line_data.push(line.geometry);
  });

  line_data.forEach((lonlat) => {
    let min = 100000000000;
    for (let i = 0; i < lonlat.coordinates.length - 1; i++) {
      let linePoint1 = lonlat.coordinates[i];
      let linePoint2 = lonlat.coordinates[i + 1];
      des = distancePointToLine(point, linePoint1, linePoint2).distance;
      if (des <= min) {
        min = des;
      }
    }
    if (min < min_line_distance) {
      min_line_distance = min;
      //把距离最近的断裂带数组传递给min_line
      min_line = lonlat;
    }
  });
  return min_line;
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
  const x =
    Math.cos(radLat1) * Math.sin(radLat2) -
    Math.sin(radLat1) * Math.cos(radLat2) * Math.cos(dLon);

  // 计算角度并转换为0-360度范围
  let bearing = Cesium.Math.toDegrees(Math.atan2(y, x));
  bearing = (bearing + 360) % 360;

  return bearing;
}

function DrawCircle(point, bearing, magnitude) {
  // 地震源位置
  let position = point;
  // 根据断裂带计算的角度
  let strikeDirection = bearing;

  // 根据震级计算椭圆参数
  const ellipseParams = calculateEllipseParams(magnitude);

  // 创建一个更大的半透明遮罩区域
  const maskParams = {
    semiMinorAxis: ellipseParams[0].semiMinorAxis * 1.5,
    semiMajorAxis: ellipseParams[0].semiMajorAxis * 1.5,
    alpha: 0.1, // 遮罩透明度
  };

  // 先添加遮罩层，确保它在最底层
  const rotation = Cesium.Math.toRadians(strikeDirection - 90);
  let mask = new Cesium.Entity({
    position: Cesium.Cartesian3.fromDegrees(position.x, position.y),
    name: "地震影响区域遮罩",
    ellipse: {
      semiMinorAxis: maskParams.semiMinorAxis * 50,
      semiMajorAxis: maskParams.semiMajorAxis * 70,
      material: new Cesium.ImageMaterialProperty({
        image: createGradientTexture(256, 256),
        transparent: true,
      }),
      height: 1, // 稍微高于椭圆，确保显示在上方
      rotation: rotation,
      zIndex: 998, // 遮罩的z-index低于椭圆
    },
  });
  window.viewer.entities.add(mask);

  // 循环创建多个同心椭圆，长轴方向与断裂带走向一致
  ellipseParams.forEach((params) => {
    let ellipse = new Cesium.Entity({
      position: Cesium.Cartesian3.fromDegrees(position.x, position.y),
      name: "地震影响区域",
      ellipse: {
        semiMinorAxis: params.semiMinorAxis * 50,
        semiMajorAxis: params.semiMajorAxis * 70,
        material: Cesium.Color.RED.withAlpha(params.alpha),
        height: 0,
        outline: true,
        outlineColor: Cesium.Color.RED,
        outlineWidth: 3,
        rotation: rotation, // 设置椭圆旋转角度
        zIndex: 999, // 椭圆的z-index高于遮罩
      },
    });
    window.viewer.entities.add(ellipse);
  });

//   // 创建标签实体，确保它显示在最上方
//   let labelEntity = new Cesium.Entity({
//     position: Cesium.Cartesian3.fromDegrees(position.x, position.y),
//     label: {
//       text: "陕西省渭南市华州区7.0级地震（模拟）",
//       font: "40px",
//       fillColor: Cesium.Color.BLACK,
//       backgroundColor: Cesium.Color.WHITE.withAlpha(0.7),
//       padding: new Cesium.Cartesian2(5, 5),
//       showBackground: true,
//       verticalOrigin: Cesium.VerticalOrigin.CENTER, // 将垂直原点设置为中心
//       eyeOffset: new Cesium.Cartesian3(100, 500, 0), // 像素偏移量
//       show: true, // 使用统一的显示控制
//       zIndex: 10000, // 设置为最高z-index，确保显示在最上方
//       heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
//       depthTest: false, // 禁止深度测试
//       // scale: 0.8,
//       scaleByDistance: new Cesium.NearFarScalar(50000, 3, 5e5, 0.4),
//       // 添加贴地所需的额外属性
//       disableDepthTestDistance: Number.POSITIVE_INFINITY,
//       distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 400000),
//       pixelOffset: new Cesium.Cartesian2(0, -30),
//     },
//   });
//   window.viewer.entities.add(labelEntity);
}

// 计算椭圆参数
function calculateEllipseParams(magnitude) {
  let sum = magnitude + 2;
  // 定义不同层级的烈度值
  const intensityLevels = [
    { ia: sum - 2, ib: sum - 2 }, // 内层椭圆：较高烈度
    { ia: sum - 1, ib: sum - 1 }, // 中层椭圆：中等烈度
    { ia: sum, ib: sum }, // 外层椭圆：较低烈度
  ];

  const calculateRa = (M, Ia) => {
    const a = (Math.pow(10, (4.0293 + 1.3003 * M - Ia) / 3.6404) - 10) * 27;
    // console.log(a, "=============================")
    return a;
  };

  const calculateRb = (M, Ib) => {
    const b = (Math.pow(10, (2.3816 + 1.3003 * M - Ib) / 2.8573) - 5) * 27;
    // console.log(b, "=============================")

    return b;
  };

  let plphas = [0.2, 0.3, 0.7];
  let i = 0;
  // 存储计算出的椭圆参数
  const params = intensityLevels.map((level) => {
    // 使用提供的公式计算长短轴
    const semiMajorAxis = calculateRa(magnitude, level.ia);

    const semiMinorAxis = calculateRb(magnitude, level.ib);

    // 根据烈度级别设置透明度
    // const alpha = 0.8 - (level.ia - 5) * 0.3;
    let alpha = plphas[i];
    i++;
    // 计算 extrusion height，使较大的椭圆有更高的 extrusion
    // const extrudedHeight = semiMajorAxis * 0.15;

    return {
      semiMinorAxis,
      semiMajorAxis,
      // extrudedHeight,
      alpha,
    };
  });

  EllipseAxis.a = params[0].semiMajorAxis;
  EllipseAxis.b = params[0].semiMinorAxis;
  return params;
}

function createGradientTexture(width, height) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  // 创建径向渐变
  const gradient = ctx.createRadialGradient(
    width / 2,
    height / 2,
    0,
    width / 2,
    height / 2,
    width / 2
  );

  // 设置渐变颜色 - 从中心的红色到边缘的透明
  gradient.addColorStop(0, "rgba(255, 0, 0, 0.2)");
  gradient.addColorStop(0.7, "rgba(255, 0, 0, 0.05)");
  gradient.addColorStop(1, "rgba(255, 0, 0, 0)");

  // 填充渐变
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  return canvas;
}

// 添加风险区
function AddDangerAreaDataSource(DangerAreaData) {
  let DangerAreaDataArr = [];
  let haloEntities = []; // 新增：用于批量高亮
  DangerAreaData.features.forEach((DangerAreaData_source) => {
    DangerAreaDataArr.push(DangerAreaData_source);
  });
  DangerAreaDataArr.forEach((DangerAreaData_point) => {
    let lon = DangerAreaData_point.geometry.coordinates[0];
    let lat = DangerAreaData_point.geometry.coordinates[1];
    window.viewer.entities.add({
      position: Cesium.Cartesian3.fromDegrees(lon, lat),
      billboard: {
        image: riskArea,
        width: 50,
        height: 50,
        eyeOffset: new Cesium.Cartesian3(0, 0, 0),
        color: Cesium.Color.WHITE.withAlpha(1),
        scale: 0.8,
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
        scaleByDistance: new Cesium.NearFarScalar(500, 1, 5e5, 0.1),
        depthTest: false,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
        show: true,
      },
      properties: {
        data: DangerAreaData_point,
      },
    });
    const flag = isPointInEllipse(
      parseFloat(lon),
      parseFloat(lat),
      position.longitude,
      position.latitude,
      EllipseAxis.a,
      EllipseAxis.b
    );
    if (flag) {
      // 统一收集高亮点
      haloEntities.push({
        position: Cesium.Cartesian3.fromDegrees(
          parseFloat(lon),
          parseFloat(lat)
        ),
        color: Cesium.Color.RED,
      });
    }
  });
  // 批量调用统一光晕动画
  addHaloEffect(haloEntities);
}

// 加载滑坡数据
function loadLandSlide(landslide) {
  for (let i = 0; i < landslide.length; i++) {
    let lon = landslide[i].lon;
    let lat = landslide[i].lat;
    if (
      isPointInEllipse(
        parseFloat(lon),
        parseFloat(lat),
        position.longitude,
        position.latitude,
        EllipseAxis.a,
        EllipseAxis.b
      )
    ) {
      window.viewer.entities.add({
        // fromDegrees（经度，纬度，高度，椭球，结果）从以度为单位的经度和纬度值返回Cartesian3位置
        position: Cesium.Cartesian3.fromDegrees(
          parseFloat(lon),
          parseFloat(lat)
        ),
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
          zIndex: 99999999,
        },
        properties: {
          data: landslide[i],
        },
        // userData: {
        //   type: 'LandSlide',
        //   info: pointInfo,
        //   originalPosition: { lon, lat } // 保存原始经纬度
        // }
      });
      // 创建光晕实体
      const haloEntity = window.viewer.entities.add({
        position: Cesium.Cartesian3.fromDegrees(
          parseFloat(lon),
          parseFloat(lat)
        ),
        point: {
          pixelSize: 40, // 增大光晕大小，使其更明显
          color: Cesium.Color.RED.withAlpha(0.4), // 提高透明度，使其更明显
          outlineColor: Cesium.Color.RED.withAlpha(1.0), // 完全不透明的边框
          outlineWidth: 1, // 适中的边框宽度
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
          disableDepthTestDistance: Number.POSITIVE_INFINITY, // 确保不被地形遮挡
        },
      });
      addPulseAnimation(haloEntity, Cesium.Color.RED);
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

          if (
            !isNaN(lon) &&
            !isNaN(lat) &&
            lon >= -180 &&
            lon <= 180 &&
            lat >= -90 &&
            lat <= 90
          ) {
            routePoints.push(Cesium.Cartesian3.fromDegrees(lon, lat)); // 存储为Cesium.Cartesian3对象
            polylinePositions.push(lon, lat); // 添加到折线点数组
          } else {
            console.warn(
              `无效的坐标值，索引 ${i}，点路线索引 ${j}: lon=${point[0]}, lat=${point[1]}`
            );
          }
        }

        // console.log(polylinePositions)
        // 绘制原始点路线
        if (polylinePositions.length >= 4) {
          // 至少需要两个点（4个坐标值）才能绘制线
          window.viewer.entities.add({
            polyline: {
              positions: Cesium.Cartesian3.fromDegreesArray(polylinePositions),
              width: 20, // 线条宽度
              material: new Cesium.PolylineArrowMaterialProperty(
                Cesium.Color.YELLOW
              ), // 使用箭头材质
              clampToGround: true, // 贴地显示
            },
            properties: {
              data: landslide[i],
              type: "landslide_route",
            },
          });
        }

        // 绘制影响范围多边形（缓冲区）
        if (routePoints.length >= 1) {
          // 至少一个点才能考虑扇形或圆形
          // 将 generateSmoothBuffer 函数定义移动到此处，作为 loadLandSlide 的内部函数
          const generateSmoothBuffer = (routePoints, bufferWidth) => {
            // 移除 fanAngle 参数
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
                const cartographic =
                  Cesium.Cartographic.fromCartesian(centerPoint);
                const longitude =
                  cartographic.longitude +
                  (radius / Cesium.Ellipsoid.WGS84.maximumRadius) *
                    Math.sin(radian);
                const latitude =
                  cartographic.latitude +
                  (radius / Cesium.Ellipsoid.WGS84.maximumRadius) *
                    Math.cos(radian);
                positions.push(
                  Cesium.Cartesian3.fromRadians(longitude, latitude)
                );
              }
              return new Cesium.PolygonHierarchy(positions);
            }

            // 处理多点路线的平滑缓冲区
            const leftPoints = [];
            const rightPoints = [];

            // 遍历所有线段，生成平滑缓冲区
            for (let j = 0; j < routePoints.length - 1; j++) {
              // 遍历到倒数第二个点
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
              const prev =
                j > 0 ? interpolatedPoints[j - 1] : interpolatedPoints[j];
              const next =
                j < interpolatedPoints.length - 1
                  ? interpolatedPoints[j + 1]
                  : interpolatedPoints[j];

              const forwardVec = Cesium.Cartesian3.subtract(
                next,
                prev,
                new Cesium.Cartesian3()
              );
              Cesium.Cartesian3.normalize(forwardVec, forwardVec);

              const normal = Cesium.Ellipsoid.WGS84.geodeticSurfaceNormal(
                interpolatedPoints[j],
                new Cesium.Cartesian3()
              );
              const perpendicular = Cesium.Cartesian3.normalize(
                Cesium.Cartesian3.cross(
                  normal,
                  forwardVec,
                  new Cesium.Cartesian3()
                ),
                new Cesium.Cartesian3()
              );

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
          const polygonHierarchy = generateSmoothBuffer(
            routePoints,
            bufferWidth
          );

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
              properties: {
                data: landslide[i],
                type: "influence_range_polygon",
              },
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
                type: "last_point_circular_buffer",
              },
            });
          }
        } else {
          console.warn(`点路线点数不足，无法创建影响范围多边形，索引 ${i}`);
        }
      } else {
        // ... existing code ...
      }
    } else {
      window.viewer.entities.add({
        // fromDegrees（经度，纬度，高度，椭球，结果）从以度为单位的经度和纬度值返回Cartesian3位置
        position: Cesium.Cartesian3.fromDegrees(
          parseFloat(lon),
          parseFloat(lat)
        ),
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
        },
        properties: {
          data: landslide[i],
        },
      });
    }
  }
}

// 添加泥石流隐患点
function AddHazardSource() {
  let HazardPoint = [];
  //添加隐患点
  DebrisFlow.features.forEach((hazard_source) => {
    HazardPoint.push(hazard_source);
  });
  HazardPoint.forEach((hazard_point) => {
    let lon = hazard_point.geometry.coordinates[0];
    let lat = hazard_point.geometry.coordinates[1];
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
        show: true,
      },
      properties: {
        data: hazard_point,
      },
    });
  });
}

// 添加脉冲效果
function addPulseAnimation(haloEntity, baseColor) {
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

// 判断点是否在椭圆范围内（地理坐标转米，考虑地球曲率）
function isPointInEllipse(
  pointLon,
  pointLat,
  centerLon,
  centerLat,
  majorAxis,
  minorAxis
) {
  // 返回false，此处计算逻辑有问题
  return false;
  // 1. 计算中心点和目标点的经纬度差
  const R = 6371000; // 地球半径（米）
  const dLat = ((pointLat - centerLat) * Math.PI) / 180;
  const avgLat = (((pointLat + centerLat) / 2) * Math.PI) / 180;

  const dLon = ((pointLon - centerLon) * Math.PI) / 180;
  // 2. 近似投影到平面（横向距离和纵向距离，单位米）
  const dx = dLon * R * Math.cos(avgLat);
  const dy = dLat * R;

  // 3. 椭圆方程 (x/a)^2 + (y/b)^2 <= 1
  const normX = dx / (majorAxis * 66);
  const normY = dy / (minorAxis * 46);
  const result = normX * normX + normY * normY <= 1;
  // console.log(normX * normX + normY * normY)
  return result;
}

// 1. 在 <script setup> 顶部添加统一响应式变量
const haloCollection = ref(null); // 光晕点集合
const flashInterval = ref(null); // 动画定时器
const isHaloActive = ref(false); // 光晕激活状态

// 2. 添加统一的 addHaloEffect 和 clearHaloEffect 方法
function addHaloEffect(entities) {
  clearHaloEffect();
  if (!entities || entities.length === 0) return;
  // 创建光晕点集合
  if (haloCollection.value) {
    window.viewer.scene.primitives.remove(haloCollection.value);
  }
  haloCollection.value = new Cesium.PointPrimitiveCollection();
  window.viewer.scene.primitives.add(haloCollection.value);
  // 记录需要动画的点
  const entitiesToFlash = [];
  entities.forEach(({ position, color }) => {
    if (!position) return;
    const colorVal = color;
    haloCollection.value.add({
      position: position,
      pixelSize: 15,
      color: colorVal,
      outlineColor: Cesium.Color.RED,
      outlineWidth: 1,
      show: true,
      material: new Cesium.Material({
        fabric: {
          type: "Halo",
          uniforms: {
            color: colorVal,
            glowPower: 0.5,
            innerRadius: 0.5,
            outerRadius: 1.0,
          },
          source: `
            uniform vec4 color;
            uniform float glowPower;
            uniform float innerRadius;
            uniform float outerRadius;
            czm_material czm_getMaterial(czm_materialInput materialInput) {
              czm_material material = czm_getDefaultMaterial(materialInput);
              vec2 st = materialInput.st;
              float dist = distance(st, vec2(0.5, 0.5));
              float alpha = smoothstep(outerRadius, innerRadius, dist);
              alpha = pow(alpha, glowPower);
              material.diffuse = color.rgb;
              material.alpha = alpha * color.a;
              return material;
            }
          `,
        },
      }),
    });
    entitiesToFlash.push({ position, color: colorVal });
  });
  // 动画循环
  let animationTime = 0;
  const animationDuration = 2000;
  flashInterval.value = setInterval(() => {
    animationTime = (animationTime + 50) % animationDuration;
    const normalizedTime = animationTime / animationDuration;
    for (let i = 0; i < haloCollection.value.length; i++) {
      const halo = haloCollection.value.get(i);
      const baseSize = 15;
      const sizeFactor = 1.0 + Math.sin(normalizedTime * Math.PI * 2) * 2;
      halo.pixelSize = baseSize * sizeFactor;
      // 透明度随扩散变化
      const alphaFactor = 1.0 - (sizeFactor - 1.0) / 2.0;
      const originalColor = entitiesToFlash[i].color;
      halo.color = new Cesium.Color(
        originalColor.red,
        originalColor.green,
        originalColor.blue,
        alphaFactor * 0.8
      );
    }
  }, 50);
  isHaloActive.value = true;
}

function clearHaloEffect() {
  if (flashInterval.value) {
    clearInterval(flashInterval.value);
    flashInterval.value = null;
  }
  if (haloCollection.value) {
    window.viewer.scene.primitives.remove(haloCollection.value);
    haloCollection.value = null;
  }
  isHaloActive.value = false;
}
</script>

<style scoped>
.earthquake-info-panel {
  position: absolute;
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
  background-color: rgba(255, 255, 255, 0.1);
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
</style>
