import { Router } from 'express';
import * as controller from './discovery.controller.js';
import * as schema from './discovery.schema.js';
import { validate } from '../../middleware/validate.js';
import { authenticate, optionalAuth } from '../../middleware/authenticate.js';

const router = Router();

router.get('/agents',      optionalAuth, validate({ query: schema.searchAgentsSchema }),    controller.findAgents);
router.get('/companies',   optionalAuth, validate({ query: schema.searchCompaniesSchema }), controller.findCompanies);
router.get('/suggestions', authenticate, controller.suggestions);

export default router;
