import LeaveRequest from '../models/LeaveRequest.js';
import User from '../models/User.js';
import Holiday from '../models/Holiday.js';
import Setting from '../models/Setting.js';

export const monthAvailability = async (req, res, next) => {
  try {
    const { month } = req.query; // 'YYYY-MM'
    if (!/^\d{4}-\d{2}$/.test(month || '')) {
      return res.status(400).json({ message: 'month must be YYYY-MM' });
    }
    const [y, m] = month.split('-').map(Number);
    const last = new Date(y, m, 0).getDate();
    const start = `${month}-01`;
    const end = `${month}-${String(last).padStart(2, '0')}`;

    const teamFilter = req.user.role === 'hr'
      ? { role: { $ne: 'hr' } }
      : { role: { $ne: 'hr' }, department: req.user.department };
    const team = await User.find(teamFilter).select('name designation');
    const teamIds = team.map((t) => t._id);

    const leaves = await LeaveRequest.find({
      employee: { $in: teamIds },
      status: { $ne: 'rejected' },
      startDate: { $lte: end },
      endDate: { $gte: start },
    }).populate('employee', 'name');

    const holidays = await Holiday.find({ date: { $gte: start, $lte: end } });
    const setting = await Setting.findOne({ key: 'minStaffing' });

    res.json({
      month,
      team,
      minStaffing: setting ? setting.value : 3,
      holidays,
      leaves: leaves.map((l) => ({
        id: l._id, employeeId: l.employee._id, name: l.employee.name,
        type: l.type, status: l.status, startDate: l.startDate, endDate: l.endDate,
      })),
    });
  } catch (e) { next(e); }
};