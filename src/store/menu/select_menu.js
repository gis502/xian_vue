// src/store/select_menu.js
import { defineStore } from 'pinia'

export const useSelectMenuStore = defineStore('selectMenu', {
  state: () => ({
    // 仅记录当前选中的主菜单标识（'rain'=暴雨，'earthquake'=地震，其他情况为空）
    currentMainMenu: 'rain' // 默认选中暴雨
  }),
  actions: {
    // 更新当前选中的主菜单
    setCurrentMainMenu(menuKey) {
      this.currentMainMenu = menuKey
    }
  }
})