import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import AccueilView from '@/views/AccueilView.vue'
import MapView from '@/views/MapView.vue'
import SignalementsView from '@/views/SignalementsView.vue'

const routes = [
  {
    path: '/',
    name: 'home',
    component: AccueilView
  },
  {
    path: '/carte',
    name: 'carte',
    component: MapView
  },
  {
    path: '/sync-firebase',
    name: 'sync-firebase',
    component: () => import('@/views/SyncFirebaseView.vue')
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
    meta: { requiresAuth: false }
  },
  {
    path: '/dashboard/user',
    component: () => import('@/views/DashboardUserView.vue'),
    meta: { requiresAuth: true, requiredRole: 'user' }
  },
  {
    path: '/dashboard/manager',
    component: () => import('@/views/DashboardManagerView.vue'),
    meta: { requiresAuth: true, requiredRole: 'manager' }
    // meta: { requiresAuth: false}

  },
  {
    path: '/unauthorized',
    component: () => import('@/views/UnauthorizedView.vue')
  },
  {
    path: '/manager',
    name: 'manager',
    component: SignalementsView,
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()

  // Restaurer la session une seule fois au démarrage
  if (!authStore.sessionRestored) {
    await authStore.restoreSession()
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
