<template>
  <div
      id="cesium-container"
      ref="cesiumContainer"
      v-loading="loading"
      :element-loading-spinner="svg"
      element-loading-svg-view-box="-10, -10, 50, 50"
      element-loading-background="rgba(122, 122, 122, 0.8)"
  >
    <div class="controls">
      <div class="rain-btn" @click="selectDisasterChain">
        灾害链模型选择
      </div>
      <div class="rain-btn" @click="toSelectDisaster">
        选择历史灾害
      </div>
    </div>
    <div v-if="showSelect" class="layerControl-panel">
      <div class="panel-content">
        <label><input type="checkbox" v-model="showRainLand" @change="toggleRainLand" :disabled="disasterTy === 'earthquake'"> 暴雨滑坡 </label>
        <label><input type="checkbox" v-model="showRainDebrisFlow" @change="toggleRainDebrisFlow" :disabled="disasterTy === 'earthquake'"> 暴雨泥石流 </label>
        <label><input type="checkbox" v-model="showRainWater" @change="toggleRainWater" :disabled="disasterTy === 'earthquake'"> 暴雨内涝 </label>
        <label><input type="checkbox" v-model="showRainFlood" @change="toggleRainFlood" :disabled="disasterTy === 'earthquake'"> 暴雨山洪 </label>
        <label><input type="checkbox" v-model="showEarthLand" @change="toggleEarthLand" :disabled="disasterTy === 'rain'"> 地震滑坡 </label>
        <label><input type="checkbox" v-model="showEarthDebrisFlow" @change="toggleEarthDebrisFlow" :disabled="disasterTy === 'rain'"> 地震泥石流 </label>
      </div>
    </div>
    <!-- 暴雨信息卡片 -->
    <div class="rain-table-container" v-if="showDisaster">
      <div class="table-header">
        <div class="table-title">
          <i class="el-icon-heavy-rain"></i>
          总灾害信息列表
        </div>
        <div class="search-controls">
          <input
              v-model="searchQuery"
              placeholder="搜索灾害名称"
              class="search-input"
              @keyup.enter="applySearch"
          >
          <button class="search-btn" @click="applySearch">
            <i class="el-icon-search"></i>搜索
          </button>
          <button class="refresh-btn" @click="getAllRainInfo">
            <i class="el-icon-refresh"></i>刷新
          </button>
        </div>
      </div>

      <table class="rain-table">
        <thead>
        <tr>
          <th>灾害名称</th>
          <th>发生时间</th>
          <th>降雨量 (mm)/震级</th>
          <th>位置</th>
        </tr>
        </thead>
        <tbody>
        <tr
            v-for="item in paginatedData"
            :key="item.disasterId"
            :class="{ selected: selectedDisasterId === item.disasterId }"
            @click="selectDisaster(item)"
        >
          <td>{{ item.disasterName }}</td>
          <td>{{ formatTime(item.occurrenceTime) }}</td>
          <td>{{ item.rainfall || item.magnitude }}</td>
          <td>{{ item.position }}</td>
        </tr>
        </tbody>
      </table>

      <div class="pagination">
        <button @click="prevPage" :disabled="currentPage === 1">上一页</button>
        <span>第 {{ currentPage }} 页 / 共 {{ totalPages }} 页</span>
        <button @click="nextPage" :disabled="currentPage === totalPages">下一页</button>
      </div>
    </div>
    <div
        v-if="selectedEntityData"
        class="disaster-popup"
        :style="{
    left: `${calculatePopupLeft()}px`,
    top: `${calculatePopupTop()}px`,
    display: popupVisible ? 'block' : 'none',
    opacity: popupVisible ? '1' : '0',
    transform: popupVisible ? 'scale(1)' : 'scale(0.5)'}">
      <div class="popup-header">
        <h3 v-if="selectedEntityData.properties.disasterName">{{
            selectedEntityData.properties.disasterName || '未知灾害点'
          }} </h3>
        <button @click="closePopup"> 关闭</button>
      </div>
      <div class="popup-content">
        <table class="disaster-table">
          <tbody>
          <tr v-if="selectedEntityData.properties.disasterType">
            <th>灾害类型</th>
            <td>{{ selectedEntityData.properties.disasterType || '未知' }}</td>
          </tr>
          <tr v-if="selectedEntityData.properties.level">
            <th>级别</th>
            <td>{{ selectedEntityData.properties.level }}</td>
          </tr>
          <tr v-if="selectedEntityData.properties.position">
            <th>位置</th>
            <td>{{ selectedEntityData.properties.position || '未知' }}</td>
          </tr>
          <tr>
            <th>经度</th>
            <td>东经{{ selectedEntityData.properties.lon || '未知' }}</td>
          </tr>
          <tr>
            <th>纬度</th>
            <td>北纬{{ selectedEntityData.properties.lat || '未知' }}</td>
          </tr>
          <tr v-if="selectedEntityData.properties.riskGrade">
            <th>风险等级</th>
            <td>{{ selectedEntityData.properties.riskGrade || '未知' }}</td>
          </tr>
          <tr v-if="selectedEntityData.probability">
            <th>发生概率</th>
            <td>{{ selectedEntityData.probability || '0' }}</td>
          </tr>
          <tr v-if="selectedEntityData.level">
            <th>险情等级</th>
            <td>{{ selectedEntityData.level || '未知' }}</td>
          </tr>
          </tbody>
        </table>
      </div>
    </div>
    <!-- 图例 -->
    <Legend></Legend>
    <!-- 表格 -->
    <Table v-if="showTable" :dataTypes="dataTypes"></Table>
  </div>
