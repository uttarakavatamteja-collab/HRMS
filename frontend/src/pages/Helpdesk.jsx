import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import { Plus, MessageCircle, Clock, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

const CATEGORIES = ['payroll', 'leave', 'it_support', 'hr_policy', 'general']
const PRIORITIES = ['low', 'medium', 'high', 'critical']

function NewTicketModal({ onClose }) {
  const qc = useQueryClient()
  const [form, setForm] = useState({ category: 'general', subject: '', description: '', priority: 'medium' })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const mutation = useMutation({
    mutationFn: (d) => api.post('/helpdesk/tickets', d),
    onSuccess: () => { toast.success('Ticket created!'); qc.invalidateQueries(['tickets']); onClose() },
  })

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h2 className="font-bold text-slate-900">Raise a Ticket</h2>
          <button onClick={onClose} className="text-slate-400 text-xl">&times;</button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Category*</label>
              <select className="input" value={form.category} onChange={e => set('category', e.target.value)}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c.replace('_', ' ').toUpperCase()}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Priority</label>
              <select className="input" value={form.priority} onChange={e => set('priority', e.target.value)}>
                {PRIORITIES.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
              </select>
            </div>
          </div>
          <div><label className="label">Subject*</label><input className="input" value={form.subject} onChange={e => set('subject', e.target.value)} placeholder="Brief description of issue" /></div>
          <div><label className="label">Description*</label><textarea className="input h-28 resize-none" value={form.description} onChange={e => set('description', e.target.value)} placeholder="Detailed description..." /></div>
        </div>
        <div className="flex gap-3 p-5 border-t border-slate-100">
          <button onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
          <button onClick={() => mutation.mutate(form)} disabled={mutation.isPending || !form.subject || !form.description} className="btn-primary flex-1 justify-center">
            {mutation.isPending ? 'Creating...' : 'Create Ticket'}
          </button>
        </div>
      </div>
    </div>
  )
}

function PriorityBadge({ priority }) {
  const map = { low: 'badge-green', medium: 'badge-blue', high: 'badge-yellow', critical: 'badge-red' }
  return <span className={`badge ${map[priority] || 'badge-gray'}`}>{priority}</span>
}
function StatusBadge({ status }) {
  const map = { open: 'badge-blue', in_progress: 'badge-yellow', resolved: 'badge-green', closed: 'badge-gray' }
  return <span className={`badge ${map[status] || 'badge-gray'}`}>{status?.replace('_', ' ')}</span>
}

export default function Helpdesk() {
  const { isHR } = useAuth()
  const qc = useQueryClient()
  const [showNew, setShowNew] = useState(false)
  const [statusFilter, setStatusFilter] = useState('')
  const [catFilter, setCatFilter] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['tickets', statusFilter, catFilter],
    queryFn: () => api.get('/helpdesk/tickets', { params: { status: statusFilter, category: catFilter } }).then(r => r.data),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, ...body }) => api.put(`/helpdesk/tickets/${id}`, body),
    onSuccess: () => { toast.success('Ticket updated'); qc.invalidateQueries(['tickets']) },
  })

  const stats = {
    open: data?.data?.filter(t => t.status === 'open').length || 0,
    inProgress: data?.data?.filter(t => t.status === 'in_progress').length || 0,
    resolved: data?.data?.filter(t => t.status === 'resolved').length || 0,
  }

  return (
    <div className="animate-fade-in space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">HR Helpdesk</h1>
          <p className="text-sm text-slate-500">Raise and track support requests</p>
        </div>
        <button onClick={() => setShowNew(true)} className="btn-primary"><Plus className="w-4 h-4" />New Ticket</button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Open', value: stats.open, icon: MessageCircle, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'In Progress', value: stats.inProgress, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Resolved', value: stats.resolved, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        ].map(s => (
          <div key={s.label} className={`card p-4 flex items-center gap-3 ${s.bg}`}>
            <s.icon className={`w-5 h-5 ${s.color}`} />
            <div>
              <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-slate-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-3">
        <select className="input w-auto text-sm" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All Status</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
        <select className="input w-auto text-sm" value={catFilter} onChange={e => setCatFilter(e.target.value)}>
          <option value="">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c.replace('_', ' ').toUpperCase()}</option>)}
        </select>
      </div>

      {/* Tickets Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="table-th">Ticket #</th>
                <th className="table-th">Employee</th>
                <th className="table-th">Category</th>
                <th className="table-th">Subject</th>
                <th className="table-th">Priority</th>
                <th className="table-th">Status</th>
                <th className="table-th">Created</th>
                {isHR() && <th className="table-th">Action</th>}
              </tr>
            </thead>
            <tbody>
              {isLoading && <tr><td colSpan={8} className="table-td text-center py-8 text-slate-400">Loading...</td></tr>}
              {data?.data?.length === 0 && <tr><td colSpan={8} className="table-td text-center py-8 text-slate-400">No tickets found</td></tr>}
              {data?.data?.map(t => (
                <tr key={t.id} className="table-row">
                  <td className="table-td font-mono text-xs text-primary-600">{t.ticket_number}</td>
                  <td className="table-td">
                    <div>
                      <p className="font-medium text-slate-900">{t.employee_name}</p>
                      <p className="text-xs text-slate-400">{t.emp_code}</p>
                    </div>
                  </td>
                  <td className="table-td"><span className="badge badge-purple capitalize">{t.category.replace('_', ' ')}</span></td>
                  <td className="table-td max-w-xs truncate">{t.subject}</td>
                  <td className="table-td"><PriorityBadge priority={t.priority} /></td>
                  <td className="table-td"><StatusBadge status={t.status} /></td>
                  <td className="table-td text-slate-400 text-xs">{new Date(t.created_at).toLocaleDateString('en-IN')}</td>
                  {isHR() && (
                    <td className="table-td">
                      <select
                        className="input text-xs py-1 w-28"
                        value={t.status}
                        onChange={e => updateMutation.mutate({ id: t.id, status: e.target.value })}
                      >
                        <option value="open">Open</option>
                        <option value="in_progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                      </select>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showNew && <NewTicketModal onClose={() => setShowNew(false)} />}
    </div>
  )
}
