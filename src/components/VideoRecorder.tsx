"use client"

import { useRef, useState, useEffect, useCallback } from "react"
import { Mic, MicOff, Square, Video } from "lucide-react"

type Phase = "idle" | "recording" | "processing" | "waiting" | "done"

type Props = {
  sessionId: string
  questionText: string
  questionCategory: string
  sessionType: string
  onComplete: (feedback: unknown, transcript: string, videoUrl: string) => void
}

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, "0")}`
}

function captureFrame(video: HTMLVideoElement): string {
  const canvas = document.createElement("canvas")
  canvas.width = 480
  canvas.height = 270
  canvas.getContext("2d")!.drawImage(video, 0, 0, canvas.width, canvas.height)
  return canvas.toDataURL("image/jpeg", 0.6).split(",")[1]
}

async function uploadAudio(audioBlob: Blob, responseId: string): Promise<string> {
  const formData = new FormData()
  formData.append("audio", new File([audioBlob], `recording-${responseId}.webm`, { type: audioBlob.type || "audio/webm" }))
  const res = await fetch("/api/upload", { method: "POST", body: formData })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error ?? "Audio upload failed")
  return data.url
}

export function VideoRecorder({ sessionId, questionText, questionCategory, sessionType, onComplete }: Props) {
  const [phase, setPhase] = useState<Phase>("idle")
  const [duration, setDuration] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [processingStep, setProcessingStep] = useState("")

  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const audioRecorderRef = useRef<MediaRecorder | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const frameTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const pollIntervalRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const capturedFramesRef = useRef<string[]>([])
  const startTimeRef = useRef<number>(0)
  const responseIdRef = useRef<string | null>(null)
  const onCompleteRef = useRef(onComplete)
  const videoChunksRef = useRef<Blob[]>([])
  const videoRecorderRef = useRef<MediaRecorder | null>(null)
  const videoUrlRef = useRef<string>("")

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
  }, [])

  useEffect(() => () => {
    stopStream()
    if (timerRef.current) clearInterval(timerRef.current)
    if (frameTimerRef.current) clearInterval(frameTimerRef.current)
    if (pollIntervalRef.current) clearTimeout(pollIntervalRef.current)
  }, [stopStream])

  useEffect(() => { onCompleteRef.current = onComplete }, [onComplete])

  const startPolling = useCallback((responseId: string) => {
    const schedulePoll = () => {
      pollIntervalRef.current = setTimeout(async () => {
        try {
          const res = await fetch(`/api/responses/${responseId}/status`)
          const data = await res.json()

          if (data.status === "done") {
            setPhase("done")
            onCompleteRef.current(data.feedback, data.transcript ?? "", videoUrlRef.current)
          } else if (data.status === "failed") {
            setError(data.error ?? "Analysis failed. Please try again.")
            setPhase("idle")
          } else {
            schedulePoll()
          }
        } catch {
          schedulePoll()
        }
      }, 3000)
    }
    schedulePoll()
  }, [])

  const startRecording = async () => {
    setError(null)
    try {
      const res = await fetch("/api/responses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, questionText, questionCategory }),
      })
      if (!res.ok) throw new Error("Failed to create response record")
      const { response } = await res.json()
      responseIdRef.current = response.id

      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }

      audioChunksRef.current = []
      capturedFramesRef.current = []

      const audioMime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm"

      const audioRecorder = new MediaRecorder(new MediaStream(stream.getAudioTracks()), { mimeType: audioMime })
      audioRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data)
      }
      audioRecorderRef.current = audioRecorder
      audioRecorder.start(1000)

      const videoMime = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
        ? "video/webm;codecs=vp9"
        : "video/webm"
      const videoRecorder = new MediaRecorder(stream, { mimeType: videoMime })
      videoChunksRef.current = []
      videoRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) videoChunksRef.current.push(e.data)
      }
      videoRecorderRef.current = videoRecorder
      videoRecorder.start(1000)

      startTimeRef.current = Date.now()
      setDuration(0)
      timerRef.current = setInterval(() => {
        setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000))
      }, 1000)

      frameTimerRef.current = setInterval(() => {
        if (videoRef.current) {
          capturedFramesRef.current.push(captureFrame(videoRef.current))
          if (capturedFramesRef.current.length > 8) capturedFramesRef.current.shift()
        }
      }, 5000)

      setPhase("recording")
    } catch {
      setError("Camera/microphone access denied. Please allow permissions and try again.")
    }
  }

  const stopAndAnalyze = async () => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (frameTimerRef.current) clearInterval(frameTimerRef.current)
    const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000)

    if (videoRef.current) capturedFramesRef.current.push(captureFrame(videoRef.current))

    audioRecorderRef.current?.stop()
    await new Promise((r) => setTimeout(r, 300))

    videoRecorderRef.current?.stop()
    await new Promise((r) => setTimeout(r, 300))
    const videoBlob = new Blob(videoChunksRef.current, { type: "video/webm" })
    videoChunksRef.current = []
    if (videoUrlRef.current) URL.revokeObjectURL(videoUrlRef.current)
    videoUrlRef.current = URL.createObjectURL(videoBlob)

    const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" })
    audioChunksRef.current = []

    const all = capturedFramesRef.current
    const frames =
      all.length <= 6
        ? all
        : Array.from({ length: 6 }, (_, i) => all[Math.round((i * (all.length - 1)) / 5)])
    capturedFramesRef.current = []

    stopStream()
    setPhase("processing")

    try {
      setProcessingStep("Uploading recording…")
      const audioUrl = await uploadAudio(audioBlob, responseIdRef.current!)

      setProcessingStep("Queuing analysis…")
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          responseId: responseIdRef.current,
          questionText,
          sessionType,
          audioUrl,
          frames,
          durationSeconds: elapsed,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? "Failed to queue analysis")
      }

      const { responseId } = await res.json()
      setPhase("waiting")
      startPolling(responseId)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
      setPhase("idle")
    }
  }

  return (
    <div className="space-y-4">
      {/* Video element — large 16:9, new tokens */}
      <div className="relative w-full overflow-hidden rounded-xl border border-[#1e1e25] bg-[#111116]" style={{ aspectRatio: "16/9" }}>
        <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />

        {phase === "idle" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-[#3a3a45]">
            <Video className="h-10 w-10" />
            <span className="text-sm">Camera preview will appear here</span>
          </div>
        )}

        {phase === "recording" && (
          <>
            {/* REC badge */}
            <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full border border-red-500/30 bg-red-500/15 px-2.5 py-1">
              <span className="h-2 w-2 animate-pulse rounded-full bg-red-400" />
              <span className="text-xs font-semibold text-red-400">{formatDuration(duration)}</span>
            </div>
            {/* Waveform */}
            <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-end gap-0.5">
              {Array.from({ length: 12 }, (_, i) => (
                <div
                  key={i}
                  className="w-1 rounded-full"
                  style={{
                    background: i % 2 === 0 ? "#6366f1" : "#8b5cf6",
                    animation: `waveBar 0.8s ease-in-out infinite alternate`,
                    animationDelay: `${i * 0.07}s`,
                    height: "8px",
                  }}
                />
              ))}
            </div>
          </>
        )}

        {(phase === "processing" || phase === "waiting") && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#111116]/80">
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
            <p className="text-sm text-[#52525c]">
              {phase === "processing" ? processingStep : "Analyzing your response…"}
            </p>
            {phase === "waiting" && (
              <p className="text-xs text-[#3a3a45]">This takes about 15–20 seconds</p>
            )}
          </div>
        )}
      </div>

      {/* Controls */}
      {phase === "idle" && (
        <div className="flex flex-col items-center gap-2">
          <button
            onClick={startRecording}
            className="flex w-full items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #6366f1, #7c3aed)" }}
          >
            <Mic className="h-4 w-4" />
            Start recording
          </button>
          <p className="flex items-center gap-1 text-xs text-[#3a3a45]">
            <MicOff className="h-3 w-3" /> Speak clearly and look at the camera
          </p>
        </div>
      )}

      {phase === "recording" && (
        <button
          onClick={stopAndAnalyze}
          className="flex w-full items-center justify-center gap-2 rounded-md border border-[#1e1e25] bg-[#111116] px-4 py-2.5 text-sm font-semibold text-[#f5f5f8] transition-colors hover:bg-[#18181f]"
        >
          <Square className="h-4 w-4 fill-current text-red-400" />
          Stop &amp; submit answer
        </button>
      )}

      {error && (
        <p className="rounded-lg border border-red-900/50 bg-red-950/30 px-4 py-2 text-sm text-red-400">
          {error}
        </p>
      )}
    </div>
  )
}
