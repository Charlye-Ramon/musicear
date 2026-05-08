import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import * as Tone from "tone";
import { C } from "../styles/tokens";
import { NOTES, NOTE_ES, SCALES, CIRCLE_OF_FIFTHS, getScaleNotes } from "../constants/music";
import { useAudio } from "../hooks/useAudio";
import PianoKeys from "../components/PianoKeys";
import GuitarNeck from "../components/GuitarNeck";
import HarmonicMap from "../components/HarmonicMap";

// ─── SHARED STATUS STYLE ─────────────────────────────────────────────────────
function statusStyle(s){
  if(s==="correct")     return{bg:"#27ae6022",border:"#27ae6088",text:"#2ecc71",icon:"✓"};
  if(s==="wrong_order") return{bg:"#f39c1222",border:"#f39c1288",text:"#f1c40f",icon:"~"};
  return                      {bg:"#c0392b22",border:"#c0392b88",text:"#e74c3c",icon:"✗"};
}

// ─── TOUCH+MOUSE DRAG CONTEXT ────────────────────────────────────────────────
// Simple approach: store dragged payload in a module-level ref so touch can
// communicate across components without prop drilling.
const dragState = { payload: null, from: null };

function useTouchDrag() {
  const touchTimer  = useRef(null);
  const isDragging  = useRef(false);

  const startDrag = useCallback((payload, from, onDragStart) => (e) => {
    // Desktop
    if (e.type === "dragstart") {
      dragState.payload = payload;
      dragState.from    = from;
      e.dataTransfer.effectAllowed = "move";
      onDragStart?.();
      return;
    }
    // Touch
    e.stopPropagation();
    clearTimeout(touchTimer.current);
    isDragging.current = false;
    touchTimer.current = setTimeout(() => {
      isDragging.current = true;
      dragState.payload  = payload;
      dragState.from     = from;
      onDragStart?.();
      if (navigator.vibrate) navigator.vibrate(25);
    }, 120);
  }, []);

  const endDrag = useCallback((tapCallback) => (e) => {
    clearTimeout(touchTimer.current);
    if (e.type === "dragend") { dragState.payload = null; dragState.from = null; return; }

    // Touch end
    if (!isDragging.current) {
      tapCallback?.();
      return;
    }
    isDragging.current = false;
    const t = e.changedTouches[0];
    const el = document.elementFromPoint(t.clientX, t.clientY);
    let node = el;
    while (node && node !== document.body) {
      if (node.__dropCb) { node.__dropCb(dragState.payload, dragState.from); break; }
      node = node.parentElement;
    }
    dragState.payload = null;
    dragState.from    = null;
  }, []);

  const touchMove = useCallback((e) => {
    if (isDragging.current) e.preventDefault();
  }, []);

  return { startDrag, endDrag, touchMove };
}

function useDropZone(onDrop) {
  return useCallback((el) => {
    if (el) el.__dropCb = onDrop;
  }, [onDrop]);
}

// ─── DRAG NOTE CHIP ──────────────────────────────────────────────────────────
function NoteChip({ note, inScale, onTap, onDragStarted, style: extraStyle }) {
  const { startDrag, endDrag, touchMove } = useTouchDrag();
  return (
    <div
      draggable
      onDragStart={startDrag(note, "bank", onDragStarted)}
      onDragEnd={endDrag(null)}
      onTouchStart={startDrag(note, "bank", onDragStarted)}
      onTouchEnd={endDrag(onTap)}
      onTouchMove={touchMove}
      onClick={onTap}
      style={{
        padding:"7px 12px",
        background: inScale ? `${C.gold}18` : C.purpleDark,
        border:`1px solid ${inScale ? C.gold+"55" : C.cardBorder}`,
        borderRadius:7, fontSize:12, fontWeight:700,
        color: inScale ? C.gold : C.silverDim,
        touchAction:"none", userSelect:"none", cursor:"grab",
        transition:"all 0.15s",
        WebkitTapHighlightColor:"transparent",
        ...extraStyle,
      }}
      onMouseEnter={e=>{e.currentTarget.style.transform="scale(1.08)";e.currentTarget.style.borderColor=C.gold+"88";}}
      onMouseLeave={e=>{e.currentTarget.style.transform="scale(1)";e.currentTarget.style.borderColor=inScale?C.gold+"55":C.cardBorder;}}
    >
      {NOTE_ES[note]}<span style={{fontSize:8,color:C.silverDim,marginLeft:3}}>({note})</span>
    </div>
  );
}

// ─── SLOT ─────────────────────────────────────────────────────────────────────
function Slot({ index, note, result: st, onDrop, onRemove, showIndex, indexLabel }) {
  const dropRef = useDropZone(onDrop);
  const col = st ? statusStyle(st) : null;
  return (
    <div
      ref={dropRef}
      onDragOver={e=>e.preventDefault()}
      onDrop={e=>{e.preventDefault();onDrop(dragState.payload,dragState.from);dragState.payload=null;dragState.from=null;}}
      onClick={()=>note&&onRemove?.()}
      style={{
        width:52, height:52, borderRadius:10, flexShrink:0,
        border:`2px dashed ${col?col.border:C.cardBorder}`,
        background:col?col.bg:note?`${C.purple}88`:`${C.purpleDark}44`,
        display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
        cursor:note?"pointer":"default", transition:"all 0.25s",
        boxShadow:col?`0 0 12px ${col.border}66`:"none",
        position:"relative",
        animation:st?`chordPop 0.35s ease ${(index||0)*0.06}s both`:"none",
        WebkitTapHighlightColor:"transparent",
      }}
    >
      {showIndex && <div style={{position:"absolute",top:3,left:6,fontSize:8,color:C.silverDim,fontWeight:700}}>{indexLabel||index+1}</div>}
      {note?(
        <>
          <div style={{fontSize:13,fontWeight:800,color:col?col.text:C.gold}}>{NOTE_ES[note]}</div>
          <div style={{fontSize:8,color:col?col.text+"88":C.silverDim}}>{note}</div>
          {st&&<div style={{position:"absolute",top:-8,right:-8,width:18,height:18,borderRadius:"50%",background:col.border,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:900,color:"#fff"}}>{col.icon}</div>}
        </>
      ):<div style={{fontSize:18,color:C.cardBorder}}>+</div>}
    </div>
  );
}

// ─── STATS ROW ───────────────────────────────────────────────────────────────
function StatsRow({ result }) {
  if (!result) return null;
  const correct    = result.filter(r=>r==="correct").length;
  const wrongOrder = result.filter(r=>r==="wrong_order").length;
  const wrong      = result.filter(r=>r==="wrong"||r==="empty").length;
  return (
    <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
      {[["✓ Correctas",correct,"#2ecc71"],["~ Orden",wrongOrder,"#f1c40f"],["✗ Errores",wrong,"#e74c3c"]].map(([l,v,c])=>(
        <div key={l} style={{padding:"6px 12px",background:`${c}15`,border:`1px solid ${c}44`,borderRadius:8,display:"flex",alignItems:"center",gap:6,animation:"chordPop 0.4s ease both"}}>
          <span style={{fontSize:16,fontWeight:900,color:c}}>{v}</span>
          <span style={{fontSize:10,color:C.silverDim}}>{l}</span>
        </div>
      ))}
    </div>
  );
}

