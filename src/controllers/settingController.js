import Setting from '../models/Setting.js';

export const getMinStaffing = async (req, res, next) => {
  try {
    const s = await Setting.findOne({ key: 'minStaffing' });
    res.json({ minStaffing: s ? s.value : 3 });
  } catch (e) { next(e); }
};

export const setMinStaffing = async (req, res, next) => {
  try {
    const n = Number(req.body.minStaffing);
    if (!Number.isInteger(n) || n < 1 || n > 50) {
      return res.status(400).json({ message: 'minStaffing must be a whole number between 1 and 50' });
    }
    await Setting.findOneAndUpdate({ key: 'minStaffing' }, { value: n }, { upsert: true });
    res.json({ minStaffing: n });
  } catch (e) { next(e); }
};