// components/LyricsView.jsx
import React, { useState } from 'react';
import { C } from '../styles/tokens';

const btnStyle = {
  background: 'transparent',
  border: '1px solid transparent',
  color: C.silverDim,
  fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em',
  padding: '6px 12px', borderRadius: 6,
  cursor: 'pointer', transition: 'all 0.2s'
};

const activeBtnStyle = { background: C.purple, borderColor: C.gold + '44', color: C.gold };

const textPanelStyle = {
  flex: 1, 
  background: C.bg, 
  border: `1px solid ${C.cardBorder}`, 
  borderRadius: 8, 
  padding: 14, 
  minHeight: 140,
  fontSize: 13, color: C.silver, 
  fontFamily: 'monospace', lineHeight: 1.6,
  whiteSpace: 'pre-wrap', // Respeta saltos de línea
  animation: 'slideRight 0.3s ease both'
};

export default function LyricsView({ lyrics }) {
  // Estado para el modo de visualización: original (en), traducida (es) o ambas
  const [viewMode, setViewMode] = useState('es');

  if (!lyrics) return null;

  return (
    <div style={{ borderTop: `1px solid ${C.cardBorder}`, paddingTop: 18, marginTop: 18, animation: 'fadeIn 0.3s' }}>
      
      {/* Controles */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <p style={{ fontSize: 10, color: C.gold, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 700 }}>
          Letra y Traducción ♪
        </p>
        <div style={{ display: 'flex', gap: 4, background: C.card, padding: 3, borderRadius: 8 }}>
          <button onClick={() => setViewMode('es')} style={{...btnStyle, ...(viewMode === 'es' ? activeBtnStyle : {}) }}>ES</button>
          <button onClick={() => setViewMode('en')} style={{...btnStyle, ...(viewMode === 'en' ? activeBtnStyle : {}) }}>EN</button>
          <button onClick={() => setViewMode('both')} style={{...btnStyle, ...(viewMode === 'both' ? activeBtnStyle : {}) }}>DÚO</button>
        </div>
      </div>

      {/* Paneles de texto */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        
        {/* Panel ES */}
        {(viewMode === 'es' || viewMode === 'both') && (
          <div style={textPanelStyle}>
            {viewMode === 'both' && <span style={{fontSize:9, color:C.gold, fontWeight:700, position:'absolute', top:4, right:6}}>ES</span>}
            {lyrics.es}
          </div>
        )}

        {/* Panel EN */}
        {(viewMode === 'en' || viewMode === 'both') && (
          <div style={textPanelStyle}>
            {viewMode === 'both' && <span style={{fontSize:9, color:C.gold, fontWeight:700, position:'absolute', top:4, right:6}}>EN</span>}
            {lyrics.en}
          </div>
        )}
      </div>
    </div>
  );
}