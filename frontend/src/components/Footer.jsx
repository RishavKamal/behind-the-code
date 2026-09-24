const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-brand">
        <img
          src="/favicon.svg"
          alt="Behind the Code"
          className="footer-logo"
        />

        <div>
          <p className="footer-title">Behind the Code</p>
          <p className="footer-tagline">
            Learning · Building · Debugging
          </p>
        </div>
      </div>

      <p className="footer-copyright">
        © {new Date().getFullYear()} Behind the Code
      </p>
    </footer>
  );
};

export default Footer;