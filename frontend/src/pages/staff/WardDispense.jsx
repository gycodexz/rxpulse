import { useEffect, useState } from 'react'
import api from '../../api/axios'
import Alert from '../../components/Alert'

const WARDS = [
  'Trauma Unit 1',
  'Emergency Care',
  'ICU Bed Pod 2',
  'Pulmonology Ward B',
  'Pediatrics Ward',
  'Post-Op Surgical Recovery',
  'Cardiology Ward',
]

export default function WardDispense() {
  const [logs, setLogs] = useState([])
  const [drugs, setDrugs] = useState([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [form, setForm] = useState({
    drug_id: '',
    ward_name: WARDS[0],
    patient_identifier: '',
    quantity: 1,
    prescribed_by: '',
    notes: '',
  })

  const loadData = async () => {
    setLoading(true)
    try {
      const [cRes, dRes] = await Promise.all([
        api.get('/api/consumption'),
        api.get('/api/drugs'),
      ])
      setLogs(cRes.data || [])
      setDrugs(dRes.data || [])
    } catch {
      // Fallback demo data
      setLogs([
        {
          _id: 'c1',
          drug_name: 'Paracetamol 500mg',
          ward_name: 'Trauma Unit 1',
          patient_identifier: 'PT-2026-901',
          quantity: 2,
          unit: 'tablets',
          prescribed_by: 'Dr. Sameer Kulkarni',
          staff_name: 'Sister Priya Sharma',
          date: '2026-10-05T11:20:00',
          notes: 'Administered post-surgery pain relief',
        },
        {
          _id: 'c2',
          drug_name: 'Azithromycin 500mg',
          ward_name: 'Pulmonology Ward B',
          patient_identifier: 'PT-2026-884',
          quantity: 1,
          unit: 'tablets',
          prescribed_by: 'Dr. Joshi',
          staff_name: 'Sister Priya Sharma',
          date: '2026-10-05T10:15:00',
          notes: 'Respiratory tract infection treatment dose',
        },
      ])
      setDrugs([
        { _id: '1', name: 'Paracetamol 500mg', unit: 'tablets' },
        { _id: '2', name: 'Human Insulin 100IU/ml', unit: 'vials' },
        { _id: '3', name: 'Azithromycin 500mg', unit: 'tablets' },
        { _id: '4', name: 'Ceftriaxone 1g Injection', unit: 'vials' },
      ])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.drug_id || !form.patient_identifier || !form.quantity) {
      setError('Please select drug, enter patient ID, and specify dosage quantity')
      return
    }

    const selectedDrug = drugs.find((d) => d._id === form.drug_id)
    setSaving(true)
    setError('')
    try {
      await api.post('/api/consumption', {
        drug_id: form.drug_id,
        drug_name: selectedDrug?.name || 'Medicine',
        ward_name: form.ward_name,
        patient_identifier: form.patient_identifier,
        quantity: Number(form.quantity),
        unit: selectedDrug?.unit || 'units',
        prescribed_by: form.prescribed_by,
        notes: form.notes,
      })
      setSuccess('Patient dispensation recorded successfully in hospital EHR log!')
      setFormOpen(false)
      setForm({ drug_id: '', ward_name: WARDS[0], patient_identifier: '', quantity: 1, prescribed_by: '', notes: '' })
      loadData()
      setTimeout(() => setSuccess(''), 3000)
    } catch {
      setSuccess('Dispensation recorded in demo mode!')
      setLogs((prev) => [
        {
          _id: 'c_' + Date.now(),
          drug_name: selectedDrug?.name || 'Medicine',
          ward_name: form.ward_name,
          patient_identifier: form.patient_identifier,
          quantity: Number(form.quantity),
          unit: selectedDrug?.unit || 'units',
          prescribed_by: form.prescribed_by,
          staff_name: 'Current Staff',
          date: new Date().toISOString(),
          notes: form.notes,
        },
        ...prev,
      ])
      setFormOpen(false)
      setTimeout(() => setSuccess(''), 3000)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Ward Medication Administration & Dispensing Log
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track daily patient bed dispensations across hospital wards and intensive care units.
          </p>
        </div>

        <button
          onClick={() => setFormOpen(true)}
          className="btn-primary flex items-center gap-2 bg-sky-600 hover:bg-sky-700"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Record Patient Dispensation
        </button>
      </div>

      {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}
      {error && !formOpen && <Alert type="error" message={error} onClose={() => setError('')} />}

      <div className="card overflow-x-auto">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">Loading dispensation history…</div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">No patient dispensations logged yet.</div>
        ) : (
          <table className="table-shell">
            <thead>
              <tr>
                <th>Drug Formulation</th>
                <th>Ward / Department</th>
                <th>Patient ID</th>
                <th>Quantity Administered</th>
                <th>Prescribed By</th>
                <th>Dispensed At</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log._id}>
                  <td className="font-bold text-slate-900 dark:text-white">{log.drug_name}</td>
                  <td>
                    <span className="badge bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300">
                      {log.ward_name}
                    </span>
                  </td>
                  <td>
                    <code className="font-mono text-xs bg-slate-100 dark:bg-brand-800 px-2 py-0.5 rounded font-bold">
                      {log.patient_identifier || 'General'}
                    </code>
                  </td>
                  <td className="font-extrabold text-sky-700 dark:text-sky-400 text-sm">
                    {log.quantity} {log.unit}
                  </td>
                  <td className="text-xs text-slate-600 dark:text-slate-300">
                    {log.prescribed_by || 'Attending Physician'}
                  </td>
                  <td className="text-xs text-slate-500">
                    {log.date?.slice(0, 16).replace('T', ' ')}
                  </td>
                  <td className="text-xs text-slate-500 max-w-xs truncate">
                    {log.notes || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Record Dispensation Modal */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="card max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-brand-800 pb-3">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Log Patient Medication Administration
              </h3>
              <button onClick={() => setFormOpen(false)} className="text-slate-400 hover:text-slate-600 text-sm">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label-text">Medicine Formulation *</label>
                <select
                  className="input-field"
                  required
                  value={form.drug_id}
                  onChange={(e) => setForm({ ...form, drug_id: e.target.value })}
                >
                  <option value="">Select Medicine</option>
                  {drugs.map((d) => (
                    <option key={d._id} value={d._id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label-text">Hospital Ward *</label>
                <select
                  className="input-field"
                  value={form.ward_name}
                  onChange={(e) => setForm({ ...form, ward_name: e.target.value })}
                >
                  {WARDS.map((w) => (
                    <option key={w} value={w}>{w}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label-text">Patient Hospital Bed ID *</label>
                  <input
                    className="input-field font-mono"
                    required
                    placeholder="e.g. PT-2026-901"
                    value={form.patient_identifier}
                    onChange={(e) => setForm({ ...form, patient_identifier: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label-text">Dose Quantity *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    className="input-field"
                    value={form.quantity}
                    onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="label-text">Prescribing Physician</label>
                <input
                  className="input-field"
                  placeholder="e.g. Dr. Sameer Kulkarni (MD)"
                  value={form.prescribed_by}
                  onChange={(e) => setForm({ ...form, prescribed_by: e.target.value })}
                />
              </div>

              <div>
                <label className="label-text">Administration / Clinical Notes</label>
                <textarea
                  className="input-field h-16 resize-none text-xs"
                  placeholder="e.g. Post-operative pain dose administered orally"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100 dark:border-brand-800">
                <button
                  type="button"
                  onClick={() => setFormOpen(false)}
                  className="btn-secondary"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary bg-sky-600 hover:bg-sky-700"
                  disabled={saving}
                >
                  {saving ? 'Recording…' : 'Record Administration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
