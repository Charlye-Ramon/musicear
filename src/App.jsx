import { useState } from "react";
import { C, globalCSS } from "./styles/tokens";
import Home     from "./sections/Home";
import Practice from "./sections/Practice";
import Analyze  from "./sections/Analyze";
import Theory   from "./sections/Theory";

const NAV = [
  { id:"home",     icon:"⬡",  label:"Inicio" },
  { id:"practice", icon:"👂", label:"Práctica" },
  { id:"analyze",  icon:"🎵", label:"Analizar" },
  { id:"theory",   icon:"📚", label:"Teoría" },
];

export default function App() {
  const [page, setPage] = useState("home");

  return (
    <div style={{
      minHeight:"100vh",
      background:`
        radial-gradient(ellipse at 15% 0%, ${C.purple}44 0%, transparent 55%),
        radial-gradient(ellipse at 85% 100%, ${C.purpleDark}55 0%, transparent 55%),
        ${C.bg}
      `,
    }}>
      <style>{globalCSS}</style>

      {/* Navbar */}
      <nav style={{
        position:"sticky", top:0, zIndex:100,
        background:`${C.bg}ee`, backdropFilter:"blur(20px)",
        borderBottom:`1px solid ${C.cardBorder}`,
      }}>
        <div style={{
          maxWidth:860, margin:"0 auto",
          display:"flex", justifyContent:"space-between", alignItems:"center",
          padding:"0 20px", height:58,
        }}>
          <div
            onClick={() => setPage("home")}
            style={{
              fontFamily:"'Montserrat',sans-serif", fontWeight:800,
              fontSize:22, color:"#fff", cursor:"pointer",
              letterSpacing:"-0.02em",
            }}
          >
            Music<span style={{ color:C.gold }}>Ear</span>
          </div>

          <div style={{ display:"flex", gap:3 }}>
            {NAV.map(n => (
              <button key={n.id} onClick={() => setPage(n.id)} style={{
                background: page===n.id ? `${C.gold}15` : "transparent",
                border:`1px solid ${page===n.id ? C.gold+"55" : "transparent"}`,
                color: page===n.id ? C.gold : C.silverDim,
                borderRadius:8, padding:"6px 13px",
                fontFamily:"'Montserrat',sans-serif",
                fontWeight:700, fontSize:12, cursor:"pointer",
                transition:"all 0.2s", letterSpacing:"0.03em",
                display:"flex", alignItems:"center", gap:5,
              }}>
                <span>{n.icon}</span>
                <span>{n.label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Page content */}
      <main style={{ maxWidth:860, margin:"0 auto", padding:"32px 20px" }}>
        {page === "home"     && <Home     onNav={setPage} />}
        {page === "practice" && <Practice />}
        {page === "analyze"  && <Analyze  />}
        {page === "theory"   && <Theory   />}
      </main>

      <footer style={{
        borderTop:`1px solid ${C.cardBorder}`,
        padding:"14px 20px", textAlign:"center",
        color:C.silverDim, fontSize:11, letterSpacing:"0.04em",
      }}>
        MusicEar © 2025 — Hecho con ♪ para músicos
      </footer>
    </div>
  );
}
