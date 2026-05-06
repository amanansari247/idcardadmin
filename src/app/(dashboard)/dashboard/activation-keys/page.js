'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { FiKey, FiSearch, FiTrash2, FiCopy } from 'react-icons/fi';

export default function ActivationKeysPage() {
  const [schools, setSchools] = useState([]);
  const [keys, setKeys] = useState([]);
  const [selectedSchool, setSelectedSchool] = useState('');
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [keyOptions, setKeyOptions] = useState({ multiDevice: true, maxDevices: 5, expiresAt: '' });

  useEffect(() => {
    api.get('/schools', { params: { limit: 200 } }).then(r => setSchools(r.data.data.schools));
  }, []);

  const loadKeys = async (sid) => {
    if (!sid) return;
    setLoading(true);
    const r = await api.get(`/activation/school/${sid}`);
    setKeys(r.data.data);
    setLoading(false);
  };

  const handleSchoolChange = (e) => { setSelectedSchool(e.target.value); loadKeys(e.target.value); };

  const generate = async () => {
    if (!selectedSchool) { toast.error('Select a school first'); return; }
    setGenerating(true);
    try {
      const r = await api.post('/activation/generate', {
        schoolId: selectedSchool, ...keyOptions,
        expiresAt: keyOptions.expiresAt || undefined,
        maxDevices: parseInt(keyOptions.maxDevices),
      });
      setKeys(k => [r.data.data, ...k]);
      toast.success('🔑 Activation key generated!');
    } catch(e) { toast.error(e.response?.data?.message || 'Error'); }
    finally { setGenerating(false); }
  };

  const copy = (key) => { navigator.clipboard.writeText(key); toast.success('Copied!'); };
  const remove = async (id) => {
    if (!confirm('Delete this key?')) return;
    await api.delete(`/activation/${id}`);
    setKeys(k => k.filter(x => x.id !== id));
    toast.success('Key deleted');
  };

  return (
    <div>
      <div className="page-header">
        <h1>Activation Keys</h1>
        <p>Generate and manage school activation keys for the mobile app.</p>
      </div>

      <div className="grid-2" style={{ marginBottom:24 }}>
        {/* Generator Panel */}
        <div className="card">
          <div className="card-header"><div className="card-title">🔑 Generate Key</div></div>
          <div className="form-group">
            <label className="form-label">Select School</label>
            <select className="form-select" value={selectedSchool} onChange={handleSchoolChange}>
              <option value="">-- Choose School --</option>
              {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Max Devices</label>
              <input className="form-input" type="number" min={1} max={100} value={keyOptions.maxDevices} onChange={e => setKeyOptions(o=>({...o,maxDevices:e.target.value}))}/>
            </div>
            <div className="form-group">
              <label className="form-label">Expiry Date</label>
              <input className="form-input" type="date" value={keyOptions.expiresAt} onChange={e => setKeyOptions(o=>({...o,expiresAt:e.target.value}))}/>
            </div>
          </div>
          <div className="form-group">
            <label style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer', color:'var(--text-secondary)', fontSize:13 }}>
              <input type="checkbox" checked={keyOptions.multiDevice} onChange={e => setKeyOptions(o=>({...o,multiDevice:e.target.checked}))} style={{ width:16,height:16 }}/>
              Allow Multiple Devices
            </label>
          </div>
          <button className="btn btn-primary" style={{ width:'100%' }} onClick={generate} disabled={generating||!selectedSchool}>
            {generating ? <span className="spinner"/> : <><FiKey size={14}/> Generate Key</>}
          </button>
        </div>

        {/* Info Panel */}
        <div className="card">
          <div className="card-header"><div className="card-title">ℹ️ How it works</div></div>
          {[
            ['1', 'Create a school', 'Add the school details in the Schools page.'],
            ['2', 'Generate a key', 'Use the form on the left to generate a unique key.'],
            ['3', 'Share the key', 'Send the key to the school admin.'],
            ['4', 'Activate the app', 'School enters the key in the mobile app to unlock.'],
          ].map(([num, title, desc]) => (
            <div key={num} style={{ display:'flex', gap:12, marginBottom:16 }}>
              <div style={{ width:28,height:28,borderRadius:'50%',background:'var(--gradient-1)',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,color:'white',fontSize:12,flexShrink:0 }}>{num}</div>
              <div>
                <div style={{ fontWeight:600, fontSize:13 }}>{title}</div>
                <div style={{ color:'var(--text-muted)', fontSize:12 }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Keys Table */}
      {selectedSchool && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">Keys for {schools.find(s=>s.id===selectedSchool)?.name}</div>
            <span style={{ color:'var(--text-muted)', fontSize:13 }}>{keys.length} keys</span>
          </div>
          {loading ? <div style={{ textAlign:'center', padding:30 }}><div className="spinner"/></div>
          : keys.length === 0 ? <div className="empty-state"><div className="empty-state-icon">🔑</div><h3>No keys yet</h3></div>
          : <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {keys.map(k => (
              <div key={k.id} style={{ background:'var(--bg-secondary)', border:'1px solid var(--border)', borderRadius:10, padding:'14px 16px', display:'flex', alignItems:'center', gap:12 }}>
                <code style={{ fontFamily:'monospace', fontSize:18, fontWeight:700, letterSpacing:3, color:'var(--accent-blue)', flex:1 }}>{k.key}</code>
                <span className={`badge ${k.isActive ? 'badge-green' : 'badge-red'}`}>{k.isActive ? 'Active' : 'Inactive'}</span>
                <span className="badge badge-purple">{k._count?.devices ?? 0}/{k.maxDevices} devices</span>
                {k.expiresAt && <span style={{ fontSize:12, color:'var(--text-muted)' }}>Exp: {new Date(k.expiresAt).toLocaleDateString()}</span>}
                <button className="btn btn-secondary btn-sm btn-icon" onClick={() => copy(k.key)}><FiCopy size={13}/></button>
                <button className="btn btn-danger btn-sm btn-icon" onClick={() => remove(k.id)}><FiTrash2 size={13}/></button>
              </div>
            ))}
          </div>}
        </div>
      )}
    </div>
  );
}
