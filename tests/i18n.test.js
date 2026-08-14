import { describe, it, expect } from 'vitest'
import {
  LANGUAGES, STRINGS, SOURCE_LANGUAGE, DEFAULT_LANGUAGE,
  translate, makeTranslator, missingKeys, coverage,
} from '../src/config/i18n.js'

describe('language catalogue', () => {
  it('defaults to the source language', () => {
    expect(DEFAULT_LANGUAGE).toBe(SOURCE_LANGUAGE)
  })

  it('provides a string table for every offered language', () => {
    for (const id of Object.keys(LANGUAGES)) {
      expect(STRINGS[id], id).toBeDefined()
    }
  })

  it('offers no language without a catalogue entry', () => {
    for (const id of Object.keys(STRINGS)) {
      expect(LANGUAGES[id], id).toBeDefined()
    }
  })

  it('names each language in its own script', () => {
    for (const lang of Object.values(LANGUAGES)) {
      expect(lang.endonym, lang.id).toBeTruthy()
    }
  })
})

describe('translation', () => {
  it('returns the translated string when one exists', () => {
    expect(translate('de', 'action.start')).toBe('Beatmung starten')
    expect(translate('fr', 'panel.mode')).toBe('Mode')
  })

  it('falls back to the source language for a missing key', () => {
    // A key present in English but absent from a target language must render
    // readable English rather than a blank or a raw key.
    const key = 'app.footerSim'
    const original = STRINGS.de[key]
    delete STRINGS.de[key]
    expect(translate('de', key)).toBe(STRINGS[SOURCE_LANGUAGE][key])
    STRINGS.de[key] = original
  })

  it('falls back to the source language for an unknown language', () => {
    expect(translate('xx', 'action.start')).toBe(STRINGS.en['action.start'])
  })

  it('never returns an empty string', () => {
    for (const lang of Object.keys(LANGUAGES)) {
      for (const key of Object.keys(STRINGS[SOURCE_LANGUAGE])) {
        expect(translate(lang, key), `${lang}/${key}`).toBeTruthy()
      }
    }
  })

  it('returns the key itself when nothing is defined anywhere', () => {
    expect(translate('en', 'nothing.defined.here')).toBe('nothing.defined.here')
  })
})

describe('translator', () => {
  it('binds a language for repeated lookups', () => {
    const t = makeTranslator('es')
    expect(t('action.cancel')).toBe('Cancelar')
    expect(t('state.standby')).toBe('En espera')
  })
})

describe('coverage', () => {
  it('reports the source language as complete', () => {
    expect(missingKeys(SOURCE_LANGUAGE)).toHaveLength(0)
    expect(coverage(SOURCE_LANGUAGE)).toBe(1)
  })

  it('has every offered language fully translated', () => {
    for (const id of Object.keys(LANGUAGES)) {
      expect(missingKeys(id), `${id} is missing keys`).toHaveLength(0)
    }
  })

  it('reports a language with no table as fully missing', () => {
    expect(coverage('xx')).toBe(0)
  })

  it('translates the safety statement in every language', () => {
    // The simulation-only statement is the control that prevents the
    // interface being taken for clinical equipment, so it must never be
    // the string that goes untranslated.
    for (const id of Object.keys(LANGUAGES)) {
      expect(STRINGS[id]['app.disclaimer'], id).toBeTruthy()
    }
  })
})
