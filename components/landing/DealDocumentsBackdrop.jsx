export default function DealDocumentsBackdrop({ isBidding, isClosed }) {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 hidden text-white md:block">
      <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.6"
        strokeLinejoin="round" strokeLinecap="round"
        className="absolute left-[5.4%] top-[81%] mt-3 w-14 -translate-x-1/2 opacity-85 lg:w-16">
        <path d="M7 48V21h16l5 5h22v6" />
        <path d="M16 33V12h23l6 6v14M22 32V18h19l6 6v8M27 24h10M27 28h13" />
        <path d="M7 48l7-16h43l-7 20H10z" />
      </svg>
      <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.6"
        strokeLinejoin="round" strokeLinecap="round"
        className="absolute right-[5.4%] top-[81%] mt-3 w-14 translate-x-1/2 lg:w-16">
        <g opacity=".85">
          <path d="M15 7h25l9 9v39H15zM40 7v10h9M21 22h16M21 28h21M21 34h16" />
          {(isBidding || isClosed) && <path d="M21 47h19" />}
        </g>
        {isClosed && (
          <g className="text-teal-300">
            <path d="M21 45q8-14 6-5t3 1q2-4 3 1t7-2" pathLength="1"
              strokeDasharray="1" className="deal-signature" />
            <circle cx="48" cy="49" r="8" fill="#0d3246" />
            <path d="m44 49 3 3 5-6" />
          </g>
        )}
      </svg>
      <style jsx>{`
        @keyframes sign {
          from { stroke-dashoffset: 1; }
          to { stroke-dashoffset: 0; }
        }
        @media (prefers-reduced-motion: no-preference) {
          .deal-signature { animation: sign 550ms ease-out both; }
        }
      `}</style>
    </div>
  );
}
