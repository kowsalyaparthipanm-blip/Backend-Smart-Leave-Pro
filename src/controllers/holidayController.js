import Holiday from '../models/Holiday.js';

export const listHolidays = async (req, res, next) => {
  try {
    res.json({ holidays: await Holiday.find().sort({ date: 1 }) });
  } catch (e) { next(e); }
};

export const addHoliday = async (req, res, next) => {
  try {
    const { name, date } = req.body;
    if (!name?.trim() || !date) return res.status(400).json({ message: 'Name and date are required' });
    if (await Holiday.findOne({ date })) return res.status(400).json({ message: 'A holiday already exists on that date' });
    res.status(201).json({ holiday: await Holiday.create({ name: name.trim(), date }) });
  } catch (e) { next(e); }
};

export const removeHoliday = async (req, res, next) => {
  try {
    await Holiday.deleteOne({ _id: req.params.id });
    res.json({ ok: true });
  } catch (e) { next(e); }
};