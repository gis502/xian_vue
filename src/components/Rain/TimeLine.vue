<template>
    <div class="timeline-container">
        <!-- 添加雷达反射率图例 -->
        <div class="radar-legend">
            <div class="legend-title">基本反射率</div>
            <div class="legend-unit">dBZ</div>
            <div style="display: flex;flex-direction: row;align-items: center;">
                <div class="legend-items">
                    <div class="legend-item-label" style="background-color: #ae90f0;"></div>
                    <div class="legend-item-label" style="background-color: #9700b2;"></div>
                    <div class="legend-item-label" style="background-color: #ff00f5;"></div>
                    <div class="legend-item-label" style="background-color: #bd0100;"></div>
                    <div class="legend-item-label" style="background-color: #d50100;"></div>
                    <div class="legend-item-label" style="background-color: #fd0200;"></div>
                    <div class="legend-item-label" style="background-color: #ff9300;"></div>
                    <div class="legend-item-label" style="background-color: #ecbf00;"></div>
                    <div class="legend-item-label" style="background-color: #fffe03;"></div>
                    <div class="legend-item-label" style="background-color: #019000;"></div>
                    <div class="legend-item-label" style="background-color: #05d500;"></div>
                    <div class="legend-item-label" style="background-color: #00ecea;"></div>
                    <div class="legend-item-label" style="background-color: #049ef6;"></div>
                </div>
                <div class="legend-items">
                    <div class="legend-item-value"></div>
                    <div class="legend-item-value">70</div>
                    <div class="legend-item-value">65</div>
                    <div class="legend-item-value">60</div>
                    <div class="legend-item-value">55</div>
                    <div class="legend-item-value">50</div>
                    <div class="legend-item-value">45</div>
                    <div class="legend-item-value">40</div>
                    <div class="legend-item-value">35</div>
                    <div class="legend-item-value">30</div>
                    <div class="legend-item-value">25</div>
                    <div class="legend-item-value">20</div>
                    <div class="legend-item-value">15</div>
                    <div class="legend-item-value">10</div>
                </div>
            </div>

        </div>

        <div class="timeline-wrapper">
            <div class="timeline-controls">
                <button class="timeline-btn play-btn" @click="togglePlay">
                    <el-icon v-if="!isPlaying"><video-play /></el-icon>
                    <el-icon v-else><video-pause /></el-icon>
                </button>
            </div>
            <div class="timeline-slider">
                <div class="timeline-track">
                    <div class="timeline-progress" :style="{ width: progressWidth }"></div>
                    <div class="timeline-handle" :style="{ left: progressWidth }"></div>
                    <!-- 添加时间节点标记 -->
                    <div v-for="(time, index) in timeDate" :key="index" class="timeline-node"
                        :style="{ left: `${(index / (timeDate.length - 1)) * 100}%` }" @click="jumpToTime(index)"></div>
                </div>
                <div class="timeline-labels">
                    <span v-for="(time, index) in timeDate" :key="index" class="time-label"
                        :class="{ active: currentTimeIndex === index }" @click="jumpToTime(index)">
                        {{ time }}
                    </span>
                </div>
            </div>
            <div class="timeline-info">
                <span class="current-time">{{ currentTimeDisplay }}</span>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: 'TimeLine',
    props: {
        timeDate: {
            default: []
        }
    },
    computed: {
        progressWidth() {
            return `${(this.currentTimeIndex / (this.timeDate.length - 1)) * 100}%`;
        },
        currentTimeDisplay() {
            return this.timeDate[this.currentTimeIndex] || '无雷达云图';
        }
    },
    data() {
        return {
            // 时间轴相关数据
            isPlaying: false,
            currentTime: 0,
            currentTimeIndex: 0, // 添加当前时间节点索引
        }
    },
    beforeDestroy() {
        this.stopPlayback()
    },

    methods: {
        // 时间轴相关方法
        togglePlay() {
            this.isPlaying = !this.isPlaying;
            if (this.isPlaying) {
                this.startPlayback();
            } else {
                this.stopPlayback();
            }
        },

        startPlayback() {
            this.playbackInterval = setInterval(() => {
                this.currentTimeIndex += 1;
                if (this.currentTimeIndex >= this.timeDate.length) {
                    this.currentTimeIndex = 0;
                }
                this.$emit('radarIndex', this.currentTimeIndex)
            }, 500); // 每秒切换一个时间节点
        },

        stopPlayback() {
            clearInterval(this.playbackInterval);
        },

        // 新增：点击跳转到指定时间节点
        jumpToTime(index) {
            this.currentTimeIndex = index;
            this.$emit('radarIndex', this.currentTimeIndex)
            // 如果正在播放，重新开始播放
            if (this.isPlaying) {
                this.stopPlayback();
                this.startPlayback();
            }
        },

        updateTimelineDisplay() {
            // 这里可以添加根据时间更新地图显示的逻辑
            console.log('当前时间:', this.currentTimeDisplay);
        },
    }
}
</script>

