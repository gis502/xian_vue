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
import { useSimulationPointStore } from "../../store/earthquake/simulation_points";
import { onBeforeMount, onUnmounted } from "vue";

// 清空pinia中存储的模拟点
useSimulationPointStore().clearSimulationPoints();

// 添加风险区
riskVillageData().then((res) => {
  // 修改数据结构，待后续接口同意后更改
  const datas = [];

  res.data.features.forEach((item) => {
    datas.push({
      factorVoList: null,
      geologicalDisasterHideDTO: item.properties,
    });
  });
  addHiddenDangerPoints(datas, riskArea);
});

// 添加滑坡
landslideHazardPointData().then((res) => {
  addHiddenDangerPoints(res.data, landslideIcon);
});

// 添加泥石流
dataOnHiddenDangerPointsOfDebrisFlow().then((res) => {
  addHiddenDangerPoints(res.data, debrisFlowIcon);
});

onBeforeMount(() => {
  useSimulationPointStore().clearSimulationPoints();
})

onUnmounted(() => {
  useSimulationPointStore().clearSimulationPoints();
});

// 添加隐患点
async function addHiddenDangerPoints(hiddenDangerPoints, imageEntity) {
  hiddenDangerPoints.forEach((hiddenDangerPoint) => {
    let lon = hiddenDangerPoint.geologicalDisasterHideDTO.lon;
    let lat = hiddenDangerPoint.geologicalDisasterHideDTO.lat;

    // 生成唯一ID (使用隐患点ID或随机生成)
    const entityId = `HIDDEN_DANGER_${Math.floor(Math.random() * 10000000)}`;
    hiddenDangerPoint.entityId = entityId;

    window.viewer.entities.add({
      id: entityId,
      position: Cesium.Cartesian3.fromDegrees(lon, lat),
      billboard: {
        // 图像地址，URI或Canvas的属性   @/assets/images/landslide.png
        image: imageEntity,
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
        data: hiddenDangerPoint,
      },
    });

    useSimulationPointStore().simulationPoints.push(hiddenDangerPoint);
  });
}
</script>

<style scoped></style>
