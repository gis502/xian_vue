<template>
  <div class="data-table">
    <button @click="toggleTableVisibility" class="toggle-table-btn">
      {{ isTableVisible ? "-" : "+" }}
    </button>
    <div class="table-title">灾害发生点</div>
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
    <table v-if="isTableVisible" style="table-layout: fixed; width: 100%">
      <thead>
      <tr>
        <th
            v-for="(header, index) in tableHeaders.slice(0, 4)"
            :key="index"
            :style="{ width: header.width }"
            style="text-align: center"
        >
          {{ header.name }}
        </th>
      </tr>
      </thead>
      <tbody>
      <tr
          v-for="(item, index) in paginatedTableData"
          :key="index"
          @click="handleTableClick(item)"
      >
        <template v-for="(header, headerIndex) in tableHeaders.slice(0, 4)">
          <td
              :style="{ width: header.width }"
              style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;"
              :title="item[header.key]"
          >
            {{ item[header.key] }}
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
import {ref, watch, computed, onMounted} from "vue";
import * as Cesium from "cesium";
import timeTransfer from "@/cesium/timeTransfer.js";
import {isEqual, throttle, debounce} from "lodash";
import layers from "@/cesium/layers.js";

const props = defineProps({
  dataTypes: {
    type: Object,
    required: true
  },
  currentTime: {
    type: [String, Object],
    required: true
  }
});

const tableData = ref([]);
const isTableVisible = ref(true);
const selectedDataType = ref("type1");
const allData = ref([]);
const tableHeaders = ref([]);
const searchQuery = ref("");

const currentPage = ref(1);
const pageSize = 3;
const lastTimeData=ref([])
// 过滤后的数据
const filteredTableData = ref([]);

// 总页数
const totalPages = computed(() =>
    Math.ceil(tableData.value.length / pageSize)
);

// 当前页的数据
const paginatedTableData = computed(() => {
  const start = (currentPage.value - 1) * pageSize;
  const end = start + pageSize;
  return tableData.value.slice(start, end);
});

function changeDataType() {
  const typeData = props.dataTypes[selectedDataType.value];
  // const typeData = props.dataTypes[lastTimeData.value];

  tableHeaders.value = typeData.headers;
  // tableData.value = typeData.data;
  // 1. 先取交集
  let intersection =typeData.data.filter(td =>
      lastTimeData.value.some(ltd =>
          ltd.field1 === td.field1 &&
          ltd.field2 === td.field2 &&
          ltd.field3 === td.field3
      )
  );
  // 2. 再按时间倒序排序（越晚越靠前）
  intersection.sort((a, b) => {
    const timeA = timeTransfer.timeChinaToNewDate(a.field1);
    const timeB = timeTransfer.timeChinaToNewDate(b.field1);
    return timeB - timeA;   // 晚 - 早  =>  晚的在前
  });

  tableData.value = intersection;
  searchQuery.value = "";
  currentPage.value = 1;
  // currentPage.value = totalPages.value;
}

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

const toggleTableVisibility = () => {
  isTableVisible.value = !isTableVisible.value;
};

const performSearch = () => {
  currentPage.value = 1;
};

function timeSelect(){
  const currentTime = new Date(props.currentTime);

  const newData = allData.value.filter(item => {

    const occurTime = timeTransfer.timeChinaToNewDate(item.field1);
    if (!occurTime || !currentTime) {
      // console.error(`Invalid date format for field2: ${item.field1}`);
      return false;
    }
    return occurTime < currentTime;
  });
  // console.log(newData,currentTime,"newData")
  // 只有在数据实际发生变化时才更新 filteredTableData
  // 找出新添加或更新的数据
  // const changedData = newData.filter(item =>
  //     !lastTimeData.value.some(ldItem => (ldItem.field1 === item.field1)&&(ldItem.field2 === item.field2)&&(ldItem.field3 === item.field3))
  // );
  //

  let changedData = [];
  if (lastTimeData.value.length === 0) {
    lastTimeData.value = newData;
    changedData = newData;
    // console.log('No previous data, all new data is considered changed.');
  } else {
    changedData = newData.filter(item => {
      // console.log('Checking item:', item);
      const isMatch = lastTimeData.value.some(ldItem => {
        // console.log('Last Time Data item:', ldItem);
        return (ldItem.field1 === item.field1) && (ldItem.field2 === item.field2) && (ldItem.field3 === item.field3);
      });
      if (!isMatch) {
        // console.log('No match found for item:', item);
      }
      return !isMatch;
    });
    // 更新 lastTimeData.value
    lastTimeData.value = newData;
  }
// 在控制台中打印 changedData
//   console.log('Changed Data:', changedData);

    if (changedData.length > 0) {
      // 更新 lastTimeData.value，只添加新数据或更新变化的数据
      lastTimeData.value = newData
      // 获取变化数据的类型
      const changedDataType = changedData[0].type;
      // console.log(changedDataType,"changedDataType")
      // // 如果变化的数据类型与当前显示的类型不同，则切换类型
      // if (changedDataType !== selectedDataType.value) {
        selectedDataType.value = changedDataType;
        // console.log(selectedDataType.value,"selectedDataType.value")
        changeDataType();
      // }
    }
  }

