import { useEffect, useState } from 'react'
import api from '../api/axios'
import Alert from '../components/Alert'

const STATUS_STYLES = {
  dispatched: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
  delivered: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
  returned: 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300',
}

export default function Distributions() {
  const [dists, setDists] = useState([])
  const [institutions, setInstitutions] = useState([])
  const [drugs, setDrugs] = useState([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [saving, setSaving] = useState(false)

  const [institutionId, setInstitutionId] = useState('')
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState([{ drug_id: '', quantity: '' }])

  const load = async () => {
    setLoading(true)
    try {
      const [d, i, dr] = await Promise.all([
        api.get('/api/distributions'),
        api.get('/api/institutions'),
        api.get('/api/drugs'),
      ])
      setDists(d.data); setInstitutions(i.data); setDrugs(dr.data)
    } catch (e) {
      setError(e.response?.data?.detail || 'Could not load distributions')
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load() }, [])

  const updateItem = (idx, key, value) => setItems((p) => p.map((it, i) => (i === idx ? { ...it, [key]: value } : it)))
  const addRow = () => setItems((p) => [...p, { drug_id: '', quantity: '' }])
  const removeRow = (idx) => setItems((p) => p.filter((_, i) => i !== idx))
  const resetForm = () => { setInstitutionId(''); setNotes(''); setItems([{ drug_id: '', quantity: '' }]) }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!institutionId) return setError('Please select a receiving institution')
    if (items.some((it) => !it.drug_id || !it.quantity)) return setError('Please complete every line item')

    const payloadItems = items.map((it) => {
      const drug = drugs.find((d) => d._id === it.drug_id)
      return {
        drug_id: it.drug_id,
        drug_name: drug?.name || '',
        batch_number: drug?.batch_number || '',
        quantity: Number(it.quantity),
        unit: drug?.unit || 'units',
        expiry_date: drug?.expiry_date || null,
      }
    })

    const overStock = payloadItems.find((it) => {
      const drug = drugs.find((d) => d._id === it.drug_id)
      return drug && it.quantity > drug.quantity
    })
    if (overStock) return setError(`Not enough stock of ${overStock.drug_name} to dispatch this quantity`)

    setSaving(true)
    try {
      await api.post('/api/distributions', { institution_id: institutionId, items: payloadItems, notes })
      setSuccess('Distribution dispatched')
      setFormOpen(false)
      resetForm()
      load()
      setTimeout(() => setSuccess(''), 3000)
    } catch (e) {
      setError(e.response?.data?.detail || 'Could not create distribution')
    } finally {
      setSaving(false)
    }
  }

  const markDelivered = async (dist) => {
    try {
      await api.patch(`/api/distributions/${dist._id}/status`, { status: 'delivered' })
      load()
    } catch (e) {
      setError(e.response?.data?.detail || 'Could not update status')
    }
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-white">Distributions</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Which drugs went to which hospital</p>
        </div>
        <button onClick={() => { resetForm(); setError(''); setFormOpen(true) }} className="btn-primary">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>
          New Distribution
        </button>
      </div>

      {success && <div className="mb-4"><Alert type="success" message={success} onClose={() => setSuccess('')} /></div>}
      {error && !formOpen && <div className="mb-4"><Alert type="error" message={error} onClose={() => setError('')} /></div>}

      <div className="card overflow-x-auto">
        {loading ? (
          <div className="p-10 text-center text-slate-400 text-sm">Loading…</div>
        ) : dists.length === 0 ? (
          <div className="p-10 text-center text-slate-400 text-sm">No distributions yet.</div>
        ) : (
          <table className="table-shell">
            <thead><tr><th>Dist #</th><th>Institution</th><th>Items</th><th>Status</th><th>Dispatch date</th><th></th></tr></thead>
            <tbody>
              {dists.map((d) => (
                <tr key={d._id}>
                  <td className="font-medium text-slate-700 dark:text-slate-200">{d.distribution_number}</td>
                  <td>{d.institution_name}</td>
                  <td>{d.items.length} item(s)</td>
                  <td><span className={`badge capitalize ${STATUS_STYLES[d.status]}`}>{d.status}</span></td>
                  <td className="text-xs text-slate-500">{d.dispatch_date?.slice(0, 10)}</td>
                  <td>
                    {d.status === 'dispatched' && (
                      <button onClick={() => markDelivered(d)} className="text-brand-600 dark:text-brand-300 text-xs font-medium hover:underline">Mark delivered</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {formOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4" onClick={() => setFormOpen(false)}>
          <div className="card w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold mb-4 text-slate-800 dark:text-white">New Distribution</h2>
            {error && <div className="mb-4"><Alert type="error" message={error} onClose={() => setError('')} /></div>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label-text">Receiving institution *</label>
                <select className="input-field" value={institutionId} onChange={(e) => setInstitutionId(e.target.value)}>
                  <option value="">Select institution…</option>
                  {institutions.map((i) => <option key={i._id} value={i._id}>{i.name}</option>)}
                </select>
              </div>

              <div>
                <label className="label-text">Items to dispatch</label>
                <div className="space-y-2">
                  {items.map((it, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                      <select className="input-field col-span-8" value={it.drug_id} onChange={(e) => updateItem(idx, 'drug_id', e.target.value)}>
                        <option value="">Drug…</option>
                        {drugs.map((d) => <option key={d._id} value={d._id}>{d.name} ({d.quantity} {d.unit} available)</option>)}
                      </select>
                      <input type="number" className="input-field col-span-3" placeholder="Qty" value={it.quantity} onChange={(e) => updateItem(idx, 'quantity', e.target.value)} />
                      <button type="button" onClick={() => removeRow(idx)} className="col-span-1 text-red-500 hover:text-red-700" disabled={items.length === 1}>✕</button>
                    </div>
                  ))}
                </div>
                <button type="button" onClick={addRow} className="text-brand-600 dark:text-brand-300 text-sm font-medium mt-2 hover:underline">+ Add line item</button>
              </div>

              <div>
                <label className="label-text">Notes</label>
                <input className="input-field" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Monthly supply for OPD" />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving} className="btn-primary flex-1">{saving ? 'Dispatching…' : 'Dispatch'}</button>
                <button type="button" onClick={() => setFormOpen(false)} className="btn-secondary flex-1">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
