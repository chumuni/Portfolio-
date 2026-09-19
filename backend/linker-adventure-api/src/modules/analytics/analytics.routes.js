import { Router } from 'express';
import * as controller from './analytics.controller.js';
import * as schema from './analytics.schema.js';
import { validate } from '../../middleware/validate.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';

const router = Router();
router.use(authenticate, authorize('company', 'agent'));

router.get('/dashboard', validate({ query: schema.dashboardSchema }), controller.dashboard);
router.get('/notifications', validate({ query: schema.notificationsSchema }), controller.notifications);
router.post('/notifications/read', controller.readNotifications);

export default router;
