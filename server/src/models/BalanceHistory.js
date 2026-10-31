import mongoose from 'mongoose';

const balanceHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    year: {
      type: Number,
      required: true,
      default: 2026,
    },
    oldBalance: {
      type: Number,
      required: true,
    },
    newBalance: {
      type: Number,
      required: true,
    },
    change: {
      type: Number,
      required: true,
    },
    changeType: {
      type: String,
      enum: ['manual_reset', 'leave_deduction', 'leave_deletion', 'leave_edit', 'quota_adjustment'],
      default: 'manual_reset',
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    changedBy: {
      type: String,
      default: 'Authorized User',
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

export const BalanceHistory = mongoose.model('BalanceHistory', balanceHistorySchema);

