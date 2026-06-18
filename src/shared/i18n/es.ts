// UI string catalogue (Spanish). Single source for user-facing copy so it can
// be translated later without touching components. Decorative mono "chrome"
// tags (e.g. "SCAN // 001", "READOUT") stay inline — they're visual identity.

export const es = {
  common: {
    save: "GUARDAR",
    cancel: "CANCELAR",
    discard: "DESCARTAR",
    close: "CERRAR ×",
    back: "← VOLVER",
    loading: "CARGANDO...",
    retry: "Reintenta",
  },

  onboarding: {
    code: "SETUP // 000",
    title: "CALIBRACIÓN",
    intro: "Calculamos tus objetivos diarios (Mifflin-St Jeor). Puedes ajustarlos luego en tu perfil.",
    sex: "SEXO",
    male: "HOMBRE",
    female: "MUJER",
    age: "EDAD",
    ageUnit: "años",
    height: "ALTURA",
    weight: "PESO",
    activity: "ACTIVIDAD",
    goalLabel: "OBJETIVO",
    computed: "OBJETIVOS // CALCULADOS",
    start: "EMPEZAR →",
    saving: "GUARDANDO...",
    saveError: "No se pudo guardar. Reintenta.",
  },

  activity: {
    sedentary: "Sedentario",
    light: "Ligero (1-2 d/sem)",
    moderate: "Moderado (3-4 d/sem)",
    active: "Activo (5-6 d/sem)",
    very_active: "Muy activo (diario)",
  },

  goal: {
    lose: "Perder grasa",
    maintain: "Mantener",
    gain: "Ganar músculo",
  },

  scan: {
    awaiting: "AWAITING SPECIMEN",
    capturePhoto: "CAPTURE A PHOTO",
    openCamera: "ABRIR CÁMARA",
    analyzeFailed: "Análisis fallido. Reintenta o usa el log manual.",
    saveError: "No se pudo guardar el registro.",
    confirmLog: "CONFIRMAR & LOG",
    addNote: "+ AÑADIR NOTA",
    logged: "SPECIMEN LOGGED",
    saveFrequent: "★ GUARDAR EN FRECUENTES",
    backToToday: "VOLVER A HOY ↩",
  },

  plate: {
    sectionTitle: "VALIDAR PLATO",
    capturePrompt: "FOTOGRAFÍA TU PLATO",
    evaluating: "EVALUANDO BALANCE...",
    target: "OBJETIVO · ½ VERD/FRUTA · ¼ CEREALES · ¼ PROTEÍNA",
    recommendation: "RECOMENDACIÓN",
    validateAnother: "VALIDAR OTRO",
    done: "LISTO",
    addToLog: "+ AÑADIR BALANCE DE PLATO",
    removeFromLog: "QUITAR ×",
  },

  insights: {
    caloriesOver: (c: number, t: number) => `Te pasaste de calorías (${c}/${t} kcal).`,
    proteinLow: (c: number, t: number) => `Vas corto de proteína (${c}/${t} g).`,
    sugarHigh: (g: number) => `Azúcar alto hoy (${g} g).`,
    fiberLow: (g: number) => `Poca fibra (${g} g) — suma verduras o fruta.`,
    plateLow: (avg: number) => `Balance de plato bajo hoy (${avg}/100).`,
    onTrack: "Buen día: tus macros van en rango.",
  },

  hydration: {
    title: "HIDRATACIÓN",
  },

  workout: {
    title: "ENTRENO // 7D",
    kinds: { Pesas: "PESAS", Cardio: "CARDIO", Otro: "OTRO" },
  },

  habit: {
    title: "PRIMEROS PASOS",
    steps: {
      log: "Registra tu primera comida",
      plate: "Valida un plato (balance)",
      friend: "Suma un amigo en Social",
      streak: "Llega a 3 días de racha",
    },
  },

  today: {
    scanCta: "ANALIZAR PLATO",
    scanHint: "Cámara → IA → Macros",
    manual: "+ MANUAL",
    validatePlate: "◐ VALIDAR PLATO",
    logsByMeal: "LOGS // BY MEAL",
    noLogs: "SIN REGISTROS",
    noLogsHint: "Escanea tu primera comida del día",
  },

  social: {
    title: "SOCIAL",
    alliesCount: (n: number) => `${n} ALIADOS`,
    addByEmail: "AÑADIR POR EMAIL",
    emailPlaceholder: "amigo@email.com",
    send: "ENVIAR",
    requests: "SOLICITUDES",
    accept: "ACEPTAR",
    allies: "ALIADOS",
    noAllies: "AÚN SIN ALIADOS",
    confirmRemove: "¿Eliminar a este amigo?",
    anon: "Anónimo",
    leaderboard: "RANKING // 7D",
    colOperator: "OPERADOR",
    colStreak: "RACHA",
    colPlate: "PLATO",
    colGym: "GYM",
    you: " · TÚ",
    requestResult: {
      ok: "Solicitud enviada.",
      not_found: "No hay ningún usuario con ese email.",
      self: "Ese eres tú.",
      exists: "Ya tienes relación con ese usuario.",
      error: "No se pudo enviar. Reintenta.",
    },
  },

  challenges: {
    title: "RETOS",
    create: "+ CREAR",
    namePlaceholder: "Nombre del reto",
    goalWord: "META",
    days: "días",
    createBtn: "CREAR RETO",
    none: "SIN RETOS ACTIVOS",
    join: "UNIRME",
    leave: "SALIR",
    metric: {
      log_days: "Días registrando",
      plate_days: "Días con plato ≥80",
    },
  },

  achievements: {
    title: "LOGROS",
    badges: {
      first_log: { label: "INICIADO", desc: "Tu primer registro" },
      logs_50: { label: "CONSTANTE", desc: "50 registros" },
      logs_100: { label: "VETERANO", desc: "100 registros" },
      streak_7: { label: "RACHA 7", desc: "7 días seguidos" },
      streak_30: { label: "RACHA 30", desc: "30 días seguidos" },
      days_30: { label: "MES ACTIVO", desc: "30 días registrados" },
      plate_perfect: { label: "PLATO PERFECTO", desc: "Balance 100" },
      first_ally: { label: "ALIADO", desc: "Tu primer amigo" },
    },
  },

  notifications: {
    title: "NOTIFICACIONES",
    enabled: "◆ ACTIVADAS",
    blocked: "BLOQUEADAS — ACTÍVALAS EN LOS AJUSTES DEL NAVEGADOR",
    enable: "ACTIVAR RECORDATORIOS",
    working: "ACTIVANDO...",
  },

  account: {
    signOut: "CERRAR SESIÓN",
    deleteAccount: "BORRAR CUENTA",
    deleting: "BORRANDO...",
    confirmDelete: "¿Borrar tu cuenta y TODOS tus datos? Esta acción es permanente.",
    deleteError: "No se pudo borrar la cuenta. Reintenta.",
    privacy: "PRIVACIDAD",
    terms: "TÉRMINOS",
  },
} as const;

export type Strings = typeof es;
