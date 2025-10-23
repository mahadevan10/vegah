'use client';

import { useState, useEffect } from 'react';
import ChatInterface from '../components/ChatInterface';
import AnalyticsDashboard from '../components/AnalyticsDashboard';
import UploadInterface from '../components/UploadInterface';

import { MessageSquare, BarChart3, Zap, ExternalLink, Upload} from 'lucide-react';
import { getHealth } from '../lib/api';


export default function Home() {
  const [activeTab, setActiveTab] = useState('overview');
  const [health, setHealth] = useState(null);

  useEffect(() => {
    checkHealth();
  }, []);

  const checkHealth = async () => {
    try {
      const data = await getHealth();
      setHealth(data);
    } catch (error) {
      console.error('Health check failed:', error);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <Zap className="w-5 h-5" /> },
    { id: 'upload', label: 'Upload', icon: <Upload className="w-5 h-5" /> },
    { id: 'chat', label: 'Chat', icon: <MessageSquare className="w-5 h-5" /> },
    { id: 'analytics', label: 'Analytics', icon: <BarChart3 className="w-5 h-5" /> },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Vegah</h1>
                <p className="text-sm text-gray-600">Ultra-Low-Cost RAG System</p>
              </div>
            </div>
            
            {health && (
              <div className="flex items-center space-x-2 bg-green-50 px-4 py-2 rounded-lg border border-green-200">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-sm font-medium text-green-700">
                  {health.status === 'healthy' ? 'System Healthy' : 'System Issue'}
                </span>
                <span className="text-xs text-green-600">
                  • {health.documents_indexed} docs
                </span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex space-x-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-6 py-3 font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === 'overview' && <OverviewTab />}
        {activeTab === 'upload' && (  // ADD THIS
        <div className="max-w-5xl mx-auto">
            <UploadInterface onUploadComplete={checkHealth} />
        </div>
        )}
        {activeTab === 'chat' && (
          <div className="max-w-4xl mx-auto">
            <ChatInterface />
          </div>
        )}
        {activeTab === 'analytics' && <AnalyticsDashboard />}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div>
              <p className="font-semibold">Vegah RAG System</p>
              <p>Deployed on GCP e2-micro • Powered by Groq Llama 3.1 8B</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-green-600">Monthly Cost: $0</p>
              <p className="text-xs">Forever free tier</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function OverviewTab() {
  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="text-center">
        <h2 className="text-4xl font-bold text-gray-900 mb-4">
          Production-Ready RAG at $0/month
        </h2>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Hybrid search architecture combining BM25 keyword filtering with vector semantic search, powered by Groq's free LLM API
        </p>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-lg border-l-4 border-blue-500">
          <h3 className="text-lg font-bold text-gray-700 mb-2">Backend API</h3>
          <p className="text-3xl font-bold text-blue-600 mb-2">✅ Active</p>
          <a
            href="http://136.112.100.84:8000/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:underline flex items-center"
          >
            View API Docs <ExternalLink className="w-3 h-3 ml-1" />
          </a>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-lg border-l-4 border-green-500">
          <h3 className="text-lg font-bold text-gray-700 mb-2">Monthly Cost</h3>
          <p className="text-3xl font-bold text-green-600 mb-2">$0.00</p>
          <p className="text-sm text-gray-500">Forever free tier</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-lg border-l-4 border-purple-500">
          <h3 className="text-lg font-bold text-gray-700 mb-2">Response Time</h3>
          <p className="text-3xl font-bold text-purple-600 mb-2">2-5s</p>
          <p className="text-sm text-gray-500">Average per query</p>
        </div>
      </div>

      {/* Features */}
      <div className="bg-white p-8 rounded-lg shadow-lg">
        <h3 className="text-2xl font-bold mb-6">Key Features</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Feature
            icon="💬"
            title="Interactive Chat"
            description="Ask questions and get AI-powered answers with source citations"
          />
          <Feature
            icon="📊"
            title="Real-Time Analytics"
            description="Track API usage, costs, and performance metrics in real-time"
          />
          <Feature
            icon="🔍"
            title="Hybrid Search"
            description="BM25 + Vector search for 95% efficiency improvement"
          />
          <Feature
            icon="🔄"
            title="Auto-Restart"
            description="systemd service with automatic crash recovery"
          />
        </div>
      </div>

      {/* Architecture */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-8 rounded-lg shadow-lg">
        <h3 className="text-2xl font-bold mb-6">Three-Stage Architecture</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Stage
            number="1"
            title="BM25 Filtering"
            description="Traditional keyword search filters 1000+ docs → 50 candidates"
          />
          <Stage
            number="2"
            title="Vector Search"
            description="Semantic search on 50 candidates → Top 10 most relevant"
          />
          <Stage
            number="3"
            title="LLM Generation"
            description="Groq Llama 3.1 8B generates accurate answer from top 10"
          />
        </div>
      </div>

      {/* Cost Breakdown */}
      <div className="bg-white p-8 rounded-lg shadow-lg">
        <h3 className="text-2xl font-bold mb-6">Complete Cost Breakdown</h3>
        <div className="space-y-4">
          <CostItem
            service="GCP e2-micro VM (2 vCPU, 1GB RAM)"
            cost="$0.00"
            detail="Always Free Tier"
          />
          <CostItem
            service="Groq API with Llama 3.1 8B"
            cost="$0.00"
            detail="14,400 requests/day free"
          />
          <CostItem
            service="ChromaDB Vector Database"
            cost="$0.00"
            detail="Self-hosted, open source"
          />
          <CostItem
            service="Vercel Frontend Hosting"
            cost="$0.00"
            detail="Free tier (100GB bandwidth)"
          />
          <div className="pt-4 border-t-2 border-gray-200">
            <CostItem
              service="Total Monthly Operational Cost"
              cost="$0.00"
              detail="✅ Permanent free tier"
              bold
            />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <a
          href="http://136.112.100.84:8000/docs"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-blue-600 text-white p-6 rounded-lg shadow-lg hover:bg-blue-700 transition-colors flex items-center justify-between"
        >
          <div>
            <h4 className="font-bold text-lg mb-1">API Documentation</h4>
            <p className="text-sm opacity-90">Interactive Swagger UI</p>
          </div>
          <ExternalLink className="w-6 h-6" />
        </a>
        <a
          href="http://136.112.100.84:8000/health"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-green-600 text-white p-6 rounded-lg shadow-lg hover:bg-green-700 transition-colors flex items-center justify-between"
        >
          <div>
            <h4 className="font-bold text-lg mb-1">System Health</h4>
            <p className="text-sm opacity-90">Check backend status</p>
          </div>
          <ExternalLink className="w-6 h-6" />
        </a>
      </div>
    </div>
  );
}

function Feature({ icon, title, description }) {
  return (
    <div className="flex items-start space-x-3">
      <span className="text-3xl">{icon}</span>
      <div>
        <h4 className="font-bold text-lg mb-1">{title}</h4>
        <p className="text-gray-600">{description}</p>
      </div>
    </div>
  );
}

function Stage({ number, title, description }) {
  return (
    <div className="text-center">
      <div className="bg-white text-blue-600 w-12 h-12 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-3">
        {number}
      </div>
      <h4 className="font-bold text-lg mb-2">{title}</h4>
      <p className="text-sm opacity-90">{description}</p>
    </div>
  );
}

function CostItem({ service, cost, detail, bold }) {
  return (
    <div className={`flex justify-between items-center ${bold ? 'font-bold text-lg' : ''}`}>
      <span className="text-gray-700">{service}</span>
      <div className="text-right">
        <div className="text-green-600">{cost}</div>
        <div className="text-xs text-gray-500">{detail}</div>
      </div>
    </div>
  );
}
