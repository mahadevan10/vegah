'use client';

import { useState, useEffect } from 'react';
import ChatInterface from '@/components/ChatInterface';
import UploadInterface from '@/components/UploadInterface';
import AnalyticsDashboard from '@/components/AnalyticsDashboard';
import { MessageSquare, Upload, BarChart3, Zap } from 'lucide-react';
import { getHealth } from '@/lib/api';

export default function Home() {
  const [activeTab, setActiveTab] = useState('chat');
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
    { id: 'chat', label: 'Chat', icon: <MessageSquare className="w-5 h-5" /> },
    { id: 'upload', label: 'Upload', icon: <Upload className="w-5 h-5" /> },
    { id: 'analytics', label: 'Analytics', icon: <BarChart3 className="w-5 h-5" /> },
  ];

  return (
    <div className="min-h-screen">
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
            
            {/* Status Badge */}
            {health && (
              <div className="flex items-center space-x-2 bg-green-50 px-4 py-2 rounded-lg border border-green-200">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-sm font-medium text-green-700">
                  {health.status === 'healthy' ? 'System Healthy' : 'System Issue'}
                </span>
                <span className="text-xs text-green-600">
                  • {health.documents_indexed} docs indexed
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
        {activeTab === 'chat' && (
          <div className="max-w-4xl mx-auto">
            <ChatInterface />
          </div>
        )}

        {activeTab === 'upload' && (
          <div className="max-w-2xl mx-auto">
            <UploadInterface onUploadComplete={checkHealth} />
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
