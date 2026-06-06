"use client"

import { useEffect, useState } from "react"
import { Navigation } from "@/components/Navigation"
import { CheckCircle } from "lucide-react"
import { cn } from "@/lib/utils"

const INDUSTRIES = ["tech", "finance", "consulting", "general"]
const EXPERIENCE_LEVELS = [
  { id: "entry", label: "Entry-level" },
  { id: "mid", label: "Mid-level" },
  { id: "senior", label: "Senior" },
]

const inputClass =
  "w-full rounded-md border border-[#1e1e25] bg-[#111116] px-3 py-2 text-sm text-[#f5f5f8] placeholder:text-[#3a3a45] outline-none transition-colors focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30"

export default function ProfilePage() {
  const [resumeText, setResumeText] = useState("")
  const [targetRole, setTargetRole] = useState("")
  const [targetCompany, setTargetCompany] = useState("")
  const [industry, setIndustry] = useState("tech")
  const [experience, setExperience] = useState("mid")
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then(({ profile }) => {
        if (!profile) return
        setResumeText(profile.resumeText ?? "")
        setTargetRole(profile.targetRole ?? "")
        setTargetCompany(profile.targetCompany ?? "")
        setIndustry(profile.industry ?? "tech")
        setExperience(profile.experience ?? "mid")
      })
  }, [])

  const handleSave = async () => {
    setSaving(true)
    await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resumeText, targetRole, targetCompany, industry, experience }),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div className="flex h-full">
      <Navigation />
      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-2xl space-y-8">
          <div>
            <h1
              className="text-2xl font-bold text-[#f5f5f8]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Your Profile
            </h1>
            <p className="mt-1 text-sm text-[#52525c]">
              This context is injected into every feedback prompt so the AI can reference your actual experience.
            </p>
          </div>

          <div className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="role" className="text-sm font-medium text-[#a0a0ac]">
                Target role
              </label>
              <input
                id="role"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="e.g. Software Engineer, Product Manager"
                className={inputClass}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="company" className="text-sm font-medium text-[#a0a0ac]">
                Target company (optional)
              </label>
              <input
                id="company"
                value={targetCompany}
                onChange={(e) => setTargetCompany(e.target.value)}
                placeholder="e.g. Google, Stripe"
                className={inputClass}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[#a0a0ac]">Industry</label>
              <div className="flex flex-wrap gap-2">
                {INDUSTRIES.map((ind) => (
                  <button
                    key={ind}
                    onClick={() => setIndustry(ind)}
                    className={cn(
                      "rounded-full border px-4 py-1.5 text-sm capitalize transition-colors",
                      industry === ind
                        ? "border-indigo-500/50 bg-indigo-500/10 text-indigo-300"
                        : "border-[#1e1e25] bg-[#111116] text-[#52525c] hover:border-[#2a2a35] hover:text-[#a0a0ac]"
                    )}
                  >
                    {ind}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[#a0a0ac]">Experience level</label>
              <div className="flex gap-2">
                {EXPERIENCE_LEVELS.map((lvl) => (
                  <button
                    key={lvl.id}
                    onClick={() => setExperience(lvl.id)}
                    className={cn(
                      "rounded-full border px-4 py-1.5 text-sm transition-colors",
                      experience === lvl.id
                        ? "border-indigo-500/50 bg-indigo-500/10 text-indigo-300"
                        : "border-[#1e1e25] bg-[#111116] text-[#52525c] hover:border-[#2a2a35] hover:text-[#a0a0ac]"
                    )}
                  >
                    {lvl.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="resume" className="text-sm font-medium text-[#a0a0ac]">
                Resume (paste as plain text)
              </label>
              <p className="text-xs text-[#52525c]">
                The AI uses this to reference your specific experience when evaluating answers and writing model answers.
              </p>
              <textarea
                id="resume"
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                placeholder="Paste your resume here…"
                rows={14}
                className={`${inputClass} font-mono`}
                style={{ resize: "vertical" }}
              />
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 rounded-md px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                style={{ background: "linear-gradient(135deg, #6366f1, #7c3aed)" }}
              >
                {saved ? (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    Saved
                  </>
                ) : saving ? (
                  "Saving…"
                ) : (
                  "Save profile"
                )}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
