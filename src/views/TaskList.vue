<template>
    <div class="task-list">
        <el-page-header @back="goBack" content="任务列表" />
        <Dashboard ref="dashboardRef" :project-id="projectId" v-if="projectId" />
        <div style="margin: 20px 0; display: flex; justify-content: space-between">
            <h3>项目：{{ projectName }}</h3>
            <el-button type="primary" @click="handleCreateTask">新建任务</el-button>
        </div>
        <!-- 看板容器：三列 -->
        <div class="kanban-board" v-loading="loading || dragging" element-loading-text="更新中...">
            <!-- 待处理列 -->
            <div class="kanban-column">
                <div class="column-header">待处理</div>
                <draggable class="column-content" :list="pendingTasks" group="tasks" item-key="id"
                    @change="handleDragChange($event, 'pending')">
                    <template #item="{ element }">
                        <div class="task-card">
                            <div class="task-title">{{ element.title }}</div>
                            <div class="task-meta">
                                <span v-if="element.due_date">截止: {{ element.due_date }}</span>
                            </div>
                            <div class="task-actions">
                                <el-button size="small" @click="handleEditTask(element)">编辑</el-button>
                                <el-button size="small" type="danger" @click="handleDeleteTask(element)">删除</el-button>
                            </div>
                        </div>
                    </template>
                </draggable>
            </div>
            <!-- 进行中列 -->
            <div class="kanban-column">
                <div class="column-header">进行中</div>
                <draggable class="column-content" :list="doingTasks" group="tasks" item-key="id"
                    @change="handleDragChange($event, 'doing')">
                    <template #item="{ element }">
                        <div class="task-card">
                            <div class="task-title">{{ element.title }}</div>
                            <div class="task-meta">
                                <span v-if="element.due_date">截止: {{ element.due_date }}</span>
                            </div>
                            <div class="task-actions">
                                <el-button size="small" @click="handleEditTask(element)">编辑</el-button>
                                <el-button size="small" type="danger" @click="handleDeleteTask(element)">删除</el-button>
                            </div>
                        </div>
                    </template>
                </draggable>
            </div>
            <!-- 已完成列 -->
            <div class="kanban-column">
                <div class="column-header">已完成</div>
                <draggable class="column-content" :list="doneTasks" group="tasks" item-key="id"
                    @change="handleDragChange($event, 'done')">
                    <template #item="{ element }">
                        <div class="task-card">
                            <div class="task-title">{{ element.title }}</div>
                            <div class="task-meta">
                                <span v-if="element.due_date">截止: {{ element.due_date }}</span>
                            </div>
                            <div class="task-actions">
                                <el-button size="small" @click="handleEditTask(element)">编辑</el-button>
                                <el-button size="small" type="danger" @click="handleDeleteTask(element)">删除</el-button>
                            </div>
                        </div>
                    </template>
                </draggable>
            </div>
        </div>
        <!-- 对话框保持不变 -->
        <el-dialog v-model="dialogVisible" :title="dialogTitle" width="500px">
            <el-form :model="taskForm" label-width="80px">
                <el-form-item label="任务标题" required>
                    <div style="display: flex; gap: 8px;">
                        <el-input v-model="taskForm.title" placeholder="请输入任务标题" />
                        <el-button type="primary" :loading="aiLoading" @click="generateDescription"
                            :disabled="!taskForm.title.trim()">
                            AI 助手
                        </el-button>
                    </div>
                </el-form-item>
                <el-form-item label="状态">
                    <el-select v-model="taskForm.status" placeholder="请选择">
                        <el-option label="待处理" value="pending" />
                        <el-option label="进行中" value="doing" />
                        <el-option label="已完成" value="done" />
                    </el-select>
                </el-form-item>
                <el-form-item label="截止日期">
                    <el-date-picker v-model="taskForm.due_date" type="date" placeholder="选择日期" format="YYYY-MM-DD" />
                </el-form-item>
            </el-form>
            <template #footer>
                <span class="dialog-footer">
                    <el-button @click="dialogVisible = false">取消</el-button>
                    <el-button type="primary" @click="saveTask">确定</el-button>
                </span>
            </template>
        </el-dialog>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { supabase } from '../lib/supabase'
import draggable from 'vuedraggable'
import Dashboard from '../components/Dashboard.vue'
const dashboardRef = ref(null)
const dragging = ref(false)  // 是否正在拖拽更新
const user = ref(null)
const route = useRoute()
const aiLoading = ref(false)
const loading = ref(false)
const router = useRouter()
const projectId = route.params.projectId
const projectName = ref('加载中')
const tasks = ref([])
const dialogVisible = ref(false)
const dialogTitle = ref('新建任务')
onMounted(async () => {
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    user.value = currentUser
    await loadTasks()
})
const taskForm = ref({
    id: null,
    title: '',
    status: 'pending',
    due_date: '',
    description: '',   
})
const pendingTasks = ref([])
const doingTasks = ref([])
const doneTasks = ref([])
const handleDragChange = async (event, targetStatus) => {
    if (event.added) {
        if (dragging.value) return // 如果已经在拖拽中，忽略新的拖拽
        dragging.value = true

        const movedTask = event.added.element
        const originalStatus = movedTask.status
        movedTask.status = targetStatus

        const { error } = await supabase
            .from('tasks')
            .update({ status: targetStatus })
            .eq('id', movedTask.id)

        if (error) {
            ElMessage.error('更新状态失败：' + error.message)
            movedTask.status = originalStatus
            await loadTasks()
        } else {
            dashboardRef.value?.fetchStats()
        }

        dragging.value = false
    }
}

