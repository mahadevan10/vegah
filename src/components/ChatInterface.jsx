'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Brain, ChevronDown, ChevronUp, Wrench, FileText, Bug } from 'lucide-react';
import { queryRAG, saveQueryLog } from '../lib/api';
import ReactMarkdown from 'react-markdown';

async function deleteAllEmbeddings() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/clear`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to delete embeddings');
  return res.json();
}

// Component to display agent reasoning
function AgentReasoning({ reasoning, toolsUsed }) {
  const [expanded, setExpanded] = useState(true);

  // Guard clause - check if we have any data to display
  const hasReasoning = reasoning && Array.isArray(reasoning) && reasoning.length > 0;
  const hasTools = toolsUsed && Array.isArray(toolsUsed) && toolsUsed.length > 0;

  if (!hasReasoning && !hasTools) {
    return null;
  }

  return (
    <div className="mt-3 border-t border-blue-200 pt-3 bg-blue-50 rounded-lg p-3">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between w-full text-sm font-semibold text-blue-700 hover:text-blue-900 transition-colors"
        type="button"
      >
        <div className="flex items-center space-x-2">
          <Brain className="w-4 h-4" />
          <span>
            Agent Reasoning 
            {hasReasoning && ` (${reasoning.length} steps)`}
            {hasTools && ` • ${toolsUsed.length} tools used`}
          </span>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {expanded && (
        <div className="mt-3 space-y-3">
          {/* Tools Used */}
          {hasTools && (
            <div className="bg-white rounded-lg p-3 border border-purple-200">
              <p className="text-xs font-semibold text-purple-700 mb-2 flex items-center">
                <Wrench className="w-3 h-3 mr-1" />
                Tools Used:
              </p>
              <div className="flex flex-wrap gap-2">
                {toolsUsed.map((tool, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 border border-purple-300"
                  >
                    🔧 {tool.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Reasoning Steps */}
          {hasReasoning && (
            <div className="bg-white rounded-lg p-3 border border-blue-200">
              <p className="text-xs font-semibold text-blue-700 mb-2 flex items-center">
                💭 Thought Process:
              </p>
              <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-lg p-3 space-y-2 max-h-96 overflow-y-auto">
                {reasoning.map((step, i) => {
                  // Determine icon based on step content
                  let icon = '•';
                  if (step.includes('🔍') || step.includes('📚') || step.includes('📄') || 
                      step.includes('🎯') || step.includes('🌐') || step.includes('📋') ||
                      step.includes('🔧') || step.includes('✅') || step.includes('⚠️') ||
                      step.includes('❌') || step.includes('📥') || step.includes('🔄') ||
                      step.includes('⏱️') || step.includes('💭') || step.includes('⚡')) {
                    icon = ''; // Step already has emoji
                  } else if (step.toLowerCase().includes('error') || step.toLowerCase().includes('failed')) {
                    icon = '❌';
                  } else if (step.toLowerCase().includes('success') || step.toLowerCase().includes('found')) {
                    icon = '✅';
                  } else if (step.toLowerCase().includes('searching') || step.toLowerCase().includes('retrieving')) {
                    icon = '🔍';
                  }

                  return (
                    <div key={i} className="flex items-start space-x-2 group hover:bg-blue-100 p-2 rounded transition-colors">
                      <span className="text-blue-600 text-xs font-bold mt-0.5 flex-shrink-0 min-w-[24px]">
                        {i + 1}.
                      </span>
                      <p className="text-xs text-gray-800 leading-relaxed flex-1 whitespace-pre-wrap break-words">
                        {icon && <span className="mr-1">{icon}</span>}
                        {step}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Component to display sources
function SourcesDisplay({ sources }) {
  const [expanded, setExpanded] = useState(true);

  if (!sources || sources.length === 0) return null;

  return (
    <div className="mt-3 pt-3 border-t border-gray-300">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between w-full text-xs font-semibold text-gray-700 hover:text-gray-900 mb-2"
        type="button"
      >
        <div className="flex items-center">
          <FileText className="w-3 h-3 mr-1" />
          <span>Sources ({sources.length})</span>
        </div>
        {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>
      
      {expanded && (
        <div className="space-y-2">
          {sources.map((source, i) => {
            const displayName = source.filename || source.source || 'Unknown document';
            const isSummary = Boolean(source.is_summary);
            const pageLabel =
              isSummary
                ? <span className="ml-2 text-blue-600 font-bold">Entire Document</span>
                : source.page !== undefined && source.page !== null && (
                    <span className="ml-2 text-blue-600 font-bold">Page {source.page}</span>
                  );

            return (
            <div key={i} className="bg-white border border-gray-200 rounded-lg p-2 hover:border-blue-300 transition-colors">
              <p className="text-xs font-semibold text-gray-800 mb-1 flex items-center justify-between">
                <span>
                    📄 {displayName}
                    {pageLabel}
                </span>
              </p>
              <div className="bg-gray-50 rounded p-2 text-xs text-gray-600 leading-relaxed border-l-2 border-blue-400">
                {source.preview || source.content
                  ? (source.preview || source.content)
                      .split('\n')
                      .slice(0, 3)
                      .join('\n')
                  : 'No preview available'}
                {(source.preview || source.content) &&
                  (source.preview || source.content).split('\n').length > 3 && (
                    <span className="text-blue-500 font-semibold"> ...</span>
                  )}
              </div>
            </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Debug panel component
function DebugPanel({ message }) {
  const [showDebug, setShowDebug] = useState(false);

  if (message.role !== 'assistant' || message.isError) return null;

  return (
    <div className="mt-2">
      <button
        onClick={() => setShowDebug(!showDebug)}
        className="text-xs text-gray-400 hover:text-gray-600 flex items-center space-x-1"
        type="button"
      >
        <Bug className="w-3 h-3" />
        <span>{showDebug ? 'Hide' : 'Show'} Debug Info</span>
      </button>
      
      {showDebug && (
        <div className="mt-2 bg-gray-900 text-green-400 p-2 rounded text-xs font-mono overflow-x-auto">
          <div className="mb-1"><strong>Has Reasoning:</strong> {message.agentReasoning ? 'Yes' : 'No'} ({message.agentReasoning?.length || 0} steps)</div>
          <div className="mb-1"><strong>Has Tools:</strong> {message.toolsUsed ? 'Yes' : 'No'} ({message.toolsUsed?.length || 0} tools)</div>
          <div className="mb-1"><strong>Has Sources:</strong> {message.sources ? 'Yes' : 'No'} ({message.sources?.length || 0} sources)</div>
          <details className="mt-2">
            <summary className="cursor-pointer text-yellow-400">Raw Data</summary>
            <pre className="mt-2 text-xs overflow-x-auto whitespace-pre-wrap">
              {JSON.stringify({
                agentReasoning: message.agentReasoning,
                toolsUsed: message.toolsUsed,
                sources: message.sources?.map(s => ({...s, content: s.content?.substring(0, 100) + '...'}))
              }, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
}

export default function ChatInterface() {
  // Load messages from localStorage on mount
  const [messages, setMessages] = useState(() => {
    if (typeof window === 'undefined') {
      return [
        {
          role: 'assistant',
          content: 'Hi! I\'m Vegah, your intelligent agentic RAG assistant. I can reason about your documents and strategically retrieve information. Ask me anything!',
        },
      ];
    }
    
    try {
      const savedMessages = localStorage.getItem('vegah_chat_history');
      if (savedMessages) {
        return JSON.parse(savedMessages);
      }
    } catch (error) {
      console.error('Failed to load chat history:', error);
    }
    
    return [
      {
        role: 'assistant',
        content: 'Hi! I\'m Vegah, your intelligent agentic RAG assistant. I can reason about your documents and strategically retrieve information. Ask me anything!',
      },
    ];
  });
  
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const isMountedRef = useRef(true);
  const activeRequestRef = useRef(null);

  // Generate stable sessionId
  const [sessionId] = useState(() => {
    try {
      if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
      }
    } catch {}
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  });
  
  // Track component mount status
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      // Don't cancel the request, let it complete in background
    };
  }, []);
  
  // Save messages to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('vegah_chat_history', JSON.stringify(messages));
    } catch (error) {
      console.error('Failed to save chat history:', error);
    }
  }, [messages]);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    const startTime = Date.now();

    try {
      // Store reference to this request
      const requestPromise = queryRAG(userMessage, 5, sessionId);
      activeRequestRef.current = requestPromise;
      
      // Call API with sessionId
      const response = await requestPromise;
      
      // Check if component is still mounted before updating state
      if (!isMountedRef.current) {
        console.log('⚠️ Component unmounted, saving response to localStorage only');
        // Still save to localStorage so it appears when user returns
        const responseTime = Date.now() - startTime;
        const assistantMessage = {
          role: 'assistant',
          content: response.answer || 'No answer generated',
          sources: Array.isArray(response.sources) ? response.sources : [],
          agentReasoning: Array.isArray(response.agent_reasoning) ? response.agent_reasoning : [],
          toolsUsed: Array.isArray(response.tools_used) ? response.tools_used : [],
          contextUsed: response.context_used,
          responseTime: responseTime,
        };
        
        // Update localStorage directly
        try {
          const savedMessages = JSON.parse(localStorage.getItem('vegah_chat_history') || '[]');
          savedMessages.push(assistantMessage);
          localStorage.setItem('vegah_chat_history', JSON.stringify(savedMessages));
          console.log('✅ Response saved to localStorage for later viewing');
        } catch (error) {
          console.error('Failed to save unmounted response:', error);
        }
        return;
      }
      
      const responseTime = Date.now() - startTime;

      // DEBUG: Comprehensive logging
      console.group('🤖 Agent Response Received');
      console.log('Full Response:', response);
      console.log('Answer:', response.answer);
      console.log('Agent Reasoning:', response.agent_reasoning);
      console.log('Tools Used:', response.tools_used);
      console.log('Sources:', response.sources);
      console.log('Response Time:', responseTime, 'ms');
      console.groupEnd();

      // Validate data types
      const agentReasoning = Array.isArray(response.agent_reasoning) 
        ? response.agent_reasoning 
        : [];
      
      const toolsUsed = Array.isArray(response.tools_used) 
        ? response.tools_used 
        : [];

      const sources = Array.isArray(response.sources) 
        ? response.sources 
        : [];

      // Log warnings if arrays are empty
      if (agentReasoning.length === 0) {
        console.warn('⚠️ No agent reasoning steps received from backend');
      }
      if (toolsUsed.length === 0) {
        console.warn('⚠️ No tools used data received from backend');
      }

      // Build message object with validated data
      const assistantMessage = {
        role: 'assistant',
        content: response.answer || 'No answer generated',
        sources: sources,
        agentReasoning: agentReasoning,
        toolsUsed: toolsUsed,
        contextUsed: response.context_used,
        responseTime: responseTime,
      };

      console.log('📨 Assistant Message Object:', assistantMessage);

      setMessages(prev => [...prev, assistantMessage]);

      // Save to logs with new fields
      saveQueryLog(
        userMessage,
        response.answer,
        responseTime,
        toolsUsed,
        agentReasoning.length
      );
    } catch (error) {
      console.error('❌ Query error:', error);
      console.error('Error details:', error.response?.data);
      
      // Only update state if component is still mounted
      if (isMountedRef.current) {
        setMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            content: `Error: ${error.response?.data?.detail || error.message}`,
            isError: true,
          },
        ]);
      } else {
        // Save error to localStorage for later viewing
        try {
          const savedMessages = JSON.parse(localStorage.getItem('vegah_chat_history') || '[]');
          savedMessages.push({
            role: 'assistant',
            content: `Error: ${error.response?.data?.detail || error.message}`,
            isError: true,
          });
          localStorage.setItem('vegah_chat_history', JSON.stringify(savedMessages));
        } catch (storageError) {
          console.error('Failed to save error to localStorage:', storageError);
        }
      }
    } finally {
      // Only update loading state if component is still mounted
      if (isMountedRef.current) {
        setLoading(false);
      }
      activeRequestRef.current = null;
    }
  };

  return (
    <div className="flex flex-col h-[600px] border rounded-lg bg-white shadow-lg">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white p-4 rounded-t-lg flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold flex items-center">
            <Brain className="w-6 h-6 mr-2 animate-pulse" />
            Vegah Agentic Assistant
          </h2>
          <p className="text-sm opacity-90">Intelligent Document Reasoning • Agentic RAG</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => {
              if (confirm('Clear chat history? This will only clear the conversation, not the documents.')) {
                const initialMessage = {
                  role: 'assistant',
                  content: 'Hi! I\'m Vegah, your intelligent agentic RAG assistant. I can reason about your documents and strategically retrieve information. Ask me anything!',
                };
                setMessages([initialMessage]);
                localStorage.setItem('vegah_chat_history', JSON.stringify([initialMessage]));
              }
            }}
            className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
            type="button"
          >
            Clear Chat
          </button>
          <button
            onClick={async () => {
              if (confirm('Delete all documents and embeddings?')) {
                try {
                  await deleteAllEmbeddings();
                  alert('All embeddings deleted!');
                  const resetMessage = {
                    role: 'assistant',
                    content: 'All documents cleared. Upload new PDFs to get started!',
                  };
                  setMessages([resetMessage]);
                  localStorage.setItem('vegah_chat_history', JSON.stringify([resetMessage]));
                } catch (e) {
                  alert('Failed to delete embeddings: ' + e.message);
                }
              }
            }}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
            type="button"
          >
            Clear All Docs
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-lg p-4 ${
                msg.role === 'user'
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md'
                  : msg.isError
                  ? 'bg-red-50 text-red-800 border border-red-200'
                  : 'bg-gray-50 text-gray-800 border border-gray-200 shadow-sm'
              }`}
            >
              {/* Message Content */}
              {msg.role === 'assistant' ? (
                <div className="prose prose-sm max-w-none">
                  <ReactMarkdown
                    components={{
                      // Style markdown elements
                      h1: ({node, ...props}) => <h1 className="text-xl font-bold mt-4 mb-2" {...props} />,
                      h2: ({node, ...props}) => <h2 className="text-lg font-bold mt-3 mb-2" {...props} />,
                      h3: ({node, ...props}) => <h3 className="text-base font-bold mt-2 mb-1" {...props} />,
                      p: ({node, ...props}) => <p className="mb-2 leading-relaxed" {...props} />,
                      ul: ({node, ...props}) => <ul className="list-disc ml-5 mb-2 space-y-1" {...props} />,
                      ol: ({node, ...props}) => <ol className="list-decimal ml-5 mb-2 space-y-1" {...props} />,
                      li: ({node, ...props}) => <li className="leading-relaxed" {...props} />,
                      strong: ({node, ...props}) => <strong className="font-bold text-gray-900" {...props} />,
                      em: ({node, ...props}) => <em className="italic" {...props} />,
                      code: ({node, inline, ...props}) => 
                        inline ? (
                          <code className="bg-gray-200 px-1 py-0.5 rounded text-sm font-mono" {...props} />
                        ) : (
                          <code className="block bg-gray-800 text-green-400 p-2 rounded text-sm font-mono overflow-x-auto" {...props} />
                        ),
                      blockquote: ({node, ...props}) => (
                        <blockquote className="border-l-4 border-blue-500 pl-4 italic my-2" {...props} />
                      ),
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                </div>
              ) : (
                <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
              )}

              {/* Metadata */}
              {msg.role === 'assistant' && !msg.isError && (
                <div className="mt-2 flex items-center space-x-3 text-xs text-gray-500">
                  {msg.responseTime && (
                    <span className="flex items-center">
                      ⚡ {(msg.responseTime / 1000).toFixed(2)}s
                    </span>
                  )}
                  {msg.agentReasoning && msg.agentReasoning.length > 0 && (
                    <span className="flex items-center">
                      🧠 {msg.agentReasoning.length} reasoning steps
                    </span>
                  )}
                  {msg.toolsUsed && msg.toolsUsed.length > 0 && (
                    <span className="flex items-center">
                      🔧 {msg.toolsUsed.length} tools
                    </span>
                  )}
                  {msg.sources && msg.sources.length > 0 && (
                    <span className="flex items-center">
                      📄 {msg.sources.length} sources
                    </span>
                  )}
                </div>
              )}

              {/* Agent Reasoning Component */}
              {msg.role === 'assistant' && !msg.isError && (
                <AgentReasoning
                  reasoning={msg.agentReasoning}
                  toolsUsed={msg.toolsUsed}
                />
              )}

              {/* Sources Display */}
              {msg.role === 'assistant' && !msg.isError && (
                <SourcesDisplay sources={msg.sources} />
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4 flex items-center space-x-3 shadow-sm">
              <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
              <div>
                <p className="text-sm font-semibold text-gray-800">Agent is thinking...</p>
                <p className="text-xs text-gray-600">Analyzing documents and reasoning about your query</p>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t bg-gray-50">
        <div className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your documents... (e.g., 'What's on page 5?' or 'Summarize the financial report')"
            className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 transition-all shadow-md hover:shadow-lg"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          💡 Tip: The agent will inspect your documents and strategically decide how to answer
        </p>
      </form>
    </div>
  );
}
