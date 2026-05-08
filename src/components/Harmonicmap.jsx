import { useState, useCallback } from "react";
import { C } from "../styles/tokens";
import { NOTES, NOTE_ES, transposeNote } from "../constants/music";

// ─── HARMONIC RELATIONSHIPS FOR A GIVEN ROOT ──────────────────────────────────
// Based on the image: center = tonic, branches = diatonic + secondary chords
// with color-coded relationship types

function buildHarmonicMap(root, scaleType="major") {
  const ri = NOTES.indexOf(root);
  const n = (st) => NOTES[(ri+st+12)%12];

  if (scaleType==="major") {
    return {
      center: { note:root, label:root, type:"tonic", color:"#e91e8c" },
      rings: [
        // Inner ring: primary diatonic
        [
          { note:n(5),  label:n(5),      type:"subdominant", color:"#00bcd4", suffix:"" },
          { note:n(7),  label:n(7)+"m",  type:"relative",    color:"#00bcd4", suffix:"m" },
          { note:n(9),  label:n(9)+"m",  type:"mediant",     color:"#8bc34a", suffix:"m" },
          { note:n(7),  label:n(7)+"7",  type:"dominant7",   color:"#D4A413", suffix:"7" },
          { note:n(4),  label:n(4)+"m",  type:"parallel",    color:"#9c27b0", suffix:"m" },
          { note:n(7),  label:n(7)+"°",  type:"diminished",  color:"#9c27b0", suffix:"°" },
        ],
        // Middle ring: secondary dominants & borrowed
        [
          { note:n(2),  label:n(2),      type:"secondary",   color:"#ff9800", suffix:"" },
          { note:n(5),  label:n(5)+"7",  type:"dominant7",   color:"#D4A413", suffix:"7" },
          { note:n(9),  label:n(9),      type:"borrowed",    color:"#4caf50", suffix:"" },
          { note:n(11), label:n(11)+"m", type:"borrowed",    color:"#4caf50", suffix:"m" },
          { note:n(4),  label:n(4),      type:"secondary",   color:"#ff9800", suffix:"" },
          { note:n(2),  label:n(2)+"7",  type:"secondary7",  color:"#ff5722", suffix:"7" },
        ],
        // Outer ring: extended/chromatic
        [
          { note:n(1),  label:n(1)+"7",  type:"chromatic",   color:"#607d8b", suffix:"7" },
          { note:n(6),  label:n(6)+"7",  type:"chromatic",   color:"#607d8b", suffix:"7" },
          { note:n(3),  label:n(3)+"m",  type:"modal",       color:"#3f51b5", suffix:"m" },
          { note:n(10), label:n(10),     type:"modal",       color:"#3f51b5", suffix:"" },
          { note:n(8),  label:n(8)+"m",  type:"chromatic",   color:"#607d8b", suffix:"m" },
          { note:n(8),  label:n(8)+"7",  type:"chromatic",   color:"#607d8b", suffix:"7" },
        ],
      ],
    };
  }

  // Minor
  return {
    center: { note:root, label:root+"m", type:"tonic", color:"#9c27b0" },
    rings: [
      [
        { note:n(3),  label:n(3),      type:"relative",    color:"#4caf50", suffix:"" },
        { note:n(5),  label:n(5)+"m",  type:"subdominant", color:"#00bcd4", suffix:"m" },
        { note:n(7),  label:n(7),      type:"mediant",     color:"#8bc34a", suffix:"" },
        { note:n(10), label:n(10),     type:"subtonic",    color:"#ff9800", suffix:"" },
        { note:n(7),  label:n(7)+"7",  type:"dominant7",   color:"#D4A413", suffix:"7" },
        { note:n(2),  label:n(2)+"°",  type:"diminished",  color:"#795548", suffix:"°" },
      ],
      [
        { note:n(8),  label:n(8),      type:"borrowed",    color:"#3f51b5", suffix:"" },
        { note:n(5),  label:n(5),      type:"dominant",    color:"#D4A413", suffix:"" },
        { note:n(3),  label:n(3)+"7",  type:"secondary7",  color:"#ff5722", suffix:"7" },
        { note:n(10), label:n(10)+"m", type:"borrowed",    color:"#607d8b", suffix:"m" },
        { note:n(0),  label:n(0)+"aug",type:"chromatic",   color:"#e91e63", suffix:"+" },
        { note:n(5),  label:n(5)+"7",  type:"dominant7",   color:"#D4A413", suffix:"7" },
      ],
      [
        { note:n(1),  label:n(1)+"m",  type:"chromatic",   color:"#607d8b", suffix:"m" },
        { note:n(6),  label:n(6),      type:"modal",       color:"#9c27b0", suffix:"" },
        { note:n(11), label:n(11)+"7", type:"chromatic",   color:"#607d8b", suffix:"7" },
        { note:n(4),  label:n(4)+"m",  type:"modal",       color:"#3f51b5", suffix:"m" },
        { note:n(9),  label:n(9)+"7",  type:"chromatic",   color:"#607d8b", suffix:"7" },
        { note:n(2),  label:n(2)+"7",  type:"secondary7",  color:"#ff5722", suffix:"7" },
      ],
    ],
  };
}

