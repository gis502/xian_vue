<template>
  <div id="cesium-container">
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
import { ArrowDown , ArrowUp } from '@element-plus/icons-vue'

// 多灾害列表数据***************
const tableData = ref([])
//默认最新灾害数据
const searchQuery = ref('');
const showDropdown = ref(false);
const dropdownRef = ref(null);

const timeRangeOptions = ref([
  { label: '最近一个星期', value: 'week' },
  { label: '最近一个月', value: 'month' },
  { label: '最近三个月', value: 'quarter' },
  { label: '最近半年', value: 'halfYear' },
  { label: '最近一年', value: 'year' },
  { label: '全部时间', value: 'all' }
]);
const selectedTimeRange = ref('最近一个月'); // 默认选中“最近一个月”
const showTimeDropdown = ref(false);

// 选择时间范围的回调
const selectTimeRange = (item) => {
  selectedTimeRange.value = item.label;
  showTimeDropdown.value = false;
  // 这里可添加“时间范围切换后的逻辑”，比如重新请求数据
  console.log('当前选中的时间范围：', item.value);
};

// 默认下拉选项
const defaultItems = ref([
  { id: 1, name: '地震灾害' },
  { id: 2, name: '洪水灾害' },
  { id: 3, name: '台风灾害' },
  { id: 4, name: '滑坡灾害' },
  { id: 5, name: '泥石流灾害' }
]);
// 过滤后的选项
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

    const res = await getEarthquakeRainPage({
      pageNum: currentPage.value,
      pageSize: pageSizeNum.value,
      disasterTypes: ['earthquake'] // 数组参数名与后端DTO一致
    });

    tableData.value = res.data.records || [];
    disTotal.value = res.data.total || 0;
  } catch (error) {
    console.error('请求数据失败', error)
    tableData.value = []
    disTotal.value = 0
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