import User from '../models/User.js';

const ROUTES = {
  all: ['team_leader', 'manager', 'hr'],
  tl_only: ['team_leader'],
  manager_only: ['manager'],
  hr_only: ['hr'],
};

// Returns [{ role, user }] for this applicant and route.
export const resolveApprovers = async (applicant, routeId) => {
  const roles = ROUTES[routeId];
  if (!roles) return [];
  const list = [];
  for (const role of roles) {
    let user = null;
    if (role === 'team_leader' && applicant.teamLeader) user = await User.findById(applicant.teamLeader);
    if (role === 'manager' && applicant.manager) user = await User.findById(applicant.manager);
    if (role === 'hr') user = await User.findOne({ role: 'hr' });
    if (user && String(user._id) !== String(applicant._id) && !list.some((a) => String(a.user._id) === String(user._id))) {
      list.push({ role, user });
    }
  }
  return list;
};