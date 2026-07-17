import Gemini from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const isApiKeyValid = process.env.GEMINI_API_KEY &&
  process.env.GEMINI_API_KEY.trim() !== '';

let openai = null;
if (isApiKeyValid) {
  openai = new Gemini({
    apiKey: process.env.GEMINI_API_KEY,
    baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/'
  });
}

// Predefined mock questions for offline/fallback mode
const mockQuestionsDb = {
  frontend: [
    "What is the Virtual DOM and how does React use it to render components?",
    "Explain the difference between state and props in React.",
    "How do React hooks (like useEffect) work, and what rules must they follow?",
    "What is prop drilling and how can you avoid it (e.g. Context API, Redux)?",
    "Explain the difference between client-side rendering (CSR) and server-side rendering (SSR).",
    "What are React.memo and useMemo, and when should you use them?",
    "How does CSS-in-JS compare to traditional CSS or Tailwind CSS in modern web development?"
  ],
  backend: [
    "Explain the Node.js event loop and how it handles asynchronous operations.",
    "What is the difference between SQL and NoSQL databases, and when would you use each?",
    "How does middleware work in Express.js? Provide an example of its usage.",
    "What is REST and what are its key architectural principles?",
    "How do you handle database connections and error propagation in a Node/Express app?",
    "What is the purpose of database indexes, and how do they impact write vs read operations?",
    "Explain JWT authentication, how it is signed, and how it is verified securely."
  ],
  general: [
    "What is the difference between synchronous and asynchronous programming?",
    "Describe the MVC (Model-View-Controller) architecture pattern.",
    "What is git rebase vs. git merge, and when should you use each?",
    "Explain the difference between authentication and authorization.",
    "What are the SOLID design principles? Briefly explain any two.",
    "How do you handle secrets and environment configurations securely in a MERN project?",
    "What are WebSockets and how do they differ from HTTP polling?"
  ],
  behavioral: [
    "Tell me about a time you had to debug a critical production issue under tight deadlines. How did you approach it and what was the outcome?",
    "Describe a situation where you had to collaborate with a difficult team member on a technical project. What steps did you take?",
    "Give an example of a time you had to learn a new technology or framework very quickly. How did you manage the ramp-up?",
    "Tell me about a project you're most proud of. What was your specific role, what challenges did you face, and what were the results?",
    "Describe a time you made a significant technical decision with incomplete information. What was your reasoning and the outcome?",
    "Tell me about a time you disagreed with a technical direction your team or manager chose. How did you handle that disagreement?",
    "Give an example of delivering a project under extreme time pressure. What trade-offs did you make and why?",
    "Describe a situation where you had to give constructive feedback to a peer about their code or technical approach.",
    "Tell me about a time you proactively identified and fixed a significant performance or security issue before it became a problem.",
    "Give an example of when you had to balance paying down technical debt against delivering new product features. How did you decide?"
  ],
  systemDesign: [
    "Design a URL shortening service like bit.ly. Walk me through your full architecture including storage, hashing strategy, and how you'd handle scale.",
    "How would you design a real-time notification system for a social media platform with 10 million daily active users?",
    "Design a rate limiter for a high-traffic REST API. Which algorithm would you use and how would you store state in a distributed environment?",
    "How would you architect a real-time collaborative document editor like Google Docs? Discuss conflict resolution and consistency strategies.",
    "Design a content delivery network (CDN). Explain the key components, caching hierarchy, and how you'd handle cache invalidation.",
    "How would you design a distributed job scheduling system that reliably handles millions of background tasks with retry logic and prioritization?",
    "Design a search autocomplete system. How would you handle ranking, personalization, and sub-100ms latency at scale?",
    "How would you design a distributed logging and observability system for a large microservices architecture?",
    "Design a system to detect near-duplicate images at scale given millions of uploads per day. What hashing or ML techniques would you use?",
    "How would you design a ride-sharing backend similar to Uber? Discuss driver matching, geolocation indexing, and surge pricing components."
  ]
};

