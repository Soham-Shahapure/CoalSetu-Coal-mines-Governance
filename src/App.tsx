import React, { useState, useEffect } from 'react';
import {
  User,
  SirdarAssignment,
  OvermanAssignment,
  InspectionSummary,
  InspectionData,
  OvermanReportData,
} from './types/inspection';
import { api, authStorage } from './services/api';
import { offlineStorage } from './services/offlineStorage';
import { Header, AppTab } from './components/Header';
import { ConnectivityBanner } from './components/ConnectivityBanner';
import { LoginScreen } from './components/LoginScreen';
import { Dashboard } from './components/Dashboard';
import { WizardContainer } from './components/InspectionWizard/WizardContainer';
import { SubmittedView } from './components/SubmittedView';
import { SubmittedHistory } from './components/SubmittedHistory';
import { DraftsList } from './components/DraftsList';
import { OvermanDashboard } from './components/OvermanDashboard';
import { OvermanReportEditor } from './components/OvermanReportEditor';
import { OvermanSirdarList } from './components/OvermanSirdarList';
import { OvermanReportsList } from './components/OvermanReportsList';
import { ManagerDashboard } from './components/ManagerDashboard';
import { OvermanCorrectiveActions } from './components/OvermanCorrectiveActions';
import { Loader2, MapPin } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(authStorage.getUser());

  // Sirdar state
  const [sirdarAssignment, setSirdarAssignment] = useState<SirdarAssignment | null>(null);
  const [sirdarInspections, setSirdarInspections] = useState<InspectionSummary[]>([]);
  const [activeDraft, setActiveDraft] = useState<InspectionData | null>(null);

  // Overman state (Phase 2)
  const [overmanAssignment, setOvermanAssignment] = useState<OvermanAssignment | null>(null);
  const [receivedInspections, setReceivedInspections] = useState<InspectionSummary[]>([]);
  const [overmanReports, setOvermanReports] = useState<OvermanReportData[]>([]);
  const [currentOvermanReport, setCurrentOvermanReport] = useState<OvermanReportData | null>(null);

  // Shared state
  const [currentTab, setCurrentTab] = useState<AppTab>('dashboard');
  const [viewingInspection, setViewingInspection] = useState<
    (InspectionData & { mine?: any; district?: any; shift?: any; sirdar?: any }) | null
  >(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [savingReport, setSavingReport] = useState<boolean>(false);
  const [submittingReport, setSubmittingReport] = useState<boolean>(false);
  const [updatingSourceSelection, setUpdatingSourceSelection] = useState<boolean>(false);

  const refreshOvermanData = async () => {
    if (!user || user.role !== 'OVERMAN') return;
    try {
      const [recInspections, reports] = await Promise.all([
        api.getReceivedSirdarInspections(),
        api.getOvermanReports(),
      ]);
      setReceivedInspections(recInspections);
      setOvermanReports(reports);

      if (currentOvermanReport?.id) {
        const freshReport = await api.getOvermanReportById(currentOvermanReport.id);
        setCurrentOvermanReport(freshReport);
      }
    } catch (err) {
      console.error('Failed to refresh Overman data:', err);
    }
  };

  // Automatically refresh server-backed Overman data whenever an Overman enters a relevant page.
  useEffect(() => {
    if (user?.role === 'OVERMAN' && currentTab.startsWith('overman-')) {
      refreshOvermanData();
    }
  }, [user?.id, user?.role, currentTab]);

  // Load user data depending on role
  const loadUserData = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      if (user.role === 'MANAGER') {
        setCurrentTab('manager-dashboard');
        setLoading(false);
        return;
      }

      if (user.role === 'OVERMAN') {
        const [assign, recInspections, reports, draft] = await Promise.all([
          api.getOvermanAssignment(),
          api.getReceivedSirdarInspections(),
          api.getOvermanReports(),
          api.createOrGetOvermanDraft(),
        ]);

        setOvermanAssignment(assign);
        setReceivedInspections(recInspections);
        setOvermanReports(reports);
        setCurrentOvermanReport(draft);

        // Default tab for Overman
        setCurrentTab((prev) =>
          prev.startsWith('overman-') ? prev : 'overman-dashboard'
        );
      } else {
        // SIRDAR / DEFAULT
        const assign = await api.getMyAssignment();
        setSirdarAssignment(assign);

        const list = await api.getMyInspections();
        setSirdarInspections(list);

        const local = offlineStorage.getLocalDraft(user.id);
        if (local && local.data) {
          setActiveDraft(local.data);
        } else {
          const remoteDraft = list.find((i) => i.status === 'DRAFT');
          if (remoteDraft) {
            const fullDraft = await api.getInspectionById(remoteDraft.id);
            setActiveDraft(fullDraft);
          }
        }

        setCurrentTab((prev) =>
          ['dashboard', 'wizard', 'drafts', 'history'].includes(prev) ? prev : 'dashboard'
        );
      }
    } catch (err) {
      console.error('Failed to load user statutory data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadUserData();
    } else {
      setLoading(false);
    }
  }, [user?.id, user?.role]);

  const handleLoginSuccess = (loggedInUser: User) => {
    setUser(loggedInUser);
    setCurrentTab(
      loggedInUser.role === 'MANAGER'
        ? 'manager-dashboard'
        : loggedInUser.role === 'OVERMAN'
        ? 'overman-dashboard'
        : 'dashboard'
    );
  };

  const handleLogout = () => {
    authStorage.clearAuth();
    setUser(null);
    setSirdarAssignment(null);
    setOvermanAssignment(null);
    setSirdarInspections([]);
    setReceivedInspections([]);
    setOvermanReports([]);
    setCurrentOvermanReport(null);
    setActiveDraft(null);
    setViewingInspection(null);
    setCurrentTab('dashboard');
  };

  // --- SIRDAR WORKFLOW HANDLERS ---
  const handleStartNewInspection = () => {
    setViewingInspection(null);
    setActiveDraft(null);
    setCurrentTab('wizard');
  };

  const handleResumeDraft = async (draftId?: string) => {
    setViewingInspection(null);
    if (draftId) {
      try {
        const full = await api.getInspectionById(draftId);
        setActiveDraft(full);
      } catch (e) {
        console.error('Failed to fetch full draft', e);
      }
    }
    setCurrentTab('wizard');
  };

  const handleViewInspection = async (id: string) => {
    try {
      const full = await api.getInspectionById(id);
      setViewingInspection(full);
    } catch (err) {
      console.error('Failed to fetch inspection details:', err);
    }
  };

  const handleSubmittedSuccess = async (submittedRecord: InspectionData) => {
    await loadUserData();
    if (submittedRecord.id) {
      handleViewInspection(submittedRecord.id);
    } else {
      setCurrentTab('history');
    }
  };

  const handleSyncTriggered = async () => {
    const queue = offlineStorage.getOfflineQueue();
    for (const item of queue) {
      try {
        await api.submitInspection(item);
      } catch (e) {
        console.error('Failed to sync queue item:', e);
      }
    }
    await loadUserData();
  };

  // --- OVERMAN WORKFLOW HANDLERS (PHASE 2) ---
  const handleOpenOvermanReport = async (reportId?: string) => {
    setViewingInspection(null);
    try {
      const [freshReports, freshInspections] = await Promise.all([
        api.getOvermanReports(),
        api.getReceivedSirdarInspections(),
      ]);
      setOvermanReports(freshReports);
      setReceivedInspections(freshInspections);

      const targetId = reportId || currentOvermanReport?.id;
      if (targetId) {
        const freshReport = await api.getOvermanReportById(targetId);
        setCurrentOvermanReport(freshReport);
      }
      setCurrentTab('overman-report');
    } catch (err) {
      console.error('Failed to open fresh Overman report:', err);
    }
  };

  const handleSaveOvermanDraft = async (updated: OvermanReportData) => {
    try {
      setSavingReport(true);
      const saved = await api.updateOvermanReport(updated.id, updated);
      setCurrentOvermanReport(saved);
      // Refresh list
      const reports = await api.getOvermanReports();
      setOvermanReports(reports);
    } catch (err) {
      console.error('Failed to save Overman draft:', err);
    } finally {
      setSavingReport(false);
    }
  };

  const handleSubmitOvermanReport = async (updated: OvermanReportData) => {
    try {
      setSubmittingReport(true);
      const submitted = await api.submitOvermanReport(updated.id, updated);
      setCurrentOvermanReport(submitted);
      const reports = await api.getOvermanReports();
      setOvermanReports(reports);
    } catch (err) {
      console.error('Failed to submit statutory Overman report:', err);
    } finally {
      setSubmittingReport(false);
    }
  };

  const handleSourceSelectionChange = async (selectedSourceInspectionIds: string[]) => {
    if (!currentOvermanReport) return currentOvermanReport;
    try {
      setUpdatingSourceSelection(true);
      const assembled = await api.updateOvermanSourceSelection(
        currentOvermanReport.id,
        selectedSourceInspectionIds,
      );
      setCurrentOvermanReport(assembled);
      const [recInspections, reports] = await Promise.all([
        api.getReceivedSirdarInspections(),
        api.getOvermanReports(),
      ]);
      setReceivedInspections(recInspections);
      setOvermanReports(reports);
      return assembled;
    } catch (err) {
      console.error('Failed to update Sirdar source selection:', err);
      throw err;
    } finally {
      setUpdatingSourceSelection(false);
    }
  };

  const handleCreateNewOvermanReport = async () => {
    try {
      setLoading(true);
      const draft = await api.createOrGetOvermanDraft({
        report_date: new Date().toISOString().split('T')[0],
      });
      setCurrentOvermanReport(draft);
      const reports = await api.getOvermanReports();
      setOvermanReports(reports);
      setCurrentTab('overman-report');
    } catch (err) {
      console.error('Failed to create new Overman report:', err);
    } finally {
      setLoading(false);
    }
  };

  // If not logged in, render Login screen
  if (!user) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  // Loading state
  if (loading && !sirdarAssignment && !overmanAssignment) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-800 flex items-center justify-center font-sans">
        <div className="flex flex-col items-center space-y-3">
          <Loader2 className="w-8 h-8 text-sky-500 animate-spin" />
          <p className="text-sm text-black font-semibold">
            Loading statutory workspace for {user.name} ({user.role})...
          </p>
        </div>
      </div>
    );
  }

  const isOverman = user.role === 'OVERMAN';
  const draftsCount = isOverman
    ? 0
    : sirdarInspections.filter((i) => i.status === 'DRAFT').length;

  const currentMineName = isOverman
    ? overmanAssignment?.mine.mine_name
    : sirdarAssignment?.mine.mine_name;

  const currentDistrictName = isOverman
    ? overmanAssignment?.district.district_name
    : sirdarAssignment?.district.district_name;

  const currentSeamName = isOverman
    ? overmanAssignment?.district.seam_name
    : sirdarAssignment?.district.seam_name;

  return (
    <div className="min-h-screen bg-slate-50 text-black flex flex-col font-sans selection:bg-sky-500 selection:text-white">
      {/* Statutory Header */}
      <Header
        user={user}
        mineName={currentMineName}
        districtName={currentDistrictName}
        seamName={currentSeamName}
        currentTab={currentTab}
        onTabChange={(tab) => {
          setViewingInspection(null);
          setCurrentTab(tab);
        }}
        onLogout={handleLogout}
        draftCount={draftsCount}
      />

      {/* Offline Connectivity Banner */}
      <ConnectivityBanner onSyncTriggered={handleSyncTriggered} />

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6">
        {/* If viewing a single Sirdar submission (Read-Only) */}
        {viewingInspection ? (
          <SubmittedView
            inspection={viewingInspection}
            onBack={() => setViewingInspection(null)}
          />
        ) : user.role === 'MANAGER' ? (
          <ManagerDashboard user={user} onLogout={handleLogout} />
        ) : isOverman && overmanAssignment ? (
          // ================= OVERMAN (PHASE 2) SCREENS =================
          currentTab === 'overman-report' && currentOvermanReport ? (
            <OvermanReportEditor
              user={user}
              report={currentOvermanReport}
              onSaveDraft={handleSaveOvermanDraft}
              onSubmitReport={handleSubmitOvermanReport}
              availableSirdarInspections={receivedInspections}
              onSourceSelectionChange={handleSourceSelectionChange}
              onBack={() => setCurrentTab('overman-dashboard')}
              onViewSourceRecord={handleViewInspection}
              saving={savingReport}
              submitting={submittingReport}
              updatingSourceSelection={updatingSourceSelection}
            />
          ) : currentTab === 'overman-sirdar' ? (
            <OvermanSirdarList
              inspections={receivedInspections}
              onViewInspection={handleViewInspection}
              districtName={overmanAssignment.district.district_name}
            />
          ) : currentTab === 'overman-history' ? (
            <OvermanReportsList
              reports={overmanReports}
              onOpenReport={handleOpenOvermanReport}
              onCreateNewReport={handleCreateNewOvermanReport}
            />
          ) : currentTab === 'overman-actions' ? (
            <OvermanCorrectiveActions />
          ) : (
            <OvermanDashboard
              user={user}
              assignment={overmanAssignment}
              receivedInspections={receivedInspections}
              todayReport={currentOvermanReport}
              onOpenReport={() => setCurrentTab('overman-report')}
              onViewSirdarInspection={handleViewInspection}
              onViewOvermanReport={handleOpenOvermanReport}
            />
          )
        ) : sirdarAssignment ? (
          // ================= SIRDAR (PHASE 1) SCREENS =================
          <div className="space-y-6">
            {/* Sirdar Greeting & Assigned Area Banner — Rendered consistently across ALL Sirdar tabs */}
            <div className="bg-gradient-to-r from-sky-50 via-sky-50/50 to-white border-2 border-sky-200 rounded-2xl p-5 sm:p-6 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <div className="flex items-center space-x-2 mb-1.5">
                    <span className="bg-sky-100 text-black text-xs font-bold px-2.5 py-0.5 rounded border border-sky-300 uppercase tracking-wider">
                      Statutory Sirdar In-Charge
                    </span>
                    <span className="text-black font-semibold text-xs">
                      Coal Mines Regulations (CMR) 129(8)
                    </span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-black tracking-tight">
                    Hello {user.name}
                  </h2>
                  <div className="mt-2.5 flex flex-wrap items-center gap-y-1 gap-x-3 text-sm text-black">
                    <span className="flex items-center gap-1 font-bold text-black">
                      <MapPin className="w-4 h-4 text-sky-700 shrink-0" />
                      {sirdarAssignment.mine.mine_name}
                    </span>
                    <span className="text-slate-400">•</span>
                    <span className="font-bold text-sky-950">
                      {sirdarAssignment.district.district_name} ({sirdarAssignment.district.seam_name})
                    </span>
                    <span className="text-slate-400">•</span>
                    <span className="text-black font-medium">
                      Subsidiary: {sirdarAssignment.mine.subsidiary}
                    </span>
                  </div>
                </div>

                <div className="bg-white border-2 border-sky-200 rounded-xl p-3.5 sm:text-right shrink-0 shadow-xs">
                  <div className="text-xs text-black font-bold uppercase tracking-wide">Assigned Area</div>
                  <div className="text-base font-extrabold text-black mt-0.5">
                    Galleryify Section
                  </div>
                  <div className="text-[13px] text-sky-950 font-bold mt-0.5">
                    Panel 4 • All-Shift Inspection
                  </div>
                </div>
              </div>
            </div>

            {/* Sirdar Tab Views */}
            {currentTab === 'wizard' ? (
              <WizardContainer
                assignment={sirdarAssignment}
                initialData={activeDraft}
                onSubmitted={handleSubmittedSuccess}
                onCancel={() => {
                  setActiveDraft(null);
                  setCurrentTab('dashboard');
                }}
              />
            ) : currentTab === 'history' ? (
              <SubmittedHistory
                inspections={sirdarInspections}
                onSelectInspection={handleViewInspection}
                onBackToDashboard={() => setCurrentTab('dashboard')}
              />
            ) : currentTab === 'drafts' ? (
              <DraftsList
                drafts={sirdarInspections.filter((i) => i.status === 'DRAFT')}
                onResumeDraft={handleResumeDraft}
                onRefresh={loadUserData}
              />
            ) : (
              <Dashboard
                user={user}
                assignment={sirdarAssignment}
                inspections={sirdarInspections}
                activeDraft={activeDraft}
                onStartNewInspection={handleStartNewInspection}
                onResumeDraft={handleResumeDraft}
                onViewInspection={handleViewInspection}
              />
            )}
          </div>
        ) : null}
      </main>

      {/* Statutory Compliance Footer */}
      <footer className="bg-white border-t border-slate-300 py-4 px-4 text-center text-[13px] text-black">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="font-extrabold text-black">
            Bharat Coal Statutory Governance System • Phase 1 & 2 Integrated
          </span>
          <span className="text-black font-semibold">
            Compliant with Directorate General of Mines Safety (DGMS) G.S.R. 977(E) [CMR 129(8)] & G.S.R. 972(E) [CMR 47(7)(d)]
          </span>
        </div>
      </footer>
    </div>
  );
}
