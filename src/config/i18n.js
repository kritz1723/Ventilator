// Interface language.
//
// A missing translation falls back to the source language rather than
// rendering blank or showing a raw key. On a device where the text carries
// safety information, an untranslated string the operator can still read is
// strictly better than an empty control.
//
// Translations here cover the operator-facing chrome. Clinical abbreviations
// that are used internationally in their Latin form — PEEP, FiO2, Ppeak,
// Vte, and the mode designations — are deliberately left untranslated,
// because localising them would make the interface harder to read for the
// clinicians who use those terms, not easier.

export const SOURCE_LANGUAGE = 'en'

export const LANGUAGES = {
  en: { id: 'en', label: 'English', endonym: 'English' },
  de: { id: 'de', label: 'German', endonym: 'Deutsch' },
  fr: { id: 'fr', label: 'French', endonym: 'Français' },
  es: { id: 'es', label: 'Spanish', endonym: 'Español' },
}

export const STRINGS = {
  en: {
    'app.subtitle': 'Concept interface · simulated data only',
    'app.disclaimer': 'SIMULATION ONLY — NOT A MEDICAL DEVICE — NOT FOR CLINICAL USE',
    'app.footerSim': 'Simulation only — not for clinical use',

    'state.ventilating': 'Ventilating',
    'state.standby': 'Standby',

    'action.start': 'Start ventilation',
    'action.stop': 'Stop ventilation',
    'action.accept': 'Accept',
    'action.cancel': 'Cancel',
    'action.close': 'Close',
    'action.freeze': 'Freeze',
    'action.resume': 'Resume',
    'action.capture': 'Capture',
    'action.clear': 'Clear',
    'action.config': 'Config',
    'action.exitConfig': 'Exit configuration',
    'action.deviceInfo': 'Device info',
    'action.log': 'Log',
    'action.layout': 'Layout',
    'action.done': 'Done',
    'action.audioPause': 'Audio pause',

    'panel.mode': 'Mode',
    'panel.settings': 'Settings',
    'panel.alarmLimits': 'Alarm limits',
    'panel.maneuvers': 'Maneuvers',
    'panel.simulatedLung': 'Simulated lung',
    'panel.waveforms': 'Waveforms',
    'panel.monitoredValues': 'Monitored values',
    'panel.loops': 'Loops',
    'panel.captures': 'Captures',
    'panel.flowPattern': 'Flow pattern',

    'field.rate': 'Rate',
    'field.tidalVolume': 'Tidal vol.',
    'field.inspPressure': 'P insp.',
    'field.inspPause': 'Insp. pause',
    'field.trigger': 'Trigger',
    'field.pSupport': 'P support',
    'field.cycleOff': 'Cycle off',
    'field.spontaneousEffort': 'Spontaneous effort',
    'field.sweep': 'Sweep',

    'maneuver.inspHold': 'Insp. hold',
    'maneuver.expHold': 'Exp. hold',

    'alarm.none': 'No active alarms',
    'alarm.priority.high': 'High',
    'alarm.priority.medium': 'Medium',
    'alarm.priority.low': 'Low',

    'pending.one': 'change awaiting acceptance',
    'pending.many': 'changes awaiting acceptance',

    'log.title': 'Event log',
    'log.all': 'All',
    'log.alarms': 'Alarms',
    'log.actions': 'Actions',
    'log.search': 'Search messages…',
    'log.copyCsv': 'Copy CSV',
    'log.empty': 'No entries match the current filter.',
  },

  de: {
    'app.subtitle': 'Konzeptoberfläche · nur simulierte Daten',
    'app.disclaimer': 'NUR SIMULATION — KEIN MEDIZINPRODUKT — NICHT FÜR DEN KLINISCHEN EINSATZ',
    'app.footerSim': 'Nur Simulation — nicht für den klinischen Einsatz',

    'state.ventilating': 'Beatmung',
    'state.standby': 'Bereitschaft',

    'action.start': 'Beatmung starten',
    'action.stop': 'Beatmung beenden',
    'action.accept': 'Übernehmen',
    'action.cancel': 'Abbrechen',
    'action.close': 'Schließen',
    'action.freeze': 'Einfrieren',
    'action.resume': 'Fortsetzen',
    'action.capture': 'Erfassen',
    'action.clear': 'Löschen',
    'action.config': 'Konfiguration',
    'action.exitConfig': 'Konfiguration verlassen',
    'action.deviceInfo': 'Geräteinfo',
    'action.log': 'Protokoll',
    'action.layout': 'Layout',
    'action.done': 'Fertig',
    'action.audioPause': 'Ton pausieren',

    'panel.mode': 'Modus',
    'panel.settings': 'Einstellungen',
    'panel.alarmLimits': 'Alarmgrenzen',
    'panel.maneuvers': 'Manöver',
    'panel.simulatedLung': 'Simulierte Lunge',
    'panel.waveforms': 'Kurven',
    'panel.monitoredValues': 'Messwerte',
    'panel.loops': 'Schleifen',
    'panel.captures': 'Aufnahmen',
    'panel.flowPattern': 'Flussmuster',

    'field.rate': 'Frequenz',
    'field.tidalVolume': 'Tidalvol.',
    'field.inspPressure': 'P insp.',
    'field.inspPause': 'Insp. Pause',
    'field.trigger': 'Trigger',
    'field.pSupport': 'P Unterst.',
    'field.cycleOff': 'Zyklusende',
    'field.spontaneousEffort': 'Spontanatmung',
    'field.sweep': 'Zeitbasis',

    'maneuver.inspHold': 'Insp. Halt',
    'maneuver.expHold': 'Exsp. Halt',

    'alarm.none': 'Keine aktiven Alarme',
    'alarm.priority.high': 'Hoch',
    'alarm.priority.medium': 'Mittel',
    'alarm.priority.low': 'Niedrig',

    'pending.one': 'Änderung wartet auf Bestätigung',
    'pending.many': 'Änderungen warten auf Bestätigung',

    'log.title': 'Ereignisprotokoll',
    'log.all': 'Alle',
    'log.alarms': 'Alarme',
    'log.actions': 'Aktionen',
    'log.search': 'Meldungen durchsuchen…',
    'log.copyCsv': 'CSV kopieren',
    'log.empty': 'Keine Einträge entsprechen dem Filter.',
  },

  fr: {
    'app.subtitle': 'Interface conceptuelle · données simulées uniquement',
    'app.disclaimer': 'SIMULATION UNIQUEMENT — PAS UN DISPOSITIF MÉDICAL — USAGE CLINIQUE INTERDIT',
    'app.footerSim': 'Simulation uniquement — usage clinique interdit',

    'state.ventilating': 'Ventilation',
    'state.standby': 'Attente',

    'action.start': 'Démarrer la ventilation',
    'action.stop': 'Arrêter la ventilation',
    'action.accept': 'Appliquer',
    'action.cancel': 'Annuler',
    'action.close': 'Fermer',
    'action.freeze': 'Figer',
    'action.resume': 'Reprendre',
    'action.capture': 'Capturer',
    'action.clear': 'Effacer',
    'action.config': 'Configuration',
    'action.exitConfig': 'Quitter la configuration',
    'action.deviceInfo': 'Infos appareil',
    'action.log': 'Journal',
    'action.layout': 'Disposition',
    'action.done': 'Terminé',
    'action.audioPause': 'Pause sonore',

    'panel.mode': 'Mode',
    'panel.settings': 'Réglages',
    'panel.alarmLimits': 'Limites d’alarme',
    'panel.maneuvers': 'Manœuvres',
    'panel.simulatedLung': 'Poumon simulé',
    'panel.waveforms': 'Courbes',
    'panel.monitoredValues': 'Valeurs mesurées',
    'panel.loops': 'Boucles',
    'panel.captures': 'Captures',
    'panel.flowPattern': 'Profil de débit',

    'field.rate': 'Fréquence',
    'field.tidalVolume': 'Vol. courant',
    'field.inspPressure': 'P insp.',
    'field.inspPause': 'Pause insp.',
    'field.trigger': 'Déclenchement',
    'field.pSupport': 'Aide inspir.',
    'field.cycleOff': 'Fin de cycle',
    'field.spontaneousEffort': 'Effort spontané',
    'field.sweep': 'Balayage',

    'maneuver.inspHold': 'Pause insp.',
    'maneuver.expHold': 'Pause exp.',

    'alarm.none': 'Aucune alarme active',
    'alarm.priority.high': 'Haute',
    'alarm.priority.medium': 'Moyenne',
    'alarm.priority.low': 'Basse',

    'pending.one': 'modification en attente',
    'pending.many': 'modifications en attente',

    'log.title': 'Journal des événements',
    'log.all': 'Tous',
    'log.alarms': 'Alarmes',
    'log.actions': 'Actions',
    'log.search': 'Rechercher…',
    'log.copyCsv': 'Copier en CSV',
    'log.empty': 'Aucune entrée ne correspond au filtre.',
  },

  es: {
    'app.subtitle': 'Interfaz conceptual · solo datos simulados',
    'app.disclaimer': 'SOLO SIMULACIÓN — NO ES UN PRODUCTO SANITARIO — NO PARA USO CLÍNICO',
    'app.footerSim': 'Solo simulación — no para uso clínico',

    'state.ventilating': 'Ventilando',
    'state.standby': 'En espera',

    'action.start': 'Iniciar ventilación',
    'action.stop': 'Detener ventilación',
    'action.accept': 'Aceptar',
    'action.cancel': 'Cancelar',
    'action.close': 'Cerrar',
    'action.freeze': 'Congelar',
    'action.resume': 'Reanudar',
    'action.capture': 'Capturar',
    'action.clear': 'Borrar',
    'action.config': 'Configuración',
    'action.exitConfig': 'Salir de configuración',
    'action.deviceInfo': 'Información del equipo',
    'action.log': 'Registro',
    'action.layout': 'Disposición',
    'action.done': 'Listo',
    'action.audioPause': 'Pausar audio',

    'panel.mode': 'Modo',
    'panel.settings': 'Ajustes',
    'panel.alarmLimits': 'Límites de alarma',
    'panel.maneuvers': 'Maniobras',
    'panel.simulatedLung': 'Pulmón simulado',
    'panel.waveforms': 'Curvas',
    'panel.monitoredValues': 'Valores monitorizados',
    'panel.loops': 'Bucles',
    'panel.captures': 'Capturas',
    'panel.flowPattern': 'Patrón de flujo',

    'field.rate': 'Frecuencia',
    'field.tidalVolume': 'Vol. corriente',
    'field.inspPressure': 'P insp.',
    'field.inspPause': 'Pausa insp.',
    'field.trigger': 'Disparo',
    'field.pSupport': 'P soporte',
    'field.cycleOff': 'Fin de ciclo',
    'field.spontaneousEffort': 'Esfuerzo espontáneo',
    'field.sweep': 'Barrido',

    'maneuver.inspHold': 'Pausa insp.',
    'maneuver.expHold': 'Pausa esp.',

    'alarm.none': 'Sin alarmas activas',
    'alarm.priority.high': 'Alta',
    'alarm.priority.medium': 'Media',
    'alarm.priority.low': 'Baja',

    'pending.one': 'cambio pendiente de aceptación',
    'pending.many': 'cambios pendientes de aceptación',

    'log.title': 'Registro de eventos',
    'log.all': 'Todos',
    'log.alarms': 'Alarmas',
    'log.actions': 'Acciones',
    'log.search': 'Buscar mensajes…',
    'log.copyCsv': 'Copiar CSV',
    'log.empty': 'Ningún registro coincide con el filtro.',
  },
}

export const DEFAULT_LANGUAGE = SOURCE_LANGUAGE

// Returns the string for a key, falling back to the source language and, as
// a last resort, to the key itself. Never returns an empty string, because a
// blank control conveys nothing at all.
export function translate(language, key) {
  const value = STRINGS[language]?.[key]
  if (value) return value
  const source = STRINGS[SOURCE_LANGUAGE]?.[key]
  if (source) return source
  return key
}

export function makeTranslator(language) {
  return (key) => translate(language, key)
}

// Reports which keys a language is missing, so incomplete coverage is
// visible in configuration rather than discovered at the bedside.
export function missingKeys(language) {
  const sourceKeys = Object.keys(STRINGS[SOURCE_LANGUAGE])
  const target = STRINGS[language] ?? {}
  return sourceKeys.filter((k) => !target[k])
}

export function coverage(language) {
  const total = Object.keys(STRINGS[SOURCE_LANGUAGE]).length
  return (total - missingKeys(language).length) / total
}
