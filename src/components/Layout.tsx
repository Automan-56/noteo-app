import { NavLink, Outlet, useNavigate } from "react-router-dom"
import { BarChart2, BookOpen, ClipboardList, LogOut } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/AuthContext"

interface NavItem {
  to: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}

const navItems: NavItem[] = [
  { to: "/", label: "Tableau de bord", icon: BarChart2 },
  { to: "/subjects", label: "Mes matières", icon: BookOpen },
  { to: "/grades", label: "Mes notes", icon: ClipboardList },
]

export default function Layout() {
  const { signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/auth')
  }

  return (
    <div className="flex h-screen bg-zinc-950">
      {/* Sidebar */}
      <aside className="w-60 bg-zinc-900 border-r border-zinc-800">
        {/* Logo */}
        <div className="p-6 border-b border-zinc-800">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-violet-400 to-violet-600 bg-clip-text text-transparent">
            Noteo
          </h1>
        </div>

        {/* Navigation */}
        <nav className="p-4">
          <ul className="space-y-2">
            {navItems.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200",
                      "text-zinc-400 hover:text-white hover:bg-zinc-800",
                      isActive && "bg-violet-600 text-white hover:bg-violet-700 border-l-4 border-violet-500"
                    )
                  }
                  end={item.to === "/"}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Sign Out Button */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-zinc-800">
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all duration-200"
          >
            <LogOut className="h-5 w-5" />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto border-r border-zinc-800">
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
