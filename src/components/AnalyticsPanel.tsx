"use client"

import { useRef, useState, useEffect, useMemo, type CSSProperties, type ReactElement } from "react"
import { FeedbackPanel } from "@/components/FeedbackPanel"

// ─── Types ───────────────────────────────────────────────────────────────────

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

export type AnalyticsPanelProps = {
  feedback: FeedbackData
  transcript: string
  videoUrl: string
  questionText: string
  questionIndex: number
  totalQuestions: number
  isLastQuestion: boolean
  onNext: () => void
  onReRecord: () => void
}

type StarLabel = "S" | "T" | "A" | "R"
type SegmentStatus = "present" | "weak" | "missing"

type Segment = {
  label: StarLabel
  startPct: number
  widthPct: number
  status: SegmentStatus
}

type TranscriptLine = {
  approxTime: string
  label: StarLabel
  text: string
  isMissing: boolean
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildSegments(missingStarComponents: string[]): Segment[] {
  const missing = new Set(
    missingStarComponents.map((s) => s.charAt(0).toUpperCase())
  )
  return [
    { label: "S", startPct: 0,  widthPct: 25, status: missing.has("S") ? "missing" : "present" },
    { label: "T", startPct: 25, widthPct: 15, status: missing.has("T") ? "missing" : "present" },
    { label: "A", startPct: 40, widthPct: 44, status: missing.has("A") ? "missing" : "present" },
    { label: "R", startPct: 84, widthPct: 16, status: missing.has("R") ? "missing" : "present" },
  ]
}

function buildTranscriptLines(
  transcript: string,
  missingStarComponents: string[]
): TranscriptLine[] {
  if (!transcript.trim()) return []
  const missing = new Set(
    missingStarComponents.map((s) => s.charAt(0).toUpperCase())
  )
  const sentences = transcript
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean)
  if (sentences.length === 0) return []

  const boundaries = [
    { label: "S" as StarLabel, end: Math.ceil(sentences.length * 0.25) },
    { label: "T" as StarLabel, end: Math.ceil(sentences.length * 0.40) },
    { label: "A" as StarLabel, end: Math.ceil(sentences.length * 0.84) },
    { label: "R" as StarLabel, end: sentences.length },
  ]

  const lines: TranscriptLine[] = sentences.map((text, i) => {
    const bucket = boundaries.find((b) => i < b.end)!
    const wordsUpToHere = sentences.slice(0, i).join(" ").split(" ").length
    const seconds = Math.round((wordsUpToHere / 130) * 60)
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return {
      approxTime: `${m}:${s.toString().padStart(2, "0")}`,
      label: bucket.label,
      text,
      isMissing: false,
    }
  })

  if (missing.has("R")) {
    lines.push({
      approxTime: "",
      label: "R",
      text: "— result not stated —",
      isMissing: true,
    })
  }

  return lines
}

function highlightFillers(text: string, fillerWords: string[]): ReactElement {
  if (!fillerWords.length) return <>{text}</>
  const pattern = new RegExp(
    `\\b(${fillerWords.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})\\b`,
    "gi"
  )
  const parts = text.split(pattern)
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <span key={i} className="rounded bg-red-500/15 px-0.5 text-red-400">
            {part}
          </span>
        ) : (
          part
        )
      )}
    </>
  )
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

function segmentBg(status: SegmentStatus): string {
  if (status === "present") return "rgba(163,230,53,0.18)"
  if (status === "weak")    return "rgba(251,191,36,0.12)"
  return "rgba(248,113,113,0.08)"
}

function segmentBorder(status: SegmentStatus): string {
  if (status === "present") return "rgba(163,230,53,0.3)"
  if (status === "weak")    return "rgba(251,191,36,0.3)"
  return "rgba(248,113,113,0.2)"
}

function segmentLabelColor(status: SegmentStatus): string {
  if (status === "present") return "rgba(163,230,53,0.8)"
  if (status === "weak")    return "rgba(251,191,36,0.9)"
  return "rgba(248,113,113,0.7)"
}

function labelColor(label: StarLabel, missing: Set<string>): string {
  if (missing.has(label)) return "#f87171"
  if (label === "A")      return "#fbbf24"
  return "#a3e635"
}

