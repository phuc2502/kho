// [THÊM MỚI] — Controller cho EmailLogs: thống kê + danh sách + xóa thất bại
import { EmailLog } from '../models/email-log.model.js';
import { Op } from 'sequelize';

// ——— Thống kê 24 giờ gần nhất ———
export const getEmailStats = async (req, res, next) => {
  try {
    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [success, failed, total] = await Promise.all([
      EmailLog.count({ where: { status: 'success', createdAt: { [Op.gte]: since24h } } }),
      EmailLog.count({ where: { status: 'failed',  createdAt: { [Op.gte]: since24h } } }),
      EmailLog.count()
    ]);

    res.json({ success, failed, total });
  } catch (err) {
    next(err);
  }
};

// ——— Danh sách nhật ký (có phân trang + lọc theo type/status) ———
export const getEmailLogs = async (req, res, next) => {
  try {
    const { type, status, page = 1, limit = 50 } = req.query;
    const where = {};
    if (type   && type   !== 'all') where.type   = type;
    if (status && status !== 'all') where.status = status;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows } = await EmailLog.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit:  parseInt(limit),
      offset
    });

    res.json({ total: count, page: parseInt(page), logs: rows });
  } catch (err) {
    next(err);
  }
};

// ——— Xóa tất cả bản ghi email thất bại ———
export const deleteFailedLogs = async (req, res, next) => {
  try {
    const deleted = await EmailLog.destroy({ where: { status: 'failed' } });
    res.json({
      message: `Đã xóa ${deleted} bản ghi email thất bại`,
      deleted
    });
  } catch (err) {
    next(err);
  }
};

// ——— Xóa một bản ghi cụ thể ———
export const deleteEmailLog = async (req, res, next) => {
  try {
    const { logId } = req.params;
    const log = await EmailLog.findByPk(logId);
    if (!log) return res.status(404).json({ message: 'Không tìm thấy bản ghi' });
    await log.destroy();
    res.json({ message: 'Đã xóa bản ghi' });
  } catch (err) {
    next(err);
  }
};