</template>

<script setup>
import * as Cesium from "cesium";

import { initCesium } from "@/cesium/initLayer.js";
import { onMounted, reactive, ref } from "vue";
import basicLayers from "../../cesium/basicLayers";
import Table from "../../components/Earthquake/Table.vue";
import Legend from "../../components/Earthquake/Legend.vue";
import {getRain, getRainProbability, getEarthQuakeProbability, getEarthQuake} from "@/api/system/disasterChain.js";
import modal from "@/plugins/modal.js";

const currentPage = ref(1);
const itemsPerPage = 5;
const searchQuery = ref('');
const filteredRainData = ref([]);
const isSearching = ref(false);

const showDisaster = ref(false);
const showRainLand = ref(false);
const showRainDebrisFlow = ref(false);
const showRainWater = ref(false);
const showRainFlood = ref(false);
const showEarthLand = ref(false);
const showEarthDebrisFlow = ref(false);
const flashInterval = ref(null);
const haloCollection = ref(null);

let selectedEntityData = ref(null);
let popupVisible = ref(false);
let popupPosition =  ref({x: 0, y: 0});
// 加载
let rainData = ref([]);
let earthquakeData = ref([]);
let combinedData = ref([]); // 新增合并后的数据

let loading = ref(false);
let disasterId = ref(0);
let disasterTy = ref("");
let LandEntities = ref([]);
let FlowEntities= ref([]);
let FloodEntities = ref([]);
let WaterEntities= ref([]);
let highRiskEntities = ref([]);

// 表格数据
const dataTypes = reactive({
  filterCriteria: [
    {
      name: "暴雨滑坡",
      value: "type1",
    },
    {
      name: "暴雨泥石流",
      value: "type2",
    },
    {
      name: "暴雨内涝",
      value: "type3",
    },
    {
      name: "暴雨山洪",
      value: "type4",
    },
    {
      name: "地震滑坡",
      value: "type5",
    },
    {
      name: "地震泥石流",
      value: "type6",
    },
  ],
  type1: {
    headers: ["灾害名称", "位置", "发生概率", "险情等级"],
    data: [],
  },
  type2: {
    headers: ["灾害名称", "位置", "发生概率", "险情等级"],
    data: [],
  },
  type3: {
    headers: ["灾害名称", "位置", "发生概率", "险情等级"],
    data: [],
  },
  type4: {
    headers: ["灾害名称", "位置", "发生概率", "险情等级"],
    data: [],
  },
  type5: {
    headers: ["灾害名称", "位置", "发生概率", "险情等级"],
    data: [],
  },
  type6: {
    headers: ["灾害名称", "位置", "发生概率", "险情等级"],
    data: [],
  }
});

// 显示表格
const showTable = ref(true);
const showSelect = ref(false);

let viewer = null;

