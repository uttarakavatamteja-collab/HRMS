import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import { DollarSign, Play, FileText, Download } from 'lucide-react'
import toast from 'react-hot-toast'

function StatusBadge({ status }) {
  const map = { draft: 'badge-gray', processed: 'badge-blue', paid: 'badge-green' }
  return <span className={`badge ${map[status] || 'badge-gray'}`}>{status}</span>
}

function PayslipModal({ payroll, onClose }) {
  if (!payroll) return null
  const fmt = (n) => `₹${parseFloat(n || 0).toLocaleString('en-IN')}`

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box max-w-2xl" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="font-bold text-slate-900 text-lg">Payslip</h2>
              <p className="text-sm text-slate-500">{new Date(2024, payroll.month - 1).toLocaleString('default', { month: 'long' })} {payroll.year}</p>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl">&times;</button>
          </div>
        </div>
        <div className="p-6 space-y-5">
          {/* Employee Info */}
          <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg text-sm">
            <div><span className="text-slate-500">Name:</span> <span className="font-medium">{payroll.first_name} {payroll.last_name}</span></div>
            <div><span className="text-slate-500">Emp ID:</span> <span className="font-medium">{payroll.emp_code}</span></div>
            <div><span className="text-slate-500">Department:</span> <span className="font-medium">{payroll.department_name}</span></div>
            <div><span className="text-slate-500">Designation:</span> <span className="font-medium">{payroll.designation_title}</span></div>
            <div><span className="text-slate-500">Working Days:</span> <span className="font-medium">{payroll.working_days}</span></div>
            <div><span className="text-slate-500">Present Days:</span> <span className="font-medium">{payroll.present_days}</span></div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Earnings */}
            <div>
              <h3 className="font-semibold text-slate-800 mb-3 text-sm">Earnings</h3>
              <div className="space-y-2 text-sm">
                {[['Basic Salary', payroll.basic_salary], ['HRA', payroll.hra], ['DA', payroll.da], ['TA', payroll.ta], ['Medical Allowance', payroll.medical_allowance], ['Special Allowance', payroll.special_allowance]].map(([k, v]) => v > 0 && (
                  <div key={k} className="flex justify-between">
                    <span className="text-slate-600">{k}</span>
                    <span className="font-medium">{fmt(v)}</span>
                  </div>
                ))}
                <div className="flex justify-between border-t pt-2 font-semibold text-emerald-700">
                  <span>Gross Salary</span><span>{fmt(payroll.gross_salary)}</span>
                </div>
              </div>
            </div>
            {/* Deductions */}
            <div>
              <h3 className="font-semibold text-slate-800 mb-3 text-sm">Deductions</h3>
              <div className="space-y-2 text-sm">
                {[['PF (Employee)', payroll.pf_employee], ['ESI (Employee)', payroll.esi_employee], ['Professional Tax', payroll.professional_tax], ['TDS', payroll.tds]].map(([k, v]) => v > 0 && (
                  <div key={k} className="flex justify-between">
                    <span className="text-slate-600">{k}</span>
                    <span className="font-medium text-red-600">- {fmt(v)}</span>
                  </div>
                ))}
                <div className="flex justify-between border-t pt-2 font-semibold text-red-700">
                  <span>Total Deductions</span><span>- {fmt(payroll.total_deductions)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-primary-50 border border-primary-200 rounded-xl p-4 flex justify-between items-center">
            <span className="font-bold text-primary-900 text-lg">Net Salary</span>
            <span className="font-bold text-primary-700 text-2xl">{fmt(payroll.net_salary)}</span>
          </div>
        </div>
        <div className="p-5 border-t border-slate-100 flex justify-end gap-3">
          <button onClick={onClose} className="btn-secondary">Close</button>
          <button onClick={() => window.print()} className="btn-primary"><Download className="w-4 h-4" />Download</button>
        </div>
      </div>
    </div>
  )
}

