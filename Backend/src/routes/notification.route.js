import express from 'express';
import { verifyToken } from '../middlewares/auth.middleware.js';
import {
    getUserNotifications,
    markNotificationsAsRead,
    deleteNotification,
    getUnreadCount
} from '../controllers/notification.controller.js';

const router = express.Router();

// Get all notifications for the authenticated user
router.get('/', verifyToken, getUserNotifications);

// Get unread notification count
router.get('/unread-count', verifyToken, getUnreadCount);

// Mark notifications as read
router.put('/mark-read', verifyToken, markNotificationsAsRead);

// Delete a notification
router.delete('/:id', verifyToken, deleteNotification);

export default router;
