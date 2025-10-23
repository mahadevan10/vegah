'use client';

import { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { DollarSign, Activity, Database, Clock, TrendingUp, Zap } from 'lucide-react';
import { getStats, getAnalytics } from '@/lib/api';
import { format } from 'date-fns';

export default function AnalyticsDashboard() {
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000); // Refresh every 30s
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
      console.error('Failed to load analytics:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading analytics...</div>;
  }

  // Prepare chart data
  const chartData = analytics?.logs.slice(-10).map((log, idx) => ({
    name: `Q${idx + 1}`,
    responseTime: log.responseTime,
    time: format(new Date(log.timestamp), 'HH:mm'),
  })) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-lg">
        <h1 className="text-3xl font-bold">Vegah Analytics Dashboard</h1>
        <p className="text-sm opacity-90 mt-1">Real-time cost tracking & API monitoring</p>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Cost */}
        <MetricCard
          title="Total Cost"
          value="$0.00"
          subtitle="Forever free"
          icon={<DollarSign className="w-6 h-6" />}
          color="green"
        />

        {/* Total Queries */}
        <MetricCard
          title="Total Queries"
          value={analytics?.totalQueries || 0}
          subtitle={`${analytics?.usagePercent}% of daily limit`}
          icon={<Activity className="w-6 h-6" />}
          color="blue"
        />

        {/* Documents Indexed */}
        <MetricCard
          title="Documents Indexed"
          value={stats?.documents_indexed || 0}
          subtitle={stats?.retriever_status?.vector === 'active' ? 'Active' : 'Inactive'}
          icon={<Database className="w-6 h-6" />}
          color="purple"
        />

        {/* Avg Response Time */}
        <MetricCard
          title="Avg Response Time"
          value={`${analytics?.avgResponseTime}ms`}
          subtitle="Per query"
          icon={<Clock className="w-6 h-6" />}
          color="orange"
        />
      </div>

      {/* Cost Breakdown */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4 flex items-center">
          <DollarSign className="w-5 h-5 mr-2 text-green-600" />
          Cost Breakdown
        </h2>
        <div className="space-y-3">
          <CostRow label="GCP e2-micro VM" value="$0.00" status="Always Free" />
          <CostRow label="Groq API (Llama 3.1 8B)" value="$0.00" status={`${analytics?.totalQueries || 0}/${analytics?.groqLimit} queries today`} />
          <CostRow label="ChromaDB Vector Storage" value="$0.00" status="Self-hosted" />
          <CostRow label="Vercel Frontend Hosting" value="$0.00" status="Free tier" />
          <div className="pt-3 border-t-2 border-gray-200">
            <CostRow label="Total Monthly Cost" value="$0.00" status="✅ Permanent" bold />
          </div>
        </div>
      </div>

      {/* Response Time Chart */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4 flex items-center">
          <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
          Query Response Time (Last 10)
        </h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis label={{ value: 'Time (ms)', angle: -90, position: 'insideLeft' }} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="responseTime" stroke="#3b82f6" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* System Status */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4 flex items-center">
          <Zap className="w-5 h-5 mr-2 text-yellow-600" />
          System Status
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatusCard
            label="BM25 Retriever"
            status={stats?.retriever_status?.bm25 || 'inactive'}
          />
          <StatusCard
            label="Vector Search"
            status={stats?.retriever_status?.vector || 'inactive'}
          />
          <StatusCard
            label="LLM (Groq)"
            status="active"
          />
        </div>
      </div>

      {/* API Limits */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">Groq API Usage</h2>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span>Daily Queries</span>
            <span className="font-bold">{analytics?.totalQueries || 0} / {analytics?.groqLimit}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-blue-600 h-3 rounded-full transition-all"
              style={{ width: `${analytics?.usagePercent || 0}%` }}
            />
          </div>
          <p className="text-sm text-gray-600">
            {analytics?.groqLimit - (analytics?.totalQueries || 0)} queries remaining today
          </p>
        </div>
      </div>
    </div>
  );
}

// Helper Components
function MetricCard({ title, value, subtitle, icon, color }) {
  const colorClasses = {
    green: 'bg-green-100 text-green-600',
    blue: 'bg-blue-100 text-blue-600',
    purple: 'bg-purple-100 text-purple-600',
    orange: 'bg-orange-100 text-orange-600',
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-gray-600">{title}</p>
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          {icon}
        </div>
      </div>
      <p className="text-3xl font-bold">{value}</p>
      <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
    </div>
  );
}

function CostRow({ label, value, status, bold }) {
  return (
    <div className={`flex justify-between items-center ${bold ? 'font-bold text-lg' : ''}`}>
      <span className="text-gray-700">{label}</span>
      <div className="text-right">
        <div className="text-green-600">{value}</div>
        <div className="text-xs text-gray-500">{status}</div>
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
