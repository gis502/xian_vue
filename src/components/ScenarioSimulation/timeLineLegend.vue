<template>
  <div>
    <div @click="toggleLegend" class="LegendButton" style="pointer-events: auto; margin-left: 5px;">
      <img src="../../assets/icons/TimeLine/图例.png" title="图例"
           style="width: 31px; height: 31px;">
    </div>

    <div class="timelineLegend" v-if="showLegend">
      <div class="legend-title">图例</div>
      <div v-for="item in getPicData" :key="item.name" class="legend-item">
          <img  class="legend-img" :src="'/images/PlotsPic/' + item.name+ '.png'" alt="暂无符号">
        <span class="legend-label">{{ item.name }}</span>
      </div>
    </div>
  </div>
</template>

<script>
import { getPlotIcon } from "@/api/system/plot.js";


export default {
  data() {
    return {
      getPicData: [],
      showLegend:false,
    };
  },
  mounted() {
    this.getPlotPicture();
  },
  methods: {
    toggleLegend() {
      this.showLegend=!this.showLegend
    },
    getPlotPicture() {
      let that=this
      getPlotIcon().then(res => {
        // console.log(res,"getPlotIcon")
        that.getPicData = res.data;
        // console.log(that.getPicData,"that.getPicData")
      });

    }
  }
};
</script>

<style scoped>

.LegendButton {
  position: absolute;
  right: 2vw;
  top: 6vh;
  width: 32px;
  height: 32px;
  background-color: #303336;
  border: #444444 solid 1px;
  border-radius: 14%;
  transition: all 0.3s ease; /* 添加过渡效果 */
  z-index: 5;
}

.LegendButton:hover {
  color: #fff;
  fill: #fff;
  background: #48b;
  border-color: #aef;
  box-shadow: 0 0 8px 3px #48b; /* 添加发光特效 */
}

.legend-title {
  width: 100%;
  font-weight: bold;
  margin-bottom: 10px;
  text-align: center;
}

.timelineLegend {
  position: absolute;
  top:2vh;
  right: 4vw;
  background-color: rgba(255, 255, 255, 0.75);
  border: 1px solid #ffffff;
  color: black;
  padding: 10px;
  border-radius: 16px;
  z-index: 1000;
  display: flex;
  flex-wrap: wrap;
  width: 35vw;
  height: 90vh;
}

.legend-title {
  text-align: center;
  position: relative;
}


.legend-img {
  max-height: 20px;
  max-width: 20px;
}

.legend-item {
  width: 33%; /* 每个子项占据父容器的三分之一 */
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}
.legend-label {
  font-size: 0.9rem;
  text-indent: 0.5em;
}
/* 整个滚动条 */
::-webkit-scrollbar {
  width: 6px;               /* 滚动条的宽度 */
  height: 12px;              /* 滚动条的高度，对水平滚动条有效 */
}
/* 滚动条轨道 */
::-webkit-scrollbar-track {
  border-radius: 10px;
  background: #008aff70; /* 轨道的背景颜色 */
}

/* 滚动条滑块 */
::-webkit-scrollbar-thumb {
  border-radius: 10px;
  background-color: #1f9dca; /* 滑块的背景颜色 */
  border: 2px solid #fcfcfc; /* 滑块的边框和轨道相同的颜色，可以制造“边距”的效果 */
}
</style>
