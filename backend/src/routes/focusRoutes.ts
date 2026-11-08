import { Router } from 'express';
import {
  saveFocusSession,
  getFocusToday,
  getFocusHistory,
} from '../controllers/focusController';

const router = Router();

router.post('/', saveFocusSession);
router.get('/today', getFocusToday);
router.get('/history', getFocusHistory);

export default router;
