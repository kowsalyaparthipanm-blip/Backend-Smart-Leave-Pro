import { Router } from 'express';
import { applyLeave, myLeaves, myBalance } from '../controllers/leaveController.js';
import { protect } from '../middleware/auth.js';

const router = Router();

router.use(protect);
router.post('/', applyLeave);
router.get('/mine', myLeaves);
router.get('/balance', myBalance);

export default router;