import { useState, useRef, useCallback, useEffect } from "react";
import * as Tone from "tone";

function buildPianoSynth() {
  const piano = new Tone.PolySynth(Tone.FMSynth, {
    harmonicity: 3, modulationIndex: 8,
    oscillator: { type: "sine" },
    envelope: { attack: 0.01, decay: 1.5, sustain: 0.1, release: 1.5 },
    modulation: { type: "square" },
    modulationEnvelope: { attack: 0.01, decay: 0.4, sustain: 0, release: 0.4 },
    volume: -6
  });
  const reverb = new Tone.Reverb({ decay: 2.5, wet: 0.3 }).toDestination();
  piano.connect(reverb);
  return {
    triggerAttackRelease: (note, duration, time) => piano.triggerAttackRelease(note, duration, time),
    releaseAll: () => piano.releaseAll(),
    dispose: () => { piano.dispose(); reverb.dispose(); }
  };
}

function buildGuitarSynth(mode = "clean") {
  const string = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: mode === "overdrive" ? "sawtooth" : "pwm", modulationFrequency: 0.2 },
    envelope: { attack: 0.005, decay: 0.6, sustain: 0.05, release: 1.2 },
    volume: mode === "overdrive" ? -2 : -4,
  });
  const eq = new Tone.EQ3({ low: 2, mid: -2, high: 0 });
  const reverb = new Tone.Reverb({ decay: 1.5, wet: 0.25 }).toDestination();
  let effectsChain = [eq];
  if (mode === "overdrive") {
    const distortion = new Tone.Distortion({ distortion: 0.5, wet: 0.8 });
    const filter = new Tone.Filter(3500, "lowpass");
    effectsChain.push(distortion, filter);
  } else {
    const chorus = new Tone.Chorus({ frequency: 2, delayTime: 2.5, depth: 0.3, wet: 0.2 }).start();
    effectsChain.push(chorus);
  }
  effectsChain.push(reverb);
  string.chain(...effectsChain);
  return {
    triggerAttackRelease: (note, duration, time) => string.triggerAttackRelease(note, duration, time),
    releaseAll: () => string.releaseAll(),
    dispose: () => { string.dispose(); eq.dispose(); reverb.dispose(); }
  };
}

export function useAudio() {
  const [guitarMode, setGuitarMode] = useState("clean");
  const [loading, setLoading] = useState(false);
  const synths = useRef({ piano: null, guitarClean: null, guitarDist: null });

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      try {
        synths.current = {
          piano: buildPianoSynth(),
          guitarClean: buildGuitarSynth("clean"),
          guitarDist: buildGuitarSynth("overdrive")
        };
        setLoading(false);
      } catch (error) {
        console.error("Error building synths:", error);
        setLoading(false);
      }
    }, 150);
    return () => { Object.values(synths.current).forEach(s => s && s.dispose()); };
  }, []);

  const stop = useCallback(() => {
    Tone.Transport.stop();
    Tone.Transport.cancel(0);
    Object.values(synths.current).forEach(synth => { if (synth) synth.releaseAll(); });
  }, []);

  const playNote = useCallback(async (noteName, instrument = "piano", octave = 4) => {
    if (loading) return;
    await Tone.start();
    const toneNote = /[0-9]/.test(noteName) ? noteName : `${noteName}${octave}`;
    let activeSynth = instrument === "piano"
      ? synths.current.piano
      : (guitarMode === "overdrive" ? synths.current.guitarDist : synths.current.guitarClean);
    if (activeSynth) activeSynth.triggerAttackRelease(toneNote, "8n", Tone.now());
  }, [guitarMode, loading]);

  const playMelody = useCallback(async (melody, instrument = "guitar", tempo = 0.6, onNote, onDone) => {
    if (loading) return;
    await Tone.start();
    stop();
    let activeSynth = instrument === "piano"
      ? synths.current.piano
      : (guitarMode === "overdrive" ? synths.current.guitarDist : synths.current.guitarClean);
    if (!activeSynth) return;
    let timeOffset = Tone.now() + 0.1;
    melody.forEach((note, i) => {
      const toneNote = /[0-9]/.test(note) ? note : `${note}4`;
      activeSynth.triggerAttackRelease(toneNote, "8n", timeOffset);
      const msDelay = (timeOffset - Tone.now()) * 1000;
      setTimeout(() => { if (onNote) onNote(i); }, msDelay);
      timeOffset += tempo;
    });
    const totalMs = (timeOffset - Tone.now()) * 1000;
    setTimeout(() => { if (onDone) onDone(); }, totalMs);
  }, [guitarMode, stop, loading]);

  return { playMelody, playNote, stop, guitarMode, setGuitarMode, loading };
}
