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

let form = reactive({
  magnitude: 6,
});

const { position } = defineProps(["position"]);
const emit = defineEmits(["cancelEarthquake"]);

// 椭圆长短轴
let EllipseAxis = reactive({ a: null, b: null });

// 添加模拟
function confirmEarthquake() {
  DrawEllipse(position.longitude, position.latitude);
  emit("cancelEarthquake");
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
