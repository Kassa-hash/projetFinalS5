<template>
  <div class="dashboard-container">
    <div class="dashboard-header">
      <h1>Dashboard Manager</h1>
      <p>Bienvenue, Administrateur {{ authStore.user?.name }} !</p>
    </div>

    <!-- Onglets de navigation -->
    <div class="tabs-navigation">
      <button 
        :class="['tab-btn', { active: activeTab === 'users' }]"
        @click="activeTab = 'users'"
      >
        <span class="tab-icon">👥</span>
        Gestion Utilisateurs
      </button>
      <button 
        :class="['tab-btn', { active: activeTab === 'reports' }]"
        @click="activeTab = 'reports'"
      >
        <span class="tab-icon">🛣️</span>
        Gestion Signalements
      </button>
    </div>

    <div class="dashboard-content">
      <!-- TAB 1: GESTION UTILISATEURS -->
      <div v-if="activeTab === 'users'" class="tab-content">
        <!-- Ajouter nouvel utilisateur -->
        <div class="card">
         
          <router-link v-if="authStore.userRole === 'manager'" to="/register" class="dropdown-item">
                  
                  <h2><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="8.5" cy="7" r="4"></circle>
                    <line x1="20" y1="8" x2="20" y2="14"></line>
                    <line x1="23" y1="11" x2="17" y2="11"></line>
                  </svg> Ajouter un Nouvel Utilisateur</h2>
                </router-link>
        </div>

        <!-- Liste des utilisateurs bloqués -->
        <div class="card">
          <h2>🔒 Utilisateurs Bloqués</h2>
          <div v-if="loading" class="loading-state">
            <p>Chargement des utilisateurs...</p>
          </div>
          <div v-else-if="lockedUsers.length === 0" class="empty-state">
            <p>Aucun utilisateur bloqué</p>
          </div>
          <div v-else class="users-table-container">
            <table class="users-table">
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Email</th>
                  <th>Rôle</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="user in lockedUsers" :key="user.id">
                  <td>{{ user.name }}</td>
                  <td>{{ user.email }}</td>
                  <td><span class="role-badge">{{ user.role }}</span></td>
                  <td><span class="status-badge locked">🔒 Verrouillé</span></td>
                  <td>
                    <button 
                      class="btn-unlock"
                      @click="unlockUser(user.id)"
                      :disabled="unlockedUserIds.includes(user.id)"
                    >
                      {{ unlockedUserIds.includes(user.id) ? '✓ Déverrouillé' : 'Déverrouiller' }}
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Statistiques utilisateurs -->
        <div class="card">
          <h2>📊 Statistiques Utilisateurs</h2>
          <div class="stats-grid">
            <div class="stat">
              <div class="stat-number">{{ userStats.total }}</div>
              <div class="stat-label">Utilisateurs Totaux</div>
            </div>
            <div class="stat">
              <div class="stat-number">{{ userStats.managers }}</div>
              <div class="stat-label">Managers</div>
            </div>
            <div class="stat">
              <div class="stat-number">{{ userStats.locked }}</div>
              <div class="stat-label">Utilisateurs Bloqués</div>
            </div>
            <div class="stat">
              <div class="stat-number">{{ userStats.active }}</div>
              <div class="stat-label">Utilisateurs Actifs</div>
            </div>
          </div>
        </div>
      </div>

      <!-- TAB 2: GESTION SIGNALEMENTS -->
      <div v-if="activeTab === 'reports'" class="tab-content">
        <!-- Modifier signalement -->
        <div class="card">
          <h2>✏️ Gérer les Signalements</h2>
          <div v-if="loadingReports" class="loading-state">
            <p>Chargement des signalements...</p>
          </div>
          <div v-else-if="reportsData.length === 0" class="empty-state">
            <p>Aucun signalement disponible</p>
          </div>
          <div v-else class="reports-list">
            <div 
              v-for="report in reportsData" 
              :key="report.id" 
              class="report-item"
              :class="{ 'expanded': expandedReportId === report.id }"
            >
              <div class="report-header" @click="toggleReportExpand(report.id)">
                <div class="report-title">
                  <h3>{{ report.titre }}</h3>
                  <span class="report-id">#{{ report.id }}</span>
                  <span v-if="report.niveau" class="niveau-badge" :class="getNiveauClass(report.niveau)">
                    📊 Niveau {{ report.niveau }}/10
                  </span>
                </div>
                <div class="report-status">
                  <span :class="['status-badge', report.statut.toLowerCase()]">
                    {{ report.statut }}
                  </span>
                  <span class="progress-indicator">{{ getProgressPercent(report.statut) }}%</span>
                </div>
                <span class="expand-icon">{{ expandedReportId === report.id ? '▼' : '▶' }}</span>
              </div>

              <div v-if="expandedReportId === report.id" class="report-details">
                <!-- Infos générales -->
                <div class="details-section">
                  <h4>Informations Générales</h4>
                  <div class="info-grid-report">
                    <div class="info-field">
                      <label>Description</label>
                      <textarea v-model="report.description" placeholder="Description"></textarea>
                    </div>
                    <div class="info-field">
                      <label>Surface (m²)</label>
                      <input v-model.number="report.surface_m2" type="number" placeholder="0" @input="calculerBudget(report)">
                    </div>
                    <div class="info-field">
                      <label>💰 Prix par m² <span class="auto-badge">Auto</span></label>
                      <input v-model.number="report.prixCalcule" type="number" placeholder="Chargement..." readonly class="readonly-field">
                      <span class="field-hint">Récupéré automatiquement selon le type</span>
                    </div>
                    <div class="info-field">
                      <label>Budget (€) <span class="auto-badge">Auto</span></label>
                      <input v-model.number="report.budget" type="number" placeholder="0" readonly class="readonly-field">
                      <span class="field-hint">Budget = prix/m² × niveau × surface</span>
                    </div>
                    <div class="info-field">
                      <label>Entreprise</label>
                      <input v-model="report.entreprise" type="text" placeholder="Entreprise responsable">
                    </div>
                    <div class="info-field">
                      <label>Type de problème</label>
                      <select v-model="report.type_probleme" @change="chargerPrixEtCalculer(report)">
                        <option value="nid_de_poule">Nid de poule</option>
                        <option value="fissure">Fissure</option>
                        <option value="affaissement">Affaissement</option>
                        <option value="autre">Autre</option>
                      </select>
                    </div>
                    <div class="info-field">
                      <label>Type de route</label>
                      <select v-model="report.type_route" @change="chargerPrixEtCalculer(report)">
                        <option value="route">Route</option>
                        <option value="pont">Pont</option>
                        <option value="trottoir">Trottoir</option>
                        <option value="piste_cyclable">Piste cyclable</option>
                        <option value="autre">Autre</option>
                      </select>
                    </div>
                    <div class="info-field">
                      <label>📊 Niveau de criticité (1-10)</label>
                      <input 
                        v-model.number="report.niveau" 
                        type="number" 
                        min="1" 
                        max="10" 
                        placeholder="1 (faible) à 10 (critique)"
                        @input="validateNiveau(report); calculerBudget(report)"
                      >
                      <span class="niveau-description">{{ getNiveauDescription(report.niveau) }}</span>
                    </div>
                  </div>
                </div>

                <!-- Gestion du statut et avancement -->
                <div class="details-section">
                  <h4>Statut & Avancement</h4>
                  <div class="status-management">
                    <div class="status-select-group">
                      <label>Modifier le statut</label>
                      <select v-model="report.statut" @change="updateReportStatus(report)">
                        <option value="nouveau">Nouveau</option>
                        <option value="en_cours">En cours</option>
                        <option value="termine">Terminé</option>
                      </select>
                    </div>

                    <!-- Barre de progression -->
                    <div class="progress-bar-section">
                      <div class="progress-label">
                        Avancement: <strong>{{ getProgressPercent(report.statut) }}%</strong>
                      </div>
                      <div class="progress-bar">
                        <div 
                          class="progress-fill"
                          :style="{ width: getProgressPercent(report.statut) + '%' }"
                        ></div>
                      </div>
                      <div class="progress-steps">
                        <div :class="['progress-step', { active: getProgressPercent(report.statut) >= 0 }]">
                          <span class="step-label">Nouveau</span>
                          <span class="step-value">0%</span>
                        </div>
                        <div :class="['progress-step', { active: getProgressPercent(report.statut) >= 50 }]">
                          <span class="step-label">En cours</span>
                          <span class="step-value">50%</span>
                        </div>
                        <div :class="['progress-step', { active: getProgressPercent(report.statut) >= 100 }]">
                          <span class="step-label">Terminé</span>
                          <span class="step-value">100%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Gestion des dates par étape -->
                <div class="details-section">
                  <h4>📅 Dates par Étape</h4>
                  <div class="dates-grid">
                    <div class="date-field">
                      <label>📋 Date de signalement</label>
                      <input v-model="report.date_signalement" type="date">
                    </div>
                    <div class="date-field">
                      <label>▶️ Date de début (En cours)</label>
                      <input v-model="report.date_debut" type="date">
                    </div>
                    <div class="date-field">
                      <label>✅ Date de fin (Terminé)</label>
                      <input v-model="report.date_fin" type="date">
                    </div>
                  </div>
                  <div v-if="report.date_signalement && report.date_fin" class="processing-time">
                    <strong>Délai de traitement:</strong> {{ calculateProcessingDays(report) }} jours
                  </div>
                </div>

                <!-- Boutons d'action -->
                <div class="action-buttons">
                  <button class="btn-save" @click="saveReport(report)">💾 Enregistrer</button>
                  <button class="btn-cancel" @click="expandedReportId = null">Fermer</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Statistiques des signalements -->
        <div class="card">
          <h2>📊 Statistiques des Signalements</h2>
          <div class="stats-grid">
            <div class="stat">
              <div class="stat-number">{{ reportStats.total }}</div>
              <div class="stat-label">Signalements Totaux</div>
            </div>
            <div class="stat">
              <div class="stat-number">{{ reportStats.new }}</div>
              <div class="stat-label">Nouveaux</div>
            </div>
            <div class="stat">
              <div class="stat-number">{{ reportStats.inProgress }}</div>
              <div class="stat-label">En cours</div>
            </div>
            <div class="stat">
              <div class="stat-number">{{ reportStats.completed }}</div>
              <div class="stat-label">Terminés</div>
            </div>
          </div>

          <!-- Tableau de délai moyen de traitement -->
          <div class="processing-stats-table">
            <h4>⏱️ Délai Moyen de Traitement</h4>
            <table v-if="processingStats.length > 0" class="stats-table">
              <thead>
                <tr>
                  <th>Type de Problème</th>
                  <th>Délai Moyen</th>
                  <th>Nombre</th>
                  <th>Budget Total</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="stat in processingStats" :key="stat.type">
                  <td>{{ stat.type }}</td>
                  <td class="stat-value">{{ stat.avgDays }} jours</td>
                  <td class="stat-value">{{ stat.count }}</td>
                  <td class="stat-value">{{ stat.totalBudget }}€</td>
                </tr>
              </tbody>
            </table>
            <div v-else class="empty-state">
              <p>Pas de données de traitement disponibles</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import { managerService, type User, type ProblemeRoutier } from '@/services/managerService'
