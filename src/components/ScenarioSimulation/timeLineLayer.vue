<template>
  <div>
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

export default {
  data() {
    return {
      loadedOnce: false, // 是否已加载过
      showLayerFeatures: false,
      layeritems: [
        {id: '0', name: '行政区划'},
        {id: '1', name: '烈度圈'},
        {id: '2', name: '断裂带'},
        {id: '3', name: '泥石流隐患点'},
        {id: '4', name: '滑坡隐患点'},
        {id: '5', name: '风险区域'},
        {id: '6', name: '泥石流隐患点预警点'},
        {id: '7', name: '滑坡隐患点预警点'},
        {id: '8', name: '风险区域预警点'},
      ],
      selectedlayers: ['行政区划',  '泥石流隐患点', '滑坡隐患点', '风险区域'],
      prevSelectedLayers:['行政区划',  '泥石流隐患点', '滑坡隐患点', '风险区域']
    }
  },
  name: "timeLineLayer",
  props: ['viewer', 'disaterEvent', 'currentTime','onceLoadLayer'],
  watch: {
    viewer(){
      basicLayers.AddHazardSource()
      basicLayers.loadLandSlide()
      basicLayers.AddDangerAreaDataSource()
      basicLayers.loadAdminData()
    },
    onceLoadLayer(){
      console.log(this.onceLoadLayer,"onceLoadLayer")
      if(this.onceLoadLayer){
        console.log(this.onceLoadLayer,"onceLoadLayer11")
        this.selectedlayers = ['行政区划', '烈度圈', '断裂带', '泥石流隐患点', '滑坡隐患点', '风险区域','泥石流隐患点预警点', '滑坡隐患点预警点', '风险区域预警点'];
        this.updateMapLayers();
      }
    }
  },
  mounted() {
  },
  methods: {
    toggleLayerFeatures() {
      this.showLayerFeatures = !this.showLayerFeatures;
    },
    updateMapLayers() {
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
            layers.DrawEllipse(this.disaterEvent.longitude, this.disaterEvent.latitude, this.disaterEvent.magnitude, this.disaterEvent.disaterName)
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
          name: '泥石流隐患点预警点',
          add: () => {
            layers.highlightExistingEntities('泥石流隐患点',this.disaterEvent.longitude, this.disaterEvent.latitude, this.disaterEvent.magnitude)
          },
          remove: () => {
            layers.clearHaloEffectByType("泥石流隐患点")
          }
        },
        {
          name: '滑坡隐患点预警点',
          add: () => {
            layers.highlightExistingEntities('滑坡隐患点',this.disaterEvent.longitude, this.disaterEvent.latitude, this.disaterEvent.magnitude)
          },
          remove: () => {
            layers.clearHaloEffectByType("滑坡隐患点")
          }
        },
        {
          name: '风险区域预警点',
          add: () => {
            layers.highlightExistingEntities( '风险区域',this.disaterEvent.longitude, this.disaterEvent.latitude, this.disaterEvent.magnitude)
          },
          remove: () => {
            layers.clearHaloEffectByType("风险区域")
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
  width: 450px;
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
</style>