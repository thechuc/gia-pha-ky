import { ArrowRight, TreeDeciduous, Scroll, CalendarDays, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

export function Navbar({ isPublic }: { isPublic?: boolean }) {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border transition-all">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-2 group cursor-pointer">
          <div className="w-10 h-10 bg-primary flex items-center justify-center rounded-lg border border-secondary shadow-lg group-hover:scale-110 transition-transform">
            <span className="text-secondary font-serif text-2xl font-bold">G</span>
          </div>
          <span className="text-2xl font-serif font-bold tracking-tight text-primary">Gia Phả Ký</span>
        </div>
        
        <div className="flex items-center gap-4 md:gap-8 text-sm font-medium">
          <div className="hidden md:flex items-center gap-8">
            <Link href="#features" className="hover:text-primary transition-colors">Tính năng</Link>
            <Link href="#about" className="hover:text-primary transition-colors">Câu chuyện</Link>
          </div>
          
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link 
              href={isPublic ? "/dashboard" : "/?auth=login"} 
              className="px-6 py-2.5 bg-primary text-secondary rounded-full border border-secondary hover:bg-primary/90 transition-all shadow-md font-bold"
            >
              {isPublic ? "Vào Dashboard" : "Bắt đầu ngay"}
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}



export function Hero({ isPublic, coverImage }: { isPublic?: boolean; coverImage?: string }) {
  return (
    <section className="relative pt-40 pb-24 overflow-hidden bg-background">
      {/* Dynamic background gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[10%] right-[-10%] w-[30%] h-[30%] bg-secondary/5 rounded-full blur-[100px]" />
      </div>

      <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center relative z-10">
        <div className="flex flex-col items-center text-center md:items-start md:text-left transition-all">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/5 border border-primary/10 text-primary text-xs font-bold mb-8 uppercase tracking-widest">
            <ShieldCheck className="w-3.5 h-3.5" />
            Di Sản Số · Bảo Mật · Trường Tồn
          </div>
          
          <h1 className="text-6xl md:text-8xl font-serif font-bold text-foreground leading-[1.05] mb-8 tracking-tight">
            Gìn giữ <span className="text-primary">cội nguồn</span>,<br />
            <span className="text-secondary italic">Nối dài tương lai</span>
          </h1>
          
          <p className="text-xl text-foreground/70 font-medium leading-relaxed mb-10 max-w-lg">
            Gia Phả Ký là nền tảng số hóa phả hệ chuyên nghiệp. 
            Kết nối thế hệ và gìn giữ giá trị văn hóa dòng họ Việt trong kỷ nguyên số.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-5 w-full sm:w-auto">
            <Link 
              href={isPublic ? "/dashboard" : "/dashboard?auth=login"} 
              className="px-12 py-5 bg-primary text-white rounded-full font-bold text-lg flex items-center justify-center gap-3 hover:shadow-[0_20px_50px_rgba(225,29,72,0.3)] hover:-translate-y-1 transition-all duration-300 group"
            >
              {isPublic ? "Vào xem phả hệ" : "Bắt đầu lập gia phả"}
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
        
        <div className="relative group">
          {/* Main Hero Card */}
          <div className="aspect-[4/3] relative flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-secondary/10 rounded-[2.5rem] blur-2xl group-hover:scale-110 transition-transform duration-700" />
            <div className="w-full h-full border border-border bg-card/40 backdrop-blur-xl rounded-[2.5rem] overflow-hidden relative z-10 p-4 shadow-2xl transition-all duration-500 group-hover:shadow-primary/5">
                <div className="w-full h-full bg-gradient-to-br from-background to-accent/20 rounded-[1.8rem] border border-border/50 flex flex-col items-center justify-center gap-6 relative overflow-hidden group">
                  <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#e11d48_1px,transparent_1px)] [background-size:20px_20px]" />
                  {coverImage ? (
                    <img 
                      src={coverImage} 
                      alt="Ảnh dòng tộc" 
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <TreeDeciduous className="w-32 h-32 text-primary opacity-20 group-hover:scale-110 transition-transform duration-700" />
                  )}
                  <div className={`text-center z-10 ${coverImage ? 'bg-black/40 backdrop-blur-sm p-4 rounded-xl border border-white/10' : ''}`}>
                     <span className="block text-primary/60 font-serif italic text-2xl mb-1">Gia Phả Ký</span>
                     <span className="block text-white/40 text-sm font-bold uppercase tracking-[0.3em]">Di Sản Kỹ Thuật Số</span>
                  </div>
                </div>
            </div>
            
            {/* Floating high-end elements */}
            <div className="absolute -top-6 -right-6 bg-card p-5 rounded-2xl shadow-2xl border border-border z-20 animate-bounce transition-transform hover:scale-110">
              <CalendarDays className="w-10 h-10 text-secondary" />
            </div>
            <div className="absolute -bottom-8 -left-8 bg-primary text-white p-5 rounded-2xl shadow-2xl border border-primary/20 z-20 transition-transform hover:scale-110">
              <Scroll className="w-10 h-10" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function Features() {
  const features = [
    {
      title: "Cây Gia Phả Tương Tác",
      desc: "Xây dựng và xem phả hệ trực quan với công nghệ React Flow tiên tiến nhất.",
      icon: <TreeDeciduous className="w-12 h-12" />,
      color: "from-blue-500/10 to-blue-600/5",
    },
    {
      title: "Nhắc Hẹn Ngày Giỗ",
      desc: "Tự động chuyển đổi ngày âm lịch và thông báo tới toàn bộ thành viên dòng họ.",
      icon: <CalendarDays className="w-12 h-12" />,
      color: "from-amber-500/10 to-amber-600/5",
    },
    {
      title: "Kho Tài Liệu Di Sản",
      desc: "Luo trữ hình ảnh, sắc phong, văn bản cổ của dòng họ vĩnh viễn.",
      icon: <Scroll className="w-12 h-12" />,
      color: "from-rose-500/10 to-rose-600/5",
    },
    {
      title: "Bảo Mật Gia Tộc",
      desc: "Phân quyền quản trị chi tiết cho từng chi tộc, nhánh họ để bảo mật tuyệt đối.",
      icon: <ShieldCheck className="w-12 h-12" />,
      color: "from-emerald-500/10 to-emerald-600/5",
    },
  ];

  return (
    <section id="features" className="py-32 bg-background relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 text-center mb-24 relative z-10">
        <h2 className="text-5xl md:text-6xl font-serif font-bold text-foreground mb-6 tracking-tight">Giá Trị Của Sự Kết Nối</h2>
        <div className="w-24 h-1.5 bg-primary mx-auto mb-8 rounded-full" />
        <p className="text-xl text-foreground/50 max-w-2xl mx-auto italic font-medium leading-relaxed">
          &quot;Chim có tổ, người có tông. Như cây có cội, như sông có nguồn.&quot;
        </p>
      </div>
      
      <div className="max-w-7xl mx-auto px-6 grid sm:grid-cols-2 lg:grid-cols-4 gap-10 relative z-10">
        {features.map((f, i) => (
          <div key={i} className="p-10 rounded-[2.5rem] border border-border group hover:border-primary/20 hover:shadow-[0_30px_60px_rgba(0,0,0,0.05)] transition-all duration-500 bg-card/60 backdrop-blur-sm flex flex-col items-center text-center">
            <div className={`mb-8 w-20 h-20 rounded-3xl flex items-center justify-center text-primary bg-gradient-to-br ${f.color} group-hover:scale-110 transition-transform duration-500 shadow-sm border border-white/10`}>
              {f.icon}
            </div>
            <h3 className="text-2xl font-bold mb-4 tracking-tight">{f.title}</h3>
            <p className="text-foreground/70 leading-relaxed text-sm font-medium">{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
