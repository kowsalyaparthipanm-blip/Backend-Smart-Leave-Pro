import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 5, select: false },
    role: {
      type: String,
      enum: ['employee', 'team_leader', 'manager', 'hr'],
      required: true,
    },
    department: { type: String, required: true },
    designation: { type: String, required: true },
    teamLeader: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    manager: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    joinDate: { type: Date },
    phone: { type: String },
  },
  { timestamps: true }
);

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.matchPassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

export default mongoose.model('User', userSchema);