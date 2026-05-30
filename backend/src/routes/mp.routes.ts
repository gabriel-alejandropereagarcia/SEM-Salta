import { Router } from 'express';
import { handleMercadoPagoWebhook, createPreferenceHandler } from '../controllers/mp.controller';

const router = Router();

router.post('/webhook', handleMercadoPagoWebhook);
router.post('/create-preference', createPreferenceHandler);

export default router;