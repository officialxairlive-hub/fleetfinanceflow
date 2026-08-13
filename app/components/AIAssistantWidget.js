'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, MessageSquare, Send, CheckCircle2, Bot, User } from 'lucide-react';
import styles from './AIAssistantWidget.module.css';

const presetQuestions = [
  {
    q: 'How does mobile time tracking work in the bay?',
    a: 'Technicians log into the app on any phone or tablet, pick their assigned repair order, and tap "Clock In". Every minute attaches straight to the job RO for accurate labor cost tracking.'
  },
  {
    q: 'Does it sync with QuickBooks Desktop and Online?',
    a: 'Yes! Fleet Finance Flow features automated 2-way sync for invoices, customers, payments, and parts accounts with both QuickBooks Online and Desktop.'
  },
  {
    q: 'Can we scan paper parts invoices from suppliers?',
    a: 'Absolutely. Take a photo of supplier delivery tickets or parts receipts with a tablet/phone. The app pulls parts, cost, and markup directly onto the open repair order.'
  },
  {
    q: 'How long does shop onboarding take?',
    a: 'Most heavy-duty repair shops are completely up and running in under 1 hour. Our team handles data import for your fleet customers, VINs, and labor rates for free.'
  }
];

export default function AIAssistantWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: 'Hi there! I am the Fleet Finance Flow Shop Assistant. Ask me anything about time tracking, QuickBooks sync, or shop setup!'
    }
  ]);

  const handleSelectQuestion = (item) => {
    if (messages.some(m => m.text === item.q)) return;

    setMessages((prev) => [
      ...prev,
      { sender: 'user', text: item.q },
      { sender: 'bot', text: item.a }
    ]);
  };

  return (
    <div className={styles.widgetWrapper}>
      {/* Floating Trigger Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className={styles.triggerBtn}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Sparkles size={22} className={styles.sparkleIcon} />
        <span className={styles.triggerText}>Ask Shop AI</span>
        <span className={styles.onlineBadge} />
      </motion.button>

      {/* Floating Chat Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className={styles.chatModal}
          >
            {/* Modal Header */}
            <div className={styles.modalHeader}>
              <div className={styles.headerLeft}>
                <div className={styles.botAvatar}>
                  <Bot size={18} />
                </div>
                <div>
                  <div className={styles.botTitle}>Shop AI Assistant</div>
                  <div className={styles.botStatus}>Online · Instant Answers</div>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className={styles.closeBtn}>
                <X size={18} />
              </button>
            </div>

            {/* Chat Messages */}
            <div className={styles.messagesContainer}>
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`${styles.messageBubble} ${
                    msg.sender === 'user' ? styles.userBubble : styles.botBubble
                  }`}
                >
                  {msg.sender === 'bot' && <CheckCircle2 size={14} className={styles.checkIcon} />}
                  <span>{msg.text}</span>
                </div>
              ))}
            </div>

            {/* Suggested Prompts */}
            <div className={styles.promptsSection}>
              <div className={styles.promptsLabel}>Suggested Questions:</div>
              <div className={styles.promptsList}>
                {presetQuestions.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelectQuestion(item)}
                    className={styles.promptBtn}
                  >
                    {item.q}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
