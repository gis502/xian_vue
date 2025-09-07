<template>
  <div>
    <!-- 消息提示框 -->
    <div v-if="isCalculating || calculationMessage" class="calculation-message">
      {{ calculationMessage }}
    </div>

    <div @click="toggleLayerFeatures" class="positionFlyToButton" style="pointer-events: auto; margin-left: 5px;">
      <img src="../../assets/icons/TimeLine/layerFeatures.svg" title="图层要素"
           style="width: 31px; height: 31px;">
    </div>
    <div class="universalPanel" v-if="showLayerFeatures">
      <div class="panel-title1">多源要素图层</div>

      <el-checkbox-group v-model="selectedlayers" @change="updateMapLayers"
                         class="grid-container custom-checkbox-group">
        <el-checkbox v-for="item in layeritems" :key="item.id" :label="item.name">{{ item.name }}</el-checkbox>
      </el-checkbox-group>
    </div>
  </div>
</template>

<script>
import layers from "@/cesium/layers.js";
import * as Cesium from "cesium";
import basicLayers from "@/cesium/basicLayers.js";
import {useSimulationPointStore} from "@/store/earthquake/simulation_points.js";
import {selectDisasterRealByDisasterId} from '@/api/system/plot.js'
import {rainSlideTrigger} from "@/api/system/rainModel.js";
import {getExcelPlotInfo} from "@/api/system/plot.js";
import {queryDisasterEstimationGetAll} from "@/api/system/disasterHide.js";

