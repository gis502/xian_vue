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
            style="
            background: rgba(15, 61, 118, 0.6);
            opacity: 1;
            border-radius: 2px;
            border: 1px solid rgba(0, 225, 255, 1);
            color: rgba(231, 242, 255, 1);
            font-size: 14px;
            font-weight: 400;
            "
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
                class="el-dropdown-item"
            >
              {{ item.label }}
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>

      <!--搜索组件-->
      <div class="search-box">
        <el-input
            type="text"
            v-model="searchQuery"
            placeholder="搜索表格数据..."
            clearable
            @keyup.enter="performSearch"
            class="search-input"
        />
        <button @click="performSearch">搜索</button>
      </div>

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
        :total="filteredTableData.length"
        :page-size="pageSizeNum"
        :current-page="currentPage"
        @current-change="handlePageChangeDisaster"
    />
  </div>
</template>

<script setup name="historicalDisasterList">
import {ArrowDown, ArrowUp} from "@element-plus/icons-vue";
import {defineProps, defineEmits, onMounted, reactive, ref, computed, watch} from "vue";
import {getAllDisasterRain, getAllEarthquakeList, getRainAffectPoints} from "@/api/system/disasterEvents.js";
import layers from "@/cesium/layers.js";
import basicLayers from "@/cesium/basicLayers.js";
import {getAllAffectPoints} from "@/api/earthquake/datas.js";
import dangerSourceIcon from "@/assets/images/gasstation.png"
import hospitalIcon from "@/assets/images/hospital.png"
import landslideIcon from "@/assets/images/landslide.png";
import debrisFlowIcon from "@/assets/images/DebrisFlow.png";
import flashIcon from "@/assets/images/flashflood.png";
import waterIcon from "@/assets/images/water.png";
import { ElMessage } from 'element-plus';


const tableData = ref([])
const disTotal = ref(0)
const originalTableData = ref([]);
const showDropdown = ref(false);
const selectedTimeRange = ref('全部时间');
const showTimeDropdown = ref(false);
const currentPage = ref(1);
const pageSizeNum = ref(5);
const circle_param = reactive({});
const ellipseParams = ref([]);
const rotation = ref(0);
const AllAffectPoints = ref([]);
const searchQuery = ref("");
const rainAffectPoints = ref([]);
const levelPoints = ref([]);
const selectDisaster = ref([]);

//接收父组件传来的数据
const { chartDatas, disasterList, rainLevelPoint } = defineProps([
  "chartDatas",
  "disasterList",
  "rainLevelPoint"
]);
//接收父组件传来的方法
const emit = defineEmits([
  "displayAnalysis",
  "hideAnalysis",
  "createPulseCircle",
  'update:levelPoints',
  'update:selectDisaster',
  "loadingTrue",
  "loadingFalse"
]);

watch(
    selectDisaster,
    (newVal) => {
      emit('update:selectDisaster', newVal); // 触发事件传递最新值
    },
    { deep: true }
);

watch(
    levelPoints,
    (newVal) => {
      emit('update:levelPoints', newVal); // 触发事件传递最新值
    },
    { deep: true }
);

const timeRangeOptions = ref([
  { label: '最近一个星期', value: 'week' },
  { label: '最近一个月', value: 'month' },
  { label: '最近三个月', value: 'quarter' },
  { label: '最近半年', value: 'halfYear' },
  { label: '最近一年', value: 'year' },
  { label: '全部时间', value: 'all' }
]);

// 选择时间范围的回调
const selectTimeRange = (item) => {
  selectedTimeRange.value = item.label;
  showTimeDropdown.value = false;
  console.log('当前选中的时间范围：', item.value);
  // 执行时间范围过滤
  filterDataByTimeRange(item.value);
};

const filteredTableData = computed(() => {
  if (!searchQuery.value){
    return tableData.value
  }
  const query = searchQuery.value.toLowerCase();
  return tableData.value.filter((item) => {
    return Object.values(item).some((value) =>
        String(value).toLowerCase().includes(query)
    );
  });
});

// 搜索功能
function performSearch(){
  currentPage.value = 1;
  console.log("搜索关键词：", searchQuery.value, "筛选结果数：", filteredTableData.value.length);
}

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

  // return tableData.value.slice(start, end);
  return filteredTableData.value.slice(start, end);
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
    // const mergedData = [...earthquakeData];
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

// 创建灾害类型与图标、计数器的映射关系
const disasterConfig = {
  "内涝": { icon: waterIcon, counter: 0 },
  "山洪": { icon: flashIcon, counter: 0 },
  "滑坡": { icon: landslideIcon, counter: 0 },
  "泥石流": { icon: debrisFlowIcon, counter: 0 }
};

