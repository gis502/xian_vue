<template>

  <div
      id="cesium-container"
      v-loading="loading"
      element-loading-background="rgba(122, 122, 122, 0.8)">
    <!--历史灾害信息列表-->
    <HistoricalDisasterList
        :chartDatas="chartDatas"
        :disasterList="disasterList"
        @update:levelPoints="handleLevelPoints"
        @update:selectDisaster="handSelectDisaster"
        @displayAnalysis="displayAnalysis"
        @hideAnalysis="hideAnalysis"
        @createPulseCircle="createPulseCircle"
        @loadingTrue="loadingTrue"
        @loadingFalse="loadingFalse"
    ></HistoricalDisasterList>
    <!-- 图例 -->
    <Legend></Legend>
    <!-- chart -->
    <Chart v-if="showAnalysis" :chartDatas="chartDatas"></Chart>
    <div
        v-if="selectedEntityData"
        class="disaster-popup"
        :style="{
        left: `${calculatePopupLeft()}px`,
        top: `${calculatePopupTop()}px`,
        display: popupVisible ? 'block' : 'none',
        opacity: popupVisible ? '1' : '0',
        transform: popupVisible ? 'scale(1)' : 'scale(0.5)'}"
        @click.stop="stopPropagation">
      <div class="popup-header">
        <h3 v-if="showRainPoints">{{
            selectedEntityData.disasterType || '隐患点'
          }} </h3>
        <h3 v-if="earthquakeHospital">{{
            selectedEntityData.properties.hospitalName || '医院'
          }} </h3>
        <h3 v-if="earthquakeRisk">{{
            selectedEntityData.properties.dangerName || '风险源'
          }} </h3>
        <h3 v-if="earthquake_hidde">{{
            selectedEntityData.properties.disaster_name || '隐患点'
          }} </h3>
        <button @click="closePopup"> 关闭</button>
      </div>
      <div class="popup-content">
        <table class="disaster-table">
          <tbody>
          <!--暴雨部分-->
          <tr v-if="showRainPoints">
            <th>灾害名称</th>
            <td>{{selectedEntityData.disaster_name || '未知'}}</td>
          </tr>
          <tr v-if="showRainPoints">
            <th>灾害类型</th>
            <td>{{selectedEntityData.disasterType || '未知'}}</td>
          </tr>
          <tr v-if="showRainPoints">
            <th>灾害位置</th>
            <td>{{selectedEntityData.position || '未知'}}</td>
          </tr>
          <tr v-if="showRainPoints">
            <th>灾害发生等级</th>
            <td>{{selectedEntityData.level || '未知'}}</td>
          </tr>
          <tr v-if="showRainPoints">
            <th>灾害概率</th>
            <td>{{selectedEntityData.probability || '未知'}}</td>
          </tr>
          <tr v-if="showRainPoints">
            <th>经度</th>
            <td>{{selectedEntityData.lon || '未知'}}</td>
          </tr>
          <tr v-if="showRainPoints">
            <th>纬度</th>
            <td>{{selectedEntityData.lat || '未知'}}</td>
          </tr>
          <tr v-if="showRainPoints">
            <th>危险等级</th>
            <td>{{selectedEntityData.risk_grade || '未知'}}</td>
          </tr>
          <tr v-if="showRainPoints">
            <th>规模</th>
            <td>{{selectedEntityData.scale_grade || '未知'}}</td>
          </tr>
          <!--暴雨部分结束-->
          <!--医院部分-->
          <tr v-if="earthquakeHospital">
            <th>医院名称</th>
            <td>{{ selectedEntityData.properties.hospitalName || '未知' }}</td>
          </tr>
          <tr v-if="earthquakeHospital">
            <th>医院位置</th>
            <td>{{ selectedEntityData.properties.position || '未知' }}</td>
          </tr>
          <tr v-if="earthquakeHospital">
            <th>医院等级</th>
            <td>{{ selectedEntityData.properties.level || '未知' }}</td>
          </tr>
          <tr v-if="earthquakeHospital">
            <th>经营类型</th>
            <td>{{ selectedEntityData.properties.institutionNature || '未知' }}</td>
          </tr>
          <tr v-if="earthquakeHospital">
            <th>医院床位</th>
            <td>{{ selectedEntityData.properties.beds }}张</td>
          </tr>
          <tr v-if="earthquakeHospital">
            <th>容纳人数</th>
            <td>{{ selectedEntityData.properties.sumPeople || '未知' }}人</td>
          </tr>
          <tr v-if="earthquakeHospital">
            <th>负责人</th>
            <td>{{ selectedEntityData.properties.unitHead || '未知' }}</td>
          </tr>
          <tr v-if="earthquakeHospital">
            <th>联系电话</th>
            <td>{{ selectedEntityData.properties.phone || '未知' }}</td>
          </tr>
          <tr v-if="earthquakeHospital">
            <th>经度</th>
            <td>{{ selectedEntityData.properties.lon || '未知' }}</td>
          </tr>
          <tr v-if="earthquakeHospital">
            <th>纬度</th>
            <td>{{ selectedEntityData.properties.lat || '未知' }}</td>
          </tr>
          <!--医院部分结束-->
          <!--危险源部分部分-->
          <tr v-if="earthquakeRisk">
            <th>危险源名称</th>
            <td>{{ selectedEntityData.properties.dangerName || '未知' }}</td>
          </tr>
          <tr v-if="earthquakeRisk">
            <th>危险源位置</th>
            <td>{{ selectedEntityData.properties.position || '未知' }}</td>
          </tr>
          <tr v-if="earthquakeRisk">
            <th>危险源类型</th>
            <td>{{ selectedEntityData.properties.enterpriseType || '未知' }}</td>
          </tr>
          <tr v-if="earthquakeRisk">
            <th>危险等级</th>
            <td>{{ selectedEntityData.properties.level || '未知' }}</td>
          </tr>
          <tr v-if="earthquakeRisk">
            <th>负责人</th>
            <td>{{ selectedEntityData.properties.unitHead || '未知' }}</td>
          </tr>
          <tr v-if="earthquakeRisk">
            <th>联系电话</th>
            <td>{{ selectedEntityData.properties.phone || '未知' }}</td>
          </tr>
          <tr v-if="earthquakeRisk">
            <th>经度</th>
            <td>{{ selectedEntityData.properties.longitude || '未知' }}</td>
          </tr>
          <tr v-if="earthquakeRisk">
            <th>纬度</th>
            <td>{{ selectedEntityData.properties.latitude || '未知' }}</td>
          </tr>
          <!--危险源部分结束-->
          <!--滑坡泥石流部分-->
          <tr v-if="earthquake_hidde">
            <th>隐患点名字</th>
            <td>{{ selectedEntityData.properties.disaster_name || '未知' }}</td>
          </tr>
          <tr v-if="earthquake_hidde">
            <th>隐患点位置</th>
            <td>{{ selectedEntityData.properties.position || '未知' }}</td>
          </tr>
          <tr v-if="earthquake_hidde">
            <th>隐患点类型</th>
            <td>{{ selectedEntityData.properties.disaster_type || '未知' }}</td>
          </tr>
          <tr v-if="earthquake_hidde">
            <th>经度</th>
            <td>{{ selectedEntityData.properties.lon || '未知' }}</td>
          </tr>
          <tr v-if="earthquake_hidde">
            <th>纬度</th>
            <td>{{ selectedEntityData.properties.lat || '未知' }}</td>
          </tr>
          <tr v-if="earthquake_hidde">
            <th>危险等级</th>
            <td>{{ selectedEntityData.properties.risk_grade || '未知' }}</td>
          </tr>
          <tr v-if="earthquake_hidde">
            <th>规模等级</th>
            <td>{{ selectedEntityData.properties.scale_grade || '未知' }}</td>
          </tr>
          <!--滑坡泥石流部分结束-->
          </tbody>
        </table>
      </div>

    </div>
  </div>

