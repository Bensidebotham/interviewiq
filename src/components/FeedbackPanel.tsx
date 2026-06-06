import type { CSSProperties } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"
import { useState } from "react"

type Feedback = {
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
  transcript?: string
}

function scoreBarColor(score: number): string {
  if (score >= 8) return "linear-gradient(90deg, #6366f1, #8b5cf6)"
  if (score >= 6) return "#fbbf24"
  return "#f87171"
}

function scoreTextStyle(score: number): CSSProperties {
  if (score >= 8)
    return {
      background: "linear-gradient(135deg, #818cf8, #a78bfa)",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
    }
  if (score >= 6) return { color: "#fbbf24" }
  return { color: "#f87171" }
}

function ScoreRow({
  label,
  score,
  feedback,
}: {
  label: string
  score: number
  feedback: string
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-[#a0a0ac]">{label}</span>
        <span className="text-sm font-bold" style={scoreTextStyle(score)}>
          {score}/10
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#1e1e25]">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${score * 10}%`, background: scoreBarColor(score) }}
        />
      </div>
      <p className="text-xs text-[#52525c]">{feedback}</p>
    </div>
  )
}

export function FeedbackPanel({ feedback }: { feedback: Feedback }) {
  const [showModel, setShowModel] = useState(false)
  const [showTranscript, setShowTranscript] = useState(false)

  return (
    <div className="space-y-4">
      {/* Overall score */}
      <div className="flex items-center gap-4 rounded-xl border border-[#1e1e25] bg-[#111116] p-5">
        <span
          className="text-5xl font-black"
          style={scoreTextStyle(feedback.overallScore)}
        >
          {feedback.overallScore}
        </span>
        <div>
          <p className="text-xs uppercase tracking-widest text-[#52525c]">Overall Score</p>
          <p className="mt-1 text-sm text-[#a0a0ac]">{feedback.overallFeedback}</p>
        </div>
      </div>

      {/* Score breakdown */}
      <div className="rounded-xl border border-[#1e1e25] bg-[#111116] p-5 space-y-5">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[#52525c]">Breakdown</h3>
        <ScoreRow label="Content & Structure" score={feedback.contentScore} feedback={feedback.contentFeedback} />
        <ScoreRow label="Verbal Delivery" score={feedback.deliveryScore} feedback={feedback.deliveryFeedback} />
        <ScoreRow label="Eye Contact" score={feedback.eyeContactScore} feedback={feedback.eyeContactFeedback} />
        <ScoreRow label="Body Language" score={feedback.bodyLanguageScore} feedback={feedback.bodyLanguageFeedback} />
      </div>

      {/* Filler words + missing STAR */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl border border-[#1e1e25] bg-[#111116] p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#52525c]">Filler Words</p>
          {feedback.fillerWords.length === 0 ? (
            <p className="text-xs text-emerald-400">None detected</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {feedback.fillerWords.map((w) => (
                <span
                  key={w}
                  className="rounded-full border border-red-500/20 bg-red-500/10 px-2 py-0.5 text-xs text-red-400"
                >
                  {w}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-[#1e1e25] bg-[#111116] p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#52525c]">Missing STAR</p>
          {feedback.missingStarComponents.length === 0 ? (
            <p className="text-xs text-emerald-400">Full STAR present</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {feedback.missingStarComponents.map((c) => (
                <span
                  key={c}
                  className="rounded-full border border-red-500/20 bg-red-500/10 px-2 py-0.5 text-xs text-red-400"
                >
                  {c}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Resume alignment */}
      {feedback.resumeAlignmentNotes && (
        <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-4">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-indigo-400">Resume Alignment</p>
          <p className="text-sm text-[#a0a0ac]">{feedback.resumeAlignmentNotes}</p>
        </div>
      )}

      {/* Model answer */}
      <div className="rounded-xl border border-[#1e1e25] bg-[#111116]">
        <button
          onClick={() => setShowModel(!showModel)}
          className="flex w-full items-center justify-between p-4 text-left"
        >
          <span className="text-sm font-semibold text-[#f5f5f8]">How you could have said it</span>
          {showModel ? (
            <ChevronUp className="h-4 w-4 text-[#52525c]" />
          ) : (
            <ChevronDown className="h-4 w-4 text-[#52525c]" />
          )}
        </button>
        {showModel && (
          <div className="border-t border-[#1e1e25] p-4">
            <p className="text-sm leading-relaxed text-[#a0a0ac] whitespace-pre-wrap">{feedback.modelAnswer}</p>
          </div>
        )}
      </div>

      {/* Transcript */}
      {feedback.transcript && (
        <div className="rounded-xl border border-[#1e1e25] bg-[#111116]">
          <button
            onClick={() => setShowTranscript(!showTranscript)}
            className="flex w-full items-center justify-between p-4 text-left"
          >
            <span className="text-sm font-semibold text-[#f5f5f8]">Your transcript</span>
            {showTranscript ? (
              <ChevronUp className="h-4 w-4 text-[#52525c]" />
            ) : (
              <ChevronDown className="h-4 w-4 text-[#52525c]" />
            )}
          </button>
          {showTranscript && (
            <div className="border-t border-[#1e1e25] p-4">
              <p className="font-mono text-sm leading-relaxed text-[#52525c] italic">&ldquo;{feedback.transcript}&rdquo;</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
