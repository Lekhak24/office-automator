import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Clock, Users, ExternalLink, Video, PlayCircle } from "lucide-react";
import { format, isFuture, isPast, isToday, differenceInMinutes } from "date-fns";

interface MeetingSchedulerProps {
  userId: string;
}

const MeetingScheduler = ({ userId }: MeetingSchedulerProps) => {
  const { data: meetings, isLoading } = useQuery({
    queryKey: ["meetings", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("meetings")
        .select("*")
        .eq("user_id", userId)
        .order("start_time", { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-3/4" />
            </CardHeader>
          </Card>
        ))}
      </div>
    );
  }

  if (!meetings || meetings.length === 0) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">
            No meetings scheduled. Sync your Gmail to detect meeting invites automatically.
          </p>
        </CardContent>
      </Card>
    );
  }

  const upcomingMeetings = meetings.filter((m) => isFuture(new Date(m.start_time)));
  const pastMeetings = meetings.filter((m) => isPast(new Date(m.start_time)));

  const getMeetingType = (attendees: any): string | null => {
    if (!attendees) return null;
    if (typeof attendees === 'object' && attendees.type) return attendees.type;
    return null;
  };

  const isStartingSoon = (startTime: Date): boolean => {
    const minutesUntilStart = differenceInMinutes(startTime, new Date());
    return minutesUntilStart >= 0 && minutesUntilStart <= 15;
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Upcoming Meetings ({upcomingMeetings.length})</h3>
        <div className="space-y-3">
          {upcomingMeetings.map((meeting) => {
            const startTime = new Date(meeting.start_time);
            const endTime = new Date(meeting.end_time);
            const isHappeningToday = isToday(startTime);
            const startingSoon = isStartingSoon(startTime);
            const meetingType = getMeetingType(meeting.attendees);

            return (
              <Card key={meeting.id} className={`transition-all ${startingSoon ? "border-green-500 border-2 shadow-lg shadow-green-500/20" : isHappeningToday ? "border-primary" : ""}`}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg">{meeting.title}</CardTitle>
                        {meetingType && (
                          <Badge variant="outline" className="text-xs">
                            <Video className="h-3 w-3 mr-1" />
                            {meetingType}
                          </Badge>
                        )}
                      </div>
                      <CardDescription className="flex items-center gap-4 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(startTime, "PPP")}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(startTime, "p")} - {format(endTime, "p")}
                        </span>
                        {meeting.attendees && typeof meeting.attendees === 'object' && (meeting.attendees as any).source && (
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            From: {(meeting.attendees as any).source}
                          </span>
                        )}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      {startingSoon && (
                        <Badge variant="default" className="bg-green-500 animate-pulse">
                          Starting Soon!
                        </Badge>
                      )}
                      {isHappeningToday && !startingSoon && (
                        <Badge variant="default">
                          Today
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                {meeting.join_url && (
                  <CardContent className="pt-0">
                    <Button 
                      asChild 
                      variant={startingSoon ? "default" : "outline"} 
                      size={startingSoon ? "lg" : "sm"}
                      className={startingSoon ? "bg-green-600 hover:bg-green-700 gap-2 w-full sm:w-auto" : "gap-2"}
                    >
                      <a href={meeting.join_url} target="_blank" rel="noopener noreferrer">
                        {startingSoon ? (
                          <>
                            <PlayCircle className="h-5 w-5" />
                            Join Now
                          </>
                        ) : (
                          <>
                            <ExternalLink className="h-4 w-4" />
                            Join Meeting
                          </>
                        )}
                      </a>
                    </Button>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      </div>

      {pastMeetings.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Past Meetings</h3>
          <div className="space-y-3">
            {pastMeetings.slice(0, 5).map((meeting) => {
              const startTime = new Date(meeting.start_time);
              
              return (
                <Card key={meeting.id} className="opacity-60">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">{meeting.title}</CardTitle>
                    <CardDescription>
                      {format(startTime, "PPP 'at' p")}
                    </CardDescription>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default MeetingScheduler;
