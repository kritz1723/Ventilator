import { LANGUAGES, STRINGS, coverage, missingKeys, translate } from '../config/i18n.js'

// A short preview of safety-relevant text per language, so the selection can
// be judged on how it actually reads rather than on the language name alone.
const PREVIEW_KEYS = ['app.footerSim', 'action.start', 'alarm.none']

export default function LanguageTab({ language, onLanguageChange }) {
  return (
    <>
      <div className="doc-toolbar">
        <span className="doc-note-inline">
          A missing translation falls back to the source language rather than
          rendering blank, because text the operator can still read is better
          than an empty control. Clinical abbreviations used internationally in
          their Latin form are left untranslated by design.
        </span>
      </div>

      <div className="doc-list">
        {Object.values(LANGUAGES).map((lang) => {
          const pct = Math.round(coverage(lang.id) * 100)
          const missing = missingKeys(lang.id).length
          const active = language === lang.id
          return (
            <button
              key={lang.id}
              type="button"
              className={active ? 'lang-row active' : 'lang-row'}
              onClick={() => onLanguageChange(lang.id)}
            >
              <div className="lang-head">
                <span className="licence-name">{lang.endonym}</span>
                <span className="licence-desc">{lang.label}</span>
              </div>

              <div className="lang-preview">
                {PREVIEW_KEYS.map((k) => (
                  <span key={k}>{translate(lang.id, k)}</span>
                ))}
              </div>

              <span className={missing ? 'lang-coverage partial' : 'lang-coverage'}>
                {pct}%
                <em>{Object.keys(STRINGS[lang.id]).length} strings</em>
              </span>
            </button>
          )
        })}
      </div>
    </>
  )
}
