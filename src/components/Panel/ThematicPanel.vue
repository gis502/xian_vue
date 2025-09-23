<template>
  <div>

    <div class="eqTheme">
      <el-button type="info" round @click="handlePanel(`thematicMap`)">专题图</el-button>
      <el-button type="info" round @click="startDownloadReport">灾情报告</el-button>
    </div>

    <!-- 功能面板：专题图/报告/仪器数据等 -->
    <div class="eqPanel"
         v-if="isPanelShow.thematicMap || isPanelShow.report || isPanelShow.instrument || isPanelShow.AssistantDecision || isPanelShow.InstrumentIntensity">
      <h2>{{ outputData.themeName }}</h2>
      <!-- 无数据提示 -->
      <div style="width: 100%;height: calc(100% - 0px);text-align: center;color: #fff;font-size: 16px"
           v-if="isNoData">
        该地震暂无评估图件产出
      </div>

      <!-- 专题图/仪器图展示（带下载/预览） -->
      <div class="mapItem" v-if="outputData.type === `thematicMap` || outputData.type === `instrument`">

        <div v-for="(item, index) in outputData.themeData" :key="index" class="map-item"
             @mouseenter="handleOpen(index)" @mouseleave="handleClose()">
          <!-- 鼠标悬浮显示的操作按钮 -->
          <div class="panelButtons" v-if="showPanelButtonsIndex === index">
            <div class="panelButton download" @click="handleDownloadMap(item.imgUrl)">下载</div>
            <div class="panelButton preview" @click="handleOpenPreview(item.theme, item.imgUrl)">预览</div>
          </div>
          <img :src="item.imgUrl" style="width: 95%; height: 80%;"/>
          <p style="margin: 10px; ">{{ item.theme }}</p>
        </div>
      </div>

      <!-- 灾情报告展示（点击下载） -->
      <div class="reportItem" v-if="outputData.type === `report`">
        <div v-for="(item, index) in outputData.themeData" :key="index" class="report-item"
             @click="handleDownloadReport(item.docxUrl)">
          <img src="../../assets/images/wordIcon.png" style="margin-right: 50px">
          {{ item.theme }}
        </div>
      </div>

      <!-- 辅助决策报告展示（点击下载） -->
      <div class="reportItem" v-if="outputData.type === `AssistantDecision`">
        <div v-for="(item, index) in outputData.themeData" :key="index" class="report-item"
             @click="handleJueCeReport(item.docxUrl)">
          <img src="../../assets/images/wordIcon.png" style="margin-right: 20px">
          {{ item.theme }}
        </div>
      </div>

      <!-- 仪器烈度报告展示（点击下载） -->
      <div class="reportItem" v-if="outputData.type === `InstrumentIntensity`">
        <div v-for="(item, index) in outputData.themeData" :key="index" class="report-item"
             @click="handleInstrumentIntensity(item.xlsUrl)">
          <img src="../../assets/images/wordIcon.png" style="margin-right: 50px">
          {{ item.theme }}
        </div>
      </div>
    </div>

    <!-- 图片预览弹窗 -->
    <div class="thematicMapPreview" v-if="isPreviewShow">
      <h2>{{ imgName }}</h2>
      <img :src="imgUrl" style="width: 80%; height: 80%;">
      <div style="display: flex; justify-content: center; align-items: center; margin-top: 5px">
        <el-button type="primary" @click="handleDownloadMap()">下载</el-button>
        <el-button plain type="primary" @click="handleClosePreview()" style="margin-left: 200px;">关闭</el-button>
      </div>
    </div>
  </div>
</template>

<script>
import {handleOutputData} from "@/api/system/eqThemes.js";
import {ElMessage} from 'element-plus'
import {downloadReport, getReport} from "@/api/system/damageassessment.js"

