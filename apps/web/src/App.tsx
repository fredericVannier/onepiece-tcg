import "./App.css";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import { Home } from "./pages/home/Home";

function App() {
  return (
    <div>
      <Router>
        <Routes>
          <Route path="/cards" Component={Home} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
