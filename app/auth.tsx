"use client";
import { useEffect, useState } from "react";
import "./auth.css";
import { Field } from "./ui";

type User = { id: number; name: string; email: string; company: string; subscriptionStatus: string; subscriptionExpiresAt: string | null; isAdmin: boolean };

export function remainingAccessDays(user: User) {
  if (user.isAdmin) return null;
  if (user.subscriptionStatus === "lifetime") return Number.POSITIVE_INFINITY;
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
  const lifetime = user.subscriptionStatus === "lifetime";
  const active = user.isAdmin || (days !== null && days > 0);
  return <div className="accountStatus logged"><a className="accountIdentity" href="/?modo=conta"><i>{user.name.trim().charAt(0).toUpperCase()}</i><span><b>{user.name.split(" ")[0]}</b><small>{user.isAdmin ? "Acesso total" : lifetime ? "Acesso vitalício" : active ? `${days} ${days === 1 ? "dia disponível" : "dias disponíveis"}` : "Acesso expirado"}</small></span></a><button onClick={logout}>Sair</button></div>;
}

function AuthHeader() {
  return <header className="aHeader"><a className="aBrand" href="/"><span>C</span><strong>ColetivaMente</strong></a></header>;
}

export function LoginPage() {
  const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  const [twoFactor, setTwoFactor] = useState<{ challenge: string; setup: boolean; secret?: string } | null>(null);
  const [code, setCode] = useState("");

  const submit = async () => {
    setBusy(true); setError("");
    try {
      const r = await fetch("/api/auth/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, password }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      if (d.requiresTwoFactor) { setTwoFactor(d); return; }
      location.href = "/?modo=conta";
    } catch (e) { setError(e instanceof Error ? e.message : "Não foi possível entrar."); }
    finally { setBusy(false); }
  };

  const confirmTwoFactor = async () => {
    if (!twoFactor) return;
    setBusy(true); setError("");
    try {
      const r = await fetch("/api/auth/two-factor", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ challenge: twoFactor.challenge, code }) });
      const d = await r.json(); if (!r.ok) throw new Error(d.error);
      location.href = "/?modo=conta";
    } catch (e) { setError(e instanceof Error ? e.message : "Não foi possível confirmar o código."); }
    finally { setBusy(false); }
  };

  const skipTwoFactor = async () => {
    if (!twoFactor?.setup) return;
    setBusy(true); setError("");
    try {
      const r = await fetch("/api/auth/two-factor", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ challenge: twoFactor.challenge, skip: true }) });
      const d = await r.json(); if (!r.ok) throw new Error(d.error);
      location.href = "/?modo=conta";
    } catch (e) { setError(e instanceof Error ? e.message : "Não foi possível continuar."); }
    finally { setBusy(false); }
  };

  if (twoFactor) return <><AuthHeader /><main className="aCenter"><section className="aCard">
    <p className="aEyebrow">SEGURANÇA ADMINISTRATIVA</p><h1>{twoFactor.setup ? "Ative a verificação em duas etapas" : "Digite seu código de segurança"}</h1>
    {twoFactor.setup && <><p className="aMuted">No Google Authenticator, Microsoft Authenticator ou Authy, adicione uma chave de configuração e informe o código abaixo.</p><div className="aSecret"><small>CHAVE DE CONFIGURAÇÃO</small><strong>{twoFactor.secret}</strong></div></>}
    {error && <div className="aAlert">{error}</div>}
    <div className="aFields"><Field label="Código de 6 dígitos"><input autoFocus inputMode="numeric" maxLength={6} value={code} onChange={e => setCode(e.target.value.replace(/\D/g, ""))} onKeyDown={e => e.key === "Enter" && confirmTwoFactor()} placeholder="000000" /></Field></div>
    <button className="aBtn primary big" disabled={busy || code.length !== 6} onClick={confirmTwoFactor}>{busy ? "Confirmando..." : twoFactor.setup ? "Ativar e entrar" : "Confirmar e entrar"}</button>
    {twoFactor.setup && <button className="aBtn textMuted" disabled={busy} onClick={skipTwoFactor}>Pular por enquanto</button>}
  </section></main></>;

  return <><AuthHeader /><main className="aCenter"><section className="aCard">
    <p className="aEyebrow">ENTRAR</p><h1>Acesse sua conta</h1>
    {error && <div className="aAlert">{error}</div>}
    <div className="aFields">
      <Field label="E-mail"><input type="email" autoFocus value={email} onChange={e => setEmail(e.target.value)} placeholder="voce@empresa.com" /></Field>
      <Field label="Senha"><input type="password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && submit()} /></Field>
    </div>
    <button className="aBtn primary big" disabled={busy || !email || password.length < 1} onClick={submit}>{busy ? "Entrando..." : "Entrar →"}</button>
    <p className="aSwitch"><a href="/?modo=esqueci-senha">Esqueci minha senha</a></p>
    <p className="aSwitch">Ainda não tem conta? <a href="/?modo=signup">Criar conta</a></p>
  </section></main></>;
}

