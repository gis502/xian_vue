<template>
  <div class="legend-control-panel">
    <div class="panel-header">
      <div class="panel-title">图例与控制</div>
    </div>
    <div class="panel-body">
      <!-- 灾害隐患点 -->
      <div class="legend-section">
        <div class="section-title">灾害隐患点</div>
        <div class="legend-item">
          <div class="legend-color" id="landslide"></div>
          <span class="legend-label">滑坡隐患点 <span class="entity-count">({{ landSlideCount }})</span></span>
          <label class="legend-checkbox">
            <input type="checkbox" v-model="showLandSlide" @change="toggleLandSlide" />
          </label>
        </div>
        <div class="legend-item">
          <div class="legend-color" id="debrisflow"></div>
          <span class="legend-label">泥石流隐患点 <span class="entity-count">({{ debrisFlowCount }})</span></span>
          <label class="legend-checkbox">
            <input type="checkbox" v-model="showDebrisFlow" @change="toggleDebrisFlow" />
          </label>
        </div>
        <div class="legend-item">
          <div class="legend-color" id="flashflood"></div>
          <span class="legend-label">山洪隐患点 <span class="entity-count">({{ flashFloodCount }})</span></span>
          <label class="legend-checkbox">
            <input type="checkbox" v-model="showFlashFlood" @change="toggleFlashFlood" />
          </label>
        </div>
        <div class="legend-item">
          <div class="legend-color" id="water"></div>
          <span class="legend-label">内涝隐患点 <span class="entity-count">({{ waterCount }})</span></span>
          <label class="legend-checkbox">
            <input type="checkbox" v-model="showWater" @change="toggleWater" />
          </label>
        </div>
        <div class="legend-item">
          <div class="legend-color" id="riskArea"></div>
          <span class="legend-label">风险区域 <span class="entity-count">({{ riskCount }})</span></span>
          <label class="legend-checkbox">
            <input type="checkbox" v-model="showRisk" @change="toggleRisk" />
          </label>
        </div>
      </div>
      <!-- 应急设施 -->
      <div class="legend-section">
        <div class="section-title">基础设施</div>
        <div class="legend-item">
          <div class="legend-color" id="hospital"></div>
          <span class="legend-label">医院 <span class="entity-count">({{ hospitalCount }})</span></span>
          <label class="legend-checkbox">
            <input type="checkbox" v-model="showHospital" @change="toggleHospitalPoints" />
          </label>
        </div>
        <div class="legend-item">
          <div class="legend-color" id="dangerSource"></div>
          <span class="legend-label">危险源(加油加气站) <span class="entity-count">({{ dangerSourceCount }})</span></span>
          <label class="legend-checkbox">
            <input type="checkbox" v-model="showDangerSource" @change="toggleDangerPoints" />
          </label>
        </div>
        <div class="legend-item">
          <div class="legend-color" id="shelter"></div>
          <span class="legend-label">避难所 <span class="entity-count">({{ shelterCount }})</span></span>
          <label class="legend-checkbox">
            <input type="checkbox" v-model="showShelter" @change="toggleShelterPoints" />
          </label>
        </div>
        <div class="legend-item">
          <div class="legend-color" id="firefighter"></div>
          <span class="legend-label">消防站 <span class="entity-count">({{ fireFighterCount }})</span></span>
          <label class="legend-checkbox">
            <input type="checkbox" v-model="showFire" @change="toggleFirePoints" />
          </label>
        </div>
        <div class="legend-item">
          <div class="legend-color" id="storePoint"></div>
          <span class="legend-label">储备站 <span class="entity-count">({{ storePointCount }})</span></span>
          <label class="legend-checkbox">
            <input type="checkbox" v-model="showStore" @change="toggleStorePoints" />
          </label>
        </div>
        <div class="legend-item">
          <div class="legend-color" id="bridgePoint"></div>
          <span class="legend-label">桥梁 <span class="entity-count">({{ bridgeCount }})</span></span>
          <label class="legend-checkbox">
            <input type="checkbox" v-model="showBridge" @change="toggleBridge" />
          </label>
        </div>
        <div class="legend-item">
          <div class="legend-color" id="reservoirPoint"></div>
          <span class="legend-label">水库 <span class="entity-count">({{ reservoirCount }})</span></span>
          <label class="legend-checkbox">
            <input type="checkbox" v-model="showReservoir" @change="toggleReservoir" />
          </label>
        </div>
        <div class="legend-item">
          <div class="legend-color" id="subwayPoint"></div>
          <span class="legend-label">地铁站 <span class="entity-count">({{ subwayCount }})</span></span>
          <label class="legend-checkbox">
            <input type="checkbox" v-model="showSubway" @change="toggleSubway" />
          </label>
        </div>
        <div class="legend-item">
          <div class="legend-color" id="schoolPoint"></div>
          <span class="legend-label">学校 <span class="entity-count">({{ schoolCount }})</span></span>
          <label class="legend-checkbox">
            <input type="checkbox" v-model="showSchool" @change="toggleSchool" />
          </label>
        </div>
      </div>

      <!-- 网格与交通系统 -->
      <div class="legend-section">
        <div class="section-title">网格与交通系统</div>
        <div class="legend-item">
          <div class="legend-color" id="peopleGrid"></div>
          <span class="legend-label">人口网格</span>
          <label class="legend-checkbox">
            <input type="checkbox" v-model="showPeople" @change="togglePeople" />
          </label>
        </div>
        <div class="legend-item">
          <div class="legend-color" id="waterPipe"></div>
          <span class="legend-label">管网系统</span>
          <label class="legend-checkbox">
            <input type="checkbox" v-model="showPipe" @change="toggleWaterPipe" />
          </label>
        </div>
        <div class="legend-item">
          <div class="legend-color" id="road"></div>
          <span class="legend-label">交通道路</span>
          <label class="legend-checkbox">
            <input type="checkbox" v-model="showRoad" @change="toggleRoad" />
          </label>
        </div>
        <div class="legend-item">
          <div class="legend-color" id="highway"></div>
          <span class="legend-label">高速</span>
          <label class="legend-checkbox">
            <input type="checkbox" v-model="showHighway" @change="toggleHighway" />
          </label>
        </div>
        <div class="legend-item">
          <div class="legend-color" id="nationalRoad"></div>
          <span class="legend-label">国道</span>
          <label class="legend-checkbox">
            <input type="checkbox" v-model="showNationalRoad" @change="toggleNationalRoad" />
          </label>
        </div>
      </div>
    </div>
  </div>

  <!-- 人口密度图例（条件显示） -->
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
  setupEntityClickHandler: Function,
  landSlideEntities: Object,
  debrisFlowEntities: Object,
  riskEntities: Object,
});

