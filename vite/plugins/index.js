import vue from '@vitejs/plugin-vue'


import createAutoImport from './auto-import'
import createSvgIcon from './svg-icon'
import createCompression from './compression'
import createSetupExtend from './setup-extend'

import cesium from 'vite-plugin-cesium'

export default function createVitePlugins(viteEnv, isBuild = false) {
    const vitePlugins = [vue(
{
            template: {
                compilerOptions: {
                    compatConfig: {
                        MODE: 2  // 启用 Vue2 兼容模式
                    }
                }
            }
        }
    )]
    vitePlugins.push(createAutoImport())
	vitePlugins.push(createSetupExtend())
    vitePlugins.push(createSvgIcon(isBuild))
    vitePlugins.push(cesium())
	isBuild && vitePlugins.push(...createCompression(viteEnv))
    return vitePlugins
}
