import axios from 'axios';

const apiClient = axios.create({
  baseURL:
    import.meta.env.VITE_API || 'https://qa-azure-search.azurewebsites.net',
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  },
});

export default apiClient;
