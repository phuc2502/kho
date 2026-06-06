import { Partner } from '../models/partner.model.js';

export const getPartners = async (req, res, next) => {
  try {
    const { type } = req.query;
    const query = type ? { type } : {};
    const partners = await Partner.findAll({
      where: query,
      order: [['name', 'ASC']]
    });
    res.json(partners);
  } catch (error) {
    next(error);
  }
};

export const createPartner = async (req, res, next) => {
  try {
    const { name, type, email, phone, address } = req.body;

    const partner = await Partner.create({
      name,
      type,
      email,
      phone,
      address
    });

    res.status(201).json(partner);
  } catch (error) {
    next(error);
  }
};

export const updatePartner = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, type, email, phone, address } = req.body;

    const partner = await Partner.findByPk(id);
    if (!partner) {
      return res.status(404).json({ message: 'Không tìm thấy đối tác' });
    }

    if (name) partner.name = name;
    if (type) partner.type = type;
    if (email !== undefined) partner.email = email;
    if (phone !== undefined) partner.phone = phone;
    if (address !== undefined) partner.address = address;

    await partner.save();
    res.json(partner);
  } catch (error) {
    next(error);
  }
};

export const deletePartner = async (req, res, next) => {
  try {
    const { id } = req.params;
    await Partner.destroy({ where: { _id: id } });
    res.json({ message: 'Xóa đối tác thành công' });
  } catch (error) {
    next(error);
  }
};
