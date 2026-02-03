<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from './stores/authStore'
import { useRouter, useRoute } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()

const mobileMenuOpen = ref(false)

const logout = async () => {
  await authStore.logout()
  router.push('/login')
  mobileMenuOpen.value = false
}

const toggleMobileMenu = () => {
  mobileMenuOpen.value = !mobileMenuOpen.value
}

const closeMobileMenu = () => {
  mobileMenuOpen.value = false
}
</script>

<template>
  <div id="app">
    <!-- Navigation Bar -->
    <nav class="navbar">
      <div class="navbar-container">
        <!-- Logo & Brand -->
        <router-link to="/" class="navbar-brand" @click="closeMobileMenu">
          <div class="logo-container">
            <div class="logo-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
            </div>
            <div class="brand-text">
              <span class="brand-name">RouteFix</span>
              <span class="brand-tagline">Madagascar</span>
            </div>
          </div>
        </router-link>

        <!-- Desktop Navigation -->
        <div class="navbar-menu desktop-menu">
          <router-link to="/" class="nav-link" :class="{ active: route.path === '/' }">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
            Accueil
          </router-link>
          
          <router-link to="/carte" class="nav-link" :class="{ active: route.path === '/carte' }">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon>
              <line x1="8" y1="2" x2="8" y2="18"></line>
              <line x1="16" y1="6" x2="16" y2="22"></line>
            </svg>
            Carte & Statistiques
          </router-link>

          <!-- Menu public -->
          <template v-if="!authStore.isAuthenticated">
            <router-link to="/login" class="nav-link btn-login">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
                <polyline points="10 17 15 12 10 7"></polyline>
                <line x1="15" y1="12" x2="3" y2="12"></line>
              </svg>
              Se connecter
            </router-link>
          </template>

          <!-- Menu authentifié -->
          <template v-else>
            <router-link to="/manager" class="nav-link" :class="{ active: route.path === '/manager' }">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 20h9"></path>
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
              </svg>
              Gestion
            </router-link>
            
            <div class="user-dropdown">
              <div class="user-info">
                <div class="user-avatar">
                  {{ authStore.user?.name?.charAt(0)?.toUpperCase() || 'U' }}
                </div>
                <div class="user-details">
                  <span class="user-name">{{ authStore.user?.name }}</span>
                  <span class="user-role">{{ authStore.userRole === 'manager' ? 'Gestionnaire' : 'Utilisateur' }}</span>
                </div>
              </div>
              <div class="dropdown-menu">
                <router-link v-if="authStore.userRole === 'manager'" to="/register" class="dropdown-item">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="8.5" cy="7" r="4"></circle>
                    <line x1="20" y1="8" x2="20" y2="14"></line>
                    <line x1="23" y1="11" x2="17" y2="11"></line>
                  </svg>
                  Créer un compte
                </router-link>
                <button @click="logout" class="dropdown-item logout-item">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                    <polyline points="16 17 21 12 16 7"></polyline>
                    <line x1="21" y1="12" x2="9" y2="12"></line>
                  </svg>
                  Déconnexion
                </button>
              </div>
            </div>
          </template>
        </div>

        <!-- Mobile Menu Button -->
        <button class="mobile-menu-btn" @click="toggleMobileMenu" :class="{ active: mobileMenuOpen }">
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>

      <!-- Mobile Navigation -->
      <transition name="slide-down">
        <div v-if="mobileMenuOpen" class="mobile-menu">
          <router-link to="/" class="mobile-nav-link" @click="closeMobileMenu">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
            Accueil
          </router-link>
          
          <router-link to="/carte" class="mobile-nav-link" @click="closeMobileMenu">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon>
              <line x1="8" y1="2" x2="8" y2="18"></line>
              <line x1="16" y1="6" x2="16" y2="22"></line>
            </svg>
            Carte & Statistiques
          </router-link>

          <template v-if="!authStore.isAuthenticated">
            <router-link to="/login" class="mobile-nav-link login-mobile" @click="closeMobileMenu">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
                <polyline points="10 17 15 12 10 7"></polyline>
                <line x1="15" y1="12" x2="3" y2="12"></line>
              </svg>
              Se connecter
            </router-link>
          </template>

          <template v-else>
            <router-link to="/manager" class="mobile-nav-link" @click="closeMobileMenu">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 20h9"></path>
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
              </svg>
              Gestion des signalements
            </router-link>
            
            <div class="mobile-user-info">
              <div class="user-avatar">
                {{ authStore.user?.name?.charAt(0)?.toUpperCase() || 'U' }}
              </div>
              <div>
                <div class="user-name">{{ authStore.user?.name }}</div>
                <div class="user-role">{{ authStore.userRole === 'manager' ? 'Gestionnaire' : 'Utilisateur' }}</div>
              </div>
            </div>
            
            <router-link v-if="authStore.userRole === 'manager'" to="/register" class="mobile-nav-link" @click="closeMobileMenu">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="8.5" cy="7" r="4"></circle>
                <line x1="20" y1="8" x2="20" y2="14"></line>
                <line x1="23" y1="11" x2="17" y2="11"></line>
              </svg>
              Créer un compte
            </router-link>
            
            <button @click="logout" class="mobile-nav-link logout-mobile">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
              Déconnexion
            </button>
          </template>
        </div>
      </transition>
    </nav>

    <!-- Page Content -->
    <main class="page-content">
      <router-view />
    </main>

    <!-- Footer -->
    <footer class="footer">
      <div class="footer-container">
        <div class="footer-brand">
          <div class="logo-icon small">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
          </div>
          <span>RouteFix Madagascar</span>
        </div>
        <div class="footer-links">
          <a href="#">À propos</a>
          <a href="#">Contact</a>
          <a href="#">Mentions légales</a>
        </div>
        <div class="footer-copy">
          © 2026 RouteFix. Tous droits réservés.
        </div>
      </div>
    </footer>
  </div>
