export const NOTES = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];

export const NOTE_ES = {
  C:"Do", "C#":"Do#", D:"Re", "D#":"Re#", E:"Mi",
  F:"Fa", "F#":"Fa#", G:"Sol", "G#":"Sol#", A:"La", "A#":"La#", B:"Si"
};

export const SCALES = {
  major:       { name:"Mayor",              intervals:[0,2,4,5,7,9,11],  color:"#4CAF50" },
  minor:       { name:"Menor Natural",      intervals:[0,2,3,5,7,8,10],  color:"#9C27B0" },
  harmonicMin: { name:"Menor Armónica",     intervals:[0,2,3,5,7,8,11],  color:"#673AB7" },
  melodicMin:  { name:"Menor Melódica",     intervals:[0,2,3,5,7,9,11],  color:"#3F51B5" },
  pentatonicM: { name:"Pentatónica Mayor",  intervals:[0,2,4,7,9],        color:"#FF9800" },
  pentatonicm: { name:"Pentatónica Menor",  intervals:[0,3,5,7,10],       color:"#FF5722" },
  blues:       { name:"Blues",              intervals:[0,3,5,6,7,10],     color:"#2196F3" },
  dorian:      { name:"Dórico (Modal)",     intervals:[0,2,3,5,7,9,10],  color:"#00BCD4" },
  mixolydian:  { name:"Mixolidio (Modal)",  intervals:[0,2,4,5,7,9,10],  color:"#8BC34A" },
  lydian:      { name:"Lidio (Modal)",      intervals:[0,2,4,6,7,9,11],  color:"#CDDC39" },
  phrygian:    { name:"Frigio (Modal)",     intervals:[0,1,3,5,7,8,10],  color:"#F44336" },
  locrian:     { name:"Locrio (Modal)",     intervals:[0,1,3,5,6,8,10],  color:"#795548" },
  chromatic:   { name:"Cromática",          intervals:[0,1,2,3,4,5,6,7,8,9,10,11], color:"#607D8B" },
};

export const LEVELS = [
  { id:"beginner",     label:"Principiante", icon:"🌱", noteCount:4, tempo:0.75 },
  { id:"intermediate", label:"Intermedio",   icon:"🎸", noteCount:6, tempo:0.58 },
  { id:"advanced",     label:"Avanzado",     icon:"🔥", noteCount:8, tempo:0.42 },
  { id:"expert",       label:"Experto",      icon:"⚡", noteCount:10,tempo:0.28 },
];

export const INSTRUMENTS = [
  { id:"guitar", label:"Guitarra" },
  { id:"piano",  label:"Piano" },
];

export const GUITAR_OPEN_SEMITONES = [4,9,2,7,11,4]; // E A D G B E from C
export const GUITAR_STRING_NAMES   = ["E","B","G","D","A","E"];

// Circle of fifths order
export const CIRCLE_OF_FIFTHS = ["C","G","D","A","E","B","F#","C#","G#","D#","A#","F"];

export function getNoteIndex(note) {
  return NOTES.indexOf(note);
}

export function transposeNote(note, semitones) {
  const idx = getNoteIndex(note);
  return NOTES[(idx + semitones + 120) % 12];
}

export function getScaleNotes(root, scaleKey) {
  const rootIdx = getNoteIndex(root);
  return SCALES[scaleKey].intervals.map(i => NOTES[(rootIdx + i) % 12]);
}

export function generateMelody(root, scaleKey, level) {
  const scale = getScaleNotes(root, scaleKey);
  const lvl = LEVELS.find(l => l.id === level) || LEVELS[0];
  const melody = [];
  for (let i = 0; i < lvl.noteCount; i++) {
    melody.push(scale[Math.floor(Math.random() * scale.length)]);
  }
  return melody;
}

// Chord progressions by scale type
const ROMAN_MAJOR = { I:0, ii:1, iii:2, IV:3, V:4, vi:5, vii:6 };
const ROMAN_MINOR = { i:0, ii:1, III:2, iv:3, v:4, VI:5, VII:6 };
const PROGS_MAJOR = [["I","IV","V","I"],["I","V","vi","IV"],["ii","V","I","I"]];
const PROGS_MINOR = [["i","iv","v","i"],["i","VI","III","VII"],["i","VII","VI","VII"]];

export function getChords(root, scaleKey, progIdx = 0) {
  const isMinor = ["minor","harmonicMin","melodicMin","phrygian","dorian","locrian"].includes(scaleKey);
  const prog = isMinor ? PROGS_MINOR[progIdx % 3] : PROGS_MAJOR[progIdx % 3];
  const scale = getScaleNotes(root, scaleKey);
  const romanMap = isMinor ? ROMAN_MINOR : ROMAN_MAJOR;
  return prog.map(roman => {
    const degree = romanMap[roman] ?? 0;
    return { roman, root: scale[degree] ?? root, minor: roman === roman.toLowerCase() };
  });
}

