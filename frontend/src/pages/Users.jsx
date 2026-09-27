import { useEffect, useState } from 'react'
import api from '../api/axios'
import Alert from '../components/Alert'

export default function Users() {
  const [users, setUsers] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/api/users')
      .then((res) => setUsers(res.data))
      .catch((e) => setError(e.response?.data?.detail || 'Could not load users'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-bold text-slate-800 dark:text-white">Users</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Everyone who can log in to RxPulse</p>
      </div>

      {error && <div className="mb-4"><Alert type="error" message={error} /></div>}

      <div className="card overflow-x-auto">
        {loading ? (
          <div className="p-10 text-center text-slate-400 text-sm">Loading…</div>
        ) : (
          <table className="table-shell">
            <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th></tr></thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id}>
                  <td className="font-medium text-slate-700 dark:text-slate-200">{u.name}</td>
                  <td>{u.email}</td>
                  <td className="capitalize">{u.role?.replace('_', ' ')}</td>
                  <td>
                    <span className={`badge ${u.is_active ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-slate-100 text-slate-500'}`}>
                      {u.is_active ? 'Active' : 'Inactive'}
                    </span>
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
