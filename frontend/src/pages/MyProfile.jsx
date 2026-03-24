import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import { UserCircle, Mail, Phone, Building2, Briefcase, Calendar, CreditCard, Shield } from 'lucide-react'

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-slate-50 last:border-0">
      <Icon className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
      <div>
        <p className="text-xs text-slate-400">{label}</p>
        <p className="text-sm font-medium text-slate-800 mt-0.5">{value || '—'}</p>
      </div>
    </div>
  )
}

export default function MyProfile() {
  const { user } = useAuth()

  const { data: empData } = useQuery({
    queryKey: ['my-profile', user?.employeeId],
    queryFn: () => api.get(`/employees/${user?.employeeId}`).then(r => r.data.data),
    enabled: !!user?.employeeId,
  })

  const emp = empData || {}

  return (
    <div className="animate-fade-in space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">My Profile</h1>
          <p className="text-sm text-slate-500">View and manage your profile information</p>
        </div>
      </div>

      {/* Profile Header */}
      <div className="card p-6">
        <div className="flex flex-col sm:flex-row items-start gap-5">
          <div className="w-20 h-20 rounded-2xl bg-primary-100 flex items-center justify-center flex-shrink-0">
            <span className="text-3xl font-bold text-primary-700">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </span>
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-slate-900">{user?.firstName} {user?.lastName}</h2>
            <p className="text-slate-500 mt-0.5">{emp.designation_title || '—'}</p>
            <div className="flex flex-wrap gap-3 mt-3">
              <span className="badge badge-blue">{emp.department_name || user?.departmentName || '—'}</span>
              <span className="badge badge-green capitalize">{emp.status || 'active'}</span>
              <span className="badge badge-purple capitalize">{user?.role}</span>
              <span className="badge badge-gray font-mono">{emp.employee_id || '—'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Personal Info */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <UserCircle className="w-4 h-4 text-primary-600" />
            <h2 className="font-semibold text-slate-800 text-sm">Personal Information</h2>
          </div>
          <InfoRow icon={Mail} label="Email" value={user?.email} />
          <InfoRow icon={Phone} label="Phone" value={emp.phone} />
          <InfoRow icon={Calendar} label="Date of Birth" value={emp.date_of_birth ? new Date(emp.date_of_birth).toLocaleDateString('en-IN') : null} />
          <InfoRow icon={UserCircle} label="Gender" value={emp.gender} />
          <InfoRow icon={Shield} label="Blood Group" value={emp.blood_group} />
        </div>

        {/* Work Info */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Briefcase className="w-4 h-4 text-primary-600" />
            <h2 className="font-semibold text-slate-800 text-sm">Work Information</h2>
          </div>
          <InfoRow icon={Building2} label="Department" value={emp.department_name} />
          <InfoRow icon={Briefcase} label="Designation" value={emp.designation_title} />
          <InfoRow icon={UserCircle} label="Reporting Manager" value={emp.manager_name} />
          <InfoRow icon={Calendar} label="Date of Joining" value={emp.date_of_joining ? new Date(emp.date_of_joining).toLocaleDateString('en-IN') : null} />
          <InfoRow icon={Shield} label="Employment Type" value={emp.employment_type?.replace('_', ' ')} />
        </div>

        {/* Bank & Documents */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="w-4 h-4 text-primary-600" />
            <h2 className="font-semibold text-slate-800 text-sm">Bank Details</h2>
          </div>
          <InfoRow icon={CreditCard} label="Bank Name" value={emp.bank_name} />
          <InfoRow icon={CreditCard} label="Account Number" value={emp.bank_account_number ? `****${emp.bank_account_number?.slice(-4)}` : null} />
          <InfoRow icon={CreditCard} label="IFSC Code" value={emp.bank_ifsc} />
          <InfoRow icon={Shield} label="PAN Number" value={emp.pan_number} />
          <InfoRow icon={Shield} label="Aadhar" value={emp.aadhar_number ? `****-****-${emp.aadhar_number?.slice(-4)}` : null} />
        </div>
      </div>

      {/* Address */}
      {emp.address && (
        <div className="card p-5">
          <h2 className="font-semibold text-slate-800 text-sm mb-3">Address</h2>
          <p className="text-sm text-slate-700">{[emp.address, emp.city, emp.state, emp.pincode].filter(Boolean).join(', ')}</p>
        </div>
      )}

      {/* Salary Preview (only own) */}
      {emp.salary && (
        <div className="card p-5">
          <h2 className="font-semibold text-slate-800 text-sm mb-4">Salary Overview</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Basic Salary', value: emp.salary.basic_salary },
              { label: 'HRA', value: emp.salary.hra },
              { label: 'PF (Employee)', value: emp.salary.pf_employee },
              { label: 'Gross CTC', value: parseFloat(emp.salary.basic_salary || 0) + parseFloat(emp.salary.hra || 0) + parseFloat(emp.salary.da || 0) + parseFloat(emp.salary.ta || 0) + parseFloat(emp.salary.medical_allowance || 0) + parseFloat(emp.salary.special_allowance || 0) },
            ].map(s => (
              <div key={s.label} className="p-3 bg-slate-50 rounded-lg">
                <p className="text-xs text-slate-500">{s.label}</p>
                <p className="text-base font-bold text-slate-900 mt-1">₹{parseFloat(s.value || 0).toLocaleString('en-IN')}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
