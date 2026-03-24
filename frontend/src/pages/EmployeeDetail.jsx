import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api from '../services/api'
import { ArrowLeft, Mail, Phone, Building2, Briefcase, Calendar, CreditCard, Shield, UserCircle } from 'lucide-react'

function InfoRow({ label, value }) {
  return (
    <div className="py-2 border-b border-slate-50 last:border-0">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="text-sm font-medium text-slate-800 mt-0.5">{value || '—'}</p>
    </div>
  )
}

export default function EmployeeDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const { data, isLoading } = useQuery({
    queryKey: ['employee', id],
    queryFn: () => api.get(`/employees/${id}`).then(r => r.data.data),
  })

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
    </div>
  )

  if (!data) return (
    <div className="text-center py-16 text-slate-400">Employee not found</div>
  )

  const emp = data

  return (
    <div className="animate-fade-in space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/employees')} className="btn-secondary py-1.5"><ArrowLeft className="w-4 h-4" />Back</button>
        <h1 className="page-title">{emp.first_name} {emp.last_name}</h1>
      </div>

      {/* Header */}
      <div className="card p-6">
        <div className="flex flex-col sm:flex-row items-start gap-5">
          <div className="w-20 h-20 rounded-2xl bg-primary-100 flex items-center justify-center flex-shrink-0">
            <span className="text-3xl font-bold text-primary-700">{emp.first_name[0]}{emp.last_name[0]}</span>
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-slate-900">{emp.first_name} {emp.last_name}</h2>
            <p className="text-slate-500 mt-0.5">{emp.designation_title}</p>
            <div className="flex flex-wrap gap-2 mt-3">
              <span className="badge badge-blue">{emp.department_name}</span>
              <span className={`badge ${emp.status === 'active' ? 'badge-green' : 'badge-gray'}`}>{emp.status}</span>
              <span className="badge badge-gray font-mono">{emp.employee_id}</span>
              <span className="badge badge-purple capitalize">{emp.employment_type?.replace('_', ' ')}</span>
            </div>
          </div>
          <div className="text-right text-sm text-slate-500">
            <p>Joined: <span className="font-medium text-slate-800">{emp.date_of_joining ? new Date(emp.date_of_joining).toLocaleDateString('en-IN') : '—'}</span></p>
            {emp.manager_name && <p className="mt-1">Reports to: <span className="font-medium text-slate-800">{emp.manager_name}</span></p>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-3">
            <UserCircle className="w-4 h-4 text-primary-600" />
            <h2 className="font-semibold text-slate-800 text-sm">Personal</h2>
          </div>
          <InfoRow label="Email" value={emp.email} />
          <InfoRow label="Phone" value={emp.phone} />
          <InfoRow label="Date of Birth" value={emp.date_of_birth ? new Date(emp.date_of_birth).toLocaleDateString('en-IN') : null} />
          <InfoRow label="Gender" value={emp.gender} />
          <InfoRow label="Blood Group" value={emp.blood_group} />
          <InfoRow label="Address" value={[emp.city, emp.state].filter(Boolean).join(', ')} />
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-2 mb-3">
            <CreditCard className="w-4 h-4 text-primary-600" />
            <h2 className="font-semibold text-slate-800 text-sm">Bank & Tax</h2>
          </div>
          <InfoRow label="Bank Name" value={emp.bank_name} />
          <InfoRow label="Account Number" value={emp.bank_account_number ? `****${emp.bank_account_number.slice(-4)}` : null} />
          <InfoRow label="IFSC Code" value={emp.bank_ifsc} />
          <InfoRow label="PAN Number" value={emp.pan_number} />
          <InfoRow label="Emergency Contact" value={emp.emergency_contact_name} />
          <InfoRow label="Emergency Phone" value={emp.emergency_contact_phone} />
        </div>

        {emp.salary && (
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-4 h-4 text-primary-600" />
              <h2 className="font-semibold text-slate-800 text-sm">Salary Structure</h2>
            </div>
            {[
              ['Basic Salary', emp.salary.basic_salary],
              ['HRA', emp.salary.hra],
              ['DA', emp.salary.da],
              ['TA', emp.salary.ta],
              ['Medical Allowance', emp.salary.medical_allowance],
              ['Special Allowance', emp.salary.special_allowance],
              ['PF (Employee)', emp.salary.pf_employee],
              ['Professional Tax', emp.salary.professional_tax],
            ].filter(([_, v]) => v > 0).map(([k, v]) => (
              <div key={k} className="py-1.5 border-b border-slate-50 last:border-0 flex justify-between">
                <span className="text-xs text-slate-500">{k}</span>
                <span className="text-xs font-semibold text-slate-800">₹{parseFloat(v).toLocaleString('en-IN')}</span>
              </div>
            ))}
            <div className="mt-3 p-2 bg-primary-50 rounded-lg flex justify-between">
              <span className="text-xs font-bold text-primary-800">Gross CTC</span>
              <span className="text-xs font-bold text-primary-700">
                ₹{[emp.salary.basic_salary, emp.salary.hra, emp.salary.da, emp.salary.ta, emp.salary.medical_allowance, emp.salary.special_allowance].reduce((s, v) => s + parseFloat(v || 0), 0).toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
