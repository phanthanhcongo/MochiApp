import React from 'react';
import { ApiError } from '../apiClient';

interface ErrorDisplayProps {
  error: Error | ApiError | string | null;
  className?: string;
  showDetails?: boolean;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ 
  error, 
  className = '',
  showDetails = false 
}) => {
  if (!error) return null;

  const errorMessage = typeof error === 'string' 
    ? error 
    : error instanceof ApiError
    ? error.message
    : error.message || 'Đã xảy ra lỗi';

  const details = error instanceof ApiError && showDetails
    ? error.getDetails()
    : null;

  return (
    <div className={`p-4 rounded-xl border-2 bg-red-50 text-red-800 border-red-200 ${className}`}>
      <div className="flex items-start gap-3">
        <svg 
          className="w-5 h-5 flex-shrink-0 mt-0.5" 
          fill="currentColor" 
          viewBox="0 0 20 20"
        >
          <path 
            fillRule="evenodd" 
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" 
            clipRule="evenodd" 
          />
        </svg>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium break-words whitespace-pre-wrap">{errorMessage}</p>
          {details && (
            <details className="mt-2">
              <summary className="text-xs text-red-600 cursor-pointer hover:text-red-800">
                Chi tiết lỗi
              </summary>
              <pre className="mt-2 text-xs bg-red-100 p-2 rounded overflow-auto max-h-40 whitespace-pre-wrap break-words">
                {details}
              </pre>
            </details>
          )}
          {error instanceof ApiError && !showDetails && (
            <button
              onClick={() => {
                console.error('API Error Details:', error.getDetails());
                alert(`Chi tiết lỗi:\n\n${error.getDetails()}\n\n(Đã log vào console)`);
              }}
              className="mt-2 text-xs text-red-600 hover:text-red-800 underline"
            >
              Xem chi tiết
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

