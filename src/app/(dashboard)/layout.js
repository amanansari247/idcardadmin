'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';

export default function DashboardLayout({ children }) {
  const { admin, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !admin) router.push('/login');
  }, [admin, loading, router]);

  if (loading) return (
    <div className="page-loader">
      <div className="spinner" style={{ width: 48, height: 48, borderWidth: 3 }} />
      <p style={{ color: 'var(--text-secondary)' }}>Loading...</p>
    </div>
  );
  if (!admin) return null;

  return (
    <div className="layout">
      <Sidebar />
      <div className="main-content">
        <Topbar />
        <div className="page-container">{children}</div>
      </div>
    </div>
  );
}
