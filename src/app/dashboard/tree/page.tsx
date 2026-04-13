import { Suspense } from "react";
import { FamilyTreeWrapper } from "@/components/tree/FamilyTreeWrapper";

function TreeLoadingFallback() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-[#120808]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full border-2 border-yellow-800/30 border-t-yellow-600/60 animate-spin" />
        <p className="text-yellow-900/50 text-sm font-serif italic">Đang tải cây gia phả...</p>
      </div>
    </div>
  );
}

export default function TreePage() {
  return (
    <main className="flex-1 relative overflow-hidden bg-[#0F0808]">
      <div className="absolute inset-0">
        <Suspense fallback={<TreeLoadingFallback />}>
          <FamilyTreeWrapper />
        </Suspense>
      </div>
    </main>
  );
}
