import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './controllers/auth.context.jsx';
import { LoginPage } from './views/LoginPage.jsx';
import { DashboardLayout } from './views/DashboardLayout.jsx';
import { InventoryPage } from './views/InventoryPage.jsx';
import { ReceiptsPage } from './views/ReceiptsPage.jsx';
import { DeliveriesPage } from './views/DeliveriesPage.jsx';
import { ProductsPage } from './views/ProductsPage.jsx';
import { WarehouseStructurePage } from './views/WarehouseStructurePage.jsx';
import { UserManagementPage } from './views/UserManagementPage.jsx';
import { StocktakesPage } from './views/StocktakesPage.jsx';
import { StocktakeMinutesPage } from './views/StocktakeMinutesPage.jsx';
import { StocktakeReportsPage } from './views/StocktakeReportsPage.jsx';
import { AdjustmentsPage } from './views/AdjustmentsPage.jsx';
import { IncidentsPage } from './views/IncidentsPage.jsx';
import { AuditLogsPage } from './views/AuditLogsPage.jsx';
import { DashboardPage } from './views/DashboardPage.jsx';
import { ReportsPage } from './views/ReportsPage.jsx';
import { ScannerPage } from './views/ScannerPage.jsx';
import { ProfilePage } from './views/ProfilePage.jsx';
import { ForgotPasswordPage } from './views/ForgotPasswordPage.jsx';
import { ResetPasswordPage } from './views/ResetPasswordPage.jsx';
import { EmailLogsPage } from './views/EmailLogsPage.jsx'; // [THÊM MỚI]
import { ForceChangePasswordPage } from './views/ForceChangePasswordPage.jsx';
import { DeliveryRequestsPage } from './views/DeliveryRequestsPage.jsx';
import './index.css';

// Guard for authenticated routes
const ProtectedRoute = ({ permission, children }) => {
  const { user, loading, hasPermission } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#f7f5f2' }}>
        <span className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#0061fe', borderTopColor: 'transparent' }}></span>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Nếu phải đổi MK bắt buộc → chặn toàn bộ route, chuyển đến trang đổi MK
  if (user.mustChangePassword && location.pathname !== '/force-change-password') {
    return <Navigate to="/force-change-password" replace />;
  }

  if (permission && !hasPermission(permission)) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <span className="text-5xl">🚫</span>
        <h3 className="text-xl font-bold text-slate-800 mt-4">Truy cập bị từ chối</h3>
        <p className="text-sm text-slate-500 mt-2">Bạn không có quyền truy cập chức năng này.</p>
      </div>
    );
  }

  return children;
};

const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          {/* Buộc đổi MK — cần đăng nhập, không cần DashboardLayout */}
          <Route path="/force-change-password" element={
            <ProtectedRoute>
              <ForceChangePasswordPage />
            </ProtectedRoute>
          } />
          
          <Route path="/" element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }>
            <Route index element={<DashboardPage />} />
            
            <Route path="inventory" element={
              <ProtectedRoute permission="inventory:read">
                <InventoryPage />
              </ProtectedRoute>
            } />
            
            <Route path="receipts" element={
              <ProtectedRoute permission="receipt:read">
                <ReceiptsPage />
              </ProtectedRoute>
            } />
            
            <Route path="delivery-requests" element={
              <ProtectedRoute permission="delivery-request:read">
                <DeliveryRequestsPage />
              </ProtectedRoute>
            } />

            <Route path="deliveries" element={
              <ProtectedRoute permission="delivery:read">
                <DeliveriesPage />
              </ProtectedRoute>
            } />
            
            <Route path="products" element={
              <ProtectedRoute permission="product:read">
                <ProductsPage />
              </ProtectedRoute>
            } />
            
            <Route path="warehouse" element={
              <ProtectedRoute permission="warehouse:read">
                <WarehouseStructurePage />
              </ProtectedRoute>
            } />
            
            <Route path="users" element={
              <ProtectedRoute permission="user:manage">
                <UserManagementPage />
              </ProtectedRoute>
            } />

            <Route path="stocktakes" element={
              <ProtectedRoute permission="stocktake:read">
                <StocktakesPage />
              </ProtectedRoute>
            } />

            <Route path="stocktake-minutes" element={
              <ProtectedRoute permission="stocktake:read">
                <StocktakeMinutesPage />
              </ProtectedRoute>
            } />

            <Route path="stocktake-reports" element={
              <ProtectedRoute permission="stocktake:read">
                <StocktakeReportsPage />
              </ProtectedRoute>
            } />

            <Route path="adjustments" element={
              <ProtectedRoute permission="adjustment:read">
                <AdjustmentsPage />
              </ProtectedRoute>
            } />

            <Route path="incidents" element={
              <ProtectedRoute permission="incident:read">
                <IncidentsPage />
              </ProtectedRoute>
            } />

            <Route path="audit-logs" element={
              <ProtectedRoute permission="audit:read">
                <AuditLogsPage />
              </ProtectedRoute>
            } />

            {/* [THÊM MỚI] Nhật ký email — chỉ Admin */}
            <Route path="email-logs" element={
              <ProtectedRoute permission="emaillog:read">
                <EmailLogsPage />
              </ProtectedRoute>
            } />

            <Route path="reports" element={
              <ProtectedRoute>
                <ReportsPage />
              </ProtectedRoute>
            } />

            <Route path="scanner" element={
              <ProtectedRoute>
                <ScannerPage />
              </ProtectedRoute>
            } />

            <Route path="profile" element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            } />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
