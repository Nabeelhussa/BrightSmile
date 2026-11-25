import { Router } from 'express';
import {
  createDoctor,
  deleteDoctor,
  getDoctorById,
  listDoctors,
  updateDoctor,
} from '../controllers/doctorsController.js';

const router = Router();

router.get('/', listDoctors);
router.get('/:id', getDoctorById);
router.post('/', createDoctor);
router.put('/:id', updateDoctor);
router.patch('/:id', updateDoctor);
router.delete('/:id', deleteDoctor);

export default router;
