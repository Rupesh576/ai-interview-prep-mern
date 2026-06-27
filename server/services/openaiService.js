import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const isApiKeyValid = process.env.OPENAI_API_KEY && 
  process.env.OPENAI_API_KEY !== 'your_api_key_here' && 
  process.env.OPENAI_API_KEY.trim() !== '';

let openai = null;
if (isApiKeyValid) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
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
  ]
};

// Generate high quality mock questions
const generateMockQuestions = (role, difficulty, techStack, count) => {
  const normalizedRole = role.toLowerCase();
  const normalizedStack = (techStack || '').toLowerCase();
  
  let pool = [];
  if (normalizedRole.includes('front') || normalizedRole.includes('react') || normalizedStack.includes('react')) {
    pool = [...mockQuestionsDb.frontend, ...mockQuestionsDb.general];
  } else if (normalizedRole.includes('back') || normalizedRole.includes('node') || normalizedStack.includes('node') || normalizedStack.includes('express')) {
    pool = [...mockQuestionsDb.backend, ...mockQuestionsDb.general];
  } else {
    pool = [...mockQuestionsDb.general, ...mockQuestionsDb.frontend, ...mockQuestionsDb.backend];
  }

  // Shuffle pool
  const shuffled = pool.sort(() => 0.5 - Math.random());
  const selected = shuffled.slice(0, count);

  // If we need more than pool size or need custom topic
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

/**
 * Generates interview questions based on role, difficulty, tech stack, and count.
 */
export const generateQuestions = async (role, difficulty, techStack, questionsCount = 5) => {
  if (!openai) {
    console.log("OpenAI API Key is missing or default. Generating mock questions...");
    return generateMockQuestions(role, difficulty, techStack, questionsCount);
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
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
The questions should focus on the following tech stack / topics: ${techStack || 'general software engineering concepts'}.`
        }
      ],
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(response.choices[0].message.content);
    if (result && Array.isArray(result.questions)) {
      return result.questions.slice(0, questionsCount);
    }
    throw new Error("Invalid format returned by OpenAI");
  } catch (error) {
    console.error("OpenAI Question Generation Error:", error.message);
    console.log("Falling back to mock questions...");
    return generateMockQuestions(role, difficulty, techStack, questionsCount);
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
    console.log("OpenAI API Key is missing or default. Generating mock evaluations...");
    return generateMockEvaluations(role, difficulty, techStack, questionsAndAnswers);
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
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
      ],
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(response.choices[0].message.content);
    if (result && typeof result.overallScore === 'number' && Array.isArray(result.evaluations)) {
      return result;
    }
    throw new Error("Invalid feedback format returned by OpenAI");
  } catch (error) {
    console.error("OpenAI Evaluation Error:", error.message);
    console.log("Falling back to mock evaluations...");
    return generateMockEvaluations(role, difficulty, techStack, questionsAndAnswers);
  }
};