</template>

<script setup>
import * as Cesium from "cesium";
import { initCesium } from "@/cesium/initLayer.js";
import {onMounted, reactive, ref} from "vue";
import basicLayers from "@/cesium/basicLayers.js";
import HistoricalDisasterList from "@/components/HistoricalDisaster/HistoricalDisasterList.vue";
import Legend from "../../components/Earthquake/Legend.vue";
import Chart from "../../components/Earthquake/Chart.vue";
import HistoricalDisasterMatch from "@/components/HistoricalDisaster/HistoricalDisasterMatch.vue";
import Table from "@/components/Earthquake/Table.vue";


const showAnalysis = ref(false);
const disasterList = ref([]);
const rainLevelPoint = ref([]);
const loading = ref(false);
const selectDisaster = ref([]);
const maxRadius = 30;
const duration = 5;

//弹窗逻辑
let popupPosition = reactive({x: 0, y: 0});
let popupVisible = ref(false);
let selectedEntityData = ref([]);
let clickHandler = ref();
let showRainPoints = ref(false);
let earthquakeHospital = ref(false);
let earthquakeRisk = ref(false);
let earthquake_hidde = ref(false);


const _circle = createCircleImage(maxRadius);
const handleLevelPoints = (data) => {
  rainLevelPoint.value = data;
  // console.log('父组件接收的数据12121212121：', rainLevelPoint.value);
}
const handSelectDisaster = (data) => {
  selectDisaster.value = data;
  // console.log('父组件接收的数据43434343434：', selectDisaster.value);
}
onMounted(async () => {
  window.viewer = initCesium("cesium-container");
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
  //加载西安行政区划
  basicLayers.loadAdminData();
  entitiesClick();
});

