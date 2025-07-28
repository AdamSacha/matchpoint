import { useEffect, useState } from "react";
import supabase from "./supabaseClient";

export default function AdminPage() {
  const [matches, setMatches] = useState([]);
  const [teams, setTeams] = useState([]);
  const [newMatch, setNewMatch] = useState({
    team1_id: "",
    team2_id: "",
    team1_score: 0,
    team2_score: 0,
    court: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchMatches();
    fetchTeams();
    const subscription = supabase
      .channel("public:matches")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "matches" },
        () => {
          fetchMatches();
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  async function fetchMatches() {
    const { data, error } = await supabase
      .from("matches")
      .select()
      .eq("is_finished", false)
      .order("court", { ascending: true });
    if (error) setError(error.message);
    else setMatches(Array.isArray(data) ? data : []);
  }

  async function fetchTeams() {
    const { data, error } = await supabase.from("teams").select();
    if (error) setError(error.message);
    else setTeams(Array.isArray(data) ? data : []);
  }

  async function updateMatch(id, updates) {
    setLoading(true);
    const { error } = await supabase
      .from("matches")
      .update(updates)
      .eq("id", id);
    if (error) setError(error.message);
    setLoading(false);
  }

  async function finishMatch(id) {
    await updateMatch(id, { is_finished: true });
  }

  async function createMatch(e) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.from("matches").insert([
      {
        team1_id: newMatch.team1_id,
        team2_id: newMatch.team2_id,
        team1_score: newMatch.team1_score,
        team2_score: newMatch.team2_score,
        court: Number(newMatch.court),
        is_finished: false,
      },
    ]);
    if (error) setError(error.message);
    setNewMatch({
      team1_id: "",
      team2_id: "",
      team1_score: 0,
      team2_score: 0,
      court: "",
    });
    setLoading(false);
  }

  return (
    <div className="flex flex-col items-center p-2 w-full text-white">
      {error && <div className="text-red-700">{error}</div>}
      <div className="m-1 w-full">
        <p className="text-left">Vytvořit nový zápas</p>
      </div>
      <div className="flex flex-col bg-zinc-900 mb-8 p-4 rounded-2xl w-full">
        <form onSubmit={createMatch} className="flex flex-col w-full">
          <div className="flex flex-row w-full">
            <div className="flex bg-zinc-950 m-2 p-2 rounded-lg w-1/2">
              <select
                className="w-full"
                value={newMatch.team1_id}
                onChange={(e) =>
                  setNewMatch({ ...newMatch, team1_id: e.target.value })
                }
              >
                <option value="">Tým 1</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex bg-zinc-950 m-2 p-2 rounded-lg w-1/2">
              <select
                className="w-full"
                value={newMatch.team2_id}
                onChange={(e) =>
                  setNewMatch({ ...newMatch, team2_id: e.target.value })
                }
              >
                <option value="">Tým 2</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex bg-zinc-950 m-2 p-2 rounded-lg grow">
            <select
              className="w-full"
              value={newMatch.court}
              onChange={(e) =>
                setNewMatch({ ...newMatch, court: Number(e.target.value) })
              }
            >
              <option value="">Kurt</option>
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
            </select>
          </div>
          <div className="flex flex-col items-center">
            <button type="submit" className="bg-zinc-950 mt-2 p-3 rounded-lg">
              Vytvořit zápas
            </button>
          </div>
        </form>
      </div>
      <div className="w-full">
        <h2>Upravit zápasy</h2>
        <div className="flex flex-col w-full">
          {[1, 2, 3].map((courtNum) => (
            <div
              key={courtNum}
              className="flex flex-col bg-zinc-900 mt-2 p-2 rounded-2xl h-1/3 overflow-hidden"
            >
              {matches
                .filter((m) => m.court === courtNum)
                .map((match) => (
                  <div key={match.id} className="flex flex-col w-full">
                    <div className="flex flex-row items-center w-full">
                      <div className="flex flex-col items-center w-2/5 h-full">
                        <div className="flex items-center text-xl text-center">
                          <select
                            value={match.team1_id}
                            onChange={(e) =>
                              updateMatch(match.id, {
                                team1_id: e.target.value,
                              })
                            }
                            className="text-white"
                          >
                            {teams.map((team) => (
                              <option key={team.id} value={team.id}>
                                {team.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="flex flex-row items-center mt-2">
                          <button
                            className="bg-zinc-950 mr-2 px-4 py-2 rounded text-white text-2xl"
                            onClick={() =>
                              updateMatch(match.id, {
                                team1_score: match.team1_score - 1,
                              })
                            }
                            disabled={match.team1_score <= 0}
                          >
                            -
                          </button>
                          <span className="w-12 text-5xl text-center">
                            {match.team1_score}
                          </span>
                          <button
                            className="bg-zinc-950 ml-2 px-4 py-2 rounded text-white text-2xl"
                            onClick={() =>
                              updateMatch(match.id, {
                                team1_score: match.team1_score + 1,
                              })
                            }
                          >
                            +
                          </button>
                        </div>
                      </div>
                      <div className="flex items-ceter w-1/5">
                        <p className="m-3 w-full text-xl text-center">
                          {` Kurt ${courtNum} `}
                        </p>
                      </div>
                      <div className="flex flex-col items-center w-2/5 h-full">
                        <div className="flex items-center text-xl">
                          <select
                            value={match.team2_id}
                            onChange={(e) =>
                              updateMatch(match.id, {
                                team2_id: e.target.value,
                              })
                            }
                            className="text-white"
                          >
                            {teams.map((team) => (
                              <option key={team.id} value={team.id}>
                                {team.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="flex flex-row items-center mt-2">
                          <button
                            className="bg-zinc-950 mr-2 px-4 py-2 rounded text-white text-2xl"
                            onClick={() =>
                              updateMatch(match.id, {
                                team2_score: match.team2_score - 1,
                              })
                            }
                            disabled={match.team2_score <= 0}
                          >
                            -
                          </button>
                          <span className="w-12 text-5xl text-center">
                            {match.team2_score}
                          </span>
                          <button
                            className="bg-zinc-950 ml-2 px-4 py-2 rounded text-white text-2xl"
                            onClick={() =>
                              updateMatch(match.id, {
                                team2_score: match.team2_score + 1,
                              })
                            }
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-row items-center">
                      <div className="w-2/5"></div>
                      <button
                        onClick={() => finishMatch(match.id)}
                        className="bg-red-700 mt-3 rounded-md w-1/5 text-white"
                      >
                        Konec
                      </button>

                      <div className="w-2/5"></div>
                    </div>
                  </div>
                ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
