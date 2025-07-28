import { useEffect, useState } from "react";
import supabase from "./supabaseClient";

export default function MatchesPage({ teams }) {
  const [allMatches, setAllMatches] = useState([]);
  useEffect(() => {
    fetchAllMatches();
    const subscription = supabase
      .channel("public:matches")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "matches" },
        () => {
          fetchAllMatches();
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  async function fetchAllMatches() {
    const { data } = await supabase
      .from("matches")
      .select()
      .order("created_at", { ascending: false });
    setAllMatches(Array.isArray(data) ? data : []);
  }

  // For each court, find the latest match (by created_at desc)
  const latestMatches = [1, 2, 3].map((courtNum) => {
    const matchesOnCourt = allMatches
      .filter((m) => m.court === courtNum)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return matchesOnCourt[0] || null;
  });

  return (
    <div className="flex flex-col p-2 h-full font-sans text-white">
      {latestMatches.map((match, idx) => (
        <div
          key={idx + 1}
          className="flex bg-zinc-900 m-1 rounded-2xl h-1/3 overflow-hidden"
        >
          <div className="flex flex-row w-full">
            <div className="flex items-center w-2/5 h-full grow">
              <div className="flex flex-col items-center grow">
                <div className="flex items-center text-xl text-center">
                  <p>{match ? teams[match.team1_id] : ""}</p>
                </div>
                <p className="text-7xl text-center">
                  {match ? match.team1_score : "-"}
                </p>
              </div>
            </div>
            <div className="flex items-center h-full grow">
              <div className="w-full text-zinc-700 text-xl text-center align-middle">
                <p>{` Kurt ${idx + 1} `}</p>
                {match && match.is_finished && (
                  <p className="py-2 w-full text-zinc-500 text-xl text-center">
                    (Konec)
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center w-2/5 h-full grow">
              <div className="flex flex-col items-center grow">
                <div className="flex items-center text-xl text-center">
                  <p>{match ? teams[match.team2_id] : ""}</p>
                </div>
                <p className="text-7xl text-center">
                  {match ? match.team2_score : "-"}
                </p>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
