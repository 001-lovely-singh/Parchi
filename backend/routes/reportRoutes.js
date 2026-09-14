const router = require('express').Router();
const { protect } = require('../middleware/authMiddleware');
const authorizeRole = require('../middleware/authorizeRole');
const upload = require('../middleware/uploadMiddleware');

const { uploadReport, listReports, getReport, deleteReport } = require('../controllers/uploadController');
const { extractFromReport } = require('../controllers/extractController');
const { verifyRecords } = require('../controllers/verifyController');

router.get('/', protect, authorizeRole('patient', 'clinic'), listReports);
router.post('/upload', protect, authorizeRole('patient', 'clinic'), uploadReport);
router.post('/extract', protect, authorizeRole('patient', 'clinic'), upload.single('report'), extractFromReport);
router.post('/verify', protect, authorizeRole('patient', 'clinic'), verifyRecords);
router.get('/:reportId', protect, authorizeRole('patient', 'clinic'), getReport);
router.delete('/:reportId', protect, authorizeRole('patient', 'clinic'), deleteReport);

module.exports = router;