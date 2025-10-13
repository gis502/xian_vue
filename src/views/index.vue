<template>
  <div class="index-container">
    <!-- 顶部导航栏 -->
    <nav class="top-nav">
      <img :src="logo" alt="Logo" style="height: 50px;margin-right: 20px;" />
      <div class="nav-btn-group">
        <!-- 暴雨主菜单：基于Pinia状态激活 -->
        <RouterLink 
          to="/rain_flood" 
          class="nav-btn"
          @click="selectMenuStore.setCurrentMainMenu('rain')"
          :class="{ 'nav-btn-active': selectMenuStore.currentMainMenu === 'rain' }"
        >
          暴雨灾害链
        </RouterLink>

        <!-- 地震主菜单：基于Pinia状态激活 -->
        <RouterLink 
          to="/earthquake_landslide" 
          class="nav-btn"
          @click="selectMenuStore.setCurrentMainMenu('earthquake')"
          :class="{ 'nav-btn-active': selectMenuStore.currentMainMenu === 'earthquake' }"
        >
          地震灾害链
        </RouterLink>

        <!-- 其他主菜单：默认精确匹配 -->
        <RouterLink 
          to="/graph" 
          class="nav-btn" 
          active-class="nav-btn-active"
          @click="selectMenuStore.setCurrentMainMenu('')"
        >
          多灾种灾害链分析
        </RouterLink>
        <RouterLink 
          to="/scenario_simulation" 
          class="nav-btn" 
          active-class="nav-btn-active"
          @click="selectMenuStore.setCurrentMainMenu('')"
        >
          灾害链情景推演
        </RouterLink>
        <RouterLink 
          to="/data_management" 
          class="nav-btn" 
          active-class="nav-btn-active"
          @click="selectMenuStore.setCurrentMainMenu('')"
        >
          数据管理
        </RouterLink>
      </div>
    </nav>

    <!-- 底部路由内容区 -->
    <div class="route-content">
      <RouterView />
    </div>

    <!-- 左侧子菜单：暴雨/地震页面均显示所有子菜单 -->
    <div class="left-submenu" v-if="showSubmenu">
      <RouterLink to="/around_analysis" class="submenu-btn" active-class="submenu-btn-active">
        周边分析
      </RouterLink>
      <RouterLink to="/association_analysis" class="submenu-btn" active-class="submenu-btn-active">
        关联分析
      </RouterLink>
      <RouterLink to="/earthquake_secondary_disasters" class="submenu-btn" active-class="submenu-btn-active">
        次生衍生灾害链分析
      </RouterLink>
      <RouterLink to="/historical_similarity_analysis" class="submenu-btn" active-class="submenu-btn-active">
        历史相似性分析
      </RouterLink>
      <RouterLink to="/disaster_chain" class="submenu-btn" active-class="submenu-btn-active">
        灾害链模型库测试
      </RouterLink>
      <RouterLink to="/carrier_information_extraction" class="submenu-btn" active-class="submenu-btn-active">
        承载体信息提取
      </RouterLink>
    </div>
  </div>
</template>

<script setup>
import { computed, watch } from 'vue';
import { RouterLink, RouterView, useRoute } from 'vue-router';
import { useSelectMenuStore } from '@/store/menu/select_menu.js';
import logo from '@/assets/logo/mainlogo.png';

// 初始化Pinia存储
const selectMenuStore = useSelectMenuStore();
// 获取当前路由
const route = useRoute();

// 子菜单显示逻辑
const showSubmenu = computed(() => {
  return ['/rain_flood', '/earthquake_landslide', '/around_analysis', '/association_analysis', '/earthquake_secondary_disasters', '/historical_similarity_analysis', '/disaster_chain'].includes(route.path);
});

// 监听路由变化：当直接通过URL进入暴雨/地震页面时，自动激活对应主菜单
watch(
  () => route.path,
  (newPath) => {
    if (newPath === '/rain_flood') {
      selectMenuStore.setCurrentMainMenu('rain');
    } else if (newPath === '/earthquake_landslide') {
      selectMenuStore.setCurrentMainMenu('earthquake');
    }
    // 子菜单路由不改变主菜单状态（保持当前选中的主菜单）
  },
  { immediate: true }
);
</script>

<style scoped>
/* 样式保持不变 */
.index-container {
  width: 100vw;
  height: 100vh;
  position: relative;
  overflow: hidden;
}

.top-nav {
  width: 100%;
  height: 50px;
  background-image: url('/public/images/background_image.png');
  background-size: cover;
  background-position: center;
  padding: 0 40px;
  box-sizing: border-box;
}

.top-nav img {
  float: left;
}

.nav-btn-group {
  height: 100%;
  display: flex;
  align-items: center;
  margin-left: 20px;
  float: left;
}

.nav-btn {
  color: #fff;
  text-decoration: none;
  padding: 0 20px;
  height: 100%;
  display: flex;
  align-items: center;
  font-size: 16px;
  transition: background-color 0.3s;
}

.nav-btn:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

.nav-btn-active {
  background-color: rgba(255, 255, 255, 0.3);
  font-weight: 600;
  border-bottom: 3px solid #409eff;
}

.route-content {
  width: 100%;
  height: calc(100vh - 50px);
  overflow: auto;
  padding: 0;
  margin: 0;
  box-sizing: border-box;
  background-color: #f5f7fa;
}

.left-submenu {
  position: absolute;
  top: 100px;
  left: 650px;
  z-index: 1000;
  width: 180px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  padding: 15px 0;
}

.submenu-btn {
  color: white;
  padding: 12px 12px;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.3s;
  white-space: nowrap;
  min-width: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 1;
  background-image: url("src/assets/images/按钮5.png");
  background-color: transparent;
  background-size: 100%;
  background-repeat: no-repeat;
  background-position: center;
  border: none;
  box-shadow: none;
  border-radius: 0;
  margin-right: -3px;
  width: 170px;
}

.submenu-btn-active {
  padding: 12px 12px;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.3s;
  white-space: nowrap;
  min-width: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 1;
  background-image: url("src/assets/images/按钮6.png");
  background-color: transparent;
  background-size: 100%;
  background-repeat: no-repeat;
  background-position: center;
  border: none;
  box-shadow: none;
  border-radius: 0;
  margin-right: -3px;
  width: 170px;
}

.submenu-btn:hover {
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

</style>