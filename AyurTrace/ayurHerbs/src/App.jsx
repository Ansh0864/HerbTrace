import { useState, useEffect, lazy, Suspense } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Home,
  Leaf,
  Sun,
  Moon,
  ArrowLeft,
  ArrowRight,
  LogOut,
  Sparkles,
  Heart,
  Layers,
  User,
  Settings,
  Activity,
  Menu,
  X
} from "lucide-react";

// Lazy load pages
const HomePage = lazy(() => import("./pages/Home"));
const HerbForm = lazy(() => import("./pages/HerbForm"));
const HealthyLifestyle = lazy(() => import("./pages/HealthyLifestyle"));
const AuthPage = lazy(() => import("./pages/AuthPage"));
const CustomerPage = lazy(() => import("./pages/CustomerPage"));
const Processor = lazy(() => import("./pages/Processor"));

// Import the enhanced Chatbot component
import Chatbot from "./components/Chatbot";

// Page constants
const PAGES = {
  home: "home",
  herbForm: "herb-form",
  healthyLifestyle: "healthy-lifestyle",
  auth: "auth",
  customer: "customer",
  processor: "processor",
};

// Role constants
const ROLES = {
  customer: "Customer",
  producer: "Producer",
  processor: "Processor",
};

function App() {
  const [page, setPage] = useState(PAGES.auth);
  const [pageHistory, setPageHistory] = useState([PAGES.auth]);
  const [futurePages, setFuturePages] = useState([]);
  const [darkMode, setDarkMode] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("darkMode");
    const savedAuth = localStorage.getItem("isAuthenticated");
    const savedUser = localStorage.getItem("currentUser");
    
    if (savedTheme) {
      setDarkMode(savedTheme === "true");
    }
    
    if (savedAuth === "true" && savedUser) {
      const userData = JSON.parse(savedUser);
      setIsAuthenticated(true);
      setCurrentUser(userData);
      setUserRole(userData.role);
      setPage(PAGES.home);
      setPageHistory([PAGES.home]);
    }
  }, []);

  

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add("dark");
    } else {
      document.body.classList.remove("dark");
    }
    localStorage.setItem("darkMode", darkMode);
  }, [darkMode]);

  const colors = {
    primaryGreen: darkMode ? "#10b981" : "#059669",
    secondaryGreen: darkMode ? "#34d399" : "#047857",
    goldTan: darkMode ? "#fbbf24" : "#d97706",
    lightGrey: darkMode ? "#1f2937" : "#f9fafb",
    darkText: darkMode ? "#f9fafb" : "#111827",
    background: darkMode ? "#0f172a" : "#ffffff",
    cardBackground: darkMode ? "#1e293b" : "#ffffff",
    accent: darkMode ? "#a855f7" : "#7c3aed",
    success: "#10b981",
    warning: "#f59e0b",
    error: "#ef4444",
    borderColor: darkMode ? "#374151" : "#e5e7eb",
    hoverBg: darkMode ? "#374151" : "#f3f4f6",
    leafBackground: darkMode ? "#1e293b" : "#f0fdf4",
  };

  const handleLogin = (userData) => {
    setIsAuthenticated(true);
    setUserRole(userData.role);
    setCurrentUser(userData);
    setPage(PAGES.home);
    setPageHistory([PAGES.home]);
    setFuturePages([]);
    
    // Save to localStorage
    localStorage.setItem("isAuthenticated", "true");
    localStorage.setItem("currentUser", JSON.stringify(userData));
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserRole(null);
    setCurrentUser(null);
    setPage(PAGES.auth);
    setPageHistory([PAGES.auth]);
    setFuturePages([]);
    setMobileMenuOpen(false);
    
    // Clear localStorage
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("currentUser");
  };

  const navigateTo = (destination) => {
    if (destination !== page) {
      setPage(destination);
      setPageHistory((prevHistory) => [...prevHistory, destination]);
      setFuturePages([]);
      setMobileMenuOpen(false);
    }
  };

  const handleBack = () => {
    if (pageHistory.length > 1) {
      const currentPage = pageHistory[pageHistory.length - 1];
      const prevPage = pageHistory[pageHistory.length - 2];
      setPage(prevPage);
      setPageHistory((prevHistory) => prevHistory.slice(0, -1));
      setFuturePages((prevFuture) => [currentPage, ...prevFuture]);
    }
  };

  const handleForward = () => {
    if (futurePages.length > 0) {
      const nextPage = futurePages[0];
      setPage(nextPage);
      setFuturePages((prevFuture) => prevFuture.slice(1));
      setPageHistory((prevHistory) => [...prevHistory, nextPage]);
    }
  };

  const renderPage = () => {
    switch (page) {
      case PAGES.home:
        return <HomePage colors={colors} navigateTo={navigateTo} PAGES={PAGES} userRole={userRole} ROLES={ROLES} currentUser={currentUser} isDarkMode={darkMode} />;
      case PAGES.herbForm:
        return <HerbForm colors={colors} navigateTo={navigateTo} PAGES={PAGES} userRole={userRole} />;
      case PAGES.healthyLifestyle:
        return <HealthyLifestyle colors={colors} />;
      case PAGES.customer:
        return <CustomerPage colors={colors} navigateTo={navigateTo} PAGES={PAGES} />;
      case PAGES.processor:
        return <Processor colors={colors} />;
      case PAGES.auth:
      default:
        return <AuthPage colors={colors} handleLogin={handleLogin} />;
    }
  };

  const NavLink = ({ icon: Icon, label, onClick, active, mobile = false }) => (
    <motion.button
      onClick={onClick}
      className={`group flex items-center ${mobile ? 'w-full justify-start' : ''} space-x-3 px-6 py-4 rounded-2xl font-semibold transition-all duration-300 ${
        active 
          ? "text-white bg-white/30 shadow-xl backdrop-blur-md border border-white/20" 
          : "text-white/90 hover:text-white hover:bg-white/20 hover:backdrop-blur-md hover:border hover:border-white/10"
      }`}
      whileHover={{ scale: mobile ? 1.02 : 1.05, y: mobile ? 0 : -2 }}
      whileTap={{ scale: 0.98 }}
    >
      <Icon size={22} className="group-hover:animate-pulse" />
      <span className="font-semibold">{label}</span>
    </motion.button>
  );

  const renderNavLinks = (mobile = false) => {
    if (isAuthenticated) {
      const links = [
        { label: "Home", icon: Home, page: PAGES.home },
      ];

      if (userRole === ROLES.customer) {
        links.push({
          label: "Wellness",
          icon: Heart,
          page: PAGES.healthyLifestyle,
        });
      }

      // Add Producer link for Herb Form
      if (userRole === ROLES.producer) {
        links.push({ label: "Contribute", icon: Leaf, page: PAGES.herbForm });
      }

      return (
        <div className={`flex ${mobile ? 'flex-col space-y-3' : 'items-center space-x-4'}`}>
          {links.map((link) => (
            <NavLink
              key={link.label}
              label={link.label}
              icon={link.icon}
              onClick={() => navigateTo(link.page)}
              active={page === link.page}
              mobile={mobile}
            />
          ))}
        </div>
      );
    }
    return null;
  };

 // Corrected BigRotatingLeaf component for App.jsx
