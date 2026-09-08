import { useNavigate } from "react-router-dom";

function Navbar() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  }

  return (
    <header className="top-nav">
      <div className="brand">Social</div>

      <div className="nav-right">
        <div className="points-pill">
          <span>50</span> ⭐
        </div>

        <div className="money-pill">₹0.00</div>

        <div className="moon">☾</div>

        <div className="profile-avatar">
          {user?.username?.charAt(0).toUpperCase() || "U"}
        </div>

        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </header>
  );
}

export default Navbar;
