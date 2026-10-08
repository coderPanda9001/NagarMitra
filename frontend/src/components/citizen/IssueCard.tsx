import React from 'react';
import { Link } from 'react-router-dom';
import { Issue } from '../../types';
import { IssueStatusBadge } from '../common/IssueStatusBadge';
import { SeverityBadge } from '../common/SeverityBadge';
import { PriorityBadge } from '../common/PriorityBadge';
import { MapPin, Calendar, ArrowRight, Image as ImageIcon } from 'lucide-react';
import { getImageUrl, handleImageError } from '../../utils/imageUtils';

interface IssueCardProps {
  issue: Issue;
}

export const IssueCard: React.FC<IssueCardProps> = ({ issue }) => {
  const firstImage = issue.report.images?.[0]?.url;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col md:flex-row">
      <div className="w-full md:w-44 h-40 md:h-auto bg-slate-100 relative shrink-0">
        {firstImage ? (
          <img
            src={getImageUrl(firstImage)}
            onError={handleImageError}
            alt={issue.report.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 p-4">
            <ImageIcon className="w-8 h-8 mb-1" />
            <span className="text-[10px]">No Photo Attached</span>
          </div>
        )}
        <div className="absolute top-2 left-2 md:hidden">
          <IssueStatusBadge status={issue.status} size="sm" />
        </div>
      </div>

      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div>
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-[11px] font-mono text-slate-500 font-semibold">
              {issue.trackingNumber}
            </span>
            <div className="hidden md:block">
              <IssueStatusBadge status={issue.status} size="sm" />
            </div>
          </div>

          <h3 className="text-sm font-bold text-slate-900 leading-snug hover:text-blue-700 transition-colors">
            <Link to={`/citizen/issues/${issue.id}`}>{issue.report.title}</Link>
          </h3>

          <p className="mt-1 text-xs text-slate-600 line-clamp-2">
            {issue.report.description}
          </p>
        </div>

        <div className="space-y-2 pt-2 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-2">
            <SeverityBadge severity={issue.severity} size="sm" />
            <PriorityBadge priority={issue.priority} size="sm" />
            <span className="px-2 py-0.5 text-[10px] font-medium bg-slate-100 text-slate-700 rounded">
              {issue.report.category}
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 gap-2">
            <div className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-blue-700 shrink-0" />
              <span className="truncate max-w-[200px]">{issue.report.address}</span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>{new Date(issue.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        <div className="pt-1 flex justify-end">
          <Link
            to={`/citizen/issues/${issue.id}`}
            className="text-xs font-semibold text-blue-700 hover:text-blue-800 flex items-center gap-1"
          >
            View Full Tracking Details <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
};