onMounted(() => {
  viewer = initCesium("cesium-container");
  window.viewer = viewer;
  // 断裂带
  basicLayers.addFaultZone();
  // 行政区
  basicLayers.loadAdminData();
  basicLayers.loadRisk();
  basicLayers.loadFlow();               //加载泥石流
  basicLayers.loadWater1();             //加载内涝
  basicLayers.loadFlood();              //加载山洪
  basicLayers.loadLand();               //加载滑坡
  // 调整到指定位置
  window.viewer.cesiumWidget.creditContainer.style.display = "none";
  window.viewer.camera.setView({
    destination: Cesium.Cartesian3.fromDegrees(108.93, 34.27, 200000),
    orientation: {
      heading: Cesium.Math.toRadians(0),
      pitch: Cesium.Math.toRadians(-90),
      roll: 0.0,
    },
  });
  getAllDisasterInfo();
  setupEntityHandler();
});

//灾害选择
function selectDisasterChain() {
  showSelect.value = !showSelect.value;
}

function toSelectDisaster(){
  showDisaster.value = !showDisaster.value;
}

// 修改获取数据的方法
async function getAllDisasterInfo(){
  try {
    // 并行获取暴雨和地震数据
    const [rainResponse, earthquakeResponse] = await Promise.all([
      getRain(),
      getEarthQuake()
    ]);

    rainData.value = rainResponse.data || [];
    earthquakeData.value = earthquakeResponse.data || [];

    // 合并数据并添加类型标识
    combinedData.value = [
      ...rainData.value.map(item => ({ ...item, disasterType: 'rain' })),
      ...earthquakeData.value.map(item => ({ ...item, disasterType: 'earthquake' }))
    ].sort((a, b) => new Date(b.occurrenceTime) - new Date(a.occurrenceTime)); // 按时间降序

    searchQuery.value = ''; // 清空搜索框
    isSearching.value = false; // 重置搜索状态
    currentPage.value = 1; // 重置到第一页

  } catch (e) {
    console.log("error", e);
  }
}

// 修改计算属性，使用合并后的数据
const paginatedData = computed(() => {
  const dataSource = isSearching.value ? filteredRainData.value : combinedData.value;
  const start = (currentPage.value - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  return dataSource.slice(start, end);
});

const totalPages = computed(() => {
  const dataSource = isSearching.value ? filteredRainData.value : combinedData.value;
  return Math.ceil(dataSource.length / itemsPerPage);
});

// 修改搜索功能
function applySearch() {
  if (!searchQuery.value.trim()) {
    isSearching.value = false;
    currentPage.value = 1;
    return;
  }

  const query = searchQuery.value.toLowerCase().trim();
  filteredRainData.value = combinedData.value.filter(item =>
      item.disasterName.toLowerCase().includes(query)
  );

  isSearching.value = true;
  currentPage.value = 1;
}
// 方法
function selectDisaster(item) {
  resetAll();
  disasterId.value = item.disasterId;
  disasterTy.value = item.disasterType;
  // 这里可以调用其他处理选中灾害的函数
  console.log('选中的灾害ID:', disasterId.value, '灾害类型:', disasterTy.value);
  modal.msg(`选择成功，选择的灾害id：${disasterId.value}，选择的灾害类型：${disasterTy.value}`);
  showDisaster.value = !showDisaster.value;
}

function prevPage() {
  if (currentPage.value > 1) {
    currentPage.value--;
  }
}

function nextPage() {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
  }
}

function formatTime(timeString) {
  return new Date(timeString).toLocaleString('zh-CN');
}

//主体逻辑
function toggleRainLand(){
  if(showRainLand.value){
    try{
      const DTO = {
        disasterId: disasterId.value,
        disasterType: "滑坡",
      };
      // 等待数据获取完成
      getRainProbability(DTO).then((response) =>{
        setTimeout(() => {
          console.log("等待2秒后执行");
          const processedEntities = checkEntity(response.data);
          LandEntities.value = processedEntities;
          LandEntities.value.forEach((item) => {
            dataTypes.type1.data.push({
              field1: item.name,
              field2: item.position,
              field3: item.probability,
              field4: item.riskGrade,
              field5: item.lon,
              field6: item.lat,
            })
          })
        }, 1500); // 2000毫秒 = 2秒
      })
    }catch (e){
      console.log("error", e)
    }
  }else{
    dataTypes.type1.data = [];
    stopFlashEntities("滑坡");
    flash();
  }
}

