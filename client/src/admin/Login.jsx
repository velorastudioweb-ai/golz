import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Leaf, Lock, Mail } from "lucide-react";
import { useForm } from "react-hook-form";
import { useAuth } from "../context/AuthContext";
import SEO from "../components/SEO";
import { ButtonSpinner } from "../components/PageLoader";

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  /* GOLZ badge ships with the bundle; the drawn mark stands in only if the
     image ever fails to load. */
  const [logoOk, setLogoOk] = useState(true);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();

  useEffect(() => {
    if (user) navigate("/admin", { replace: true });
  }, [user, navigate]);

  const onSubmit = async ({ email, password }) => {
    setError(null);
    try {
      await login(email, password);
      navigate("/admin");
    } catch (e) {
      setError(e.response?.data?.message || "Login failed");
    }
  };

  return (
    <>
      <SEO title="Admin Login" />
      <div className="flex min-h-screen items-center justify-center bg-hero-pattern px-4">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <div className="card p-8 sm:p-10">
            <div className="mb-8 text-center">
              {logoOk ? (
                <img
                  src="/logo.png"
                  alt="GOLZ (Giggles of Livez)"
                  onError={() => setLogoOk(false)}
                  className="mx-auto mb-4 h-16 w-auto object-contain"
                />
              ) : (
                <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-sage to-primary text-white shadow-soft">
                  <Leaf size={28} />
                </span>
              )}
              <h1 className="font-heading text-2xl font-bold text-charcoal">Admin Login</h1>
              <p className="mt-1.5 text-sm text-charcoal/50">GOLZ (Giggles of Livez) — content management</p>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
              <div>
                <label className="label">Email</label>
                <div className="relative">
                  <Mail size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-charcoal/35" />
                  <input type="email" className="input !pl-11" placeholder="email@example.com" {...register("email", { required: "Email is required" })} />
                </div>
                {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
              </div>
              <div>
                <label className="label">Password</label>
                <div className="relative">
                  <Lock size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-charcoal/35" />
                  <input type="password" className="input !pl-11" placeholder="••••••••" {...register("password", { required: "Password is required" })} />
                </div>
                {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
              </div>
              {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600" role="alert">{error}</p>}
              <button type="submit" disabled={isSubmitting} className="btn-primary w-full disabled:opacity-60">
                {isSubmitting ? <ButtonSpinner /> : "Sign In"}
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    </>
  );
}
