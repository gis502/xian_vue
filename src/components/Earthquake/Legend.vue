<template>
  <div class="legend">
    <div class="legend-header">
      <div class="legend-title">图例</div>
    </div>
    <div class="legend-body">
      <div class="legend-item">
        <span class="legend-color" id="earthquake"></span>历史地震震中
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
        <div class="legend-color" id="flashflood"></div>
        山洪
      </div>
      <div class="legend-item">
        <div class="legend-color" id="water"></div>
        内涝点
      </div>
      <div class="legend-item">
        <div class="legend-color" id="riskArea"></div>
        风险区域
      </div>
      <div class="legend-item">
        <div class="legend-color" id="earthquakeline"></div>
        断裂带
      </div>
      <div class="legend-item">
        <div class="legend-color" id="predictMidDisaster"></div>
        中风险预警点
      </div>
      <div class="legend-item">
        <div class="legend-color" id="predictHighDisaster"></div>
        高风险预警点
      </div>
      <div class="legend-item">
        <div class="legend-color" id="realDisaster"></div>
        灾害点
      </div>
      <div class="legend-item">
        <div class="legend-color" id="hospital"></div>
        医院
      </div>
      <div class="legend-item">
        <div class="legend-color" id="dangerSource"></div>
        危险源(加油加气站)
      </div>
      <div class="legend-item">
        <div class="legend-color" id="shelter"></div>
        避难所
      </div>
      <div class="legend-item">
        <div class="legend-color" id="firefighter"></div>
        消防站
      </div>
      <div class="legend-item">
        <div class="legend-color" id="storePoint"></div>
        储备站
      </div>
      <div class="legend-item">
        <div class="legend-color" id="bridgePoint"></div>
        桥梁
      </div>
      <div class="legend-item">
        <div class="legend-color" id="reservoirPoint"></div>
        水库
      </div>
      <div class="legend-item">
        <div class="legend-color" id="subwayPoint"></div>
        地铁站
      </div>
    </div>
  </div>
</template>

<script setup name="Legend">

</script>

<style scoped>
.legend {
  position: absolute;
  bottom: 20px;
  right: 15px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  width: 310px;
  height: 295px;
  overflow: hidden;
  box-shadow:inset 0px 0px 9px  rgba(62, 136, 210, 1);
  color: white; /* 设置所有文字为白色 */
  font-family: Arial, sans-serif;
  border: 1px solid rgba(0, 225, 255, 1);
}

.legend-header {
  background: linear-gradient(180deg, rgba(86, 204, 242, 1) 0%, rgba(47, 128, 237, 1) 100%);
  padding: 10px;
  text-align: center;
  font-weight: bold;
  flex-shrink: 0;
}

.legend-body {
  background: rgba(14, 52, 98, 0.8);
  flex: 1;
  padding: 10px;
  display: flex;
  flex-wrap: wrap;
  align-content: flex-start;
  overflow: hidden;
}

.legend-item {
  display: flex;
  align-items: center;
  margin: 3px 0;
  font-size: 14px;
  width: 50%;
}

.legend-color {
  width: 16px;
  height: 16px;
  margin-right: 6px;
  flex-shrink: 0;
}

/* 图标样式保持不变 */
#earthquake {
  background-image: url("../../assets/images/eqMark.png");
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
#flashflood {
  background-image: url("../../assets/images/flashflood.png");
  background-size: cover;
}
#water {
  background-image: url("../../assets/images/water.png");
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
#predictHighDisaster {
  background-image: url("../../assets/images/高风险预警点.png");
  background-size: cover;
}
#predictMidDisaster {
  background-image: url("../../assets/images/中风险预警点.png");
  background-size: cover;
}
#realDisaster {
  background-image: url("../../assets/images/灾害点.png");
  background-size: cover;
}
#hospital {
  background-image: url("../../assets/images/hospital.png");
  background-size: cover;
}
#dangerSource {
  background-image: url("../../assets/images/gasstation.png");
  background-size: cover;
}
#shelter {
  background-image: url("../../assets/images/emergencyShelter.png");
  background-size: cover;
}
#firefighter {
  background-image: url("../../assets/images/firefighter.png");
  background-size: cover;
}
#storePoint {
  background-image: url("../../assets/images/storePoints.jpg");
  background-size: cover;
}
#bridgePoint {
  background-image: url("../../assets/images/bridge.png");
  background-size: cover;
}
#reservoirPoint {
  background-image: url("../../assets/images/reservoir.png");
  background-size: cover;
}
#subwayPoint {
  background-image: url("../../assets/images/subway.png");
  background-size: cover;
}
</style>