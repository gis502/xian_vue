<template>
  <div class="legend">
    <div class="legend-title">图例</div>
    <div class="legend-item">
      <span class="legend-color" id="earthquake"></span>震中位置
    </div>
    <div class="legend-item">
      <div class="legend-color" id="landslide"></div>
      滑坡隐患点
    </div>
    <div class="legend-item">
      <div class="legend-color" id="debrisflow"></div>
      泥石流隐患点
    </div>
    <div class="legend-item">
      <div class="legend-color" id="riskArea"></div>
      风险区域
    </div>
    <div class="legend-item">
      <div class="legend-color" id="earthquakeline"></div>
      断裂带
    </div>
  </div>
</template>

<script setup name="Legend"></script>

<style scoped>
.legend-title {
  font-weight: bold;
  margin-bottom: 10px;
}

.legend {
  position: absolute;
  bottom: 30px;
  right: 20px;
  background-color: rgba(40, 40, 40, 0.8);
  color: white;
  padding: 15px;
  border-radius: 4px;
  z-index: 1000;
  max-width: 200px; /* 限制图例宽度 */
}

.legend-item {
  display: flex;
  align-items: center;
  margin: 4px 0; /* 减小行间距 */
  font-size: 16px; /* 缩小字体 */
}

.legend-color {
  width: 20px;
  height: 20px;
  margin-right: 8px; /* 调整颜色块与文字间距 */
  /*border: 1px solid rgba(255, 255, 255, 0.3);  浅色边框 */
}

#earthquake {
  background-image: url("../../assets/icons/TimeLine/黄点点.png");
  background-size: cover;
}
#debrisflow {
  background-image: url("../../assets/images/DebrisFlow.png");
  background-size: cover;
}
#landslide {
  background-image: url("../../assets/images/landslide.png");
  background-size: cover;
}
#riskArea {
  background-image: url("../../assets/images/riskArea.png");
  background-size: cover;
}
#earthquakeline {
  background-image: url("../../assets/images/earthquakeline.png");
  background-size: cover;
}
</style>
