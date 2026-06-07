"use client"

import { useEffect, useState, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { Navigation } from "@/components/Navigation"
import { VideoRecorder } from "@/components/VideoRecorder"
import { AnalyticsPanel } from "@/components/AnalyticsPanel"
import { CheckCircle } from "lucide-react"

type Question = {
  id: string
  text: string
  category: string
  tips: string
}

type SessionData = {
  id: string
  sessionType: string
  questions: Question[] | null
  responses: {
    id: string
    questionText: string
    feedback: unknown | null
  }[]
}

type FeedbackData = {
  overallScore: number
  contentScore: number
  deliveryScore: number
  eyeContactScore: number
  bodyLanguageScore: number
  contentFeedback: string
  deliveryFeedback: string
  eyeContactFeedback: string
  bodyLanguageFeedback: string
  overallFeedback: string
  modelAnswer: string
  fillerWords: string[]
  missingStarComponents: string[]
  resumeAlignmentNotes: string | null
}

export default function SessionPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [session, setSession] = useState<SessionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [questionIndex, setQuestionIndex] = useState(0)
  const [currentFeedback, setCurrentFeedback] = useState<FeedbackData | null>(null)
  const [currentTranscript, setCurrentTranscript] = useState("")
  const [currentVideoUrl, setCurrentVideoUrl] = useState("")
  const [phase, setPhase] = useState<"recording" | "feedback" | "done">("recording")
  const hasFetchedRef = useRef(false)

  useEffect(() => {
    if (hasFetchedRef.current) return
    hasFetchedRef.current = true

    const loadSession = async () => {
      const res = await fetch(`/api/sessions/${id}`)
      if (!res.ok) { router.push("/dashboard"); return }
      const { session: data } = await res.json()
      setSession(data)
      setQuestionIndex(data.responses.length)
      setLoading(false)
    }
    loadSession()
  }, [id, router])

  useEffect(() => {
    return () => {
      if (currentVideoUrl) URL.revokeObjectURL(currentVideoUrl)
    }
  }, [currentVideoUrl])

  const questions: Question[] = session?.questions ?? []
  const currentQuestion = questions[questionIndex]
  const isLastQuestion = questionIndex >= questions.length - 1

  const handleAnalysisComplete = (feedback: unknown, transcript: string, videoUrl: string) => {
    setCurrentFeedback(feedback as FeedbackData)
    setCurrentTranscript(transcript)
    setCurrentVideoUrl(videoUrl)
    setPhase("feedback")
  }

  const nextQuestion = async () => {
    if (isLastQuestion) {
      await fetch(`/api/sessions/${id}`, { method: "PATCH" })
      setPhase("done")
      return
    }
    setCurrentFeedback(null)
    setCurrentTranscript("")
    setCurrentVideoUrl("")
    setQuestionIndex((i) => i + 1)
    setPhase("recording")
  }

  if (loading) {
    return (
      <div className="flex h-full">
        <Navigation />
        <main className="flex flex-1 items-center justify-center">
          <div className="h-6 w-6 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
        </main>
      </div>
    )
  }

  if (phase === "done") {
    return (
      <div className="flex h-full">
        <Navigation />
        <main className="flex flex-1 flex-col items-center justify-center gap-4 text-center p-8">
          <div
            className="flex h-16 w-16 items-center justify-center rounded-full"
            style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)" }}
          >
            <CheckCircle className="h-8 w-8 text-indigo-400" />
          </div>
          <h2
            className="text-2xl font-bold text-[#f5f5f8]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Session complete
          </h2>
          <p className="text-[#52525c]">You answered {questions.length} question{questions.length !== 1 ? "s" : ""}.</p>
          <div className="flex gap-3">
            <button
              onClick={() => router.push("/dashboard")}
              className="rounded-md border border-[#1e1e25] px-4 py-2 text-sm font-medium text-[#52525c] transition-colors hover:border-[#2a2a35] hover:text-[#a0a0ac]"
            >
              Dashboard
            </button>
            <button
              onClick={() => router.push("/session/new")}
              className="rounded-md px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #6366f1, #7c3aed)" }}
            >
              New session
            </button>
          </div>
        </main>
      </div>
    )
  }

  if (!currentQuestion) {
    return (
      <div className="flex h-full">
        <Navigation />
        <main className="flex flex-1 items-center justify-center">
          <p className="text-gray-400">No questions available.</p>
        </main>
      </div>
    )
  }

  if (phase === "feedback" && currentFeedback) {
    return (
      <div className="flex h-full">
        <Navigation />
        <div className="flex flex-1 flex-col min-h-0">
          <AnalyticsPanel
            feedback={currentFeedback}
            transcript={currentTranscript}
            videoUrl={currentVideoUrl}
            questionText={currentQuestion.text}
            questionIndex={questionIndex}
            totalQuestions={questions.length}
            isLastQuestion={isLastQuestion}
            onNext={nextQuestion}
            onReRecord={() => {
              setCurrentFeedback(null)
              setCurrentTranscript("")
              setCurrentVideoUrl("")
              setPhase("recording")
            }}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full">
      <Navigation />
      <main className="flex-1 overflow-auto p-8">
        <div className="mx-auto max-w-2xl space-y-5">
          {/* Progress */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="rounded-md border border-[#1e1e25] bg-[#18181f] px-2 py-0.5 text-xs font-medium capitalize text-[#a0a0ac]">
                {session?.sessionType}
              </span>
              <span className="text-sm text-[#52525c]">
                Question {questionIndex + 1} of {questions.length}
              </span>
            </div>
            <div className="h-1.5 w-32 overflow-hidden rounded-full bg-[#1e1e25]">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${((questionIndex + 1) / questions.length) * 100}%`,
                  background: "linear-gradient(90deg, #6366f1, #8b5cf6)",
                }}
              />
            </div>
          </div>

          {/* Question card */}
          <div className="rounded-xl border border-[#1e1e25] bg-[#111116] p-6">
            <p className="mb-2 text-xs uppercase tracking-widest text-[#52525c]">
              {currentQuestion.category}
            </p>
            <h2
              className="text-xl font-semibold leading-snug text-[#f5f5f8]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {currentQuestion.text}
            </h2>
            {currentQuestion.tips && (
              <p className="mt-3 border-l-2 border-indigo-800 pl-3 text-sm text-indigo-300/70">
                Tip: {currentQuestion.tips}
              </p>
            )}
          </div>

          {/* Video recorder */}
          <VideoRecorder
            sessionId={id}
            questionText={currentQuestion.text}
            questionCategory={currentQuestion.category}
            sessionType={session?.sessionType ?? "behavioral"}
            onComplete={handleAnalysisComplete}
          />
        </div>
      </main>
    </div>
  )
}
