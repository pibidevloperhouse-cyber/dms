"use client";

import React from 'react';

export default function StageCards({
    stages = [],
    activeStageId,
    onSelectStage,
    onOpenAccessModal
}) {
    // Deduplicate stages to guarantee no duplicate stage cards render (fixes img1)
    const uniqueStages = React.useMemo(() => {
        const result = [];
        const seen = new Set();
        for (const stage of (stages || [])) {
            const key = stage.stageNumber ?? stage.name ?? stage.id;
            if (!seen.has(key)) {
                seen.add(key);
                result.push(stage);
            }
        }
        return result;
    }, [stages]);

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 my-2">
            {uniqueStages.map((stage) => {
                const isActive = stage.id === activeStageId || stage.stageNumber === activeStageId;
                const canBuyerAccess = stage.buyerAccess === 'can_view';
                const count = stage.itemCount ?? (stage.items ? stage.items.length : 0);

                return (
                    <div
                        key={stage.id}
                        onClick={() => onSelectStage?.(stage.id)}
                        className={`bg-white rounded-xl p-4 flex items-center justify-between cursor-pointer transition-all duration-150 shadow-2xs hover:shadow-xs ${isActive
                            ? 'border-2 border-[#0e7490] ring-1 ring-[#0e7490]/20'
                            : 'border border-slate-200 hover:border-slate-300'
                            }`}
                    >
                        {/* Left: Icon + Title & items count */}
                        <div className="flex items-center gap-3">
                            <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                                {stage.stageNumber || '1'}
                            </div>

                            <div>
                                <h3 className="text-[14px] font-bold text-slate-900 leading-tight">
                                    {stage.name}
                                </h3>
                                <p className="text-[12px] font-medium text-slate-400 mt-0.5">
                                    {count} {count === 1 ? 'item' : 'items'}
                                </p>
                            </div>
                        </div>

                        {/* Right: Action Button (matching img2 exactly) */}
                        <div className="shrink-0 pl-3">
                            {canBuyerAccess ? (
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
                                    Grant access
                                </button>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
