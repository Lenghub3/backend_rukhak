const express = require('express');
const router = express.Router();
const io = require('socket.io')();

const notifications = [];

router.get('/notifications', (req, res) => {
  res.json(notifications);
});

router.post('/notifications', (req, res) => {
  const { message } = req.body;

  if (message) {
    notifications.push({ message });

    io.emit('newNotification', { message });

    res.status(201).json({ message: 'Notification sent successfully' });
  } else {
    res.status(400).json({ error: 'Invalid notification message' });
  }
});

module.exports = router;
