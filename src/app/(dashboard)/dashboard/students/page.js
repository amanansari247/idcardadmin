'use client';
import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import Cookies from 'js-cookie';
import { FiSearch, FiX, FiDownload, FiTrash2 } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function StudentsPage() {
  const [students, setStudents] = useState([]);
  const [schools, setSchools] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [schoolId, setSchoolId] = useState('');
  const [cls, setCls] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get('/students', { params: { page, limit: 20, search, schoolId, class: cls } });
      setStudents(r.data.data.students);
      setTotal(r.data.data.total);
    } finally { setLoading(false); }
  }, [page, search, schoolId, cls]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { api.get('/schools', { params: { limit: 200 } }).then(r => setSchools(r.data.data.schools)); }, []);

  const exportExcel = () => {
    const params = new URLSearchParams({ schoolId, class: cls, token: Cookies.get('admin_token') || '' });
    window.open(`${process.env.NEXT_PUBLIC_API_URL}/export/excel?${params}`, '_blank');
  };
  const exportPDF = () => {
    const params = new URLSearchParams({ schoolId, class: cls, token: Cookies.get('admin_token') || '' });
    window.open(`${process.env.NEXT_PUBLIC_API_URL}/export/pdf-list?${params}`, '_blank');
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this student?')) return;
    try {
      await api.delete(`/students/${id}`);
      toast.success('Student deleted successfully');
      load();
    } catch (e) {
      toast.error('Failed to delete student');
    }
  };

  const totalPages = Math.ceil(total / 20);
  const CLASSES = ['1','2','3','4','5','6','7','8','9','10','11','12'];

  return (
    <div>
      <div className="page-header">
        <h1>Students</h1>
        <p>View all students across all schools.</p>
      </div>

      <div className="toolbar">
        <div className="toolbar-left">
          <div className="search-bar">
            <FiSearch />
            <input placeholder="Search students..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
            {search && <button onClick={() => setSearch('')} style={{ background:'none',border:'none',cursor:'pointer',color:'var(--text-muted)' }}><FiX size={14}/></button>}
          </div>
          <select className="form-select" style={{ width:180 }} value={schoolId} onChange={e => { setSchoolId(e.target.value); setPage(1); }}>
            <option value="">All Schools</option>
            {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select className="form-select" style={{ width:120 }} value={cls} onChange={e => { setCls(e.target.value); setPage(1); }}>
            <option value="">All Classes</option>
            {CLASSES.map(c => <option key={c} value={c}>Class {c}</option>)}
          </select>
          <span style={{ color:'var(--text-muted)', fontSize:13 }}>{total} students</span>
        </div>
        <div className="toolbar-right">
          <button className="btn btn-secondary btn-sm" onClick={exportExcel}><FiDownload size={13}/> Excel</button>
          <button className="btn btn-secondary btn-sm" onClick={exportPDF}><FiDownload size={13}/> PDF</button>
        </div>
      </div>

      <div className="table-wrapper">
        <table>
          <thead><tr>
            <th>Student</th><th>ID</th><th>Class</th><th>Father</th><th>Mobile</th><th>Blood</th><th>School</th><th>Actions</th>
          </tr></thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ textAlign:'center', padding:40 }}><div className="spinner"/></td></tr>
            ) : students.length === 0 ? (
              <tr><td colSpan={7}><div className="empty-state"><div className="empty-state-icon">👤</div><h3>No students found</h3></div></td></tr>
            ) : students.map(s => (
              <tr key={s.id}>
                <td>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    {s.photoUrl
                      ? <img src={`${process.env.NEXT_PUBLIC_UPLOADS_URL}${s.photoUrl}`} style={{ width:34,height:34,borderRadius:'50%',objectFit:'cover',border:'2px solid var(--border)' }} alt=""/>
                      : <div className="avatar" style={{ width:34,height:34,fontSize:12 }}>{s.name[0]}</div>
                    }
                    <div>
                      <div style={{ fontWeight:600 }}>{s.name}</div>
                      <div style={{ fontSize:11,color:'var(--text-muted)' }}>{s.address?.slice(0,30)}</div>
                    </div>
                  </div>
                </td>
                <td><code style={{ fontSize:12, color:'var(--accent-cyan)' }}>{s.studentId}</code></td>
                <td><span className="badge badge-blue">Class {s.class}{s.section ? ` - ${s.section}` : ''}</span></td>
                <td style={{ color:'var(--text-secondary)', fontSize:13 }}>{s.fatherName || '—'}</td>
                <td style={{ fontSize:13 }}>{s.mobile || '—'}</td>
                <td>{s.bloodGroup ? <span className="badge badge-red">{s.bloodGroup}</span> : '—'}</td>
                <td style={{ fontSize:12, color:'var(--text-muted)' }}>{s.schoolId?.slice(0,8)}…</td>
                <td>
                  <button onClick={() => handleDelete(s.id)} style={{ background:'none', border:'none', color:'#ef4444', cursor:'pointer', padding:5 }}>
                    <FiTrash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button className="page-btn" disabled={page===1} onClick={() => setPage(p=>p-1)}>‹</button>
          {Array.from({length:Math.min(totalPages,7)},(_,i)=>i+1).map(p=>(
            <button key={p} className={`page-btn ${p===page?'active':''}`} onClick={() => setPage(p)}>{p}</button>
          ))}
          <button className="page-btn" disabled={page===totalPages} onClick={() => setPage(p=>p+1)}>›</button>
        </div>
      )}
    </div>
  );
}
