import { useEffect, useState } from 'react'
import api from '../../api/axios'
import Alert from '../../components/Alert'

const SCHEDULE_BADGES = {
  OTC: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
  H: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
  H1: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300',
  X: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 font-bold',
}

const FORMS = ['tablet', 'capsule', 'injection', 'syrup', 'ointment', 'drops', 'inhaler']
const SCHEDULES = ['OTC', 'H', 'H1', 'X']

export default function DrugMasterCatalog() {
  const [drugs, setDrugs] = useState([])
  const [vendors, setVendors] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [scheduleFilter, setScheduleFilter] = useState('ALL')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    name: '',
    generic_name: '',
    manufacturer: '',
    salt_composition: '',
    drug_form: 'tablet',
    schedule: 'OTC',
    storage_condition: '',
    quantity: 0,
    unit: 'tablets',
    price_per_unit: '',
    reorder_level: 50,
    batch_number: '',
    expiry_date: '',
    prescription_required: false,
    vendor_id: '',
  })

  const loadData = async () => {
    setLoading(true)
    try {
      const [dRes, vRes] = await Promise.all([
        api.get('/api/drugs'),
        api.get('/api/vendors'),
      ])
      setDrugs(dRes.data || [])
      setVendors(vRes.data || [])
    } catch {
      // Mock fallback
      setDrugs([
        {
          _id: '1',
          name: 'Paracetamol 500mg',
          generic_name: 'Acetaminophen',
          salt_composition: 'Paracetamol IP 500mg',
          manufacturer: 'Cipla',
          drug_form: 'tablet',
          schedule: 'OTC',
          storage_condition: 'Store below 30°C',
          quantity: 1450,
          unit: 'tablets',
          price_per_unit: 2.5,
          reorder_level: 250,
          batch_number: 'BT-PCM-2401',
          expiry_date: '2027-04-15',
          prescription_required: false,
        },
        {
          _id: '2',
          name: 'Human Insulin 100IU/ml',
          generic_name: 'Recombinant Human Insulin',
          salt_composition: 'Human Insulin IP 100 IU/ml',
          manufacturer: 'Sun Pharma',
          drug_form: 'injection',
          schedule: 'H',
          storage_condition: 'Cold chain 2°C - 8°C (Do not freeze)',
          quantity: 14,
          unit: 'vials',
          price_per_unit: 185,
          reorder_level: 120,
          batch_number: 'BT-INS-9901',
          expiry_date: '2026-12-25',
          prescription_required: true,
        },
        {
          _id: '3',
          name: 'Remdesivir 100mg Lyophilized',
          generic_name: 'Remdesivir',
          salt_composition: 'Remdesivir 100mg sterile powder',
          manufacturer: "Dr. Reddy's",
          drug_form: 'injection',
          schedule: 'H1',
          storage_condition: 'Store below 30°C',
          quantity: 0,
          unit: 'vials',
          price_per_unit: 1800,
          reorder_level: 50,
          batch_number: 'BT-RDV-1022',
          expiry_date: '2027-02-10',
          prescription_required: true,
        },
        {
          _id: '4',
          name: 'Alprazolam 0.5mg Tablets',
          generic_name: 'Alprazolam',
          salt_composition: 'Alprazolam IP 0.5mg',
          manufacturer: "Dr. Reddy's",
          drug_form: 'tablet',
          schedule: 'X',
          storage_condition: 'High security locked vault',
          quantity: 110,
          unit: 'tablets',
          price_per_unit: 5.5,
          reorder_level: 60,
          batch_number: 'BT-ALP-3312',
          expiry_date: '2026-11-20',
          prescription_required: true,
        },
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
    setError('')
    setSaving(true)
    try {
      await api.post('/api/drugs', {
        ...form,
        quantity: Number(form.quantity),
        price_per_unit: Number(form.price_per_unit),
        reorder_level: Number(form.reorder_level),
      })
      setSuccess('Drug registered successfully in catalog!')
      setModalOpen(false)
      loadData()
      setTimeout(() => setSuccess(''), 3000)
    } catch {
      setSuccess('Drug registered in demo mode!')
      setDrugs((prev) => [...prev, { ...form, _id: 'd_' + Date.now() }])
      setModalOpen(false)
      setTimeout(() => setSuccess(''), 3000)
    } finally {
      setSaving(false)
    }
  }

  const filteredDrugs = drugs.filter((d) => {
    const matchesSchedule = scheduleFilter === 'ALL' || d.schedule === scheduleFilter
    const matchesSearch =
      d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.generic_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.salt_composition?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSchedule && matchesSearch
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Drug Master Catalog
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Clinical specifications, salt compositions, schedule restrictions (H/H1/X), and storage controls.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="btn-primary flex items-center gap-2 shadow-sm"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Add New Drug Formulation
        </button>
      </div>

      {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}
      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      {/* Filter and Search Bar */}
      <div className="card p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Schedule:</span>
          {['ALL', 'OTC', 'H', 'H1', 'X'].map((sch) => (
            <button
              key={sch}
              onClick={() => setScheduleFilter(sch)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                scheduleFilter === sch
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 dark:bg-brand-800 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {sch}
            </button>
          ))}
        </div>

        <div className="w-full sm:w-72">
          <input
            type="text"
            className="input-field"
            placeholder="Search brand, generic, or salt…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Drug Catalog Table */}
      <div className="card overflow-x-auto">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">Loading clinical catalog…</div>
        ) : filteredDrugs.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">No drugs found matching criteria.</div>
        ) : (
          <table className="table-shell">
            <thead>
              <tr>
                <th>Drug & Manufacturer</th>
                <th>Salt Composition</th>
                <th>Form</th>
                <th>Schedule</th>
                <th>Storage Condition</th>
                <th>Current Stock</th>
                <th>Batch / Expiry</th>
                <th>Price / Unit</th>
              </tr>
            </thead>
            <tbody>
              {filteredDrugs.map((d) => {
                const isShortage = d.quantity <= d.reorder_level

                return (
                  <tr key={d._id}>
                    <td>
                      <div className="font-bold text-slate-900 dark:text-white">{d.name}</div>
                      <div className="text-[11px] text-slate-400">
                        {d.manufacturer || 'Certified Pharma'} • {d.prescription_required ? 'Rx Only' : 'OTC'}
                      </div>
                    </td>
                    <td>
                      <span className="text-xs text-slate-600 dark:text-slate-300 font-mono">
                        {d.salt_composition || d.generic_name || 'Standard composition'}
                      </span>
                    </td>
                    <td>
                      <span className="badge bg-slate-100 text-slate-700 dark:bg-brand-800 dark:text-slate-200 capitalize">
                        {d.drug_form}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${SCHEDULE_BADGES[d.schedule] || 'bg-slate-100 text-slate-600'}`}>
                        Sch. {d.schedule}
                      </span>
                    </td>
                    <td>
                      <span className="text-xs text-slate-500">
                        {d.storage_condition || 'Store below 25°C'}
                      </span>
                    </td>
                    <td>
                      <span className={`font-extrabold ${isShortage ? 'text-red-600 text-sm' : 'text-emerald-700 dark:text-emerald-400'}`}>
                        {d.quantity} {d.unit}
                      </span>
                      <div className="text-[10px] text-slate-400">Min Buffer: {d.reorder_level}</div>
                    </td>
                    <td>
                      <div className="font-mono text-xs text-slate-700 dark:text-slate-200">{d.batch_number || '—'}</div>
                      <div className="text-[10px] text-slate-400">Exp: {d.expiry_date || '—'}</div>
                    </td>
                    <td>
                      <span className="font-bold text-slate-900 dark:text-white text-xs">
                        ₹{d.price_per_unit}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Drug Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
          <div className="card max-w-2xl w-full p-6 space-y-4 my-8 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-brand-800 pb-3">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Register New Drug Formulation
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-sm">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label-text">Brand / Drug Name *</label>
                  <input
                    className="input-field"
                    required
                    placeholder="e.g. Augmentin 625 Duo"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label-text">Generic Name</label>
                  <input
                    className="input-field"
                    placeholder="e.g. Amoxicillin + Clavulanate"
                    value={form.generic_name}
                    onChange={(e) => setForm({ ...form, generic_name: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="label-text">Salt Composition & Strength</label>
                <input
                  className="input-field font-mono text-xs"
                  placeholder="e.g. Amoxicillin 500mg + Potassium Clavulanate 125mg IP"
                  value={form.salt_composition}
                  onChange={(e) => setForm({ ...form, salt_composition: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="label-text">Dosage Form *</label>
                  <select
                    className="input-field capitalize"
                    value={form.drug_form}
                    onChange={(e) => setForm({ ...form, drug_form: e.target.value })}
                  >
                    {FORMS.map((f) => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label-text">Drug Schedule *</label>
                  <select
                    className="input-field"
                    value={form.schedule}
                    onChange={(e) => setForm({ ...form, schedule: e.target.value })}
                  >
                    {SCHEDULES.map((s) => (
                      <option key={s} value={s}>Schedule {s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label-text">Unit *</label>
                  <input
                    className="input-field"
                    placeholder="tablets / vials"
                    value={form.unit}
                    onChange={(e) => setForm({ ...form, unit: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="label-text">Opening Stock</label>
                  <input
                    type="number"
                    className="input-field"
                    value={form.quantity}
                    onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label-text">Unit Price (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    className="input-field"
                    required
                    value={form.price_per_unit}
                    onChange={(e) => setForm({ ...form, price_per_unit: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label-text">Reorder Level *</label>
                  <input
                    type="number"
                    className="input-field"
                    value={form.reorder_level}
                    onChange={(e) => setForm({ ...form, reorder_level: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label-text">Batch Number</label>
                  <input
                    className="input-field font-mono"
                    placeholder="BT-2026-X01"
                    value={form.batch_number}
                    onChange={(e) => setForm({ ...form, batch_number: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label-text">Expiry Date</label>
                  <input
                    type="date"
                    className="input-field"
                    value={form.expiry_date}
                    onChange={(e) => setForm({ ...form, expiry_date: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="label-text">Storage Instructions</label>
                <input
                  className="input-field"
                  placeholder="e.g. Cold chain 2°C - 8°C or Store below 25°C in dry place"
                  value={form.storage_condition}
                  onChange={(e) => setForm({ ...form, storage_condition: e.target.value })}
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="prescription_required"
                  checked={form.prescription_required}
                  onChange={(e) => setForm({ ...form, prescription_required: e.target.checked })}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="prescription_required" className="text-xs text-slate-700 dark:text-slate-300">
                  Prescription Mandatory (Schedule H / H1 / X Narcotic Guard)
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-brand-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="btn-secondary"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary bg-emerald-600 hover:bg-emerald-700"
                  disabled={saving}
                >
                  {saving ? 'Registering…' : 'Register Drug Formulation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
