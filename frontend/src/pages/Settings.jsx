import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { Settings as SettingsIcon, Building2, Users, Calendar, Bell, Shield, Database } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Settings() {
  const { user, isAdmin } = useAuth()
  const [tab, setTab] = useState('company')
  const [companyForm, setCompanyForm] = useState({
    name: 'My Company Pvt Ltd', email: 'hr@company.com', phone: '+91-80-1234-5678',
    address: 'Bangalore, Karnataka', cin: 'U72900KA2020PTC123456', pan: 'AABCM1234D',
    workingDays: '5', workingHours: '8', timezone: 'Asia/Kolkata',
  })

  const tabs = [
    { id: 'company', label: 'Company', icon: Building2 },
    { id: 'roles', label: 'Roles & Access', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'leave-policy', label: 'Leave Policy', icon: Calendar },
  ]

  const handleSave = () => toast.success('Settings saved successfully!')

  return (
    <div className="animate-fade-in space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="text-sm text-slate-500">Configure your HRMS system settings</p>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Sidebar Tabs */}
        <div className="w-48 flex-shrink-0 space-y-1">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left
                ${tab === t.id ? 'bg-primary-50 text-primary-700' : 'text-slate-600 hover:bg-slate-100'}`}>
              <t.icon className="w-4 h-4" />{t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1">
          {tab === 'company' && (
            <div className="card p-6 space-y-5">
              <h2 className="font-semibold text-slate-900">Company Information</h2>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label">Company Name</label><input className="input" value={companyForm.name} onChange={e => setCompanyForm({...companyForm, name: e.target.value})} /></div>
                <div><label className="label">HR Email</label><input className="input" value={companyForm.email} onChange={e => setCompanyForm({...companyForm, email: e.target.value})} /></div>
                <div><label className="label">Phone</label><input className="input" value={companyForm.phone} onChange={e => setCompanyForm({...companyForm, phone: e.target.value})} /></div>
                <div><label className="label">Address</label><input className="input" value={companyForm.address} onChange={e => setCompanyForm({...companyForm, address: e.target.value})} /></div>
                <div><label className="label">CIN</label><input className="input" value={companyForm.cin} onChange={e => setCompanyForm({...companyForm, cin: e.target.value})} /></div>
                <div><label className="label">PAN</label><input className="input" value={companyForm.pan} onChange={e => setCompanyForm({...companyForm, pan: e.target.value})} /></div>
              </div>
              <hr className="border-slate-100" />
              <h3 className="font-medium text-slate-800">Work Settings</h3>
              <div className="grid grid-cols-3 gap-4">
                <div><label className="label">Working Days/Week</label>
                  <select className="input" value={companyForm.workingDays} onChange={e => setCompanyForm({...companyForm, workingDays: e.target.value})}>
                    <option value="5">5 Days (Mon–Fri)</option><option value="6">6 Days (Mon–Sat)</option>
                  </select>
                </div>
                <div><label className="label">Working Hours/Day</label><input type="number" className="input" value={companyForm.workingHours} onChange={e => setCompanyForm({...companyForm, workingHours: e.target.value})} /></div>
                <div><label className="label">Timezone</label>
                  <select className="input" value={companyForm.timezone} onChange={e => setCompanyForm({...companyForm, timezone: e.target.value})}>
                    <option value="Asia/Kolkata">Asia/Kolkata (IST)</option><option value="UTC">UTC</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end">
                <button onClick={handleSave} className="btn-primary">Save Changes</button>
              </div>
            </div>
          )}

          {tab === 'roles' && (
            <div className="card p-6">
              <h2 className="font-semibold text-slate-900 mb-4">Roles & Permissions</h2>
              <div className="space-y-4">
                {[
                  { role: 'Admin', desc: 'Full access to all modules', perms: ['Manage Employees', 'Run Payroll', 'Approve Leaves', 'Manage Settings', 'View Reports', 'Manage Recruitment'] },
                  { role: 'HR', desc: 'HR operations and employee management', perms: ['Manage Employees', 'Run Payroll', 'Approve Leaves', 'View Reports', 'Manage Recruitment'] },
                  { role: 'Manager', desc: 'Team management and approvals', perms: ['View Team', 'Approve Leaves', 'View Attendance', 'Performance Reviews'] },
                  { role: 'Employee', desc: 'Self-service portal', perms: ['View Own Profile', 'Apply Leave', 'View Payslip', 'Mark Attendance', 'Raise Tickets'] },
                ].map(r => (
                  <div key={r.role} className="p-4 border border-slate-100 rounded-xl">
                    <div className="flex items-center gap-3 mb-2">
                      <Shield className="w-4 h-4 text-primary-600" />
                      <h3 className="font-semibold text-slate-800">{r.role}</h3>
                      <span className="text-xs text-slate-400">{r.desc}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {r.perms.map(p => <span key={p} className="badge badge-blue">{p}</span>)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'notifications' && (
            <div className="card p-6">
              <h2 className="font-semibold text-slate-900 mb-4">Notification Preferences</h2>
              <div className="space-y-4">
                {[
                  { label: 'Leave Application Submitted', desc: 'Notify manager when employee applies leave' },
                  { label: 'Leave Approved/Rejected', desc: 'Notify employee of leave decision' },
                  { label: 'Payroll Processed', desc: 'Notify employees when payslip is ready' },
                  { label: 'New Helpdesk Ticket', desc: 'Notify HR team on new ticket' },
                  { label: 'Birthday Reminders', desc: 'Notify HR on employee birthdays' },
                  { label: 'Work Anniversary', desc: 'Notify on work anniversaries' },
                  { label: 'Attendance Regularization', desc: 'Notify on regularization requests' },
                ].map((n, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-slate-800">{n.label}</p>
                      <p className="text-xs text-slate-400">{n.desc}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked className="sr-only peer" />
                      <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-5 peer-checked:bg-primary-600 after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all" />
                    </label>
                  </div>
                ))}
              </div>
              <div className="flex justify-end mt-5">
                <button onClick={handleSave} className="btn-primary">Save Preferences</button>
              </div>
            </div>
          )}

          {tab === 'leave-policy' && (
            <div className="card p-6">
              <h2 className="font-semibold text-slate-900 mb-4">Leave Policy Configuration</h2>
              <div className="space-y-4">
                {[
                  { type: 'Casual Leave (CL)', days: 12, carryForward: false, paid: true },
                  { type: 'Sick Leave (SL)', days: 12, carryForward: false, paid: true },
                  { type: 'Earned Leave (EL)', days: 21, carryForward: true, paid: true },
                  { type: 'Maternity Leave (ML)', days: 180, carryForward: false, paid: true },
                  { type: 'Paternity Leave (PL)', days: 5, carryForward: false, paid: true },
                ].map((l, i) => (
                  <div key={i} className="p-4 border border-slate-100 rounded-xl grid grid-cols-4 gap-4 items-center">
                    <div>
                      <p className="text-sm font-medium text-slate-800">{l.type}</p>
                    </div>
                    <div>
                      <label className="label">Days/Year</label>
                      <input type="number" className="input" defaultValue={l.days} />
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id={`cf-${i}`} defaultChecked={l.carryForward} className="accent-primary-600" />
                      <label htmlFor={`cf-${i}`} className="text-sm text-slate-600">Carry Forward</label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id={`paid-${i}`} defaultChecked={l.paid} className="accent-primary-600" />
                      <label htmlFor={`paid-${i}`} className="text-sm text-slate-600">Paid</label>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-end mt-5">
                <button onClick={handleSave} className="btn-primary">Update Policy</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