// ─── TYPE LEGEND ─────────────────────────────────────────────────────────────
const TYPE_INFO = {
  tonic:      { label:"Tónica",         desc:"Centro armónico. Punto de reposo." },
  subdominant:{ label:"Subdominante",   desc:"Movimiento suave. Prepara el V." },
  dominant:   { label:"Dominante",      desc:"Tensión. Quiere resolver al I." },
  dominant7:  { label:"Dom. 7ma",       desc:"Dominante con 7ma. Tensión máxima hacia la tónica." },
  relative:   { label:"Relativa",       desc:"Mismas notas, diferente centro." },
  parallel:   { label:"Paralela",       desc:"Mismo nombre, modo opuesto (Mayor↔Menor)." },
  mediant:    { label:"Mediante",       desc:"3er grado. Puente entre tónica y subdominante." },
  subtonic:   { label:"Subtónica",      desc:"VII grado natural. Sin sensible." },
  secondary:  { label:"Secundario",     desc:"Dominante de un grado que no es el I." },
  secondary7: { label:"Secundario 7",   desc:"Dominante secundario con 7ma." },
  borrowed:   { label:"Prestado",       desc:"Acorde del modo paralelo (intercambio modal)." },
  diminished: { label:"Disminuido",     desc:"VII grado. Tensión extrema, suena inestable." },
  modal:      { label:"Modal",          desc:"De un modo de la escala mayor." },
  chromatic:  { label:"Cromático",      desc:"Fuera de la tonalidad. Colorea sin modular." },
};

// ─── VARIATION CONFIGS ───────────────────────────────────────────────────────
export const MAP_VARIATIONS = [
  { id:"full",      label:"Completo",      desc:"Todos los acordes relacionados",            rings:3 },
  { id:"diatonic",  label:"Diatónico",     desc:"Solo acordes dentro de la tonalidad",       rings:1 },
  { id:"secondary", label:"Secundarios",   desc:"Dominantes secundarios y prestados",        rings:2 },
  { id:"borrowed",  label:"Intercambio Modal", desc:"Acordes prestados del modo paralelo",   rings:2 },
  { id:"chromatic", label:"Cromático",     desc:"Todos incluyendo acordes fuera de tono",    rings:3 },
  { id:"jazz",      label:"Jazz",          desc:"Acordes de 7ma y extensiones",              rings:3 },
];

