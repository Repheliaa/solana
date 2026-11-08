import { Router } from 'express';
import { getClasses, createClass, updateClass, deleteClass, syncClass } from '../controllers/classController';

const router = Router();

router.get('/', getClasses);
router.post('/', createClass);
router.put('/:id', updateClass);
router.delete('/:id', deleteClass);
router.post('/:id/sync', syncClass);

export default router;
