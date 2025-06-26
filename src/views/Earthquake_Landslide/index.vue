<template>
  <div id="cesium-container" ref="cesiumContainer"></div>
</template>

<script setup>
import * as Cesium from 'cesium';
import landslide from '@/assets/landslide/landslide.json'
import landslideIcon from '@/assets/images/landslide.png'

const tdtToken = "fc6cb1139b8eed4f79439130eb34eb00"

onMounted(() => {
  load()
});

function load(){
  const viewer = new Cesium.Viewer("cesium-container", {
    imageryProvider: false,
    animation: false,
    homeButton: false,
    navigationHelpButton: false,
    timeline: false,
    selectionIndicator: false,
    sceneModePicker: false,
    infoBox: false,
    geocoder: false,
    vrButton: false,
    fullscreenButton: false,
    baseLayerPicker: false,
  });
  window.viewer = viewer

  loadTDT(0)
  loadLandSlide()
  viewer.cesiumWidget.creditContainer.style.display = "none";

  viewer.camera.setView({
    destination: Cesium.Cartesian3.fromDegrees(108.93, 34.27, 200000),
    orientation: {
      heading: Cesium.Math.toRadians(0),
      pitch: Cesium.Math.toRadians(-90),
      roll: 0.0
    }
  });

}

function loadTDT(type) {

  window.viewer.imageryLayers.removeAll();

  const option = {
    tileMatrixSetID: "w",
    format: "tiles",
    style: "default",
    minimumLevel: 0,
    maximumLevel: 18,
    credit: "Tianditu",
    subdomains: ["t0", "t1", "t2", "t3", "t4", "t5", "t6", "t7"]
  };

  if (type === 0) {
    const imageryProvider = new Cesium.WebMapTileServiceImageryProvider({
      url: `https://{s}.tianditu.gov.cn/img_w/wmts?tk=${tdtToken}`,
      layer: "img",
      ...option
    });

    const annotationProvider = new Cesium.WebMapTileServiceImageryProvider({
      url: `https://{s}.tianditu.gov.cn/cia_w/wmts?tk=${tdtToken}`,
      layer: "cia",
      ...option
    });

    window.viewer.imageryLayers.addImageryProvider(imageryProvider);
    window.viewer.imageryLayers.addImageryProvider(annotationProvider);
  } else if(type === 1){
    const vectorProvider = new Cesium.WebMapTileServiceImageryProvider({
      url: `https://shaanxi.tianditu.gov.cn/ServiceSystem/Tile/rest/service/SxlmgMap/dHfE9g-4JJ2angLq/TileServer`,
      layer: "raster",
      ...option
    });
    window.viewer.imageryLayers.addImageryProvider(vectorProvider);
  } else {
    const vectorProvider = new Cesium.WebMapTileServiceImageryProvider({
      url: `https://{s}.tianditu.gov.cn/vec_w/wmts?tk=cc`,
      layer: "vec",
      ...option
    });
    window.viewer.imageryLayers.addImageryProvider(vectorProvider);
    // const annotationProvider = new Cesium.WebMapTileServiceImageryProvider({
    //   url: `https://{s}.tianditu.gov.cn/cva_w/wmts?tk=${tdtToken}`,
    //   layer: "cva",
    //   ...option
    // });
    // window.viewer.imageryLayers.addImageryProvider(annotationProvider);
  }

}

function loadLandSlide(){
  for(let i=0;i<landslide.length;i++){
    // console.log(landslide[i])
    let lon = landslide[i].lon
    let lat = landslide[i].lat
    window.viewer.entities.add({
      // fromDegrees（经度，纬度，高度，椭球，结果）从以度为单位的经度和纬度值返回Cartesian3位置
      position: Cesium.Cartesian3.fromDegrees(parseFloat(lon), parseFloat(lat)),
      billboard: {
        image: landslideIcon,
        width: 30, // 图片宽度,单位px
        height: 30, // 图片高度，单位px
        eyeOffset: new Cesium.Cartesian3(0, 0, 0), // 与坐标位置的偏移距离
        color: Cesium.Color.WHITE.withAlpha(1), // 固定颜色
        scale: 0.8, // 缩放比例
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND, // 绑定到地形高度
        scaleByDistance: new Cesium.NearFarScalar(500, 1, 5e5, 0.1),
        depthTest: false, // 禁止深度测试
        disableDepthTestDistance: Number.POSITIVE_INFINITY // 不进行深度测试
      },
      properties: {
        data:landslide[i]
      }
    })

    // window.viewer.entities.add({
    //   polygon: {
    //     show: true,
    //     hierarchy: Cesium.Cartesian3.fromDegreesArray([
    //       110.0,
    //       30.0,
    //       120.0,
    //       30.0,
    //       115.0,
    //       40.0,
    //     ]),
    //     height: 100000,
    //     material: Cesium.Color.CYAN.withAlpha(0.5),
    //     outline: true,
    //     outlineColor: Cesium.Color.BLACK,
    //   }
    // })
  }
}

</script>

<style scoped>
#cesium-container {
  width: 100%;
  height: calc(100vh - 84px);
  padding: 0;
  margin: 0;
  position: relative;
}
</style>
