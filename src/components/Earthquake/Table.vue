<!-- 表格组件 -->
<template>
  <div class="data-table">
    <button @click="toggleTableVisibility" class="toggle-table-btn">
      {{ isTableVisible ? "-" : "+" }}
    </button>
    <div class="table-title">{{ dataTypes.title || '灾害链影响点列表' }}</div>
    <div class="table-header" v-if="isTableVisible">
      <div class="search-box">
        <input
            type="text"
            v-model="searchQuery"
            placeholder="搜索表格数据..."
        />
        <button @click="performSearch">搜索</button>
      </div>
      <select v-model="selectedDataType" @change="changeDataType">
        <option
            v-for="filterCriteria in dataTypes.filterCriteria"
            :key="filterCriteria.value"
            :value="filterCriteria.value"
        >
          {{ filterCriteria.name }}
        </option>
      </select>
    </div>

    <table v-if="isTableVisible" style="table-layout: fixed">
      <thead>
      <tr>
        <th
            style="text-align: center"
            v-for="(header, index) in tableHeaders"
            :key="index"
        >
          {{ header }}
        </th>
      </tr>
      </thead>

      <tbody>
      <tr
          v-for="(item, index) in paginatedTableData"
          :key="index"
          @click="handleTableClick(item)"
      >
        <template v-for="(value, key) in item">
          <td
              v-if="key !== 'field5' && key !== 'field6'"
              style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;"
              :title="value"
          >
            {{ value }}
          </td>
        </template>
      </tr>
      </tbody>
    </table>
    <div class="pagination-controls" v-if="isTableVisible">
      <button @click="prevPage" :disabled="currentPage === 1">上一页</button>
      <span>{{ currentPage }} / {{ totalPages }}</span>
      <button @click="nextPage" :disabled="currentPage === totalPages">
        下一页
      </button>
      <span class="total-items">共 {{ tableData.length }} 条</span>
    </div>
  </div>
</template>

<script setup name="Table">
import { ref, watch, computed, onMounted } from "vue";
import * as Cesium from "cesium";

// 定义 props
const props = defineProps({
  dataTypes: {
    type: Object,
    required: true
  }
});

const tableData = ref([]);
const isTableVisible = ref(true);
const selectedDataType = ref("type1");
const tableHeaders = ref([]);
const searchQuery = ref("");

// 表格数据和分页相关状态
const currentPage = ref(1);
const pageSize = 5;

// 过滤后的数据
const filteredTableData = computed(() => {
  if (!searchQuery.value) {
    return tableData.value;
  }
  const query = searchQuery.value.toLowerCase();
  return tableData.value.filter((item) => {
    return Object.values(item).some((value) =>
        String(value).toLowerCase().includes(query)
    );
  });
});

// 总页数
const totalPages = computed(() =>
    Math.ceil(filteredTableData.value.length / pageSize)
);

// 当前页的数据
const paginatedTableData = computed(() => {
  const start = (currentPage.value - 1) * pageSize;
  const end = start + pageSize;
  return filteredTableData.value.slice(start, end);
});

// 切换数据类型
function changeDataType() {
  const typeData = props.dataTypes[selectedDataType.value];
  tableHeaders.value = typeData.headers;
  tableData.value = typeData.data;
  searchQuery.value = "";
  currentPage.value = 1;
}

// 下一页
function nextPage() {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
  }
}

function prevPage() {
  if (currentPage.value > 1) {
    currentPage.value--;
  }
}

function handleTableClick(item) {
  // 示例逻辑，根据实际需求调整
  console.log("Clicked on item:", item);
  const longitude = item.field5; // 获取经度
  const latitude = item.field6; // 获取纬度
  // const cesiumViewer = this.cesiumViewer; // 假设你已经有一个 Cesium Viewer 实例
  // if (cesiumViewer) {
  window.viewer.scene.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(longitude, latitude,4000),
    orientation: {
      heading: Cesium.Math.toRadians(0.0),
      pitch: Cesium.Math.toRadians(-90.0),
      roll: 0.0,
    },
    duration: 2, // 飞行动画持续时间（秒）
  });
}

// 显示隐藏
const toggleTableVisibility = () => {
  isTableVisible.value = !isTableVisible.value;
};

// 搜索功能
const performSearch = () => {
  currentPage.value = 1;
};

