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
import {obtainTheProbabilityOfSimulatedPointRisk} from "@/api/earthquake/hazards.js";
// import {PulseTool} from "@/cesium/pulse.js";
import {useSimulationPointStore} from "@/store/earthquake/simulation_points.js";

import {reactive} from "vue";
import {selectDisasterRealByDisasterId} from '@/api/system/disasterEvents'
import timeTransfer from "@/cesium/timeTransfer.js";
import {parsePointString} from "@/cesium/geomTransfer.js";
import {rainSlideTrigger} from "@/api/system/rainModel.js";

export default {
  data() {
    return {
      isWarningPointsCalculated: false, // 预警点是否计算完成
      showLayerFeatures: false,
      layeritems: [
        {id: '0', name: '行政区划', disabled: false},
        {id: '1', name: '预警点', disabled: false},
        {id: '2', name: '灾害点', disabled: true}, // 设置为 true 使其不可取消勾选


        {id: '3', name: '泥石流隐患点', disabled: false},
        {id: '4', name: '滑坡隐患点', disabled: false},
        {id: '5', name: '山洪隐患点', disabled: false},
        {id: '6', name: '内涝隐患点', disabled: false},
        {id: '7', name: '风险区域', disabled: false},


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
        '行政区划': false,
        '预警点': false,
        '灾害点': true,

        '泥石流隐患点': false,
        '滑坡隐患点': false,
        '山洪隐患点': false,
        '内涝隐患点': false,
        '风险区域': false,

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

      // selectedlayers: ['行政区划', '泥石流隐患点', '滑坡隐患点', '风险区域', '山洪隐患点', '内涝隐患点'],
      // prevSelectedLayers: ['行政区划', '泥石流隐患点', '滑坡隐患点', '风险区域', '山洪隐患点', '内涝隐患点'],
      selectedlayers: [],
      prevSelectedLayers:[],
      isCalculating: false, // 消息提示框显示隐藏
      calculationMessage: '', // 提示信息

      // pulse: null,
      realDisasterPoint: null,
      currentTime: new Date(),
      showBaseInfo: false,

      positionArry: [],
      rainfallArry: [],
      durationArry: [],
    }
  },
  name: "timeLineLayer",
  props: ['viewer', 'disasterEvent', 'currentTime', 'onceLoadLayer'],
  watch: {
    async viewer() {
      this.currentTime = viewer.clock.currentTime
      // await Promise.all([
        // basicLayers.Addmudslide(),
        // basicLayers.loadLandSlide(),
        // basicLayers.AddDangerAreaDataSource(),
        // basicLayers.loadAdminData(),
        // basicLayers.loadFlashFlood(),
        // basicLayers.loadWater()
      // ]);
    },
    async onceLoadLayer() {
      if (this.onceLoadLayer) {
          if (this.disasterEvent.trigger == "地震") {
            this.selectedlayers = ["灾害点","烈度圈"];
            await this.updateMapLayers();
            if (this.onceLoadLayer) {
              this.$emit('update:onceLoadLayer', false);
              viewer.clockViewModel.shouldAnimate = true;
            }
          }
      }
      // if (this.onceLoadLayer) {
      //   if (this.disasterEvent.trigger == "地震") {
      //     this.selectedlayers = ['行政区划', '烈度圈', '断裂带', '泥石流隐患点', '滑坡隐患点', '风险区域', '预警点', "灾害点", '山洪隐患点', '内涝隐患点'];
      //     this.updateMapLayers();
      //   } else if (this.disasterEvent.trigger == "暴雨") {
      //     this.selectedlayers = ['行政区划', '泥石流隐患点', '滑坡隐患点', '风险区域', '预警点', "灾害点", '山洪隐患点', '内涝隐患点'];
      //     this.updateMapLayers();
      //   }
      //
      // }
    },
    disasterEvent() {
      if (this.disasterEvent.trigger == "暴雨") {
        function convertToArray(str) {
          return str.split(',').map(item => item.trim());
        }

// 使用示例
        this.positionArry = convertToArray(this.disasterEvent.position);
        this.rainfallArry = convertToArray(this.disasterEvent.rainfall);
        this.durationArry = convertToArray(this.disasterEvent.duration);
      }

    }
  },
  components: {},
  // mounted() {
  //   this.pulse = new PulseTool(window.viewer);
  // },
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
          name: '泥石流隐患点',
          add: () => {
            console.log(this.firstLoad.泥石流隐患点, "this.firstLoad.泥石流隐患点")
            if (this.firstLoad.泥石流隐患点 == false) {
              basicLayers.showHiddenEntity("泥石流隐患点")
            } else {
              basicLayers.Addmudslide()
              this.firstLoad.泥石流隐患点 = false
            }
          },
          remove: () => {
            basicLayers.hideHiddenEntity("泥石流隐患点")
          }
        },
        {
          name: '滑坡隐患点',
          add: () => {
            if (this.firstLoad.滑坡隐患点 == false) {
              basicLayers.showHiddenEntity("滑坡隐患点")
            } else {
              basicLayers.loadLandSlide()
              this.firstLoad.滑坡隐患点 = false
            }
          },
          remove: () => {
            basicLayers.hideHiddenEntity("滑坡隐患点")
          }
        },


        {
          name: '山洪隐患点',
          add: () => {
            if (this.firstLoad.山洪隐患点 == false) {
              basicLayers.showHiddenEntity("山洪隐患点")
            } else {
              basicLayers.loadFlashFlood()
              this.firstLoad.山洪隐患点 = false
            }
          },
          remove: () => {
            basicLayers.hideHiddenEntity("山洪隐患点")
          }
        },
        {
          name: '内涝隐患点',
          add: () => {
            if (this.firstLoad.内涝隐患点 == false) {
              basicLayers.showHiddenEntity("内涝隐患点")
            } else {
              basicLayers.loadWater()
              this.firstLoad.内涝隐患点 = false
            }
          },
          remove: () => {
            basicLayers.hideHiddenEntity("内涝隐患点")
          }
        },

        {
          name: '风险区域',
          add: () => {
            if (this.firstLoad.风险区域 == false) {
              basicLayers.showHiddenEntity("风险区域")
            } else {
              basicLayers.AddDangerAreaDataSource()
              this.firstLoad.风险区域 = false
            }
          },
          remove: () => {
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
              if (this.disasterEvent.trigger == "地震") {

                let allHiddeninEllipse = layers.getAllHiddeninEllipse(this.disasterEvent.longitude, this.disasterEvent.latitude, this.disasterEvent.magnitude);
                console.log(allHiddeninEllipse, "allHiddeninEllipse")
                let [pointsWithCausingFactors, probabilityPoints] = await obtainTheProbabilityOfSimulatedPointRisk(allHiddeninEllipse);
                console.log(allHiddeninEllipse, pointsWithCausingFactors, probabilityPoints, "inEllipsePoints,points, probabilityPoints");
                // this.pulse.removePulseEntity();
                layers.addHiddenBreathCircle(probabilityPoints)
                // this.pulse.createPause(probabilityPoints);
                // layers.flashHiddenDisasterPoints(probabilityPoints);
                this.$emit("update:hiddenDisasterPoint", probabilityPoints);

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
              } else if (this.disasterEvent.trigger == "暴雨") {
                // 汇总所有区县的匹配数据
                let allMatchedHuapoData = [];
                let allPointSet = new Set();

                // 遍历所有行政区划，收集数据
                for (let i = 0; i < this.positionArry.length; i++) {
                  let adminCoordinates = layers.getAdminCoordinatesByName(this.positionArry[i]);
                  let allPointsInside = layers.findAllHiddenDisasterPointsInAffectedArea(adminCoordinates);
                  // 获取当前区县的匹配数据
                  let {matchedHuapoData} = this.getHiddenDisasterPointswithCausingFactors(
                      allPointsInside,
                      i,
                      this.rainfallArry[i],
                      this.durationArry[i],
                  );
                  // 合并到总数据集
                  allMatchedHuapoData.push(...matchedHuapoData);
                }
                console.log("所有区县汇总数据：", allMatchedHuapoData, allPointSet);
                // 一次性发送所有数据到接口
                let matchedHuapoEntities = await this.caculateRainSlideTrigger(allMatchedHuapoData);
                console.log(matchedHuapoEntities, "matchedHuapoEntities这是匹配的所有点")
                layers.addHiddenBreathCircle(matchedHuapoEntities)
                this.$emit("update:hiddenDisasterPoint", matchedHuapoEntities);
                // 存储预警点结果
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

            let disaterEndTime=new Date(new Date(this.disasterEvent.occurrenceTime).getTime() + 10 * 24 * 3600 * 1000);
            console.log(disaterEndTime,"disaterEndTime")
            if (!this.realDisasterPoint) {
              this.realDisasterPoint = await selectDisasterRealByDisasterId({
                disasterId: this.disasterEvent.disasterId,
                disasterTrigger: this.disasterEvent.trigger
              })
              console.log(this.realDisasterPoint,"this.realDisasterPoint before")
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
              this.$emit("update:realDisasterPoint", this.realDisasterPoint);
              console.log(this.realDisasterPoint,"this.realDisasterPoint")
              layers.addRealDisaterPlot(this.realDisasterPoint)
              // layers.judgeandaddRealDisasterNewPoint(this.realDisasterPoint)
            }
            else {
              // layers.addRealDisaterPlot(this.realDisasterPoint)
              // layers.judgeandaddRealDisasterNewPoint(this.realDisasterPoint)
            }
          },
          remove: () => {
            // 移除滑坡事件实体
            // let entity = viewer.entities.getById('landslideEvent');
            // if (entity) {
            //   viewer.entities.remove(entity);
            // }
            //
            // // 移除黑色光圈效果
            // let halo = viewer.entities.getById('landslideEventHalo');
            // if (halo) {
            //   viewer.entities.remove(halo);
            // }
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
    getHiddenDisasterPointswithCausingFactors(landslidePointsInside, index, rainfall, duration) {
      console.log(landslidePointsInside, "getHiddenDisasterPointswithCausingFactors")
      let matchedHuapoData = [];
      let pointSet = new Set();
      if (landslidePointsInside.length > 0) {
        // 创建经纬度字符串集合用于快速匹配
        landslidePointsInside.forEach(point => {
          let lon = point[0];
          let lat = point[1];
          pointSet.add(`${lon},${lat}`);
        });
        useSimulationPointStore().simulationPoints.forEach((item) => {
          let lon = item.geologicalDisasterHideDTO.lon;
          let lat = item.geologicalDisasterHideDTO.lat;
          let key = `${lon},${lat}`;
          if (pointSet.has(key)) {
            matchedHuapoData.push(item);
            item.factorVoList.forEach(factor => {
              if (factor.attributeName === "降雨量") {
                factor.factorValue = rainfall;
              }
              if (factor.attributeName === "持续时间") {
                factor.factorValue = duration;
              }
            });
          }
        });

        console.log(matchedHuapoData, pointSet, "matchedHuapoData,pointSet")
        // 降雨量值放到致灾因子里面去（修复原代码中数组嵌套错误）
        matchedHuapoData.forEach(huapoItem => {
          // 检查factorVoList是否存在且为数组
          if (Array.isArray(huapoItem.factorVoList)) {
            huapoItem.factorVoList.forEach(factor => {
              if (factor.attributeName === "降雨量") {
                factor.factorValue = rainfall;
              }
              if (factor.attributeName === "持续时间") {
                factor.factorValue = duration;
              }
            });
          }
        });
      }
      return {matchedHuapoData};
    },
    // 获取区县所有数据
    async caculateRainSlideTrigger(matchedHuapoData) {
      console.log(matchedHuapoData, "汇总后的matchedHuapoData")
      let requestData = {
        data: []
      };
      matchedHuapoData.forEach(item => {
        let entityId = '';
        if (item.geologicalDisasterHideDTO.disasterType === "风险区域") {
          entityId = "风险区域" + item.geologicalDisasterHideDTO.unitCode;
        } else if (item.geologicalDisasterHideDTO.disasterType === "滑坡") {
          entityId = "滑坡隐患点" + item.geologicalDisasterHideDTO.id;
        } else if (item.geologicalDisasterHideDTO.disasterType === "泥石流") {
          entityId = "泥石流隐患点" + item.geologicalDisasterHideDTO.id;
        } else if (item.geologicalDisasterHideDTO.disasterType === "内涝") {
          entityId = "内涝隐患点" + item.geologicalDisasterHideDTO.id;
        } else if (item.geologicalDisasterHideDTO.disasterType === "山洪") {
          entityId = "山洪隐患点" + item.geologicalDisasterHideDTO.id;
        }

        // 确保 factors 是一个数组
        let factors = Array.isArray(item.factorVoList) ? item.factorVoList : item.factorVoList ? [item.factorVoList] : [];
        let itemFormat = {
          entityId: entityId,
          probability: [],
          level: [],
          disaster: [],
          disasterType: item.geologicalDisasterHideDTO.disasterType,
          factors: factors,
          lon: item.geologicalDisasterHideDTO.lon,
          lat: item.geologicalDisasterHideDTO.lat,
          geologicalDisasterHideDTO: item.geologicalDisasterHideDTO,
        };

        requestData.data.push(itemFormat);
      });
      try {
        let matchedHuapoEntities = [];
        console.log("一次性发送的请求数据：", requestData);
        let res1111 = await rainSlideTrigger(requestData);
        console.log(res1111, "rainSlideTrigger返回结果")
        let formatAnalyzedData = res1111.data || [];

        formatAnalyzedData.forEach(item => {
          matchedHuapoEntities.push(item);
        });

        return matchedHuapoEntities;
      } catch (error) {
        console.error("Error in rainSlideTrigger:", error);
        return [];
      }
    },
  }
}
</script>

<style scoped>
.positionFlyToButton {
  position: absolute;
  right: 3vh;
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
  right: 7vh;
  background-color: rgba(40, 40, 40, 1);
  color: white;
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