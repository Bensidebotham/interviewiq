"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Navigation } from "@/components/Navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
        <div className="max-w-xl space-y-8">
          <div>
            <h1 className="text-2xl font-bold">New Practice Session</h1>
            <p className="mt-1 text-sm text-gray-400">Step {step} of 2</p>
          </div>

          {/* Progress bar */}
          <div className="h-1 w-full rounded-full bg-gray-800">
            <div
              className="h-1 rounded-full bg-indigo-500 transition-all duration-300"
              style={{ width: step === 1 ? "50%" : "100%" }}
            />
          </div>

          {step === 1 && (
            <div className="space-y-4">
              <h2 className="font-semibold text-gray-200">What type of session?</h2>
              <div className="grid gap-3">
                {SESSION_TYPES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setSessionType(t.id)}
                    className={cn(
                      "rounded-xl border p-4 text-left transition-colors",
                      sessionType === t.id
                        ? "border-indigo-500 bg-indigo-950/40"
                        : "border-gray-800 bg-gray-900 hover:border-gray-700"
                    )}
                  >
                    <p className="font-medium">{t.label}</p>
                    <p className="mt-0.5 text-sm text-gray-400">{t.description}</p>
                  </button>
                ))}
              </div>
              <Button
                onClick={() => setStep(2)}
                disabled={!sessionType}
                className="w-full bg-indigo-600 hover:bg-indigo-500"
              >
                Next
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <h2 className="font-semibold text-gray-200">Add context (optional)</h2>

              <div className="space-y-2">
                <Label className="text-gray-300">Industry</Label>
                <div className="flex flex-wrap gap-2">
                  {INDUSTRIES.map((ind) => (
                    <button
                      key={ind}
                      onClick={() => setIndustry(ind)}
                      className={cn(
                        "rounded-full border px-4 py-1.5 text-sm capitalize transition-colors",
                        industry === ind
                          ? "border-indigo-500 bg-indigo-950/40 text-indigo-300"
                          : "border-gray-700 bg-gray-900 text-gray-400 hover:border-gray-600"
                      )}
                    >
                      {ind}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="company" className="text-gray-300">Company (optional)</Label>
                <Input
                  id="company"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Google, McKinsey"
                  className="bg-gray-900 border-gray-700 text-gray-100 placeholder:text-gray-600"
                />
              </div>

              {sessionType === "company-specific" && (
                <div className="space-y-2">
                  <Label htmlFor="jd" className="text-gray-300">Job description</Label>
                  <Textarea
                    id="jd"
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    placeholder="Paste the job description here…"
                    rows={6}
                    className="bg-gray-900 border-gray-700 text-gray-100 placeholder:text-gray-600"
                  />
                </div>
              )}

              {error && <p className="text-sm text-red-400">{error}</p>}

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="border-gray-700 text-gray-300 hover:bg-gray-800"
                >
                  Back
                </Button>
                <Button
                  onClick={handleStart}
                  disabled={loading}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500"
                >
                  {loading ? "Starting…" : "Start Session"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
