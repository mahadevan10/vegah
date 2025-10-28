import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const defaultHeaders = {
  'Content-Type': 'application/json',
};


export const api = axios.create({
  baseURL: API_URL,
  timeout: 120000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Bypass ngrok abuse-prevention interstitial on every request
api.interceptors.request.use((config) => {
  try {
    const base = new URL(config.baseURL || API_URL || '');
    const isNgrok =
      base.hostname.includes('ngrok-free.app') || base.hostname.includes('ngrok.io');

    if (isNgrok) {
      // Always send the special header
      config.headers = {
        ...config.headers,
        'ngrok-skip-browser-warning': 'true',
      };

      // Ensure the bypass query param is present
      const fullBase = new URL(config.baseURL || API_URL);
      const url = new URL(config.url || '', fullBase);
      url.searchParams.set('ngrok-skip-browser-warning', 'true');

      // Preserve any existing params from axios config
      if (config.params) {
        Object.entries(config.params).forEach(([k, v]) => {
          if (v !== undefined && v !== null) url.searchParams.set(k, v);
        });
        config.params = undefined; // move params into the URL we set
      }

      config.url = url.toString();
      config.baseURL = ''; // use the absolute URL we just built
    }
  } catch {
    // no-op
  }
  return config;
});

// Health check
export const getHealth = async () => {
  try {
    const response = await api.get('/health');
    return response.data;
  } catch (error) {
    console.error('❌ Health check error:', error.message);
    if (error.response) {
      console.error('❌ Response status:', error.response.status);
      console.error('❌ Response data:', error.response.data);
    } else if (error.request) {
      console.error('❌ No response received:', error.request);
    }
    throw error;
  }
};

// Get stats
export const getStats = async () => {
  const response = await api.get('/stats');
  return response.data;
};

// Upload documents
export const uploadDocuments = async (files) => {
  const formData = new FormData();
  files.forEach(file => {
    formData.append('files', file);
  });
  
  const response = await api.post('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

// Query RAG
export const queryRAG = async (query, topK = 5, sessionId = 'default') => {
  const response = await api.post('/query', {
    query,
    top_k: topK,
    session_id: sessionId,
  });
  return response.data;
};

// Local storage for tracking
export const saveQueryLog = (query, answer, responseTime) => {
  if (typeof window === 'undefined') return;
  
  const logs = JSON.parse(localStorage.getItem('vegah_query_logs') || '[]');
  logs.push({
    timestamp: new Date().toISOString(),
    query,
    answer,
    responseTime,
  });
  
  // Keep last 100 queries
  if (logs.length > 100) {
    logs.shift();
  }
  
  localStorage.setItem('vegah_query_logs', JSON.stringify(logs));
};

export const getQueryLogs = () => {
  if (typeof window === 'undefined') return [];
  return JSON.parse(localStorage.getItem('vegah_query_logs') || '[]');
};

export const getAnalytics = () => {
  const logs = getQueryLogs();
  
  const totalQueries = logs.length;
  const avgResponseTime = logs.length > 0
    ? logs.reduce((sum, log) => sum + log.responseTime, 0) / logs.length
    : 0;
  
  const estimatedCost = 0;
  const groqLimit = 14400;
  const usagePercent = (totalQueries % groqLimit) / groqLimit * 100;
  
  return {
    totalQueries,
    avgResponseTime: avgResponseTime.toFixed(2),
    estimatedCost,
    groqLimit,
    usagePercent: usagePercent.toFixed(1),
    logs,
  };
};

// Update all fetch calls to include this header
export const checkHealth = async () => {
  const response = await fetch(`${API_URL}/health`, {
    headers: defaultHeaders,
  });
  return response.json();
};

export const uploadFile = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch(`${API_URL}/upload`, {
    method: 'POST',
    headers: {
      'ngrok-skip-browser-warning': 'true',
    },
    body: formData,
  });
  return response.json();
};
