import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import { Plus, Briefcase, Users, ArrowRight } from 'lucide-react'
import toast from 'react-hot-toast'

const STAGES = ['applied', 'screening', 'interview', 'offer', 'hired', 'rejected']

function stageBadge(stage) {
  const map = { applied: 'badge-gray', screening: 'badge-blue', interview: 'badge-yellow', offer: 'badge-purple', hired: 'badge-green', rejected: 'badge-red' }
  return map[stage] || 'badge-gray'
}

export default function Recruitment() {
  const { isHR } = useAuth()
  const qc = useQueryClient()
  const [activeJob, setActiveJob] = useState(null)
  const [tab, setTab] = useState('jobs')

  const { data: jobs } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => api.get('/recruitment/jobs').then(r => r.data.data),
  })

  const { data: candidates } = useQuery({
    queryKey: ['candidates', activeJob],
    queryFn: () => api.get('/recruitment/candidates', { params: activeJob ? { jobPostingId: activeJob } : {} }).then(r => r.data.data),
  })

  const stageMutation = useMutation({
    mutationFn: ({ id, stage }) => api.put(`/recruitment/candidates/${id}/stage`, { stage }),
    onSuccess: () => { toast.success('Stage updated'); qc.invalidateQueries(['candidates']) },
  })

  return (
    <div className="animate-fade-in space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Recruitment</h1>
          <p className="text-sm text-slate-500">Manage job postings and candidates</p>
        </div>
        {isHR() && <button className="btn-primary"><Plus className="w-4 h-4" />Post Job</button>}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-lg p-1 w-fit">
        {['jobs', 'candidates', 'pipeline'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all capitalize ${tab === t ? 'bg-white shadow text-slate-900' : 'text-slate-500'}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'jobs' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {jobs?.map(job => (
            <div key={job.id} className="card p-5 hover:border-primary-200 transition-colors cursor-pointer"
              onClick={() => { setActiveJob(job.id); setTab('candidates') }}>
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                  <Briefcase className="w-5 h-5 text-primary-600" />
                </div>
                <span className={`badge ${job.status === 'active' ? 'badge-green' : 'badge-gray'}`}>{job.status}</span>
              </div>
              <h3 className="font-semibold text-slate-900">{job.title}</h3>
              <p className="text-sm text-slate-500 mt-1">{job.department_name}</p>
              <div className="flex items-center gap-4 mt-3 text-xs text-slate-400">
                <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{job.applicant_count || 0} applicants</span>
                <span>{job.openings} opening{job.openings > 1 ? 's' : ''}</span>
                <span>{job.location}</span>
              </div>
              {job.salary_min && (
                <p className="text-xs text-slate-500 mt-2">
                  ₹{(job.salary_min / 100000).toFixed(1)}L – ₹{(job.salary_max / 100000).toFixed(1)}L
                </p>
              )}
              {job.closing_date && (
                <p className="text-xs text-slate-400 mt-1">Closes {new Date(job.closing_date).toLocaleDateString('en-IN')}</p>
              )}
            </div>
          ))}
          {(!jobs || jobs.length === 0) && (
            <div className="col-span-3 text-center py-12 text-slate-400">No job postings yet</div>
          )}
        </div>
      )}

      {tab === 'candidates' && (
        <div className="card overflow-hidden">
          {activeJob && (
            <div className="p-4 bg-primary-50 border-b border-primary-100 flex items-center gap-2 text-sm">
              <button onClick={() => setActiveJob(null)} className="text-primary-600 hover:underline">All Jobs</button>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-700">{jobs?.find(j => j.id === activeJob)?.title}</span>
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="table-th">Candidate</th>
                  <th className="table-th">Position</th>
                  <th className="table-th">Experience</th>
                  <th className="table-th">Expected CTC</th>
                  <th className="table-th">Stage</th>
                  {isHR() && <th className="table-th">Move Stage</th>}
                </tr>
              </thead>
              <tbody>
                {candidates?.length === 0 && <tr><td colSpan={6} className="table-td text-center py-8 text-slate-400">No candidates</td></tr>}
                {candidates?.map(c => (
                  <tr key={c.id} className="table-row">
                    <td className="table-td">
                      <div>
                        <p className="font-medium text-slate-900">{c.first_name} {c.last_name}</p>
                        <p className="text-xs text-slate-400">{c.email}</p>
                      </div>
                    </td>
                    <td className="table-td">{c.job_title}</td>
                    <td className="table-td">{c.experience_years} yrs</td>
                    <td className="table-td">{c.expected_salary ? `₹${(c.expected_salary/100000).toFixed(1)}L` : '—'}</td>
                    <td className="table-td"><span className={`badge ${stageBadge(c.stage)}`}>{c.stage}</span></td>
                    {isHR() && (
                      <td className="table-td">
                        <select className="input text-xs py-1 w-32" value={c.stage}
                          onChange={e => stageMutation.mutate({ id: c.id, stage: e.target.value })}>
                          {STAGES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                        </select>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'pipeline' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {STAGES.map(stage => (
            <div key={stage} className="card p-4">
              <div className="flex items-center justify-between mb-3">
                <span className={`badge ${stageBadge(stage)} capitalize`}>{stage}</span>
                <span className="text-lg font-bold text-slate-800">
                  {candidates?.filter(c => c.stage === stage).length || 0}
                </span>
              </div>
              <div className="space-y-2">
                {candidates?.filter(c => c.stage === stage).slice(0, 3).map(c => (
                  <div key={c.id} className="text-xs p-2 bg-slate-50 rounded-lg">
                    <p className="font-medium text-slate-700 truncate">{c.first_name} {c.last_name}</p>
                    <p className="text-slate-400 truncate">{c.job_title}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
