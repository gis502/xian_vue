<template>
<div>

</div>
</template>

<script>
import layers from "@/cesium/layers.js";
export default {
  name: "timeLineLayer",
  props: ['viewer','disaterEvent', 'currentTime'],
  watch: {
    disaterEvent() {
      if (this.disaterEvent&&this.disaterEvent.trigger == "地震" ) {
           layers.DrawEllipse(this.disaterEvent.longitude, this.disaterEvent.latitude, this.disaterEvent.magnitude, this.disaterEvent.disaterName)
      }
    },
    viewer() {
      if (this.disaterEvent&&this.disaterEvent.trigger == "地震") {
        layers.DrawEllipse(this.disaterEvent.longitude, this.disaterEvent.latitude, this.disaterEvent.magnitude, this.disaterEvent.disaterName)
      }
    },
  },
  mounted(){
    if(this.disaterEvent&&this.disaterEvent.trigger=="地震" ){
      layers.DrawEllipse(this.disaterEvent.longitude, this.disaterEvent.latitude, this.disaterEvent.magnitude,this.disaterEvent.disaterName)
    }
  },
  method(){

  }
}
</script>

<style scoped>

</style>