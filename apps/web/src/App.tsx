import "./App.css";
import { useState } from "react";
import { NavLink, Route, BrowserRouter as Router, Routes } from "react-router-dom";
import { BasketProvider, useBasket } from "./context/BasketContext";
import { BasketModal } from "./components/BasketModal";
import { CardsPage } from "./pages/CardsPage";
import { HomePage } from "./pages/HomePage";
import { ThemeToggle } from "./components/ThemeToggle";
import { ScrollToTop } from "./components/ScrollToTop";

function Header() {
  const { totalQty } = useBasket();
  const [basketOpen, setBasketOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-30 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-[1280px] mx-auto px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <NavLink
              to="/"
              className="text-xl font-bold tracking-tight text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              ⚓ ONE PIECE TCG
            </NavLink>
            <nav className="hidden sm:flex items-center gap-1">
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  }`
                }
              >
                Home
              </NavLink>
              <NavLink
                to="/cards"
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  }`
                }
              >
                Cards
              </NavLink>
            </nav>
          </div>
          <button
            onClick={() => setBasketOpen(true)}
            aria-label="Open basket"
            className="relative flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
            {totalQty > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-blue-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {totalQty > 99 ? "99+" : totalQty}
              </span>
            )}
          </button>
        </div>
      </header>
      {basketOpen && <BasketModal onClose={() => setBasketOpen(false)} />}
    </>
  );
}

function App() {
  return (
    <BasketProvider>
      <Router>
        <Header />
        <Routes>
          <Route path="/" Component={HomePage} />
          <Route path="/cards" Component={CardsPage} />
        </Routes>
        <ScrollToTop />
        <ThemeToggle />
      </Router>
    </BasketProvider>
  );
}

export default App;
