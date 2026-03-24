import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import { Plus, Search, Filter, Eye, Edit, UserX, Download } from 'lucide-react'
import toast from 'react-hot-toast'

function AddEmployeeModal({ onClose, departments, designations }) {
  const qc = useQueryClient()
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '', dateOfBirth: '', gender: 'Male',
    departmentId: '', designationId: '', dateOfJoining: '', employmentType: 'full_time',
    basicSalary: '', hra: '', da: '', ta: '', address: '', city: '', state: '', pincode: '',
  })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const mutation = useMutation({
    mutationFn: (data) => api.post('/employees', data),
    onSuccess: () => { toast.success('Employee added!'); qc.invalidateQueries(['employees']); onClose() },
  })

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h2 className="font-bold text-slate-900">Add New Employee</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">&times;</button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">First Name*</label><input className="input" value={form.firstName} onChange={e => set('firstName', e.target.value)} /></div>
            <div><label className="label">Last Name*</label><input className="input" value={form.lastName} onChange={e => set('lastName', e.target.value)} /></div>
          </div>
          <div><label className="label">Email*</label><input type="email" className="input" value={form.email} onChange={e => set('email', e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Phone</label><input className="input" value={form.phone} onChange={e => set('phone', e.target.value)} /></div>
            <div><label className="label">Date of Birth</label><input type="date" className="input" value={form.dateOfBirth} onChange={e => set('dateOfBirth', e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Gender</label>
              <select className="input" value={form.gender} onChange={e => set('gender', e.target.value)}>
                <option>Male</option><option>Female</option><option>Other</option>
              </select>
            </div>
            <div><label className="label">Employment Type</label>
              <select className="input" value={form.employmentType} onChange={e => set('employmentType', e.target.value)}>
                <option value="full_time">Full Time</option><option value="part_time">Part Time</option><option value="contract">Contract</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Department*</label>
              <select className="input" value={form.departmentId} onChange={e => set('departmentId', e.target.value)}>
                <option value="">Select</option>
                {departments?.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div><label className="label">Designation*</label>
              <select className="input" value={form.designationId} onChange={e => set('designationId', e.target.value)}>
                <option value="">Select</option>
                {designations?.map(d => <option key={d.id} value={d.id}>{d.title}</option>)}
              </select>
            </div>
          </div>
          <div><label className="label">Date of Joining*</label><input type="date" className="input" value={form.dateOfJoining} onChange={e => set('dateOfJoining', e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Basic Salary (₹)</label><input type="number" className="input" value={form.basicSalary} onChange={e => set('basicSalary', e.target.value)} /></div>
            <div><label className="label">HRA (₹)</label><input type="number" className="input" value={form.hra} onChange={e => set('hra', e.target.value)} /></div>
          </div>
        </div>
        <div className="flex gap-3 p-5 border-t border-slate-100">
          <button onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
          <button
            onClick={() => mutation.mutate(form)}
            disabled={mutation.isPending || !form.firstName || !form.email || !form.departmentId || !form.dateOfJoining}
            className="btn-primary flex-1 justify-center"
          >
            {mutation.isPending ? 'Adding...' : 'Add Employee'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Employees() {
  const { isHR } = useAuth()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [deptFilter, setDeptFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('active')
  const [showAdd, setShowAdd] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['employees', search, deptFilter, statusFilter],
    queryFn: () => api.get('/employees', { params: { search, department: deptFilter, status: statusFilter } }).then(r => r.data),
  })

  const { data: departments } = useQuery({ queryKey: ['departments'], queryFn: () => api.get('/departments').then(r => r.data.data) })
  const { data: designations } = useQuery({ queryKey: ['designations'], queryFn: () => api.get('/designations').then(r => r.data.data) })

  const statusBadge = (s) => s === 'active' ? 'badge-green' : s === 'inactive' ? 'badge-gray' : 'badge-red'

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Employees</h1>
          <p className="text-sm text-slate-500 mt-0.5">{data?.pagination?.total ?? 0} total employees</p>
        </div>
        {isHR() && (
          <div className="flex gap-2">
            <button className="btn-secondary"><Download className="w-4 h-4" />Export</button>
            <button onClick={() => setShowAdd(true)} className="btn-primary"><Plus className="w-4 h-4" />Add Employee</button>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="card p-4 mb-4 flex flex-wrap gap-3">
        <div className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2 flex-1 min-w-[180px]">
          <Search className="w-4 h-4 text-slate-400" />
          <input className="bg-transparent text-sm outline-none flex-1" placeholder="Search by name, email, ID..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input w-auto text-sm" value={deptFilter} onChange={e => setDeptFilter(e.target.value)}>
          <option value="">All Departments</option>
          {departments?.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <select className="input w-auto text-sm" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="table-th">Employee</th>
                <th className="table-th">ID</th>
                <th className="table-th">Department</th>
                <th className="table-th">Designation</th>
                <th className="table-th">Joining Date</th>
                <th className="table-th">Status</th>
                <th className="table-th">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr><td colSpan={7} className="table-td text-center py-12 text-slate-400">Loading...</td></tr>
              )}
              {!isLoading && data?.data?.length === 0 && (
                <tr><td colSpan={7} className="table-td text-center py-12 text-slate-400">No employees found</td></tr>
              )}
              {data?.data?.map(emp => (
                <tr key={emp.id} className="table-row">
                  <td className="table-td">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-primary-700">{emp.first_name[0]}{emp.last_name[0]}</span>
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{emp.first_name} {emp.last_name}</p>
                        <p className="text-xs text-slate-400">{emp.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="table-td font-mono text-xs text-slate-500">{emp.employee_id}</td>
                  <td className="table-td">{emp.department_name}</td>
                  <td className="table-td">{emp.designation_title}</td>
                  <td className="table-td">{emp.date_of_joining ? new Date(emp.date_of_joining).toLocaleDateString('en-IN') : '—'}</td>
                  <td className="table-td"><span className={`badge ${statusBadge(emp.status)}`}>{emp.status}</span></td>
                  <td className="table-td">
                    <div className="flex items-center gap-1">
                      <button onClick={() => navigate(`/employees/${emp.id}`)} className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500" title="View"><Eye className="w-4 h-4" /></button>
                      {isHR() && <button className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500" title="Edit"><Edit className="w-4 h-4" /></button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showAdd && <AddEmployeeModal onClose={() => setShowAdd(false)} departments={departments} designations={designations} />}
    </div>
  )
}
