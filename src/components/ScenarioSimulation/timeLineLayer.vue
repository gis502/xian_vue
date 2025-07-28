<template>
  <div>
<!--    <span>{{currentTime}}当前时间</span>-->
    <!-- 消息提示框 -->
    <div v-if="isCalculating || calculationMessage" class="calculation-message">
      {{ calculationMessage }}
    </div>

    <!-- 图例 -->
    <Legend></Legend>

    <!--    预警点table-->
    <Table :dataTypes="dataTypes"></Table>
    <RealDisasterTable
        :dataTypes="dataTypesRealDisater"
        :currentTime="currentTime"
    />


    <div @click="toggleLayerFeatures" class="positionFlyToButton" style="pointer-events: auto; margin-left: 5px;">
      <img src="../../assets/icons/TimeLine/layerFeatures.svg" title="图层要素"
           style="width: 31px; height: 31px;">
    </div>


    <div class="universalPanel" v-if="showLayerFeatures">
      <div class="panelTop">
        <h2 class="panelName">多源要素图层</h2>
      </div>
      <el-checkbox-group v-model="selectedlayers" @change="updateMapLayers" class="grid-container">
        <el-checkbox v-for="item in layeritems" :key="item.id" :label="item.name">{{ item.name }}</el-checkbox>
      </el-checkbox-group>
    </div>
  </div>
</template>

<script>
import layers from "@/cesium/layers.js";
import * as Cesium from "cesium";
import basicLayers from "@/cesium/basicLayers.js";
import {obtainTheProbabilityOfSimulatedPointRisk} from "@/api/earthquake/hazards.js";
import {pulseUtils} from "@/cesium/pulse.js";
import {useSimulationPointStore} from "@/store/earthquake/simulation_points.js";
import Table from "@/components/Earthquake/Table.vue";
import RealDisasterTable from "@/components/Earthquake/RealDisasterTable.vue";
import Legend from "@/components/Earthquake/Legend.vue";
import {reactive} from "vue";
import {selectDisasterRealByDisasterId} from '@/api/system/disasterEvents'
import timeTransfer from "@/cesium/timeTransfer.js";

