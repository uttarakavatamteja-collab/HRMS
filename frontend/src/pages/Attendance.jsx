import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import { Clock, CheckCircle, XCircle, Calendar, TrendingUp } from 'lucide-react'
import toast from 'react-hot-toast'

function StatusBadge({ status }) {
  const map = { present: 'badge-green', absent: 'badge-red', half_day: 'badge-yellow', late: 'badge-yellow', on_leave: 'badge-blue', holiday: 'badge-purple', weekend: 'badge-gray' }
  return <span className={`badge ${map[status] || 'badge-gray'}`}>{status?.replace('_', ' ')}</span>
}

export default function Attendance() {
  const { user, isHR } = useAuth()
  const qc = useQueryClient()
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())

  const { data: today } = useQuery({
    queryKey: ['attendance-today'],
    queryFn: () => api.get('/attendance/today').then(r => r.data.data),
    refetchInterval: 60000,
  })

  const { data: records, isLoading } = useQuery({
    queryKey: ['attendance', month, year],
    queryFn: () => api.get('/attendance', { params: { month, year } }).then(r => r.data),
  })

  const markMutation = useMutation({
    mutationFn: (type) => api.post('/attendance/mark', { type }),
    onSuccess: (_, type) => {
      toast.success(type === 'check_in' ? '✅ Checked in!' : '✅ Checked out!')
      qc.invalidateQueries(['attendance-today'])
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Error'),
  })

  const canCheckIn = !today?.check_in
  const canCheckOut = today?.check_in && !today?.check_out
  const fmt = (dt) => dt ? new Date(dt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'
  const hours = today?.check_in && today?.check_out
    ? ((new Date(today.check_out) - new Date(today.check_in)) / 36e5).toFixed(1) : null

  return (
    <div className="animate-fade-in space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Attendance</h1>
          <p className="text-sm text-slate-500">Track your attendance and working hours</p>
        </div>
      </div>

      {/* Check In/Out Widget */}
      <div className="card p-6">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="flex-1 text-center md:text-left">
            <p className="text-sm text-slate-500 mb-1">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
            <p className="text-3xl font-bold text-slate-900" id="clock">{new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-2 ${today?.check_in ? 'bg-emerald-100' : 'bg-slate-100'}`}>
                <CheckCircle className={`w-7 h-7 ${today?.check_in ? 'text-emerald-600' : 'text-slate-400'}`} />
              </div>
              <p className="text-xs text-slate-500">Check In</p>
              <p className="text-sm font-semibold text-slate-800">{fmt(today?.check_in)}</p>
            </div>
            <div className="text-center">
              <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-2 ${today?.check_out ? 'bg-rose-100' : 'bg-slate-100'}`}>
                <XCircle className={`w-7 h-7 ${today?.check_out ? 'text-rose-600' : 'text-slate-400'}`} />
              </div>
              <p className="text-xs text-slate-500">Check Out</p>
              <p className="text-sm font-semibold text-slate-800">{fmt(today?.check_out)}</p>
            </div>
            {hours && (
              <div className="text-center">
                <div className="w-14 h-14 rounded-full bg-primary-100 flex items-center justify-center mb-2">
                  <TrendingUp className="w-7 h-7 text-primary-600" />
                </div>
                <p className="text-xs text-slate-500">Hours</p>
                <p className="text-sm font-semibold text-slate-800">{hours}h</p>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button
              disabled={!canCheckIn || markMutation.isPending}
              onClick={() => markMutation.mutate('check_in')}
              className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${canCheckIn ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
            >
              {markMutation.isPending ? '...' : 'Check In'}
            </button>
            <button
              disabled={!canCheckOut || markMutation.isPending}
              onClick={() => markMutation.mutate('check_out')}
              className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${canCheckOut ? 'bg-rose-600 text-white hover:bg-rose-700' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
            >
              {markMutation.isPending ? '...' : 'Check Out'}
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      {records?.summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Present', value: records.summary.present, color: 'bg-emerald-100 text-emerald-700' },
            { label: 'Absent', value: records.summary.absent, color: 'bg-red-100 text-red-700' },
            { label: 'Half Day', value: records.summary.half_day, color: 'bg-amber-100 text-amber-700' },
            { label: 'Avg Hours', value: `${parseFloat(records.summary.avg_hours || 0).toFixed(1)}h`, color: 'bg-primary-100 text-primary-700' },
          ].map(s => (
            <div key={s.label} className="card p-4 text-center">
              <p className={`text-2xl font-bold ${s.color.split(' ')[1]}`}>{s.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Month Filter */}
      <div className="card p-4 flex items-center gap-3">
        <Calendar className="w-4 h-4 text-slate-400" />
        <select className="input w-auto text-sm" value={month} onChange={e => setMonth(parseInt(e.target.value))}>
          {Array.from({length:12}, (_,i) => (
            <option key={i+1} value={i+1}>{new Date(2024, i).toLocaleString('default', {month: 'long'})}</option>
          ))}
        </select>
        <select className="input w-auto text-sm" value={year} onChange={e => setYear(parseInt(e.target.value))}>
          {[2023,2024,2025].map(y => <option key={y}>{y}</option>)}
        </select>
      </div>

      {/* Attendance Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="table-th">Date</th>
                <th className="table-th">Day</th>
                <th className="table-th">Check In</th>
                <th className="table-th">Check Out</th>
                <th className="table-th">Hours</th>
                <th className="table-th">Status</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && <tr><td colSpan={6} className="table-td text-center py-8 text-slate-400">Loading...</td></tr>}
              {records?.data?.map(r => (
                <tr key={r.id} className="table-row">
                  <td className="table-td font-medium">{new Date(r.date).toLocaleDateString('en-IN')}</td>
                  <td className="table-td text-slate-500">{new Date(r.date).toLocaleDateString('en-IN', {weekday:'short'})}</td>
                  <td className="table-td">{fmt(r.check_in)}</td>
                  <td className="table-td">{fmt(r.check_out)}</td>
                  <td className="table-td">{r.working_hours ? `${parseFloat(r.working_hours).toFixed(1)}h` : '—'}</td>
                  <td className="table-td"><StatusBadge status={r.status} /></td>
                </tr>
              ))}
              {!isLoading && (!records?.data || records.data.length === 0) && (
                <tr><td colSpan={6} className="table-td text-center py-8 text-slate-400">No records for this period</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