function handleTableClick(item) {
  const longitude = item.field5; // 获取经度
  const latitude = item.field6; // 获取纬度
  console.log(item,longitude,latitude,"handleTableClick")
  // const cesiumViewer = this.cesiumViewer; // 假设你已经有一个 Cesium Viewer 实例
  // if (cesiumViewer) {
  window.viewer.scene.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(longitude, latitude, 2000),
    orientation: {
      heading: Cesium.Math.toRadians(0.0),
      pitch: Cesium.Math.toRadians(-90.0),
      roll: 0.0,
    },
    duration: 2, // 飞行动画持续时间（秒）
  });
  // }
}

onMounted(() => {
  changeDataType();
});
// 节流后的 updateTableData 函数
const throttledUpdateTableData = throttle(timeSelect, 1000);

// 监听 currentTime 的变化
watch(() => props.currentTime, () => {
  throttledUpdateTableData();
});
// 监听 dataTypes 的变化
watch(() => props.dataTypes, (newDataTypes, oldDataTypes) => {
  console.log(props.dataTypes,"props.dataTypes")
  if(newDataTypes){
    allData.value = [
      ...(newDataTypes.type1?.data || []),
      ...(newDataTypes.type2?.data || []),
      ...(newDataTypes.type3?.data || []),
    ];
    console.log(allData.value,"allData.value")
    timeSelect();
  }

}, {deep: true});
</script>
<style scoped lang="scss">
.data-table {
  position: absolute;
  top: 52vh; /* 距离顶部20px */
  left: 20px; /* 距离左侧20px */
  background-color: rgba(255,255,255,0.75); /* 与图例背景色一致 */
  color: black;
  padding: 15px;
  border-radius: 8px;
  z-index: 1000;
  width: 550px; /* 限制表格宽度 */
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3); /* 添加阴影效果 */
  font-size: 12px; /* 调整字体大小 */
}

.toggle-table-btn {
  position: absolute;
  top: 5px; /* 调整按钮位置 */
  left: 5px; /* 调整按钮位置 */
  //background-color: #007bff;
  background-image: linear-gradient(159deg, #1c9fff 2%, #9be7ff 128%);
  //border-radius: 24px;
  color: white;
  border: none;
  border-radius: 50%; /* 圆形按钮 */
  width: 25px; /* 按钮宽度 */
  height: 25px; /* 按钮高度 */
  font-size: 20px;
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
  margin-bottom: 5px;
  font-size: 16px;
  text-align: center;
  margin-top: 0; /* 将 margin-top 设置为0，避免空白区域 */
  padding-top: 0px; /* 增加内边距，为按钮留出空间 */
}

.data-table table {
  width: 100%;
  border-collapse: collapse; /* 合并边框 */
}

.data-table th,
.data-table td {
  height: 50px;
  border: 1px solid #FFFFFF; /* 浅色边框 */
  padding: 8px 12px;
  text-align: center;
  font-size: 12px;
}

.data-table th {
  background-color: rgba(255,255,255,0.5); /* 表头背景色 */
  font-weight: bold;
}

.data-table tbody tr:nth-child(even) {
  background-color: rgba(255,255,255,0.5); /* 斑马纹效果 */
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
  background-color: #3c86ff;
  color: white;
  border: none;
  padding: 5px 10px;
  border-radius: 3px;
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
  font-size: 12px;
  font-weight: bold;
}

.total-items {
  margin-left: 10px;
  font-size: 12px;
  color: black;
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
  background-color: rgba(255,255,255,0.5);
  color: black;
  border: 1px solid #FFFFFF;
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
  background-color: #3c86ff;
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

