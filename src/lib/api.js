import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const defaultHeaders = {
  'Content-Type': 'application/json',
};

// Create axios instance with default config
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
        config.params = undefined;
      }

      config.url = url.toString();
      config.baseURL = '';
    }
  } catch {
    // no-op
  }
  return config;
});

// =============================================================================
// API ENDPOINTS
// =============================================================================

/**
 * Check API health status
 * @returns {Promise<Object>} Health status including document count and agent readiness
 */
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

/**
 * Get system statistics
 * @returns {Promise<Object>} System stats including indexed documents and retriever status
 */
export const getStats = async () => {
  const response = await api.get('/stats');
  return response.data;
};

/**
 * Get list of all indexed documents
 * @returns {Promise<Object>} List of documents with metadata
 */
export const getDocuments = async () => {
  const response = await api.get('/documents');
  return response.data;
};

/**
 * Upload PDF documents for indexing
 * @param {File[]} files - Array of PDF files to upload
 * @returns {Promise<Object>} Upload response with job_id for status tracking
 */
export const uploadDocuments = async (files) => {
  const formData = new FormData();
  files.forEach(file => {
    formData.append('files', file);
  });
  
  const response = await api.post('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    timeout: 300000, // 5 minutes for large file uploads
  });
  return response.data;
};

/**
 * Check upload job status
 * @param {string} jobId - Job ID from upload response
 * @returns {Promise<Object>} Job status and progress
 */
export const getUploadStatus = async (jobId) => {
  const response = await api.get(`/upload/status/${jobId}`);
  return response.data;
};

/**
 * Query documents using agentic RAG system
 * @param {string} query - User question
 * @param {number} topK - Number of top results to retrieve (default: 5)
 * @param {string} sessionId - Session ID for conversation memory (default: 'default')
 * @param {string[]} docIds - Optional: specific document IDs to query
 * @returns {Promise<Object>} Response with answer, sources, agent_reasoning, and tools_used
 * 
 * Response format:
 * {
 *   answer: string,
 *   sources: Array<{filename: string, page: number | null, is_summary: boolean, preview: string}>,
 *   agent_reasoning: string[], // Step-by-step agent thoughts
 *   tools_used: string[], // Tools the agent used (e.g., "list_all_documents", "search_specific_page")
 *   context_used: string // Summary of context used
 * }
 */
export const queryRAG = async (query, topK = 5, sessionId = 'default', docIds = null) => {
  const payload = {
    query,
    top_k: topK,
    session_id: sessionId,
  };
  
  if (docIds && docIds.length > 0) {
    payload.doc_ids = docIds;
  }
  
  const response = await api.post('/query', payload, {
    timeout: 180000, // 3 minutes for complex queries with agent reasoning
  });
  
  return response.data;
};

/**
 * Clear all documents and embeddings
 * @returns {Promise<Object>} Cleanup confirmation
 */
export const clearAllDocuments = async () => {
  const response = await api.post('/clear');
  return response.data;
};

/**
 * Clear conversation memory for a specific session
 * @param {string} sessionId - Session ID to clear
 * @returns {Promise<Object>} Confirmation message
 */
export const clearSessionMemory = async (sessionId) => {
  const response = await api.post(`/memory/clear/${sessionId}`);
  return response.data;
};

// =============================================================================
// LOCAL STORAGE & ANALYTICS
// =============================================================================

/**
 * Save query log to local storage
 * @param {string} query - User query
 * @param {string} answer - Assistant answer
 * @param {number} responseTime - Response time in milliseconds
 * @param {string[]} toolsUsed - Tools used by agent
 * @param {number} reasoningSteps - Number of reasoning steps
 */
