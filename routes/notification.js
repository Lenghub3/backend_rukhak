const express = require('express');
const router = express.Router();
const io = require('socket.io')(); // Assuming you have Socket.IO configured

// Define an array to store notifications
const notifications = [];

// GET endpoint to retrieve notifications
router.get('/notifications', (req, res) => {
  res.json(notifications);
});

// POST endpoint to send a new notification
router.post('/notifications', (req, res) => {
  const { message } = req.body;

  if (message) {
    // Add the new notification to the array
    notifications.push({ message });

    // Send the new notification to connected clients via Socket.IO
    io.emit('newNotification', { message });

    res.status(201).json({ message: 'Notification sent successfully' });
  } else {
    res.status(400).json({ error: 'Invalid notification message' });
  }
});

module.exports = router;
