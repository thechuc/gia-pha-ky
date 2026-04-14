"use client";

import { useState, useEffect, useCallback } from "react";
import { signIn } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  LogIn, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  UserPlus, 
  User, 
  Layout, 
  X,
  ArrowRight,
  ShieldCheck,
  CheckCircle2
} from "lucide-react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { registerAction, checkUserStatus } from "@/app/actions/auth";
import { getBranchesForRegister } from "@/app/actions/branches";
import { useToast } from "@/components/ui/Toast";

// Custom Brand Icons
const GoogleIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" stroke="none">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

const FacebookIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" stroke="none">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

// Reusable Field Error Component
const FieldError = ({ message }: { message?: string }) => (
  <AnimatePresence>
    {message && (
      <motion.p
        initial={{ opacity: 0, height: 0, y: -10 }}
        animate={{ opacity: 1, height: "auto", y: 0 }}
        exit={{ opacity: 0, height: 0, y: -10 }}
        className="text-[11px] font-bold text-red-500/90 mt-1 ml-1"
      >
        {message}
      </motion.p>
    )}
  </AnimatePresence>
);

export default function AuthModal() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const authQuery = searchParams.get("auth");
  const errorQuery = searchParams.get("error");
  const isOpen = !!authQuery || !!errorQuery;
  const initialMode = authQuery === "register" ? "register" : "login";

  const [mode, setMode] = useState<"login" | "register">(initialMode);
  const [branches, setBranches] = useState<{ id: string; name: string }[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [regSuccess, setRegSuccess] = useState(false);

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [regForm, setRegForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    requestBranchId: "",
  });

  // Sync mode and error with URL when it opens
  useEffect(() => {
    if (authQuery === "register") {
      setMode("register");
    } else if (authQuery === "login") {
      setMode("login");
    }

    if (errorQuery) {
      if (errorQuery === "AccessDenied") {
        setError("Tài khoản của bạn đang chờ phê duyệt từ Admin.");
      } else if (errorQuery === "Configuration") {
        setError("Lỗi cấu hình hệ thống xác thực.");
      } else {
        setError("Đã có lỗi xảy ra trong quá trình xác thực.");
      }
    }
  }, [authQuery, errorQuery]);

  // Fetch branches for registration
  useEffect(() => {
    if (mode === "register" && branches.length === 0) {
      getBranchesForRegister().then(setBranches);
    }
  }, [mode, branches.length]);

  const handleClose = useCallback(() => {
    const params = new URLSearchParams(searchParams);
    params.delete("auth");
    params.delete("error");
    params.delete("callbackUrl");
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [router, pathname, searchParams]);

  const handleLogin = async (e?: React.FormEvent | React.KeyboardEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (loading) return;

    // Client-side validation
    const errors: Record<string, string> = {};
    if (!email.trim()) {
      errors.email = "Vui lòng nhập Email của bạn.";
    }
    if (!password) {
      errors.password = "Vui lòng nhập mật khẩu.";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setLoading(true);
    setError("");
    setFieldErrors({});
    
    try {
      const emailValue = email.trim();
      console.log("[AuthModal] Starting login for:", emailValue);
      
      // Step 1: Check status before attempting sign in to avoid hard redirects
      // Now including password check for stable error reporting
      const statusCheck = await checkUserStatus(emailValue, password);
      
      if (statusCheck.error) {
        let msg = "Đã có lỗi xảy ra. Vui lòng thử lại.";
        
        if (statusCheck.error === "USER_NOT_FOUND") {
          msg = "Email này chưa được đăng ký trong hệ thống.";
        } else if (statusCheck.error === "NOT_APPROVED") {
          msg = "Tài khoản của bạn đang chờ Quản trị viên phê duyệt.";
        } else if (statusCheck.error === "NO_PASSWORD") {
          msg = "Tài khoản này dùng đăng nhập MXH. Vui lòng chọn Google/Facebook.";
        } else if (statusCheck.error === "INVALID_PASSWORD") {
          msg = "Mật khẩu không chính xác. Vui lòng kiểm tra lại.";
        }
        
        setError(msg);
        showToast(msg, "error");
        setLoading(false);
        return;
      }

      // Step 2: Attempt actual sign in
      // We use redirect: false to handle everything in this component
      const result = await signIn("credentials", {
        email: emailValue,
        password,
        redirect: false,
      });

      console.log("[AuthModal] NextAuth result payload:", result);

      // CRITICAL: NextAuth v5 might return result.ok as true even with errors in some configs
      // so we must strictly prioritize checking result.error as a string.
      if (result && result.error) {
        let msg = "Mật khẩu không chính xác. Vui lòng kiểm tra lại.";
        
        if (result.error === "CredentialsSignin") {
          msg = "Email hoặc mật khẩu không chính xác.";
        } else if (result.error === "SessionRequired") {
          msg = "Vui lòng đăng nhập để tiếp tục.";
        } else if (result.error === "AccessDenied") {
          msg = "Tài khoản của bạn chưa được phê duyệt hoặc bị từ chối.";
        }
        
        setError(msg);
        showToast(msg, "error");
      } else if (result?.ok) {
        showToast("Đăng nhập thành công!", "success");
        handleClose();
        router.refresh();
      } else {
        const msg = "Không thể xác thực. Vui lòng kiểm tra lại thông tin.";
        setError(msg);
        showToast(msg, "error");
      }
    } catch (err: any) {
      console.error("[AuthModal] Fatal Login Error:", err);
      const msg = err?.message || "Lỗi hệ thống không mong muốn.";
      setError(msg);
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = (provider: "google" | "facebook") => {
    setLoading(true);
    setError(""); // Xóa lỗi cũ
    signIn(provider, { callbackUrl: "/dashboard" });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Client-side validation
    const errors: Record<string, string> = {};
    if (!regForm.name.trim()) {
      errors.name = "Vui lòng nhập họ và tên của bạn.";
    }
    if (!regForm.requestBranchId) {
      errors.requestBranchId = "Vui lòng lựa chọn Chi / Nhánh của bạn.";
    }
    if (!regForm.email.trim()) {
      errors.email = "Vui lòng nhập Email để đăng ký.";
    }
    if (!regForm.password) {
      errors.password = "Vui lòng nhập mật khẩu.";
    } else if (regForm.password.length < 8) {
      errors.password = "Mật khẩu tối thiểu 8 ký tự.";
    }
    
    if (regForm.password && regForm.confirmPassword && regForm.password !== regForm.confirmPassword) {
      errors.confirmPassword = "Mật khẩu xác nhận không khớp.";
    } else if (!regForm.confirmPassword && mode === "register") {
      errors.confirmPassword = "Vui lòng xác nhận mật khẩu.";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setLoading(true);
    setError("");
    setFieldErrors({});

    try {
      const result = await registerAction(regForm);
      if (result.error) {
        setError(result.error);
      } else {
        setRegSuccess(true);
      }
    } catch (err) {
      setError("Lỗi hệ thống.");
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    const newMode = mode === "login" ? "register" : "login";
    setMode(newMode);
    setError("");
    const params = new URLSearchParams(searchParams);
    params.set("auth", newMode);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-lg overflow-hidden bg-[#1A0F0F] rounded-3xl border border-white/10 shadow-2xl"
          >
            {/* Ambient glows */}
            <div className="absolute top-0 left-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-secondary/10 rounded-full blur-[80px] translate-x-1/2 translate-y-1/2 pointer-events-none" />

            {/* Header */}
            <div className="relative px-8 pt-8 pb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary flex items-center justify-center rounded-xl border border-secondary/30 shadow-lg">
                  <ShieldCheck className="w-6 h-6 text-secondary" />
                </div>
                <div>
                  <h2 className="text-xl font-serif font-bold text-white leading-tight">Gia Phả Ký</h2>
                  <p className="text-[10px] uppercase tracking-widest text-secondary/60 font-bold">Thành viên dòng tộc</p>
                </div>
              </div>
              <button 
                onClick={handleClose}
                className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-8 pb-8 relative z-10">
              {regSuccess ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="py-12 text-center"
                >
                  <div className="w-20 h-20 bg-green-500/20 border border-green-500/30 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="w-10 h-10 text-green-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">Đăng ký thành công!</h3>
                  <p className="text-slate-400 mb-8 max-w-xs mx-auto text-sm leading-relaxed">
                    Yêu cầu của bạn đã được gửi. Vui lòng chờ Admin phê duyệt tài khoản trước khi đăng nhập.
                  </p>
                  <button 
                    onClick={() => { setRegSuccess(false); setMode("login"); }}
                    className="px-8 py-3 bg-primary text-secondary font-bold rounded-xl shadow-lg border border-secondary/20 hover:scale-105 transition-transform"
                  >
                    Quay lại Đăng nhập
                  </button>
                </motion.div>
              ) : (
                <>
                  <div className="mb-6">
                    <h3 className="text-2xl font-bold text-white mb-1">
                      {mode === "login" ? "Chào mừng trở lại" : "Tham gia đại gia đình"}
                    </h3>
                    <p className="text-slate-500 text-sm">
                      {mode === "login" ? "Điền thông tin để truy cập hệ thống quản trị" : "Vui lòng cung cấp thông tin chính xác để gia nhập"}
                    </p>
                  </div>

                  {/* Forms */}
                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (mode === "login") handleLogin(e);
                      else handleRegister(e);
                    }} 
                    className="space-y-4"
                  >
                    {mode === "register" && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-secondary/40 uppercase tracking-widest ml-1">Họ và tên</label>
                          <div className="relative">
                            <input 
                              type="text" required
                              value={regForm.name}
                              onChange={e => {
                                setRegForm({...regForm, name: e.target.value});
                                if (fieldErrors.name) setFieldErrors(prev => ({ ...prev, name: "" }));
                              }}
                              className={`w-full bg-[#140C0C] border ${fieldErrors.name ? 'border-red-500/50' : 'border-white/5'} rounded-xl py-2.5 pl-10 pr-4 text-white text-sm focus:outline-none focus:border-secondary/50 transition-all`}
                              placeholder="Nguyễn Văn..."
                            />
                            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                          </div>
                          <FieldError message={fieldErrors.name} />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-secondary/40 uppercase tracking-widest ml-1">Chi / Nhánh</label>
                          <div className="relative">
                            <select 
                              required
                              value={regForm.requestBranchId}
                              onChange={e => {
                                setRegForm({...regForm, requestBranchId: e.target.value});
                                if (fieldErrors.requestBranchId) setFieldErrors(prev => ({ ...prev, requestBranchId: "" }));
                              }}
                              className={`w-full bg-[#140C0C] border ${fieldErrors.requestBranchId ? 'border-red-500/50' : 'border-white/5'} rounded-xl py-2.5 pl-10 pr-4 text-white text-sm focus:outline-none focus:border-secondary/50 transition-all appearance-none`}
                            >
                              <option value="" disabled className="bg-[#1A0F0F]">Chọn Chi</option>
                              {branches.map(b => <option key={b.id} value={b.id} className="bg-[#1A0F0F]">{b.name}</option>)}
                              <option value="other" className="bg-[#1A0F0F]">Khác / Chưa rõ</option>
                            </select>
                            <Layout className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 pointer-events-none" />
                          </div>
                          <FieldError message={fieldErrors.requestBranchId} />
                        </div>
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-secondary/40 uppercase tracking-widest ml-1">Email</label>
                      <div className="relative">
                        <input 
                          type="email" required
                          value={mode === "login" ? email : regForm.email}
                          onChange={e => {
                            if (mode === "login") setEmail(e.target.value);
                            else setRegForm({...regForm, email: e.target.value});
                            if (fieldErrors.email) setFieldErrors(prev => ({ ...prev, email: "" }));
                          }}
                          className={`w-full bg-[#140C0C] border ${fieldErrors.email ? 'border-red-500/50' : 'border-white/5'} rounded-xl py-2.5 pl-10 pr-4 text-white text-sm focus:outline-none focus:border-secondary/50 transition-all`}
                          placeholder="email@example.com"
                        />
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                      </div>
                      <FieldError message={fieldErrors.email} />
                    </div>

                    <div className={mode === "register" ? "grid grid-cols-1 md:grid-cols-2 gap-4" : "space-y-4"}>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-secondary/40 uppercase tracking-widest ml-1">Mật khẩu</label>
                        <div className="relative">
                          <input 
                            type={showPassword ? "text" : "password"} required
                            value={mode === "login" ? password : regForm.password}
                            onChange={e => {
                              if (mode === "login") setPassword(e.target.value);
                              else setRegForm({...regForm, password: e.target.value});
                              if (fieldErrors.password) setFieldErrors(prev => ({ ...prev, password: "" }));
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && mode === "login") {
                                handleLogin(e);
                              }
                            }}
                            className={`w-full bg-[#140C0C] border ${fieldErrors.password ? 'border-red-500/50' : 'border-white/5'} rounded-xl py-2.5 pl-10 pr-10 text-white text-sm focus:outline-none focus:border-secondary/50 transition-all`}
                            placeholder="••••••••"
                          />
                          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                          <button 
                            type="button" onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/50 transition-colors"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        <FieldError message={fieldErrors.password} />
                      </div>

                      {mode === "register" && (
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-secondary/40 uppercase tracking-widest ml-1">Xác nhận MK</label>
                          <div className="relative">
                            <input 
                              type={showPassword ? "text" : "password"} required
                              value={regForm.confirmPassword}
                              onChange={e => {
                                setRegForm({...regForm, confirmPassword: e.target.value});
                                if (fieldErrors.confirmPassword) setFieldErrors(prev => ({ ...prev, confirmPassword: "" }));
                              }}
                              className={`w-full bg-[#140C0C] border ${fieldErrors.confirmPassword ? 'border-red-500/50' : 'border-white/5'} rounded-xl py-2.5 pl-10 pr-4 text-white text-sm focus:outline-none focus:border-secondary/50 transition-all`}
                              placeholder="••••••••"
                            />
                            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                          </div>
                          <FieldError message={fieldErrors.confirmPassword} />
                        </div>
                      )}
                    </div>

                    {error && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }} 
                        animate={{ opacity: 1, height: "auto" }}
                        className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs text-center font-medium"
                      >
                        {error}
                      </motion.div>
                    )}

                    <button 
                      type="button" 
                      onClick={(e) => {
                        if (mode === "login") handleLogin(e);
                        else handleRegister(e as any);
                      }}
                      disabled={loading}
                      className="w-full h-11 bg-primary hover:bg-[#A52A2A] text-secondary font-bold rounded-xl shadow-lg border border-secondary/20 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 mt-4"
                    >
                      {loading ? <div className="w-5 h-5 border-2 border-secondary/20 border-t-secondary rounded-full animate-spin" /> : mode === "login" ? "Đăng nhập" : "Đăng ký thành viên"}
                      {!loading && <ArrowRight className="w-4 h-4" />}
                    </button>
                  </form>

                  {/* Social Login (Only for Login) */}
                  {mode === "login" && (
                    <>
                      <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-white/5"></div>
                        </div>
                        <div className="relative flex justify-center text-[10px] uppercase tracking-widest text-white/20 bg-[#1A0F0F] px-4 font-bold">
                          Hoặc
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <button onClick={() => handleSocialLogin("google")} className="flex items-center justify-center gap-2 py-2.5 px-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-white/60 hover:text-white transition-all">
                          <GoogleIcon className="w-4.5 h-4.5" />
                          <span className="text-xs font-bold">Google</span>
                        </button>
                        <button onClick={() => handleSocialLogin("facebook")} className="flex items-center justify-center gap-2 py-2.5 px-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-white/60 hover:text-white transition-all">
                          <FacebookIcon className="w-4.5 h-4.5" />
                          <span className="text-xs font-bold">Facebook</span>
                        </button>
                      </div>
                    </>
                  )}

                  <p className="mt-8 text-center text-xs text-white/30 font-medium">
                    {mode === "login" ? "Chưa có tài khoản?" : "Đã có tài khoản?"}{" "}
                    <button 
                      onClick={toggleMode}
                      className="text-secondary hover:text-primary transition-colors font-bold underline underline-offset-4"
                    >
                      {mode === "login" ? "Đăng ký ngay" : "Đăng nhập ngay"}
                    </button>
                  </p>
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
