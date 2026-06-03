"use client"

import { useRef, useState, useEffect, useCallback } from "react"
import { Mic, MicOff, Square, Video } from "lucide-react"
import { Button } from "@/components/ui/button"

type Phase = "idle" | "recording" | "processing" | "done"

type Props = {
  sessionId: string
  questionText: string
  questionCategory: string
  sessionType: string
  onComplete: (feedback: unknown, transcript: string) => void
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
  if (!res.ok) throw new Error("Audio upload failed")
  const { url } = await res.json()
  return url
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
  const capturedFramesRef = useRef<string[]>([])
  const startTimeRef = useRef<number>(0)
  const responseIdRef = useRef<string | null>(null)

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
  }, [])

  useEffect(() => () => {
    stopStream()
    if (timerRef.current) clearInterval(timerRef.current)
    if (frameTimerRef.current) clearInterval(frameTimerRef.current)
  }, [stopStream])

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

      startTimeRef.current = Date.now()
      setDuration(0)
      timerRef.current = setInterval(() => {
        setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000))
      }, 1000)

      // Snapshot a frame every 5 s; keep the latest 8 to stay memory-light
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

    // Always grab a final frame before killing the stream
    if (videoRef.current) capturedFramesRef.current.push(captureFrame(videoRef.current))

    audioRecorderRef.current?.stop()
    await new Promise((r) => setTimeout(r, 300))

    const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" })
    audioChunksRef.current = []

    // Pick 6 evenly-spaced frames from whatever we captured
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

      setProcessingStep("Analyzing with AI — this takes ~15 seconds…")
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
        throw new Error(data.error ?? "Analysis failed")
      }

      const { feedback, transcript } = await res.json()
      setPhase("done")
      onComplete(feedback, transcript)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
      setPhase("idle")
    }
  }

  return (
    <div className="space-y-4">
      {/* Video preview */}
      <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-gray-900 border border-gray-800">
        <video
          ref={videoRef}
          className="h-full w-full object-cover"
          muted
          playsInline
        />
        {phase === "idle" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-gray-500">
            <Video className="h-10 w-10" />
            <span className="text-sm">Camera preview will appear here</span>
          </div>
        )}
        {phase === "recording" && (
          <div className="absolute top-3 left-3 flex items-center gap-2 rounded-full bg-red-600/90 px-3 py-1">
            <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
            <span className="text-xs font-semibold text-white">{formatDuration(duration)}</span>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex flex-col items-center gap-3">
        {phase === "idle" && (
          <Button onClick={startRecording} size="lg" className="bg-indigo-600 hover:bg-indigo-500 gap-2">
            <Mic className="h-4 w-4" />
            Start Recording
          </Button>
        )}

        {phase === "recording" && (
          <Button
            onClick={stopAndAnalyze}
            size="lg"
            className="bg-red-600 hover:bg-red-500 gap-2 animate-pulse"
          >
            <Square className="h-4 w-4 fill-current" />
            Stop & Analyze
          </Button>
        )}

        {phase === "processing" && (
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="h-6 w-6 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
            <p className="text-sm text-gray-400">{processingStep}</p>
          </div>
        )}

        {phase === "idle" && (
          <p className="text-xs text-gray-500 flex items-center gap-1">
            <MicOff className="h-3 w-3" /> Speak clearly and look at the camera
          </p>
        )}
      </div>

      {error && (
        <p className="rounded-lg border border-red-900 bg-red-950/40 px-4 py-2 text-sm text-red-400">
          {error}
        </p>
      )}
    </div>
  )
}
