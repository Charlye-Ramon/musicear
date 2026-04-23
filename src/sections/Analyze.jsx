import { useState } from "react";
import { C } from "../styles/tokens";
import { NOTES, NOTE_ES, SCALES, transposeNote } from "../constants/music";
import { ChordBadge } from "../components/ui";

const DEMO_SONG = {
  title:"Wonderwall", artist:"Oasis", bpm:87, key:"F#", scale:"minor",
  capo:2, duration:"4:18",
  sections:[
    { type:"Intro",    chords:[{chord:"Em7"},{chord:"G"},{chord:"Dsus4"},{chord:"A7sus4"}], lyrics:"" },
    { type:"Verso 1",  chords:[{chord:"Em7"},{chord:"G"},{chord:"Dsus4"},{chord:"A7sus4"}], lyrics:"Today is gonna be the day that they're gonna throw it back to you" },
    { type:"Verso 2",  chords:[{chord:"Em7"},{chord:"G"},{chord:"Dsus4"},{chord:"A7sus4"}], lyrics:"By now you should've somehow realised what you gotta do" },
    { type:"Pre-Coro", chords:[{chord:"C"},{chord:"D"},{chord:"Em"},{chord:"G"}],          lyrics:"I don't believe that anybody feels the way I do about you now" },
    { type:"Coro",     chords:[{chord:"C"},{chord:"Em7"},{chord:"G"},{chord:"F"}],          lyrics:"And all the roads we have to walk are winding" },
  ],
};

