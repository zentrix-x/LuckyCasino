"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/hooks/use-auth"
import { 
  Menu, 
  X, 
  Home, 
  Gamepad2, 
  Trophy, 
  Users, 
  Settings, 
  LogOut,
  User,
  BarChart3,
  Gift,
  Star,
  Sparkles,
  Zap,
  Crown
} from "lucide-react"

interface MobileNavigationProps {
  className?: string
}

export function MobileNavigation({ className }: MobileNavigationProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [animateItems, setAnimateItems] = useState(false)
  const { user, logout } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => setAnimateItems(true), 50)
    } else {
      setAnimateItems(false)
    }
  }, [isOpen])

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "super_admin":
        return "bg-gradient-to-r from-red-500 to-pink-500 shadow-lg shadow-red-500/30"
      case "master":
        return "bg-gradient-to-r from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/30"
      default:
        return "bg-gradient-to-r from-green-500 to-emerald-500 shadow-lg shadow-green-500/30"
    }
  }

  const handleNavigation = (path: string) => {
    router.push(path)
    setIsOpen(false)
  }

  const handleLogout = () => {
    logout()
    setIsOpen(false)
  }

  const menuItems = useMemo(() => [
    { icon: Home, label: "Dashboard", path: "/", show: true, color: "from-blue-500 to-cyan-500" },
    { icon: Gamepad2, label: "Games", path: "/?tab=games", show: true, color: "from-purple-500 to-pink-500" },
    { icon: BarChart3, label: "Recent Bets", path: "/?tab=recent", show: true, color: "from-green-500 to-emerald-500" },
    { icon: Trophy, label: "History", path: "/?tab=history", show: true, color: "from-yellow-500 to-orange-500" },
    { icon: Star, label: "Community", path: "/?tab=community", show: true, color: "from-indigo-500 to-purple-500" },
    { icon: Users, label: "Manage", path: "/?tab=manage", show: user?.role !== "user", color: "from-teal-500 to-blue-500" },
    { icon: Settings, label: "Admin", path: "/?tab=admin", show: user?.role !== "user", color: "from-red-500 to-pink-500" },
    { icon: Gift, label: "Super Admin", path: "/?tab=super", show: user?.role === "super_admin" || user?.role === "super_master", color: "from-violet-500 to-purple-500" },
  ], [user?.role])

  // Fallback content to prevent black area
  const fallbackContent = (
    <div className="flex items-center justify-center p-8 text-white/60">
      <div className="text-center">
        <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Menu className="w-8 h-8" />
        </div>
        <p className="text-sm">Loading navigation...</p>
      </div>
    </div>
  )

  return (
    <>
             {/* Mobile Menu Button */}
       <button
         className="mobile-menu-btn max-[639px]:block min-[640px]:hidden relative group"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle mobile menu"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
        <span className={`relative block w-6 h-0.5 bg-white transition-all duration-300 ${isOpen ? 'rotate-45 translate-y-1.5' : ''}`}></span>
        <span className={`relative block w-6 h-0.5 bg-white transition-all duration-300 mt-1.5 ${isOpen ? 'opacity-0' : ''}`}></span>
        <span className={`relative block w-6 h-0.5 bg-white transition-all duration-300 mt-1.5 ${isOpen ? '-rotate-45 -translate-y-1.5' : ''}`}></span>
      </button>

             {/* Mobile Navigation Overlay */}
       <div className={`fixed inset-0 z-[9999] max-[639px]:block min-[640px]:hidden transition-all duration-200 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-gradient-to-br from-black via-slate-900 to-black z-0" />

        <div className="relative flex flex-col h-full z-20">
          {/* Header */}
          <div className={`flex items-center justify-between p-4 border-b-2 border-white/20 bg-black transition-all duration-300 relative z-30 ${animateItems ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
            <div className="flex items-center gap-4">
              <div className="relative">
                                 <div className="w-12 h-12 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg shadow-orange-500/30 animate-glow">
                   <span className="text-black font-bold text-lg">🎰</span>
                 </div>
                 <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-red-500 to-pink-500 rounded-full animate-ping"></div>
                 <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full animate-ping" style={{animationDelay: '0.3s'}}></div>
              </div>
              <div>
                                 <h2 className="text-white font-bold text-xl bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                   Lucky Casino
                 </h2>
                {user && (
                  <Badge className={`${getRoleBadgeColor(user.role)} text-white text-xs px-3 py-1 mt-1 animate-pulse`}>
                    <Crown className="w-3 h-3 mr-1" />
                    {user.role.replace("_", " ").toUpperCase()}
                  </Badge>
                )}
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="relative w-10 h-10 flex items-center justify-center text-white hover:bg-white/10 rounded-full transition-colors duration-200 group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-pink-500 rounded-full opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
              <X className="w-6 h-6 relative z-10" />
            </button>
          </div>

          {/* User Info */}
          {user && (
            <div className={`p-4 border-b-2 border-white/20 bg-black transition-all duration-300 delay-75 relative z-30 ${animateItems ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
              <div className="flex items-center gap-4">
                <div className="relative">
                                     <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg shadow-purple-500/30 animate-glow">
                     <User className="w-8 h-8 text-white" />
                   </div>
                   <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center shadow-lg animate-ping">
                     <Sparkles className="w-2.5 h-2.5 text-white animate-spin" style={{animationDuration: '3s'}} />
                   </div>
                   <div className="absolute -top-1 -left-1 w-3 h-3 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full animate-ping" style={{animationDelay: '0.7s'}}></div>
                </div>
                <div className="flex-1">
                                     <p className="text-white font-bold text-lg bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                     {user.username}
                   </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Zap className="w-4 h-4 text-yellow-400" />
                    <p className="text-white/80 font-semibold">Points: {user.points.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Menu */}
          <div className="flex-1 p-4 relative z-30 bg-black border-l-4 border-purple-400 shadow-lg shadow-purple-500/10">


            <div className="relative z-10">
              <div className="mb-4 p-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl border-2 border-purple-400 shadow-md shadow-purple-500/20">
                <h3 className="text-white font-bold text-sm uppercase tracking-wider flex items-center gap-3">
                  <div className="w-3 h-3 bg-purple-300 rounded-full animate-pulse shadow-lg shadow-purple-400/50"></div>
                  <span className="bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">Navigation Menu</span>
                  <div className="flex-1 h-px bg-gradient-to-r from-purple-400/50 to-transparent"></div>
                </h3>
              </div>
                                                                                         <nav className="space-y-2 overflow-y-auto max-h-96 mobile-nav-scrollbar min-h-[200px]">
               {menuItems.filter(item => item.show).length > 0 ? (
                 menuItems.filter(item => item.show).map((item, index) => (
                   <button
                     key={item.path}
                     onClick={() => handleNavigation(item.path)}
                     className={`w-full flex items-center gap-3 p-4 text-white hover:bg-white/20 rounded-xl transition-all duration-200 text-left group relative overflow-hidden border-2 border-white/20 hover:border-white/40 bg-black shadow-md shadow-black/10 mobile-nav-item mobile-touch-target ${animateItems ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
                   style={{ transitionDelay: `${50 + index * 25}ms` }}
                  >
                    {/* Background Gradient */}
                    <div className={`absolute inset-0 bg-gradient-to-r ${item.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>
                    
                                       {/* Icon Container */}
                     <div className={`relative w-12 h-12 bg-gradient-to-r ${item.color} rounded-xl flex items-center justify-center shadow-md shadow-black/20 group-hover:scale-105 transition-transform duration-200 border-2 border-white/30 group-hover:border-white/50`}>
                                             <item.icon className="w-6 h-6 text-white group-hover:animate-bounce" />
                       <div className="absolute inset-0 bg-white/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                       <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-white/30 rounded-full animate-ping group-hover:animate-none"></div>
                     </div>
                    
                                       {/* Text */}
                     <span className="font-semibold text-base relative z-10 group-hover:scale-105 transition-transform duration-300">
                       {item.label}
                     </span>
                    
                    {/* Hover Effect */}
                    <div className="absolute right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:translate-x-0 translate-x-2">
                      <Sparkles className="w-5 h-5 text-white/60" />
                    </div>
                  </button>
                ))
               ) : (
                 <div className="flex items-center justify-center p-8 text-white/60">
                   <div className="text-center">
                     <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                       <Menu className="w-8 h-8" />
                     </div>
                     <p className="text-sm">Loading navigation...</p>
                     <p className="text-xs mt-2">Available items: {menuItems.length}</p>
                   </div>
                 </div>
               )}
            </nav>
            </div>
          </div>

                     {/* Logout Button */}
           {user && (
             <div className={`p-4 border-t-2 border-white/20 bg-black transition-all duration-700 delay-200 relative z-30 flex-shrink-0 ${animateItems ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
              <div className="mb-3">
                <h3 className="text-white/60 text-sm font-medium uppercase tracking-wider">Account</h3>
              </div>
                             <button
                 onClick={handleLogout}
                 className="w-full flex items-center gap-3 p-3 text-red-400 hover:bg-red-500/20 rounded-xl transition-all duration-300 group relative overflow-hidden border border-red-500/20 hover:border-red-500/40 mobile-touch-target mobile-button"
              >
                {/* Background Gradient */}
                <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                
                                 {/* Icon Container */}
                 <div className="relative w-10 h-10 bg-gradient-to-r from-red-500 to-pink-500 rounded-lg flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 border border-red-400/30">
                   <LogOut className="w-5 h-5 text-white group-hover:animate-pulse" />
                   <div className="absolute inset-0 bg-white/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                   <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-400/50 rounded-full animate-ping group-hover:animate-none"></div>
                 </div>
                
                                 {/* Text */}
                 <span className="font-semibold text-base relative z-10 group-hover:scale-105 transition-transform duration-300">
                   Logout
                 </span>
                
                {/* Hover Effect */}
                <div className="absolute right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:translate-x-0 translate-x-2">
                  <Sparkles className="w-5 h-5 text-red-400/60" />
                </div>
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}




