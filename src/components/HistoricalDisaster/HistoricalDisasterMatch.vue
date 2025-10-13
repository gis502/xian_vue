<template>
  <div class="button-container">
    <el-button class="custom-btn"
               :class="{ active: activeBtn === 'match' }"
               @click="drawer = true; activeBtn = 'match'">
      相似历史灾害匹配
    </el-button>
  </div>
  <div>
    <el-drawer
        class="top-title"
        v-model="drawer"
        title="相似历史灾害信息"
        :with-header="true"
        :width="600"
    >
      <div class="drawer-content">
        <el-descriptions
            class="margin-top"
            :column="1"
            border
            v-for="(disaster, index) in disasterMatch"
            :key="index"
        >
          <template #extra>
          </template>
          <el-descriptions-item >
            <template #label>
              <div class="cell-item">
                灾害名称
              </div>
            </template>
            {{ disaster.disasterName }}
          </el-descriptions-item>
          <el-descriptions-item>
            <template #label>
              <div class="cell-item">
                发生时间
              </div>
            </template>
            {{ disaster.occurrenceTime }}
          </el-descriptions-item>
          <el-descriptions-item>
            <template #label>
              <div class="cell-item">
                发生地点
              </div>
            </template>
            {{ disaster.position }}
          </el-descriptions-item>
          <el-descriptions-item>
            <template #label>
              <div class="cell-item">
                经度
              </div>
            </template>
            {{ disaster.longitude }}
          </el-descriptions-item>
          <el-descriptions-item>
            <template #label>
              <div class="cell-item">
                纬度
              </div>
            </template>
            {{ disaster.latitude }}
          </el-descriptions-item>
        </el-descriptions>
      </div>
    </el-drawer>
  </div>

</template>

<script setup lang="ts" name="historicalDisasterMatch">
import {ref, defineProps, computed} from 'vue'
const drawer = ref(false);
const disasterMatch = ref([]);
const { disasterList, selectDisaster } = defineProps([
    "disasterList",
    "selectDisaster"
]);
const activeBtn = ref('');
for (let i=0;i<disasterList.length; i++){
  if (disasterList[i].disasterType===selectDisaster.disasterType){
    disasterMatch.value.push(disasterList[i])
  }
}
console.log(7823916,drawer.value)
console.log("disasterMatch",disasterMatch.value.length)
</script>

<style scoped>
.button-container {
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
}

/* 自定义按钮基础样式（覆盖element默认样式） */
.custom-btn {
  /* 移除element默认背景和边框，避免冲突 */
  border: none !important;
  /* 基础背景图片（默认状态） */
  background: url("@/assets/images/按钮3.png") center/contain no-repeat !important;
  color: white !important; /* 文字颜色 */
  padding: 6px 34px !important;
  border-radius: 8px !important;
  cursor: pointer !important;
  font-size: 14px !important;
  transition: all 0.3s !important;
  white-space: nowrap !important;
  min-width: 100px !important;
  /* 确保内容居中（根据需求调整） */
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
}

/* 选中状态样式（切换为选中图片） */
.custom-btn.active {
  background-image: url("@/assets/images/按钮4.png") !important;
}

.drawer-content {
 top: 10px;
}

.el-descriptions {
  margin-top: 20px;
}

.cell-item {
  display: flex;
  align-items: center;
  font-size: 14px;
  font-weight: 600;
  color: white;
}

.margin-top {
  margin-top: 0;
}


::v-deep .el-drawer__header .el-drawer__title {
  font-size: 14px !important;
  font-weight: 600;
  color: white !important;
}

::v-deep .el-drawer__header {
  padding: 14px 12px !important;
  background: rgba(14, 52, 98, 0.95) !important;
  border-bottom: 1px solid #e9ecef;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 0;
  font-size: 24px;
}

::v-deep .el-drawer__body{
  background: rgba(14, 52, 98, 0.8);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  padding: 20px;
  font-family: "Microsoft YaHei", sans-serif;
  border: 1px solid rgba(0, 225, 255, 0.5);
}


::v-deep .el-descriptions__table {
  width: 100%; /* 占满抽屉宽度 */
  border-collapse: separate; /* 边框分离，避免重叠 */
  border-spacing: 0; /* 单元格间距清零 */
  background-color: rgba(14, 52, 98, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.2);
}


::v-deep .el-descriptions__row {
  border-bottom: 1px solid rgba(0, 225, 255, 0.2); /* 行底边框，浅色透明 */
}


::v-deep .el-descriptions__row:last-child {
  border-bottom: none;
}

::v-deep .el-descriptions__cell {
  padding: 12px 15px;
  background: rgba(14, 52, 98, 0.8);
}


::v-deep .el-descriptions__cell:last-child {
  border-right: none;
}

::v-deep .el-descriptions .el-descriptions__label {
  background: rgba(14, 52, 98, 0.8) !important;
  font-weight: 600 !important;
  width: 100px !important;
  text-align: left !important;
  padding: 0 10px !important;
}


::v-deep .el-descriptions__content {
  color: #ffffff;
  line-height: 1.6;
}


::v-deep .el-descriptions__row:hover {
  background-color: rgba(0, 225, 255, 0.05);
}

::v-deep .el-descriptions__content {
  color: #ffffff !important; /* 强制设置为白色，确保覆盖其他样式 */
  line-height: 1.6; /* 保持原有行高 */
}

</style>
