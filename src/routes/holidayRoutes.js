import { Router } from 'express';
import { listHolidays, addHoliday, removeHoliday } from '../controllers/holidayController.js';
import { protect, allowRoles } from '../middleware/auth.js';

const router = Router();

router.use(protect);
router.get('/', listHolidays);
router.post('/', allowRoles('hr'), addHoliday);
router.delete('/:id', allowRoles('hr'), removeHoliday);

export default router;