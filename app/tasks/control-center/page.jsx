"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ControlCenter from '@/components/tasks/ControlCenter';
import { useTasks } from '@/components/tasks/TasksContext';

export default function ControlCenterPage() {
  const router = useRouter();
  const { visibleTasks, currentDealStage, isBuyerUser, viewMode } = useTasks();

  const isBuyer = isBuyerUser || viewMode === 'Buyer';

  useEffect(() => {
    if (isBuyer) {
      router.replace('/tasks/board');
    }
  }, [isBuyer, router]);

  if (isBuyer) {
    return null;
  }

  return (
    <div className="flex-1 w-full h-full px-4 md:px-8 lg:px-10 py-6 md:py-8 relative">
      <div className="w-full mx-auto h-full">
        <ControlCenter 
          tasks={visibleTasks} 
          currentDealStage={currentDealStage} 
        />
      </div>
    </div>
  );
}
