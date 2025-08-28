<template>
  <div class="history-list">
    <div class="history-nar">
      <div class="history-title">历史灾害信息列表</div>
      <el-dropdown
          v-model:visible="showTimeDropdown"
          placement="bottom-start"
          trigger="click"
          class="time-dropdown-wrapper"
      >
        <!-- 下拉触发按钮（圆角矩形样式） -->
        <el-button
            type="default"
            size="medium"
            class="time-dropdown-btn"
        >
          {{ selectedTimeRange }}
          <el-icon class="el-icon--right">
            <ArrowDown :size="16" />
          </el-icon>
        </el-button>

        <!-- 时间范围下拉选项 -->
        <template #dropdown>
          <el-dropdown-menu class="time-dropdown-menu">
            <el-dropdown-item
                v-for="(item, index) in timeRangeOptions"
                :key="index"
                @click="selectTimeRange(item)"
            >
              {{ item.label }}
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
      <!--下拉组件-->
      <el-dropdown
          ref="dropdownRef"
          v-model:visible="showDropdown"
          placement="bottom-start"
          trigger="click"
      >
        <el-input
            v-model="searchQuery"
            placeholder="搜索历史灾害信息..."
            class="search-input"
            :suffix-icon="showDropdown ? ArrowUp : ArrowDown"
            @input="handleSearch"
            clearable
        />
        <template #dropdown>
          <!-- 下拉面板 -->
          <el-dropdown-menu class="custom-dropdown-menu">
            <!-- 搜索结果区域 -->
            <div v-if="filteredItems.length" class="search-results">
              <el-dropdown-item
                  v-for="item in filteredItems"
                  :key="item.id"
                  @click="selectItem(item)"
                  class="dropdown-item"
              >
                {{ item.name }}
              </el-dropdown-item>
            </div>

            <!-- 无结果提示 -->
            <div v-else-if="searchQuery" class="no-results">
              没有找到匹配的结果
            </div>

            <!-- 默认选项（无搜索时显示） -->
            <div v-else class="default-options">
              <el-dropdown-item
                  v-for="item in defaultItems"
                  :key="item.id"
                  @click="selectItem(item)"
                  class="dropdown-item"
              >
                {{ item.name }}
              </el-dropdown-item>
            </div>

          </el-dropdown-menu>
        </template>
      </el-dropdown>
      <!--下拉组件结束-->
    </div>
    <div class="disaster-list">
      <table v-if="tableData.length" class="disaster-table">
        <thead>
        <tr>
          <th style="width: 50px">序号</th>
          <th>灾害名称</th>
          <th>灾害类型</th>
          <th>发生时间</th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="(item, index) in currentPointPageData" :key="item.disasterId" @click="tiggerHistoryDaster(item)">
          <td>{{ (currentPage - 1) * pageSizeNum + index + 1 }}</td>
          <td>
            <span class="clickable" :title="item.disasterName">{{ item.disasterName }}</span>
          </td>
          <td>
            <span class="clickable" :title="item.disasterType">{{ item.disasterType }}</span>
          </td>
          <td :title="formatDate(item.occurrenceTime)">
            {{ formatDate(item.occurrenceTime) }}
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
        layout="prev, pager, next, total"
        :total="disTotal"
        :page-size="pageSizeNum"
        :current-page="currentPage"
        @current-change="handlePageChangeDisaster"
    />
  </div>
</template>

<script setup name="historicalDisasterList">

import {ArrowDown, ArrowUp} from "@element-plus/icons-vue";
import { defineProps, defineEmits, onMounted, reactive, ref} from "vue";
import {getAllDisasterRain, getAllEarthquakeList} from "@/api/system/disasterEvents.js";
import layers from "@/cesium/layers.js";
import basicLayers from "@/cesium/basicLayers.js";
import {getAllAffectPoints} from "@/api/earthquake/datas.js";
import dangerSourceIcon from "@/assets/images/gasstation.png"
import hospitalIcon from "@/assets/images/hospital.png"

const tableData = ref([])
const disTotal = ref(0)
const originalTableData = ref([]);
const searchQuery = ref('');
const showDropdown = ref(false);
const dropdownRef = ref(null);
const selectedTimeRange = ref('全部时间');
const showTimeDropdown = ref(false);
const currentPage = ref(1);
const pageSizeNum = ref(5);
const circle_param = reactive({});
const ellipseParams = ref([]);
const rotation = ref(0);
const AllAffectPoints = ref([]);

