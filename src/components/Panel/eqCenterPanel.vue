<template>
      <div class="eq-videoMonitorWin" :style="styleObject">
        <div class="earthquake-info-panel">
          <el-card class="eqbox-card">
            <div slot="header" class="clearfix">
              <svg t="1731937475733" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="2671" width="25" height="25"><path d="M1001.661867 796.544c48.896 84.906667 7.68 157.013333-87.552 157.013333H110.781867c-97.834667 0-139.050667-69.504-90.112-157.013333l401.664-666.88c48.896-87.552 128.725333-87.552 177.664 0l401.664 666.88zM479.165867 296.533333v341.333334a32 32 0 1 0 64 0v-341.333334a32 32 0 1 0-64 0z m0 469.333334v42.666666a32 32 0 1 0 64 0v-42.666666a32 32 0 1 0-64 0z" fill="#fbf102" p-id="2672"></path></svg>
              <span>震中信息</span>
            </div>
            <table class="earthquake-info-table">
              <tr>
                <th>震中位置</th>
                <td>{{ earthquakeInfo.position || "无数据" }}</td>
              </tr>
              <tr>
                <th>发生时间</th>
                <td>{{ this.timestampToTimeChinese(earthquakeInfo.occurrenceTime) }}</td>
              </tr>
              <tr>
                <th>震&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;级</th>
                <td>
                  {{ earthquakeInfo.magnitude || "无数据" }} 级
                </td>
              </tr>
              <tr>
                <th>震中经纬</th>
                <td>经度: {{ earthquakeInfo.longitude || "无数据" }}°E，纬度: {{ earthquakeInfo.latitude || "无数据" }}°N</td>
              </tr>
            </table>
          </el-card>
        </div>
      </div>
</template>
<script>

import timeTransfer from "@/cesium/timeTransfer.js";

export default {
  data() {
    return {
      positionEntity: {x: 0, y: 0},
      earthquakeInfo: {}
    }
  },
  props: [
    'popupData', 'position',
  ],
  watch: {
    popupData() {
      this.earthquakeInfo=this.popupData
      console.log(this.earthquakeInfo,"this.earthquakeInfo")
    },
    position() {
      this.positionEntity = this.position
    },
  },
  computed: {
    // 调整弹框位置
    styleObject() {
      return {
        positionEntity: "absolute",
        left: `${this.positionEntity.x}px`,
        top: `${this.positionEntity.y}px`
      };
    }
  },
  methods: {
    timestampToTimeChinese(timestamp) {
      return timeTransfer.timestampToTimeChina(timestamp)
    },
  }
};
</script>
<style scoped>
.el-descriptions__body .el-descriptions__table.is-bordered .el-descriptions__cell {
  /*width: 43px!important;*/
}

.eq-videoMonitorWin {
  position: absolute;
  width: 330px;
  padding: 0px;
  z-index: 2;
  box-shadow: 0 4px 8px rgb(60, 215, 255), 0 6px 20px rgb(25, 108, 210);
}

.earthquake-info-panel {
  padding: 0px;
  border-radius: 25px;
  max-width: 100%;
  margin: 0px 0px;
}

.eqbox-card {

}

:deep(.el-card__body) {
  padding: 0px 0px 0px 0px !important;
}

.earthquake-info-table {
  width: 100%;
  background-color: rgb(255, 255, 255);
  color: #000000;
  border-collapse: collapse;
}

.earthquake-info-table th,
.earthquake-info-table td {
  padding: 8px;
  text-align: center;
  border: 1px solid #21c9db;
  font-size: 0.8rem;
  font-weight: 550;
}


.ponpTable td {
  padding: 10px;
}

.info-item :nth-child(1) {
  width: 15%;
  border-color: #293966;
  border-top-style: solid;
  border-top-width: 2px;
  background-color: #293966;
  margin-bottom: 2px;
  align-content: center;
}

.info-item :nth-child(2) {
  width: 60%;
  border-color: #4d5469;
  border-top-style: solid;
  border-top-width: 2px;
  background-color: #4d5469;
  margin-bottom: 2px;
}

.clearfix {
  font-size: 1.1rem;
  font-weight: 550;
  background-color: red;
  text-align: center;
  color: #FFFFFF;
  height: 4vh;
  display: flex; /* 使用 Flexbox */
  align-items: center; /* 垂直居中 */
  justify-content: center; /* 水平居中 */
}
svg {
  vertical-align: middle; /* 保持文本和图标对齐 */
  margin-right: 0.5rem; /* 图标和文本间距 */
}
</style>