// chart数据
const chartDatas = reactive({
  title: "历史地震影响分析",
  xAxis: {
    data: ["风险源", "医院", "滑坡", "泥石流"],
  },
  seriesDatas: [0, 0, 0, 0],
});

// 显示chart
function displayAnalysis() {
  showAnalysis.value = true;
}

// 隐藏chart
function hideAnalysis() {
  showAnalysis.value = false;
}

// 加载特效
function loadingTrue() {
  loading.value = true;
}

function loadingFalse() {
  loading.value = false;
}

//创建脉冲实体
function createPulseCircle() {
  const startTime = Cesium.JulianDate.now();
  rainLevelPoint.value.forEach(poin => {
    window.viewer.entities.add({
      position: Cesium.Cartesian3.fromDegrees(poin.lon, poin.lat),
      billboard: {
        image: _circle,
        width: new Cesium.CallbackProperty((time) => {
          const elapsed =
              Cesium.JulianDate.secondsDifference(time, startTime) % duration;
          const progress = elapsed / duration;
          return maxRadius * 2 * Math.abs(Math.sin(progress * Math.PI));
        }, false),
        height: new Cesium.CallbackProperty((time) => {
          const elapsed =
              Cesium.JulianDate.secondsDifference(time, startTime) % duration;
          const progress = elapsed / duration;
          return maxRadius * 2 * Math.abs(Math.sin(progress * Math.PI));
        }, false),
        color: new Cesium.CallbackProperty((time) => {
          const elapsed = Cesium.JulianDate.secondsDifference(time, startTime) % duration;
          const progress = elapsed / duration;
          // 透明度逻辑：与大小反向变化（大小最大时透明，最小时不透明）
          // Math.abs(Math.sin(progress * Math.PI)) → 0~1（大小系数）
          // 1 - 系数 → 透明度1~0（大小最大时透明度0.2，最小时0.8，避免完全透明消失）
          const alpha = 0.8 - 0.6 * Math.abs(Math.sin(progress * Math.PI));
          return new Cesium.Color(1, 0, 0, alpha); // 红色（RGB：1,0,0）+ 动态透明度
        }, false),
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
        verticalOrigin: Cesium.VerticalOrigin.CENTER,
        horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
        zIndex: 5
      },
    });
  })
}

