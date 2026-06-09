/**
 * Audit Helper - ghi nhật ký hoạt động hệ thống
 */
import { AuditLog } from '../models/auditLog.model.js';

/**
 * Ghi một bản ghi audit log
 * @param {object} params
 * @param {string} params.action - Hành động (ví dụ: 'receipt.create', 'delivery.approve')
 * @param {string} [params.entity] - Tên model/thực thể
 * @param {number} [params.entityId] - ID của thực thể
 * @param {number} [params.userId] - ID người thực hiện
 * @param {string} [params.username] - Tên người thực hiện (backup nếu userId bị null)
 * @param {object} [params.payload] - Thông tin bổ sung (sẽ được lưu dưới dạng JSON)
 */
export const recordAudit = async ({ action, entity, entityId, userId, username, payload }) => {
  try {
    await AuditLog.create({
      action,
      entity: entity || null,
      entityId: entityId || null,
      userId: userId || null,
      username: username || null,
      payload: payload || null
    });
  } catch (err) {
    // Audit logging should never break the main flow
    console.error('[AuditLog] Failed to record audit:', err.message);
  }
};

/**
 * Middleware để tự động ghi audit log từ req.user
 * Sử dụng sau authenticate middleware
 */
export const auditMiddleware = (action, entity) => {
  return async (req, res, next) => {
    const originalJson = res.json.bind(res);
    res.json = function (data) {
      if (res.statusCode < 400) {
        const entityId = req.params?.id || data?._id || data?.id || null;
        recordAudit({
          action,
          entity,
          entityId: entityId ? Number(entityId) : null,
          userId: req.user?._id || null,
          username: req.user?.username || null,
          payload: { method: req.method, path: req.path }
        });
      }
      return originalJson(data);
    };
    next();
  };
};
