import React from "react";
import { useEffect } from "react";
import { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import "material-icons/iconfont/material-icons.css";
import "@fontsource/fira-code";
import MatchesPage from "./MatchesPage";
import RozpisPage from "./RozpisPage";
import ZpravyPage from "./ZpravyPage";
import LoginPage from "./LoginPage";
import AdminPage from "./AdminPage";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

function App() {
  const [teams, setTeams] = useState({});
  const [page, setPage] = useState("matches");
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState(null);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setIsAdmin(!!data.user);
    });
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        setIsAdmin(!!session?.user);
      }
    );
    return () => {
      listener?.subscription?.unsubscribe?.();
    };
  }, []);

  useEffect(() => {
    getTeams();
  }, []);

  async function getTeams() {
    const { data } = await supabase.from("teams").select();
    if (data) {
      const teamMap = {};
      data.forEach((team) => {
        teamMap[team.id] = team.name;
      });
      setTeams(teamMap);
    }
  }

  useEffect(() => {
    const setVh = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty("--vh", `${vh}px`);
    };

    setVh();
    window.addEventListener("resize", setVh);
    return () => window.removeEventListener("resize", setVh);
  }, []);

  function Sidebar() {
    const [open, setOpen] = useState(false);
    return (
      <>
        <button
          className="flex items-center p-4"
          onClick={() => {
            setOpen(!open);
          }}
        >
          <span className="text-white material-icons">menu</span>
        </button>
        {/* side menu */}
        {open && (
          <div
            onClick={() => setOpen(false)}
            className="fixed inset-0 bg-black opacity-50"
          />
        )}
        <div
          className={`fixed top-0 left-0 h-full w-3/4 bg-zinc-900 text-white transition-transform ${
            open ? "translate-x-0" : "-translate-x-full"
          }`}
          style={{ height: "calc(var(--vh, 1vh) * 100)" }}
        >
          <div className="flex flex-col justify-between h-full">
            <div className="flex flex-col w-full">
              <div
                className="flex items-center p-1 border-zinc-800 border-b w-full h-16 text-white text-xl cursor-pointer"
                onClick={() => {
                  setPage("matches");
                  setOpen(false);
                }}
              >
                <span className="m-2 mr-3 text-white material-icons">home</span>
                <p>Probíhající zápasy</p>
              </div>
              <div
                className="flex items-center p-1 border-zinc-800 border-b w-full h-16 text-white text-xl cursor-pointer"
                onClick={() => {
                  setPage("rozpis");
                  setOpen(false);
                }}
              >
                <span className="m-2 mr-3 text-white material-icons">
                  event
                </span>
                <p>Rozpis</p>
              </div>
              <div
                className="flex items-center p-1 border-zinc-800 border-b w-full h-16 text-white text-xl cursor-pointer"
                onClick={() => {
                  setPage("zpravy");
                  setOpen(false);
                }}
              >
                <span className="m-2 mr-3 text-white material-icons">
                  newspaper
                </span>
                <p>Zprávy</p>
              </div>
              {/* Admin menu item, only visible if isAdmin is true */}
              {isAdmin && (
                <div
                  className="flex items-center bg-zinc-800 p-1 border-zinc-800 border-b w-full h-16 text-white text-xl cursor-pointer"
                  onClick={() => {
                    setPage("admin");
                    setOpen(false);
                  }}
                >
                  <span className="m-2 mr-3 text-white material-icons">
                    admin_panel_settings
                  </span>
                  <p>Admin menu</p>
                </div>
              )}
            </div>
            <div className="flex flex-col w-full">
              <div
                className="flex items-center p-1 border-zinc-800 border-t w-full h-16 text-white text-xl cursor-pointer"
                onClick={() => {
                  setPage("login");
                  setOpen(false);
                }}
              >
                <span className="m-2 mr-3 text-white material-icons">
                  login
                </span>
                <p>Login</p>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div
        className="flex flex-col"
        style={{ height: "calc(var(--vh, 1vh) * 100)" }}
      >
        <header className="flex gap-0 border-zinc-900 border-b max-w-screen h-16 shrink-0">
          <Sidebar />
        </header>
        {page === "matches" && <MatchesPage teams={teams} />}
        {page === "rozpis" && <RozpisPage />}
        {page === "zpravy" && <ZpravyPage />}
        {page === "login" && <LoginPage />}
        {page === "admin" && isAdmin && <AdminPage />}
      </div>
    </>
  );
}

export default App;
