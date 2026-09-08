import { useNavigate } from "react-router-dom";

function BottomNav() {
  const navigate = useNavigate();

  return (
    <div className="bottom-nav">
      <button onClick={() => navigate("/")}>🏠 Home</button>
      <button>🔍 Search</button>
      <button>➕ Create</button>
      <button>👤 Profile</button>
    </div>
  );
}

export default BottomNav;
