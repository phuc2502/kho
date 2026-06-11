import nodemailer from 'nodemailer';
import crypto from 'crypto';

/**
 * SMTP Transporter — Gmail với App Password
 *
 * Cấu hình .env:
 *   MAIL_HOST=smtp.gmail.com       (mặc định)
 *   MAIL_PORT=587                  (mặc định)
 *   MAIL_USER=no-reply@fositek.vn  (Gmail công ty)
 *   MAIL_PASS=xxxx xxxx xxxx xxxx  (App Password 16 ký tự)
 *   MAIL_FROM=no-reply@fositek.vn  (nếu khác MAIL_USER)
 *   FRONTEND_URL=http://localhost:5173
 *
 * Nếu MAIL_USER chưa được cấu hình → chạy Dev Mode:
 *   In nội dung email ra console thay vì gửi thật.
 *   Hệ thống vẫn hoạt động bình thường.
 */

const createTransporter = () => {
  if (!process.env.MAIL_USER || !process.env.MAIL_PASS) return null;
  return nodemailer.createTransport({
    host: process.env.MAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.MAIL_PORT) || 587,
    secure: false, // STARTTLS
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });
};

// [THÊM MỚI] — Ghi nhật ký email vào DB (không throw nếu lỗi DB)
const _logEmail = async ({ type, recipient, subject, status, errorMessage = null, userId = null, sentBy = null }) => {
  if (!type) return; // không log nếu không truyền type
  try {
    // Dynamic import tránh circular dependency khi module load
    const { EmailLog } = await import('../models/email-log.model.js');
    await EmailLog.create({ type, recipient, subject, status, errorMessage, userId, sentBy });
  } catch (logErr) {
    console.warn('[mailer] Không thể ghi EmailLog:', logErr.message);
  }
};

/**
 * Gửi email — tự fallback về console log nếu chưa cấu hình SMTP.
 *
 * [THÊM MỚI] Tham số log tùy chọn (nếu không truyền thì không ghi log):
 *   logType:   'welcome' | 'adminReset' | 'forgotPassword'
 *   logUserId: _id của user liên quan (nullable)
 *   logSentBy: email/username của người trigger hoặc 'system'
 */
export const sendMail = async ({ to, subject, html, logType = null, logUserId = null, logSentBy = null }) => {
  const transporter = createTransporter();

  if (!transporter) {
    // ——— Dev Mode — in ra console ———
    const text = html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim().substring(0, 400);
    console.log('\n╔═══════════════ EMAIL (Dev Mode — chưa cấu hình SMTP) ═══════════════╗');
    console.log(`║ To:      ${to}`);
    console.log(`║ Subject: ${subject}`);
    console.log(`║ Preview: ${text}`);
    console.log('╚══════════════════════════════════════════════════════════════════════╝\n');
    // [THÊM MỚI] Ghi log dev-mode như thành công (email đã "gửi" ra console)
    await _logEmail({ type: logType, recipient: to, subject, status: 'success', userId: logUserId, sentBy: logSentBy });
    return { messageId: 'dev-mode', accepted: [to] };
  }

  const from = `"FOSITEK WMS" <${process.env.MAIL_FROM || process.env.MAIL_USER}>`;
  try {
    const result = await transporter.sendMail({ from, to, subject, html });
    // [THÊM MỚI] Ghi log thành công
    await _logEmail({ type: logType, recipient: to, subject, status: 'success', userId: logUserId, sentBy: logSentBy });
    return result;
  } catch (err) {
    // [THÊM MỚI] Ghi log thất bại trước khi re-throw
    await _logEmail({ type: logType, recipient: to, subject, status: 'failed', errorMessage: err.message, userId: logUserId, sentBy: logSentBy });
    throw err;
  }
};

/** Sinh mật khẩu ngẫu nhiên 10 ký tự — chỉ chữ + số, không ký tự đặc biệt */
export const generatePassword = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
};

// ─────────────────────────────────────────────────────────────
//  Email Templates
// ─────────────────────────────────────────────────────────────

/** Template dùng chung cho header + footer */
const wrapEmail = (body) => `
<div style="font-family:'Helvetica Neue',Arial,sans-serif;max-width:560px;margin:0 auto;background:#f7f5f2;padding:32px 16px">
  <div style="background:#ffffff;border-radius:12px;border:1px solid #eee9e2;overflow:hidden">
    <div style="background:#1e1919;padding:20px 28px;display:flex;align-items:center;gap:10px">
      <svg width="18" height="16" viewBox="0 0 40 36" fill="none">
        <path d="M20 6.5L10 13 20 19.5 10 26l-10-6.5L10 13 0 6.5 10 0z" fill="#0061fe"/>
        <path d="M20 6.5L30 0l10 6.5L30 13l10 6.5-10 6.5-10-6.5L30 13z" fill="#0061fe"/>
        <path d="M10 27.85L20 21.35l10 6.5-10 6.5z" fill="#0061fe"/>
      </svg>
      <span style="color:#f7f5f2;font-weight:600;font-size:13px;letter-spacing:-0.01em">MVC Warehouse · FOSITEK Hà Nam</span>
    </div>
    <div style="padding:28px 32px">${body}</div>
  </div>
  <p style="text-align:center;color:#b8b2aa;font-size:11px;margin-top:14px">
    © FOSITEK Hà Nam — Hệ thống Quản lý Kho Thành Phẩm
  </p>
</div>`;

