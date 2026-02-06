import axios from 'axios';

// Configuration de base d'axios
const apiClient = axios.create({
  baseURL: 'http://localhost:8000/api', // URL de ton backend Laravel
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 10000, // 10 secondes
});

// Intercepteur pour gérer les erreurs
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 422) {
      console.error('API Validation Error:', error.response?.data?.errors || error.response?.data?.message);
    } else {
      console.error('API Error:', error);
    }
    return Promise.reject(error);
  }
);

export default apiClient;