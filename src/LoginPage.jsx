import { useState, useEffect } from "react";
import supabase from "./supabaseClient";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setLoggedIn(!!data.user);
    });
    // Listen for auth changes
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setLoggedIn(!!session?.user);
      }
    );
    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setSuccess("Přihlášení proběhlo úspěšně.");
      setLoggedIn(true);
    }
  };

  const handleLogout = async () => {
    setError(null);
    setSuccess(null);
    const { error } = await supabase.auth.signOut();
    if (error) setError(error.message);
    else setSuccess("Odhlášení proběhlo úspěšně.");
    setLoggedIn(false);
  };

  return (
    <div className="flex flex-col items-center mt-8 p-2 text-white grow">
      {!loggedIn ? (
        <form
          onSubmit={handleLogin}
          className="flex flex-col items-center w-11/12"
        >
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="flex bg-zinc-950 mt-1 pl-3 border-1 border-zinc-600 rounded-lg w-full h-16"
          />
          <input
            type="password"
            placeholder="Heslo"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="flex bg-zinc-950 mt-1 pl-3 border-1 border-zinc-600 rounded-lg w-full h-16"
          />
          <button
            className="bg-zinc-900 mt-1 rounded-lg w-full h-20"
            type="submit"
            disabled={loading}
          >
            {loading ? "Přihlašuji..." : "Přihlásit"}
          </button>
        </form>
      ) : (
        <button
          className="bg-zinc-900 mt-1 rounded-lg w-full h-20"
          onClick={handleLogout}
        >
          Odhlásit
        </button>
      )}
      {error && <div className="mt-5">{error}</div>}
      {success && <div className="mt-5">{success}</div>}
    </div>
  );
}
