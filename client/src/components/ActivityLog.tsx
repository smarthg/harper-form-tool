import { useState } from "react";

interface ActivityItem {
  id: string;
  command: string;
  field: string;
  value: string;
  timestamp: Date;
}

interface ActivityLogProps {
  activities: ActivityItem[];
  getFieldLabel: (fieldId: string) => string;
}

const ActivityLog = ({ activities, getFieldLabel }: ActivityLogProps) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-medium text-neutral-500 mb-4">Activity Log</h2>
      
      <div className="space-y-3 max-h-[300px] overflow-y-auto">
        {activities.length === 0 ? (
          <p className="text-sm text-neutral-300 text-center italic">Command history will appear here</p>
        ) : (
          activities.map((activity) => (
            <div key={activity.id} className="p-3 bg-neutral-100 rounded-lg animate-slide-in">
              <div className="flex justify-between items-start mb-1">
                <span className="text-sm font-medium text-neutral-400">
                  {getFieldLabel(activity.field)} updated
                </span>
                <span className="text-xs text-neutral-300">
                  {activity.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className="text-xs text-neutral-300">
                Value set to: <span className="font-medium text-neutral-400">{activity.value}</span>
              </p>
              <p className="text-xs italic text-neutral-300 mt-1">
                "{activity.command}"
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ActivityLog;
