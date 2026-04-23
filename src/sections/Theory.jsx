import { useState, useEffect, useCallback, useMemo } from "react";
import { C } from "../styles/tokens";
import { NOTES, NOTE_ES, SCALES, CIRCLE_OF_FIFTHS, getScaleNotes } from "../constants/music";
import { useAudio } from "../hooks/useAudio";
import PianoKeys from "../components/PianoKeys";
import GuitarNeck from "../components/GuitarNeck";

// ─── CIRCLE OF FIFTHS ─────────────────────────────────────────────────────────
function CircleOfFifths({ activeKey, onSelect }) {
  const minors = ["A","E","B","F#","C#","G#","D#","A#","F","C","G","D"];
  return (
    <div style={{ display:"flex", justifyContent:"center" }}>
      <svg width={300} height={300} viewBox="0 0 300 300">
        <circle cx={150} cy={150} r={128} fill={`${C.purpleDark}cc`} stroke={C.cardBorder} strokeWidth={1}/>
        <circle cx={150} cy={150} r={78} fill={`${C.bg}aa`} stroke={C.cardBorder} strokeWidth={1}/>
        <text x={150} y={146} textAnchor="middle" fill={C.gold} fontSize={11} fontFamily="Montserrat" fontWeight="700">Círculo</text>
        <text x={150} y={160} textAnchor="middle" fill={C.gold} fontSize={11} fontFamily="Montserrat" fontWeight="700">de Quintas</text>
        {CIRCLE_OF_FIFTHS.map((note,i)=>{
          const angle=(i*30-90)*Math.PI/180;
          const ox=150+110*Math.cos(angle), oy=150+110*Math.sin(angle);
          const ix=150+68*Math.cos(angle), iy=150+68*Math.sin(angle);
          const active=note===activeKey;
          return (
            <g key={note} onClick={()=>onSelect(note)} style={{ cursor:"pointer" }}>
              <circle cx={ox} cy={oy} r={active?19:16} fill={active?C.gold:`${C.purple}dd`} stroke={active?C.goldLight:C.cardBorder} strokeWidth={active?2:1} style={{ transition:"all 0.25s", filter:active?`drop-shadow(0 0 8px ${C.gold})`:"none" }}/>
              <text x={ox} y={oy+4} textAnchor="middle" fill={active?C.black:"#fff"} fontSize={active?11:10} fontFamily="Montserrat" fontWeight="800" style={{ pointerEvents:"none" }}>{note}</text>
              <circle cx={ix} cy={iy} r={11} fill={`${C.purpleDark}bb`} stroke={C.cardBorder} strokeWidth={1}/>
              <text x={ix} y={iy+4} textAnchor="middle" fill={C.silverDim} fontSize={8} fontFamily="Montserrat" fontWeight="600" style={{ pointerEvents:"none" }}>{minors[i]}m</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ─── INTERVAL VISUAL ─────────────────────────────────────────────────────────
function IntervalVisual() {
  const [active, setActive] = useState(4);
  const ivs = [
    {name:"Unísono",st:0,q:"Perfecto",s:"😐"},{name:"2da Menor",st:1,q:"Disonante",s:"😬"},
    {name:"2da Mayor",st:2,q:"Suave",s:"🙂"},{name:"3ra Menor",st:3,q:"Oscuro",s:"😢"},
    {name:"3ra Mayor",st:4,q:"Brillante",s:"😊"},{name:"4ta Justa",st:5,q:"Perfecto",s:"⚖️"},
    {name:"Tritono",st:6,q:"Tenso",s:"😈"},{name:"5ta Justa",st:7,q:"Perfecto",s:"💪"},
    {name:"6ta Menor",st:8,q:"Melódico",s:"🌙"},{name:"6ta Mayor",st:9,q:"Alegre",s:"☀️"},
    {name:"7ma Menor",st:10,q:"Dominante",s:"🎷"},{name:"7ma Mayor",st:11,q:"Tenso",s:"😤"},
    {name:"Octava",st:12,q:"Perfecto",s:"✨"},
  ];
  return (
    <div>
      <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:14 }}>
        {ivs.map((iv,i)=>(
          <button key={i} onClick={()=>setActive(i)} style={{ background:active===i?`${C.gold}22`:C.purpleDark, border:`1px solid ${active===i?C.gold:C.cardBorder}`, borderRadius:6, padding:"5px 10px", cursor:"pointer", color:active===i?C.gold:C.silver, fontSize:11, fontWeight:600, transition:"all 0.2s" }}>{iv.st} st</button>
        ))}
      </div>
      <div style={{ padding:"18px", background:C.purpleDark, borderRadius:10, border:`1px solid ${C.cardBorder}`, animation:"fadeUp 0.3s ease both" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:12, marginBottom:12 }}>
          <div>
            <div style={{ fontSize:30 }}>{ivs[active].s}</div>
            <div style={{ fontFamily:"'Montserrat',sans-serif", fontWeight:800, fontSize:16, color:"#fff", marginTop:4 }}>{ivs[active].name}</div>
            <div style={{ fontSize:12, color:C.silverDim }}>{ivs[active].st} semitonos</div>
          </div>
          <div style={{ padding:"8px 16px", borderRadius:8, background:`${C.gold}18`, border:`1px solid ${C.gold}44`, color:C.gold, fontWeight:700, fontSize:13 }}>{ivs[active].q}</div>
        </div>
        <div style={{ display:"flex", gap:2 }}>
          {Array.from({length:13},(_,i)=>(
            <div key={i} style={{ flex:1, height:10, borderRadius:2, background:i<=ivs[active].st?C.gold:C.cardBorder, transition:"background 0.3s" }}/>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── BPM METRONOME ────────────────────────────────────────────────────────────
function BPMVisual() {
  const [bpm, setBpm] = useState(90);
  const [on, setOn] = useState(false);
  const [beat, setBeat] = useState(false);
  useEffect(() => {
    if (!on) return;
    const id = setInterval(() => { setBeat(true); setTimeout(()=>setBeat(false), 80); }, 60000/bpm);
    return () => clearInterval(id);
  }, [on, bpm]);
  const genres = [{n:"Balada",b:65},{n:"Hip-Hop",b:90},{n:"Pop",b:120},{n:"Rock",b:140},{n:"Vals",b:100},{n:"Drum & Bass",b:170}];
  return (
    <div>
      <div style={{ textAlign:"center", marginBottom:16 }}>
        <div onClick={()=>setOn(v=>!v)} style={{ width:96, height:96, borderRadius:"50%", margin:"0 auto 12px", background:beat?`radial-gradient(circle,${C.gold},${C.goldLight})`:`radial-gradient(circle,${C.purple},${C.purpleDark})`, border:`3px solid ${beat?C.gold:C.cardBorder}`, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", transition:"all 0.06s", boxShadow:beat?`0 0 30px ${C.gold}88`:"none" }}>
          <div><div style={{ fontSize:26, fontWeight:800, color:beat?C.black:"#fff", lineHeight:1 }}>{bpm}</div><div style={{ fontSize:10, color:beat?C.black:C.silverDim }}>BPM</div></div>
        </div>
        <button className={on?"btn-gold":"btn-outline"} onClick={()=>setOn(v=>!v)}>{on?"⏸ Detener":"▶ Metrónomo"}</button>
      </div>
      <input type="range" min={40} max={220} value={bpm} onChange={e=>setBpm(+e.target.value)} style={{ width:"100%", accentColor:C.gold, marginBottom:12 }}/>
      <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
        {genres.map(g=>(
          <button key={g.n} onClick={()=>setBpm(g.b)} style={{ background:C.purpleDark, border:`1px solid ${C.cardBorder}`, borderRadius:6, padding:"5px 10px", cursor:"pointer", color:C.silver, fontSize:11, fontWeight:600, transition:"all 0.2s" }}
            onMouseEnter={e=>e.currentTarget.style.borderColor=C.gold+"66"} onMouseLeave={e=>e.currentTarget.style.borderColor=C.cardBorder}>
            {g.n} ~{g.b}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── CHORD BUILDER ────────────────────────────────────────────────────────────
function ChordBuilder({ playNote }) {
  const [root, setRoot] = useState("C");
  const [type, setType] = useState("major");
  const types = { major:{n:"Mayor",f:[0,4,7],s:""},minor:{n:"Menor",f:[0,3,7],s:"m"},dim:{n:"Disminuido",f:[0,3,6],s:"°"},aug:{n:"Aumentado",f:[0,4,8],s:"+"},maj7:{n:"Mayor 7ma",f:[0,4,7,11],s:"Maj7"},min7:{n:"Menor 7ma",f:[0,3,7,10],s:"m7"},dom7:{n:"Dom 7",f:[0,4,7,10],s:"7"},sus2:{n:"Sus2",f:[0,2,7],s:"sus2"},sus4:{n:"Sus4",f:[0,5,7],s:"sus4"} };
  const rootIdx = NOTES.indexOf(root);
  const notes = types[type].f.map(i=>NOTES[(rootIdx+i)%12]);
  return (
    <div>
      <div style={{ display:"flex", gap:10, flexWrap:"wrap", marginBottom:14 }}>
        <select value={root} onChange={e=>setRoot(e.target.value)} style={{ background:C.purpleDark, border:`1px solid ${C.cardBorder}`, color:C.silver, borderRadius:8, padding:"8px 12px", fontSize:13, cursor:"pointer", outline:"none" }}>
          {NOTES.map(n=><option key={n} value={n}>{NOTE_ES[n]}</option>)}
        </select>
        <select value={type} onChange={e=>setType(e.target.value)} style={{ background:C.purpleDark, border:`1px solid ${C.cardBorder}`, color:C.silver, borderRadius:8, padding:"8px 12px", fontSize:13, cursor:"pointer", outline:"none" }}>
          {Object.entries(types).map(([k,v])=><option key={k} value={k}>{v.n}</option>)}
        </select>
      </div>
      <div style={{ padding:"16px", background:C.purpleDark, borderRadius:10, border:`1px solid ${C.cardBorder}`, marginBottom:14, display:"flex", alignItems:"center", gap:16, flexWrap:"wrap" }}>
        <div style={{ fontFamily:"'Montserrat',sans-serif", fontWeight:800, fontSize:26, color:C.gold }}>{root}{types[type].s}</div>
        <div style={{ display:"flex", gap:6 }}>
          {notes.map((n,i)=>(
            <div key={i} style={{ width:42, height:42, borderRadius:8, background:`linear-gradient(135deg,${C.purple},${C.purpleLight})`, border:`1px solid ${C.gold}66`, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", animation:`chordPop 0.3s ease ${i*0.08}s both` }}>
              <div style={{ fontSize:12, fontWeight:800, color:C.gold }}>{NOTE_ES[n]}</div>
              <div style={{ fontSize:8, color:C.silverDim }}>{["R","3°","5°","7°"][i]||""}</div>
            </div>
          ))}
        </div>
        <button className="btn-gold" onClick={()=>notes.forEach((n,i)=>setTimeout(()=>playNote(n,"piano",4),i*160))} style={{ marginLeft:"auto" }}>▶ Escuchar</button>
      </div>
      <PianoKeys highlightNotes={notes} onNoteClick={n=>playNote(n,"piano",4)} octaves={[3,4]}/>
    </div>
  );
}

// ─── SCALE EXPLORER ──────────────────────────────────────────────────────────
function ScaleExplorer({ playNote }) {
  const [root, setRoot] = useState("C");
  const [scaleKey, setScaleKey] = useState("major");
  const [instrument, setInstrument] = useState("piano");
  const notes = getScaleNotes(root, scaleKey);
  const scale = SCALES[scaleKey];
  const playScale = () => notes.forEach((n,i)=>setTimeout(()=>playNote(n,instrument,4),i*300));
  return (
    <div>
      <div style={{ display:"flex", gap:10, flexWrap:"wrap", marginBottom:14 }}>
        <select value={root} onChange={e=>setRoot(e.target.value)} style={{ background:C.purpleDark, border:`1px solid ${C.cardBorder}`, color:C.silver, borderRadius:8, padding:"8px 12px", fontSize:13, cursor:"pointer", outline:"none" }}>
          {NOTES.map(n=><option key={n} value={n}>{NOTE_ES[n]}</option>)}
        </select>
        <select value={scaleKey} onChange={e=>setScaleKey(e.target.value)} style={{ background:C.purpleDark, border:`1px solid ${C.cardBorder}`, color:C.silver, borderRadius:8, padding:"8px 12px", fontSize:13, cursor:"pointer", outline:"none" }}>
          {Object.entries(SCALES).map(([k,v])=><option key={k} value={k}>{v.name}</option>)}
        </select>
        <div style={{ display:"flex", gap:6 }}>
          {["piano","guitar"].map(ins=>(
            <button key={ins} onClick={()=>setInstrument(ins)} className={instrument===ins?"btn-gold":"btn-outline"} style={{ padding:"8px 14px", fontSize:12 }}>{ins==="piano"?"🎹":"🎸"}</button>
          ))}
        </div>
        <button className="btn-purple" onClick={playScale}>▶ Escuchar Escala</button>
      </div>
      <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:14 }}>
        {notes.map((n,i)=>(
          <button key={n} onClick={()=>playNote(n,instrument,4)} style={{ padding:"8px 14px", background:i===0?`${C.gold}22`:C.purpleDark, border:`1px solid ${i===0?C.gold:C.cardBorder}`, borderRadius:7, fontSize:13, fontWeight:700, color:i===0?C.gold:C.silver, cursor:"pointer", transition:"all 0.18s", animation:`fadeUp 0.3s ease ${i*0.05}s both` }}>
            {NOTE_ES[n]}<span style={{ fontSize:8, color:C.silverDim, marginLeft:3 }}>{["I","II","III","IV","V","VI","VII"][i]}</span>
          </button>
        ))}
      </div>
      <div style={{ display:"flex", gap:2, marginBottom:12 }}>
        {Array.from({length:12},(_,i)=>{const ri=NOTES.indexOf(root),rel=(i-ri+12)%12,inS=scale.intervals.includes(rel),isR=rel===0;return(<div key={i} style={{ flex:1, height:11, borderRadius:2, background:isR?C.gold:inS?`${C.gold}55`:C.cardBorder, transition:"background 0.4s" }}/>);})}
      </div>
      {instrument==="piano"?<PianoKeys highlightNotes={notes} onNoteClick={n=>playNote(n,instrument,4)} octaves={[3,4]}/>:<GuitarNeck highlightNotes={notes} onNoteClick={n=>playNote(n,instrument,4)}/>}
    </div>
  );
}

// ─── EAR TRAINING STEPS ───────────────────────────────────────────────────────
function EarTrainingGuide() {
  const steps=[{num:"01",title:"Encuentra la tónica",desc:"Toca notas hasta que una suene como el reposo final.",icon:"🎯"},{num:"02",title:"Mayor o Menor",desc:"Alegre/brillante = Mayor. Oscuro/melancólico = Menor.",icon:"☯️"},{num:"03",title:"Usa la Pentatónica",desc:"Casi toda melodía cabe en ella. Empieza por ahí.",icon:"✋"},{num:"04",title:"Identifica I, IV, V",desc:"Los 3 acordes más comunes en cualquier tonalidad.",icon:"🔺"},{num:"05",title:"Escucha la tensión",desc:"El acorde V crea tensión. El I la resuelve.",icon:"⚡"},{num:"06",title:"Practica lento",desc:"Reduce la velocidad. Tu oído necesita tiempo.",icon:"🐢"}];
  return (
    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))", gap:10 }}>
      {steps.map((s,i)=>(
        <div key={i} style={{ padding:"16px", background:C.purpleDark, border:`1px solid ${C.cardBorder}`, borderRadius:10, animation:`fadeUp 0.4s ease ${i*0.07}s both`, transition:"all 0.2s" }}
          onMouseEnter={e=>{e.currentTarget.style.borderColor=C.gold+"55";e.currentTarget.style.transform="translateY(-2px)";}}
          onMouseLeave={e=>{e.currentTarget.style.borderColor=C.cardBorder;e.currentTarget.style.transform="translateY(0)";}}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
            <span style={{ fontSize:10, fontWeight:800, color:C.gold, letterSpacing:"0.1em" }}>PASO {s.num}</span>
            <span style={{ fontSize:22 }}>{s.icon}</span>
          </div>
          <div style={{ fontFamily:"'Montserrat',sans-serif", fontWeight:700, fontSize:13, color:"#fff", marginBottom:6 }}>{s.title}</div>
          <div style={{ fontSize:12, color:C.silverDim, lineHeight:1.6 }}>{s.desc}</div>
        </div>
      ))}
    </div>
  );
}

// ─── SCALE ORDER EXERCISE ────────────────────────────────────────────────────
function statusStyle(s) {
  if (s==="correct")     return {bg:"#27ae6022",border:"#27ae6088",text:"#2ecc71",icon:"✓"};
  if (s==="wrong_order") return {bg:"#f39c1222",border:"#f39c1288",text:"#f1c40f",icon:"~"};
  return                        {bg:"#c0392b22",border:"#c0392b88",text:"#e74c3c",icon:"✗"};
}

function ScaleOrderExercise({ playNote }) {
  const [exRoot, setExRoot]     = useState("C");
  const [exScale, setExScale]   = useState("major");
  const [slots, setSlots]       = useState([]);
  const [dragNote, setDragNote] = useState(null);
  const [dragFrom, setDragFrom] = useState(null);
  const [result, setResult]     = useState(null);
  const [checked, setChecked]   = useState(false);
  const [animKey, setAnimKey]   = useState(0);

  const correctScale = useMemo(()=>getScaleNotes(exRoot,exScale),[exRoot,exScale]);

  useEffect(()=>{
    setSlots(Array(correctScale.length).fill(null));
    setResult(null); setChecked(false); setAnimKey(k=>k+1);
  },[correctScale]);

  const dropOnSlot=(idx)=>{
    if(!dragNote)return;
    const s=[...slots];
    if(typeof dragFrom==="number")s[dragFrom]=null;
    s[idx]=dragNote;
    setSlots(s); setDragNote(null); setDragFrom(null); setChecked(false); setResult(null);
  };
  const dropOnBank=()=>{ if(dragNote&&typeof dragFrom==="number"){const s=[...slots];s[dragFrom]=null;setSlots(s);} setDragNote(null);setDragFrom(null); };
  const verify=()=>{ setResult(slots.map((n,i)=>!n?"empty":n===correctScale[i]?"correct":correctScale.includes(n)?"wrong_order":"wrong")); setChecked(true); };
  const reset=()=>{setSlots(Array(correctScale.length).fill(null));setResult(null);setChecked(false);};
  const newExercise=()=>{const roots=NOTES;const scales=Object.keys(SCALES).slice(0,6);setExRoot(roots[Math.floor(Math.random()*roots.length)]);setExScale(scales[Math.floor(Math.random()*scales.length)]);};

  const stats=result?{correct:result.filter(r=>r==="correct").length,wrongOrder:result.filter(r=>r==="wrong_order").length,wrong:result.filter(r=>r==="wrong"||r==="empty").length}:null;

  return (
    <div style={{ animation:`fadeUp 0.4s ease both` }} key={animKey}>
      <div style={{ marginBottom:14, padding:"14px 18px", background:`${C.gold}15`, border:`1px solid ${C.gold}44`, borderRadius:10 }}>
        <p style={{ fontSize:11, fontWeight:800, color:C.gold, letterSpacing:"0.08em" }}>📋 EJERCICIO: Ordena la escala</p>
        <p style={{ fontSize:14, fontWeight:700, color:"#fff", marginTop:4 }}>
          Pon en orden todas las notas de la escala de <span style={{ color:C.gold }}>{NOTE_ES[exRoot]} {SCALES[exScale]?.name}</span>
        </p>
      </div>

      <div style={{ display:"flex", gap:10, marginBottom:14, flexWrap:"wrap" }}>
        <select value={exRoot} onChange={e=>setExRoot(e.target.value)} style={{ background:C.purpleDark, border:`1px solid ${C.cardBorder}`, color:C.silver, borderRadius:8, padding:"8px 12px", fontSize:13, cursor:"pointer", outline:"none" }}>
          {NOTES.map(n=><option key={n} value={n}>{NOTE_ES[n]}</option>)}
        </select>
        <select value={exScale} onChange={e=>setExScale(e.target.value)} style={{ background:C.purpleDark, border:`1px solid ${C.cardBorder}`, color:C.silver, borderRadius:8, padding:"8px 12px", fontSize:13, cursor:"pointer", outline:"none" }}>
          {Object.entries(SCALES).slice(0,8).map(([k,v])=><option key={k} value={k}>{v.name}</option>)}
        </select>
        <button className="btn-outline" onClick={newExercise} style={{ fontSize:12 }}>🎲 Aleatorio</button>
        <button className="btn-outline" onClick={reset} style={{ fontSize:12 }}>↺ Limpiar</button>
      </div>

      {/* Slots */}
      <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:14 }}>
        {slots.map((note,i)=>{
          const st=result?.[i]; const col=st?statusStyle(st):null;
          return (
            <div key={i} onDragOver={e=>e.preventDefault()} onDrop={()=>dropOnSlot(i)}
              onClick={()=>{if(note){const s=[...slots];s[i]=null;setSlots(s);setChecked(false);setResult(null);}}}
              style={{ width:52, height:52, borderRadius:10, border:`2px dashed ${col?col.border:C.cardBorder}`, background:col?col.bg:note?`${C.purple}88`:`${C.purpleDark}44`, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", cursor:note?"pointer":"default", transition:"all 0.25s", boxShadow:col?`0 0 12px ${col.border}66`:"none", position:"relative", animation:checked&&st?`chordPop 0.35s ease ${i*0.06}s both`:"none" }}>
              <div style={{ position:"absolute", top:3, left:6, fontSize:8, color:C.silverDim, fontWeight:700 }}>{i+1}</div>
              {note?(
                <>
                  <div style={{ fontSize:13, fontWeight:800, color:col?col.text:C.gold }}>{NOTE_ES[note]}</div>
                  <div style={{ fontSize:8, color:col?col.text+"88":C.silverDim }}>{note}</div>
                  {st&&<div style={{ position:"absolute", top:-8, right:-8, width:18, height:18, borderRadius:"50%", background:col.border, display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, fontWeight:900, color:"#fff" }}>{col.icon}</div>}
                </>
              ):<div style={{ fontSize:18, color:C.cardBorder }}>+</div>}
            </div>
          );
        })}
      </div>

      {/* Bank */}
      <div onDragOver={e=>e.preventDefault()} onDrop={dropOnBank} style={{ padding:"12px", background:`${C.bg}88`, borderRadius:10, border:`1px solid ${C.cardBorder}`, marginBottom:14 }}>
        <p style={{ fontSize:9, color:C.silverDim, marginBottom:8, letterSpacing:"0.1em", textTransform:"uppercase" }}>Banco — arrastra al orden correcto</p>
        <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
          {[...correctScale].sort(()=>Math.random()-0.5).map(note=>(
            <div key={note} draggable onDragStart={()=>{setDragNote(note);setDragFrom("bank");}} onClick={()=>playNote?.(note,"piano",4)}
              style={{ padding:"7px 12px", background:`${C.gold}18`, border:`1px solid ${C.gold}55`, borderRadius:7, cursor:"grab", fontSize:12, fontWeight:700, color:C.gold, userSelect:"none", transition:"all 0.15s" }}
              onMouseEnter={e=>{e.currentTarget.style.transform="scale(1.08)";}} onMouseLeave={e=>{e.currentTarget.style.transform="scale(1)";}}>
              {NOTE_ES[note]}<span style={{ fontSize:8, color:C.silverDim, marginLeft:3 }}>({note})</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:10, marginBottom:12 }}>
        <button className="btn-gold" onClick={verify} disabled={slots.every(s=>!s)}>✓ Comprobar</button>
        {stats && (
          <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
            {[["✓ Correctas",stats.correct,"#2ecc71"],["~ Orden",stats.wrongOrder,"#f1c40f"],["✗ Errores",stats.wrong,"#e74c3c"]].map(([l,v,c])=>(
              <div key={l} style={{ padding:"6px 12px", background:`${c}15`, border:`1px solid ${c}44`, borderRadius:8, display:"flex", alignItems:"center", gap:6, animation:"chordPop 0.4s ease both" }}>
                <span style={{ fontSize:16, fontWeight:900, color:c }}>{v}</span>
                <span style={{ fontSize:10, color:C.silverDim }}>{l}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {checked && (
        <div style={{ padding:"12px 16px", background:`${C.purpleDark}`, border:`1px solid ${C.cardBorder}`, borderRadius:10, animation:"fadeUp 0.35s ease both" }}>
          <p style={{ fontSize:10, color:C.silverDim, marginBottom:8, letterSpacing:"0.08em", textTransform:"uppercase" }}>Respuesta correcta</p>
          <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
            {correctScale.map((n,i)=>(
              <div key={n} style={{ padding:"5px 10px", background:i===0?`${C.gold}22`:C.purpleDark, border:`1px solid ${i===0?C.gold:C.cardBorder}`, borderRadius:6, fontSize:12, fontWeight:700, color:i===0?C.gold:C.silver, animation:`fadeUp 0.3s ease ${i*0.05}s both` }}>
                {NOTE_ES[n]}<span style={{ fontSize:8, color:C.silverDim, marginLeft:3 }}>{["I","II","III","IV","V","VI","VII"][i]||""}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── COMPLETE THE SCALE EXERCISE ─────────────────────────────────────────────
const DIFFICULTY = [
  { id:"easy",   label:"Fácil",   icon:"🌱", missing:2, desc:"2 notas faltantes" },
  { id:"medium", label:"Medio",   icon:"🔥", missing:4, desc:"4 notas faltantes" },
  { id:"hard",   label:"Difícil", icon:"⚡", missing:6, desc:"6 notas faltantes" },
];

function CompleteScaleExercise({ playNote }) {
  const [diff, setDiff]       = useState("easy");
  const [exRoot, setExRoot]   = useState("G");
  const [exScale, setExScale] = useState("major");
  const [puzzle, setPuzzle]   = useState(null);
  const [answers, setAnswers] = useState({});
  const [dragNote, setDragNote] = useState(null);
  const [result, setResult]   = useState(null);
  const [checked, setChecked] = useState(false);
  const [animKey, setAnimKey] = useState(0);

  const correctScale = useMemo(()=>getScaleNotes(exRoot,exScale),[exRoot,exScale]);

  const generatePuzzle = useCallback(() => {
    const d = DIFFICULTY.find(d=>d.id===diff)||DIFFICULTY[0];
    const indices = [...Array(correctScale.length).keys()].sort(()=>Math.random()-0.5).slice(0,d.missing);
    setPuzzle({ given: correctScale.map((n,i)=>indices.includes(i)?null:n), hiddenIdx: indices.sort((a,b)=>a-b) });
    setAnswers({}); setResult(null); setChecked(false); setAnimKey(k=>k+1);
  }, [exRoot, exScale, diff, correctScale]);

  useEffect(()=>{ generatePuzzle(); }, [exRoot, exScale, diff]);

  const dropOnSlot=(idx)=>{
    if(!dragNote)return;
    setAnswers(a=>({...a,[idx]:dragNote})); setDragNote(null); setChecked(false); setResult(null);
  };
  const verify=()=>{
    if(!puzzle)return;
    const res={};
    puzzle.hiddenIdx.forEach(i=>{ const ans=answers[i]; res[i]=!ans?"empty":ans===correctScale[i]?"correct":correctScale.includes(ans)?"wrong_order":"wrong"; });
    setResult(res); setChecked(true);
  };
  const reset=()=>{setAnswers({});setResult(null);setChecked(false);};

  if(!puzzle) return null;

  const missingNotes=[...new Set(puzzle.hiddenIdx.map(i=>correctScale[i]))];
  const distractors=NOTES.filter(n=>!correctScale.includes(n)).slice(0,3);
  const bank=[...new Set([...missingNotes,...distractors])].sort(()=>Math.random()-0.5);
  const stats=result?{correct:Object.values(result).filter(r=>r==="correct").length,wrong:Object.values(result).filter(r=>r!=="correct").length}:null;

  return (
    <div key={animKey} style={{ animation:"fadeUp 0.4s ease both" }}>
      {/* Difficulty */}
      <div style={{ marginBottom:14 }}>
        <p style={{ fontSize:10, color:C.silverDim, marginBottom:8, letterSpacing:"0.12em", textTransform:"uppercase" }}>Dificultad</p>
        <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
          {DIFFICULTY.map(d=>(
            <button key={d.id} onClick={()=>setDiff(d.id)} style={{ background:diff===d.id?`linear-gradient(135deg,${C.purple},${C.purpleLight})`:C.card, border:`1px solid ${diff===d.id?C.gold:C.cardBorder}`, borderRadius:8, padding:"8px 14px", cursor:"pointer", color:diff===d.id?C.gold:C.silverDim, fontFamily:"'Montserrat',sans-serif", fontWeight:700, fontSize:12, transition:"all 0.2s", boxShadow:diff===d.id?`0 0 14px ${C.gold}33`:"none" }}>
              {d.icon} {d.label}<span style={{ fontSize:10, color:C.silverDim, marginLeft:6 }}>({d.desc})</span>
            </button>
          ))}
        </div>
      </div>

      <div style={{ display:"flex", gap:10, flexWrap:"wrap", marginBottom:14 }}>
        <select value={exRoot} onChange={e=>setExRoot(e.target.value)} style={{ background:C.purpleDark, border:`1px solid ${C.cardBorder}`, color:C.silver, borderRadius:8, padding:"8px 12px", fontSize:13, cursor:"pointer", outline:"none" }}>
          {NOTES.map(n=><option key={n} value={n}>{NOTE_ES[n]}</option>)}
        </select>
        <select value={exScale} onChange={e=>setExScale(e.target.value)} style={{ background:C.purpleDark, border:`1px solid ${C.cardBorder}`, color:C.silver, borderRadius:8, padding:"8px 12px", fontSize:13, cursor:"pointer", outline:"none" }}>
          {Object.entries(SCALES).slice(0,8).map(([k,v])=><option key={k} value={k}>{v.name}</option>)}
        </select>
        <button className="btn-outline" onClick={generatePuzzle} style={{ fontSize:12 }}>🎲 Nuevo</button>
        <button className="btn-outline" onClick={reset} style={{ fontSize:12 }}>↺ Limpiar</button>
      </div>

      <div style={{ marginBottom:14, padding:"12px 16px", background:`${C.gold}15`, border:`1px solid ${C.gold}44`, borderRadius:10 }}>
        <p style={{ fontSize:11, fontWeight:800, color:C.gold }}>📋 Completa la escala de {NOTE_ES[exRoot]} {SCALES[exScale]?.name}</p>
        <p style={{ fontSize:11, color:C.silverDim, marginTop:2 }}>Las notas con <span style={{ color:C.gold }}>?</span> son las que debes encontrar</p>
      </div>

      {/* Scale display with gaps */}
      <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:14 }}>
        {puzzle.given.map((note,i)=>{
          const isHidden=note===null;
          const ans=answers[i];
          const st=result?.[i];
          const col=st?statusStyle(st):null;
          return (
            <div key={i} onDragOver={e=>isHidden&&e.preventDefault()} onDrop={()=>isHidden&&dropOnSlot(i)}
              onClick={()=>{if(isHidden&&ans){const a={...answers};delete a[i];setAnswers(a);setChecked(false);setResult(null);}else if(!isHidden)playNote?.(note,"piano",4);}}
              style={{ width:52, height:52, borderRadius:10, border:isHidden?`2px dashed ${col?col.border:C.gold+"55"}`:`1px solid ${C.cardBorder}`, background:isHidden?(col?col.bg:ans?`${C.purple}88`:`${C.gold}08`):`${C.purpleDark}`, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", cursor:"pointer", transition:"all 0.25s", boxShadow:col?`0 0 12px ${col.border}66`:"none", position:"relative", animation:checked&&st?`chordPop 0.35s ease ${i*0.06}s both`:"none" }}>
              <div style={{ position:"absolute", top:3, left:6, fontSize:8, color:C.silverDim, fontWeight:700 }}>{["I","II","III","IV","V","VI","VII"][i]}</div>
              {isHidden?(
                ans?(
                  <>
                    <div style={{ fontSize:13, fontWeight:800, color:col?col.text:C.gold }}>{NOTE_ES[ans]}</div>
                    <div style={{ fontSize:8, color:col?col.text+"88":C.silverDim }}>{ans}</div>
                    {st&&<div style={{ position:"absolute", top:-8, right:-8, width:18, height:18, borderRadius:"50%", background:col.border, display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, fontWeight:900, color:"#fff" }}>{col.icon}</div>}
                  </>
                ):<div style={{ fontSize:20, color:C.gold+"88" }}>?</div>
              ):(
                <>
                  <div style={{ fontSize:13, fontWeight:700, color:C.silver }}>{NOTE_ES[note]}</div>
                  <div style={{ fontSize:8, color:C.silverDim }}>{note}</div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Bank */}
      <div onDragOver={e=>e.preventDefault()} onDrop={()=>{setDragNote(null);}} style={{ padding:"12px", background:`${C.bg}88`, borderRadius:10, border:`1px solid ${C.cardBorder}`, marginBottom:14 }}>
        <p style={{ fontSize:9, color:C.silverDim, marginBottom:8, letterSpacing:"0.1em", textTransform:"uppercase" }}>Banco — arrastra a los espacios con ?</p>
        <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
          {bank.map(note=>(
            <div key={note} draggable onDragStart={()=>setDragNote(note)} onClick={()=>playNote?.(note,"piano",4)}
              style={{ padding:"7px 12px", background:missingNotes.includes(note)?`${C.gold}18`:C.purpleDark, border:`1px solid ${missingNotes.includes(note)?C.gold+"55":C.cardBorder}`, borderRadius:7, cursor:"grab", fontSize:12, fontWeight:700, color:missingNotes.includes(note)?C.gold:C.silverDim, userSelect:"none", transition:"all 0.15s" }}
              onMouseEnter={e=>e.currentTarget.style.transform="scale(1.08)"} onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}>
              {NOTE_ES[note]}<span style={{ fontSize:8, color:C.silverDim, marginLeft:3 }}>({note})</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:10, marginBottom:12 }}>
        <button className="btn-gold" onClick={verify} disabled={Object.keys(answers).length===0}>✓ Comprobar</button>
        {stats && (
          <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
            {[["Correctas",stats.correct,"#2ecc71"],["Errores",stats.wrong,"#e74c3c"]].map(([l,v,c])=>(
              <div key={l} style={{ padding:"6px 12px", background:`${c}15`, border:`1px solid ${c}44`, borderRadius:8, display:"flex", alignItems:"center", gap:6, animation:"chordPop 0.4s ease both" }}>
                <span style={{ fontSize:16, fontWeight:900, color:c }}>{v}</span>
                <span style={{ fontSize:10, color:C.silverDim }}>{l}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {checked && (
        <div style={{ padding:"12px 16px", background:C.purpleDark, border:`1px solid ${C.cardBorder}`, borderRadius:10, animation:"fadeUp 0.35s ease both" }}>
          <p style={{ fontSize:10, color:C.silverDim, marginBottom:8, letterSpacing:"0.08em", textTransform:"uppercase" }}>Respuesta completa</p>
          <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
            {correctScale.map((n,i)=>(
              <div key={n} style={{ padding:"5px 10px", background:puzzle.hiddenIdx.includes(i)?`${C.gold}22`:C.purpleDark, border:`1px solid ${puzzle.hiddenIdx.includes(i)?C.gold:C.cardBorder}`, borderRadius:6, fontSize:12, fontWeight:700, color:puzzle.hiddenIdx.includes(i)?C.gold:C.silver, animation:`fadeUp 0.3s ease ${i*0.05}s both` }}>
                {NOTE_ES[n]}<span style={{ fontSize:8, color:C.silverDim, marginLeft:3 }}>{["I","II","III","IV","V","VI","VII"][i]||""}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── TOPICS ──────────────────────────────────────────────────────────────────
const TOPICS = [
  {id:"intervals",icon:"📏",title:"Intervalos",color:"#D4A413"},
  {id:"major",icon:"☀️",title:"Escala Mayor",color:"#4CAF50"},
  {id:"minor",icon:"🌙",title:"Escalas Menores",color:"#9C27B0"},
  {id:"pentatonic",icon:"✋",title:"Pentatónica",color:"#FF9800"},
  {id:"blues",icon:"🎷",title:"Blues",color:"#2196F3"},
  {id:"modes",icon:"🔮",title:"Modos",color:"#00BCD4"},
  {id:"chords",icon:"🎹",title:"Acordes",color:"#E91E63"},
  {id:"circle",icon:"⭕",title:"Círculo de Quintas",color:"#D4A413"},
  {id:"bpm",icon:"🥁",title:"Tiempo y BPM",color:"#FF5722"},
  {id:"ear",icon:"👂",title:"Sacar Canciones",color:"#8BC34A"},
  {id:"order_exercise",icon:"🎯",title:"Ordenar Escala",color:"#9C27B0"},
  {id:"complete_exercise",icon:"🧩",title:"Completar Escala",color:"#e74c3c"},
];

const DESCRIPTIONS = {
  intervals:"Un semitono es la distancia mínima entre dos notas (1 traste). Dos semitonos = 1 tono. Todo en música se construye sobre estas distancias: 3ra Mayor = 4 st, 5ta Justa = 7 st.",
  major:"Fórmula: T-T-S-T-T-T-S. Suena alegre y brillante. Los grados I, IV y V son los más importantes. La progresión I-IV-V está en miles de canciones.",
  minor:"La Menor Natural (T-S-T-T-S-T-T) suena oscura. La Menor Armónica sube el 7° para tensión hacia la tónica. La Menor Melódica sube 6° y 7° al ascender.",
  pentatonic:"Solo 5 notas muy musicales entre sí. La menor pentatónica (1-b3-4-5-b7) es la favorita del rock y blues. Casi imposible sonar mal con ella.",
  blues:"Pentatónica menor + el tritono (b5). Esa nota extra crea la tensión característica del blues. BB King, Stevie Ray Vaughan y Clapton la dominaron.",
  modes:"Los 7 modos son la misma escala mayor desde cada grado. Dórico: jazz/funk. Frigio: flamenco/oscuro. Lidio: soñador (#4). Mixolidio: rock/dominante. Locrio: el más oscuro.",
  chords:"Triada = raíz + 3ra + 5ta. Mayor: 1-3-5. Menor: 1-b3-5. Disminuido: 1-b3-b5. Las cuatríadas agregan la 7ma. Maj7 = jazzístico. Dom7 = tensión dominante.",
  circle:"12 tonalidades en círculo. Cada paso horario sube una 5ta. Adyacentes comparten 6 de 7 notas. Útil para modular y entender armaduras.",
  bpm:"60 BPM = 1 pulso/segundo. Compás 4/4 (el más común), 3/4 (vals), 6/8. Saber el BPM te permite tocar en tiempo e identificar el género.",
  ear:"1) Tónica. 2) Mayor o Menor. 3) Pentatónica. 4) I-IV-V. 5) Tensión y resolución. 6) Practica lento. Mejora con cada canción.",
  order_exercise:"Practica ordenando escalas desde cero. Arrastra las notas al orden correcto y comprueba tu respuesta. Verde = correcto, Amarillo = orden incorrecto, Rojo = nota incorrecta.",
  complete_exercise:"Completa las notas faltantes de la escala. Elige la dificultad: fácil (2 notas), medio (4 notas), difícil (6 notas). Arrastra las notas correctas a los espacios vacíos.",
};

// ─── MAIN THEORY ─────────────────────────────────────────────────────────────
export default function Theory() {
  const [activeTopic, setActiveTopic] = useState("intervals");
  const [circleKey, setCircleKey] = useState("C");
  const { playNote } = useAudio();
  const topic = TOPICS.find(t=>t.id===activeTopic);

  const renderVisual = () => {
    switch(activeTopic) {
      case "intervals": return <IntervalVisual/>;
      case "major":     return <ScaleExplorer playNote={playNote}/>;
      case "minor":     return <ScaleExplorer playNote={playNote}/>;
      case "pentatonic":return <ScaleExplorer playNote={playNote}/>;
      case "blues":     return <ScaleExplorer playNote={playNote}/>;
      case "modes":     return <ScaleExplorer playNote={playNote}/>;
      case "chords":    return <ChordBuilder playNote={playNote}/>;
      case "circle":    return (
        <div>
          <p style={{ fontSize:12, color:C.silverDim, marginBottom:10 }}>Haz clic en cualquier tonalidad</p>
          <CircleOfFifths activeKey={circleKey} onSelect={setCircleKey}/>
          <p style={{ textAlign:"center", color:C.gold, fontWeight:700, fontSize:15, marginTop:8 }}>
            {NOTE_ES[circleKey]} — Relativa menor: {NOTE_ES[CIRCLE_OF_FIFTHS[(CIRCLE_OF_FIFTHS.indexOf(circleKey)+9)%12]]}m
          </p>
        </div>
      );
      case "bpm":              return <BPMVisual/>;
      case "ear":              return <EarTrainingGuide/>;
      case "order_exercise":   return <ScaleOrderExercise playNote={playNote}/>;
      case "complete_exercise":return <CompleteScaleExercise playNote={playNote}/>;
      default: return null;
    }
  };

  return (
    <div style={{ paddingBottom:48 }}>
      <div className="fade-up" style={{ marginBottom:28 }}>
        <span className="tag gold">Teoría Musical</span>
        <h2 style={{ fontFamily:"'Montserrat',sans-serif", fontWeight:800, fontSize:28, color:"#fff", marginTop:8, animation:"glow 3s ease-in-out infinite" }}>Aprende Desde Cero</h2>
        <p style={{ color:C.silverDim, fontSize:13, marginTop:4 }}>Teoría musical visual e interactiva. Haz clic en cada tema.</p>
      </div>

      <div className="fade-up" style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:24, animationDelay:"0.08s" }}>
        {TOPICS.map((t,i)=>(
          <button key={t.id} onClick={()=>setActiveTopic(t.id)} style={{ background:activeTopic===t.id?`${t.color}22`:C.card, border:`1px solid ${activeTopic===t.id?t.color:C.cardBorder}`, borderRadius:20, padding:"7px 14px", cursor:"pointer", color:activeTopic===t.id?t.color:C.silverDim, fontSize:12, fontWeight:700, transition:"all 0.2s", display:"flex", alignItems:"center", gap:6, boxShadow:activeTopic===t.id?`0 0 14px ${t.color}33`:"none", animation:`fadeUp 0.4s ease ${i*0.03}s both` }}>
            {t.icon} {t.title}
          </button>
        ))}
      </div>

      <div key={activeTopic} style={{ animation:"theorySectionIn 0.4s cubic-bezier(0.4,0,0.2,1) both" }}>
        <div className="card" style={{ marginBottom:20, borderColor:`${topic?.color}44` }}>
          <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:12 }}>
            <div style={{ width:52, height:52, borderRadius:12, background:`${topic?.color}22`, border:`1px solid ${topic?.color}55`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:26 }}>{topic?.icon}</div>
            <div>
              <h3 style={{ fontFamily:"'Montserrat',sans-serif", fontWeight:800, fontSize:20, color:"#fff" }}>{topic?.title}</h3>
              <span className="tag" style={{ background:`${topic?.color}18`, borderColor:`${topic?.color}44`, color:topic?.color, marginTop:4, display:"inline-block" }}>Teoría esencial</span>
            </div>
          </div>
          <p style={{ fontSize:13, color:C.silver, lineHeight:1.8 }}>{DESCRIPTIONS[activeTopic]}</p>
        </div>
        <div className="card" style={{ borderColor:`${topic?.color}33` }}>
          <p style={{ fontSize:10, color:C.silverDim, marginBottom:16, letterSpacing:"0.1em", textTransform:"uppercase" }}>Vista interactiva — {topic?.title}</p>
          {renderVisual()}
        </div>
      </div>
    </div>
  );
}
