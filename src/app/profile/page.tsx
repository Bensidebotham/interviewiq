"use client"

import { useEffect, useState } from "react"
import { Navigation } from "@/components/Navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { CheckCircle } from "lucide-react"

const INDUSTRIES = ["tech", "finance", "consulting", "general"]
const EXPERIENCE_LEVELS = [
  { id: "entry", label: "Entry-level" },
  { id: "mid", label: "Mid-level" },
  { id: "senior", label: "Senior" },
]

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
            <h1 className="text-2xl font-bold">Your profile</h1>
            <p className="mt-1 text-sm text-gray-400">
              This context is injected into every feedback prompt so the AI can reference your actual experience.
            </p>
          </div>

          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="role" className="text-gray-300">Target role</Label>
              <Input
                id="role"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="e.g. Software Engineer, Product Manager"
                className="bg-gray-900 border-gray-700 text-gray-100 placeholder:text-gray-600"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="company" className="text-gray-300">Target company (optional)</Label>
              <Input
                id="company"
                value={targetCompany}
                onChange={(e) => setTargetCompany(e.target.value)}
                placeholder="e.g. Google, Stripe"
                className="bg-gray-900 border-gray-700 text-gray-100 placeholder:text-gray-600"
              />
            </div>

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
              <Label className="text-gray-300">Experience level</Label>
              <div className="flex gap-2">
                {EXPERIENCE_LEVELS.map((lvl) => (
                  <button
                    key={lvl.id}
                    onClick={() => setExperience(lvl.id)}
                    className={cn(
                      "rounded-full border px-4 py-1.5 text-sm transition-colors",
                      experience === lvl.id
                        ? "border-indigo-500 bg-indigo-950/40 text-indigo-300"
                        : "border-gray-700 bg-gray-900 text-gray-400 hover:border-gray-600"
                    )}
                  >
                    {lvl.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="resume" className="text-gray-300">Resume (paste as plain text)</Label>
              <p className="text-xs text-gray-500">
                The AI uses this to reference your specific experience when evaluating answers and writing model answers.
              </p>
              <Textarea
                id="resume"
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                placeholder="Paste your resume here…"
                rows={14}
                className="bg-gray-900 border-gray-700 text-gray-100 placeholder:text-gray-600 font-mono text-xs"
              />
            </div>

            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-indigo-600 hover:bg-indigo-500 gap-2"
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
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
