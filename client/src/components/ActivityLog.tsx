import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

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
  if (activities.length === 0) {
    return (
      <Card className="mt-6">
        <CardHeader className="pb-3">
          <CardTitle>Activity Log</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-neutral-500">
            No activity yet. Use voice commands to update the form.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-6">
      <CardHeader className="pb-3">
        <CardTitle>Activity Log</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[250px] pr-4">
          <div className="space-y-4">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="p-3 border border-neutral-100 rounded-md bg-neutral-50"
              >
                <div className="flex justify-between items-start mb-1">
                  <div className="font-medium text-sm">{getFieldLabel(activity.field)}</div>
                  <div className="text-xs text-neutral-400">
                    {new Date(activity.timestamp).toLocaleTimeString()}
                  </div>
                </div>
                <div className="text-xs text-neutral-500 mb-2 italic">"{activity.command}"</div>
                <div className="flex gap-3 items-center">
                  <div className="text-sm">
                    <span className="font-medium">New value:</span> {activity.value}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default ActivityLog;