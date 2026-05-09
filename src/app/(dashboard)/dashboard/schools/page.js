'use client';
import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit2, FiTrash2, FiKey, FiSearch, FiX, FiUpload, FiCheck } from 'react-icons/fi';

const EMPTY = { name:'', address:'', city:'', state:'', phone:'', email:'', primaryColor:'#1E40AF', accentColor:'#F59E0B', principalName:'' };

export default function SchoolsPage() {
  const [schools, setSchools] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [keySchoolId, setKeySchoolId] = useState(null);
  const [keys, setKeys] = useState([]);
  const [generatingKey, setGeneratingKey] = useState(false);
  const [logoFile, setLogoFile] = useState(null);
  const [signatureFile, setSignatureFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [sigPreview, setSigPreview] = useState(null);
  const [editingSchool, setEditingSchool] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get('/schools', { params: { page, limit: 15, search } });
      setSchools(r.data.data.schools);
      setTotal(r.data.data.total);
    } finally { setLoading(false); }
  }, [page, search]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setForm(EMPTY); setEditId(null); setLogoFile(null); setSignatureFile(null);
    setLogoPreview(null); setSigPreview(null); setEditingSchool(null); setModal('create');
  };

  const openEdit = (s) => {
    setForm({
      name: s.name, address: s.address||'', city: s.city||'', state: s.state||'',
      phone: s.phone||'', email: s.email||'', primaryColor: s.primaryColor||'#1E40AF',
      accentColor: s.accentColor||'#F59E0B', principalName: s.principalName||''
    });
    setEditId(s.id); setLogoFile(null); setSignatureFile(null);
    setLogoPreview(s.logoUrl ? `${process.env.NEXT_PUBLIC_UPLOADS_URL}${s.logoUrl}` : null);
    setSigPreview(s.principalSignatureUrl ? `${process.env.NEXT_PUBLIC_UPLOADS_URL}${s.principalSignatureUrl}` : null);
    setEditingSchool(s); setModal('edit');
  };

  const openKeys = async (s) => {
    setKeySchoolId(s.id); setModal('key');
    const r = await api.get(`/activation/school/${s.id}`);
    setKeys(r.data.data);
  };

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    if (type === 'logo') { setLogoFile(file); setLogoPreview(url); }
    else { setSignatureFile(file); setSigPreview(url); }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      let res;
      if (editId) res = await api.put(`/schools/${editId}`, form);
      else res = await api.post('/schools', form);
      const schoolId = res.data.data.id;

      const uploads = [];
      if (logoFile) {
        const fd = new FormData(); fd.append('logo', logoFile);
        uploads.push(api.post(`/schools/${schoolId}/logo`, fd, { headers: { 'Content-Type': 'multipart/form-data' } }));
      }
      if (signatureFile) {
        const fd = new FormData(); fd.append('signature', signatureFile);
        uploads.push(api.post(`/schools/${schoolId}/signature`, fd, { headers: { 'Content-Type': 'multipart/form-data' } }));
      }
      if (uploads.length > 0) await Promise.all(uploads);

      toast.success(editId ? 'School updated!' : 'School created!');
      setModal(null); load();
    } catch(e) { toast.error(e.response?.data?.message || 'Error saving school'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this school and ALL its student data? This cannot be undone.')) return;
    await api.delete(`/schools/${id}`);
    toast.success('School deleted'); load();
  };

  const generateKey = async () => {
    setGeneratingKey(true);
    try {
      const r = await api.post('/activation/generate', { schoolId: keySchoolId, multiDevice: true, maxDevices: 5 });
      setKeys(k => [r.data.data, ...k]);
      toast.success('Key generated! Click to copy');
    } finally { setGeneratingKey(false); }
  };

  const copyKey = (key) => { navigator.clipboard.writeText(key); toast.success('Copied!'); };
  const totalPages = Math.ceil(total / 15);

  return (
    <div>
      <div className="page-header">
        <h1>Schools</h1>
        <p>Manage all registered schools. Each school gets its own ID card branding, principal signature and activation keys.</p>
      </div>

      <div className="toolbar">
        <div className="toolbar-left">
          <div className="search-bar">
            <FiSearch />
            <input placeholder="Search schools..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
            {search && <button onClick={() => setSearch('')} style={{ background:'none',border:'none',cursor:'pointer',color:'var(--text-muted)' }}><FiX size={14}/></button>}
          </div>
          <span style={{ color:'var(--text-muted)', fontSize:13 }}>{total} schools</span>
        </div>
        <div className="toolbar-right">
          <button className="btn btn-primary" onClick={openCreate}><FiPlus size={16}/> Add School</button>
        </div>
      </div>

      <div className="table-wrapper">
        <table>
          <thead><tr>
            <th>School</th><th>Location</th><th>Principal</th>
            <th>Students</th><th>Keys</th><th>Status</th><th>Actions</th>
          </tr></thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ textAlign:'center', padding:40 }}><div className="spinner" /></td></tr>
            ) : schools.length === 0 ? (
              <tr><td colSpan={7}>
                <div className="empty-state">
                  <div className="empty-state-icon">🏫</div>
                  <h3>No schools yet</h3>
                  <p>Add your first school to get started</p>
                  <button className="btn btn-primary" onClick={openCreate}><FiPlus size={16}/> Add School</button>
                </div>
              </td></tr>
            ) : schools.map(s => (
              <tr key={s.id}>
                <td>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    {s.logoUrl
                      ? <img src={`${process.env.NEXT_PUBLIC_UPLOADS_URL}${s.logoUrl}`} style={{ width:36,height:36,borderRadius:8,objectFit:'cover',border:'1px solid var(--border)' }} alt="" />
                      : <div style={{ width:36,height:36,borderRadius:8,background:`linear-gradient(135deg,${s.primaryColor},${s.accentColor})`,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,color:'white',fontSize:14 }}>{s.name[0]}</div>
                    }
                    <div>
                      <div style={{ fontWeight:600 }}>{s.name}</div>
                      <div style={{ fontSize:12,color:'var(--text-muted)' }}>{s.email || '—'}</div>
                    </div>
                  </div>
                </td>
                <td style={{ color:'var(--text-secondary)', fontSize:13 }}>{[s.city, s.state].filter(Boolean).join(', ') || '—'}</td>
                <td style={{ fontSize:13 }}>
                  <div>{s.principalName || <span style={{color:'var(--text-muted)'}}>—</span>}</div>
                  {s.principalSignatureUrl && <span style={{fontSize:11,color:'var(--accent-green)'}}>✓ Signature</span>}
                </td>
                <td><span className="badge badge-blue">{s._count?.students ?? 0}</span></td>
                <td><span className="badge badge-purple">{s._count?.activationKeys ?? 0}</span></td>
                <td><span className={`badge ${s.isActive ? 'badge-green' : 'badge-red'}`}>{s.isActive ? 'Active' : 'Inactive'}</span></td>
                <td>
                  <div style={{ display:'flex', gap:6 }}>
                    <button className="btn btn-secondary btn-sm btn-icon" onClick={() => openKeys(s)} title="Keys"><FiKey size={13}/></button>
                    <button className="btn btn-secondary btn-sm btn-icon" onClick={() => openEdit(s)} title="Edit"><FiEdit2 size={13}/></button>
                    <button className="btn btn-danger btn-sm btn-icon" onClick={() => handleDelete(s.id)} title="Delete"><FiTrash2 size={13}/></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button className="page-btn" disabled={page===1} onClick={() => setPage(p=>p-1)}>‹</button>
          {Array.from({length:totalPages},(_,i)=>i+1).slice(Math.max(0,page-3), page+2).map(p=>(
            <button key={p} className={`page-btn ${p===page?'active':''}`} onClick={() => setPage(p)}>{p}</button>
          ))}
          <button className="page-btn" disabled={page===totalPages} onClick={() => setPage(p=>p+1)}>›</button>
        </div>
      )}

      {/* Create/Edit Modal */}
      {(modal === 'create' || modal === 'edit') && (
        <div className="modal-overlay" onClick={e => e.target===e.currentTarget && setModal(null)}>
          <div className="modal modal-lg" style={{ maxWidth: 700 }}>
            <div className="modal-header">
              <div className="modal-title">{modal==='edit' ? '✏️ Edit School' : '🏫 Add New School'}</div>
              <button className="modal-close" onClick={() => setModal(null)}>✕</button>
            </div>

            <div style={{ padding: '0 24px 24px' }}>
              {/* School Identity */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>School Identity</div>
                <div className="form-grid">
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label">School Name *</label>
                    <input className="form-input" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="Springfield Public School"/>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input className="form-input" type="email" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} placeholder="info@school.edu"/>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone</label>
                    <input className="form-input" value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} placeholder="+91-XXXXXXXXXX"/>
                  </div>
                  <div className="form-group">
                    <label className="form-label">City</label>
                    <input className="form-input" value={form.city} onChange={e=>setForm(f=>({...f,city:e.target.value}))} placeholder="Mumbai"/>
                  </div>
                  <div className="form-group">
                    <label className="form-label">State</label>
                    <input className="form-input" value={form.state} onChange={e=>setForm(f=>({...f,state:e.target.value}))} placeholder="Maharashtra"/>
                  </div>
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label">Address</label>
                    <textarea className="form-textarea" value={form.address} onChange={e=>setForm(f=>({...f,address:e.target.value}))} placeholder="Full school address..." rows={2}/>
                  </div>
                </div>
              </div>

              {/* Principal Info */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Principal & Branding</div>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Principal Name</label>
                    <input className="form-input" value={form.principalName} onChange={e=>setForm(f=>({...f,principalName:e.target.value}))} placeholder="Dr. Rajesh Kumar"/>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Primary Color</label>
                    <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                      <input type="color" value={form.primaryColor} onChange={e=>setForm(f=>({...f,primaryColor:e.target.value}))} style={{ width:44,height:36,border:'1px solid var(--border)',borderRadius:6,cursor:'pointer',padding:2,background:'var(--bg-primary)' }}/>
                      <input className="form-input" value={form.primaryColor} onChange={e=>setForm(f=>({...f,primaryColor:e.target.value}))} style={{ flex:1 }}/>
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Accent Color</label>
                    <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                      <input type="color" value={form.accentColor} onChange={e=>setForm(f=>({...f,accentColor:e.target.value}))} style={{ width:44,height:36,border:'1px solid var(--border)',borderRadius:6,cursor:'pointer',padding:2,background:'var(--bg-primary)' }}/>
                      <input className="form-input" value={form.accentColor} onChange={e=>setForm(f=>({...f,accentColor:e.target.value}))} style={{ flex:1 }}/>
                    </div>
                  </div>
                </div>
              </div>

              {/* Upload Assets */}
              <div style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Upload Assets</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  {/* Logo Upload */}
                  <div>
                    <label className="form-label">School Logo</label>
                    <label style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', border:'2px dashed var(--border)', borderRadius:12, padding:16, cursor:'pointer', background: logoPreview ? 'transparent' : 'var(--bg-secondary)', minHeight: 120, position:'relative', overflow:'hidden' }}>
                      {logoPreview
                        ? <img src={logoPreview} style={{ maxHeight:100, maxWidth:'100%', objectFit:'contain', borderRadius:8 }} alt="Logo preview"/>
                        : <><FiUpload size={24} style={{color:'var(--text-muted)', marginBottom:8}}/><span style={{fontSize:12,color:'var(--text-muted)'}}>Click to upload logo</span></>
                      }
                      <input type="file" accept="image/*" onChange={e=>handleFileChange(e,'logo')} style={{display:'none'}}/>
                    </label>
                    {logoPreview && <div style={{fontSize:11,color:'var(--accent-green)',marginTop:4}}>✓ Logo ready to upload</div>}
                  </div>

                  {/* Signature Upload */}
                  <div>
                    <label className="form-label">Principal Signature <span style={{fontSize:11,color:'var(--accent-blue)'}}>(shown on ID cards)</span></label>
                    <label style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', border:'2px dashed var(--border)', borderRadius:12, padding:16, cursor:'pointer', background: sigPreview ? 'white' : 'var(--bg-secondary)', minHeight: 120, position:'relative', overflow:'hidden' }}>
                      {sigPreview
                        ? <img src={sigPreview} style={{ maxHeight:100, maxWidth:'100%', objectFit:'contain' }} alt="Signature preview"/>
                        : <><FiUpload size={24} style={{color:'var(--text-muted)', marginBottom:8}}/><span style={{fontSize:12,color:'var(--text-muted)'}}>Upload signature image</span><span style={{fontSize:11,color:'var(--text-muted)',marginTop:4}}>PNG with transparent bg preferred</span></>
                      }
                      <input type="file" accept="image/*" onChange={e=>handleFileChange(e,'signature')} style={{display:'none'}}/>
                    </label>
                    {sigPreview && <div style={{fontSize:11,color:'var(--accent-green)',marginTop:4}}>✓ Signature ready to upload</div>}
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving || !form.name}>
                {saving ? <span className="spinner"/> : <><FiCheck size={15}/> {modal==='edit' ? 'Save Changes' : 'Create School'}</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Keys Modal */}
      {modal === 'key' && (
        <div className="modal-overlay" onClick={e => e.target===e.currentTarget && setModal(null)}>
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">🔑 Activation Keys</div>
              <button className="modal-close" onClick={() => setModal(null)}>✕</button>
            </div>
            <button className="btn btn-primary" onClick={generateKey} disabled={generatingKey} style={{ width:'100%', marginBottom:16 }}>
              {generatingKey ? <span className="spinner"/> : <><FiPlus size={14}/> Generate New Key</>}
            </button>
            {keys.length === 0
              ? <div style={{ textAlign:'center', padding:'24px 0', color:'var(--text-muted)' }}>No keys yet. Generate one above.</div>
              : keys.map(k => (
                <div key={k.id} style={{ marginBottom:12 }}>
                  <div className="key-card" onClick={() => copyKey(k.key)}>{k.key}</div>
                  <div style={{ display:'flex', gap:8, marginTop:6, alignItems:'center', fontSize:12, color:'var(--text-muted)' }}>
                    <span className={`badge ${k.isActive ? 'badge-green' : 'badge-red'}`}>{k.isActive ? 'Active' : 'Inactive'}</span>
                    <span>{k._count?.devices ?? 0} / {k.maxDevices} devices</span>
                    {k.expiresAt && <span>Expires: {new Date(k.expiresAt).toLocaleDateString()}</span>}
                    <span style={{ marginLeft:'auto' }}>Click to copy</span>
                  </div>
                </div>
              ))
            }
          </div>
        </div>
      )}
    </div>
  );
}
