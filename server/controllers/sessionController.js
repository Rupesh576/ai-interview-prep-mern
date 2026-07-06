import InterviewSession from '../models/InterviewSession.js';
import Question from '../models/Question.js';
import { generateQuestions, evaluateAnswers, generateHint } from '../services/openaiService.js';

// @desc    Create a new interview session and generate questions
// @route   POST /api/sessions
// @access  Private
export const createSession = async (req, res, next) => {
  try {
    const { role, difficulty, techStack, questionsCount } = req.body;

    if (!role || !difficulty) {
      res.status(400);
      throw new Error('Please provide job role and difficulty level');
    }

    const count = parseInt(questionsCount, 10) || 5;

    // Create session entry first
    const session = await InterviewSession.create({
      user: req.user._id,
      role,
      difficulty,
      techStack: techStack || '',
      questionsCount: count,
      status: 'in-progress'
    });

    // Generate questions using AI / Mock service
    const questionTexts = await generateQuestions(role, difficulty, techStack, count);

    // Save questions in DB
    const questionDocs = questionTexts.map((text, index) => ({
      session: session._id,
      questionText: text,
      userAnswer: '',
      feedback: '',
      suggestedAnswer: '',
      order: index + 1
    }));

    const savedQuestions = await Question.insertMany(questionDocs);

    res.status(201).json({
      success: true,
      session,
      questions: savedQuestions
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all interview sessions for the logged-in user
// @route   GET /api/sessions
// @access  Private
export const getSessions = async (req, res, next) => {
  try {
    const sessions = await InterviewSession.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      sessions
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get session details by ID (including questions)
// @route   GET /api/sessions/:id
// @access  Private
export const getSessionById = async (req, res, next) => {
  try {
    const session = await InterviewSession.findById(req.params.id);

    if (!session) {
      res.status(404);
      throw new Error('Interview session not found');
    }

    // Verify ownership
    if (session.user.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Not authorized to access this session');
    }

    const questions = await Question.find({ session: session._id }).sort({ order: 1 });

    res.status(200).json({
      success: true,
      session,
      questions
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Save progress/answers for an interview session
// @route   PUT /api/sessions/:id/answers
// @access  Private
export const saveAnswers = async (req, res, next) => {
  try {
    const { answers } = req.body; // Array of { questionId, userAnswer }

    if (!answers || !Array.isArray(answers)) {
      res.status(400);
      throw new Error('Please provide an array of answers');
    }

    const session = await InterviewSession.findById(req.params.id);

    if (!session) {
      res.status(404);
      throw new Error('Interview session not found');
    }

    // Verify ownership
    if (session.user.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Not authorized to access this session');
    }

    if (session.status === 'completed') {
      res.status(400);
      throw new Error('Cannot update answers. This session is already completed and evaluated');
    }

    // Update answers in bulk or one by one
    const updatePromises = answers.map((ans) =>
      Question.updateOne(
        { _id: ans.questionId, session: session._id },
        { $set: { userAnswer: ans.userAnswer } }
      )
    );

    await Promise.all(updatePromises);

    const updatedQuestions = await Question.find({ session: session._id }).sort({ order: 1 });

    res.status(200).json({
      success: true,
      message: 'Answers saved successfully',
      questions: updatedQuestions
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Submit an interview session for AI evaluation
// @route   POST /api/sessions/:id/submit
// @access  Private
export const submitSession = async (req, res, next) => {
  try {
    const session = await InterviewSession.findById(req.params.id);

    if (!session) {
      res.status(404);
      throw new Error('Interview session not found');
    }

    // Verify ownership
    if (session.user.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Not authorized to access this session');
    }

    if (session.status === 'completed') {
      res.status(400);
      throw new Error('This session is already completed and evaluated');
    }

    // Fetch existing questions and answers
    const questions = await Question.find({ session: session._id }).sort({ order: 1 });

    // Call evaluateAnswers service
    const evaluationResult = await evaluateAnswers(
      session.role,
      session.difficulty,
      session.techStack,
      questions
    );

    // Save individual question feedback
    const updatePromises = questions.map((q) => {
      // Find matching evaluation inside evaluationResult.evaluations
      const evalItem = evaluationResult.evaluations.find(
        (ev) => ev.questionText === q.questionText
      );

      if (evalItem) {
        return Question.updateOne(
          { _id: q._id },
          {
            $set: {
              feedback: evalItem.feedback || '',
              score: typeof evalItem.score === 'number' ? evalItem.score : 0,
              suggestedAnswer: evalItem.suggestedAnswer || ''
            }
          }
        );
      }
      return Promise.resolve();
    });

    await Promise.all(updatePromises);

    // Update parent InterviewSession with scores & status
    session.status = 'completed';
    session.overallScore = evaluationResult.overallScore;
    session.feedbackSummary = evaluationResult.feedbackSummary;
    await session.save();

    const finalizedQuestions = await Question.find({ session: session._id }).sort({ order: 1 });

    res.status(200).json({
      success: true,
      session,
      questions: finalizedQuestions
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get an AI-generated hint for a specific question in a session
// @route   POST /api/sessions/:id/hint
// @access  Private
export const getQuestionHint = async (req, res, next) => {
  try {
    const { questionId } = req.body;

    if (!questionId) {
      res.status(400);
      throw new Error('Please provide a questionId');
    }

    const session = await InterviewSession.findById(req.params.id);

    if (!session) {
      res.status(404);
      throw new Error('Interview session not found');
    }

    if (session.user.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Not authorized to access this session');
    }

    const question = await Question.findOne({ _id: questionId, session: session._id });

    if (!question) {
      res.status(404);
      throw new Error('Question not found in this session');
    }

    const hint = await generateHint(session.role, session.difficulty, question.questionText);

    res.status(200).json({ success: true, hint });
  } catch (error) {
    next(error);
  }
};