import { prixService } from '@/services/prixService'

const authStore = useAuthStore()
const activeTab = ref<'users' | 'reports'>('users')
const expandedReportId = ref<number | null>(null)
const unlockedUserIds = ref<number[]>([])
const formMessage = ref<{ type: string; text: string } | null>(null)
const loading = ref(false)
const loadingReports = ref(false)

// Données utilisateurs
const newUser = ref({
  name: '',
  email: '',
  password: '',
  phone: '',
  role: ''
})

// Données des utilisateurs bloqués (chargées depuis l'API)
const lockedUsers = ref<User[]>([])
const allUsers = ref<User[]>([])

// Données des signalements (chargées depuis l'API)
const reportsData = ref<ProblemeRoutier[]>([])

// Statistiques utilisateurs (calculées depuis les données réelles)
const userStats = ref({
  total: 0,
  managers: 0,
  locked: 0,
  active: 0
})

// Statistiques signalements
const reportStats = computed(() => ({
  total: reportsData.value.length,
  new: reportsData.value.filter(r => r.statut === 'nouveau').length,
  inProgress: reportsData.value.filter(r => r.statut === 'en_cours').length,
  completed: reportsData.value.filter(r => r.statut === 'termine').length
}))

// Statistiques de délai de traitement
const processingStats = computed(() => {
  return managerService.calculateProcessingStats(reportsData.value)
})