//接收父组件传来的数据
const { chartDatas, disasterList } = defineProps([
  "chartDatas",
  "disasterList"
]);
//接收父组件传来的方法
const emit = defineEmits([
  "displayChart",
  "hideChart",
]);


const timeRangeOptions = ref([
  { label: '最近一个星期', value: 'week' },
  { label: '最近一个月', value: 'month' },
  { label: '最近三个月', value: 'quarter' },
  { label: '最近半年', value: 'halfYear' },
  { label: '最近一年', value: 'year' },
  { label: '全部时间', value: 'all' }
]);

const defaultItems = ref([
  { id: 1, name: '地震灾害' },
  { id: 2, name: '洪水灾害' },
  { id: 3, name: '台风灾害' },
  { id: 4, name: '滑坡灾害' },
  { id: 5, name: '泥石流灾害' }
]);

// 选择时间范围的回调
const selectTimeRange = (item) => {
  selectedTimeRange.value = item.label;
  showTimeDropdown.value = false;
  console.log('当前选中的时间范围：', item.value);
  // 执行时间范围过滤
  filterDataByTimeRange(item.value);
};

const filteredItems = computed(() => {
  if (!searchQuery.value) return [];

  return defaultItems.value.filter(item =>
      item.name.toLowerCase().includes(searchQuery.value.toLowerCase())
  );
});

// 处理搜索输入
const handleSearch = (value) => {
  // 当有搜索内容时自动显示下拉面板
  if (value) {
    showDropdown.value = true;
  }
};

// 选择下拉项
const selectItem = (item) => {
  searchQuery.value = item.name;
  showDropdown.value = false;
  // 这里可以添加选择后的其他逻辑，如触发搜索等
};

// 点击外部关闭下拉面板
document.addEventListener('click', (e) => {
  const dropdown = document.querySelector('.search-dropdown');
  if (dropdown && !dropdown.contains(e.target)) {
    showDropdown.value = false;
  }
});

// 实现分页逻辑的计算属性
const currentPointPageData = computed(() => {
  // 计算起始索引
  const start = (currentPage.value - 1) * pageSizeNum.value;
  // 计算结束索引
  const end = start + pageSizeNum.value;

  return tableData.value.slice(start, end);
});

const fetchData = async () => {
  try {

    //获取历史地震和历史暴雨灾害信息
    const[earthquakeRes, rainRes] = await Promise.all([
      getAllEarthquakeList(),
      getAllDisasterRain()
    ]);

    // 处理地震数据，为每个元素添加disasterType字段
    const earthquakeData = earthquakeRes.data.map(item => ({
      ...item,
      disasterType: "地震",
      uniqueId: `earthquake_${item.disasterId || Date.now() + Math.random()}`
    }));

    // 处理暴雨数据，添加灾害类型为"暴雨"
    const rainData = rainRes.data.map(item => ({
      ...item,
      disasterType: "暴雨",
      uniqueId: `rain_${item.disasterId || Date.now() + Math.random()}`
    }));

    // 合并两种灾害数据到tableData
    const mergedData = [...earthquakeData, ...rainData];

    //按发生时间排序
    mergedData.sort((a, b) => new Date(b.occurrenceTime) - new Date(a.occurrenceTime));

    // 保存原始完整数据
    originalTableData.value = mergedData;
    Object.assign(disasterList, mergedData)
    // 默认显示全部数据
    tableData.value = mergedData;
    disTotal.value = mergedData.length;

    console.log("获取到的灾害数据",tableData)
  } catch (error) {
    console.error('请求灾害数据失败', error);
    tableData.value = [];
    originalTableData.value = [];
    disTotal.value = 0;
  }
};

const formatDate = (dateStr) => {
  const date = new Date(dateStr)
  return date.toLocaleString()
};

const handlePageChangeDisaster = (page) => {
  currentPage.value = page;
};

