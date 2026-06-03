import { schemaTask } from "@trigger.dev/sdk/v3";
import { z } from "zod";
import { prisma } from "../src/lib/prisma";
import { analyzeInterview } from "../src/lib/gemini";

const schema = z.object({
  responseId: z.string(),
  questionText: z.string(),
  sessionType: z.string(),
  audioUrl: z.string().url(),
  frames: z.array(z.string()).min(1).max(10),
  durationSeconds: z.number().optional(),
  userId: z.string(),
});

export const analyzeInterviewTask = schemaTask({
  id: "analyze-interview",
  schema,
  retry: {
    maxAttempts: 3,
    factor: 2,
    minTimeoutInMs: 1000,
    maxTimeoutInMs: 30_000,
  },
  run: async (payload) => {
    const {
      responseId,
      questionText,
      sessionType,
      audioUrl,
      frames,
      durationSeconds,
      userId,
    } = payload;

    // Reset status at the start of every attempt so retries don't leave "failed" visible
    await prisma.response.update({
      where: { id: responseId },
      data: { analysisStatus: "analyzing" },
    });

    try {
      // Fetch audio from Blob and convert to base64
      const audioRes = await fetch(audioUrl);
      if (!audioRes.ok) throw new Error(`Failed to fetch audio: ${audioRes.status}`);
      const audioBuffer = await audioRes.arrayBuffer();
      const audioBase64 = Buffer.from(audioBuffer).toString("base64");

      // Get user profile and session context
      const [profile, response] = await Promise.all([
        prisma.profile.findUnique({ where: { userId } }),
        prisma.response.findUnique({
          where: { id: responseId },
          include: { session: true },
        }),
      ]);

      if (!response) throw new Error("Response not found");

      // Call Gemini
      const feedback = await analyzeInterview({
        questionText,
        sessionType,
        audioBase64,
        frames,
        resumeText: profile?.resumeText ?? undefined,
        targetRole: profile?.targetRole ?? undefined,
        targetCompany: profile?.targetCompany ?? (response.session.companyName ?? undefined),
        industry: profile?.industry ?? (response.session.industry ?? undefined),
        jobDescription: response.session.jobDescription ?? undefined,
      });

      // Save feedback (upsert guards against duplicate on retry)
      const feedbackData = {
        overallScore: feedback.overallScore,
        contentScore: feedback.contentScore,
        deliveryScore: feedback.deliveryScore,
        eyeContactScore: feedback.eyeContactScore,
        bodyLanguageScore: feedback.bodyLanguageScore,
        contentFeedback: feedback.contentFeedback,
        deliveryFeedback: feedback.deliveryFeedback,
        eyeContactFeedback: feedback.eyeContactFeedback,
        bodyLanguageFeedback: feedback.bodyLanguageFeedback,
        overallFeedback: feedback.overallFeedback,
        modelAnswer: feedback.modelAnswer,
        fillerWords: feedback.fillerWords,
        missingStarComponents: feedback.missingStarComponents,
        resumeAlignmentNotes: feedback.resumeAlignmentNotes,
      };

      await prisma.feedback.upsert({
        where: { responseId },
        create: { responseId, ...feedbackData },
        update: feedbackData,
      });

      // Update response with results
      await prisma.response.update({
        where: { id: responseId },
        data: {
          transcript: feedback.transcript,
          durationSeconds: durationSeconds ?? null,
          audioUrl,
          analysisStatus: "done",
        },
      });

      return { transcript: feedback.transcript };
    } catch (err) {
      // Mark as failed so the poll endpoint can surface the error
      await prisma.response
        .update({ where: { id: responseId }, data: { analysisStatus: "failed" } })
        .catch(() => {});
      throw err;
    }
  },
});