export function SignupPage() {
  const [name, setName] = useState(""); const [company, setCompany] = useState(""); const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false); const [error, setError] = useState("");

  const submit = async () => {
    setBusy(true); setError("");
    try {
      const r = await fetch("/api/auth/signup", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name, company, email, password, consent }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      if (d.created) { alert(d.emailSent ? "Conta criada. Abra seu e-mail para confirmar o cadastro." : "Conta criada, mas o envio de e-mail ainda não está configurado. Fale com o administrador."); location.href = "/?modo=login"; return; }
      location.href = "/?modo=conta";
    } catch (e) { setError(e instanceof Error ? e.message : "Não foi possível criar a conta."); }
    finally { setBusy(false); }
  };

  const valid = name.trim().length >= 2 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && password.length >= 8 && consent;

  return <><AuthHeader /><main className="aCenter"><section className="aCard">
    <p className="aEyebrow">CRIAR CONTA</p><h1>Comece agora</h1>
    {error && <div className="aAlert">{error}</div>}
    <div className="aFields">
      <Field label="Seu nome"><input autoFocus value={name} onChange={e => setName(e.target.value)} placeholder="Ex.: João da Silva" /></Field>
      <Field label="Empresa (opcional)"><input value={company} onChange={e => setCompany(e.target.value)} /></Field>
      <Field label="E-mail"><input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="voce@empresa.com" /></Field>
      <Field label="Senha"><input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Mínimo 8 caracteres" /></Field>
    </div>
    <label className="aConsent"><input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} /><span>Li e concordo com a <a href="/?modo=privacidade" target="_blank">Política de Privacidade</a> e com o tratamento dos meus dados para criar e administrar minha conta.</span></label>
    <button className="aBtn primary big" disabled={busy || !valid} onClick={submit}>{busy ? "Criando conta..." : "Criar conta →"}</button>
    <p className="aSwitch">Já tem conta? <a href="/?modo=login">Entrar</a></p>
  </section></main></>;
}

export function ForgotPasswordPage() {
  const [email, setEmail] = useState(""), [busy, setBusy] = useState(false), [done, setDone] = useState(false), [error, setError] = useState("");
  const submit = async () => { setBusy(true); setError(""); try { const r = await fetch("/api/auth/forgot-password", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email }) }); const d = await r.json(); if (!r.ok) throw new Error(d.error); setDone(true); } catch (e) { setError(e instanceof Error ? e.message : "Não foi possível continuar."); } finally { setBusy(false); } };
  return <><AuthHeader /><main className="aCenter"><section className="aCard"><p className="aEyebrow">RECUPERAR SENHA</p><h1>{done ? "Confira seu e-mail" : "Esqueceu sua senha?"}</h1>{done ? <><p className="aMuted">Se o endereço estiver cadastrado, enviamos um link válido por 30 minutos.</p><a className="aBtn secondary" href="/?modo=login">Voltar ao login</a></> : <>{error && <div className="aAlert">{error}</div>}<div className="aFields"><Field label="E-mail da conta"><input type="email" autoFocus value={email} onChange={e => setEmail(e.target.value)} /></Field></div><button className="aBtn primary big" disabled={busy || !email} onClick={submit}>{busy ? "Enviando..." : "Enviar link de recuperação"}</button></>}</section></main></>;
}