// ─── SVG HARMONIC MAP ─────────────────────────────────────────────────────────
function HarmonicMapSVG({ root, scaleType, variation, onChordClick, activeChord }) {
  const map = buildHarmonicMap(root, scaleType);
  const ringsToShow = variation === "diatonic" ? 1 : variation === "secondary" || variation === "borrowed" ? 2 : 3;

  const W = 340, H = 340, cx = W/2, cy = H/2;
  const radii = [75, 125, 168];
  const nodeR = [18, 14, 12];

  const filterTypes = {
    full:      null,
    diatonic:  ["tonic","subdominant","dominant","dominant7","relative","mediant","subtonic","diminished"],
    secondary: ["tonic","subdominant","dominant","dominant7","secondary","secondary7"],
    borrowed:  ["tonic","relative","parallel","borrowed","mediant"],
    chromatic: null,
    jazz:      ["tonic","dominant7","secondary7","relative","borrowed","chromatic"],
  }[variation] || null;

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{overflow:"visible"}}>
      <defs>
        <radialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={map.center.color} stopOpacity="0.4"/>
          <stop offset="100%" stopColor={map.center.color} stopOpacity="0"/>
        </radialGradient>
        {/* Ring backgrounds */}
        {radii.slice(0,ringsToShow).map((r,i)=>(
          <radialGradient key={i} id={`ring${i}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={C.purpleDark} stopOpacity="0"/>
            <stop offset="100%" stopColor={C.purple} stopOpacity="0.08"/>
          </radialGradient>
        ))}
      </defs>

      {/* Ring guide circles */}
      {radii.slice(0,ringsToShow).map((r,i)=>(
        <circle key={i} cx={cx} cy={cy} r={r} fill={`url(#ring${i})`}
          stroke={C.cardBorder} strokeWidth={0.5} strokeDasharray="3 6"/>
      ))}

      {/* Connection lines from center to ring 1 */}
      {map.rings[0].map((node,i)=>{
        if(filterTypes && !filterTypes.includes(node.type)) return null;
        const angle = (i * 60 - 90) * Math.PI/180;
        const x = cx + radii[0]*Math.cos(angle);
        const y = cy + radii[0]*Math.sin(angle);
        return(
          <line key={i} x1={cx} y1={cy} x2={x} y2={y}
            stroke={node.color} strokeWidth={1} strokeOpacity={0.35} strokeDasharray="4 4"/>
        );
      })}

      {/* Connection lines ring 1 → ring 2 */}
      {ringsToShow>=2 && map.rings[1].map((node,i)=>{
        if(filterTypes && !filterTypes.includes(node.type)) return null;
        const a1 = (i * 60 - 90) * Math.PI/180;
        const a2 = ((i+0.5) * 60 - 90) * Math.PI/180;
        const x1=cx+radii[0]*Math.cos(a1), y1=cy+radii[0]*Math.sin(a1);
        const x2=cx+radii[1]*Math.cos(a2), y2=cy+radii[1]*Math.sin(a2);
        return(
          <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
            stroke={node.color} strokeWidth={0.7} strokeOpacity={0.25} strokeDasharray="3 5"/>
        );
      })}

      {/* Nodes ring by ring */}
      {map.rings.slice(0,ringsToShow).map((ring,ri)=>
        ring.map((node,ni)=>{
          if(filterTypes && !filterTypes.includes(node.type)) return null;
          const angle = (ni * 60 + ri*30 - 90) * Math.PI/180;
          const x = cx + radii[ri]*Math.cos(angle);
          const y = cy + radii[ri]*Math.sin(angle);
          const isActive = activeChord===node.label;
          const r = nodeR[ri];
          return(
            <g key={`${ri}-${ni}`} onClick={()=>onChordClick(node)} style={{cursor:"pointer"}}>
              <circle cx={x} cy={y} r={isActive?r+4:r}
                fill={isActive?node.color:`${C.purpleDark}ee`}
                stroke={node.color} strokeWidth={isActive?2:1}
                style={{transition:"all 0.2s",filter:isActive?`drop-shadow(0 0 6px ${node.color})`:"none"}}
              />
              <text x={x} y={y+3} textAnchor="middle"
                fill={isActive?C.black:"#fff"}
                fontSize={ri===0?8:7}
                fontFamily="Montserrat" fontWeight="700"
                style={{pointerEvents:"none",fontSize:ri===0?8:6}}>
                {node.label}
              </text>
            </g>
          );
        })
      )}

      {/* Center glow */}
      <circle cx={cx} cy={cy} r={40} fill="url(#centerGlow)"/>

      {/* Center node */}
      <g onClick={()=>onChordClick(map.center)} style={{cursor:"pointer"}}>
        <circle cx={cx} cy={cy} r={activeChord===map.center.label?28:24}
          fill={map.center.color}
          style={{transition:"all 0.2s",filter:`drop-shadow(0 0 12px ${map.center.color}88)`}}
        />
        <text x={cx} y={cy-3} textAnchor="middle" fill="#fff" fontSize={10} fontFamily="Montserrat" fontWeight="800" style={{pointerEvents:"none"}}>{map.center.label}</text>
        <text x={cx} y={cy+9} textAnchor="middle" fill="#ffffff88" fontSize={7} fontFamily="Montserrat" style={{pointerEvents:"none"}}>TÓNICA</text>
      </g>

      {/* Curved arrows for special relations */}
      {ringsToShow>=2&&(
        <path d={`M ${cx+28} ${cy-8} Q ${cx+80} ${cy-90} ${cx+radii[1]*Math.cos(-30*Math.PI/180)} ${cy+radii[1]*Math.sin(-30*Math.PI/180)}`}
          fill="none" stroke={C.gold} strokeWidth={1} strokeOpacity={0.4}
          strokeDasharray="5 5" markerEnd="url(#arrow)"/>
      )}
      <defs>
        <marker id="arrow" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
          <path d="M0,0 L0,6 L6,3 z" fill={C.gold} opacity={0.5}/>
        </marker>
      </defs>
    </svg>
  );
}