// 历史灾害信息列表点击逻辑
async function tiggerHistoryDaster(item){

  emit('update:selectDisaster', item);

  if (item.disasterType === "地震"){

    //删除地图上烈度圈
    layers.removeIsoseismalCircle();

    //删除实体点
    basicLayers.removeHiddenEntity();

    //加载西安断层数据
    basicLayers.addFaultZone();

    //清空数组
    levelPoints.value = [];

    emit("hideAnalysis");

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
    emit("loadingTrue");
    chartDatas.title = "历史地震影响范围统计";
    AllAffectPoints.value = await getAllAffectPoints(circle_param);
    console.log("AllAffectPoints.value",AllAffectPoints.value.data.affectPoints)
    // 定义配置映射，集中管理类型、图标和图表索引
    const pointTypeConfig = {
      "风险源": {
        icon: dangerSourceIcon,
        seriesIndex: 0
      },
      "医院": {
        icon: hospitalIcon,
        seriesIndex: 1
      },
      "隐患点": {
        subTypes: {
          "滑坡": {
            icon: landslideIcon,
            seriesIndex: 2
          },
          "泥石流": {
            icon: debrisFlowIcon,
            seriesIndex: 3
          }
        }
      }
    };

// 初始化图表数据
    chartDatas.xAxis.data = ["风险源", "医院", "滑坡", "泥石流"];
    chartDatas.seriesDatas = [0, 0, 0, 0];

// 缓存数据引用，避免重复访问
    const affectPoints = AllAffectPoints.value.data.affectPoints;

    for (let i = 0; i < affectPoints.length; i++) {
      const point = affectPoints[i];
      const type = point.pointType;
      const config = pointTypeConfig[type];

      if (!config) {
        console.log(`未处理的点类型: ${type}`);
        continue;
      }

      // 处理风险源和医院
      if (type === "风险源" || type === "医院") {
        basicLayers.loadEntities(type, point, config.icon);
        chartDatas.seriesDatas[config.seriesIndex] = point.features?.length || 0;
      }

      // 处理隐患点
      if (type === "隐患点") {
        const features = point.features || [];
        // 可以在这里初始化子类型计数器，避免重复声明
        const subTypeCounters = { "滑坡": 0, "泥石流": 0 };

        for (let j = 0; j < features.length; j++) {
          const feature = features[j];
          const disasterType = feature.properties.disaster_type;
          const subConfig = config.subTypes[disasterType];

          if (subConfig) {
            // 绘制点
            basicLayers.loadPoint(disasterType, feature, subConfig.icon);
            // 收集坐标点
            levelPoints.value.push({
              lon: feature.geometry.coordinates[0],
              lat: feature.geometry.coordinates[1]
            });

            // 更新计数器
            subTypeCounters[disasterType]++;
          }
        }

        // 更新图表数据
        chartDatas.seriesDatas[2] = subTypeCounters["滑坡"];
        chartDatas.seriesDatas[3] = subTypeCounters["泥石流"];
      }
    }
    emit('update:levelPoints', levelPoints.value);
    emit("createPulseCircle");
    emit("displayAnalysis");
    emit("loadingFalse");
  }
  if (item.disasterType === "暴雨"){

    //删除西安断层数据
    basicLayers.removeFaultZone();

    //删除地图上烈度圈
    layers.removeIsoseismalCircle();

    //删除实体点
    basicLayers.removeHiddenEntity();

    //清空数组
    levelPoints.value = [];

    emit("hideAnalysis");

    const DTO = {
      disasterId: item.disasterId,
      disasterType: "",
    };
    emit("loadingTrue");
    await getRainAffectPoints(DTO).then(response => {
      rainAffectPoints.value = response.data;
      console.log("获取暴雨数据成功",response)
        })
        .catch(error => {
          console.log("获取暴雨数据失败", error)
        })
    console.log("获取到的暴雨隐患点", rainAffectPoints.value)
    if (rainAffectPoints.value && rainAffectPoints.value.pointInfos && rainAffectPoints.value.pointInfos.length > 0) {
      chartDatas.title = "历史暴雨影响范围统计";
      rainAffectPoints.value.pointInfos.forEach(item => {
        // 处理高/中等级的点
        if (["[高]", "[中]"].includes(item.level)) {
          levelPoints.value.push(item);
        }

        // 处理灾害类型相关逻辑
        const config = disasterConfig[item.disasterType];
        if (config) {
          basicLayers.DrawIcon(item.disasterType, item, config.icon);
          console.log(item.disasterType);
          // 更新对应的计数器
          config.counter++; // 或根据实际变量作用域调整
        } else {
          // 可以添加未知灾害类型的处理逻辑
          console.log(`未知灾害类型: ${item.disasterType}`);
        }
      });


      chartDatas.xAxis.data[0] = "内涝";
      chartDatas.xAxis.data[1] = "山洪";
      chartDatas.xAxis.data[2] = "滑坡";
      chartDatas.xAxis.data[3] = "泥石流";
      chartDatas.seriesDatas[0] = disasterConfig["内涝"].counter;
      chartDatas.seriesDatas[1] = disasterConfig["山洪"].counter;
      chartDatas.seriesDatas[2] = disasterConfig["滑坡"].counter;
      chartDatas.seriesDatas[3] = disasterConfig["泥石流"].counter;

      emit("displayAnalysis");
      emit('update:levelPoints', levelPoints.value);
      emit("createPulseCircle");
      emit("loadingFalse");
    }else {

      ElMessage({
        message: '未查询到灾害影响内的高风险隐患点，请切换历史灾害！',
        type: 'warning',
      });
      emit("loadingFalse");

    }
  }
}

