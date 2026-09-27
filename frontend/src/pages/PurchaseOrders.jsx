import { useEffect, useState } from 'react'
import api from '../api/axios'
import Alert from '../components/Alert'

const STATUS_STYLES = {
  pending: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
  approved: 'bg-brand-50 text-brand-700 dark:bg-brand-800 dark:text-brand-200',
  shipped: 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300',
  delivered: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
  cancelled: 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300',
}
const NEXT_STATUS = { pending: 'approved', approved: 'shipped', shipped: 'delivered' }

export default function PurchaseOrders() {
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

  const load = async () => {
    setLoading(true)
    try {
      const [o, v, d] = await Promise.all([
        api.get('/api/purchase-orders'),
        api.get('/api/vendors'),
        api.get('/api/drugs'),
      ])
      setOrders(o.data); setVendors(v.data); setDrugs(d.data)
    } catch (e) {
      setError(e.response?.data?.detail || 'Could not load purchase orders')
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load() }, [])

  const updateItem = (idx, key, value) => {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, [key]: value } : it)))
  }
  const addItemRow = () => setItems((p) => [...p, { drug_id: '', quantity_ordered: '', price_per_unit: '' }])
  const removeItemRow = (idx) => setItems((p) => p.filter((_, i) => i !== idx))

  const resetForm = () => {
    setVendorId(''); setExpectedDelivery(''); setNotes('')
    setItems([{ drug_id: '', quantity_ordered: '', price_per_unit: '' }])
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!vendorId) return setError('Please select a vendor')
    if (items.some((it) => !it.drug_id || !it.quantity_ordered || !it.price_per_unit)) {
      return setError('Please complete every line item (drug, quantity, price)')
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
      setSuccess('Purchase order created')
      setFormOpen(false)
      resetForm()
      load()
      setTimeout(() => setSuccess(''), 3000)
    } catch (e) {
      setError(e.response?.data?.detail || 'Could not create purchase order')
    } finally {
      setSaving(false)
    }
  }

  const advanceStatus = async (order) => {
    const next = NEXT_STATUS[order.status]
    if (!next) return
    try {
      await api.patch(`/api/purchase-orders/${order._id}/status`, { status: next })
      load()
    } catch (e) {
      setError(e.response?.data?.detail || 'Could not update order status')
    }
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-white">Purchase Orders</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Buying drugs from vendors</p>
        </div>
        <button onClick={() => { resetForm(); setError(''); setFormOpen(true) }} className="btn-primary">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>
          New Order
        </button>
      </div>

      {success && <div className="mb-4"><Alert type="success" message={success} onClose={() => setSuccess('')} /></div>}
      {error && !formOpen && <div className="mb-4"><Alert type="error" message={error} onClose={() => setError('')} /></div>}

      <div className="card overflow-x-auto">
        {loading ? (
          <div className="p-10 text-center text-slate-400 text-sm">Loading…</div>
        ) : orders.length === 0 ? (
          <div className="p-10 text-center text-slate-400 text-sm">No purchase orders yet.</div>
        ) : (
          <table className="table-shell">
            <thead>
              <tr>
                <th>Order #</th><th>Vendor</th><th>Items</th><th>Value</th><th>Status</th><th>Expected</th><th></th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => {
                const vendor = vendors.find((v) => v._id === o.vendor_id)
                return (
                  <tr key={o._id}>
                    <td className="font-medium text-slate-700 dark:text-slate-200">{o.order_number}</td>
                    <td>{vendor?.name || '—'}</td>
                    <td>{o.items.length} item(s)</td>
                    <td>₹{o.total_order_value?.toFixed(2)}</td>
                    <td><span className={`badge capitalize ${STATUS_STYLES[o.status]}`}>{o.status}</span></td>
                    <td className="text-slate-500 dark:text-slate-400 text-xs">{o.expected_delivery || '—'}</td>
                    <td>
                      {NEXT_STATUS[o.status] && (
                        <button onClick={() => advanceStatus(o)} className="text-brand-600 dark:text-brand-300 text-xs font-medium hover:underline capitalize">
                          Mark {NEXT_STATUS[o.status]}
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {formOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4" onClick={() => setFormOpen(false)}>
          <div className="card w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold mb-4 text-slate-800 dark:text-white">New Purchase Order</h2>
            {error && <div className="mb-4"><Alert type="error" message={error} onClose={() => setError('')} /></div>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label-text">Vendor *</label>
                  <select className="input-field" value={vendorId} onChange={(e) => setVendorId(e.target.value)}>
                    <option value="">Select vendor…</option>
                    {vendors.map((v) => <option key={v._id} value={v._id}>{v.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label-text">Expected delivery</label>
                  <input type="date" className="input-field" value={expectedDelivery} onChange={(e) => setExpectedDelivery(e.target.value)} />
                </div>
              </div>

              <div>
                <label className="label-text">Line items</label>
                <div className="space-y-2">
                  {items.map((it, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                      <select className="input-field col-span-5" value={it.drug_id} onChange={(e) => updateItem(idx, 'drug_id', e.target.value)}>
                        <option value="">Drug…</option>
                        {drugs.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
                      </select>
                      <input type="number" className="input-field col-span-3" placeholder="Qty" value={it.quantity_ordered} onChange={(e) => updateItem(idx, 'quantity_ordered', e.target.value)} />
                      <input type="number" className="input-field col-span-3" placeholder="₹/unit" value={it.price_per_unit} onChange={(e) => updateItem(idx, 'price_per_unit', e.target.value)} />
                      <button type="button" onClick={() => removeItemRow(idx)} className="col-span-1 text-red-500 hover:text-red-700" disabled={items.length === 1}>✕</button>
                    </div>
                  ))}
                </div>
                <button type="button" onClick={addItemRow} className="text-brand-600 dark:text-brand-300 text-sm font-medium mt-2 hover:underline">+ Add line item</button>
              </div>

              <div>
                <label className="label-text">Notes</label>
                <input className="input-field" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Urgent order for ICU" />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving} className="btn-primary flex-1">{saving ? 'Placing order…' : 'Place order'}</button>
                <button type="button" onClick={() => setFormOpen(false)} className="btn-secondary flex-1">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
