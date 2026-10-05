import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import Alert from '../../components/Alert'

export default function VendorDashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    setLoading(true)
    api.get('/api/dashboard/vendor')
      .then((res) => setData(res.data))
      .catch(() => {
        // Fallback demo data
        setData({
          total_orders: 4,
          total_revenue: 129650,
          pending_orders_count: 1,
          approved_orders_count: 1,
          shipped_orders_count: 1,
          delivered_orders_count: 1,
          urgent_demands: [
            {
              _id: 'd1',
              name: 'Remdesivir 100mg Lyophilized',
              quantity: 0,
              reorder_level: 50,
              deficit: 100,
              unit: 'vials',
              price_per_unit: 1800,
            },
            {
              _id: 'd2',
              name: 'Human Insulin 100IU/ml',
              quantity: 14,
              reorder_level: 120,
              deficit: 226,
              unit: 'vials',
              price_per_unit: 185,
            },
            {
              _id: 'd3',
              name: 'Amoxicillin 500mg',
              quantity: 38,
              reorder_level: 200,
              deficit: 362,
              unit: 'capsules',
              price_per_unit: 8.75,
            },
          ],
          recent_orders: [
            {
              _id: 'po1',
              order_number: 'PO-2026-1044',
              status: 'shipped',
              total_order_value: 22250,
              order_date: '2026-10-01',
              courier_name: 'Blue Dart Logistics',
              tracking_number: 'BD-882910429',
            },
            {
              _id: 'po2',
              order_number: 'PO-2026-1088',
              status: 'approved',
              total_order_value: 105000,
              order_date: '2026-10-04',
            },
          ],
        })
      })
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      {/* Vendor B2B Header */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-950 text-white p-6 sm:p-8 rounded-2xl shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-200 border border-indigo-400/30 mb-3">
              <span>🚚</span>
              Pharma Supplier & Manufacturer Portal
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Supplier Hub & Order Fulfillment
            </h1>
            <p className="text-indigo-100 text-sm mt-1 max-w-2xl">
              Add medicines to your supply cart, submit wholesale quotes, manage active purchase orders, and provide consignment tracking.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/vendor/supply-cart')}
              className="px-4 py-2.5 rounded-xl bg-white text-indigo-900 hover:bg-indigo-50 text-sm font-bold shadow-lg transition-all flex items-center gap-2"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Open Medicine Supply Cart
            </button>
            <button
              onClick={() => navigate('/vendor/orders')}
              className="px-4 py-2.5 rounded-xl bg-indigo-700/80 hover:bg-indigo-700 text-white text-sm font-medium border border-indigo-500/30 transition-all"
            >
              Order Pipeline ({data?.approved_orders_count || 0})
            </button>
          </div>
        </div>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => navigate('/vendor/orders')}
          className="card p-5 cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-700 transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Orders to Dispatch
            </span>
            <span className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-sm">
              📦
            </span>
          </div>
          <div className="mt-3 text-3xl font-extrabold text-slate-900 dark:text-white">
            {data?.approved_orders_count || 0} Orders
          </div>
          <div className="mt-1 text-xs text-indigo-600 font-semibold">Approved & ready for shipment</div>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Order Volume
            </span>
            <span className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 text-sm">
              ₹
            </span>
          </div>
          <div className="mt-3 text-3xl font-extrabold text-slate-900 dark:text-white">
            ₹{data?.total_revenue?.toLocaleString('en-IN') || '0'}
          </div>
          <div className="mt-1 text-xs text-slate-500">Across fulfilled healthcare orders</div>
        </div>

        <div
          onClick={() => navigate('/vendor/orders')}
          className="card p-5 cursor-pointer hover:border-purple-300 dark:hover:border-purple-700 transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
              In Transit Consignments
            </span>
            <span className="p-2 rounded-lg bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 text-sm">
              🚚
            </span>
          </div>
          <div className="mt-3 text-3xl font-extrabold text-slate-900 dark:text-white">
            {data?.shipped_orders_count || 0} Shipments
          </div>
          <div className="mt-1 text-xs text-slate-500">En route to central receiving dock</div>
        </div>

        <div
          onClick={() => navigate('/vendor/supply-cart')}
          className="card p-5 cursor-pointer hover:border-amber-300 dark:hover:border-amber-700 transition-all bg-gradient-to-br from-white to-amber-50/20 dark:from-brand-900 dark:to-amber-950/10"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Urgent Depleted Demands
            </span>
            <span className="p-2 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 text-sm">
              ⚡
            </span>
          </div>
          <div className="mt-3 text-3xl font-extrabold text-slate-900 dark:text-white">
            {data?.urgent_demands?.length || 0} Demands
          </div>
          <div className="mt-1 text-xs text-amber-600 font-semibold">Ready for supply cart quote</div>
        </div>
      </div>

      {/* Main Grid: Urgent Demands + Active PO Pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Urgent Warehouse Demand (Vendor Supply Opportunities) */}
        <div className="card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>⚡</span>
                Urgent Warehouse Demands (Supply Opportunities)
              </h2>
              <p className="text-xs text-slate-500">
                Medicines in critical shortage at the central depot that you can supply immediately
              </p>
            </div>
            <button
              onClick={() => navigate('/vendor/supply-cart')}
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Open Cart →
            </button>
          </div>

          <div className="space-y-3">
            {data?.urgent_demands?.map((d) => (
              <div
                key={d._id}
                className="p-3.5 rounded-xl border border-slate-200 dark:border-brand-800 bg-slate-50/70 dark:bg-brand-900/40 flex items-center justify-between gap-3"
              >
                <div>
                  <div className="font-bold text-sm text-slate-900 dark:text-white">{d.name}</div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Warehouse Deficit: <strong className="text-red-600">+{d.deficit} {d.unit}</strong> • Estimated Rate: ₹{d.price_per_unit}
                  </div>
                </div>

                <button
                  onClick={() => navigate('/vendor/supply-cart')}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition-all whitespace-nowrap flex items-center gap-1.5"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  Add to Cart
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Purchase Orders Assigned to Vendor */}
        <div className="card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>📋</span>
                Active Purchase Orders
              </h2>
              <p className="text-xs text-slate-500">
                Purchase orders placed by Central Pharmacy awaiting dispatch
              </p>
            </div>
            <button
              onClick={() => navigate('/vendor/orders')}
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Fulfillment Center →
            </button>
          </div>

          <div className="space-y-3">
            {data?.recent_orders?.map((po) => (
              <div
                key={po._id}
                className="p-3.5 rounded-xl border border-slate-200 dark:border-brand-800 bg-slate-50/70 dark:bg-brand-900/40 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-900 dark:text-white">
                    {po.order_number}
                  </span>
                  <span className={`badge uppercase text-[10px] font-bold ${
                    po.status === 'shipped'
                      ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                      : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                  }`}>
                    {po.status}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Order Value: <strong className="text-slate-900 dark:text-white">₹{po.total_order_value?.toLocaleString('en-IN')}</strong></span>
                  <span>Date: {po.order_date?.slice(0, 10)}</span>
                </div>

                {po.tracking_number && (
                  <div className="text-[11px] text-purple-700 dark:text-purple-300 flex items-center gap-1 font-mono">
                    <span>Tracking:</span>
                    <span className="font-bold">{po.tracking_number}</span>
                    <span>({po.courier_name})</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
