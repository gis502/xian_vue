<!-- 表格组件 -->
<template>
  <div class="data-table">
    <button @click="toggleTableVisibility" class="toggle-table-btn">
      {{ isTableVisible ? "-" : "+" }}
    </button>
    <div class="table-title">{{ dataTypes.title || '灾害链影响点列表' }}</div>
    <div class="table-header" v-if="isTableVisible">
      <div class="search-box">
        <input type="text" v-model="searchQuery" placeholder="搜索表格数据..." />
        <button @click="performSearch">搜索</button>
      </div>
      <select v-model="selectedDataType" @change="changeDataType">
        <option v-for="filterCriteria in dataTypes.filterCriteria" :key="filterCriteria.value"
          :value="filterCriteria.value">
          {{ filterCriteria.name }}
        </option>
      </select>
    </div>

    <table v-if="isTableVisible" style="table-layout: fixed">
      <thead>
        <tr>
          <th style="text-align: center" v-for="(header, index) in tableHeaders" :key="index">
            {{ header }}
          </th>
        </tr>
      </thead>

      <tbody>
        <tr v-if="filteredTableData.length === 0">
          <td :colspan="tableHeaders.length" class="no-data-cell">
            暂无数据
          </td>
        </tr>
        <tr v-for="(item, index) in paginatedTableData" :key="index" @click="handleTableClick(item)">
          <template v-for="(value, key) in item">
            <td v-if="key !== 'field5' && key !== 'field6'"
              style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" :title="value">
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
import layers from "@/cesium/layers.js";

// 定义 props
const props = defineProps({
  dataTypes: {
    type: Object,
    required: true
  },
  show: {
    type: Boolean,
    default: true // 或 true，根据需求
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
    destination: Cesium.Cartesian3.fromDegrees(longitude, latitude, 4000),
    orientation: {
      heading: Cesium.Math.toRadians(0.0),
      pitch: Cesium.Math.toRadians(-90.0),
      roll: 0.0,
    },
    duration: 2, // 飞行动画持续时间（秒）
  });
  layers.flashHiddenBreathCircle(item)
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

watch(() => props.show, (newDataTypes, oldDataTypes) => {
  toggleTableVisibility()
}, { deep: true });
</script>

<style scoped lang="scss">
.data-table {
  position: absolute;
  top: 65px;
  left: 20px;
  background: rgba(14, 52, 98, 0.8);
  color: white;
  padding: 10px;
  border-radius: 2px;
  z-index: 1000;
  width: 550px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  font-size: 14px;
  border: 1px solid rgba(0, 225, 255, 0.5);
}

.toggle-table-btn {
  position: absolute;
  top: 5px;
  left: 5px;
  background-image: linear-gradient(159deg, #1c9fff 2%, #9be7ff 128%);
  color: white;
  border: none;
  border-radius: 50%;
  width: 25px;
  height: 25px;
  font-size: 20px;
  line-height: 1;
  text-align: center;
  cursor: pointer;
  z-index: 1001;
  display: flex;
  justify-content: center;
  align-items: center;
}

.toggle-table-btn:hover {
  background-color: #0056b3;
}

.table-title {
  font-weight: bold;
  margin-bottom: 15px;
  font-size: 16px;
  text-align: center;
  margin-top: 0;
  padding-top: 0px;
  color: white;
}

.data-table table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th {
  background: linear-gradient(180deg, rgba(86, 204, 242, 1) 0%, rgba(47, 128, 237, 1) 100%);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  padding: 10px 12px;
  text-align: center;
  font-size: 14px;
  font-weight: bold;
}

.data-table td {
  background: rgba(14, 52, 98, 0.8);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 10px 12px;
  text-align: center;
  font-size: 14px;
  height: 50px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.data-table tbody tr:nth-child(even) {
  background-color: rgba(255, 255, 255, 0.1);
}

.data-table tbody tr:hover {
  background-color: rgba(86, 204, 242, 0.3);
}

.no-data-cell {
  text-align: center;
  padding: 30px 12px;
  color: rgba(255, 255, 255, 0.7);
  font-style: italic;
}

.pagination-controls {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 15px;
  gap: 10px;
}

.pagination-controls button {
  background-color: #3c86ff;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.pagination-controls button:disabled {
  background-color: #373e52;
  cursor: not-allowed;
}

.pagination-controls button:hover:not(:disabled) {
  background-color: #0056b3;
}

.pagination-controls span {
  font-size: 14px;
  font-weight: bold;
  color: white;
}

.total-items {
  margin-left: 10px;
  font-size: 14px;
  color: white;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  gap: 10px;
}

.data-table select,
.search-box input {
  height: 34px;
  padding: 6px 12px;
  border-radius: 4px;
  background: rgba(15, 61, 118, 0.6);
  color: white;
  border: 1px solid rgba(0, 225, 255, 1);
  box-sizing: border-box;
}

.search-box {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-grow: 1;
}

.search-box input {
  flex-grow: 1;
  width: auto;
  color: white;
}

.search-box input::placeholder {
  color: rgba(255, 255, 255, 0.7);
}

.search-box button {
  background-color: #3c86ff;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s ease;
  height: 34px;
  box-sizing: border-box;
  white-space: nowrap;
}

.search-box button:hover {
  background-color: #0056b3;
}

.data-table select {
  flex-shrink: 0;
  color: white;
}

.data-table select option {
  background: rgba(15, 61, 118, 0.9);
  color: white;
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
