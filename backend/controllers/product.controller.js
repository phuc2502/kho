import { Product } from '../models/product.model.js';
import { Category } from '../models/category.model.js';

export const getProducts = async (req, res, next) => {
  try {
    const products = await Product.findAll({
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['name']
        }
      ],
      order: [['sku', 'ASC']]
    });
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
    if (exists) {
      return res.status(400).json({ message: `Mã SKU ${skuUpper} này đã được sử dụng` });
    }

    if (Number(priceOut) <= Number(priceIn)) {
      return res.status(400).json({ message: 'Giá bán ra (priceOut) phải lớn hơn giá nhập vào (priceIn)' });
    }

    const product = await Product.create({
      sku: skuUpper,
      name,
      description,
      priceIn,
      priceOut,
      unit,
      categoryId: category // Mapped field name
    });

    const populated = await Product.findByPk(product._id, {
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['name']
        }
      ]
    });
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
    if (!product) {
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
    }

    if (sku) {
      const skuUpper = sku.toUpperCase();
      if (skuUpper !== product.sku) {
        const exists = await Product.findOne({ where: { sku: skuUpper } });
        if (exists) {
          return res.status(400).json({ message: `Mã SKU ${skuUpper} này đã được sử dụng` });
        }
        product.sku = skuUpper;
      }
    }

    const finalPriceIn = priceIn !== undefined ? Number(priceIn) : Number(product.priceIn);
    const finalPriceOut = priceOut !== undefined ? Number(priceOut) : Number(product.priceOut);

    if (finalPriceOut <= finalPriceIn) {
      return res.status(400).json({ message: 'Giá bán ra (priceOut) phải lớn hơn giá nhập vào (priceIn)' });
    }

    if (name) product.name = name;
    if (description !== undefined) product.description = description;
    product.priceIn = finalPriceIn;
    product.priceOut = finalPriceOut;
    if (unit) product.unit = unit;
    if (category) product.categoryId = category;

    await product.save();
    
    const populated = await Product.findByPk(product._id, {
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['name']
        }
      ]
    });
    res.json(populated);
  } catch (error) {
    next(error);
  }
};

export const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    await Product.destroy({ where: { _id: id } });
    res.json({ message: 'Xóa sản phẩm thành công' });
  } catch (error) {
    next(error);
  }
};
