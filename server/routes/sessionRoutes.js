import express from 'express';
import {
  createSession,
  getSessions,
  getSessionById,
  saveAnswers,
  submitSession,
  getQuestionHint
} from '../controllers/sessionController.js';
import protect from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply protect middleware to all session routes
router.use(protect);

router.route('/')
  .post(createSession)
  .get(getSessions);

router.route('/:id')
  .get(getSessionById);

router.route('/:id/answers')
  .put(saveAnswers);

router.route('/:id/submit')
  .post(submitSession);

router.route('/:id/hint')
  .post(getQuestionHint);

export default router;
