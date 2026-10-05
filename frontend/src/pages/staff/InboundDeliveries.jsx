import { useEffect, useState } from 'react'
import api from '../../api/axios'
import Alert from '../../components/Alert'

export default function InboundDeliveries() {
  const [distributions, setDistributions] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalDist, setModalDist] = useState(null)
  const [sealIntact, setSealIntact] = useState(true)
  const [coldChainOk, setColdChainOk] = useState(true)
  const [ackNotes, setAckNotes] = useState('Consignment physically inspected. Batch seals intact and cold-chain temperature within 2-8°C.')
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await api.get('/api/distributions')
      setDistributions(res.data || [])
    } catch {
      setDistributions([
        {
          _id: 'dist1',
          distribution_number: 'DIST-2026-8812',
          institution_name: 'Apex Trauma & Multispecialty Hospital',
          dispatch_date: '2026-10-05T08:30:00',
          status: 'dispatched',
          items: [
            { drug_name: 'Paracetamol 500mg', batch_number: 'BT-PCM-2401', quantity: 300, unit: 'tablets' },
            { drug_name: 'Azithromycin 500mg', batch_number: 'BT-AZI-7711', quantity: 100, unit: 'tablets' },
          ],
          notes: 'Priority dispatch for ICU Trauma Unit',
        },
        {
          _id: 'dist2',
          distribution_number: 'DIST-2026-8790',
          institution_name: 'Apex Trauma & Multispecialty Hospital',
          dispatch_date: '2026-09-28T11:00:00',
          delivery_date: '2026-09-29T14:00:00',
          status: 'delivered',
          acknowledgment_notes: 'All items received in good order. Cold chain logs verified.',
          items: [
            { drug_name: 'Human Insulin 100IU/ml', batch_number: 'BT-INS-9901', quantity: 20, unit: 'vials' },
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

  const handleConfirmDelivery = async (e) => {
    e.preventDefault()
    setConfirming(true)
    setError('')
    try {
      await api.patch(`/api/distributions/${modalDist._id}/status`, {
        status: 'delivered',
        acknowledgment_notes: ackNotes,
      })
      setSuccess(`Shipment ${modalDist.distribution_number} confirmed and accepted into hospital dispensary!`)
      setModalDist(null)
      loadData()
      setTimeout(() => setSuccess(''), 4000)
    } catch {
      setSuccess(`Shipment marked delivered in demo mode!`)
      setDistributions((prev) =>
        prev.map((d) =>
          d._id === modalDist._id
            ? { ...d, status: 'delivered', acknowledgment_notes: ackNotes }
            : d
        )
      )
      setModalDist(null)
      setTimeout(() => setSuccess(''), 4000)
    } finally {
      setConfirming(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Inbound Shipments & Receiving Verification
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Accept dispatches from Central Warehouse, inspect batch integrity, and confirm physical reception.
          </p>
        </div>
      </div>

      {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}
      {error && !modalDist && <Alert type="error" message={error} onClose={() => setError('')} />}

      <div className="space-y-4">
        {loading ? (
          <div className="card p-12 text-center text-slate-400 text-sm">Loading inbound shipments…</div>
        ) : distributions.length === 0 ? (
          <div className="card p-12 text-center text-slate-400 text-sm">No shipments recorded.</div>
        ) : (
          distributions.map((d) => (
            <div
              key={d._id}
              className="card p-6 space-y-4 hover:border-sky-300 dark:hover:border-sky-700 transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-brand-800 pb-3">
                <div className="flex items-center gap-3">
                  <span className="font-extrabold text-base text-slate-900 dark:text-white">
                    {d.distribution_number}
                  </span>
                  <span className={`badge uppercase text-[10px] font-bold ${
                    d.status === 'delivered'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                  }`}>
                    {d.status === 'delivered' ? '✓ Received & Stocked' : '🚚 In Transit to Hospital'}
                  </span>
                </div>

                <div>
                  {d.status === 'dispatched' ? (
                    <button
                      onClick={() => setModalDist(d)}
                      className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M5 13l4 4L19 7" />
                      </svg>
                      Confirm Delivery & Accept Batch
                    </button>
                  ) : (
                    <span className="text-xs text-emerald-600 font-semibold">
                      Received on {d.delivery_date?.slice(0, 10) || 'Recent'}
                    </span>
                  )}
                </div>
              </div>

              <div className="text-xs text-slate-500">
                Dispatched from Central Warehouse: {d.dispatch_date?.slice(0, 16).replace('T', ' ')}
                {d.notes && <p className="italic mt-0.5">"{d.notes}"</p>}
              </div>

              {/* Items List */}
              <div className="bg-slate-50 dark:bg-brand-900/40 rounded-xl p-3.5 space-y-1.5">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Consignment Contents
                </div>
                {d.items?.map((it, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs py-1 border-b border-slate-200/50 dark:border-brand-800/40 last:border-0">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{it.drug_name}</span>
                    <div className="flex items-center gap-3">
                      <code className="font-mono text-[11px] bg-slate-200 dark:bg-brand-800 px-2 py-0.5 rounded">
                        Batch: {it.batch_number || 'Standard'}
                      </code>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {it.quantity} {it.unit}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {d.acknowledgment_notes && (
                <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-800 dark:text-emerald-300">
                  <strong>Verification Note:</strong> {d.acknowledgment_notes}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Acceptance Modal */}
      {modalDist && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="card max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-brand-800 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Inspect & Accept Shipment
                </h3>
                <p className="text-xs text-slate-500">
                  {modalDist.distribution_number}
                </p>
              </div>
              <button onClick={() => setModalDist(null)} className="text-slate-400 hover:text-slate-600 text-sm">
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmDelivery} className="space-y-4">
              <div className="p-3 rounded-lg bg-sky-50 dark:bg-sky-950/40 border border-sky-100 dark:border-sky-900 space-y-2 text-xs">
                <div className="font-bold text-sky-900 dark:text-sky-300">
                  Physical Acceptance Checklist:
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sealIntact}
                    onChange={(e) => setSealIntact(e.target.checked)}
                    className="rounded text-sky-600"
                  />
                  <span>Security & tamper seals on cartons intact</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={coldChainOk}
                    onChange={(e) => setColdChainOk(e.target.checked)}
                    className="rounded text-sky-600"
                  />
                  <span>Cold chain data logger verified within 2°C - 8°C</span>
                </label>
              </div>

              <div>
                <label className="label-text">Dispensary Receiving Notes</label>
                <textarea
                  className="input-field h-20 resize-none text-xs"
                  value={ackNotes}
                  onChange={(e) => setAckNotes(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100 dark:border-brand-800">
                <button
                  type="button"
                  onClick={() => setModalDist(null)}
                  className="btn-secondary"
                  disabled={confirming}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary bg-sky-600 hover:bg-sky-700"
                  disabled={confirming}
                >
                  {confirming ? 'Confirming…' : 'Sign & Accept Consignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
