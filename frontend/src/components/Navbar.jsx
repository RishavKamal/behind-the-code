import { Link, useNavigate } from "react-router-dom";
import ThemeSwitcher from "./ThemeSwitcher";
import { isAuthenticated, logout } from "../api/authApi";

const Navbar = () => {
  const navigate = useNavigate();
  const authenticated = isAuthenticated();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="navbar">
      <div className="navbar-container">
        <Link to="/" className="logo">
  <img
    src="/favicon.svg"
    alt="Behind the Code"
    className="logo-mark"
  />

  <span>Behind the Code</span>
</Link>

        <nav>
          <Link to="/">Home</Link>
          <Link to="/articles">Articles</Link>
          <Link to="/topics">Topics</Link>
          <Link to="/about">About</Link>

          {authenticated ? (
            <>
              <Link to="/admin">Admin</Link>

              <button
                type="button"
                className="navbar-logout"
                onClick={handleLogout}
              >
                Logout
              </button>
            </>
          ) : (
            <Link to="/login">Login</Link>
          )}

          <ThemeSwitcher />
        </nav>
      </div>
    </header>
  );
};

export default Navbar;