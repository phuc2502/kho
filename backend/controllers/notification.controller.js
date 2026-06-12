import { Notification } from '../models/notification.model.js';
import { Op } from 'sequelize';

// ── GET /api/v1/notifications ───────────────────────────────────
// Lấy danh sách thông báo của user hiện tại (mới nhất trước, giới hạn 50)
export const getNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.findAll({
      where: { userId: req.user._id },
      order: [['createdAt', 'DESC']],
      limit: 50
    });

    // Đếm số thông báo chưa đọc
    const unreadCount = await Notification.count({
      where: { userId: req.user._id, isRead: false }
    });

    res.json({ notifications, unreadCount });
  } catch (error) {
    next(error);
  }
};

// ── PATCH /api/v1/notifications/:id/read ────────────────────────
// Đánh dấu một thông báo là đã đọc
export const markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findOne({
      where: { _id: id, userId: req.user._id }
    });

    if (!notification) {
      return res.status(404).json({ message: 'Không tìm thấy thông báo' });
    }

    notification.isRead = true;
    await notification.save();

    res.json(notification);
  } catch (error) {
    next(error);
  }
};

// ── PATCH /api/v1/notifications/read-all ────────────────────────
// Đánh dấu toàn bộ thông báo của user hiện tại là đã đọc
export const markAllAsRead = async (req, res, next) => {
  try {
    await Notification.update(
      { isRead: true },
      { where: { userId: req.user._id, isRead: false } }
    );

    res.json({ message: 'Đã đánh dấu tất cả thông báo là đã đọc' });
  } catch (error) {
    next(error);
  }
};

// ── DELETE /api/v1/notifications/:id ────────────────────────────
// Xóa một thông báo (chỉ xóa thông báo của chính mình)
export const deleteNotification = async (req, res, next) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findOne({
      where: { _id: id, userId: req.user._id }
    });

    if (!notification) {
      return res.status(404).json({ message: 'Không tìm thấy thông báo' });
    }

    await notification.destroy();
    res.json({ message: 'Đã xóa thông báo' });
  } catch (error) {
    next(error);
  }
};