export const saveQueryLog = (query, answer, responseTime, toolsUsed = [], reasoningSteps = 0) => {
  if (typeof window === 'undefined') return;
  
  const logs = JSON.parse(localStorage.getItem('vegah_query_logs') || '[]');
  logs.push({
    timestamp: new Date().toISOString(),
    query,
    answer,
    responseTime,
    toolsUsed, // NEW: Track which tools agent used
    reasoningSteps, // NEW: Track number of reasoning steps
  });
  
  // Keep last 100 queries
  if (logs.length > 100) {
    logs.shift();
  }
  
  localStorage.setItem('vegah_query_logs', JSON.stringify(logs));
};

/**
 * Get query logs from local storage
 * @returns {Array} Array of query logs
 */
export const getQueryLogs = () => {
  if (typeof window === 'undefined') return [];
  return JSON.parse(localStorage.getItem('vegah_query_logs') || '[]');
};

/**
 * Get analytics from query logs
 * @returns {Object} Analytics data including usage stats and tool usage
 */
export const getAnalytics = () => {
  const logs = getQueryLogs();
  
  const totalQueries = logs.length;
  const avgResponseTime = logs.length > 0
    ? logs.reduce((sum, log) => sum + log.responseTime, 0) / logs.length
    : 0;
  
  // Calculate tool usage statistics
  const toolUsage = {};
  logs.forEach(log => {
    if (log.toolsUsed && Array.isArray(log.toolsUsed)) {
      log.toolsUsed.forEach(tool => {
        toolUsage[tool] = (toolUsage[tool] || 0) + 1;
      });
    }
  });
  
  // Calculate average reasoning steps
  const avgReasoningSteps = logs.length > 0
    ? logs.reduce((sum, log) => sum + (log.reasoningSteps || 0), 0) / logs.length
    : 0;
  
  const estimatedCost = 0; // Still $0 with Groq
  const groqLimit = 14400; // Free tier daily limit
  const usagePercent = (totalQueries % groqLimit) / groqLimit * 100;
  
  return {
    totalQueries,
    avgResponseTime: avgResponseTime.toFixed(2),
    avgReasoningSteps: avgReasoningSteps.toFixed(1),
    estimatedCost,
    groqLimit,
    usagePercent: usagePercent.toFixed(1),
    toolUsage, // NEW: Tool usage statistics
    logs,
  };
};

/**
 * Clear all query logs
 */
export const clearQueryLogs = () => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('vegah_query_logs');
};

// =============================================================================
// SESSION MANAGEMENT
// =============================================================================

/**
 * Generate a unique session ID
 * @returns {string} Unique session ID
 */
export const generateSessionId = () => {
  try {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
  } catch {}
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

/**
 * Get or create session ID from local storage
 * @returns {string} Session ID
 */
export const getOrCreateSessionId = () => {
  if (typeof window === 'undefined') return generateSessionId();
  
  let sessionId = localStorage.getItem('vegah_session_id');
  if (!sessionId) {
    sessionId = generateSessionId();
    localStorage.setItem('vegah_session_id', sessionId);
  }
  return sessionId;
};

/**
 * Create new session (clears current session ID)
 * @returns {string} New session ID
 */
export const createNewSession = () => {
  if (typeof window === 'undefined') return generateSessionId();
  
  const newSessionId = generateSessionId();
  localStorage.setItem('vegah_session_id', newSessionId);
  return newSessionId;
};

// =============================================================================
// BACKWARD COMPATIBILITY (LEGACY FETCH METHODS)
// =============================================================================

/**
 * @deprecated Use getHealth() instead
 */
export const checkHealth = async () => {
  const response = await fetch(`${API_URL}/health`, {
    headers: defaultHeaders,
  });
  return response.json();
};

/**
 * @deprecated Use uploadDocuments() instead
 */
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

/**
 * @deprecated Use clearAllDocuments() instead
 */
export const deleteAllEmbeddings = async () => {
  const response = await fetch(`${API_URL}/clear`, {
    method: 'POST',
  });
  if (!response.ok) throw new Error('Failed to delete embeddings');
  return response.json();
};
