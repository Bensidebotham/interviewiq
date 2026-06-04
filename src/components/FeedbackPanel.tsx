import { Badge } from "@/components/ui/badge"
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

function ScoreRow({
  label,
  score,
  feedback,
}: {
  label: string
  score: number
  feedback: string
}) {
  const color =
    score >= 8 ? "text-emerald-400" : score >= 6 ? "text-yellow-400" : "text-red-400"
  const barColor =
    score >= 8 ? "bg-emerald-500" : score >= 6 ? "bg-yellow-500" : "bg-red-500"

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-300">{label}</span>
        <span className={`text-sm font-bold ${color}`}>{score}/10</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-gray-800">
        <div
          className={`h-1.5 rounded-full ${barColor} transition-all duration-500`}
          style={{ width: `${score * 10}%` }}
        />
      </div>
      <p className="text-xs text-gray-400">{feedback}</p>
    </div>
  )
}

export function FeedbackPanel({ feedback }: { feedback: Feedback }) {
  const [showModel, setShowModel] = useState(false)
  const [showTranscript, setShowTranscript] = useState(false)

  const overallColor =
    feedback.overallScore >= 8
      ? "text-emerald-400"
      : feedback.overallScore >= 6
      ? "text-yellow-400"
      : "text-red-400"

  return (
    <div className="space-y-6">
      {/* Overall score */}
      <div className="flex items-center gap-4 rounded-xl border border-gray-800 bg-gray-900 p-5">
        <span className={`text-5xl font-black ${overallColor}`}>{feedback.overallScore}</span>
        <div>
          <p className="text-xs uppercase tracking-widest text-gray-500">Overall Score</p>
          <p className="mt-1 text-sm text-gray-300">{feedback.overallFeedback}</p>
        </div>
      </div>

      {/* Score breakdown */}
      <div className="rounded-xl border border-gray-800 bg-gray-900 p-5 space-y-5">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400">Breakdown</h3>
        <ScoreRow label="Content & Structure" score={feedback.contentScore} feedback={feedback.contentFeedback} />
        <ScoreRow label="Verbal Delivery" score={feedback.deliveryScore} feedback={feedback.deliveryFeedback} />
        <ScoreRow label="Eye Contact" score={feedback.eyeContactScore} feedback={feedback.eyeContactFeedback} />
        <ScoreRow label="Body Language" score={feedback.bodyLanguageScore} feedback={feedback.bodyLanguageFeedback} />
      </div>

      {/* Filler words + missing STAR */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">Filler Words</p>
          {feedback.fillerWords.length === 0 ? (
            <p className="text-xs text-emerald-400">None detected</p>
          ) : (
            <div className="flex flex-wrap gap-1">
              {feedback.fillerWords.map((w) => (
                <Badge key={w} variant="secondary" className="bg-amber-900/40 text-amber-300 border-amber-800">
                  {w}
                </Badge>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">Missing STAR</p>
          {feedback.missingStarComponents.length === 0 ? (
            <p className="text-xs text-emerald-400">Full STAR present</p>
          ) : (
            <div className="flex flex-wrap gap-1">
              {feedback.missingStarComponents.map((c) => (
                <Badge key={c} variant="secondary" className="bg-red-900/40 text-red-300 border-red-800">
                  {c}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Resume alignment */}
      {feedback.resumeAlignmentNotes && (
        <div className="rounded-xl border border-indigo-900/50 bg-indigo-950/30 p-4">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-indigo-400">Resume Alignment</p>
          <p className="text-sm text-gray-300">{feedback.resumeAlignmentNotes}</p>
        </div>
      )}

      {/* Model answer */}
      <div className="rounded-xl border border-gray-800 bg-gray-900">
        <button
          onClick={() => setShowModel(!showModel)}
          className="flex w-full items-center justify-between p-4 text-left"
        >
          <span className="text-sm font-semibold text-gray-200">How you could have said it</span>
          {showModel ? (
            <ChevronUp className="h-4 w-4 text-gray-500" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-500" />
          )}
        </button>
        {showModel && (
          <div className="border-t border-gray-800 p-4">
            <p className="text-sm leading-relaxed text-gray-300 whitespace-pre-wrap">{feedback.modelAnswer}</p>
          </div>
        )}
      </div>

      {/* Transcript */}
      {feedback.transcript && (
        <div className="rounded-xl border border-gray-800 bg-gray-900">
          <button
            onClick={() => setShowTranscript(!showTranscript)}
            className="flex w-full items-center justify-between p-4 text-left"
          >
            <span className="text-sm font-semibold text-gray-200">Your transcript</span>
            {showTranscript ? (
              <ChevronUp className="h-4 w-4 text-gray-500" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-500" />
            )}
          </button>
          {showTranscript && (
            <div className="border-t border-gray-800 p-4">
              <p className="text-sm leading-relaxed text-gray-400 italic">&ldquo;{feedback.transcript}&rdquo;</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
