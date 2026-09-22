export default function AppLoading() {
  return (
    <div className="flex-1 p-4 sm:p-5 space-y-4 animate-pulse">
      {/* Top Header skeleton */}
      <div className="flex items-center justify-between px-1">
        <div className="space-y-1.5">
          <div className="h-3 w-20 bg-[#EAE6DE] rounded-full" />
          <div className="h-7 w-36 bg-[#EAE6DE] rounded-xl" />
        </div>
        <div className="h-8 w-24 bg-[#EAE6DE] rounded-full" />
      </div>

      {/* Hero Card Skeleton */}
      <div className="h-44 w-full bg-gradient-to-b from-[#F4F1EA] to-[#EAE6DE]/60 rounded-3xl border border-[#EAE6DE]" />

      {/* Action / Category Pills Skeleton */}
      <div className="flex items-center gap-2 overflow-hidden py-1 px-1">
        <div className="h-8 w-20 bg-[#EAE6DE] rounded-full shrink-0" />
        <div className="h-8 w-24 bg-[#EAE6DE] rounded-full shrink-0" />
        <div className="h-8 w-28 bg-[#EAE6DE] rounded-full shrink-0" />
      </div>

      {/* Content List / Grid Skeletons */}
      <div className="space-y-3 pt-1">
        <div className="h-20 w-full bg-white rounded-2xl border border-[#EAE6DE]/80 shadow-2xs" />
        <div className="h-20 w-full bg-white rounded-2xl border border-[#EAE6DE]/80 shadow-2xs" />
        <div className="h-20 w-full bg-white rounded-2xl border border-[#EAE6DE]/80 shadow-2xs" />
      </div>
    </div>
  );
}
