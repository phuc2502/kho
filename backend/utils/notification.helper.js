/**
 * Notification Helper — gửi thông báo nội bộ cho người dùng
 *
 * Sử dụng tương tự recordAudit() — gọi fire-and-forget, không bao giờ block luồng chính.
 */
import { Notification } from '../models/notification.model.js';
import { User } from '../models/user.model.js';
import { Op } from 'sequelize';

/**
 * Gửi thông báo cho 1 người dùng cụ thể.
 * @param {number} userId - ID người nhận
 * @param {object} data - { title, content, type, refId }
 */
export const createNotificationForUser = async (userId, { title, content, type, refId }) => {
  try {
    await Notification.create({
      userId,
      title,
      content: content || null,
      type: type || 'system',
      refId: refId || null,
      isRead: false
    });
  } catch (err) {
    // Notification should never break the main flow
    console.error('[Notification] Failed to create notification:', err.message);
  }
};

/**
 * Gửi thông báo hàng loạt — tìm người dùng theo vai trò, quyền hạn, hoặc danh sách ID.
 *
 * @param {object} params
 * @param {string[]} [params.targetRoles]       - Danh sách vai trò cần nhận (e.g. ['Admin', 'QuanLyKho'])
 * @param {number[]} [params.targetUserIds]      - Danh sách ID người dùng cụ thể
 * @param {number}   [params.excludeUserId]      - Loại trừ user này (thường là người thao tác, không cần tự nhận)
 * @param {string}   params.title                - Tiêu đề thông báo
 * @param {string}   [params.content]            - Nội dung chi tiết
 * @param {string}   params.type                 - Loại thông báo (receipt, delivery, ...)
 * @param {number}   [params.refId]              - ID tham chiếu
 */
export const sendNotification = async ({
  targetRoles,
  targetUserIds,
  excludeUserId,
  title,
  content,
  type,
  refId
}) => {
  try {
    // Thu thập tất cả userId cần nhận thông báo (dùng Set để loại trùng)
    const recipientIds = new Set();

    // 1. Tìm theo vai trò
    if (targetRoles && targetRoles.length > 0) {
      const users = await User.findAll({
        where: {
          role: { [Op.in]: targetRoles },
          isActive: true
        },
        attributes: ['_id']
      });
      users.forEach(u => recipientIds.add(u._id));
    }

    // 2. Thêm danh sách ID cụ thể
    if (targetUserIds && targetUserIds.length > 0) {
      targetUserIds.forEach(id => recipientIds.add(id));
    }

    // 3. Loại trừ người thao tác (không tự gửi cho chính mình)
    if (excludeUserId) {
      recipientIds.delete(excludeUserId);
    }

    // 4. Không có ai để gửi thì bỏ qua
    if (recipientIds.size === 0) return;

    // 5. Bulk create thông báo
    const notifications = Array.from(recipientIds).map(userId => ({
      userId,
      title,
      content: content || null,
      type: type || 'system',
      refId: refId || null,
      isRead: false
    }));

    await Notification.bulkCreate(notifications);
  } catch (err) {
    // Notification should never break the main flow
    console.error('[Notification] Failed to send notifications:', err.message);
  }
};
