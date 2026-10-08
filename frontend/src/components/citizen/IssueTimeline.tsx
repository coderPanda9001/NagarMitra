import React from 'react';
import { IssueStatusEvent, IssueStatus } from '../../types';
import { CheckCircle2, Clock, Circle, AlertCircle } from 'lucide-react';

interface IssueTimelineProps {
  currentStatus: IssueStatus;
  history: IssueStatusEvent[];
}

export const IssueTimeline: React.FC<IssueTimelineProps> = ({ history }) => {
  return (
    <div className="space-y-4">
      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
        Status Progression Lifecycle
      </h4>

      <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
        {history.map((event, index) => {
          const isLatest = index === history.length - 1;
          const isResolved = event.status === 'Resolved';
          const isReopened = event.status === 'Reopened';

          return (
            <div key={event.id || index} className="relative flex items-start gap-3">
              <div
                className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                  isResolved
                    ? 'bg-emerald-600 text-white'
                    : isReopened
                    ? 'bg-rose-600 text-white'
                    : isLatest
                    ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                    : 'bg-slate-300 text-slate-700'
                }`}
              >
                {isResolved ? (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                ) : isReopened ? (
                  <AlertCircle className="w-3.5 h-3.5" />
                ) : isLatest ? (
                  <Clock className="w-3.5 h-3.5 animate-pulse" />
                ) : (
                  <Circle className="w-2.5 h-2.5 fill-current" />
                )}
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex-1 space-y-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-900">{event.status}</span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {new Date(event.timestamp).toLocaleString()}
                  </span>
                </div>

                <div className="text-[11px] text-slate-600">
                  Updated by: <span className="font-semibold text-slate-800">{event.updatedBy}</span> ({event.userRole})
                </div>

                {event.comment && (
                  <p className="text-xs text-slate-700 bg-white p-2 rounded border border-slate-100 mt-1 italic">
                    "{event.comment}"
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
