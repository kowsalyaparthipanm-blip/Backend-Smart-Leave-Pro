import { Router } from 'express';
import { listTasks, createTask, updateStatus, deleteTask } from '../controllers/handoverController.js';
import { protect } from '../middleware/auth.js';

const router = Router();

router.use(protect);
router.get('/', listTasks);
router.post('/', createTask);
router.patch('/:id/status', updateStatus);
router.delete('/:id', deleteTask);

export default router;