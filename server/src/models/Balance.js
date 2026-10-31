import mongoose from 'mongoose';

const monthlyBreakdownSchema = new mongoose.Schema(
  {
    month: { type: String, required: true },
    current: { type: Boolean, default: false },
    days: { type: Number, default: 0 },
    opening: { type: Number, default: 0 },
    credit: { type: Number, default: 2.0 },
    used: { type: Number, default: 0 },
    status: { type: String, enum: ['normal', 'deficit'], default: 'normal' },
    tag: { type: String },
  },
  { _id: false }
);

const balanceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    year: {
      type: Number,
      required: true,
      unique: true,
    },
    totalQuota: {
      type: Number,
      default: 24.0,
    },
    availableDays: {
      type: Number,
      required: true,
      default: 18.0,
    },
    usedDays: {
      type: Number,
      default: 0,
    },
    monthlyBreakdown: [monthlyBreakdownSchema],
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

export const Balance = mongoose.model('Balance', balanceSchema);

