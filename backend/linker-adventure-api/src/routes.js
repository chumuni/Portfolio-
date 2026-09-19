import { Router } from 'express';
import authRoutes from './modules/auth/auth.routes.js';
import profileRoutes from './modules/profiles/profiles.routes.js';
import discoveryRoutes from './modules/discovery/discovery.routes.js';
import connectionRoutes from './modules/connections/connections.routes.js';
import messageRoutes from './modules/messages/messages.routes.js';
import vacancyRoutes from './modules/vacancies/vacancies.routes.js';
import applicationRoutes from './modules/applications/applications.routes.js';
import reviewRoutes from './modules/reviews/reviews.routes.js';
import credentialRoutes from './modules/credentials/credentials.routes.js';
import analyticsRoutes from './modules/analytics/analytics.routes.js';

const router = Router();

router.get('/', (_req, res) => res.json({
  success: true,
  data: {
    name: 'Linker Adventure API',
    version: '1.0.0',
    resources: [
      'auth', 'profiles', 'discovery', 'connections',
      'messages', 'vacancies', 'applications', 'reviews',
      'credentials', 'analytics',
    ],
  },
}));

router.use('/auth', authRoutes);
router.use('/profiles', profileRoutes);
router.use('/discovery', discoveryRoutes);
router.use('/connections', connectionRoutes);
router.use('/messages', messageRoutes);
router.use('/vacancies', vacancyRoutes);
router.use('/applications', applicationRoutes);
router.use('/reviews', reviewRoutes);
router.use('/credentials', credentialRoutes);
router.use('/analytics', analyticsRoutes);

export default router;
