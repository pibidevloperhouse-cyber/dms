"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

const TasksContext = createContext();

export function useTasks() {
  const context = useContext(TasksContext);
  if (!context) {
    throw new Error('useTasks must be used within a TasksProvider');
  }
  return context;
}

// Mock Data
const MOCK_TASKS = [
  {
    id: 't1', title: 'Draft NDA', description: 'Draft the initial Non-Disclosure Agreement for the buyer.',
    status: 'completed', priority: 'High', stage: 'preparation', taskType: 'Document',
    assignee: 'Buyer Legal Team', role: 'Legal', dueDate: '2027-11-01',
    dependencies: [], linkedDocumentId: 'doc_1', riskImpact: 'low', visibility: 'external', isStageGate: true
  },
  {
    id: 't2', title: 'Upload Financial Statements', description: 'Upload Q1-Q3 financial statements.',
    status: 'in_progress', priority: 'High', stage: 'dd', taskType: 'Data Request',
    assignee: 'Buyer Finance Group', role: 'Financial', dueDate: '2027-11-10',
    dependencies: ['t1'], linkedDocumentId: null, riskImpact: 'high', visibility: 'external', isStageGate: true
  },
  {
    id: 't3', title: 'Review IP Portfolio', description: 'Review the provided IP portfolio documents.',
    status: 'audit', priority: 'Medium', stage: 'dd', taskType: 'Review',
    assignee: 'Buyer Legal Team', role: 'Legal', dueDate: '2027-11-15',
    dependencies: ['t1'], linkedDocumentId: 'doc_3', riskImpact: 'medium', visibility: 'external', isStageGate: false
  },
  {
    id: 't4', title: 'Initial Offer Review', description: 'Review the initial offer from the buyer.',
    status: 'todo', priority: 'High', stage: 'negotiation', taskType: 'Review',
    assignee: 'Seller Execs', role: 'Executive', dueDate: '2027-11-20',
    dependencies: ['t2', 't3'], linkedDocumentId: 'doc_4', riskImpact: 'high', visibility: 'internal', isStageGate: true
  },
  {
    id: 't5', title: 'Prepare Disclosure Schedules', description: 'Prepare initial disclosure schedules.',
    status: 'in_progress', priority: 'Medium', stage: 'dd', taskType: 'Document',
    assignee: 'Buyer Legal Team', role: 'Legal', dueDate: '2026-08-25', // Overdue
    dependencies: [], linkedDocumentId: null, riskImpact: 'medium', visibility: 'external', isStageGate: false
  },
  {
    id: 't6', title: 'Finalize SPA', description: 'Finalize the Share Purchase Agreement.',
    status: 'todo', priority: 'High', stage: 'closing', taskType: 'Document',
    assignee: 'Buyer Legal Team', role: 'Legal', dueDate: '2027-12-01',
    dependencies: ['t4'], linkedDocumentId: null, riskImpact: 'high', visibility: 'external', isStageGate: true
  }
];

const MOCK_LOGS = [
  { id: 'l1', taskTitle: 'Upload Final Term Sheet', action: 'Completed', user: 'Alice Smith', timestamp: '2026-09-01T10:00:00Z', details: 'Task marked as completed.' },
  { id: 'l2', taskTitle: 'Review Q3 Financials', action: 'Escalated Risk', user: 'Bob Jones', timestamp: '2026-09-03T14:30:00Z', details: 'Waiting on source document from target company.' }
];

const STAGES = ['preparation', 'dd', 'negotiation', 'closing'];

export function TasksProvider({ children }) {
  const [tasks, setTasks] = useState(MOCK_TASKS);
  const [logs, setLogs] = useState(MOCK_LOGS);
  const [userRole, setUserRole] = useState('seller');
  const [isBuyerUser, setIsBuyerUser] = useState(false);
  const [viewMode, setViewMode] = useState('Seller'); // 'Seller' or 'Buyer'
  const [currentDealStage, setCurrentDealStage] = useState('preparation');
  const [selectedTask, setSelectedTask] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [isCreating, setIsCreating] = useState(false);

  // Parse logged-in user's role from vdr_session (specifically dmsRole / dm_role / role)
  useEffect(() => {
    try {
      const rawSession = typeof window !== 'undefined' ? localStorage.getItem('vdr_session') : null;
      if (rawSession) {
        const sessionObj = JSON.parse(rawSession);
        // Supabase / Drizzle dms_role or dmsRole column value
        const role = sessionObj?.dmsRole || sessionObj?.dm_role || sessionObj?.role || '';
        const roleLower = String(role).toLowerCase();

        const isBuyer = roleLower.includes('buyer') || ['guest_admin', 'external_user', 'buyer_member', 'buyer_admin'].includes(roleLower);

        setUserRole(roleLower.includes('buyer') ? 'buyer' : 'seller');
        setIsBuyerUser(isBuyer);
        if (isBuyer) {
          setViewMode('Buyer');
        } else {
          setViewMode('Seller');
        }
      }
    } catch (err) {
      console.error('Error parsing session role in TasksProvider:', err);
    }
  }, []);

  // Auto-progression logic: Check if all milestones for current stage are completed
  useEffect(() => {
    const stageTasks = tasks.filter(t => t.stage === currentDealStage);
    const milestones = stageTasks.filter(t => t.isStageGate);

    if (milestones.length > 0) {
      const allMilestonesCompleted = milestones.every(t => t.status === 'completed');
      if (allMilestonesCompleted) {
        const currentIdx = STAGES.indexOf(currentDealStage);
        if (currentIdx < STAGES.length - 1) {
          const nextStage = STAGES[currentIdx + 1];
          setCurrentDealStage(nextStage);
          setLogs(prev => [{
            id: `log-${Date.now()}`,
            taskTitle: 'System',
            action: 'Stage Auto-Progression',
            user: 'System',
            timestamp: new Date().toISOString(),
            details: `All milestones completed. Deal automatically advanced from ${currentDealStage} to ${nextStage}.`
          }, ...prev]);
        }
      }
    }
  }, [tasks, currentDealStage]);

  const visibleTasks = (isBuyerUser || viewMode === 'Buyer')
    ? tasks.filter(t => t.visibility === 'external')
    : tasks;

  const handleUpdateTask = (updatedTask) => {
    setTasks(tasks.map(t => t.id === updatedTask.id ? updatedTask : t));
    setLogs([{
      id: `log-${Date.now()}`,
      taskTitle: updatedTask.title,
      action: 'Status Updated',
      user: 'Current User',
      timestamp: new Date().toISOString(),
      details: `Status changed to ${updatedTask.status.replace('_', ' ')}`
    }, ...logs]);
  };

  const handleCreateTask = (newTask) => {
    setTasks([...tasks, newTask]);
    setLogs([{
      id: `log-${Date.now()}`,
      taskTitle: newTask.title,
      action: 'Task Created',
      user: 'Current User',
      timestamp: new Date().toISOString(),
      details: 'Manual ad-hoc task created.'
    }, ...logs]);
  };

  return (
    <TasksContext.Provider value={{
      tasks,
      visibleTasks,
      logs,
      userRole,
      isBuyerUser,
      viewMode,
      setViewMode,
      currentDealStage,
      setCurrentDealStage,
      selectedTask,
      setSelectedTask,
      editingTask,
      setEditingTask,
      isCreating,
      setIsCreating,
      handleUpdateTask,
      handleCreateTask
    }}>
      {children}
    </TasksContext.Provider>
  );
}