// 初始化数据
onMounted(() => {
  changeDataType();
});

// 监听 dataTypes 数据变化
watch(() => props.dataTypes, (newDataTypes, oldDataTypes) => {
  // 当 dataTypes 发生变化时，重新设置表格数据
  changeDataType();
}, { deep: true });
</script>


<style scoped lang="scss">
.data-table {
  position: absolute;
  top: 20px; /* 距离顶部20px */
  left: 20px; /* 距离左侧20px */
  background-color: rgba(40, 40, 40, 0.8); /* 与图例背景色一致 */
  color: white;
  padding: 15px;
  border-radius: 4px;
  z-index: 1000;
  width: 550px; /* 限制表格宽度 */
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3); /* 添加阴影效果 */
  font-size: 14px; /* 调整字体大小 */
  /* position: relative; /* 移除此行，因为子元素的绝对定位不需要它 */
}

.toggle-table-btn {
  position: absolute;
  top: 5px; /* 调整按钮位置 */
  left: 5px; /* 调整按钮位置 */
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 50%; /* 圆形按钮 */
  width: 25px; /* 按钮宽度 */
  height: 25px; /* 按钮高度 */
  font-size: 14px;
  line-height: 1; /* 垂直居中文本 */
  text-align: center;
  cursor: pointer;
  z-index: 1001; /* 确保按钮在表格内容之上 */
  display: flex;
  justify-content: center;
  align-items: center;
}

.toggle-table-btn:hover {
  background-color: #0056b3;
}

.table-title {
  font-weight: bold;
  margin-bottom: 10px;
  font-size: 16px;
  text-align: center;
  margin-top: 0; /* 将 margin-top 设置为0，避免空白区域 */
  padding-top: 20px; /* 增加内边距，为按钮留出空间 */
}

.data-table table {
  width: 100%;
  border-collapse: collapse; /* 合并边框 */
}

.data-table th,
.data-table td {
  height: 50px;
  border: 1px solid rgba(255, 255, 255, 0.2); /* 浅色边框 */
  padding: 8px 12px;
  text-align: center;
  font-size: 14px;
}

.data-table th {
  background-color: rgba(60, 60, 60, 0.9); /* 表头背景色 */
  font-weight: bold;
}

.data-table tbody tr:nth-child(even) {
  background-color: rgba(50, 50, 50, 0.7); /* 斑马纹效果 */
}

.data-table tbody tr:hover {
  background-color: rgba(70, 70, 70, 0.9); /* 鼠标悬停效果 */
}

.pagination-controls {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 10px;
  gap: 10px;
}

.pagination-controls button {
  background-color: #007bff;
  color: white;
  border: none;
  padding: 5px 10px;
  border-radius: 3px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.pagination-controls button:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
}

.pagination-controls button:hover:not(:disabled) {
  background-color: #0056b3;
}

.pagination-controls span {
  font-size: 14px;
  font-weight: bold;
}

.total-items {
  margin-left: 10px;
  font-size: 14px;
  color: #ccc;
}

/* 新增样式 */
.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  gap: 10px; /* 增加整体元素之间的间距 */
}

.data-table select,
.search-box input {
  height: 34px; /* 统一高度 */
  padding: 5px 10px;
  border-radius: 4px;
  background-color: rgba(60, 60, 60, 0.9);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-sizing: border-box; /* 确保padding和border包含在height内 */
}

.search-box {
  display: flex; /* 使搜索框和按钮在同一行 */
  align-items: center;
  gap: 5px; /* 搜索框和按钮之间的间距 */
  flex-grow: 1; /* 允许搜索框占据更多空间 */
}

.search-box input {
  flex-grow: 1; /* 搜索框占据剩余空间 */
  width: auto; /* 移除固定宽度 */
}

.search-box button {
  background-color: #007bff;
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s ease;
  height: 34px; /* 统一高度 */
  box-sizing: border-box; /* 确保padding和border包含在height内 */
  white-space: nowrap; /* 防止按钮文字换行 */
}

.search-box button:hover {
  background-color: #0056b3;
}

.data-table select {
  flex-shrink: 0; /* 防止下拉菜单被压缩 */
}

::v-deep .compass {
  position: absolute;
  top: 15px;
}

::v-deep .navigation-controls {
  position: absolute;
  top: 120px;
}
</style>
