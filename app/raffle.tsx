"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import "./raffle.css";
import { Field, LinkBox } from "./ui";

type RaffleInfo = { title: string; prizeTitle: string; prizeDescription: string; winnersCount: number; closed: boolean; isAdmin: boolean };
type Entry = { name: string; email: string; manual?: boolean; createdAt: string };
type Winner = { name: string };
type HistoryWinner = { drawId: string; name: string; position: number; drawnAt: string };
type AccountHistoryWinner = HistoryWinner & { raffleTitle: string; raffleSlug: string; adminToken: string };

function RaffleHeader({ title = "Sorteio" }: { title?: string }) {
  return <header className="rHeader"><a className="rBrand" href="/"><span className="rBrandMark" aria-hidden="true"><svg viewBox="0 0 48 48"><path d="M16 10h16v7c0 7-3.6 11.5-8 11.5S16 24 16 17v-7Z"/><path d="M16 14h-5v3c0 4 2.4 7 6.2 7.7M32 14h5v3c0 4-2.4 7-6.2 7.7M24 29v6M17 39h14M20 35h8"/><path className="rSpark" d="m37.5 7 .8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2ZM10 27l.7 1.8 1.8.7-1.8.7L10 32l-.7-1.8-1.8-.7 1.8-.7L10 27Z"/></svg></span><div><strong>{title}</strong><small>SORTEIO CORPORATIVO</small></div></a></header>;
}
function RaffleFooter() {
  return <footer className="rFooter">ColetivaMente · Dinâmicas que aproximam equipes</footer>;
}

export function RaffleBuilder() {
  const [title, setTitle] = useState("Sorteio da equipe");
  const [prizeTitle, setPrizeTitle] = useState("Vale-presente");
  const [prizeDescription, setPrizeDescription] = useState("Um agradecimento especial para quem participou do treinamento.");
  const [winnersCount, setWinnersCount] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState<{ slug: string; adminToken: string } | null>(null);

  const create = async () => {
    setBusy(true); setError("");
    try {
      const r = await fetch("/api/raffles", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ title, prizeTitle, prizeDescription, winnersCount }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setCreated(d);
    } catch (e) { setError(e instanceof Error ? e.message : "Não foi possível criar o sorteio."); }
    finally { setBusy(false); }
  };

  const base = typeof location !== "undefined" ? location.origin + location.pathname : "";
  if (created) {
    const entry = `${base}?r=${created.slug}`, admin = `${base}?r=${created.slug}&admin=${created.adminToken}`;
    return <main className="rCenter"><section className="rSuccess"><div className="rSuccessIcon">🎉</div><p className="rEyebrow">SORTEIO CRIADO</p><h1>Seu link está pronto</h1><p>Envie o link de inscrição para os participantes. Guarde o link do painel para realizar o sorteio quando quiser.</p><LinkBox label="Link de inscrição" value={entry} /><LinkBox label="Seu painel do sorteio" value={admin} /><div className="rSuccessActions"><a className="rBtn primary" href={admin}>Abrir meu painel</a><a className="rBtn secondary" href={entry}>Ver como participante</a></div></section></main>;
  }

  return <><RaffleHeader /><main className="rContainer"><div className="rHero"><p className="rEyebrow">CRIE • CONVIDE • SORTEIE</p><h1>Um sorteio para fechar<br />seu treinamento com energia.</h1><p>Monte o sorteio, compartilhe o link com a equipe e revele os ganhadores ao vivo.</p></div>
    {error && <div className="rAlert">{error}</div>}
    <section className="rPanel">
      <div className="rFormGrid">
        <Field label="Nome do sorteio"><input value={title} onChange={e => setTitle(e.target.value)} /></Field>
        <Field label="Prêmio"><input value={prizeTitle} onChange={e => setPrizeTitle(e.target.value)} /></Field>
        <Field label="Descrição do prêmio"><textarea value={prizeDescription} onChange={e => setPrizeDescription(e.target.value)} /></Field>
        <Field label="Quantidade de ganhadores"><input type="number" min={1} max={50} value={winnersCount} onChange={e => setWinnersCount(Math.min(Math.max(Number(e.target.value) || 1, 1), 50))} /></Field>
      </div>
    </section>
    <section className="rLaunch"><button className="rBtn primary big" disabled={busy} onClick={create}>{busy ? "Criando sorteio..." : "Criar link do sorteio →"}</button></section>
  </main><RaffleFooter /></>;
}