// Generate high quality mock questions
const generateMockQuestions = (role, difficulty, techStack, count, questionType = 'Technical') => {
  if (questionType === 'Behavioral') {
    const shuffled = [...mockQuestionsDb.behavioral].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  if (questionType === 'System Design') {
    const shuffled = [...mockQuestionsDb.systemDesign].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  const normalizedRole = role.toLowerCase();
  const normalizedStack = (techStack || '').toLowerCase();

  let technicalPool = [];
  if (normalizedRole.includes('front') || normalizedRole.includes('react') || normalizedStack.includes('react')) {
    technicalPool = [...mockQuestionsDb.frontend, ...mockQuestionsDb.general];
  } else if (normalizedRole.includes('back') || normalizedRole.includes('node') || normalizedStack.includes('node') || normalizedStack.includes('express')) {
    technicalPool = [...mockQuestionsDb.backend, ...mockQuestionsDb.general];
  } else {
    technicalPool = [...mockQuestionsDb.general, ...mockQuestionsDb.frontend, ...mockQuestionsDb.backend];
  }

  if (questionType === 'Mixed') {
    const techHalf = Math.ceil(count / 2);
    const behHalf = Math.floor(count / 2);
    const shuffledTech = [...technicalPool].sort(() => 0.5 - Math.random()).slice(0, techHalf);
    const shuffledBeh = [...mockQuestionsDb.behavioral].sort(() => 0.5 - Math.random()).slice(0, behHalf);
    // Interleave technical and behavioral
    const mixed = [];
    for (let i = 0; i < Math.max(shuffledTech.length, shuffledBeh.length); i++) {
      if (shuffledTech[i]) mixed.push(shuffledTech[i]);
      if (shuffledBeh[i]) mixed.push(shuffledBeh[i]);
    }
    return mixed.slice(0, count);
  }

  // Technical (default)
  const shuffled = technicalPool.sort(() => 0.5 - Math.random());
  const selected = shuffled.slice(0, count);

  while (selected.length < count) {
    const num = selected.length + 1;
    selected.push(`Can you explain a major design pattern or architectural decision you've made when working as a ${role} using ${techStack || 'modern web tech'}? (Question ${num})`);
  }

  return selected;
};

// Generate high quality mock evaluations
const generateMockEvaluations = (role, difficulty, techStack, qaList) => {
  let totalScore = 0;
  const evaluations = qaList.map((qa) => {
    const ans = (qa.userAnswer || '').trim();
    let score = 0;
    let feedback = '';
    let suggestedAnswer = '';

    // Generate suggested answers and feedback based on typical mock questions
    if (qa.questionText.includes('Virtual DOM')) {
      suggestedAnswer = "The Virtual DOM is a lightweight, in-memory representation of the real DOM. When state changes, React creates a new virtual DOM tree, compares it with the previous one (diffing), and calculates the most efficient way to update the real DOM (reconciliation). This minimizes expensive direct DOM manipulations.";
    } else if (qa.questionText.includes('state and props')) {
      suggestedAnswer = "State represents the local, mutable data managed within a component itself, which can change over time. Props (properties) are read-only inputs passed from a parent component to a child component to configure it. Props are immutable from the child's perspective.";
    } else if (qa.questionText.includes('event loop')) {
      suggestedAnswer = "The Node.js event loop allows Node to perform non-blocking I/O operations despite JavaScript being single-threaded. It delegates operations to the operating system or system kernel whenever possible, and processes completion callbacks in various phases (timers, pending callbacks, poll, check, close callbacks).";
    } else if (qa.questionText.includes('SQL and NoSQL')) {
      suggestedAnswer = "SQL databases are relational, table-based, have a predefined schema, and scale vertically (ideal for complex queries and ACID transactions). NoSQL databases are non-relational, document or key-value based, have dynamic schemas, and scale horizontally (ideal for unstructured data and high-throughput write/read speeds).";
    } else {
      suggestedAnswer = `For a ${difficulty} level ${role} position, an ideal answer would explain the core definitions, discuss practical tradeoffs, and highlight architectural best practices associated with: "${qa.questionText}".`;
    }

    if (!ans) {
      score = 0;
      feedback = "No answer was provided for this question. It is important to try and provide even a partial answer to demonstrate your thought process and problem-solving approach during interviews.";
    } else if (ans.length < 15) {
      score = 3;
      feedback = "Your answer is extremely brief and lacks depth. To perform well at a " + difficulty + " level, you should elaborate more, provide concrete technical details, and ideally mention a real-world project example where you applied this concept.";
    } else if (ans.length < 60) {
      score = 6;
      feedback = "Good direct answer, but it's a bit surface-level. Consider explaining *why* it works that way, any potential drawbacks or trade-offs, and comparing it with alternative approaches to show a deeper understanding.";
    } else {
      score = Math.floor(Math.random() * 3) + 8; // 8, 9, or 10
      feedback = "Excellent response! You've captured the core principles perfectly, demonstrated clear technical understanding, and explained the concepts thoroughly. To make this flawless, you could briefly touch upon how you structure or test this behavior in team environments.";
    }

    totalScore += score;
    return {
      questionText: qa.questionText,
      userAnswer: ans,
      score,
      feedback,
      suggestedAnswer
    };
  });

  const rawAverage = totalScore / qaList.length;
  // Convert average (0-10) to percentage (0-100)
  const overallScore = Math.round(rawAverage * 10);

  let feedbackSummary = '';
  if (overallScore >= 80) {
    feedbackSummary = `Fantastic performance! You demonstrated strong technical proficiency for an ${difficulty}-level ${role} position. Your answers are clear, well-structured, and technically accurate. To excel further, continue practicing high-level system design and architecture patterns.`;
  } else if (overallScore >= 60) {
    feedbackSummary = `Good attempt. You have a solid grasp of the basics for a ${difficulty}-level ${role} role, but some technical details were missing or superficial. Focus on expanding your explanations, using precise terminology, and researching suggested model answers.`;
  } else {
    feedbackSummary = `This session shows opportunities for growth. Several questions were either unanswered or lacked details required for a ${difficulty}-level ${role} position. We recommend reviewing key concepts in your focus areas (${techStack || 'general topics'}) and reviewing the suggested model answers.`;
  }

  return {
    overallScore,
    feedbackSummary,
    evaluations
  };
};

// Keyword-based mock hints for offline/fallback mode
const generateMockHint = (questionText) => {
  const text = questionText.toLowerCase();
  if (text.includes('virtual dom')) {
    return "Think about why directly manipulating the real DOM is expensive. React keeps a lightweight copy of the DOM in memory — consider how it compares two versions of this copy to decide the minimum set of real changes needed.";
  }
  if (text.includes('state') && text.includes('props')) {
    return "Consider who owns and controls each piece of data. One flows down from a parent and is read-only from the child's perspective; the other is managed locally within the component and can change over time.";
  }
  if (text.includes('usememo') || text.includes('react.memo') || text.includes('memo')) {
    return "Think about when re-renders are unnecessary. Both tools help React skip expensive work it already did — one wraps a component, the other caches a computed value. Focus on the difference in *what* they memoize.";
  }
  if (text.includes('useeffect') || text.includes('hooks') || text.includes('hook')) {
    return "Consider the three things you can control with this hook: what runs (the function), when it runs (the dependency array), and how to clean up after it. Think about what happens when dependencies change vs. an empty array vs. no array.";
  }
  if (text.includes('event loop')) {
    return "Node.js is single-threaded but non-blocking. Think about how it can start a file read and then immediately move on to other work — there must be a mechanism that checks for completed I/O callbacks and runs them. What are the phases of that mechanism?";
  }
  if (text.includes('sql') || text.includes('nosql')) {
    return "Consider the trade-offs around schema strictness, relationships, and scaling. Think about ACID compliance, whether your data is structured or unstructured, and whether you need to scale reads/writes horizontally.";
  }
  if (text.includes('middleware')) {
    return "Think of middleware as a pipeline. Each function in Express receives the request and response objects plus a 'next' callback. What happens if you call next()? What happens if you don't? Consider error-handling middleware as a special case.";
  }
  if (text.includes('jwt') || text.includes('authentication') || text.includes('auth')) {
    return "Break this into three parts: how the token is created (signing), how it travels (typically in headers), and how the server validates it without a database lookup. Think about what information is stored inside the token and why that matters.";
  }
  if (text.includes('rest') || text.includes('api')) {
    return "REST is defined by constraints, not a standard. Focus on statelessness, uniform interface (HTTP verbs + resource nouns), and client-server separation. Think about what makes a URL 'RESTful' and how HTTP status codes map to outcomes.";
  }
  if (text.includes('context') || text.includes('redux') || text.includes('prop drill')) {
    return "Prop drilling becomes a problem when data needs to pass through many intermediate components that don't use it. Think about what tool gives you a global store vs. a scoped provider, and what the trade-off is between simplicity and scalability.";
  }
  if (text.includes('solid') || text.includes('design pattern') || text.includes('architecture')) {
    return "Start by naming the principle or pattern, then give its core rule in one sentence, and finally a concrete code-level example. Real-world examples (even small ones) are more convincing than abstract definitions alone.";
  }
  return "Start by defining the core concept clearly in 1–2 sentences. Then explain *why* it exists — what problem it solves. Finally, mention any trade-offs, edge cases, or alternatives you know. Concrete examples always strengthen a technical answer.";
};

/**
 * Generates a directional hint for a single interview question without revealing the full answer.
 */
export const generateHint = async (role, difficulty, questionText) => {
  if (!openai) {
    console.log("OpenAI API Key is missing or default. Generating mock hint...");
    return generateMockHint(questionText);
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a helpful interview coach. When given an interview question, provide a brief, directional hint (2-3 sentences maximum) that helps the candidate think in the right direction without giving away the complete answer. The hint should point to the key concept, prompt them to consider a trade-off, or suggest an angle of approach — but must not solve the question for them.`
        },
        {
          role: "user",
          content: `Give me a hint for this ${difficulty} level ${role} interview question: "${questionText}"`
        }
      ]
    });
    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error("OpenAI Hint Generation Error:", error.message);
    console.log("Falling back to mock hint...");
    return generateMockHint(questionText);
  }
};

/**
 * Generates interview questions based on role, difficulty, tech stack, count, and question type.
 */
export const generateQuestions = async (role, difficulty, techStack, questionsCount = 5, questionType = 'Technical') => {
  if (!openai) {
    console.log("Gemini API Key is missing or default. Generating mock questions...");
    return generateMockQuestions(role, difficulty, techStack, questionsCount, questionType);
  }

  let questionTypeInstruction = '';
  if (questionType === 'Behavioral') {
    questionTypeInstruction = 'All questions must be behavioral/situational, asking about past experiences, challenges, and outcomes (STAR format). Do NOT include technical or coding questions.';
  } else if (questionType === 'System Design') {
    questionTypeInstruction = 'All questions must be system design questions asking the candidate to architect, design, and reason about scalable systems or components. Do NOT include basic coding or behavioral questions.';
  } else if (questionType === 'Mixed') {
    questionTypeInstruction = `Generate a balanced mix: approximately half technical questions about ${techStack || 'software engineering'} and half behavioral/situational questions about past experience and teamwork.`;
  } else {
    questionTypeInstruction = `All questions must be technical, testing knowledge of code, architecture, and implementation related to: ${techStack || 'general software engineering concepts'}.`;
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gemini-2.5-flash",
      messages: [
        {
          role: "system",
          content: `You are an expert technical interviewer. Generate a list of standard interview questions for a candidate.
You must return your output strictly in JSON format.
The JSON must contain a single key "questions" which is an array of strings representing the questions.
Do not include any other text, markdown formatting (outside of standard JSON syntax), or explanations.`
        },
        {
          role: "user",
          content: `Generate exactly ${questionsCount} interview questions for a ${difficulty} level ${role} position.
${questionTypeInstruction}`
        }
      ]
    });

    const result = JSON.parse(response.choices[0].message.content);
    if (result && Array.isArray(result.questions)) {
      return result.questions.slice(0, questionsCount);
    }
    throw new Error("Invalid format returned by Gemini");
  } catch (error) {
    console.error("Gemini Question Generation Error:", error.message);
    console.log("Falling back to mock questions...");
    return generateMockQuestions(role, difficulty, techStack, questionsCount, questionType);
  }
};

/**
 * Evaluates candidate responses to questions.
 * @param {string} role 
 * @param {string} difficulty 
 * @param {string} techStack 
 * @param {Array<{questionText: string, userAnswer: string}>} questionsAndAnswers 
 */
export const evaluateAnswers = async (role, difficulty, techStack, questionsAndAnswers) => {
  if (!openai) {
    console.log("Gemini API Key is missing or default. Generating mock evaluations...");
    return generateMockEvaluations(role, difficulty, techStack, questionsAndAnswers);
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gemini-2.5-flash",
      messages: [
        {
          role: "system",
          content: `You are an expert technical interviewer. Evaluate the candidate's answers to the interview questions.
For each question, assign a score from 0 to 10 (integer), write detailed constructive feedback (what was good, what was missing, how to improve), and provide a suggested/model answer.
Also calculate an overall score from 0 to 100, and write an overall feedback summary.
You must return your output strictly in JSON format.
The JSON structure must be:
{
  "overallScore": 85,
  "feedbackSummary": "Overall summary...",
  "evaluations": [
    {
      "questionText": "Question 1...",
      "userAnswer": "Answer 1...",
      "score": 8,
      "feedback": "Feedback for question 1...",
      "suggestedAnswer": "Suggested answer for question 1..."
    },
    ...
  ]
}`
        },
        {
          role: "user",
          content: `Evaluate this ${difficulty} level ${role} interview.
Focus area: ${techStack || 'general software engineering'}.
Here are the questions and user's answers:
${questionsAndAnswers.map((qa, index) => `
Question ${index + 1}: ${qa.questionText}
User's Answer: ${qa.userAnswer || 'No answer provided.'}
`).join('\n')}`
        }
      ]
    });

    const result = JSON.parse(response.choices[0].message.content);
    if (result && typeof result.overallScore === 'number' && Array.isArray(result.evaluations)) {
      return result;
    }
    throw new Error("Invalid feedback format returned by Gemini");
  } catch (error) {
    console.error("Gemini Evaluation Error:", error.message);
    console.log("Falling back to mock evaluations...");
    return generateMockEvaluations(role, difficulty, techStack, questionsAndAnswers);
  }
};
