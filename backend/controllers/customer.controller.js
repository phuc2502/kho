import { Customer } from '../models/customer.model.js';
import { recordAudit } from '../utils/audit.helper.js';

// ── GET /api/v1/customers ────────────────────────────────────────
export const getCustomers = async (req, res, next) => {
  try {
    const customers = await Customer.findAll({ order: [['name', 'ASC']] });
    res.json(customers);
  } catch (error) { next(error); }
};

// ── GET /api/v1/customers/:id ────────────────────────────────────
export const getCustomerById = async (req, res, next) => {
  try {
    const customer = await Customer.findByPk(req.params.id);
    if (!customer) return res.status(404).json({ message: 'Không tìm thấy khách hàng' });
    res.json(customer);
  } catch (error) { next(error); }
};

// ── POST /api/v1/customers ───────────────────────────────────────
export const createCustomer = async (req, res, next) => {
  try {
    const { name, phone, address } = req.body;
    if (!name?.trim()) return res.status(400).json({ message: 'Tên khách hàng là bắt buộc' });

    const count = await Customer.count();
    const d = new Date();
    const ds = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
    const code = `KH-${ds}-${String(count + 1).padStart(4, '0')}`;

    const customer = await Customer.create({
      code,
      name:    name.trim(),
      phone:   phone?.trim()   || null,
      address: address?.trim() || null,
    });

    await recordAudit({
      userId: req.user._id, username: req.user.username,
      action: 'customer.create', entity: 'customer', entityId: customer._id,
      payload: { code, name: customer.name },
    });

    res.status(201).json(customer);
  } catch (error) { next(error); }
};

// ── PUT /api/v1/customers/:id ────────────────────────────────────
export const updateCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.findByPk(req.params.id);
    if (!customer) return res.status(404).json({ message: 'Không tìm thấy khách hàng' });

    const { name, phone, address } = req.body;
    if (name?.trim())       customer.name    = name.trim();
    if (phone !== undefined) customer.phone   = phone?.trim()   || null;
    if (address !== undefined) customer.address = address?.trim() || null;
    await customer.save();

    await recordAudit({
      userId: req.user._id, username: req.user.username,
      action: 'customer.update', entity: 'customer', entityId: customer._id,
      payload: { code: customer.code, name: customer.name },
    });

    res.json(customer);
  } catch (error) { next(error); }
};
