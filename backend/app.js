import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { authRouter } from './routes/auth.routes.js';
import { userRouter } from './routes/user.routes.js';
import { categoryRouter } from './routes/category.routes.js';
import { productRouter } from './routes/product.routes.js';
import { warehouseRouter } from './routes/warehouse.routes.js';
import { receiptRouter } from './routes/receipt.routes.js';
import { deliveryRouter } from './routes/delivery.routes.js';
import { inventoryRouter } from './routes/inventory.routes.js';
import { stocktakeRouter } from './routes/stocktake.routes.js';
import { stocktakeMinutesRouter } from './routes/stocktakeMinutes.routes.js';
import { stocktakeReportRouter } from './routes/stocktakeReport.routes.js';
import { adjustmentRouter } from './routes/adjustment.routes.js';
import { incidentRouter } from './routes/incident.routes.js';
import { auditLogRouter } from './routes/auditLog.routes.js';
import { emailLogRouter }    from './routes/email-log.routes.js'; // [THÊM MỚI]
import { deliveryRequestRouter } from './routes/deliveryRequest.routes.js';
import { dashboardRouter }   from './routes/dashboard.routes.js'; // [THÊM MỚI v2.0]
import { stockCardRouter }    from './routes/stockCard.routes.js'; // [THÊM MỚI]
import { customerRouter }     from './routes/customer.routes.js';
import { notificationRouter } from './routes/notification.routes.js'; // [THÊM MỚI — Thông báo]

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
app.use('/api/v1/stock-cards', stockCardRouter); // [THÊM MỚI]
app.use('/api/v1/stocktakes', stocktakeRouter);
app.use('/api/v1/stocktake-minutes', stocktakeMinutesRouter);
app.use('/api/v1/stocktake-reports', stocktakeReportRouter);
app.use('/api/v1/adjustments', adjustmentRouter);
app.use('/api/v1/incidents', incidentRouter);
app.use('/api/v1/audit-logs', auditLogRouter);
app.use('/api/v1/email-logs', emailLogRouter); // [THÊM MỚI]
app.use('/api/v1/dashboard', dashboardRouter); // [THÊM MỚI v2.0]
app.use('/api/v1/customers', customerRouter);
app.use('/api/v1/notifications', notificationRouter); // [THÊM MỚI — Thông báo]

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Swagger Documentation
app.get('/api/v1/swagger.yaml', (req, res) => {
  res.sendFile(path.join(__dirname, 'swagger.yaml'));
});

app.get('/api-docs', (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Warehouse Management API Docs</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
  <link rel="icon" type="image/png" href="https://unpkg.com/swagger-ui-dist@5/favicon-32x32.png" />
  <style>
    html { box-sizing: border-box; overflow: -moz-scrollbars-vertical; overflow-y: scroll; }
    *, *:before, *:after { box-sizing: inherit; }
    body { margin: 0; background: #fafafa; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js" charset="UTF-8"></script>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-standalone-preset.js" charset="UTF-8"></script>
  <script>
    window.onload = () => {
      window.ui = SwaggerUIBundle({
        url: '/api/v1/swagger.yaml',
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        layout: "BaseLayout"
      });
    };
  </script>
</body>
</html>`);
});

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
