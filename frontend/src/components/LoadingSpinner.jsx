export default function LoadingSpinner({ size = 'md', fullScreen = false }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' };
  const spinner = (
    <div className={`${sizes[size]} border-2 border-brand-500 border-t-transparent rounded-full animate-spin`} />
  );
  if (fullScreen) return (
    <div className="fixed inset-0 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm z-50">
      <div className="flex flex-col items-center gap-4">
        {spinner}
        <span className="text-slate-400 text-sm animate-pulse">Loading...</span>
      </div>
    </div>
  );
  return spinner;
}
