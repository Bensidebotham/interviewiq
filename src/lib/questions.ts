export type Question = {
  id: string
  text: string
  category: "behavioral" | "technical" | "situational"
  subcategory: string
  difficulty: "entry" | "mid" | "senior" | "all"
  industries: string[]
  tips: string
}

export const questionBank: Question[] = [
  {
    id: "b1",
    text: "Tell me about a time you led a project from start to finish. What was your approach and what was the outcome?",
    category: "behavioral",
    subcategory: "leadership",
    difficulty: "all",
    industries: ["tech", "finance", "consulting", "general"],
    tips: "Quantify the outcome — how many people, what timeline, what measurable result?",
  },
  {
    id: "b2",
    text: "Describe a situation where you had a conflict with a teammate. How did you handle it?",
    category: "behavioral",
    subcategory: "conflict",
    difficulty: "all",
    industries: ["tech", "finance", "consulting", "general"],
    tips: "Focus on your actions, not blaming the other person. Show maturity and resolution.",
  },
  {
    id: "b3",
    text: "Tell me about a time you had to learn a new technology or skill quickly under pressure.",
    category: "behavioral",
    subcategory: "adaptability",
    difficulty: "all",
    industries: ["tech", "general"],
    tips: "Show initiative and self-directed learning. Mention specific resources and the outcome.",
  },
  {
    id: "b4",
    text: "Give me an example of a project where you failed or things didn't go as planned. What happened and what did you do?",
    category: "behavioral",
    subcategory: "failure",
    difficulty: "all",
    industries: ["tech", "finance", "consulting", "general"],
    tips: "Be honest about the failure. The key is your response and what you learned.",
  },
  {
    id: "b5",
    text: "Tell me about a time you delivered results with incomplete information or under significant ambiguity.",
    category: "behavioral",
    subcategory: "ambiguity",
    difficulty: "mid",
    industries: ["tech", "consulting", "general"],
    tips: "Show your decision-making process. Recruiters want to see you can move forward without perfect clarity.",
  },
  {
    id: "b6",
    text: "Describe a time you had to convince a manager, client, or peer to adopt your approach.",
    category: "behavioral",
    subcategory: "influence",
    difficulty: "all",
    industries: ["tech", "finance", "consulting", "general"],
    tips: "Show how you built your case with data or logic, not just enthusiasm.",
  },
  {
    id: "b7",
    text: "Tell me about the most complex technical problem you've solved. Walk me through how you approached it.",
    category: "behavioral",
    subcategory: "problem-solving",
    difficulty: "mid",
    industries: ["tech"],
    tips: "Show your debugging or systems thinking process, not just the solution.",
  },
  {
    id: "b8",
    text: "Give an example of a time you improved a process or system that was already working. Why and what was the result?",
    category: "behavioral",
    subcategory: "initiative",
    difficulty: "all",
    industries: ["tech", "finance", "consulting", "general"],
    tips: "Quantify the improvement if possible — time saved, errors reduced, revenue impact.",
  },
  {
    id: "s1",
    text: "You're halfway through a project and realize the initial approach won't work. The deadline is in two weeks. What do you do?",
    category: "situational",
    subcategory: "problem-solving",
    difficulty: "all",
    industries: ["tech", "general"],
    tips: "Show structured thinking: assess, communicate early, propose alternatives, prioritize.",
  },
  {
    id: "s2",
    text: "You disagree with a technical decision your manager just made. How do you handle it?",
    category: "situational",
    subcategory: "conflict",
    difficulty: "mid",
    industries: ["tech"],
    tips: "Balance showing your voice vs. respecting hierarchy. Raise it once clearly, then commit.",
  },
  {
    id: "s3",
    text: "You have three high-priority tasks due at the same time and can only complete two. What do you do?",
    category: "situational",
    subcategory: "prioritization",
    difficulty: "all",
    industries: ["tech", "finance", "consulting", "general"],
    tips: "Show you communicate proactively — don't silently drop things.",
  },
  {
    id: "t1",
    text: "Walk me through how you would design a URL shortener like bit.ly at scale.",
    category: "technical",
    subcategory: "system-design",
    difficulty: "mid",
    industries: ["tech"],
    tips: "Cover: hashing approach, database schema, scaling reads vs writes, caching layer.",
  },
  {
    id: "t2",
    text: "Explain the difference between SQL and NoSQL databases and when you'd choose each.",
    category: "technical",
    subcategory: "databases",
    difficulty: "entry",
    industries: ["tech"],
    tips: "Go beyond surface level — mention ACID properties, eventual consistency, specific use cases.",
  },
  {
    id: "t3",
    text: "What happens when you type a URL in your browser and press Enter? Walk through every step.",
    category: "technical",
    subcategory: "networking",
    difficulty: "entry",
    industries: ["tech"],
    tips: "Cover DNS, TCP handshake, HTTP request, server processing, rendering. Depth matters.",
  },
  {
    id: "t4",
    text: "How would you approach optimizing a slow database query? Walk me through your process.",
    category: "technical",
    subcategory: "performance",
    difficulty: "mid",
    industries: ["tech"],
    tips: "Mention: EXPLAIN/EXPLAIN ANALYZE, indexing strategy, N+1 queries, caching.",
  },
]

export function getQuestionsForSession(
  sessionType: string,
  industry?: string,
  count: number = 5
): Question[] {
  let filtered = questionBank

  if (sessionType === "behavioral") {
    filtered = filtered.filter((q) => q.category === "behavioral" || q.category === "situational")
  } else if (sessionType === "technical") {
    filtered = filtered.filter((q) => q.category === "technical")
  }

  if (industry && industry !== "general") {
    const industryFiltered = filtered.filter((q) => q.industries.includes(industry))
    if (industryFiltered.length >= count) filtered = industryFiltered
  }

  return [...filtered].sort(() => Math.random() - 0.5).slice(0, count)
}
