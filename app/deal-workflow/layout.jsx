import MainSidebar from '@/components/MainSidebar';
import { DealWorkflowProvider } from '@/components/deal-workflow/DealWorkflowContext';
import CreateTaskModal from '@/components/deal-workflow/CreateTaskModal';
import TaskDetailDrawer from '@/components/deal-workflow/TaskDetailDrawer';
import DocumentSignModal from '@/components/deal-workflow/DocumentSignModal';
import AuditCertificateModal from '@/components/deal-workflow/AuditCertificateModal';

export const metadata = {
  title: 'Deal Tasks & Workflow — Project Titan M&A Deal Room',
  description: 'Enterprise two-sided Deal Management System for Seller & Buyer M&A workflows.',
};

export default function DealWorkflowLayout({ children }) {
  return (
    <DealWorkflowProvider>
      <div className="flex w-full h-screen overflow-hidden bg-[#F8FAFC] font-sans relative">
        {/* Existing MainSidebar with new Deal Workflow icon */}
        <MainSidebar />

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 h-full overflow-hidden flex flex-col relative z-10">
          <div className="flex-1 overflow-y-auto bg-[#F8FAFC] relative flex flex-col min-w-0">
            {children}
          </div>
        </main>
      </div>

      {/* Global Modals & Slide-overs */}
      <CreateTaskModal />
      <TaskDetailDrawer />
      <DocumentSignModal />
      <AuditCertificateModal />
    </DealWorkflowProvider>
  );
}
