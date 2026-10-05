export default function MyTeaserPage() {
  return (
    <div className="p-8 w-full max-w-7xl mx-auto flex flex-col items-center justify-center min-h-[500px]">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center w-full max-w-2xl">
        <div className="w-20 h-20 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Show My Teaser</h2>
        <p className="text-gray-500 mb-8">
          This is your personal teaser space. You can view or manage your teaser details here.
        </p>
      </div>
    </div>
  );
}
