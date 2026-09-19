import { Router } from 'express';
import * as controller from './connections.controller.js';
import * as schema from './connections.schema.js';
import { validate } from '../../middleware/validate.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';

const router = Router();
router.use(authenticate, authorize('company', 'agent'));

router.get('/', validate({ query: schema.listConnectionsSchema }), controller.list);
router.post('/interest', validate({ body: schema.expressInterestSchema }), controller.expressInterest);
router.get('/:id', validate({ params: schema.idParamSchema }), controller.getOne);
router.post('/:id/withdraw', validate({ params: schema.idParamSchema }), controller.withdraw);
router.post('/:id/decline',  validate({ params: schema.idParamSchema }), controller.decline);
router.post('/:id/archive',  validate({ params: schema.idParamSchema }), controller.archive);

export default router;
