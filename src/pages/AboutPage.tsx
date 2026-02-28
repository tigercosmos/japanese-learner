export default function AboutPage() {
  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 dark:text-gray-50 mb-6">關於</h2>

      <div className="space-y-1">
        <a
          href="https://github.com/tigercosmos/japanese-learner"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between py-4 px-4 bg-white dark:bg-gray-800 rounded-t-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <div>
            <div className="font-medium text-gray-900 dark:text-gray-50">GitHub</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">tigercosmos/japanese-learner</div>
          </div>
          <svg className="w-5 h-5 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
          </svg>
        </a>

        <a
          href="https://tigercosmos.xyz/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between py-4 px-4 bg-white dark:bg-gray-800 rounded-b-xl border border-t-0 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <div>
            <div className="font-medium text-gray-900 dark:text-gray-50">作者網站</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">tigercosmos.xyz</div>
          </div>
          <svg className="w-5 h-5 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
          </svg>
        </a>
      </div>
    </div>
  );
}
