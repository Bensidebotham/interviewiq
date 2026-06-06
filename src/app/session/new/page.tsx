"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Navigation } from "@/components/Navigation"
import { cn } from "@/lib/utils"

const SESSION_TYPES = [
  {
    id: "behavioral",
    label: "Behavioral",
    description: "Tell me about a time… questions using STAR format",
  },
  {
    id: "technical",
    label: "Technical",
    description: "System design and CS fundamentals",
  },
  {
    id: "company-specific",
    label: "Company-specific",
    description: "Tailored to a job description you paste",
  },
]

const INDUSTRIES = ["tech", "finance", "consulting", "general"]

const inputClass =
  "w-full rounded-md border border-[#1e1e25] bg-[#111116] px-3 py-2 text-sm text-[#f5f5f8] placeholder:text-[#3a3a45] outline-none transition-colors focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30"

export default function NewSessionPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [sessionType, setSessionType] = useState("")
  const [industry, setIndustry] = useState("general")
  const [companyName, setCompanyName] = useState("")
  const [jobDescription, setJobDescription] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleStart = async () => {
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionType, industry, companyName, jobDescription }),
      })
      if (!res.ok) throw new Error("Failed to create session")
      const { session } = await res.json()
      router.push(`/session/${session.id}`)
    } catch {
      setError("Something went wrong. Please try again.")
      setLoading(false)
    }
  }

  return (
    <div className="flex h-full">
      <Navigation />
      <main className="flex-1 overflow-auto p-8">
        <div className="mx-auto max-w-xl space-y-8">
          {/* Header */}
          <div>
            <h1
              className="text-2xl font-bold text-[#f5f5f8]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              New Practice Session
            </h1>
            <p className="mt-1 text-sm text-[#52525c]">Step {step} of 2</p>
          </div>

          {/* Step dots */}
          <div className="flex items-center gap-2">
            {[1, 2].map((n) => (
              <div
                key={n}
                className="h-2 rounded transition-all"
                style={{
                  background:
                    n <= step
                      ? "linear-gradient(135deg, #6366f1, #8b5cf6)"
                      : "#1e1e25",
                  width: n === step ? "24px" : "8px",
                }}
              />
            ))}
          </div>

          {step === 1 && (
            <div className="space-y-4">
              <h2 className="font-semibold text-[#f5f5f8]">What type of session?</h2>
              <div className="grid gap-3">
                {SESSION_TYPES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setSessionType(t.id)}
                    className={cn(
                      "rounded-xl border p-4 text-left transition-all",
                      sessionType === t.id
                        ? "border-indigo-500/50 bg-indigo-500/5 shadow-[0_0_0_1px_rgba(99,102,241,0.2)]"
                        : "border-[#1e1e25] bg-[#111116] hover:border-[#2a2a35]"
                    )}
                  >
                    <p className="font-medium text-[#f5f5f8]">{t.label}</p>
                    <p className="mt-0.5 text-sm text-[#52525c]">{t.description}</p>
                  </button>
                ))}
              </div>
              <button
                onClick={() => setStep(2)}
                disabled={!sessionType}
                className="w-full rounded-md px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                style={{ background: "linear-gradient(135deg, #6366f1, #7c3aed)" }}
              >
                Next
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <h2 className="font-semibold text-[#f5f5f8]">Add context (optional)</h2>

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
                <label htmlFor="company" className="text-sm font-medium text-[#a0a0ac]">
                  Company (optional)
                </label>
                <input
                  id="company"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Google, McKinsey"
                  className={inputClass}
                />
              </div>

              {sessionType === "company-specific" && (
                <div className="space-y-2">
                  <label htmlFor="jd" className="text-sm font-medium text-[#a0a0ac]">
                    Job description
                  </label>
                  <textarea
                    id="jd"
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    placeholder="Paste the job description here…"
                    rows={6}
                    className={inputClass}
                    style={{ resize: "vertical" }}
                  />
                </div>
              )}

              {error && <p className="text-sm text-red-400">{error}</p>}

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="rounded-md border border-[#1e1e25] px-4 py-2 text-sm font-medium text-[#52525c] transition-colors hover:border-[#2a2a35] hover:text-[#a0a0ac]"
                >
                  Back
                </button>
                <button
                  onClick={handleStart}
                  disabled={loading}
                  className="flex-1 rounded-md px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                  style={{ background: "linear-gradient(135deg, #6366f1, #7c3aed)" }}
                >
                  {loading ? "Starting…" : "Start Session"}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
