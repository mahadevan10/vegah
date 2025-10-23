'use client';

import { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DollarSign, Activity, Clock, Database, TrendingUp, Zap } from 'lucide-react';
import { getStats, getAnalytics } from '../lib/api';

export default function AnalyticsDashboard() {
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [statsData, analyticsData] = await Promise.all([
        getStats(),
        Promise.resolve(getAnalytics()),
      ]);
      setStats(statsData);
      setAnalytics(analyticsData);
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
          title="Total Cost"
          value="$0.00"
          subtitle="Forever free"
          icon={<DollarSign className="w-6 h-6" />}
          color="green"
        />
        <MetricCard
          title="Total Queries"
          value={analytics?.totalQueries || 0}
          subtitle={`${analytics?.groqUsagePercent}% of daily limit`}
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

      {/* Cost Breakdown */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4 flex items-center">
          <DollarSign className="w-5 h-5 mr-2 text-green-600" />
          Cost Tracking
        </h2>
        <div className="space-y-3">
          <CostRow label="GCP e2-micro VM" cost="$0.00" usage="Always Free Tier" />
          <CostRow label="Groq API" cost="$0.00" usage={`${analytics?.totalQueries || 0} / ${analytics?.groqDailyLimit} calls today`} />
          <CostRow label="ChromaDB Storage" cost="$0.00" usage="Self-hosted" />
          <CostRow label="Vercel Hosting" cost="$0.00" usage="Free tier" />
          <div className="pt-3 border-t-2">
            <CostRow label="Total Monthly Cost" cost="$0.00" usage="✅ Permanent" bold />
          </div>
        </div>
      </div>

      {/* API Usage Tracking */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4 flex items-center">
          <Zap className="w-5 h-5 mr-2 text-yellow-600" />
          API Usage Tracking
        </h2>
        
        {/* Groq API Limit Progress */}
        <div className="mb-6">
          <div className="flex justify-between mb-2">
            <span className="font-medium">Groq API Calls (Daily Limit)</span>
            <span className="font-bold">{analytics?.totalQueries || 0} / {analytics?.groqDailyLimit}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div
              className={`h-4 rounded-full transition-all ${
                parseFloat(analytics?.groqUsagePercent) > 80 ? 'bg-red-500' : 'bg-blue-600'
              }`}
              style={{ width: `${analytics?.groqUsagePercent}%` }}
            />
          </div>
          <p className="text-sm text-gray-600 mt-1">
            {analytics?.groqCallsRemaining} calls remaining today
          </p>
        </div>

        {/* Query Chart */}
        {analytics?.chartData && analytics.chartData.length > 0 && (
          <div>
            <h3 className="font-semibold mb-3">Queries by Hour</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={analytics.chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="queries" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
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
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* System Status */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">System Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatusCard label="BM25 Retriever" status={stats?.retriever_status?.bm25 || 'inactive'} />
          <StatusCard label="Vector Search" status={stats?.retriever_status?.vector || 'inactive'} />
          <StatusCard label="LLM (Groq)" status="active" />
        </div>
      </div>
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
