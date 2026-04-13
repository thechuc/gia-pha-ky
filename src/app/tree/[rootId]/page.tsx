import { Suspense } from "react";
import { FamilyTreeWrapper } from "@/components/tree/FamilyTreeWrapper";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ToastProvider } from "@/components/ui/Toast";

function TreeLoadingFallback() {
  return (
    <div className="w-full h-screen flex flex-col items-center justify-center bg-[#F8FAFC]">
      <div className="w-14 h-14 rounded-full border-[3px] border-slate-300 border-t-slate-800 animate-spin shadow-lg" />
      <p className="mt-6 text-slate-600 text-sm font-serif italic tracking-wider">
        Đang xây dựng di sản tộc phả...
      </p>
    </div>
  );
}

export default async function SubTreePage({ params }: { params: Promise<{ rootId: string }> }) {
  const resolvedParams = await params;
  const rootId = resolvedParams.rootId;

  return (
    <ToastProvider>
      <main className="w-screen h-screen relative overflow-hidden bg-[#F1F5F9] m-0 p-0 overscroll-none">
        {/* Nút Back để về lại dashboard (optional tuỳ người dùng, nhưng thêm vào sẽ tốt hơn cho UX) */}
        <div className="absolute top-6 left-6 z-50">
          <Link 
            href="/dashboard/tree" 
            className="flex items-center justify-center w-10 h-10 bg-white/80 backdrop-blur-md rounded-full shadow-lg border border-slate-200 text-slate-600 hover:text-indigo-600 hover:bg-white transition-all cursor-pointer"
            title="Trở về thân cây chính"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </div>

        <div className="absolute inset-0">
          <Suspense fallback={<TreeLoadingFallback />}>
            <FamilyTreeWrapper rootId={rootId} />
          </Suspense>
        </div>
      </main>
    </ToastProvider>
  );
}