const showLandSlide = ref(true);
const showDebrisFlow = ref(true);
const showFlashFlood = ref(true);
const showWater = ref(true);
const showRisk = ref(true);
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

// 固定的实体数量配置
const ENTITY_COUNTS = {
  landSlide: 162,
  debrisFlow: 7,
  flashFlood: 205,
  water: 103,
  risk: 569,
  hospital: 683,
  dangerSource: 3982,
  shelter: 641,
  fireFighter: 49,
  storePoint: 62,
  school: 3508,
  bridge: 485,
  reservoir: 76,
  subway: 255,
  earthquake: 37
};

// 根据显示状态计算数量
const landSlideCount = computed(() => showLandSlide.value ? ENTITY_COUNTS.landSlide : 0);
const debrisFlowCount = computed(() => showDebrisFlow.value ? ENTITY_COUNTS.debrisFlow : 0);
const flashFloodCount = computed(() => showFlashFlood.value ? ENTITY_COUNTS.flashFlood : 0);
const waterCount = computed(() => showWater.value ? ENTITY_COUNTS.water : 0);
const riskCount = computed(() => showRisk.value ? ENTITY_COUNTS.risk : 0);
const hospitalCount = computed(() => showHospital.value ? ENTITY_COUNTS.hospital : 0);
const dangerSourceCount = computed(() => showDangerSource.value ? ENTITY_COUNTS.dangerSource : 0);
const shelterCount = computed(() => showShelter.value ? ENTITY_COUNTS.shelter : 0);
const fireFighterCount = computed(() => showFire.value ? ENTITY_COUNTS.fireFighter : 0);
const storePointCount = computed(() => showStore.value ? ENTITY_COUNTS.storePoint : 0);
const schoolCount = computed(() => showSchool.value ? ENTITY_COUNTS.school : 0);
const bridgeCount = computed(() => showBridge.value ? ENTITY_COUNTS.bridge : 0);
const reservoirCount = computed(() => showReservoir.value ? ENTITY_COUNTS.reservoir : 0);
const subwayCount = computed(() => showSubway.value ? ENTITY_COUNTS.subway : 0);


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


function toggleLandSlide(){
  if(props.landSlideEntities && props.landSlideEntities.length > 0){
    props.landSlideEntities.forEach(entity => {
      entity.show = showLandSlide.value;
    });
  }else{
    basicLayers.landslideEntities.forEach(entity => {
      entity.show = showLandSlide.value;
    });
  }
}

function toggleDebrisFlow(){
  if(props.debrisFlowEntities && props.debrisFlowEntities.length > 0){
    props.debrisFlowEntities.forEach(entity => {
      entity.show = showDebrisFlow.value;
    });
  }else{
    basicLayers.nishiliuEntities.forEach(entity => {
      entity.show = showDebrisFlow.value;
    });
  }
}

function toggleFlashFlood(){
  if(basicLayers.floodEntities.length === 0 && showFlashFlood.value){
    basicLayers.loadFlashFlood();
  }else{
    basicLayers.floodEntities.forEach(entity => {
      entity.show = showFlashFlood.value;
    });
  }
}

function toggleWater(){
  if(basicLayers.waterEntities.length === 0 && showWater.value){
    basicLayers.loadWater();
  }else{
    basicLayers.waterEntities.forEach(entity => {
      entity.show = showWater.value;
    });
  }
}

