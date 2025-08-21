<template>
  <div class="layerControl-panel">
    <div class="panel-title">控制显示</div>
    <div class="panel-content">
      <label><input type="checkbox" v-model="showDisaster" @change="toggleDisaster"> 显示隐患点 </label>
      <label><input type="checkbox" v-model="showHospital" @change="toggleHospitalPoints" /> 显示医院 </label>
      <label><input type="checkbox" v-model="showDangerSource" @change="toggleDangerPoints"> 显示风险源 </label>
      <label><input type="checkbox" v-model="showShelter" @change="toggleShelterPoints"> 显示避难所 </label>
      <label><input type="checkbox" v-model="showFire" @change="toggleFirePoints"> 显示消防站 </label>
      <label><input type="checkbox" v-model="showStore" @change="toggleStorePoints"> 显示储备点 </label>
      <label><input type="checkbox" v-model="showPeople" @change="togglePeople"> 显示人口网格 </label>
      <label><input type="checkbox" v-model="showCrops" @change="toggleCrops"> 显示农田网格 </label>
      <label><input type="checkbox" v-model="showPipe" @change="toggleWaterPipe"> 显示管网系统 </label>
      <label><input type="checkbox" v-model="showRoad" @change="toggleRoad"> 显示交通道路 </label>
      <label><input type="checkbox" v-model="showBridge" @change="toggleBridge"> 显示桥梁 </label>
      <label><input type="checkbox" v-model="showHighway" @change="toggleHighway"> 显示高速 </label>
      <label><input type="checkbox" v-model="showNationalRoad" @change="toggleNationalRoad"> 显示国道 </label>
      <label><input type="checkbox" v-model="showReservoir" @change="toggleReservoir"> 显示水库 </label>
      <label><input type="checkbox" v-model="showSubway" @change="toggleSubway"> 显示地铁站 </label>
    </div>
  </div>
</template>

<script setup name = 'layerControl'>
import {ref} from 'vue';
import basicLayers from "@/cesium/basicLayers.js";
import * as Cesium from "cesium";

const props = defineProps({
  viewer: Object,
  setupEntityClickHandler: Function
});

const showDisaster = ref(true);
const showHospital = ref(false); // 控制医院显示/隐藏
const showDangerSource = ref(false); // 控制风险源显示/隐藏
const showShelter = ref(false); // 控制避难所显示/隐藏
const showFire = ref(false); // 控制消防站显示/隐藏
const showStore = ref(false); // 控制储备点显示/隐藏
const showPeople = ref(false);
const showCrops = ref(false);
const showPipe = ref(false);
const showRoad = ref(false);
const showBridge = ref(false);
const showHighway = ref(false);
const showNationalRoad = ref(false);
const showReservoir = ref(false);
const showSubway = ref(false);

const layerHandler = ref(null);

