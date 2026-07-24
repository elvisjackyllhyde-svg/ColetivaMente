"use client";
import { useEffect, useState } from "react";
import "./auth.css";
import { Field } from "./ui";

type User = { id: number; name: string; email: string; company: string; subscriptionStatus: string; subscriptionExpiresAt: string | null; isAdmin: boolean };

export function remainingAccessDays(user: User) {
  if (user.isAdmin) return null;
  if (user.subscriptionStatus !== "active" || !user.subscriptionExpiresAt) return 0;
  return Math.max(0, Math.ceil((new Date(user.subscriptionExpiresAt).getTime() - Date.now()) / 86_400_000));
}

export function useAuth() {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const load = () => fetch("/api/auth/me", { cache: "no-store" }).then(r => r.json()).then(d => setUser(d.user));
  useEffect(() => { load(); }, []);
  return { user, loading: user === undefined, reload: load };
}

export function AccountStatus() {
  const { user, loading } = useAuth();
  const logout = async () => { await fetch("/api/auth/logout", { method: "POST" }); location.href = "/"; };
  if (loading) return <div className="accountStatus loading">Verificando conta…</div>;
  if (!user) return <div className="accountStatus guest"><span>Você não está logado</span><a href="/?modo=login">Entrar</a></div>;
  const days = remainingAccessDays(user);
  const active = user.isAdmin || (days !== null && days > 0);
  return <div className="accountStatus logged"><a className="accountIdentity" href="/?modo=conta"><i>{user.name.trim().charAt(0).toUpperCase()}</i><span><b>{user.name.split(" ")[0]}</b><small>{user.isAdmin ? "Acesso total" : active ? `${days} ${days === 1 ? "dia disponível" : "dias disponíveis"}` : "Acesso expirado"}</small></span></a><button onClick={logout}>Sair</button></div>;
}

function AuthHeader() {
  return <header className="aHeader"><a className="aBrand" href="/"><span>C</span><strong>ColetivaMente</strong></a></header>;
}

export function LoginPage() {
  const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false); const [error, setError] = useState("");

  const submit = async () => {
    setBusy(true); setError("");
    try {
      const r = await fetch("/api/auth/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, password }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      location.href = "/?modo=conta";
    } catch (e) { setError(e instanceof Error ? e.message : "Não foi possível entrar."); }
    finally { setBusy(false); }
  };

  return <><AuthHeader /><main className="aCenter"><section className="aCard">
    <p className="aEyebrow">ENTRAR</p><h1>Acesse sua conta</h1>
    {error && <div className="aAlert">{error}</div>}
    <div className="aFields">
      <Field label="E-mail"><input type="email" autoFocus value={email} onChange={e => setEmail(e.target.value)} placeholder="voce@empresa.com" /></Field>
      <Field label="Senha"><input type="password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && submit()} /></Field>
    </div>
    <button className="aBtn primary big" disabled={busy || !email || password.length < 1} onClick={submit}>{busy ? "Entrando..." : "Entrar →"}</button>
    <p className="aSwitch">Ainda não tem conta? <a href="/?modo=signup">Criar conta</a></p>
  </section></main></>;
}

export function SignupPage() {
  const [name, setName] = useState(""); const [company, setCompany] = useState(""); const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false); const [error, setError] = useState("");

  const submit = async () => {
    setBusy(true); setError("");
    try {
      const r = await fetch("/api/auth/signup", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name, company, email, password }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      location.href = "/?modo=conta";
    } catch (e) { setError(e instanceof Error ? e.message : "Não foi possível criar a conta."); }
    finally { setBusy(false); }
  };

  const valid = name.trim().length >= 2 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && password.length >= 8;

  return <><AuthHeader /><main className="aCenter"><section className="aCard">
    <p className="aEyebrow">CRIAR CONTA</p><h1>Comece agora</h1>
    {error && <div className="aAlert">{error}</div>}
    <div className="aFields">
      <Field label="Seu nome"><input autoFocus value={name} onChange={e => setName(e.target.value)} placeholder="Ex.: João da Silva" /></Field>
      <Field label="Empresa (opcional)"><input value={company} onChange={e => setCompany(e.target.value)} /></Field>
      <Field label="E-mail"><input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="voce@empresa.com" /></Field>
      <Field label="Senha"><input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Mínimo 8 caracteres" /></Field>
    </div>
    <button className="aBtn primary big" disabled={busy || !valid} onClick={submit}>{busy ? "Criando conta..." : "Criar conta →"}</button>
    <p className="aSwitch">Já tem conta? <a href="/?modo=login">Entrar</a></p>
  </section></main></>;
}

