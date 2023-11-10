// import express from 'express';
// import { Server } from 'socket.io'; // Import the Server class

// const notifications = [];

// const router = express.Router();

// // Create an HTTP server
// const app = express();
// const server = app.listen(3000); // Replace 3000 with your desired port

// // Initialize socket.io and pass the server instance
// const io = new Server(server);

// router.get('/notifications', (req, res) => {
//   res.json(notifications);
// });

// router.post('/notifications', (req, res) => {
//   const { message } = req.body;

//   if (message) {
//     notifications.push({ message });

//     io.emit('newNotification', { message }); // Use the io instance to emit events

//     res.status(201).json({ message: 'Notification sent successfully' });
//   } else {
//     res.status(400).json({ error: 'Invalid notification message' });
//   }
// });

// export default router;
