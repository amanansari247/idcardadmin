'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const FIELDS = {
  photo:          { label: 'Photo Box',          type: 'box', defaultW: 18, defaultH: 25 },
  schoolName:     { label: 'School Name',        defaultFontSize: 12 },
  schoolLogo:     { label: 'School Logo',        type: 'box', defaultW: 10, defaultH: 12 },
  name:           { label: 'Student Name',       defaultFontSize: 14 },
  fatherName:     { label: "Father's Name",      defaultFontSize: 11 },
  studentId:      { label: 'Student ID',         defaultFontSize: 10 },
  class:          { label: 'Class',              defaultFontSize: 10 },
  section:        { label: 'Section',            defaultFontSize: 10 },
  rollNo:         { label: 'Roll No',            defaultFontSize: 10 },
  mobile:         { label: 'Mobile No',          defaultFontSize: 9 },
  dob:            { label: 'Date of Birth',      defaultFontSize: 9 },
  bloodGroup:     { label: 'Blood Group',        defaultFontSize: 9 },
  address:        { label: 'Address',            defaultFontSize: 9 },
  principalSign:  { label: 'Principal Signature', type: 'box', defaultW: 14, defaultH: 8 },
};

const SAMPLE = {
  schoolName: 'DELHI PUBLIC SCHOOL', name: 'RAHUL SHARMA', fatherName: 'MR. VIJAY SHARMA',
  studentId: 'STU-2024-001', class: 'X', section: 'A', rollNo: '24',
  mobile: '9876543210', dob: '15/08/2008', bloodGroup: 'O+', address: 'New Delhi',
};

function makeDefaultLayout() {
  const layout = {};
  let yPos = 10;
  Object.entries(FIELDS).forEach(([key, cfg]) => {
    layout[key] = {
      enabled: false, x: 5, y: yPos,
      fontSize: cfg.defaultFontSize || 10,
      color: '#000000',
      ...(cfg.type === 'box' ? { width: cfg.defaultW, height: cfg.defaultH } : {}),
    };
    yPos += 9;
  });
  return layout;
}

