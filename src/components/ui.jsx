import { C } from "../styles/tokens";

export function WaveForm({ playing, color = C.gold }) {
  const delays = [0.0, 0.15, 0.3, 0.0, 0.2, 0.1, 0.25, 0.05, 0.18];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 3, height: 26 }}>
      {delays.map((d, i) => (
        <div key={i} style={{
          width: 3, borderRadius: 2,
          background: color,
          height: playing ? undefined : 4,
          animation: playing ? `waveBar ${0.55 + d * 0.6}s ease-in-out infinite` : "none",
          animationDelay: `${d}s`,
          transition: "height 0.3s",
          opacity: playing ? 1 : 0.4,
        }} />
      ))}
    </div>
  );
}

export function ChordBadge({ chord, highlight, delay = 0 }) {
  return (
    <span className="chord-pop" style={{
      display: "inline-block",
      background: highlight
        ? `linear-gradient(135deg, ${C.gold}, ${C.goldLight})`
        : `${C.purple}99`,
      color: highlight ? C.black : C.gold,
      border: `1px solid ${highlight ? C.gold : C.gold + "44"}`,
      borderRadius: 6, padding: "3px 10px",
      fontSize: 13, fontWeight: 800,
      marginRight: 6, marginBottom: 4,
      animationDelay: `${delay}s`,
      cursor: "default",
      transition: "all 0.2s",
      letterSpacing: "0.02em",
    }}>
      {chord}
    </span>
  );
}
