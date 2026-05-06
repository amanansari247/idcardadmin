'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { FiBook, FiUsers, FiKey, FiCheckCircle } from 'react-icons/fi';
import { Bar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard/stats').then(r => setStats(r.data.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page-loader"><div className="spinner" /></div>;

  const barData = {
    labels: stats?.classDist?.map(c => `Class ${c.class}`) || [],
    datasets: [{
      label: 'Students',
      data: stats?.classDist?.map(c => c.count) || [],
      backgroundColor: 'rgba(59,130,246,0.7)',
      borderColor: '#3B82F6',
      borderWidth: 2,
      borderRadius: 6,
    }],
  };

  const doughnutData = {
    labels: stats?.schoolStats?.slice(0,6).map(s => s.name) || [],
    datasets: [{
      data: stats?.schoolStats?.slice(0,6).map(s => s.students) || [],
      backgroundColor: ['#3B82F6','#8B5CF6','#10B981','#F59E0B','#EF4444','#06B6D4'],
      borderWidth: 0,
    }],
  };

  const chartOpts = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { labels: { color: '#94A3B8', font: { size: 12 } } } },
    scales: {
      x: { grid: { color: 'rgba(51,65,85,0.5)' }, ticks: { color: '#94A3B8' } },
      y: { grid: { color: 'rgba(51,65,85,0.5)' }, ticks: { color: '#94A3B8' } },
    },
  };

  const STAT_CARDS = [
    { label: 'Total Schools', value: stats?.totalSchools ?? 0, icon: FiBook, color: '#3B82F6', bg: 'rgba(59,130,246,0.12)' },
    { label: 'Total Students', value: stats?.totalStudents ?? 0, icon: FiUsers, color: '#10B981', bg: 'rgba(16,185,129,0.12)' },
    { label: 'Activation Keys', value: stats?.totalKeys ?? 0, icon: FiKey, color: '#8B5CF6', bg: 'rgba(139,92,246,0.12)' },
    { label: 'Active Keys', value: stats?.activeKeys ?? 0, icon: FiCheckCircle, color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
  ];

  return (
    <div>
      <div className="page-header">
        <h1>Welcome back 👋</h1>
        <p>Here's what's happening across your schools today.</p>
      </div>

      <div className="stat-grid">
        {STAT_CARDS.map(({ label, value, icon: Icon, color, bg }) => (
          <div className="stat-card" key={label}>
            <div className="stat-icon" style={{ background: bg }}>
              <Icon size={22} style={{ color }} />
            </div>
            <div className="stat-info">
              <div className="stat-value" style={{ color }}>{value.toLocaleString()}</div>
              <div className="stat-label">{label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid-2" style={{ marginBottom: 24 }}>
        <div className="card">
          <div className="card-header"><div className="card-title">Students by Class</div></div>
          <div style={{ height: 260 }}>
            <Bar data={barData} options={chartOpts} />
          </div>
        </div>
        <div className="card">
          <div className="card-header"><div className="card-title">Students per School</div></div>
          <div style={{ height: 260 }}>
            <Doughnut data={doughnutData} options={{ ...chartOpts, scales: undefined }} />
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header"><div className="card-title">Recent Schools</div></div>
        <div className="table-wrapper">
          <table>
            <thead><tr>
              <th>School Name</th><th>City</th><th>Students</th><th>Created</th>
            </tr></thead>
            <tbody>
              {stats?.recentSchools?.map(s => (
                <tr key={s.id}>
                  <td style={{ fontWeight: 600 }}>{s.name}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{s.city || '—'}</td>
                  <td><span className="badge badge-blue">{s._count.students} students</span></td>
                  <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                    {new Date(s.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
