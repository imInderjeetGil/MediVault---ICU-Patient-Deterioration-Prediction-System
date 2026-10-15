import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser, getCurrentUser } from "../api/api";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const loginData = await loginUser(email, password);

      localStorage.setItem(
        "access_token",
        loginData.data.access_token
      );

      const userData = await getCurrentUser();

      setUser(userData.data);

      localStorage.setItem(
        "current_user",
        JSON.stringify(userData.data)
      );

      navigate("/dashboard");
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-6 py-10">
      <div className="w-full max-w-md">

        {/* Brand */}
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 shadow-lg shadow-blue-600/20">
            <span className="text-2xl font-bold">M</span>
          </div>

          <h1 className="text-3xl font-bold tracking-tight">
            MediVault
          </h1>

          <p className="mt-2 text-sm text-slate-400">
            ICU Early Detection & Monitoring System
          </p>
        </div>

        {/* Login Card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-7 shadow-2xl shadow-black/30 backdrop-blur">

          {!user ? (
            <>
              {/* Heading */}
              <div className="mb-7">
                <h2 className="text-xl font-semibold">
                  Clinical Portal
                </h2>

                <p className="mt-1.5 text-sm text-slate-400">
                  Sign in to access your ICU monitoring workspace.
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-5">

                {/* Email */}
                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-sm font-medium text-slate-300"
                  >
                    Email address
                  </label>

                  <input
                    id="email"
                    type="email"
                    placeholder="doctor@medivault.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                {/* Password */}
                <div>
                  <label
                    htmlFor="password"
                    className="mb-2 block text-sm font-medium text-slate-300"
                  >
                    Password
                  </label>

                  <input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                {/* Error */}
                {error && (
                  <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                    {error}
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-lg bg-blue-600 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "Authenticating..." : "Sign in"}
                </button>
              </form>

              {/* Footer */}
              <div className="mt-6 border-t border-slate-800 pt-5 text-center">
                <p className="text-xs text-slate-500">
                  Authorized clinical personnel only
                </p>
              </div>
            </>
          ) : (
            /* Logged In State */
            <div className="py-5 text-center">

              <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10">
                <span className="text-xl text-emerald-400">
                  ✓
                </span>
              </div>

              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Authentication successful
              </div>

              <h2 className="text-2xl font-semibold">
                Welcome, {user.first_name}
              </h2>

              <p className="mt-2 text-sm text-slate-400">
                {user.email}
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Your clinical workspace is ready.
              </p>

            </div>
          )}

        </div>

        {/* Bottom text */}
        <p className="mt-6 text-center text-xs text-slate-600">
          MediVault · ICU Clinical Intelligence
        </p>

      </div>
    </main>
  );
}

export default Login;