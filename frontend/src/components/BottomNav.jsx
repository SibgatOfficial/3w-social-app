import { useNavigate } from "react-router-dom";

function BottomNav() {
  const navigate = useNavigate();

  return (
    <nav className="bottom-nav">
      <button onClick={() => navigate("/")}>
        <span>⌂</span>
        Home
      </button>

      <button>
        <span>☷</span>
        Tasks
      </button>

      <button className="active">
        <span>◎</span>
        Social
      </button>

      <button>
        <span>♛</span>
        Leaderboard
      </button>

      <button>
        <span>•••</span>
        Chat
      </button>
    </nav>
  );
}

export default BottomNav;
