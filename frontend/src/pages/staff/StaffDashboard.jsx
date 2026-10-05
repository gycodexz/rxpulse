import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import Alert from '../../components/Alert'

export default function StaffDashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    setLoading(true)
    api.get('/api/dashboard/staff')
      .then((res) => setData(res.data))
      .catch(() => {
        setData({
          in_transit_shipments_count: 1,
          delivered_count: 3,
          in_transit_shipments: [
            {
              _id: 'dist1',
              distribution_number: 'DIST-2026-8812',
              dispatch_date: '2026-10-05T08:30:00',
              items: [
                { drug_name: 'Paracetamol 500mg', quantity: 300, unit: 'tablets' },
                { drug_name: 'Azithromycin 500mg', quantity: 100, unit: 'tablets' },
              ],
              notes: 'Priority dispatch for ICU Emergency Trauma Ward',
            },
          ],
          recent_requisitions: [
            {
              _id: 'req1',
              requisition_number: 'REQ-2026-4410',
              department: 'Emergency Trauma Unit',
              urgency: 'urgent',
              created_at: '2026-10-05T09:00:00',
              items: [
                { drug_name: 'Human Insulin 100IU/ml', requested_quantity: 30, unit: 'vials' },
                { drug_name: 'Ceftriaxone 1g Vial', requested_quantity: 50, unit: 'vials' },
              ],
            },
          ],
          recent_consumption_logs: [
            {
              _id: 'c1',
              drug_name: 'Paracetamol 500mg',
              ward_name: 'Trauma Ward 3',
              patient_identifier: 'PT-2026-901',
              quantity: 2,
              unit: 'tablets',
              prescribed_by: 'Dr. Kulkarni',
              date: '2026-10-05T11:20:00',
            },
            {
              _id: 'c2',
              drug_name: 'Azithromycin 500mg',
              ward_name: 'Pulmonology Ward B',
              patient_identifier: 'PT-2026-884',
              quantity: 1,
              unit: 'tablets',
              prescribed_by: 'Dr. Joshi',
              date: '2026-10-05T10:15:00',
            },
          ],
        })
      })
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      {/* Hospital Staff Header */}
      <div className="bg-gradient-to-r from-sky-800 via-sky-700 to-cyan-900 text-white p-6 sm:p-8 rounded-2xl shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-sky-500/20 text-sky-200 border border-sky-400/30 mb-3">
              <span>🏥</span>
              Hospital Dispensary & Nursing Station
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Hospital Drug Indent & Patient Dispensing
            </h1>
            <p className="text-sky-100 text-sm mt-1 max-w-2xl">
              Order medicines from Central Pharmacy using the requisition cart, verify incoming shipments, and log patient bed dispensations.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/staff/requisition')}
              className="px-4 py-2.5 rounded-xl bg-white text-sky-900 hover:bg-sky-50 text-sm font-bold shadow-lg transition-all flex items-center gap-2"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              New Drug Requisition Cart
            </button>
            <button
              onClick={() => navigate('/staff/dispense')}
              className="px-4 py-2.5 rounded-xl bg-sky-900/60 hover:bg-sky-900 text-white text-sm font-medium border border-sky-400/30 transition-all"
            >
              Log Patient Dispense
            </button>
          </div>
        </div>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => navigate('/staff/deliveries')}
          className="card p-5 cursor-pointer hover:border-sky-300 dark:hover:border-sky-700 transition-all bg-gradient-to-br from-white to-sky-50/30 dark:from-brand-900 dark:to-sky-950/20"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">
              Inbound Shipments
            </span>
            <span className="p-2 rounded-lg bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 text-sm">
              🚚
            </span>
          </div>
          <div className="mt-3 text-3xl font-extrabold text-slate-900 dark:text-white">
            {data?.in_transit_shipments_count || 0} Arriving
          </div>
          <div className="mt-1 text-xs text-sky-600 font-semibold">Ready for delivery confirmation</div>
        </div>

        <div
          onClick={() => navigate('/staff/requisition')}
          className="card p-5 cursor-pointer hover:border-sky-300 dark:hover:border-sky-700 transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Active Indents
            </span>
            <span className="p-2 rounded-lg bg-cyan-100 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 text-sm">
              📋
            </span>
          </div>
          <div className="mt-3 text-3xl font-extrabold text-slate-900 dark:text-white">
            {data?.recent_requisitions?.length || 0} Indents
          </div>
          <div className="mt-1 text-xs text-slate-500">Submitted to central depot</div>
        </div>

        <div
          onClick={() => navigate('/staff/dispense')}
          className="card p-5 cursor-pointer hover:border-sky-300 dark:hover:border-sky-700 transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Patient Dispensing
            </span>
            <span className="p-2 rounded-lg bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 text-sm">
              🩺
            </span>
          </div>
          <div className="mt-3 text-3xl font-extrabold text-slate-900 dark:text-white">
            {data?.recent_consumption_logs?.length || 0} Administered
          </div>
          <div className="mt-1 text-xs text-slate-500">Ward dosage entries today</div>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Station Status
            </span>
            <span className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-sm">
              ✓
            </span>
          </div>
          <div className="mt-3 text-xl font-bold text-slate-900 dark:text-white">
            Dispensary Operational
          </div>
          <div className="mt-1 text-xs text-slate-500">Apex Multispecialty Hospital</div>
        </div>
      </div>

      {/* Main Grid: Incoming Deliveries + Recent Dispensing */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Incoming Shipments Tracker */}
        <div className="card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>🚚</span>
                Inbound Shipments from Central Depot
              </h2>
              <p className="text-xs text-slate-500">
                Dispatches en route that require physical acceptance at the hospital loading bay
              </p>
            </div>
            <button
              onClick={() => navigate('/staff/deliveries')}
              className="text-xs font-bold text-sky-600 hover:underline"
            >
              Accept Deliveries →
            </button>
          </div>

          <div className="space-y-3">
            {data?.in_transit_shipments?.map((s) => (
              <div
                key={s._id}
                className="p-3.5 rounded-xl border border-sky-200 dark:border-sky-900/50 bg-sky-50/50 dark:bg-sky-950/20 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                    {s.distribution_number}
                  </span>
                  <span className="badge bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 text-[10px] font-bold">
                    IN TRANSIT
                  </span>
                </div>

                <div className="text-xs text-slate-600 dark:text-slate-300">
                  {s.items?.map((it) => `${it.drug_name} (${it.quantity} ${it.unit})`).join(' • ')}
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-slate-400">
                    Dispatched: {s.dispatch_date?.slice(0, 10)}
                  </span>
                  <button
                    onClick={() => navigate('/staff/deliveries')}
                    className="px-3 py-1 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-sm"
                  >
                    Inspect & Acknowledge
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Ward Consumption */}
        <div className="card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>🩺</span>
                Recent Ward Dispensations
              </h2>
              <p className="text-xs text-slate-500">
                Live audit of medicines administered to in-patients
              </p>
            </div>
            <button
              onClick={() => navigate('/staff/dispense')}
              className="text-xs font-bold text-sky-600 hover:underline"
            >
              Full Log →
            </button>
          </div>

          <div className="space-y-2.5">
            {data?.recent_consumption_logs?.map((c) => (
              <div
                key={c._id}
                className="p-3 rounded-xl border border-slate-100 dark:border-brand-800 bg-slate-50/60 dark:bg-brand-900/30 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">{c.drug_name}</div>
                  <div className="text-slate-500 text-[11px] mt-0.5">
                    {c.ward_name} • Patient ID: <span className="font-mono">{c.patient_identifier || 'General'}</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-bold text-sky-600 dark:text-sky-400">
                    {c.quantity} {c.unit}
                  </span>
                  <div className="text-[10px] text-slate-400">
                    By {c.prescribed_by || 'Attending Physician'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
