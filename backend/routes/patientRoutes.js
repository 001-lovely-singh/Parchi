const router = require('express').Router();
const { protect } = require('../middleware/authMiddleware');
const authorizeRole = require('../middleware/authorizeRole');

const { getGrowthOverview } = require('../controllers/patientController');
const { getTrendForAnalyte } = require('../controllers/trendController');
const { getBrief } = require('../controllers/briefController');
const { getSummary, getSummaryPdf } = require('../controllers/summaryController');

router.get('/growth', protect, authorizeRole('patient'), getGrowthOverview);
router.get('/trend/:analyteKey', protect, authorizeRole('patient'), getTrendForAnalyte);
router.get('/brief/:analyteKey', protect, authorizeRole('patient'), getBrief);
router.get('/summary', protect, authorizeRole('patient'), getSummary);
router.get('/summary/pdf', protect, authorizeRole('patient'), getSummaryPdf);

module.exports = router;