//创建脉冲图片
function createCircleImage(maxRadius) {
  // 创建一个虚拟的canvas
  const canvas = document.createElement('canvas');
  canvas.width = maxRadius * 2;
  canvas.height = maxRadius * 2;
  const context = canvas.getContext('2d');

  // 清空canvas，确保背景透明
  context.clearRect(0, 0, maxRadius, maxRadius);

  // 开始绘制圆
  context.beginPath();
  // 绘制圆，arc参数说明：x,y,半径,起始角度,结束角度,顺时针/逆时针
  // 绘制圆从canvas中心开始绘制，所以x,y坐标都为maxRadius
  // 半径为maxRadius
  context.arc(maxRadius, maxRadius, maxRadius, 0, Math.PI * 2, false);

  // 闭合路径
  context.closePath();

  // 填充颜色，透明
  context.fillStyle = 'rgba(255,255,255,0.7)';
  context.fill();
  return canvas.toDataURL('image/png');
}

//页面点击弹窗

function entitiesClick() {
  // 清除之前的点击事件处理程序
  if (clickHandler.value) {
    clickHandler.value.destroy();
  }
  // 为左键点击添加事件处理程序
  clickHandler.value = new Cesium.ScreenSpaceEventHandler(window.viewer.canvas);
  clickHandler.value.setInputAction((movement) => {
    // 检查点击是否在实体上
    const pickedObject = window.viewer.scene.pick(movement.position);
    // 判断是否有disasterName属性
    if (pickedObject.id.disasterData === undefined) {
      return;
    }
    // 隐藏之前的弹出面板
    closePopup();

    if (Cesium.defined(pickedObject) && Cesium.defined(pickedObject.id)) {
      const entity = pickedObject.id;
      // 获取实体的灾害数据
      selectedEntityData.value = entity.disasterData || {};
      console.log(8745132465798799,selectedEntityData.value);
      if (selectDisaster.value.disasterType === "暴雨"){
        showRainPoints.value = true;
      }
      if (selectDisaster.value.disasterType === "地震"){
        if(selectedEntityData.value.properties.hospitalName){
          earthquakeHospital.value = true;
        }else if (selectedEntityData.value.properties.dangerName){
          earthquakeRisk.value = true;
        }else if (selectedEntityData.value.properties.disaster_name){
          earthquake_hidde.value = true;
        }else {
          return;
        }
      }
      // 计算弹出框位置并显示面板
      calculateAndShowPopup(entity, movement.position);
    } else {
      // 如果点击在空白处，隐藏信息框
      this.viewer.selectedEntity = undefined;
    }
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

}

// 计算并显示弹出面板
async function calculateAndShowPopup(entity, movementPosition){
  try {
    const scene = window.viewer.scene;
    const clock = window.viewer.clock;
    // 获取当前时间
    const currentTime = clock.currentTime;
    // 使用当前时间获取位置值
    const position = entity.position?.getValue(currentTime);
    // 正确检查位置有效性
    if (!position ||
        isNaN(position.x) || isNaN(position.y) || isNaN(position.z) ||
        !isFinite(position.x) || !isFinite(position.y) || !isFinite(position.z)) {
      console.log('位置无效或未定义');
      return;
    }
    // 转换为窗口坐标
    const windowPosition = scene.cartesianToCanvasCoordinates(position);
    if (windowPosition) {
      // 平滑定位到点击的实体
      // await window.viewer.flyTo(entity, {
      //   duration: 2,
      //   offset: new Cesium.HeadingPitchRange(0, Cesium.Math.toRadians(-90), 5000)
      // });
      // 计算最终位置（添加偏移量）
      popupPosition = {
        x: windowPosition.x + 20,
        y: windowPosition.y - 10
      };
      // 检测边界防止面板超出视口
      checkPopupBoundary();
      // 显示弹出面板
      popupVisible.value = true;
    }
  } catch (error) {
    console.error("计算弹出面板位置出错:", error);
  }
}
// 检测弹出面板边界
function checkPopupBoundary() {
  const panelWidth = 280;
  const panelHeight = 200;
  const canvas = window.viewer.canvas;
  const rect = canvas.getBoundingClientRect();
  // 防止面板超出右边界
  if (popupPosition.x + panelWidth > rect.right) {
    popupPosition.x = rect.right - panelWidth - 10;
  }
  // 防止面板超出下边界
  if (popupPosition.y + panelHeight > rect.bottom) {
    popupPosition.y = rect.bottom - panelHeight - 10;
  }
  // 防止面板超出左边界
  if (popupPosition.x < 10) {
    popupPosition.x = 10;
  }
  // 防止面板超出上边界
  if (popupPosition.y < 10) {
    popupPosition.y = 10;
  }
}

function calculatePopupLeft() {
  return popupPosition.x;
}
function calculatePopupTop() {
  return popupPosition.y;
}
// 阻止事件冒泡
function stopPropagation(e) {
  e.stopPropagation();
}
// 关闭弹出面板
function closePopup() {
  popupVisible.value = false;
  showRainPoints.value = false;
  earthquakeHospital.value = false;
  earthquakeRisk.value = false;
  earthquake_hidde.value = false;
  selectedEntityData.value = [];
}

</script>

<style scoped lang="scss">

#cesium-container {
  width: 100%;
  height: calc(100vh - 50px);
  padding: 0;
  margin: 0;
  position: relative;
}

.disaster-popup {
  position: absolute;
  z-index: 1000;
  width: 330px; /* 减小宽度 */
  border-radius: 2px; /* 减小圆角 */
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1); /* 减小阴影 */
  font-family: 'Source Han Sans CN', sans-serif;
  overflow: hidden;
  transition: opacity 0.2s, transform 0.2s;
  transform-origin: top left;
  opacity: 0;
  transform: scale(0.95);
  pointer-events: none;
  border: 1px solid rgba(0, 225, 255, 1);
  font-size: 13px; /* 减小整体字体大小 */
}

