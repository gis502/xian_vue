<template>
  <div class="layerControl-panel">
    <div class="panel-title">控制显示</div>
    <div class="panel-content">
<!--      <label><input type="checkbox" v-model="showDisaster" @change="toggleDisaster"> 显示隐患点 </label>-->
      <label><input type="checkbox" v-model="showHospital" @change="toggleHospitalPoints" /> 显示医院 </label>
      <label><input type="checkbox" v-model="showDangerSource" @change="toggleDangerPoints"> 显示危险源 </label>
      <label><input type="checkbox" v-model="showShelter" @change="toggleShelterPoints"> 显示避难所 </label>
      <label><input type="checkbox" v-model="showFire" @change="toggleFirePoints"> 显示消防站 </label>
      <label><input type="checkbox" v-model="showStore" @change="toggleStorePoints"> 显示储备点 </label>
      <label><input type="checkbox" v-model="showSchool" @change="toggleSchool"> 显示学校 </label>
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

  <div class="graph_legend" v-if="showPeople">
    <div class="legend-title1">人口密度图例</div>

    <div class="legend-item1">
      <span class="legend-color" style="background-color: #b1fe02;"></span>
      <span class="legend-label">Min-0 < 100</span>
    </div>

    <div class="legend-item1">
      <span class="legend-color" style="background-color: #6bf700;"></span>
      <span class="legend-label">100 ≤ X < 500</span>
    </div>

    <div class="legend-item1">
      <span class="legend-color" style="background-color: #fcf600;"></span>
      <span class="legend-label">500 ≤ X < 1000</span>
    </div>

    <div class="legend-item1">
      <span class="legend-color" style="background-color: #fecb02;"></span>
      <span class="legend-label">1000 ≤ X < 2000</span>
    </div>

    <div class="legend-item1">
      <span class="legend-color" style="background-color: #fc9e00;"></span>
      <span class="legend-label">2000 ≤ X < 4000</span>
    </div>

    <div class="legend-item1">
      <span class="legend-color" style="background-color: #fe7004;"></span>
      <span class="legend-label">4000 ≤ X < 8000</span>
    </div>

    <div class="legend-item1">
      <span class="legend-color" style="background-color: #fb3f02;"></span>
      <span class="legend-label">8000 ≤ X < 10000</span>
    </div>

    <div class="legend-item1">
      <span class="legend-color" style="background-color: #ff0000;"></span>
      <span class="legend-label">10000 ≤ X < Max</span>
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
const showSchool = ref(false);
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

function toggleSchool() {
  if(basicLayers.schoolEntities.length === 0 && showSchool.value){
    basicLayers.loadSchool();
    props.setupEntityClickHandler();
  }else{
    basicLayers.schoolEntities.forEach(entity => {
      entity.show = showSchool.value;
    })
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
  if(basicLayers.bridgeEntities.length === 0 && showBridge.value) {
    basicLayers.loadBridge();
    props.setupEntityClickHandler();
  }else{
    basicLayers.bridgeEntities.forEach(entity => {
      entity.show = showBridge.value;
    });
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
  if(basicLayers.reservoirEntities.length === 0 && showReservoir.value) {
    basicLayers.loadReservoir();
    props.setupEntityClickHandler();
  }else{
    basicLayers.reservoirEntities.forEach(entity => {
      entity.show = showReservoir.value;
    });
  }
}

//控制地铁站显示
function toggleSubway(){
  if(basicLayers.subwayEntities.length === 0 && showSubway.value) {
    basicLayers.loadSubway();
    props.setupEntityClickHandler();
  }else{
    basicLayers.subwayEntities.forEach(entity => {
      entity.show = showSubway.value;
    });
  }
}


</script>

<style scoped lang="scss">

.layerControl-panel {
  position: absolute;
  top: 10px;
  right: 20px;
  border-radius: 2px;
  z-index: 1000;
  width: 160px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  color: white;
  border: 1px solid rgba(0, 225, 255, 1);
}

.panel-content {
  background: rgba(14, 52, 98, 0.8);
  padding: 8px;
  display: flex;
  flex-direction: column;
  font-size: 12px;
  gap: 6px;
}

.panel-content label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  cursor: pointer;
  color: white;
}

.panel-title {
  font-weight: bold;
  font-size: 12px;
  background: linear-gradient(180deg, rgba(86, 204, 242, 1) 0%, rgba(47, 128, 237, 1) 100%);
  padding: 8px;
  text-align: center;
}

.legend-color {
  width: 16px;
  height: 16px;
  margin-right: 6px;
  border-radius: 2px;
}

.graph_legend {
  padding: 6px;
  position: absolute;
  bottom: 10px;
  left: 15px;
  border-radius: 2px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  width: 150px;
  height: 210px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  color: white;
  font-family: Arial, sans-serif;
  background: rgba(14, 52, 98, 0.8);
  border: 1px solid rgba(0, 225, 255, 1);
}

.legend-title1 {
  font-weight: bold;
  font-size: 16px;
  text-align: center;
}

.legend-item1 {
  display: flex;
  align-items: center;
  margin: 3px 0;
  font-size: 12px;
  width: 100%;
  color: white;
}

</style>