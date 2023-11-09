import mongoose from 'mongoose';
import { Schema } from 'mongoose';

const NotificationSchema = new Schema({
    To: { type: Schema.Types.ObjectId, ref: 'User' },
    From: { type: Schema.Types.ObjectId, ref: 'User' },
    notificationType: String,
    opened: { type: Boolean, default: false },
    entityId: Schema.Types.ObjectId
}, { timestamps: true });

// Static method for creating or updating a notification
NotificationSchema.statics.insertNotification = async (To, From, notificationType, entityId) => {
    try {
        let data = {
            To: To,
            From: From,
            notificationType: notificationType,
            entityId: entityId
        };

        // Delete any existing notification with the same data to prevent duplicates
        await Notification.deleteOne(data);

        // Create or update the notification based on the existing data
        return Notification.create(data);
    } catch (error) {
        // Handle any errors that occur during the process
        console.error("Error processing notification:", error);
    }
};

// Create and export the Notification model
const Notification = mongoose.model('Notification', NotificationSchema);

export default Notification;
