'use client';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { FiBell, FiUser } from 'react-icons/fi';

const TITLES = {
  '/dashboard': 'Dashboard',
  '/dashboard/schools': 'Schools',
  '/dashboard/activation-keys': 'Activation Keys',
  '/dashboard/students': 'Students',
  '/dashboard/templates': 'ID Card Templates',
  '/dashboard/analytics': 'Analytics',
  '/dashboard/exports': 'Export Data',
  '/dashboard/settings': 'Settings',
};

export default function Topbar() {
  const pathname = usePathname();
  const { admin } = useAuth();
  const title = TITLES[pathname] || 'IDCardPro';

  return (
    <header className="topbar">
      <h1 className="topbar-title">{title}</h1>
      <div className="topbar-actions">
        <button className="btn-icon btn btn-secondary" style={{ position: 'relative' }}>
          <FiBell size={16} />
          <span style={{
            position: 'absolute', top: 6, right: 6, width: 7, height: 7,
            borderRadius: '50%', background: 'var(--accent-blue)',
            border: '1.5px solid var(--bg-secondary)',
          }} />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 8, borderLeft: '1px solid var(--border)' }}>
          <div className="avatar" style={{ width: 34, height: 34, fontSize: 13 }}>{admin?.name?.[0]}</div>
          <div style={{ fontSize: 13, fontWeight: 600 }}>{admin?.name}</div>
        </div>
      </div>
    </header>
  );
}