export default {
  data() {
    return {
      isWarningPointsCalculated: false, // 预警点是否计算完成
      showLayerFeatures: false,
      layeritems: [
        {id: '0', name: '行政区划', disabled: false},
        {id: '1', name: '预警点', disabled: false},
        {id: '2', name: '灾害点', disabled: true}, // 设置为 true 使其不可取消勾选
        {id: '6', name: '隐患点', disabled: false},
        {id: '8', name: '烈度圈', disabled: false},
        {id: '9', name: '断裂带', disabled: false},

        {id: '10', name: '医院', disabled: false},
        {id: '11', name: '风险源', disabled: false},
        {id: '12', name: '避难所', disabled: false},
        {id: '13', name: '消防站', disabled: false},
        {id: '14', name: '储备点', disabled: false},
        {id: '15', name: '人口网格', disabled: false},
        {id: '16', name: '农田网格', disabled: false},
        {id: '17', name: '管网系统', disabled: false},
        {id: '18', name: '交通道路', disabled: false},
        {id: '19', name: '桥梁', disabled: false},
        {id: '20', name: '高速', disabled: false},
        {id: '21', name: '国道', disabled: false},
        {id: '22', name: '水库', disabled: false},
        {id: '23', name: '地铁站', disabled: false},
      ],
      //是否第一次加载，进入页面就加载的，默认值为true.第一次add加载，之后显示隐藏
      firstLoad: {
        '行政区划': true,
        '预警点': true,
        '灾害点': true,
        '隐患点': true,

        '烈度圈': true,
        '断裂带': false,

        '医院': false,
        '风险源': false,
        '避难所': false,
        '消防站': false,
        '储备点': false,
        '人口网格': false,
        '农田网格': false,
        '管网系统': false,
        '交通道路': false,
        '桥梁': false,
        '高速': false,
        '国道': false,
        '水库': false,
        '地铁站': false,
      },
      selectedlayers: ['行政区划', '隐患点'],
      prevSelectedLayers: ['行政区划', '隐患点'],
      isCalculating: false, // 消息提示框显示隐藏
      calculationMessage: '', // 提示信息

      realDisasterPoint: null,
      currentTime: new Date(),
      showBaseInfo: false,

      positionArry: [],
      rainfallArry: [],
      // durationArry: [],

      plotsInfoisReady: false,
      PredictInfoIsReady: false,
    }
  },
  name: "timeLineLayer",
  props: ['viewer', 'disasterEvent', 'currentTime', 'onceLoadLayer'],
  watch: {
    async viewer() {
      this.currentTime = viewer.clock.currentTime
      await Promise.all([
        basicLayers.loadAdminData(),
        basicLayers.Addmudslide(),
        basicLayers.loadLandSlide(),
        basicLayers.AddDangerAreaDataSource(),
        basicLayers.loadFlashFlood(),
        basicLayers.loadWater(),
      ]);
    },
    async onceLoadLayer() {
      if (this.onceLoadLayer) {
        if (this.disasterEvent.trigger == "地震") {
          this.selectedlayers = ['烈度圈', '断裂带', '预警点', "灾害点", '行政区划', '隐患点'];
          this.updateMapLayers();
        } else if (this.disasterEvent.trigger == "暴雨") {
          this.selectedlayers = ['预警点', "灾害点", '行政区划', '隐患点'];
          this.updateMapLayers();
        }
      }
    },
    // plotsInfoisReady(newVal) {
    //   if (newVal && this.PredictInfoIsReady) {
    //     setTimeout(() => {
    //       this.viewer.clockViewModel.shouldAnimate = true;
    //     }, 3000);
    //   }
    // },
    // PredictInfoIsReady(newVal) {
    //   if (newVal && this.plotsInfoisReady) {
    //     setTimeout(() => {
    //       this.viewer.clockViewModel.shouldAnimate = true;
    //     }, 3000);
    //   }
    // },
    async disasterEvent() {
      if (this.disasterEvent.trigger == "暴雨") {
        function convertToArray(str) {
          return str.split(',').map(item => item.trim());
        }

        // 使用示例
        this.positionArry = convertToArray(this.disasterEvent.position);
        this.rainfallArry = convertToArray(this.disasterEvent.rainfall);
        // this.durationArry = convertToArray(this.disasterEvent.duration);
      }
      this.realDisasterPoint = await selectDisasterRealByDisasterId({
        disasterId: this.disasterEvent.disasterId,
        disasterTrigger: this.disasterEvent.trigger
      })
      console.log("this.realDisasterPoint disasterEvent",this.realDisasterPoint )
      const batchPlotIds = this.realDisasterPoint.map((plot) => plot.plotId);
      const batchPlotTypes = this.realDisasterPoint.map((plot) => plot.plotType);
      // console.log(batchPlotIds,batchPlotTypes,"batchPlotIds,batchPlotTypes,")
      const PlotInfoWithInfo = await getExcelPlotInfo(batchPlotIds, batchPlotTypes);
      console.log("updatedRes processDataEqid",PlotInfoWithInfo)
      this.$emit("update:realDisasterPointWithInfo", PlotInfoWithInfo);
      // this.plotsInfoisReady = true;
    }
  },
  components: {},
  methods: {
    toggleLayerFeatures() {
      this.showLayerFeatures = !this.showLayerFeatures;
    },
    async updateMapLayers() {
      let currentSelected = [
        ...this.selectedlayers
      ];
      // 计算图层差异
      let previouslySelected = this.prevSelectedLayers || [];
      let newlyChecked = currentSelected.filter(name => !previouslySelected.includes(name));
      let newlyUnchecked = previouslySelected.filter(name => !currentSelected.includes(name));

      // 更新记录（保存为下一次比对）
      this.prevSelectedLayers = [...currentSelected];
      // 图层映射：添加与移除图层逻辑
      // name: 图层名；add：添加图层；remove：移除图层
      let layerActions = [
        {
          name: '行政区划',
          add: () => {
            if (this.firstLoad.行政区划 == false) {
              basicLayers.showAdminData()
            } else {
              basicLayers.loadAdminData()
              this.firstLoad.行政区划 = false
            }
          },
          remove: () => {
            basicLayers.hideAdminData()
          }
        },
        {
          name: '烈度圈',
          add: () => {
            if (this.disasterEvent.trigger == "地震") {
              layers.DrawEllipse(this.disasterEvent.longitude, this.disasterEvent.latitude, this.disasterEvent.magnitude, this.disasterEvent.disaterName)
            }
          },
          remove: () => {
            layers.removeIsoseismalCircle()
          }
        },
        {
          name: '断裂带',
          add: () => {
            if (this.disasterEvent.trigger == "地震") {
              basicLayers.addFaultZone()
            }
          },
          remove: () => {
            if (this.disasterEvent.trigger == "地震") {
              basicLayers.removeFaultZone()
            }
          }
        },
        {
          name: '隐患点',
          add: () => {
            console.log(this.firstLoad.隐患点, "this.firstLoad.隐患点")
            if (this.firstLoad.隐患点 == false) {
              basicLayers.showHiddenEntity("山洪隐患点")
              basicLayers.showHiddenEntity("内涝隐患点")
              basicLayers.showHiddenEntity("泥石流隐患点")
              basicLayers.showHiddenEntity("滑坡隐患点")
              basicLayers.showHiddenEntity("风险区域")
            } else {
              basicLayers.loadLandSlide();
              basicLayers.Addmudslide();
              basicLayers.AddDangerAreaDataSource();
              basicLayers.loadFlashFlood();
              basicLayers.loadWater();
              this.firstLoad.隐患点 = false
            }
          },
          remove: () => {
            basicLayers.hideHiddenEntity("山洪隐患点")
            basicLayers.hideHiddenEntity("内涝隐患点")
            basicLayers.hideHiddenEntity("泥石流隐患点")
            basicLayers.hideHiddenEntity("滑坡隐患点")
            basicLayers.hideHiddenEntity("风险区域")
          }
        },
        {
          name: '预警点',
          add: async () => {
            if (this.firstLoad.预警点 == false) {
              layers.showHiddenBreathCircle()
            } else {
              // 第一次加载，计算预警点
              this.isCalculating = true; // 设置为正在计算
              this.calculationMessage = '正在计算预警点...';
              let probabilityPoints = await queryDisasterEstimationGetAll({
                disasterId: this.disasterEvent.disasterId,
                disasterTrigger: this.disasterEvent.trigger
              })
              console.log(probabilityPoints, "probabilityPoints")

              layers.addHiddenBreathCircle(probabilityPoints)
              this.$emit("update:hiddenDisasterPoint", probabilityPoints);
              //
              // // 设置计算完成
              this.isCalculating = false;
              this.calculationMessage = '预警点计算完成！';
              // // 3 秒后关闭提示框
              setTimeout(() => {
                this.calculationMessage = '';
              }, 3000);
              this.PredictInfoIsReady = true
              this.firstLoad.预警点 = false
            }
          },
          remove: () => {
            layers.notShowHiddenBreathCircle()
          }
        },
        {
          name: '灾害点',
          add: async () => {
            let disaterEndTime = new Date(new Date(this.disasterEvent.occurrenceTime).getTime() + 10 * 24 * 3600 * 1000);
            if(this.realDisasterPoint){
              console.log(this.realDisasterPoint,"before 灾害点")
              this.realDisasterPoint.forEach(item => {
                // console.log(item.startTime,item.endTime,new Date(item.startTime),new Date(item.endTime),"timeTime")
                if (!item.endTime || new Date(item.endTime) < new Date(this.disasterEvent.occurrenceTime) || new Date(item.endTime) <= new Date(item.startTime)) {
                  // 为没有结束时间的点设置默认结束时间
                  item.endTime = disaterEndTime  //20天 错误时间设置结束时间地震发生20天以后
                }
                if (!item.startTime) {
                  // 为没有开始时间的点设置默认开始时间
                  item.startTime = this.disasterEvent.occurrenceTime;
                }
              })
              console.log(this.realDisasterPoint,"after 灾害点")
              this.$emit("update:realDisasterPoint", this.realDisasterPoint);
              layers.addRealDisaterPlot(this.realDisasterPoint)
            }
          },
          remove: () => {
          }
        },
      ];

// 构建 map 提升查找效率
      let layerMap = new Map(layerActions.map(layer => [layer.name, layer]));
// 执行 add 操作
      newlyChecked.forEach(name => {
        let layer = layerMap.get(name);
        if (layer && typeof layer.add === 'function') {
          layer.add();
        }
      });
// 执行 remove 操作
      newlyUnchecked.forEach(name => {
        let layer = layerMap.get(name);
        if (layer && typeof layer.remove === 'function') {
          layer.remove();
        }
      });
    },
  }
}
</script>

