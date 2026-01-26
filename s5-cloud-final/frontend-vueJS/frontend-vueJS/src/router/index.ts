import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import type { RouteRecordRaw } from 'vue-router'
import MapView from '@/views/MapView.vue';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/views/HomeView.vue')
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/LoginView.vue'),
    meta: { requiresGuest: true }
  },
  {
    path: '/register',
    name: 'register',
    component: () => import('@/views/RegisterView.vue'),
    meta: { requiresAuth: true, requiredRole: 'manager' }
  },
  {
    path: '/dashboard/user',
    name: 'dashboard-user',
    component: () => import('@/views/DashboardUserView.vue'),
    meta: { requiresAuth: true, requiredRole: 'user' }
  },
  {
    path: '/dashboard/manager',
    name: 'dashboard-manager',
    component: () => import('@/views/DashboardManagerView.vue'),
    meta: { requiresAuth: true, requiredRole: 'manager' }
  },
  {
    path: '/unauthorized',
    name: 'unauthorized',
    component: () => import('@/views/UnauthorizedView.vue')
  }
]

const router = createRouter({
   history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'map',
      component: MapView,
    },
  ],
})

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()

  // Récupérer l'utilisateur si le token existe
  if (authStore.token && !authStore.user) {
    await authStore.fetchUser()
  }

  // Vérifier les routes nécessitant l'authentification
  if (to.meta.requiresAuth) {
    if (!authStore.isAuthenticated) {
      next('/login')
      return
    }

    // Vérifier les rôles
    if (to.meta.requiredRole && authStore.userRole !== to.meta.requiredRole) {
      next('/unauthorized')
      return
    }
  }

  // Vérifier les routes pour les invités
  if (to.meta.requiresGuest && authStore.isAuthenticated) {
    next('/dashboard/' + authStore.userRole)
    return
  }

  next()
})

export default router
