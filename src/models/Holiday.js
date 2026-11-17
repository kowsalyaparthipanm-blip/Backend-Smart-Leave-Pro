import mongoose from 'mongoose';

const holidaySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    date: { type: String, required: true, unique: true }, // 'YYYY-MM-DD'
  },
  { timestamps: true }
);

export default mongoose.model('Holiday', holidaySchema);