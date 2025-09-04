<template>
  <div class="app-container">
    <el-form-item label="时间轴" >
      <el-input
          v-model="queryParams"
          placeholder="请输入时间轴信息"
          clearable
          style="width: 200px"
          @keyup.enter="handleQuery"
      />
      <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
      <el-button icon="Refresh" @click="resetQuery">重置</el-button>

    </el-form-item>
    <el-table :data="tableData"
              height="600px"
              @row-click="go"
              :stripe="true"
              :header-cell-style="{  }"
              :cell-style="tableColor"
              :row-style="{ height: '7.4vh' }">
      <el-table-column label="序号" width="100" align="center">
        <template #default="{ row, column, $index }">
          {{ ($index + 1) + (currentPage - 1) * pageSize }}
        </template>
      </el-table-column>
      <el-table-column prop="name" label="灾害事件" header-align="center" align="center" width="300"></el-table-column>
      <el-table-column prop="trigger" label="灾害诱因" width="100" show-overflow-tooltip  align="center"></el-table-column>
      <el-table-column prop="occurrenceTime" label="时间" header-align="center" align="center" width="300"></el-table-column>
      <el-table-column prop="location" label="位置" width="300" align="center"></el-table-column>
      <el-table-column prop="longitude" label="经度(°)" width="200" header-align="center" align="center"></el-table-column>
      <el-table-column prop="latitude" label="纬度(°)"  width="200" header-align="center" align="center"></el-table-column>
      <el-table-column label="操作" width="200" header-align="center" align="center">
        <template #default="{ row }">
          <el-button type="text" @click="go(row)">查看</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        :current-page="currentPage"
        :page-sizes="pageSizes"
        :page-size="pageSize"
        style="display: flex; justify-content: center; margin-top: 20px;"
        layout="total, sizes, prev, pager, next, jumper"
        :total="total"
    >
    </el-pagination>
  </div>

</template>

<script>

import {
  getAllEarthquakeList,
  getAllDisasterRain,
  getEarthquakeListByKey,
  getDisasterRainByKey,
} from '@/api/system/disasterEvents'
import timeTransfer from "@/cesium/timeTransfer.js";

