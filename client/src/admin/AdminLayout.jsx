import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  LayoutDashboard, Salad, Newspaper, Images, Home, Star, MessageSquare, Settings,
  LogOut, Menu, X, Leaf, ExternalLink, FolderOpen,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import PageLoader from "../components/PageLoader";

const NAV = [
  { to: "/admin", label: "Dashboard", Icon: LayoutDashboard, end: true },
  { to: "/admin/services", label: "Services", Icon: Salad },
  { to: "/admin/blogs", label: "Blogs", Icon: Newspaper },
  { to: "/admin/gallery", label: "Gallery", Icon: Images },
  { to: "/admin/home-gallery", label: "Home Gallery", Icon: Home },
  { to: "/admin/media", label: "Media Library", Icon: FolderOpen },
  { to: "/admin/testimonials", label: "Testimonials", Icon: Star },
  { to: "/admin/messages", label: "Messages & Appointments", Icon: MessageSquare },
  { to: "/admin/settings", label: "Settings & SEO", Icon: Settings },
];

export default function AdminLayout() {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [current, setCurrent] = useState("");

  useEffect(() => {
    if (!loading && !user) navigate("/admin/login", { replace: true });
  }, [loading, user, navigate]);

  useEffect(() => {
    setCurrent(NAV.find((n) => (n.end ? window.location.pathname === "/admin" : window.location.pathname.startsWith(n.to)))?.label || "");
  }, [window.location.pathname]);

  if (loading) return <PageLoader label="Checking session…" />;
  if (!user) return null;

  const doLogout = async () => {
    await logout();
    navigate("/admin/login");
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar (desktop) */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col bg-charcoal text-white lg:flex">
        <div className="flex items-center gap-2.5 px-6 py-6">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sage to-primary"><Leaf size={20} /></span>
          <div>
            <p className="font-heading font-bold leading-tight">GOLZ Admin</p>
            <p className="text-xs text-white/50">Content management</p>
          </div>
        </div>
        <nav className="flex-1 space-y-1 px-3">
          {NAV.map(({ to, label, Icon, end }) => (
            <NavLink key={to} to={to} end={end}
              className={({ isActive }) => `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${isActive ? "bg-primary text-white shadow-soft" : "text-white/65 hover:bg-white/10 hover:text-white"}`}>
              <Icon size={18} /> {label}
            </NavLink>
          ))}
        </nav>
        <div className="space-y-1 border-t border-white/10 p-4">
          <a href="/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm text-white/65 transition hover:bg-white/10 hover:text-white">
            <ExternalLink size={17} /> View Website
          </a>
          <button onClick={doLogout} className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm text-red-300 transition hover:bg-red-500/15">
            <LogOut size={17} /> Logout
          </button>
        </div>
      </aside>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-charcoal/60 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)}>
            <motion.aside
              initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }} transition={{ type: "tween", duration: 0.25 }}
              className="flex h-full w-64 flex-col bg-charcoal p-4 text-white" onClick={(e) => e.stopPropagation()}
            >
              <button onClick={() => setSidebarOpen(false)} className="mb-4 ml-auto rounded-lg p-2 hover:bg-white/10" aria-label="Close menu"><X size={20} /></button>
              {NAV.map(({ to, label, Icon, end }) => (
                <NavLink key={to} to={to} end={end} onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) => `mb-1 flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium ${isActive ? "bg-primary text-white" : "text-white/65 hover:bg-white/10"}`}>
                  <Icon size={18} /> {label}
                </NavLink>
              ))}
              <button onClick={doLogout} className="mt-auto flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-red-300 hover:bg-red-500/15">
                <LogOut size={17} /> Logout
              </button>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main */}
      <div className="flex min-h-screen flex-1 flex-col lg:pl-64">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-gray-200 bg-white/85 px-4 py-3.5 backdrop-blur sm:px-8">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="rounded-lg p-2 text-charcoal/60 hover:bg-gray-100 lg:hidden" aria-label="Open menu"><Menu size={20} /></button>
            <div>
              <h1 className="font-heading text-lg font-bold text-charcoal">{current || "Dashboard"}</h1>
              <p className="hidden text-xs text-charcoal/50 sm:block">Signed in as {user.name} ({user.role})</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden rounded-full bg-primary/10 px-3.5 py-1.5 text-xs font-semibold text-primary sm:block">{user.role}</span>
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-sage to-primary font-heading text-sm font-bold text-white">
              {user.name?.[0]?.toUpperCase()}
            </span>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
