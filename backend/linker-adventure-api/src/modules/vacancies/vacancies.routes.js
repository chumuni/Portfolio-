import { Router } from 'express';
import * as controller from './vacancies.controller.js';
import * as applications from '../applications/applications.controller.js';
import * as applicationSchema from '../applications/applications.schema.js';
import * as schema from './vacancies.schema.js';
import { validate } from '../../middleware/validate.js';
import { authenticate, optionalAuth } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';

const router = Router();

router.get('/', optionalAuth, validate({ query: schema.searchVacanciesSchema }), controller.search);

router.get('/mine', authenticate, authorize('company'),
  validate({ query: schema.searchVacanciesSchema }), controller.listMine);

router.post('/', authenticate, authorize('company'),
  validate({ body: schema.createVacancySchema }), controller.create);

router.get('/:id', optionalAuth, validate({ params: schema.idParamSchema }), controller.getOne);

router.patch('/:id', authenticate, authorize('company'),
  validate({ params: schema.idParamSchema, body: schema.updateVacancySchema }), controller.update);

router.delete('/:id', authenticate, authorize('company'),
  validate({ params: schema.idParamSchema }), controller.remove);

// Applications nested under their vacancy
router.post('/:id/apply', authenticate, authorize('agent'),
  validate({ params: schema.idParamSchema, body: applicationSchema.applySchema }), applications.apply);

router.get('/:id/applications', authenticate, authorize('company'),
  validate({ params: schema.idParamSchema, query: applicationSchema.listSchema }), applications.listForVacancy);

export default router;
