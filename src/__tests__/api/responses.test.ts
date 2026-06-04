import { NextRequest } from 'next/server'

jest.mock('next-auth', () => ({ getServerSession: jest.fn() }))
jest.mock('@/lib/auth', () => ({ authOptions: {} }))
jest.mock('@/lib/prisma', () => ({
  prisma: {
    interviewSession: {
      findFirst: jest.fn(),
    },
    response: {
      create: jest.fn(),
    },
  },
}))

import { POST } from '@/app/api/responses/route'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>
const mockFindFirst = prisma.interviewSession.findFirst as jest.MockedFunction<
  typeof prisma.interviewSession.findFirst
>
const mockCreate = prisma.response.create as jest.MockedFunction<typeof prisma.response.create>

const validBody = {
  sessionId: 'session-1',
  questionText: 'Tell me about yourself',
}

function makeRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/responses', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('POST /api/responses', () => {
  afterEach(() => jest.clearAllMocks())

  it('returns 401 when not authenticated', async () => {
    mockGetServerSession.mockResolvedValue(null)
    const res = await POST(makeRequest(validBody))
    expect(res.status).toBe(401)
  })

  it('returns 400 when sessionId is missing', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 'user-1' } } as never)
    const res = await POST(makeRequest({ questionText: 'Tell me about yourself' }))
    expect(res.status).toBe(400)
  })

  it('returns 400 when questionText is missing', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 'user-1' } } as never)
    const res = await POST(makeRequest({ sessionId: 'session-1' }))
    expect(res.status).toBe(400)
  })

  it('returns 404 when session does not belong to user', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 'user-1' } } as never)
    mockFindFirst.mockResolvedValue(null)
    const res = await POST(makeRequest(validBody))
    expect(res.status).toBe(404)
  })

  it('returns 200 with created response on success', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 'user-1' } } as never)
    mockFindFirst.mockResolvedValue({ id: 'session-1', userId: 'user-1' } as never)
    const fakeResponse = { id: 'resp-1', sessionId: 'session-1', questionText: 'Tell me about yourself' }
    mockCreate.mockResolvedValue(fakeResponse as never)
    const res = await POST(makeRequest(validBody))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.response).toEqual(fakeResponse)
  })
})
