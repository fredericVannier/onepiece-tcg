import "./App.css";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import { CardsPage } from "./pages/CardsPage";

function App() {
  return (
    <div>
      <Router>
        <Routes>
          <Route path="/cards" Component={CardsPage} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
