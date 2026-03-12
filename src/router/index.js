import { createWebHistory, createRouter } from 'vue-router'
import AiLogin from '../views/AiLogin.vue'
import AiHome from '../views/AiHome.vue'
import TaskList from '../views/TaskList.vue'
import TestDrag from '../views/TestDrag.vue'
const routes = [
    {
        path: '/',
        redirect: '/aiLogin'
    },
    {
        path: '/aiLogin',
        name: 'AiLogin',
        component: AiLogin
    },
    {
        path: '/aiHome',
        name: 'AiHome',
        component: AiHome
    },
    
      {
        path: '/project/:projectId/tasks',
        name: 'TaskList',
        component: () => import('../views/TaskList.vue'), // 懒加载
        meta: { requiresAuth: true }
    },
    {
        path: '/testDrag',
        name: 'TestDrag',
        component: TestDrag
    },
    
]
export const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes,
})
export default router