export default function Payroll() {
  const { isHR } = useAuth()
  const qc = useQueryClient()
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())
  const [selectedPayroll, setSelectedPayroll] = useState(null)

  const { data: payrolls, isLoading } = useQuery({
    queryKey: ['payrolls', month, year],
    queryFn: () => api.get('/payroll', { params: { month, year } }).then(r => r.data.data),
  })

  const processMutation = useMutation({
    mutationFn: () => api.post('/payroll/process', { month, year }),
    onSuccess: (r) => {
      toast.success(`Payroll processed for ${r.data.data.length} employees`)
      qc.invalidateQueries(['payrolls'])
    },
  })

  const openPayslip = async (p) => {
    const res = await api.get(`/payroll/${p.id}/payslip`)
    setSelectedPayroll(res.data.data)
  }

  const fmt = (n) => `₹${parseFloat(n || 0).toLocaleString('en-IN')}`
  const totalNet = payrolls?.reduce((s, p) => s + parseFloat(p.net_salary || 0), 0) || 0

  return (
    <div className="animate-fade-in space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Payroll</h1>
          <p className="text-sm text-slate-500">Manage employee salaries and payslips</p>
        </div>
        {isHR() && (
          <button onClick={() => processMutation.mutate()} disabled={processMutation.isPending} className="btn-primary">
            <Play className="w-4 h-4" />
            {processMutation.isPending ? 'Processing...' : 'Run Payroll'}
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="card p-4 flex items-center gap-3">
        <DollarSign className="w-4 h-4 text-slate-400" />
        <select className="input w-auto text-sm" value={month} onChange={e => setMonth(parseInt(e.target.value))}>
          {Array.from({length:12}, (_,i) => <option key={i+1} value={i+1}>{new Date(2024,i).toLocaleString('default',{month:'long'})}</option>)}
        </select>
        <select className="input w-auto text-sm" value={year} onChange={e => setYear(parseInt(e.target.value))}>
          {[2023,2024,2025].map(y => <option key={y}>{y}</option>)}
        </select>
        {payrolls?.length > 0 && (
          <div className="ml-auto flex items-center gap-2 text-sm">
            <span className="text-slate-500">Total Payout:</span>
            <span className="font-bold text-emerald-700 text-base">{fmt(totalNet)}</span>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="table-th">Employee</th>
                <th className="table-th">Department</th>
                <th className="table-th">Working Days</th>
                <th className="table-th">Present</th>
                <th className="table-th">LOP Days</th>
                <th className="table-th">Gross Salary</th>
                <th className="table-th">Deductions</th>
                <th className="table-th">Net Salary</th>
                <th className="table-th">Status</th>
                <th className="table-th">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && <tr><td colSpan={10} className="table-td text-center py-8 text-slate-400">Loading...</td></tr>}
              {!isLoading && (!payrolls || payrolls.length === 0) && (
                <tr><td colSpan={10} className="table-td text-center py-8 text-slate-400">
                  {isHR() ? 'No payroll data. Click "Run Payroll" to process.' : 'No payroll data for this period.'}
                </td></tr>
              )}
              {payrolls?.map(p => (
                <tr key={p.id} className="table-row">
                  <td className="table-td">
                    <div>
                      <p className="font-medium text-slate-900">{p.employee_name}</p>
                      <p className="text-xs text-slate-400">{p.emp_code}</p>
                    </div>
                  </td>
                  <td className="table-td">{p.department_name}</td>
                  <td className="table-td text-center">{p.working_days}</td>
                  <td className="table-td text-center">{p.present_days}</td>
                  <td className="table-td text-center text-red-600">{p.loss_of_pay_days || 0}</td>
                  <td className="table-td font-medium">{fmt(p.gross_salary)}</td>
                  <td className="table-td text-red-600">- {fmt(p.total_deductions)}</td>
                  <td className="table-td font-bold text-emerald-700">{fmt(p.net_salary)}</td>
                  <td className="table-td"><StatusBadge status={p.status} /></td>
                  <td className="table-td">
                    <button onClick={() => openPayslip(p)} className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500" title="View Payslip">
                      <FileText className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedPayroll && <PayslipModal payroll={selectedPayroll} onClose={() => setSelectedPayroll(null)} />}
    </div>
  )
}
