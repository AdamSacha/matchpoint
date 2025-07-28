import { useEffect, useState } from "react";
import supabase from "./supabaseClient";

export default function ZpravyPage() {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let subscription;
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setIsAdmin(!!data.user);
    });
    fetchMessages();
    // Subscribe to realtime changes
    subscription = supabase
      .channel("public:messages")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setMessages((prev) => {
              // Remove optimistic message if it matches the new real message
              const filtered = prev.filter(
                (msg) =>
                  // Remove optimistic message with same body and temp id
                  !(
                    String(msg.id).startsWith("temp-") &&
                    msg.message_body === payload.new.message_body
                  )
              );
              return [payload.new, ...filtered];
            });
          } else if (payload.eventType === "DELETE") {
            setMessages((prev) =>
              prev.filter((msg) => msg.id !== payload.old.id)
            );
          } else if (payload.eventType === "UPDATE") {
            setMessages((prev) =>
              prev.map((msg) => (msg.id === payload.new.id ? payload.new : msg))
            );
          }
        }
      )
      .subscribe();
    return () => {
      if (subscription) supabase.removeChannel(subscription);
    };
  }, []);

  async function fetchMessages() {
    setLoading(true);
    const { data, error } = await supabase
      .from("messages")
      .select("id, message_body, created_at")
      .order("created_at", { ascending: false });
    if (error) setError(error.message);
    else setMessages(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  async function handleBroadcast(e) {
    e.preventDefault();
    setError(null);
    if (!newMessage.trim()) return;
    // Optimistically add message to UI
    const tempId = `temp-${Date.now()}`;
    const optimisticMsg = {
      id: tempId,
      message_body: newMessage,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [optimisticMsg, ...prev]);
    setNewMessage("");
    const { error } = await supabase.from("messages").insert([
      {
        message_body: optimisticMsg.message_body,
      },
    ]);
    if (error) setError(error.message);
    if (error) setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
  }

  return (
    <div>
      {isAdmin && (
        <div className="flex flex-col items-center text-white grow">
          <form
            className="flex flex-col items-center w-full grow"
            onSubmit={handleBroadcast}
          >
            <textarea
              className="flex bg-zinc-950 mt-1 pl-3 border-1 border-zinc-600 rounded-lg w-11/12 h-16 align-middle"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Text zprávy"
            />
            <button
              type="submit"
              className="bg-zinc-900 mt-1 mb-10 rounded-lg w-11/12 h-12"
            >
              Odeslat
            </button>
          </form>
        </div>
      )}
      {loading ? (
        <div>Loading...</div>
      ) : (
        <ul className="flex flex-col items-center w-full">
          {(Array.isArray(messages) ? messages : []).map((msg) => (
            <li
              className="bg-zinc-900 m-2 mb-0 p-2 rounded-lg w-23/24 text-white"
              key={msg.id}
            >
              {msg.message_body} <br />
              <i className="text-zinc-700">
                ({new Date(msg.created_at).toLocaleString()})
              </i>
            </li>
          ))}
        </ul>
      )}
      {error && <div style={{ color: "red" }}>{error}</div>}
    </div>
  );
}
