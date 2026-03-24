import { useQuery } from '@tanstack/react-query'
import api from '../services/api'
import { TrendingUp, Star, Target, Award } from 'lucide-react'

function RatingStars({ rating }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(i => (
        <Star key={i} className={`w-3.5 h-3.5 ${i <= Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} />
      ))}
      <span className="text-xs text-slate-500 ml-1">{parseFloat(rating || 0).toFixed(1)}</span>
    </div>
  )
}

function StatusBadge({ status }) {
  const map = { draft: 'badge-gray', submitted: 'badge-blue', acknowledged: 'badge-green' }
  return <span className={`badge ${map[status] || 'badge-gray'}`}>{status}</span>
}

export default function Performance() {
  const { data: reviews, isLoading } = useQuery({
    queryKey: ['performance-reviews'],
    queryFn: () => api.get('/performance/reviews').then(r => r.data.data),
  })

  const mockGoals = [
    { title: 'Complete React Migration', weight: 30, status: 'in_progress', rating: 4, dueDate: '2025-03-31' },
    { title: 'Achieve 95% Test Coverage', weight: 20, status: 'completed', rating: 5, dueDate: '2025-02-28' },
    { title: 'Mentor 2 Junior Developers', weight: 20, status: 'in_progress', rating: 3, dueDate: '2025-06-30' },
    { title: 'Deliver Product v3.0', weight: 30, status: 'not_started', rating: null, dueDate: '2025-09-30' },
  ]

  return (
    <div className="animate-fade-in space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Performance Management</h1>
          <p className="text-sm text-slate-500">Track goals, reviews and appraisals</p>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Overall Rating', value: '4.2/5', icon: Star, color: 'bg-amber-500' },
          { label: 'Goals Completed', value: '6/10', icon: Target, color: 'bg-emerald-500' },
          { label: 'Reviews Due', value: '2', icon: TrendingUp, color: 'bg-primary-500' },
          { label: 'Appraisal Cycle', value: 'Annual', icon: Award, color: 'bg-purple-500' },
        ].map(c => (
          <div key={c.label} className="stat-card">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${c.color}`}>
              <c.icon className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{c.value}</p>
              <p className="text-xs text-slate-500">{c.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* My Goals */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-800">My Goals / KPIs</h2>
            <span className="text-xs text-slate-400">Q1 2025</span>
          </div>
          <div className="space-y-3">
            {mockGoals.map((g, i) => (
              <div key={i} className="p-3 border border-slate-100 rounded-lg">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-800">{g.title}</p>
                    <p className="text-xs text-slate-400 mt-0.5">Due: {new Date(g.dueDate).toLocaleDateString('en-IN')} · Weight: {g.weight}%</p>
                  </div>
                  <span className={`badge flex-shrink-0 ${g.status === 'completed' ? 'badge-green' : g.status === 'in_progress' ? 'badge-yellow' : 'badge-gray'}`}>
                    {g.status.replace('_', ' ')}
                  </span>
                </div>
                {g.rating && (
                  <div className="mt-2">
                    <RatingStars rating={g.rating} />
                  </div>
                )}
                <div className="mt-2 bg-slate-100 rounded-full h-1.5">
                  <div className="h-1.5 rounded-full bg-primary-500 transition-all"
                    style={{ width: g.status === 'completed' ? '100%' : g.status === 'in_progress' ? '60%' : '0%' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Reviews Table */}
        <div className="card p-5">
          <h2 className="font-semibold text-slate-800 mb-4">Performance Reviews</h2>
          {isLoading && <p className="text-sm text-slate-400">Loading...</p>}
          {(!reviews || reviews.length === 0) && !isLoading && (
            <div className="text-center py-8">
              <TrendingUp className="w-10 h-10 text-slate-200 mx-auto mb-2" />
              <p className="text-sm text-slate-400">No reviews found</p>
              <p className="text-xs text-slate-300 mt-1">Reviews will appear here when created by HR</p>
            </div>
          )}
          <div className="space-y-3">
            {reviews?.map(r => (
              <div key={r.id} className="p-3 border border-slate-100 rounded-lg">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{r.employee_name}</p>
                    <p className="text-xs text-slate-500">Reviewer: {r.reviewer_name}</p>
                    <p className="text-xs text-slate-400 capitalize mt-0.5">{r.review_type} review</p>
                  </div>
                  <StatusBadge status={r.status} />
                </div>
                {r.overall_rating && (
                  <div className="mt-2"><RatingStars rating={r.overall_rating} /></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Competency Ratings */}
      <div className="card p-5">
        <h2 className="font-semibold text-slate-800 mb-4">Competency Assessment</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { name: 'Technical Skills', score: 4.5, max: 5 },
            { name: 'Communication', score: 3.8, max: 5 },
            { name: 'Leadership', score: 3.5, max: 5 },
            { name: 'Problem Solving', score: 4.2, max: 5 },
            { name: 'Teamwork', score: 4.7, max: 5 },
            { name: 'Time Management', score: 3.9, max: 5 },
          ].map(c => (
            <div key={c.name} className="p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm text-slate-700">{c.name}</span>
                <span className="text-sm font-semibold text-primary-700">{c.score}/{c.max}</span>
              </div>
              <div className="bg-slate-200 rounded-full h-2">
                <div className="bg-primary-500 h-2 rounded-full" style={{ width: `${(c.score / c.max) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
