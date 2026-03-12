<template>
    <div class="login-container">
        <el-card class="login-card">
            <template #header>
                <h2>{{ isLogin ? '登录' : '注册' }}</h2>
            </template>

            <el-form @submit.prevent="handleSubmit">
                <el-form-item label="邮箱">
                    <el-input v-model="email" type="email" placeholder="请输入邮箱" />
                </el-form-item>

                <el-form-item label="密码">
                    <el-input v-model="password" type="password" placeholder="请输入密码" show-password />
                </el-form-item>
                <el-form-item>
                    <el-button type="primary" native-type="submit" :loading="loading">
                        {{ isLogin ? '登录' : '注册' }}
                    </el-button>
                    <el-button @click="toggleMode">
                        {{ isLogin ? '没有账号？去注册' : '已有账号？去登录' }}
                    </el-button>
                </el-form-item>
            </el-form>
        </el-card>
    </div>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import router from '../router'
import { supabase } from '../lib/supabase'
const email = ref('')
const password = ref('')
const isLogin = ref(true)
const loading = ref(false)

const toggleMode = () => {
    isLogin.value = !isLogin.value
    // 清空输入框（可选）
    email.value = ''
    password.value = ''
}

const handleSubmit = async () => {
    if (!email.value || !password.value) {
        ElMessage.warning('请输入邮箱或密码')
        return
    }
    loading.value = true
    try {
        if (isLogin.value) {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email.value,
                password: password.value
            })
            if (error) throw error
            ElMessage.success('登录成功')
            router.push('/aiHome')

        } else {
            const { data, error } = supabase.auth.signUp({
                email: email.value,
                password: password.value
            })
            ElMessage.success('注册成功')
            loading.value = true
        }
    } catch (error) {
        ElMessage.error(error.message)
    } finally {
        loading.value = false
    }}

</script>

<style scoped>
.login-container {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    background-color: #f5f7fa;
}

.login-card {
    width: 400px;
}
</style>