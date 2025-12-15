
import { DayTopic } from "./types";

export const APP_VERSION = '0.0.10';

export const STAGES: DayTopic[] = [
  // --- VERBOS (50 Palabras) ---
  {
    id: 1,
    title: "Nivel 1: El Núcleo",
    description: "Los 50 verbos más usados (Be, Have, Do, Make, Go, Come, Take...)",
    icon: "🧬",
    phase: "Fase 1: La Base",
    level: "A1",
    category: 'verbs',
    wordCount: 50
  },
  {
    id: 2,
    title: "Nivel 2: Supervivencia",
    description: "Cuerpo y necesidades (Eat, Drink, Sleep, Wake, Wash, Help...)",
    icon: "🍎",
    phase: "Fase 1: La Base",
    level: "A1",
    category: 'verbs',
    wordCount: 50
  },
  {
    id: 3,
    title: "Nivel 3: Movimiento",
    description: "Espacio y desplazamiento (Run, Walk, Fly, Enter, Leave, Turn...)",
    icon: "🏃",
    phase: "Fase 1: La Base",
    level: "A1",
    category: 'verbs',
    wordCount: 50
  },
  {
    id: 4,
    title: "Nivel 4: Modificadores",
    description: "Modales y Permisos (Can, Must, Should, Allow, Let, Dare...)",
    icon: "🚦",
    phase: "Fase 2: Interacción",
    level: "A2",
    category: 'verbs',
    wordCount: 50
  },
  {
    id: 5,
    title: "Nivel 5: Comunicación",
    description: "Hablar y escribir (Say, Tell, Speak, Ask, Answer, Call, Explain...)",
    icon: "🗣️",
    phase: "Fase 2: Interacción",
    level: "A2",
    category: 'verbs',
    wordCount: 50
  },
  {
    id: 6,
    title: "Nivel 6: Rutina y Ocio",
    description: "Vida diaria (Play, Watch, Listen, Read, Write, Enjoy, Wait...)",
    icon: "🎮",
    phase: "Fase 2: Interacción",
    level: "B1",
    category: 'verbs',
    wordCount: 50
  },
  {
    id: 7,
    title: "Nivel 7: El Caos (Irregulares)",
    description: "Irregulares Pack 1 - 3 Columnas (Bring, Buy, Catch, Teach...)",
    icon: "🌪️",
    phase: "Fase 3: Pasado y Mente",
    level: "B1",
    category: 'verbs',
    wordCount: 50
  },
  {
    id: 8,
    title: "Nivel 8: Posesión",
    description: "Dinero y negocios (Buy, Sell, Pay, Cost, Spend, Earn, Lose...)",
    icon: "💰",
    phase: "Fase 3: Pasado y Mente",
    level: "B1",
    category: 'verbs',
    wordCount: 50
  },
  {
    id: 9,
    title: "Nivel 9: Procesos Mentales",
    description: "Pensar y sentir (Think, Know, Learn, Forget, Remember, Dream...)",
    icon: "🧠",
    phase: "Fase 3: Pasado y Mente",
    level: "B2",
    category: 'verbs',
    wordCount: 50
  },
  {
    id: 10,
    title: "Nivel 10: Patrones (Irregulares)",
    description: "Irregulares Pack 2 - Por sonido (Ring/Rang/Rung, Sing/Sang/Sung...)",
    icon: "🎶",
    phase: "Fase 4: Perfeccionamiento",
    level: "B2",
    category: 'verbs',
    wordCount: 50
  },
  {
    id: 11,
    title: "Nivel 11: Sentidos",
    description: "Percepción y Emoción (See, Look, Hear, Sound, Touch, Smell...)",
    icon: "👁️",
    phase: "Fase 4: Perfeccionamiento",
    level: "C1",
    category: 'verbs',
    wordCount: 50
  },
  {
    id: 12,
    title: "Nivel 12: Profesional",
    description: "Mundo académico/laboral (Accept, Develop, Manage, Plan, Achieve...)",
    icon: "💼",
    phase: "Fase 4: Perfeccionamiento",
    level: "C1",
    category: 'verbs',
    wordCount: 50
  },
  {
    id: 13,
    title: "Nivel 13: Boss Final",
    description: "Phrasal Verbs Indispensables (Get up, Put on, Look for, Give up...)",
    icon: "👑",
    phase: "Fase 5: Maestría",
    level: "C2",
    category: 'verbs',
    wordCount: 50
  },

  // --- ADJETIVOS (40 Palabras) ---
  {
    id: 101,
    title: "Adj. Nivel 1: Descriptivos",
    description: "Colores, Tamaños y Formas básicas (Big, Small, Red, Round...)",
    icon: "🎨",
    phase: "Fase 1: Cualidades",
    level: "A1",
    category: 'adjectives',
    wordCount: 40
  },
  {
    id: 102,
    title: "Adj. Nivel 2: Personalidad",
    description: "Carácter y emociones básicas (Happy, Sad, Angry, Brave, Honest...)",
    icon: "😊",
    phase: "Fase 1: Cualidades",
    level: "A2",
    category: 'adjectives',
    wordCount: 40
  },
  {
    id: 103,
    title: "Adj. Nivel 3: Sensoriales",
    description: "Tacto, Sabor y Clima (Cold, Hot, Sweet, Spicy, Rough...)",
    icon: "❄️",
    phase: "Fase 2: Percepción",
    level: "B1",
    category: 'adjectives',
    wordCount: 40
  },
  {
    id: 104,
    title: "Adj. Nivel 4: Abstractos",
    description: "Conceptos generales (Efficient, Reliable, Necessary, Possible...)",
    icon: "💡",
    phase: "Fase 2: Percepción",
    level: "B2",
    category: 'adjectives',
    wordCount: 40
  },
  {
    id: 105,
    title: "Adj. Nivel 5: Emociones Matizadas",
    description: "Sentimientos complejos (Anxious, Excited, Bored, Lonely, Nervous...)",
    icon: "🎭",
    phase: "Fase 3: Profundidad",
    level: "B2",
    category: 'adjectives',
    wordCount: 40
  },
  {
    id: 106,
    title: "Adj. Nivel 6: Personalidad II",
    description: "Rasgos de carácter avanzados (Stubborn, Generous, Polite, Rude, Selfish...)",
    icon: "🧠",
    phase: "Fase 3: Profundidad",
    level: "B2",
    category: 'adjectives',
    wordCount: 40
  },
  {
    id: 107,
    title: "Adj. Nivel 7: Tiempo y Velocidad",
    description: "Duración y ritmo (Sudden, Annual, Brief, Urgent, Constant...)",
    icon: "⏱️",
    phase: "Fase 4: Precisión",
    level: "C1",
    category: 'adjectives',
    wordCount: 40
  },
  {
    id: 108,
    title: "Adj. Nivel 8: Materiales y Estado",
    description: "Físico y texturas (Wooden, Smooth, Rough, Sharp, Broken...)",
    icon: "🧱",
    phase: "Fase 4: Precisión",
    level: "C1",
    category: 'adjectives',
    wordCount: 40
  },
  {
    id: 109,
    title: "Adj. Nivel 9: Juicios de Valor",
    description: "Opinión y Calidad (Wonderful, Awful, Strange, Typical, Outstanding...)",
    icon: "🌟",
    phase: "Fase 5: Maestría",
    level: "C1",
    category: 'adjectives',
    wordCount: 40
  },
  {
    id: 110,
    title: "Adj. Nivel 10: Académico",
    description: "Intelectual y Formal (Theoretical, Empirical, Cognitive, Valid, Significant...)",
    icon: "🎓",
    phase: "Fase 5: Maestría",
    level: "C2",
    category: 'adjectives',
    wordCount: 40
  },
  {
    id: 111,
    title: "Adj. Nivel 11: Literario",
    description: "Estilo descriptivo avanzado (Ethereal, Vivid, Stark, Gloomy, Luminous...)",
    icon: "📜",
    phase: "Fase 5: Maestría C2",
    level: "C2",
    category: 'adjectives',
    wordCount: 40
  },
  {
    id: 112,
    title: "Adj. Nivel 12: Filosófico",
    description: "Existencia y lógica (Intrinsic, Ambiguous, Subjective, Absolute, Infinite...)",
    icon: "🤔",
    phase: "Fase 5: Maestría C2",
    level: "C2",
    category: 'adjectives',
    wordCount: 40
  },

  // --- SUSTANTIVOS (40 Palabras) ---
  {
    id: 201,
    title: "Sus. Nivel 1: Entorno Inmediato",
    description: "Casa y Familia (House, Door, Mother, Father, Friend...)",
    icon: "🏠",
    phase: "Fase 1: Lo Tangible",
    level: "A1",
    category: 'nouns',
    wordCount: 40
  },
  {
    id: 202,
    title: "Sus. Nivel 2: Ciudad y Trabajo",
    description: "Lugares y Profesiones (Street, Office, Doctor, Teacher, Car...)",
    icon: "🏢",
    phase: "Fase 1: Lo Tangible",
    level: "A2",
    category: 'nouns',
    wordCount: 40
  },
  {
    id: 203,
    title: "Sus. Nivel 3: Naturaleza y Tiempo",
    description: "Mundo natural y unidades de tiempo (Tree, Water, Week, Year, World...)",
    icon: "🌳",
    phase: "Fase 2: El Mundo",
    level: "B1",
    category: 'nouns',
    wordCount: 40
  },
  {
    id: 204,
    title: "Sus. Nivel 4: Conceptos Generales",
    description: "Ideas básicas (Idea, Problem, Solution, System, Freedom...)",
    icon: "💭",
    phase: "Fase 2: El Mundo",
    level: "B2",
    category: 'nouns',
    wordCount: 40
  },
  {
    id: 205,
    title: "Sus. Nivel 5: Tecnología",
    description: "Mundo digital (Screen, Data, Network, Device, User...)",
    icon: "💻",
    phase: "Fase 3: Sociedad",
    level: "B2",
    category: 'nouns',
    wordCount: 40
  },
  {
    id: 206,
    title: "Sus. Nivel 6: Negocios",
    description: "Economía y Empresa (Profit, Loss, Market, Deal, Risk...)",
    icon: "📈",
    phase: "Fase 3: Sociedad",
    level: "B2",
    category: 'nouns',
    wordCount: 40
  },
  {
    id: 207,
    title: "Sus. Nivel 7: Gobierno y Ley",
    description: "Política y Justicia (Law, Right, Vote, Tax, Court...)",
    icon: "⚖️",
    phase: "Fase 4: Estructuras",
    level: "C1",
    category: 'nouns',
    wordCount: 40
  },
  {
    id: 208,
    title: "Sus. Nivel 8: Salud",
    description: "Cuerpo y Medicina (Pain, Cure, Virus, Blood, Brain...)",
    icon: "🩺",
    phase: "Fase 4: Estructuras",
    level: "C1",
    category: 'nouns',
    wordCount: 40
  },
  {
    id: 209,
    title: "Sus. Nivel 9: Arte y Cultura",
    description: "Creatividad (Music, Film, Style, Design, Art...)",
    icon: "🎭",
    phase: "Fase 5: Abstracción",
    level: "C1",
    category: 'nouns',
    wordCount: 40
  },
  {
    id: 210,
    title: "Sus. Nivel 10: Ciencia",
    description: "Conocimiento (Theory, Energy, Space, Cell, Fact...)",
    icon: "🧪",
    phase: "Fase 5: Abstracción",
    level: "C2",
    category: 'nouns',
    wordCount: 40
  },
  {
    id: 211,
    title: "Sus. Nivel 11: Sociedad Global",
    description: "Fenómenos Mundiales (Crisis, Poverty, Climate, Migration, Infrastructure...)",
    icon: "🌍",
    phase: "Fase 5: Maestría C2",
    level: "C2",
    category: 'nouns',
    wordCount: 40
  },
  {
    id: 212,
    title: "Sus. Nivel 12: Condición Humana",
    description: "Existencia y Metafísica (Soul, Fate, Consciousness, Mortality, Instinct...)",
    icon: "🧘",
    phase: "Fase 5: Maestría C2",
    level: "C2",
    category: 'nouns',
    wordCount: 40
  },

  // --- ADVERBIOS (40 Palabras por nivel) ---
  {
    id: 301,
    title: "Adv. Nivel 1: Frecuencia",
    description: "Tiempo y repetición (Always, Never, Often, Sometimes, Yesterday...)",
    icon: "📅",
    phase: "Fase 1: Modificadores",
    level: "A1",
    category: 'adverbs',
    wordCount: 40
  },
  {
    id: 302,
    title: "Adv. Nivel 2: Modo",
    description: "Cómo se hacen las cosas (Quickly, Slowly, Well, Badly, Easily...)",
    icon: "⚡",
    phase: "Fase 1: Modificadores",
    level: "A2",
    category: 'adverbs',
    wordCount: 40
  },
  {
    id: 303,
    title: "Adv. Nivel 3: Cantidad y Grado",
    description: "Intensidad (Very, Too, Enough, Quite, Almost...)",
    icon: "📊",
    phase: "Fase 2: Precisión",
    level: "B1",
    category: 'adverbs',
    wordCount: 40
  },
  {
    id: 304,
    title: "Adv. Nivel 4: Conectores Lógicos",
    description: "Estructura del discurso (However, Therefore, Furthermore, Instead, Meanwhile...)",
    icon: "🔗",
    phase: "Fase 4: Fluidez C1",
    level: "C1",
    category: 'adverbs',
    wordCount: 40
  },
  {
    id: 305,
    title: "Adv. Nivel 5: Opinión y Certeza",
    description: "Matices y Postura (Undoubtedly, Presumably, Frankly, Ideally, Allegedly...)",
    icon: "🧐",
    phase: "Fase 5: Maestría C2",
    level: "C2",
    category: 'adverbs',
    wordCount: 40
  }
];