// Charger les données au montage
onMounted(async () => {
  await loadUsersData()
  await loadReportsData()
})

// Charger les données utilisateurs
const loadUsersData = async () => {
  loading.value = true
  try {
    // Charger tous les utilisateurs
    allUsers.value = await managerService.getAllUsers()
    
    // Filtrer les utilisateurs bloqués
    lockedUsers.value = allUsers.value.filter(u => u.account_lockout)
    
    // Charger les statistiques
    userStats.value = await managerService.getUserStats()
  } catch (error: any) {
    console.error('Erreur lors du chargement des utilisateurs:', error)
    formMessage.value = { 
      type: 'error', 
      text: 'Erreur lors du chargement des utilisateurs. Vérifiez que le backend est démarré.' 
    }
    setTimeout(() => {
      formMessage.value = null
    }, 5000)
  } finally {
    loading.value = false
  }
}

// Charger les données des signalements
const loadReportsData = async () => {
  loadingReports.value = true
  try {
    const problemes = await managerService.getAllProblemes()
    
    // Mapper les données du backend vers le format attendu
    reportsData.value = problemes.map(p => ({
      id: p.id_probleme,
      id_probleme: p.id_probleme,
      titre: p.titre,
      description: p.description,
      statut: p.statut,
      surface_m2: p.surface_m2,
      budget: p.budget,
      prixCalcule: 0, // Sera chargé quand on ouvre le signalement
      entreprise: p.entreprise || '',
      type_probleme: p.type_probleme,
      type_route: p.type_route,
      latitude: p.latitude,
      longitude: p.longitude,
      firebase_id: p.firebase_id || null,
      date_signalement: p.date_signalement,
      date_debut: p.date_debut || '',
      date_fin: p.date_fin || '',
      niveau: p.niveau || null
    } as any))
    
    console.log('📊 Signalements chargés:', reportsData.value.length)
  } catch (error: any) {
    console.error('Erreur lors du chargement des signalements:', error)
    formMessage.value = { 
      type: 'error', 
      text: 'Erreur lors du chargement des signalements' 
    }
    setTimeout(() => {
      formMessage.value = null
    }, 5000)
  } finally {
    loadingReports.value = false
  }
}

