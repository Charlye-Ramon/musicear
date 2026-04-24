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
      background:`radial-gradient(ellipse at 15% 0%,#391E4E44 0%,transparent 55%),radial-gradient(ellipse at 85% 100%,#240f3655 0%,transparent 55%),#0e0614`,
      display: "flex",
      flexDirection: "column"
    }}>
      <style>{globalCSS}</style>

      {/* ── Top nav ── */}
      <nav style={{
        position:"sticky", top:0, zIndex:100,
        background:"rgba(14, 6, 20, 0.95)", /* Fondo un poco más sólido para que no se transparente el texto abajo */
        backdropFilter:"blur(10px)",
        WebkitBackdropFilter:"blur(10px)", /* Soporte para iOS */
        borderBottom:`1px solid ${C.cardBorder}`,
        boxShadow: "0 4px 30px rgba(0, 0, 0, 0.5)"
      }}>
        <div className="nav-container" style={{
          maxWidth:860, margin:"0 auto",
          display:"flex", justifyContent:"space-between", alignItems:"center",
          padding:"0 16px", height:60,
        }}>
          
          {/* Logo */}
          <div onClick={()=>setPage("home")} style={{ 
            fontFamily:"'Montserrat',sans-serif", fontWeight:800, fontSize:22, 
            color:"#fff", cursor:"pointer", letterSpacing:"-0.02em", flexShrink:0 
          }}>
            Music<span style={{ color:C.gold }}>Ear</span>
          </div>

          {/* Contenedor de Links con scroll en móvil */}
          <div className="nav-links" style={{ 
            display:"flex", gap:6, 
            overflowX: "auto", /* Permite scroll horizontal si no cabe */
            overflowY: "hidden",
            whiteSpace: "nowrap", /* Evita que los botones salten de línea */
            padding: "4px 0",
            /* Ocultar barra de scroll webkit */
            scrollbarWidth: "none", 
            msOverflowStyle: "none" 
          }}>
            <style>{`.nav-links::-webkit-scrollbar { display: none; }`}</style>

            {NAV.map(n=>(
              <button key={n.id} onClick={()=>setPage(n.id)} style={{
                background:page===n.id?`${C.gold}15`:"transparent",
                border:`1px solid ${page===n.id?`${C.gold}55`:"transparent"}`,
                color:page===n.id?C.gold:C.silverDim,
                borderRadius:8, padding:"8px 12px",
                fontFamily:"'Montserrat',sans-serif", fontWeight:700, fontSize:13,
                cursor:"pointer", transition:"all 0.2s",
                display:"flex", alignItems:"center", gap:6,
                WebkitTapHighlightColor:"transparent",
                flexShrink: 0 /* Evita que el botón se aplaste en móvil */
              }}>
                <span style={{ fontSize: 16 }}>{n.icon}</span>
                {/* En esta versión, siempre mostramos el texto, ya que el contenedor tiene scroll horizontal */}
                <span>{n.label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* ── Page ── */}
      <main style={{ maxWidth:860, margin:"0 auto", padding:"24px 14px", flexGrow: 1, width: "100%" }}>
        {page==="home"     && <Home     onNav={setPage}/>}
        {page==="practice" && <Practice/>}
        {page==="analyze"  && <Analyze/>}
        {page==="theory"   && <Theory/>}
      </main>

      <footer style={{ 
        borderTop:`1px solid ${C.cardBorder}`, 
        padding:"20px 16px", 
        textAlign:"center", color:C.silverDim, fontSize:12, letterSpacing:"0.04em",
        background: C.bg
      }}>
        MusicEar © 2025 — Hecho con ♪ para músicos
      </footer>
    </div>
  );
}