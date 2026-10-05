import { useEffect, useState } from 'react'
import api from '../../api/axios'
import Alert from '../../components/Alert'

export default function DistributionManager() {
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

  const loadData = async () => {
    setLoading(true)
    try {
      const [dRes, iRes, drRes] = await Promise.all([
        api.get('/api/distributions'),
        api.get('/api/institutions'),
        api.get('/api/drugs'),
      ])
      setDists(dRes.data || [])
      setInstitutions(iRes.data || [])
      setDrugs(drRes.data || [])
    } catch {
      setDists([
        {
          _id: 'dist1',
          distribution_number: 'DIST-2026-8812',
          institution_name: 'Apex Trauma & Multispecialty Hospital',
          dispatch_date: '2026-10-05T08:30:00',
          status: 'dispatched',
          items: [
            { drug_name: 'Paracetamol 500mg', batch_number: 'BT-PCM-2401', quantity: 300, unit: 'tablets' },
            { drug_name: 'Azithromycin 500mg', batch_number: 'BT-AZI-7711', quantity: 100, unit: 'tablets' },
          ],
          notes: 'Priority dispatch for ICU Emergency Trauma Ward',
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const updateItem = (idx, key, value) => {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, [key]: value } : it)))
  }
  const addItemRow = () => setItems((p) => [...p, { drug_id: '', quantity: '' }])
  const removeItemRow = (idx) => setItems((p) => p.filter((_, i) => i !== idx))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!institutionId) return setError('Please select a destination hospital')
    if (items.some((it) => !it.drug_id || !it.quantity || Number(it.quantity) <= 0)) {
      return setError('Please complete all drug line items with valid quantities')
    }

    const payloadItems = items.map((it) => {
      const drug = drugs.find((d) => d._id === it.drug_id)
      return {
        drug_id: it.drug_id,
        drug_name: drug?.name || '',
        batch_number: drug?.batch_number || 'BT-DEF',
        quantity: Number(it.quantity),
        unit: drug?.unit || 'units',
        expiry_date: drug?.expiry_date || null,
      }
    })

    setSaving(true)
    try {
      await api.post('/api/distributions', {
        institution_id: institutionId,
        items: payloadItems,
        notes,
      })
      setSuccess('Distribution dispatched and warehouse stock deducted!')
      setFormOpen(false)
      setInstitutionId('')
      setNotes('')
      setItems([{ drug_id: '', quantity: '' }])
      loadData()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not dispatch distribution')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Hospital Distribution & Dispatches
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Outbound pharmaceutical allocations, hospital requisition fulfillment, and transit manifests.
          </p>
        </div>

        <button
          onClick={() => setFormOpen(true)}
          className="btn-primary flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Prepare New Hospital Dispatch
        </button>
      </div>

      {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}
      {error && !formOpen && <Alert type="error" message={error} onClose={() => setError('')} />}

      <div className="space-y-4">
        {loading ? (
          <div className="card p-12 text-center text-slate-400 text-sm">Loading distributions…</div>
        ) : dists.length === 0 ? (
          <div className="card p-12 text-center text-slate-400 text-sm">No dispatches recorded yet.</div>
        ) : (
          dists.map((dist) => (
            <div key={dist._id} className="card p-5 space-y-4 hover:border-slate-300 dark:hover:border-brand-700 transition-all">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-brand-800 pb-3">
                <div className="flex items-center gap-3">
                  <span className="font-extrabold text-base text-slate-900 dark:text-white">
                    {dist.distribution_number}
                  </span>
                  <span className={`badge ${
                    dist.status === 'delivered'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold'
                      : 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 font-semibold'
                  } uppercase text-[10px]`}>
                    {dist.status}
                  </span>
                </div>
                <div className="text-xs text-slate-500">
                  Dispatched: {dist.dispatch_date?.slice(0, 16).replace('T', ' ')}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Receiving Institution
                  </span>
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">
                    🏥 {dist.institution_name}
                  </span>
                  {dist.notes && <p className="text-xs text-slate-500 italic mt-0.5">"{dist.notes}"</p>}
                </div>
                <div className="text-xs text-slate-500">
                  {dist.items?.length || 0} line item(s) allocated
                </div>
              </div>

              {/* Items Table */}
              <div className="bg-slate-50 dark:bg-brand-900/40 rounded-xl p-3">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Allocated Medicines & Batches
                </div>
                <div className="space-y-1.5">
                  {dist.items?.map((it, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-xs py-1 border-b border-slate-200/50 dark:border-brand-800/40 last:border-0"
                    >
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {it.drug_name}
                      </span>
                      <div className="flex items-center gap-3">
                        <code className="font-mono text-[11px] bg-slate-200 dark:bg-brand-800 px-2 py-0.5 rounded">
                          Batch: {it.batch_number || 'Standard'}
                        </code>
                        <span className="font-bold text-slate-900 dark:text-white">
                          {it.quantity} {it.unit}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Prepare Dispatch Modal */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
          <div className="card max-w-lg w-full p-6 space-y-4 my-8 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-brand-800 pb-3">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Prepare Hospital Dispatch Manifest
              </h3>
              <button onClick={() => setFormOpen(false)} className="text-slate-400 hover:text-slate-600 text-sm">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label-text">Select Receiving Hospital / PHC *</label>
                <select
                  className="input-field"
                  required
                  value={institutionId}
                  onChange={(e) => setInstitutionId(e.target.value)}
                >
                  <option value="">Select Hospital</option>
                  {institutions.map((i) => (
                    <option key={i._id} value={i._id}>
                      {i.name} ({i.type?.toUpperCase()})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="label-text mb-0">Medicines to Dispatch *</label>
                  <button
                    type="button"
                    onClick={addItemRow}
                    className="text-xs text-emerald-600 hover:underline font-semibold"
                  >
                    + Add Another Medicine
                  </button>
                </div>

                <div className="space-y-3">
                  {items.map((it, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <select
                        className="input-field flex-1"
                        required
                        value={it.drug_id}
                        onChange={(e) => updateItem(idx, 'drug_id', e.target.value)}
                      >
                        <option value="">Select Drug</option>
                        {drugs.map((d) => (
                          <option key={d._id} value={d._id} disabled={d.quantity <= 0}>
                            {d.name} (Stock: {d.quantity} {d.unit})
                          </option>
                        ))}
                      </select>

                      <input
                        type="number"
                        min="1"
                        required
                        placeholder="Qty"
                        className="input-field w-24"
                        value={it.quantity}
                        onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
                      />

                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItemRow(idx)}
                          className="text-red-500 hover:text-red-700 p-2 text-sm"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="label-text">Dispatch Gate Pass / Transit Notes</label>
                <textarea
                  className="input-field h-20 resize-none text-xs"
                  placeholder="e.g. Dispatched via refrigerated vaccine van MH-04-AB-1234"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-brand-800">
                <button
                  type="button"
                  onClick={() => setFormOpen(false)}
                  className="btn-secondary"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary bg-emerald-600 hover:bg-emerald-700"
                  disabled={saving}
                >
                  {saving ? 'Dispatching…' : 'Issue Dispatch Gate Pass'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