function toggleRisk(){
  if(props.riskEntities && props.riskEntities.length > 0){
    props.riskEntities.forEach(entity => {
      entity.show = showRisk.value;
    });
  }else{
    basicLayers.riskEntities.forEach(entity => {
      entity.show = showRisk.value;
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
  }else {
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
.legend-control-panel {
  position: absolute;
  bottom: 20px;
  right: 15px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  width: 250px;
  max-height: 500px;
  overflow: hidden;
  box-shadow: inset 0px 0px 9px rgba(62, 136, 210, 1);
  color: white;
  font-family: Arial, sans-serif;
  border: 1px solid rgba(0, 225, 255, 1);
}

.panel-header {
  background: linear-gradient(180deg, rgba(86, 204, 242, 1) 0%, rgba(47, 128, 237, 1) 100%);
  padding: 10px;
  text-align: center;
  font-weight: bold;
  flex-shrink: 0;
}

.panel-body {
  background: rgba(14, 52, 98, 0.8);
  flex: 1;
  padding: 10px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.legend-label {
  flex: 1;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 4px;
}

.entity-count {
  color: rgba(0, 225, 255, 0.9);
  font-size: 12px;
  font-weight: normal;
  transition: all 0.3s ease;
}

.legend-section {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.section-title {
  font-size: 13px;
  font-weight: bold;
  color: rgba(0, 225, 255, 1);
  padding-bottom: 3px;
  border-bottom: 1px solid rgba(0, 225, 255, 0.3);
}

.legend-item {
  display: flex;
  align-items: center;
  margin: 3px 0;
  font-size: 13px;
  gap: 8px;
}

.legend-color {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.legend-label {
  flex: 1;
  white-space: nowrap;
}

.legend-checkbox {
  display: flex;
  align-items: center;
  cursor: pointer;

  input[type="checkbox"] {
    cursor: pointer;
    width: 14px;
    height: 14px;
  }
}

/* 图标样式 */
#earthquake {
  background-image: url("../../assets/images/eqMark.png");
  background-size: cover;
}

#debrisflow {
  background-image: url("../../assets/images/DebrisFlow.png");
  background-size: cover;
}

#landslide {
  background-image: url("../../assets/images/landslide.png");
  background-size: cover;
}

#flashflood {
  background-image: url("../../assets/images/flashflood.png");
  background-size: cover;
}

#water {
  background-image: url("../../assets/images/water.png");
  background-size: cover;
}

#riskArea {
  background-image: url("../../assets/images/riskArea.png");
  background-size: cover;
}

#earthquakeline {
  background-image: url("../../assets/images/earthquakeline.png");
  background-size: cover;
}

#predictHighDisaster {
  background-image: url("../../assets/images/高风险预警点.png");
  background-size: cover;
}

#predictMidDisaster {
  background-image: url("../../assets/images/中风险预警点.png");
  background-size: cover;
}

#hospital {
  background-image: url("../../assets/images/hospital.png");
  background-size: cover;
}

#dangerSource {
  background-image: url("../../assets/images/gasstation.png");
  background-size: cover;
}

#shelter {
  background-image: url("../../assets/images/emergencyShelter.png");
  background-size: cover;
}

#firefighter {
  background-image: url("../../assets/images/firefighter.png");
  background-size: cover;
}

#storePoint {
  background-image: url("../../assets/images/storePoints.jpg");
  background-size: cover;
}

#bridgePoint {
  background-image: url("../../assets/images/bridge.png");
  background-size: cover;
}

#reservoirPoint {
  background-image: url("../../assets/images/reservoir.png");
  background-size: cover;
}

#subwayPoint {
  background-image: url("../../assets/images/subway.png");
  background-size: cover;
}

#schoolPoint {
  background-image: url("../../assets/images/school.png");
  background-size: cover;
}

///* 新增的图标样式（需要导入对应图片） */
//#peopleGrid {
//  background: linear-gradient(135deg, #b1fe02, #ff0000);
//  background-size: cover;
//}

//#waterPipe {
//  background-image: url("../../assets/images/waterPipe.png");
//  background-size: cover;
//}
//
//#road {
//  background-image: url("../../assets/images/road.png");
//  background-size: cover;
//}
//
//#highway {
//  background-image: url("../../assets/images/highway.png");
//  background-size: cover;
//}
//
//#nationalRoad {
//  background-image: url("../../assets/images/nationalRoad.png");
//  background-size: cover;
//}

/* 人口密度图例样式 */
.graph_legend {
  padding: 6px;
  position: absolute;
  bottom: 20px;
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
  margin-bottom: 5px;
}

.legend-item1 {
  display: flex;
  align-items: center;
  margin: 3px 0;
  font-size: 12px;
  width: 100%;
  color: white;
  gap: 6px;
}

.legend-item1 .legend-color {
  width: 16px;
  height: 16px;
  border-radius: 2px;
}

/* 滚动条样式 */
.panel-body::-webkit-scrollbar {
  width: 6px;
}

.panel-body::-webkit-scrollbar-track {
  background: rgba(14, 52, 98, 0.5);
}

.panel-body::-webkit-scrollbar-thumb {
  background: rgba(0, 225, 255, 0.5);
  border-radius: 3px;
}

.panel-body::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 225, 255, 0.8);
}
</style>