// Theory content for the Theory section
export const THEORY_TOPICS = [
  {
    id: "intervals",
    icon: "📏",
    title: "Intervalos y Semitonos",
    subtitle: "La base de toda la música",
    color: "#D4A413",
    content: `Un intervalo es la distancia entre dos notas. La unidad mínima es el semitono (1 traste en guitarra, 1 tecla en piano). Dos semitonos forman un tono. Todo en música —escalas, acordes, melodías— se construye con estas distancias.`,
    visual: "intervals",
  },
  {
    id: "major_scale",
    icon: "🎼",
    title: "Escala Mayor",
    subtitle: "Tono - Tono - Semitono - Tono - Tono - Tono - Semitono",
    color: "#4CAF50",
    content: `La escala mayor es la más usada en música occidental. Su fórmula es: T-T-S-T-T-T-S (Tono=2 semitonos, Semitono=1). Suena alegre y brillante. Cada nota tiene un número de grado (1°,2°,3°... 7°) y los acordes se construyen sobre esos grados.`,
    visual: "scale",
    scaleKey: "major",
  },
  {
    id: "minor_scale",
    icon: "🌙",
    title: "Escala Menor Natural",
    subtitle: "Tono - Semitono - Tono - Tono - Semitono - Tono - Tono",
    color: "#9C27B0",
    content: `La escala menor suena oscura, melancólica. Es la misma que la mayor pero empezando desde el 6° grado (relativa menor). Por ejemplo: Do Mayor y La Menor usan exactamente las mismas notas. La Menor Armónica sube el 7° grado medio tono para crear tensión hacia la tónica.`,
    visual: "scale",
    scaleKey: "minor",
  },
  {
    id: "pentatonic",
    icon: "✋",
    title: "Escala Pentatónica",
    subtitle: "5 notas. La favorita de los guitarristas.",
    color: "#FF9800",
    content: `La pentatónica es la escala más usada en rock, blues y pop. Tiene solo 5 notas (de ahí "penta"). La menor pentatónica se forma quitando el 2° y 6° grado de la menor natural. Es casi imposible sonar mal con ella — perfecta para improvisar.`,
    visual: "scale",
    scaleKey: "pentatonicm",
  },
  {
    id: "blues",
    icon: "🎷",
    title: "Escala de Blues",
    subtitle: "Pentatónica + la nota blue (b5)",
    color: "#2196F3",
    content: `La escala blues es la pentatónica menor con una nota extra: el tritono o "blue note" (b5). Esta nota crea esa tensión característica del blues y el jazz. Es la diferencia entre sonar "pentatónico" y sonar "bluesy". Usada por BB King, Stevie Ray Vaughan, Eric Clapton.`,
    visual: "scale",
    scaleKey: "blues",
  },
  {
    id: "modes",
    icon: "🔮",
    title: "Modos de la Escala Mayor",
    subtitle: "Dórico · Frigio · Lidio · Mixolidio · Eólico · Locrio",
    color: "#00BCD4",
    content: `Los 7 modos son la misma escala mayor iniciada desde cada uno de sus 7 grados. Cada modo tiene un carácter distinto: Dórico (minor con 6° mayor, usado en jazz/funk), Frigio (oscuro/flamenco), Lidio (misterioso, raise 4th), Mixolidio (dominante, rock/blues), Locrio (el más oscuro, raro).`,
    visual: "modes",
  },
  {
    id: "chords",
    icon: "🎹",
    title: "Cómo Forman los Acordes",
    subtitle: "Triadas y cuatríadas",
    color: "#E91E63",
    content: `Un acorde se forma apilando terceras sobre una nota raíz. Una triada (acorde de 3 notas) tiene raíz + tercera + quinta. Mayor: 1-3-5 (tercera mayor + quinta justa). Menor: 1-b3-5 (tercera menor + quinta justa). Disminuido: 1-b3-b5. Los acordes con 7ma agregan color y tensión.`,
    visual: "chords",
  },
  {
    id: "circle",
    icon: "⭕",
    title: "Círculo de Quintas",
    subtitle: "El mapa de toda la música tonal",
    color: "#D4A413",
    content: `El círculo de quintas organiza las 12 tonalidades en un círculo. Cada paso en el sentido de las agujas del reloj sube una quinta (7 semitonos). Las tonalidades adyacentes comparten casi todas sus notas, por eso es fácil modular entre ellas. Los acordes I, IV y V de cualquier tonalidad están siempre juntos en el círculo.`,
    visual: "circle",
  },
  {
    id: "bpm",
    icon: "🥁",
    title: "Tiempo, Compás y BPM",
    subtitle: "El ritmo que mueve la música",
    color: "#FF5722",
    content: `BPM (Beats Per Minute) indica la velocidad de la canción. 60 BPM = 1 pulso por segundo. El compás organiza esos pulsos en grupos: 4/4 (el más común, 4 tiempos por compás), 3/4 (vals), 6/8 (sentimiento de 2 grupos de 3). Saber el BPM te ayuda a tocar en tiempo y a identificar el género.`,
    visual: "bpm",
  },
  {
    id: "ear_training",
    icon: "👂",
    title: "Cómo Sacar Canciones a Oído",
    subtitle: "Método paso a paso",
    color: "#8BC34A",
    content: `1. Encuentra la tonalidad: toca notas hasta encontrar la que "descansa" al final. 2. Identifica si es mayor o menor por su sonido emocional. 3. Usa la escala pentatónica —casi toda la melodía estará ahí. 4. Para acordes: el I, IV y V son los más comunes (ej: en Do Mayor = Do, Fa, Sol). 5. Escucha los cambios de acorde como "momentos de tensión y resolución".`,
    visual: "ear",
  },
];
