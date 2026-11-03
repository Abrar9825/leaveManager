import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    date: {
      type: String,
      required: true, // Format: 'YYYY-MM-DD'
      index: true,
    },
    punchTime: {
      type: String,
      required: true, // e.g. '10:15 AM'
    },
    rawTime: {
      type: String,
      required: true, // 24h format 'HH:mm' for calculations
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    isLate: {
      type: Boolean,
      default: false,
      index: true,
    },
    minutesLate: {
      type: Number,
      default: 0,
    },
    method: {
      type: String,
      enum: ['long_press', 'manual'],
      default: 'long_press',
    },
    notes: {
      type: String,
      default: '',
    },
    year: {
      type: Number,
      required: true,
      index: true,
    },
    month: {
      type: Number,
      required: true, // 1 to 12
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

// One check-in per day per user (or globally if single-user mode)
attendanceSchema.index({ date: 1, userId: 1 });

export const Attendance = mongoose.model('Attendance', attendanceSchema);

