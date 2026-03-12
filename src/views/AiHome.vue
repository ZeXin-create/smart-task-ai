<template>
  <div class="home">
    <el-container>
      <el-header style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #ddd;">
        <h2>智能任务协作平台</h2>
        <el-button type="danger" @click="logout">退出登录</el-button>
      </el-header>
      <el-main>
        <ProjectList />
      </el-main>
    </el-container>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import ProjectList from './AiProjectList.vue'

const router = useRouter()
const logout = () => {
  // 模拟退出（暂时不调接口）
  ElMessage.success('已退出登录（模拟）')
  router.push('/aiLogin')
}
</script>

<style scoped>
.home {
  height: 100vh;
}
.el-header {
  padding: 0 20px;
}
</style>