</template>

<style scoped>
* {
  box-sizing: border-box;
}

#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f8fafc;
  margin: 0;
  padding: 0;
  width: 100%;
  max-width: 100vw;
  overflow-x: hidden;
}

/* ==================== NAVBAR ==================== */
.navbar {
  background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  position: sticky;
  top: 0;
  z-index: 1000;
}

.navbar-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.8rem 5%;
  max-width: 1400px;
  margin: 0 auto;
}

/* Logo */
.navbar-brand {
  text-decoration: none;
}

.logo-container {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo-icon {
  width: 42px;
  height: 42px;
  background: linear-gradient(135deg, #f59e0b 0%, #f97316 100%);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.4);
}

.logo-icon svg {
  width: 24px;
  height: 24px;
}

.logo-icon.small {
  width: 28px;
  height: 28px;
}

.logo-icon.small svg {
  width: 16px;
  height: 16px;
}

.brand-text {
  display: flex;
  flex-direction: column;
}

.brand-name {
  font-size: 22px;
  font-weight: 800;
  color: white;
  letter-spacing: -0.5px;
}

.brand-tagline {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.7);
  text-transform: uppercase;
  letter-spacing: 2px;
}

/* Desktop Menu */
.desktop-menu {
  display: flex;
  align-items: center;
  gap: 8px;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 8px;
  color: rgba(255, 255, 255, 0.85);
  text-decoration: none;
  font-weight: 500;
  font-size: 14px;
  padding: 10px 16px;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.nav-link:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.nav-link.active {
  background: rgba(255, 255, 255, 0.15);
  color: white;
}

.nav-link svg {
  opacity: 0.8;
}

.btn-login {
  background: linear-gradient(135deg, #f59e0b 0%, #f97316 100%);
  color: white !important;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
}

.btn-login:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(245, 158, 11, 0.4);
}

/* User Dropdown */
.user-dropdown {
  position: relative;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
}

.user-info:hover {
  background: rgba(255, 255, 255, 0.1);
}

.user-avatar {
  width: 36px;
  height: 36px;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 700;
  font-size: 14px;
}

.user-details {
  display: flex;
  flex-direction: column;
}

.user-name {
  color: white;
  font-weight: 600;
  font-size: 13px;
}

.user-role {
  color: rgba(255, 255, 255, 0.6);
  font-size: 11px;
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 8px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  min-width: 200px;
  padding: 8px;
  opacity: 0;
  visibility: hidden;
  transform: translateY(-10px);
  transition: all 0.2s ease;
}

.user-dropdown:hover .dropdown-menu {
  opacity: 1;
  visibility: visible;
  transform: translateY(0);
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  color: #334155;
  text-decoration: none;
  font-size: 14px;
  border-radius: 8px;
  transition: background 0.2s;
  border: none;
  background: none;
  width: 100%;
  cursor: pointer;
  text-align: left;
}

.dropdown-item:hover {
  background: #f1f5f9;
}

.dropdown-item svg {
  color: #64748b;
}

.logout-item {
  color: #dc2626;
}

.logout-item:hover {
  background: #fef2f2;
}

.logout-item svg {
  color: #dc2626;
}

/* Mobile Menu Button */
.mobile-menu-btn {
  display: none;
  flex-direction: column;
  justify-content: space-around;
  width: 28px;
  height: 24px;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0;
}

.mobile-menu-btn span {
  width: 100%;
  height: 3px;
  background: white;
  border-radius: 2px;
  transition: all 0.3s ease;
}

.mobile-menu-btn.active span:nth-child(1) {
  transform: rotate(45deg) translate(6px, 6px);
}

.mobile-menu-btn.active span:nth-child(2) {
  opacity: 0;
}

.mobile-menu-btn.active span:nth-child(3) {
  transform: rotate(-45deg) translate(6px, -6px);
}

/* Mobile Menu */
.mobile-menu {
  display: none;
  flex-direction: column;
  padding: 16px 5%;
  background: #1a3654;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.mobile-nav-link {
  display: flex;
  align-items: center;
  gap: 12px;
  color: rgba(255, 255, 255, 0.9);
  text-decoration: none;
  padding: 14px 16px;
  border-radius: 8px;
  font-size: 15px;
  transition: background 0.2s;
  border: none;
  background: none;
  width: 100%;
  text-align: left;
  cursor: pointer;
}

.mobile-nav-link:hover {
  background: rgba(255, 255, 255, 0.1);
}

.login-mobile {
  background: linear-gradient(135deg, #f59e0b 0%, #f97316 100%);
  margin-top: 8px;
}

.mobile-user-info {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  margin: 8px 0;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
}

.logout-mobile {
  color: #fca5a5;
  margin-top: 8px;
}

/* Slide animation */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
}

.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

/* ==================== PAGE CONTENT ==================== */
.page-content {
  flex: 1;
  padding: 0;
  max-width: 100%;
}

/* ==================== FOOTER ==================== */
.footer {
  background: #1e293b;
  color: #94a3b8;
  padding: 24px 5%;
  margin-top: auto;
}

.footer-container {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

.footer-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  color: white;
  font-weight: 600;
}

.footer-links {
  display: flex;
  gap: 24px;
}

.footer-links a {
  color: #94a3b8;
  text-decoration: none;
  font-size: 14px;
  transition: color 0.2s;
}

.footer-links a:hover {
  color: white;
}

.footer-copy {
  font-size: 13px;
}

/* ==================== RESPONSIVE ==================== */
@media (max-width: 900px) {
  .desktop-menu {
    display: none;
  }

  .mobile-menu-btn {
    display: flex;
  }

  .mobile-menu {
    display: flex;
  }
}

@media (max-width: 600px) {
  .navbar-container {
    padding: 0.8rem 4%;
  }

  .brand-name {
    font-size: 18px;
  }

  .brand-tagline {
    font-size: 9px;
  }

  .logo-icon {
    width: 36px;
    height: 36px;
  }

  .footer-container {
    flex-direction: column;
    text-align: center;
  }
}
</style>
