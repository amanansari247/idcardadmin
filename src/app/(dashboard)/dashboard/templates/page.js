'use client';
import { useState } from 'react';

// Generates base mock templates to match the app
const generateTemplates = () => {
    const cats = ['ANIMALS', 'SPACE', 'FRUITS', 'CORPORATE', 'MINIMALIST', 'CLASSIC', 'TECH'];
    const designTypes = ['wave', 'diagonal', 'split', 'modern', 'classic'];
    let tpls = [];
    let id = 1;
    cats.forEach((c, index) => {
        ['portrait', 'landscape'].forEach(l => {
            ['one-sided', 'two-sided'].forEach(s => {
                const designType = designTypes[(index + (l === 'portrait' ? 0 : 1)) % designTypes.length];
                tpls.push({
                    id: `tpl-${id++}`,
                    name: `${c} ${l} ${s==='one-sided'?'1S':'2S'}`,
                    category: c,
                    layout: l,
                    sides: s,
                    designType: designType,
                    headerColor: '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')
                });
            });
        });
    });
    return tpls;
};

const TEMPLATE_THEMES = generateTemplates();
const CATEGORIES = ['ALL', 'ANIMALS', 'SPACE', 'FRUITS', 'CORPORATE', 'MINIMALIST', 'CLASSIC', 'TECH'];

