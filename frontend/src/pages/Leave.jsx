import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import { Plus, Check, X, Calendar } from 'lucide-react'
import toast from 'react-hot-toast'

function ApplyLeaveModal({ leaveTypes, onClose }) {
  const qc = useQueryClient()
  const [form, setForm] = useState({ leaveTypeId: '', fromDate: '', toDate: '', reason: '' })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const mutation = useMutation({
    mutationFn: (d) => api.post('/leaves/apply', d),
    onSuccess: () => { toast.success('Leave applied!'); qc.invalidateQueries(['leave-applications']); qc.invalidateQueries(['leave-balance']); onClose() },
  })

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h2 className="font-bold text-slate-900">Apply for Leave</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl">&times;</button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="label">Leave Type*</label>
            <select className="input" value={form.leaveTypeId} onChange={e => set('leaveTypeId', e.target.value)}>
              <option value="">Select leave type</option>
              {leaveTypes?.map(lt => <option key={lt.id} value={lt.id}>{lt.name} ({lt.code})</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">From Date*</label><input type="date" className="input" value={form.fromDate} onChange={e => set('fromDate', e.target.value)} /></div>
            <div><label className="label">To Date*</label><input type="date" className="input" value={form.toDate} onChange={e => set('toDate', e.target.value)} /></div>
          </div>
          <div>
            <label className="label">Reason*</label>
            <textarea className="input h-24 resize-none" placeholder="Reason for leave..." value={form.reason} onChange={e => set('reason', e.target.value)} />
          </div>
        </div>
        <div className="flex gap-3 p-5 border-t border-slate-100">
          <button onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
          <button
            onClick={() => mutation.mutate(form)}
            disabled={mutation.isPending || !form.leaveTypeId || !form.fromDate || !form.toDate || !form.reason}
            className="btn-primary flex-1 justify-center"
          >
            {mutation.isPending ? 'Applying...' : 'Apply Leave'}
          </button>
        </div>
      </div>
    </div>
  )
}

function StatusBadge({ status }) {
  const map = { pending: 'badge-yellow', approved: 'badge-green', rejected: 'badge-red', cancelled: 'badge-gray' }
  return <span className={`badge ${map[status]}`}>{status}</span>
}

export default function Leave() {
  const { isHR, isManager } = useAuth()
  const qc = useQueryClient()
  const [showApply, setShowApply] = useState(false)
  const [tab, setTab] = useState('my')

  const { data: balance } = useQuery({
    queryKey: ['leave-balance'],
    queryFn: () => api.get('/leaves/balance').then(r => r.data.data),
  })

  const { data: leaveTypes } = useQuery({
    queryKey: ['leave-types'],
    queryFn: () => api.get('/leaves/types').then(r => r.data.data),
  })

  const { data: applications } = useQuery({
    queryKey: ['leave-applications', tab],
    queryFn: () => api.get('/leaves/applications', { params: tab === 'pending' ? { status: 'pending' } : {} }).then(r => r.data.data),
  })

  const { data: holidays } = useQuery({
    queryKey: ['holidays'],
    queryFn: () => api.get('/leaves/holidays').then(r => r.data.data),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, status, remarks }) => api.put(`/leaves/applications/${id}`, { status, remarks }),
    onSuccess: (_, vars) => { toast.success(`Leave ${vars.status}`); qc.invalidateQueries(['leave-applications']) },
  })

  return (
    <div className="animate-fade-in space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Leave Management</h1>
          <p className="text-sm text-slate-500">Manage leave applications and balances</p>
        </div>
        <button onClick={() => setShowApply(true)} className="btn-primary"><Plus className="w-4 h-4" />Apply Leave</button>
      </div>

      {/* Leave Balance Cards */}
      {balance && balance.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {balance.filter(b => ['CL', 'SL', 'EL', 'ML'].includes(b.code)).map(b => (
            <div key={b.id} className="card p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500 uppercase">{b.code}</span>
                <span className={`badge ${b.is_paid ? 'badge-green' : 'badge-gray'}`}>{b.is_paid ? 'Paid' : 'Unpaid'}</span>
              </div>
              <p className="text-2xl font-bold text-slate-900">{b.remaining_days}</p>
              <p className="text-xs text-slate-500">{b.leave_type_name}</p>
              <div className="mt-2 bg-slate-100 rounded-full h-1.5">
                <div className="bg-primary-500 h-1.5 rounded-full transition-all" style={{ width: `${b.total_days > 0 ? (b.remaining_days / b.total_days) * 100 : 0}%` }} />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">{b.used_days} used of {b.total_days}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-lg p-1 w-fit">
        {['my', ...(isManager() ? ['pending', 'all'] : [])].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all capitalize ${tab === t ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>
            {t === 'my' ? 'My Applications' : t === 'pending' ? 'Pending Approval' : 'All'}
          </button>
        ))}
      </div>

      {/* Applications Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="table-th">Employee</th>
                <th className="table-th">Leave Type</th>
                <th className="table-th">From</th>
                <th className="table-th">To</th>
                <th className="table-th">Days</th>
                <th className="table-th">Status</th>
                {isManager() && tab === 'pending' && <th className="table-th">Action</th>}
              </tr>
            </thead>
            <tbody>
              {applications?.length === 0 && <tr><td colSpan={7} className="table-td text-center py-8 text-slate-400">No applications found</td></tr>}
              {applications?.map(a => (
                <tr key={a.id} className="table-row">
                  <td className="table-td">
                    <div>
                      <p className="font-medium text-slate-900">{a.employee_name}</p>
                      <p className="text-xs text-slate-400">{a.emp_code}</p>
                    </div>
                  </td>
                  <td className="table-td">{a.leave_type_name}</td>
                  <td className="table-td">{new Date(a.from_date).toLocaleDateString('en-IN')}</td>
                  <td className="table-td">{new Date(a.to_date).toLocaleDateString('en-IN')}</td>
                  <td className="table-td font-semibold">{a.total_days}</td>
                  <td className="table-td"><StatusBadge status={a.status} /></td>
                  {isManager() && tab === 'pending' && (
                    <td className="table-td">
                      {a.status === 'pending' && (
                        <div className="flex gap-1">
                          <button onClick={() => updateMutation.mutate({ id: a.id, status: 'approved' })}
                            className="p-1.5 bg-emerald-100 text-emerald-700 rounded-md hover:bg-emerald-200 transition-colors" title="Approve">
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => updateMutation.mutate({ id: a.id, status: 'rejected' })}
                            className="p-1.5 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors" title="Reject">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Holidays */}
      {holidays && holidays.length > 0 && (
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-4 h-4 text-primary-600" />
            <h2 className="font-semibold text-slate-800 text-sm">Upcoming Holidays {new Date().getFullYear()}</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {holidays.filter(h => new Date(h.date) >= new Date()).slice(0, 8).map(h => (
              <div key={h.id} className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <p className="text-xs font-semibold text-slate-900">{h.name}</p>
                <p className="text-xs text-slate-500 mt-0.5">{new Date(h.date).toLocaleDateString('en-IN', { day:'numeric', month:'short' })}</p>
                <p className="text-[10px] text-slate-400 capitalize mt-0.5">{h.type}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {showApply && <ApplyLeaveModal leaveTypes={leaveTypes} onClose={() => setShowApply(false)} />}
    </div>
  )
}
