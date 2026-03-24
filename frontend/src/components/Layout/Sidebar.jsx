import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  LayoutDashboard, Users, Clock, CalendarDays, DollarSign, Briefcase,
  TrendingUp, LifeBuoy, BarChart2, Settings, LogOut, ChevronLeft,
  Building2, UserCircle, X
} from 'lucide-react'
import toast from 'react-hot-toast'

const navItems = [
  { to: '/',            label: 'Dashboard',    icon: LayoutDashboard, end: true },
  { to: '/employees',   label: 'Employees',    icon: Users },
  { to: '/attendance',  label: 'Attendance',   icon: Clock },
  { to: '/leave',       label: 'Leave',        icon: CalendarDays },
  { to: '/payroll',     label: 'Payroll',      icon: DollarSign },
  { to: '/recruitment', label: 'Recruitment',  icon: Briefcase },
  { to: '/performance', label: 'Performance',  icon: TrendingUp },
  { to: '/helpdesk',    label: 'Helpdesk',     icon: LifeBuoy },
  { to: '/reports',     label: 'Reports',      icon: BarChart2 },
  { to: '/settings',    label: 'Settings',     icon: Settings },
]

export default function Sidebar({ collapsed, onCollapse, mobileOpen, onMobileClose }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    toast.success('Logged out successfully')
    navigate('/login')
  }

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={`flex items-center gap-3 px-4 py-5 border-b border-slate-100 ${collapsed ? 'justify-center' : 'justify-between'}`}>
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-slate-900 text-sm">HRMS</span>
              <p className="text-[10px] text-slate-400 leading-none">Pro Suite</p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
            <Building2 className="w-5 h-5 text-white" />
          </div>
        )}
        <button
          onClick={onCollapse}
          className="hidden lg:flex p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <ChevronLeft className={`w-4 h-4 transition-transform duration-200 ${collapsed ? 'rotate-180' : ''}`} />
        </button>
        <button onClick={onMobileClose} className="lg:hidden p-1 rounded-md text-slate-400 hover:text-slate-600">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onMobileClose}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'active' : ''} ${collapsed ? 'justify-center px-2' : ''}`
            }
            title={collapsed ? label : undefined}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className={`border-t border-slate-100 p-3 ${collapsed ? 'flex flex-col items-center gap-2' : ''}`}>
        <NavLink
          to="/profile"
          onClick={onMobileClose}
          className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''} ${collapsed ? 'justify-center px-2 w-full' : 'w-full'}`}
        >
          <UserCircle className="w-4 h-4 flex-shrink-0" />
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-slate-800 truncate">{user?.firstName} {user?.lastName}</p>
              <p className="text-[10px] text-slate-400 capitalize">{user?.role}</p>
            </div>
          )}
        </NavLink>
        <button
          onClick={handleLogout}
          className={`sidebar-link w-full text-red-500 hover:bg-red-50 hover:text-red-600 ${collapsed ? 'justify-center px-2' : ''}`}
          title={collapsed ? 'Logout' : undefined}
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className={`hidden lg:flex flex-col h-screen bg-white border-r border-slate-200 transition-all duration-200 flex-shrink-0 ${collapsed ? 'w-16' : 'w-56'}`}>
        {sidebarContent}
      </aside>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/40" onClick={onMobileClose} />
          <aside className="relative w-64 bg-white h-full shadow-2xl animate-slide-in">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  )
}
