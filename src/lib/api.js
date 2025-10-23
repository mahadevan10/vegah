import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://136.112.100.84:8000';

export const api = axios.create({
  baseURL: API_URL,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Health check
export const getHealth = async () => {
  const response = await api.get('/health');
  return response.data;
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
export const queryRAG = async (query, topK = 5) => {
  const response = await api.post('/query', {
    query,
    top_k: topK,
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
  
  // Calculate cost (Groq is free but track for monitoring)
  const estimatedCost = 0; // $0 with free tier
  const groqLimit = 14400; // Daily limit
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