export default function TemplatesPage() {
  const [filter, setFilter] = useState('ALL');
  const [layoutFilter, setLayoutFilter] = useState('portrait');
  const [sideFilter, setSideFilter] = useState('one-sided');

  let filtered = filter === 'ALL' ? TEMPLATE_THEMES : TEMPLATE_THEMES.filter(t => t.category === filter);
  filtered = filtered.filter(t => t.layout === layoutFilter && t.sides === sideFilter);

  return (
    <div>
      <div className="page-header">
        <h1>ID Card Templates</h1>
        <p>100+ unique textured and shaped designs for every school type. Supports Portrait, Landscape, 1-Sided, and 2-Sided!</p>
      </div>

      <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap: 'wrap' }}>
        {CATEGORIES.map(c => (
          <button key={c} className={`btn ${filter===c ? 'btn-primary' : 'btn-secondary'} btn-sm`} onClick={() => setFilter(c)}>
            {c}
          </button>
        ))}
      </div>
      
      <div style={{ display:'flex', gap:16, marginBottom:24 }}>
          <div style={{ display:'flex', gap:8 }}>
              <button className={`btn ${layoutFilter==='portrait' ? 'btn-primary' : 'btn-secondary'} btn-sm`} onClick={() => setLayoutFilter('portrait')}>Portrait</button>
              <button className={`btn ${layoutFilter==='landscape' ? 'btn-primary' : 'btn-secondary'} btn-sm`} onClick={() => setLayoutFilter('landscape')}>Landscape</button>
          </div>
          <div style={{ display:'flex', gap:8 }}>
              <button className={`btn ${sideFilter==='one-sided' ? 'btn-primary' : 'btn-secondary'} btn-sm`} onClick={() => setSideFilter('one-sided')}>1-Sided</button>
              <button className={`btn ${sideFilter==='two-sided' ? 'btn-primary' : 'btn-secondary'} btn-sm`} onClick={() => setSideFilter('two-sided')}>2-Sided</button>
          </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px,1fr))', gap:20 }}>
        {filtered.slice(0, 32).map(t => (
          <div key={t.id} className="card card-sm" style={{ padding:0, overflow:'hidden', cursor:'pointer', transition:'all 0.3s' }}
            onMouseEnter={e => e.currentTarget.style.transform='translateY(-4px)'}
            onMouseLeave={e => e.currentTarget.style.transform='translateY(0)'}>
            
            {/* Dynamic Card Preview */}
            <div style={{ 
                background: t.designType === 'split' ? `linear-gradient(to ${t.layout === 'landscape' ? 'right' : 'bottom'}, ${t.headerColor} 40%, white 40%)` : '#fff', 
                height: t.layout === 'landscape' ? 120 : 160, 
                display:'flex', 
                flexDirection: t.layout === 'landscape' ? 'row' : 'column', 
                border: t.designType === 'modern' ? `5px solid ${t.headerColor}` : t.designType === 'classic' ? '2px solid #333' : '1px solid #ccc',
                position:'relative',
                backgroundImage: t.designType === 'split' || t.designType === 'modern' ? 'none' : 'repeating-linear-gradient(45deg, rgba(0,0,0,0.03) 25%, transparent 25%, transparent 75%, rgba(0,0,0,0.03) 75%, rgba(0,0,0,0.03)), repeating-linear-gradient(45deg, rgba(0,0,0,0.03) 25%, white 25%, white 75%, rgba(0,0,0,0.03) 75%, rgba(0,0,0,0.03))',
                backgroundSize: '10px 10px',
                borderRadius: t.designType === 'modern' ? '8px' : '8px 8px 0 0',
                overflow: 'hidden',
                boxSizing: 'border-box'
            }}>
                {t.layout === 'portrait' ? (
                    <>
                        {t.designType !== 'modern' && t.designType !== 'split' && (
                            <div style={{ background: t.headerColor, padding: '8px', color: 'white', fontSize: '10px', fontWeight: 'bold', textAlign: 'center', borderBottomLeftRadius: t.designType === 'wave' ? '50% 10px' : 0, borderBottomRightRadius: t.designType === 'wave' ? '50% 10px' : (t.designType === 'diagonal' ? '20px' : 0), borderBottom: t.designType === 'classic' ? '2px solid #FFD700' : 'none', boxShadow: '0 2px 4px rgba(0,0,0,0.2)', zIndex: 10 }}>SCHOOL NAME</div>
                        )}
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '5px' }}>
                            <div style={{ width: 40, height: 50, background: '#eee', border: t.designType === 'classic' ? `2px solid #333` : (t.designType === 'modern' ? 'none' : `2px solid #FFD700`), borderRadius: t.designType === 'diagonal' ? '50%' : 4, zIndex: 1, marginTop: t.designType === 'split' ? '-10px' : 0 }}></div>
                            <div style={{ color: t.designType === 'split' ? '#333' : t.headerColor, fontWeight: 'bold', fontSize: '11px', marginTop: '5px' }}>STUDENT NAME</div>
                            <div style={{ fontSize: '8px', color: '#555' }}>Class 10 - A</div>
                        </div>
                        {t.designType !== 'modern' && t.designType !== 'split' && (
                            <div style={{ background: t.headerColor, padding: '4px', color: 'white', fontSize: '8px', textAlign: 'center', borderTopLeftRadius: t.designType === 'wave' ? '50% 10px' : (t.designType === 'diagonal' ? '20px' : 0), borderTopRightRadius: t.designType === 'wave' ? '50% 10px' : 0, borderTop: t.designType === 'classic' ? '2px solid #FFD700' : 'none', zIndex: 10 }}>ID: 12345</div>
                        )}
                    </>
                ) : (
                    <>
                        {t.designType !== 'modern' && t.designType !== 'split' && (
                            <div style={{ background: t.headerColor, width: '25px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderTopRightRadius: t.designType === 'wave' ? '10px 50%' : 0, borderBottomRightRadius: t.designType === 'wave' ? '10px 50%' : (t.designType === 'diagonal' ? '20px' : 0), borderRight: t.designType === 'classic' ? '2px solid #FFD700' : 'none', boxShadow: '2px 0 4px rgba(0,0,0,0.2)', zIndex: 10 }}>
                               <span style={{ color: 'white', fontSize: '8px', fontWeight: 'bold', transform: 'rotate(-90deg)', whiteSpace: 'nowrap' }}>SCHOOL NAME</span>
                            </div>
                        )}
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '10px', gap: '10px', zIndex: 1 }}>
                            <div style={{ width: 40, height: 50, background: '#eee', border: t.designType === 'classic' ? `2px solid #333` : (t.designType === 'modern' ? 'none' : `2px solid #FFD700`), borderRadius: t.designType === 'diagonal' ? '50%' : 4 }}></div>
                            <div>
                                <div style={{ color: t.designType === 'split' ? '#333' : t.headerColor, fontWeight: 'bold', fontSize: '11px' }}>STUDENT NAME</div>
                                <div style={{ fontSize: '8px', color: '#555' }}>Class 10 - A</div>
                                <div style={{ fontSize: '8px', color: t.designType === 'split' ? '#333' : t.headerColor, fontWeight: 'bold', marginTop: '4px' }}>ID: 12345</div>
                            </div>
                        </div>
                    </>
                )}
            </div>
            
            <div style={{ padding:'12px 14px' }}>
              <div style={{ fontWeight:600, fontSize:13 }}>{t.name}</div>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:6 }}>
                <span className="badge badge-blue" style={{ fontSize:10 }}>{t.category}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