// Fonctions
const getProgressPercent = (statut: string) => {
  switch (statut) {
    case 'nouveau': return 0
    case 'en_cours': return 50
    case 'termine':
    case 'terminé': return 100
    default: return 0
  }
}

const calculateProcessingDays = (report: any) => {
  if (report.date_signalement && report.date_fin) {
    const start = new Date(report.date_signalement)
    const end = new Date(report.date_fin)
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  }
  return '-'
}

const toggleReportExpand = async (id: number) => {
  const wasExpanded = expandedReportId.value === id
  expandedReportId.value = wasExpanded ? null : id
  
  // Si on ouvre le signalement, charger le prix
  if (!wasExpanded) {
    const report = reportsData.value.find(r => r.id === id)
    if (report) {
      await chargerPrixEtCalculer(report)
    }
  }
}

const addNewUser = async () => {
  if (!newUser.value.name || !newUser.value.email || !newUser.value.role) {
    formMessage.value = { type: 'error', text: 'Veuillez remplir tous les champs obligatoires' }
    return
  }

  if (!newUser.value.password) {
    formMessage.value = { type: 'error', text: 'Le mot de passe est obligatoire' }
    return
  }

  loading.value = true
  try {
    await managerService.createUser(newUser.value)
    formMessage.value = { type: 'success', text: `Utilisateur ${newUser.value.name} ajouté avec succès!` }
    newUser.value = { name: '', email: '', password: '', phone: '', role: '' }
    
    // Recharger les données
    await loadUsersData()
    
    setTimeout(() => {
      formMessage.value = null
    }, 3000)
  } catch (error: any) {
    formMessage.value = { 
      type: 'error', 
      text: error.response?.data?.message || 'Erreur lors de l\'ajout de l\'utilisateur' 
    }
    setTimeout(() => {
      formMessage.value = null
    }, 5000)
  } finally {
    loading.value = false
  }
}

