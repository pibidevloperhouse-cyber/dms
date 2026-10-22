"use client";

import React, { createContext, useContext, useState, useMemo, useCallback, useEffect } from "react";
import {
  MOCK_DEALS,
  MOCK_STAGES,
  MOCK_ROLES,
  MOCK_PERMISSIONS_MATRIX,
  MOCK_USERS,
  MOCK_APPROVALS,
  MOCK_AUDIT_LOGS,
  MOCK_RISKS,
  MOCK_POLICIES,
  MOCK_REPORTS,
  MOCK_SETTINGS,
} from "@/lib/mock-controls-audit-data";

const ControlsAuditContext = createContext(null);

export function ControlsAuditProvider({ children }) {
  // Selected Deal & Workspace
  const [selectedDealId, setSelectedDealId] = useState("deal-acme-001");
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState("ws-buyer-abc");

  // Core entities in local React state
  const [deals, setDeals] = useState(MOCK_DEALS);
  const [stages, setStages] = useState(MOCK_STAGES);
  const [approvals, setApprovals] = useState(MOCK_APPROVALS);
  const [auditLogs, setAuditLogs] = useState([]);
  const [liveAuthLogs, setLiveAuthLogs] = useState([]);
  const [isLoadingAuthLogs, setIsLoadingAuthLogs] = useState(false);

  // Fetch live authentication activity logs from Supabase
  const fetchAuthLogs = useCallback(async () => {
    try {
      setIsLoadingAuthLogs(true);
      let session = null;
      try {
        const raw = localStorage.getItem("vdr_session");
        if (raw) session = JSON.parse(raw);
      } catch (e) {}

      const companyId = session?.company_id || localStorage.getItem("companyId") || "";
      const role = session?.role || localStorage.getItem("vdrRole") || "super_admin";

      let url = "/api/control-audits/audit-trail";
      const params = new URLSearchParams();
      if (companyId) params.append("companyId", companyId);
      if (role) params.append("role", role);

      const queryStr = params.toString();
      if (queryStr) url += `?${queryStr}`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.logs)) {
          setLiveAuthLogs(data.logs);
        }
      }
    } catch (err) {
      console.warn("Failed to fetch live auth logs:", err);
    } finally {
      setIsLoadingAuthLogs(false);
    }
  }, []);

  useEffect(() => {
    fetchAuthLogs();

    // Auto-refresh when tab gains focus or on storage event
    const handleRefresh = () => fetchAuthLogs();
    window.addEventListener("focus", handleRefresh);
    window.addEventListener("storage", handleRefresh);

    // Periodic auto-poll every 12 seconds so new logins appear immediately
    const pollInterval = setInterval(fetchAuthLogs, 12000);

    return () => {
      window.removeEventListener("focus", handleRefresh);
      window.removeEventListener("storage", handleRefresh);
      clearInterval(pollInterval);
    };
  }, [fetchAuthLogs]);

  // Combined audit logs: live auth logs merged with other audit logs, deduplicated by id
  const combinedAuditLogs = useMemo(() => {
    const seen = new Set();
    const result = [];
    for (const log of [...liveAuthLogs, ...auditLogs]) {
      if (log && log.id && !seen.has(log.id)) {
        seen.add(log.id);
        result.push(log);
      }
    }
    return result;
  }, [liveAuthLogs, auditLogs]);

  const [permissionsMatrix, setPermissionsMatrix] = useState(MOCK_PERMISSIONS_MATRIX);
  const [risks, setRisks] = useState(MOCK_RISKS);
  const [policies, setPolicies] = useState(MOCK_POLICIES);
  const [reports, setReports] = useState(MOCK_REPORTS);
  const [settings, setSettings] = useState(MOCK_SETTINGS);
  const [accessGrants, setAccessGrants] = useState([
    {
      id: "grant-001",
      user: "Alexander Vance",
      userEmail: "a.vance@buyer-abccorp.com",
      role: "Buyer Admin",
      deal: "Acme Corp Acquisition",
      workspace: "Buyer ABC Corp",
      resource: "Financials & Due Diligence",
      permission: "Download with Watermark",
      scope: "Folder Scope",
      grantedBy: "Victoria Sterling",
      grantedAt: "2026-09-01T10:00:00Z",
      expiresAt: "2026-11-30",
      reason: "Buyer diligence lead financial analysis authorization",
    },
    {
      id: "grant-002",
      user: "Dr. Julian Hayes",
      userEmail: "j.hayes@environ-advisors.com",
      role: "External Advisor",
      deal: "Acme Corp Acquisition",
      workspace: "Legal Advisory - Gibson & Dunn",
      resource: "Environmental Audits / Phase II",
      permission: "Clean Room View",
      scope: "Document Tag: Tax & Environment",
      grantedBy: "Sarah Mitchell",
      grantedAt: "2026-08-25T14:30:00Z",
      expiresAt: "2026-10-15",
      reason: "Restricted advisory scope on contamination liability",
    },
  ]);

  // Toast / notification feedback state
  const [activeToast, setActiveToast] = useState(null);

  const showToast = useCallback((message, type = "success") => {
    setActiveToast({ message, type, id: Date.now() });
    setTimeout(() => {
      setActiveToast((prev) => (prev?.id ? null : prev));
    }, 4000);
  }, []);

  const closeToast = useCallback(() => {
    setActiveToast(null);
  }, []);

  // Universal Audit Event Generator
  const addAuditEvent = useCallback(({
    user = "Victoria Sterling",
    userEmail = "v.sterling@acme-holdings.com",
    userRole = "Seller Admin",
    action,
    resource,
    module = "Controls & Audit",
    result = "Success",
    ip = "192.0.2.14",
    device = "Chrome 128 / macOS",
    duration = "0.4s",
    permissionDecision = null,
    metadata = {},
    jsonPayload = {},
  }) => {
    const newLog = {
      id: `aud-${Date.now().toString().slice(-4)}`,
      user,
      userEmail,
      userRole,
      action,
      resource,
      module,
      deal: "Acme Corp Acquisition",
      dealId: selectedDealId,
      result,
      timestamp: new Date().toISOString(),
      ip,
      device,
      duration,
      permissionDecision,
      metadata,
      jsonPayload: {
        event_type: `controls_audit.${action.toLowerCase().replace(/[\s_-]+/g, "_")}`,
        timestamp: new Date().toISOString(),
        actor: user,
        actor_role: userRole,
        resource,
        result,
        ...jsonPayload,
      },
    };

    setAuditLogs((prev) => [newLog, ...prev]);
    return newLog;
  }, [selectedDealId]);

  // Active Deal info
  const activeDeal = useMemo(() => {
    return deals.find((d) => d.id === selectedDealId) || deals[0];
  }, [deals, selectedDealId]);

  // Current stage & gates
  const currentStage = useMemo(() => {
    return stages.find((s) => s.isCurrent) || stages[2];
  }, [stages]);

  // Gate evaluation for current stage
  const gates = useMemo(() => {
    return currentStage.gates || [];
  }, [currentStage]);

  // Check if current stage is ready to advance
  const isReadyToAdvance = useMemo(() => {
    if (!gates || gates.length === 0) return false;
    return gates.every((g) => g.status === "completed");
  }, [gates]);

  // Blocker conditions list for current stage
  const currentBlockers = useMemo(() => {
    const blockers = [];
    gates.forEach((gate) => {
      if (gate.status !== "completed") {
        if (gate.source === "risks") {
          const unmitigated = gate.total - gate.satisfied;
          blockers.push({
            gateId: gate.id,
            source: "Risks",
            title: `${unmitigated} high risks pending mitigation review`,
            description: gate.details,
            link: "/control-audits/risks-alerts",
          });
        } else if (gate.source === "approvals") {
          const pendingCount = gate.total - gate.satisfied;
          blockers.push({
            gateId: gate.id,
            source: "Approvals",
            title: `${pendingCount} required approvals pending signoff`,
            description: gate.details,
            link: "/control-audits/approvals",
          });
        } else {
          blockers.push({
            gateId: gate.id,
            source: gate.source,
            title: `${gate.title} (${gate.satisfied}/${gate.total})`,
            description: gate.details,
            link: gate.source === "documents" ? "/documents" : "/tasks",
          });
        }
      }
    });
    return blockers;
  }, [gates]);

  // KPI Calculations derived directly from active state
  const kpis = useMemo(() => {
    const completedStagesCount = stages.filter((s) => s.status === "completed").length;
    const totalStagesCount = stages.length;
    const pendingApprovalsCount = approvals.filter((a) => a.overallStatus === "pending").length;
    const activeHighRisks = risks.filter((r) => r.severity === "High" && r.status !== "mitigated").length;
    const activePolicyViolations = risks.filter((r) => r.category === "Policy Violation" && r.status !== "mitigated").length;

    // Calculate tasks gated: total blockers + pending milestone checks
    const blockedCount = currentBlockers.length;
    const tasksGatedCount = isReadyToAdvance ? 0 : (blockedCount * 4 + 4);

    return {
      deal: activeDeal,
      stageProgress: {
        currentStageNumber: completedStagesCount + 1,
        totalStages: totalStagesCount,
        display: `${completedStagesCount + 1} of ${totalStagesCount}`,
        currentStageName: currentStage.name,
        status: isReadyToAdvance ? "Ready to Advance" : "In Progress",
        percentage: Math.round(((completedStagesCount + (isReadyToAdvance ? 1 : 0.6)) / totalStagesCount) * 100),
      },
      tasksGated: {
        count: tasksGatedCount,
        subtitle: isReadyToAdvance ? "All Gates Satisfied" : "Blocking Next Stage",
        status: isReadyToAdvance ? "Cleared" : "Blocked",
        isCleared: isReadyToAdvance,
      },
      approvalsPending: {
        count: pendingApprovalsCount,
        subtitle: pendingApprovalsCount === 0 ? "All Chains Signed" : "Awaiting Action",
        status: pendingApprovalsCount === 0 ? "Approved" : "Action Required",
      },
      policyViolations: {
        count: activePolicyViolations,
        subtitle: activePolicyViolations === 0 ? "Zero Active Breaches" : "Requires Attention",
        status: activePolicyViolations === 0 ? "Clean" : "Alert",
      },
      highRisks: {
        count: activeHighRisks,
        subtitle: activeHighRisks === 0 ? "All Mitigated" : "Active",
        status: activeHighRisks === 0 ? "Low" : "Critical",
      },
      accessRequests: {
        count: 8,
        subtitle: "Pending Review",
        status: "Review",
      },
    };
  }, [stages, currentStage, approvals, risks, currentBlockers, isReadyToAdvance, activeDeal]);

  // ── WORKFLOW ACTION: APPROVE / REJECT APPROVAL CHAIN STEP ──
  const approveApprovalStep = useCallback((approvalId, stepNumber, comment = "") => {
    let updatedDocName = "";
    let isFullyApproved = false;

    setApprovals((prev) =>
      prev.map((item) => {
        if (item.id !== approvalId) return item;
        updatedDocName = item.document;

        const updatedChain = item.chain.map((step) => {
          if (step.step === stepNumber) {
            return {
              ...step,
              status: "approved",
              signedAt: new Date().toISOString(),
              comment: comment || step.comment || "Approved by designated signatory.",
            };
          }
          // Queue the next step if this step was previous
          if (step.step === stepNumber + 1 && step.status === "queued") {
            return { ...step, status: "pending" };
          }
          return step;
        });

        isFullyApproved = updatedChain.every((s) => s.status === "approved");

        return {
          ...item,
          chain: updatedChain,
          overallStatus: isFullyApproved ? "approved" : "pending",
        };
      })
    );

    // Update approvals gate in Stage 3 if applicable
    setStages((prev) =>
      prev.map((stage) => {
        if (!stage.isCurrent || !stage.gates) return stage;
        return {
          ...stage,
          gates: stage.gates.map((g) => {
            if (g.source === "approvals") {
              const newSat = Math.min(g.total, g.satisfied + 1);
              return {
                ...g,
                satisfied: newSat,
                status: newSat >= g.total ? "completed" : "pending",
                details: `${newSat} of ${g.total} approvals verified signed.`,
              };
            }
            return g;
          }),
        };
      })
    );

    // Log forensic audit event
    addAuditEvent({
      action: "Approved Document",
      resource: updatedDocName || "Document Approval",
      module: "Approvals",
      result: "Success",
      permissionDecision: {
        rule: "Approval Chain Mandate",
        verdict: "Signoff Recorded",
      },
      metadata: {
        approvalId,
        stepNumber,
        comment,
      },
      jsonPayload: {
        approval_id: approvalId,
        step_number: stepNumber,
        action: "approved",
        signed_at: new Date().toISOString(),
      },
    });

    showToast(`Step ${stepNumber} approved for ${updatedDocName || "document"}.`, "success");
  }, [addAuditEvent, showToast]);

  const rejectApprovalStep = useCallback((approvalId, stepNumber, reason) => {
    let updatedDocName = "";

    setApprovals((prev) =>
      prev.map((item) => {
        if (item.id !== approvalId) return item;
        updatedDocName = item.document;

        const updatedChain = item.chain.map((step) => {
          if (step.step === stepNumber) {
            return {
              ...step,
              status: "rejected",
              signedAt: new Date().toISOString(),
              comment: `REJECTED: ${reason}`,
            };
          }
          return step;
        });

        return {
          ...item,
          chain: updatedChain,
          overallStatus: "rejected",
        };
      })
    );

    // Log forensic audit event
    addAuditEvent({
      action: "Rejected Document",
      resource: updatedDocName || "Document Approval",
      module: "Approvals",
      result: "Denied",
      permissionDecision: {
        rule: "Approval Policy Rejection",
        verdict: "Signoff Refused",
        reason,
      },
      metadata: {
        approvalId,
        stepNumber,
        rejectionReason: reason,
      },
      jsonPayload: {
        approval_id: approvalId,
        step_number: stepNumber,
        action: "rejected",
        reason,
      },
    });

    showToast(`Approval rejected for ${updatedDocName}: "${reason}"`, "error");
  }, [addAuditEvent, showToast]);

  const escalateApprovalStep = useCallback((approvalId, stepNumber) => {
    let updatedDocName = "";

    setApprovals((prev) =>
      prev.map((item) => {
        if (item.id !== approvalId) return item;
        updatedDocName = item.document;

        const updatedChain = item.chain.map((step) => {
          if (step.step === stepNumber) {
            return { ...step, status: "overdue" };
          }
          return step;
        });

        return { ...item, chain: updatedChain };
      })
    );

    addAuditEvent({
      action: "Escalated Approval",
      resource: updatedDocName || "Document Approval",
      module: "Approvals",
      result: "Flagged",
      metadata: { approvalId, stepNumber, action: "escalated" },
    });

    showToast(`Escalation alert dispatched for ${updatedDocName}.`, "info");
  }, [addAuditEvent, showToast]);

  // ── WORKFLOW ACTION: STAGE GATE RESOLUTION (RESOLVE RISKS/GATES) ──
  const resolveStageGateCondition = useCallback((gateSource) => {
    setStages((prev) =>
      prev.map((stage) => {
        if (!stage.isCurrent || !stage.gates) return stage;
        return {
          ...stage,
          gates: stage.gates.map((gate) => {
            if (gate.source === gateSource) {
              return {
                ...gate,
                satisfied: gate.total,
                status: "completed",
                details: `All ${gate.total} requirements verified and satisfied.`,
              };
            }
            return gate;
          }),
        };
      })
    );

    // If resolving risks, mark high risks as mitigated
    if (gateSource === "risks") {
      setRisks((prev) =>
        prev.map((r) =>
          r.severity === "High" ? { ...r, status: "mitigated" } : r
        )
      );
    }

    addAuditEvent({
      action: "Gate Condition Satisfied",
      resource: `Stage 3 Gate: ${gateSource}`,
      module: "Stage Control",
      result: "Success",
      metadata: { gateSource, updatedStatus: "completed" },
    });

    showToast(`Gate "${gateSource}" satisfied. Blocker removed.`, "success");
  }, [addAuditEvent, showToast]);

  // ── WORKFLOW ACTION: ADVANCE STAGE ──
  const advanceDealStage = useCallback(() => {
    setStages((prev) => {
      const currentIdx = prev.findIndex((s) => s.isCurrent);
      if (currentIdx === -1 || currentIdx === prev.length - 1) return prev;

      return prev.map((s, idx) => {
        if (idx === currentIdx) {
          return {
            ...s,
            status: "completed",
            isCurrent: false,
            completedAt: new Date().toISOString().slice(0, 10),
          };
        }
        if (idx === currentIdx + 1) {
          return {
            ...s,
            status: "in_progress",
            isCurrent: true,
          };
        }
        return s;
      });
    });

    addAuditEvent({
      action: "Stage Changed",
      resource: "Deal Progression: Stage 3 (Negotiation) → Stage 4 (Approvals)",
      module: "Stage Control",
      result: "Success",
      permissionDecision: {
        rule: "Stage Advancement Policy",
        verdict: "Advancement Authorized",
      },
      metadata: {
        previousStage: "Negotiation",
        nextStage: "Approvals",
        allGatesVerified: true,
      },
    });

    showToast("Acme Corp Acquisition successfully advanced to Stage 4: Approvals!", "success");
  }, [addAuditEvent, showToast]);

  // ── WORKFLOW ACTION: UPDATE PERMISSION CELL IN MATRIX ──
  const updatePermissionCell = useCallback((actionName, roleName, newStatus, reason = "") => {
    let prevStatus = "unknown";

    setPermissionsMatrix((prev) =>
      prev.map((row) => {
        if (row.action !== actionName) return row;
        prevStatus = row.roles[roleName]?.status || "unknown";

        return {
          ...row,
          roles: {
            ...row.roles,
            [roleName]: {
              status: newStatus,
              source: "Direct Workspace Grant",
              reason: reason || `Updated by Seller Admin to ${newStatus}.`,
            },
          },
        };
      })
    );

    addAuditEvent({
      action: "Changed Permission",
      resource: `${roleName} → ${actionName}`,
      module: "Permissions",
      result: "Success",
      metadata: {
        action: actionName,
        role: roleName,
        previousStatus: prevStatus,
        newStatus,
        reason,
      },
      jsonPayload: {
        role: roleName,
        permission: actionName,
        old_value: prevStatus,
        new_value: newStatus,
      },
    });

    showToast(`Updated ${roleName} permission for "${actionName}" to ${newStatus}.`, "success");
  }, [addAuditEvent, showToast]);

  // ── WORKFLOW ACTION: CREATE ACCESS GRANT ──
  const createAccessGrant = useCallback((grantData) => {
    const newGrant = {
      id: `grant-${Date.now().toString().slice(-4)}`,
      grantedBy: "Victoria Sterling",
      grantedAt: new Date().toISOString(),
      ...grantData,
    };

    setAccessGrants((prev) => [newGrant, ...prev]);

    addAuditEvent({
      action: "Granted Access",
      resource: `${grantData.user} (${grantData.role}) → ${grantData.resource}`,
      module: "Permissions",
      result: "Success",
      permissionDecision: {
        rule: "Explicit Access Grant",
        verdict: "Allowed",
        scope: grantData.scope,
      },
      metadata: grantData,
    });

    showToast(`Access granted to ${grantData.user} for "${grantData.resource}".`, "success");
    return newGrant;
  }, [addAuditEvent, showToast]);

  // ── WORKFLOW ACTION: UPDATE RISK MITIGATION STATUS ──
  const updateRiskStatus = useCallback((riskId, newStatus, mitigationNotes = "") => {
    let targetRiskTitle = "";
    let prevStatus = "";

    setRisks((prev) => {
      const updated = prev.map((r) => {
        if (r.id !== riskId) return r;
        targetRiskTitle = r.title;
        prevStatus = r.status;
        return {
          ...r,
          status: newStatus,
          mitigationPlan: mitigationNotes ? `${r.mitigationPlan} [Update: ${mitigationNotes}]` : r.mitigationPlan,
        };
      });

      // If all high blocking risks are now mitigated, automatically satisfy the stage 3 risk gate
      const remainingBlocking = updated.filter(
        (r) => r.blocksStageAdvancement && r.status !== "mitigated"
      ).length;

      if (remainingBlocking === 0) {
        setStages((stagePrev) =>
          stagePrev.map((s) => {
            if (!s.isCurrent || !s.gates) return s;
            return {
              ...s,
              gates: s.gates.map((g) => {
                if (g.source === "risks") {
                  return {
                    ...g,
                    satisfied: g.total,
                    status: "completed",
                    details: `All ${g.total} high risks reviewed and mitigated.`,
                  };
                }
                return g;
              }),
            };
          })
        );
      }

      return updated;
    });

    addAuditEvent({
      action: "Updated Risk Mitigation",
      resource: `${targetRiskTitle || "Deal Risk"} [Status: ${newStatus}]`,
      module: "Risks & Alerts",
      result: newStatus === "mitigated" ? "Success" : "Flagged",
      metadata: {
        riskId,
        previousStatus: prevStatus,
        newStatus,
        mitigationNotes,
      },
      jsonPayload: {
        risk_id: riskId,
        previous_status: prevStatus,
        new_status: newStatus,
        notes: mitigationNotes,
      },
    });

    showToast(`Risk "${targetRiskTitle || riskId}" status updated to ${newStatus}.`, "success");
  }, [addAuditEvent, showToast]);

  // ── WORKFLOW ACTION: CREATE NEW RISK ──
  const createRisk = useCallback((riskData) => {
    const newRisk = {
      id: `risk-${Date.now().toString().slice(-4)}`,
      ownerAvatar: (riskData.owner || "VS").split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2),
      status: "active",
      dealId: selectedDealId,
      deal: activeDeal?.name || "Acme Corp Acquisition",
      ...riskData,
    };

    setRisks((prev) => [newRisk, ...prev]);

    addAuditEvent({
      action: "Created Risk",
      resource: newRisk.title,
      module: "Risks & Alerts",
      result: newRisk.severity === "High" ? "Flagged" : "Success",
      metadata: {
        riskId: newRisk.id,
        severity: newRisk.severity,
        category: newRisk.category,
        owner: newRisk.owner,
      },
      jsonPayload: {
        risk_id: newRisk.id,
        title: newRisk.title,
        severity: newRisk.severity,
        category: newRisk.category,
      },
    });

    showToast(`New ${newRisk.severity} Risk "${newRisk.title}" logged.`, "info");
    return newRisk;
  }, [selectedDealId, activeDeal, addAuditEvent, showToast]);

  // ── WORKFLOW ACTION: TOGGLE POLICY STATUS ──
  const togglePolicyStatus = useCallback((policyId) => {
    let policyName = "";
    let nextStatus = "Active";

    setPolicies((prev) =>
      prev.map((p) => {
        if (p.id !== policyId) return p;
        policyName = p.name;
        nextStatus = p.status === "Active" ? "Inactive" : "Active";
        return {
          ...p,
          status: nextStatus,
          lastUpdated: new Date().toISOString().slice(0, 10),
        };
      })
    );

    addAuditEvent({
      action: "Policy Status Changed",
      resource: `${policyName} [${nextStatus}]`,
      module: "Policies",
      result: nextStatus === "Active" ? "Success" : "Flagged",
      metadata: {
        policyId,
        newStatus: nextStatus,
      },
      jsonPayload: {
        policy_id: policyId,
        policy_name: policyName,
        status: nextStatus,
        updated_at: new Date().toISOString(),
      },
    });

    showToast(`Policy "${policyName}" is now ${nextStatus}.`, nextStatus === "Active" ? "success" : "info");
  }, [addAuditEvent, showToast]);

  // ── WORKFLOW ACTION: CREATE GOVERNANCE POLICY ──
  const createPolicy = useCallback((policyData) => {
    const newPolicy = {
      id: `pol-${Date.now().toString().slice(-4)}`,
      lastUpdated: new Date().toISOString().slice(0, 10),
      owner: "Victoria Sterling",
      dealId: selectedDealId,
      status: "Active",
      ...policyData,
    };

    setPolicies((prev) => [newPolicy, ...prev]);

    addAuditEvent({
      action: "Created Governance Policy",
      resource: newPolicy.name,
      module: "Policies",
      result: "Success",
      metadata: {
        policyId: newPolicy.id,
        scope: newPolicy.scope,
        enforcementLevel: newPolicy.enforcementLevel,
      },
      jsonPayload: {
        policy_id: newPolicy.id,
        policy_name: newPolicy.name,
        scope: newPolicy.scope,
      },
    });

    showToast(`Governance Policy "${newPolicy.name}" created and enforced.`, "success");
    return newPolicy;
  }, [selectedDealId, addAuditEvent, showToast]);

  // ── WORKFLOW ACTION: UPDATE POLICY ──
  const updatePolicy = useCallback((policyId, updatedFields) => {
    let policyName = "";

    setPolicies((prev) =>
      prev.map((p) => {
        if (p.id !== policyId) return p;
        policyName = p.name;
        return {
          ...p,
          ...updatedFields,
          lastUpdated: new Date().toISOString().slice(0, 10),
        };
      })
    );

    addAuditEvent({
      action: "Updated Governance Policy",
      resource: policyName,
      module: "Policies",
      result: "Success",
      metadata: { policyId, updatedFields },
    });

    showToast(`Governance Policy "${policyName}" updated.`, "success");
  }, [addAuditEvent, showToast]);

  // ── WORKFLOW ACTION: GENERATE COMPLIANCE REPORT ──
  const generateReport = useCallback((reportId, format = "PDF") => {
    let reportTitle = "";
    setReports((prev) =>
      prev.map((r) => {
        if (r.id !== reportId) return r;
        reportTitle = r.title;
        return {
          ...r,
          generatedAt: new Date().toISOString(),
          recordsCount: r.recordsCount + Math.floor(Math.random() * 5) + 1,
        };
      })
    );

    addAuditEvent({
      action: "Generated Compliance Report",
      resource: `${reportTitle || reportId} [Format: ${format}]`,
      module: "Reports",
      result: "Success",
      metadata: { reportId, format, dealId: selectedDealId },
      jsonPayload: {
        report_id: reportId,
        report_title: reportTitle,
        format,
        generated_at: new Date().toISOString(),
      },
    });

    showToast(`Generated "${reportTitle}" in ${format} format. Ready for download.`, "success");
  }, [selectedDealId, addAuditEvent, showToast]);

  // ── WORKFLOW ACTION: UPDATE SETTINGS SECTION ──
  const updateSettings = useCallback((sectionKey, newValues) => {
    setSettings((prev) => ({
      ...prev,
      [sectionKey]: {
        ...prev[sectionKey],
        ...newValues,
      },
    }));

    addAuditEvent({
      action: "Updated Governance Settings",
      resource: `Settings Section: ${sectionKey}`,
      module: "Settings",
      result: "Success",
      metadata: { section: sectionKey, updatedFields: Object.keys(newValues) },
      jsonPayload: {
        section: sectionKey,
        new_values: newValues,
        updated_at: new Date().toISOString(),
      },
    });

    showToast(`Saved configuration for ${sectionKey}.`, "success");
  }, [addAuditEvent, showToast]);

  // ── WORKFLOW ACTION: RESET SETTINGS TO DEFAULT ──
  const resetSettingsToDefault = useCallback(() => {
    setSettings(MOCK_SETTINGS);

    addAuditEvent({
      action: "Reset Governance Settings",
      resource: "All Configuration Sections Restored to Default",
      module: "Settings",
      result: "Success",
    });

    showToast("Controls & Audit configurations restored to defaults.", "info");
  }, [addAuditEvent, showToast]);

  const value = {
    // Selection state
    selectedDealId,
    setSelectedDealId,
    selectedWorkspaceId,
    setSelectedWorkspaceId,
    activeDeal,

    // Entities
    deals,
    stages,
    currentStage,
    gates,
    isReadyToAdvance,
    currentBlockers,
    approvals,
    auditLogs: combinedAuditLogs,
    rawAuditLogs: auditLogs,
    liveAuthLogs,
    isLoadingAuthLogs,
    refreshAuditLogs: fetchAuthLogs,
    permissionsMatrix,
    roles: MOCK_ROLES,
    users: MOCK_USERS,
    accessGrants,
    risks,
    policies,
    reports,
    settings,
    kpis,

    // Workflow actions
    addAuditEvent,
    approveApprovalStep,
    rejectApprovalStep,
    escalateApprovalStep,
    resolveStageGateCondition,
    advanceDealStage,
    updatePermissionCell,
    createAccessGrant,
    updateRiskStatus,
    createRisk,
    togglePolicyStatus,
    createPolicy,
    updatePolicy,
    generateReport,
    updateSettings,
    resetSettingsToDefault,

    // Feedback
    activeToast,
    showToast,
    closeToast,
  };

  return (
    <ControlsAuditContext.Provider value={value}>
      {children}
      {/* Universal Floating Toast */}
      {activeToast && (
        <div className="fixed bottom-6 right-6 z-[200] max-w-md animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div
            className={`px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-3 text-xs font-semibold ${
              activeToast.type === "error"
                ? "bg-rose-50 border-rose-300 text-rose-800"
                : activeToast.type === "info"
                ? "bg-blue-50 border-blue-300 text-blue-800"
                : "bg-emerald-50 border-emerald-300 text-emerald-800"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                activeToast.type === "error"
                  ? "bg-rose-500"
                  : activeToast.type === "info"
                  ? "bg-blue-500"
                  : "bg-emerald-500"
              }`}
            />
            <span className="flex-1">{activeToast.message}</span>
            <button
              onClick={closeToast}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-md transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </ControlsAuditContext.Provider>
  );
}

export function useControlsAudit() {
  const context = useContext(ControlsAuditContext);
  if (!context) {
    throw new Error("useControlsAudit must be used within a ControlsAuditProvider");
  }
  return context;
}
