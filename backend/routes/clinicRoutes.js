const router = require('express').Router();
const { protect } = require('../middleware/authMiddleware');
const authorizeRole = require('../middleware/authorizeRole');
const { getMyPatients, getPatientGrowth } = require('../controllers/clinicController');

router.get('/patients', protect, authorizeRole('clinic'), getMyPatients);
router.get('/patient/:patientId/growth', protect, authorizeRole('clinic'), getPatientGrowth);

module.exports = router;