.disaster-popup[style*="display: block"] {
  opacity: 1;
  transform: scale(1);
  pointer-events: auto;
  transition: all 0.3s ease;
}

.popup-header {
  padding: 8px 12px; /* 减小内边距 */
  background: rgba(14, 52, 98, 0.95);
  border-bottom: 1px solid #e9ecef;
  display: flex;
  justify-content: space-between;
  align-items: center;
}


.popup-header h3 {
  margin: 0;
  font-size: 14px; /* 减小标题字体大小 */
  font-weight: 600;
  color: white;
}

button {
  background-color: #3c86ff;
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s ease;
  height: 34px;
  /* 统一高度 */
  box-sizing: border-box;
  /* 确保padding和border包含在height内 */
  white-space: nowrap;
  /* 防止按钮文字换行 */
}

.popup-header button:hover {
  color: #333;
}

.popup-content {
  padding: 10px 12px; /* 减小内边距 */
  background: rgba(0, 94, 153, 1);
  border-radius: 4px;
  z-index: 1000;
  max-height: 450px;
  overflow: auto;
  color: white;
}


.disaster-table {
  width: 100%;
  border-collapse: collapse;
}

.disaster-table th,
.disaster-table td {
  padding: 6px 8px; /* 减小单元格内边距 */
  text-align: left;
  border-bottom: 1px solid #000;
}

.disaster-table th {
  font-weight: 500;
  width: 35%; /* 固定标题列宽度 */
}

.disaster-table td {
  word-break: break-all;
}

.disaster-table tr:last-child th,
.disaster-table tr:last-child td {
  border-bottom: none; /* 最后一行不显示底边 */
}

.popup-footer button {
  padding: 4px 10px; /* 减小按钮尺寸 */
  background-color: #409eff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
  font-size: 12px; /* 减小按钮字体大小 */
}

.popup-footer button:hover {
  background-color: #308ee0;
}

::v-deep .history-nar[data-v-60552b0e] {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 2px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  margin-bottom: 20px;
}
</style>