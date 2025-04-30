import { Notification } from "@/lib/slices/dataSlice";

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export const fetchNotifications = async (page = 1, limit = 10): Promise<{ notifications: Notification[], pagination: any }> => {
  try {
    const response = await fetch(`${API_URL}/notifications?page=${page}&limit=${limit}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch notifications");
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error("Error fetching notifications:", error);
    throw error;
  }
};

export const fetchUnreadCount = async (): Promise<number> => {
  try {
    const response = await fetch(`${API_URL}/notifications/unread-count`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch unread count");
    }

    const data = await response.json();
    return data.data.count;
  } catch (error) {
    console.error("Error fetching unread count:", error);
    return 0;
  }
};

export const markNotificationsAsRead = async (notificationIds: string[]): Promise<void> => {
  try {
    const response = await fetch(`${API_URL}/notifications/mark-read`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
      },
      body: JSON.stringify({ notificationIds }),
    });

    if (!response.ok) {
      throw new Error("Failed to mark notifications as read");
    }
  } catch (error) {
    console.error("Error marking notifications as read:", error);
    throw error;
  }
};

export const deleteNotification = async (notificationId: string): Promise<void> => {
  try {
    const response = await fetch(`${API_URL}/notifications/${notificationId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to delete notification");
    }
  } catch (error) {
    console.error("Error deleting notification:", error);
    throw error;
  }
};
