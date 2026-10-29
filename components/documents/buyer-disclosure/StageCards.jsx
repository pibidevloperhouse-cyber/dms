"use client";

import React from 'react';
import { FaLock } from 'react-icons/fa';

export default function StageCards({
    stages = [],
    activeStageId,
    onSelectStage,
    onOpenAccessModal,
    viewMode = 'seller'
}) {
    const isBuyerMode = viewMode === 'buyer';

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 my-2">
            {(stages || []).map((stage) => {
                const isActive = stage.id === activeStageId || stage.stageNumber === activeStageId;
                const canBuyerAccess = stage.buyerAccess === 'can_view';
                const count = stage.itemCount ?? (stage.items ? stage.items.length : 0);

                return (
                    <div
                        key={stage.id}
                        onClick={() => onSelectStage?.(stage.id)}
                        className={`bg-white rounded-xl p-4 flex items-center justify-between cursor-pointer transition-all duration-150 shadow-2xs hover:shadow-xs ${
                            isActive
                                ? 'border-2 border-[#0e7490] ring-1 ring-[#0e7490]/20'
                                : 'border border-slate-200 hover:border-slate-300'
                        }`}
                    >
                        {/* Left: Icon + Title & items count */}
                        <div className="flex items-center gap-3">
                            {canBuyerAccess ? (
                                <div className="w-7 h-7 rounded-full bg-[#086375] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                                    {stage.stageNumber || '1'}
                                </div>
                            ) : (
                                <div className="w-7 h-7 rounded-full bg-slate-800 text-amber-300 flex items-center justify-center text-[11px] shrink-0">
                                    <FaLock />
                                </div>
                            )}

                            <div>
                                <h3 className="text-[14px] font-bold text-slate-900 leading-tight">
                                    {stage.name}
                                </h3>
                                <p className="text-[12px] font-medium text-slate-400 mt-0.5">
                                    {count} {count === 1 ? 'item' : 'items'}
                                </p>
                            </div>
                        </div>

                        {/* Right: Action Button */}
                        <div className="shrink-0 pl-3">
                            {!isBuyerMode ? (
                                canBuyerAccess ? (
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onOpenAccessModal?.(stage, 'revoke');
                                        }}
                                        className="px-3.5 py-1.5 text-xs font-semibold text-[#8B0000] bg-white border border-rose-300 hover:bg-rose-50 rounded-lg transition-colors shadow-2xs"
                                    >
                                        Revoke access
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onOpenAccessModal?.(stage, 'grant');
                                        }}
                                        className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#0e6f7c] hover:bg-[#09525c] active:bg-[#073c44] rounded-lg transition-colors shadow-2xs"
                                    >
                                        Grant buyer access
                                    </button>
                                )
                            ) : (
                                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                                    canBuyerAccess
                                        ? 'bg-emerald-50 text-emerald-700'
                                        : 'bg-slate-100 text-slate-500'
                                }`}>
                                    {canBuyerAccess ? 'Visible' : 'Locked'}
                                </span>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
