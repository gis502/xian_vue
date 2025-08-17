<template>
  <div class="app-container">

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

import {getAllEarthquakeList, getAllDisasterRain} from '@/api/system/disasterEvents'
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
        console.log(item, "earthquakeListforEach")
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
        console.log(item, "disasterRainListforEach")
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

    // 对数据库获取到的标绘图片数组切片
    getPageArr() {
      let start = (this.currentPage - 1) * this.pageSize;
      let end = this.currentPage * this.pageSize;
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
      // console.log(row,"row")
      this.$router.push({name: 'thdTimeLine', params: {id: row.id,trigger:row.trigger}})
    },
  }
}
</script>

<style scoped>


</style>