export function ResetPasswordPage({ token }: { token: string }) {
  const [password, setPassword] = useState(""), [confirm, setConfirm] = useState(""), [busy, setBusy] = useState(false), [done, setDone] = useState(false), [error, setError] = useState("");
  const submit = async () => { setBusy(true); setError(""); try { const r = await fetch("/api/auth/reset-password", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ token, password }) }); const d = await r.json(); if (!r.ok) throw new Error(d.error); setDone(true); } catch (e) { setError(e instanceof Error ? e.message : "Não foi possível trocar a senha."); } finally { setBusy(false); } };
  return <><AuthHeader /><main className="aCenter"><section className="aCard"><p className="aEyebrow">NOVA SENHA</p><h1>{done ? "Senha alterada" : "Crie uma nova senha"}</h1>{done ? <a className="aBtn primary" href="/?modo=login">Entrar na conta</a> : <>{error && <div className="aAlert">{error}</div>}<div className="aFields"><Field label="Nova senha"><input type="password" autoFocus value={password} onChange={e => setPassword(e.target.value)} /></Field><Field label="Confirmar senha"><input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} /></Field></div><button className="aBtn primary big" disabled={busy || password.length < 8 || password !== confirm} onClick={submit}>Salvar nova senha</button></>}</section></main></>;
}

export function VerifyEmailPage({ token }: { token: string }) {
  const [status, setStatus] = useState("Confirmando seu e-mail...");
  useEffect(() => { fetch("/api/auth/verify-email", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ token }) }).then(async r => { const d = await r.json(); setStatus(r.ok ? "E-mail confirmado. Sua conta está pronta." : d.error); }).catch(() => setStatus("Não foi possível confirmar o e-mail.")); }, [token]);
  return <><AuthHeader /><main className="aCenter"><section className="aCard"><p className="aEyebrow">CONFIRMAÇÃO</p><h1>{status}</h1><a className="aBtn primary" href="/?modo=login">Ir para o login</a></section></main></>;
}

export function AccountPage() {
  const { user, loading, reload } = useAuth();
  const [busy, setBusy] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(location.search), result = params.get("pagamento"), paymentId = params.get("payment_id");
    if (!result) return;
    if (result === "failure") { setPaymentMessage("O pagamento não foi concluído. Você pode tentar novamente."); return; }
    if (result === "pending") { setPaymentMessage("Pagamento em análise. O acesso será liberado automaticamente após a aprovação."); return; }
    if (result === "success" && paymentId) fetch(`/api/billing/status?payment_id=${encodeURIComponent(paymentId)}`, { cache: "no-store" }).then(r => r.json()).then(data => { if (data.status === "approved") { setPaymentMessage("Pagamento aprovado! Seus 30 dias de acesso foram liberados."); reload(); } else setPaymentMessage("Pagamento recebido e em confirmação. Atualize esta página em alguns instantes."); }).catch(() => setPaymentMessage("Pagamento recebido e em confirmação."));
  }, []);

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
  const lifetime = user.subscriptionStatus === "lifetime";
  const active = user.isAdmin || (days !== null && days > 0);
  return <><AuthHeader /><main className="aCenter accountCenter"><div className="accountLayout"><section className="aCard">
    <p className="aEyebrow">MINHA CONTA</p><h1>Olá, {user.name.split(" ")[0]}</h1>
    {paymentMessage && <div className="aPaymentNotice">{paymentMessage}</div>}
    <div className="aStatusRow"><span>PLANO</span><b className={active ? "aActive" : "aInactive"}>{user.isAdmin ? "Admin — acesso total" : lifetime ? "Plano vitalício" : active ? "Assinatura ativa" : "Sem assinatura"}</b></div>
    {!user.isAdmin && <div className="aStatusRow"><span>DISPONIBILIDADE</span><b className={active ? "aActive" : "aInactive"}>{lifetime ? "Acesso vitalício" : active ? `${days} dias restantes` : "Acesso expirado"}</b></div>}
    <div className="aStatusRow"><span>E-MAIL</span><b>{user.email}</b></div>
    {!active && <>
      <p className="aMuted">Adquira 30 dias de acesso por R$ 120 para criar GiroQuiz, pesquisas e sorteios ilimitados para sua equipe.</p>
      <button className="aBtn primary big" disabled={busy} onClick={subscribe}>{busy ? "Abrindo Mercado Pago..." : "Pagar R$ 120 com Mercado Pago →"}</button>
    </>}
    {active && <a className="aBtn primary big" href="/">Ir para o painel →</a>}
    {active && !user.isAdmin && !lifetime && <button className="aBtn secondary big" disabled={busy} onClick={subscribe}>{busy ? "Abrindo Mercado Pago..." : "Adicionar mais 30 dias"}</button>}
    {user.isAdmin && <a className="aBtn secondary big" href="/?modo=admin">Administrar contas</a>}
    <button className="aBtn textMuted" onClick={logout}>Sair da conta</button>
  </section><ActivityLibrary /></div></main></>;
}