function transposeChord(chord, semitones) {
  if (!semitones) return chord;
  const match = chord.match(/^([A-G]#?)(.*)$/);
  if (!match) return chord;
  return transposeNote(match[1], semitones) + match[2];
}

export default function Analyze() {
  const [url, setUrl]           = useState("");
  const [analyzed, setAnalyzed] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [transpose, setTranspose] = useState(0);
  const [langEs, setLangEs]     = useState(false);
  const [activeTab, setActiveTab] = useState("chords");
  const [animKey, setAnimKey]   = useState(0);

  const song = DEMO_SONG;
  const currentKey = transpose === 0 ? song.key : transposeNote(song.key, transpose);

  const handleAnalyze = () => {
    setAnalyzing(true);
    setTimeout(() => { setAnalyzing(false); setAnalyzed(true); setAnimKey(k=>k+1); }, 2400);
  };

  return (
    <div style={{ paddingBottom:48 }}>
      <div className="fade-up" style={{ marginBottom:28 }}>
        <span className="tag gold">Análisis de Canciones</span>
        <h2 style={{ fontFamily:"'Montserrat',sans-serif", fontWeight:800, fontSize:28, color:"#fff", marginTop:8 }}>
          Descifra Cualquier Canción
        </h2>
        <p style={{ color:C.silverDim, fontSize:13, marginTop:4 }}>
          Pega el link de YouTube o sube un archivo para obtener letra, acordes y tonalidad.
        </p>
      </div>

      {/* Input */}
      <div className="card fade-up" style={{ marginBottom:22, animationDelay:"0.1s" }}>
        <p style={{ fontSize:10, color:C.silverDim, marginBottom:10, letterSpacing:"0.12em", textTransform:"uppercase" }}>Fuente de la canción</p>
        <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
          <input value={url} onChange={e=>setUrl(e.target.value)}
            placeholder="https://youtube.com/watch?v=..."
            style={{
              flex:1, minWidth:200,
              background:C.purpleDark, border:`1px solid ${C.cardBorder}`,
              color:C.silver, borderRadius:8, padding:"10px 14px",
              fontSize:13, outline:"none",
            }}
          />
          <button className="btn-gold" onClick={handleAnalyze} disabled={analyzing}>
            {analyzing ? (
              <span style={{ display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ width:14,height:14,border:`2px solid ${C.black}`,borderTopColor:"transparent",borderRadius:"50%",animation:"spin 0.7s linear infinite",display:"inline-block" }}/>
                Analizando...
              </span>
            ) : "🔍 Analizar"}
          </button>
          <button className="btn-outline" onClick={() => { setAnalyzed(true); setAnimKey(k=>k+1); }}>Demo →</button>
        </div>
      </div>

      {analyzed && (
        <div key={animKey}>
          {/* Song header */}
          <div className="card fade-up" style={{ marginBottom:20, animationDelay:"0.08s" }}>
            <div style={{ display:"flex", justifyContent:"space-between", flexWrap:"wrap", gap:16 }}>
              <div>
                <h3 style={{ fontFamily:"'Montserrat',sans-serif", fontWeight:800, fontSize:22, color:"#fff" }}>{song.title}</h3>
                <p style={{ color:C.silverDim, fontSize:14 }}>{song.artist}</p>
                <div style={{ display:"flex", gap:8, marginTop:10, flexWrap:"wrap" }}>
                  <span className="tag gold">♩ {song.bpm} BPM</span>
                  <span className="tag gold">🎵 {NOTE_ES[currentKey] || currentKey} {SCALES[song.scale]?.name}</span>
                  <span className="tag">Cejilla: {song.capo ? `Traste ${song.capo}` : "Sin cejilla"}</span>
                  <span className="tag">⏱ {song.duration}</span>
                  {transpose !== 0 && <span className="tag gold">⬆️ Transpuesto {transpose > 0 ? "+" : ""}{transpose}</span>}
                </div>
              </div>

              {/* Transpose */}
              <div>
                <p style={{ fontSize:10, color:C.silverDim, marginBottom:8, letterSpacing:"0.1em", textTransform:"uppercase" }}>Transposición</p>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <button className="btn-outline" onClick={() => setTranspose(t => Math.max(t-1,-6))} style={{ padding:"6px 14px", fontSize:18 }}>−</button>
                  <div style={{
                    minWidth:44, textAlign:"center",
                    fontWeight:800, fontSize:16,
                    color: transpose===0 ? C.silverDim : C.gold,
                    transition:"color 0.3s",
                  }}>
                    {transpose===0 ? "0" : (transpose>0 ? `+${transpose}` : transpose)}
                  </div>
                  <button className="btn-outline" onClick={() => setTranspose(t => Math.min(t+1,6))} style={{ padding:"6px 14px", fontSize:18 }}>+</button>
                  {transpose !== 0 && (
                    <button className="btn-outline" onClick={() => setTranspose(0)} style={{ fontSize:11, padding:"6px 10px" }}>Reset</button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display:"flex", gap:4, marginBottom:18, flexWrap:"wrap" }}>
            {[["chords","🎸 Acordes"],["lyrics","📝 Letra"],["info","ℹ️ Info"]].map(([id,label]) => (
              <button key={id} onClick={() => setActiveTab(id)} style={{
                background: activeTab===id ? `linear-gradient(135deg,${C.purple},${C.purpleLight})` : "transparent",
                border:`1px solid ${activeTab===id ? C.gold : C.cardBorder}`,
                color: activeTab===id ? C.gold : C.silverDim,
                borderRadius:8, padding:"8px 18px", cursor:"pointer",
                fontFamily:"'Montserrat',sans-serif", fontWeight:700, fontSize:13,
                transition:"all 0.2s",
              }}>{label}</button>
            ))}
            <button onClick={() => setLangEs(v=>!v)} className="btn-outline" style={{ marginLeft:"auto", fontSize:11 }}>
              {langEs ? "🇺🇸 English" : "🇲🇽 Español"}
            </button>
          </div>

          {/* Chords tab */}
          {activeTab === "chords" && (
            <div className="fade-in">
              {song.sections.map((sec, si) => (
                <div key={si} className="card" style={{
                  marginBottom:14,
                  animation:`fadeUp 0.35s ease ${si*0.07}s both`,
                  borderColor: sec.type==="Coro" ? C.gold+"44" : C.cardBorder,
                }}>
                  <span className="tag" style={{
                    marginBottom:12, display:"inline-block",
                    background: sec.type==="Coro" ? `${C.gold}22` : undefined,
                    borderColor: sec.type==="Coro" ? C.gold : undefined,
                    color: sec.type==="Coro" ? C.gold : undefined,
                  }}>{sec.type}</span>
                  <div style={{ display:"flex", flexWrap:"wrap", marginBottom: sec.lyrics ? 10 : 0 }}>
                    {sec.chords.map((c,ci) => (
                      <ChordBadge key={ci} chord={transposeChord(c.chord, transpose)} highlight={ci===0} delay={ci*0.05} />
                    ))}
                  </div>
                  {sec.lyrics && (
                    <p style={{ fontSize:13, color:C.silver, lineHeight:1.8, borderTop:`1px solid ${C.cardBorder}`, paddingTop:10, fontStyle:"italic" }}>
                      {langEs ? `[ES] ${sec.lyrics}` : sec.lyrics}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Lyrics tab */}
          {activeTab === "lyrics" && (
            <div className="fade-in">
              {song.sections.filter(s=>s.lyrics).map((sec,si) => (
                <div key={si} className="card" style={{ marginBottom:14, animation:`fadeUp 0.35s ease ${si*0.07}s both` }}>
                  <span className="tag" style={{ display:"inline-block", marginBottom:12 }}>{sec.type}</span>
                  <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:8 }}>
                    {sec.chords.map((c,ci) => (
                      <span key={ci} style={{
                        fontSize:11, fontWeight:800, color:C.gold,
                        background:`${C.gold}18`, borderRadius:4, padding:"1px 7px",
                        animation:`chordPop 0.3s ease ${ci*0.05}s both`,
                      }}>{transposeChord(c.chord, transpose)}</span>
                    ))}
                  </div>
                  <p style={{ fontSize:14, color:C.silver, lineHeight:1.9, fontStyle:"italic" }}>
                    {langEs ? `[Traducción] ${sec.lyrics}` : sec.lyrics}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Info tab */}
          {activeTab === "info" && (
            <div className="card fade-in">
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(180px,1fr))", gap:12 }}>
                {[
                  ["Canción",song.title],["Artista",song.artist],
                  ["BPM",song.bpm],["Tonalidad",`${NOTE_ES[currentKey]||currentKey} ${SCALES[song.scale]?.name}`],
                  ["Cejilla",song.capo?`Traste ${song.capo}`:"Sin cejilla"],["Duración",song.duration],
                  ["Secciones",song.sections.map(s=>s.type).join(", ")],
                  ["Acordes únicos",[...new Set(song.sections.flatMap(s=>s.chords.map(c=>transposeChord(c.chord,transpose))))].join(", ")],
                ].map(([label,value]) => (
                  <div key={label} style={{ padding:"12px 16px", background:C.purpleDark, borderRadius:8, border:`1px solid ${C.cardBorder}` }}>
                    <p style={{ fontSize:9, color:C.silverDim, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:4 }}>{label}</p>
                    <p style={{ fontSize:13, fontWeight:600, color:C.silver }}>{value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
