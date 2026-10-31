import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    joinMonth: {
      type: Number,
      default: () => new Date().getMonth() + 1, // 1 to 12
    },
    joinYear: {
      type: Number,
      default: () => new Date().getFullYear(),
    },
    rulesAcknowledged: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export const User = mongoose.model('User', userSchema);
