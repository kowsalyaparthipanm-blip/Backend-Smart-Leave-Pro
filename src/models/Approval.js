import mongoose from 'mongoose';

const approvalSchema = new mongoose.Schema(
  {
    leave: { type: mongoose.Schema.Types.ObjectId, ref: 'LeaveRequest', required: true },
    approver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: ['team_leader', 'manager', 'hr'], required: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected', 'skipped'], default: 'pending' },
    comment: { type: String, default: '' },
    actedAt: { type: Date, default: null },
    order: { type: Number, default: 1 },
  },
  { timestamps: true }
);

export default mongoose.model('Approval', approvalSchema);