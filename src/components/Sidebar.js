'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  FiHome, FiBook, FiKey, FiUsers, FiLayout, FiBarChart2,
  FiSettings, FiLogOut, FiDownload,
} from 'react-icons/fi';

const NAV = [
  { section: 'MAIN', items: [
    { href: '/dashboard', label: 'Dashboard', icon: FiHome },
    { href: '/dashboard/subadmins', label: 'Shop Owners', icon: FiUsers, superOnly: true },
    { href: '/dashboard/schools', label: 'Schools', icon: FiBook },
    { href: '/dashboard/activation-keys', label: 'Activation Keys', icon: FiKey },
    { href: '/dashboard/students', label: 'Students', icon: FiUsers },
  ]},
  { section: 'CONTENT', items: [
    { href: '/dashboard/templates', label: 'ID Templates', icon: FiLayout },
    { href: '/dashboard/analytics', label: 'Analytics', icon: FiBarChart2 },
    { href: '/dashboard/exports', label: 'Export Data', icon: FiDownload },
  ]},
  { section: 'SYSTEM', items: [
    { href: '/dashboard/settings', label: 'Settings', icon: FiSettings },
  ]},
];

export default function Sidebar() {
  const pathname = usePathname();
  const { admin, logout } = useAuth();

  const filteredNav = NAV.map(section => ({
    ...section,
    items: section.items.filter(item => !item.superOnly || admin?.role === 'SUPER_ADMIN')
  }));

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">ID</div>
        <div>
          <div className="sidebar-logo-text">IDCard<span>Pro</span></div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{admin?.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Shop Admin'}</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {filteredNav.map(({ section, items }) => (
          <div key={section}>
            {items.length > 0 && <div className="nav-section-label">{section}</div>}
            {items.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href}
                className={`nav-item ${pathname === href || (href !== '/dashboard' && pathname.startsWith(href)) ? 'active' : ''}`}>
                <Icon size={17} />
                {label}
              </Link>
            ))}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <div className="avatar" style={{ width: 32, height: 32, fontSize: 12 }}>
            {admin?.name?.[0] || 'A'}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{admin?.name}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{admin?.role}</div>
          </div>
        </div>
        <button className="btn btn-secondary btn-sm" style={{ width: '100%' }} onClick={logout}>
          <FiLogOut size={14} /> Sign Out
        </button>
      </div>
    </aside>
  );
}