// ─── EXPORTED COMPONENT ───────────────────────────────────────────────────────
export default function HarmonicMap({ playNote }) {
  const [root,      setRoot]      = useState("C");
  const [scaleType, setScaleType] = useState("major");
  const [variation, setVariation] = useState("full");
  const [active,    setActive]    = useState(null);
  const [varIdx,    setVarIdx]    = useState(0);

  const handleChordClick = useCallback((node) => {
    setActive(node.label);
    if(playNote) playNote(node.note, "piano", 4);
  }, [playNote]);

  const cycleVariation = () => {
    const next = (varIdx+1) % MAP_VARIATIONS.length;
    setVarIdx(next);
    setVariation(MAP_VARIATIONS[next].id);
  };

  const activeVar = MAP_VARIATIONS[varIdx];
  const map = buildHarmonicMap(root, scaleType);
  const activeNodeInfo = active ? (
    active === map.center.label ? TYPE_INFO["tonic"] :
    [...map.rings.flat()].find(n=>n.label===active)
  ) : null;
  const activeType = active && active !== map.center.label
    ? [...map.rings.flat()].find(n=>n.label===active)?.type
    : "tonic";

  return (
    <div>
      {/* Controls */}
      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:14}}>
        <select value={root} onChange={e=>setRoot(e.target.value)} style={{background:C.purpleDark,border:`1px solid ${C.cardBorder}`,color:C.silver,borderRadius:8,padding:"8px 10px",fontSize:13,cursor:"pointer",outline:"none"}}>
          {NOTES.map(n=><option key={n} value={n}>{NOTE_ES[n]} ({n})</option>)}
        </select>
        <div style={{display:"flex",gap:5}}>
          {["major","minor"].map(s=>(
            <button key={s} onClick={()=>setScaleType(s)} className={scaleType===s?"btn-gold":"btn-outline"} style={{padding:"8px 14px",fontSize:12}}>
              {s==="major"?"☀️ Mayor":"🌙 Menor"}
            </button>
          ))}
        </div>
        <button onClick={cycleVariation} className="btn-purple" style={{fontSize:12,display:"flex",alignItems:"center",gap:6}}>
          🔄 {activeVar.label}
        </button>
      </div>

      {/* Variation info */}
      <div style={{padding:"8px 14px",background:`${C.gold}10`,border:`1px solid ${C.gold}22`,borderRadius:8,marginBottom:14,display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}}>
        <div>
          <span style={{fontSize:11,fontWeight:700,color:C.gold}}>{activeVar.label}</span>
          <span style={{fontSize:11,color:C.silverDim,marginLeft:8}}>{activeVar.desc}</span>
        </div>
        <div style={{display:"flex",gap:5}}>
          {MAP_VARIATIONS.map((v,i)=>(
            <div key={v.id} onClick={()=>{setVarIdx(i);setVariation(v.id);}} style={{width:8,height:8,borderRadius:"50%",background:i===varIdx?C.gold:C.cardBorder,cursor:"pointer",transition:"all 0.2s"}}/>
          ))}
        </div>
      </div>

      {/* Map + info panel */}
      <div style={{display:"flex",gap:16,flexWrap:"wrap",alignItems:"flex-start"}}>
        {/* SVG */}
        <div style={{flex:"0 0 auto",display:"flex",justifyContent:"center",overflowX:"auto"}}>
          <HarmonicMapSVG root={root} scaleType={scaleType} variation={variation}
            onChordClick={handleChordClick} activeChord={active}/>
        </div>

        {/* Right panel */}
        <div style={{flex:1,minWidth:180}}>
          {/* Active chord info */}
          {active ? (
            <div style={{padding:"14px",background:C.purpleDark,border:`1px solid ${TYPE_INFO[activeType]?.label?C.cardBorder:C.cardBorder}`,borderRadius:10,marginBottom:12,animation:"fadeUp 0.3s ease both"}}>
              <p style={{fontSize:20,fontWeight:800,color:C.gold,marginBottom:4}}>{active}</p>
              <p style={{fontSize:11,fontWeight:700,color:C.silver}}>{TYPE_INFO[activeType]?.label}</p>
              <p style={{fontSize:11,color:C.silverDim,marginTop:4,lineHeight:1.6}}>{TYPE_INFO[activeType]?.desc}</p>
            </div>
          ) : (
            <div style={{padding:"14px",background:C.purpleDark,border:`1px solid ${C.cardBorder}`,borderRadius:10,marginBottom:12}}>
              <p style={{fontSize:12,color:C.silverDim}}>Haz clic en cualquier acorde del mapa para ver su relación armónica.</p>
            </div>
          )}

          {/* Legend */}
          <div style={{display:"flex",flexDirection:"column",gap:5}}>
            {Object.entries(TYPE_INFO).slice(0,8).map(([type,info])=>{
              const colorMap={tonic:"#e91e8c",subdominant:"#00bcd4",dominant:"#D4A413",dominant7:"#D4A413",relative:"#4caf50",parallel:"#9c27b0",secondary:"#ff9800",secondary7:"#ff5722",borrowed:"#3f51b5",diminished:"#795548",modal:"#3f51b5",chromatic:"#607d8b",mediant:"#8bc34a",subtonic:"#ff9800"};
              return(
                <div key={type} style={{display:"flex",alignItems:"center",gap:7}}>
                  <div style={{width:10,height:10,borderRadius:"50%",background:colorMap[type]||C.silverDim,flexShrink:0}}/>
                  <span style={{fontSize:10,color:C.silverDim,lineHeight:1.3}}><strong style={{color:C.silver}}>{info.label}:</strong> {info.desc.split(".")[0]}.</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Variation tabs */}
      <div style={{marginTop:14,display:"flex",gap:5,flexWrap:"wrap"}}>
        {MAP_VARIATIONS.map((v,i)=>(
          <button key={v.id} onClick={()=>{setVarIdx(i);setVariation(v.id);}} style={{
            background:variation===v.id?`${C.gold}22`:C.purpleDark,
            border:`1px solid ${variation===v.id?C.gold:C.cardBorder}`,
            borderRadius:6,padding:"5px 10px",cursor:"pointer",
            color:variation===v.id?C.gold:C.silverDim,fontSize:11,fontWeight:600,transition:"all 0.2s",
          }}>
            {v.label}
          </button>
        ))}
      </div>
    </div>
  );
}