const unlockUser = async (userId: number) => {
  const user = lockedUsers.value.find(u => u.id === userId)
  if (!user) return

  loading.value = true
  try {
    await managerService.unlockUser(user.email)
    unlockedUserIds.value.push(userId)
    
    formMessage.value = { type: 'success', text: `Utilisateur ${user.name} déverrouillé avec succès!` }
    
    // Recharger les données après un court délai
    setTimeout(async () => {
      await loadUsersData()
      formMessage.value = null
    }, 2000)
  } catch (error: any) {
    formMessage.value = { 
      type: 'error', 
      text: error.response?.data?.message || 'Erreur lors du déblocage de l\'utilisateur' 
    }
    setTimeout(() => {
      formMessage.value = null
    }, 5000)
  } finally {
    loading.value = false
  }
}

const updateReportStatus = (report: any) => {
  // Mise à jour automatique des dates selon le statut
  const today = new Date().toISOString().split('T')[0]
  
  if (report.statut === 'en_cours' && !report.date_debut) {
    report.date_debut = today
  }
  if ((report.statut === 'termine' || report.statut === 'terminé') && !report.date_fin) {
    report.date_fin = today
  }
}

const saveReport = async (report: any) => {
  loadingReports.value = true
  try {
    console.log('📝 [SAVE] Avant validation:', { report_id: report.id, report_id_probleme: report.id_probleme })
    
    // Validations des champs obligatoires
    if (!report.titre?.trim()) {
      formMessage.value = { type: 'error', text: 'Le titre est obligatoire' }
      loadingReports.value = false
      return
    }
    if (!report.statut) {
      formMessage.value = { type: 'error', text: 'Le statut est obligatoire' }
      loadingReports.value = false
      return
    }
    if (!report.latitude || !report.longitude) {
      formMessage.value = { type: 'error', text: 'Les coordonnées GPS (latitude/longitude) sont requises' }
      loadingReports.value = false
      return
    }

    // Préparer les données pour l'API
    const updateData: Partial<ProblemeRoutier> = {
      titre: report.titre,
      description: report.description,
      statut: report.statut,
      surface_m2: report.surface_m2,
      budget: report.budget,
      entreprise: report.entreprise,
      type_probleme: report.type_probleme,
      type_route: report.type_route,
      latitude: report.latitude,
      longitude: report.longitude,
      date_signalement: report.date_signalement,
      date_debut: report.date_debut || null,
      date_fin: report.date_fin || null,
      niveau: report.niveau  // ✅ Inclure le niveau
    }

    const reportId = report.id || report.id_probleme
    const firebaseId = report.firebase_id || undefined
    console.log('📤 [SAVE] Envoi au backend:', { id: reportId, firebaseId, data: updateData })
    
    await managerService.updateProbleme(reportId, updateData, firebaseId)
    
    console.log('✅ [SAVE] Succès!')
    formMessage.value = { type: 'success', text: 'Signalement mis à jour avec succès!' }
    
    // Recharger les données
    await loadReportsData()
    
    setTimeout(() => {
      formMessage.value = null
      expandedReportId.value = null
    }, 2000)
  } catch (error: any) {
    console.log('❌ [SAVE ERROR]', error)
    const errorDetails = error.response?.data?.errors || error.response?.data?.message || 'Erreur lors de la mise à jour du signalement'
    console.error('Detailed error:', errorDetails)
    formMessage.value = { 
      type: 'error', 
      text: typeof errorDetails === 'object' ? JSON.stringify(errorDetails) : errorDetails
    }
    setTimeout(() => {
      formMessage.value = null
    }, 5000)
  } finally {
    loadingReports.value = false
  }
}

