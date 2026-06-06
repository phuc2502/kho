import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';
import { Category } from './category.model.js';

export const Product = sequelize.define('Product', {
  _id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  sku: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.STRING,
    allowNull: true
  },
  priceIn: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  priceOut: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0,
      isGreaterThanPriceIn(value) {
        if (parseFloat(value) <= parseFloat(this.priceIn)) {
          throw new Error('Giá bán ra (priceOut) phải lớn hơn giá nhập vào (priceIn)');
        }
      }
    }
  },
  unit: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'Cái'
  },
  categoryId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'category',
    references: {
      model: Category,
      key: '_id'
    }
  }
}, {
  timestamps: true
});

Product.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });
Category.hasMany(Product, { foreignKey: 'categoryId', as: 'products' });
