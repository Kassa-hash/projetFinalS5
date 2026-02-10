<script setup lang="ts">
import { useAuthStore } from './stores/authStore'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()

const logout = async () => {
  await authStore.logout()
  router.push('/login')
}
</script>

<template>
  <div id="app">
    <!-- Navigation Bar -->
    <nav class="navbar">
      <div class="navbar-container">
        <div class="navbar-brand">
          <router-link to="/" class="brand-link">
            🗺️ Offline Map App
          </router-link>
        </div>

        <div class="navbar-menu">
          <!-- Menu public -->
          <div v-if="!authStore.isAuthenticated" class="nav-links">
              <router-link to="/login" class="nav-link">Connexion</router-link>
          </div>


          <!-- Menu authentifié -->
          <div v-else class="nav-links">
            <span class="user-info">
              {{ authStore.user?.name }} ({{ authStore.userRole }})
            </span>
            <router-link v-if="authStore.userRole == 'manager'" to="/register" class="nav-link">
              Inscription
            </router-link>
            <router-link :to="'/dashboard/' + authStore.userRole" class="nav-link">
              Dashboard
            </router-link>
            <button @click="logout" class="nav-link logout-btn">
              Déconnexion
            </button>
          </div>
        </div>
      </div>
    </nav>

    <!-- Page Content -->
    <main class="page-content">
      <router-view />
    </main>
  </div>
</template>

<style scoped>
* {
  box-sizing: border-box;
}

#app {
  min-height: 100vh;
  background-color: #f5f5f5;
  margin: 0;
  padding: 0;
  width: 100%;
  max-width: 100vw;
  overflow-x: hidden;
  min-width: 320px;
}

.navbar {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  padding: 0;
}

.navbar-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 5%;
  max-width: 100%;
  margin: 0;
}

.navbar-brand {
  flex-shrink: 0;
}

.brand-link {
  font-size: 24px;
  font-weight: 700;
  color: white;
  text-decoration: none;
  transition: opacity 0.3s;
}

.brand-link:hover {
  opacity: 0.8;
}

.navbar-menu {
  display: flex;
  align-items: center;
  gap: 2rem;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.nav-link {
  color: white;
  text-decoration: none;
  font-weight: 500;
  transition: opacity 0.3s;
  cursor: pointer;
  border: none;
  background: none;
  padding: 0;
  font-size: 14px;
}

.nav-link:hover {
  opacity: 0.8;
}

.nav-link.router-link-active {
  border-bottom: 2px solid white;
  padding-bottom: 2px;
}

.user-info {
  color: white;
  font-size: 14px;
  font-weight: 500;
}

.logout-btn {
  padding: 6px 12px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  transition: background 0.3s;
}

.logout-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.page-content {
  padding: 0;
  max-width: 100%;
}

/* Media Queries pour Responsive */
@media (max-width: 768px) {
  .navbar-container {
    flex-direction: column;
    gap: 1rem;
    padding: 1rem 3%;
  }

  .navbar-menu {
    width: 100%;
    justify-content: center;
  }

  .nav-links {
    flex-wrap: wrap;
    justify-content: center;
    gap: 1rem;
  }

  .brand-link {
    font-size: 20px;
  }
}

@media (max-width: 480px) {
  .navbar-container {
    padding: 1rem 2%;
  }

  .nav-link {
    font-size: 12px;
  }

  .user-info {
    font-size: 12px;
  }
}

@media (max-width: 768px) {
  .navbar-container {
    flex-direction: column;
    gap: 1rem;
  }

  .nav-links {
    flex-wrap: wrap;
    justify-content: center;
  }
}
</style>