function toggleRainDebrisFlow() {
  if(showRainDebrisFlow.value){
    try{
      const DTO = {
        disasterId: disasterId.value,
        disasterType: "泥石流",
      };
      getRainProbability(DTO).then((response) => {
        setTimeout(() => {
          FlowEntities.value = checkEntity(response.data);
          FlowEntities.value.forEach((item) => {
            dataTypes.type2.data.push({
              field1: item.name,
              field2: item.position,
              field3: item.probability,
              field4: item.riskGrade,
              field5: item.lon,
              field6: item.lat,
            })
          })
        }, 1500);
      })
    }catch (e){
      console.log("error", e)
    }
  }else{
    dataTypes.type2.data = [];
    stopFlashEntities("泥石流");
    flash();
  }

}

function toggleRainWater(){
  if(showRainWater.value){
    try{
      const DTO = {
        disasterId: disasterId.value,
        disasterType: "内涝",
      };
      getRainProbability(DTO).then((response) => {
        setTimeout(() => {
          WaterEntities.value = checkEntity(response.data);
          WaterEntities.value.forEach((item) => {
            dataTypes.type3.data.push({
              field1: item.name,
              field2: item.position,
              field3: item.probability,
              field4: item.riskGrade,
              field5: item.lon,
              field6: item.lat,
            })
          })
        }, 1500);
      })
    }catch (e){
      console.log("error", e)
    }
  }else{
    dataTypes.type3.data = [];
    stopFlashEntities("内涝");
    flash();
  }

}

function toggleRainFlood(){
  if(showRainFlood.value){
    try{
      const DTO = {
        disasterId: disasterId.value,
        disasterType: "山洪",
      };
      getRainProbability(DTO).then((response) => {
        setTimeout(() => {
          FloodEntities.value = checkEntity(response.data);
          FloodEntities.value.forEach((item) => {
            dataTypes.type4.data.push({
              field1: item.name,
              field2: item.position,
              field3: item.probability,
              field4: item.riskGrade,
              field5: item.lon,
              field6: item.lat,
            })
          })
        }, 1500);
      })
    }catch (e){
      console.log("error", e)
    }
  }else{
    dataTypes.type4.data = [];
    stopFlashEntities("山洪");
    flash();
  }
}

function toggleEarthLand(){
  if(showEarthLand.value){
    try{
      const DTO = {
        disasterId: disasterId.value,
        disasterType: "滑坡",
      };
      // 等待数据获取完成
      getEarthQuakeProbability(DTO).then((response) =>{
        setTimeout(() => {
          console.log("等待2秒后执行");
          const processedEntities = checkEntity(response.data);
          LandEntities.value = processedEntities;
          LandEntities.value.forEach((item) => {
            dataTypes.type5.data.push({
              field1: item.name,
              field2: item.position,
              field3: item.probability,
              field4: item.riskGrade,
              field5: item.lon,
              field6: item.lat,
            })
          })
        }, 1500); // 2000毫秒 = 2秒
      })
    }catch (e){
      console.log("error", e)
    }
  }else{
    dataTypes.type5.data = [];
    stopFlashEntities("滑坡");
    flash();
  }
}

function toggleEarthDebrisFlow(){
  if(showRainDebrisFlow.value){
    try{
      const DTO = {
        disasterId: disasterId.value,
        disasterType: "泥石流",
      };
      getEarthQuakeProbability(DTO).then((response) => {
        setTimeout(() => {
          FlowEntities.value = checkEntity(response.data);
          FlowEntities.value.forEach((item) => {
            dataTypes.type6.data.push({
              field1: item.name,
              field2: item.position,
              field3: item.probability,
              field4: item.riskGrade,
              field5: item.lon,
              field6: item.lat,
            })
          })
        }, 1500);
      })
    }catch (e){
      console.log("error", e)
    }
  }else{
    dataTypes.type6.data = [];
    stopFlashEntities("泥石流");
    flash();
  }
}

