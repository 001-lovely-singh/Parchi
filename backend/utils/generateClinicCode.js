const crypto = require('crypto');

// 8-char uppercase alphanumeric code, patient isko upload ke waqt daalega
const generateClinicCode = () => crypto.randomBytes(4).toString('hex').toUpperCase();

module.exports = generateClinicCode;