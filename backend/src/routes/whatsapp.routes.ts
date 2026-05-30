import { Router, Request, Response } from 'express';
import { verifyWebhook, handleIncomingMessage } from '../controllers/whatsapp.controller';

const router = Router();

router.get('/', verifyWebhook);
router.post('/', handleIncomingMessage);

export default router;