const mockGenerateContent = jest.fn()

jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: jest.fn().mockReturnValue({
      generateContent: mockGenerateContent,
    }),
  })),
}))

import { analyzeInterview, AnalyzeInput, FeedbackResult } from '@/lib/gemini'

const mockFeedback: FeedbackResult = {
  transcript: 'Test transcript',
  overallScore: 8,
  contentScore: 7,
  deliveryScore: 8,
  eyeContactScore: 9,
  bodyLanguageScore: 7,
  contentFeedback: 'Good content',
  deliveryFeedback: 'Good delivery',
  eyeContactFeedback: 'Good eye contact',
  bodyLanguageFeedback: 'Good posture',
  overallFeedback: 'Good overall',
  modelAnswer: 'Model answer here',
  fillerWords: ['um', 'uh'],
  missingStarComponents: [],
  resumeAlignmentNotes: 'Good alignment',
}

const baseInput: AnalyzeInput = {
  questionText: 'Tell me about yourself',
  sessionType: 'behavioral',
  audioBase64: 'fakeaudiodata',
  frames: ['fakeframe1'],
}

describe('analyzeInterview', () => {
  beforeEach(() => {
    mockGenerateContent.mockResolvedValue({
      response: { text: () => JSON.stringify(mockFeedback) },
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('returns parsed FeedbackResult from model response', async () => {
    const result = await analyzeInterview(baseInput)
    expect(result).toEqual(mockFeedback)
  })

  it('includes optional fields in context when provided', async () => {
    await analyzeInterview({
      ...baseInput,
      targetRole: 'Software Engineer',
      targetCompany: 'Google',
      industry: 'tech',
    })
    const parts: Array<{ text?: string }> = mockGenerateContent.mock.calls[0][0]
    const contextText = parts[parts.length - 1].text!
    expect(contextText).toContain('Target role: Software Engineer')
    expect(contextText).toContain('Target company: Google')
    expect(contextText).toContain('Industry: tech')
  })

  it('omits optional fields from context when not provided', async () => {
    await analyzeInterview(baseInput)
    const parts: Array<{ text?: string }> = mockGenerateContent.mock.calls[0][0]
    const contextText = parts[parts.length - 1].text!
    expect(contextText).not.toContain('Target role:')
    expect(contextText).not.toContain('Target company:')
    expect(contextText).not.toContain('CANDIDATE RESUME')
    expect(contextText).not.toContain('JOB DESCRIPTION')
  })

  it('truncates resumeText to 1000 characters', async () => {
    const longResume = 'a'.repeat(1500)
    await analyzeInterview({ ...baseInput, resumeText: longResume })
    const parts: Array<{ text?: string }> = mockGenerateContent.mock.calls[0][0]
    const contextText = parts[parts.length - 1].text!
    expect(contextText).toContain('a'.repeat(1000))
    expect(contextText).not.toContain('a'.repeat(1001))
  })

  it('truncates jobDescription to 600 characters', async () => {
    const longJD = 'b'.repeat(900)
    await analyzeInterview({ ...baseInput, jobDescription: longJD })
    const parts: Array<{ text?: string }> = mockGenerateContent.mock.calls[0][0]
    const contextText = parts[parts.length - 1].text!
    expect(contextText).toContain('b'.repeat(600))
    expect(contextText).not.toContain('b'.repeat(601))
  })
})
