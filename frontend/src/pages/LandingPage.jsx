import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import {
  FiCpu,
  FiShield,
  FiActivity,
  FiTrendingUp,
  FiArrowRight,
  FiChevronLeft,
  FiChevronRight,
  FiCheckCircle,
  FiZap,
  FiDatabase,
  FiLayers,
  FiLock,
  FiChevronDown,
  FiSun,
  FiMoon,
  FiRadio,
  FiHardDrive,
  FiSliders,
  FiClock,
  FiAward,
  FiPieChart,
  FiTrendingDown,
  FiDollarSign,
  FiTool,
} from "react-icons/fi";

const LandingPage = () => {
  const { isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();

  // Carousel State
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeFaq, setActiveFaq] = useState(null);

  // High Quality Industrial Background Image URLs (Unsplash Industrial Collection)
  const slides = [
    {
      id: 1,
      title: "AI-Predictive-Maintenance",
      subtitle:
        "Predict machine failures before they happen using Artificial Intelligence, Machine Learning, and Real-Time Industrial Analytics.",
      buttons: [
        {
          label: "Get Started",
          to: isAuthenticated ? "/dashboard" : "/register",
          primary: true,
        },
        { label: "Login", to: "/login", primary: false },
      ],
      image:
        "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=2070&auto=format&fit=crop",
      badge: "Smart Factory & Digital Manufacturing",
    },
    {
      id: 2,
      title: "Predictive Maintenance",
      subtitle:
        "Monitor machine health continuously and reduce downtime using intelligent predictive analytics.",
      buttons: [
        { label: "View Dashboard", to: "/dashboard", primary: true },
        { label: "Register", to: "/register", primary: false },
      ],
      image:
        "https://images.unsplash.com/photo-1581092160607-ee22621dd758?q=80&w=2070&auto=format&fit=crop",
      badge: "Industrial Robotics & IoT Sensors",
    },
    {
      id: 3,
      title: "Failure Black Box",
      subtitle:
        "Automatically capture machine events, sensor snapshots, and prediction history for advanced diagnostics.",
      buttons: [
        { label: "Explore Features", href: "#blackbox", primary: true },
      ],
      image:
        "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?q=80&w=2070&auto=format&fit=crop",
      badge: "Control Room & Failsafe Recorder",
    },
    {
      id: 4,
      title: "Remaining Useful Life (RUL)",
      subtitle:
        "Estimate Remaining Useful Life, Health Score, and Failure Probability using AI-powered models.",
      buttons: [
        {
          label: "View Predictions",
          to: isAuthenticated ? "/predictions" : "/login",
          primary: true,
        },
      ],
      image:
        "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=2070&auto=format&fit=crop",
      badge: "Predictive Analytics & ML Engine",
    },
  ];

  // Carousel Autoplay Timer
  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      nextSlide();
    }, 5000);
    return () => clearInterval(interval);
  }, [isPaused, nextSlide]);

  // Keyboard accessibility
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "ArrowRight") nextSlide();
      if (e.key === "ArrowLeft") prevSlide();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [nextSlide, prevSlide]);

  // Navbar scroll detection
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleFaq = (index) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  // Touch Swipe Handlers
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const handleTouchStart = (e) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current - touchEndX.current > 50) {
      nextSlide();
    }
    if (touchStartX.current - touchEndX.current < -50) {
      prevSlide();
    }
  };

  // Retained AI Features
  const features = [
    {
      icon: FiActivity,
      title: "Real-Time Sensor Telemetry Ingestion",
      description:
        "Ingest high-frequency sensor streams (temperature, 3-axis vibration, casing pressure) with microsecond precision and automated noise filtering.",
      badge: "Telemetry Ingestion",
    },
    {
      icon: FiTrendingUp,
      title: "LightGBM RUL Prediction Engine",
      description:
        "Gradient boosted machine learning models estimate Remaining Useful Life (RUL) and compute machine failure probability scores before downtime occurs.",
      badge: "ML Engine",
    },
    {
      icon: FiShield,
      title: "Automated Failure Black Box",
      description:
        "Continuous 24-hour rolling failsafe buffer locks raw sensor telemetry during unexpected trips for comprehensive post-mortem root cause analysis.",
      badge: "Failsafe Recorder",
    },
    {
      icon: FiSliders,
      title: "Role-Based Access Control (RBAC)",
      description:
        "Dynamic user role claims (Admin, Engineer, Viewer) deliver custom management interfaces, permission boundaries, and read-only views.",
      badge: "RBAC Security",
    },
    {
      icon: FiDatabase,
      title: "Scalable Time-Series Storage",
      description:
        "High-throughput MongoDB document collection architecture built to index and query millions of time-series sensor events seamlessly.",
      badge: "MongoDB DB",
    },
    {
      icon: FiLock,
      title: "JWT Auth & Token Rotation",
      description:
        "Enterprise-grade JSON Web Token authentication featuring silent token refresh interceptors, CORS isolation, and secure local storage session persistence.",
      badge: "Zero-Trust Auth",
    },
  ];

  // Benefits
  const benefits = [
    {
      icon: FiTrendingDown,
      title: "75% Downtime Reduction",
      description:
        "Identify bearing fatigue and spindle misalignment early to prevent catastrophic line stoppages.",
    },
    {
      icon: FiDollarSign,
      title: "Cost Optimization",
      description:
        "Shift from reactive emergency repairs to planned, scheduled maintenance routines.",
    },
    {
      icon: FiTool,
      title: "Extended Equipment Lifespan",
      description:
        "Maintain optimal operating conditions and extend physical machine service life.",
    },
    {
      icon: FiPieChart,
      title: "Actionable Intelligence",
      description:
        "Empower reliability engineers with diagnostic metrics, RUL graphs, and automated anomaly alerts.",
    },
  ];

  // Statistics Counter
  const stats = [
    {
      label: "System Uptime SLA",
      value: "99.99%",
      subtext: "Industrial fault tolerance",
    },
    {
      label: "RUL Model Accuracy",
      value: "94.2%",
      subtext: "LightGBM regression precision",
    },
    {
      label: "Inference Speed",
      value: "< 45ms",
      subtext: "Real-time telemetry scoring",
    },
    {
      label: "Failsafe Buffer",
      value: "24 Hours",
      subtext: "Pre-failure Black Box history",
    },
  ];

  // Testimonials
  // const testimonials = [
  //   {
  //     quote: 'AI-Predictive-Maintenance eliminated unscheduled spindle trips across our automotive assembly plant. The Failure Black Box diagnostic snapshot saved us over 100 hours of troubleshooting time.',
  //     author: 'Dr. Marcus Vance',
  //     role: 'VP of Reliability Engineering',
  //     company: 'Global Motion Robotics'
  //   },
  //   {
  //     quote: 'The LightGBM Remaining Useful Life predictions provide a 14-day advance warning before bearing degradation causes a catastrophic failure. Outstanding SaaS solution.',
  //     author: 'Elena Rostova',
  //     role: 'Plant Operations Director',
  //     company: 'Nordic Precision Machining'
  //   },
  //   {
  //     quote: 'Role-based dashboards allowed us to give site engineers full maintenance control while executive viewers get clean read-only health metrics. The dark/light theme is stunning.',
  //     author: 'David K. Chen',
  //     role: 'Chief Technology Officer',
  //     company: 'Apex Industrial Systems'
  //   }
  // ];

  // FAQ
  const faqList = [
    {
      q: "How does the Failure Black Box capture pre-failure data?",
      a: "The Failure Black Box maintains a continuous rolling circular buffer of raw sensor telemetry. When a machine anomaly or critical trip occurs, the system locks and persists the prior 24 hours of sensor data for post-mortem root cause analysis.",
    },
    {
      q: "Which machine learning model powers the Remaining Useful Life (RUL) predictions?",
      a: "Our inference engine utilizes an optimized LightGBM regression model trained on multi-sensor degradation profiles. It predicts remaining operating hours with up to 94.2% accuracy.",
    },
    {
      q: "How does Role-Based Access Control (RBAC) work?",
      a: "The system automatically enforces user role claims (Admin, Engineer, Viewer) returned by the authenticated backend JWT token. Admin users enjoy full management privileges; Engineers manage assigned machines and maintenance logs; Viewers have a strictly read-only executive view.",
    },
    {
      q: "Does theme switching persist across page reloads?",
      a: "Yes! The selected Light or Dark mode persists automatically in localStorage and applies immediately across all components, navigation menus, dashboards, and landing page cards.",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-brand-500 selection:text-white transition-colors duration-300 overflow-x-hidden">
      {/* Sticky Professional Navbar */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-white/90 dark:bg-slate-950/85 backdrop-blur-md border-b border-slate-200 dark:border-slate-800/80 shadow-lg py-3"
            : "bg-linear-to-b from-slate-950/80 via-slate-950/40 to-transparent py-4"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="p-2 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-500 dark:text-brand-400 group-hover:scale-105 transition-transform">
              <FiCpu className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h1 className="font-black text-sm sm:text-base tracking-wider leading-none bg-linear-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                AI-Predictive-Maintenance
              </h1>
              <span className="text-[9px] font-mono uppercase font-bold tracking-widest text-brand-500 dark:text-brand-400 block mt-0.5">
                Industrial Intelligence
              </span>
            </div>
          </Link>

          {/* Navigation Links (Only for retained sections) */}
          <nav className="hidden lg:flex items-center gap-7 text-xs font-semibold tracking-wide text-slate-700 dark:text-slate-300">
            <a
              href="#features"
              className="hover:text-brand-500 dark:hover:text-brand-400 transition-colors"
            >
              AI Features
            </a>
            <a
              href="#monitoring"
              className="hover:text-brand-500 dark:hover:text-brand-400 transition-colors"
            >
              Monitoring
            </a>
            <a
              href="#predictions"
              className="hover:text-brand-500 dark:hover:text-brand-400 transition-colors"
            >
              Failure Prediction
            </a>
            <a
              href="#blackbox"
              className="hover:text-brand-500 dark:hover:text-brand-400 transition-colors"
            >
              Black Box
            </a>
            <a
              href="#preview"
              className="hover:text-brand-500 dark:hover:text-brand-400 transition-colors"
            >
              Dashboard Preview
            </a>
            <a
              href="#benefits"
              className="hover:text-brand-500 dark:hover:text-brand-400 transition-colors"
            >
              Benefits
            </a>
            {/* <a href="#testimonials" className="hover:text-brand-500 dark:hover:text-brand-400 transition-colors">Testimonials</a> */}
            <a
              href="#faq"
              className="hover:text-brand-500 dark:hover:text-brand-400 transition-colors"
            >
              FAQ
            </a>
          </nav>

          {/* Right Action Controls */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title={
                theme === "dark"
                  ? "Switch to Light Mode"
                  : "Switch to Dark Mode"
              }
            >
              {theme === "dark" ? (
                <FiSun className="w-4 h-4 text-amber-400" />
              ) : (
                <FiMoon className="w-4 h-4 text-slate-700" />
              )}
            </button>

            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs transition-all shadow-md shadow-brand-600/30 flex items-center gap-2 hover:scale-[1.02] cursor-pointer"
              >
                Console <FiArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs transition-all hover:scale-[1.02]"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Hero Full-Screen Carousel (100vh) */}
      <section
        className="relative w-full h-screen overflow-hidden bg-slate-950 text-white flex items-center"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0 w-full h-full"
          >
            {/* Background Image with Ken Burns Slow Zoom */}
            <motion.div
              initial={{ scale: 1 }}
              animate={{ scale: 1.08 }}
              transition={{ duration: 6, ease: "linear" }}
              className="absolute inset-0 w-full h-full bg-cover bg-center"
              style={{ backgroundImage: `url(${slides[currentSlide].image})` }}
            />

            {/* Dark & Gradient Overlay for Theme Compatibility */}
            <div className="absolute inset-0 bg-linear-to-r from-slate-950/95 via-slate-950/80 to-slate-950/60 dark:from-slate-950/95 dark:via-slate-950/85 dark:to-slate-950/70" />
            <div className="absolute inset-0 bg-linear-to-t from-slate-950 via-transparent to-slate-950/60" />
          </motion.div>
        </AnimatePresence>

        {/* Slide Content Frame */}
        <div className="relative max-w-7xl mx-auto px-6 w-full z-10 pt-20">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.6 }}
              className="max-w-3xl space-y-6"
            >
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30 text-xs font-mono font-bold uppercase tracking-wider backdrop-blur-md">
                <span className="w-2 h-2 rounded-full bg-brand-400 animate-ping" />
                {slides[currentSlide].badge}
              </div>

              {/* Title */}
              <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight leading-[1.08] text-white drop-shadow-lg">
                {slides[currentSlide].title}
              </h1>

              {/* Subtitle */}
              <p className="text-slate-300 text-base sm:text-xl leading-relaxed font-normal max-w-2xl drop-shadow">
                {slides[currentSlide].subtitle}
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-4 pt-4">
                {slides[currentSlide].buttons.map((btn, idx) =>
                  btn.to ? (
                    <Link
                      key={idx}
                      to={btn.to}
                      className={`px-8 py-4 rounded-2xl font-extrabold text-sm sm:text-base transition-all flex items-center justify-center gap-2.5 shadow-xl hover:scale-[1.03] cursor-pointer ${
                        btn.primary
                          ? "bg-brand-600 hover:bg-brand-500 text-white shadow-brand-600/30"
                          : "bg-slate-900/90 hover:bg-slate-800 text-white border border-slate-700/80 backdrop-blur-md"
                      }`}
                    >
                      {btn.label} <FiArrowRight className="w-5 h-5" />
                    </Link>
                  ) : (
                    <a
                      key={idx}
                      href={btn.href}
                      className={`px-8 py-4 rounded-2xl font-extrabold text-sm sm:text-base transition-all flex items-center justify-center gap-2.5 shadow-xl hover:scale-[1.03] cursor-pointer ${
                        btn.primary
                          ? "bg-brand-600 hover:bg-brand-500 text-white shadow-brand-600/30"
                          : "bg-slate-900/90 hover:bg-slate-800 text-white border border-slate-700/80 backdrop-blur-md"
                      }`}
                    >
                      {btn.label} <FiArrowRight className="w-5 h-5" />
                    </a>
                  ),
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Carousel Navigation Arrows */}
        <button
          onClick={prevSlide}
          className="absolute left-6 top-1/2 -translate-y-1/2 z-20 p-3.5 rounded-full bg-slate-900/60 hover:bg-brand-600 text-white border border-slate-700/50 backdrop-blur-md transition-all hover:scale-110 cursor-pointer hidden sm:flex"
          aria-label="Previous Slide"
        >
          <FiChevronLeft className="w-6 h-6" />
        </button>

        <button
          onClick={nextSlide}
          className="absolute right-6 top-1/2 -translate-y-1/2 z-20 p-3.5 rounded-full bg-slate-900/60 hover:bg-brand-600 text-white border border-slate-700/50 backdrop-blur-md transition-all hover:scale-110 cursor-pointer hidden sm:flex"
          aria-label="Next Slide"
        >
          <FiChevronRight className="w-6 h-6" />
        </button>

        {/* Carousel Indicator Dots */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`transition-all cursor-pointer ${
                currentSlide === idx
                  ? "w-10 h-3 bg-brand-500 rounded-full shadow-lg shadow-brand-500/50"
                  : "w-3 h-3 bg-white/40 hover:bg-white/80 rounded-full"
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      </section>

      {/* AI Features Section */}
      <section id="features" className="py-24 max-w-7xl mx-auto px-6 z-10">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <span className="px-3 py-1 rounded-full bg-brand-500/10 text-brand-500 dark:text-brand-400 border border-brand-500/20 text-xs font-mono font-bold uppercase">
            Core Platform Capability
          </span>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
            Enterprise AI Features
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-base">
            Everything required for continuous industrial machine monitoring,
            LightGBM remaining useful life prediction, and failsafe incident
            logging.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feat, idx) => (
            <div
              key={idx}
              className="p-8 rounded-3xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 hover:border-brand-500/50 transition-all shadow-sm group hover:shadow-xl"
            >
              <div className="p-4 rounded-2xl bg-brand-500/10 text-brand-500 dark:text-brand-400 w-fit mb-6 group-hover:scale-110 transition-transform">
                <feat.icon className="w-8 h-8" />
              </div>
              <span className="text-[10px] font-mono font-bold uppercase px-2.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 inline-block mb-3">
                {feat.badge}
              </span>
              <h3 className="text-xl font-bold mb-3 text-slate-900 dark:text-white">
                {feat.title}
              </h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                {feat.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Machine Monitoring Section */}
      <section
        id="monitoring"
        className="py-24 bg-slate-100/70 dark:bg-slate-900/40 border-y border-slate-200 dark:border-slate-800/80"
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-mono font-bold uppercase">
              Telemetry Ingestion
            </span>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
              Continuous Machine Monitoring
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-base">
              Real-time monitoring of vibration amplitude, thermal casing
              gradients, and lubricant pressure.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="p-8 rounded-3xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="p-3.5 rounded-2xl bg-brand-500/10 text-brand-500 w-fit">
                <FiActivity className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Vibration Analysis
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                3-axis accelerometers capture mechanical imbalance, gear tooth
                wear, and bearing race defects in real time.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="p-3.5 rounded-2xl bg-amber-500/10 text-amber-500 w-fit">
                <FiZap className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Thermal & Pressure Telemetry
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Infrared thermography monitors heat buildup while pressure
                sensors track fluid flow and filter clogging.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 text-emerald-500 w-fit">
                <FiRadio className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Automated Health Scoring
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Sensors are aggregated into a dynamic machine health score index
                updated every 5 seconds.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Failure Prediction & RUL Section */}
      <section id="predictions" className="py-24 max-w-7xl mx-auto px-6 z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-6">
            <span className="px-3 py-1 rounded-full bg-brand-500/10 text-brand-500 dark:text-brand-400 border border-brand-500/20 text-xs font-mono font-bold uppercase">
              ML Failure Prediction
            </span>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white leading-tight">
              Remaining Useful Life (RUL) Forecasting
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-base leading-relaxed">
              Our LightGBM machine learning regression models evaluate current
              sensor vectors against historical degradation curves to accurately
              forecast remaining operating hours.
            </p>

            <div className="space-y-4 pt-2">
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-start gap-4 shadow-sm">
                <div className="p-2.5 rounded-xl bg-brand-500/10 text-brand-500 mt-1">
                  <FiTrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                    LightGBM AI Regression
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    Lightweight, high-speed ML engine computes Remaining Useful
                    Life (RUL) with sub-45ms latency.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-start gap-4 shadow-sm">
                <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500 mt-1">
                  <FiShield className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                    Failure Risk Classification
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    Categorizes operational risks into Normal, Warning, and
                    Critical threshold alerts.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* RUL Visual Card */}
          <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <FiCpu className="text-brand-500" /> Machine ID: MILL-CNC-402
              </h3>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 uppercase">
                STATUS: OPTIMAL
              </span>
            </div>

            <div className="space-y-4 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400">
                  Predicted Remaining Useful Life (RUL):
                </span>
                <span className="font-black text-2xl text-emerald-600 dark:text-emerald-400">
                  680.5 Hrs
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full w-[85%]" />
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">
                    Failure Probability:
                  </span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                    0.064 (Low)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">
                    Predicted Failure Mode:
                  </span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    Spindle Bearing Wear
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Failure Black Box Section */}
      {/* <section
        id="blackbox"
        className="py-24 bg-white dark:bg-slate-900 border-y border-slate-200 dark:border-slate-800 transition-all duration-300"
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-6">
              <span className="px-3 py-1 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-mono font-bold uppercase">
                Failsafe Incident Recorder
              </span>
              <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
                Failure Black Box System
              </h2>
              <p className="text-slate-300 text-base leading-relaxed">
                When an unexpected machine trip occurs, the Failure Black Box
                automatically freezes and locks the prior 24 hours of raw sensor
                telemetry for post-mortem diagnostics.
              </p>

              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-3 text-xs text-slate-300">
                  <FiCheckCircle className="text-red-400 w-5 h-5 shrink-0" />
                  <span>
                    Captures 24-hour pre-failure sensor telemetry snapshots.
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-300">
                  <FiCheckCircle className="text-red-400 w-5 h-5 shrink-0" />
                  <span>
                    Provides chronological anomaly timelines for root-cause
                    isolation.
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-300">
                  <FiCheckCircle className="text-red-400 w-5 h-5 shrink-0" />
                  <span>
                    Enables engineers to review failure history and prevent
                    recurrence.
                  </span>
                </div>
              </div>
            </div> */}

      {/* Black Box Visual */}
      {/* <div className="p-8 rounded-3xl bg-slate-950 border border-slate-800 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 text-xs font-mono">
                <span className="font-bold text-slate-200 flex items-center gap-2">
                  <FiHardDrive className="text-red-400" />{" "}
                  BLACKBOX_SNAPSHOT_#104
                </span>
                <span className="text-red-400 font-bold px-2 py-0.5 rounded bg-red-500/10 border border-red-500/20 uppercase">
                  INCIDENT LOCKED
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex justify-between">
                  <span className="text-slate-400">Trigger Event:</span>
                  <span className="font-bold text-white font-mono">
                    Vibration Spike (&gt; 4.8 g)
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex justify-between">
                  <span className="text-slate-400">Incident Timestamp:</span>
                  <span className="font-bold text-emerald-400 font-mono">
                    2026-07-28 14:22:04 UTC
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex justify-between">
                  <span className="text-slate-400">
                    Root Cause Diagnostics:
                  </span>
                  <span className="font-bold text-amber-400 font-mono">
                    Spindle Bearing Failure
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section> */}

      <section
        id="blackbox"
        className="py-24 bg-white dark:bg-slate-900 border-y border-slate-200 dark:border-slate-800 transition-all duration-300"
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left Side */}
            <div className="space-y-6">
              <span className="px-3 py-1 rounded-full bg-red-500/10 dark:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/30 text-xs font-mono font-bold uppercase">
                Failsafe Incident Recorder
              </span>

              <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white leading-tight transition-colors">
                Failure Black Box System
              </h2>

              <p className="text-slate-600 dark:text-slate-300 text-base leading-relaxed transition-colors">
                When an unexpected machine trip occurs, the Failure Black Box
                automatically freezes and locks the prior 24 hours of raw sensor
                telemetry for post-mortem diagnostics.
              </p>

              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300 transition-colors">
                  <FiCheckCircle className="text-red-500 dark:text-red-400 w-5 h-5 shrink-0" />
                  <span>
                    Captures 24-hour pre-failure sensor telemetry snapshots.
                  </span>
                </div>

                <div className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300 transition-colors">
                  <FiCheckCircle className="text-red-500 dark:text-red-400 w-5 h-5 shrink-0" />
                  <span>
                    Provides chronological anomaly timelines for root-cause
                    isolation.
                  </span>
                </div>

                <div className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300 transition-colors">
                  <FiCheckCircle className="text-red-500 dark:text-red-400 w-5 h-5 shrink-0" />
                  <span>
                    Enables engineers to review failure history and prevent
                    recurrence.
                  </span>
                </div>
              </div>
            </div>

            {/* Right Side */}

            <div className="p-8 rounded-3xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-2xl transition-all duration-300">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 text-xs font-mono">
                <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <FiHardDrive className="text-red-500 dark:text-red-400" />
                  BLACKBOX_SNAPSHOT_#104
                </span>

                <span className="text-red-600 dark:text-red-400 font-bold px-2 py-0.5 rounded bg-red-500/10 border border-red-500/20 uppercase">
                  INCIDENT LOCKED
                </span>
              </div>

              <div className="space-y-3 mt-5 text-sm">
                <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">
                    Trigger Event:
                  </span>

                  <span className="font-bold text-slate-900 dark:text-white font-mono">
                    Vibration Spike (&gt; 4.8 g)
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">
                    Incident Timestamp:
                  </span>

                  <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                    2026-07-28 14:22:04 UTC
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">
                    Root Cause Diagnostics:
                  </span>

                  <span className="font-bold text-amber-600 dark:text-amber-400 font-mono">
                    Spindle Bearing Failure
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Dashboard Preview Section */}
      <section id="preview" className="py-24 max-w-7xl mx-auto px-6 z-10">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <span className="px-3 py-1 rounded-full bg-brand-500/10 text-brand-500 dark:text-brand-400 border border-brand-500/20 text-xs font-mono font-bold uppercase">
            Operational Console
          </span>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
            Dashboard Console Preview
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-base">
            Role-tailored dashboards for Admin, Reliability Engineers, and
            Executive Viewers.
          </p>
        </div>

        {/* Console Mockup Container */}
        <div className="w-full max-w-5xl mx-auto rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-6 shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500 inline-block" />
              <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />
              <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
              <span className="ml-2 font-bold text-slate-800 dark:text-slate-200">
                AI-Predictive-Maintenance // CONSOLE
              </span>
            </div>
            <span className="text-emerald-500 font-bold">
              LIVE TELEMETRY STREAM
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-sans">
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
              <span className="text-slate-500 font-bold uppercase block">
                Total Monitored Machines
              </span>
              <span className="text-3xl font-black text-slate-900 dark:text-white">
                24 Nodes
              </span>
              <span className="text-[10px] text-emerald-500 font-bold block">
                100% Connected
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
              <span className="text-slate-500 font-bold uppercase block">
                Average Health Score
              </span>
              <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
                92.4%
              </span>
              <span className="text-[10px] text-slate-400 block font-mono">
                Optimal Condition
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
              <span className="text-slate-500 font-bold uppercase block">
                Failsafe Black Box
              </span>
              <span className="text-3xl font-black text-brand-500">Active</span>
              <span className="text-[10px] text-slate-400 block font-mono">
                24h Rolling Snapshot
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section
        id="benefits"
        className="py-24 bg-slate-100/70 dark:bg-slate-900/40 border-y border-slate-200 dark:border-slate-800/80"
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <span className="px-3 py-1 rounded-full bg-brand-500/10 text-brand-500 dark:text-brand-400 border border-brand-500/20 text-xs font-mono font-bold uppercase">
              Business Impact
            </span>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
              Key Platform Benefits
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((ben, idx) => (
              <div
                key={idx}
                className="p-8 rounded-3xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4"
              >
                <div className="p-3.5 rounded-2xl bg-brand-500/10 text-brand-500 w-fit">
                  <ben.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {ben.title}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {ben.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Statistics Counter */}
      <section className="py-20 max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, idx) => (
            <div
              key={idx}
              className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-2 shadow-sm"
            >
              <span className="text-4xl font-black text-brand-500 dark:text-brand-400 tracking-tight block">
                {stat.value}
              </span>
              <span className="text-sm font-bold text-slate-900 dark:text-white block">
                {stat.label}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono block">
                {stat.subtext}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials Section */}
      {/* <section id="testimonials" className="py-24 bg-slate-100/70 dark:bg-slate-900/40 border-t border-slate-200 dark:border-slate-800/80">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-mono font-bold uppercase">
              Client Feedback
            </span>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
              Trusted by Reliability Leaders
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((item, idx) => (
              <div key={idx} className="p-8 rounded-3xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-6">
                <p className="text-sm text-slate-700 dark:text-slate-300 italic leading-relaxed">"{item.quote}"</p>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">{item.author}</h4>
                  <span className="text-xs text-brand-500 dark:text-brand-400 font-semibold block">{item.role}</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">{item.company}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section> */}

      {/* FAQ Section */}
      <section id="faq" className="py-24 max-w-4xl mx-auto px-6 z-10">
        <div className="text-center mb-16 space-y-4">
          <span className="px-3 py-1 rounded-full bg-brand-500/10 text-brand-500 dark:text-brand-400 border border-brand-500/20 text-xs font-mono font-bold uppercase">
            Questions & Answers
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-4">
          {faqList.map((faq, idx) => (
            <div
              key={idx}
              className="rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden"
            >
              <button
                onClick={() => toggleFaq(idx)}
                className="w-full p-6 text-left flex items-center justify-between font-bold text-sm text-slate-900 dark:text-white hover:text-brand-500 dark:hover:text-brand-400 transition-colors cursor-pointer"
              >
                <span>{faq.q}</span>
                <FiChevronDown
                  className={`w-5 h-5 transition-transform duration-300 ${activeFaq === idx ? "rotate-180 text-brand-500" : "text-slate-400"}`}
                />
              </button>
              <AnimatePresence>
                {activeFaq === idx && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="px-6 pb-6 text-xs text-slate-600 dark:text-slate-400 leading-relaxed border-t border-slate-200 dark:border-slate-800/60 pt-4"
                  >
                    {faq.a}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </section>

      {/* Professional Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 py-12 text-xs text-slate-600 dark:text-slate-400 transition-colors">
        <div className="max-w-7xl mx-auto px-6 space-y-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-8 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-500 dark:text-brand-400">
                <FiCpu className="w-6 h-6" />
              </div>
              <div>
                <span className="font-black text-base text-slate-900 dark:text-white tracking-wider">
                  AI-Predictive-Maintenance
                </span>
                <span className="text-[10px] text-slate-500 font-mono block">
                  Industrial Intelligence Platform
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-6 font-semibold">
              <a
                href="#features"
                className="hover:text-brand-500 dark:hover:text-white transition-colors"
              >
                AI Features
              </a>
              <a
                href="#monitoring"
                className="hover:text-brand-500 dark:hover:text-white transition-colors"
              >
                Monitoring
              </a>
              <a
                href="#predictions"
                className="hover:text-brand-500 dark:hover:text-white transition-colors"
              >
                Failure Prediction
              </a>
              <a
                href="#blackbox"
                className="hover:text-brand-500 dark:hover:text-white transition-colors"
              >
                Black Box
              </a>
              <a
                href="#preview"
                className="hover:text-brand-500 dark:hover:text-white transition-colors"
              >
                Dashboard Preview
              </a>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-slate-500">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
              <span>
                © 2026 AI-Predictive-Maintenance Suite. All rights reserved.
              </span>
            </div>
            {/* <div className="flex items-center gap-4 font-mono text-[11px]">
              <span>ISO 27001 Certified</span>
              <span>•</span>
              <span>SOC 2 Type II</span>
              <span>•</span>
              <span>CE Industrial Compliant</span>
            </div> */}
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
