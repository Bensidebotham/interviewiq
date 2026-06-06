"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut, useSession } from "next-auth/react"
import { LayoutDashboard, User, LogOut, Mic, Plus } from "lucide-react"
import { cn } from "@/lib/utils"

const links = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/profile", label: "Profile", icon: User },
]

export function Navigation() {
  const pathname = usePathname()
  const { data: session } = useSession()

  return (
    <aside className="flex h-full w-56 flex-col border-r border-[#1e1e25] bg-[#0d0d12]">
      {/* Logo */}
      <Link href="/dashboard" className="flex items-center gap-2.5 px-4 py-5">
        <div
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
          style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
        >
          <Mic className="h-3.5 w-3.5 text-white" />
        </div>
        <span
          className="text-sm font-bold tracking-tight text-[#f5f5f8]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          InterviewIQ
        </span>
      </Link>

      {/* New session pill */}
      <div className="px-3 pb-3">
        <Link
          href="/session/new"
          className="flex w-full items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ background: "linear-gradient(135deg, #6366f1, #7c3aed)" }}
        >
          <Plus className="h-3.5 w-3.5" />
          New session
        </Link>
      </div>

      {/* Nav links */}
      <nav className="flex-1 space-y-0.5 px-3">
        {links.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              pathname.startsWith(href)
                ? "border border-indigo-500/25 bg-indigo-500/10 text-indigo-300"
                : "text-[#52525c] hover:bg-[#18181f] hover:text-[#a0a0ac]"
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}
      </nav>

      {/* Bottom user row */}
      <div className="border-t border-[#1e1e25] px-3 py-4 space-y-1">
        <div className="flex items-center gap-2.5 px-3 py-2">
          {session?.user?.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={session.user.image}
              alt=""
              className="h-6 w-6 shrink-0 rounded-full"
            />
          ) : (
            <div className="h-6 w-6 shrink-0 rounded-full bg-[#18181f] border border-[#1e1e25]" />
          )}
          <span className="truncate text-sm text-[#52525c]">{session?.user?.name}</span>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-[#52525c] transition-colors hover:bg-[#18181f] hover:text-[#a0a0ac]"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </aside>
  )
}
