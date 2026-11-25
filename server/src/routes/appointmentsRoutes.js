import { Router } from 'express';
import {
  createAppointment,
  deleteAppointment,
  getAppointmentById,
  listAppointments,
  updateAppointment,
} from '../controllers/appointmentsController.js';

const router = Router();

router.get('/', listAppointments);
router.get('/:id', getAppointmentById);
router.post('/', createAppointment);
router.put('/:id', updateAppointment);
router.patch('/:id', updateAppointment);
router.delete('/:id', deleteAppointment);

export default router;
