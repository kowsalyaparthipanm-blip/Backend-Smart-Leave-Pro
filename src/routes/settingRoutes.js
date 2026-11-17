import { Router } from 'express';
import { getMinStaffing, setMinStaffing } from '../controllers/settingController.js';
import { protect, allowRoles } from '../middleware/auth.js';

const router = Router();

router.use(protect);
router.get('/min-staffing', getMinStaffing);
router.put('/min-staffing', allowRoles('team_leader', 'manager', 'hr'), setMinStaffing);

export default router;