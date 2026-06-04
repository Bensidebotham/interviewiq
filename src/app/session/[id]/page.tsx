"use client"

import { useEffect, useState, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { Navigation } from "@/components/Navigation"
import { VideoRecorder } from "@/components/VideoRecorder"
import { FeedbackPanel } from "@/components/FeedbackPanel"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronRight, CheckCircle } from "lucide-react"

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

  const questions: Question[] = session?.questions ?? []
  const currentQuestion = questions[questionIndex]
  const isLastQuestion = questionIndex >= questions.length - 1

  const handleAnalysisComplete = (feedback: unknown, transcript: string) => {
    setCurrentFeedback(feedback as FeedbackData)
    setCurrentTranscript(transcript)
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
          <CheckCircle className="h-12 w-12 text-emerald-400" />
          <h2 className="text-2xl font-bold">Session complete</h2>
          <p className="text-gray-400">You answered {questions.length} questions.</p>
          <div className="flex gap-3">
            <Button onClick={() => router.push("/dashboard")} variant="outline" className="border-gray-700 text-gray-300 hover:bg-gray-800">
              Dashboard
            </Button>
            <Button onClick={() => router.push("/session/new")} className="bg-indigo-600 hover:bg-indigo-500">
              New session
            </Button>
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

  return (
    <div className="flex h-full">
      <Navigation />
      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-4xl space-y-6">
          {/* Progress */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-gray-800 text-gray-300 capitalize">
                {session?.sessionType}
              </Badge>
              <span className="text-sm text-gray-500">
                Question {questionIndex + 1} of {questions.length}
              </span>
            </div>
            <div className="h-1.5 w-32 rounded-full bg-gray-800">
              <div
                className="h-1.5 rounded-full bg-indigo-500 transition-all duration-300"
                style={{ width: `${((questionIndex + 1) / questions.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Question */}
          <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
            <p className="mb-2 text-xs uppercase tracking-widest text-gray-500">
              {currentQuestion.category}
            </p>
            <h2 className="text-xl font-semibold leading-snug">{currentQuestion.text}</h2>
            {currentQuestion.tips && (
              <p className="mt-3 text-sm text-indigo-300/70 border-l-2 border-indigo-800 pl-3">
                Tip: {currentQuestion.tips}
              </p>
            )}
          </div>

          {/* Two-column layout: recorder + feedback */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div>
              {phase === "recording" && (
                <VideoRecorder
                  sessionId={id}
                  questionText={currentQuestion.text}
                  questionCategory={currentQuestion.category}
                  sessionType={session?.sessionType ?? "behavioral"}
                  onComplete={handleAnalysisComplete}
                />
              )}
              {phase === "feedback" && (
                <div className="rounded-xl border border-gray-800 bg-gray-900 p-4 h-full">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Recording complete</p>
                  <p className="text-sm text-gray-400">Your response has been analyzed. Review your transcript and feedback on the right.</p>
                </div>
              )}
            </div>

            <div>
              {phase === "feedback" && currentFeedback && (
                <div className="space-y-4">
                  <div className="rounded-xl border border-indigo-900/50 bg-indigo-950/30 p-4">
                    <p className="text-xs text-indigo-400 uppercase tracking-wider mb-2">Your transcript</p>
                    <p className="text-sm text-gray-300 leading-relaxed">&ldquo;{currentTranscript}&rdquo;</p>
                  </div>
                  <FeedbackPanel feedback={{ ...currentFeedback, transcript: currentTranscript }} />
                  <Button
                    onClick={nextQuestion}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 gap-2"
                  >
                    {isLastQuestion ? "Finish session" : "Next question"}
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
