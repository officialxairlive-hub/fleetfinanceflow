'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import styles from './Toast.module.css';

const ToastContext = createContext(null);

let globalShowToast = null;

export const toast = {
  success: (msg, duration) => globalShowToast?.(msg, 'success', duration),
  error: (msg, duration) => globalShowToast?.(msg, 'error', duration),
  warning: (msg, duration) => globalShowToast?.(msg, 'warning', duration),
  info: (msg, duration) => globalShowToast?.(msg, 'info', duration),
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message, type = 'info', duration = 4000) => {
    if (!message) return;
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    
    // Auto-detect type if not explicitly set or if coming from raw alert string
    let detectedType = type;
    const cleanMsg = String(message).replace(/^[✅⚠️❌ℹ️\s]+/, '').trim();
    
    if (type === 'info' || !type) {
      const lower = String(message).toLowerCase();
      if (lower.includes('error') || lower.includes('failed') || lower.includes('cannot') || lower.includes('invalid')) {
        detectedType = 'error';
      } else if (lower.includes('success') || lower.includes('added') || lower.includes('created') || lower.includes('updated') || lower.includes('saved') || lower.includes('paid') || lower.includes('copied') || String(message).includes('✅')) {
        detectedType = 'success';
      } else if (lower.includes('warning') || lower.includes('please') || lower.includes('require') || String(message).includes('⚠️')) {
        detectedType = 'warning';
      }
    }

    const newToast = {
      id,
      message: cleanMsg,
      rawMessage: message,
      type: detectedType,
      duration
    };

    setToasts((prev) => [...prev.slice(-4), newToast]); // Keep up to 5 toasts active

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  useEffect(() => {
    globalShowToast = showToast;

    // Gracefully intercept window.alert so all existing and future alert() calls render as modern toasts
    if (typeof window !== 'undefined') {
      const originalAlert = window.alert;
      window.alert = (msg) => {
        showToast(msg);
      };

      return () => {
        window.alert = originalAlert;
      };
    }
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, toast }}>
      {children}
      
      {/* Toast Notification Container */}
      <div className={styles.toastContainer} aria-live="polite" role="region">
        <AnimatePresence>
          {toasts.map((t) => {
            let Icon = Info;
            let iconClass = styles.iconInfo;
            if (t.type === 'success') {
              Icon = CheckCircle2;
              iconClass = styles.iconSuccess;
            } else if (t.type === 'error') {
              Icon = AlertCircle;
              iconClass = styles.iconError;
            } else if (t.type === 'warning') {
              Icon = AlertTriangle;
              iconClass = styles.iconWarning;
            }

            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -15, scale: 0.92, transition: { duration: 0.2 } }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className={`${styles.toastItem} ${styles[t.type] || styles.info}`}
              >
                <div className={`${styles.iconWrap} ${iconClass}`}>
                  <Icon size={18} />
                </div>
                
                <div className={styles.contentWrap}>
                  <p className={styles.messageText}>{t.message}</p>
                </div>

                <button
                  type="button"
                  onClick={() => removeToast(t.id)}
                  className={styles.closeBtn}
                  aria-label="Dismiss notification"
                >
                  <X size={14} />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    return {
      showToast: (msg, type) => toast[type || 'info']?.(msg),
      toast
    };
  }
  return context;
}
