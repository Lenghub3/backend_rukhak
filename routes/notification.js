// routes/notification.js
const express = require('express');
const router = express.Router();
router.get('/notifications', (req, res) => {
  res.json({ message: 'This is the notifications API endpoint' });
});

module.exports = router;
