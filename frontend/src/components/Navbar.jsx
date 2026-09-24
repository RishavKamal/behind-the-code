import { Link } from "react-router-dom";
import ThemeSwitcher from "./ThemeSwitcher";

const Navbar = () => {
  return (
    <header className="navbar">
      <div className="navbar-container">

        <Link to="/" className="logo">
          Behind the Code
        </Link>

        <nav>
          <Link to="/">Home</Link>

          <Link to="/articles">
            Articles
          </Link>

          <Link to="/topics">
            Topics
          </Link>

          <Link to="/about">
            About
          </Link>

          <Link to="/login">
            Login
          </Link>

          <ThemeSwitcher />
        </nav>

      </div>
    </header>
  );
};

export default Navbar;