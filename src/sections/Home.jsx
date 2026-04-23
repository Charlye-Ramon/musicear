import { C } from "../styles/tokens";

const FEATURES = [
  { icon:"👂", title:"Entrenamiento de Oído", desc:"4 niveles: Principiante → Experto. Melodías reales en guitarra o piano.", tag:"Audio Real", page:"practice" },
  { icon:"🎸", title:"Visualización Musical", desc:"Ve las notas en el diapasón o el teclado. Toca cada nota para escucharla.", tag:"Guitarra + Piano", page:"practice" },
  { icon:"🎵", title:"Análisis de Canciones", desc:"Acordes, letra y tonalidad de cualquier canción. Con transposición automática.", tag:"YouTube Ready", page:"analyze" },
  { icon:"📚", title:"Teoría Musical", desc:"Aprende escalas, acordes, modos, círculo de quintas y más. 50%+ visual.", tag:"Nuevo", page:"theory" },
];

export default function Home({ onNav }) {
  return (
    <div style={{ paddingBottom:48 }}>
      {/* Hero */}
      <div className="fade-up" style={{ textAlign:"center", padding:"44px 0 36px" }}>
        <div style={{ fontSize:64, marginBottom:10, animation:"glow 3s ease-in-out infinite", lineHeight:1 }}>♪</div>
        <h1 style={{
          fontFamily:"'Montserrat',sans-serif", fontWeight:800,
          fontSize:48, lineHeight:1.05, color:"#fff",
          textShadow:`0 0 40px ${C.gold}44`, marginBottom:14,
          letterSpacing:"-0.02em",
        }}>
          Music<span style={{ color:C.gold }}>Ear</span>
        </h1>
        <p style={{ color:C.silverDim, fontSize:15, maxWidth:420, margin:"0 auto 32px", lineHeight:1.7 }}>
          Tu compañero musical para desarrollar el oído, analizar canciones y aprender teoría desde cero.
        </p>
        <div style={{ display:"flex", gap:12, justifyContent:"center", flexWrap:"wrap" }}>
          <button className="btn-gold" onClick={() => onNav("practice")} style={{ fontSize:14, padding:"13px 30px" }}>
            👂 Practicar Oído
          </button>
          <button className="btn-outline" onClick={() => onNav("theory")} style={{ fontSize:14, padding:"13px 30px" }}>
            📚 Aprender Teoría
          </button>
        </div>
      </div>

      {/* Feature grid */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(230px,1fr))", gap:14 }}>
        {FEATURES.map((f,i) => (
          <div key={i} className="card fade-up" style={{
            animationDelay:`${0.08 + i*0.07}s`,
            cursor:"pointer", transition:"all 0.25s",
          }}
            onClick={() => onNav(f.page)}
            onMouseEnter={e => { e.currentTarget.style.borderColor=C.gold+"66"; e.currentTarget.style.transform="translateY(-4px)"; e.currentTarget.style.boxShadow=`0 12px 32px ${C.gold}18`; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor=C.cardBorder; e.currentTarget.style.transform="translateY(0)"; e.currentTarget.style.boxShadow="none"; }}
          >
            <div style={{ fontSize:30, marginBottom:10 }}>{f.icon}</div>
            <span className="tag gold" style={{ marginBottom:8, display:"inline-block" }}>{f.tag}</span>
            <h3 style={{ fontFamily:"'Montserrat',sans-serif", fontWeight:800, fontSize:15, color:"#fff", marginBottom:6, marginTop:4 }}>{f.title}</h3>
            <p style={{ fontSize:12, color:C.silverDim, lineHeight:1.6 }}>{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
