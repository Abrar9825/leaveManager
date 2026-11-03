import mongoose from 'mongoose';

const dailyTaskSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    date: {
      type: String, // YYYY-MM-DD
      required: true,
      index: true,
    },
    srNo: {
      type: Number,
      required: true,
      default: 1,
    },
    branch: {
      type: String,
      trim: true,
      default: '',
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['in_progress', 'completed'],
      default: 'in_progress',
    },
    year: {
      type: Number,
      index: true,
    },
    month: {
      type: Number,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id.toString();
        return ret;
      },
    },
  }
);

// Compound index for efficient date-ordered querying per user
dailyTaskSchema.index({ date: 1, srNo: 1 });

export const DailyTask = mongoose.model('DailyTask', dailyTaskSchema);

