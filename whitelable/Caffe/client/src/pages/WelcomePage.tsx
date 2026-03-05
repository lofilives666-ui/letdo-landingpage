import { Link, useNavigate } from "react-router-dom";

export function WelcomePage() {
  const navigate = useNavigate();

  return (
    <main className="mobile-shell onboarding-shell user-fullscreen">
      <div className="phone-frame onboarding-bg user-fullscreen">
        <div className="brand-mark brand-floating" aria-label="NIKKIS logo">
          <span className="brand-dot" />
          <strong>NIKKIS</strong>
        </div>
        <div className="onboarding-content">
          <h1>Fall in Love with Coffee in Blissful Delight!</h1>
          <p>Welcome to our cozy canteen corner, where every cup is a delightful for you.</p>
          <button className="primary-btn" onClick={() => navigate("/home")}>
            Get Started
          </button>
          <Link className="text-link" to="/login">
            Admin Login
          </Link>
        </div>
      </div>
    </main>
  );
}