// ─── Component ───────────────────────────────────────────────────────────────

export function AnalyticsPanel({
  feedback,
  transcript,
  videoUrl,
  questionText,
  questionIndex,
  totalQuestions,
  isLastQuestion,
  onNext,
  onReRecord,
}: AnalyticsPanelProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [playheadPct, setPlayheadPct] = useState(0)
  const [activeSegment, setActiveSegment] = useState<Segment | null>(null)
  const [activeTab, setActiveTab] = useState<"coaching" | "scores" | "model">("coaching")

  const segments = useMemo(
    () => buildSegments(feedback.missingStarComponents),
    [feedback.missingStarComponents]
  )
  const transcriptLines = useMemo(
    () => buildTranscriptLines(transcript, feedback.missingStarComponents),
    [transcript, feedback.missingStarComponents]
  )
  const missing = useMemo(
    () => new Set(feedback.missingStarComponents.map((s) => s.charAt(0).toUpperCase())),
    [feedback.missingStarComponents]
  )

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    const onTime = () => {
      const pct = video.duration ? (video.currentTime / video.duration) * 100 : 0
      setPlayheadPct(pct)
      const seg = segments.find(
        (s) => pct >= s.startPct && pct < s.startPct + s.widthPct
      )
      setActiveSegment(seg ?? null)
    }
    video.addEventListener("timeupdate", onTime)
    return () => video.removeEventListener("timeupdate", onTime)
  }, [segments])

  const seekTo = (pct: number) => {
    const video = videoRef.current
    if (!video || !video.duration) return
    video.currentTime = (pct / 100) * video.duration
  }

  const seekToLine = (lineIndex: number) => {
    const video = videoRef.current
    if (!video || !video.duration) return
    const pct = (lineIndex / Math.max(transcriptLines.length, 1)) * 100
    video.currentTime = (pct / 100) * video.duration
    video.play()
  }

  return (
    <div className="flex flex-col h-full">
      {/* Top bar */}
      <div className="flex items-center justify-between border-b border-[#1e1e25] px-6 py-3 flex-shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-[#f5f5f8]">Answer Review</span>
          <span className="text-sm text-[#52525c]">
            Q{questionIndex + 1} of {totalQuestions}
          </span>
          <span className="rounded-md border border-[#1e1e25] bg-[#18181f] px-2 py-0.5 text-xs text-[#a0a0ac] truncate max-w-xs">
            {questionText}
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onReRecord}
            className="rounded-md border border-[#1e1e25] px-3 py-1.5 text-xs font-medium text-[#52525c] transition-colors hover:border-[#2a2a35] hover:text-[#a0a0ac]"
          >
            Re-record
          </button>
          <button
            onClick={onNext}
            className="rounded-md px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #6366f1, #7c3aed)" }}
          >
            {isLastQuestion ? "Finish session" : "Next question →"}
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 min-h-0">
        {/* LEFT column */}
        <div className="flex flex-1 flex-col gap-4 overflow-auto p-5 min-w-0">

          {/* Video player */}
          <div
            className="relative w-full overflow-hidden rounded-xl border border-[#1e1e25] bg-[#111116]"
            style={{ aspectRatio: "16/9" }}
          >
            <video
              ref={videoRef}
              src={videoUrl}
              className="h-full w-full object-cover"
              playsInline
              onClick={() => {
                const v = videoRef.current
                if (!v) return
                v.paused ? v.play() : v.pause()
              }}
            />

            {/* Score badge — top right */}
            <div className="absolute right-3 top-3 rounded-lg border border-indigo-500/20 bg-black/75 px-3 py-1.5 text-center backdrop-blur-sm">
              <div
                className="text-xl font-black leading-none"
                style={scoreTextStyle(feedback.overallScore)}
              >
                {feedback.overallScore}
              </div>
              <div className="mt-0.5 text-[9px] text-[#52525c]">score</div>
            </div>

            {/* Active segment label — top left */}
            {activeSegment && (
              <div
                className="absolute left-3 top-3 rounded-md border px-2 py-1 text-[10px] font-semibold backdrop-blur-sm"
                style={{
                  borderColor: segmentBorder(activeSegment.status),
                  background: segmentBg(activeSegment.status),
                  color: segmentLabelColor(activeSegment.status),
                }}
              >
                {activeSegment.status === "missing"
                  ? `${activeSegment.label === "R" ? "Result" : activeSegment.label} — missing`
                  : { S: "Situation", T: "Task", A: "Action", R: "Result" }[activeSegment.label]}
              </div>
            )}

            {/* Play button overlay */}
            <div
              className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
              onClick={() => {
                const v = videoRef.current
                if (!v) return
                v.paused ? v.play() : v.pause()
              }}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-indigo-500/40 bg-indigo-500/20 backdrop-blur-sm">
                <div
                  style={{
                    width: 0,
                    height: 0,
                    borderStyle: "solid",
                    borderWidth: "7px 0 7px 13px",
                    borderColor: "transparent transparent transparent #a5b4fc",
                    marginLeft: 3,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Annotated timeline */}
          <div className="flex-shrink-0 space-y-1.5">
            <div className="flex items-center justify-between text-[10px] text-[#52525c]">
              <span>0:00</span>
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <span className="inline-block h-1.5 w-3 rounded bg-green-500/60" />
                  STAR present
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block h-1.5 w-3 rounded bg-amber-400/50" />
                  Needs work
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block h-2 w-2 rounded-full bg-red-500" />
                  Filler word
                </span>
              </div>
              <span>end</span>
            </div>

            <div
              className="relative h-6 w-full cursor-pointer overflow-hidden rounded-md border border-[#1e1e25] bg-[#111116]"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect()
                seekTo(((e.clientX - rect.left) / rect.width) * 100)
              }}
            >
              {segments.map((seg) => (
                <div
                  key={seg.label}
                  className="absolute inset-y-0 flex items-center"
                  style={{
                    left: `${seg.startPct}%`,
                    width: `${seg.widthPct}%`,
                    background: segmentBg(seg.status),
                    borderRight: `1px solid ${segmentBorder(seg.status)}`,
                  }}
                >
                  <span
                    className="pl-1.5 text-[9px] font-bold"
                    style={{ color: segmentLabelColor(seg.status) }}
                  >
                    {seg.status === "missing" ? `${seg.label}?` : seg.label}
                  </span>
                </div>
              ))}

              {feedback.fillerWords.map((_, i) => {
                const total = feedback.fillerWords.length
                const pct = 40 + ((i + 0.5) / total) * 44
                return (
                  <div
                    key={i}
                    className="absolute top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-red-500"
                    style={{ left: `${pct}%` }}
                  />
                )
              })}

              <div
                className="absolute inset-y-0 w-0.5 bg-indigo-500"
                style={{ left: `${playheadPct}%` }}
              />
            </div>
          </div>

          {/* Transcript */}
          <div
            className="flex-1 min-h-0 overflow-hidden rounded-xl border border-[#1e1e25] bg-[#111116] flex flex-col"
            style={{ minHeight: "160px" }}
          >
            <div className="border-b border-[#1e1e25] px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-[#52525c] flex-shrink-0">
              Transcript — click any line to jump
            </div>
            <div className="flex-1 overflow-auto px-4 py-3 space-y-1 font-mono text-xs">
              {transcriptLines.length === 0 ? (
                <p className="text-[#3a3a45] italic">No transcript available.</p>
              ) : (
                transcriptLines.map((line, i) => (
                  <div
                    key={i}
                    className={`flex gap-3 rounded px-2 py-1 cursor-pointer transition-colors ${
                      line.isMissing
                        ? "border border-red-500/10 bg-red-500/5"
                        : "hover:bg-indigo-500/5"
                    }`}
                    onClick={() => !line.isMissing && seekToLine(i)}
                  >
                    <span className="flex-shrink-0 text-[#3a3a45] text-[10px] w-8">
                      {line.approxTime}
                    </span>
                    <span
                      className="flex-shrink-0 text-[10px] font-bold w-5"
                      style={{ color: labelColor(line.label, missing) }}
                    >
                      [{line.label}]
                    </span>
                    <span
                      className={
                        line.isMissing
                          ? "italic text-[#3a3a45]"
                          : "text-[#a0a0ac] leading-relaxed"
                      }
                    >
                      {line.isMissing
                        ? line.text
                        : highlightFillers(line.text, feedback.fillerWords)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* RIGHT column — coaching panel */}
        <div className="flex w-72 flex-shrink-0 flex-col border-l border-[#1e1e25] bg-[#0d0d12]">
          {/* Tabs */}
          <div className="flex border-b border-[#1e1e25] flex-shrink-0">
            {(["coaching", "scores", "model"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 px-2 py-2.5 text-xs font-medium capitalize transition-colors ${
                  activeTab === tab
                    ? "border-b-2 border-indigo-500 text-indigo-300"
                    : "text-[#52525c] hover:text-[#a0a0ac]"
                }`}
              >
                {tab === "model" ? "Model answer" : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-auto p-4 space-y-3">
            {activeTab === "coaching" && (
              <>
                <div className="rounded-r-lg border border-[#1e1e25] border-l-2 border-l-green-500 bg-[#111116] p-3">
                  <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-green-400">
                    ✓ What went well
                  </p>
                  <p className="text-xs leading-relaxed text-[#a0a0ac]">
                    {feedback.overallFeedback}
                  </p>
                </div>

                {feedback.missingStarComponents.length > 0 && (
                  <div className="rounded-r-lg border border-amber-400/20 border-l-2 border-l-amber-400 bg-[#111116] p-3">
                    <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-400">
                      ⚠ Missing: {feedback.missingStarComponents.join(", ")}
                    </p>
                    <p className="text-xs leading-relaxed text-[#a0a0ac]">
                      {feedback.contentFeedback}
                    </p>
                  </div>
                )}

                {feedback.fillerWords.length > 0 && (
                  <div className="rounded-r-lg border border-red-500/15 border-l-2 border-l-red-500 bg-[#111116] p-3">
                    <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-red-400">
                      ✗ Filler words ({feedback.fillerWords.length})
                    </p>
                    <div className="mb-3 flex flex-wrap gap-1.5">
                      {feedback.fillerWords.map((w) => (
                        <span
                          key={w}
                          className="rounded-full border border-red-500/20 bg-red-500/10 px-2 py-0.5 text-[10px] text-red-400"
                        >
                          {w}
                        </span>
                      ))}
                    </div>
                    {(() => {
                      const filler = feedback.fillerWords[0]
                      const escaped = filler.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
                      const exampleSentence = transcript
                        .split(/(?<=[.!?])\s+/)
                        .find((s) =>
                          new RegExp(`\\b${escaped}\\b`, "i").test(s)
                        )
                      if (!exampleSentence) return null
                      const cleaned = exampleSentence
                        .replace(
                          new RegExp(`\\b${escaped}\\b,?\\s?`, "gi"),
                          ""
                        )
                        .trim()
                      return (
                        <div className="rounded-md bg-[#18181f] p-2 space-y-1.5">
                          <p className="text-[9px] text-[#52525c]">Instead of:</p>
                          <p className="text-[10px] text-red-400 italic line-clamp-2">
                            {exampleSentence}
                          </p>
                          <p className="text-[9px] text-[#52525c]">Try:</p>
                          <p className="text-[10px] text-green-400 italic line-clamp-2">
                            {cleaned}{" "}
                            <span className="text-[#52525c] not-italic">
                              (pause instead)
                            </span>
                          </p>
                        </div>
                      )
                    })()}
                  </div>
                )}

                <div className="rounded-r-lg border border-indigo-500/15 border-l-2 border-l-indigo-500 bg-[#111116] p-3">
                  <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-indigo-400">
                    ↑ Delivery
                  </p>
                  <p className="text-xs leading-relaxed text-[#a0a0ac]">
                    {feedback.deliveryScore <= feedback.eyeContactScore
                      ? feedback.deliveryFeedback
                      : feedback.eyeContactFeedback}
                  </p>
                </div>
              </>
            )}

            {activeTab === "scores" && (
              <FeedbackPanel feedback={{ ...feedback, transcript }} />
            )}

            {activeTab === "model" && (
              <div className="space-y-2">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[#52525c]">
                  How you could have said it
                </p>
                <p className="text-xs leading-relaxed text-[#a0a0ac] whitespace-pre-wrap">
                  {feedback.modelAnswer}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
