import React, { useState, useRef, useEffect } from 'react';
import { ScanLine, X } from 'lucide-react';

/**
 * BarcodeInput — ô nhập liệu nhận mã quét từ đầu đọc barcode USB/Bluetooth.
 * Đầu đọc barcode USB hoạt động như bàn phím: gõ chuỗi rồi nhấn Enter.
 * Component này lắng nghe sự kiện Enter và gọi onScan(value).
 *
 * Props:
 *   onScan(value)   - Callback khi quét thành công
 *   placeholder     - Placeholder text
 *   autoFocus       - Focus khi mount (default: false)
 *   className       - Extra classes
 */
export const BarcodeInput = ({ onScan, placeholder = 'Quét mã hoặc nhập SKU...', autoFocus = false, className = '' }) => {
  const [value, setValue] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) inputRef.current.focus();
  }, [autoFocus]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      const trimmed = value.trim();
      if (trimmed && typeof onScan === 'function') {
        onScan(trimmed);
      }
      setValue('');
    }
  };

  return (
    <div className={`relative flex items-center ${className}`}>
      <ScanLine className="w-4 h-4 text-primary-500 absolute left-3 pointer-events-none" />
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="w-full bg-primary-50 border border-primary-200 rounded-xl pl-9 pr-9 py-2 text-sm text-slate-700 font-mono focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 placeholder:font-sans placeholder:text-slate-400"
      />
      {value && (
        <button type="button" onClick={() => setValue('')} className="absolute right-2.5 text-slate-400 hover:text-slate-600">
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
