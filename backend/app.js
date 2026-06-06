import express from 'express';
import cors from 'cors';
import { authRouter } from './routes/auth.routes.js';
import { userRouter } from './routes/user.routes.js';
import { categoryRouter } from './routes/category.routes.js';
import { productRouter } from './routes/product.routes.js';
import { warehouseRouter } from './routes/warehouse.routes.js';
import { partnerRouter } from './routes/partner.routes.js';
import { receiptRouter } from './routes/receipt.routes.js';
import { deliveryRouter } from './routes/delivery.routes.js';
import { inventoryRouter } from './routes/inventory.routes.js';

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/categories', categoryRouter);
app.use('/api/v1/products', productRouter);
app.use('/api/v1/warehouses', warehouseRouter);
app.use('/api/v1/partners', partnerRouter);
app.use('/api/v1/receipts', receiptRouter);
app.use('/api/v1/deliveries', deliveryRouter);
app.use('/api/v1/inventory', inventoryRouter);

// Base route
app.get('/', (req, res) => {
  res.json({ message: 'Warehouse MVC API is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error'
  });
});

export default app;