export function RaffleView({ slug, admin }: { slug: string; admin: string }) {
  const [info, setInfo] = useState<RaffleInfo | null>(null);
  const [entryCount, setEntryCount] = useState(0);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [winners, setWinners] = useState<Winner[]>([]);
  const [history, setHistory] = useState<HistoryWinner[]>([]);
  const [accountHistory, setAccountHistory] = useState<AccountHistoryWinner[]>([]);
  const [error, setError] = useState("");
  const [entered, setEntered] = useState(false);
  const [name, setName] = useState(""); const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false); const [drawing, setDrawing] = useState(false);
  const [manualName, setManualName] = useState(""); const [addingManual, setAddingManual] = useState(false);
  const [suspense, setSuspense] = useState(false); const [spinName, setSpinName] = useState("");
  const suspenseRef = useRef(false);

  const load = useCallback(async () => {
    const r = await fetch(`/api/raffles/${encodeURIComponent(slug)}${admin ? `?admin=${encodeURIComponent(admin)}` : ""}`, { cache: "no-store" });
    const d = await r.json();
    if (r.ok) { setInfo(d.raffle); setEntryCount(d.entryCount); setEntries(d.entries || []); setHistory(d.history || []); setAccountHistory(d.accountHistory || []); if (!suspenseRef.current) setWinners(d.winners || []); }
    else setError(d.error);
  }, [slug, admin]);
  useEffect(() => { load(); const t = setInterval(load, 5000); return () => clearInterval(t); }, [load]);
  useEffect(() => { setEntered(localStorage.getItem(`raffle-entered-${slug}`) === "1"); }, [slug]);

  const enter = async () => {
    setBusy(true); setError("");
    try {
      const r = await fetch(`/api/raffles/${slug}/enter`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name, email }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      localStorage.setItem(`raffle-entered-${slug}`, "1"); setEntered(true); load();
    } catch (e) { setError(e instanceof Error ? e.message : "Não foi possível confirmar sua inscrição."); }
    finally { setBusy(false); }
  };

  const draw = async () => {
    setDrawing(true); setError("");
    const r = await fetch(`/api/raffles/${slug}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ adminToken: admin, action: "draw" }) });
    const d = await r.json();
    if (!r.ok) { setDrawing(false); return setError(d.error); }
    const pool = entries.length ? entries.map(e => e.name) : ["🎉"];
    suspenseRef.current = true; setSuspense(true);
    const spin = setInterval(() => setSpinName(pool[Math.floor(Math.random() * pool.length)]), 90);
    setTimeout(async () => {
      clearInterval(spin);
      suspenseRef.current = false; setSuspense(false); setDrawing(false);
      await load();
    }, 5000);
  };
  const reset = async () => {
    await fetch(`/api/raffles/${slug}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ adminToken: admin, action: "reset" }) });
    load();
  };
  const addManual = async () => {
    setAddingManual(true); setError("");
    try {
      const r = await fetch(`/api/raffles/${slug}/manual`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: manualName, adminToken: admin }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setManualName(""); await load();
    } catch (e) { setError(e instanceof Error ? e.message : "Não foi possível adicionar o participante."); }
    finally { setAddingManual(false); }
  };

  if (error && !info) return <main className="rCenter"><section className="rSuccess"><h1>Não foi possível abrir</h1><p>{error}</p></section></main>;
  if (!info) return <main className="rCenter"><div className="rLoader" /></main>;

  if (info.isAdmin) {
    const visibleHistory: AccountHistoryWinner[] = accountHistory.length ? accountHistory : history.map(item => ({ ...item, raffleTitle: info.title, raffleSlug: slug, adminToken: admin }));
    const historyRounds = Array.from(visibleHistory.reduce((groups, item) => { const key = `${item.raffleSlug}:${item.drawId}`; const group = groups.get(key) || []; group.push(item); groups.set(key, group); return groups; }, new Map<string, AccountHistoryWinner[]>()).values()).reverse();
    return <><RaffleHeader title={info.title} /><main className="rContainer rAdmin">
      <div className="rHero"><p className="rEyebrow">PAINEL DO SORTEIO</p><h1>{info.title}</h1><p>{info.prizeTitle} · {info.winnersCount} ganhador{info.winnersCount > 1 ? "es" : ""}</p></div>
      <section className="rKpis"><article><span>INSCRITOS</span><strong>{entryCount}</strong></article><article><span>GANHADORES</span><strong>{winners.length || info.winnersCount}</strong></article></section>
      {error && <div className="rAlert">{error}</div>}
      {suspense
        ? <section className="rSuspense"><p className="rEyebrow">SORTEANDO...</p><div className="rSpinName">{spinName}</div></section>
        : winners.length === 0
        ? <section className="rLaunch"><button className="rBtn primary big" disabled={drawing || entryCount === 0} onClick={draw}>{drawing ? "Sorteando..." : "🎲 Sortear vencedores"}</button>{entryCount === 0 && <small className="rHint">Aguardando participantes se inscreverem pelo link.</small>}</section>
        : <section className="rWinners">{winners.map((w, i) => <div className="rWinnerCard" key={w.name + i} style={{ animationDelay: `${i * 0.12}s` }}><span>{i + 1}</span><strong>{w.name}</strong></div>)}<button className="rBtn secondary" onClick={reset}>↻ Sortear novamente</button></section>}
      <section className="rPanel rManualPanel"><div><p className="rEyebrow">CADASTRO MANUAL</p><h2>Adicionar participante sem e-mail</h2><p>Inclua pessoas que não conseguem se inscrever pelo celular.</p></div><div className="rManualForm"><input value={manualName} onChange={e => setManualName(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && manualName.trim().length >= 2) addManual(); }} placeholder="Nome do participante" maxLength={80} /><button className="rBtn primary" disabled={addingManual || manualName.trim().length < 2 || info.closed} onClick={addManual}>{addingManual ? "Adicionando..." : "+ Adicionar"}</button></div>{info.closed && <small className="rHint">Reabra o sorteio para adicionar novos participantes.</small>}</section>
      <section className="rPanel rEntryList"><h2>Participantes ({entries.length})</h2><div className="rEntryTable">{entries.map((e, i) => <div className="rEntryRow" key={`${e.email}-${e.name}-${i}`}><span>{e.name}</span><small>{e.manual ? "Adicionado manualmente" : e.email}</small></div>)}</div></section>
      <section className="rPanel rHistory"><div className="rHistoryHead"><div><p className="rEyebrow">REGISTRO DA SUA CONTA</p><h2>Histórico de ganhadores</h2></div><strong>{historyRounds.length} rodada{historyRounds.length !== 1 ? "s" : ""}</strong></div>{historyRounds.length === 0 ? <p className="rHistoryEmpty">O histórico aparecerá aqui depois do primeiro sorteio.</p> : <div className="rHistoryRounds">{historyRounds.map((round, roundIndex) => { const raw = round[0].drawnAt; const date = new Date(raw.includes("T") ? raw : `${raw.replace(" ", "T")}Z`); return <article className="rHistoryRound" key={`${round[0].raffleSlug}-${round[0].drawId}`}><header><span>{round[0].raffleTitle}</span><time>{date.toLocaleDateString("pt-BR")} às {date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</time></header><div>{[...round].sort((a,b) => a.position - b.position).map(w => <p key={`${w.drawId}-${w.position}`}><i>{w.position + 1}</i><strong>{w.name}</strong></p>)}</div><a className="rHistoryLink" href={`?r=${encodeURIComponent(round[0].raffleSlug)}&admin=${encodeURIComponent(round[0].adminToken)}`}>Abrir painel deste sorteio →</a></article>; })}</div>}</section>
    </main><RaffleFooter /></>;
  }

  if (info.closed) {
    return <><RaffleHeader title={info.title} /><main className="rContainer"><div className="rHero"><p className="rEyebrow">SORTEIO ENCERRADO</p><h1>{info.prizeTitle}</h1><p>Confira quem foram os ganhadores.</p></div>
      <section className="rWinners">{winners.map((w, i) => <div className="rWinnerCard" key={w.name + i} style={{ animationDelay: `${i * 0.12}s` }}><span>{i + 1}</span><strong>{w.name}</strong></div>)}</section>
    </main><RaffleFooter /></>;
  }

  if (entered) {
    return <><RaffleHeader title={info.title} /><main className="rCenter"><section className="rSuccess"><div className="rSuccessIcon">✓</div><p className="rEyebrow">INSCRIÇÃO CONFIRMADA</p><h1>Você está concorrendo!</h1><p>{entryCount} pessoa{entryCount !== 1 ? "s" : ""} inscrita{entryCount !== 1 ? "s" : ""} até agora. O resultado aparece aqui assim que o sorteio for realizado.</p></section></main><RaffleFooter /></>;
  }

  return <><RaffleHeader title={info.title} /><main className="rCenter"><section className="rSuccess"><p className="rEyebrow">{info.prizeTitle}</p><h1>Participe do sorteio</h1><p>{info.prizeDescription}</p>{error && <div className="rAlert">{error}</div>}<div className="rEntryFields"><Field label="Seu nome completo"><input autoFocus value={name} onChange={e => setName(e.target.value)} placeholder="Ex.: João da Silva" /></Field><Field label="Seu melhor e-mail"><input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="voce@empresa.com" /></Field></div><button className="rBtn primary big" disabled={busy || name.trim().length < 3 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)} onClick={enter}>{busy ? "Confirmando..." : "Quero concorrer →"}</button></section></main><RaffleFooter /></>;
}