type AccountActivity={id:string;type:"quiz"|"vote"|"raffle";title:string;subtitle:string;status:string;createdAt:string;participants:number;interactions:number;url:string;questionPreview?:string[];questionCount?:number};

function ActivityLibrary(){
  const [activities,setActivities]=useState<AccountActivity[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState(""),[filter,setFilter]=useState<"all"|AccountActivity["type"]>("all");
  useEffect(()=>{fetch("/api/account/activities",{cache:"no-store"}).then(async response=>{const data=await response.json();if(!response.ok)throw new Error(data.error);setActivities(data.activities||[])}).catch(reason=>setError(reason instanceof Error?reason.message:"Não foi possível carregar suas atividades.")).finally(()=>setLoading(false))},[]);
  const visible=filter==="all"?activities:activities.filter(activity=>activity.type===filter),labels={quiz:"GiroQuiz",vote:"Votação",raffle:"Sorteio"},icons={quiz:"?",vote:"✓",raffle:"★"};
  const statusLabel=(activity:AccountActivity)=>activity.type==="quiz"?({lobby:"Aguardando",question:"Em andamento",reveal:"Em andamento",finished:"Finalizado",cancelled:"Encerrado"}[activity.status]||activity.status):activity.status==="feedback"?"2ª rodada":activity.status==="closed"?"Encerrado":"Aberto";
  return <section className="activityLibrary"><header><div><p className="aEyebrow">SEU HISTÓRICO</p><h2>Minhas atividades</h2><p>Consulte e reabra os jogos, votações e sorteios criados por esta conta.</p></div><strong>{activities.length} registros</strong></header><nav aria-label="Filtrar atividades">{(["all","quiz","vote","raffle"] as const).map(type=><button className={filter===type?"active":""} onClick={()=>setFilter(type)} key={type}>{type==="all"?"Todos":labels[type]}</button>)}</nav>{loading?<div className="activityEmpty">Carregando suas atividades...</div>:error?<div className="aAlert">{error}</div>:visible.length===0?<div className="activityEmpty"><strong>Nenhuma atividade encontrada.</strong><span>Quando você criar uma dinâmica, ela aparecerá aqui automaticamente.</span></div>:<div className="activityList">{visible.map(activity=>{const date=new Date(activity.createdAt);return <article className={`activityItem ${activity.type}`} key={`${activity.type}-${activity.id}`}><span className="activityIcon">{icons[activity.type]}</span><div className="activityInfo"><div><small>{labels[activity.type]}</small><b className={`activityStatus ${activity.status}`}>{statusLabel(activity)}</b></div><h3>{activity.title}</h3><p>{activity.subtitle}</p>{activity.type==="quiz"&&activity.questionPreview?.length?<div className="activityQuestions"><strong>Algumas perguntas</strong><ol>{activity.questionPreview.map((question,index)=><li key={`${activity.id}-question-${index}`}>{question}</li>)}</ol>{(activity.questionCount||0)>activity.questionPreview.length&&<small>+ {(activity.questionCount||0)-activity.questionPreview.length} perguntas neste GiroQuiz</small>}</div>:null}<footer><span>{date.toLocaleDateString("pt-BR")} às {date.toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"})}</span><span>{activity.participants} participantes</span><span>{activity.interactions} {activity.type==="raffle"?"rodadas":activity.type==="quiz"?"respostas":"votos"}</span></footer></div><a href={activity.url}>Abrir painel →</a></article>})}</div>}</section>;
}

export function RequireActiveSubscription({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <main className="aCenter"><div className="aLoader" /></main>;
  if (!user) return <><AuthHeader /><main className="aCenter"><section className="aCard"><p className="aEyebrow">ACESSO RESTRITO</p><h1>Entre para continuar</h1><p className="aMuted">Você precisa de uma conta para criar essa dinâmica.</p><div className="aSuccessActions"><a className="aBtn primary" href="/?modo=login">Entrar</a><a className="aBtn secondary" href="/?modo=signup">Criar conta</a></div></section></main></>;
  if (!user.isAdmin && remainingAccessDays(user) === 0) return <><AuthHeader /><main className="aCenter"><section className="aCard"><p className="aEyebrow">ASSINATURA NECESSÁRIA</p><h1>Assine para criar dinâmicas</h1><p className="aMuted">Sua conta está sem dias disponíveis. R$120/mês, cancele quando quiser.</p><a className="aBtn primary big" href="/?modo=conta">Ir para minha conta →</a></section></main></>;
  return <>{children}</>;
}
