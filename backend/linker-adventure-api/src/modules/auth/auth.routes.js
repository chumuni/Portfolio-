import { Router } from 'express';
import * as controller from './auth.controller.js';
import * as schema from './auth.schema.js';
import { validate } from '../../middleware/validate.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authLimiter } from '../../middleware/rateLimiters.js';
import { upload } from '../../middleware/upload.js';

const router = Router();

// multipart: `document` (business licence / CV) plus text fields, so upload runs before validation
router.post('/register/company', authLimiter, upload.single('document'), validate({ body: schema.registerCompanySchema }), controller.registerCompany);
router.post('/register/agent',   authLimiter, upload.single('document'), validate({ body: schema.registerAgentSchema }),   controller.registerAgent);
router.post('/login',            authLimiter, validate({ body: schema.loginSchema }),           controller.login);
router.post('/refresh',          authLimiter, validate({ body: schema.refreshSchema }),         controller.refresh);
router.post('/logout',           controller.logout);

router.get('/me', authenticate, controller.me);
router.post('/change-password', authenticate, validate({ body: schema.changePasswordSchema }), controller.changePassword);

export default router;
