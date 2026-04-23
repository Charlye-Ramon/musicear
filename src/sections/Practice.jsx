import { useState, useEffect, useCallback, useRef } from "react";
import { C } from "../styles/tokens";
import { NOTES, NOTE_ES, SCALES, LEVELS, INSTRUMENTS, getScaleNotes, generateMelody } from "../constants/music";
import { useAudio } from "../hooks/useAudio";
import PianoKeys from "../components/PianoKeys";
import GuitarNeck from "../components/GuitarNeck";
import { WaveForm } from "../components/ui";

function FloatingNote({ x, id, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 1400); return () => clearTimeout(t); }, []);
  return (
    <div className="note-float" style={{ position:"fixed", left:x, bottom:100, pointerEvents:"none", fontSize:28, zIndex:9999, color:C.gold, userSelect:"none", filter:`drop-shadow(0 0 8px ${C.gold})` }}>
      {["♪","♫","♩","♬"][id % 4]}
    </div>
  );
}

function GuitarModeToggle({ mode, onChange }) {
  return (
    <div>
      <p style={{ fontSize:10, color:C.silverDim, marginBottom:6, letterSpacing:"0.12em", textTransform:"uppercase" }}>Modo Guitarra</p>
      <div style={{ display:"flex", gap:6 }}>
        {[{ id:"clean", icon:"🎵", label:"Limpio", color:C.gold }, { id:"overdrive", icon:"🔥", label:"Overdrive", color:"#e74c3c" }].map(m => (
          <button key={m.id} onClick={() => onChange(m.id)} style={{
            background: mode===m.id ? (m.id==="overdrive" ? "linear-gradient(135deg,#c0392b,#e74c3c)" : `linear-gradient(135deg,${C.purple},${C.purpleLight})`) : C.card,
            border:`1px solid ${mode===m.id ? m.color : C.cardBorder}`, borderRadius:8, padding:"8px 16px", cursor:"pointer",
            color: mode===m.id ? (m.id==="overdrive" ? "#fff" : m.color) : C.silverDim,
            fontFamily:"'Montserrat',sans-serif", fontWeight:700, fontSize:12, transition:"all 0.2s",
            boxShadow: mode===m.id ? `0 0 14px ${m.color}44` : "none", display:"flex", alignItems:"center", gap:6,
          }}>{m.icon} {m.label}</button>
        ))}
      </div>
    </div>
  );
}

function statusStyle(s) {
  if (s === "correct")     return { bg:"#27ae6022", border:"#27ae6088", text:"#2ecc71", icon:"✓" };
  if (s === "wrong_order") return { bg:"#f39c1222", border:"#f39c1288", text:"#f1c40f", icon:"~" };
  return                          { bg:"#c0392b22", border:"#c0392b88", text:"#e74c3c", icon:"✗" };
}

