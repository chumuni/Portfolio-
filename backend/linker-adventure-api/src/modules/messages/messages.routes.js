import { Router } from 'express';
import * as controller from './messages.controller.js';
import * as schema from './messages.schema.js';
import { validate } from '../../middleware/validate.js';
import { authenticate } from '../../middleware/authenticate.js';

const router = Router();
router.use(authenticate);

router.get('/unread-count', controller.unreadCount);

router.get('/:connectionId',
  validate({ params: schema.connectionParamSchema, query: schema.listMessagesSchema }),
  controller.history);

router.post('/:connectionId',
  validate({ params: schema.connectionParamSchema, body: schema.sendMessageSchema }),
  controller.send);

router.post('/:connectionId/read',
  validate({ params: schema.connectionParamSchema }),
  controller.markRead);

export default router;
