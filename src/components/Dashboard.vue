<template>
  <div class="dashboard" v-loading="loading">
    <div class="chart-container" ref="chartRef"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { supabase } from '../lib/supabase'
import * as echarts from 'echarts'

const props = defineProps({
  projectId: {
    type: [String, Number],
    required: true
  }
})

const loading = ref(false)
const chartRef = ref(null)
let chartInstance = null

// 获取统计数据
const fetchStats = async () => {
  loading.value = true
  try {
    // 查询当前项目的所有任务
    const { data, error } = await supabase
      .from('tasks')
      .select('status')
      .eq('project_id', props.projectId)

    if (error) throw error

    // 按状态统计
    const pending = data.filter(t => t.status === 'pending').length
    const doing = data.filter(t => t.status === 'doing').length
    const done = data.filter(t => t.status === 'done').length

    renderChart(pending, doing, done)
  } catch (err) {
    ElMessage.error('获取统计数据失败：' + err.message)
  } finally {
    loading.value = false
  }
}

// 渲染图表
const renderChart = (pending, doing, done) => {
  if (!chartRef.value) return

  if (!chartInstance) {
    chartInstance = echarts.init(chartRef.value)
  }

  const option = {
    title: {
      text: '任务状态分布',
      left: 'center'
    },
    tooltip: {
      trigger: 'item'
    },
    legend: {
      orient: 'vertical',
      left: 'left'
    },
    series: [
      {
        name: '任务状态',
        type: 'pie',
        radius: '50%',
        data: [
          { value: pending, name: '待处理' },
          { value: doing, name: '进行中' },
          { value: done, name: '已完成' }
        ],
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }
    ]
  }

  chartInstance.setOption(option)
}

// 监听 projectId 变化，重新获取数据
watch(() => props.projectId, fetchStats, { immediate: true })

onMounted(() => {
  // 窗口大小变化时自适应
  window.addEventListener('resize', () => {
    chartInstance?.resize()
  })
})
// 暴露方法给父组件
defineExpose({ fetchStats })
</script>

<style scoped>
.dashboard {
  margin-bottom: 20px;
  padding: 20px;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}
.chart-container {
  width: 100%;
  height: 300px;
}
</style>