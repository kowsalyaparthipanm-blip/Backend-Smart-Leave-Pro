import { Router } from 'express';
import { snapshot } from '../controllers/syncController.js';
import { protect } from '../middleware/auth.js';

const router = Router();
router.get('/', protect, snapshot);
export default router;