import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema(
  {
    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'InterviewSession',
      required: true
    },
    questionText: {
      type: String,
      required: true
    },
    userAnswer: {
      type: String,
      default: ''
    },
    feedback: {
      type: String,
      default: ''
    },
    score: {
      type: Number,
      min: 0,
      max: 10
    },
    suggestedAnswer: {
      type: String,
      default: ''
    },
    order: {
      type: Number,
      required: true
    }
  },
  {
    timestamps: true
  }
);

const Question = mongoose.model('Question', questionSchema);
export default Question;