<style scoped>
/* 修改时间轴样式 */
.timeline-container {
    position: fixed;
    bottom: 70px;
    left: 15%;
    width: 65%;
    height: 60px;
    background-color: rgba(0, 0, 0, 0.7);
    padding: 10px;
    z-index: 1000;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    gap: 15px;
    border-radius: 20px;
}

/* 雷达反射率图例样式 */
.radar-legend {
    position: absolute;
    bottom: 70px;
    display: flex;
    flex-direction: column;
    align-items: center;
    flex-shrink: 0;
    background-color: rgba(255, 255, 255, 0.9);
    padding: 8px;
    border-radius: 4px;
    min-width: 80px;
}

.legend-title {
    font-size: 12px;
    font-weight: bold;
    margin-bottom: 2px;
    text-align: center;
}

.legend-unit {
    font-size: 12px;
}

.legend-items {
    display: flex;
    flex-direction: column;
    gap: 1px;
    width: 100%;
    margin: 3px;
}

.legend-item-label {
    height: 12px;
    width: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 9px;
    font-weight: bold;
    color: white;
    text-shadow: 1px 1px 1px rgba(0, 0, 0, 0.5);
    border-radius: 1px;
}

.legend-item-value {
    height: 12px;
    width: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: bold;
    color: black;
    border-radius: 1px;
}

.timeline-wrapper {
    display: flex;
    align-items: center;
    gap: 10px;
    flex: 1;
    height: 100%;
}

.timeline-controls {
    display: flex;
    gap: 5px;
    flex-shrink: 0;
}

.timeline-btn {
    background: none;
    border: none;
    color: white;
    cursor: pointer;
    padding: 5px;
    font-size: 40px;
}

.timeline-btn:hover {
    color: #409EFF;
}

.timeline-slider {
    flex: 1;
    position: relative;
    min-width: 0;
}

.timeline-track {
    height: 4px;
    background-color: rgba(255, 255, 255, 0.3);
    position: relative;
    border-radius: 2px;
    width: 100%;
}

.timeline-progress {
    position: absolute;
    height: 100%;
    background-color: #409EFF;
    border-radius: 2px;
    transition: width 0.3s ease;
}

.timeline-handle {
    position: absolute;
    top: 50%;
    width: 12px;
    height: 12px;
    background-color: #409EFF;
    border-radius: 50%;
    transform: translate(-50%, -50%);
    transition: left 0.3s ease;
    pointer-events: none;
    /* 禁用拖拽 */
}

/* 新增：时间节点样式 */
.timeline-node {
    position: absolute;
    top: 50%;
    width: 8px;
    height: 8px;
    background-color: rgba(255, 255, 255, 0.6);
    border-radius: 50%;
    transform: translate(-50%, -50%);
    cursor: pointer;
    transition: all 0.2s ease;
    z-index: 2;
}

.timeline-node:hover {
    background-color: #409EFF;
    transform: translate(-50%, -50%) scale(1.2);
}

.timeline-labels {
    display: flex;
    justify-content: space-between;
    margin-top: 5px;
    width: 100%;
    overflow: hidden;
}

.time-label {
    color: white;
    font-size: 14px;
    white-space: nowrap;
    flex-shrink: 0;
    text-align: center;
    min-width: 0;
    cursor: pointer;
    padding: 2px 4px;
    border-radius: 3px;
    transition: all 0.2s ease;
}

.time-label:hover {
    background-color: rgba(64, 158, 255, 0.3);
    color: #409EFF;
}

.time-label.active {
    background-color: #409EFF;
    color: white;
    font-weight: bold;
}

/* 响应式显示控制 */
.time-label:nth-child(n+15) {
    display: none;
}

@media (min-width: 1200px) {
    .time-label:nth-child(n+15) {
        display: block;
    }

    .time-label:nth-child(n+20) {
        display: none;
    }
}

@media (min-width: 1600px) {
    .time-label:nth-child(n+20) {
        display: block;
    }
}

.current-time {
    color: white;
}
</style>
