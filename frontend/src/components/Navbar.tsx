import { Link } from "react-router-dom";
import "../css/Navbar.css";

function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/">RaceRacer</Link>
      </div>
      <div className="navbar-links">
        <Link to="/" className="nav-link">
          Home
        </Link>
        <Link to="/lobby" className="nav-link">
          Lobby
        </Link>
      </div>
    </nav>
  );
}

export default Navbar;