export default {
  name: "catalog",
  data() {
    return {
      eventList: [],
      tableData: [],
      total: 0,
      pageSize: 10,
      pageSizes: [5, 10, 20, 40],
      currentPage: 1,
      // 查询功能
      queryParams: '',   // 搜索关键字
    }
  },
  mounted() {
    this.getDisasterEvents()
  },
  methods: {
    async getDisasterEvents() {
      let earthquakeList = await getAllEarthquakeList();
      let disasterRainList = await getAllDisasterRain();
      console.log(earthquakeList,disasterRainList, "disasterRainList")
      earthquakeList.data.forEach((item) => {
        // console.log(item, "earthquakeListforEach")
        this.eventList.push({
          id:item.disasterId,
          name: item.disasterName,
          trigger: '地震',
          occurrenceTime: this.timestampToTimeChina(item.occurrenceTime),
          location: item.position,
          longitude: Number(item.longitude).toFixed(2),
          latitude: Number(item.latitude).toFixed(2),
        })
      });
      disasterRainList.data.forEach((item) => {
        // console.log(item, "disasterRainListforEach")
        this.eventList.push({
          id:item.disasterId,
          name: item.disasterName,
          trigger: '暴雨',
          occurrenceTime: this.timestampToTimeChina(item.occurrenceTime),
          location: item.position,
          longitude: Number(item.longitude).toFixed(2),
          latitude: Number(item.latitude).toFixed(2),
        })
      });
      this.eventList.sort((a, b) => {
        const dateA = new String(a.occurrenceTime);
        const dateB = new String(b.occurrenceTime);
        // console.log(dateA,dateB)
        return dateB.localeCompare(dateA);
      });

      this.total=this.eventList.length
      this.tableData = this.getPageArr()
      // console.log(this.tableData)
    },
    timestampToTime(timestamp) {
      return timeTransfer.timestampToTime(timestamp)
    },
    timestampToTimeChina(timestamp) {
      return timeTransfer.timestampToTimeChina(timestamp)
    },
    // 搜索功能
    async handleQuery() {
      // 获取搜索关键字
      const searchKey = this.queryParams.trim();
      // 如果搜索关键字为空，恢复为原始数据
      if (searchKey === "") {
        this.tableData = this.getDisasterEvents() // 恢复所有数据并重新进行分页
        return;
      }
      let finalSearchKey = searchKey;

      // 判断是否是时间格式
      const timePattern = /^(\d{4})年(\d{1,2})月(\d{1,2})日(\d{1,2})时(\d{1,2})分(\d{1,2})秒$/;
      const timeMatch = searchKey.match(timePattern);
      if (timeMatch) {
        // 如果是时间格式，转换为目标格式
        const [, year, month, day, hh, mm, ss] = timeMatch;
        finalSearchKey = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')} ${hh.padStart(2, '0')}:${mm.padStart(2, '0')}:${ss.padStart(2, '0')}`;
      }
      this.eventList=[]
      let earthquakeList = await getEarthquakeListByKey({queryValue: finalSearchKey});
      let disasterRainList = await getDisasterRainByKey({queryValue: finalSearchKey});
      console.log(earthquakeList,disasterRainList, "disasterRainList getEarthquakeListByKey")
      earthquakeList.forEach((item) => {
        this.eventList.push({
          id:item.disasterId,
          name: item.disasterName,
          trigger: '地震',
          occurrenceTime: this.timestampToTimeChina(item.occurrenceTime),
          location: item.position,
          longitude: Number(item.longitude).toFixed(2),
          latitude: Number(item.latitude).toFixed(2),
        })
      });
      disasterRainList.forEach((item) => {
        this.eventList.push({
          id:item.disasterId,
          name: item.disasterName,
          trigger: '暴雨',
          occurrenceTime: this.timestampToTimeChina(item.occurrenceTime),
          location: item.position,
          longitude: Number(item.longitude).toFixed(2),
          latitude: Number(item.latitude).toFixed(2),
        })
      });
      this.eventList.sort((a, b) => {
        const dateA = new String(a.occurrenceTime);
        const dateB = new String(b.occurrenceTime);
        // console.log(dateA,dateB)
        return dateB.localeCompare(dateA);
      });
      this.total = this.eventList.length;  // 更新总数
      // 使用更新后的数据更新分页
      this.tableData = this.getPageArr();  // 传入处理后的数据
    },
    // 重置功能
    resetQuery() {
      this.queryParams = '';  // 清空搜索输入框
      this.getDisasterEvents()
    },
    // 对数据库获取到的标绘图片数组切片
    getPageArr() {
      let start = (this.currentPage - 1) * this.pageSize;
      let end = this.currentPage * this.pageSize;
      console.log(this.eventList.slice(start, end),"this.eventList.slice(start, end)")
      return this.eventList.slice(start, end);
    },
    //`每页 ${val} 条`
    handleSizeChange(val) {
      this.pageSize = val
      this.currentPage = 1;
      this.tableData = this.getPageArr()
    },
    // `当前页: ${val}`
    handleCurrentChange(val) {
      this.currentPage = val
      this.tableData = this.getPageArr()
    },
    // 修改table header的背景色
    tableColor({row, column, rowIndex, columnIndex}) {
      // console.log(row,"row")
      if (row.magnitude >= 5) {
        // console.log('>')
        return {
          // 'background-color': 'rgb(65,159,255)',
          'background-color': 'rgba(65,159,255,0.19)',
          'border-color': '#f8f8f9',
        }
      } else {
        return {
          'background-color': 'rgb(255,255,255)',
          'border-color': '#f8f8f9',
        }
      }
    },


    go(row, column, cell, event) {
      console.log(row,"row")
      this.$router.push({name: 'thdTimeLine', params: {id: row.id,trigger:row.trigger}})
    },
  }
}
</script>

<style scoped>


</style>
