<template>
  <div class="unlock-manager-container">
    <div class="unlock-manager-card">
      <h1>Gestion des Comptes Bloqués</h1>
      
      <!-- Messages -->
      <div v-if="successMessage" class="success-message">
        {{ successMessage }}
      </div>
      <div v-if="errorMessage" class="error-message">
        {{ errorMessage }}
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="loading">
        <p>Chargement des comptes bloqués...</p>
      </div>

      <!-- No Locked Accounts -->
      <div v-else-if="lockedAccounts.length === 0" class="no-accounts">
        <p>✅ Aucun compte bloqué actuellement</p>
      </div>

      <!-- Locked Accounts Table -->
      <div v-else class="accounts-section">
        <div class="section-header">
          <h2>{{ lockedAccounts.length }} Compte(s) bloqué(s)</h2>
          <button @click="refreshAccounts" class="btn-refresh">Actualiser</button>
        </div>

        <div class="table-wrapper">
          <table class="accounts-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Nom</th>
                <th>Rôle</th>
                <th>Type de Blocage</th>
                <th>Tentatives</th>
                <th>Débloqué jusqu'à</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="account in lockedAccounts" :key="account.id" class="account-row">
                <td class="email">{{ account.email }}</td>
                <td>{{ account.name }}</td>
                <td>
                  <span class="badge" :class="'role-' + account.role">
                    {{ account.role }}
                  </span>
                </td>
                <td>
                  <span v-if="account.account_lockout" class="badge badge-danger">
                    🔒 Manuel
                  </span>
                  <span v-else class="badge badge-warning">
                    ⛔ Bloqué
                  </span>
                </td>
                <td class="attempts">{{ account.login_attempts }}/3</td>
                <td class="locked-until">
                  <span v-if="account.locked_until">
                    {{ formatDate(account.locked_until) }}
                  </span>
                  <span v-else class="no-expiry">-</span>
                </td>
                <td class="actions">
                  <button
                    @click="unlockAccountById(account.id, account.email)"
                    class="btn-unlock"
                  >
                    Débloquer
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { authService } from '@/services/authService'

interface LockedAccount {
  id: number
  email: string
  name: string
  role: string
  account_lockout: boolean
  login_attempts: number
  locked_until: string | null
}

const lockedAccounts = ref<LockedAccount[]>([])
const loading = ref(false)
const successMessage = ref('')
const errorMessage = ref('')

const loadLockedAccounts = async () => {
  loading.value = true
  errorMessage.value = ''
  try {
    const accounts = await authService.getLockedAccounts()
    lockedAccounts.value = accounts
  } catch (err: any) {
    errorMessage.value = 'Erreur lors du chargement des comptes bloqués'
    console.error(err)
  } finally {
    loading.value = false
  }
}

const refreshAccounts = async () => {
  successMessage.value = ''
  await loadLockedAccounts()
}

const unlockAccountById = async (accountId: number, email: string) => {
  try {
    await authService.unlockAccount(email)
    
    // Enlever immédiatement le compte de la liste
    lockedAccounts.value = lockedAccounts.value.filter(acc => acc.id !== accountId)
    
    successMessage.value = `Compte ${email} débloqué avec succès`
    
    // Vérifier s'il reste des comptes bloqués
    if (lockedAccounts.value.length === 0) {
      setTimeout(() => {
        successMessage.value = ''
      }, 2000)
    }
  } catch (err: any) {
    errorMessage.value = err.response?.data?.message || 'Erreur lors du déblocage'
    console.error(err)
  }
}

const formatDate = (dateString: string): string => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleString('fr-FR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

onMounted(() => {
  loadLockedAccounts()
})
</script>

<style scoped>
.unlock-manager-container {
  padding: 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
}

.unlock-manager-card {
  background: white;
  border-radius: 10px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

h1 {
  color: #333;
  margin-bottom: 2rem;
  font-size: 28px;
}

h2 {
  color: #555;
  font-size: 20px;
  margin: 0;
}

/* Messages */
.success-message {
  background: #d4edda;
  color: #155724;
  padding: 12px 16px;
  border-radius: 5px;
  margin-bottom: 1rem;
  border-left: 4px solid #155724;
}

.error-message {
  background: #f8d7da;
  color: #721c24;
  padding: 12px 16px;
  border-radius: 5px;
  margin-bottom: 1rem;
  border-left: 4px solid #721c24;
}

.loading {
  text-align: center;
  padding: 2rem;
  color: #666;
  font-size: 16px;
}

.no-accounts {
  text-align: center;
  padding: 2rem;
  color: #28a745;
  font-size: 18px;
  background: #f0f9f6;
  border-radius: 5px;
}

/* Section Header */
.accounts-section {
  margin-top: 1.5rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #eee;
}

.btn-refresh {
  background: #667eea;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 5px;
  cursor: pointer;
  font-weight: 600;
  transition: background 0.3s;
}

.btn-refresh:hover {
  background: #5568d3;
}

/* Table */
.table-wrapper {
  overflow-x: auto;
}

.accounts-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;
}

.accounts-table thead {
  background: #f8f9fa;
  border-bottom: 2px solid #ddd;
}

.accounts-table th {
  padding: 12px 8px;
  text-align: left;
  font-weight: 600;
  color: #333;
  font-size: 14px;
  text-transform: uppercase;
}

.accounts-table td {
  padding: 12px 8px;
  border-bottom: 1px solid #eee;
  font-size: 14px;
  color: #666;
}

.account-row:hover {
  background: #f5f5f5;
}

.email {
  font-weight: 500;
  color: #333;
  word-break: break-all;
}

/* Badges */
.badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 3px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
}

.role-user {
  background: #e7f3ff;
  color: #004085;
}

.role-manager {
  background: #fff3cd;
  color: #856404;
}

.badge-danger {
  background: #f8d7da;
  color: #721c24;
}

.badge-warning {
  background: #fff3cd;
  color: #856404;
}

.attempts {
  font-weight: 600;
  color: #d9534f;
}

.locked-until {
  font-size: 13px;
  font-family: monospace;
}

.no-expiry {
  color: #999;
}

/* Actions */
.actions {
  text-align: center;
}

.btn-unlock {
  background: #28a745;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 5px;
  cursor: pointer;
  font-weight: 600;
  font-size: 13px;
  transition: all 0.3s;
  white-space: nowrap;
}

.btn-unlock:hover:not(:disabled) {
  background: #218838;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(40, 167, 69, 0.3);
}

.btn-unlock:disabled {
  background: #6c757d;
  cursor: not-allowed;
  opacity: 0.7;
}

/* Responsive */
@media (max-width: 1024px) {
  .unlock-manager-card {
    padding: 1.5rem;
  }

  .accounts-table {
    font-size: 12px;
  }

  .accounts-table th,
  .accounts-table td {
    padding: 10px 6px;
  }

  .btn-unlock {
    padding: 6px 12px;
    font-size: 12px;
  }
}

@media (max-width: 768px) {
  .unlock-manager-container {
    padding: 1rem;
  }

  .unlock-manager-card {
    padding: 1rem;
  }

  h1 {
    font-size: 22px;
  }

  .section-header {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }

  .btn-refresh {
    width: 100%;
  }

  .accounts-table {
    font-size: 11px;
  }

  .accounts-table th,
  .accounts-table td {
    padding: 8px 4px;
  }

  .btn-unlock {
    padding: 6px 10px;
    font-size: 11px;
  }
}
</style>