export function AccountPage() {
  const { user, loading, reload } = useAuth();
  const [busy, setBusy] = useState(false);

  const logout = async () => { await fetch("/api/auth/logout", { method: "POST" }); location.href = "/"; };
  const subscribe = async () => {
    setBusy(true);
    try {
      const r = await fetch("/api/billing/checkout", { method: "POST" });
      const d = await r.json();
      if (d.checkoutUrl) location.href = d.checkoutUrl;
      else alert(d.error || "Assinatura ainda não está disponível.");
    } finally { setBusy(false); }
  };

  if (loading) return <main className="aCenter"><div className="aLoader" /></main>;
  if (!user) return <><AuthHeader /><main className="aCenter"><section className="aCard"><p className="aEyebrow">CONTA</p><h1>Você não está logado</h1><p className="aMuted">Entre ou crie uma conta para gerenciar sua assinatura.</p><div className="aSuccessActions"><a className="aBtn primary" href="/?modo=login">Entrar</a><a className="aBtn secondary" href="/?modo=signup">Criar conta</a></div></section></main></>;

  const days = remainingAccessDays(user);
  const active = user.isAdmin || (days !== null && days > 0);
  return <><AuthHeader /><main className="aCenter"><section className="aCard">
    <p className="aEyebrow">MINHA CONTA</p><h1>Olá, {user.name.split(" ")[0]}</h1>
    <div className="aStatusRow"><span>PLANO</span><b className={active ? "aActive" : "aInactive"}>{user.isAdmin ? "Admin — acesso total" : active ? "Assinatura ativa" : "Sem assinatura"}</b></div>
    {!user.isAdmin && <div className="aStatusRow"><span>DISPONIBILIDADE</span><b className={active ? "aActive" : "aInactive"}>{active ? `${days} dias restantes` : "Acesso expirado"}</b></div>}
    <div className="aStatusRow"><span>E-MAIL</span><b>{user.email}</b></div>
    {!active && <>
      <p className="aMuted">Assine por R$120/mês para criar GiroQuiz, pesquisas e sorteios ilimitados para sua equipe.</p>
      <button className="aBtn primary big" disabled={busy} onClick={subscribe}>{busy ? "Abrindo checkout..." : "Assinar por R$120/mês →"}</button>
    </>}
    {active && <a className="aBtn primary big" href="/">Ir para o painel →</a>}
    <button className="aBtn textMuted" onClick={logout}>Sair da conta</button>
  </section></main></>;
}

export function RequireActiveSubscription({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <main className="aCenter"><div className="aLoader" /></main>;
  if (!user) return <><AuthHeader /><main className="aCenter"><section className="aCard"><p className="aEyebrow">ACESSO RESTRITO</p><h1>Entre para continuar</h1><p className="aMuted">Você precisa de uma conta para criar essa dinâmica.</p><div className="aSuccessActions"><a className="aBtn primary" href="/?modo=login">Entrar</a><a className="aBtn secondary" href="/?modo=signup">Criar conta</a></div></section></main></>;
  if (!user.isAdmin && remainingAccessDays(user) === 0) return <><AuthHeader /><main className="aCenter"><section className="aCard"><p className="aEyebrow">ASSINATURA NECESSÁRIA</p><h1>Assine para criar dinâmicas</h1><p className="aMuted">Sua conta está sem dias disponíveis. R$120/mês, cancele quando quiser.</p><a className="aBtn primary big" href="/?modo=conta">Ir para minha conta →</a></section></main></>;
  return <>{children}</>;
}
