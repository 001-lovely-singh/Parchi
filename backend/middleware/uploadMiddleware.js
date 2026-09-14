const multer = require('multer');

// memory storage — image kabhi disk/DB pe save nahi hoti, extract ke baad discard
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

module.exports = upload;