"use client";

import { useState } from "react";
import { LockKeyhole } from "lucide-react";

export function AdminLogin() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  return <form className="login-card" onSubmit={async (event) => {
    event.preventDefault(); setLoading(true); setError("");
    const password = new FormData(event.currentTarget).get("password");
    const response = await fetch("/api/admin/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ password }) });
    setLoading(false);
    if (response.ok) window.location.reload(); else setError("That password was not accepted.");
  }}><LockKeyhole size={28} /><h2>Admin sign in</h2><p>Enter the administrator password to manage schedules.</p><label><span>Password</span><input type="password" name="password" required autoComplete="current-password" /></label>{error && <div className="login-error">{error}</div>}<button type="submit" disabled={loading}>{loading ? "Signing in…" : "Sign in"}</button></form>;
}
