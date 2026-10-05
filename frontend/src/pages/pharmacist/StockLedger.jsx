import { useEffect, useState } from 'react'
import api from '../../api/axios'
import Alert from '../../components/Alert'

export default function StockLedger() {
  const [transactions, setTransactions] = useState([])
  const [drugs, setDrugs] = useState([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    drug_id: '',
    transaction_type: 'in',
    quantity: '',
    batch_number: '',
    expiry_date: '',
    notes: '',
  })

  const loadData = async () => {
    setLoading(true)
    try {
      const [txRes, dRes] = await Promise.all([
        api.get('/api/inventory'),
        api.get('/api/drugs'),
      ])
      setTransactions(txRes.data || [])
      setDrugs(dRes.data || [])
    } catch {
      setTransactions([
        {
          _id: 't1',
          drug_name: 'Human Insulin 100IU/ml',
          transaction_type: 'out',
          quantity: 10,
          unit: 'vials',
          batch_number: 'BT-INS-9901',
          transaction_date: '2026-10-05T09:12:00',
          notes: 'Dispatched via DIST-2026-8812 to Apex Trauma Hospital',
        },
        {
          _id: 't2',
          drug_name: 'Paracetamol 500mg',
          transaction_type: 'in',
          quantity: 1000,
          unit: 'tablets',
          batch_number: 'BT-PCM-2401',
          transaction_date: '2026-09-30T14:40:00',
          notes: 'Goods Receipt from Cipla Logistics PO-2026-1012',
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.drug_id || !form.quantity) {
      setError('Please select a medicine and specify quantity')
      return
    }

    const selectedDrug = drugs.find((d) => d._id === form.drug_id)
    setSaving(true)
    setError('')
    try {
      await api.post('/api/inventory', {
        drug_id: form.drug_id,
        drug_name: selectedDrug?.name || 'Medicine',
        transaction_type: form.transaction_type,
        quantity: Number(form.quantity),
        unit: selectedDrug?.unit || 'units',
        batch_number: form.batch_number,
        expiry_date: form.expiry_date || null,
        notes: form.notes,
      })
      setSuccess(`Stock ${form.transaction_type === 'in' ? 'Inward' : 'Outward'} recorded successfully!`)
      setFormOpen(false)
      setForm({ drug_id: '', transaction_type: 'in', quantity: '', batch_number: '', expiry_date: '', notes: '' })
      loadData()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not record inventory transaction')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Stock Movement & Inward Ledger
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Complete pharmaceutical audit trail of inward receipts, outward dispatches, and quarantine adjustments.
          </p>
        </div>

        <button
          onClick={() => setFormOpen(true)}
          className="btn-primary flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Record Goods Receipt / Inward
        </button>
      </div>

      {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}
      {error && !formOpen && <Alert type="error" message={error} onClose={() => setError('')} />}

      <div className="card overflow-x-auto">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">Loading stock transaction history…</div>
        ) : transactions.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">No transactions logged yet.</div>
        ) : (
          <table className="table-shell">
            <thead>
              <tr>
                <th>Drug Formulation</th>
                <th>Movement Type</th>
                <th>Quantity</th>
                <th>Batch Number</th>
                <th>Date Logged</th>
                <th>Operational Notes</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx._id}>
                  <td className="font-bold text-slate-900 dark:text-white">{tx.drug_name}</td>
                  <td>
                    <span className={`badge ${
                      tx.transaction_type === 'in'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-semibold'
                        : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                    }`}>
                      {tx.transaction_type === 'in' ? '↓ Stock Inward' : '↑ Stock Outward'}
                    </span>
                  </td>
                  <td className="font-extrabold text-slate-900 dark:text-white text-sm">
                    {tx.quantity} {tx.unit}
                  </td>
                  <td>
                    <code className="text-xs font-mono bg-slate-100 dark:bg-brand-800 px-2 py-0.5 rounded">
                      {tx.batch_number || '—'}
                    </code>
                  </td>
                  <td className="text-xs text-slate-500">
                    {tx.transaction_date?.slice(0, 16).replace('T', ' ')}
                  </td>
                  <td className="text-xs text-slate-500 max-w-xs truncate">
                    {tx.notes || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Record Transaction Modal */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="card max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-brand-800 pb-3">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Log Stock Transaction
              </h3>
              <button onClick={() => setFormOpen(false)} className="text-slate-400 hover:text-slate-600 text-sm">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label-text">Select Drug Formulation *</label>
                <select
                  className="input-field"
                  required
                  value={form.drug_id}
                  onChange={(e) => setForm({ ...form, drug_id: e.target.value })}
                >
                  <option value="">Select Drug</option>
                  {drugs.map((d) => (
                    <option key={d._id} value={d._id}>
                      {d.name} (Current: {d.quantity} {d.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label-text">Movement Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, transaction_type: 'in' })}
                    className={`py-2 text-xs font-bold rounded-lg border transition-all ${
                      form.transaction_type === 'in'
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'border-slate-300 dark:border-brand-700 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    ↓ Stock In (Goods Receipt)
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, transaction_type: 'out' })}
                    className={`py-2 text-xs font-bold rounded-lg border transition-all ${
                      form.transaction_type === 'out'
                        ? 'bg-red-600 text-white border-red-600'
                        : 'border-slate-300 dark:border-brand-700 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    ↑ Stock Out (Adjustment/Disposal)
                  </button>
                </div>
              </div>

              <div>
                <label className="label-text">Quantity *</label>
                <input
                  type="number"
                  min="1"
                  required
                  className="input-field"
                  placeholder="e.g. 500"
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label-text">Batch Number</label>
                  <input
                    className="input-field font-mono"
                    placeholder="BT-2026-X01"
                    value={form.batch_number}
                    onChange={(e) => setForm({ ...form, batch_number: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label-text">Expiry Date</label>
                  <input
                    type="date"
                    className="input-field"
                    value={form.expiry_date}
                    onChange={(e) => setForm({ ...form, expiry_date: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="label-text">PO Ref / Operational Reason</label>
                <textarea
                  className="input-field h-16 resize-none text-xs"
                  placeholder="e.g. Received from Cipla PO-2026-1044 / physical inspection verified"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
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
                  {saving ? 'Logging…' : 'Record Transaction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
