import { Category } from '../models/category.model.js';

export const getCategories = async (req, res, next) => {
  try {
    const categories = await Category.findAll({ order: [['name', 'ASC']] });
    res.json(categories);
  } catch (error) {
    next(error);
  }
};

export const createCategory = async (req, res, next) => {
  try {
    const { name, description } = req.body;

    const exists = await Category.findOne({ where: { name } });
    if (exists) {
      return res.status(400).json({ message: 'Danh mục này đã tồn tại' });
    }

    const category = await Category.create({ name, description });
    res.status(201).json(category);
  } catch (error) {
    next(error);
  }
};

export const updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const category = await Category.findByPk(id);
    if (!category) {
      return res.status(404).json({ message: 'Không tìm thấy danh mục' });
    }

    if (name && name !== category.name) {
      const exists = await Category.findOne({ where: { name } });
      if (exists) {
        return res.status(400).json({ message: 'Tên danh mục này đã tồn tại' });
      }
      category.name = name;
    }

    if (description !== undefined) category.description = description;

    await category.save();
    res.json(category);
  } catch (error) {
    next(error);
  }
};

export const deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    await Category.destroy({ where: { _id: id } });
    res.json({ message: 'Xóa danh mục thành công' });
  } catch (error) {
    next(error);
  }
};
