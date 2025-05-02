import Notification from '../models/notification.model.js';
import User from '../models/user.model.js';
import MissingPerson from '../models/findMissing.model.js';
import SightingReport from '../models/reportMissing.model.js';
import ApiResponse from '../utils/apiResponse.js';
import { sendNotificationToUser, sendGlobalNotification } from '../socket/socket.js';
import mongoose from 'mongoose';

// Get all notifications for the authenticated user
export const getUserNotifications = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Find notifications for the user or global notifications
        const notifications = await Notification.find({
            $or: [
                { recipient: req.user.id },
                { isGlobal: true }
            ]
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('relatedId', 'name photos');

        // Get total count for pagination
        const total = await Notification.countDocuments({
            $or: [
                { recipient: req.user.id },
                { isGlobal: true }
            ]
        });

        return ApiResponse.success(res, {
            statusCode: 200,
            message: 'Notifications retrieved successfully',
            data: {
                notifications,
                pagination: {
                    total,
                    page,
                    limit,
                    pages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error) {
        console.error('Get notifications error:', error);
        return ApiResponse.error(res, {
            statusCode: 500,
            message: 'Server Error'
        });
    }
};

// Mark notifications as read
export const markNotificationsAsRead = async (req, res) => {
    try {
        const { notificationIds } = req.body;

        if (!notificationIds || !Array.isArray(notificationIds)) {
            return ApiResponse.error(res, {
                statusCode: 400,
                message: 'Invalid notification IDs'
            });
        }

        // Update notifications
        await Notification.updateMany(
            {
                _id: { $in: notificationIds },
                $or: [
                    { recipient: req.user.id },
                    { isGlobal: true }
                ]
            },
            { isRead: true }
        );

        return ApiResponse.success(res, {
            statusCode: 200,
            message: 'Notifications marked as read'
        });
    } catch (error) {
        console.error('Mark notifications error:', error);
        return ApiResponse.error(res, {
            statusCode: 500,
            message: 'Server Error'
        });
    }
};

// Create a notification for a specific user
export const createNotification = async (recipientId, type, title, message, relatedId = null, relatedModel = null, image = null) => {
    try {
        const notification = await Notification.create({
            recipient: recipientId,
            type,
            title,
            message,
            relatedId,
            relatedModel,
            image,
            isGlobal: false
        });

        // Populate related data for real-time notification
        const populatedNotification = await Notification.findById(notification._id)
            .populate('relatedId', 'name photos');

        // Send real-time notification if socket.io is available
        if (global.io) {
            sendNotificationToUser(global.io, recipientId, populatedNotification);
        }

        return notification;
    } catch (error) {
        console.error('Create notification error:', error);
        return null;
    }
};

// Create a global notification
export const createGlobalNotification = async (type, title, message, relatedId = null, relatedModel = null, image = null) => {
    try {
        const notification = await Notification.create({
            type,
            title,
            message,
            relatedId,
            relatedModel,
            image,
            isGlobal: true
        });

        // Populate related data for real-time notification
        const populatedNotification = await Notification.findById(notification._id)
            .populate('relatedId', 'name photos');

        // Send real-time notification if socket.io is available
        if (global.io) {
            sendGlobalNotification(global.io, populatedNotification);
        }

        return notification;
    } catch (error) {
        console.error('Create global notification error:', error);
        return null;
    }
};

// Delete a notification
export const deleteNotification = async (req, res) => {
    try {
        const { id } = req.params;

        const notification = await Notification.findOneAndDelete({
            _id: id,
            recipient: req.user.id
        });

        if (!notification) {
            return ApiResponse.error(res, {
                statusCode: 404,
                message: 'Notification not found or not authorized to delete'
            });
        }

        return ApiResponse.success(res, {
            statusCode: 200,
            message: 'Notification deleted successfully'
        });
    } catch (error) {
        console.error('Delete notification error:', error);
        return ApiResponse.error(res, {
            statusCode: 500,
            message: 'Server Error'
        });
    }
};

// Get unread notification count
export const getUnreadCount = async (req, res) => {
    try {
        const count = await Notification.countDocuments({
            $or: [
                { recipient: req.user.id },
                { isGlobal: true }
            ],
            isRead: false
        });

        return ApiResponse.success(res, {
            statusCode: 200,
            message: 'Unread count retrieved successfully',
            data: { count }
        });
    } catch (error) {
        console.error('Get unread count error:', error);
        return ApiResponse.error(res, {
            statusCode: 500,
            message: 'Server Error'
        });
    }
};

// Send match alert
// Confirm a match notification
export const confirmMatch = async (req, res) => {
    try {
        const { notificationId, confirm } = req.body;

        if (!notificationId) {
            return ApiResponse.error(res, {
                statusCode: 400,
                message: 'Notification ID is required'
            });
        }

        // Find the notification
        const notification = await Notification.findOne({
            _id: notificationId,
            recipient: req.user.id,
            type: 'MATCH_FOUND',
            requiresConfirmation: true
        });

        if (!notification) {
            return ApiResponse.error(res, {
                statusCode: 404,
                message: 'Notification not found or not authorized'
            });
        }

        // Update notification status
        notification.confirmed = confirm === true;
        notification.isRead = true;
        await notification.save();

        // If confirmed, update the missing person status and send notification
        if (confirm === true && notification.matchData) {
            const { missingPersonId } = notification.matchData;

            if (missingPersonId) {
                console.log('Updating missing person with ID:', missingPersonId);

                try {
                    // Ensure we're using a valid ObjectId string
                    const missingPersonObjectId = mongoose.Types.ObjectId.isValid(missingPersonId)
                        ? missingPersonId
                        : null;

                    if (!missingPersonObjectId) {
                        console.error('Invalid missingPersonId:', missingPersonId);
                        throw new Error('Invalid missing person ID format');
                    }

                    // Update missing person status to 'found'
                    const missingPerson = await MissingPerson.findByIdAndUpdate(
                        missingPersonObjectId,
                        { status: 'found' },
                        { new: true }
                    ).populate('reportedBy', '_id');

                    if (missingPerson && missingPerson.reportedBy) {
                        // Send notification to the person who reported the missing person
                        await createNotification(
                            missingPerson.reportedBy._id,
                            'STATUS_UPDATE',
                            'Missing Person Found',
                            `${missingPerson.name} has been confirmed as found.`,
                            missingPerson._id,
                            'MissingPerson',
                            missingPerson.photos[0]
                        );

                        // Send global notification
                        await createGlobalNotification(
                            'STATUS_UPDATE',
                            'Missing Person Found',
                            `${missingPerson.name}, previously reported missing, has been found.`,
                            missingPerson._id,
                            'MissingPerson',
                            missingPerson.photos[0]
                        );
                    }
                } catch (error) {
                    console.error('Error updating missing person status:', error);
                    // Continue execution even if updating the missing person fails
                }
            }
        }

        return ApiResponse.success(res, {
            statusCode: 200,
            message: confirm ? 'Match confirmed successfully' : 'Match rejected',
            data: { confirmed: confirm }
        });
    } catch (error) {
        console.error('Confirm match error:', error);
        return ApiResponse.error(res, {
            statusCode: 500,
            message: 'Server Error',
            error: error.message
        });
    }
};

export const sendMatchAlert = async (req, res) => {
    try {
        const { missingPersonId, matchId } = req.body;

        if (!missingPersonId || !matchId) {
            return ApiResponse.error(res, {
                statusCode: 400,
                message: 'Missing person ID and match ID are required'
            });
        }

        // Determine if this is a missing person to sighting report match or vice versa
        let missingPerson, sightingReport, recipientId, relatedModel, relatedId;

        // Try to find both as missing persons first
        const missingPersonDoc = await MissingPerson.findById(missingPersonId);
        const matchAsMissingPerson = await MissingPerson.findById(matchId);

        if (missingPersonDoc && matchAsMissingPerson) {
            // Both are missing persons, send alerts to both reporters
            missingPerson = missingPersonDoc;
            recipientId = matchAsMissingPerson.reportedBy;
            relatedModel = 'MissingPerson';
            relatedId = missingPersonId;
        } else {
            // Check if one is a missing person and one is a sighting report
            const sightingReportDoc = await SightingReport.findById(matchId);

            if (missingPersonDoc && sightingReportDoc) {
                // Missing person to sighting report match
                missingPerson = missingPersonDoc;
                sightingReport = sightingReportDoc;
                recipientId = sightingReport.reportedBy;
                relatedModel = 'MissingPerson';
                relatedId = missingPersonId;
            } else {
                // Try the reverse
                const missingPersonAsMatch = await MissingPerson.findById(matchId);
                const sightingReportAsSource = await SightingReport.findById(missingPersonId);

                if (missingPersonAsMatch && sightingReportAsSource) {
                    // Sighting report to missing person match
                    missingPerson = missingPersonAsMatch;
                    sightingReport = sightingReportAsSource;
                    recipientId = missingPerson.reportedBy;
                    relatedModel = 'SightingReport';
                    relatedId = missingPersonId;
                } else {
                    return ApiResponse.error(res, {
                        statusCode: 404,
                        message: 'Missing person or sighting report not found'
                    });
                }
            }
        }

        if (!recipientId) {
            return ApiResponse.error(res, {
                statusCode: 404,
                message: 'Recipient not found'
            });
        }

        // Create notification
        const title = 'Potential Match Found';
        const message = missingPerson
            ? `A potential match has been found for ${missingPerson.name}.`
            : 'A potential match has been found for your report.';

        const image = missingPerson && missingPerson.photos && missingPerson.photos.length > 0
            ? missingPerson.photos[0]
            : null;

        // Store match data for later use in confirmation
        // Convert ObjectIds to strings to avoid casting issues
        const matchData = {
            missingPersonId: missingPerson ? missingPerson._id.toString() : null,
            sightingReportId: sightingReport ? sightingReport._id.toString() : null,
            matchId: matchId.toString(),
            sourceId: missingPersonId.toString()
        };

        // Create notification with requiresConfirmation flag
        const notification = await Notification.create({
            recipient: recipientId,
            type: 'MATCH_FOUND',
            title,
            message,
            relatedId,
            relatedModel,
            image,
            isGlobal: false,
            requiresConfirmation: true,
            matchData
        });

        // Populate related data for real-time notification
        const populatedNotification = await Notification.findById(notification._id)
            .populate('relatedId', 'name photos');

        // Send real-time notification if socket.io is available
        if (global.io) {
            sendNotificationToUser(global.io, recipientId, populatedNotification);
        }

        if (!notification) {
            return ApiResponse.error(res, {
                statusCode: 500,
                message: 'Failed to create notification'
            });
        }

        return ApiResponse.success(res, {
            statusCode: 201,
            message: 'Match alert sent successfully'
        });
    } catch (error) {
        console.error('Send match alert error:', error);
        return ApiResponse.error(res, {
            statusCode: 500,
            message: 'Server Error',
            error: error.message
        });
    }
};
