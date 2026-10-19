import { useState, type FormEvent } from 'react'
import { adminErrorMessage, deleteEntity, saveEntity, type EntityKind } from '../../services/adminService'
import { deleteWarnings, entityFields, entityLabels, toRequestBody, type FieldConfig, type FormValues } from './entityForms'
import { Modal } from './Modal'

export type EditorState =
  | { mode: 'create' | 'edit'; kind: EntityKind; values: FormValues; originalId?: string }
  | { mode: 'delete'; kind: EntityKind; id: string; title: string }
  | null

export interface EditorResult {
  kind: EntityKind
  mode: 'create' | 'edit' | 'delete'
  // The item's ID before and after the change (they differ when the admin renamed it).
  previousId?: string
  id: string
}

export function AdminEditor({ state, onClose, onDone }: { state: EditorState; onClose: () => void; onDone: (result: EditorResult) => void }) {
  if (!state) return null
  return state.mode === 'delete'
    ? <DeleteDialog key={`${state.kind}:${state.id}`} kind={state.kind} id={state.id} title={state.title} onClose={onClose} onDone={onDone} />
    : <EntityFormDialog key={`${state.kind}:${state.originalId ?? 'new'}`} kind={state.kind} initial={state.values} originalId={state.originalId} onClose={onClose} onDone={onDone} />
}

function EntityFormDialog({ kind, initial, originalId, onClose, onDone }: { kind: EntityKind; initial: FormValues; originalId?: string; onClose: () => void; onDone: (result: EditorResult) => void }) {
  const [values, setValues] = useState(initial)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const fields = entityFields[kind].filter((field) => !field.showIf || field.showIf(values))
  const title = originalId ? `تعديل ${entityLabels[kind].singular}` : entityLabels[kind].add

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const saved = await saveEntity<{ id: string }>(kind, toRequestBody(kind, values), originalId)
      onDone({ kind, mode: originalId ? 'edit' : 'create', previousId: originalId, id: saved.id })
    } catch (saveError) {
      setError(adminErrorMessage(saveError, kind))
      setSaving(false)
    }
  }

  return (
    <Modal title={title} onClose={onClose}>
      <form className="admin-form" onSubmit={handleSubmit}>
        {fields.map((field) => <Field key={field.name} field={field} value={values[field.name]} onChange={(value) => setValues((current) => ({ ...current, [field.name]: value }))} />)}
        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="admin-form__actions">
          <button type="submit" className="primary-button" disabled={saving}>{saving ? 'جارٍ الحفظ...' : 'حفظ'}</button>
          <button type="button" className="ghost-button" onClick={onClose}>إلغاء</button>
        </div>
      </form>
    </Modal>
  )
}

function Field({ field, value, onChange }: { field: FieldConfig; value: string | boolean | undefined; onChange: (value: string | boolean) => void }) {
  if (field.type === 'checkbox') {
    return (
      <label className="check-field">
        <input type="checkbox" checked={value === true} onChange={(event) => onChange(event.target.checked)} />
        <span>{field.label}</span>
      </label>
    )
  }

  const common = { value: String(value ?? ''), required: field.required, dir: field.ltr ? 'ltr' : undefined }
  return (
    <label className="field">
      <span>{field.label}{field.required && <b className="field__required"> *</b>}</span>
      {field.type === 'textarea' && <textarea {...common} rows={3} onChange={(event) => onChange(event.target.value)} />}
      {field.type === 'select' && <select {...common} onChange={(event) => onChange(event.target.value)}>{field.options?.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>}
      {(field.type === 'text' || field.type === 'url' || field.type === 'number') && (
        <input {...common} type={field.type} min={field.type === 'number' ? 0 : undefined} step={field.type === 'number' ? 1 : undefined} onChange={(event) => onChange(event.target.value)} />
      )}
      {field.hint && <small className="field__hint">{field.hint}</small>}
    </label>
  )
}

function DeleteDialog({ kind, id, title, onClose, onDone }: { kind: EntityKind; id: string; title: string; onClose: () => void; onDone: (result: EditorResult) => void }) {
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    setDeleting(true)
    setError(null)
    try {
      await deleteEntity(kind, id)
      onDone({ kind, mode: 'delete', previousId: id, id })
    } catch (deleteError) {
      setError(adminErrorMessage(deleteError, kind))
      setDeleting(false)
    }
  }

  return (
    <Modal title={`حذف ${entityLabels[kind].singular}`} onClose={onClose} tone="danger">
      <div className="delete-dialog">
        <div className="delete-dialog__icon" aria-hidden="true">🗑️</div>
        <p>هل أنت متأكد من حذف <strong>«{title}»</strong>؟</p>
        <p className="delete-dialog__warning">{deleteWarnings[kind]} لا يمكن التراجع عن هذا.</p>
        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="admin-form__actions">
          <button type="button" className="danger-button" onClick={handleDelete} disabled={deleting}>{deleting ? 'جارٍ الحذف...' : 'نعم، احذف'}</button>
          <button type="button" className="ghost-button" onClick={onClose} autoFocus>إلغاء</button>
        </div>
      </div>
    </Modal>
  )
}
