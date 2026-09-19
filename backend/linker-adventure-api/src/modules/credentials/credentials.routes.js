import { Router } from 'express';
import * as controller from './credentials.controller.js';
import * as schema from './credentials.schema.js';
import { validate } from '../../middleware/validate.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { upload } from '../../middleware/upload.js';

const router = Router();
router.use(authenticate, authorize('agent'));

router.get('/', controller.listMine);

// multipart: `file` plus the text fields, so upload runs before validation
router.post('/', upload.single('file'), validate({ body: schema.createCredentialSchema }), controller.create);

router.delete('/:id', validate({ params: schema.idParamSchema }), controller.remove);

export default router;
