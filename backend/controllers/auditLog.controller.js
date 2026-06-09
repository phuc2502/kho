import { AuditLog } from '../models/auditLog.model.js';
import { User } from '../models/user.model.js';

export const getAuditLogs = async (req, res, next) => {
  try {
    const { limit = 100, offset = 0 } = req.query;
    const logs = await AuditLog.findAll({
      include: [
        { model: User, as: 'user', attributes: ['username', 'role'] }
      ],
      order: [['createdAt', 'DESC']],
      limit: Math.min(Number(limit), 500),
      offset: Number(offset)
    });
    const total = await AuditLog.count();
    res.json({ data: logs, total });
  } catch (error) {
    next(error);
  }
};
