<template>
  <div class="button-container">
    <el-button type="primary" @click="drawer = true">
      相似历史灾害匹配
    </el-button>
  </div>

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
        <el-descriptions-item>
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


</template>

<script setup lang="ts" name="historicalDisasterMatch">
import {ref, defineProps, computed} from 'vue'
const drawer = ref(false);
const disasterMatch = ref([]);
const { disasterList, selectDisaster } = defineProps([
    "disasterList",
    "selectDisaster"
]);
console.log("544646446",disasterList)
console.log("selectDisaster",selectDisaster)
for (let i=0;i<disasterList.length; i++){
  if (disasterList[i].disasterType===selectDisaster.disasterType){
    disasterMatch.value.push(disasterList[i])
  }
}
console.log("disasterMatch",disasterMatch.value.length)
</script>

<style scoped lang="scss">
.button-container {
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
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
}

.margin-top {
  margin-top: 0;
}


:deep(.el-drawer__header .el-drawer__title) {
  font-size: 18px;
  font-weight: bold;
}


:deep(.el-drawer__header) {
  padding-top: 16px;
  padding-bottom: 16px;
}
</style>