const getNiveauClass = (niveau: number | null | undefined) => {
  if (!niveau) return ''
  if (niveau <= 3) return 'niveau-faible'
  if (niveau <= 6) return 'niveau-moyen'
  if (niveau <= 8) return 'niveau-eleve'
  return 'niveau-critique'
}

const getNiveauDescription = (niveau: number | null | undefined) => {
  if (!niveau) return 'Aucun niveau défini'
  if (niveau <= 2) return '🟢 Faible - Intervention non urgente'
  if (niveau <= 4) return '🟡 Modéré - À surveiller'
  if (niveau <= 6) return '🟠 Moyen - Intervention souhaitable'
  if (niveau <= 8) return '🔴 Élevé - Intervention nécessaire rapidement'
  return '🚨 CRITIQUE - Intervention d\'urgence requise'
}

const validateNiveau = (report: any) => {
  if (report.niveau < 1) report.niveau = 1
  if (report.niveau > 10) report.niveau = 10
}

// � Charger le prix depuis l'API et calculer le budget
const chargerPrixEtCalculer = async (report: any) => {
  if (!report.type_probleme || !report.type_route) {
    console.warn('Type de problème ou type de route manquant')
    return
  }
  
  try {
    console.log('🔍 [PRIX] Récupération du prix pour:', report.type_probleme, report.type_route)
    const prixData = await prixService.getPrix(report.type_probleme, report.type_route)
    
    if (prixData) {
      report.prixCalcule = prixData.prix
      console.log('✅ [PRIX] Prix récupéré:', prixData.prix, '€/m²')
      calculerBudget(report)
    } else {
      report.prixCalcule = 0
      console.warn('⚠️ [PRIX] Aucun prix trouvé pour cette combinaison')
    }
  } catch (error) {
    console.error('❌ [PRIX] Erreur lors du chargement du prix:', error)
    report.prixCalcule = 0
  }
}

// 💰 Calcul automatique du budget
const calculerBudget = (report: any) => {
  const prixParM2 = Number(report.prixCalcule) || 0
  const niveau = Number(report.niveau) || 0
  const surface = Number(report.surface_m2) || 0
  
  // Formule : budget = prix_par_m2 × niveau × surface_m2
  report.budget = Math.round(prixParM2 * niveau * surface)
  
  console.log('💰 [CALCUL BUDGET]', {
    prix_par_m2: prixParM2,
    niveau: niveau,
    surface_m2: surface,
    budget_calculé: report.budget
  })
}


</script>

<style scoped>
.dashboard-container {
  max-width: 100%;
  margin: 0;
  padding: 2rem 5%;
}

.dashboard-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 3rem 2rem;
  border-radius: 10px;
  margin-bottom: 2rem;
}

.dashboard-header h1 {
  font-size: 3rem;
  margin-bottom: 0.5rem;
}

.dashboard-header p {
  font-size: 1.1rem;
  opacity: 0.9;
}

/* Onglets de navigation */
.tabs-navigation {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  border-bottom: 2px solid #e0e0e0;
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 1.5rem;
  background: transparent;
  border: none;
  border-bottom: 3px solid transparent;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  color: #666;
}

.tab-btn:hover {
  color: #667eea;
}

.tab-btn.active {
  color: #667eea;
  border-bottom-color: #667eea;
}

.tab-icon {
  font-size: 1.3rem;
}

.dashboard-content {
  display: grid;
  gap: 2rem;
}

.tab-content {
  display: grid;
  gap: 2rem;
}

.card {
  background: white;
  padding: 2rem;
  border-radius: 10px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}

.card h2 {
  color: #333;
  margin-bottom: 1.5rem;
  font-size: 1.5rem;
  border-bottom: 2px solid #667eea;
  padding-bottom: 1rem;
}

.card h4 {
  color: #333;
  margin-bottom: 1rem;
  font-size: 1.1rem;
}

