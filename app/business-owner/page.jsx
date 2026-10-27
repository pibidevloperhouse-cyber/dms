"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import SummaryCard from '@/components/business-owner/SummaryCard';
import {
  FaBuilding,
  FaUsers,
  FaDatabase,
  FaTags,
  FaHistory,
  FaArrowRight,
  FaCheckCircle,
  FaEnvelope,
  FaShieldAlt,
} from 'react-icons/fa';

export default function BusinessOwnerOverviewPage() {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);

  const fetchOverview = async () => {
    try {
      const res = await fetch('/api/business-owner/overview');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
      const pendingRes = await fetch('/api/request-workspace?status=pending');
      if (pendingRes.ok) {
        const pJson = await pendingRes.json();
        if (pJson.success && pJson.requests) {
          setPendingCount(pJson.requests.length);
        }
      }
    } catch (err) {
      console.error('Failed to load overview data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 rounded-3xl bg-white border border-slate-200" />
          ))}
        </div>
        <div className="h-64 rounded-3xl bg-white border border-slate-200 animate-pulse" />
      </div>
    );
  }

  const getActivityIcon = (type) => {
    switch (type) {
      case 'org':
        return <FaBuilding className="text-[var(--brand)]" />;
      case 'storage':
        return <FaDatabase className="text-emerald-600" />;
      case 'plan':
        return <FaTags className="text-amber-600" />;
      case 'email':
        return <FaEnvelope className="text-purple-600" />;
      default:
        return <FaShieldAlt className="text-[var(--brand)]" />;
    }
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 fade-in duration-700">
      {/* Page Title & Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Virtual Data Room Command Center
          </h1>
          <p className="text-slate-500 mt-2 text-[15px]">
            Monitor organization growth, file vault storage quotas, and SaaS subscription tiers across all tenants.
          </p>
        </div>

        <Link
          href="/business-owner/organizations"
          className="px-6 py-2.5 bg-[var(--brand)] hover:bg-[var(--brand-dark)] text-white text-sm font-medium rounded-xl hover:shadow-lg hover:-translate-y-0.5 transition-all duration-500 flex items-center gap-2 w-fit"
        >
          <span>Manage Organizations</span>
          <FaArrowRight />
        </Link>
      </div>

      {/* Pending Requests Minimal Alert Banner */}
      {pendingCount > 0 && (
        <div className="bg-white border border-[var(--brand)]/20 rounded-2xl p-5 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-[var(--brand)]/10 text-[var(--brand)] flex items-center justify-center text-lg font-bold shrink-0">
              <FaBuilding />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  Pending Workspace Requests
                </h3>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[var(--brand)]/10 text-[var(--brand)]">
                  {pendingCount} new
                </span>
              </div>
              <p className="text-slate-500 text-sm mt-0.5">
                Organizations require executive approval to initialize VDR vaults.
              </p>
            </div>
          </div>
          <Link
            href="/business-owner/workspace-requests"
            className="px-5 py-2.5 bg-[var(--brand)] hover:bg-[var(--brand-dark)] text-white font-semibold text-sm rounded-xl transition-all shadow-2xs shrink-0"
          >
            Review Requests
          </Link>
        </div>
      )}

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <SummaryCard
          title="Total Organizations"
          value={data.totalOrganizations}
          subtitle={`${data.activeOrgs} Active • ${data.trialOrgs} in Trial`}
          icon={FaBuilding}
          trend="+14% this month"
          trendPositive={true}
          colorScheme="brand"
        />

        <SummaryCard
          title="Total Users"
          value={data.totalUsers.toLocaleString()}
          subtitle="Assigned tenant seats"
          icon={FaUsers}
          trend="+8% this week"
          trendPositive={true}
          colorScheme="purple"
        />

        <SummaryCard
          title="Storage Usage"
          value={`${data.storageUsedGb} GB`}
          subtitle={`of ${data.storageLimitGb} GB Allocated`}
          icon={FaDatabase}
          progress={data.storagePercentage}
          colorScheme="emerald"
        />

        <SummaryCard
          title="Active Plans"
          value={data.activePlansCount}
          subtitle="Free • Pro • Enterprise"
          icon={FaTags}
          trend="All Tiers Live"
          trendPositive={true}
          colorScheme="amber"
        />
      </div>

      {/* Main Grid: Recent Activity & Top Tenant Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity Stream */}
        <div className="lg:col-span-2 bg-white/80 backdrop-blur-xl border border-slate-200/80 rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-soft flex items-center justify-center text-[var(--brand)]">
                <FaHistory className="text-base" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Recent Admin Activity</h2>
            </div>
            <span className="text-xs text-slate-500 font-medium">Real-Time Audit Stream</span>
          </div>

          <div className="space-y-4">
            {data.recentActivity && data.recentActivity.length > 0 ? (
              data.recentActivity.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50/70 border border-slate-100 hover:border-slate-200 transition-all"
                >
                  <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                    {getActivityIcon(log.iconType)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold text-slate-900 truncate">
                        {log.action}
                      </p>
                      <span className="text-xs text-slate-400 shrink-0">
                        {log.timestamp}
                      </span>
                    </div>
                    <p className="text-[13.5px] text-slate-600 mt-1">
                      {log.description}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-slate-500 text-sm py-8">
                No recent activity recorded yet.
              </p>
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Plan Distribution Card */}
          <div className="bg-white/80 backdrop-blur-xl border border-slate-200/80 rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight pb-4 border-b border-slate-100 mb-5">
              Tenant Tiers
            </h2>
            <div className="space-y-5">
              {Object.entries(data.planCounts || {}).map(([planName, count]) => {
                const total = data.totalOrganizations || 1;
                const pct = Math.round((count / total) * 100);
                return (
                  <div key={planName}>
                    <div className="flex justify-between text-sm font-semibold mb-2">
                      <span className="text-slate-700">{planName} Plan</span>
                      <span className="text-[var(--brand)]">
                        {count} {count === 1 ? 'Org' : 'Orgs'} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[var(--brand)] rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(8, pct)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Shortcuts */}
          <div className="bg-white/80 backdrop-blur-xl border border-slate-200/80 rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight pb-4 border-b border-slate-100 mb-5">
              Quick Actions
            </h2>
            <div className="space-y-3">
              <Link
                href="/business-owner/organizations"
                className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-sm text-slate-700 hover:text-slate-900 transition-all font-medium"
              >
                <span>Add Tenant Organization</span>
                <FaArrowRight className="text-slate-400" />
              </Link>
              <Link
                href="/business-owner/storage"
                className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-sm text-slate-700 hover:text-slate-900 transition-all font-medium"
              >
                <span>Update Storage Quotas</span>
                <FaArrowRight className="text-slate-400" />
              </Link>
              <Link
                href="/business-owner/email-templates"
                className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-sm text-slate-700 hover:text-slate-900 transition-all font-medium"
              >
                <span>Edit Email Templates</span>
                <FaArrowRight className="text-slate-400" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
