import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '../services/api'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts'
import { BarChart2, Download, Users, Clock } from 'lucide-react'

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

const monthlyTurnover = [
  { month: 'Sep', joined: 3, left: 1 }, { month: 'Oct', joined: 2, left: 2 },
  { month: 'Nov', joined: 4, left: 0 }, { month: 'Dec', joined: 1, left: 3 },
  { month: 'Jan', joined: 5, left: 1 }, { month: 'Feb', joined: 3, left: 2 },
]

export default function Reports() {
  const [tab, setTab] = useState('headcount')

  const { data: headcount } = useQuery({
    queryKey: ['report-headcount'],
    queryFn: () => api.get('/reports/headcount').then(r => r.data.data),
  })

  const { data: attendance } = useQuery({
    queryKey: ['report-attendance'],
    queryFn: () => api.get('/reports/attendance-summary').then(r => r.data.data),
  })

  const tabs = [
    { id: 'headcount', label: 'Headcount', icon: Users },
    { id: 'attendance', label: 'Attendance', icon: Clock },
    { id: 'turnover', label: 'Turnover', icon: BarChart2 },
  ]

  return (
    <div className="animate-fade-in space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Reports & Analytics</h1>
          <p className="text-sm text-slate-500">Insights and data-driven HR metrics</p>
        </div>
        <button className="btn-secondary"><Download className="w-4 h-4" />Export Report</button>
      </div>

      {/* Tab Nav */}
      <div className="flex gap-1 bg-slate-100 rounded-lg p-1 w-fit">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${tab === t.id ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>
            <t.icon className="w-3.5 h-3.5" />{t.label}
          </button>
        ))}
      </div>

      {/* Headcount Report */}
      {tab === 'headcount' && headcount && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="card p-5">
            <h2 className="font-semibold text-slate-800 mb-4">Headcount by Department</h2>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={headcount} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="department" tick={{ fontSize: 12 }} width={80} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
                <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} name="Employees" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="card p-5">
            <h2 className="font-semibold text-slate-800 mb-4">Gender Distribution</h2>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={headcount.map(d => ({ name: d.department, value: parseInt(d.count) }))}
                  cx="50%" cy="50%" outerRadius={80} paddingAngle={3} dataKey="value">
                  {headcount.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {headcount.map((d, i) => (
                <div key={d.department} className="flex items-center gap-1.5 text-xs">
                  <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                  <span className="text-slate-600 truncate">{d.department}</span>
                  <span className="font-semibold ml-auto">{d.count}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="card overflow-hidden lg:col-span-2">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-semibold text-slate-800">Department Breakdown</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="table-th">Department</th>
                    <th className="table-th text-center">Total</th>
                    <th className="table-th text-center">Male</th>
                    <th className="table-th text-center">Female</th>
                    <th className="table-th">Share</th>
                  </tr>
                </thead>
                <tbody>
                  {headcount.map(d => {
                    const total = headcount.reduce((s, x) => s + parseInt(x.count), 0)
                    return (
                      <tr key={d.department} className="table-row">
                        <td className="table-td font-medium">{d.department}</td>
                        <td className="table-td text-center font-bold">{d.count}</td>
                        <td className="table-td text-center">{d.male || 0}</td>
                        <td className="table-td text-center">{d.female || 0}</td>
                        <td className="table-td">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-slate-100 rounded-full h-1.5">
                              <div className="bg-primary-500 h-1.5 rounded-full" style={{ width: `${total ? (d.count / total) * 100 : 0}%` }} />
                            </div>
                            <span className="text-xs text-slate-500 w-8">{total ? Math.round((d.count / total) * 100) : 0}%</span>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Attendance Report */}
      {tab === 'attendance' && (
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800">Attendance Summary – {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="table-th">Employee</th>
                  <th className="table-th text-center">Present</th>
                  <th className="table-th text-center">Absent</th>
                  <th className="table-th text-center">Total Days</th>
                  <th className="table-th text-center">Avg Hours</th>
                  <th className="table-th">Attendance %</th>
                </tr>
              </thead>
              <tbody>
                {attendance?.length === 0 && <tr><td colSpan={6} className="table-td text-center py-8 text-slate-400">No data</td></tr>}
                {attendance?.map((r, i) => {
                  const pct = r.total_days > 0 ? Math.round((r.present / r.total_days) * 100) : 0
                  return (
                    <tr key={i} className="table-row">
                      <td className="table-td">
                        <div>
                          <p className="font-medium text-slate-900">{r.name}</p>
                          <p className="text-xs text-slate-400">{r.emp_code}</p>
                        </div>
                      </td>
                      <td className="table-td text-center text-emerald-700 font-medium">{r.present}</td>
                      <td className="table-td text-center text-red-600 font-medium">{r.absent}</td>
                      <td className="table-td text-center">{r.total_days}</td>
                      <td className="table-td text-center">{parseFloat(r.avg_hours || 0).toFixed(1)}h</td>
                      <td className="table-td">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-slate-100 rounded-full h-1.5">
                            <div className={`h-1.5 rounded-full ${pct >= 90 ? 'bg-emerald-500' : pct >= 75 ? 'bg-amber-500' : 'bg-red-500'}`}
                              style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs text-slate-600 w-8">{pct}%</span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Turnover Report */}
      {tab === 'turnover' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="card p-5 lg:col-span-2">
            <h2 className="font-semibold text-slate-800 mb-4">Employee Joinings vs Exits (Last 6 Months)</h2>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={monthlyTurnover}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
                <Legend />
                <Line type="monotone" dataKey="joined" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} name="Joined" />
                <Line type="monotone" dataKey="left" stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} name="Left" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="card p-5">
            <h2 className="font-semibold text-slate-800 mb-3">Attrition Summary</h2>
            <div className="space-y-3">
              {[{ label: 'Annual Attrition Rate', value: '8.2%', trend: '↓ 1.3%', color: 'text-emerald-600' },
                { label: 'Avg Tenure', value: '2.4 yrs', trend: '↑ 0.2 yrs', color: 'text-emerald-600' },
                { label: 'New Joiners (YTD)', value: '18', trend: '↑ 5 vs last yr', color: 'text-emerald-600' },
                { label: 'Exits (YTD)', value: '9', trend: '↓ 2 vs last yr', color: 'text-emerald-600' },
              ].map(s => (
                <div key={s.label} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <span className="text-sm text-slate-600">{s.label}</span>
                  <div className="text-right">
                    <p className="font-bold text-slate-900 text-sm">{s.value}</p>
                    <p className={`text-[10px] ${s.color}`}>{s.trend}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="card p-5">
            <h2 className="font-semibold text-slate-800 mb-3">Exit Reasons</h2>
            <div className="space-y-2">
              {[{ reason: 'Better Opportunity', pct: 45 }, { reason: 'Higher Salary', pct: 30 },
                { reason: 'Personal Reasons', pct: 15 }, { reason: 'Relocation', pct: 10 }].map(r => (
                <div key={r.reason}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-600">{r.reason}</span>
                    <span className="font-medium">{r.pct}%</span>
                  </div>
                  <div className="bg-slate-100 rounded-full h-1.5">
                    <div className="bg-primary-500 h-1.5 rounded-full" style={{ width: `${r.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
