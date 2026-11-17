import User from '../models/User.js';
import LeaveRequest from '../models/LeaveRequest.js';
import Approval from '../models/Approval.js';
import LeaveBalance from '../models/LeaveBalance.js';
import Notification from '../models/Notification.js';
import HandoverTask from '../models/HandoverTask.js';
import Holiday from '../models/Holiday.js';
import Setting from '../models/Setting.js';

const s = (v) => (v ? String(v) : null);

export const snapshot = async (req, res, next) => {
  try {
    const me = req.user;
    const users = await User.find().sort({ name: 1 });
    const userMap = new Map(users.map((u) => [String(u._id), u]));
    const nameOf = (id) => userMap.get(String(id))?.name || '';

    const teamIds = users
      .filter((u) => u.role !== 'hr' && (me.role === 'hr' || u.department === me.department))
      .map((u) => u._id);

    const approvalsDocs = await Approval.find({
      $or: [{ approver: me._id }, { leave: { $in: (await LeaveRequest.find({ employee: me._id }).select('_id')).map((l) => l._id) } }],
    });
    const approvalLeaveIds = approvalsDocs.map((a) => a.leave);

    const leavesDocs = await LeaveRequest.find({
      $or: [{ employee: { $in: teamIds } }, { employee: me._id }, { _id: { $in: approvalLeaveIds } }, { alertUser: me._id }],
    });

    // approvals for every visible leave (so timelines are complete)
    const allApprovals = await Approval.find({ leave: { $in: leavesDocs.map((l) => l._id) } });

    const balancesDocs = await LeaveBalance.find();
    const balances = {};
    users.forEach((u) => {
      const b = balancesDocs.find((x) => String(x.user) === String(u._id));
      balances[String(u._id)] = {
        casual: b ? b.casual : 12, sick: b ? b.sick : 10, earned: b ? b.earned : 15, emergency: b ? b.emergency : 5,
      };
    });

    const notifications = await Notification.find({ user: me._id }).sort({ createdAt: -1 }).limit(100);
    const tasks = await HandoverTask.find({ $or: [{ owner: me._id }, { backup: me._id }] }).sort({ createdAt: -1 });
    const holidays = await Holiday.find().sort({ date: 1 });
    const minStaffing = await Setting.findOne({ key: 'minStaffing' });

    res.json({
      users: users.map((u) => ({
        id: s(u._id), name: u.name, email: u.email, role: u.role, department: u.department,
        designation: u.designation, teamLeaderId: s(u.teamLeader), managerId: s(u.manager),
        joinDate: u.joinDate ? u.joinDate.toISOString().slice(0, 10) : '', phone: u.phone || '',
      })),
      leaves: leavesDocs.map((l) => ({
        id: s(l._id), employeeId: s(l.employee), employeeName: nameOf(l.employee), type: l.type,
        startDate: l.startDate, endDate: l.endDate, days: l.days, reason: l.reason, route: l.route,
        isEmergency: l.isEmergency, priority: l.isEmergency ? 'high' : 'normal', status: l.status,
        balanceDeducted: l.balanceDeducted, alertUserId: s(l.alertUser), createdAt: l.createdAt.toISOString(),
      })),
      approvals: allApprovals.map((a) => ({
        id: s(a._id), leaveId: s(a.leave), role: a.role, approverId: s(a.approver),
        approverName: nameOf(a.approver), status: a.status, comment: a.comment,
        actedAt: a.actedAt ? a.actedAt.toISOString() : null, order: a.order,
      })),
      balances,
      notifications: notifications.map((n) => ({
        id: s(n._id), userId: s(n.user), type: n.type, title: n.title, message: n.message,
        priority: n.priority, leaveId: s(n.leave), read: n.read, createdAt: n.createdAt.toISOString(),
      })),
      handovers: tasks.map((t) => ({
        id: s(t._id), ownerId: s(t.owner), ownerName: nameOf(t.owner), backupId: s(t.backup),
        backupName: nameOf(t.backup), title: t.title, description: t.description, dueDate: t.dueDate,
        priority: t.priority, status: t.status, createdAt: t.createdAt.toISOString(), updatedAt: t.updatedAt.toISOString(),
      })),
      holidays: holidays.map((h) => ({ id: s(h._id), name: h.name, date: h.date })),
      settings: { minStaffing: minStaffing ? minStaffing.value : 3 },
      activities: [],
    });
  } catch (e) { next(e); }
};