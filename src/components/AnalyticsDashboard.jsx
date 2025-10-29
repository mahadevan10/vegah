'use client';

import { useState, useEffect } from 'react';
import { DollarSign, Activity, Clock, Database, TrendingUp, Zap } from 'lucide-react';

const backendUrl = process.env.NEXT_PUBLIC_API_URL;

export default function AnalyticsDashboard() {
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const statsRes = await fetch(`${backendUrl}/health`);
      const analyticsRes = await fetch(`${backendUrl}/analytics`);
      setStats(await statsRes.json());
      setAnalytics(await analyticsRes.json());
      setLoading(false);
    } catch (error) {
      console.error('Failed to load data:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard
          title="Total Cost (SambaNova)"
          value={`$${analytics?.sambanovaCost?.toFixed(2) || '0.00'}`}
          subtitle="Projected (Prod)"
          icon={<DollarSign className="w-6 h-6" />}
          color="green"
        />
        <MetricCard
          title="Total Queries"
          value={analytics?.totalQueries || 0}
          subtitle="All time"
          icon={<Activity className="w-6 h-6" />}
          color="blue"
        />
        <MetricCard
          title="Avg Response"
          value={`${analytics?.avgResponseTime}ms`}
          subtitle="Per query"
          icon={<Clock className="w-6 h-6" />}
          color="purple"
        />
        <MetricCard
          title="Documents"
          value={stats?.documents_indexed || 0}
          subtitle="Indexed"
          icon={<Database className="w-6 h-6" />}
          color="orange"
        />
      </div>

      {/* Token Usage */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4 flex items-center">
          <Zap className="w-5 h-5 mr-2 text-yellow-600" />
          LLM Token Usage & Projected Cost (SambaNova)
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="font-semibold">Input Tokens</div>
            <div>{analytics?.totalInputTokens?.toLocaleString() || 0}</div>
          </div>
          <div>
            <div className="font-semibold">Output Tokens</div>
            <div>{analytics?.totalOutputTokens?.toLocaleString() || 0}</div>
          </div>
          <div>
            <div className="font-semibold">Total Tokens</div>
            <div>{analytics?.totalTokens?.toLocaleString() || 0}</div>
          </div>
          <div>
            <div className="font-semibold">Projected Cost</div>
            <div className="text-green-700 font-bold">${analytics?.sambanovaCost?.toFixed(2) || '0.00'}</div>
          </div>
        </div>
        <div className="mt-4 text-xs text-gray-500">
          <b>Pricing:</b> $81.20 per 121.6M tokens (SambaNova production tier)
        </div>
      </div>

      {/* Recent Queries */}
      {analytics?.recentQueries && analytics.recentQueries.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
            Recent Queries
          </h2>
          <div className="space-y-2">
            {analytics.recentQueries.map((q, idx) => (
              <div key={idx} className="flex justify-between items-center border-b pb-2">
                <div className="flex-1">
                  <p className="text-sm font-medium truncate">{q.query}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(q.timestamp).toLocaleTimeString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-blue-600">{q.responseTime}ms</p>
                  <p className="text-xs text-gray-500">{q.documentsRetrieved} docs</p>
                  <p className="text-xs text-gray-500">{q.inputTokens} in / {q.outputTokens} out</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Helper Components
function MetricCard({ title, value, subtitle, icon, color }) {
  const colors = {
    green: 'bg-green-100 text-green-600',
    blue: 'bg-blue-100 text-blue-600',
    purple: 'bg-purple-100 text-purple-600',
    orange: 'bg-orange-100 text-orange-600',
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-gray-600">{title}</p>
        <div className={`p-2 rounded-lg ${colors[color]}`}>{icon}</div>
      </div>
      <p className="text-3xl font-bold">{value}</p>
      <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
    </div>
  );
}

function CostRow({ label, cost, usage, bold }) {
  return (
    <div className={`flex justify-between ${bold ? 'font-bold text-lg' : ''}`}>
      <span>{label}</span>
      <div className="text-right">
        <div className="text-green-600">{cost}</div>
        <div className="text-xs text-gray-500">{usage}</div>
      </div>
    </div>
  );
}

function StatusCard({ label, status }) {
  const isActive = status === 'active';
  return (
    <div className="border rounded-lg p-4">
      <p className="text-sm text-gray-600 mb-2">{label}</p>
      <div className="flex items-center space-x-2">
        <div className={`w-3 h-3 rounded-full ${isActive ? 'bg-green-500' : 'bg-gray-300'}`} />
        <span className={`font-medium ${isActive ? 'text-green-600' : 'text-gray-500'}`}>
          {isActive ? 'Active' : 'Inactive'}
        </span>
      </div>
    </div>
  );
}
