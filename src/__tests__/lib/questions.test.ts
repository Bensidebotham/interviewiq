import { getQuestionsForSession } from '@/lib/questions'

describe('getQuestionsForSession', () => {
  it('returns only behavioral and situational questions for behavioral session type', () => {
    const questions = getQuestionsForSession('behavioral', undefined, 20)
    questions.forEach((q) => {
      expect(['behavioral', 'situational']).toContain(q.category)
    })
  })

  it('returns only technical questions for technical session type', () => {
    const questions = getQuestionsForSession('technical', undefined, 20)
    questions.forEach((q) => {
      expect(q.category).toBe('technical')
    })
  })

  it('can return questions from multiple categories for company-specific session type', () => {
    const seen = new Set<string>()
    for (let i = 0; i < 100; i++) {
      getQuestionsForSession('company-specific', undefined, 20).forEach((q) =>
        seen.add(q.category)
      )
    }
    expect(seen.size).toBeGreaterThan(1)
  })

  it('applies industry filter when enough matching questions exist', () => {
    // 'tech' industry matches all behavioral questions — count(11) >= 3
    const questions = getQuestionsForSession('behavioral', 'tech', 3)
    questions.forEach((q) => {
      expect(q.industries).toContain('tech')
    })
  })

  it('falls back to full filtered set when fewer than count industry matches exist', () => {
    // No technical questions have 'finance' industry → 0 < 3 → falls back to all technical
    const questions = getQuestionsForSession('technical', 'finance', 3)
    expect(questions.length).toBe(3)
    questions.forEach((q) => {
      expect(q.category).toBe('technical')
    })
  })

  it('never returns more questions than count', () => {
    const questions = getQuestionsForSession('behavioral', undefined, 3)
    expect(questions.length).toBeLessThanOrEqual(3)
  })
})
