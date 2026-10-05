import { useEffect, useState } from 'react'
import api from '../../api/axios'
import Alert from '../../components/Alert'

export default function SupplyCart() {
  const [drugs, setDrugs] = useState([])
  const [cart, setCart] = useState([])
  const [submittedQuotes, setSubmittedQuotes] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [expectedDispatch, setExpectedDispatch] = useState('')
  const [supplierNotes, setSupplierNotes] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const loadData = async () => {
    setLoading(true)
    try {
      const [dRes, qRes] = await Promise.all([
        api.get('/api/drugs'),
        api.get('/api/purchase-orders/vendor-quotes/all'),
      ])
      setDrugs(dRes.data || [])
      setSubmittedQuotes(qRes.data || [])
    } catch {
      // Fallback demo data
      setDrugs([
        {
          _id: 'd1',
          name: 'Remdesivir 100mg Lyophilized',
          generic_name: 'Remdesivir',
          drug_form: 'injection',
          quantity: 0,
          reorder_level: 50,
          unit: 'vials',
          price_per_unit: 1800,
          manufacturer: "Dr. Reddy's",
        },
        {
          _id: 'd2',
          name: 'Human Insulin 100IU/ml',
          generic_name: 'Recombinant Human Insulin',
          drug_form: 'injection',
          quantity: 14,
          reorder_level: 120,
          unit: 'vials',
          price_per_unit: 185,
          manufacturer: 'Sun Pharma',
        },
        {
          _id: 'd3',
          name: 'Amoxicillin 500mg',
          generic_name: 'Amoxicillin Trihydrate',
          drug_form: 'capsule',
          quantity: 38,
          reorder_level: 200,
          unit: 'capsules',
          price_per_unit: 8.75,
          manufacturer: 'Sun Pharma',
        },
        {
          _id: 'd4',
          name: 'Paracetamol 500mg',
          generic_name: 'Acetaminophen',
          drug_form: 'tablet',
          quantity: 1450,
          reorder_level: 250,
          unit: 'tablets',
          price_per_unit: 2.5,
          manufacturer: 'Cipla',
        },
        {
          _id: 'd5',
          name: 'Azithromycin 500mg',
          generic_name: 'Azithromycin',
          drug_form: 'tablet',
          quantity: 620,
          reorder_level: 150,
          unit: 'tablets',
          price_per_unit: 22,
          manufacturer: 'Cipla',
        },
      ])
      setSubmittedQuotes([
        {
          _id: 'q1',
          quote_number: 'VQ-88412',
          vendor_name: 'Sun Pharma Logistics',
          submitted_at: '2026-10-04T14:20:00',
          total_quote_value: 45000,
          items: [
            { drug_name: 'Amoxicillin 500mg', quantity: 5000, unit: 'capsules', price_per_unit: 8.5 },
          ],
          notes: 'Standard batch dispatch within 48 hours of PO issuance',
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
            ? { ...item, quantity: item.quantity + 50 }
            : item
        )
      }
      return [
        ...prev,
        {
          drug_id: drug._id,
          drug_name: drug.name,
          unit: drug.unit,
          quantity: Math.max(50, drug.reorder_level ? drug.reorder_level * 2 : 100),
          price_per_unit: drug.price_per_unit || 50,
          batch_number: `BT-SPL-${Math.floor(1000 + Math.random() * 9000)}`,
          expiry_date: new Date(Date.now() + 540 * 86400000).toISOString().slice(0, 10),
        },
      ]
    })
    setSuccess(`Added ${drug.name} to supply cart!`)
    setTimeout(() => setSuccess(''), 2500)
  }

  const updateCartItem = (drugId, key, value) => {
    setCart((prev) =>
      prev.map((item) =>
        item.drug_id === drugId ? { ...item, [key]: value } : item
      )
    )
  }

  const removeFromCart = (drugId) => {
    setCart((prev) => prev.filter((item) => item.drug_id !== drugId))
  }

  // Cart Calculations
  const subtotal = cart.reduce(
    (acc, curr) => acc + Number(curr.quantity || 0) * Number(curr.price_per_unit || 0),
    0
  )
  const gst = subtotal * 0.12
  const totalQuote = subtotal + gst

  const handleSubmitQuote = async (e) => {
    e.preventDefault()
    if (cart.length === 0) {
      setError('Please add at least one medicine to your supply cart')
      return
    }

    setSubmitting(true)
    setError('')
    try {
      const payloadItems = cart.map((c) => ({
        drug_id: c.drug_id,
        drug_name: c.drug_name,
        quantity: Number(c.quantity),
        unit: c.unit,
        price_per_unit: Number(c.price_per_unit),
        total_price: Number(c.quantity) * Number(c.price_per_unit),
        batch_number: c.batch_number,
        expiry_date: c.expiry_date,
      }))

      await api.post('/api/purchase-orders/vendor-quote', {
        items: payloadItems,
        expected_dispatch_date: expectedDispatch || null,
        notes: supplierNotes,
      })

      setSuccess('Supply quotation and batch commitment submitted successfully to Central Pharmacy!')
      setCart([])
      setSupplierNotes('')
      setExpectedDispatch('')
      loadData()
      setTimeout(() => setSuccess(''), 4000)
    } catch {
      setSuccess('Supply quotation submitted in demo mode!')
      setSubmittedQuotes((prev) => [
        {
          _id: 'q_' + Date.now(),
          quote_number: `VQ-${Math.floor(10000 + Math.random() * 90000)}`,
          submitted_at: new Date().toISOString(),
          total_quote_value: totalQuote,
          items: cart,
          notes: supplierNotes,
        },
        ...prev,
      ])
      setCart([])
      setTimeout(() => setSuccess(''), 4000)
    } finally {
      setSubmitting(false)
    }
  }

  const filteredDrugs = drugs.filter(
    (d) =>
      d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.generic_name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Medicine Supply Cart & Quotation
            </h1>
            <span className="badge bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 font-bold">
              B2B Commerce
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Browse warehouse demand, add specific medicines to your supply cart, set batch lots, and submit supply quotations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">Cart Items:</span>
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-indigo-600 text-white text-xs font-bold shadow-md">
            {cart.length}
          </span>
        </div>
      </div>

      {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}
      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      {/* Main Grid: Medicine Catalog + Supply Cart Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Medicine Catalog Section (Col-span 7) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="card p-4 flex items-center justify-between gap-3">
            <div className="w-full">
              <input
                type="text"
                className="input-field"
                placeholder="Search catalog by medicine name, salt or manufacturer…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-3">
            {loading ? (
              <div className="card p-12 text-center text-slate-400 text-sm">Loading available medicines…</div>
            ) : filteredDrugs.length === 0 ? (
              <div className="card p-12 text-center text-slate-400 text-sm">No medicines found.</div>
            ) : (
              filteredDrugs.map((d) => {
                const isShortage = d.quantity <= d.reorder_level
                const isInCart = cart.some((c) => c.drug_id === d._id)

                return (
                  <div
                    key={d._id}
                    className="card p-4 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-white text-base">
                          {d.name}
                        </span>
                        {isShortage && (
                          <span className="badge bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 text-[10px] font-bold">
                            Depleted Demand
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {d.generic_name || d.salt_composition} • <span className="capitalize">{d.drug_form}</span>
                      </div>
                      <div className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                        <span>Central Stock: <strong className="text-slate-700 dark:text-slate-300">{d.quantity} {d.unit}</strong></span>
                        <span>•</span>
                        <span>Standard Rate: <strong className="text-slate-700 dark:text-slate-300">₹{d.price_per_unit}</strong></span>
                      </div>
                    </div>

                    <div>
                      <button
                        onClick={() => addToCart(d)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 whitespace-nowrap ${
                          isInCart
                            ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                            : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                        }`}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M12 5v14M5 12h14" />
                        </svg>
                        {isInCart ? 'Add More to Cart' : 'Add to Supply Cart'}
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Supply Cart Drawer (Col-span 5) */}
        <div className="lg:col-span-5 card p-5 space-y-4 sticky top-20 shadow-xl border-indigo-200 dark:border-indigo-900/60">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-brand-800 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">🛒</span>
              <div>
                <h2 className="font-bold text-base text-slate-900 dark:text-white">
                  My Supply Cart
                </h2>
                <span className="text-[11px] text-slate-400">
                  {cart.length} medicine formulation(s) selected
                </span>
              </div>
            </div>

            {cart.length > 0 && (
              <button
                onClick={() => setCart([])}
                className="text-xs text-red-500 hover:underline"
              >
                Clear Cart
              </button>
            )}
          </div>

          {cart.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <div className="text-3xl">📦</div>
              <p className="text-xs font-medium text-slate-500">Your supply cart is currently empty.</p>
              <p className="text-[11px] text-slate-400">
                Click "Add to Supply Cart" on any medicine to build a wholesale quotation.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmitQuote} className="space-y-4">
              {/* Cart Items List */}
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {cart.map((item) => (
                  <div
                    key={item.drug_id}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-brand-800 bg-slate-50/80 dark:bg-brand-900/40 space-y-2.5"
                  >
                    <div className="flex items-start justify-between">
                      <span className="font-bold text-xs text-slate-900 dark:text-white">
                        {item.drug_name}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.drug_id)}
                        className="text-slate-400 hover:text-red-500 text-xs p-1"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                          Supply Quantity ({item.unit})
                        </label>
                        <input
                          type="number"
                          min="1"
                          required
                          className="input-field py-1 text-xs"
                          value={item.quantity}
                          onChange={(e) => updateCartItem(item.drug_id, 'quantity', e.target.value)}
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                          Quoted Unit Rate (₹)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          required
                          className="input-field py-1 text-xs"
                          value={item.price_per_unit}
                          onChange={(e) => updateCartItem(item.drug_id, 'price_per_unit', e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                          Batch Lot #
                        </label>
                        <input
                          type="text"
                          required
                          className="input-field py-1 font-mono text-[11px]"
                          value={item.batch_number}
                          onChange={(e) => updateCartItem(item.drug_id, 'batch_number', e.target.value)}
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                          Batch Expiry
                        </label>
                        <input
                          type="date"
                          required
                          className="input-field py-1 text-[11px]"
                          value={item.expiry_date}
                          onChange={(e) => updateCartItem(item.drug_id, 'expiry_date', e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="text-right text-xs font-bold text-indigo-600 dark:text-indigo-400">
                      Line Total: ₹{(Number(item.quantity || 0) * Number(item.price_per_unit || 0)).toLocaleString('en-IN')}
                    </div>
                  </div>
                ))}
              </div>

              {/* Quotation Summary */}
              <div className="p-3.5 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 text-xs space-y-1.5">
                <div className="flex justify-between text-slate-600 dark:text-slate-300">
                  <span>Subtotal:</span>
                  <span className="font-semibold">₹{subtotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-300">
                  <span>GST Applicable (12% Pharma):</span>
                  <span className="font-semibold">₹{gst.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-sm font-extrabold text-slate-900 dark:text-white pt-1.5 border-t border-indigo-200 dark:border-indigo-900">
                  <span>Total Quotation Amount:</span>
                  <span className="text-indigo-600 dark:text-indigo-400">₹{totalQuote.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div>
                <label className="label-text text-xs">Estimated Dispatch Date</label>
                <input
                  type="date"
                  className="input-field text-xs py-1.5"
                  value={expectedDispatch}
                  onChange={(e) => setExpectedDispatch(e.target.value)}
                />
              </div>

              <div>
                <label className="label-text text-xs">Terms of Supply / Notes</label>
                <textarea
                  className="input-field h-16 resize-none text-xs"
                  placeholder="e.g. Certified WHO-GMP batch with cold-chain transit logging included."
                  value={supplierNotes}
                  onChange={(e) => setSupplierNotes(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2"
              >
                {submitting ? 'Submitting Quote…' : 'Submit Supply Quotation & Dispatch Commitment'}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Submitted Quotes History */}
      {submittedQuotes.length > 0 && (
        <div className="card p-6 space-y-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Submitted Supply Quotations History
          </h2>
          <div className="space-y-3">
            {submittedQuotes.map((q) => (
              <div
                key={q._id}
                className="p-3.5 rounded-xl border border-slate-200 dark:border-brand-800 bg-slate-50/50 dark:bg-brand-900/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900 dark:text-white font-mono">{q.quote_number}</span>
                    <span className="badge bg-indigo-100 text-indigo-700 font-semibold uppercase text-[10px]">
                      Submitted
                    </span>
                  </div>
                  <div className="text-slate-500 mt-0.5">
                    {q.items?.map((it) => `${it.drug_name} (${it.quantity} ${it.unit})`).join(', ')}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400">
                    ₹{q.total_quote_value?.toLocaleString('en-IN')}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {q.submitted_at?.slice(0, 16).replace('T', ' ')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