/* FORMULAIRE D'AJOUT UTILISATEUR */
.user-form {
  display: grid;
  gap: 1.5rem;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group label {
  font-weight: 600;
  color: #333;
  margin-bottom: 0.5rem;
}

.form-group input,
.form-group select,
.form-group textarea {
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 1rem;
  transition: border-color 0.3s;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 5px rgba(102, 126, 234, 0.3);
}

.btn-primary {
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 5px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  align-self: flex-start;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(102, 126, 234, 0.3);
}

.form-message {
  padding: 1rem;
  border-radius: 5px;
  font-weight: 600;
}

.form-message.success {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.form-message.error {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

/* TABLEAU UTILISATEURS */
.users-table-container {
  overflow-x: auto;
}

.users-table {
  width: 100%;
  border-collapse: collapse;
}

.users-table th,
.users-table td {
  padding: 1rem;
  text-align: left;
  border-bottom: 1px solid #e0e0e0;
}

.users-table th {
  background: #f5f5f5;
  font-weight: 600;
  color: #333;
}

.users-table tr:hover {
  background: #f9f9f9;
}

.role-badge {
  display: inline-block;
  background: #667eea;
  color: white;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 500;
}

.status-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 500;
}

.status-badge.locked {
  background: #f8d7da;
  color: #721c24;
}

.status-badge.nouveau {
  background: #cfe2ff;
  color: #084298;
}

.status-badge.en_cours {
  background: #fff3cd;
  color: #664d03;
}

.status-badge.terminé {
  background: #d1e7dd;
  color: #0f5132;
}

.btn-unlock {
  padding: 0.5rem 1rem;
  background: #28a745;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s;
}

.btn-unlock:hover:not(:disabled) {
  background: #218838;
  transform: translateY(-2px);
}

.btn-unlock:disabled {
  background: #6c757d;
  cursor: not-allowed;
  opacity: 0.7;
}

/* LISTE SIGNALEMENTS */
.reports-list {
  display: grid;
  gap: 1rem;
}

.report-item {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.3s;
}

.report-item:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.report-item.expanded {
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.2);
}

.report-header {
  display: grid;
  grid-template-columns: 1fr auto auto;
  align-items: center;
  gap: 1.5rem;
  padding: 1.5rem;
  background: #f9f9f9;
  cursor: pointer;
  transition: background 0.3s;
}

.report-header:hover {
  background: #f0f0f0;
}

.report-title {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.report-title h3 {
  margin: 0;
  color: #333;
  font-size: 1.1rem;
}

.report-id {
  background: #667eea;
  color: white;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 600;
}

.report-status {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.progress-indicator {
  font-weight: 600;
  color: #667eea;
  min-width: 50px;
}

.expand-icon {
  cursor: pointer;
  transition: transform 0.3s;
}

.report-item.expanded .expand-icon {
  transform: rotate(180deg);
}

.report-details {
  padding: 2rem;
  background: white;
  border-top: 1px solid #e0e0e0;
  display: grid;
  gap: 2rem;
}

.details-section {
  display: grid;
  gap: 1rem;
}

.details-section h4 {
  margin: 0;
  color: #333;
}

.info-grid-report {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.info-field {
  display: flex;
  flex-direction: column;
}

.info-field label {
  font-weight: 600;
  color: #333;
  margin-bottom: 0.5rem;
  font-size: 0.95rem;
}

.info-field input,
.info-field select,
.info-field textarea {
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 0.95rem;
  transition: border-color 0.3s;
}

.info-field textarea {
  min-height: 80px;
  resize: vertical;
}

.info-field input:focus,
.info-field select:focus,
.info-field textarea:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 5px rgba(102, 126, 234, 0.3);
}

/* Champ en lecture seule (budget calculé automatiquement) */
.readonly-field {
  background-color: #f5f5f5;
  cursor: not-allowed;
  color: #666;
}

/* Badge "Auto" pour indiquer un champ automatique */
.auto-badge {
  display: inline-block;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  margin-left: 0.5rem;
  font-weight: 600;
}

/* Hint sous le champ */
.field-hint {
  display: block;
  font-size: 0.8rem;
  color: #888;
  margin-top: 0.3rem;
  font-style: italic;
}


/* GESTION DU STATUT */
.status-management {
  display: grid;
  gap: 1.5rem;
}

.status-select-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-width: 300px;
}

.status-select-group select {
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 1rem;
}

/* BARRE DE PROGRESSION */
.progress-bar-section {
  display: grid;
  gap: 1rem;
}

.progress-label {
  font-weight: 600;
  color: #333;
}

.progress-bar {
  width: 100%;
  height: 30px;
  background: #e0e0e0;
  border-radius: 15px;
  overflow: hidden;
  position: relative;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  transition: width 0.3s;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 10px;
  color: white;
  font-weight: 600;
  font-size: 0.9rem;
}

.progress-steps {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-top: 1rem;
}

.progress-step {
  text-align: center;
  padding: 1rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  background: #f9f9f9;
  transition: all 0.3s;
}

.progress-step.active {
  border-color: #667eea;
  background: #f0f4ff;
}

.step-label {
  display: block;
  font-weight: 600;
  color: #333;
  margin-bottom: 0.5rem;
}

.step-value {
  display: block;
  font-size: 1.5rem;
  color: #667eea;
  font-weight: 700;
}

/* DATES PAR ÉTAPE */
.dates-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.date-field {
  display: flex;
  flex-direction: column;
}

.date-field label {
  font-weight: 600;
  color: #333;
  margin-bottom: 0.5rem;
}

.date-field input {
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 0.95rem;
}

.processing-time {
  padding: 1rem;
  background: #e7f3ff;
  border-left: 4px solid #667eea;
  border-radius: 5px;
  color: #333;
  font-weight: 500;
}

/* BOUTONS D'ACTION */
.action-buttons {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

.btn-save,
.btn-cancel {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 5px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-save {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-save:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(102, 126, 234, 0.3);
}

.btn-cancel {
  background: #e0e0e0;
  color: #333;
}

.btn-cancel:hover {
  background: #d0d0d0;
}

/* STATISTIQUES */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1.5rem;
}

.stat {
  text-align: center;
  padding: 1.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 10px;
}

.stat-number {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.stat-label {
  font-size: 0.9rem;
  opacity: 0.9;
}

/* TABLEAU STATISTIQUES */
.processing-stats-table {
  margin-top: 2rem;
}

.stats-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;
}

.stats-table th,
.stats-table td {
  padding: 1rem;
  text-align: left;
  border-bottom: 1px solid #e0e0e0;
}

.stats-table th {
  background: #f5f5f5;
  font-weight: 600;
  color: #333;
}

.stats-table tr:hover {
  background: #f9f9f9;
}

.stat-value {
  font-weight: 600;
  color: #667eea;
}

/* ÉTAT VIDE */
.empty-state {
  text-align: center;
  padding: 2rem;
  color: #999;
  font-size: 1.1rem;
}

/* ÉTAT DE CHARGEMENT */
.loading-state {
  text-align: center;
  padding: 2rem;
  color: #667eea;
  font-size: 1.1rem;
  font-weight: 600;
}

.loading-state p::after {
  content: '...';
  animation: dots 1.5s steps(4, end) infinite;
}

@keyframes dots {
  0%, 20% { content: ''; }
  40% { content: '.'; }
  60% { content: '..'; }
  80%, 100% { content: '...'; }
}

/* RESPONSIVE */
@media (max-width: 768px) {
  .dashboard-header {
    padding: 2rem;
  }

  .dashboard-header h1 {
    font-size: 1.8rem;
  }

  .tabs-navigation {
    flex-direction: column;
  }

  .tab-btn {
    border-bottom: none;
    border-left: 3px solid transparent;
  }

  .tab-btn.active {
    border-left-color: #667eea;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .info-grid-report {
    grid-template-columns: 1fr;
  }

  .report-header {
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }

  .report-status {
    flex-direction: column;
    align-items: flex-start;
  }

  .dates-grid {
    grid-template-columns: 1fr;
  }

  .progress-steps {
    grid-template-columns: 1fr;
  }

  .action-buttons {
    flex-direction: column;
  }

  .btn-save,
  .btn-cancel {
    width: 100%;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .stats-table {
    font-size: 0.9rem;
  }

  .stats-table th,
  .stats-table td {
    padding: 0.75rem;
  }
}
</style>
