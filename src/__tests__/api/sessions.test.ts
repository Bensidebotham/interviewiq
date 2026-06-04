import { NextRequest } from 'next/server'

jest.mock('next-auth', () => ({ getServerSession: jest.fn() }))
jest.mock('@/lib/auth', () => ({ authOptions: {} }))
jest.mock('@/lib/prisma', () => ({
  prisma: {
    interviewSession: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  },
}))

import { POST } from '@/app/api/sessions/route'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>
const mockCreate = prisma.interviewSession.create as jest.MockedFunction<
  typeof prisma.interviewSession.create
>

function makeRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/sessions', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('POST /api/sessions', () => {
  afterEach(() => jest.clearAllMocks())

  it('returns 401 when not authenticated', async () => {
    mockGetServerSession.mockResolvedValue(null)
    const res = await POST(makeRequest({ sessionType: 'behavioral' }))
    expect(res.status).toBe(401)
  })

  it('returns 400 when sessionType is missing', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 'user-1' } } as never)
    const res = await POST(makeRequest({}))
    expect(res.status).toBe(400)
  })

  it('returns 400 when sessionType is an invalid enum value', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 'user-1' } } as never)
    const res = await POST(makeRequest({ sessionType: 'invalid-type' }))
    expect(res.status).toBe(400)
  })

  it('returns 200 with session data when request is valid', async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: 'user-1' } } as never)
    const fakeSession = { id: 'session-1', sessionType: 'behavioral', userId: 'user-1' }
    mockCreate.mockResolvedValue(fakeSession as never)

    const res = await POST(makeRequest({ sessionType: 'behavioral' }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.session).toEqual(fakeSession)
  })
})
