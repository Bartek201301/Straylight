'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface QuizExitDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

/**
 * Quiz Exit Confirmation Dialog
 * Shows a confirmation dialog when user tries to leave the quiz
 */
export default function QuizExitDialog({
  isOpen,
  onClose,
  onConfirm,
}: QuizExitDialogProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Dialog */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="bg-black border border-white/20 rounded-2xl p-6 max-w-md w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Icon */}
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-red-400"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.314 14.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                </div>
              </div>

              {/* Content */}
              <div className="text-center space-y-3">
                <h3 className="text-xl font-bold text-white font-inter">
                  Opuścić quiz?
                </h3>
                <p className="text-white/70 font-source">
                  Jeśli opuścisz quiz teraz, Twoje odpowiedzi zostaną zapisane i
                  będziesz mógł wrócić do tego momentu później.
                </p>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 mt-6">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-3 bg-white/10 text-white border border-white/20 rounded-xl font-medium font-source hover:bg-white/20 transition-colors duration-200"
                >
                  Kontynuuj quiz
                </button>
                <button
                  onClick={onConfirm}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl font-medium font-source hover:bg-red-700 transition-colors duration-200"
                >
                  Opuść quiz
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