function resetAll(){
  dataTypes.type4.data = [];
  dataTypes.type6.data = [];
  dataTypes.type2.data = [];
  dataTypes.type1.data = [];
  dataTypes.type3.data = [];
  dataTypes.type5.data = [];
  showRainFlood.value = false;
  showRainLand.value = false;
  showRainDebrisFlow.value = false;
  showRainWater.value = false;
  showEarthDebrisFlow.value = false;
  showEarthLand.value = false;
  stopFlashEntities("滑坡");
  stopFlashEntities("泥石流");
  stopFlashEntities("山洪");
  stopFlashEntities("内涝");
  flash();
}

function checkEntity(entityData) {
  const commonEntities = [];

  entityData.forEach((element) => {
    const entityId = parseInt(element.entityId);

    // 使用 find() 方法查找匹配的实体
    const matchedEntity = basicLayers.disasterEntities.find(entity => {
      const currentEntityId = typeof entity.id === 'string' ? parseInt(entity.id) : entity.id;
      return currentEntityId === entityId;
    });

    if (matchedEntity) {

      // 更新实体的disasterData
      matchedEntity.disasterData = {
        ...(matchedEntity.disasterData || {}),
        probability: element.probability,
        level: element.level,
      };

      // 检查高风险条件
      const probability = parseFloat(element.probability) || 0;
      const isHighLevel = element.level && element.level.includes("高");
      const isMidLevel = element.level && element.level.includes("中");

      const entityInfo = {
        id: matchedEntity.id,
        name: matchedEntity.disasterData.properties.disasterName,
        probability: probability,
        disasterType: matchedEntity.disasterData.properties.disasterType,
        riskGrade: element.level,
        position: matchedEntity.disasterData.properties.position,
        lon: matchedEntity.disasterData.properties.lon,
        lat: matchedEntity.disasterData.properties.lat,
      };

      commonEntities.push(entityInfo);
      if (isHighLevel || isMidLevel) {
        highRiskEntities.value.push(entityInfo);
      }
    }
  });

  console.log("高/中风险实体列表:", highRiskEntities.value);
  console.log("所有实体：", commonEntities);

  flash();

  return commonEntities;
}

// 闪烁灾害点 - 光晕扩散效果
function flashDisasterPoints(points) {
  console.log("开始闪烁处理，点数:", points?.length);
  console.log("points数据:", points);

  // 停止之前的闪烁动画
  if (flashInterval.value) {
    clearInterval(flashInterval.value);
    flashInterval.value = null;
  }

  if (haloCollection.value) {
    haloCollection.value.removeAll();
    viewer.scene.primitives.remove(haloCollection.value);
    haloCollection.value = null;
  }

  // 安全检查
  if (!points || points.length === 0 || !viewer) {
    console.warn("无法闪烁：无点数据或viewer未初始化");
    return;
  }

  // 创建光晕点集合
  haloCollection.value = new Cesium.PointPrimitiveCollection();
  viewer.scene.primitives.add(haloCollection.value);

  const entitiesToFlash = [];
  let baseColor;
  // 从所有灾害实体中查找匹配的点
  basicLayers.disasterEntities.forEach(entity => {
    try {
      const position = entity.position.getValue(Cesium.JulianDate.now());

      // 检查该实体是否在需要闪烁的点列表中
      for (const point of points) {
        if (point.id === entity.id) {
          if (point.riskGrade.includes("高")){
            // 高风险 - 红色
            baseColor = Cesium.Color.RED;
          } else {
            // 默认颜色
            baseColor = Cesium.Color.YELLOW;
          }
          entitiesToFlash.push(entity);
          console.log("找到匹配实体:", entity.id);

          // console.log(baseColor,"ys")
          // 创建光晕点（简化版本，避免材质问题）
          const halo = haloCollection.value.add({
            position: position,
            pixelSize: 15,
            color: baseColor,
            outlineColor: baseColor,
            outlineWidth: 1,
            show: true,
            material: new Cesium.Material({
              fabric: {
                type: 'Halo',
                uniforms: {
                  color: baseColor,
                  glowPower: 0.5,
                  innerRadius: 0.5,
                  outerRadius: 1.0
                }
              }
            })
          });

          // 存储引用以便后续动画
          halo._entity = entity;
          break;
        }
      }
    } catch (error) {
      console.error("处理实体时出错:", error, entity);
    }
  });

  // 如果没有找到匹配的实体，直接返回
  if (entitiesToFlash.length === 0) {
    console.log("未找到匹配的实体进行闪烁");
    // 清理资源
    haloCollection.value.removeAll();
    viewer.scene.primitives.remove(haloCollection.value);
    haloCollection.value = null;
    return;
  }
  console.log(`开始闪烁 ${entitiesToFlash.length} 个实体`);
  // 动画控制变量
  let animationTime = 0;
  const animationDuration = 2000; // 动画周期，毫秒
  // 启动动画循环
  flashInterval.value = setInterval(() => {
    if (!haloCollection.value) return;
    animationTime = (animationTime + 50) % animationDuration;
    const normalizedTime = animationTime / animationDuration;
    // 更新所有光晕点的大小和透明度
    for (let i = 0; i < haloCollection.value.length; i++) {
      try {
        const halo = haloCollection.value.get(i);
        // 计算光晕大小（从原始大小到3倍）
        const baseSize = 15;
        const sizeFactor = 1.0 + Math.sin(normalizedTime * Math.PI * 2) * 2;
        halo.pixelSize = baseSize * sizeFactor;
        // 计算光晕透明度（大小最大时透明度最低）
        const alphaFactor = 1.0 - (sizeFactor - 1.0) / 2.0;
        halo.color = halo.color.withAlpha(alphaFactor);
      } catch (error) {
        console.error("更新光晕时出错:", error);
      }
    }
  }, 50);
}
// 停止闪烁的函数
const stopFlashing = () => {
  console.log("停止闪烁");

  if (flashInterval.value) {
    clearInterval(flashInterval.value);
    flashInterval.value = null;
  }

  if (haloCollection.value) {
    try {
      haloCollection.value.removeAll();
      if (viewer && viewer.scene) {
        viewer.scene.primitives.remove(haloCollection.value);
      }
    } catch (error) {
      console.error("清理光晕时出错:", error);
    }
    haloCollection.value = null;
  }
};

