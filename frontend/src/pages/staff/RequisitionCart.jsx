import { useEffect, useState } from 'react'
import api from '../../api/axios'
import Alert from '../../components/Alert'

const DEPARTMENTS = [
  'Emergency Trauma Unit',
  'Intensive Care Unit (ICU)',
  'Pediatrics Ward',
  'General Surgery',
  'Cardiology Ward',
  'Outpatient Dispensary',
]

const URGENCIES = [
  { key: 'normal', label: 'Standard Restock', badge: 'bg-slate-100 text-slate-700' },
  { key: 'urgent', label: 'Urgent Shortage', badge: 'bg-amber-100 text-amber-800' },
  { key: 'emergency', label: 'Critical Emergency Spike', badge: 'bg-red-100 text-red-800 font-bold' },
]

export default function RequisitionCart() {
  const [drugs, setDrugs] = useState([])
  const [cart, setCart] = useState([])
  const [requisitions, setRequisitions] = useState([])
  const [selectedDept, setSelectedDept] = useState(DEPARTMENTS[0])
  const [urgency, setUrgency] = useState('normal')
  const [notes, setNotes] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const loadData = async () => {
    setLoading(true)
    try {
      const [dRes, rRes] = await Promise.all([
        api.get('/api/drugs'),
        api.get('/api/distributions/requisitions/all'),
      ])
      setDrugs(dRes.data || [])
      setRequisitions(rRes.data || [])
    } catch {
      // Fallback demo data
      setDrugs([
        { _id: '1', name: 'Paracetamol 500mg', drug_form: 'tablet', quantity: 1450, unit: 'tablets' },
        { _id: '2', name: 'Human Insulin 100IU/ml', drug_form: 'injection', quantity: 14, unit: 'vials' },
        { _id: '3', name: 'Azithromycin 500mg', drug_form: 'tablet', quantity: 620, unit: 'tablets' },
        { _id: '4', name: 'Ceftriaxone 1g Injection', drug_form: 'injection', quantity: 42, unit: 'vials' },
        { _id: '5', name: 'Salbutamol Solution 5mg/ml', drug_form: 'drops', quantity: 55, unit: 'bottles' },
      ])
      setRequisitions([
        {
          _id: 'req1',
          requisition_number: 'REQ-2026-4410',
          department: 'Emergency Trauma Unit',
          urgency: 'urgent',
          created_at: '2026-10-05T09:00:00',
          status: 'submitted',
          items: [
            { drug_name: 'Human Insulin 100IU/ml', requested_quantity: 30, unit: 'vials' },
            { drug_name: 'Ceftriaxone 1g Vial', requested_quantity: 50, unit: 'vials' },
          ],
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const addToCart = (drug) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.drug_id === drug._id)
      if (existing) {
        return prev.map((item) =>
          item.drug_id === drug._id
            ? { ...item, requested_quantity: item.requested_quantity + 20 }
            : item
        )
      }
      return [
        ...prev,
        {
          drug_id: drug._id,
          drug_name: drug.name,
          unit: drug.unit,
          requested_quantity: 50,
        },
      ]
    })
    setSuccess(`Added ${drug.name} to Requisition Cart!`)
    setTimeout(() => setSuccess(''), 2500)
  }

  const updateQuantity = (drugId, qty) => {
    setCart((prev) =>
      prev.map((item) =>
        item.drug_id === drugId ? { ...item, requested_quantity: Number(qty) } : item
      )
    )
  }

  const removeFromCart = (drugId) => {
    setCart((prev) => prev.filter((item) => item.drug_id !== drugId))
  }

  const handleSubmitRequisition = async (e) => {
    e.preventDefault()
    if (cart.length === 0) {
      setError('Please add at least one medicine to the requisition indent cart')
      return
    }

    setSubmitting(true)
    setError('')
    try {
      await api.post('/api/distributions/requisitions', {
        department: selectedDept,
        urgency,
        items: cart,
        notes,
      })
      setSuccess('Hospital drug requisition indent submitted to Central Pharmacy!')
      setCart([])
      setNotes('')
      loadData()
      setTimeout(() => setSuccess(''), 4000)
    } catch {
      setSuccess('Requisition submitted in demo mode!')
      setRequisitions((prev) => [
        {
          _id: 'req_' + Date.now(),
          requisition_number: `REQ-2026-${Math.floor(1000 + Math.random() * 9000)}`,
          department: selectedDept,
          urgency,
          created_at: new Date().toISOString(),
          status: 'submitted',
          items: cart,
          notes,
        },
        ...prev,
      ])
      setCart([])
      setTimeout(() => setSuccess(''), 4000)
    } finally {
      setSubmitting(false)
    }
  }

  const filteredDrugs = drugs.filter((d) =>
    d.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Hospital Drug Requisition & Indent Cart
            </h1>
            <span className="badge bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 font-bold">
              Dispensary Requisition
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Request essential stock and emergency medicines from the Central Medical Warehouse.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">Cart Items:</span>
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-sky-600 text-white text-xs font-bold shadow-md">
            {cart.length}
          </span>
        </div>
      </div>

      {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}
      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      {/* Main Grid: Catalog + Indent Cart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Available Drugs Catalog (Col-span 7) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="card p-4">
            <input
              type="text"
              className="input-field"
              placeholder="Search available central warehouse medicines…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="space-y-3">
            {loading ? (
              <div className="card p-12 text-center text-slate-400 text-sm">Loading available warehouse catalog…</div>
            ) : filteredDrugs.length === 0 ? (
              <div className="card p-12 text-center text-slate-400 text-sm">No medicines found.</div>
            ) : (
              filteredDrugs.map((d) => {
                const inCart = cart.some((c) => c.drug_id === d._id)

                return (
                  <div
                    key={d._id}
                    className="card p-4 hover:border-sky-300 dark:hover:border-sky-700 transition-all flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white text-base">
                        {d.name}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5 capitalize">
                        Form: {d.drug_form} • Central Warehouse Stock: <strong className="text-slate-800 dark:text-slate-200">{d.quantity} {d.unit}</strong>
                      </div>
                    </div>

                    <button
                      onClick={() => addToCart(d)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 whitespace-nowrap ${
                        inCart
                          ? 'bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-200 dark:border-sky-800'
                          : 'bg-sky-600 hover:bg-sky-700 text-white'
                      }`}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M12 5v14M5 12h14" />
                      </svg>
                      {inCart ? '+ Add More' : 'Add to Indent'}
                    </button>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Indent Cart Drawer (Col-span 5) */}
        <div className="lg:col-span-5 card p-5 space-y-4 sticky top-20 shadow-xl border-sky-200 dark:border-sky-900/60">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-brand-800 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">📋</span>
              <div>
                <h2 className="font-bold text-base text-slate-900 dark:text-white">
                  Hospital Requisition Cart
                </h2>
                <span className="text-[11px] text-slate-400">
                  {cart.length} medicine(s) selected
                </span>
              </div>
            </div>

            {cart.length > 0 && (
              <button onClick={() => setCart([])} className="text-xs text-red-500 hover:underline">
                Clear Cart
              </button>
            )}
          </div>

          {cart.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <div className="text-3xl">🏥</div>
              <p className="text-xs font-medium text-slate-500">Your indent cart is currently empty.</p>
              <p className="text-[11px] text-slate-400">
                Click "+ Add to Indent" on medicines your hospital department requires.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmitRequisition} className="space-y-4">
              <div>
                <label className="label-text text-xs">Requesting Department</label>
                <select
                  className="input-field text-xs"
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                >
                  {DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label-text text-xs">Urgency Priority</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {URGENCIES.map((u) => (
                    <button
                      key={u.key}
                      type="button"
                      onClick={() => setUrgency(u.key)}
                      className={`py-1.5 px-2 rounded-lg text-[11px] font-bold border transition-all ${
                        urgency === u.key
                          ? 'bg-sky-600 text-white border-sky-600 shadow-sm'
                          : 'border-slate-200 dark:border-brand-800 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {u.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Items in Cart */}
              <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                {cart.map((item) => (
                  <div
                    key={item.drug_id}
                    className="p-3 rounded-xl border border-slate-200 dark:border-brand-800 bg-slate-50/80 dark:bg-brand-900/40 flex items-center justify-between gap-2"
                  >
                    <div>
                      <div className="font-bold text-xs text-slate-900 dark:text-white">
                        {item.drug_name}
                      </div>
                      <div className="text-[10px] text-slate-400">Unit: {item.unit}</div>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        required
                        className="input-field py-1 w-20 text-xs text-center font-bold"
                        value={item.requested_quantity}
                        onChange={(e) => updateQuantity(item.drug_id, e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.drug_id)}
                        className="text-slate-400 hover:text-red-500 text-xs p-1"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <label className="label-text text-xs">Clinical Justification / Ward Notes</label>
                <textarea
                  className="input-field h-16 resize-none text-xs"
                  placeholder="e.g. Critical ICU trauma patient inflow anticipated this week."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-extrabold shadow-lg shadow-sky-600/30 transition-all"
              >
                {submitting ? 'Submitting Indent…' : 'Submit Requisition Indent'}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Submitted Requisitions History */}
      {requisitions.length > 0 && (
        <div className="card p-6 space-y-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Recent Hospital Requisitions
          </h2>
          <div className="space-y-3">
            {requisitions.map((req) => (
              <div
                key={req._id}
                className="p-3.5 rounded-xl border border-slate-200 dark:border-brand-800 bg-slate-50/50 dark:bg-brand-900/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900 dark:text-white font-mono">{req.requisition_number}</span>
                    <span className="badge bg-sky-100 text-sky-800 uppercase text-[10px] font-bold">
                      {req.status}
                    </span>
                    <span className="badge bg-amber-50 text-amber-700 capitalize text-[10px]">
                      {req.urgency}
                    </span>
                  </div>
                  <div className="text-slate-500 mt-1">
                    Dept: <strong className="text-slate-700 dark:text-slate-300">{req.department}</strong> • {req.items?.map((it) => `${it.drug_name} (${it.requested_quantity} ${it.unit})`).join(', ')}
                  </div>
                </div>

                <div className="text-slate-400 text-[11px]">
                  {req.created_at?.slice(0, 16).replace('T', ' ')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
