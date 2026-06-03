"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut, useSession } from "next-auth/react"
import { LayoutDashboard, PlusCircle, User, LogOut, Mic } from "lucide-react"
import { cn } from "@/lib/utils"

const links = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/session/new", label: "New Session", icon: PlusCircle },
  { href: "/profile", label: "Profile", icon: User },
]

export function Navigation() {
  const pathname = usePathname()
  const { data: session } = useSession()

  return (
    <aside className="flex h-full w-56 flex-col border-r border-gray-800 bg-gray-900 px-3 py-6">
      <Link href="/dashboard" className="mb-8 flex items-center gap-2 px-2">
        <Mic className="h-5 w-5 text-indigo-400" />
        <span className="text-lg font-semibold tracking-tight">InterviewIQ</span>
      </Link>

      <nav className="flex flex-1 flex-col gap-1">
        {links.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              pathname.startsWith(href)
                ? "bg-indigo-600 text-white"
                : "text-gray-400 hover:bg-gray-800 hover:text-gray-100"
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}
      </nav>

      <div className="border-t border-gray-800 pt-4">
        <div className="mb-3 flex items-center gap-3 px-3">
          {session?.user?.image && (
            <img src={session.user.image} alt="" className="h-7 w-7 rounded-full" />
          )}
          <span className="truncate text-sm text-gray-400">{session?.user?.name}</span>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-400 hover:bg-gray-800 hover:text-gray-100 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </aside>
  )
}
