import { Router } from 'express';
import * as controller from './profiles.controller.js';
import * as schema from './profiles.schema.js';
import { validate } from '../../middleware/validate.js';
import { authenticate, optionalAuth } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { upload } from '../../middleware/upload.js';

const router = Router();

// Own profile
router.get('/me', authenticate, controller.getMyProfile);
router.patch('/me/company', authenticate, authorize('company'), validate({ body: schema.updateCompanySchema }), controller.updateMyProfile);
router.patch('/me/agent',   authenticate, authorize('agent'),   validate({ body: schema.updateAgentSchema }),   controller.updateMyProfile);

// Media: /me/media/logo | cover | licence | photo | cv
router.post('/me/media/:slot', authenticate, upload.single('file'), controller.uploadMedia);

// Public profiles — optionalAuth so a signed-in viewer also gets relationship state
router.get('/companies/:slug', optionalAuth, validate({ params: schema.slugParamSchema }), controller.getCompanyBySlug);
router.get('/agents/:slug',    optionalAuth, validate({ params: schema.slugParamSchema }), controller.getAgentBySlug);

export default router;
