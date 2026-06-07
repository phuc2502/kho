import { Incident, IncidentItem } from '../models/incident.model.js';
import { Product } from '../models/product.model.js';
import { User } from '../models/user.model.js';
import { sequelize } from '../config/db.js';
import { recordAudit } from '../utils/audit.helper.js';

const incidentIncludes = [
  { model: User, as: 'createdByUser', attributes: ['username', 'role'] },
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
    const { type, refType, refId, action, note, items } = req.body;

    const count = await Incident.count();
    const code = `INC-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;

    const incident = await Incident.create({
      code,
      type,
      refType: refType || null,
      refId: refId || null,
      action: action || 'pending',
      status: 'open',
      note: note || null,
      createdByUserId: req.user._id
    }, { transaction: t });

    if (items && items.length > 0) {
      for (const item of items) {
        await IncidentItem.create({
          incidentId: incident._id,
          productId: item.productId,
          quantity: Number(item.quantity) || 1
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
  } catch (error) {
    if (!t.finished) await t.rollback();
    next(error);
  }
};

export const updateIncident = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, action, note, items } = req.body;
    const t = await sequelize.transaction();

    const incident = await Incident.findByPk(id);
    if (!incident) {
      await t.rollback();
      return res.status(404).json({ message: 'Không tìm thấy sự cố' });
    }

    if (status) incident.status = status;
    if (action) incident.action = action;
    if (note !== undefined) incident.note = note;

    if (items !== undefined) {
      await IncidentItem.destroy({ where: { incidentId: id }, transaction: t });
      for (const item of items) {
        await IncidentItem.create({
          incidentId: id,
          productId: item.productId,
          quantity: Number(item.quantity) || 1
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
      payload: { code: incident.code, status, action }
    });

    const populated = await Incident.findByPk(id, { include: incidentIncludes });
    res.json(populated);
  } catch (error) {
    next(error);
  }
};

export const deleteIncident = async (req, res, next) => {
  try {
    const { id } = req.params;
    const incident = await Incident.findByPk(id);
    if (!incident) {
      return res.status(404).json({ message: 'Không tìm thấy sự cố' });
    }
    if (incident.status === 'resolved' || incident.status === 'closed') {
      return res.status(400).json({ message: 'Không thể xóa sự cố đã được xử lý/đóng' });
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

    res.json({ message: 'Xóa sự cố thành công' });
  } catch (error) {
    next(error);
  }
};
