import { NextRequest } from 'next/server'

jest.mock('next-auth', () => ({ getServerSession: jest.fn() }))
jest.mock('@/lib/auth', () => ({ authOptions: {} }))
jest.mock('@/lib/prisma', () => ({
  prisma: {
    response: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  },
}))
jest.mock('@trigger.dev/sdk/v3', () => ({
  tasks: { trigger: jest.fn() },
}))

import { POST } from '@/app/api/analyze/route'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { tasks } from '@trigger.dev/sdk/v3'

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>
const mockFindFirst = prisma.response.findFirst as jest.MockedFunction<
  typeof prisma.response.findFirst
>
const mockUpdate = prisma.response.update as jest.MockedFunction<typeof prisma.response.update>
const mockTrigger = tasks.trigger as jest.MockedFunction<typeof tasks.trigger>

const validBody = {
  responseId: 'resp-1',
  questionText: 'Tell me about yourself',
  sessionType: 'behavioral',
  audioUrl: 'https://example.com/audio.webm',
  frames: ['frame1'],
}

function makeRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/analyze', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('POST /api/analyze', () => {
  afterEach(() => jest.clearAllMocks())

  it('returns 401 when not authenticated', async () => {
    mockGetServerSession.mockResolvedValue(null)
    const res = await POST(makeRequest(validBody))
    expect(res.status).toBe(401)
  })

  it('returns 400 when body is missing required fields', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 'user-1' } } as never)
    const res = await POST(makeRequest({ responseId: 'resp-1' }))
    expect(res.status).toBe(400)
  })

  it('returns 404 when response does not belong to user', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 'user-1' } } as never)
    mockFindFirst.mockResolvedValue(null)
    const res = await POST(makeRequest(validBody))
    expect(res.status).toBe(404)
  })

  it('returns 503 when tasks.trigger throws', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 'user-1' } } as never)
    mockFindFirst.mockResolvedValue({ id: 'resp-1' } as never)
    mockUpdate.mockResolvedValue({} as never)
    mockTrigger.mockRejectedValue(new Error('Trigger service unavailable'))
    const res = await POST(makeRequest(validBody))
    expect(res.status).toBe(503)
  })

  it('returns 202 with runId and responseId on success', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 'user-1' } } as never)
    mockFindFirst.mockResolvedValue({ id: 'resp-1' } as never)
    mockUpdate.mockResolvedValue({} as never)
    mockTrigger.mockResolvedValue({ id: 'run-123' } as never)
    const res = await POST(makeRequest(validBody))
    expect(res.status).toBe(202)
    const body = await res.json()
    expect(body).toEqual({ runId: 'run-123', responseId: 'resp-1' })
  })
})
