<!-- 模拟点 -->
<template></template>

<script setup name="SimulationPoint">
import * as Cesium from "cesium";
import landslideIcon from "@/assets/images/landslide.png";
import riskArea from "@/assets/images/riskArea.png";
import debrisFlowIcon from "@/assets/images/DebrisFlow.png";
import {
  dataOnHiddenDangerPointsOfDebrisFlow,
  landslideHazardPointData,
  riskVillageData,
} from "../../api/earthquake/datas";

// 添加风险区
riskVillageData().then((res) => {
  AddDangerAreaDataSource(res.data.features);
});

// 添加滑坡
landslideHazardPointData().then((res) => {
  loadLandSlide(res.data);
});

// 添加泥石流
dataOnHiddenDangerPointsOfDebrisFlow().then((res) => {
  AddHazardSource(res.data);
});

// 添加风险区
function AddDangerAreaDataSource(DangerAreaData) {
  let haloEntities = []; // 新增：用于批量高亮
  DangerAreaData.forEach((DangerAreaData_point) => {
    let lon = DangerAreaData_point.properties.lon;
    let lat = DangerAreaData_point.properties.lat;
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
        data: DangerAreaData_point.properties,
      },
    });
  });
}

// 加载滑坡数据
function loadLandSlide(landslide) {
  for (let i = 0; i < landslide.length; i++) {
    let lon = landslide[i].geologicalDisasterHideDTO.lon;
    let lat = landslide[i].geologicalDisasterHideDTO.lat;
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
      },
      properties: {
        data: landslide[i],
      },
    });
  }
}

// 添加泥石流隐患点
function AddHazardSource(debrisFlow) {
  debrisFlow.forEach((hazard_point) => {
    let lon = hazard_point.lon;
    let lat = hazard_point.lat;
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
</script>

<style scoped></style>
