// components/HarmonicCircle.jsx
import React from 'react';
import { C } from '../styles/tokens';
import { NOTE_ES } from '../constants/music';

// Estilo para un acorde individual dentro del círculo
const chordBlockStyle = {
  position: 'absolute',
  width: 54, height: 54,
  borderRadius: '50%',
  display: 'flex', flexDirection: 'column',
  alignItems: 'center', justifyContent: 'center',
  fontWeight: 800, fontSize: 13,
  border: `1px solid ${C.cardBorder}`,
  color: C.silver,
  transition: 'all 0.3s ease-out',
  cursor: 'default',
  filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))'
};

const labelsStyle = { fontSize: 9, color: C.silverDim, fontWeight: 500, letterSpacing: '0.04em' };

export default function HarmonicCircle({ data }) {
  if (!data) return <div style={{ color: C.silverDim, fontSize: 12 }}>No hay datos armónicos.</div>;

  const { center, chords } = data;

  // Mapa de etiquetas técnicas según tu imagen
  const l = {
    T: "TON", D: "DOM", S: "SUB",
    Rm_T: "rel", Rm_D: "rel", Rm_S: "rel"
  };

  // Posiciones matemáticas (grados) alrededor del centro para el layout
  const positions = {
    // Mayores (Externos, más lejos)
    D: { angle: -30, dist: 78, bg: C.purpleDark },  // Dominante (Dcha Arriba)
    T: { angle: -90, dist: 78, bg: C.purple },      // Tónica (Arriba)
    S: { angle: -150, dist: 78, bg: C.purpleDark }, // Subdominante (Izda Arriba)
    // Menores (Internos, más cerca)
    Rm_D: { angle: 30, dist: 38, bg: C.bg },  // Rel. Dom (Dcha Abajo)
    Rm_T: { angle: 90, dist: 38, bg: C.bg, isRel: true },  // Rel. Ton (Abajo)
    Rm_S: { angle: 150, dist: 38, bg: C.bg }  // Rel. Sub (Izda Abajo)
  };

  return (
    <div style={{ padding: '20px 0', borderTop: `1px solid ${C.cardBorder}`, marginTop: 20 }}>
      <p style={{ fontSize: 10, color: C.silverDim, marginBottom: 20, letterSpacing: "0.12em", textTransform: "uppercase" }}>
        Círculo Armónico — Base {NOTE_ES[center.replace('m', '')]} {center.includes('m') ? 'Menor' : 'Mayor'}
      </p>
      
      {/* Contenedor central */}
      <div style={{ position: 'relative', width: 220, height: 220, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        
        {/* Tónica Central */}
        <div style={{
          position: 'absolute', zIndex: 10,
          width: 70, height: 70, borderRadius: '50%',
          background: `linear-gradient(135deg, ${C.gold}, ${C.goldLight})`,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          fontWeight: 800, fontSize: 20, color: C.black,
          boxShadow: `0 0 30px ${C.gold}88`,
          animation: 'chordPop 0.4s ease both'
        }}>
          {center}
          <span style={{ fontSize: 9, color: `${C.black}99`, fontWeight: 700 }}>CENTRO</span>
        </div>

        {/* Líneas de conexión */}
        <svg style={{ position: 'absolute', width: '100%', height: '100%', pointerEvents: 'none' }}>
          <line x1="110" y1="110" x2="110" y2="32" stroke={C.cardBorder} strokeWidth="1" strokeDasharray="4" /> {/* T */}
          <line x1="110" y1="110" x2="110" y2="188" stroke={C.cardBorder} strokeWidth="1" strokeDasharray="4" /> {/* Rm_T */}
          <circle cx="110" cy="110" r="100" fill="none" stroke={C.cardBorder} strokeWidth="1" strokeDasharray="8"/>
        </svg>

        {/* Los 6 acordes circundantes */}
        {Object.entries(positions).map(([key, pos], i) => {
          const chordName = chords[key];
          const isGold = (key === 'T' || key === 'Rm_T') && center.includes('m') === pos.isRel;
          
          return (
            <div key={key} style={{
              ...chordBlockStyle,
              background: pos.bg,
              border: `1px solid ${isGold ? C.gold + '55' : C.cardBorder}`,
              color: isGold ? C.gold : C.silver,
              transform: `translate(${pos.dist * Math.cos(pos.angle * Math.PI / 180)}px, ${pos.dist * Math.sin(pos.angle * Math.PI / 180)}px)`,
              animation: `theorySectionIn 0.3s ease both ${i * 0.05}s`
            }}>
              {chordName}
              <span style={labelsStyle}>{l[key]}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}