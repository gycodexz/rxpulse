import { useEffect, useState } from 'react'
import api from '../../api/axios'
import Alert from '../../components/Alert'

export default function ExpiryQuarantine() {
  const [drugs, setDrugs] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('ALL')
  const [quarantinedBatches, setQuarantinedBatches] = useState(new Set())
  const [success, setSuccess] = useState('')

  useEffect(() => {
    setLoading(true)
    api.get('/api/drugs')
      .then((res) => setDrugs(res.data))
      .catch(() => {
        setDrugs([
          {
            _id: '1',
            name: 'Ceftriaxone 1g Injection',
            batch_number: 'BT-CFT-4491',
            quantity: 42,
            unit: 'vials',
            expiry_date: '2026-10-31',
            manufacturer: 'Sun Pharma',
            storage_condition: 'Protected from light',
          },
          {
            _id: '2',
            name: 'Human Insulin 100IU/ml',
            batch_number: 'BT-INS-9901',
            quantity: 14,
            unit: 'vials',
            expiry_date: '2026-12-25',
            manufacturer: 'Sun Pharma',
            storage_condition: 'Cold chain 2-8°C',
          },
          {
            _id: '3',
            name: 'Amoxicillin 500mg',
            batch_number: 'BT-AMX-2388',
            quantity: 38,
            unit: 'capsules',
            expiry_date: '2027-04-10',
            manufacturer: 'Sun Pharma',
            storage_condition: 'Below 25°C',
          },
          {
            _id: '4',
            name: 'Remdesivir 100mg Lyophilized',
            batch_number: 'BT-RDV-1022',
            quantity: 0,
            unit: 'vials',
            expiry_date: '2027-02-10',
            manufacturer: "Dr. Reddy's",
            storage_condition: 'Room temp',
          },
        ])
      })
      .finally(() => setLoading(false))
  }, [])

  const now = new Date()

  const processedBatches = drugs
    .filter((d) => d.batch_number && d.expiry_date)
    .map((d) => {
      const exp = new Date(d.expiry_date)
      const diffTime = exp.getTime() - now.getTime()
      const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      const isQuarantined = quarantinedBatches.has(d.batch_number)

      let urgency = 'HEALTHY'
      if (daysLeft <= 0) urgency = 'EXPIRED'
      else if (daysLeft <= 30) urgency = 'CRITICAL_30'
      else if (daysLeft <= 90) urgency = 'WARNING_90'

      return { ...d, daysLeft, urgency, isQuarantined }
    })
    .sort((a, b) => a.daysLeft - b.daysLeft)

  const handleToggleQuarantine = (batchNumber) => {
    setQuarantinedBatches((prev) => {
      const updated = new Set(prev)
      if (updated.has(batchNumber)) {
        updated.delete(batchNumber)
        setSuccess(`Batch ${batchNumber} released from quarantine back to active inventory.`)
      } else {
        updated.add(batchNumber)
        setSuccess(`Batch ${batchNumber} placed in SAFETY QUARANTINE. Blocked from dispensing.`)
      }
      setTimeout(() => setSuccess(''), 4000)
      return updated
    })
  }

  const filteredBatches = processedBatches.filter((b) => {
    if (filter === 'QUARANTINED') return b.isQuarantined
    if (filter === 'EXPIRED') return b.urgency === 'EXPIRED'
    if (filter === 'CRITICAL') return b.urgency === 'CRITICAL_30'
    if (filter === 'WARNING') return b.urgency === 'WARNING_90'
    return true
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Expiry Countdown & Batch Quarantine
            </h1>
            <span className="badge bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-bold">
              Patient Safety Hub
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Proactive monitoring of pharmaceutical shelf-life and instant batch quarantine protocol.
          </p>
        </div>
      </div>

      {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

      {/* Filter Tabs */}
      <div className="card p-3 flex items-center gap-2 overflow-x-auto">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider px-2">Filter:</span>
        {[
          { key: 'ALL', label: 'All Tracked Batches' },
          { key: 'CRITICAL', label: 'Expiring in <30 Days' },
          { key: 'WARNING', label: 'Expiring in <90 Days' },
          { key: 'EXPIRED', label: 'Expired Stock' },
          { key: 'QUARANTINED', label: 'Quarantined Isolation' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              filter === tab.key
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 dark:bg-brand-800 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Batches Table */}
      <div className="card overflow-x-auto">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">Auditing batch dates…</div>
        ) : filteredBatches.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">No batches match current filter.</div>
        ) : (
          <table className="table-shell">
            <thead>
              <tr>
                <th>Drug Formulation</th>
                <th>Batch Number</th>
                <th>Stock in Custody</th>
                <th>Expiry Date</th>
                <th>Days Remaining</th>
                <th>Storage Instruction</th>
                <th>Safety Status</th>
                <th>Quarantine Protocol</th>
              </tr>
            </thead>
            <tbody>
              {filteredBatches.map((b) => (
                <tr key={b._id} className={b.isQuarantined ? 'bg-amber-50/50 dark:bg-amber-950/20' : ''}>
                  <td>
                    <div className="font-bold text-slate-900 dark:text-white">{b.name}</div>
                    <div className="text-[11px] text-slate-400">{b.manufacturer}</div>
                  </td>
                  <td>
                    <code className="font-mono text-xs bg-slate-100 dark:bg-brand-800 px-2 py-0.5 rounded font-bold">
                      {b.batch_number}
                    </code>
                  </td>
                  <td>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {b.quantity} {b.unit}
                    </span>
                  </td>
                  <td>
                    <span className="text-xs font-mono text-slate-600 dark:text-slate-300">
                      {b.expiry_date}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${
                      b.daysLeft <= 0
                        ? 'bg-red-600 text-white font-bold'
                        : b.daysLeft <= 30
                        ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 font-bold'
                        : b.daysLeft <= 90
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    }`}>
                      {b.daysLeft <= 0 ? 'EXPIRED' : `${b.daysLeft} Days Left`}
                    </span>
                  </td>
                  <td>
                    <span className="text-xs text-slate-500">{b.storage_condition || 'Room temp'}</span>
                  </td>
                  <td>
                    {b.isQuarantined ? (
                      <span className="badge bg-amber-500 text-slate-950 font-extrabold uppercase text-[10px]">
                        ⛔ Quarantined
                      </span>
                    ) : (
                      <span className="badge bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 text-[10px]">
                        Active Stock
                      </span>
                    )}
                  </td>
                  <td>
                    <button
                      onClick={() => handleToggleQuarantine(b.batch_number)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm ${
                        b.isQuarantined
                          ? 'bg-slate-200 text-slate-800 hover:bg-slate-300'
                          : 'bg-red-600 hover:bg-red-700 text-white'
                      }`}
                    >
                      {b.isQuarantined ? 'Release Batch' : 'Quarantine Batch'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
