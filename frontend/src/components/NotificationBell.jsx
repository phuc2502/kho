import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { NotificationModel } from '../models/notification.model.js';
import toast from 'react-hot-toast';
import {
  Bell, Check, CheckCheck, Trash2, X,
  ArrowDownLeft, ArrowUpRight, FileText,
  ArrowLeftRight, AlertTriangle, Settings, Package
} from 'lucide-react';

// ── Icon & điều hướng theo loại thông báo ───────────────────────
const TYPE_CONFIG = {
  receipt:          { icon: ArrowDownLeft,  color: '#10b981', label: 'Nhập kho',       path: '/receipts' },
  delivery_request: { icon: FileText,       color: '#8b5cf6', label: 'Yêu cầu xuất',   path: '/delivery-requests' },
  delivery:         { icon: ArrowUpRight,   color: '#3b82f6', label: 'Xuất kho',        path: '/deliveries' },
  adjustment:       { icon: ArrowLeftRight, color: '#f59e0b', label: 'Điều chỉnh',      path: '/adjustments' },
  incident:         { icon: AlertTriangle,  color: '#ef4444', label: 'Sự cố',           path: '/incidents' },
  stocktake:        { icon: Package,        color: '#06b6d4', label: 'Kiểm kê',         path: '/stocktakes' },
  system:           { icon: Settings,       color: '#6b7280', label: 'Hệ thống',        path: '/' },
};

// ── Tính thời gian tương đối ────────────────────────────────────
const timeAgo = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Vừa xong';
  if (mins < 60) return `${mins} phút trước`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} giờ trước`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days} ngày trước`;
  return new Date(dateStr).toLocaleDateString('vi-VN');
};

const POLL_INTERVAL = 15000; // 15 giây

