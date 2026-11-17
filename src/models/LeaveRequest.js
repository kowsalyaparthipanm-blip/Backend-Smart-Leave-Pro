import mongoose from 'mongoose';

const leaveRequestSchema = new mongoose.Schema(
  {
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['casual', 'sick', 'earned', 'emergency'], required: true },
    startDate: { type: String, required: true },
    endDate: { type: String, required: true },
    days: { type: Number, required: true },
    reason: { type: String, required: true, trim: true },
    route: { type: String, enum: ['all', 'tl_only', 'manager_only', 'hr_only'], required: true },
    isEmergency: { type: Boolean, default: false },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    balanceDeducted: { type: Boolean, default: false },
    alertUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

export default mongoose.model('LeaveRequest', leaveRequestSchema);