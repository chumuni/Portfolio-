import { Router } from 'express';
import * as controller from './applications.controller.js';
import * as schema from './applications.schema.js';
import { validate } from '../../middleware/validate.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';

const router = Router();
router.use(authenticate);

router.get('/mine', authorize('agent'), validate({ query: schema.listSchema }), controller.listMine);

router.patch('/:id/decision', authorize('company'),
  validate({ params: schema.idParamSchema, body: schema.decisionSchema }), controller.decide);

router.post('/:id/withdraw', authorize('agent'),
  validate({ params: schema.idParamSchema }), controller.withdraw);

export default router;