export default {
  data() {
    return {
      isWarningPointsCalculated: false, // 预警点是否计算完成
      showLayerFeatures: false,
      layeritems: [
        {id: '0', name: '行政区划', disabled: false},
        {id: '1', name: '烈度圈', disabled: false},
        {id: '2', name: '断裂带', disabled: false},
        {id: '3', name: '泥石流隐患点', disabled: false},
        {id: '4', name: '滑坡隐患点', disabled: false},
        {id: '5', name: '风险区域', disabled: false},
        {id: '6', name: '预警点', disabled: false},
        {id: '7', name: '灾害点', disabled: true}, // 设置为 true 使其不可取消勾选
      ],
      selectedlayers: ['行政区划', '泥石流隐患点', '滑坡隐患点', '风险区域',],
      prevSelectedLayers: ['行政区划', '泥石流隐患点', '滑坡隐患点', '风险区域'],

      warningPoints: null, // 存储预警点结果
      isCalculating: false, // 消息提示框显示隐藏
      calculationMessage: '', // 提示信息

      dataTypes: {
        filterCriteria: [
          {
            name: "滑坡预警点",
            value: "type1",
          },
          {
            name: "泥石流预警点",
            value: "type2",
          },
          {
            name: "风险区预警点",
            value: "type3",
          },
        ],
        type1: {
          headers: ["滑坡灾害名称", "位置", "规模等级", "险情等级"],
          data: [],
        },
        type2: {
          headers: ["泥石流灾害名称", "位置", "规模等级", "险情等级"],
          data: [],
        },
        type3: {
          headers: ["风险区名称", "位置", "巡查员姓名", "联系方式"],
          data: [],
        },
      },
      dataTypesRealDisater: {
        filterCriteria: [
          {
            name: "滑坡点",
            value: "type1",
          },
          {
            name: "泥石流点",
            value: "type2",
          },
          {
            name: "风险点",
            value: "type3",
          },
        ],
        type1: {
          // headers: ["滑坡灾害名称", "发生时间", "人员伤亡情况","处置阶段"],
          headers: [{name: "滑坡灾害名称", key: "field1", width: "30%"},
            {name: "发生时间", key: "field2", width: "30%"},
            {name: "人员伤亡", key: "field3", width: "15%"},
            {name: "处置阶段", key: "field4", width: "15%"}],
          data: [],

        },
        type2: {
          // headers: ["泥石流灾害名称", "发生时间", "人员伤亡情况", "处置阶段"],
          headers: [{name: "泥石流灾害名称", key: "field1", width: "30%"},
            {name: "发生时间", key: "field2", width: "30%"},
            {name: "人员伤亡", key: "field3", width: "15%"},
            {name: "处置阶段", key: "field4", width: "15%"}],
          data: [],
        },
        type3: {
          // headers: ["风险区名称", "发生时间", "人员伤亡情况", "处置阶段"],
          headers: [{name: "风险区名称", key: "field1", width: "30%"},
            {name: "发生时间", key: "field2", width: "30%"},
            {name: "人员伤亡", key: "field3", width: "15%"},
            {name: "处置阶段", key: "field4", width: "15%"}],
          data: [],
        },
      },
      showBaseInfo: false,
      realDisasterPoint: null,
      currentTime:new Date(),
    }
  },
  name: "timeLineLayer",
  props: ['viewer', 'disasterEvent', 'currentTime', 'onceLoadLayer'],
  watch: {
    async viewer() {
      this.currentTime=viewer.clock.currentTime
      await Promise.all([
        basicLayers.AddHazardSource(),
        basicLayers.loadLandSlide(),
        basicLayers.AddDangerAreaDataSource(),
        basicLayers.loadAdminData()
      ]);
    },
    onceLoadLayer() {
      console.log(this.onceLoadLayer, "onceLoadLayer")
      if (this.onceLoadLayer) {
        console.log(this.onceLoadLayer, "onceLoadLayer11")
        this.selectedlayers = ['行政区划', '烈度圈', '断裂带', '泥石流隐患点', '滑坡隐患点', '风险区域', '预警点', "灾害点"];
        this.updateMapLayers();

      }
    }
  },
  components: {
    Legend,
    Table,
    RealDisasterTable
  },
  mounted() {
  },
  methods: {
    toggleLayerFeatures() {
      this.showLayerFeatures = !this.showLayerFeatures;
    },
    async updateMapLayers() {
      const currentSelected = [
        ...this.selectedlayers
      ];
      // 计算图层差异
      const previouslySelected = this.prevSelectedLayers || [];
      const newlyChecked = currentSelected.filter(name => !previouslySelected.includes(name));
      const newlyUnchecked = previouslySelected.filter(name => !currentSelected.includes(name));

      // 更新记录（保存为下一次比对）
      this.prevSelectedLayers = [...currentSelected];

      // 图层映射：添加与移除图层逻辑
      // name: 图层名；add：添加图层；remove：移除图层
      const layerActions = [
        {
          name: '行政区划',
          add: () => {
            basicLayers.loadAdminData()
          },
          remove: () => {
            basicLayers.removeAdminData()
          }
        },
        {
          name: '烈度圈',
          add: () => {
            layers.DrawEllipse(this.disasterEvent.longitude, this.disasterEvent.latitude, this.disasterEvent.magnitude, this.disasterEvent.disaterName)
          },
          remove: () => {
            layers.removeIsoseismalCircle()
          }
        },
        {
          name: '断裂带',
          add: () => {
            basicLayers.addFaultZone()
          },
          remove: () => {
            basicLayers.removeFaultZone()
          }
        },
        {
          name: '泥石流隐患点',
          add: () => {
            basicLayers.AddHazardSource()
          },
          remove: () => {
            basicLayers.removeHazardSource()
          }
        },
        {
          name: '滑坡隐患点',
          add: () => {
            basicLayers.loadLandSlide()
          },
          remove: () => {
            basicLayers.removeLandSlide()
          }
        },
        {
          name: '风险区域',
          add: () => {
            basicLayers.AddDangerAreaDataSource()
          },
          remove: () => {
            basicLayers.removeDangerAreaDataSource()
          }
        },
        {
          name: '预警点',
          add: async () => {
            if (this.warningPoints) {
              // 如果已经计算过预警点，直接使用存储的结果
              pulseUtils.createPause(this.warningPoints, useSimulationPointStore(), window.viewer);
            } else {

              // 第一次加载，计算预警点
              this.isCalculating = true; // 设置为正在计算
              this.calculationMessage = '正在计算预警点...';

              let allHiddeninEllipse = layers.getAllHiddeninEllipse(this.disasterEvent.longitude, this.disasterEvent.latitude, this.disasterEvent.magnitude);
              const [points, probabilityPoints] = await obtainTheProbabilityOfSimulatedPointRisk(allHiddeninEllipse);

              console.log(allHiddeninEllipse, points, probabilityPoints, "inEllipsePoints,points, probabilityPoints");

              this.pushprobabilityPointsinTable(probabilityPoints)
              // 清除全部脉冲实体
              pulseUtils.removePulseEntity(useSimulationPointStore(), window.viewer);

              // 存储预警点结果
              this.warningPoints = points;

              // 添加脉冲实体
              pulseUtils.createPause(points, useSimulationPointStore(), window.viewer);
              // 设置计算完成
              this.isCalculating = false;
              this.calculationMessage = '预警点计算完成！';

              // 3 秒后关闭提示框
              setTimeout(() => {
                this.calculationMessage = '';
              }, 3000);

              // 如果是第一次加载，通知父组件更新 onceLoadLayer 并启动时间轴
              if (this.onceLoadLayer) {
                this.$emit('update:onceLoadLayer', false);
                viewer.clockViewModel.shouldAnimate = true;
              }
            }

          },
          remove: () => {
            pulseUtils.removePulseEntity(useSimulationPointStore(), window.viewer);
          }
        },
        {
          name: '灾害点',
          add: async () => {
            console.log(this.disasterEvent, "this.disasterEvent")
            this.realDisasterPoint = await selectDisasterRealByDisasterId({
              disasterId: this.disasterEvent.disasterId,
              disasterTrigger: this.disasterEvent.trigger
            })
            console.log(this.realDisasterPoint, "this.realDisasterPoint")

            this.dataTypesRealDisater.type1.data = [];
            this.dataTypesRealDisater.type2.data = [];
            this.dataTypesRealDisater.type3.data = [];
            // 风险区数据，滑坡数据，泥石流数据
            this.realDisasterPoint.forEach((item) => {
              switch (item.disasterType) {
                case "滑坡":
                  this.dataTypesRealDisater.type1.data.push({
                    field1: item.disasterName,
                    field2: timeTransfer.timestampToTimeChina(item.occurrenceTime),
                    field3: item.peopleInjure,
                    field4: item.state,
                  });
                  break;
                case "泥石流":
                  this.dataTypesRealDisater.type2.data.push({
                    field1: item.disasterName,
                    field2: timeTransfer.timestampToTimeChina(item.occurrenceTime),
                    field3: item.peopleInjure,
                    field4: item.state,
                  });
                  break;
                default:
                  this.dataTypesRealDisater.type3.data.push({
                    field1: item.disasterName,
                    field2: timeTransfer.timestampToTimeChina(item.occurrenceTime),
                    field3: item.peopleInjure,
                    field4: item.state,
                  });
              }
            });

            // const landslideEvent1 = {
            //   id: 'landslideEvent1',
            //   name: '泥石流事件',
            //   position: Cesium.Cartesian3.fromDegrees(108.8435, 33.9367),
            //   startTime: Cesium.JulianDate.fromIso8601('2025-07-25T15:00:00Z'),
            //   stopTime: Cesium.JulianDate.fromIso8601('2025-08-27T15:00:00Z'),
            //   message: '发生了一个泥石流事件'
            // };
            // const entity1 = viewer.entities.add({
            //   id: landslideEvent1.id,
            //   name: landslideEvent1.name,
            //   position: landslideEvent1.position,
            //   point: {
            //     pixelSize: 10,
            //     color: Cesium.Color.RED,
            //   },
            //   label: {
            //     text: landslideEvent1.message,
            //     font: '14px sans-serif',
            //     fillColor: Cesium.Color.BLACK,
            //     backgroundColor: Cesium.Color.WHITE.withAlpha(0.7),
            //     style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            //     outlineWidth: 2,
            //     verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
            //     pixelOffset: new Cesium.Cartesian2(0, -16),
            //   },
            //   availability: new Cesium.TimeIntervalCollection([
            //     new Cesium.TimeInterval({
            //       start: landslideEvent1.startTime,
            //       stop: landslideEvent1.stopTime,
            //     }),
            //   ]),
            // });
            // const halo1 = viewer.entities.add({
            //   position: landslideEvent1.position,
            //   point: {
            //     pixelSize: 30,
            //     color: Cesium.Color.BLACK.withAlpha(0.5),
            //     outlineColor: Cesium.Color.BLACK,
            //     outlineWidth: 2,
            //   },
            //   availability: new Cesium.TimeIntervalCollection([
            //     new Cesium.TimeInterval({
            //       start: landslideEvent1.startTime,
            //       stop: landslideEvent1.stopTime,
            //     }),
            //   ]),
            // });

            //
            // const landslideEvent = {
            //   id: 'landslideEvent',
            //   name: '滑坡事件',
            //   position: Cesium.Cartesian3.fromDegrees(108.9225, 34.02472),
            //   startTime: Cesium.JulianDate.fromIso8601('2025-07-27T15:00:00Z'),
            //   stopTime: Cesium.JulianDate.fromIso8601('2025-08-27T15:00:00Z'),
            //   message: '发生了一个滑坡'
            // };

// 添加滑坡事件实体
//             const entity = viewer.entities.add({
//               id: landslideEvent.id,
//               name: landslideEvent.name,
//               position: landslideEvent.position,
//               point: {
//                 pixelSize: 10,
//                 color: Cesium.Color.RED,
//               },
//               label: {
//                 text: landslideEvent.message,
//                 font: '14px sans-serif',
//                 fillColor: Cesium.Color.BLACK,
//                 backgroundColor: Cesium.Color.WHITE.withAlpha(0.7),
//                 style: Cesium.LabelStyle.FILL_AND_OUTLINE,
//                 outlineWidth: 2,
//                 verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
//                 pixelOffset: new Cesium.Cartesian2(0, -16),
//               },
//               availability: new Cesium.TimeIntervalCollection([
//                 new Cesium.TimeInterval({
//                   start: landslideEvent.startTime,
//                   stop: landslideEvent.stopTime,
//                 }),
//               ]),
//             });

// // 添加黑色光圈效果
//             const halo = viewer.entities.add({
//               position: landslideEvent.position,
//               point: {
//                 pixelSize: 30,
//                 color: Cesium.Color.BLACK.withAlpha(0.5),
//                 outlineColor: Cesium.Color.BLACK,
//                 outlineWidth: 2,
//               },
//               availability: new Cesium.TimeIntervalCollection([
//                 new Cesium.TimeInterval({
//                   start: landslideEvent.startTime,
//                   stop: landslideEvent.stopTime,
//                 }),
//               ]),
//             });

          },
          remove: () => {
            // 移除滑坡事件实体
            // const entity = viewer.entities.getById('landslideEvent');
            // if (entity) {
            //   viewer.entities.remove(entity);
            // }
            //
            // // 移除黑色光圈效果
            // const halo = viewer.entities.getById('landslideEventHalo');
            // if (halo) {
            //   viewer.entities.remove(halo);
            // }
          }
        }
      ];

      // 构建 map 提升查找效率
      const layerMap = new Map(layerActions.map(layer => [layer.name, layer]));
      // 执行 add 操作
      newlyChecked.forEach(name => {
        const layer = layerMap.get(name);
        if (layer && typeof layer.add === 'function') {
          layer.add();
        }
      });
      // 执行 remove 操作
      newlyUnchecked.forEach(name => {
        const layer = layerMap.get(name);
        if (layer && typeof layer.remove === 'function') {
          layer.remove();
        }
      });
    },
    pushprobabilityPointsinTable(probabilityPoints) {
      // 清空表格数据
      this.dataTypes.type1.data = [];
      this.dataTypes.type2.data = [];
      this.dataTypes.type3.data = [];
      // 风险区数据，滑坡数据，泥石流数据
      probabilityPoints.forEach((item) => {
        switch (item.geologicalDisasterHideDTO.disasterType) {
          case "滑坡":
            this.dataTypes.type1.data.push({
              field1: item.geologicalDisasterHideDTO.disasterName,
              field2: item.geologicalDisasterHideDTO.position,
              field3: item.geologicalDisasterHideDTO.scaleGrade,
              field4: item.geologicalDisasterHideDTO.riskGrade,
              field5: item.geologicalDisasterHideDTO.lon,
              field6: item.geologicalDisasterHideDTO.lat,
            });
            break;
          case "泥石流":
            this.dataTypes.type2.data.push({
              field1: item.geologicalDisasterHideDTO.disasterName,
              field2: item.geologicalDisasterHideDTO.position,
              field3: item.geologicalDisasterHideDTO.scaleGrade,
              field4: item.geologicalDisasterHideDTO.riskGrade,
              field5: item.geologicalDisasterHideDTO.lon,
              field6: item.geologicalDisasterHideDTO.lat,
            });
            break;
          default:
            this.dataTypes.type3.data.push({
              field1: item.geologicalDisasterHideDTO.disasterName,
              field2: item.geologicalDisasterHideDTO.position,
              field3: item.geologicalDisasterHideDTO.inspectorName,
              field4: item.geologicalDisasterHideDTO.inspectorTele,
              field5: item.geologicalDisasterHideDTO.lon,
              field6: item.geologicalDisasterHideDTO.lat,
            });
        }
      });
    },
  }
}
</script>

