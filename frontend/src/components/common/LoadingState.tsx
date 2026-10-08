import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
  fullPage?: boolean;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading civic data...',
  fullPage = false,
}) => {
  const content = (
    <div className="flex flex-col items-center justify-center p-8 text-slate-500">
      <Loader2 className="w-8 h-8 animate-spin text-blue-700 mb-2" />
      <p className="text-sm font-medium">{message}</p>
    </div>
  );

  if (fullPage) {
    return (
      <div className="fixed inset-0 bg-slate-900/10 backdrop-blur-xs flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-200">
          {content}
        </div>
      </div>
    );
  }

  return content;
};