// 时间范围过滤逻辑
const filterDataByTimeRange = (timeRange) => {
  // 如果没有原始数据，直接返回
  if (!originalTableData.value.length) return;

  const now = new Date();
  let startTime = null;

  // 根据选择的时间范围计算起始时间
  switch (timeRange) {
    case 'week':
      // 最近一周：当前时间减去7天
      startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'month':
      // 最近一个月：当前时间减去30天
      startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case 'quarter':
      // 最近三个月：当前时间减去90天
      startTime = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    case 'halfYear':
      // 最近半年：当前时间减去180天
      startTime = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
      break;
    case 'year':
      // 最近一年：当前时间减去365天
      startTime = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      break;
    case 'all':
      // 全部时间：不需要过滤
      tableData.value = originalTableData.value;
      disTotal.value = originalTableData.value.length;
      return;
    default:
      return;
  }
  // 过滤出发生时间在起始时间之后的数据
  const filteredData = originalTableData.value.filter(item => {
    const occurrenceDate = new Date(item.occurrenceTime);
    // 处理无效日期
    if (isNaN(occurrenceDate.getTime())) return false;
    return occurrenceDate >= startTime;
  });

  // 更新表格数据和总条数
  tableData.value = filteredData;
  disTotal.value = filteredData.length;
  // 重置到第一页，避免筛选后页码超出范围
  currentPage.value = 1;
};

onMounted(() => {
  fetchData();
});

async function tiggerHistoryDaster(item){
  if (item.disasterType === "地震"){

    //删除地图上烈度圈
    layers.removeIsoseismalCircle();

    //删除实体点
    basicLayers.removeHiddenEntity();

    //加载西安断层数据
    basicLayers.addFaultZone();

    emit("hideChart");

    layers.DrawEllipse(item.longitude, item.latitude, item.magnitude);
    ellipseParams.value = layers.calculateEllipseParams(item.magnitude);
    rotation.value = layers.calculateRotation(item.longitude, item.latitude, item.magnitude);
    let circle = ellipseParams.value[ellipseParams.value.length-1]
    console.log("ellipseParams",circle)
    circle_param.longitude = item.longitude;
    circle_param.latitude = item.latitude;
    circle_param.magnitude = item.magnitude;
    circle_param.semiMajorAxis = circle.semiMajorAxis;
    circle_param.semiMinorAxis = circle.semiMinorAxis;
    circle_param.rotation = rotation.value;
    AllAffectPoints.value = await getAllAffectPoints(circle_param);
    console.log("AllAffectPoints.value",AllAffectPoints.value.data.affectPoints)
    for (let i=0;i<AllAffectPoints.value.data.affectPoints.length;i++){
      if (AllAffectPoints.value.data.affectPoints[i].pointType==="风险源"){
        basicLayers.loadEntities('风险源', AllAffectPoints.value.data.affectPoints[i], dangerSourceIcon)
        chartDatas.seriesDatas[0] = AllAffectPoints.value.data.affectPoints[i].features.length;
      }
      if (AllAffectPoints.value.data.affectPoints[i].pointType==="医院"){
        basicLayers.loadEntities('医院', AllAffectPoints.value.data.affectPoints[i], hospitalIcon)
        chartDatas.seriesDatas[1] = AllAffectPoints.value.data.affectPoints[i].features.length;
      }
    }
    emit("displayChart");
  }
  if (item.disasterType === "暴雨"){

    //删除西安断层数据
    basicLayers.removeFaultZone();

    //删除地图上烈度圈
    layers.removeIsoseismalCircle();

    //删除实体点
    basicLayers.removeHiddenEntity();

    emit("hideChart");

    console.log("暴雨逻辑实现")
  }
}

</script>

<style scoped lang="scss">
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
  font-weight: 600;
  color: #2c3e50;
  white-space: nowrap; /* 禁止标题换行 */
  width: 180px; /* 固定宽度，避免不同屏幕下位置偏移 */
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

.example-showcase .el-dropdown-link {
  cursor: pointer;
  color: var(--el-color-primary);
  display: flex;
  align-items: center;
}

.history-nar {
  display: flex;
  align-items: center;
  gap: 16px; /* 三者之间的间距，可调整 */
  padding: 12px 24px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08); /* 轻微阴影增强层次感 */
  margin-bottom: 20px;
}

/* 时间下拉按钮：圆角矩形样式 */
.time-dropdown-btn {
  width: 100%;
  background-color: #f5f7fa;
  border-color: #e4e7ed;
  border-radius: 6px !important; /* 圆角核心属性 */
  color: #333;
  text-align: left; /* 文字左对齐，更符合下拉选择习惯 */
  padding: 8px 16px;
}

/* 时间下拉按钮hover状态 */
.time-dropdown-btn:hover {
  background-color: #eef1f5;
  border-color: #dcdfe6;
}

/* 时间下拉菜单样式 */
.time-dropdown-menu {
  width: 100%;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
</style>