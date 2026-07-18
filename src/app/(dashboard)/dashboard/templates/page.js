'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';

const API_URL = process.env.NEXT_PUBLIC_UPLOADS_URL || 'http://localhost:5000';

const FIELDS = {
  photo:          { label: 'Photo Box',            type: 'box',  defaultW: 18, defaultH: 25 },
  schoolName:     { label: 'School Name',          defaultFontSize: 12 },
  schoolLogo:     { label: 'School Logo',          type: 'box',  defaultW: 10, defaultH: 12 },
  name:           { label: 'Student Name',         defaultFontSize: 14 },
  fatherName:     { label: "Father's Name",        defaultFontSize: 11 },
  motherName:     { label: "Mother's Name",        defaultFontSize: 11 },
  studentId:      { label: 'Student ID',           defaultFontSize: 10 },
  class:          { label: 'Class',                defaultFontSize: 10 },
  section:        { label: 'Section',              defaultFontSize: 10 },
  rollNo:         { label: 'Roll No',              defaultFontSize: 10 },
  mobile:         { label: 'Mobile No',            defaultFontSize: 9  },
  dob:            { label: 'Date of Birth',        defaultFontSize: 9  },
  bloodGroup:     { label: 'Blood Group',          defaultFontSize: 9  },
  address:        { label: 'Address',              defaultFontSize: 9  },
  principalSign:  { label: 'Principal Signature',  type: 'box',  defaultW: 14, defaultH: 8 },
};

const SAMPLE = {
  schoolName:  'DELHI PUBLIC SCHOOL',
  name:        'RAHUL SHARMA',
  fatherName:  'MR. VIJAY KUMAR SHARMA',
  motherName:  'MRS. SUNITA SHARMA',
  studentId:   'STU-2024-001',
  class:       'X',
  section:     'A',
  rollNo:      '24',
  mobile:      '9876543210',
  dob:         '15/08/2008',
  bloodGroup:  'O+',
  address:     '123, Main Street, New Delhi - 110001',
};

const BOX_LABELS = {
  photo:         '📷 PHOTO',
  schoolLogo:    '🏫 LOGO',
  principalSign: '✍️ SIGN',
};

// Aspect ratios: horizontal = 3.375/2.125, vertical = 2.125/3.375
const ORIENTATIONS = {
  horizontal: { label: '⬛ Horizontal', ratio: 3.375 / 2.125 },
  vertical:   { label: '📱 Vertical',   ratio: 2.125 / 3.375 },
};

function makeDefaultLayout() {
  const layout = {};
  let yPos = 10;
  Object.entries(FIELDS).forEach(([key, cfg]) => {
    layout[key] = {
      enabled: false,
      x: 5,
      y: yPos,
      fontSize: cfg.defaultFontSize || 10,
      color: '#000000',
      width:  cfg.type === 'box' ? cfg.defaultW : 80,
      height: cfg.type === 'box' ? cfg.defaultH : undefined,
      align: 'left',
    };
    yPos += 8;
  });
  return layout;
}

// ─── Corner Resize Handle ────────────────────────────────────────────────────
function ResizeHandle({ corner, onResizeStart }) {
  const cursors = { nw: 'nw-resize', ne: 'ne-resize', sw: 'sw-resize', se: 'se-resize' };
  const positions = {
    nw: { top: -5, left: -5 },
    ne: { top: -5, right: -5 },
    sw: { bottom: -5, left: -5 },
    se: { bottom: -5, right: -5 },
  };
  return (
    <div
      onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); onResizeStart(e, corner); }}
      style={{
        position: 'absolute',
        width: 10, height: 10,
        background: '#3B82F6',
        border: '2px solid #fff',
        borderRadius: 2,
        cursor: cursors[corner],
        zIndex: 100,
        ...positions[corner],
      }}
    />
  );
}

