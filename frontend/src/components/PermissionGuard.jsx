import React from 'react';
import { useAuth } from '../controllers/auth.context.jsx';

export const PermissionGuard = ({ permission, children, fallback = null }) => {
  const { hasPermission } = useAuth();

  if (hasPermission(permission)) {
    return <>{children}</>;
  }

  return fallback;
};