function setupEntityHandler(){
    window.viewer.screenSpaceEventHandler.setInputAction(async (click) => {
      // 假设你想在点击时获取经纬度
      const scene = window.viewer.scene;
      try {
        const cartesianPosition = scene.pickPosition(click.position);
        if (cartesianPosition) {
          // 将笛卡尔坐标转换为弧度表示的制图坐标
          const cartographic = Cesium.Cartographic.fromCartesian(cartesianPosition);
          // 将弧度转换为度数得到经纬度，以及获取高度
          const longitude = Cesium.Math.toDegrees(cartographic.longitude);
          const latitude = Cesium.Math.toDegrees(cartographic.latitude);
          const height = cartographic.height;
          console.log("经度:", longitude, "纬度:", latitude, "高度 (米):", height);
        } else {
          console.warn("无法获取点击位置的三维坐标。");
        }
      } catch (error) {
        console.error("在坐标转换过程中发生错误:", error);
      }
      // 检查点击位置是否拾取到实体
      let pickedEntity = window.viewer.scene.pick(click.position);
      window.selectedEntity = pickedEntity?.id;
      // 隐藏之前的弹出面板
      closePopup();

      if (Cesium.defined(pickedEntity) && Cesium.defined(pickedEntity.id)) {
        const entity = pickedEntity.id;
        // 检查是否有 disasterData 属性（灾害点实体）
        if (entity.disasterData !== undefined) {
          // 获取实体的灾害数据
          selectedEntityData.value = entity.disasterData || {};
          // 计算弹出框位置并显示面板
          await calculateAndShowPopup(entity, click.position);
        }
      } else {
        // 如果点击在空白处，隐藏信息框
        window.viewer.selectedEntity = undefined;
        closePopup();
      }
      }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
}

function closePopup() {
  popupVisible.value = false;
  selectedEntityData.value = null;
}

async function calculateAndShowPopup(entity) {
  try {
    const scene = viewer.scene;
    const clock = viewer.clock;
    const currentTime = clock.currentTime;
    const position = entity.position.getValue(currentTime);

    if (!position ||
        isNaN(position.x) || isNaN(position.y) || isNaN(position.z) ||
        !isFinite(position.x) || !isFinite(position.y) || !isFinite(position.z)) {
      console.log('位置无效或未定义');
      return;
    }

    const windowPosition = scene.cartesianToCanvasCoordinates(position);
    if (windowPosition) {
      // 更新响应式变量
      popupPosition.value = {
        x: windowPosition.x + 20,
        y: windowPosition.y - 10
      };

      checkPopupBoundary();

      popupVisible.value = true;

      await viewer.flyTo(entity, {
        duration: 0.5,
        offset: new Cesium.HeadingPitchRange(0, Cesium.Math.toRadians(-90), 5000)
      });
    }
  } catch (error) {
    console.error("计算弹出面板位置出错:", error);
  }
}

// 检测弹出面板边界
function checkPopupBoundary() {
  const panelWidth = 280;
  const panelHeight = 200;

  if (!window.viewer || !window.viewer.canvas) return;

  const canvas = window.viewer.canvas;
  const rect = canvas.getBoundingClientRect();

  // 防止面板超出右边界
  if (popupPosition.value.x + panelWidth > rect.right) {
    popupPosition.value.x = rect.right - panelWidth - 10;
  }
  // 防止面板超出下边界
  if (popupPosition.value.y + panelHeight > rect.bottom) {
    popupPosition.value.y = rect.bottom - panelHeight - 10;
  }
  // 防止面板超出左边界
  if (popupPosition.value.x < 10) {
    popupPosition.value.x = 10;
  }
  // 防止面板超出上边界
  if (popupPosition.value.y < 10) {
    popupPosition.value.y = 10;
  }
}

function calculatePopupLeft() {
  checkPopupBoundary(); // 确保在返回前检查边界
  return popupPosition.value.x;
}

function calculatePopupTop() {
  checkPopupBoundary(); // 确保在返回前检查边界
  return popupPosition.value.y;
}

function stopFlashEntities(disasterType) {
  highRiskEntities.value = highRiskEntities.value.filter(entity =>
      entity.disasterType !== disasterType
  );
  console.log(`已移除 ${disasterType} 类型实体，剩余:`, highRiskEntities.value.length);
}

function flash(){
  if(!(showRainLand.value || showRainFlood.value || showRainWater.value || showRainDebrisFlow.value || showEarthLand.value || showEarthDebrisFlow.value)) {
    stopFlashing();
  }else{
    stopFlashing();
    setTimeout(() => {
      flashDisasterPoints(highRiskEntities.value);
    }, 100);
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

.btns-box {
  position: absolute;
  top: 20px;
  left: 580px;
  z-index: 1000;
}

.legend {
  bottom: 10px;
}

.controls {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 100;
  display: flex;
  gap: 6px;
}

.rain-btn{
  background: url("@/assets/images/按钮.png") center/cover no-repeat;
  color: white;
  padding: 6px 12px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
  white-space: nowrap;
  min-width: 100px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.rain-btn:hover {
  background-color: #373e52;
  transform: translateY(-2px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.layerControl-panel {
  position: absolute;
  top: 50px;
  right: 20px;
  background-color: rgba(14, 52, 98, 0.8);
  border: 1px solid rgba(0, 225, 255, 1);
  border-radius: 2px;
  color: white;
  padding: 10px;
  z-index: 1000;
  width: 160px;
}

.panel-content {
  display: flex;
  flex-direction: column;
  font-size: 16px;
  gap: 6px;
}

/* 修改后的暴雨信息卡片样式 */
.rain-table-container {
  position: absolute;
  bottom: 20px;
  left: 20px;
  width: 500px;
  background: rgba(14, 52, 98, 0.8);
  border: 1px solid rgba(0, 225, 255, 0.5);
  border-radius: 2px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  padding: 15px;
  z-index: 999;
  max-height: 400px;
  display: flex;
  flex-direction: column;
  color: white;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.table-title {
  font-size: 16px;
  font-weight: bold;
  color: white;
  display: flex;
  align-items: center;
}

.table-title i {
  margin-right: 8px;
  color: #3c86ff;
}

.rain-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
  flex-grow: 1;
  overflow: hidden;
}

.rain-table th {
  background: linear-gradient(180deg, rgba(86, 204, 242, 1) 0%, rgba(47, 128, 237, 1) 100%);
  padding: 10px 8px;
  text-align: left;
  font-weight: 600;
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  position: sticky;
  top: 0;
}

.rain-table td {
  background-color: rgba(14, 52, 98, 0.8);
  padding: 8px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  text-align: left;
}

.rain-table tbody {
  display: block;
  max-height: 200px;
  overflow-y: auto;
}

.rain-table thead, .rain-table tbody tr {
  display: table;
  width: 100%;
  table-layout: fixed;
}

.rain-table tbody tr {
  transition: background-color 0.3s;
  cursor: pointer;
}

.rain-table tbody tr:hover {
  background-color: rgba(86, 204, 242, 0.3);
}

.rain-table tbody tr.selected {
  background-color: rgba(60, 134, 255, 0.3);
}

.rain-table tbody tr.selected td {
  color: white;
  font-weight: 500;
}

.rain-table tbody tr:nth-child(even) {
  background-color: rgba(255, 255, 255, 0.1);
}

.rain-table tbody tr:nth-child(even):hover {
  background-color: rgba(86, 204, 242, 0.3);
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 15px;
  padding-top: 10px;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
  gap: 10px;
}

.pagination button {
  background-color: #3c86ff;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  color: white;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.3s;
  min-width: 60px;
}

.pagination button:hover:not(:disabled) {
  background-color: #373e52;
}

.pagination button:disabled {
  background-color: #373e52;
  cursor: not-allowed;
  opacity: 0.6;
}

.pagination span {
  font-size: 12px;
  color: white;
  font-weight: bold;
}

.search-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.search-input {
  padding: 6px 10px;
  border: 1px solid rgba(0, 225, 255, 1);
  border-radius: 4px;
  font-size: 12px;
  width: 150px;
  transition: border-color 0.3s;
  background: rgba(15, 61, 118, 0.6);
  color: white;
}

.search-input::placeholder {
  color: rgba(255, 255, 255, 0.7);
}

.search-input:focus {
  border-color: #3c86ff;
  outline: none;
}

.search-btn, .refresh-btn {
  background-color: #3c86ff;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  transition: all 0.3s;
  min-width: 60px;
  height: 30px;
}

.search-btn:hover, .refresh-btn:hover {
  background-color: #373e52;
  transform: translateY(-1px);
}

.search-btn i, .refresh-btn i {
  margin-right: 4px;
}

/* 滚动条样式 */
.rain-table tbody::-webkit-scrollbar {
  width: 6px;
}

.rain-table tbody::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
}

.rain-table tbody::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 3px;
}

.rain-table tbody::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.5);
}

.refresh-btn {
  background: #3c86ff;
  border: none;
  border-radius: 4px;
  color: white;
  padding: 5px 10px;
  font-size: 12px;
  transition: background 0.3s;
  align-items: center;
}

.refresh-btn:hover {
  background: #373e52;
}

.refresh-btn i {
  margin-right: 4px;
}

.disaster-popup {
  position: absolute;
  z-index: 1000;
  width: 330px;
  background-color: white;
  border-radius: 2px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(0, 225, 255, 1);
  font-family: 'Source Han Sans CN', sans-serif;
  overflow: hidden;
  transition: opacity 0.2s, transform 0.2s;
  transform-origin: top left;
  opacity: 0;
  transform: scale(0.95);
  pointer-events: none;
  font-size: 13px;
}

.disaster-popup[style*="display: block"] {
  opacity: 1;
  transform: scale(1);
  pointer-events: auto;
  transition: all 0.3s ease;
}

.popup-header {
  padding: 8px 12px;
  background: rgba(14, 52, 98, 0.95);
  border-bottom: 1px solid #e9ecef;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.popup-header h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: white;
}

.popup-header button {
  background: none;
  font-size: 14px;
  cursor: pointer;
  color: white;
  transition: color 0.2s;
  border: 1px solid rgba(0, 225, 255, 1);
}

.popup-header button:hover {
  color: #333;
}

.popup-content {
  background: rgba(0, 94, 153, 1);
  color:white;
}

.disaster-table {
  width: 100%;
  border-collapse: collapse;
}

.disaster-table th,
.disaster-table td {
  padding: 6px 8px;
  text-align: left;
  border-bottom: 1px solid #000;
}

.disaster-table th {
  font-weight: 500;
  width: 35%;
}

.disaster-table td {
  word-break: break-all;
}

.disaster-table tr:last-child th,
.disaster-table tr:last-child td {
  border-bottom: none;
}
</style>
