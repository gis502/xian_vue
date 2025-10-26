// vite.config.js
import { defineConfig, loadEnv } from "file:///H:/xian_vue/node_modules/vite/dist/node/index.js";
import path2 from "path";

// vite/plugins/index.js
import vue from "file:///H:/xian_vue/node_modules/@vitejs/plugin-vue/dist/index.mjs";

// vite/plugins/auto-import.js
import autoImport from "file:///H:/xian_vue/node_modules/unplugin-auto-import/dist/vite.js";
function createAutoImport() {
  return autoImport({
    imports: [
      "vue",
      "vue-router",
      "pinia"
    ],
    dts: false
  });
}

// vite/plugins/svg-icon.js
import { createSvgIconsPlugin } from "file:///H:/xian_vue/node_modules/vite-plugin-svg-icons/dist/index.mjs";
import path from "path";
function createSvgIcon(isBuild) {
  return createSvgIconsPlugin({
    iconDirs: [path.resolve(process.cwd(), "src/assets/icons/svg")],
    symbolId: "icon-[dir]-[name]",
    svgoOptions: isBuild
  });
}

// vite/plugins/compression.js
import compression from "file:///H:/xian_vue/node_modules/vite-plugin-compression/dist/index.mjs";
function createCompression(env) {
  const { VITE_BUILD_COMPRESS } = env;
  const plugin = [];
  if (VITE_BUILD_COMPRESS) {
    const compressList = VITE_BUILD_COMPRESS.split(",");
    if (compressList.includes("gzip")) {
      plugin.push(
        compression({
          ext: ".gz",
          deleteOriginFile: false
        })
      );
    }
    if (compressList.includes("brotli")) {
      plugin.push(
        compression({
          ext: ".br",
          algorithm: "brotliCompress",
          deleteOriginFile: false
        })
      );
    }
  }
  return plugin;
}

// vite/plugins/setup-extend.js
import setupExtend from "file:///H:/xian_vue/node_modules/unplugin-vue-setup-extend-plus/dist/vite.js";
function createSetupExtend() {
  return setupExtend({});
}

// vite/plugins/index.js
import cesium from "file:///H:/xian_vue/node_modules/vite-plugin-cesium/dist/index.mjs";
function createVitePlugins(viteEnv, isBuild = false) {
  const vitePlugins = [vue()];
  vitePlugins.push(createAutoImport());
  vitePlugins.push(createSetupExtend());
  vitePlugins.push(createSvgIcon(isBuild));
  vitePlugins.push(cesium());
  isBuild && vitePlugins.push(...createCompression(viteEnv));
  return vitePlugins;
}

