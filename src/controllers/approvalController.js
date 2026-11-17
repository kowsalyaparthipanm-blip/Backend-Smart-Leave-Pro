import Approval from '../models/Approval.js';
import LeaveRequest from '../models/LeaveRequest.js';
import LeaveBalance from '../models/LeaveBalance.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';

export const inbox = async (req, res, next) => {
  try {
    const approvals = await Approval.find({ approver: req.user._id, status: 'pending' })
      .populate({ path: 'leave', populate: { path: 'employee', select: 'name email' } })
      .sort({ createdAt: -1 });
    const list = approvals.filter((a) => a.leave && a.leave.status === 'pending');
    list.sort((a, b) => Number(b.leave.isEmergency) - Number(a.leave.isEmergency));
    res.json({ approvals: list });
  } catch (error) {
    next(error);
  }
};

export const history = async (req, res, next) => {
  try {
    const approvals = await Approval.find({
      approver: req.user._id,
      status: { $in: ['approved', 'rejected'] },
    })
      .populate({ path: 'leave', populate: { path: 'employee', select: 'name email' } })
      .sort({ actedAt: -1 });
    res.json({ approvals });
  } catch (error) {
    next(error);
  }
};

export const decide = async (req, res, next) => {
  try {
    const { decision, comment = '' } = req.body;
    if (!['approved', 'rejected'].includes(decision)) {
      return res.status(400).json({ message: 'Decision must be approved or rejected' });
    }
    const note = comment.trim();
    if (decision === 'rejected' && note.length < 3) {
      return res.status(400).json({ message: 'Please give a reason for rejection' });
    }

    const approval = await Approval.findById(req.params.id);
    if (!approval || String(approval.approver) !== String(req.user._id)) {
      return res.status(404).json({ message: 'Approval not found for you' });
    }
    if (approval.status !== 'pending') {
      return res.status(400).json({ message: 'You have already acted on this request' });
    }
    const leave = await LeaveRequest.findById(approval.leave);
    if (!leave || leave.status !== 'pending') {
      return res.status(400).json({ message: 'This request is already closed' });
    }

    approval.status = decision;
    approval.comment = note;
    approval.actedAt = new Date();
    await approval.save();

    const employee = await User.findById(leave.employee);
    const dates = `${leave.startDate} to ${leave.endDate}`;
    const priority = leave.isEmergency ? 'high' : 'normal';
    const notes = [];

    if (decision === 'rejected') {
      leave.status = 'rejected';
      await leave.save();
      await Approval.updateMany({ leave: leave._id, status: 'pending' }, { status: 'skipped' });
      notes.push({
        user: leave.employee, type: 'rejected', title: 'Leave rejected',
        message: `Your ${leave.type} leave (${dates}) was rejected by ${req.user.name}. Reason: ${note}`,
        priority, leave: leave._id,
      });
    } else {
      const remaining = await Approval.countDocuments({ leave: leave._id, status: { $ne: 'approved' } });
      if (remaining === 0) {
        // Final approval: deduct balance only once (atomic flag check)
        const locked = await LeaveRequest.findOneAndUpdate(
          { _id: leave._id, balanceDeducted: false },
          { status: 'approved', balanceDeducted: true },
          { new: true }
        );
        if (locked) {
          await LeaveBalance.updateOne({ user: leave.employee }, { $inc: { [leave.type]: -leave.days } });
        }
        notes.push({
          user: leave.employee, type: 'approved', title: 'Leave approved',
          message: `Your ${leave.type} leave (${dates}) is fully approved. ${leave.days} day(s) deducted from balance.`,
          priority, leave: leave._id,
        });
      } else {
        notes.push({
          user: leave.employee, type: 'info', title: 'Approval received',
          message: `${req.user.name} approved your ${leave.type} leave (${dates}). Waiting for other approvers.`,
          leave: leave._id,
        });
      }
    }

    const closed = decision === 'rejected' || notes[0].type === 'approved';
    if (leave.isEmergency && closed && leave.alertUser && String(leave.alertUser) !== String(req.user._id)) {
      notes.push({
        user: leave.alertUser, type: 'info', priority: 'high',
        title: `Emergency leave ${decision}`,
        message: `${employee?.name}'s emergency leave (${dates}) is now ${decision}.`,
        leave: leave._id,
      });
    }
    await Notification.insertMany(notes);

    const updated = await LeaveRequest.findById(leave._id);
    res.json({ leave: updated });
  } catch (error) {
    next(error);
  }
};