<style scoped>
.positionFlyToButton {
  position: absolute;
  right: 1vh;
  bottom: 6vh;
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
  right: 5vh;
  bottom: 6vh;
  width: 220px;
  border-radius: 5px;
  background: rgb(0, 195, 255);
  background: linear-gradient(90deg, rgb(22 105 179 / 9%) 25%, rgb(10 33 75 / 76%) 88%);
  color: #fff;
  z-index: 5;
  background-color: rgba(53, 59, 67, 0.8);
  height: 80.8vh;
  overflow-y: auto;
  overflow-x: hidden;
}

.panelTop {
  top: 0.5%;
  height: 3.8vh;
  position: relative;
  background-image: url("@/assets/icons/TimeLine/标题底图.png");
  background-size: 100% 100%;
  background-repeat: no-repeat;
}

.panelName {
  color: #FFFFFF;
  font-size: 1.1rem;
  font-weight: 550;
  position: relative;
  top: 26%;
  left: 7%;
}

.el-checkbox-group {
  display: flex;
  flex-direction: column; /* 使选项垂直排列 */
  align-items: flex-start; /* 使所有选项左对齐 */
  padding-left: 20px; /* 向右移动选项 */
}

.el-checkbox {
  display: block; /* 将每个 checkbox 设置为块级元素 */
  margin-bottom: 10px; /* 添加一些间距 */
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

:deep(.legend) {
  bottom: 55px;
  right: 45px;
}

</style>