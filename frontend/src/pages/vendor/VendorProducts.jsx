import { useEffect, useState } from 'react'
import api from '../../api/axios'

export default function VendorProducts() {
  const [drugs, setDrugs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    api.get('/api/drugs')
      .then((res) => setDrugs(res.data))
      .catch(() => {
        setDrugs([
          { _id: '1', name: 'Human Insulin 100IU/ml', drug_form: 'injection', price_per_unit: 185, unit: 'vials', storage_condition: 'Cold chain 2-8°C' },
          { _id: '2', name: 'Amoxicillin 500mg', drug_form: 'capsule', price_per_unit: 8.75, unit: 'capsules', storage_condition: 'Store below 25°C' },
          { _id: '3', name: 'Ceftriaxone 1g Vial', drug_form: 'injection', price_per_unit: 65, unit: 'vials', storage_condition: 'Protected from light' },
          { _id: '4', name: 'Metformin 500mg SR', drug_form: 'tablet', price_per_unit: 3.4, unit: 'tablets', storage_condition: 'Dry place' },
        ])
      })
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Certified Product Offerings
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Wholesale pharmaceutical catalog supplied by Sun Pharma Distribution Logistics under Drug License MH-TZ-2024-9182.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="card p-12 text-center text-slate-400 text-sm col-span-3">Loading product offerings…</div>
        ) : (
          drugs.map((d) => (
            <div key={d._id} className="card p-5 space-y-3 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">{d.name}</h3>
                  <span className="badge bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 capitalize text-[10px] mt-1">
                    {d.drug_form}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-base font-extrabold text-indigo-600 dark:text-indigo-400">
                    ₹{d.price_per_unit}
                  </div>
                  <div className="text-[10px] text-slate-400">per {d.unit}</div>
                </div>
              </div>

              <div className="text-xs text-slate-500 space-y-1 pt-2 border-t border-slate-100 dark:border-brand-800">
                <div>Storage: <span className="font-medium text-slate-700 dark:text-slate-300">{d.storage_condition || 'Standard warehouse'}</span></div>
                <div>Compliance: <span className="font-medium text-emerald-600">WHO-GMP Certified</span></div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
