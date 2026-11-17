import HandoverTask from '../models/HandoverTask.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { todayISO } from '../utils/workingDays.js';

const populateTask = (q) => q.populate('owner', 'name').populate('backup', 'name');

export const listTasks = async (req, res, next) => {
  try {
    const tasks = await populateTask(
      HandoverTask.find({ $or: [{ owner: req.user._id }, { backup: req.user._id }] }).sort({ createdAt: -1 })
    );
    res.json({ tasks });
  } catch (e) { next(e); }
};

export const createTask = async (req, res, next) => {
  try {
    const { title, description = '', backupId, dueDate, priority = 'Medium' } = req.body;
    const errors = {};
    if (!title || title.trim().length < 3) errors.title = 'Title is required (min 3 characters).';
    if (!backupId) errors.backupId = 'Choose a backup employee.';
    else if (String(backupId) === String(req.user._id)) errors.backupId = 'You cannot assign the task to yourself.';
    if (!dueDate) errors.dueDate = 'Due date is required.';
    else if (dueDate < todayISO()) errors.dueDate = 'Due date cannot be in the past.';
    if (Object.keys(errors).length) return res.status(400).json({ message: 'Validation failed', errors });

    const backup = await User.findById(backupId);
    if (!backup) return res.status(400).json({ message: 'Validation failed', errors: { backupId: 'Employee not found.' } });

    const task = await HandoverTask.create({
      owner: req.user._id, backup: backup._id, title: title.trim(), description: description.trim(), dueDate, priority,
    });
    await Notification.create({
      user: backup._id, type: 'info', title: 'New handover task assigned',
      message: `${req.user.name} assigned you "${task.title}" (due ${dueDate}, ${priority} priority).`,
    });
    res.status(201).json({ task });
  } catch (e) { next(e); }
};

export const updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['Pending', 'In Progress', 'Completed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    const task = await HandoverTask.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    const isOwner = String(task.owner) === String(req.user._id);
    const isBackup = String(task.backup) === String(req.user._id);
    if (!isOwner && !isBackup) return res.status(403).json({ message: 'Only owner or backup can update' });

    task.status = status;
    await task.save();
    await Notification.create({
      user: isOwner ? task.backup : task.owner, type: 'info', title: 'Handover task updated',
      message: `"${task.title}" is now ${status}.`,
    });
    res.json({ task });
  } catch (e) { next(e); }
};

export const deleteTask = async (req, res, next) => {
  try {
    const task = await HandoverTask.findById(req.params.id);
    if (!task || String(task.owner) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Only the task owner can delete it' });
    }
    await task.deleteOne();
    res.json({ ok: true });
  } catch (e) { next(e); }
};