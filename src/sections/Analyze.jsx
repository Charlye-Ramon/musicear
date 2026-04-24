import { useState, useRef } from "react";
import { C } from "../styles/tokens";
import { NOTES, NOTE_ES, SCALES, transposeNote } from "../constants/music";
import { ChordBadge } from "../components/ui";
import * as Tone from "tone";

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function transposeChord(chord, semitones) {
  if (!semitones) return chord;
  const m = chord.match(/^([A-G]#?)(.*)$/);
  if (!m) return chord;
  return transposeNote(m[1], semitones) + m[2];
}

// ─── YOUTUBE ID EXTRACTOR ─────────────────────────────────────────────────────
function extractYouTubeId(url) {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([A-Za-z0-9_-]{11})/,
    /youtube\.com\/shorts\/([A-Za-z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

// ─── SIMULATED ANALYSIS ENGINE ───────────────────────────────────────────────
// In production this would call a backend (AudD API, Spotify API, etc.)
// For now we generate realistic-looking analysis from the song metadata.
function analyzeFromMetadata(title, artist) {
  const titleLower = (title + artist).toLowerCase();

  // Determine key heuristically from artist/song name hash
  const keyIdx = (title.charCodeAt(0) + title.length * 3) % 12;
  const isMinor = titleLower.includes("sad") || titleLower.includes("cry") ||
    titleLower.includes("pain") || titleLower.includes("dark") ||
    titleLower.includes("night") || titleLower.includes("alone") ||
    (title.charCodeAt(0) % 3 === 0);

  const key = NOTES[keyIdx];
  const scale = isMinor ? "minor" : "major";
  const bpm = 75 + ((title.charCodeAt(1) || 65) % 70);
  const capo = (title.charCodeAt(2) || 0) % 4;

  // Generate chord progression
  const scaleNotes = getScaleFromKey(key, scale);
  const progs = isMinor
    ? [[0,3,4,6],[0,5,2,4],[0,6,5,4],[0,2,3,4]]
    : [[0,3,4,0],[0,4,5,3],[0,2,4,3],[0,5,3,4]];
  const progPick = progs[(title.length) % progs.length];

  const chordNames = progPick.map((deg, i) => {
    const note = scaleNotes[deg] || scaleNotes[0];
    const isMinorChord = isMinor
      ? [0,2,3].includes(deg)
      : [1,2,5].includes(deg);
    return note + (isMinorChord ? "m" : "");
  });

  const sections = [
    { type: "Intro",    chords: chordNames.slice(0,2), lyrics: "" },
    { type: "Verso 1",  chords: chordNames,
      lyrics: `${title} — primer verso. La melodía sigue la progresión ${chordNames.join("-")}.` },
    { type: "Pre-Coro", chords: [chordNames[1], chordNames[2]],
      lyrics: `Puente hacia el coro. Tensión con ${chordNames[1]} → ${chordNames[2]}.` },
    { type: "Coro",     chords: [chordNames[2], chordNames[3], chordNames[0], chordNames[1]],
      lyrics: `Coro principal — el clímax emocional de la canción.` },
    { type: "Verso 2",  chords: chordNames,
      lyrics: `Segundo verso con variaciones melódicas sobre ${chordNames.join("-")}.` },
    { type: "Coro",     chords: [chordNames[2], chordNames[3], chordNames[0], chordNames[1]],
      lyrics: `Repetición del coro.` },
    { type: "Outro",    chords: [chordNames[0], chordNames[0]], lyrics: "" },
  ];

  const mins = Math.floor(bpm / 30) + 2;
  const secs = (bpm * 7) % 60;

  return {
    title, artist,
    bpm, key, scale, capo,
    duration: `${mins}:${secs.toString().padStart(2,"0")}`,
    sections,
    uniqueChords: [...new Set(chordNames)],
  };
}

function getScaleFromKey(root, scaleType) {
  const rootIdx = NOTES.indexOf(root);
  const intervals = scaleType === "minor"
    ? [0,2,3,5,7,8,10]
    : [0,2,4,5,7,9,11];
  return intervals.map(i => NOTES[(rootIdx + i) % 12]);
}

// ─── CHORD PLAYER ─────────────────────────────────────────────────────────────
async function playChordSound(chord) {
  await Tone.start();
  const m = chord.match(/^([A-G]#?)/);
  if (!m) return;
  const root = m[1];
  const isMinor = chord.includes("m") && !chord.includes("maj");
  const rootIdx = NOTES.indexOf(root);
  const notes = isMinor
    ? [rootIdx, rootIdx+3, rootIdx+7].map(i => NOTES[i%12] + "4")
    : [rootIdx, rootIdx+4, rootIdx+7].map(i => NOTES[i%12] + "4");
  const synth = new Tone.PolySynth(Tone.Synth, {
    oscillator:{type:"triangle"},
    envelope:{attack:0.01,decay:0.8,sustain:0.2,release:1.2},
    volume:-10,
  }).toDestination();
  synth.triggerAttackRelease(notes, "2n", Tone.now());
  setTimeout(()=>{ try{synth.dispose();}catch(e){} }, 3000);
}

// ─── DEMO SONGS ───────────────────────────────────────────────────────────────
const DEMO_SONGS = [
  { title:"Wonderwall",      artist:"Oasis",       ytId:"bx1Bh8ZvH84" },
  { title:"Hotel California", artist:"Eagles",      ytId:"EqPtz5qN7HM"  },
  { title:"Creep",           artist:"Radiohead",   ytId:"XFkzRNyygfk"  },
  { title:"Wish You Were Here", artist:"Pink Floyd", ytId:"IXdNnw99-Ic" },
];

// ─── UPLOAD AREA ──────────────────────────────────────────────────────────────
function UploadArea({ onFile }) {
  const ref = useRef();
  const [dragging, setDragging] = useState(false);
  return (
    <div
      onClick={() => ref.current.click()}
      onDragOver={e => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) onFile(f); }}
      style={{
        border: `2px dashed ${dragging ? C.gold : C.cardBorder}`,
        borderRadius: 12, padding: "20px", textAlign: "center",
        cursor: "pointer", transition: "all 0.2s",
        background: dragging ? `${C.gold}08` : "transparent",
      }}
    >
      <input ref={ref} type="file" accept="audio/*" style={{ display:"none" }}
        onChange={e => { if(e.target.files[0]) onFile(e.target.files[0]); }} />
      <div style={{ fontSize: 28, marginBottom: 6 }}>🎵</div>
      <p style={{ color: C.silverDim, fontSize: 13 }}>
        {dragging ? "Suelta el archivo aquí" : "Arrastra un archivo de audio o haz clic para seleccionar"}
      </p>
      <p style={{ color: C.silverDim, fontSize: 11, marginTop: 4 }}>MP3, WAV, M4A, OGG</p>
    </div>
  );
}

// ─── WAVEFORM VISUAL ─────────────────────────────────────────────────────────
function AnalyzeProgress({ stage }) {
  const stages = [
    { label: "Detectando tonalidad", done: stage > 0 },
    { label: "Analizando acordes",   done: stage > 1 },
    { label: "Extrayendo ritmo",     done: stage > 2 },
    { label: "Generando secciones",  done: stage > 3 },
  ];
  return (
    <div style={{ padding: "20px", background: C.purpleDark, borderRadius: 12, border: `1px solid ${C.cardBorder}` }}>
      <p style={{ fontSize: 13, fontWeight: 700, color: C.gold, marginBottom: 14 }}>⚙️ Analizando canción...</p>
      {stages.map((s, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, animation: stage > i ? `fadeUp 0.3s ease both` : "none" }}>
          <div style={{
            width: 20, height: 20, borderRadius: "50%", flexShrink: 0,
            background: s.done ? C.gold : C.cardBorder,
            border: `2px solid ${s.done ? C.gold : C.silverDim}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "all 0.4s",
          }}>
            {s.done && <span style={{ fontSize: 10, color: C.black, fontWeight: 900 }}>✓</span>}
            {!s.done && stage === i && (
              <span style={{ width: 8, height: 8, borderRadius: "50%", border: `2px solid ${C.gold}`, borderTopColor: "transparent", animation: "spin 0.7s linear infinite", display: "inline-block" }} />
            )}
          </div>
          <span style={{ fontSize: 13, color: s.done ? C.silver : C.silverDim, transition: "color 0.3s" }}>{s.label}</span>
        </div>
      ))}
    </div>
  );
}

// ─── CHORD LINE ───────────────────────────────────────────────────────────────
function ChordLine({ chords, transpose, onPlay }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
      {chords.map((c, i) => {
        const ch = transposeChord(c, transpose);
        return (
          <span
            key={i}
            onClick={() => onPlay(ch)}
            className="chord-pop"
            style={{
              display: "inline-block",
              background: i === 0 ? `linear-gradient(135deg,${C.gold},${C.goldLight})` : `${C.purple}99`,
              color: i === 0 ? C.black : C.gold,
              border: `1px solid ${i === 0 ? C.gold : C.gold + "44"}`,
              borderRadius: 6, padding: "3px 10px",
              fontSize: 13, fontWeight: 800,
              cursor: "pointer", userSelect: "none",
              animationDelay: `${i * 0.05}s`,
              transition: "all 0.15s",
              WebkitTapHighlightColor: "transparent",
            }}
            onMouseEnter={e => e.currentTarget.style.transform = "scale(1.08)"}
            onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
            title="Clic para escuchar acorde"
          >
            {ch}
          </span>
        );
      })}
    </div>
  );
}

// ─── MAIN ANALYZE ─────────────────────────────────────────────────────────────
export default function Analyze() {
  const [url,       setUrl]       = useState("");
  const [manualTitle,  setManualTitle]  = useState("");
  const [manualArtist, setManualArtist] = useState("");
  const [inputMode, setInputMode] = useState("youtube"); // youtube | file | manual
  const [song,      setSong]      = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [stage,     setStage]     = useState(0);
  const [transpose, setTranspose] = useState(0);
  const [langEs,    setLangEs]    = useState(false);
  const [activeTab, setActiveTab] = useState("chords");
  const [ytId,      setYtId]      = useState(null);
  const [error,     setError]     = useState("");

  const currentKey = song
    ? (transpose === 0 ? song.key : transposeNote(song.key, transpose))
    : null;

  // ── Simulate analysis with realistic stages ──────────────────────────────
  const runAnalysis = (title, artist, videoId) => {
    setError("");
    setAnalyzing(true);
    setSong(null);
    setStage(0);
    setTranspose(0);
    if (videoId) setYtId(videoId);

    const delays = [600, 1100, 1700, 2300];
    delays.forEach((d, i) => {
      setTimeout(() => setStage(i + 1), d);
    });

    setTimeout(() => {
      const result = analyzeFromMetadata(title || "Canción", artist || "Artista");
      setSong(result);
      setAnalyzing(false);
    }, 2800);
  };

  const handleYouTube = () => {
    const id = extractYouTubeId(url);
    if (!id) { setError("URL de YouTube no válida. Ejemplo: https://youtube.com/watch?v=dQw4w9WgXcQ"); return; }
    // We can't auto-extract title from YouTube without a backend, so ask user
    const title  = manualTitle  || "Canción de YouTube";
    const artist = manualArtist || "Artista";
    runAnalysis(title, artist, id);
  };

  const handleFile = (file) => {
    const title  = file.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " ");
    runAnalysis(title, "Archivo local", null);
  };

  const handleDemo = (demo) => {
    setUrl(`https://youtube.com/watch?v=${demo.ytId}`);
    runAnalysis(demo.title, demo.artist, demo.ytId);
  };

  const handleManual = () => {
    if (!manualTitle) { setError("Ingresa al menos el nombre de la canción"); return; }
    runAnalysis(manualTitle, manualArtist, null);
  };

  return (
    <div style={{ paddingBottom: 48 }}>
      {/* Header */}
      <div className="fade-up" style={{ marginBottom: 24 }}>
        <span className="tag gold">Análisis de Canciones</span>
        <h2 style={{ fontFamily:"'Montserrat',sans-serif", fontWeight:800, fontSize:26, color:"#fff", marginTop:8 }}>
          Descifra Cualquier Canción
        </h2>
        <p style={{ color:C.silverDim, fontSize:13, marginTop:4 }}>
          Obtén acordes, tonalidad, BPM y letra. Haz clic en cualquier acorde para escucharlo.
        </p>
      </div>

      {/* Input mode tabs */}
      <div className="fade-up" style={{ display:"flex", gap:4, marginBottom:16, animationDelay:"0.07s" }}>
        {[["youtube","📺 YouTube"],["file","📁 Archivo"],["manual","✏️ Manual"]].map(([id,label])=>(
          <button key={id} onClick={()=>setInputMode(id)} style={{
            background:inputMode===id?`linear-gradient(135deg,${C.purple},${C.purpleLight})`:"transparent",
            border:`1px solid ${inputMode===id?C.gold:C.cardBorder}`,
            color:inputMode===id?C.gold:C.silverDim,
            borderRadius:8, padding:"8px 14px", cursor:"pointer",
            fontFamily:"'Montserrat',sans-serif", fontWeight:700, fontSize:12,
            transition:"all 0.2s", WebkitTapHighlightColor:"transparent",
          }}>{label}</button>
        ))}
      </div>

      {/* Input area */}
      <div className="card fade-up" style={{ marginBottom:20, animationDelay:"0.12s" }}>

        {inputMode === "youtube" && (
          <div>
            <p style={{ fontSize:10, color:C.silverDim, marginBottom:8, letterSpacing:"0.1em", textTransform:"uppercase" }}>Link de YouTube</p>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:12 }}>
              <input value={url} onChange={e=>setUrl(e.target.value)}
                placeholder="https://youtube.com/watch?v=..."
                style={{ flex:1, minWidth:200, background:C.purpleDark, border:`1px solid ${C.cardBorder}`, color:C.silver, borderRadius:8, padding:"10px 14px", fontSize:13, outline:"none" }}
              />
            </div>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:12 }}>
              <input value={manualTitle} onChange={e=>setManualTitle(e.target.value)}
                placeholder="Nombre de la canción (opcional)"
                style={{ flex:1, minWidth:140, background:C.purpleDark, border:`1px solid ${C.cardBorder}`, color:C.silver, borderRadius:8, padding:"8px 12px", fontSize:12, outline:"none" }}
              />
              <input value={manualArtist} onChange={e=>setManualArtist(e.target.value)}
                placeholder="Artista (opcional)"
                style={{ flex:1, minWidth:120, background:C.purpleDark, border:`1px solid ${C.cardBorder}`, color:C.silver, borderRadius:8, padding:"8px 12px", fontSize:12, outline:"none" }}
              />
            </div>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
              <button className="btn-gold" onClick={handleYouTube} disabled={analyzing}>
                {analyzing ? <span style={{ display:"flex",alignItems:"center",gap:8 }}><span style={{ width:14,height:14,border:`2px solid ${C.black}`,borderTopColor:"transparent",borderRadius:"50%",animation:"spin 0.7s linear infinite",display:"inline-block" }}/>Analizando...</span> : "🔍 Analizar"}
              </button>
            </div>
            {/* YouTube embed preview */}
            {ytId && !analyzing && song && (
              <div style={{ marginTop:14, borderRadius:10, overflow:"hidden", border:`1px solid ${C.cardBorder}` }}>
                <iframe
                  width="100%" height="200"
                  src={`https://www.youtube.com/embed/${ytId}`}
                  title="YouTube preview"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  style={{ display:"block" }}
                />
              </div>
            )}
          </div>
        )}

        {inputMode === "file" && (
          <UploadArea onFile={handleFile} />
        )}

        {inputMode === "manual" && (
          <div>
            <p style={{ fontSize:10, color:C.silverDim, marginBottom:8, letterSpacing:"0.1em", textTransform:"uppercase" }}>Analizar por nombre</p>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:12 }}>
              <input value={manualTitle} onChange={e=>setManualTitle(e.target.value)}
                placeholder="Nombre de la canción *"
                style={{ flex:1, minWidth:160, background:C.purpleDark, border:`1px solid ${C.cardBorder}`, color:C.silver, borderRadius:8, padding:"10px 14px", fontSize:13, outline:"none" }}
              />
              <input value={manualArtist} onChange={e=>setManualArtist(e.target.value)}
                placeholder="Artista"
                style={{ flex:1, minWidth:130, background:C.purpleDark, border:`1px solid ${C.cardBorder}`, color:C.silver, borderRadius:8, padding:"10px 14px", fontSize:13, outline:"none" }}
              />
            </div>
            <button className="btn-gold" onClick={handleManual} disabled={analyzing}>
              {analyzing ? "Analizando..." : "🔍 Analizar"}
            </button>
          </div>
        )}

        {error && <p style={{ color:"#e74c3c", fontSize:12, marginTop:10 }}>⚠️ {error}</p>}

        {/* Demo songs */}
        <div style={{ marginTop:16, paddingTop:14, borderTop:`1px solid ${C.cardBorder}` }}>
          <p style={{ fontSize:10, color:C.silverDim, marginBottom:8, letterSpacing:"0.1em", textTransform:"uppercase" }}>Demos rápidos</p>
          <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
            {DEMO_SONGS.map(d=>(
              <button key={d.title} onClick={()=>handleDemo(d)} className="btn-outline" style={{ fontSize:11, padding:"6px 12px" }}>
                {d.title}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Analysis progress */}
      {analyzing && <div className="fade-up" style={{ marginBottom:20 }}><AnalyzeProgress stage={stage}/></div>}

      {/* Results */}
      {song && !analyzing && (
        <div key={song.title} style={{ animation:"theorySectionIn 0.4s ease both" }}>

          {/* Song header */}
          <div className="card fade-up" style={{ marginBottom:16 }}>
            <div style={{ display:"flex", justifyContent:"space-between", flexWrap:"wrap", gap:16 }}>
              <div>
                <h3 style={{ fontFamily:"'Montserrat',sans-serif", fontWeight:800, fontSize:22, color:"#fff" }}>{song.title}</h3>
                <p style={{ color:C.silverDim, fontSize:14 }}>{song.artist}</p>
                <div style={{ display:"flex", gap:8, marginTop:10, flexWrap:"wrap" }}>
                  <span className="tag gold">♩ {song.bpm} BPM</span>
                  <span className="tag gold">🎵 {NOTE_ES[currentKey]||currentKey} {SCALES[song.scale]?.name}</span>
                  {song.capo > 0 && <span className="tag">Cejilla traste {song.capo}</span>}
                  <span className="tag">⏱ {song.duration}</span>
                  {transpose !== 0 && <span className="tag gold">⬆ {transpose>0?"+":""}{transpose} semitonos</span>}
                </div>
              </div>

              {/* Transpose */}
              <div>
                <p style={{ fontSize:10, color:C.silverDim, marginBottom:6, letterSpacing:"0.1em", textTransform:"uppercase" }}>Transposición</p>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <button className="btn-outline" onClick={()=>setTranspose(t=>Math.max(t-1,-6))} style={{ padding:"6px 13px", fontSize:18 }}>−</button>
                  <div style={{ minWidth:42, textAlign:"center", fontWeight:800, fontSize:16, color:transpose===0?C.silverDim:C.gold, transition:"color 0.3s" }}>
                    {transpose===0?"0":(transpose>0?`+${transpose}`:transpose)}
                  </div>
                  <button className="btn-outline" onClick={()=>setTranspose(t=>Math.min(t+1,6))} style={{ padding:"6px 13px", fontSize:18 }}>+</button>
                  {transpose!==0 && <button className="btn-outline" onClick={()=>setTranspose(0)} style={{ fontSize:11, padding:"6px 10px" }}>Reset</button>}
                </div>
                <p style={{ fontSize:10, color:C.silverDim, marginTop:5 }}>Haz clic en acorde para escuchar</p>
              </div>
            </div>

            {/* Unique chords strip */}
            <div style={{ marginTop:14, paddingTop:12, borderTop:`1px solid ${C.cardBorder}` }}>
              <p style={{ fontSize:10, color:C.silverDim, marginBottom:8, letterSpacing:"0.1em", textTransform:"uppercase" }}>Acordes únicos</p>
              <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                {song.uniqueChords.map((c,i)=>(
                  <span key={i} onClick={()=>playChordSound(transposeChord(c,transpose))}
                    style={{ padding:"5px 12px", background:`${C.gold}18`, border:`1px solid ${C.gold}44`, borderRadius:6, fontSize:13, fontWeight:800, color:C.gold, cursor:"pointer", transition:"all 0.15s", WebkitTapHighlightColor:"transparent" }}
                    onMouseEnter={e=>e.currentTarget.style.transform="scale(1.08)"}
                    onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}>
                    {transposeChord(c,transpose)}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display:"flex", gap:4, marginBottom:16, flexWrap:"wrap" }}>
            {[["chords","🎸 Acordes"],["lyrics","📝 Letra"],["info","ℹ️ Info"]].map(([id,label])=>(
              <button key={id} onClick={()=>setActiveTab(id)} style={{
                background:activeTab===id?`linear-gradient(135deg,${C.purple},${C.purpleLight})`:"transparent",
                border:`1px solid ${activeTab===id?C.gold:C.cardBorder}`,
                color:activeTab===id?C.gold:C.silverDim,
                borderRadius:8, padding:"8px 16px", cursor:"pointer",
                fontFamily:"'Montserrat',sans-serif", fontWeight:700, fontSize:12,
                transition:"all 0.2s", WebkitTapHighlightColor:"transparent",
              }}>{label}</button>
            ))}
            <button onClick={()=>setLangEs(v=>!v)} className="btn-outline" style={{ marginLeft:"auto", fontSize:11, padding:"8px 12px" }}>
              {langEs?"🇺🇸 EN":"🇲🇽 ES"}
            </button>
          </div>

          {/* CHORDS TAB */}
          {activeTab==="chords" && (
            <div className="fade-in">
              {song.sections.map((sec,si)=>(
                <div key={si} className="card" style={{ marginBottom:12, animation:`fadeUp 0.35s ease ${si*0.06}s both`, borderColor:sec.type==="Coro"?C.gold+"44":C.cardBorder }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                    <span className="tag" style={{ background:sec.type==="Coro"?`${C.gold}22`:undefined, borderColor:sec.type==="Coro"?C.gold:undefined, color:sec.type==="Coro"?C.gold:undefined }}>
                      {sec.type}
                    </span>
                    <span style={{ fontSize:10, color:C.silverDim }}>Clic en acorde = escuchar</span>
                  </div>
                  <ChordLine chords={sec.chords} transpose={transpose} onPlay={playChordSound}/>
                  {sec.lyrics && (
                    <p style={{ fontSize:13, color:C.silver, lineHeight:1.8, borderTop:`1px solid ${C.cardBorder}`, paddingTop:10, fontStyle:"italic" }}>
                      {langEs ? `[ES] ${sec.lyrics}` : sec.lyrics}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* LYRICS TAB */}
          {activeTab==="lyrics" && (
            <div className="fade-in">
              {song.sections.filter(s=>s.lyrics).map((sec,si)=>(
                <div key={si} className="card" style={{ marginBottom:12, animation:`fadeUp 0.35s ease ${si*0.06}s both` }}>
                  <span className="tag" style={{ display:"inline-block", marginBottom:10 }}>{sec.type}</span>
                  <div style={{ display:"flex", gap:5, flexWrap:"wrap", marginBottom:8 }}>
                    {sec.chords.map((c,ci)=>(
                      <span key={ci} onClick={()=>playChordSound(transposeChord(c,transpose))}
                        style={{ fontSize:11, fontWeight:800, color:C.gold, background:`${C.gold}18`, borderRadius:4, padding:"2px 7px", cursor:"pointer", animation:`chordPop 0.3s ease ${ci*0.05}s both` }}>
                        {transposeChord(c,transpose)}
                      </span>
                    ))}
                  </div>
                  <p style={{ fontSize:14, color:C.silver, lineHeight:1.9, fontStyle:"italic" }}>
                    {langEs ? `[Traducción] ${sec.lyrics}` : sec.lyrics}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* INFO TAB */}
          {activeTab==="info" && (
            <div className="card fade-in">
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))", gap:10 }}>
                {[
                  ["Canción",song.title],["Artista",song.artist],
                  ["BPM",song.bpm],["Tonalidad",`${NOTE_ES[currentKey]||currentKey} ${SCALES[song.scale]?.name}`],
                  ["Cejilla",song.capo?`Traste ${song.capo}`:"Sin cejilla"],["Duración",song.duration],
                  ["Secciones",song.sections.length],["Acordes únicos",song.uniqueChords.length],
                ].map(([l,v])=>(
                  <div key={l} style={{ padding:"12px 14px", background:C.purpleDark, borderRadius:8, border:`1px solid ${C.cardBorder}` }}>
                    <p style={{ fontSize:9, color:C.silverDim, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:4 }}>{l}</p>
                    <p style={{ fontSize:14, fontWeight:700, color:C.silver }}>{v}</p>
                  </div>
                ))}
              </div>
              <div style={{ marginTop:14, padding:"12px 14px", background:`${C.gold}08`, border:`1px solid ${C.gold}22`, borderRadius:8 }}>
                <p style={{ fontSize:11, color:C.silverDim, lineHeight:1.7 }}>
                  <span style={{ color:C.gold, fontWeight:700 }}>ℹ️ Nota:</span> El análisis de acordes y tonalidad es generado automáticamente. Para producción, integra APIs como{" "}
                  <span style={{ color:C.gold }}>AudD.io</span>, <span style={{ color:C.gold }}>ACRCloud</span> o <span style={{ color:C.gold }}>Spotify Web API</span> para análisis de audio real.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}