// ─── SCALE ORDER EXERCISE ────────────────────────────────────────────────────
function ScaleOrderExercise({ playNote }) {
  const [exRoot, setExRoot]   = useState("C");
  const [exScale, setExScale] = useState("major");
  const [slots, setSlots]     = useState([]);
  const [result, setResult]   = useState(null);
  const [checked, setChecked] = useState(false);
  const [shuffled, setShuffled] = useState([]);

  const correct = useMemo(()=>getScaleNotes(exRoot,exScale),[exRoot,exScale]);

  const reset = useCallback(()=>{
    setSlots(Array(correct.length).fill(null));
    setResult(null); setChecked(false);
    setShuffled([...correct].sort(()=>Math.random()-0.5));
  },[correct]);

  useEffect(()=>{ reset(); },[correct]);

  const dropOnSlot = useCallback((idx)=>(payload, from)=>{
    if(!payload)return;
    setSlots(s=>{
      const ns=[...s];
      if(typeof from==="number")ns[from]=null;
      ns[idx]=payload;
      return ns;
    });
    setChecked(false); setResult(null);
  },[]);

  const dropOnBank = useCallback((payload, from)=>{
    if(typeof from==="number"){
      setSlots(s=>{const ns=[...s];ns[from]=null;return ns;});
    }
    setChecked(false); setResult(null);
  },[]);

  const bankDropRef = useDropZone(dropOnBank);

  const verify=()=>{
    setResult(slots.map((n,i)=>!n?"empty":n===correct[i]?"correct":correct.includes(n)?"wrong_order":"wrong"));
    setChecked(true);
  };

  return (
    <div>
      <div style={{marginBottom:14,padding:"12px 16px",background:`${C.gold}15`,border:`1px solid ${C.gold}44`,borderRadius:10}}>
        <p style={{fontSize:11,fontWeight:800,color:C.gold,letterSpacing:"0.08em"}}>📋 EJERCICIO: Ordena la escala completa</p>
        <p style={{fontSize:14,fontWeight:700,color:"#fff",marginTop:4}}>
          <span style={{color:C.gold}}>{NOTE_ES[exRoot]} {SCALES[exScale]?.name}</span>
        </p>
      </div>

      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:14}}>
        <select value={exRoot} onChange={e=>setExRoot(e.target.value)} style={{background:C.purpleDark,border:`1px solid ${C.cardBorder}`,color:C.silver,borderRadius:8,padding:"8px 10px",fontSize:13,cursor:"pointer",outline:"none"}}>
          {NOTES.map(n=><option key={n} value={n}>{NOTE_ES[n]}</option>)}
        </select>
        <select value={exScale} onChange={e=>setExScale(e.target.value)} style={{background:C.purpleDark,border:`1px solid ${C.cardBorder}`,color:C.silver,borderRadius:8,padding:"8px 10px",fontSize:13,cursor:"pointer",outline:"none"}}>
          {Object.entries(SCALES).slice(0,8).map(([k,v])=><option key={k} value={k}>{v.name}</option>)}
        </select>
        <button className="btn-outline" onClick={()=>{setExRoot(NOTES[Math.floor(Math.random()*12)]);setExScale(Object.keys(SCALES)[Math.floor(Math.random()*6)]);}} style={{fontSize:12,padding:"8px 12px"}}>🎲</button>
        <button className="btn-outline" onClick={reset} style={{fontSize:12,padding:"8px 12px"}}>↺</button>
      </div>

      {/* Slots */}
      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:12}}>
        {slots.map((note,i)=>(
          <Slot key={i} index={i} note={note} result={result?.[i]}
            onDrop={dropOnSlot(i)}
            onRemove={()=>{setSlots(s=>{const ns=[...s];ns[i]=null;return ns;});setChecked(false);setResult(null);}}
            showIndex indexLabel={["I","II","III","IV","V","VI","VII"][i]}
          />
        ))}
      </div>

      {/* Bank */}
      <div ref={bankDropRef} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();dropOnBank(dragState.payload,dragState.from);dragState.payload=null;dragState.from=null;}}
        style={{padding:"12px",background:`${C.bg}88`,borderRadius:10,border:`1px solid ${C.cardBorder}`,marginBottom:14}}>
        <p style={{fontSize:9,color:C.silverDim,marginBottom:8,letterSpacing:"0.1em",textTransform:"uppercase"}}>Banco — arrastra al orden correcto</p>
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          {shuffled.map(note=>(
            <NoteChip key={note} note={note} inScale onTap={()=>playNote?.(note,"piano",4)} />
          ))}
        </div>
      </div>

      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:10,marginBottom:checked?12:0}}>
        <button className="btn-gold" onClick={verify} disabled={slots.every(s=>!s)}>✓ Comprobar</button>
        <StatsRow result={result}/>
      </div>

      {checked && (
        <div style={{padding:"12px 16px",background:C.purpleDark,border:`1px solid ${C.cardBorder}`,borderRadius:10,marginTop:12,animation:"fadeUp 0.35s ease both"}}>
          <p style={{fontSize:10,color:C.silverDim,marginBottom:8,letterSpacing:"0.08em",textTransform:"uppercase"}}>Respuesta correcta</p>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            {correct.map((n,i)=>(
              <div key={n} style={{padding:"5px 10px",background:i===0?`${C.gold}22`:C.purpleDark,border:`1px solid ${i===0?C.gold:C.cardBorder}`,borderRadius:6,fontSize:12,fontWeight:700,color:i===0?C.gold:C.silver,animation:`fadeUp 0.3s ease ${i*0.05}s both`}}>
                {NOTE_ES[n]}<span style={{fontSize:8,color:C.silverDim,marginLeft:3}}>{["I","II","III","IV","V","VI","VII"][i]||""}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── COMPLETE THE SCALE ───────────────────────────────────────────────────────
const DIFFICULTY=[
  {id:"easy",  label:"Fácil",   icon:"🌱",missing:2},
  {id:"medium",label:"Medio",   icon:"🔥",missing:4},
  {id:"hard",  label:"Difícil", icon:"⚡",missing:6},
];

function CompleteScaleExercise({ playNote }) {
  const [diff,   setDiff]   = useState("easy");
  const [exRoot, setExRoot] = useState("G");
  const [exScale,setExScale]= useState("major");
  const [puzzle, setPuzzle] = useState(null);
  const [answers,setAnswers]= useState({});
  const [result, setResult] = useState(null);
  const [checked,setChecked]= useState(false);
  const [bank,   setBank]   = useState([]);

  const correct = useMemo(()=>getScaleNotes(exRoot,exScale),[exRoot,exScale]);

  const generate = useCallback(()=>{
    const d=DIFFICULTY.find(x=>x.id===diff)||DIFFICULTY[0];
    const idx=[...Array(correct.length).keys()].sort(()=>Math.random()-0.5).slice(0,d.missing).sort((a,b)=>a-b);
    setPuzzle({given:correct.map((n,i)=>idx.includes(i)?null:n),hiddenIdx:idx});
    setAnswers({}); setResult(null); setChecked(false);
    const missing=idx.map(i=>correct[i]);
    const dist=NOTES.filter(n=>!correct.includes(n)).slice(0,3);
    setBank([...new Set([...missing,...dist])].sort(()=>Math.random()-0.5));
  },[correct,diff]);

  useEffect(()=>{generate();},[correct,diff]);

  const dropOnSlot=useCallback((idx)=>(payload)=>{
    if(!payload)return;
    setAnswers(a=>({...a,[idx]:payload}));
    setChecked(false); setResult(null);
  },[]);

  const verify=()=>{
    if(!puzzle)return;
    const res={};
    puzzle.hiddenIdx.forEach(i=>{const ans=answers[i];res[i]=!ans?"empty":ans===correct[i]?"correct":correct.includes(ans)?"wrong_order":"wrong";});
    setResult(res); setChecked(true);
  };

  if(!puzzle)return null;
  const resultArr=puzzle.hiddenIdx.map(i=>result?.[i]).filter(Boolean);
  const stats=checked?{correct:Object.values(result||{}).filter(r=>r==="correct").length,wrong:Object.values(result||{}).filter(r=>r!=="correct").length}:null;

  return (
    <div>
      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:14}}>
        {DIFFICULTY.map(d=>(
          <button key={d.id} onClick={()=>setDiff(d.id)} style={{background:diff===d.id?`linear-gradient(135deg,${C.purple},${C.purpleLight})`:C.card,border:`1px solid ${diff===d.id?C.gold:C.cardBorder}`,borderRadius:8,padding:"8px 12px",cursor:"pointer",color:diff===d.id?C.gold:C.silverDim,fontFamily:"'Montserrat',sans-serif",fontWeight:700,fontSize:12,transition:"all 0.2s",boxShadow:diff===d.id?`0 0 14px ${C.gold}33`:"none"}}>
            {d.icon} {d.label}
          </button>
        ))}
      </div>

      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:14}}>
        <select value={exRoot} onChange={e=>setExRoot(e.target.value)} style={{background:C.purpleDark,border:`1px solid ${C.cardBorder}`,color:C.silver,borderRadius:8,padding:"8px 10px",fontSize:13,cursor:"pointer",outline:"none"}}>
          {NOTES.map(n=><option key={n} value={n}>{NOTE_ES[n]}</option>)}
        </select>
        <select value={exScale} onChange={e=>setExScale(e.target.value)} style={{background:C.purpleDark,border:`1px solid ${C.cardBorder}`,color:C.silver,borderRadius:8,padding:"8px 10px",fontSize:13,cursor:"pointer",outline:"none"}}>
          {Object.entries(SCALES).slice(0,8).map(([k,v])=><option key={k} value={k}>{v.name}</option>)}
        </select>
        <button className="btn-outline" onClick={generate} style={{fontSize:12,padding:"8px 12px"}}>🎲 Nuevo</button>
        <button className="btn-outline" onClick={()=>{setAnswers({});setResult(null);setChecked(false);}} style={{fontSize:12,padding:"8px 12px"}}>↺</button>
      </div>

      <div style={{marginBottom:12,padding:"10px 14px",background:`${C.gold}15`,border:`1px solid ${C.gold}44`,borderRadius:8}}>
        <p style={{fontSize:11,fontWeight:800,color:C.gold}}>🧩 Completa: {NOTE_ES[exRoot]} {SCALES[exScale]?.name}</p>
        <p style={{fontSize:11,color:C.silverDim,marginTop:2}}>Arrastra las notas a los espacios <span style={{color:C.gold}}>?</span></p>
      </div>

      {/* Scale with gaps */}
      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:12}}>
        {puzzle.given.map((note,i)=>{
          const isHidden=note===null;
          const ans=answers[i];
          const st=result?.[i];
          const col=st?statusStyle(st):null;
          if(!isHidden) return (
            <div key={i} onClick={()=>playNote?.(note,"piano",4)} style={{width:52,height:52,borderRadius:10,border:`1px solid ${C.cardBorder}`,background:C.purpleDark,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",cursor:"pointer",position:"relative"}}>
              <div style={{position:"absolute",top:3,left:4,fontSize:8,color:C.silverDim,fontWeight:700}}>{["I","II","III","IV","V","VI","VII"][i]}</div>
              <div style={{fontSize:13,fontWeight:700,color:C.silver}}>{NOTE_ES[note]}</div>
              <div style={{fontSize:8,color:C.silverDim}}>{note}</div>
            </div>
          );
          return (
            <Slot key={i} index={i} note={ans||null} result={st||null}
              onDrop={dropOnSlot(i)}
              onRemove={()=>{setAnswers(a=>{const na={...a};delete na[i];return na;});setChecked(false);setResult(null);}}
              showIndex indexLabel={["I","II","III","IV","V","VI","VII"][i]}
            />
          );
        })}
      </div>

      {/* Bank */}
      <div style={{padding:"12px",background:`${C.bg}88`,borderRadius:10,border:`1px solid ${C.cardBorder}`,marginBottom:14}}>
        <p style={{fontSize:9,color:C.silverDim,marginBottom:8,letterSpacing:"0.1em",textTransform:"uppercase"}}>Banco — arrastra a los ?</p>
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          {bank.map(note=>(
            <NoteChip key={note} note={note} inScale={correct.includes(note)} onTap={()=>playNote?.(note,"piano",4)} />
          ))}
        </div>
      </div>

      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:10,marginBottom:checked?12:0}}>
        <button className="btn-gold" onClick={verify} disabled={Object.keys(answers).length===0}>✓ Comprobar</button>
        {stats&&(
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            {[["Correctas",stats.correct,"#2ecc71"],["Errores",stats.wrong,"#e74c3c"]].map(([l,v,c])=>(
              <div key={l} style={{padding:"6px 12px",background:`${c}15`,border:`1px solid ${c}44`,borderRadius:8,display:"flex",alignItems:"center",gap:6,animation:"chordPop 0.4s ease both"}}>
                <span style={{fontSize:16,fontWeight:900,color:c}}>{v}</span>
                <span style={{fontSize:10,color:C.silverDim}}>{l}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {checked&&(
        <div style={{padding:"12px 16px",background:C.purpleDark,border:`1px solid ${C.cardBorder}`,borderRadius:10,marginTop:4,animation:"fadeUp 0.35s ease both"}}>
          <p style={{fontSize:10,color:C.silverDim,marginBottom:8,letterSpacing:"0.08em",textTransform:"uppercase"}}>Respuesta completa</p>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            {correct.map((n,i)=>(
              <div key={n} style={{padding:"5px 10px",background:puzzle.hiddenIdx.includes(i)?`${C.gold}22`:C.purpleDark,border:`1px solid ${puzzle.hiddenIdx.includes(i)?C.gold:C.cardBorder}`,borderRadius:6,fontSize:12,fontWeight:700,color:puzzle.hiddenIdx.includes(i)?C.gold:C.silver,animation:`fadeUp 0.3s ease ${i*0.05}s both`}}>
                {NOTE_ES[n]}<span style={{fontSize:8,color:C.silverDim,marginLeft:3}}>{["I","II","III","IV","V","VI","VII"][i]||""}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── INTERVAL VISUAL ─────────────────────────────────────────────────────────
function IntervalVisual() {
  const [active,setActive]=useState(4);
  const ivs=[
    {name:"Unísono",st:0,q:"Perfecto",s:"😐",eg:"Do→Do"},{name:"2da Menor",st:1,q:"Muy disonante",s:"😬",eg:"Do→Do#"},
    {name:"2da Mayor",st:2,q:"Suave/stepwise",s:"🙂",eg:"Do→Re"},{name:"3ra Menor",st:3,q:"Oscuro, triste",s:"😢",eg:"Do→Eb"},
    {name:"3ra Mayor",st:4,q:"Brillante, alegre",s:"😊",eg:"Do→Mi"},{name:"4ta Justa",st:5,q:"Estable",s:"⚖️",eg:"Do→Fa"},
    {name:"Tritono",st:6,q:"Máxima tensión",s:"😈",eg:"Do→F#"},{name:"5ta Justa",st:7,q:"Muy estable",s:"💪",eg:"Do→Sol"},
    {name:"6ta Menor",st:8,q:"Melancólico",s:"🌙",eg:"Do→Ab"},{name:"6ta Mayor",st:9,q:"Alegre, luminoso",s:"☀️",eg:"Do→La"},
    {name:"7ma Menor",st:10,q:"Dominante/blues",s:"🎷",eg:"Do→Bb"},{name:"7ma Mayor",st:11,q:"Tenso, jazzy",s:"😤",eg:"Do→Si"},
    {name:"Octava",st:12,q:"Mismo tono +8va",s:"✨",eg:"Do→Do8"},
  ];
  return (
    <div>
      <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:14}}>
        {ivs.map((iv,i)=>(
          <button key={i} onClick={()=>setActive(i)} style={{background:active===i?`${C.gold}22`:C.purpleDark,border:`1px solid ${active===i?C.gold:C.cardBorder}`,borderRadius:6,padding:"5px 9px",cursor:"pointer",color:active===i?C.gold:C.silver,fontSize:11,fontWeight:600,transition:"all 0.2s"}}>
            {iv.st}st
          </button>
        ))}
      </div>
      <div style={{padding:"18px",background:C.purpleDark,borderRadius:10,border:`1px solid ${C.cardBorder}`,animation:"fadeUp 0.3s ease both"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:12,marginBottom:12}}>
          <div>
            <div style={{fontSize:32}}>{ivs[active].s}</div>
            <div style={{fontFamily:"'Montserrat',sans-serif",fontWeight:800,fontSize:16,color:"#fff",marginTop:4}}>{ivs[active].name}</div>
            <div style={{fontSize:12,color:C.silverDim}}>{ivs[active].st} semitonos · Ejemplo: {ivs[active].eg}</div>
          </div>
          <div style={{padding:"8px 16px",borderRadius:8,background:`${C.gold}18`,border:`1px solid ${C.gold}44`,color:C.gold,fontWeight:700,fontSize:13}}>{ivs[active].q}</div>
        </div>
        <div style={{display:"flex",gap:2}}>
          {Array.from({length:13},(_,i)=>(
            <div key={i} style={{flex:1,height:10,borderRadius:2,background:i<=ivs[active].st?C.gold:C.cardBorder,transition:"background 0.3s"}}/>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── BPM METRONOME WITH SOUND ────────────────────────────────────────────────
function BPMVisual() {
  const [bpm,setBpm]=useState(90);
  const [on,setOn]=useState(false);
  const [beat,setBeat]=useState(false);
  const [accent,setAccent]=useState(true);
  const [beatCount,setBeatCount]=useState(0);
  const [beatsPerBar,setBeatsPerBar]=useState(4);
  const metSynth=useRef(null);

  useEffect(()=>{
    metSynth.current={
      hi: new Tone.Synth({oscillator:{type:"triangle"},envelope:{attack:0.001,decay:0.08,sustain:0,release:0.05},volume:-8}).toDestination(),
      lo: new Tone.Synth({oscillator:{type:"triangle"},envelope:{attack:0.001,decay:0.05,sustain:0,release:0.03},volume:-12}).toDestination(),
    };
    return ()=>{ try{metSynth.current?.hi?.dispose();metSynth.current?.lo?.dispose();}catch(e){} };
  },[]);

  useEffect(()=>{
    if(!on)return;
    let count=0;
    const id=setInterval(async()=>{
      await Tone.start();
      const isAccentBeat = accent && (count % beatsPerBar === 0);
      setBeat(true); setBeatCount(c=>c+1);
      if(metSynth.current){
        const synth=isAccentBeat?metSynth.current.hi:metSynth.current.lo;
        const note=isAccentBeat?"C5":"G4";
        try{synth.triggerAttackRelease(note,"32n",Tone.now());}catch(e){}
      }
      setTimeout(()=>setBeat(false),60);
      count++;
    },60000/bpm);
    return()=>clearInterval(id);
  },[on,bpm,accent,beatsPerBar]);

  const genres=[{n:"Balada",b:65},{n:"Hip-Hop",b:90},{n:"Pop",b:120},{n:"Rock",b:140},{n:"Vals",b:100},{n:"D&B",b:170}];

  return (
    <div>
      <div style={{display:"flex",gap:16,alignItems:"flex-start",flexWrap:"wrap",marginBottom:16}}>
        {/* Circle */}
        <div style={{textAlign:"center",flex:"0 0 auto"}}>
          <div onClick={()=>setOn(v=>!v)} style={{width:96,height:96,borderRadius:"50%",margin:"0 auto 10px",background:beat?`radial-gradient(circle,${C.gold},${C.goldLight})`:`radial-gradient(circle,${C.purple},${C.purpleDark})`,border:`3px solid ${beat?C.gold:C.cardBorder}`,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",transition:"background 0.05s, border-color 0.05s",boxShadow:beat?`0 0 28px ${C.gold}88`:"none"}}>
            <div><div style={{fontSize:24,fontWeight:800,color:beat?C.black:"#fff",lineHeight:1}}>{bpm}</div><div style={{fontSize:10,color:beat?C.black:C.silverDim}}>BPM</div></div>
          </div>
          <button className={on?"btn-gold":"btn-outline"} onClick={()=>setOn(v=>!v)} style={{fontSize:12,padding:"8px 16px"}}>{on?"⏸ Stop":"▶ Start"}</button>
        </div>

        {/* Controls */}
        <div style={{flex:1,minWidth:180}}>
          <input type="range" min={40} max={220} value={bpm} onChange={e=>setBpm(+e.target.value)} style={{width:"100%",accentColor:C.gold,marginBottom:10}}/>
          <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:10}}>
            {genres.map(g=>(
              <button key={g.n} onClick={()=>setBpm(g.b)} style={{background:C.purpleDark,border:`1px solid ${C.cardBorder}`,borderRadius:6,padding:"4px 8px",cursor:"pointer",color:C.silver,fontSize:10,fontWeight:600,transition:"all 0.2s"}}
                onMouseEnter={e=>e.currentTarget.style.borderColor=C.gold+"66"} onMouseLeave={e=>e.currentTarget.style.borderColor=C.cardBorder}>
                {g.n} {g.b}
              </button>
            ))}
          </div>
          <div style={{display:"flex",gap:10,flexWrap:"wrap",alignItems:"center"}}>
            <label style={{display:"flex",alignItems:"center",gap:6,cursor:"pointer",fontSize:12,color:C.silver}}>
              <input type="checkbox" checked={accent} onChange={e=>setAccent(e.target.checked)} style={{accentColor:C.gold}}/>
              Acento en tiempo 1
            </label>
            <div style={{display:"flex",alignItems:"center",gap:6}}>
              <span style={{fontSize:12,color:C.silverDim}}>Compás:</span>
              {[2,3,4,6].map(n=>(
                <button key={n} onClick={()=>setBeatsPerBar(n)} style={{background:beatsPerBar===n?`${C.gold}22`:C.purpleDark,border:`1px solid ${beatsPerBar===n?C.gold:C.cardBorder}`,borderRadius:5,padding:"3px 8px",cursor:"pointer",color:beatsPerBar===n?C.gold:C.silverDim,fontSize:12,fontWeight:700,transition:"all 0.2s"}}>
                  {n}/4
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Beat visualizer */}
      {on && (
        <div style={{display:"flex",gap:4,marginTop:8}}>
          {Array.from({length:beatsPerBar},(_,i)=>{
            const isCurrent = on && (beatCount % beatsPerBar) === i;
            return <div key={i} style={{flex:1,height:16,borderRadius:3,background:isCurrent?(i===0&&accent?C.gold:`${C.gold}88`):C.cardBorder,transition:"background 0.05s",boxShadow:isCurrent?`0 0 8px ${C.gold}88`:""}}/>
          })}
        </div>
      )}
    </div>
  );
}

// ─── CHORD BUILDER ────────────────────────────────────────────────────────────
function ChordBuilder({ playNote }) {
  const [root,setRoot]=useState("C");
  const [type,setType]=useState("major");
  const types={major:{n:"Mayor",f:[0,4,7],s:"",desc:"1 - 3 - 5"},minor:{n:"Menor",f:[0,3,7],s:"m",desc:"1 - b3 - 5"},dim:{n:"Disminuido",f:[0,3,6],s:"°",desc:"1 - b3 - b5"},aug:{n:"Aumentado",f:[0,4,8],s:"+",desc:"1 - 3 - #5"},maj7:{n:"Mayor 7ma",f:[0,4,7,11],s:"Maj7",desc:"1 - 3 - 5 - 7"},min7:{n:"Menor 7ma",f:[0,3,7,10],s:"m7",desc:"1 - b3 - 5 - b7"},dom7:{n:"Dom 7",f:[0,4,7,10],s:"7",desc:"1 - 3 - 5 - b7"},sus2:{n:"Sus2",f:[0,2,7],s:"sus2",desc:"1 - 2 - 5"},sus4:{n:"Sus4",f:[0,5,7],s:"sus4",desc:"1 - 4 - 5"}};
  const rootIdx=NOTES.indexOf(root);
  const notes=types[type].f.map(i=>NOTES[(rootIdx+i)%12]);
  return (
    <div>
      <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:14}}>
        <select value={root} onChange={e=>setRoot(e.target.value)} style={{background:C.purpleDark,border:`1px solid ${C.cardBorder}`,color:C.silver,borderRadius:8,padding:"8px 10px",fontSize:13,cursor:"pointer",outline:"none"}}>
          {NOTES.map(n=><option key={n} value={n}>{NOTE_ES[n]}</option>)}
        </select>
        <select value={type} onChange={e=>setType(e.target.value)} style={{background:C.purpleDark,border:`1px solid ${C.cardBorder}`,color:C.silver,borderRadius:8,padding:"8px 10px",fontSize:13,cursor:"pointer",outline:"none"}}>
          {Object.entries(types).map(([k,v])=><option key={k} value={k}>{v.n}</option>)}
        </select>
      </div>
      <div style={{padding:"14px",background:C.purpleDark,borderRadius:10,border:`1px solid ${C.cardBorder}`,marginBottom:14,display:"flex",alignItems:"center",gap:14,flexWrap:"wrap"}}>
        <div>
          <div style={{fontFamily:"'Montserrat',sans-serif",fontWeight:800,fontSize:26,color:C.gold}}>{root}{types[type].s}</div>
          <div style={{fontSize:11,color:C.silverDim,marginTop:2}}>{types[type].desc}</div>
        </div>
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          {notes.map((n,i)=>(
            <div key={i} style={{width:42,height:42,borderRadius:8,background:`linear-gradient(135deg,${C.purple},${C.purpleLight})`,border:`1px solid ${C.gold}66`,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",animation:`chordPop 0.3s ease ${i*0.08}s both`}}>
              <div style={{fontSize:12,fontWeight:800,color:C.gold}}>{NOTE_ES[n]}</div>
              <div style={{fontSize:8,color:C.silverDim}}>{["R","3°","5°","7°"][i]||""}</div>
            </div>
          ))}
        </div>
        <button className="btn-gold" onClick={()=>notes.forEach((n,i)=>setTimeout(()=>playNote(n,"piano",4),i*160))} style={{marginLeft:"auto"}}>▶ Escuchar</button>
      </div>
      <PianoKeys highlightNotes={notes} onNoteClick={n=>playNote(n,"piano",4)} octaves={[3,4]}/>
    </div>
  );
}

// ─── SCALE EXPLORER ──────────────────────────────────────────────────────────
function ScaleExplorer({ playNote, defaultScaleKey }) {
  const [root,setRoot]=useState("C");
  const [scaleKey,setScaleKey]=useState(defaultScaleKey||"major");
  const [instrument,setInstrument]=useState("piano");
  const notes=getScaleNotes(root,scaleKey);
  const scale=SCALES[scaleKey];
  return (
    <div>
      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:12}}>
        <select value={root} onChange={e=>setRoot(e.target.value)} style={{background:C.purpleDark,border:`1px solid ${C.cardBorder}`,color:C.silver,borderRadius:8,padding:"8px 10px",fontSize:13,cursor:"pointer",outline:"none"}}>
          {NOTES.map(n=><option key={n} value={n}>{NOTE_ES[n]}</option>)}
        </select>
        <select value={scaleKey} onChange={e=>setScaleKey(e.target.value)} style={{background:C.purpleDark,border:`1px solid ${C.cardBorder}`,color:C.silver,borderRadius:8,padding:"8px 10px",fontSize:13,cursor:"pointer",outline:"none"}}>
          {Object.entries(SCALES).map(([k,v])=><option key={k} value={k}>{v.name}</option>)}
        </select>
        <div style={{display:"flex",gap:5}}>
          {["piano","guitar"].map(ins=>(
            <button key={ins} onClick={()=>setInstrument(ins)} className={instrument===ins?"btn-gold":"btn-outline"} style={{padding:"8px 12px",fontSize:12}}>{ins==="piano"?"🎹":"🎸"}</button>
          ))}
        </div>
        <button className="btn-purple" onClick={()=>notes.forEach((n,i)=>setTimeout(()=>playNote(n,instrument,4),i*300))} style={{fontSize:12}}>▶ Escuchar</button>
      </div>
      <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:12}}>
        {notes.map((n,i)=>(
          <button key={n} onClick={()=>playNote(n,instrument,4)} style={{padding:"7px 12px",background:i===0?`${C.gold}22`:C.purpleDark,border:`1px solid ${i===0?C.gold:C.cardBorder}`,borderRadius:7,fontSize:13,fontWeight:700,color:i===0?C.gold:C.silver,cursor:"pointer",transition:"all 0.18s",animation:`fadeUp 0.3s ease ${i*0.05}s both`,minHeight:40}}>
            {NOTE_ES[n]}<span style={{fontSize:8,color:C.silverDim,marginLeft:3}}>{["I","II","III","IV","V","VI","VII"][i]}</span>
          </button>
        ))}
      </div>
      <div style={{display:"flex",gap:2,marginBottom:12}}>
        {Array.from({length:12},(_,i)=>{const ri=NOTES.indexOf(root),rel=(i-ri+12)%12,inS=scale.intervals.includes(rel),isR=rel===0;return(<div key={i} style={{flex:1,height:10,borderRadius:2,background:isR?C.gold:inS?`${C.gold}55`:C.cardBorder,transition:"background 0.4s"}}/>);})}
      </div>
      <div style={{overflowX:"auto"}}>
        {instrument==="piano"?<PianoKeys highlightNotes={notes} onNoteClick={n=>playNote(n,instrument,4)} octaves={[3,4]}/>:<GuitarNeck highlightNotes={notes} onNoteClick={n=>playNote(n,instrument,4)}/>}
      </div>
    </div>
  );
}

// ─── CIRCLE OF FIFTHS ─────────────────────────────────────────────────────────
function CircleOfFifths({ activeKey, onSelect }) {
  const minors=["A","E","B","F#","C#","G#","D#","A#","F","C","G","D"];
  return (
    <div style={{display:"flex",justifyContent:"center",overflowX:"auto"}}>
      <svg width={300} height={300} viewBox="0 0 300 300" style={{minWidth:260}}>
        <circle cx={150} cy={150} r={128} fill={`${C.purpleDark}cc`} stroke={C.cardBorder} strokeWidth={1}/>
        <circle cx={150} cy={150} r={78} fill={`${C.bg}aa`} stroke={C.cardBorder} strokeWidth={1}/>
        <text x={150} y={146} textAnchor="middle" fill={C.gold} fontSize={11} fontFamily="Montserrat" fontWeight="700">Círculo</text>
        <text x={150} y={161} textAnchor="middle" fill={C.gold} fontSize={11} fontFamily="Montserrat" fontWeight="700">de Quintas</text>
        {CIRCLE_OF_FIFTHS.map((note,i)=>{
          const a=(i*30-90)*Math.PI/180;
          const ox=150+112*Math.cos(a),oy=150+112*Math.sin(a);
          const ix=150+66*Math.cos(a),iy=150+66*Math.sin(a);
          const active=note===activeKey;
          return(
            <g key={note} onClick={()=>onSelect(note)} style={{cursor:"pointer"}}>
              <circle cx={ox} cy={oy} r={active?20:16} fill={active?C.gold:`${C.purple}dd`} stroke={active?C.goldLight:C.cardBorder} strokeWidth={active?2:1} style={{transition:"all 0.25s",filter:active?`drop-shadow(0 0 8px ${C.gold})`:"none"}}/>
              <text x={ox} y={oy+4} textAnchor="middle" fill={active?C.black:"#fff"} fontSize={active?11:10} fontFamily="Montserrat" fontWeight="800" style={{pointerEvents:"none"}}>{note}</text>
              <circle cx={ix} cy={iy} r={11} fill={`${C.purpleDark}bb`} stroke={C.cardBorder} strokeWidth={1}/>
              <text x={ix} y={iy+4} textAnchor="middle" fill={C.silverDim} fontSize={8} fontFamily="Montserrat" fontWeight="600" style={{pointerEvents:"none"}}>{minors[i]}m</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ─── EAR TRAINING ────────────────────────────────────────────────────────────
function EarTrainingGuide() {
  const steps=[
    {num:"01",title:"Encuentra la tónica",desc:"Toca notas en tu instrumento hasta que una suene como 'casa' o reposo. Esa es la tónica.",icon:"🎯"},
    {num:"02",title:"Mayor o Menor",desc:"Alegre/brillante = Mayor. Oscuro/melancólico = Menor. Es una decisión emocional antes que técnica.",icon:"☯️"},
    {num:"03",title:"Usa la Pentatónica",desc:"Casi toda melodía occidental cabe en 5 notas. Prueba la pentatónica menor: 1-b3-4-5-b7.",icon:"✋"},
    {num:"04",title:"Identifica I, IV, V",desc:"Estos 3 acordes están en el 80% de las canciones. En Do: Do-Fa-Sol. El V siempre 'quiere' resolver al I.",icon:"🔺"},
    {num:"05",title:"Escucha la tensión",desc:"El acorde V crea tensión. El vii° también. El I resuelve. Aprende a detectar esos momentos de movimiento.",icon:"⚡"},
    {num:"06",title:"Practica lento",desc:"YouTube permite 0.5x. Audacity y GarageBand permiten bajar el pitch. Dale tiempo a tu oído.",icon:"🐢"},
  ];
  return (
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:10}}>
      {steps.map((s,i)=>(
        <div key={i} style={{padding:"14px",background:C.purpleDark,border:`1px solid ${C.cardBorder}`,borderRadius:10,animation:`fadeUp 0.4s ease ${i*0.07}s both`,transition:"all 0.2s"}}
          onMouseEnter={e=>{e.currentTarget.style.borderColor=C.gold+"55";e.currentTarget.style.transform="translateY(-2px)";}}
          onMouseLeave={e=>{e.currentTarget.style.borderColor=C.cardBorder;e.currentTarget.style.transform="translateY(0)";}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
            <span style={{fontSize:10,fontWeight:800,color:C.gold,letterSpacing:"0.08em"}}>PASO {s.num}</span>
            <span style={{fontSize:20}}>{s.icon}</span>
          </div>
          <div style={{fontFamily:"'Montserrat',sans-serif",fontWeight:700,fontSize:12,color:"#fff",marginBottom:5}}>{s.title}</div>
          <div style={{fontSize:11,color:C.silverDim,lineHeight:1.6}}>{s.desc}</div>
        </div>
      ))}
    </div>
  );
}

// ─── TOPIC DESCRIPTIONS (expanded) ──────────────────────────────────────────
const TOPIC_CONTENT = {
  intervals:{
    title:"Intervalos y Semitonos",icon:"📏",color:"#D4A413",
    content:[
      {h:"¿Qué es un semitono?",p:"Es la distancia más pequeña entre dos notas. En guitarra = 1 traste. En piano = 1 tecla adyacente (incluyendo negras). Todo en música se construye apilando semitonos."},
      {h:"¿Y un tono?",p:"2 semitonos = 1 tono. Do→Re es un tono (2 st). Do→Re♭ es un semitono (1 st). La diferencia entre escala mayor y menor son exactamente los semitonos que se colocan en distintas posiciones."},
      {h:"¿Por qué importan?",p:"Cada intervalo tiene un sonido emocional único. La 3ra Mayor (4 st) suena alegre. La 3ra Menor (3 st) suena triste. El Tritono (6 st) suena diabólico — por eso la Iglesia Medieval lo llamaba 'diabolus in musica'."},
    ],
    visual:"intervals",
  },
  major:{
    title:"Escala Mayor",icon:"☀️",color:"#4CAF50",
    content:[
      {h:"Fórmula",p:"T–T–S–T–T–T–S (T=Tono=2st, S=Semitono=1st). Aplica desde cualquier nota y obtienes su escala mayor. Ejemplo Do Mayor: Do-Re-Mi-Fa-Sol-La-Si-Do."},
      {h:"Grados",p:"Cada nota tiene un número de grado. El I es la tónica (reposo). El V es la dominante (tensión). El IV es la subdominante (movimiento hacia el V). I-IV-V es la progresión más común de la historia."},
      {h:"¿Para qué usarla?",p:"Melodías brillantes y alegres. Pop, rock, folk, música clásica. Casi toda melodía que 'suena bien' en el instinto occidental usa la escala mayor o sus modos."},
    ],
    visual:"scale",scaleKey:"major",
  },
  minor:{
    title:"Escalas Menores",icon:"🌙",color:"#9C27B0",
    content:[
      {h:"Menor Natural",p:"Fórmula: T–S–T–T–S–T–T. Es la misma escala mayor pero empezando desde el 6° grado. Do Mayor y La Menor usan exactamente las mismas notas (La-Si-Do-Re-Mi-Fa-Sol). Se llaman 'relativas'."},
      {h:"Menor Armónica",p:"Igual que la natural pero el 7° grado sube medio tono (#7). Esto crea un intervalo de 3 semitonos entre el 6° y 7° grado (muy característico, casi árabe) y genera tensión fuerte hacia la tónica. Muy usada en música clásica y metal."},
      {h:"Menor Melódica",p:"Al subir: 6° y 7° grados elevados medio tono. Al bajar: igual que la natural. El propósito es evitar el salto difícil de la armónica al cantar. En jazz se usa la forma ascendente en ambas direcciones."},
    ],
    visual:"scale",scaleKey:"minor",
  },
  pentatonic:{
    title:"Escala Pentatónica",icon:"✋",color:"#FF9800",
    content:[
      {h:"¿Qué es?",p:"Una escala de 5 notas ('penta' = 5). Se forma quitando el 4° y 7° grado de la escala mayor (o el 2° y 6° de la menor). El resultado son notas que casi no chocan entre sí — por eso es casi imposible sonar mal."},
      {h:"La fórmula: 1 - b3 - 4 - 5 - b7",p:"El '1' es la tónica (la nota base, punto de reposo). El 'b3' es la 3ra bajada un semitono (=3 semitonos desde la raíz, suena oscuro, es lo que la hace 'menor'). El '4' está a 5 semitonos. El '5' está a 7 semitonos (el más estable de todos). El 'b7' está a 10 semitonos (da el sabor rock/blues)."},
      {h:"¿Por qué funciona tan bien?",p:"Ninguna de sus 5 notas forma un tritono (el intervalo más disonante) entre sí. Todos los intervalos son consonantes. Eso la hace sonar bien sobre casi cualquier acorde de la tonalidad."},
    ],
    visual:"scale",scaleKey:"pentatonicm",
  },
  blues:{
    title:"Escala de Blues",icon:"🎷",color:"#2196F3",
    content:[
      {h:"Pentatónica + la blue note",p:"La escala blues es la pentatónica menor con una nota extra: el tritono (b5). Fórmula: 1 - b3 - 4 - b5 - 5 - b7. El b5 se llama 'blue note' porque crea esa tensión característica que resuelve al 5 natural."},
      {h:"¿Qué es el b5?",p:"Es la 5ta bajada un semitono. Está a 6 semitonos de la tónica. Es el tritono, el intervalo más tenso. En Do blues = F#. BB King, Stevie Ray Vaughan y Eric Clapton construyeron toda su identidad sonora sobre este intervalo."},
      {h:"¿Cómo usarla?",p:"Toca la pentatónica menor como base. Añade el b5 como nota de paso entre el 4 y el 5. O úsala para crear 'bends' (estiramientos de cuerda) que van del 4 hacia arriba rozando el b5. Ese es el sonido blues por excelencia."},
    ],
    visual:"scale",scaleKey:"blues",
  },
  modes:{
    title:"Modos de la Escala Mayor",icon:"🔮",color:"#00BCD4",
    content:[
      {h:"¿Qué son los modos?",p:"Son 7 escalas que usan las mismas notas que la escala mayor, pero empezando desde cada uno de sus 7 grados. Cada modo tiene un carácter emocional distinto porque los semitonos caen en posiciones diferentes."},
      {h:"Los 7 modos",p:"Jónico (= Mayor, alegre). Dórico (menor con 6M, jazz/funk, suena 'oscuro pero esperanzador'). Frigio (menor con b2, flamenco/metal, muy oscuro). Lidio (mayor con #4, soñador/cinematográfico). Mixolidio (mayor con b7, rock/blues, dominante). Eólico (= Menor natural). Locrio (b2 y b5, rarísimo, muy inestable)."},
      {h:"¿Para qué sirven?",p:"Para modular dentro de una tonalidad sin salirse de sus notas. El jazz y el rock progresivo los usan constantemente. Dórico es el favorito del funk (think: 'Oye Como Va' de Santana). Mixolidio es el favorito del rock clásico (think: 'Sweet Home Alabama')."},
    ],
    visual:"scale",scaleKey:"dorian",
  },
  chords:{
    title:"Cómo se Forman los Acordes",icon:"🎹",color:"#E91E63",
    content:[
      {h:"Triada básica",p:"Un acorde se forma apilando 3ras sobre una nota raíz. Mayor: 1-3-5 (4st + 3st). Menor: 1-b3-5 (3st + 4st). Disminuido: 1-b3-b5 (3st + 3st). Aumentado: 1-3-#5 (4st + 4st). El número indica semitonos desde la raíz."},
      {h:"¿Qué significa 1-3-5?",p:"El '1' es la nota raíz (Do en Do mayor). El '3' es la 3ra mayor (4 semitonos arriba = Mi). El '5' es la 5ta justa (7 semitonos arriba = Sol). Juntos forman Do-Mi-Sol = Do Mayor. Si bajas el '3' un semitono (b3) obtienes Do-Mib-Sol = Do menor."},
      {h:"Cuatríadas (acordes de 7ma)",p:"Agregan una 4ta nota: la 7ma. Maj7 = 1-3-5-7 (jazzístico, luminoso). Dom7 = 1-3-5-b7 (tensión dominante, quiere resolver). Min7 = 1-b3-5-b7 (suave, usado en funk y jazz). Dim7 = 1-b3-b5-bb7 (máxima tensión)."},
    ],
    visual:"chords",
  },
  circle:{
    title:"Círculo de Quintas",icon:"⭕",color:"#D4A413",
    content:[
      {h:"¿Qué es?",p:"Un mapa circular que organiza las 12 tonalidades. Cada paso en sentido horario sube una 5ta justa (7 semitonos). Cada paso antihorario baja una 5ta (o sube una 4ta). Es la herramienta más importante de la teoría tonal."},
      {h:"¿Para qué sirve?",p:"Para modulación: las tonalidades adyacentes en el círculo comparten 6 de sus 7 notas, por eso suena natural pasar de una a otra. Para entender armaduras: cada paso horario agrega un sostenido (#), cada paso antihorario agrega un bemol (b). Para encontrar acordes: el I, IV y V de cualquier tonalidad siempre están juntos en el círculo."},
      {h:"Las relativas menores",p:"Cada tonalidad mayor tiene una relativa menor que comparte exactamente las mismas notas. Están separadas por una 3ra menor (3 semitonos). Do Mayor → La Menor. Sol Mayor → Mi Menor. En el círculo, las menores aparecen en el anillo interior."},
    ],
    visual:"circle",
  },
  bpm:{
    title:"Tiempo, Compás y BPM",icon:"🥁",color:"#FF5722",
    content:[
      {h:"¿Qué es el BPM?",p:"Beats Per Minute = pulsos por minuto. 60 BPM = 1 pulso/segundo. 120 BPM = 2 pulsos/segundo. Es la velocidad del pulso del corazón de la canción. Debajo de 80 se siente lento. Entre 100-130 es el rango pop. Arriba de 160 es muy rápido (punk, drum & bass)."},
      {h:"Compás 4/4",p:"El más común. 4 tiempos por compás, cada uno vale una negra. El tiempo 1 lleva el acento más fuerte (golpe de bombo en el 1 y 3, caja en el 2 y 4 en el rock). La mayoría de canciones pop, rock y electrónica están en 4/4."},
      {h:"Otros compases",p:"3/4 = vals, 3 tiempos (1-2-3, 1-2-3). 6/8 = sensación de 2 grupos de 3, usado en baladas lentas. 7/8 = asimétrico, rock progresivo. Identificar el compás te ayuda a saber dónde caerán los cambios de acorde."},
    ],
    visual:"bpm",
  },
  ear:{
    title:"Método para Sacar Canciones a Oído",icon:"👂",color:"#8BC34A",
    content:[
      {h:"¿Por qué es difícil al principio?",p:"Tu oído no ha aprendido a 'separar' los instrumentos ni a reconocer los intervalos por su nombre. Es como intentar leer sin saber el alfabeto. Con práctica constante, los intervalos se vuelven tan reconocibles como las letras."},
      {h:"El proceso paso a paso",p:"1) Escucha completa sin tocar. 2) Tararea la melodía principal. 3) Encuentra la tónica en tu instrumento. 4) Determina mayor/menor. 5) Prueba la pentatónica sobre la tónica. 6) Identifica los cambios de acorde escuchando el bajo. 7) Verifica con la escala completa."},
      {h:"Trucos prácticos",p:"Usa YouTube a 0.5x de velocidad. El bajo te dice el acorde casi siempre. Los cambios de acorde ocurren normalmente en los tiempos fuertes (1 y 3 del compás). Apps como Transcribe+ y Amazing Slow Downer son invaluables. La clave: practica un fragmento a la vez."},
    ],
    visual:"ear",
  },
  harmonic:{title:"Mapa Armónico",icon:"🌐",color:"#e91e8c",content:[{h:"¿Qué es el Mapa Armónico?",p:"Visualiza todas las relaciones entre acordes desde cualquier tónica. El centro es la tónica. El primer anillo muestra acordes diatónicos directamente relacionados. El segundo anillo contiene dominantes secundarios y acordes prestados. El tercer anillo incluye acordes cromáticos y modales."},                 {h:"Cómo usar el mapa",p:"Haz clic en cualquier acorde para escucharlo y ver su relación. Usa las variaciones para filtrar: Diatónico (solo acordes de la tonalidad), Secundarios (dominantes secundarios), Intercambio Modal (acordes del modo paralelo), Jazz (acordes con 7mas)."},                 {h:"¿Para qué sirve?",p:"Para encontrar acordes de sustitución, crear modulaciones naturales, entender por qué ciertas progresiones suenan 'inesperadas pero bien'. Es la herramienta que usan los compositores de jazz y pop para salirse de lo predecible."}],visual:"harmonic"},
  order_exercise:{title:"Ordenar Escala",icon:"🎯",color:"#9C27B0",content:[{h:"Ejercicio",p:"Ordena todas las notas de la escala seleccionada. Arrastra desde el banco al orden correcto."}],visual:"order_exercise"},
  complete_exercise:{title:"Completar Escala",icon:"🧩",color:"#e74c3c",content:[{h:"Ejercicio",p:"Completa los espacios vacíos de la escala. Elige la dificultad y arrastra las notas correctas."}],visual:"complete_exercise"},
};

const TOPICS=Object.entries(TOPIC_CONTENT).map(([id,v])=>({id,icon:v.icon,title:v.title,color:v.color}));

// ─── MAIN THEORY ─────────────────────────────────────────────────────────────
export default function Theory() {
  const [activeTopic, setActiveTopic] = useState("intervals");
  const [circleKey,   setCircleKey]   = useState("C");
  const { playNote } = useAudio();
  const tc = TOPIC_CONTENT[activeTopic];

  const renderVisual = () => {
    const v = tc?.visual;
    if(v==="intervals") return <IntervalVisual/>;
    if(v==="scale")     return <ScaleExplorer playNote={playNote} defaultScaleKey={tc.scaleKey}/>;
    if(v==="chords")    return <ChordBuilder playNote={playNote}/>;
    if(v==="bpm")       return <BPMVisual/>;
    if(v==="ear")       return <EarTrainingGuide/>;
    if(v==="harmonic") return <HarmonicMap playNote={playNote}/>;    if(v==="order_exercise")    return <ScaleOrderExercise playNote={playNote}/>;
    if(v==="complete_exercise") return <CompleteScaleExercise playNote={playNote}/>;
    if(v==="circle") return (
      <div>
        <p style={{fontSize:12,color:C.silverDim,marginBottom:10}}>Haz clic en cualquier tonalidad para seleccionarla</p>
        <CircleOfFifths activeKey={circleKey} onSelect={setCircleKey}/>
        <div style={{textAlign:"center",marginTop:10,padding:"10px",background:C.purpleDark,borderRadius:8,border:`1px solid ${C.cardBorder}`}}>
          <span style={{color:C.gold,fontWeight:800,fontSize:15}}>{NOTE_ES[circleKey]||circleKey} Mayor</span>
          <span style={{color:C.silverDim,fontSize:13}}> → Relativa menor: </span>
          <span style={{color:"#c9a0ff",fontWeight:700,fontSize:15}}>{NOTE_ES[CIRCLE_OF_FIFTHS[(CIRCLE_OF_FIFTHS.indexOf(circleKey)+9)%12]]||CIRCLE_OF_FIFTHS[(CIRCLE_OF_FIFTHS.indexOf(circleKey)+9)%12]}m</span>
          <div style={{marginTop:6,fontSize:11,color:C.silverDim}}>
            Notas: {getScaleNotes(circleKey,"major").map(n=>NOTE_ES[n]).join(" · ")}
          </div>
        </div>
      </div>
    );
    return null;
  };

  return (
    <div style={{paddingBottom:48}}>
      <div className="fade-up" style={{marginBottom:24}}>
        <span className="tag gold">Teoría Musical</span>
        <h2 style={{fontFamily:"'Montserrat',sans-serif",fontWeight:800,fontSize:26,color:"#fff",marginTop:8,animation:"glow 3s ease-in-out infinite"}}>Aprende Desde Cero</h2>
        <p style={{color:C.silverDim,fontSize:13,marginTop:4}}>Teoría interactiva y visual. Toca cada nota, arrastra escalas, construye acordes.</p>
      </div>

      {/* Topic pills */}
      <div className="fade-up" style={{display:"flex",gap:7,flexWrap:"wrap",marginBottom:24,animationDelay:"0.07s"}}>
        {TOPICS.map((t,i)=>(
          <button key={t.id} onClick={()=>setActiveTopic(t.id)} style={{background:activeTopic===t.id?`${t.color}22`:C.card,border:`1px solid ${activeTopic===t.id?t.color:C.cardBorder}`,borderRadius:20,padding:"6px 13px",cursor:"pointer",color:activeTopic===t.id?t.color:C.silverDim,fontSize:11,fontWeight:700,transition:"all 0.2s",display:"flex",alignItems:"center",gap:5,boxShadow:activeTopic===t.id?`0 0 14px ${t.color}33`:"none",animation:`fadeUp 0.4s ease ${i*0.03}s both`,WebkitTapHighlightColor:"transparent"}}>
            {t.icon} {t.title}
          </button>
        ))}
      </div>

      {/* Content */}
      <div key={activeTopic} style={{animation:"theorySectionIn 0.4s cubic-bezier(0.4,0,0.2,1) both"}}>
        {/* Theory text */}
        {tc?.content && tc.content[0]?.h !== "Ejercicio" && (
          <div className="card" style={{marginBottom:18,borderColor:`${tc.color}44`}}>
            <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16}}>
              <div style={{width:48,height:48,borderRadius:12,background:`${tc.color}22`,border:`1px solid ${tc.color}55`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0}}>{tc.icon}</div>
              <div>
                <h3 style={{fontFamily:"'Montserrat',sans-serif",fontWeight:800,fontSize:18,color:"#fff"}}>{tc.title}</h3>
                <span className="tag" style={{background:`${tc.color}18`,borderColor:`${tc.color}44`,color:tc.color,marginTop:4,display:"inline-block"}}>Teoría esencial</span>
              </div>
            </div>
            {tc.content.map((block,i)=>(
              <div key={i} style={{marginBottom:i<tc.content.length-1?14:0}}>
                <p style={{fontSize:12,fontWeight:800,color:tc.color,marginBottom:4,letterSpacing:"0.04em",textTransform:"uppercase"}}>{block.h}</p>
                <p style={{fontSize:13,color:C.silver,lineHeight:1.8}}>{block.p}</p>
              </div>
            ))}
          </div>
        )}

        {/* Visual */}
        <div className="card" style={{borderColor:`${tc?.color}33`}}>
          <p style={{fontSize:10,color:C.silverDim,marginBottom:16,letterSpacing:"0.1em",textTransform:"uppercase"}}>Vista interactiva — {tc?.title}</p>
          {renderVisual()}
        </div>
      </div>
    </div>
  );
}