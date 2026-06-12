import { Incident, IncidentItem } from '../models/incident.model.js';
import { Product } from '../models/product.model.js';
import { User } from '../models/user.model.js';
import { sequelize } from '../config/db.js';
import { recordAudit } from '../utils/audit.helper.js';
import { sendNotification, createNotificationForUser } from '../utils/notification.helper.js';

const TYPE_LABELS = {
  hang_loi:    'Hàng lỗi (QC)',
  hang_thieu:  'Hàng thiếu (NVK)'
};

const incidentIncludes = [
  { model: User, as: 'createdByUser',  attributes: ['username', 'fullName', 'role'] },
  { model: User, as: 'approvedByUser', attributes: ['username', 'fullName', 'role'] },
  {
    model: IncidentItem,
    as: 'items',
    include: [
      { model: Product, as: 'product', attributes: ['sku', 'name', 'unit'] }
    ]
  }
];

export const getIncidents = async (req, res, next) => {
  try {
    const incidents = await Incident.findAll({
      include: incidentIncludes,
      order: [['createdAt', 'DESC']]
    });
    res.json(incidents);
  } catch (error) {
    next(error);
  }
};

export const createIncident = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { type, refType, refId, note, items } = req.body;

    if (!['hang_loi', 'hang_thieu'].includes(type)) {
      await t.rollback();
      return res.status(400).json({ message: 'Loại sự cố không hợp lệ. Chỉ chấp nhận: hang_loi, hang_thieu' });
    }

    const count = await Incident.count();
    const code = `INC-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;

    const incident = await Incident.create({
      code,
      type,
      refType: refType || 'receipt',
      refId: refId || null,
      status: 'pending_approval',
      note: note || null,
      createdByUserId: req.user._id
    }, { transaction: t });

    if (items && items.length > 0) {
      for (const item of items) {
        await IncidentItem.create({
          incidentId: incident._id,
          productId: item.productId,
          quantity: Number(item.quantity) || 1,
          reason: item.reason || null
        }, { transaction: t });
      }
    }

    await t.commit();

    await recordAudit({
      action: 'incident.create',
      entity: 'Incident',
      entityId: incident._id,
      userId: req.user._id,
      username: req.user.username,
      payload: { code, type, refType, refId }
    });

    const populated = await Incident.findByPk(incident._id, { include: incidentIncludes });
    res.status(201).json(populated);

    sendNotification({
      targetRoles: ['Admin', 'QuanLyKho'],
      excludeUserId: req.user._id,
      title: `Báo cáo sự cố mới: ${code} (${TYPE_LABELS[type] || type})`,
      content: `${req.user.fullName || req.user.username} vừa lập báo cáo sự cố ${code} loại "${TYPE_LABELS[type] || type}". Vui lòng xem xét và phê duyệt.`,
      type: 'incident',
      refId: incident._id
    });
  } catch (error) {
    if (!t.finished) await t.rollback();
    next(error);
  }
};

export const approveIncident = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;

    const incident = await Incident.findByPk(id, { transaction: t });
    if (!incident) {
      await t.rollback();
      return res.status(404).json({ message: 'Không tìm thấy báo cáo sự cố' });
    }
    if (incident.status !== 'pending_approval') {
      await t.rollback();
      return res.status(400).json({ message: 'Chỉ có thể phê duyệt báo cáo đang ở trạng thái chờ duyệt' });
    }

    await incident.update({
      status: 'approved',
      approvedByUserId: req.user._id,
      approvedAt: new Date()
    }, { transaction: t });

    await t.commit();

    await recordAudit({
      action: 'incident.approve',
      entity: 'Incident',
      entityId: incident._id,
      userId: req.user._id,
      username: req.user.username,
      payload: { code: incident.code }
    });

    const populated = await Incident.findByPk(id, { include: incidentIncludes });
    res.json(populated);

    createNotificationForUser(incident.createdByUserId, {
      title: `Báo cáo sự cố ${incident.code} đã được phê duyệt`,
      content: `${req.user.fullName || req.user.username} đã phê duyệt báo cáo sự cố ${incident.code}.`,
      type: 'incident',
      refId: Number(id)
    });
  } catch (error) {
    if (!t.finished) await t.rollback();
    next(error);
  }
};

export const rejectIncident = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason || !reason.trim()) {
      await t.rollback();
      return res.status(400).json({ message: 'Vui lòng nhập lý do từ chối' });
    }

    const incident = await Incident.findByPk(id, { transaction: t });
    if (!incident) {
      await t.rollback();
      return res.status(404).json({ message: 'Không tìm thấy báo cáo sự cố' });
    }
    if (incident.status !== 'pending_approval') {
      await t.rollback();
      return res.status(400).json({ message: 'Chỉ có thể từ chối báo cáo đang ở trạng thái chờ duyệt' });
    }

    await incident.update({
      status: 'rejected',
      rejectNote: reason.trim(),
      approvedByUserId: req.user._id,
      approvedAt: new Date()
    }, { transaction: t });

    await t.commit();

    await recordAudit({
      action: 'incident.reject',
      entity: 'Incident',
      entityId: incident._id,
      userId: req.user._id,
      username: req.user.username,
      payload: { code: incident.code, reason: reason.trim() }
    });

    const populated = await Incident.findByPk(id, { include: incidentIncludes });
    res.json(populated);

    createNotificationForUser(incident.createdByUserId, {
      title: `Báo cáo sự cố ${incident.code} bị từ chối`,
      content: `${req.user.fullName || req.user.username} đã từ chối báo cáo sự cố ${incident.code}. Lý do: ${reason.trim()}`,
      type: 'incident',
      refId: Number(id)
    });
  } catch (error) {
    if (!t.finished) await t.rollback();
    next(error);
  }
};

export const updateIncident = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { note, items } = req.body;

    const incident = await Incident.findByPk(id, { transaction: t });
    if (!incident) {
      await t.rollback();
      return res.status(404).json({ message: 'Không tìm thấy báo cáo sự cố' });
    }
    if (incident.status !== 'pending_approval') {
      await t.rollback();
      return res.status(400).json({ message: 'Chỉ có thể chỉnh sửa báo cáo đang chờ duyệt' });
    }

    if (note !== undefined) incident.note = note;

    if (items !== undefined) {
      await IncidentItem.destroy({ where: { incidentId: id }, transaction: t });
      for (const item of items) {
        await IncidentItem.create({
          incidentId: id,
          productId: item.productId,
          quantity: Number(item.quantity) || 1,
          reason: item.reason || null
        }, { transaction: t });
      }
    }

    await incident.save({ transaction: t });
    await t.commit();

    await recordAudit({
      action: 'incident.update',
      entity: 'Incident',
      entityId: incident._id,
      userId: req.user._id,
      username: req.user.username,
      payload: { code: incident.code }
    });

    const populated = await Incident.findByPk(id, { include: incidentIncludes });
    res.json(populated);
  } catch (error) {
    if (!t.finished) await t.rollback();
    next(error);
  }
};

export const deleteIncident = async (req, res, next) => {
  try {
    const { id } = req.params;
    const incident = await Incident.findByPk(id);
    if (!incident) {
      return res.status(404).json({ message: 'Không tìm thấy báo cáo sự cố' });
    }
    if (incident.status !== 'pending_approval') {
      return res.status(400).json({ message: 'Chỉ có thể xóa báo cáo đang chờ duyệt' });
    }

    await IncidentItem.destroy({ where: { incidentId: id } });
    await Incident.destroy({ where: { _id: id } });

    await recordAudit({
      action: 'incident.delete',
      entity: 'Incident',
      entityId: Number(id),
      userId: req.user._id,
      username: req.user.username,
      payload: { code: incident.code }
    });

    res.json({ message: 'Xóa báo cáo sự cố thành công' });
  } catch (error) {
    next(error);
  }
};
