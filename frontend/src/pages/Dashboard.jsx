import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import { Users, UserCheck, Clock, CalendarX, LifeBuoy, Building2, TrendingUp, Bell } from 'lucide-react'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

const attendanceData = [
  { day: 'Mon', present: 42, absent: 8 },
  { day: 'Tue', present: 45, absent: 5 },
  { day: 'Wed', present: 38, absent: 12 },
  { day: 'Thu', present: 47, absent: 3 },
  { day: 'Fri', present: 44, absent: 6 },
]

const deptData = [
  { name: 'Engineering', value: 22 },
  { name: 'HR', value: 8 },
  { name: 'Finance', value: 6 },
  { name: 'Sales', value: 12 },
  { name: 'Marketing', value: 7 },
]

function StatCard({ icon: Icon, label, value, color, sub }) {
  return (
    <div className="stat-card animate-fade-in">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-900">{value ?? '—'}</p>
        <p className="text-xs text-slate-500 mt-0.5">{label}</p>
        {sub && <p className="text-[10px] text-emerald-600 font-medium mt-1">{sub}</p>}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { user } = useAuth()

  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => api.get('/dashboard/stats').then(r => r.data.data),
  })

  const { data: announcements } = useQuery({
    queryKey: ['announcements'],
    queryFn: () => api.get('/dashboard/announcements').then(r => r.data.data),
  })

  const { data: pendingLeaves } = useQuery({
    queryKey: ['pending-leaves'],
    queryFn: () => api.get('/leaves/applications?status=pending').then(r => r.data.data),
  })

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'}, {user?.firstName} 👋
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">{new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users}     label="Total Employees" value={stats?.totalEmployees}  color="bg-primary-500"  sub="↑ 3 this month" />
        <StatCard icon={UserCheck} label="Present Today"   value={stats?.presentToday}    color="bg-emerald-500"  />
        <StatCard icon={CalendarX} label="Pending Leaves"  value={stats?.pendingLeaves}   color="bg-amber-500"    />
        <StatCard icon={LifeBuoy}  label="Open Tickets"    value={stats?.openTickets}     color="bg-rose-500"     />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Attendance Chart */}
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-slate-800 text-sm">Weekly Attendance Overview</h2>
            <span className="badge badge-blue">This Week</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={attendanceData}>
              <defs>
                <linearGradient id="present" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
              <Area type="monotone" dataKey="present" stroke="#6366f1" strokeWidth={2} fill="url(#present)" name="Present" />
              <Area type="monotone" dataKey="absent" stroke="#ef4444" strokeWidth={2} fill="none" name="Absent" strokeDasharray="4 2" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Dept Pie */}
        <div className="card p-5">
          <h2 className="font-semibold text-slate-800 text-sm mb-5">Headcount by Department</h2>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={deptData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                {deptData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-3">
            {deptData.map((d, i) => (
              <div key={d.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                  <span className="text-slate-600">{d.name}</span>
                </div>
                <span className="font-semibold text-slate-800">{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Announcements */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="w-4 h-4 text-primary-600" />
            <h2 className="font-semibold text-slate-800 text-sm">Announcements</h2>
          </div>
          <div className="space-y-3">
            {announcements?.length === 0 && <p className="text-sm text-slate-400">No announcements</p>}
            {announcements?.map(a => (
              <div key={a.id} className="flex gap-3 p-3 bg-slate-50 rounded-lg">
                <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${a.type === 'urgent' ? 'bg-red-500' : a.type === 'policy' ? 'bg-amber-500' : 'bg-primary-500'}`} />
                <div>
                  <p className="text-sm font-medium text-slate-800">{a.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{a.content}</p>
                  <p className="text-[10px] text-slate-400 mt-1">By {a.posted_by_name} · {new Date(a.created_at).toLocaleDateString('en-IN')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pending Leaves */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CalendarX className="w-4 h-4 text-amber-600" />
              <h2 className="font-semibold text-slate-800 text-sm">Pending Leave Requests</h2>
            </div>
            {pendingLeaves?.length > 0 && (
              <span className="badge badge-yellow">{pendingLeaves.length}</span>
            )}
          </div>
          <div className="space-y-2">
            {!pendingLeaves || pendingLeaves.length === 0
              ? <p className="text-sm text-slate-400">No pending requests</p>
              : pendingLeaves.slice(0, 5).map(l => (
                  <div key={l.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-slate-800">{l.employee_name}</p>
                      <p className="text-xs text-slate-500">{l.leave_type_name} · {l.total_days} day(s)</p>
                      <p className="text-[10px] text-slate-400">{new Date(l.from_date).toLocaleDateString('en-IN')} – {new Date(l.to_date).toLocaleDateString('en-IN')}</p>
                    </div>
                    <span className="badge badge-yellow">Pending</span>
                  </div>
                ))
            }
          </div>
        </div>
      </div>
    </div>
  )
}
