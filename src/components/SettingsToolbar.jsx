// Settings are read-only until the operator says otherwise.
//
// An explicit edit gate means a stray touch on a stepper cannot change a
// value: the operator has to declare an intention to edit first. It also
// gives the batch a clear beginning and end, so Save has something definite
// to confirm rather than committing whatever happened to accumulate.
export default function SettingsToolbar({
  editing, changeCount, ventilating, onEdit, onSave, onDiscard, savedAt,
}) {
  return (
    <div className={editing ? 'settings-toolbar editing' : 'settings-toolbar'}>
      <div className="settings-toolbar-status">
        <span className={editing ? 'settings-mode editing' : 'settings-mode'}>
          {editing ? 'Editing' : 'Read only'}
        </span>
        <span className="settings-hint">
          {editing
            ? changeCount > 0
              ? `${changeCount} unsaved ${changeCount === 1 ? 'change' : 'changes'}`
              : 'No changes yet'
            : 'Select Edit to change settings'}
        </span>
        {!editing && savedAt && (
          <span className="settings-saved" role="status">
            Saved at {savedAt}
          </span>
        )}
      </div>

      <div className="settings-toolbar-actions">
        {editing ? (
          <>
            <button type="button" className="btn btn-ghost btn-tiny" onClick={onDiscard}>
              Discard
            </button>
            <button
              type="button"
              className="btn btn-accept btn-tiny"
              disabled={changeCount === 0}
              onClick={onSave}
            >
              Save{changeCount > 0 ? ` (${changeCount})` : ''}
            </button>
          </>
        ) : (
          <button type="button" className="btn btn-ghost btn-tiny" onClick={onEdit}>
            Edit settings
          </button>
        )}
      </div>

      {editing && ventilating && (
        <p className="settings-warn">
          Ventilation continues with the saved values while you edit. Nothing
          reaches the patient until you save.
        </p>
      )}
    </div>
  )
}
