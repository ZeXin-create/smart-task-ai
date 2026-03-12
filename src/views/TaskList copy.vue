<template>
    <div class="task-list">
        <el-page-header @back="goBack" content="任务列表" />
        <div style="margin: 20px 0; display: flex; justify-content: space-between">
            <h3>项目：{{ projectName }}</h3>
            <el-button type="primary" @click="handleCreateTask">新建任务</el-button>
        </div>
        <el-table :data="tasks" border style="width: 100%" v-loading="loading">
            <el-table-column prop="id" label="ID" width="80" />
            <el-table-column prop="title" label="任务标题" />
            <el-table-column prop="status" label="状态" width="100">
                <template #default="{ row }">
                    <el-tag :type="row.status === 'done' ? 'success' : 'info'">
                        {{ row.status === 'done' ? '已完成' : '进行中' }}
                    </el-tag>
                </template>
            </el-table-column>
            <el-table-column prop="due_date" label="截止日期" width="120" />
            <el-table-column label="操作" width="200">
                <template #default="{ row }">
                    <el-button size="small" @click="handleEditTask(row)">编辑</el-button>
                    <el-button size="small" type="danger" @click="handleDeleteTask(row)">删除</el-button>
                </template>
            </el-table-column>
        </el-table>
        <el-dialog v-model="dialogVisible" :title="dialogTitle" width="500px">
            <el-form :model="taskForm" label-width="80px">
                <el-form-item label="任务标题" required>
                    <el-input v-model="taskForm.title" placeholder="请输入任务标题" />
                </el-form-item>
                <el-form-item label="状态">
                    <el-select v-model="taskForm.status" placeholder="请选择">
                        <el-option label="进行中" value="pending" />
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
const user = ref(null)
const route = useRoute()
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
    due_date: ''
})
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
    }
    loading.value = false

}
// ---------- 打开新建对话框 ----------
const handleCreateTask = () => {
    dialogTitle.value = '新建任务'
    taskForm.value = { id: null, title: '', status: 'pending', due_date: '' }
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
            })
            .eq('id', taskForm.value.id)
        if (error) {
            ElMessage.error('更新失败：' + error.message)
        } else {
            ElMessage.success('更新成功')
            await loadTasks()   // 重新任务列表
        }
    } else {
        // 新建模式
        const { error } = await supabase
            .from('tasks')
            .insert([{
                title: taskForm.value.title,
                status: taskForm.value.status,
                due_date:taskForm.value.due_date,
                project_id: projectId,
                assignee_id: user.value?.id
            }])
        if (error) {
            ElMessage.error('创建失败：' + error.message)
        } else {
            ElMessage.success('创建成功')
            await loadTasks()
        }
    }
    dialogVisible.value = false
}





</script>

<style scoped>
.task-list {
    padding: 20px;
}
</style>