<style scoped>
.positionFlyToButton {
  position: absolute;
  right: 2vw;
  top: 2vh;
  width: 32px;
  height: 32px;
  background-color: #303336;
  border: #444444 solid 1px;
  border-radius: 14%;
  transition: all 0.3s ease; /* 添加过渡效果 */
  z-index: 5;
}

.positionFlyToButton:hover {
  color: #fff;
  fill: #fff;
  background: #48b;
  border-color: #aef;
  box-shadow: 0 0 8px 3px #48b; /* 添加发光特效 */
}

.universalPanel {
  position: absolute;
  top: 2vh;
  right: 4vw;
  background-color: rgba(255, 255, 255, 0.75);
  border: 1px solid #ffffff;
  color: black;
  padding: 10px;
  border-radius: 4px;
  z-index: 1000;
  width: 15vh;
  height: 87vh;
}

.panel-title1 {
  font-weight: bold;
  margin-bottom: 6px; /* 缩小标题与内容间距 */
  font-size: 12px; /* 缩小字体 */
}

.grid-container {
  display: flex;
  flex-direction: column; /* 设置为列方向 */
  align-items: flex-start; /* 选项靠左对齐 */
}

.custom-checkbox-group .el-checkbox__label {
  color: white;
  font-size: 8px;
  line-height: 1;
  padding-left: 8px;
}

/* 减小选项之间的间隔 */
.grid-container .el-checkbox {
  margin-bottom: 0px; /* 调整选项之间的垂直间隔 */
  margin-right: 10px; /* 调整选项之间的水平间隔 */
  font-size: 8px; /* 根据需要调整大小 */
}

.calculation-message {
  position: fixed;
  top: 60px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 10px;
  border-radius: 5px;
  font-size: 14px;
  z-index: 1000;
}


</style>