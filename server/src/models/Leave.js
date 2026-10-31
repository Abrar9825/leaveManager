import mongoose from 'mongoose';

const leaveSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    mode: {
      type: String,
      enum: ['single', 'multiple'],
      default: 'single',
    },
    date: {
      type: String,
      required: true,
      trim: true,
    },
    endDate: {
      type: String,
      trim: true,
    },
    displayDate: {
      type: String,
      required: true,
      trim: true,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    days: {
      type: Number,
      required: true,
      min: 0.5,
    },
    dayLabel: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['full', 'half', 'multiple'],
      default: 'full',
    },
    session: {
      type: String,
      enum: ['morning', 'afternoon', 'Morning', 'Afternoon', null],
      default: null,
    },
    status: {
      type: String,
      enum: ['Approved', 'Pending', 'Rejected'],
      default: 'Approved',
    },
    year: {
      type: Number,
      required: true,
      default: () => new Date().getFullYear(),
    },
    // Weekend / Saturday Policy Rule fields
    saturdayRule: {
      touchesWeekend: {
        type: Boolean,
        default: false,
      },
      touchesFriday: {
        type: Boolean,
        default: false,
      },
      touchesMonday: {
        type: Boolean,
        default: false,
      },
      isSaturdayHoliday: {
        type: Boolean,
        default: null,
      },
      saturdayAttendance: {
        type: String,
        enum: ['working', 'not_working', 'not_applicable'],
        default: 'not_applicable',
      },
      saturdayNote: {
        type: String,
        default: '',
      },
      ruleConfirmed: {
        type: Boolean,
        default: false,
      },
    },
    timestamp: {
      type: String,
      default: () => new Date().toISOString(),
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

export const Leave = mongoose.model('Leave', leaveSchema);