export default function TemplatesPage() {
  const { admin } = useAuth();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);

  // Editor state
  const [editorOpen, setEditorOpen]   = useState(false);
  const [editingTpl, setEditingTpl]   = useState(null);
  const [tplName, setTplName]         = useState('');
  const [orientation, setOrientation] = useState('horizontal');
  const [bgFile, setBgFile]           = useState(null);
  const [bgUrl, setBgUrl]             = useState('');
  const [layout, setLayout]           = useState({});
  const [activeField, setActiveField] = useState(null);
  const [saving, setSaving]           = useState(false);

  // Drag / resize refs
  const canvasRef  = useRef(null);
  const dragRef    = useRef({ dragging: false, field: null, offsetX: 0, offsetY: 0 });
  const resizeRef  = useRef({ resizing: false, field: null, corner: null, startX: 0, startY: 0, startW: 0, startH: 0, canvasW: 0, canvasH: 0 });

  const fetchTemplates = useCallback(async () => {
    try {
      const r = await api.get('/templates/mine');
      setTemplates(r.data.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchTemplates(); }, [fetchTemplates]);

  // ── Editor Open/Close ──────────────────────────────────────────────────────
  const openNew = () => {
    setEditingTpl(null); setTplName(''); setBgFile(null); setBgUrl('');
    setOrientation('horizontal');
    setLayout(makeDefaultLayout()); setActiveField(null); setEditorOpen(true);
  };
  const openEdit = (tpl) => {
    setEditingTpl(tpl); setTplName(tpl.name);
    setBgFile(null); setBgUrl(tpl.imageUrl ? `${API_URL}${tpl.imageUrl}` : '');
    setOrientation(tpl.orientation || 'horizontal');
    setLayout(tpl.layoutJson || makeDefaultLayout());
    setActiveField(null); setEditorOpen(true);
  };
  const closeEditor = () => { setEditorOpen(false); setEditingTpl(null); };

  // ── Background Upload ──────────────────────────────────────────────────────
  const onBgSelect = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setBgFile(f); setBgUrl(URL.createObjectURL(f));
  };

  // ── Field Toggle ───────────────────────────────────────────────────────────
  const toggleField = (key) => {
    setLayout(prev => ({ ...prev, [key]: { ...prev[key], enabled: !prev[key].enabled } }));
  };

  // ── Drag (move) ────────────────────────────────────────────────────────────
  const onMouseDown = (e, field) => {
    e.preventDefault(); e.stopPropagation();
    if (!canvasRef.current) return;
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
    const x = ((e.clientX - rect.left - d.offsetX) / rect.width)  * 100;
    const y = ((e.clientY - rect.top  - d.offsetY) / rect.height) * 100;
    setLayout(prev => ({
      ...prev,
      [d.field]: {
        ...prev[d.field],
        x: Math.round(Math.max(0, Math.min(95, x)) * 10) / 10,
        y: Math.round(Math.max(0, Math.min(95, y)) * 10) / 10,
      },
    }));
  }, []);

  const onMouseUp = useCallback(() => {
    dragRef.current.dragging = false;
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
  }, [onMouseMove]);

  // ── Corner Resize ──────────────────────────────────────────────────────────
  const onResizeStart = useCallback((e, corner, field) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    resizeRef.current = {
      resizing: true, field, corner,
      startX: e.clientX, startY: e.clientY,
      startW: layout[field].width  || 18,
      startH: layout[field].height || 25,
      startPX: layout[field].x,
      startPY: layout[field].y,
      canvasW: rect.width,
      canvasH: rect.height,
    };
    document.addEventListener('mousemove', onResizeMove);
    document.addEventListener('mouseup', onResizeUp);
  }, [layout]);

  const onResizeMove = useCallback((e) => {
    const r = resizeRef.current;
    if (!r.resizing) return;
    const dxPct = ((e.clientX - r.startX) / r.canvasW) * 100;
    const dyPct = ((e.clientY - r.startY) / r.canvasH) * 100;

    let newW = r.startW, newH = r.startH, newX = r.startPX, newY = r.startPY;

    if (r.corner === 'se') {
      newW = Math.max(3, r.startW + dxPct);
      newH = Math.max(3, r.startH + dyPct);
    } else if (r.corner === 'sw') {
      newW = Math.max(3, r.startW - dxPct);
      newH = Math.max(3, r.startH + dyPct);
      newX = r.startPX + (r.startW - newW);
    } else if (r.corner === 'ne') {
      newW = Math.max(3, r.startW + dxPct);
      newH = Math.max(3, r.startH - dyPct);
      newY = r.startPY + (r.startH - newH);
    } else if (r.corner === 'nw') {
      newW = Math.max(3, r.startW - dxPct);
      newH = Math.max(3, r.startH - dyPct);
      newX = r.startPX + (r.startW - newW);
      newY = r.startPY + (r.startH - newH);
    }

    setLayout(prev => ({
      ...prev,
      [r.field]: {
        ...prev[r.field],
        width:  Math.round(newW * 10) / 10,
        height: Math.round(newH * 10) / 10,
        x: Math.round(Math.max(0, newX) * 10) / 10,
        y: Math.round(Math.max(0, newY) * 10) / 10,
      },
    }));
  }, []);

  const onResizeUp = useCallback(() => {
    resizeRef.current.resizing = false;
    document.removeEventListener('mousemove', onResizeMove);
    document.removeEventListener('mouseup', onResizeUp);
  }, [onResizeMove]);

  // ── Save ───────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!tplName.trim()) { toast.error('Enter a template name'); return; }
    if (!bgUrl && !bgFile) { toast.error('Upload a background image'); return; }
    setSaving(true);
    try {
      if (editingTpl) {
        await api.put(`/templates/${editingTpl.id}`, { name: tplName, orientation, layoutJson: layout });
        toast.success('Template updated!');
      } else {
        const fd = new FormData();
        fd.append('name', tplName);
        fd.append('orientation', orientation);
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

  // ── Delete ─────────────────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    if (!confirm('Delete this template permanently?')) return;
    try { await api.delete(`/templates/${id}`); fetchTemplates(); toast.success('Deleted'); }
    catch { toast.error('Delete failed'); }
  };

  // ── Field Settings Update ──────────────────────────────────────────────────
  const updateField = (key, prop, val) => {
    setLayout(prev => ({ ...prev, [key]: { ...prev[key], [prop]: val } }));
  };

  const aspectRatio = ORIENTATIONS[orientation]?.ratio ?? (3.375 / 2.125);

  // ======================== EDITOR ========================
  if (editorOpen) {
    return (
      <div>
        {/* Header */}
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1>✏️ {editingTpl ? 'Edit Template' : 'New Template'}</h1>
            <p>Upload a background, enable fields, drag to position. Corner handles resize boxes.</p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-secondary" onClick={closeEditor}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? <span className="spinner" /> : '💾'} {editingTpl ? 'Update' : 'Save Template'}
            </button>
          </div>
        </div>

        {/* Template Name + Orientation */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', gap: 20, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div className="form-group" style={{ marginBottom: 0, flex: '1 1 260px' }}>
              <label className="form-label">Template Name *</label>
              <input className="form-input" value={tplName} onChange={e => setTplName(e.target.value)}
                placeholder="e.g. Blue Elegant Card" />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Orientation</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {Object.entries(ORIENTATIONS).map(([key, o]) => (
                  <button key={key}
                    onClick={() => setOrientation(key)}
                    style={{
                      padding: '8px 18px', borderRadius: 8, border: `2px solid ${orientation === key ? '#3B82F6' : 'var(--border)'}`,
                      background: orientation === key ? 'rgba(59,130,246,0.15)' : 'transparent',
                      color: orientation === key ? '#3B82F6' : 'var(--text-muted)',
                      fontWeight: 600, fontSize: 13, cursor: 'pointer', transition: 'all 0.15s',
                    }}>
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr 290px', gap: 20, alignItems: 'start' }}>

          {/* LEFT: Field Toggles */}
          <div className="card card-sm" style={{ maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 }}>
              Fields
            </div>
            {Object.entries(FIELDS).map(([key, cfg]) => (
              <div key={key} onClick={() => toggleField(key)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '9px 11px', borderRadius: 8, cursor: 'pointer', marginBottom: 4,
                  border: `1px solid ${layout[key]?.enabled ? 'rgba(59,130,246,0.4)' : 'transparent'}`,
                  background: layout[key]?.enabled ? 'rgba(59,130,246,0.08)' : 'transparent',
                  transition: 'all 0.15s',
                }}>
                <span style={{ fontSize: 12, fontWeight: 500, color: layout[key]?.enabled ? '#fff' : 'var(--text-muted)' }}>
                  {cfg.label}
                </span>
                <div style={{
                  width: 17, height: 17, borderRadius: '50%', flexShrink: 0,
                  border: `2px solid ${layout[key]?.enabled ? '#3B82F6' : 'var(--border)'}`,
                  background: layout[key]?.enabled ? '#3B82F6' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 9, color: '#fff',
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
                aspectRatio: String(aspectRatio),
                border: '2px dashed var(--border)', borderRadius: 16,
                cursor: 'pointer', background: 'var(--bg-secondary)',
              }}>
                <div style={{ fontSize: 48, marginBottom: 12, opacity: 0.3 }}>🖼️</div>
                <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>Upload Card Background</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>86×54mm (H) or 54×86mm (V) · JPG/PNG</div>
                <input type="file" accept="image/*" onChange={onBgSelect} style={{ display: 'none' }} />
              </label>
            ) : (
              <div style={{ position: 'relative' }}>
                <div
                  ref={canvasRef}
                  onClick={() => setActiveField(null)}
                  style={{
                    position: 'relative',
                    aspectRatio: String(aspectRatio),
                    borderRadius: 12, overflow: 'visible',
                    backgroundImage: `url(${bgUrl})`,
                    backgroundSize: '100% 100%',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    cursor: 'default',
                    // Clip the bg image but not the handles that go outside
                    backgroundClip: 'padding-box',
                  }}
                >
                  {/* inner clip layer so background doesn't overflow the rounded corners */}
                  <div style={{
                    position: 'absolute', inset: 0, borderRadius: 12, overflow: 'hidden', pointerEvents: 'none',
                    backgroundImage: `url(${bgUrl})`, backgroundSize: '100% 100%',
                  }} />

                  {Object.entries(layout).map(([key, cfg]) => {
                    if (!cfg.enabled) return null;
                    const isBox    = FIELDS[key]?.type === 'box';
                    const isActive = activeField === key;

                    return (
                      <div
                        key={key}
                        onMouseDown={(e) => onMouseDown(e, key)}
                        onClick={(e) => { e.stopPropagation(); setActiveField(key); }}
                        style={{
                          position: 'absolute',
                          left:    `${cfg.x}%`,
                          top:     `${cfg.y}%`,
                          cursor:  'grab',
                          userSelect: 'none',
                          zIndex:  isActive ? 50 : 10,
                          outline: isActive ? '2px solid #3B82F6' : '1px dashed rgba(59,130,246,0.5)',
                          borderRadius: 3,
                          background: isActive ? 'rgba(59,130,246,0.12)' : 'transparent',
                          transition: 'outline 0.1s, background 0.1s',
                          // box fields: explicit px size from % relative to canvas
                          ...(isBox ? {
                            width:  `${cfg.width  || 18}%`,
                            height: `${cfg.height || 25}%`,
                          } : {
                            maxWidth: `${cfg.width || 80}%`,
                          }),
                        }}
                      >
                        {isBox ? (
                          <>
                            <div style={{
                              width: '100%', height: '100%',
                              background: 'rgba(200,200,200,0.65)',
                              border: '1px dashed #888',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 9, color: '#444', borderRadius: 3, fontWeight: 700,
                              pointerEvents: 'none',
                            }}>
                              {BOX_LABELS[key] || key}
                            </div>
                            {/* Corner resize handles — only when active */}
                            {isActive && ['nw','ne','sw','se'].map(corner => (
                              <ResizeHandle key={corner} corner={corner}
                                onResizeStart={(e, c) => onResizeStart(e, c, key)} />
                            ))}
                          </>
                        ) : (
                          <span style={{
                            display: 'block',
                            fontSize:   cfg.fontSize || 10,
                            color:      cfg.color    || '#000',
                            fontWeight: ['name','schoolName'].includes(key) ? 'bold' : 'normal',
                            textAlign:  cfg.align    || 'left',
                            lineHeight: 1.3,
                            // Long text must wrap, never overflow
                            wordBreak:    'break-word',
                            overflowWrap: 'break-word',
                            whiteSpace:   'normal',
                            textShadow:   '0 0 4px rgba(255,255,255,0.6)',
                          }}>
                            {SAMPLE[key] || FIELDS[key].label}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Change BG */}
                <label style={{
                  position: 'absolute', top: 10, right: 10,
                  background: 'rgba(0,0,0,0.65)', color: '#fff',
                  padding: '6px 12px', borderRadius: 8, fontSize: 12,
                  cursor: 'pointer', backdropFilter: 'blur(8px)', fontWeight: 600,
                }}>
                  🖼️ Change
                  <input type="file" accept="image/*" onChange={onBgSelect} style={{ display: 'none' }} />
                </label>

                <div style={{ marginTop: 12, fontSize: 11, color: 'var(--text-muted)', textAlign: 'center' }}>
                  🖱️ Drag fields • Click to select • Drag corners to resize boxes
                </div>
              </div>
            )}
          </div>

          {/* RIGHT: Field Settings */}
          <div className="card card-sm" style={{ maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 }}>
              Field Settings
            </div>

            {activeField && layout[activeField] ? (
              <div>
                {/* Field name badge */}
                <div style={{
                  background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)',
                  borderRadius: 10, padding: '10px 14px', marginBottom: 16,
                  fontWeight: 700, fontSize: 14, color: '#3B82F6',
                }}>
                  {FIELDS[activeField]?.label}
                </div>

                {/* X / Y */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                  {['x','y'].map(axis => (
                    <div key={axis}>
                      <label style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700 }}>{axis.toUpperCase()} %</label>
                      <input className="form-input" type="number" step="0.5" min="0" max="100"
                        value={layout[activeField][axis]}
                        onChange={e => updateField(activeField, axis, parseFloat(e.target.value) || 0)}
                        style={{ padding: '6px 10px', fontSize: 13 }} />
                    </div>
                  ))}
                </div>

                {FIELDS[activeField]?.type !== 'box' && (<>
                  {/* Font Size */}
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <label style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700 }}>Font Size</label>
                      <span style={{ fontSize: 12, fontWeight: 700 }}>{layout[activeField].fontSize}px</span>
                    </div>
                    <input type="range" min="6" max="36" value={layout[activeField].fontSize}
                      onChange={e => updateField(activeField, 'fontSize', parseInt(e.target.value))}
                      style={{ width: '100%', accentColor: '#3B82F6' }} />
                  </div>

                  {/* Text Color */}
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

                  {/* Max Width % */}
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <label style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700 }}>Max Width % (wrap)</label>
                      <span style={{ fontSize: 12, fontWeight: 700 }}>{layout[activeField].width || 80}%</span>
                    </div>
                    <input type="range" min="10" max="100" value={layout[activeField].width || 80}
                      onChange={e => updateField(activeField, 'width', parseInt(e.target.value))}
                      style={{ width: '100%', accentColor: '#3B82F6' }} />
                  </div>

                  {/* Alignment */}
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, display: 'block', marginBottom: 6 }}>Alignment</label>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {['left','center','right'].map(a => (
                        <button key={a} onClick={() => updateField(activeField, 'align', a)}
                          style={{
                            flex: 1, padding: '6px 0', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                            border: `2px solid ${layout[activeField].align === a ? '#3B82F6' : 'var(--border)'}`,
                            background: layout[activeField].align === a ? 'rgba(59,130,246,0.15)' : 'transparent',
                            color: layout[activeField].align === a ? '#3B82F6' : 'var(--text-muted)',
                            transition: 'all 0.12s',
                          }}>
                          {a === 'left' ? '⬅' : a === 'center' ? '↔' : '➡'}
                        </button>
                      ))}
                    </div>
                  </div>
                </>)}

                {/* Box W/H — also via sliders as backup to corner drag */}
                {FIELDS[activeField]?.type === 'box' && (
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 10 }}>
                      Drag corner handles on card to resize, or use sliders:
                    </div>
                    {[['width','W %',3,60],['height','H %',3,80]].map(([prop, lbl, mn, mx]) => (
                      <div key={prop} style={{ marginBottom: 14 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                          <label style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700 }}>{lbl}</label>
                          <span style={{ fontSize: 12, fontWeight: 700 }}>{layout[activeField][prop] || (prop === 'width' ? 18 : 25)}%</span>
                        </div>
                        <input type="range" min={mn} max={mx}
                          value={layout[activeField][prop] || (prop === 'width' ? 18 : 25)}
                          onChange={e => updateField(activeField, prop, parseInt(e.target.value))}
                          style={{ width: '100%', accentColor: '#3B82F6' }} />
                      </div>
                    ))}
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
          <p>Upload card backgrounds and design field layouts for ID card generation.</p>
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
          {templates.map(tpl => {
            const ratio = tpl.orientation === 'vertical' ? (2.125 / 3.375) : (3.375 / 2.125);
            return (
              <div key={tpl.id} className="card card-sm" style={{ overflow: 'hidden', padding: 0 }}>
                <div style={{ aspectRatio: String(ratio), background: '#1a1a2e', position: 'relative', overflow: 'hidden' }}>
                  {tpl.imageUrl ? (
                    <img src={`${NEXT_PUBLIC_UPLOADS_URL}${tpl.imageUrl}`} alt={tpl.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                      No Background
                    </div>
                  )}
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
                      {new Date(tpl.createdAt).toLocaleDateString()} · {tpl.orientation === 'vertical' ? '📱 V' : '⬛ H'}
                    </span>
                    <span className="badge badge-blue" style={{ fontSize: 10 }}>
                      {tpl._count?.schools || 0} schools
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}