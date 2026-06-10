import { Product } from '../models/product.model.js';
import { Category } from '../models/category.model.js';
import { recordAudit } from '../utils/audit.helper.js';

const productInclude = [{ model: Category, as: 'category', attributes: ['name'] }];

export const getProducts = async (req, res, next) => {
  try {
    const products = await Product.findAll({ include: productInclude, order: [['sku', 'ASC']] });
    res.json(products);
  } catch (error) {
    next(error);
  }
};

export const createProduct = async (req, res, next) => {
  try {
    const { sku, name, description, priceIn, priceOut, unit, category } = req.body;

    const skuUpper = sku?.toUpperCase();
    const exists = await Product.findOne({ where: { sku: skuUpper } });
    if (exists) return res.status(400).json({ message: `Mã SKU ${skuUpper} này đã được sử dụng` });

    if (Number(priceOut) <= Number(priceIn))
      return res.status(400).json({ message: 'Giá bán ra (priceOut) phải lớn hơn giá nhập vào (priceIn)' });

    const product = await Product.create({ sku: skuUpper, name, description, priceIn, priceOut, unit, categoryId: category });
    const populated = await Product.findByPk(product._id, { include: productInclude });

    await recordAudit({ action: 'product.create', userId: req.user?._id, username: req.user?.username, entity: 'product', entityId: product._id, payload: { sku: skuUpper, name } });
    res.status(201).json(populated);
  } catch (error) {
    next(error);
  }
};

export const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { sku, name, description, priceIn, priceOut, unit, category } = req.body;

    const product = await Product.findByPk(id);
    if (!product) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });

    if (sku) {
      const skuUpper = sku.toUpperCase();
      if (skuUpper !== product.sku) {
        const exists = await Product.findOne({ where: { sku: skuUpper } });
        if (exists) return res.status(400).json({ message: `Mã SKU ${skuUpper} này đã được sử dụng` });
        product.sku = skuUpper;
      }
    }

    const finalPriceIn = priceIn !== undefined ? Number(priceIn) : Number(product.priceIn);
    const finalPriceOut = priceOut !== undefined ? Number(priceOut) : Number(product.priceOut);
    if (finalPriceOut <= finalPriceIn)
      return res.status(400).json({ message: 'Giá bán ra (priceOut) phải lớn hơn giá nhập vào (priceIn)' });

    if (name) product.name = name;
    if (description !== undefined) product.description = description;
    product.priceIn = finalPriceIn;
    product.priceOut = finalPriceOut;
    if (unit) product.unit = unit;
    if (category) product.categoryId = category;

    await product.save();
    const populated = await Product.findByPk(product._id, { include: productInclude });

    await recordAudit({ action: 'product.update', userId: req.user?._id, username: req.user?.username, entity: 'product', entityId: Number(id), payload: { sku: product.sku, name: product.name } });
    res.json(populated);
  } catch (error) {
    next(error);
  }
};

export const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await Product.findByPk(id);
    await Product.destroy({ where: { _id: id } });
    await recordAudit({ action: 'product.delete', userId: req.user?._id, username: req.user?.username, entity: 'product', entityId: Number(id), payload: { sku: product?.sku } });
    res.json({ message: 'Xóa sản phẩm thành công' });
  } catch (error) {
    next(error);
  }
};
