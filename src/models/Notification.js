import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['emergency', 'approval_request', 'approved', 'rejected', 'info'], default: 'info' },
    title: { type: String, required: true },
    message: { type: String, required: true },
    priority: { type: String, enum: ['normal', 'high'], default: 'normal' },
    leave: { type: mongoose.Schema.Types.ObjectId, ref: 'LeaveRequest', default: null },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model('Notification', notificationSchema);