const goBack = () => {
    router.push('/aiHome')
}
const loadTasks = async () => {
    loading.value = true
    //查询
    const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
    if (error) {
        ElMessage.error('加载项目失败：' + error.message)
    } else {
        tasks.value = data
        // 更新列数组
        pendingTasks.value = data.filter(t => t.status === 'pending')
        doingTasks.value = data.filter(t => t.status === 'doing')
        doneTasks.value = data.filter(t => t.status === 'done')
    }

    loading.value = false
    dashboardRef.value?.fetchStats()

}

// AI生成描述函数
const generateDescription = async () => {
  if (!taskForm.value.title.trim()) {
    ElMessage.warning('请先输入任务标题')
    return
  }

  aiLoading.value = true
  try {
    const response = await fetch('/api/generate-description', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: taskForm.value.title })
    })

    const data = await response.json()
    
    if (response.ok) {
      taskForm.value.description = data.description
      ElMessage.success('描述生成成功')
    } else {
      ElMessage.error(data.error || '生成失败')
    }
  } catch (error) {
    ElMessage.error('网络错误：' + error.message)
  } finally {
    aiLoading.value = false
  }
}
// ---------- 打开新建对话框 ----------
const handleCreateTask = () => {
    dialogTitle.value = '新建任务'
    taskForm.value = { id: null, title: '', description: '',status: 'pending', due_date: '' }
    dialogVisible.value = true
}

// ---------- 打开编辑对话框 ----------
const handleEditTask = (row) => {
    dialogTitle.value = '编辑任务'
    taskForm.value = { ...row }  // 复制当前行数据
    dialogVisible.value = true
}
// 删除任务
const handleDeleteTask = (row) => {
    ElMessageBox.confirm(`确定删除任务“${row.title}”吗？`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
    }).then(async () => {
        const { error } = await supabase
            .from('tasks')
            .delete()
            .eq('id', row.id)
        if (error) {
            ElMessage.error('删除失败：' + error.message)
        } else {
            ElMessage.success('删除成功')
            await loadTasks()
            dashboardRef.value?.fetchStats()
        }
    }).catch(() => {
        // 用户取消删除，什么都不做
    })
}

// ---------- 保存项目（新建或编辑） ----------
const saveTask = async () => {
    if (!taskForm.value.title.trim()) {
        ElMessage.warning('任务标题不能为空')
        return
    }
    if (taskForm.value.id) {
        // 编辑模式
        const { error } = await supabase
            .from('tasks')
            .update({
                title: taskForm.value.title,
                status: taskForm.value.status,
                due_date: taskForm.value.due_date,
                description: taskForm.value.description  
            })
            .eq('id', taskForm.value.id)
        if (error) {
            ElMessage.error('更新失败：' + error.message)
        } else {
            ElMessage.success('更新成功')
            await loadTasks()   // 重新任务列表
            dashboardRef.value?.fetchStats()
        }
    } else {
        // 新建模式
        const { error } = await supabase
            .from('tasks')
            .insert([{
                title: taskForm.value.title,
                status: taskForm.value.status,
                due_date: taskForm.value.due_date,
                project_id: projectId,
                assignee_id: user.value?.id,
                description: taskForm.value.description  
            }])
        if (error) {
            ElMessage.error('创建失败：' + error.message)
        } else {
            ElMessage.success('创建成功')
            await loadTasks()
            dashboardRef.value?.fetchStats()
        }
    }
    dialogVisible.value = false
}
</script>

<style scoped>
.task-list {
    padding: 20px;
    background-color: #f8f9fc;
    min-height: 100vh;
}

/* 看板布局 */
.kanban-board {
    display: flex;
    gap: 20px;
    margin-top: 20px;
    min-height: 500px;
}

/* 列容器 */
.kanban-column {
    flex: 1;
    background-color: #f1f5f9;
    border-radius: 16px;
    padding: 16px;
    display: flex;
    flex-direction: column;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    transition: box-shadow 0.2s;
}

.kanban-column:hover {
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.06);
}

/* 列头部 */
.column-header {
    font-weight: 600;
    font-size: 1.1rem;
    padding: 0 8px 12px 8px;
    border-bottom: 2px solid rgba(0, 0, 0, 0.08);
    margin-bottom: 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

/* 任务数量徽章 */
.task-count {
    background-color: rgba(0, 0, 0, 0.04);
    padding: 2px 8px;
    border-radius: 20px;
    font-size: 0.85rem;
    font-weight: normal;
    color: #4b5563;
}

/* 可拖拽区域 */
.column-content {
    flex: 1;
    min-height: 100px;
    transition: background-color 0.2s;
}

/* 任务卡片 */
.task-card {
    background-color: white;
    border-radius: 12px;
    padding: 16px;
    margin-bottom: 12px;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
    border: 1px solid rgba(0, 0, 0, 0.02);
    cursor: move;
    transition: all 0.15s ease;
}

.task-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.08);
    border-color: #d0d9e8;
}

/* 拖拽时的卡片样式 */
.task-card.sortable-ghost {
    opacity: 0.4;
    background-color: #e2e8f0;
    border: 2px dashed #94a3b8;
}

.task-title {
    font-weight: 500;
    font-size: 1rem;
    margin-bottom: 8px;
    color: #1e293b;
}

.task-meta {
    font-size: 0.85rem;
    color: #64748b;
    margin-bottom: 12px;
}

.task-actions {
    display: flex;
    gap: 8px;
    justify-content: flex-end;
}

/* 自定义列头部颜色（可选） */
.kanban-column:nth-child(1) .column-header {
    color: #2563eb;
    /* 待处理蓝色 */
}

.kanban-column:nth-child(2) .column-header {
    color: #b45309;
    /* 进行中橙色 */
}

.kanban-column:nth-child(3) .column-header {
    color: #059669;
    /* 已完成绿色 */
}
</style>