export default {
  //接收父组件传来的数据
  props: {
    eventRequests: {
      type: Object,
      eventId: null,
      eventQueueId: null,
      eventFullName: null,
      eventTypeof: null
    },
    wordPath: null
  },
  components: {},
  data() {
    return {
      viewer: null, // Cesium 实例
      eventId: "", // 地震ID
      eventQueueId: "", // 地震队列ID
      eventFullName: "", // 地震全称
      eventTypeof: "",
      wordRes : "",

      // 面板显示控制（仅保留实际使用的面板）
      isPanelShow: {
        thematicMap: false,
        report: false,
        instrument: false,
        AssistantDecision: false,
        InstrumentIntensity: false
      },
      isPreviewShow: false, // 预览弹窗显示控制
      showPanelButtonsIndex: null, // 悬浮按钮当前索引

      // 产出数据（专题图/报告等）
      outputData: {},
      imgName: '', // 预览图片名称
      imgUrl: '', // 预览图片地址
      isNoData: false, // 无数据标识

    };
  },
  mounted() {
    this.init()
  },

  watch(wordPath) {
    this.wordRes = wordPath
    console.log("已接收到暴雨文档路径...")
  },

  methods: {
    // 初始化方法
    init() {
      this.eventId = this.eventRequests.eventId;
      this.eventQueueId = this.eventRequests.eventQueueId;
      this.eventFullName = this.eventRequests.eventFullName;
      this.eventTypeof = this.eventRequests.eventTypeof;
      this.wordRes = this.wordPath

      console.log("this.eventId", this.eventId)
      console.log("this.eventQueueId", this.eventQueueId)
      console.log("this.eventFullName", this.eventFullName)
      console.log("this.eventTypeof", this.eventTypeof)
      console.log("this.wordRes", this.wordRes)
    },
    // 面板切换（控制不同类型面板显示/隐藏）
    handlePanel(type) {
      for (const key in this.isPanelShow) {
        if (this.isPanelShow.hasOwnProperty(key)) {
          if (key !== type && this.isPanelShow[key] === true) {
            this.isPanelShow[key] = false;
          }
        }
      }
      // 先关闭其他所有面板
      Object.keys(this.isPanelShow).forEach(key => {
        if (key !== type) this.isPanelShow[key] = false;
      });
      // 切换当前面板显示状态
      this.isPanelShow[type] = !this.isPanelShow[type];

      // 辅助决策报告：请求数据
      if (this.isPanelShow.AssistantDecision) {
        handleOutputData(this.eventId, this.eventQueueId, this.eventFullName, this.eventTypeof, type).then(res => {
          this.outputData = {
            themeName: res.themeName,
            themeData: res.themeData,
            type: type
          };
          this.isNoData = res.themeData.length === 0;
        });
        console.log('outputData', this.outputData);
      }
      // 专题图/灾情报告：请求数据
      else if (this.isPanelShow.thematicMap || this.isPanelShow.report) {
        // 打印日志（保留原请求逻辑，若需实际请求可补充处理）
        // getEqOutputMaps(queryParams).then(res => console.log("专题图", res.data));
        // getEqOutputReports(this.eqid, this.eqqueueId).then(res => console.log("灾情报告", res.data));

        // 核心数据赋值
        handleOutputData(this.eventId, this.eventQueueId, this.eventFullName, this.eventTypeof, type).then(res => {
          this.outputData = {
            themeName: res.themeName,
            themeData: res.themeData,
            type: type
          };
          this.isNoData = res.themeData.length === 0;
        });
      }

      // 仪器图：静态数据（无需请求）
      else if (this.isPanelShow.instrument) {
        this.isNoData = false;
        this.outputData = {
          type: 'instrument',
          themeName: '2022年06月01日四川雅安市芦山县6.1级地震-台网数据',
          themeData: [
            {imgUrl: "http://10.16.7.69/image/instrument/仪器地震烈度分布图.jpeg", theme: "仪器地震烈度分布图"},
            {imgUrl: "http://10.16.7.69/image/instrument/台站峰值加速度分布图.jpeg", theme: "台站峰值加速度分布图"},
            {imgUrl: "http://10.16.7.69/image/instrument/台站峰值速度分布图.jpeg", theme: "台站峰值速度分布图"},
            {imgUrl: "http://10.16.7.69/image/instrument/台站仪器地震烈度分布图.jpeg", theme: "台站仪器地震烈度分布图"},
            {imgUrl: "http://10.16.7.69/image/instrument/3.0秒加速度反应谱(gal).jpeg", theme: "3.0秒加速度反应谱(gal)"},
            {imgUrl: "http://10.16.7.69/image/instrument/1.0秒加速度反应谱(gal).jpeg", theme: "1.0秒加速度反应谱(gal)"},
            {imgUrl: "http://10.16.7.69/image/instrument/0.3秒加速度反应谱(gal).jpeg", theme: "0.3秒加速度反应谱(gal)"},
            {imgUrl: "http://10.16.7.69/image/instrument/乡镇仪器地震烈度分布.jpeg", theme: "乡镇仪器地震烈度分布"}
          ]
        };
      }

      // 仪器烈度报告：静态数据（无需请求）
      else if (this.isPanelShow.InstrumentIntensity) {
        this.isNoData = false;
        this.outputData = {
          type: 'InstrumentIntensity',
          themeName: '2022年06月01日四川雅安市芦山县6.1级地震-仪器烈度数据',
          themeData: [
            {
              xlsUrl: "http://10.16.7.69/image/instrument/20220601170008_乡镇仪器烈度报告_IEM.xls",
              theme: "乡镇仪器烈度报告"
            },
            {
              xlsUrl: "http://10.16.7.69/image/instrument/20220601170008_县市仪器烈度报告_IEM.xls",
              theme: "县市仪器烈度报告"
            },
            {
              xlsUrl: "http://10.16.7.69/image/instrument/FJ20220601170008_1_烈度速报产品.docx",
              theme: "仪器烈度速报产品"
            }
          ]
        };
      }
    },

    async startDownloadReport() {

      // 地震报告下载。
      if (this.eventTypeof === "地震") {
        await this.downloadReport();
      } else if (this.eventTypeof === "暴雨") {
        // 下载暴雨报告
        await this.downloadRainReport();
      }
    },

    async downloadReport() {
      try {
        const DTO = {
          "eqId": this.eventId,
          "eqqueueId": this.eventQueueId
        };

        // 定义定时器变量
        let checkInterval;
        const checkReportStatus = () => {
          getReport(DTO).then((res) => {

            if (res === '') {
              ElMessage({
                message: '报告生成中...',
                type: 'warning',
              })
              return;
            } else {
              clearInterval(checkInterval);
              // 获取文件名
              let fileName = `report_${this.eqid}.docx`;
              const link = document.createElement('a');
              link.href = res;
              link.download = fileName;
              link.style.display = 'none';
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              ElMessage({
                message: '报告下载成功',
                type: 'success',
              });
              return;
            }
          }).catch((error) => {
            // 发生错误时清除定时器
            clearInterval(checkInterval);
            ElMessage("报告获取失败")
            console.error('获取报告错误:', error);
          });
        };
        // 立即执行一次检查，然后每隔20秒检查一次
        checkReportStatus();
        checkInterval = setInterval(checkReportStatus, 20000);
      }catch ( error ){
        ElMessage("报告下载失败");
        console.error('下载错误:', error);
      }
    },

    async downloadRainReport() {
      if (!this.wordPath) {
        ElMessage({
          message: '报告正在产出中，请稍后再点击...',
          type: 'warning',
        })
        return;
      }
      let wordUrl = this.wordPath
      let link = document.createElement('a');
      // try {
      link.href = 'http://localhost:8080/downloadReport/file/' + wordUrl;
      // link.href = 'http://localhost:8080/downloadReport/file/' + wordUrl;
      link.download = wordUrl;                         // 强制触发下载
      link.click();
    },





// 辅助函数：从cookie获取值
    getCookie(name) {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop().split(';').shift();
    },

    // 鼠标悬浮：显示操作按钮
    handleOpen(index) {
      this.showPanelButtonsIndex = index;
    },

    // 鼠标离开：隐藏操作按钮
    handleClose() {
      this.showPanelButtonsIndex = null;
    },

    // 图片下载（支持预览弹窗/列表项下载）
    handleDownloadMap(imgUrl) {
      this.$notify({title: '专题图下载', message: '数据正在解析中...', duration: 7000, zIndex: 9999});
      const imageUrl = imgUrl || this.imgUrl;

      if (!imageUrl) {
        this.$notify({title: '错误', message: '图片 URL 不存在，无法下载', type: 'error', duration: 5000});
        return;
      }

      console.log("专题图URL", imageUrl)
      // 用fetch处理图片下载（支持跨域 blob 下载）
      fetch(imageUrl)
          .then(res => res.blob())
          .then(blob => {
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            //获取下载图片的名字
            a.download = imageUrl.split('/').pop();
            a.style.display = 'none';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(a.href);
          })
          .catch(err => {
            this.$notify({title: '错误', message: '图片下载失败，请检查 URL 或网络连接', type: 'error', duration: 5000});
            console.error('下载失败:', err);
          });
    },

    // 打开图片预览
    handleOpenPreview(imgName, imgUrl) {
      this.isPreviewShow = true;
      this.imgName = imgName;
      this.imgUrl = imgUrl;
    },

    // 关闭图片预览
    handleClosePreview() {
      this.isPreviewShow = false;
    },

    // 灾情报告下载
    handleDownloadReport(docxUrl) {
      this.$notify({title: '灾情报告下载', message: '数据正在解析中...', duration: 7000, zIndex: 9999});
      const a = document.createElement('a');
      a.href = docxUrl;
      a.download = docxUrl.split('/').pop();
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    },

    // 辅助决策报告下载（带Token认证）
    handleJueCeReport(docxUrl) {
      this.$notify({title: '辅助决策报告下载', message: '数据正在解析中...', duration: 7000, zIndex: 9999});
      fetch(docxUrl, {
        method: 'GET',
        headers: {'Authorization': `Bearer ${localStorage.getItem('token') || ''}`}
      })
          .then(res => {
            if (!res.ok) throw new Error(`下载失败: ${res.status}`);
            return res.blob();
          })
          .then(blob => {
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = docxUrl.split('/').pop();
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(a.href);
          })
          .catch(err => {
            this.$notify({title: '下载失败', message: err.message, type: 'error', duration: 5000});
          });
    },

    // 仪器烈度报告下载
    handleInstrumentIntensity(xlsUrl) {
      this.$notify({title: '仪器烈度报告下载', message: '数据正在解析中...', duration: 7000, zIndex: 9999});
      const a = document.createElement('a');
      a.href = xlsUrl;
      a.download = xlsUrl.split('/').pop();
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  }
};
</script>

<style scoped lang="less">

.eqTheme {
  position: absolute;
  top: 10px;
  left: 79%;
  z-index: 100;
}

/* 功能面板样式（居中显示） */
.eqPanel {
  position: absolute;
  top: 50%;
  left: calc(0.5 * (100% - 333px));
  transform: translate(-50%, -50%);
  padding: 0 40px;
  width: 70%;
  height: 70%;
  background-color: #2d3d51;
  z-index: 1000;
}

/* 图片列表容器（支持换行+横向滚动） */
.mapItem {
  width: 100%;
  height: calc(100% - 90px);
  display: flex;
  flex-wrap: wrap;
  overflow-x: auto;
}

/* 单个图片项样式 */
.map-item {
  position: relative;
  width: 25%;
  height: 50%;
  padding: 10px;
  text-align: center;
  border: 1px solid #ddd;

}

/* 图片项悬浮操作按钮 */
.panelButtons {
  position: absolute;
  bottom: 15%;
  width: 91%;
  height: 50px;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: rgba(43, 61, 81, 0.6);
}

/* 操作按钮通用样式 */
.panelButton {
  margin: 0 auto;
  width: 60px;
  height: 25px;
  border-radius: 8px;
  cursor: pointer;
}

/* 预览按钮样式 */
.preview {
  background-color: #ebf5ff;
  color: #409eff;
}

/* 下载按钮样式 */
.download {
  background-color: #409eff;
  color: #fff;
}

/* 报告列表容器（支持纵向滚动） */
.reportItem {
  width: 100%;
  height: calc(100% - 90px);
  text-align: center;
  overflow-y: auto;
}

/* 单个报告项样式（奇偶行区分背景） */
.report-item {
  display: flex;
  height: 100px;
  padding: 15px;
  cursor: pointer;
  color: #fff;
  font-size: 18px;
  text-align: center;
  align-items: center;
}

.report-item:hover {
  background-color: #1f5783 !important;
  color: #409eff !important;
}

.report-item:nth-child(odd) {
  background-color: #313a44;
}

.report-item:nth-child(even) {
  background-color: #304156;
}

/* 图片预览弹窗样式 */
.thematicMapPreview {
  position: absolute;
  width: 75%;
  transform: translateX(-50%);
  left: calc(0.5 * (100% - 0px));
  top: 50px;
  height: calc(100% - 100px);
  text-align: center;
  background-color: #2d3d51;
  border-radius: 10px;
  z-index: 3000;
}

/* 基础文本样式（统一白色） */
h2, p {
  color: #fff;
  margin: 10px;
}

h2 {
  text-align: center;
}

/* 滚动条样式（美化） */
::-webkit-scrollbar-thumb {
  background-color: #2980b9;
}

::-webkit-scrollbar-thumb:hover {
  background-color: #3498db;
}

::-webkit-scrollbar-track {
  background-color: #2d3d51;
}

/* Cesium 基础图层选择器样式调整（避免被遮挡） */
:deep(.cesium-baseLayerPicker-dropDown-visible) {
  z-index: 100 !important;
  background-color: #2b323a;
}

:deep(.cesium-baseLayerPicker-dropDown) {
  right: -5px !important;
}
</style>