</script>

<style scoped lang="scss">
.history-list{
  position: absolute;
  top: 20px;
  width: 600px;
  background: rgba(14, 52, 98, 0.8);
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  padding: 20px;
  font-family: "Microsoft YaHei", sans-serif;
  z-index: 1000;
  border: 1px solid rgba(0, 225, 255, 0.5);
}

.history-title{
  font-size: 18px;
  font-weight: 600;
  color: rgba(255, 255, 255, 1);
  white-space: nowrap; /* 禁止标题换行 */
  width: 180px; /* 固定宽度，避免不同屏幕下位置偏移 */
  opacity: 1;
  text-align: left;
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

.disaster-table th{
  background: linear-gradient(180deg, rgba(86, 204, 242, 1) 0%, rgba(47, 128, 237, 1) 100%);
  color: white;
  font-size: 14px;
  font-weight: bold;
}

.disaster-table td{
  background-color: rgba(14, 52, 98, 0.8);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.2);
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
  background: linear-gradient(180deg, rgba(86, 204, 242, 1) 0%, rgba(47, 128, 237, 1) 100%);
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08); /* 轻微阴影增强层次感 */
  margin-bottom: 20px;
  border: 1px solid rgba(255, 255, 255, 0.2);
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
  background-color:rgba(15, 61, 118, 0.6);;
  border-color: #dcdfe6;
}

/* 时间下拉菜单样式 */
.time-dropdown-menu {
  width: 100%;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  background: rgba(14, 52, 98, 0.95);
}

::v-deep .el-dropdown-item {
  color: rgba(231, 242, 255, 1); /* 字体颜色 */
  font-size: 14px; /* 字体大小 */
  font-weight: 400; /* 字体粗细 */
}

.search-box input:focus {
  outline: none; /* 清除默认聚焦轮廓 */
  border-color: #3c86ff; /* 聚焦时边框变为主题色 */
  box-shadow: 0 0 0 2px rgba(60, 134, 255, 0.2); /* 轻微发光效果 */

}

.search-box {
  display: flex;
  /* 使搜索框和按钮在同一行 */
  align-items: center;
  gap: 5px;
  /* 搜索框和按钮之间的间距 */
  flex-grow: 1;
  /* 允许搜索框占据更多空间 */
}

.search-box input {
  flex-grow: 1;
  /* 搜索框占据剩余空间 */
  width: auto;
  /* 移除固定宽度 */
}

.search-box button {
  color: white;
  padding: 8px 12px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s ease;
  height: 34px;
  box-sizing: border-box;
  white-space: nowrap;
  opacity: 1;
  background: rgba(13, 101, 162, 0.59);
  border: 1px solid rgba(148, 170, 212, 1);
}

.search-box button:hover {
  background-color: #0056b3;
}

::v-deep .el-pagination__total {
  color: white !important;
}

::v-deep .disaster-list {
  height: 250px;
  overflow-y: auto;
  overflow-x: auto;

  /* Firefox 兼容（这里需要同步更新颜色，你之前没改） */
  scrollbar-width: thin;
  scrollbar-color: rgba(86, 161, 247, 1) rgba(72, 136, 210, 0.36); /* 滑块色 轨道色 */
}

/* WebKit 滚动条样式（同样需要穿透） */
::v-deep .disaster-list::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
::v-deep .disaster-list::-webkit-scrollbar-track {
  border-radius: 4px;
  background: rgba(86, 161, 247, 1); /* 轨道色 */
}
::v-deep .disaster-list::-webkit-scrollbar-thumb {
  border-radius: 4px;
  background: rgba(86, 161, 247, 1); /* 滑块色 */
  transition: background 0.2s;
}
::v-deep .disaster-list::-webkit-scrollbar-thumb:hover {
  background: rgba(86, 161, 247, 0.8); /* hover 可以稍浅一点，区分状态 */
}
</style>