import { Router } from 'express';
import * as controller from './reviews.controller.js';
import * as schema from './reviews.schema.js';
import { validate } from '../../middleware/validate.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';

const router = Router();

router.get('/:subjectType/:subjectId',
  validate({ params: schema.subjectParamSchema, query: schema.listReviewsSchema }),
  controller.listForSubject);

router.post('/', authenticate, authorize('company', 'agent'),
  validate({ body: schema.createReviewSchema }), controller.create);

export default router;