export default function TemplatesPage() {
  const { admin } = useAuth();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);

  // Editor state
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingTpl, setEditingTpl] = useState(null);
  const [tplName, setTplName] = useState('');
  const [bgFile, setBgFile] = useState(null);
  const [bgUrl, setBgUrl] = useState('');
  const [layout, setLayout] = useState({});
  const [activeField, setActiveField] = useState(null);
  const [saving, setSaving] = useState(false);

  // Drag state
  const canvasRef = useRef(null);
  const dragRef = useRef({ dragging: false, field: null, offsetX: 0, offsetY: 0 });

  const fetchTemplates = useCallback(async () => {
    try {
      const r = await api.get('/templates/mine');
      setTemplates(r.data.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchTemplates(); }, [fetchTemplates]);

  // --- Editor Open/Close ---
  const openNew = () => {
    setEditingTpl(null); setTplName(''); setBgFile(null); setBgUrl('');
    setLayout(makeDefaultLayout()); setActiveField(null); setEditorOpen(true);
  };
  const openEdit = (tpl) => {
    setEditingTpl(tpl); setTplName(tpl.name);
    setBgFile(null); setBgUrl(tpl.imageUrl ? `${API_URL}${tpl.imageUrl}` : '');
    setLayout(tpl.layoutJson || makeDefaultLayout());
    setActiveField(null); setEditorOpen(true);
  };
  const closeEditor = () => { setEditorOpen(false); setEditingTpl(null); };

  // --- Background Upload ---
  const onBgSelect = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setBgFile(f); setBgUrl(URL.createObjectURL(f));
  };

  // --- Field Toggle ---
  const toggleField = (key) => {
    setLayout(prev => ({ ...prev, [key]: { ...prev[key], enabled: !prev[key].enabled } }));
  };

  // --- Mouse Drag on Canvas ---
  const onMouseDown = (e, field) => {
    e.preventDefault(); e.stopPropagation();
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const elemRect = e.currentTarget.getBoundingClientRect();
    dragRef.current = {
      dragging: true, field,
      offsetX: e.clientX - elemRect.left,
      offsetY: e.clientY - elemRect.top,
    };
    setActiveField(field);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const onMouseMove = useCallback((e) => {
    const d = dragRef.current;
    if (!d.dragging || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left - d.offsetX) / rect.width) * 100;
    const y = ((e.clientY - rect.top - d.offsetY) / rect.height) * 100;
    const sx = Math.max(0, Math.min(95, x));
    const sy = Math.max(0, Math.min(95, y));
    setLayout(prev => ({
      ...prev, [d.field]: { ...prev[d.field], x: Math.round(sx * 10) / 10, y: Math.round(sy * 10) / 10 }
    }));
  }, []);

  const onMouseUp = useCallback(() => {
    dragRef.current.dragging = false;
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
  }, [onMouseMove]);

  // --- Save ---
  const handleSave = async () => {
    if (!tplName.trim()) { toast.error('Enter a template name'); return; }
    if (!bgUrl && !bgFile) { toast.error('Upload a background image'); return; }
    setSaving(true);
    try {
      if (editingTpl) {
        await api.put(`/templates/${editingTpl.id}`, { name: tplName, layoutJson: layout });
        toast.success('Template updated!');
      } else {
        const fd = new FormData();
        fd.append('name', tplName);
        fd.append('layoutJson', JSON.stringify(layout));
        if (bgFile) fd.append('background', bgFile);
        await api.post('/templates', fd);
        toast.success('Template created!');
      }
      closeEditor(); fetchTemplates();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally { setSaving(false); }
  };

  // --- Delete ---
  const handleDelete = async (id) => {
    if (!confirm('Delete this template permanently?')) return;
    try { await api.delete(`/templates/${id}`); fetchTemplates(); toast.success('Deleted'); }
    catch { toast.error('Delete failed'); }
  };

  // --- Field Settings Update ---
  const updateField = (key, prop, val) => {
    setLayout(prev => ({ ...prev, [key]: { ...prev[key], [prop]: val } }));
  };

  // ======================== RENDER ========================
  if (editorOpen) {
    return (
      <div>
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1>✏️ {editingTpl ? 'Edit Template' : 'New Template'}</h1>
            <p>Upload a background image, enable fields, and drag them to position.</p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-secondary" onClick={closeEditor}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? <span className="spinner"/> : '💾'} {editingTpl ? 'Update' : 'Save Template'}
            </button>
          </div>
        </div>

        {/* Template Name */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Template Name *</label>
            <input className="form-input" value={tplName} onChange={e => setTplName(e.target.value)}
              placeholder="e.g. Blue Elegant Card" style={{ maxWidth: 400 }} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr 280px', gap: 20, alignItems: 'start' }}>

          {/* LEFT: Field Toggles */}
          <div className="card card-sm">
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 }}>
              Available Fields
            </div>
            {Object.entries(FIELDS).map(([key, cfg]) => (
              <div key={key} onClick={() => toggleField(key)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 12px', borderRadius: 8, cursor: 'pointer', marginBottom: 4,
                  border: `1px solid ${layout[key]?.enabled ? 'rgba(59,130,246,0.4)' : 'transparent'}`,
                  background: layout[key]?.enabled ? 'rgba(59,130,246,0.08)' : 'transparent',
                  transition: 'all 0.15s',
                }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: layout[key]?.enabled ? '#fff' : 'var(--text-muted)' }}>
                  {cfg.label}
                </span>
                <div style={{
                  width: 18, height: 18, borderRadius: '50%',
                  border: `2px solid ${layout[key]?.enabled ? '#3B82F6' : 'var(--border)'}`,
                  background: layout[key]?.enabled ? '#3B82F6' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, color: '#fff'
                }}>
                  {layout[key]?.enabled ? '✓' : ''}
                </div>
              </div>
            ))}
          </div>

          {/* CENTER: Canvas */}
          <div>
            {!bgUrl ? (
              <label style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                aspectRatio: '3.375 / 2.125', border: '2px dashed var(--border)', borderRadius: 16,
                cursor: 'pointer', background: 'var(--bg-secondary)', transition: 'border-color 0.2s',
              }}>
                <div style={{ fontSize: 48, marginBottom: 12, opacity: 0.3 }}>🖼️</div>
                <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>Upload Card Background</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>86mm × 54mm recommended (JPG/PNG)</div>
                <input type="file" accept="image/*" onChange={onBgSelect} style={{ display: 'none' }} />
              </label>
            ) : (
              <div style={{ position: 'relative' }}>
                <div ref={canvasRef}
                  style={{
                    position: 'relative', aspectRatio: '3.375 / 2.125', borderRadius: 12,
                    overflow: 'hidden', backgroundImage: `url(${bgUrl})`, backgroundSize: '100% 100%',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)',
                    cursor: 'crosshair',
                  }}>
                  {Object.entries(layout).map(([key, cfg]) => {
                    if (!cfg.enabled) return null;
                    const isBox = FIELDS[key]?.type === 'box';
                    const boxLabels = { photo: '📷 PHOTO', schoolLogo: '🏫 LOGO', principalSign: '✍️ SIGN' };
                    return (
                      <div key={key}
                        onMouseDown={(e) => onMouseDown(e, key)}
                        onClick={(e) => { e.stopPropagation(); setActiveField(key); }}
                        style={{
                          position: 'absolute', left: `${cfg.x}%`, top: `${cfg.y}%`,
                          cursor: 'grab', userSelect: 'none', zIndex: activeField === key ? 50 : 10,
                          padding: isBox ? 0 : '2px 4px', borderRadius: 3,
                          outline: activeField === key ? '2px solid #3B82F6' : '1px dashed rgba(59,130,246,0.4)',
                          background: activeField === key ? 'rgba(59,130,246,0.15)' : 'transparent',
                          transition: 'outline 0.1s, background 0.1s',
                        }}>
                        {isBox ? (
                          <div style={{
                            width: `${cfg.width || 18}%`, height: `${cfg.height || 25}%`,
                            minWidth: 30, minHeight: 20,
                            background: 'rgba(200,200,200,0.7)', border: '1px dashed #999',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 8, color: '#555', borderRadius: 3, fontWeight: 700,
                          }}>{boxLabels[key] || key}</div>
                        ) : (
                          <span style={{
                            display: 'inline-block',
                            width: cfg.width ? `${cfg.width}%` : 'auto',
                            textAlign: cfg.align || 'left',
                            fontSize: cfg.fontSize || 10, color: cfg.color || '#000',
                            fontWeight: ['name','schoolName'].includes(key) ? 'bold' : 'normal',
                            wordWrap: 'break-word', textShadow: '0 0 3px rgba(255,255,255,0.5)',
                          }}>
                            {SAMPLE[key] || FIELDS[key].label}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
                {/* Change BG button */}
                <label style={{
                  position: 'absolute', top: 10, right: 10, background: 'rgba(0,0,0,0.6)',
                  color: '#fff', padding: '6px 12px', borderRadius: 8, fontSize: 12, cursor: 'pointer',
                  backdropFilter: 'blur(8px)', fontWeight: 600,
                }}>
                  🖼️ Change
                  <input type="file" accept="image/*" onChange={onBgSelect} style={{ display: 'none' }} />
                </label>
                <div style={{ marginTop: 12, fontSize: 11, color: 'var(--text-muted)', textAlign: 'center' }}>
                  🖱️ Drag fields to position • Click a field to edit its properties • Positions saved as %
                </div>
              </div>
            )}
          </div>

          {/* RIGHT: Field Settings */}
          <div className="card card-sm">
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 }}>
              Field Settings
            </div>
            {activeField && layout[activeField] ? (
              <div>
                <div style={{
                  background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)',
                  borderRadius: 10, padding: 12, marginBottom: 16, fontWeight: 700, fontSize: 14, color: '#3B82F6'
                }}>
                  {FIELDS[activeField]?.label}
                </div>

                {/* Position display */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                  <div>
                    <label style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700 }}>X Position</label>
                    <input className="form-input" type="number" step="0.5" min="0" max="100"
                      value={layout[activeField].x} onChange={e => updateField(activeField, 'x', parseFloat(e.target.value) || 0)}
                      style={{ padding: '6px 10px', fontSize: 13 }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700 }}>Y Position</label>
                    <input className="form-input" type="number" step="0.5" min="0" max="100"
                      value={layout[activeField].y} onChange={e => updateField(activeField, 'y', parseFloat(e.target.value) || 0)}
                      style={{ padding: '6px 10px', fontSize: 13 }} />
                  </div>
                </div>

                {/* Font Size - text fields only */}
                {FIELDS[activeField]?.type !== 'box' && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <label style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700 }}>Font Size</label>
                      <span style={{ fontSize: 12, fontWeight: 700 }}>{layout[activeField].fontSize}px</span>
                    </div>
                    <input type="range" min="6" max="36" value={layout[activeField].fontSize}
                      onChange={e => updateField(activeField, 'fontSize', parseInt(e.target.value))}
                      style={{ width: '100%', accentColor: '#3B82F6' }} />
                  </div>
                )}

                {/* Color - text fields only */}
                {FIELDS[activeField]?.type !== 'box' && (
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, display: 'block', marginBottom: 6 }}>Text Color</label>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <input type="color" value={layout[activeField].color || '#000000'}
                        onChange={e => updateField(activeField, 'color', e.target.value)}
                        style={{ width: 40, height: 40, border: 'none', borderRadius: 8, cursor: 'pointer' }} />
                      <input className="form-input" value={layout[activeField].color || '#000000'}
                        onChange={e => updateField(activeField, 'color', e.target.value)}
                        style={{ padding: '6px 10px', fontSize: 12, fontFamily: 'monospace', flex: 1 }} />
                    </div>
                  </div>
                )}
                
                {/* Text Width & Alignment */}
                {FIELDS[activeField]?.type !== 'box' && (
                  <div>
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <label style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700 }}>Max Width % (Wrap)</label>
                        <span style={{ fontSize: 12, fontWeight: 700 }}>{layout[activeField].width || 100}%</span>
                      </div>
                      <input type="range" min="10" max="100" value={layout[activeField].width || 100}
                        onChange={e => updateField(activeField, 'width', parseInt(e.target.value))}
                        style={{ width: '100%', accentColor: '#3B82F6' }} />
                    </div>
                    <div style={{ marginBottom: 16 }}>
                      <label style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, display: 'block', marginBottom: 6 }}>Alignment</label>
                      <select className="form-select" style={{ fontSize: 13 }} value={layout[activeField].align || 'left'} onChange={e => updateField(activeField, 'align', e.target.value)}>
                        <option value="left">Left</option>
                        <option value="center">Center</option>
                        <option value="right">Right</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* Width/Height - box fields (photo, logo, signature) */}
                {FIELDS[activeField]?.type === 'box' && (
                  <div>
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <label style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700 }}>Width %</label>
                        <span style={{ fontSize: 12, fontWeight: 700 }}>{layout[activeField].width || 18}%</span>
                      </div>
                      <input type="range" min="3" max="50" value={layout[activeField].width || 18}
                        onChange={e => updateField(activeField, 'width', parseInt(e.target.value))}
                        style={{ width: '100%', accentColor: '#3B82F6' }} />
                    </div>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <label style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700 }}>Height %</label>
                        <span style={{ fontSize: 12, fontWeight: 700 }}>{layout[activeField].height || 25}%</span>
                      </div>
                      <input type="range" min="3" max="60" value={layout[activeField].height || 25}
                        onChange={e => updateField(activeField, 'height', parseInt(e.target.value))}
                        style={{ width: '100%', accentColor: '#3B82F6' }} />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--text-muted)', fontSize: 13 }}>
                <div style={{ fontSize: 36, marginBottom: 12, opacity: 0.2 }}>👆</div>
                Click any field on the card to edit its properties
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ======================== TEMPLATE LIST ========================
  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>🎨 Custom ID Templates</h1>
          <p>Upload your card backgrounds and position student fields for ID card generation.</p>
        </div>
        <button className="btn btn-primary" onClick={openNew}>+ New Template</button>
      </div>

      {loading ? (
        <div className="page-loader"><div className="spinner" /></div>
      ) : templates.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">🎨</div>
            <h3>No templates yet</h3>
            <p>Upload your first ID card background and design the field layout.</p>
            <button className="btn btn-primary" onClick={openNew}>+ Create First Template</button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
          {templates.map(tpl => (
            <div key={tpl.id} className="card card-sm" style={{ overflow: 'hidden', padding: 0 }}>
              <div style={{ aspectRatio: '3.375 / 2.125', background: '#1a1a2e', position: 'relative', overflow: 'hidden' }}>
                {tpl.imageUrl ? (
                  <img src={`${API_URL}${tpl.imageUrl}`} alt={tpl.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                    No Background
                  </div>
                )}
                {/* Hover overlay */}
                <div style={{
                  position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  opacity: 0, transition: 'opacity 0.2s',
                }}
                  onMouseEnter={e => e.currentTarget.style.opacity = 1}
                  onMouseLeave={e => e.currentTarget.style.opacity = 0}
                >
                  <button className="btn btn-primary btn-sm" onClick={() => openEdit(tpl)}>Edit Layout</button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(tpl.id)}>Delete</button>
                </div>
              </div>
              <div style={{ padding: '12px 16px' }}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{tpl.name}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {new Date(tpl.createdAt).toLocaleDateString()}
                  </span>
                  <span className="badge badge-blue" style={{ fontSize: 10 }}>
                    {tpl._count?.schools || 0} schools
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
