import component from 'element-plus/es/components/tree-select/src/tree-select-option.mjs';
import { createWebHistory, createRouter } from 'vue-router'

/**
 * Note: 路由配置项说明(保留核心注释)
 *
 * hidden: true                     // 当设置 true 时该路由不会在侧边栏出现
 * name:'router-name'               // 设定路由的名字，使用<keep-alive>时必须填写
 * meta : {
 title: 'title'                  // 设置该路由在侧边栏和面包屑中展示的名字
 icon: 'svg-name'                // 设置该路由的图标
 }
 */

// 公共路由
export const constantRoutes = [
  // 添加根路径重定向规则，访问/时跳转到/admins/rain_flood
  {
    path: '/',
    redirect: '/admins/rain_flood'
  },
  // 首页路由，使用@/views/index.vue替代默认Layout
  {
    path: '/admins/',
    component: () => import('@/views/index.vue'),
    redirect: '/rain_flood',
    name: 'Home',
    children: [
      {
        path: 'rain_flood',
        component: () => import('@/views/Rain_Flood'),
        name: 'Rain_Flood',
      },
      {
        path: 'earthquake_landslide',
        component: () => import('@/views/Earthquake_Landslide'),
        name: 'Earthquake_Landslide'
      },
      {
        path: 'graph',
        component: () => import('@/views/graph'),
        name: 'graph'
      },
      {
        path: 'scenario_simulation',
        component: () => import('@/views/MultihazardDisasterChainAnalysis/ScenarioSimulation/catalog.vue'),
        name: 'Scenario_Simulation'
      },
      {
        path: 'data_management',
        component: () => import('@/views/DataManage'),
        name: 'Data_Management'
      },
      {
        path: 'around_analysis',
        component: () => import('@/views/Around_Analysis'),
        name: 'Around_Analysis'
      },
      {
        path: 'association_analysis',
        component: () => import('@/views/Association_Analysis'),
        name: 'Association_Analysis'
      },
      {
        path: 'earthquake_secondary_disasters',
        component: () => import('@/views/Earthquake_SecondaryDisasters'),
        name: 'Earthquake_Secondary_Disasters'
      },
      {
        path: 'historical_similarity_analysis',
        component: () => import('@/views/MultihazardDisasterChainAnalysis/HistoricalSimilarityAnalysis.vue'),
        name: 'Historical_Similarity_Analysis'
      },
      {
        path: 'disaster_chain',
        component: () => import('@/views/MultihazardDisasterChainAnalysis/DisasterChain.vue'),
        name: 'Disaster_Chain'
      },
      {
        path: 'carrier_information_extraction',
        component: () => import('@/views/CarrierInformationExtraction/Index.vue'),
        name: 'Carrier_Information_Extraction'
      },
      {
        path: '/admins//thdTimeLine/:id/:trigger',
        component: () => import('@/views/MultihazardDisasterChainAnalysis/ScenarioSimulation/thdTimeLine.vue'),
        name: 'thdTimeLine',
        props: true,
        hidden: true
      },
    ]
  },
  {
    path: '/index',
    redirect: '/admins/rain_flood'  // 同时修改/index路径的重定向目标
  },
  // 登录页
  {
    path: '/admins/login',
    component: () => import('@/views/login'),
    hidden: true
  },
  // 404页面
  {
    path: "/:pathMatch(.*)*",
    component: () => import('@/views/error/404'),
    hidden: true
  },
  // 401页面
  {
    path: '/401',
    component: () => import('@/views/error/401'),
    hidden: true
  },
  // 个人中心
  {
    path: '/admins/user',
    hidden: true,
    redirect: 'noredirect',
    children: [
      {
        path: 'profile',
        component: () => import('@/views/system/user/profile/index'),
        name: 'Profile',
        meta: { title: '个人中心', icon: 'user' }
      }
    ]
  }
]

// 动态路由，基于用户权限动态加载
export const dynamicRoutes = [
  // 保留必要的动态路由配置
  {
    path: '/admins/monitor/job-log',
    component: () => import('@/views/index.vue'), // 使用首页组件作为容器
    hidden: true,
    permissions: ['monitor:job:list'],
    children: [
      {
        path: 'admins/index/:jobId(\\d+)',
        component: () => import('@/views/monitor/job/log'),
        name: 'JobLog',
        meta: { title: '调度日志', activeMenu: '/monitor/job' }
      }
    ]
  },
  {
    path: '/admins/tool/gen-edit',
    component: () => import('@/views/index.vue'), // 使用首页组件作为容器
    hidden: true,
    permissions: ['tool:gen:edit'],
    children: [
      {
        path: 'admins/index/:tableId(\\d+)',
        component: () => import('@/views/tool/gen/editTable'),
        name: 'GenEdit',
        meta: { title: '修改生成配置', activeMenu: '/tool/gen' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes: constantRoutes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  },
});

export default router;
