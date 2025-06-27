<template>
  <div id="cesium-container" ref="cesiumContainer"></div>
</template>

<script setup>
import * as Cesium from 'cesium';
import landslide from '@/assets/landslide/landslide.json'
import landslideIcon from '@/assets/images/landslide.png'
import earthquake from '@/assets/images/earthquake.png'
import landslide_surface01 from '@/assets/images/landslide_surface01.jpg'
import lineData from "@/assets/西安断层数据.json";

const tdtToken = "fc6cb1139b8eed4f79439130eb34eb00"

onMounted(() => {
  load()
});

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
  loadLandSlide(landslide)
  weiNanEarthquake()
  earthquakeLine()
  earthquakeLine()
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
    properties: {

    }
  })
}

function earthquakeLine(){
  let line_data = []
  lineData.features.forEach(line => {
    console.log(line.geometry)
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

async function loadLandSlide(landslide) {
  for(let i=0;i<landslide.length;i++){
    // console.log(landslide[i])
    let lon = landslide[i].lon
    let lat = landslide[i].lat
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

    // 根据点路线绘制多边形影响范围，如果没有点路线则绘制圆形
    if (landslide[i].点路线 && landslide[i].点路线.length > 0) {
      const routePoints = [];
      const polylinePositions = []; // 用于存储折线点的数组
      const bufferWidth = 20; // 缓冲区宽度（米），您可以根据需要调整此值

      // 收集并验证所有有效的路线点
      for (let j = 0; j < landslide[i].点路线.length; j++) {
        const currentPointData = landslide[i].点路线[j];
        if (!Array.isArray(currentPointData) || currentPointData.length === 0 || !Array.isArray(currentPointData[0]) || currentPointData[0].length < 2) {
          console.warn(`无效的点数据结构，索引 ${i}，点路线索引 ${j}:`, currentPointData);
          continue;
        }

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

      console.log(polylinePositions)
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

        // 调用新的平滑缓冲区生成方法
        const polygonHierarchy = generateSmoothBuffer(routePoints, bufferWidth);

        // 如果成功创建了多边形顶点，则添加实体
        if (polygonHierarchy.positions.length > 0) {
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
</style>