// vite.config.js
var __vite_injected_original_dirname = "H:\\xian_vue";
var vite_config_default = defineConfig(({ mode, command }) => {
  const env = loadEnv(mode, process.cwd());
  const { VITE_APP_ENV } = env;
  return {
    // 部署生产环境和开发环境下的URL。
    // 默认情况下，vite 会假设你的应用是被部署在一个域名的根路径上
    // 例如 https://www.ruoyi.vip/。如果应用被部署在一个子路径上，你就需要用这个选项指定这个子路径。例如，如果你的应用被部署在 https://www.ruoyi.vip/admin/，则设置 baseUrl 为 /admin/。
    base: VITE_APP_ENV === "production" ? "/" : "/",
    plugins: createVitePlugins(env, command === "build"),
    resolve: {
      // https://cn.vitejs.dev/config/#resolve-alias
      alias: {
        // 设置路径
        "~": path2.resolve(__vite_injected_original_dirname, "./"),
        // 设置别名
        "@": path2.resolve(__vite_injected_original_dirname, "./src")
      },
      // https://cn.vitejs.dev/config/#resolve-extensions
      extensions: [".mjs", ".js", ".ts", ".jsx", ".tsx", ".json", ".vue"]
    },
    // vite 相关配置
    server: {
      port: 80,
      host: true,
      open: true,
      cors: true,
      proxy: {
        // https://cn.vitejs.dev/config/#server-proxy
        "/dev-api": {
          // target: 'http://10.22.245.246:8080',
          target: "http://localhost:8080",
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/dev-api/, "")
        },
        "/tdtproxy": {
          target: "http://t0.tianditu.com/",
          changeOrigin: true,
          rewrite: (path3) => path3.replace(/^\/tdtproxy/, "")
        },
        "/prod-api": {
          target: "http://localhost:8080",
          // target: 'http://10.22.245.246:8080',
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/prod-api/, "")
        },
        "/geoserver": {
          target: "http://localhost:8877",
          changeOrigin: true
          // rewrite: (path) => path.replace(/^\/geoserver/, '')
        }
      }
    },
    //fix:error:stdin>:7356:1: warning: "@charset" must be the first rule in the file
    css: {
      postcss: {
        plugins: [
          {
            postcssPlugin: "internal:charset-removal",
            AtRule: {
              charset: (atRule) => {
                if (atRule.name === "charset") {
                  atRule.remove();
                }
              }
            }
          }
        ]
      }
    }
  };
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiLCAidml0ZS9wbHVnaW5zL2luZGV4LmpzIiwgInZpdGUvcGx1Z2lucy9hdXRvLWltcG9ydC5qcyIsICJ2aXRlL3BsdWdpbnMvc3ZnLWljb24uanMiLCAidml0ZS9wbHVnaW5zL2NvbXByZXNzaW9uLmpzIiwgInZpdGUvcGx1Z2lucy9zZXR1cC1leHRlbmQuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJIOlxcXFx4aWFuX3Z1ZVwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiSDpcXFxceGlhbl92dWVcXFxcdml0ZS5jb25maWcuanNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0g6L3hpYW5fdnVlL3ZpdGUuY29uZmlnLmpzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnLCBsb2FkRW52IH0gZnJvbSAndml0ZSdcclxuaW1wb3J0IHBhdGggZnJvbSAncGF0aCdcclxuaW1wb3J0IGNyZWF0ZVZpdGVQbHVnaW5zIGZyb20gJy4vdml0ZS9wbHVnaW5zJ1xyXG5cclxuLy8gaHR0cHM6Ly92aXRlanMuZGV2L2NvbmZpZy9cclxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKCh7IG1vZGUsIGNvbW1hbmQgfSkgPT4ge1xyXG4gIGNvbnN0IGVudiA9IGxvYWRFbnYobW9kZSwgcHJvY2Vzcy5jd2QoKSlcclxuICBjb25zdCB7IFZJVEVfQVBQX0VOViB9ID0gZW52XHJcbiAgcmV0dXJuIHtcclxuICAgIC8vIFx1OTBFOFx1N0Y3Mlx1NzUxRlx1NEVBN1x1NzNBRlx1NTg4M1x1NTQ4Q1x1NUYwMFx1NTNEMVx1NzNBRlx1NTg4M1x1NEUwQlx1NzY4NFVSTFx1MzAwMlxyXG4gICAgLy8gXHU5RUQ4XHU4QkE0XHU2MEM1XHU1MUI1XHU0RTBCXHVGRjBDdml0ZSBcdTRGMUFcdTUwNDdcdThCQkVcdTRGNjBcdTc2ODRcdTVFOTRcdTc1MjhcdTY2MkZcdTg4QUJcdTkwRThcdTdGNzJcdTU3MjhcdTRFMDBcdTRFMkFcdTU3REZcdTU0MERcdTc2ODRcdTY4MzlcdThERUZcdTVGODRcdTRFMEFcclxuICAgIC8vIFx1NEY4Qlx1NTk4MiBodHRwczovL3d3dy5ydW95aS52aXAvXHUzMDAyXHU1OTgyXHU2NzlDXHU1RTk0XHU3NTI4XHU4OEFCXHU5MEU4XHU3RjcyXHU1NzI4XHU0RTAwXHU0RTJBXHU1QjUwXHU4REVGXHU1Rjg0XHU0RTBBXHVGRjBDXHU0RjYwXHU1QzMxXHU5NzAwXHU4OTgxXHU3NTI4XHU4RkQ5XHU0RTJBXHU5MDA5XHU5ODc5XHU2MzA3XHU1QjlBXHU4RkQ5XHU0RTJBXHU1QjUwXHU4REVGXHU1Rjg0XHUzMDAyXHU0RjhCXHU1OTgyXHVGRjBDXHU1OTgyXHU2NzlDXHU0RjYwXHU3Njg0XHU1RTk0XHU3NTI4XHU4OEFCXHU5MEU4XHU3RjcyXHU1NzI4IGh0dHBzOi8vd3d3LnJ1b3lpLnZpcC9hZG1pbi9cdUZGMENcdTUyMTlcdThCQkVcdTdGNkUgYmFzZVVybCBcdTRFM0EgL2FkbWluL1x1MzAwMlxyXG4gICAgYmFzZTogVklURV9BUFBfRU5WID09PSAncHJvZHVjdGlvbicgPyAnLycgOiAnLycsXHJcbiAgICBwbHVnaW5zOiBjcmVhdGVWaXRlUGx1Z2lucyhlbnYsIGNvbW1hbmQgPT09ICdidWlsZCcpLFxyXG4gICAgcmVzb2x2ZToge1xyXG4gICAgICAvLyBodHRwczovL2NuLnZpdGVqcy5kZXYvY29uZmlnLyNyZXNvbHZlLWFsaWFzXHJcbiAgICAgIGFsaWFzOiB7XHJcbiAgICAgICAgLy8gXHU4QkJFXHU3RjZFXHU4REVGXHU1Rjg0XHJcbiAgICAgICAgJ34nOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnLi8nKSxcclxuICAgICAgICAvLyBcdThCQkVcdTdGNkVcdTUyMkJcdTU0MERcclxuICAgICAgICAnQCc6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICcuL3NyYycpXHJcbiAgICAgIH0sXHJcbiAgICAgIC8vIGh0dHBzOi8vY24udml0ZWpzLmRldi9jb25maWcvI3Jlc29sdmUtZXh0ZW5zaW9uc1xyXG4gICAgICBleHRlbnNpb25zOiBbJy5tanMnLCAnLmpzJywgJy50cycsICcuanN4JywgJy50c3gnLCAnLmpzb24nLCAnLnZ1ZSddXHJcbiAgICB9LFxyXG4gICAgLy8gdml0ZSBcdTc2RjhcdTUxNzNcdTkxNERcdTdGNkVcclxuICAgIHNlcnZlcjoge1xyXG4gICAgICBwb3J0OiA4MCxcclxuICAgICAgaG9zdDogdHJ1ZSxcclxuICAgICAgb3BlbjogdHJ1ZSxcclxuICAgICAgY29yczogdHJ1ZSxcclxuICAgICAgcHJveHk6IHtcclxuICAgICAgICAvLyBodHRwczovL2NuLnZpdGVqcy5kZXYvY29uZmlnLyNzZXJ2ZXItcHJveHlcclxuICAgICAgICAnL2Rldi1hcGknOiB7XHJcbiAgICAgICAgICAvLyB0YXJnZXQ6ICdodHRwOi8vMTAuMjIuMjQ1LjI0Njo4MDgwJyxcclxuICAgICAgICAgIHRhcmdldDogJ2h0dHA6Ly9sb2NhbGhvc3Q6ODA4MCcsXHJcbiAgICAgICAgICBjaGFuZ2VPcmlnaW46IHRydWUsXHJcbiAgICAgICAgICByZXdyaXRlOiAocCkgPT4gcC5yZXBsYWNlKC9eXFwvZGV2LWFwaS8sICcnKVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgJy90ZHRwcm94eSc6e1xyXG4gICAgICAgICAgdGFyZ2V0OiAnaHR0cDovL3QwLnRpYW5kaXR1LmNvbS8nLFxyXG4gICAgICAgICAgY2hhbmdlT3JpZ2luOiB0cnVlLFxyXG4gICAgICAgICAgcmV3cml0ZTogKHBhdGgpID0+IHBhdGgucmVwbGFjZSgvXlxcL3RkdHByb3h5LywgJycpLFxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgJy9wcm9kLWFwaSc6IHtcclxuICAgICAgICAgIHRhcmdldDogJ2h0dHA6Ly9sb2NhbGhvc3Q6ODA4MCcsXHJcbiAgICAgICAgICAvLyB0YXJnZXQ6ICdodHRwOi8vMTAuMjIuMjQ1LjI0Njo4MDgwJyxcclxuICAgICAgICAgIGNoYW5nZU9yaWdpbjogdHJ1ZSxcclxuICAgICAgICAgIHJld3JpdGU6IChwKSA9PiBwLnJlcGxhY2UoL15cXC9wcm9kLWFwaS8sICcnKVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgJy9nZW9zZXJ2ZXInOiB7XHJcbiAgICAgICAgICB0YXJnZXQ6ICdodHRwOi8vbG9jYWxob3N0Ojg4NzcnLFxyXG4gICAgICAgICAgY2hhbmdlT3JpZ2luOiB0cnVlLFxyXG4gICAgICAgICAgLy8gcmV3cml0ZTogKHBhdGgpID0+IHBhdGgucmVwbGFjZSgvXlxcL2dlb3NlcnZlci8sICcnKVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfSxcclxuICAgIC8vZml4OmVycm9yOnN0ZGluPjo3MzU2OjE6IHdhcm5pbmc6IFwiQGNoYXJzZXRcIiBtdXN0IGJlIHRoZSBmaXJzdCBydWxlIGluIHRoZSBmaWxlXHJcbiAgICBjc3M6IHtcclxuICAgICAgcG9zdGNzczoge1xyXG4gICAgICAgIHBsdWdpbnM6IFtcclxuICAgICAgICAgIHtcclxuICAgICAgICAgICAgcG9zdGNzc1BsdWdpbjogJ2ludGVybmFsOmNoYXJzZXQtcmVtb3ZhbCcsXHJcbiAgICAgICAgICAgIEF0UnVsZToge1xyXG4gICAgICAgICAgICAgIGNoYXJzZXQ6IChhdFJ1bGUpID0+IHtcclxuICAgICAgICAgICAgICAgIGlmIChhdFJ1bGUubmFtZSA9PT0gJ2NoYXJzZXQnKSB7XHJcbiAgICAgICAgICAgICAgICAgIGF0UnVsZS5yZW1vdmUoKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuICAgICAgICBdXHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcbn0pXHJcbiIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiSDpcXFxceGlhbl92dWVcXFxcdml0ZVxcXFxwbHVnaW5zXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJIOlxcXFx4aWFuX3Z1ZVxcXFx2aXRlXFxcXHBsdWdpbnNcXFxcaW5kZXguanNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0g6L3hpYW5fdnVlL3ZpdGUvcGx1Z2lucy9pbmRleC5qc1wiO2ltcG9ydCB2dWUgZnJvbSAnQHZpdGVqcy9wbHVnaW4tdnVlJ1xyXG5cclxuXHJcbmltcG9ydCBjcmVhdGVBdXRvSW1wb3J0IGZyb20gJy4vYXV0by1pbXBvcnQnXHJcbmltcG9ydCBjcmVhdGVTdmdJY29uIGZyb20gJy4vc3ZnLWljb24nXHJcbmltcG9ydCBjcmVhdGVDb21wcmVzc2lvbiBmcm9tICcuL2NvbXByZXNzaW9uJ1xyXG5pbXBvcnQgY3JlYXRlU2V0dXBFeHRlbmQgZnJvbSAnLi9zZXR1cC1leHRlbmQnXHJcblxyXG5pbXBvcnQgY2VzaXVtIGZyb20gJ3ZpdGUtcGx1Z2luLWNlc2l1bSdcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIGNyZWF0ZVZpdGVQbHVnaW5zKHZpdGVFbnYsIGlzQnVpbGQgPSBmYWxzZSkge1xyXG4gICAgY29uc3Qgdml0ZVBsdWdpbnMgPSBbdnVlKCldXHJcbiAgICB2aXRlUGx1Z2lucy5wdXNoKGNyZWF0ZUF1dG9JbXBvcnQoKSlcclxuXHR2aXRlUGx1Z2lucy5wdXNoKGNyZWF0ZVNldHVwRXh0ZW5kKCkpXHJcbiAgICB2aXRlUGx1Z2lucy5wdXNoKGNyZWF0ZVN2Z0ljb24oaXNCdWlsZCkpXHJcbiAgICB2aXRlUGx1Z2lucy5wdXNoKGNlc2l1bSgpKVxyXG5cdGlzQnVpbGQgJiYgdml0ZVBsdWdpbnMucHVzaCguLi5jcmVhdGVDb21wcmVzc2lvbih2aXRlRW52KSlcclxuICAgIHJldHVybiB2aXRlUGx1Z2luc1xyXG59XHJcbiIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiSDpcXFxceGlhbl92dWVcXFxcdml0ZVxcXFxwbHVnaW5zXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJIOlxcXFx4aWFuX3Z1ZVxcXFx2aXRlXFxcXHBsdWdpbnNcXFxcYXV0by1pbXBvcnQuanNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0g6L3hpYW5fdnVlL3ZpdGUvcGx1Z2lucy9hdXRvLWltcG9ydC5qc1wiO2ltcG9ydCBhdXRvSW1wb3J0IGZyb20gJ3VucGx1Z2luLWF1dG8taW1wb3J0L3ZpdGUnXHJcblxyXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBjcmVhdGVBdXRvSW1wb3J0KCkge1xyXG4gICAgcmV0dXJuIGF1dG9JbXBvcnQoe1xyXG4gICAgICAgIGltcG9ydHM6IFtcclxuICAgICAgICAgICAgJ3Z1ZScsXHJcbiAgICAgICAgICAgICd2dWUtcm91dGVyJyxcclxuICAgICAgICAgICAgJ3BpbmlhJ1xyXG4gICAgICAgIF0sXHJcbiAgICAgICAgZHRzOiBmYWxzZVxyXG4gICAgfSlcclxufVxyXG4iLCAiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIkg6XFxcXHhpYW5fdnVlXFxcXHZpdGVcXFxccGx1Z2luc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiSDpcXFxceGlhbl92dWVcXFxcdml0ZVxcXFxwbHVnaW5zXFxcXHN2Zy1pY29uLmpzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9IOi94aWFuX3Z1ZS92aXRlL3BsdWdpbnMvc3ZnLWljb24uanNcIjtpbXBvcnQgeyBjcmVhdGVTdmdJY29uc1BsdWdpbiB9IGZyb20gJ3ZpdGUtcGx1Z2luLXN2Zy1pY29ucydcclxuaW1wb3J0IHBhdGggZnJvbSAncGF0aCdcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIGNyZWF0ZVN2Z0ljb24oaXNCdWlsZCkge1xyXG4gICAgcmV0dXJuIGNyZWF0ZVN2Z0ljb25zUGx1Z2luKHtcclxuXHRcdGljb25EaXJzOiBbcGF0aC5yZXNvbHZlKHByb2Nlc3MuY3dkKCksICdzcmMvYXNzZXRzL2ljb25zL3N2ZycpXSxcclxuICAgICAgICBzeW1ib2xJZDogJ2ljb24tW2Rpcl0tW25hbWVdJyxcclxuICAgICAgICBzdmdvT3B0aW9uczogaXNCdWlsZFxyXG4gICAgfSlcclxufVxyXG4iLCAiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIkg6XFxcXHhpYW5fdnVlXFxcXHZpdGVcXFxccGx1Z2luc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiSDpcXFxceGlhbl92dWVcXFxcdml0ZVxcXFxwbHVnaW5zXFxcXGNvbXByZXNzaW9uLmpzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9IOi94aWFuX3Z1ZS92aXRlL3BsdWdpbnMvY29tcHJlc3Npb24uanNcIjtpbXBvcnQgY29tcHJlc3Npb24gZnJvbSAndml0ZS1wbHVnaW4tY29tcHJlc3Npb24nXHJcblxyXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBjcmVhdGVDb21wcmVzc2lvbihlbnYpIHtcclxuICAgIGNvbnN0IHsgVklURV9CVUlMRF9DT01QUkVTUyB9ID0gZW52XHJcbiAgICBjb25zdCBwbHVnaW4gPSBbXVxyXG4gICAgaWYgKFZJVEVfQlVJTERfQ09NUFJFU1MpIHtcclxuICAgICAgICBjb25zdCBjb21wcmVzc0xpc3QgPSBWSVRFX0JVSUxEX0NPTVBSRVNTLnNwbGl0KCcsJylcclxuICAgICAgICBpZiAoY29tcHJlc3NMaXN0LmluY2x1ZGVzKCdnemlwJykpIHtcclxuICAgICAgICAgICAgLy8gaHR0cDovL2RvYy5ydW95aS52aXAvcnVveWktdnVlL290aGVyL2ZhcS5odG1sI1x1NEY3Rlx1NzUyOGd6aXBcdTg5RTNcdTUzOEJcdTdGMjlcdTk3NTlcdTYwMDFcdTY1ODdcdTRFRjZcclxuICAgICAgICAgICAgcGx1Z2luLnB1c2goXHJcbiAgICAgICAgICAgICAgICBjb21wcmVzc2lvbih7XHJcbiAgICAgICAgICAgICAgICAgICAgZXh0OiAnLmd6JyxcclxuICAgICAgICAgICAgICAgICAgICBkZWxldGVPcmlnaW5GaWxlOiBmYWxzZVxyXG4gICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgKVxyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoY29tcHJlc3NMaXN0LmluY2x1ZGVzKCdicm90bGknKSkge1xyXG4gICAgICAgICAgICBwbHVnaW4ucHVzaChcclxuICAgICAgICAgICAgICAgIGNvbXByZXNzaW9uKHtcclxuICAgICAgICAgICAgICAgICAgICBleHQ6ICcuYnInLFxyXG4gICAgICAgICAgICAgICAgICAgIGFsZ29yaXRobTogJ2Jyb3RsaUNvbXByZXNzJyxcclxuICAgICAgICAgICAgICAgICAgICBkZWxldGVPcmlnaW5GaWxlOiBmYWxzZVxyXG4gICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgKVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiBwbHVnaW5cclxufVxyXG4iLCAiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIkg6XFxcXHhpYW5fdnVlXFxcXHZpdGVcXFxccGx1Z2luc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiSDpcXFxceGlhbl92dWVcXFxcdml0ZVxcXFxwbHVnaW5zXFxcXHNldHVwLWV4dGVuZC5qc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vSDoveGlhbl92dWUvdml0ZS9wbHVnaW5zL3NldHVwLWV4dGVuZC5qc1wiO2ltcG9ydCBzZXR1cEV4dGVuZCBmcm9tICd1bnBsdWdpbi12dWUtc2V0dXAtZXh0ZW5kLXBsdXMvdml0ZSdcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIGNyZWF0ZVNldHVwRXh0ZW5kKCkge1xyXG4gICAgcmV0dXJuIHNldHVwRXh0ZW5kKHt9KVxyXG59XHJcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBdU4sU0FBUyxjQUFjLGVBQWU7QUFDN1AsT0FBT0EsV0FBVTs7O0FDRHFPLE9BQU8sU0FBUzs7O0FDQUosT0FBTyxnQkFBZ0I7QUFFMVEsU0FBUixtQkFBb0M7QUFDdkMsU0FBTyxXQUFXO0FBQUEsSUFDZCxTQUFTO0FBQUEsTUFDTDtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsSUFDSjtBQUFBLElBQ0EsS0FBSztBQUFBLEVBQ1QsQ0FBQztBQUNMOzs7QUNYNFAsU0FBUyw0QkFBNEI7QUFDalMsT0FBTyxVQUFVO0FBRUYsU0FBUixjQUErQixTQUFTO0FBQzNDLFNBQU8scUJBQXFCO0FBQUEsSUFDOUIsVUFBVSxDQUFDLEtBQUssUUFBUSxRQUFRLElBQUksR0FBRyxzQkFBc0IsQ0FBQztBQUFBLElBQ3hELFVBQVU7QUFBQSxJQUNWLGFBQWE7QUFBQSxFQUNqQixDQUFDO0FBQ0w7OztBQ1RrUSxPQUFPLGlCQUFpQjtBQUUzUSxTQUFSLGtCQUFtQyxLQUFLO0FBQzNDLFFBQU0sRUFBRSxvQkFBb0IsSUFBSTtBQUNoQyxRQUFNLFNBQVMsQ0FBQztBQUNoQixNQUFJLHFCQUFxQjtBQUNyQixVQUFNLGVBQWUsb0JBQW9CLE1BQU0sR0FBRztBQUNsRCxRQUFJLGFBQWEsU0FBUyxNQUFNLEdBQUc7QUFFL0IsYUFBTztBQUFBLFFBQ0gsWUFBWTtBQUFBLFVBQ1IsS0FBSztBQUFBLFVBQ0wsa0JBQWtCO0FBQUEsUUFDdEIsQ0FBQztBQUFBLE1BQ0w7QUFBQSxJQUNKO0FBQ0EsUUFBSSxhQUFhLFNBQVMsUUFBUSxHQUFHO0FBQ2pDLGFBQU87QUFBQSxRQUNILFlBQVk7QUFBQSxVQUNSLEtBQUs7QUFBQSxVQUNMLFdBQVc7QUFBQSxVQUNYLGtCQUFrQjtBQUFBLFFBQ3RCLENBQUM7QUFBQSxNQUNMO0FBQUEsSUFDSjtBQUFBLEVBQ0o7QUFDQSxTQUFPO0FBQ1g7OztBQzNCb1EsT0FBTyxpQkFBaUI7QUFFN1EsU0FBUixvQkFBcUM7QUFDeEMsU0FBTyxZQUFZLENBQUMsQ0FBQztBQUN6Qjs7O0FKSUEsT0FBTyxZQUFZO0FBRUosU0FBUixrQkFBbUMsU0FBUyxVQUFVLE9BQU87QUFDaEUsUUFBTSxjQUFjLENBQUMsSUFBSSxDQUFDO0FBQzFCLGNBQVksS0FBSyxpQkFBaUIsQ0FBQztBQUN0QyxjQUFZLEtBQUssa0JBQWtCLENBQUM7QUFDakMsY0FBWSxLQUFLLGNBQWMsT0FBTyxDQUFDO0FBQ3ZDLGNBQVksS0FBSyxPQUFPLENBQUM7QUFDNUIsYUFBVyxZQUFZLEtBQUssR0FBRyxrQkFBa0IsT0FBTyxDQUFDO0FBQ3RELFNBQU87QUFDWDs7O0FEbEJBLElBQU0sbUNBQW1DO0FBS3pDLElBQU8sc0JBQVEsYUFBYSxDQUFDLEVBQUUsTUFBTSxRQUFRLE1BQU07QUFDakQsUUFBTSxNQUFNLFFBQVEsTUFBTSxRQUFRLElBQUksQ0FBQztBQUN2QyxRQUFNLEVBQUUsYUFBYSxJQUFJO0FBQ3pCLFNBQU87QUFBQTtBQUFBO0FBQUE7QUFBQSxJQUlMLE1BQU0saUJBQWlCLGVBQWUsTUFBTTtBQUFBLElBQzVDLFNBQVMsa0JBQWtCLEtBQUssWUFBWSxPQUFPO0FBQUEsSUFDbkQsU0FBUztBQUFBO0FBQUEsTUFFUCxPQUFPO0FBQUE7QUFBQSxRQUVMLEtBQUtDLE1BQUssUUFBUSxrQ0FBVyxJQUFJO0FBQUE7QUFBQSxRQUVqQyxLQUFLQSxNQUFLLFFBQVEsa0NBQVcsT0FBTztBQUFBLE1BQ3RDO0FBQUE7QUFBQSxNQUVBLFlBQVksQ0FBQyxRQUFRLE9BQU8sT0FBTyxRQUFRLFFBQVEsU0FBUyxNQUFNO0FBQUEsSUFDcEU7QUFBQTtBQUFBLElBRUEsUUFBUTtBQUFBLE1BQ04sTUFBTTtBQUFBLE1BQ04sTUFBTTtBQUFBLE1BQ04sTUFBTTtBQUFBLE1BQ04sTUFBTTtBQUFBLE1BQ04sT0FBTztBQUFBO0FBQUEsUUFFTCxZQUFZO0FBQUE7QUFBQSxVQUVWLFFBQVE7QUFBQSxVQUNSLGNBQWM7QUFBQSxVQUNkLFNBQVMsQ0FBQyxNQUFNLEVBQUUsUUFBUSxjQUFjLEVBQUU7QUFBQSxRQUM1QztBQUFBLFFBQ0EsYUFBWTtBQUFBLFVBQ1YsUUFBUTtBQUFBLFVBQ1IsY0FBYztBQUFBLFVBQ2QsU0FBUyxDQUFDQSxVQUFTQSxNQUFLLFFBQVEsZUFBZSxFQUFFO0FBQUEsUUFDbkQ7QUFBQSxRQUNBLGFBQWE7QUFBQSxVQUNYLFFBQVE7QUFBQTtBQUFBLFVBRVIsY0FBYztBQUFBLFVBQ2QsU0FBUyxDQUFDLE1BQU0sRUFBRSxRQUFRLGVBQWUsRUFBRTtBQUFBLFFBQzdDO0FBQUEsUUFDQSxjQUFjO0FBQUEsVUFDWixRQUFRO0FBQUEsVUFDUixjQUFjO0FBQUE7QUFBQSxRQUVoQjtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUE7QUFBQSxJQUVBLEtBQUs7QUFBQSxNQUNILFNBQVM7QUFBQSxRQUNQLFNBQVM7QUFBQSxVQUNQO0FBQUEsWUFDRSxlQUFlO0FBQUEsWUFDZixRQUFRO0FBQUEsY0FDTixTQUFTLENBQUMsV0FBVztBQUNuQixvQkFBSSxPQUFPLFNBQVMsV0FBVztBQUM3Qix5QkFBTyxPQUFPO0FBQUEsZ0JBQ2hCO0FBQUEsY0FDRjtBQUFBLFlBQ0Y7QUFBQSxVQUNGO0FBQUEsUUFDRjtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbInBhdGgiLCAicGF0aCJdCn0K
