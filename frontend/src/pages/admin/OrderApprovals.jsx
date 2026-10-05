import { useEffect, useState } from 'react'
import api from '../../api/axios'
import Alert from '../../components/Alert'

const STATUS_BADGES = {
  pending: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  approved: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
  shipped: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300',
  delivered: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
}

export default function OrderApprovals() {
  const [orders, setOrders] = useState([])
  const [vendors, setVendors] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('pending')
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const loadData = async () => {
    setLoading(true)
    try {
      const [poRes, vRes] = await Promise.all([
        api.get('/api/purchase-orders'),
        api.get('/api/vendors'),
      ])
      setOrders(poRes.data || [])
      setVendors(vRes.data || [])
    } catch {
      // Fallback demo data
      setOrders([
        {
          _id: 'po1',
          order_number: 'PO-2026-1088',
          vendor_id: 'v3',
          vendor_name: "Dr. Reddy's Pharma Logistics",
          status: 'pending',
          order_date: '2026-10-04T10:30:00',
          expected_delivery: '2026-10-10',
          total_order_value: 105000,
          items: [
            { drug_name: 'Remdesivir 100mg Lyophilized', quantity_ordered: 60, unit: 'vials', price_per_unit: 1750, total_price: 105000 },
          ],
          notes: 'Emergency ICU procurement awaiting administrative financial sanction',
        },
        {
          _id: 'po2',
          order_number: 'PO-2026-1044',
          vendor_id: 'v1',
          vendor_name: 'Sun Pharma Distribution Logistics',
          status: 'pending',
          order_date: '2026-10-02T15:15:00',
          expected_delivery: '2026-10-08',
          total_order_value: 22250,
          items: [
            { drug_name: 'Amoxicillin 500mg', quantity_ordered: 500, unit: 'capsules', price_per_unit: 8.5, total_price: 4250 },
            { drug_name: 'Human Insulin 100IU/ml', quantity_ordered: 100, unit: 'vials', price_per_unit: 180, total_price: 18000 },
          ],
          notes: 'Replenishment for depleted diabetes & antibiotic stock',
        },
        {
          _id: 'po3',
          order_number: 'PO-2026-1012',
          vendor_id: 'v2',
          vendor_name: 'Cipla Institutional Supply',
          status: 'approved',
          order_date: '2026-09-28T09:00:00',
          expected_delivery: '2026-10-03',
          total_order_value: 2400,
          items: [
            { drug_name: 'Paracetamol 500mg', quantity_ordered: 1000, unit: 'tablets', price_per_unit: 2.4, total_price: 2400 },
          ],
          notes: 'General warehouse restock approved',
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      await api.patch(`/api/purchase-orders/${orderId}/status`, { status: newStatus })
      setSuccess(`Purchase Order marked as ${newStatus}!`)
      loadData()
      setTimeout(() => setSuccess(''), 3000)
    } catch {
      setSuccess(`Order marked as ${newStatus} in demo mode!`)
      setOrders((prev) =>
        prev.map((o) => (o._id === orderId ? { ...o, status: newStatus } : o))
      )
      setTimeout(() => setSuccess(''), 3000)
    }
  }

  const filteredOrders = orders.filter((o) => {
    if (filter === 'ALL') return true
    return o.status === filter
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Purchase Order Approvals
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Executive financial review and authorization of hospital & warehouse procurement orders.
          </p>
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-brand-900 p-1 rounded-xl">
          {['pending', 'approved', 'shipped', 'delivered', 'ALL'].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                filter === s
                  ? 'bg-white dark:bg-brand-800 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}
      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="card p-12 text-center text-slate-400 text-sm">Loading purchase orders…</div>
        ) : filteredOrders.length === 0 ? (
          <div className="card p-12 text-center text-slate-400 text-sm">
            No purchase orders found under the "{filter}" filter.
          </div>
        ) : (
          filteredOrders.map((order) => {
            const vendor = vendors.find((v) => v._id === order.vendor_id)
            const vendorName = order.vendor_name || vendor?.name || 'Pharma Supplier'

            return (
              <div
                key={order._id}
                className="card p-5 hover:border-slate-300 dark:hover:border-brand-700 transition-all space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-brand-800 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="font-extrabold text-base text-slate-900 dark:text-white">
                      {order.order_number}
                    </span>
                    <span className={`badge ${STATUS_BADGES[order.status] || 'bg-slate-100 text-slate-700'} uppercase font-bold text-[10px]`}>
                      {order.status}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 flex items-center gap-2">
                    <span>Order Date: {order.order_date?.slice(0, 10)}</span>
                    {order.expected_delivery && (
                      <>
                        <span>•</span>
                        <span>Expected Delivery: {order.expected_delivery}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Target Supplier
                    </span>
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-100 mt-0.5 block">
                      {vendorName}
                    </span>
                    {order.notes && (
                      <p className="text-xs text-slate-500 italic mt-1">"{order.notes}"</p>
                    )}
                  </div>

                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Total Order Valuation
                    </span>
                    <span className="text-lg font-extrabold text-brand-600 dark:text-brand-400 mt-0.5 block">
                      ₹{order.total_order_value?.toLocaleString('en-IN')}
                    </span>
                    <span className="text-xs text-slate-400">{order.items?.length || 0} line item(s)</span>
                  </div>

                  <div className="flex items-center justify-start md:justify-end gap-2">
                    {order.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleUpdateStatus(order._id, 'approved')}
                          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-colors flex items-center gap-1.5"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M5 13l4 4L19 7" />
                          </svg>
                          Authorize Order
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(order._id, 'cancelled')}
                          className="px-3 py-2 rounded-xl border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 text-xs font-semibold transition-colors"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {order.status === 'approved' && (
                      <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                        ✓ Authorized & Dispatched to Supplier
                      </span>
                    )}
                  </div>
                </div>

                {/* Items Detail Table */}
                <div className="bg-slate-50 dark:bg-brand-900/40 rounded-xl p-3">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Line Items
                  </div>
                  <div className="space-y-1.5">
                    {order.items?.map((it, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between text-xs py-1 border-b border-slate-200/50 dark:border-brand-800/40 last:border-0"
                      >
                        <span className="font-medium text-slate-800 dark:text-slate-200">
                          {it.drug_name}
                        </span>
                        <div className="flex items-center gap-4 text-slate-500">
                          <span>
                            {it.quantity_ordered} {it.unit} @ ₹{it.price_per_unit}
                          </span>
                          <span className="font-bold text-slate-900 dark:text-white min-w-[70px] text-right">
                            ₹{it.total_price?.toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
