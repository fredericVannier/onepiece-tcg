import "./App.css";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import { CardsPage } from "./pages/CardsPage";
import { ThemeToggle } from "./components/ThemeToggle";
import { ScrollToTop } from "./components/ScrollToTop";

function App() {
  return (
    <Router>
      <header className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-[1280px] mx-auto px-8 py-4">
          <span className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
            ⚓ ONE PIECE TCG
          </span>
        </div>
      </header>
      <Routes>
        <Route path="/cards" Component={CardsPage} />
      </Routes>
      <ScrollToTop />
      <ThemeToggle />
    </Router>
  );
}

export default App;
