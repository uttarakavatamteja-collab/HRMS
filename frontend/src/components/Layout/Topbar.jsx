import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Bell, Search, Menu, UserCircle, ChevronDown, Settings, LogOut } from 'lucide-react'

export default function Topbar({ onMobileMenu }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [dropdown, setDropdown] = useState(false)

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 gap-4 flex-shrink-0">
      <div className="flex items-center gap-3">
        <button onClick={onMobileMenu} className="lg:hidden p-2 rounded-lg text-slate-400 hover:bg-slate-100">
          <Menu className="w-5 h-5" />
        </button>
        <div className="hidden sm:flex items-center gap-2 bg-slate-100 rounded-lg px-3 py-1.5 w-64">
          <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <input className="bg-transparent text-sm outline-none placeholder:text-slate-400 w-full" placeholder="Search employees, tickets..." />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        <div className="relative">
          <button
            onClick={() => setDropdown(!dropdown)}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <div className="w-7 h-7 bg-primary-100 rounded-full flex items-center justify-center">
              <span className="text-xs font-bold text-primary-700">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </span>
            </div>
            <div className="hidden md:block text-left">
              <p className="text-xs font-semibold text-slate-800 leading-none">{user?.firstName} {user?.lastName}</p>
              <p className="text-[10px] text-slate-400 capitalize">{user?.role}</p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden md:block" />
          </button>

          {dropdown && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setDropdown(false)} />
              <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-slate-200 rounded-xl shadow-lg z-20 py-1 animate-fade-in">
                <button onClick={() => { navigate('/profile'); setDropdown(false) }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50">
                  <UserCircle className="w-4 h-4" /> My Profile
                </button>
                <button onClick={() => { navigate('/settings'); setDropdown(false) }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50">
                  <Settings className="w-4 h-4" /> Settings
                </button>
                <hr className="my-1 border-slate-100" />
                <button onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50">
                  <LogOut className="w-4 h-4" /> Logout
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