const BigRotatingLeaf = () => {
  // Ensure colors and darkMode are defined before rendering
  if (!colors) return null;

  const pathVariants = {
    start: "M500 150C600 200 750 250 800 400C850 550 750 650 650 700C550 750 450 700 400 600C350 500 300 400 350 300C400 200 450 150 500 150Z",
    mid: "M500 170C620 220 770 270 820 420C870 570 770 670 670 720C570 770 470 720 420 620C370 520 320 420 370 320C420 220 470 170 500 170Z"
  };

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      <motion.div
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
        animate={{ rotate: [0, 360], scale: [0.8, 1.3, 0.8] }}
        transition={{
          rotate: { duration: 60, repeat: Infinity, ease: "linear" },
          scale: { duration: 25, repeat: Infinity, ease: "easeInOut" }
        }}
      >
        <motion.div
          className="relative opacity-[0.015]"
          animate={{ opacity: darkMode ? [0.01, 0.03, 0.01] : [0.015, 0.04, 0.015] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        >
          <svg width="1200" height="1200" viewBox="0 0 1000 1000" fill="none" className="drop-shadow-2xl">
            <motion.path
              d={pathVariants.start}
              fill={darkMode ? colors.primaryGreen : colors.secondaryGreen}
              animate={{ d: [pathVariants.start, pathVariants.mid, pathVariants.start] }}
              transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.path
              d="M500 200C550 230 650 270 680 370C710 470 670 530 620 560C570 590 520 570 490 520C460 470 440 420 460 370C480 320 490 270 520 230C530 210 500 200 500 200Z"
              fill={darkMode ? colors.goldTan : colors.accent}
              opacity="0.7"
              animate={{ opacity: [0.7, 1, 0.7], scale: [1, 1.1, 1] }}
              transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
            />
          </svg>
        </motion.div>
      </motion.div>
    </div>
  );
};
  // Enhanced floating leaf components for background
  const FloatingLeaves = () => (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {[...Array(18)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            opacity: darkMode ? 0.02 : 0.03,
          }}
          animate={{
            y: [0, -80, 0],
            x: [0, Math.random() * 50 - 25, 0],
            rotate: [0, 360],
            scale: [1, 1.4, 1],
          }}
          transition={{
            duration: 20 + Math.random() * 25,
            repeat: Infinity,
            ease: "easeInOut",
            delay: Math.random() * 20,
          }}
        >
          <Leaf 
            size={30 + Math.random() * 70} 
            style={{ color: Math.random() > 0.5 ? colors.primaryGreen : colors.goldTan }}
          />
        </motion.div>
      ))}
    </div>
  );

  return (
    <div
      className={`min-h-screen flex flex-col font-sans transition-all duration-700 relative overflow-hidden ${
        darkMode ? "bg-slate-900 text-gray-100" : "bg-gray-50 text-gray-900"
      }`}
    >
      {/* Enhanced Background System */}
      <BigRotatingLeaf />
      <FloatingLeaves />

      {/* Enhanced Background Patterns */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <motion.div 
          className="w-full h-full opacity-[0.008]"
          style={{
            backgroundImage: `radial-gradient(circle at 30px 30px, ${colors.primaryGreen} 2px, transparent 0), radial-gradient(circle at 80px 80px, ${colors.goldTan} 1px, transparent 0)`,
            backgroundSize: '120px 120px'
          }}
          animate={{
            backgroundPosition: ["0px 0px", "120px 120px", "0px 0px"]
          }}
          transition={{
            duration: 40,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      </div>

      {/* Sophisticated gradient overlays */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <motion.div 
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(circle at 15% 85%, ${colors.primaryGreen}06 0%, transparent 60%), 
              radial-gradient(circle at 85% 15%, ${colors.goldTan}06 0%, transparent 60%),
              radial-gradient(circle at 40% 40%, ${colors.accent}04 0%, transparent 50%)
            `
          }}
          animate={{
            opacity: [0.4, 0.7, 0.4]
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>

      {/* Enhanced Navigation Bar */}
      <motion.nav
        className="backdrop-blur-2xl border-b shadow-2xl z-20 sticky top-0"
        style={{
          backgroundColor: `${colors.primaryGreen}e6`,
          borderColor: `${colors.primaryGreen}30`,
          boxShadow: `0 8px 32px ${colors.primaryGreen}25`
        }}
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 30, duration: 0.8 }}
      >
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex justify-between items-center">
            {/* Enhanced Logo */}
            <motion.div 
              className="flex items-center space-x-4" 
              whileHover={{ scale: 1.05 }}
              onClick={() => isAuthenticated && navigateTo(PAGES.home)}
              style={{ cursor: isAuthenticated ? 'pointer' : 'default' }}
            >
              <div className="relative">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                  className="relative"
                >
                  <div 
                    className="p-3 rounded-2xl shadow-2xl"
                    style={{ backgroundColor: 'rgba(255, 255, 255, 0.15)' }}
                  >
                    <Leaf className="text-white text-4xl drop-shadow-lg" />
                  </div>
                </motion.div>
                <motion.div
                  className="absolute -top-1 -right-1"
                  animate={{ 
                    scale: [1, 1.2, 1],
                    rotate: [0, 180, 360] 
                  }}
                  transition={{ 
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <Sparkles className="text-yellow-300 text-xl animate-pulse drop-shadow-md" />
                </motion.div>
              </div>
              <div>
                <h1 className="text-3xl lg:text-4xl font-black text-white tracking-tight drop-shadow-lg">
                  Ayur<span className="text-yellow-300">Trace</span>
                </h1>
                {isAuthenticated && currentUser && (
                  <motion.p 
                    className="text-sm text-white/80 font-medium"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    Welcome, {currentUser.email.split('@')[0]} 👋
                  </motion.p>
                )}
              </div>
            </motion.div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-6">
              {renderNavLinks()}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-3">
              {isAuthenticated && (
                <div className="hidden lg:flex items-center space-x-3">
                  <motion.button
                    onClick={handleBack}
                    disabled={pageHistory.length <= 1}
                    className={`p-3 rounded-xl transition-all duration-300 ${
                      pageHistory.length > 1 
                        ? "hover:bg-white/25 text-white shadow-xl backdrop-blur-md border border-white/20" 
                        : "opacity-30 cursor-not-allowed text-white/60"
                    }`}
                    whileHover={pageHistory.length > 1 ? { scale: 1.1, y: -2 } : {}}
                    whileTap={pageHistory.length > 1 ? { scale: 0.95 } : {}}
                  >
                    <ArrowLeft size={22} />
                  </motion.button>
                  <motion.button
                    onClick={handleForward}
                    disabled={futurePages.length === 0}
                    className={`p-3 rounded-xl transition-all duration-300 ${
                      futurePages.length > 0 
                        ? "hover:bg-white/25 text-white shadow-xl backdrop-blur-md border border-white/20" 
                        : "opacity-30 cursor-not-allowed text-white/60"
                    }`}
                    whileHover={futurePages.length > 0 ? { scale: 1.1, y: -2 } : {}}
                    whileTap={futurePages.length > 0 ? { scale: 0.95 } : {}}
                  >
                    <ArrowRight size={22} />
                  </motion.button>
                </div>
              )}

              <motion.button
                onClick={() => setDarkMode(!darkMode)}
                className="p-3 rounded-xl bg-white/25 hover:bg-white/35 backdrop-blur-md transition-all duration-300 shadow-xl border border-white/20"
                whileHover={{ scale: 1.1, rotate: 180, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                <motion.div
                  initial={false}
                  animate={{ rotate: darkMode ? 0 : 180 }}
                  transition={{ duration: 0.4 }}
                >
                  {darkMode ? (
                    <Sun className="text-yellow-300 drop-shadow-md" size={22} />
                  ) : (
                    <Moon className="text-white drop-shadow-md" size={22} />
                  )}
                </motion.div>
              </motion.button>

              {/* Mobile menu button */}
              <motion.button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-3 rounded-xl bg-white/25 hover:bg-white/35 backdrop-blur-md transition-all duration-300 shadow-xl border border-white/20"
                whileHover={{ scale: 1.1, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                <motion.div
                  animate={{ rotate: mobileMenuOpen ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {mobileMenuOpen ? (
                    <X className="text-white" size={22} />
                  ) : (
                    <Menu className="text-white" size={22} />
                  )}
                </motion.div>
              </motion.button>

              {isAuthenticated && (
                <motion.button
                  onClick={handleLogout}
                  className="hidden lg:flex items-center space-x-3 px-6 py-3 bg-red-500/90 hover:bg-red-600/90 backdrop-blur-md text-white font-bold rounded-xl shadow-2xl transition-all duration-300 border border-red-400/30"
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <LogOut size={18} />
                  <span className="text-sm font-semibold">Logout</span>
                </motion.button>
              )}
            </div>
          </div>
        </div>

        {/* Enhanced Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden border-t border-white/20"
            >
              <div className="px-6 py-6 space-y-4">
                {renderNavLinks(true)}
                {isAuthenticated && (
                  <div className="pt-4 border-t border-white/20">
                    <motion.button
                      onClick={handleLogout}
                      className="w-full flex items-center justify-center space-x-3 px-6 py-4 bg-red-500/90 hover:bg-red-600/90 backdrop-blur-md text-white font-bold rounded-xl shadow-2xl transition-all duration-300 border border-red-400/30"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <LogOut size={20} />
                      <span>Logout</span>
                    </motion.button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* Enhanced Main Content */}
      <main className="flex-1 w-full relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={page}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
          >
            <Suspense
              fallback={
                <div className="flex flex-col items-center justify-center min-h-[80vh] px-6">
                  <motion.div
                    animate={{ 
                      rotate: 360,
                      scale: [1, 1.1, 1]
                    }}
                    transition={{ 
                      rotate: { duration: 2, repeat: Infinity, ease: "linear" },
                      scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                    }}
                    className="mb-8"
                  >
                    <div 
                      className="p-8 rounded-3xl shadow-2xl"
                      style={{ backgroundColor: colors.primaryGreen }}
                    >
                      <Layers 
                        className="text-white text-8xl drop-shadow-2xl" 
                      />
                    </div>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-center max-w-md"
                  >
                    <h2 className="text-3xl font-bold mb-4" style={{ color: colors.darkText }}>
                      Preparing Your Experience
                    </h2>
                    <motion.p 
                      className="text-lg opacity-70"
                      style={{ color: colors.darkText }}
                      animate={{ opacity: [0.7, 1, 0.7] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      Loading your herbal journey...
                    </motion.p>
                  </motion.div>
                </div>
              }
            >
              {renderPage()}
            </Suspense>
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Enhanced Chatbot Integration */}
      {isAuthenticated && (
        <div className="fixed bottom-6 right-6 z-30">
          <Chatbot
            colors={colors}
            userRole={userRole}
            currentUser={currentUser}
            darkMode={darkMode}
          />
        </div>
      )}

      {/* Enhanced Footer */}
      <motion.footer
        className="w-full py-6 text-center text-sm border-t backdrop-blur-md"
        style={{ 
          backgroundColor: `${colors.primaryGreen}10`,
          borderColor: colors.borderColor,
          color: `${colors.darkText}80`
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 1 }}
      >
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0">
          <span>&copy; {new Date().getFullYear()} AyurTrace. All rights reserved.</span>
          <div className="flex items-center space-x-6 text-xs">
            <span className="flex items-center space-x-2">
              <Leaf size={14} style={{ color: colors.primaryGreen }} />
              <span>Powered by AI & Blockchain</span>
            </span>
            <span>|</span>
            <span>Sustainable Herb Traceability</span>
          </div>
        </div>
      </motion.footer>
    </div>
  );
}

export default App;