function MelodyVerifier({ melody, scaleNotes, onPlayNote }) {
  const [slots, setSlots]   = useState(() => Array(melody.length).fill(null));
  const [dragNote, setDragNote] = useState(null);
  const [dragFrom, setDragFrom] = useState(null);
  const [result, setResult] = useState(null);
  const [checked, setChecked] = useState(false);

  const distractors = NOTES.filter(n => !scaleNotes.includes(n)).slice(0, 3);
  const bank = [...new Set([...scaleNotes, ...distractors])];

  useEffect(() => { setSlots(Array(melody.length).fill(null)); setResult(null); setChecked(false); }, [melody]);

  const dropOnSlot = (idx) => {
    if (!dragNote) return;
    const s = [...slots];
    if (typeof dragFrom === "number") s[dragFrom] = null;
    s[idx] = dragNote;
    setSlots(s); setDragNote(null); setDragFrom(null); setChecked(false); setResult(null);
  };
  const dropOnBank = () => {
    if (dragNote && typeof dragFrom === "number") { const s=[...slots]; s[dragFrom]=null; setSlots(s); }
    setDragNote(null); setDragFrom(null);
  };
  const verify = () => {
    setResult(slots.map((n,i) => !n ? "empty" : n===melody[i] ? "correct" : melody.includes(n) ? "wrong_order" : "wrong"));
    setChecked(true);
  };
  const reset = () => { setSlots(Array(melody.length).fill(null)); setResult(null); setChecked(false); };

  const stats = result ? {
    correct: result.filter(r=>r==="correct").length,
    wrongOrder: result.filter(r=>r==="wrong_order").length,
    wrong: result.filter(r=>r==="wrong"||r==="empty").length,
  } : null;

  return (
    <div style={{ marginTop:20, padding:"20px", background:C.purpleDark, border:`1px solid ${C.cardBorder}`, borderRadius:14, animation:"fadeUp 0.4s ease both" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14, flexWrap:"wrap", gap:8 }}>
        <div>
          <p style={{ fontSize:11, fontWeight:800, color:C.gold, letterSpacing:"0.1em", textTransform:"uppercase" }}>🎯 Verificador de Melodía</p>
          <p style={{ fontSize:11, color:C.silverDim, marginTop:2 }}>Arrastra las notas al orden correcto y comprueba</p>
        </div>
        <button onClick={reset} className="btn-outline" style={{ fontSize:11, padding:"5px 12px" }}>↺ Limpiar</button>
      </div>

      {/* Slots */}
      <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:14 }}>
        {slots.map((note, i) => {
          const st = result?.[i];
          const col = st ? statusStyle(st) : null;
          return (
            <div key={i} onDragOver={e=>e.preventDefault()} onDrop={()=>dropOnSlot(i)} onClick={()=>note&&(()=>{const s=[...slots];s[i]=null;setSlots(s);setChecked(false);setResult(null);})()}
              style={{ width:52, height:52, borderRadius:10, border:`2px dashed ${col?col.border:C.cardBorder}`, background:col?col.bg:note?`${C.purple}88`:`${C.purpleDark}44`, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", cursor:note?"pointer":"default", transition:"all 0.25s", boxShadow:col?`0 0 12px ${col.border}66`:"none", position:"relative", animation:checked&&st?`chordPop 0.35s ease ${i*0.06}s both`:"none" }}>
              <div style={{ position:"absolute", top:3, left:6, fontSize:8, color:C.silverDim, fontWeight:700 }}>{i+1}</div>
              {note ? (
                <>
                  <div style={{ fontSize:13, fontWeight:800, color:col?col.text:C.gold }}>{NOTE_ES[note]}</div>
                  <div style={{ fontSize:8, color:col?col.text+"88":C.silverDim }}>{note}</div>
                  {st && <div style={{ position:"absolute", top:-8, right:-8, width:18, height:18, borderRadius:"50%", background:col.border, display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, fontWeight:900, color:"#fff" }}>{col.icon}</div>}
                </>
              ) : <div style={{ fontSize:18, color:C.cardBorder }}>+</div>}
            </div>
          );
        })}
      </div>

      {/* Bank */}
      <div onDragOver={e=>e.preventDefault()} onDrop={dropOnBank}
        style={{ padding:"12px", background:`${C.bg}88`, borderRadius:10, border:`1px solid ${C.cardBorder}`, marginBottom:14 }}>
        <p style={{ fontSize:9, color:C.silverDim, marginBottom:8, letterSpacing:"0.1em", textTransform:"uppercase" }}>Banco de notas — arrastra a los recuadros</p>
        <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
          {bank.map(note => (
            <div key={note} draggable onDragStart={()=>{setDragNote(note);setDragFrom("bank");}} onClick={()=>onPlayNote?.(note,4)}
              style={{ padding:"7px 12px", background:scaleNotes.includes(note)?`${C.gold}18`:C.purpleDark, border:`1px solid ${scaleNotes.includes(note)?C.gold+"55":C.cardBorder}`, borderRadius:7, cursor:"grab", fontSize:12, fontWeight:700, color:scaleNotes.includes(note)?C.gold:C.silverDim, userSelect:"none", transition:"all 0.15s" }}
              onMouseEnter={e=>{e.currentTarget.style.transform="scale(1.08)";e.currentTarget.style.borderColor=C.gold+"88";}}
              onMouseLeave={e=>{e.currentTarget.style.transform="scale(1)";e.currentTarget.style.borderColor=scaleNotes.includes(note)?C.gold+"55":C.cardBorder;}}>
              {NOTE_ES[note]}<span style={{ fontSize:8, color:C.silverDim, marginLeft:3 }}>({note})</span>
            </div>
          ))}
        </div>
      </div>

      {/* Verify + Stats */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:10 }}>
        <button className="btn-gold" onClick={verify} disabled={slots.every(s=>!s)} style={{ fontSize:13 }}>✓ Comprobar</button>
        {stats && (
          <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
            {[["Correctas",stats.correct,"#2ecc71"],["Orden incorrecto",stats.wrongOrder,"#f1c40f"],["Errores",stats.wrong,"#e74c3c"]].map(([l,v,c])=>(
              <div key={l} style={{ padding:"6px 12px", background:`${c}15`, border:`1px solid ${c}44`, borderRadius:8, display:"flex", alignItems:"center", gap:6, animation:"chordPop 0.4s ease both" }}>
                <span style={{ fontSize:16, fontWeight:900, color:c }}>{v}</span>
                <span style={{ fontSize:10, color:C.silverDim }}>{l}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Legend */}
      <div style={{ marginTop:10, display:"flex", gap:12, flexWrap:"wrap" }}>
        {[["#2ecc71","Verde = nota y posición correctas"],["#f1c40f","Amarillo = nota correcta, posición incorrecta"],["#e74c3c","Rojo = nota incorrecta o fuera de la melodía"]].map(([c,l])=>(
          <div key={l} style={{ display:"flex", alignItems:"center", gap:5 }}>
            <div style={{ width:9, height:9, borderRadius:"50%", background:c }}/>
            <span style={{ fontSize:10, color:C.silverDim }}>{l}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Practice() {
  const [level, setLevel] = useState("beginner");
  const [instrument, setInstrument] = useState("guitar");
  const [root, setRoot] = useState("A");
  const [scaleKey, setScaleKey] = useState("minor");
  const [melody, setMelody] = useState([]);
  const [showNotes, setShowNotes] = useState(false);
  const [showViz, setShowViz] = useState(false);
  const [showVerifier, setShowVerifier] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [floatNotes, setFloatNotes] = useState([]);
  const [animKey, setAnimKey] = useState(0);
  const floatIdRef = useRef(0);
  const { playMelody, playNote, stop, guitarMode, setGuitarMode, loading } = useAudio();

  const generateNew = useCallback(() => {
    stop(); setPlaying(false); setActiveIdx(-1); setShowNotes(false); setShowViz(false); setShowVerifier(false);
    setMelody(generateMelody(root, scaleKey, level)); setAnimKey(k=>k+1);
  }, [root, scaleKey, level, stop]);

  useEffect(() => { generateNew(); }, [root, scaleKey, level]);

  const handlePlay = async () => {
    if (playing) { stop(); setPlaying(false); setActiveIdx(-1); return; }
    const lvl = LEVELS.find(l=>l.id===level);
    setPlaying(true);
    await playMelody(melody, instrument, lvl?.tempo||0.6,
      (i) => { setActiveIdx(i); const id=floatIdRef.current++; setFloatNotes(p=>[...p,{id,x:60+i*36}]); },
      () => { setPlaying(false); setActiveIdx(-1); }
    );
  };
  const handleNoteClick = useCallback((note, octave=4) => playNote(note, instrument, octave), [playNote, instrument]);
  const scaleNotes = getScaleNotes(root, scaleKey);
  const lvlInfo = LEVELS.find(l=>l.id===level);
  const isGuitar = instrument==="guitar";

  return (
    <div style={{ paddingBottom:48 }}>
      {floatNotes.map(fn=><FloatingNote key={fn.id} {...fn} onDone={()=>setFloatNotes(p=>p.filter(n=>n.id!==fn.id))}/>)}

      <div className="fade-up" style={{ marginBottom:28 }}>
        <span className="tag gold">Práctica de Oído</span>
        <h2 style={{ fontFamily:"'Montserrat',sans-serif", fontWeight:800, fontSize:28, color:"#fff", marginTop:8, animation:"glow 3s ease-in-out infinite" }}>Entrena Tu Oído Musical</h2>
        <p style={{ color:C.silverDim, fontSize:13, marginTop:4 }}>Escucha la melodía e intenta reproducirla. Usa las pistas cuando necesites ayuda.</p>
      </div>

      <div className="fade-up" style={{ marginBottom:22, animationDelay:"0.07s" }}>
        <p style={{ fontSize:10, color:C.silverDim, marginBottom:8, letterSpacing:"0.12em", textTransform:"uppercase" }}>Nivel</p>
        <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
          {LEVELS.map(l=>(
            <button key={l.id} onClick={()=>setLevel(l.id)} style={{ background:level===l.id?`linear-gradient(135deg,${C.purple},${C.purpleLight})`:C.card, border:`1px solid ${level===l.id?C.gold:C.cardBorder}`, borderRadius:10, padding:"10px 16px", cursor:"pointer", transition:"all 0.2s", textAlign:"left", boxShadow:level===l.id?`0 0 18px ${C.gold}33`:"none" }}>
              <div style={{ fontSize:20 }}>{l.icon}</div>
              <div style={{ fontSize:12, fontWeight:700, color:level===l.id?C.gold:C.silver, marginTop:2 }}>{l.label}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="fade-up" style={{ display:"flex", gap:14, flexWrap:"wrap", marginBottom:22, animationDelay:"0.13s" }}>
        <div>
          <p style={{ fontSize:10, color:C.silverDim, marginBottom:6, letterSpacing:"0.12em", textTransform:"uppercase" }}>Instrumento</p>
          <div style={{ display:"flex", gap:6 }}>
            {INSTRUMENTS.map(ins=>(
              <button key={ins.id} onClick={()=>setInstrument(ins.id)} className={instrument===ins.id?"btn-gold":"btn-outline"}>
                {ins.id==="guitar"?"🎸":"🎹"} {ins.label}
              </button>
            ))}
          </div>
        </div>
        {isGuitar && <GuitarModeToggle mode={guitarMode} onChange={setGuitarMode}/>}
        <div>
          <p style={{ fontSize:10, color:C.silverDim, marginBottom:6, letterSpacing:"0.12em", textTransform:"uppercase" }}>Tonalidad</p>
          <select value={root} onChange={e=>setRoot(e.target.value)} style={{ background:C.card, border:`1px solid ${C.cardBorder}`, color:C.silver, borderRadius:8, padding:"10px 14px", fontSize:13, cursor:"pointer", outline:"none" }}>
            {NOTES.map(n=><option key={n} value={n}>{NOTE_ES[n]} ({n})</option>)}
          </select>
        </div>
        <div>
          <p style={{ fontSize:10, color:C.silverDim, marginBottom:6, letterSpacing:"0.12em", textTransform:"uppercase" }}>Escala</p>
          <select value={scaleKey} onChange={e=>setScaleKey(e.target.value)} style={{ background:C.card, border:`1px solid ${C.cardBorder}`, color:C.silver, borderRadius:8, padding:"10px 14px", fontSize:13, cursor:"pointer", outline:"none" }}>
            {Object.entries(SCALES).map(([k,v])=><option key={k} value={k}>{v.name}</option>)}
          </select>
        </div>
      </div>

      {isGuitar && guitarMode==="overdrive" && (
        <div style={{ marginBottom:14, padding:"10px 16px", background:"#c0392b18", border:"1px solid #e74c3c66", borderRadius:8, display:"flex", alignItems:"center", gap:10, animation:"fadeUp 0.3s ease both" }}>
          <span style={{ fontSize:18 }}>🔥</span><span style={{ fontSize:12, fontWeight:700, color:"#e74c3c" }}>Modo Overdrive activo</span>
        </div>
      )}
      {loading && (
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12, color:C.silverDim, fontSize:12 }}>
          <span style={{ width:14, height:14, border:`2px solid ${C.gold}`, borderTopColor:"transparent", borderRadius:"50%", animation:"spin 0.7s linear infinite", display:"inline-block" }}/>
          Cargando síntesis de audio...
        </div>
      )}

      {melody.length > 0 && (
        <div className="card fade-up" key={animKey} style={{ marginBottom:22, animationDelay:"0.18s" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16, flexWrap:"wrap", gap:8 }}>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
              <span className="tag gold">🎵 {NOTE_ES[root]} {SCALES[scaleKey]?.name}</span>
              <span className="tag">{lvlInfo?.icon} {lvlInfo?.label}</span>
              <span className="tag">{isGuitar?"🎸":"🎹"} {isGuitar?"Guitarra":"Piano"}</span>
            </div>
            <WaveForm playing={playing}/>
          </div>
          <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:18, filter:showNotes?"none":"blur(10px)", transition:"filter 0.55s cubic-bezier(0.4,0,0.2,1)", userSelect:showNotes?"auto":"none" }}>
            {melody.map((note,i)=>(
              <div key={i} style={{ width:48, height:48, background:activeIdx===i?`linear-gradient(135deg,${C.gold},${C.goldLight})`:`linear-gradient(135deg,${C.purple},${C.purpleLight})`, border:`1px solid ${activeIdx===i?C.gold:C.gold+"44"}`, borderRadius:10, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", transition:"all 0.18s", boxShadow:activeIdx===i?`0 0 20px ${C.gold}88`:"none", transform:activeIdx===i?"scale(1.14)":"scale(1)" }}>
                <div style={{ fontSize:13, fontWeight:800, color:activeIdx===i?C.black:C.gold }}>{NOTE_ES[note]}</div>
                <div style={{ fontSize:9, color:activeIdx===i?C.black+"99":C.silverDim }}>{note}</div>
              </div>
            ))}
          </div>
          <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
            <button className="btn-gold" onClick={handlePlay} disabled={loading} style={{ animation:!playing?"pulse 2.5s ease-in-out infinite":"none" }}>{playing?"⏹ Detener":"▶ Escuchar"}</button>
            <button className="btn-outline" onClick={()=>setShowNotes(v=>!v)}>{showNotes?"🙈 Ocultar":"👁 Ver Notas"}</button>
            <button className="btn-outline" onClick={()=>setShowViz(v=>!v)}>{showViz?"✕ Cerrar":`${isGuitar?"🎸":"🎹"} Ver Instrumento`}</button>
            <button className="btn-purple" onClick={()=>setShowVerifier(v=>!v)} style={{ fontSize:12 }}>{showVerifier?"✕ Cerrar Verificador":"🎯 Practicar Oído"}</button>
            <button className="btn-outline" onClick={generateNew}>🔀 Nueva</button>
          </div>
          {showVerifier && <MelodyVerifier melody={melody} scaleNotes={scaleNotes} onPlayNote={(n,oct)=>playNote(n,instrument,oct)}/>}
        </div>
      )}

      <div className="card fade-up" style={{ marginBottom:22, animationDelay:"0.24s" }}>
        <p style={{ fontSize:10, color:C.silverDim, marginBottom:12, letterSpacing:"0.12em", textTransform:"uppercase" }}>Notas de la Escala — {NOTE_ES[root]} {SCALES[scaleKey]?.name}</p>
        <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
          {scaleNotes.map((n,i)=>(
            <button key={n} onClick={()=>handleNoteClick(n,4)} style={{ padding:"7px 13px", background:i===0?`${C.gold}22`:C.purpleDark, border:`1px solid ${i===0?C.gold:C.cardBorder}`, borderRadius:7, fontSize:13, fontWeight:700, color:i===0?C.gold:C.silver, cursor:"pointer", transition:"all 0.18s", animation:`fadeUp 0.3s ease ${i*0.05}s both` }}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=C.gold+"88";e.currentTarget.style.transform="scale(1.06)";}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor=i===0?C.gold:C.cardBorder;e.currentTarget.style.transform="scale(1)";}}>
              {NOTE_ES[n]}<span style={{ fontSize:9, color:C.silverDim, marginLeft:3 }}>({n})</span>
            </button>
          ))}
        </div>
        <p style={{ marginTop:8, fontSize:11, color:C.silverDim }}>↑ Haz clic para escuchar · <span style={{ color:C.gold }}>Dorado</span> = tónica</p>
      </div>

      {showViz && melody.length > 0 && (
        <div className="card fade-up" style={{ animationDelay:"0.05s" }}>
          <p style={{ fontSize:10, color:C.silverDim, letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:14 }}>{isGuitar?"🎸 Diapasón":"🎹 Teclado"} — Haz clic para escuchar</p>
          {isGuitar
            ? <GuitarNeck highlightNotes={[...new Set(melody)]} onNoteClick={(note,fret)=>{const oct=fret==null?3:fret<4?3:fret<8?4:5;handleNoteClick(note,oct);}}/>
            : <PianoKeys highlightNotes={[...new Set(melody)]} onNoteClick={(note,octave)=>handleNoteClick(note,octave||4)} octaves={[2,3,4,5]}/>
          }
        </div>
      )}
    </div>
  );
}
