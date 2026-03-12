<template>
    <div class="project-list">
        <div style="margin-bottom: 20px; display: flex; justify-content: space-between">
            <h2>我的项目</h2>
            <el-button type="primary" @click="handleCreate">新建项目</el-button>
        </div>

        <!-- 项目表格 -->
        <el-table :data="projects" border style="width: 100%" v-loading="loading">
            <el-table-column prop="id" label="ID" width="80" />
            <el-table-column label="项目名称">
                <template #default="{ row }">
                    <el-link type="primary" @click="goToTasks(row)">{{ row.name }}</el-link>
                </template>
            </el-table-column>
            <el-table-column prop="description" label="描述" show-overflow-tooltip />
            <el-table-column prop="created_at" label="创建时间" width="180" />
            <el-table-column label="操作" width="200">
                <template #default="{ row }">
                    <el-button size="small" @click="handleEdit(row)">编辑</el-button>
                    <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
                </template>
            </el-table-column>
        </el-table>

        <!-- 新建/编辑项目对话框 -->
        <el-dialog v-model="dialogVisible" :title="dialogTitle" width="500px">
            <el-form :model="form" label-width="80px">
                <el-form-item label="项目名称" required>
                    <el-input v-model="form.name" placeholder="请输入项目名称" />
                </el-form-item>
                <el-form-item label="项目描述">
                    <el-input v-model="form.description" type="textarea" placeholder="请输入项目描述" />
                </el-form-item>
            </el-form>
            <template #footer>
                <span class="dialog-footer">
                    <el-button @click="dialogVisible = false">取消</el-button>
                    <el-button type="primary" @click="saveProject">确定</el-button>
                </span>
            </template>
        </el-dialog>

        <!-- 分页（mock 数据暂时不需要，但留个位置） -->
        <el-pagination class="pagination" layout="prev, pager, next" :total="projects.length" :page-size="10"
            size="small" />
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'                // 1. 导入 onMounted
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRouter } from 'vue-router'
import { supabase } from '../lib/supabase'

const router = useRouter()
const user = ref(null)
const projects = ref([])
const loading = ref(false)                          // 控制表格加载动画

// 对话框相关
const dialogVisible = ref(false)
const dialogTitle = ref('新建项目')
const form = ref({
    id: null,
    name: '',
    description: ''
})

// ---------- 生命周期：组件挂载后获取用户并加载项目 ----------
onMounted(async () => {
    const result = await supabase.auth.getUser()
    const { data: { user: currentUser } } = result
    user.value = currentUser
    if (user.value) {
        await loadProjects()
    } else {
        router.push('/aiLogin')
    }

})
// ---------- 加载项目列表（从 Supabase 查询） ----------
const loadProjects = async () => {
    loading.value = true
    const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.value.id)          // 只查当前用户的项目
        .order('created_at', { ascending: false }) // 按创建时间倒序

    if (error) {
        ElMessage.error('加载项目失败：' + error.message)
    } else {
        projects.value = data
    }
    loading.value = false
}

// ---------- 跳转到任务列表 ----------
const goToTasks = (row) => {
    router.push(`/project/${row.id}/tasks`)   // 动态路由，需要提前配置
}

// ---------- 打开新建对话框 ----------
const handleCreate = () => {
    dialogTitle.value = '新建项目'
    form.value = { id: null, name: '', description: '' }
    dialogVisible.value = true
}

// ---------- 打开编辑对话框 ----------
const handleEdit = (row) => {
    dialogTitle.value = '编辑项目'
    form.value = { ...row }   // 复制当前行数据，避免直接引用
    dialogVisible.value = true
}

// ---------- 保存项目（新建或编辑） ----------
const saveProject = async () => {
    if (!form.value.name.trim()) {
        ElMessage.warning('项目名称不能为空')
        return
    }
    if (form.value.id) {
        // 编辑模式
        const { error } = await supabase
            .from('projects')
            .update({
                name: form.value.name,
                description: form.value.description
            })
            .eq('id', form.value.id)

        if (error) {
            ElMessage.error('更新失败：' + error.message)
        } else {
            ElMessage.success('更新成功')
            await loadProjects()   // 重新加载列表
        }
    } else {
        // 新建模式
        const { error } = await supabase
            .from('projects')
            .insert([{
                name: form.value.name,
                description: form.value.description,
                user_id: user.value.id
            }])

        if (error) {
            ElMessage.error('创建失败：' + error.message)
        } else {
            ElMessage.success('创建成功')
            await loadProjects()
        }
    }
    dialogVisible.value = false   
}

// ---------- 删除项目 ----------
const handleDelete = (row) => {
    ElMessageBox.confirm(`确定删除项目“${row.name}”吗？`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
    }).then(async () => {
        const { error } = await supabase
            .from('projects')
            .delete()
            .eq('id', row.id)

        if (error) {
            ElMessage.error('删除失败：' + error.message)
        } else {
            ElMessage.success('删除成功')
            await loadProjects()
        }
    }).catch(() => {
        // 用户取消删除，什么都不做
    })
}
</script>

<style scoped>
.project-list {
    padding: 20px;
}

.pagination {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
}
</style>