export const NotificationBell = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount]     = useState(0);
  const [isOpen, setIsOpen]               = useState(false);
  const [loading, setLoading]             = useState(false);
  const dropdownRef = useRef(null);
  const maxSeenIdRef = useRef(0);

  // ── Fetch notifications ─────────────────────────────────────
  const fetchNotifications = useCallback(async (showToast = false) => {
    try {
      const data = await NotificationModel.getNotifications();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);

      // Toast cho thông báo mới (chỉ khi không phải lần đầu)
      if (showToast && data.notifications?.length > 0) {
        const newest = data.notifications[0];
        if (newest._id > maxSeenIdRef.current) {
          // Hiện toast cho mỗi thông báo mới
          const newOnes = data.notifications.filter(n => n._id > maxSeenIdRef.current);
          newOnes.slice(0, 3).reverse().forEach(n => {
            const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.system;
            toast(n.title, {
              icon: '🔔',
              duration: 4000,
              style: {
                borderLeft: `4px solid ${cfg.color}`,
                background: '#1e1919',
                color: '#f7f5f2',
                fontSize: '13px',
                maxWidth: '360px',
              },
            });
          });
        }
      }

      if (data.notifications?.length > 0) {
        maxSeenIdRef.current = Math.max(maxSeenIdRef.current, data.notifications[0]._id);
      }
    } catch (err) {
      // Silent — không ảnh hưởng UX
    }
  }, []);

  // ── Initial load ────────────────────────────────────────────
  useEffect(() => {
    fetchNotifications(false);
  }, [fetchNotifications]);

  // ── Polling ─────────────────────────────────────────────────
  useEffect(() => {
    const timer = setInterval(() => fetchNotifications(true), POLL_INTERVAL);
    return () => clearInterval(timer);
  }, [fetchNotifications]);

  // ── Click outside to close ──────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  // ── Handlers ────────────────────────────────────────────────
  const handleClickNotification = async (notif) => {
    // Đánh dấu đã đọc
    if (!notif.isRead) {
      try {
        await NotificationModel.markAsRead(notif._id);
        setNotifications(prev => prev.map(n => n._id === notif._id ? { ...n, isRead: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch { /* silent */ }
    }
    // Điều hướng
    const cfg = TYPE_CONFIG[notif.type] || TYPE_CONFIG.system;
    setIsOpen(false);
    navigate(cfg.path);
  };

  const handleMarkAllRead = async () => {
    setLoading(true);
    try {
      await NotificationModel.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch { /* silent */ }
    setLoading(false);
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    try {
      await NotificationModel.deleteNotification(id);
      setNotifications(prev => {
        const target = prev.find(n => n._id === id);
        if (target && !target.isRead) setUnreadCount(c => Math.max(0, c - 1));
        return prev.filter(n => n._id !== id);
      });
    } catch { /* silent */ }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* ── Bell button ──────────────────────────────────────── */}
      <button
        id="notification-bell-btn"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg transition-all duration-200"
        style={{
          color: isOpen ? '#0061fe' : '#716b61',
          background: isOpen ? 'rgba(0,97,254,0.08)' : 'transparent',
        }}
        onMouseEnter={e => { if (!isOpen) e.currentTarget.style.background = '#f0ede8'; }}
        onMouseLeave={e => { if (!isOpen) e.currentTarget.style.background = 'transparent'; }}
        aria-label="Thông báo"
      >
        <Bell className={`w-5 h-5 ${unreadCount > 0 ? 'animate-bell-ring' : ''}`} />

        {/* Badge */}
        {unreadCount > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center text-[10px] font-bold leading-none"
            style={{
              background: '#ef4444',
              color: '#ffffff',
              boxShadow: '0 0 0 2px #ffffff',
            }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* ── Dropdown ─────────────────────────────────────────── */}
      {isOpen && (
        <div
          className="absolute right-0 mt-2 z-50 overflow-hidden"
          style={{
            width: '380px',
            maxHeight: '520px',
            background: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e5e0d8',
            boxShadow: '0 20px 60px -12px rgba(30,25,25,0.25), 0 0 0 1px rgba(30,25,25,0.03)',
            animation: 'notif-slide-in 0.18s ease-out',
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ borderBottom: '1px solid #eae5dd' }}
          >
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold" style={{ color: '#1e1919' }}>
                Thông báo
              </h3>
              {unreadCount > 0 && (
                <span
                  className="px-1.5 py-0.5 text-[10px] font-bold rounded-full"
                  style={{ background: '#fef2f2', color: '#ef4444' }}
                >
                  {unreadCount} mới
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  disabled={loading}
                  className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded-md transition-colors"
                  style={{ color: '#0061fe', background: 'transparent' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,97,254,0.08)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  title="Đánh dấu tất cả đã đọc"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Đọc tất cả</span>
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-md transition-colors"
                style={{ color: '#b8b2aa' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#f0ede8'; e.currentTarget.style.color = '#1e1919'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#b8b2aa'; }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* List */}
          <div
            className="overflow-y-auto"
            style={{ maxHeight: '420px' }}
          >
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center mb-3"
                  style={{ background: '#f7f5f2' }}
                >
                  <Bell className="w-5 h-5" style={{ color: '#c9c3bb' }} />
                </div>
                <p className="text-sm font-medium" style={{ color: '#b8b2aa' }}>
                  Chưa có thông báo nào
                </p>
              </div>
            ) : (
              notifications.map(notif => {
                const cfg = TYPE_CONFIG[notif.type] || TYPE_CONFIG.system;
                const Icon = cfg.icon;
                return (
                  <div
                    key={notif._id}
                    onClick={() => handleClickNotification(notif)}
                    className="flex gap-3 px-4 py-3 cursor-pointer transition-colors duration-100 group"
                    style={{
                      background: notif.isRead ? 'transparent' : 'rgba(0,97,254,0.03)',
                      borderBottom: '1px solid #f2eeea',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f7f5f2'}
                    onMouseLeave={e => e.currentTarget.style.background = notif.isRead ? 'transparent' : 'rgba(0,97,254,0.03)'}
                  >
                    {/* Icon */}
                    <div
                      className="w-8 h-8 shrink-0 rounded-lg flex items-center justify-center mt-0.5"
                      style={{ background: `${cfg.color}15` }}
                    >
                      <Icon className="w-4 h-4" style={{ color: cfg.color }} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p
                          className="text-[13px] leading-snug truncate"
                          style={{
                            color: '#1e1919',
                            fontWeight: notif.isRead ? 400 : 600,
                          }}
                        >
                          {notif.title}
                        </p>
                        {/* Unread dot */}
                        {!notif.isRead && (
                          <span
                            className="w-2 h-2 shrink-0 rounded-full mt-1.5"
                            style={{ background: '#0061fe' }}
                          />
                        )}
                      </div>
                      {notif.content && (
                        <p
                          className="text-[12px] mt-0.5 leading-relaxed"
                          style={{
                            color: '#918b83',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                        >
                          {notif.content}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                          style={{ background: `${cfg.color}12`, color: cfg.color }}
                        >
                          {cfg.label}
                        </span>
                        <span className="text-[10px]" style={{ color: '#c9c3bb' }}>
                          {timeAgo(notif.createdAt)}
                        </span>
                      </div>
                    </div>

                    {/* Delete */}
                    <button
                      onClick={(e) => handleDelete(e, notif._id)}
                      className="shrink-0 p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                      style={{ color: '#c9c3bb' }}
                      onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = '#fef2f2'; }}
                      onMouseLeave={e => { e.currentTarget.style.color = '#c9c3bb'; e.currentTarget.style.background = 'transparent'; }}
                      title="Xóa thông báo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ── Inline styles for animation ──────────────────────── */}
      <style>{`
        @keyframes notif-slide-in {
          from { opacity: 0; transform: translateY(-8px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes bell-ring {
          0%   { transform: rotate(0); }
          10%  { transform: rotate(14deg); }
          20%  { transform: rotate(-12deg); }
          30%  { transform: rotate(10deg); }
          40%  { transform: rotate(-8deg); }
          50%  { transform: rotate(4deg); }
          60%  { transform: rotate(0); }
          100% { transform: rotate(0); }
        }
        .animate-bell-ring {
          animation: bell-ring 0.8s ease-in-out;
          animation-iteration-count: 1;
        }
      `}</style>
    </div>
  );
};
