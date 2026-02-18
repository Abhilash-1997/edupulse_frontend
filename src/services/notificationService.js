import api from '@/config/axiosConfig';

// TODO: No NotificationController exists in the Spring Boot backend yet.
// These endpoints will return 404 until the backend is implemented.
// Backend needs: GET /notifications, PATCH /notifications/{id}/read
/**
 * Get my notifications
 * @returns {Promise<Object>} Response
 */
const getMyNotifications = async () => {
  try {
    const response = await api.get('/notifications');
    return response;
  } catch (error) {
    return error.response;
  }
};

/**
 * Mark notification as read
 * @param {string} id - Notification ID
 * @returns {Promise<Object>} Response
 */
const markAsRead = async (id) => {
  try {
    const response = await api.patch(`/notifications/${id}/read`);
    return response;
  } catch (error) {
    return error.response;
  }
};

const notificationService = {
  getMyNotifications,
  markAsRead,
};

export default notificationService;
