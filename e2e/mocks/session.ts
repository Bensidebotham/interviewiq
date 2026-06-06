export const MOCK_SESSION_ID = 'test-session-id'
export const MOCK_RESPONSE_ID = 'test-response-id'
export const MOCK_USER_ID = 'aaaaaaaa-0000-0000-0000-000000000001'

export const mockSession = {
  id: MOCK_SESSION_ID,
  sessionType: 'behavioral',
  companyName: 'Acme Corp',
  industry: 'tech',
  jobDescription: null,
  status: 'active',
  userId: MOCK_USER_ID,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  completedAt: null,
  triggerRunId: null,
  questions: [
    {
      id: 'q1',
      text: 'Tell me about a time you overcame a challenge.',
      category: 'behavioral',
      tips: 'Use the STAR framework.',
    },
    {
      id: 'q2',
      text: 'Describe a project you are proud of.',
      category: 'behavioral',
      tips: 'Focus on your specific contributions.',
    },
  ],
  responses: [],
}

export const mockFeedback = {
  id: 'feedback-1',
  responseId: MOCK_RESPONSE_ID,
  overallScore: 8,
  contentScore: 8,
  deliveryScore: 7,
  eyeContactScore: 8,
  bodyLanguageScore: 7,
  contentFeedback: 'Strong answer with clear STAR structure.',
  deliveryFeedback: 'Good pace and clarity throughout.',
  eyeContactFeedback: 'Maintained good eye contact.',
  bodyLanguageFeedback: 'Confident posture throughout.',
  overallFeedback: 'Excellent response demonstrating relevant experience.',
  modelAnswer: 'A model answer would start with the situation...',
  fillerWords: ['um', 'like'],
  missingStarComponents: [],
  resumeAlignmentNotes: null,
  createdAt: new Date().toISOString(),
}

export const mockSessionsList = {
  sessions: [
    {
      id: 'session-past-1',
      sessionType: 'behavioral',
      companyName: 'Acme Corp',
      status: 'completed',
      createdAt: new Date().toISOString(),
      responses: [
        { id: 'r1', questionText: 'Q1', feedback: { overallScore: 8 } },
      ],
    },
    {
      id: 'session-past-2',
      sessionType: 'technical',
      companyName: null,
      status: 'completed',
      createdAt: new Date().toISOString(),
      responses: [
        { id: 'r2', questionText: 'Q2', feedback: { overallScore: 7 } },
        { id: 'r3', questionText: 'Q3', feedback: { overallScore: 9 } },
      ],
    },
  ],
}
