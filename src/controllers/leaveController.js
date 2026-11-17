import LeaveRequest from '../models/LeaveRequest.js';
import LeaveBalance from '../models/LeaveBalance.js';
import Approval from '../models/Approval.js';
import Notification from '../models/Notification.js';
import Holiday from '../models/Holiday.js';
import { countWorkingDays, todayISO } from '../utils/workingDays.js';
import { resolveApprovers } from '../utils/approvers.js';

const TYPES = ['casual', 'sick', 'earned', 'emergency'];
const ROUTE_IDS = ['all', 'tl_only', 'manager_only', 'hr_only'];

const getBalance = async (userId) =>
  (await LeaveBalance.findOne({ user: userId })) || (await LeaveBalance.create({ user: userId }));

export const applyLeave = async (req, res, next) => {
  try {
    const { type, startDate, endDate, reason, route } = req.body;
    const user = req.user;
    const errors = {};

    if (!TYPES.includes(type)) errors.type = 'Select a valid leave type.';
    if (!startDate) errors.startDate = 'Start date is required.';
    if (!endDate) errors.endDate = 'End date is required.';
    if (startDate && endDate && endDate < startDate) errors.endDate = 'End date cannot be before start date.';
    const pastAllowed = type === 'sick' || type === 'emergency';
    if (startDate && startDate < todayISO() && !pastAllowed) {
      errors.startDate = 'Past dates are allowed only for Sick and Emergency leave.';
    }
    if (!reason || reason.trim().length < 10) errors.reason = 'Reason must be at least 10 characters.';
    if (!ROUTE_IDS.includes(route)) errors.route = 'Select a valid approval route.';
    if (Object.keys(errors).length) return res.status(400).json({ message: 'Validation failed', errors });

    const holidays = (await Holiday.find()).map((h) => h.date);
    const days = countWorkingDays(startDate, endDate, holidays);
    if (days === 0) {
      return res.status(400).json({ message: 'Validation failed', errors: { endDate: 'No working days in the selected range.' } });
    }

    // Duplicate / overlap check
    const clash = await LeaveRequest.findOne({
      employee: user._id,
      status: { $ne: 'rejected' },
      startDate: { $lte: endDate },
      endDate: { $gte: startDate },
    });
    if (clash) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: { startDate: `Overlaps with your ${clash.status} leave (${clash.startDate} to ${clash.endDate}).` },
      });
    }

    const approvers = await resolveApprovers(user, route);
    if (!approvers.length) {
      return res.status(400).json({ message: 'Validation failed', errors: { route: 'No approver available for this route.' } });
    }

    // Balance check (including pending requests)
    const balance = await getBalance(user._id);
    const pending = await LeaveRequest.find({ employee: user._id, type, status: 'pending' });
    const reserved = pending.reduce((sum, l) => sum + l.days, 0);
    const free = balance[type] - reserved;
    if (days > free) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: { type: `Insufficient ${type} balance. Available: ${free}, requested: ${days}.` },
      });
    }

    const isEmergency = type === 'emergency';
    let alertUser = null;
    if (isEmergency) {
      alertUser = user.manager ? await (await import('../models/User.js')).default.findById(user.manager) : null;
    }

    const leave = await LeaveRequest.create({
      employee: user._id,
      type, startDate, endDate, days,
      reason: reason.trim(),
      route,
      isEmergency,
      alertUser: alertUser ? alertUser._id : null,
    });

    await Approval.insertMany(
      approvers.map((a, i) => ({ leave: leave._id, approver: a.user._id, role: a.role, order: i + 1 }))
    );

    const dates = `${startDate} to ${endDate}`;
    const notes = [];
    approvers.forEach(({ user: ap }) => {
      if (alertUser && String(ap._id) === String(alertUser._id)) return;
      notes.push({
        user: ap._id,
        type: 'approval_request',
        title: isEmergency ? 'Emergency leave approval needed' : 'New leave approval request',
        message: `${user.name} requested ${type} leave (${dates}, ${days} working day(s)).`,
        priority: isEmergency ? 'high' : 'normal',
        leave: leave._id,
      });
    });
    if (alertUser) {
      const needs = approvers.some((a) => String(a.user._id) === String(alertUser._id));
      notes.push({
        user: alertUser._id,
        type: 'emergency',
        title: `EMERGENCY LEAVE: ${user.name}`,
        message: `${dates}. Reason: ${leave.reason}. ${needs ? 'Your approval is required.' : 'Approval follows the selected route.'}`,
        priority: 'high',
        leave: leave._id,
      });
    }
    notes.push({
      user: user._id,
      type: 'info',
      title: 'Leave request submitted',
      message: `Your ${type} leave (${dates}) is pending approval from ${approvers.map((a) => a.user.name).join(', ')}.`,
      leave: leave._id,
    });
    await Notification.insertMany(notes);

    res.status(201).json({ leave });
  } catch (error) {
    next(error);
  }
};

export const myLeaves = async (req, res, next) => {
  try {
    const leaves = await LeaveRequest.find({ employee: req.user._id }).sort({ createdAt: -1 });
    const ids = leaves.map((l) => l._id);
    const approvals = await Approval.find({ leave: { $in: ids } })
      .populate('approver', 'name role')
      .sort({ order: 1 });
    res.json({
      leaves: leaves.map((l) => ({
        ...l.toObject(),
        approvals: approvals.filter((a) => String(a.leave) === String(l._id)),
      })),
    });
  } catch (error) {
    next(error);
  }
};

export const myBalance = async (req, res, next) => {
  try {
    res.json({ balance: await getBalance(req.user._id) });
  } catch (error) {
    next(error);
  }
};