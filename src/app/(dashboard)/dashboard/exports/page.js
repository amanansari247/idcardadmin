'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import Cookies from 'js-cookie';
import toast from 'react-hot-toast';
import { FiSearch, FiDownload, FiFileText } from 'react-icons/fi';

export default function ExportsPage() {
  const [schools, setSchools] = useState([]);
  const [schoolId, setSchoolId] = useState('');
  const [cls, setCls] = useState('');
  const [section, setSection] = useState('');

  useEffect(() => { api.get('/schools', { params: { limit: 200 } }).then(r => setSchools(r.data.data.schools)); }, []);

  const exportExcel = () => {
    if (!schoolId) { toast.error('Select a school'); return; }
    const p = new URLSearchParams({ schoolId, ...(cls && { class: cls }), ...(section && { section }), token: Cookies.get('admin_token') || '' });
    window.open(`${process.env.NEXT_PUBLIC_API_URL}/export/excel?${p}`, '_blank');
  };

  const exportPDF = () => {
    if (!schoolId) { toast.error('Select a school'); return; }
    const p = new URLSearchParams({ schoolId, ...(cls && { class: cls }), ...(section && { section }), token: Cookies.get('admin_token') || '' });
    window.open(`${process.env.NEXT_PUBLIC_API_URL}/export/pdf-list?${p}`, '_blank');
  };

  const exportIDCards = () => {
    if (!schoolId) { toast.error('Select a school'); return; }
    const p = new URLSearchParams({ schoolId, ...(cls && { class: cls }), ...(section && { section }), token: Cookies.get('admin_token') || '' });
    window.open(`${process.env.NEXT_PUBLIC_API_URL}/export/idcards-pdf?${p}`, '_blank');
  };

  const CLASSES = ['1','2','3','4','5','6','7','8','9','10','11','12'];
  const SECTIONS = ['A','B','C','D','E','F'];

  return (
    <div>
      <div className="page-header">
        <h1>Export Data</h1>
        <p>Export student data as Excel or PDF reports.</p>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-header"><div className="card-title">Export Filters</div></div>
          <div className="form-group">
            <label className="form-label">School *</label>
            <select className="form-select" value={schoolId} onChange={e => setSchoolId(e.target.value)}>
              <option value="">-- Select School --</option>
              {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Class (optional)</label>
              <select className="form-select" value={cls} onChange={e => setCls(e.target.value)}>
                <option value="">All Classes</option>
                {CLASSES.map(c => <option key={c} value={c}>Class {c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Section (optional)</label>
              <select className="form-select" value={section} onChange={e => setSection(e.target.value)}>
                <option value="">All Sections</option>
                {SECTIONS.map(s => <option key={s} value={s}>Section {s}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:12, marginTop:8 }}>
            <button className="btn btn-success" style={{ flex:1, minWidth: '150px' }} onClick={exportExcel}>
              <FiDownload size={15}/> Excel Report
            </button>
            <button className="btn btn-primary" style={{ flex:1, minWidth: '150px' }} onClick={exportPDF}>
              <FiFileText size={15}/> Student List PDF
            </button>
            <button className="btn btn-purple" style={{ flex:'1 1 100%', marginTop: 4 }} onClick={exportIDCards}>
              <FiDownload size={15}/> Download Final ID Cards (PDF)
            </button>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><div className="card-title">📋 Export Guide</div></div>
          {[
            ['Excel Report', 'Full student data in spreadsheet format with all details and student photos embedded.'],
            ['PDF Student List', 'A4 student list in a table format, useful for attendance or record keeping.'],
            ['Final ID Cards (PDF)', 'High-resolution student ID cards generated using your custom template and layout settings. Ready for printing on 86x54mm cards.'],
          ].map(([title, desc]) => (
            <div key={title} style={{ padding:'14px 0', borderBottom:'1px solid var(--border)' }}>
              <div style={{ fontWeight:600, marginBottom:4 }}>{title}</div>
              <div style={{ fontSize:13, color:'var(--text-secondary)' }}>{desc}</div>
            </div>
          ))}
          <div style={{ marginTop:16, padding:12, borderRadius:8, background:'rgba(59,130,246,0.08)', border:'1px solid rgba(59,130,246,0.2)' }}>
            <div style={{ fontSize:13, color:'var(--accent-blue)', fontWeight:600 }}>💡 Pro Tip</div>
            <div style={{ fontSize:12, color:'var(--text-secondary)', marginTop:4 }}>
              Leave Class and Section empty to export the full school data. Filter by class for class-wise reports.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
