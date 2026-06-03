import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!)

const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
  generationConfig: { responseMimeType: "application/json" },
})

const SYSTEM_PROMPT = `You are an elite interview coach with deep expertise in behavioral, technical, and situational interviews. You receive a candidate's recorded interview response: audio of what they said, and video frames showing how they presented themselves.

Analyze the candidate holistically and return a JSON object with exactly these fields:

{
  "transcript": "<verbatim transcription of what the candidate said>",
  "overallScore": <1-10>,
  "contentScore": <1-10, how well they answered the question — specificity, relevance, STAR structure>,
  "deliveryScore": <1-10, verbal delivery — pacing, clarity, filler words, confidence in voice>,
  "eyeContactScore": <1-10, how consistently they maintained eye contact with the camera>,
  "bodyLanguageScore": <1-10, posture, head movement, facial expressions, hand gestures>,
  "contentFeedback": "<2-3 sentences. Reference specific things they said. Mention what was strong and what was weak. For behavioral questions, call out missing STAR components explicitly.>",
  "deliveryFeedback": "<2-3 sentences. Call out filler words by exact word with count if detectable. Comment on pacing, any rushing or trailing off.>",
  "eyeContactFeedback": "<1-2 sentences. Be specific — did they look at notes, at a second monitor, at the camera? How consistent?>",
  "bodyLanguageFeedback": "<1-2 sentences. Posture, whether they looked relaxed or tense, any distracting gestures.>",
  "overallFeedback": "<3-4 sentences. The 2-3 highest-impact things they should fix. Be direct and specific.>",
  "modelAnswer": "<A rewrite of their answer using only their own experiences and stories (infer from what they said), structured in clear STAR format, confident language, no filler words. 150-250 words, written exactly as they should say it.>",
  "fillerWords": ["<each distinct filler word detected, e.g. 'um', 'like', 'you know'>"],
  "missingStarComponents": ["<list only components that were clearly missing or weak: Situation, Task, Action, Result>"],
  "resumeAlignmentNotes": "<1-2 sentences on whether they drew from relevant experience. If resume context was provided, note whether they used a strong example from it or missed a better one.>"
}

RULES:
- Be specific, not generic. Quote their actual words when giving feedback.
- Eye contact score: 9-10 = consistently at camera; 7-8 = mostly at camera with occasional breaks; 5-6 = frequently looking away; below 5 = rarely looking at camera.
- If audio is unclear or very short, note it in the transcript field.
- The model answer must not invent new experiences — only restructure what they shared.
- Return ONLY the JSON object, no markdown wrapper.`

export type FeedbackResult = {
  transcript: string
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
  resumeAlignmentNotes: string
}

export type AnalyzeInput = {
  questionText: string
  sessionType: string
  audioBase64: string
  frames: string[]
  resumeText?: string
  targetRole?: string
  targetCompany?: string
  industry?: string
  jobDescription?: string
}

export async function analyzeInterview(input: AnalyzeInput): Promise<FeedbackResult> {
  const {
    questionText,
    sessionType,
    audioBase64,
    frames,
    resumeText,
    targetRole,
    targetCompany,
    industry,
    jobDescription,
  } = input

  const contextBlock = [
    `INTERVIEW QUESTION: "${questionText}"`,
    `Session type: ${sessionType}`,
    targetRole ? `Target role: ${targetRole}` : null,
    targetCompany ? `Target company: ${targetCompany}` : null,
    industry ? `Industry: ${industry}` : null,
    resumeText ? `\nCANDIDATE RESUME (first 1000 chars):\n${resumeText.slice(0, 1000)}` : null,
    jobDescription ? `\nJOB DESCRIPTION (first 600 chars):\n${jobDescription.slice(0, 600)}` : null,
  ]
    .filter(Boolean)
    .join("\n")

  const parts: Parameters<typeof model.generateContent>[0] = [
    { text: SYSTEM_PROMPT },
    { inlineData: { data: audioBase64, mimeType: "audio/webm" } },
    ...frames.map((frame) => ({
      inlineData: { data: frame, mimeType: "image/jpeg" },
    })),
    { text: contextBlock },
  ]

  const result = await model.generateContent(parts)
  const text = result.response.text()

  return JSON.parse(text) as FeedbackResult
}
