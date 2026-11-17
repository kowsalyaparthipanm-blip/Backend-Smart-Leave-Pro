import { Router } from 'express';
import { inbox, history, decide } from '../controllers/approvalController.js';
import { protect, allowRoles } from '../middleware/auth.js';

const router = Router();

router.use(protect, allowRoles('team_leader', 'manager', 'hr'));
router.get('/inbox', inbox);
router.get('/history', history);
router.post('/:id/decision', decide);

export default router;