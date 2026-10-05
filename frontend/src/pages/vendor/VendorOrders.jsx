import { useEffect, useState } from 'react'
import api from '../../api/axios'
import Alert from '../../components/Alert'

const PIPELINE_STEPS = ['pending', 'approved', 'shipped', 'delivered']

export default function VendorOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [dispatchModalOrder, setDispatchModalOrder] = useState(null)
  const [courierName, setCourierName] = useState('')
  const [trackingNumber, setTrackingNumber] = useState('')
  const [shippingNotes, setShippingNotes] = useState('')
  const [savingDispatch, setSavingDispatch] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await api.get('/api/purchase-orders')
      setOrders(res.data || [])
    } catch {
      // Fallback demo data
      setOrders([
        {
          _id: 'po1',
          order_number: 'PO-2026-1088',
          status: 'approved',
          order_date: '2026-10-04T12:00:00',
          total_order_value: 105000,
          items: [
            { drug_name: 'Remdesivir 100mg Lyophilized', quantity_ordered: 60, unit: 'vials', price_per_unit: 1750, total_price: 105000 },
          ],
          notes: 'Emergency ICU procurement sanctioned by Central Administration',
        },
        {
          _id: 'po2',
          order_number: 'PO-2026-1044',
          status: 'shipped',
          courier_name: 'Blue Dart Logistics Express',
          tracking_number: 'BD-882910429',
          order_date: '2026-10-01T15:30:00',
          total_order_value: 22250,
          items: [
            { drug_name: 'Amoxicillin 500mg', quantity_ordered: 500, unit: 'capsules', price_per_unit: 8.5, total_price: 4250 },
            { drug_name: 'Human Insulin 100IU/ml', quantity_ordered: 100, unit: 'vials', price_per_unit: 180, total_price: 18000 },
          ],
        },
        {
          _id: 'po3',
          order_number: 'PO-2026-1012',
          status: 'delivered',
          order_date: '2026-09-26T10:00:00',
          delivery_date: '2026-10-02T16:00:00',
          courier_name: 'DTDC Courier',
          tracking_number: 'DTDC-4910284',
          total_order_value: 2400,
          items: [
            { drug_name: 'Paracetamol 500mg', quantity_ordered: 1000, unit: 'tablets', price_per_unit: 2.4, total_price: 2400 },
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

  const handleOpenDispatch = (order) => {
    setDispatchModalOrder(order)
    setCourierName('Blue Dart Logistics')
    setTrackingNumber(`BD-${Math.floor(10000000 + Math.random() * 90000000)}`)
    setShippingNotes('Consignment dispatched under temperature-controlled monitoring')
  }

  const handleConfirmDispatch = async (e) => {
    e.preventDefault()
    if (!courierName || !trackingNumber) {
      setError('Please provide courier name and tracking consignment number')
      return
    }

    setSavingDispatch(true)
    setError('')
    try {
      await api.patch(`/api/purchase-orders/${dispatchModalOrder._id}/status`, {
        status: 'shipped',
        courier_name: courierName,
        tracking_number: trackingNumber,
        notes: shippingNotes,
      })
      setSuccess(`Consignment ${dispatchModalOrder.order_number} marked as Shipped!`)
      setDispatchModalOrder(null)
      loadData()
      setTimeout(() => setSuccess(''), 3000)
    } catch {
      setSuccess(`Order marked as Shipped with tracking ${trackingNumber} in demo mode!`)
      setOrders((prev) =>
        prev.map((o) =>
          o._id === dispatchModalOrder._id
            ? { ...o, status: 'shipped', courier_name: courierName, tracking_number: trackingNumber }
            : o
        )
      )
      setDispatchModalOrder(null)
      setTimeout(() => setSuccess(''), 3000)
    } finally {
      setSavingDispatch(false)
    }
  }

  const handleMarkDelivered = async (orderId) => {
    try {
      await api.patch(`/api/purchase-orders/${orderId}/status`, { status: 'delivered' })
      setSuccess('Consignment confirmed as Delivered!')
      loadData()
      setTimeout(() => setSuccess(''), 3000)
    } catch {
      setSuccess('Consignment marked as Delivered in demo mode!')
      setOrders((prev) =>
        prev.map((o) => (o._id === orderId ? { ...o, status: 'delivered' } : o))
      )
      setTimeout(() => setSuccess(''), 3000)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Order Fulfillment & Dispatch Tracking
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Fulfill healthcare purchase orders, log courier logistics, and track delivery settlements.
          </p>
        </div>
      </div>

      {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}
      {error && !dispatchModalOrder && <Alert type="error" message={error} onClose={() => setError('')} />}

      <div className="space-y-4">
        {loading ? (
          <div className="card p-12 text-center text-slate-400 text-sm">Loading assigned purchase orders…</div>
        ) : orders.length === 0 ? (
          <div className="card p-12 text-center text-slate-400 text-sm">No orders assigned.</div>
        ) : (
          orders.map((po) => {
            const currentStepIdx = PIPELINE_STEPS.indexOf(po.status)

            return (
              <div
                key={po._id}
                className="card p-6 space-y-5 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all"
              >
                {/* Order Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-brand-800 pb-3">
                  <div>
                    <span className="font-extrabold text-base text-slate-900 dark:text-white">
                      {po.order_number}
                    </span>
                    <span className="text-xs text-slate-500 ml-3">
                      Ordered: {po.order_date?.slice(0, 10)}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400">
                      ₹{po.total_order_value?.toLocaleString('en-IN')}
                    </span>
                    {po.status === 'approved' && (
                      <button
                        onClick={() => handleOpenDispatch(po)}
                        className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                        Dispatch Shipment
                      </button>
                    )}
                    {po.status === 'shipped' && (
                      <button
                        onClick={() => handleMarkDelivered(po._id)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                      >
                        Confirm Delivered
                      </button>
                    )}
                  </div>
                </div>

                {/* Visual Fulfillment Pipeline Stepper */}
                <div className="py-2">
                  <div className="grid grid-cols-4 gap-2 relative">
                    {PIPELINE_STEPS.map((step, idx) => {
                      const isComplete = currentStepIdx >= idx
                      const isCurrent = currentStepIdx === idx

                      return (
                        <div key={step} className="text-center space-y-1">
                          <div
                            className={`h-2 rounded-full transition-all ${
                              isComplete
                                ? 'bg-indigo-600'
                                : 'bg-slate-200 dark:bg-brand-800'
                            }`}
                          />
                          <div className={`text-[11px] font-bold capitalize ${
                            isCurrent
                              ? 'text-indigo-600 dark:text-indigo-400'
                              : isComplete
                              ? 'text-slate-800 dark:text-slate-200'
                              : 'text-slate-400'
                          }`}>
                            {step}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Tracking Details if Shipped */}
                {po.tracking_number && (
                  <div className="p-3.5 rounded-xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/40 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-purple-900 dark:text-purple-300">Courier Partner:</span>
                      <span>{po.courier_name}</span>
                      <span>•</span>
                      <span className="font-bold text-purple-900 dark:text-purple-300">AWB Tracking:</span>
                      <code className="font-mono bg-white dark:bg-purple-900 px-2 py-0.5 rounded font-bold text-slate-800 dark:text-white">
                        {po.tracking_number}
                      </code>
                    </div>
                    <span className="badge bg-purple-200 text-purple-900 dark:bg-purple-900 dark:text-purple-200 font-bold text-[10px]">
                      LIVE IN TRANSIT
                    </span>
                  </div>
                )}

                {/* Items in PO */}
                <div className="bg-slate-50 dark:bg-brand-900/40 rounded-xl p-3">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Contract Items
                  </div>
                  <div className="space-y-1">
                    {po.items?.map((it, idx) => (
                      <div key={idx} className="flex justify-between text-xs py-1">
                        <span className="font-medium text-slate-800 dark:text-slate-200">{it.drug_name}</span>
                        <span className="font-bold text-slate-900 dark:text-white">
                          {it.quantity_ordered} {it.unit} @ ₹{it.price_per_unit} = ₹{it.total_price?.toLocaleString('en-IN')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Dispatch Shipment Modal */}
      {dispatchModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="card max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-brand-800 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Dispatch Shipment
                </h3>
                <p className="text-xs text-slate-500">
                  Log consignment courier details for {dispatchModalOrder.order_number}
                </p>
              </div>
              <button onClick={() => setDispatchModalOrder(null)} className="text-slate-400 hover:text-slate-600 text-sm">
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmDispatch} className="space-y-4">
              <div>
                <label className="label-text">Courier / Transport Partner *</label>
                <input
                  className="input-field"
                  required
                  placeholder="e.g. Blue Dart Logistics, DTDC, DHL Express"
                  value={courierName}
                  onChange={(e) => setCourierName(e.target.value)}
                />
              </div>

              <div>
                <label className="label-text">Consignment Tracking Number (AWB) *</label>
                <input
                  className="input-field font-mono"
                  required
                  placeholder="e.g. BD-882910429"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                />
              </div>

              <div>
                <label className="label-text">Shipping & Handling Notes</label>
                <textarea
                  className="input-field h-16 resize-none text-xs"
                  placeholder="e.g. Cold-chain containers sealed at 4°C with temperature data logger."
                  value={shippingNotes}
                  onChange={(e) => setShippingNotes(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100 dark:border-brand-800">
                <button
                  type="button"
                  onClick={() => setDispatchModalOrder(null)}
                  className="btn-secondary"
                  disabled={savingDispatch}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary bg-indigo-600 hover:bg-indigo-700"
                  disabled={savingDispatch}
                >
                  {savingDispatch ? 'Updating…' : 'Confirm Dispatch & Notify Depot'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
