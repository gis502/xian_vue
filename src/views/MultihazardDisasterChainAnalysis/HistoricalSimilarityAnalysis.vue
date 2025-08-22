<template>
  <div id="cesium-container">
    <div class="history-list">
      <div class="history-title">历史灾害信息列表</div>
      <div class="disaster-list">
        <table v-if="tableData.length" class="disaster-table">
          <thead>
          <tr>
            <th style="width: 50px">序号</th>
            <th>灾害名称</th>
            <th>发生时间</th>
          </tr>
          </thead>
          <tbody>
          <tr v-for="(item, index) in tableData" :key="item.eqid">
            <td>{{ (currentPage - 1) * pageSizeNum + index + 1 }}</td>
            <td>
             <span class="clickable"
                   :title="item.disasterName">{{ item.disasterName }}</span>
            </td>
            <td :title="formatDate(item.occurTime)">
              {{ formatDate(item.occurTime) }}
            </td>
          </tr>
          </tbody>
        </table>
        <div v-else class="no-data">暂无灾害信息</div>
      </div>
      <!-- 分页控件 -->
      <el-pagination
          style="margin-top: 10px; text-align: center;"
          background
          layout="prev, pager, next"
          :total="disTotal"
          :page-size="pageSizeNum"
          :current-page="currentPage"
          @current-change="handlePageChangeDisaster"
      />
    </div>
  </div>
</template>

<script setup>
import * as Cesium from "cesium";
import { initCesium } from "@/cesium/initLayer.js";
import {onMounted,ref} from "vue";
import {getEarthquakeRainPage, getNewsPage} from "@/api/system/knowledgeGraph.js";

// 多灾害列表数据***************
const tableData = ref([])
//默认最新灾害数据
let lastItem = null

//新闻模块************
const currentPage = ref(1)
const pageSizeNum=ref(5)
const disTotal = ref(0)

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
  await fetchData()
});

const fetchData = async () => {
  try {
    const res = await getEarthquakeRainPage(currentPage.value, pageSizeNum.value)
    tableData.value = res.data.records

    lastItem= tableData.value[0]
    disTotal.value = res.data.total
    console.log('最新数据:', tableData.value)
    console.log('最新数据总数:',  disTotal.value)
  } catch (error) {
    console.error('请求数据失败', error)
    tableData.value = []
    disTotal.value = 0
    lastItem.value = null
  }
}

const formatDate = (dateStr) => {
  const date = new Date(dateStr)
  return date.toLocaleString()
}

const handlePageChangeDisaster = (page) => {
  currentPage.value = page
  fetchData()
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

.history-list{
  position: absolute;
  top: 20px;
  width: 600px;
  background: #ffffff;
  border-radius: 10px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
  padding: 20px;
  font-family: "Microsoft YaHei", sans-serif;
  z-index: 1000;
}

.history-title{
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 12px;
  color: #333;
}

.disaster-list{
  max-height: 350px;
  overflow-y: auto;
  overflow-x: auto; /* 横向滚动条 */
}

.disaster-table {
  min-width: 600px; /* 超过容器就会横向滚动 */
  border-collapse: collapse;
  font-size: 14px;
  width: 100%;
  table-layout: fixed;
}

.disaster-table th,
.disaster-table td {
  padding: 10px;
  text-align: center;
  border-bottom: 1px solid #eaeaea;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 180px;
  position: relative;
}

/* 鼠标悬停显示完整内容 */
.disaster-table td:hover::after {
  content: attr(title);
  position: absolute;
  white-space: normal;
  background-color: #fff;
  border: 1px solid #ccc;
  padding: 5px 8px;
  z-index: 10;
  left: 50%;
  top: 100%;
  transform: translateX(-50%);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  max-width: 300px;
}

.disaster-table th {
  background-color: #f5f7fa;
  font-weight: 600;
}

</style>