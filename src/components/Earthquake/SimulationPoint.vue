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
import basicLayers from "@/cesium/basicLayers.js";

// 清空pinia中存储的模拟点
useSimulationPointStore().clearSimulationPoints();
basicLayers.AddDangerAreaDataSource()
basicLayers.loadLandSlide()
basicLayers.Addmudslide()
onBeforeMount(() => {
  useSimulationPointStore().clearSimulationPoints();
})
onUnmounted(() => {
  useSimulationPointStore().clearSimulationPoints();
});

</script>

<style scoped></style>
