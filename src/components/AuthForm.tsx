import { useState } from "react";
import { Loader2, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { actions } from "@/lib/inventory";

export function AuthForm({ onSuccess }: { onSuccess?: () => void }) {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <form onSubmit={async (e) => {
      e.preventDefault();
      if (busy) return;
      setBusy(true); setErr(""); setInfo("");
      try {
        if (mode === "in") {
          await actions.signIn(email, pass);
          onSuccess?.();
        } else {
          const needsConfirm = await actions.signUp(email, pass);
          if (needsConfirm) setInfo("Account created. Check your email to confirm your account, then sign in.");
          else onSuccess?.();
        }
      } catch (x) { setErr((x as Error).message); }
      finally { setBusy(false); }
    }}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="font-display text-xl">{mode === "in" ? "Customer sign in" : "Create customer account"}</h2>
        <Button variant="link" type="button" onClick={() => { setMode(mode === "in" ? "up" : "in"); setErr(""); setInfo(""); }} className="h-11 shrink-0 px-0">
          {mode === "in" ? "Create account" : "Sign in instead"}
        </Button>
      </div>
      <div className="grid min-w-0 gap-3">
        <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" autoComplete="email" aria-label="Email" required placeholder="Email address" className="min-w-0 w-full rounded-lg border border-input bg-card p-3" />
        <input value={pass} onChange={(e) => setPass(e.target.value)} type="password" autoComplete={mode === "in" ? "current-password" : "new-password"} aria-label="Password" required minLength={6} placeholder="Password" className="min-w-0 w-full rounded-lg border border-input bg-card p-3" />
        <Button disabled={busy} className="h-12 px-6">{busy && <Loader2 className="h-4 w-4 animate-spin" />}{mode === "in" ? "Sign In" : "Create account"}<ArrowUpRight className="h-4 w-4" /></Button>
      </div>
      {err && <p className="mt-3 text-sm text-destructive">{err}</p>}
      {info && <p className="mt-3 text-sm text-primary">{info}</p>}
    </form>
  );
}
