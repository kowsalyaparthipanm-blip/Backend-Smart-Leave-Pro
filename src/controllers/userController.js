import User from '../models/User.js';

export const listUsers = async (req, res, next) => {
  try {
    res.json({ users: await User.find().sort({ name: 1 }) });
  } catch (e) { next(e); }
};