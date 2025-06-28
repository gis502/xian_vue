<template>
  <div class="cesium-container" ref="cesiumContainer">
  </div>
</template>

<script>
import * as Cesium from 'cesium';

export default {
  name: 'CesiumRainMap',
  data() {
    return {
      viewer: null,
      tdtToken: "7f013d0186775b063d6a046977bbefc6",
    }
  },
  computed: {},
  mounted() {
    this.load();
  },
  beforeDestroy() {
    if (this.viewer) {
      this.viewer.destroy();
      this.viewer = null;
    }
  },

  methods: {

    load() {
      Cesium.Ion.defaultAccessToken = '';
      const container = this.$refs.cesiumContainer;
      this.viewer = new Cesium.Viewer(container, {
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

      this.viewer.cesiumWidget.creditContainer.style.display = "none";
      this.loadTDT();
      this.viewer.camera.setView({
        destination: Cesium.Cartesian3.fromDegrees(108.93, 34.27, 1000000),
        orientation: {
          heading: Cesium.Math.toRadians(0),
          pitch: Cesium.Math.toRadians(-90),
          roll: 0.0
        }
      });

    },
    // 加载天地图
    loadTDT(type) {
      //开发用这个
      let layerProvider=new Cesium.WebMapTileServiceImageryProvider({
        url: `http://t0.tianditu.com/img_w/wmts?service=wmts&request=GetTile&version=1.0.0&LAYER=img&tileMatrixSet=w&TileMatrix={TileMatrix}&TileRow={TileRow}&TileCol={TileCol}&style=default&format=tiles&tk=${this.tdtToken}`,
        layer: "tdtBasicLayer",
        style: "default",
        format: "image/jpeg",
        tileMatrixSetID: "GoogleMapsCompatible"
      })
      const tdtCvaProvider = new Cesium.WebMapTileServiceImageryProvider({
        url: `http://{s}.tianditu.gov.cn/cva_w/wmts?service=wmts&request=GetTile&version=1.0.0&LAYER=cva&tileMatrixSet=w&TileMatrix={TileMatrix}&TileRow={TileRow}&TileCol={TileCol}&style=default&format=tiles&tk=${this.tdtToken}`,
        layer: "cva",
        style: "default",
        format: "tiles",
        tileMatrixSetID: "GoogleMapsCompatible",
        subdomains: ['t0', 't1', 't2', 't3', 't4', 't5', 't6', 't7'],
        tileMatrixLabels: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18'],
      });
      this.viewer.imageryLayers.addImageryProvider(layerProvider)
      this.viewer.imageryLayers.addImageryProvider(tdtCvaProvider)
      //开发用这个 end

      //部署内网用这个
      // viewer.imageryLayers.get(0).show = false;
      // let layerProvider = new Cesium.UrlTemplateImageryProvider({
      //   url: 'https://10.22.245.226:8889/kgis/rest/services/GETileMercatorNew/MapServer/tile/{z}/{y}/{x}',
      //   fileExtension: 'png',
      //
      // })
      //部署内网用这个
    }
  }
}
</script>

<style scoped>
.cesium-container {
  width: 100%;
  height: 100vh;
  padding: 0;
  margin: 0;
  position: relative;
  overflow: hidden;
}
</style>
