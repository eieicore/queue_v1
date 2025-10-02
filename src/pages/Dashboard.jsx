
import React, { useEffect, useState } from 'react';
import StatsOverview from '@/components/dashboard/StatsOverview';
import LiveQueueStatus from '@/components/dashboard/LiveQueueStatus';
import RoomActivity from '@/components/dashboard/RoomActivity';
import RecentActivity from '@/components/dashboard/RecentActivity';
import SatisfactionOverview from '@/components/dashboard/SatisfactionOverview';
import { User, Clock } from 'lucide-react';
import { Queue, Room, Feedback } from '@/api/entities';

export default function Dashboard() {
  const [queues, setQueues] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      Queue.list(),
      Room.list(),
      Feedback.list()
    ]).then(([queuesData, roomsData, feedbacksData]) => {
      setQueues(queuesData);
      setRooms(roomsData);
      setFeedbacks(feedbacksData);
      setIsLoading(false);
    });
  }, []);

  // คำนวณค่าต่าง ๆ
  const totalQueue = queues.length;
  const servingQueue = queues.filter(q => q.status === 'serving').length;
  const completedQueue = queues.filter(q => q.status === 'completed').length;
  const waitingQueue = queues.filter(q => q.status === 'waiting').length;
    
  const waitTimes = queues
    .filter(q => q.created_date && q.called_at)
    .map(q => (new Date(q.called_at) - new Date(q.created_date)) / 60000)
    .filter(mins => !isNaN(mins) && mins >= 0);

  const avgWait = waitTimes.length
    ? Math.round(waitTimes.reduce((sum, mins) => sum + mins, 0) / waitTimes.length)
    : 0;
  const avgRating = feedbacks.length
    ? (feedbacks.reduce((sum, f) => sum + (f.rating || 0), 0) / feedbacks.length).toFixed(1)
    : 0;

  return (
    <div className="p-8">
      <div className="dashboard-summary grid grid-cols-5 gap-4 mb-6">
        <StatsOverview title="รอคิว" value={waitingQueue} color="blue" icon={User} />
        <StatsOverview title="ถูกเรียก" value={servingQueue} color="yellow" icon={User} />
        <StatsOverview title="เสร็จสิ้น" value={completedQueue} color="green" icon={User} />
        <StatsOverview title="เวลารอเฉลี่ย" value={`${avgWait} นาที`} color="purple" icon={Clock} />
        <SatisfactionOverview averageRating={avgRating} reviewCount={feedbacks.length} />
          </div>
      <div className="grid grid-cols-2 gap-4">
            <LiveQueueStatus queues={queues} isLoading={isLoading} />
            <RoomActivity rooms={rooms} queues={queues} isLoading={isLoading} />
          </div>
      <div className="mt-6">
        <RecentActivity queues={queues.slice(0, 10)} isLoading={isLoading} />
      </div>
    </div>
  );
}
