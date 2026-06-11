import express from 'express';
import cors from 'cors';
import { authRouter } from './routes/auth.routes.js';
import { userRouter } from './routes/user.routes.js';
import { categoryRouter } from './routes/category.routes.js';
import { productRouter } from './routes/product.routes.js';
import { warehouseRouter } from './routes/warehouse.routes.js';
import { receiptRouter } from './routes/receipt.routes.js';
import { deliveryRouter } from './routes/delivery.routes.js';
import { inventoryRouter } from './routes/inventory.routes.js';
import { stocktakeRouter } from './routes/stocktake.routes.js';
import { adjustmentRouter } from './routes/adjustment.routes.js';
import { incidentRouter } from './routes/incident.routes.js';
import { auditLogRouter } from './routes/auditLog.routes.js';
import { emailLogRouter }    from './routes/email-log.routes.js'; // [THÊM MỚI]
import { deliveryRequestRouter } from './routes/deliveryRequest.routes.js';
import { dashboardRouter }   from './routes/dashboard.routes.js'; // [THÊM MỚI v2.0]

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/categories', categoryRouter);
app.use('/api/v1/products', productRouter);
app.use('/api/v1/warehouses', warehouseRouter);
app.use('/api/v1/receipts', receiptRouter);
app.use('/api/v1/delivery-requests', deliveryRequestRouter);
app.use('/api/v1/deliveries', deliveryRouter);
app.use('/api/v1/inventory', inventoryRouter);
app.use('/api/v1/stocktakes', stocktakeRouter);
app.use('/api/v1/adjustments', adjustmentRouter);
app.use('/api/v1/incidents', incidentRouter);
app.use('/api/v1/audit-logs', auditLogRouter);
app.use('/api/v1/email-logs', emailLogRouter); // [THÊM MỚI]
app.use('/api/v1/dashboard', dashboardRouter); // [THÊM MỚI v2.0]

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