const credentialsBox = (email, password) => `
<div style="background:#f7f5f2;border-radius:8px;padding:18px 22px;margin-bottom:22px;border:1px solid #eee9e2">
  <div style="margin-bottom:14px">
    <p style="color:#b8b2aa;font-size:10px;font-weight:700;letter-spacing:0.07em;text-transform:uppercase;margin:0 0 4px">EMAIL ĐĂNG NHẬP</p>
    <p style="color:#1e1919;font-size:15px;font-weight:600;margin:0">${email}</p>
  </div>
  <div>
    <p style="color:#b8b2aa;font-size:10px;font-weight:700;letter-spacing:0.07em;text-transform:uppercase;margin:0 0 4px">MẬT KHẨU TẠM THỜI</p>
    <p style="color:#0061fe;font-size:24px;font-weight:700;margin:0;letter-spacing:4px;font-family:monospace">${password}</p>
  </div>
</div>`;

const loginBtn = (url) =>
  `<a href="${url}" style="display:inline-block;background:#0061fe;color:#ffffff;padding:11px 26px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">Đăng nhập ngay →</a>`;

const warningBox = (text) =>
  `<div style="margin-top:20px;padding:14px 16px;background:#fff8e6;border-radius:8px;border-left:3px solid #f59e0b">
    <p style="color:#92400e;font-size:13px;margin:0;line-height:1.5">${text}</p>
  </div>`;

const dangerBox = (text) =>
  `<div style="margin-top:20px;padding:14px 16px;background:#fef2f2;border-radius:8px;border-left:3px solid #ef4444">
    <p style="color:#991b1b;font-size:13px;margin:0;line-height:1.5">${text}</p>
  </div>`;

// ─── 1. Chào mừng nhân viên mới ───────────────────────────────
export const buildWelcomeEmail = ({ fullName, email, password, loginUrl }) => ({
  subject: '[FOSITEK WMS] Thông tin tài khoản hệ thống kho',
  html: wrapEmail(`
    <p style="color:#716b61;font-size:12px;font-weight:600;letter-spacing:0.07em;text-transform:uppercase;margin:0 0 6px">CHÀO MỪNG</p>
    <h2 style="color:#1e1919;font-size:21px;font-weight:600;margin:0 0 14px;line-height:1.3">Tài khoản kho hàng của bạn đã sẵn sàng</h2>
    <p style="color:#716b61;font-size:14px;margin:0 0 22px;line-height:1.6">
      Xin chào <strong>${fullName || email}</strong>,<br>
      Quản trị viên đã tạo tài khoản hệ thống quản lý kho FOSITEK cho bạn. Dưới đây là thông tin đăng nhập:
    </p>
    ${credentialsBox(email, password)}
    ${loginBtn(loginUrl)}
    ${warningBox('⚠️ <strong>Bảo mật:</strong> Vui lòng đổi mật khẩu sau khi đăng nhập lần đầu trong mục <strong>Hồ sơ cá nhân</strong>. Không chia sẻ mật khẩu này.')}
  `)
});

// ─── 2. Quên mật khẩu — link đặt lại ────────────────────────
export const buildResetPasswordEmail = ({ fullName, resetUrl }) => ({
  subject: '[FOSITEK WMS] Yêu cầu đặt lại mật khẩu',
  html: wrapEmail(`
    <p style="color:#716b61;font-size:12px;font-weight:600;letter-spacing:0.07em;text-transform:uppercase;margin:0 0 6px">BẢO MẬT TÀI KHOẢN</p>
    <h2 style="color:#1e1919;font-size:21px;font-weight:600;margin:0 0 14px">Đặt lại mật khẩu</h2>
    <p style="color:#716b61;font-size:14px;margin:0 0 22px;line-height:1.6">
      Xin chào <strong>${fullName || 'bạn'}</strong>,<br>
      Chúng tôi nhận được yêu cầu đặt lại mật khẩu. Nhấn vào nút bên dưới để tạo mật khẩu mới:
    </p>
    <a href="${resetUrl}" style="display:inline-block;background:#0061fe;color:#ffffff;padding:11px 26px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">Đặt lại mật khẩu →</a>
    ${dangerBox('🔒 Link này hết hạn sau <strong>60 phút</strong>. Nếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này — tài khoản vẫn an toàn.')}
  `)
});

// ─── 3. Admin đặt lại mật khẩu cho nhân viên ────────────────
export const buildAdminResetEmail = ({ fullName, email, password, loginUrl }) => ({
  subject: '[FOSITEK WMS] Mật khẩu của bạn đã được đặt lại',
  html: wrapEmail(`
    <p style="color:#716b61;font-size:12px;font-weight:600;letter-spacing:0.07em;text-transform:uppercase;margin:0 0 6px">THÔNG BÁO HỆ THỐNG</p>
    <h2 style="color:#1e1919;font-size:21px;font-weight:600;margin:0 0 14px">Mật khẩu đã được đặt lại</h2>
    <p style="color:#716b61;font-size:14px;margin:0 0 22px;line-height:1.6">
      Xin chào <strong>${fullName || email}</strong>,<br>
      Quản trị viên đã đặt lại mật khẩu tài khoản của bạn. Mật khẩu tạm thời mới:
    </p>
    ${credentialsBox(email, password)}
    ${loginBtn(loginUrl)}
    ${warningBox('⚠️ Vui lòng đổi mật khẩu ngay sau khi đăng nhập trong mục <strong>Hồ sơ cá nhân</strong>.')}
  `)
});