// 图层点击事件处理
function setupLayerClickHandler() {
  // 清除之前的点击事件处理程序
  if (layerHandler.value) {
    layerHandler.value = null;
  }
  // 为左键点击添加事件处理程序
  layerHandler.value = new Cesium.ScreenSpaceEventHandler(props.viewer.canvas);

  layerHandler.value.setInputAction(async (click) => {
    // 1. 获取点击位置的经纬度和像素坐标
    const position = props.viewer.scene.pickPosition(click.position); // 三维坐标
    if (!position) return;
    const ray = props.viewer.camera.getPickRay(click.position);
    const cartesian = props.viewer.scene.globe.pick(ray, props.viewer.scene);

    if (cartesian) {
      const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
      const longitude = Cesium.Math.toDegrees(cartographic.longitude);
      const latitude = Cesium.Math.toDegrees(cartographic.latitude);

      console.log(111, longitude, latitude);

      // 2. 获取点击位置的屏幕像素坐标
      const feature = props.viewer.scene.pick(click.position);
      if (!feature) return;
      // 3. 发送 GetFeatureInfo 请求,对每个Layer进行判别，若其显示，则请求
      if(showPeople.value){
        const infoUrl = buildGetFeatureInfoUrl(longitude, latitude, basicLayers.peopleLayerName);
        const response = await fetch(infoUrl);
        const text = await response.text();
        console.log("属性信息:", JSON.parse(text)); // 打印 GeoServer 返回的属性
      }
      //农作物
      if(showCrops.value){
        const infoUrl = buildGetFeatureInfoUrl(longitude, latitude, basicLayers.cropsLayerName);
        const response = await fetch(infoUrl);
        const text = await response.text();
        console.log("农作物信息:", JSON.parse(text)); // 打印 GeoServer 返回的属性
      }
      //管网
      if(showPipe.value){
        const infoUrl = buildGetFeatureInfoUrl(longitude, latitude, basicLayers.waterPipeLayerName);
        const response = await fetch(infoUrl);
        const text = await response.text();
        console.log("管网信息:", JSON.parse(text));
      }
      //道路
      if(showRoad.value){
        const infoUrl = buildGetFeatureInfoUrl(longitude, latitude, basicLayers.roadLayerName);
        const response = await fetch(infoUrl);
        const text = await response.text();
        console.log("道路信息:", JSON.parse(text));
      }
      //桥梁
      if(showBridge.value){
        const infoUrl = buildGetFeatureInfoUrl(longitude, latitude, basicLayers.bridgeLayerName);
        const response = await fetch(infoUrl);
        const text = await response.text();
        console.log("桥梁信息:", JSON.parse(text));
      }
      //高速
      if(showHighway.value){
        const infoUrl = buildGetFeatureInfoUrl(longitude, latitude, basicLayers.highwayLayerName);
        const response = await fetch(infoUrl);
        const text = await response.text();
        console.log("高速信息:", JSON.parse(text));
      }
      //国道
      if(showNationalRoad.value){
        const infoUrl = buildGetFeatureInfoUrl(longitude, latitude, basicLayers.nationalRoadLayerName);
        const response = await fetch(infoUrl);
        const text = await response.text();
        console.log("国道信息:", JSON.parse(text));
      }
      //水库
      if(showReservoir.value){
        const infoUrl = buildGetFeatureInfoUrl(longitude, latitude, basicLayers.reservoirLayerName);
        const response = await fetch(infoUrl);
        const text = await response.text();
        console.log("水库信息:", JSON.parse(text));
      }
      //地铁站
      if(showSubway.value){
        const infoUrl = buildGetFeatureInfoUrl(longitude, latitude, basicLayers.subwayLayerName);
        const response = await fetch(infoUrl);
        const text = await response.text();
        console.log("地铁站信息:", JSON.parse(text));
      }
    }
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
}
//设置请求
function buildGetFeatureInfoUrl(lon, lat, layerName) {
  const wmsUrl = basicLayers.geoUrl;
  const params = {
    service: 'WMS',
    version: '1.1.1',
    request: 'GetFeatureInfo',
    layers: layerName,
    srs: 'EPSG:4490',
    bbox: `${lon-0.01},${lat-0.01},${lon+0.01},${lat+0.01}`, // 小范围查询
    width: 101,  // 必须为奇数（中心点即点击位置）
    height: 101,
    query_layers: layerName,
    info_format: 'application/json', // 或 'text/plain'
    x: 50,  // 点击位置在 bbox 中心的像素坐标
    y: 50,
  };
  return `${wmsUrl}?${new URLSearchParams(params).toString()}`;
}


function toggleDisaster(){
  if(basicLayers.disasterEntities.length === 0 && showDisaster.value){
    basicLayers.loadLandSlide();
    basicLayers.Addmudslide();
    basicLayers.AddDangerAreaDataSource();
    basicLayers.loadFlashFlood();
    basicLayers.loadWater();
  }else{
    basicLayers.disasterEntities.forEach(entity => {
      entity.show = showDisaster.value;
    });
  }
}

function toggleHospitalPoints() {
  //首次加载
  if(basicLayers.hospitalEntities.length === 0 && showHospital.value){
    basicLayers.loadHospital();
    props.setupEntityClickHandler();
  }else{
    basicLayers.hospitalEntities.forEach(entity => {
      entity.show = showHospital.value;
    });
  }

}

function toggleDangerPoints() {
  if(basicLayers.dangerEntities.length === 0 && showDangerSource.value){
    basicLayers.loadDangerSource();
    props.setupEntityClickHandler();
  }else{
    basicLayers.dangerEntities.forEach(entity => {
      entity.show = showDangerSource.value;
    });
  }

}

function toggleShelterPoints() {
  if(basicLayers.shelterEntities.length === 0 && showShelter.value){
    basicLayers.loadEmergencyShelter();
    props.setupEntityClickHandler();
  }else{
    basicLayers.shelterEntities.forEach(entity => {
      entity.show = showShelter.value;
    });
  }
}

function toggleFirePoints() {
  if(basicLayers.fireFighterEntities.length === 0 && showFire.value){
    basicLayers.loadFireFighter();
    props.setupEntityClickHandler();
  }else{
    basicLayers.fireFighterEntities.forEach(entity => {
      entity.show = showFire.value;
    });
  }
}

function toggleStorePoints() {
  if(basicLayers.storePointsEntities.length === 0 && showStore.value){
    basicLayers.loadStorePoint();
    props.setupEntityClickHandler();
  }else{
    basicLayers.storePointsEntities.forEach(entity => {
      entity.show = showStore.value;
    });
  }
}
// 控制人口网格显示
function togglePeople() {
  if (basicLayers.peopleLayer == null && showPeople.value) {
    basicLayers.addPeopleLayer();
    setupLayerClickHandler();
  }else{
    basicLayers.peopleLayer.show = showPeople.value;
  }
}
//控制农田显示
function toggleCrops(){
  if(basicLayers.cropsLayer == null && showCrops.value) {
    basicLayers.addCropsLayer();
    setupLayerClickHandler();
  }else{
    basicLayers.cropsLayer.show = showCrops.value;
  }
}

//控制管网系统显示
function toggleWaterPipe(){
  if(basicLayers.waterPipeLayer == null && showPipe.value) {
    basicLayers.addWaterPipeLayer();
    setupLayerClickHandler();
  }else{
    basicLayers.waterPipeLayer.show = showPipe.value;
  }
}

//控制道路显示
function toggleRoad(){
  if(basicLayers.roadLayer == null && showRoad.value) {
    basicLayers.addRoadLayer();
    setupLayerClickHandler();
  }else{
    basicLayers.roadLayer.show = showRoad.value;
  }
}

//控制桥梁显示
function toggleBridge(){
  if(basicLayers.bridgeLayer == null && showBridge.value) {
    basicLayers.addBridgeLayer();
    setupLayerClickHandler();
  }else{
    basicLayers.bridgeLayer.show = showBridge.value;
  }
}

//控制高速显示
function toggleHighway(){
  if(basicLayers.highwayLayer == null && showHighway.value) {
    basicLayers.addHighwayLayer();
    setupLayerClickHandler();
  }else{
    basicLayers.highwayLayer.show = showHighway.value;
  }
}

//控制国道显示
function toggleNationalRoad(){
  if(basicLayers.nationalRoadLayer == null && showNationalRoad.value) {
    basicLayers.addNationalRoad();
    setupLayerClickHandler();
  }else{
    basicLayers.nationalRoadLayer.show = showNationalRoad.value;
  }
}

//控制水库显示
function toggleReservoir(){
  if(basicLayers.reservoirLayer == null && showReservoir.value) {
    basicLayers.addReservoirLayer();
    setupLayerClickHandler();
  }else{
    basicLayers.reservoirLayer.show = showReservoir.value;
  }
}

//控制地铁站显示
function toggleSubway(){
  if(basicLayers.subwayLayer == null && showSubway.value) {
    basicLayers.addSubway();
    setupLayerClickHandler();
  }else{
    basicLayers.subwayLayer.show = showSubway.value;
  }
}


</script>

<style scoped lang="scss">

.layerControl-panel {
  position: absolute;
  top: 10px;
  right: 20px;
  background-color: rgba(255, 255, 255, 0.75);
  border: 1px solid #ffffff;
  border-radius: 16px;
  color: black;
  padding: 10px; /* 缩小内边距 */
  z-index: 1000;
  width: 160px; /* 缩小面板宽度 */
}

.panel-title {
  font-weight: bold;
  margin-bottom: 6px; /* 缩小标题与内容间距 */
  font-size: 12px; /* 缩小字体 */
}

.panel-content {
  display: flex;
  flex-direction: column;
  font-size: 12px; /* 缩小字体 */
  gap: 6px; /* 缩小子元素间距 */
}

.panel-content label {
  display: flex;
  align-items: center;
  gap: 6px; /* 缩小标签内元素间距 */
  font-size: 12px; /* 缩小字体 */
  cursor: pointer;
}

</style>