import { useState, useEffect, useRef, useCallback } from "react";
import Box from "@mui/material/Box";
import InputBase from "@mui/material/InputBase";
import Paper from "@mui/material/Paper";
import { useNavigate } from "react-router-dom";
import Avatar from "@mui/material/Avatar";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import { alpha } from "@mui/material/styles";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";
import { gradientFor } from "../utils/avatar";
import { search as searchApi } from "../services/api";

const DEBOUNCE_MS = 300;
const MIN_QUERY = 1;

export default function SearchBar() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPanel, setShowPanel] = useState(false);
  const [focused, setFocused] = useState(false);
  const containerRef = useRef(null);

  const active = query.trim().length >= MIN_QUERY && showPanel;

  const handleEmpty = () => {
    setResults(null);
    setLoading(false);
  };

  const fetchResults = useCallback(async (term) => {
    if (term.trim().length < MIN_QUERY) {
      handleEmpty();
      return;
    }
    setLoading(true);
    try {
      const { data } = await searchApi(term);
      setResults(data);
    } catch {
      setResults(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!focused) return;
    const trimmed = query.trim();
    const id = setTimeout(() => {
      if (trimmed.length < MIN_QUERY) {
        handleEmpty();
        setShowPanel(false);
      } else {
        setShowPanel(true);
        fetchResults(query);
      }
    }, DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [query, focused, fetchResults]);
    useEffect(() => {
    const onDown = (e) => {
      if (e.key === "Escape") {
        setShowPanel(false);
        setFocused(false);
      }
    };
    const onClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowPanel(false);
        setFocused(false);
      }
    };
    document.addEventListener("keydown", onDown);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onDown);
      document.removeEventListener("mousedown", onClick);
    };
  }, []);

    const onSelectUser = (username) => {
    setShowPanel(false);
    setQuery("");
    setFocused(false);
    navigate(`/?user=${encodeURIComponent(username)}`);
  };

  const onSelectPost = (id) => {
    setShowPanel(false);
    setQuery("");
    setFocused(false);
    navigate(`/post/${id}`);
  };

  const handleClear = () => setQuery("");

  const users = results?.users || [];
    const posts = results?.posts || [];

  return (
    <Box
      ref={containerRef}
      sx={{
        position: "relative",
        width: { xs: "100%", sm: "460px" },
        mx: "auto",
      }}
    >
      <Paper
        elevation={focused ? 6 : 1}
        sx={{
          display: "flex",
          alignItems: "center",
          width: "100%",
          height: 48,
          borderRadius: 999,
          px: 2,
          backgroundColor: "rgba(120,150,255,0.06)",
          
          border: "1px solid",
          borderColor: focused
            ? "rgba(120,150,255,0.45)"
            : "rgba(120,150,255,0.12)",
          boxShadow: focused
            ? "0 0 0 3px rgba(120,150,255,0.15)"
            : "0 4px 12px rgba(0, 0, 0, 0.35)",
          transition:
            "border-color 0.18s ease, box-shadow 0.18s ease, background-color 0.18s ease",
          overflow: "hidden",
        }}
      >
        <SearchIcon
          sx={{
            mr: 1.5,
            color: focused ? "primary.main" : "text.disabled",
            transition: "color 0.18s ease",
            fontSize: 20,
          }}
        />
        <InputBase
          sx={{
            color: "text.primary",
            width: "100%",
            "& .MuiInputBase-input": {
              py: 1.5,
              fontSize: 15,
              "::placeholder": {
                color: "text.disabled",
                opacity: 1,
              },
            },
            "& .MuiInputBase-input:focus": {
              outline: "none",
            },
          }}
          inputProps={{
            placeholder: "Search users, posts...",
            "aria-label": "Search users and posts",
          }}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowPanel(true);
          }}
          onFocus={() => {
            setFocused(true);
            if (query.trim().length >= MIN_QUERY) setShowPanel(true);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && query.trim()) {
              setShowPanel(true);
              const firstPost = posts.length
                ? posts.find((p) => p._id !== posts[0]?._id) || posts[0]
                : null;
              if (firstPost) {
                e.preventDefault();
                onSelectPost(firstPost._id);
              }
            }
          }}
        />
        {query ? (
          <CloseIcon
            className="fluid-press"
            sx={{
              ml: 1,
              mr: 0.5,
              fontSize: 18,
              color: "text.disabled",
              cursor: "pointer",
            }}
            onClick={handleClear}
            aria-label="Clear search"
          />
        ) : null}
            </Paper>

      {active && (
        <Paper
          className="pop-in"
          elevation={8}
          sx={{
            position: "absolute",
            top: "calc(100% + 8px)",
            left: 0,
            right: 0,
            zIndex: 1200,
            borderRadius: 3,
            overflow: "hidden",
            backgroundColor: "rgba(14,22,48,0.98)",
            border: "1px solid rgba(120,150,255,0.15)",
            boxShadow:
              "0 20px 28px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(120,150,255,0.1)",
            maxHeight: 480,
          }}
        >
          {loading && (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 1.5,
                py: 2.5,
              }}
            >
              <CircularProgress size={20} thickness={5} />
              <Typography variant="body2" color="text.disabled">
                Searching...
              </Typography>
            </Box>
          )}

          {!loading && users.length === 0 && posts.length === 0 && (
                          <Box sx={{ p: 2.5, textAlign: "center" }}>
              <Typography variant="body2" color="text.disabled">
                No results found for "{query}"
              </Typography>
            </Box>
          )}

          {!loading && (
            <>
              {users.length > 0 && (
                <Box>
                  <Typography
                    variant="caption"
                    sx={{
                      px: 2,
                      pt: 1.5,
                      pb: 0.75,
                      display: "block",
                      fontWeight: 700,
                      color: "text.disabled",
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                      fontSize: 11,
                    }}
                  >
                    Users
                  </Typography>
                  {users.map((u) => (
                    <Box
                      key={u._id}
                      onClick={() => onSelectUser(u.username)}
                      className="fluid-press"
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1.5,
                        px: 2,
                        py: 1.25,
                        cursor: "pointer",
                        borderRadius: 1,
                        mx: 1,
                        my: 0.25,
                        transition: "background-color 0.15s ease",
                        "&:hover": {
                          backgroundColor: alpha("#ffffff", 0.045),
                        },
                      }}
                    >
                      <Avatar
                        src={u.avatar}
                        alt={u.username}
                        sx={{
                          width: 36,
                          height: 36,
                          fontSize: 14,
                          background: gradientFor(u.username || u.name || "u"),
                        }}
                      />
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 600, lineHeight: 1.3 }}
                        >
                          {u.name || u.username}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{ color: "text.disabled", lineHeight: 1.2 }}
                        >
                          @{u.username}
                        </Typography>
                      </Box>
                    </Box>
                                  ))}
                </Box>
              )}

              {posts.length > 0 && (
                <Box>
                  {users.length > 0 && (
                    <Box
                      sx={{
                        height: 1,
                        backgroundColor: alpha("#fff", 0.06),
                        mx: 1,
                        my: 1,
                      }}
                    />
                  )}
                  <Typography
                    variant="caption"
                    sx={{
                      px: 2,
                      pt: 1.5,
                      pb: 0.75,
                      display: "block",
                      fontWeight: 700,
                      color: "text.disabled",
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                      fontSize: 11,
                    }}
                  >
                    Posts
                  </Typography>
                  {posts.map((p) => {
                        const snippet = p.poll?.question
                          ? p.poll.question
                          : p.text
                            ? p.text
                            : "No content";
                    return (
                      <Box
                      key={p._id}
                      onClick={() => onSelectPost(p._id)}
                      className="fluid-press"
                      sx={{
                        px: 2,
                        py: 1.25,
                        cursor: "pointer",
                        borderRadius: 1,
                        mx: 1,
                        my: 0.25,
                        transition: "background-color 0.15s ease",
                        "&:hover": {
                          backgroundColor: alpha("#ffffff", 0.045),
                        },
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          color: "text.primary",
                          lineHeight: 1.4,
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                          mb: 0.5,
                        }}
                      >
                        {snippet}
                      </Typography>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                        }}
                      >
                        <Avatar
                          src={p.avatar}
                          alt={p.username}
                          sx={{
                            width: 22,
                            height: 22,
                            fontSize: 10,
                            background: gradientFor(p.username || "user"),
                          }}
                        />
                        <Typography
                          variant="caption"
                          sx={{ color: "text.disabled", fontWeight: 600 }}
                        >
                          @{p.username}
                        </Typography>
                      </Box>
                    </Box>
                  );
                  })}
                </Box>
              )}
            </>
          )}
        </Paper>
      )}
    </Box>
  );
}