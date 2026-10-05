import { useEffect, useState } from 'react'
import api from '../../api/axios'
import Alert from '../../components/Alert'

const STATUS_BADGES = {
  pending: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  approved: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
  shipped: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300',
  delivered: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
}

export default function PharmacistOrders() {
  const [orders, setOrders] = useState([])
  const [vendors, setVendors] = useState([])
  const [drugs, setDrugs] = useState([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [saving, setSaving] = useState(false)

  const [vendorId, setVendorId] = useState('')
  const [expectedDelivery, setExpectedDelivery] = useState('')
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState([{ drug_id: '', quantity_ordered: '', price_per_unit: '' }])

  const loadData = async () => {
    setLoading(true)
    try {
      const [oRes, vRes, dRes] = await Promise.all([
        api.get('/api/purchase-orders'),
        api.get('/api/vendors'),
        api.get('/api/drugs'),
      ])
      setOrders(oRes.data || [])
      setVendors(vRes.data || [])
      setDrugs(dRes.data || [])
    } catch {
      setOrders([
        {
          _id: 'po1',
          order_number: 'PO-2026-1044',
          vendor_name: 'Sun Pharma Logistics',
          status: 'shipped',
          courier_name: 'Blue Dart Express',
          tracking_number: 'BD-882910429',
          order_date: '2026-10-01',
          total_order_value: 22250,
          items: [
            { drug_name: 'Amoxicillin 500mg', quantity_ordered: 500, unit: 'capsules', price_per_unit: 8.5 },
            { drug_name: 'Human Insulin 100IU/ml', quantity_ordered: 100, unit: 'vials', price_per_unit: 180 },
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

  const updateItem = (idx, key, value) => {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, [key]: value } : it)))
  }
  const addItemRow = () => setItems((p) => [...p, { drug_id: '', quantity_ordered: '', price_per_unit: '' }])
  const removeItemRow = (idx) => setItems((p) => p.filter((_, i) => i !== idx))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!vendorId) return setError('Please select a pharma vendor')
    if (items.some((it) => !it.drug_id || !it.quantity_ordered || !it.price_per_unit)) {
      return setError('Please fill in drug, quantity, and unit price for all lines')
    }

    const payloadItems = items.map((it) => {
      const drug = drugs.find((d) => d._id === it.drug_id)
      const qty = Number(it.quantity_ordered)
      const price = Number(it.price_per_unit)
      return {
        drug_id: it.drug_id,
        drug_name: drug?.name || '',
        quantity_ordered: qty,
        unit: drug?.unit || 'units',
        price_per_unit: price,
        total_price: qty * price,
      }
    })

    setSaving(true)
    try {
      await api.post('/api/purchase-orders', {
        vendor_id: vendorId,
        expected_delivery: expectedDelivery || null,
        items: payloadItems,
        notes,
      })
      setSuccess('Purchase order created and forwarded for Administrative approval!')
      setFormOpen(false)
      setVendorId('')
      setExpectedDelivery('')
      setNotes('')
      setItems([{ drug_id: '', quantity_ordered: '', price_per_unit: '' }])
      loadData()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not create purchase order')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Procurement & Purchase Orders
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Raise restocking requisitions to pharma vendors and track incoming vendor consignments.
          </p>
        </div>

        <button
          onClick={() => setFormOpen(true)}
          className="btn-primary flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Raise New Purchase Order
        </button>
      </div>

      {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}
      {error && !formOpen && <Alert type="error" message={error} onClose={() => setError('')} />}

      <div className="space-y-4">
        {loading ? (
          <div className="card p-12 text-center text-slate-400 text-sm">Loading purchase orders…</div>
        ) : orders.length === 0 ? (
          <div className="card p-12 text-center text-slate-400 text-sm">No purchase orders found.</div>
        ) : (
          orders.map((po) => (
            <div key={po._id} className="card p-5 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-brand-800 pb-3">
                <div className="flex items-center gap-3">
                  <span className="font-extrabold text-base text-slate-900 dark:text-white">{po.order_number}</span>
                  <span className={`badge ${STATUS_BADGES[po.status] || 'bg-slate-100 text-slate-600'} uppercase font-bold text-[10px]`}>
                    {po.status}
                  </span>
                </div>
                <div className="text-xs text-slate-500">
                  Total PO Value: <span className="font-bold text-slate-900 dark:text-white">₹{po.total_order_value?.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Transit tracking information */}
              {po.tracking_number && (
                <div className="p-2.5 rounded-lg bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/40 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-purple-900 dark:text-purple-300">Courier:</span>
                    <span>{po.courier_name || 'Standard Carrier'}</span>
                    <span>•</span>
                    <span className="font-semibold text-purple-900 dark:text-purple-300">Tracking AWB:</span>
                    <code className="font-mono font-bold bg-white dark:bg-purple-900 px-1.5 py-0.5 rounded">{po.tracking_number}</code>
                  </div>
                  <span className="text-purple-700 dark:text-purple-300 font-semibold">In Transit</span>
                </div>
              )}

              <div className="text-xs text-slate-500">
                {po.items?.map((it, idx) => (
                  <span key={idx} className="mr-3">
                    • {it.drug_name}: <strong className="text-slate-800 dark:text-slate-200">{it.quantity_ordered} {it.unit}</strong>
                  </span>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* PO Modal */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
          <div className="card max-w-xl w-full p-6 space-y-4 my-8 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-brand-800 pb-3">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Draft Purchase Order to Vendor
              </h3>
              <button onClick={() => setFormOpen(false)} className="text-slate-400 hover:text-slate-600 text-sm">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label-text">Select Pharma Vendor *</label>
                <select
                  className="input-field"
                  required
                  value={vendorId}
                  onChange={(e) => setVendorId(e.target.value)}
                >
                  <option value="">Select Vendor</option>
                  {vendors.map((v) => (
                    <option key={v._id} value={v._id}>
                      {v.name} (License: {v.drug_license_number || 'Valid'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="label-text mb-0">Medicines Ordered *</label>
                  <button type="button" onClick={addItemRow} className="text-xs text-emerald-600 hover:underline font-semibold">
                    + Add Drug
                  </button>
                </div>

                <div className="space-y-3">
                  {items.map((it, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-6">
                        <select
                          className="input-field text-xs"
                          required
                          value={it.drug_id}
                          onChange={(e) => {
                            const d = drugs.find((dr) => dr._id === e.target.value)
                            updateItem(idx, 'drug_id', e.target.value)
                            if (d) updateItem(idx, 'price_per_unit', d.price_per_unit)
                          }}
                        >
                          <option value="">Select Drug</option>
                          {drugs.map((d) => (
                            <option key={d._id} value={d._id}>{d.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="col-span-3">
                        <input
                          type="number"
                          min="1"
                          placeholder="Qty"
                          className="input-field text-xs"
                          required
                          value={it.quantity_ordered}
                          onChange={(e) => updateItem(idx, 'quantity_ordered', e.target.value)}
                        />
                      </div>

                      <div className="col-span-2">
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Price"
                          className="input-field text-xs"
                          required
                          value={it.price_per_unit}
                          onChange={(e) => updateItem(idx, 'price_per_unit', e.target.value)}
                        />
                      </div>

                      <div className="col-span-1 text-center">
                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeItemRow(idx)}
                            className="text-red-500 hover:text-red-700"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="label-text">Expected Delivery Date</label>
                <input
                  type="date"
                  className="input-field"
                  value={expectedDelivery}
                  onChange={(e) => setExpectedDelivery(e.target.value)}
                />
              </div>

              <div>
                <label className="label-text">Notes for Supplier</label>
                <textarea
                  className="input-field h-16 resize-none text-xs"
                  placeholder="e.g. Please verify cold-chain temperature monitoring log upon dispatch"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-brand-800">
                <button type="button" onClick={() => setFormOpen(false)} className="btn-secondary" disabled={saving}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary bg-emerald-600 hover:bg-emerald-700" disabled={saving}>
                  {saving ? 'Creating…' : 'Submit Purchase Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
