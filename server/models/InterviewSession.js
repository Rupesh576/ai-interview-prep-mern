import mongoose from 'mongoose';

const interviewSessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      required: [true, 'Job role is required'],
      trim: true
    },
    difficulty: {
      type: String,
      required: [true, 'Difficulty level is required'],
      enum: ['Beginner', 'Intermediate', 'Advanced']
    },
    techStack: {
      type: String,
      trim: true,
      default: ''
    },
    questionsCount: {
      type: Number,
      default: 5
    },
    status: {
      type: String,
      enum: ['in-progress', 'completed'],
      default: 'in-progress'
    },
    overallScore: {
      type: Number,
      min: 0,
      max: 100
    },
    feedbackSummary: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

const InterviewSession = mongoose.model('InterviewSession', interviewSessionSchema);
export default InterviewSession;
