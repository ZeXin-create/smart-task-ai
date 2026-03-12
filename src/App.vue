<script setup>
import { supabase } from './lib/supabase';
import { onMounted } from 'vue'
onMounted(async () => {
  // 测试认证 API 是否可访问（这不需要表）
  const { data: { session }, error } = await supabase.auth.getSession()
  if (error) {
    console.error('Supabase 连接失败:', error)
  } else {
    console.log('Supabase 连接成功，当前会话:', session)
  }
})
</script>

<template>
  <div>
    <router-view></router-view>

  </div>

</template>

<style scoped>
.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}

.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}

.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}
</style>
