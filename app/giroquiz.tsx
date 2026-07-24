"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./giroquiz.css";
import { categoryCatalog, makeStudyQuiz, nicheInfo, type Difficulty, type StudyNiche, type StudyQuestion } from "../lib/study-banks";
import { categoryNames, makeCategoryQuiz, type CategoryTopic } from "../lib/category-banks";
import { useAuth } from "./auth";
import QRCode from "qrcode";
import { defaultMusicTrack, musicTrackFile, musicTracks, type MusicScope } from "../lib/music-tracks";

type Player = { id: number; name: string; score: number; answered?: boolean };
type CustomQuestion=StudyQuestion;
type Question = { index: number; total: number; text: string; options: string[]; timeLimit: number };
type GameState = {
  code: string; title?: string; subject?: string; status: "lobby" | "question" | "reveal" | "finished" | "cancelled";
  question: Question | null; players: Player[]; answered?: boolean;
  correctOption?: number; explanation?: string; remainingMs?: number; phase?: "intro" | "answering";
  playerOption?: number; playerCorrect?: boolean; musicTrack?: string; musicScope?: MusicScope;
};

const letters = ["A", "B", "C", "D"];
let audioContext: AudioContext | null = null;
function unlockAudio() { if (typeof window === "undefined") return; audioContext ??= new AudioContext(); void audioContext.resume(); }
function tone(frequency:number, duration=.12, type:OscillatorType="sine", volume=.05, delay=0) { if (!audioContext) return; const t=audioContext.currentTime+delay; const oscillator=audioContext.createOscillator(); const gain=audioContext.createGain(); oscillator.type=type; oscillator.frequency.setValueAtTime(frequency,t); gain.gain.setValueAtTime(volume,t); gain.gain.exponentialRampToValueAtTime(.001,t+duration); oscillator.connect(gain).connect(audioContext.destination); oscillator.start(t); oscillator.stop(t+duration); }
function playTick(urgent=false, muted=false) { if(muted)return; tone(urgent?820:250,urgent ? .1 : .16,urgent?"square":"sine",urgent ? .055 : .035); if(!urgent) tone(120,.18,"sine",.04,.06); }
function playPhaseStart() { tone(420,.16,"triangle",.05); tone(630,.18,"triangle",.05,.12); tone(880,.2,"triangle",.05,.24); }

async function readQuizPdf(file:File){
  const pdfjs=await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc=new URL("pdfjs-dist/build/pdf.worker.min.mjs",import.meta.url).toString();
  const pdf=await pdfjs.getDocument({data:await file.arrayBuffer()}).promise; let text="";
  for(let p=1;p<=pdf.numPages;p++){const content=await (await pdf.getPage(p)).getTextContent(); text+=content.items.map(item=>("str" in item?item.str:"")+("hasEOL" in item&&item.hasEOL?"\n":" ")).join("")+"\n";}
  const markers=[...text.matchAll(/(?:^|\n)\s*(?:PERGUNTA|PREGUNTA)\s*\d+\s*[:.\-)]+/gim)];
  return markers.map((m,i)=>text.slice((m.index??0)+m[0].length,markers[i+1]?.index??text.length)).map(block=>{
    const optionMatches=[...block.matchAll(/(?:^|\n)\s*([ABCD])\s*[).:\-]\s*(.+?)(?=\n\s*[ABCD]\s*[).:\-]|\n\s*(?:CORRETA|CORRECTA|RESPUESTA)\s*:|$)/gis)];
    const first=optionMatches[0]?.index??-1, answer=block.match(/(?:CORRETA|CORRECTA|RESPUESTA)\s*:\s*([ABCD])/i), explanation=block.match(/(?:EXPLICAÇÃO|EXPLICACION|EXPLICACIÓN)\s*:\s*([\s\S]+)$/i);
    return {text:block.slice(0,first).replace(/\s+/g," ").trim(),options:optionMatches.slice(0,4).map(x=>x[2].replace(/\s+/g," ").trim()),correct:answer?letters.indexOf(answer[1].toUpperCase()):-1,explanation:explanation?.[1].replace(/\s+/g," ").trim()||"Respuesta definida por el material importado."};
  }).filter(q=>q.text&&q.options.length===4&&q.correct>=0);
}

export function GiroQuizApp() {
  const { user } = useAuth();
  const [screen, setScreen] = useState<"home" | "join" | "setup" | "host" | "player">("home");
  const [quizTitle,setQuizTitle]=useState("GiroQuiz");
  const [quizSubject,setQuizSubject]=useState("Desafio de conhecimento");
  const [customQuestions,setCustomQuestions]=useState<CustomQuestion[] | null>(null);
  const [studyNiche,setStudyNiche]=useState<StudyNiche|"">("");
  const [studyCount,setStudyCount]=useState(10);
  const [difficulty,setDifficulty]=useState<Difficulty>("medio");
  const [categoryTopic,setCategoryTopic]=useState<CategoryTopic|"">("");
  const [pdfName,setPdfName]=useState("");
  const [pdfLoading,setPdfLoading]=useState(false);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [hostKey, setHostKey] = useState("");
  const [playerKey, setPlayerKey] = useState("");
  const [playerId, setPlayerId] = useState<number | null>(null);
  const [state, setState] = useState<GameState | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<number | null>(null);
  const [immediateResult, setImmediateResult] = useState<boolean | null>(null);
  const [feedbackVisible, setFeedbackVisible] = useState(false);
  const [musicTrack, setMusicTrackLocal] = useState(defaultMusicTrack);
  const [musicScope, setMusicScopeLocal] = useState<MusicScope>("all");
  const [now, setNow] = useState(Date.now());
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [linkCopied, setLinkCopied] = useState(false);
  const lastSecond = useRef<number | null>(null);
  const lastPhase = useRef<string | null>(null);
  const lastQuestion = useRef<number | null>(null);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bgMusic = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const sala = new URLSearchParams(location.search).get("sala");
    if (sala && /^\d{6}$/.test(sala)) { setCode(sala); setScreen("join"); }
  }, []);

  const joinUrl = code ? `${location.origin}${location.pathname}?modo=quiz&sala=${code}` : "";

  useEffect(() => {
    if (screen !== "host" || !code) { setQrDataUrl(""); return; }
    QRCode.toDataURL(joinUrl, { margin: 1, width: 240, color: { dark: "#062A5E", light: "#FFFFFF" } }).then(setQrDataUrl).catch(() => setQrDataUrl(""));
  }, [screen, code, joinUrl]);

  const copyJoinLink = () => { navigator.clipboard.writeText(joinUrl); setLinkCopied(true); setTimeout(() => setLinkCopied(false), 2200); };

  const fetchState = useCallback(async () => {
    if (!code || (screen !== "host" && screen !== "player")) return;
    const params = screen === "host" ? `hostKey=${encodeURIComponent(hostKey)}` : `playerId=${playerId}&playerKey=${encodeURIComponent(playerKey)}`;
    try {
      const res = await fetch(`/api/rooms/${code}?${params}`, { cache: "no-store" });
      if (!res.ok) return;
      const next = await res.json() as GameState;
      setState(next);
      if (next.status !== "question" || !next.answered) setSelected(next.answered ? selected : null);
    } catch { /* polling retries automatically */ }
  }, [code, hostKey, playerId, playerKey, screen, selected]);

  useEffect(() => {
    if (screen !== "host" && screen !== "player") return;
    fetchState();
    const poll = setInterval(fetchState, 1000);
    const clock = setInterval(() => setNow(Date.now()), 250);
    return () => { clearInterval(poll); clearInterval(clock); };
  }, [fetchState, screen]);

  const remaining = Math.max(0, Math.ceil((state?.remainingMs ?? 0) / 1000));
  useEffect(() => {
    if (state?.status !== "question") { lastSecond.current=null; return; }
    if (lastPhase.current !== state.phase) { if(state.phase==="answering") playPhaseStart(); lastPhase.current=state.phase ?? null; lastSecond.current=null; }
    if (remaining !== lastSecond.current && remaining > 0) { playTick(state.phase==="answering" && remaining<=5, state.musicScope==="off"); lastSecond.current=remaining; }
  }, [remaining, state?.phase, state?.status, state?.musicScope]);
  const privateFeedback = feedbackVisible && immediateResult !== null ? immediateResult : undefined;
  const awaitingAnswer = privateFeedback === undefined && (immediateResult !== null || !!state?.answered);
  useEffect(() => { const index=state?.question?.index ?? null; if(index!==null&&index!==lastQuestion.current){setImmediateResult(null);setFeedbackVisible(false);setSelected(null);lastQuestion.current=index;} },[state?.question?.index]);
  useEffect(() => () => { if(feedbackTimer.current)clearTimeout(feedbackTimer.current); bgMusic.current?.pause(); },[]);

  useEffect(() => {
    const scope = state?.musicScope; const track = state?.musicTrack;
    const shouldPlay = (screen==="host"||screen==="player") && !!track && (screen==="host" ? scope!=="off" : scope==="all");
    if (!shouldPlay) { bgMusic.current?.pause(); return; }
    const src = musicTrackFile(track!);
    if (!bgMusic.current) { bgMusic.current = new Audio(); bgMusic.current.loop = true; bgMusic.current.volume = .32; }
    if (!bgMusic.current.src.endsWith(src)) bgMusic.current.src = src;
    void bgMusic.current.play().catch(() => {});
  }, [screen, state?.musicTrack, state?.musicScope]);

  const startCreating = () => {
    if (!user) { location.href = "/?modo=login"; return; }
    if (!user.isAdmin && user.subscriptionStatus !== "active") { location.href = "/?modo=conta"; return; }
    setScreen("setup");
  };

  const createRoom = async () => {
    unlockAudio();
    if (!customQuestions?.length) { setError("Escolha um quiz disponível ou envie um PDF antes de criar a sala."); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/rooms", { method: "POST",headers:{"content-type":"application/json"},body:JSON.stringify({title:quizTitle,subject:quizSubject,questions:customQuestions??undefined,musicTrack,musicScope}) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No fue posible crear la sala.");
      setCode(data.code); setHostKey(data.hostKey); setScreen("host");
    } catch (e) { setError(e instanceof Error ? e.message : "Error inesperado."); }
    finally { setLoading(false); }
  };

  const importPdf=async(file?:File)=>{if(!file)return;setPdfLoading(true);setError("");try{const imported=await readQuizPdf(file);if(!imported.length)throw new Error("No encontramos preguntas en el formato esperado.");setCustomQuestions(imported);setPdfName(file.name);}catch(e){setCustomQuestions(null);setPdfName("");setError(e instanceof Error?e.message:"No fue posible leer el PDF.");}finally{setPdfLoading(false);}};
  const useStudyNiche=(niche:StudyNiche)=>{setCategoryTopic("");setStudyNiche(niche);setCustomQuestions(makeStudyQuiz(niche,studyCount,difficulty));setQuizTitle(`GiroQuiz ${nicheInfo[niche].name}`);setQuizSubject(`${nicheInfo[niche].description} · nível ${difficulty}`);setPdfName("");setError("");};
  const useCategoryTopic=(topic:CategoryTopic)=>{setStudyNiche("");setCategoryTopic(topic);setCustomQuestions(makeCategoryQuiz(topic,studyCount,difficulty));setQuizTitle(`GiroQuiz ${categoryNames[topic]}`);setQuizSubject(`${categoryNames[topic]} · nível ${difficulty}`);setPdfName("");setError("");};

  const joinRoom = async () => {
    unlockAudio();
    if (code.length !== 6 || name.trim().length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError("Informe o código da sala, seu nome e um e-mail válido."); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch(`/api/rooms/${code}/join`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name, email }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No fue posible entrar.");
      setPlayerId(data.playerId); setPlayerKey(data.playerKey); setScreen("player");
    } catch (e) { setError(e instanceof Error ? e.message : "Error inesperado."); }
    finally { setLoading(false); }
  };

  const hostAction = async (action: "start" | "reveal" | "next" | "restart" | "cancel" | "music", extra?: { musicTrack?: string; musicScope?: MusicScope }) => {
    setLoading(true);
    await fetch(`/api/rooms/${code}/host`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ hostKey, action, ...extra }) });
    await fetchState(); setLoading(false);
  };
  const setLiveTrack = (id: string) => hostAction("music", { musicTrack: id });
  const setLiveScope = (scope: MusicScope) => hostAction("music", { musicScope: scope });
  const restartGame=async()=>{if(!confirm("Reiniciar a partida? As pontuações serão zeradas e todos voltarão para a sala de espera."))return;await hostAction("restart");};
  const leaveGame=async()=>{if(!confirm("Encerrar esta partida e voltar à página inicial?"))return;await hostAction("cancel");setState(null);setCode("");setHostKey("");setScreen("home");};

  const answer = async (option: number) => {
    if (selected !== null || state?.answered) return;
    setSelected(option);
    const res = await fetch(`/api/rooms/${code}/answer`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ playerId, playerKey, option }) });
    const data = await res.json() as { correct?: boolean };
    if (!res.ok) { setSelected(null); setError("La respuesta no fue registrada. Inténtalo otra vez."); }
    else { setImmediateResult(!!data.correct); setFeedbackVisible(true); if(feedbackTimer.current)clearTimeout(feedbackTimer.current); feedbackTimer.current=setTimeout(()=>setFeedbackVisible(false),1800); }
    await fetchState();
  };

  const topThree = useMemo(() => state?.players.slice(0, 3) ?? [], [state]);


  if(screen==="setup")return <div className="gq"><SetupScreen title={quizTitle} subject={quizSubject} questions={customQuestions} niche={studyNiche} categoryTopic={categoryTopic} count={studyCount} difficulty={difficulty} pdfName={pdfName} pdfLoading={pdfLoading} loading={loading} error={error} musicTrack={musicTrack} musicScope={musicScope} onTitle={setQuizTitle} onSubject={setQuizSubject} onCount={n=>{setStudyCount(n);if(studyNiche)setCustomQuestions(makeStudyQuiz(studyNiche,n,difficulty));else if(categoryTopic)setCustomQuestions(makeCategoryQuiz(categoryTopic,n,difficulty));}} onDifficulty={d=>{setDifficulty(d);if(studyNiche){setCustomQuestions(makeStudyQuiz(studyNiche,studyCount,d));setQuizSubject(`${nicheInfo[studyNiche].description} · nível ${d}`);}else if(categoryTopic){setCustomQuestions(makeCategoryQuiz(categoryTopic,studyCount,d));setQuizSubject(`${categoryNames[categoryTopic]} · nível ${d}`);}}} onNiche={useStudyNiche} onCategory={useCategoryTopic} onPdf={importPdf} onOriginal={()=>{setStudyNiche("");setCategoryTopic("");setCustomQuestions(null);setPdfName("");setQuizTitle("GiroQuiz");setQuizSubject("Desafio de conhecimento");}} onMusicTrack={setMusicTrackLocal} onMusicScope={setMusicScopeLocal} onBack={()=>setScreen("home")} onCreate={createRoom}/></div>;

  if (screen === "home" || screen === "join") return (
    <div className="gq"><main className="landing">
      <div className="grain" />
      <a className="gqBrand" href="/"><span className="brandMark">?</span><span className="giroWord">Giro<strong>Quiz</strong></span><span className="livePill">AO VIVO</span></a>
      <section className="hero">
        <div className="eyebrow">Perguntas que giram a diversão</div>
        <h1>Seu conhecimento<br/><em>entra em movimento.</em></h1>
        <p>Crie desafios ao vivo, responda rápido e gire o ranking a seu favor. Quanto mais veloz o acerto, maior a pontuação.</p>
        {screen === "home" ? (
          <div className="homeActions">
            <button className="primary" onClick={startCreating}>Criar sala ao vivo</button>
            <button className="secondary" onClick={() => setScreen("join")}>Entrar em uma sala</button>
          </div>
        ) : (
          <div className="joinCard">
            <button className="back" onClick={() => { setScreen("home"); setError(""); }}>← Voltar</button>
            <label>Código da sala</label>
            <input className="codeInput" inputMode="numeric" maxLength={6} value={code} onChange={e => setCode(e.target.value.replace(/\D/g, ""))} placeholder="000000" autoFocus />
            <label>Seu nome</label>
            <input maxLength={24} value={name} onChange={e => setName(e.target.value)} placeholder="Como você quer aparecer?" onKeyDown={e => e.key === "Enter" && joinRoom()} />
            <label>Seu melhor e-mail</label>
            <input type="email" maxLength={120} autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="voce@empresa.com" onKeyDown={e => e.key === "Enter" && joinRoom()} />
            <button className="primary" onClick={joinRoom} disabled={loading}>{loading ? "Entrando…" : "Jogar agora"}</button>
          </div>
        )}
        {error && <div className="error" role="alert">{error}</div>}
      </section>
      <div className="scorePreview"><span>+1000</span><small>resposta rápida</small></div>
      <footer>GiroQuiz · Perguntas ao vivo, tensão e diversão em cada rodada</footer>
    </main></div>
  );

  if (!state) return <div className="gq"><main className="loadingScreen"><div className="spinner"/><p>Conectando à sala {code}…</p></main></div>;

  if (screen === "host") return (
    <div className="gq"><main className="game hostView">
      <header className="gameHeader"><div className="gqBrand compact"><span className="brandMark">Y</span><span>{state.title}</span></div><div className="roomCode">Sala <b>{code}</b></div><div className="headerTools"><MusicScopeToggle scope={state.musicScope||"all"} onScope={setLiveScope}/><div className="playerCount">● {state.players.length} jogadores</div></div></header>
      {state.status!=="lobby"&&<HostGameMenu onRestart={restartGame} onExit={leaveGame}/>}
      {state.status === "lobby" && <section className="lobby"><div><div className="eyebrow">{state.subject}</div><h1>{state.title}</h1><p>Acesse este site e digite o código, ou escaneie o QR / use o link</p><div className="giantCode">{code}</div><ShareBox joinUrl={joinUrl} qrDataUrl={qrDataUrl} copied={linkCopied} onCopy={copyJoinLink}/><MusicPanel track={state.musicTrack||defaultMusicTrack} scope={state.musicScope||"all"} onTrack={setLiveTrack} onScope={setLiveScope}/><button className="primary" onClick={() => hostAction("start")} disabled={!state.players.length || loading}>Iniciar quiz</button></div><PlayerGrid players={state.players}/></section>}
      {(state.status === "question" || state.status === "reveal") && state.question && <section key={state.question.index} className={`questionStage ${state.phase==="intro"?"introPhase":"answerPhase"}`}>
        <div className="questionMeta"><span>{state.status==="question"&&state.phase==="intro"?"Tempo para leitura":`Pergunta ${state.question.index + 1} de ${state.question.total}`}</span><div className={`timer ${state.phase==="answering"&&remaining <= 5 ? "danger" : ""}`}>{state.status === "question" ? remaining : "✓"}</div><span>{state.phase==="intro"?"Respostas em breve":`${state.players.filter(p => p.answered).length}/${state.players.length} responderam`}</span></div>
        <h1>{state.question.text}</h1>
        {state.status==="question"&&state.phase==="intro" ? <div className="readingOnly"><div className="eyePulse">{remaining}</div><b>Leia com atenção</b><span>As alternativas aparecerão em instantes</span></div> : <div className="answers hostAnswers revealedAnswers">{state.question.options.map((opt, i) => <div key={opt} className={`answer answer${i} ${state.status === "reveal" ? (i === state.correctOption ? "correct" : "dim") : ""}`}><b>{letters[i]}</b><span>{opt}</span></div>)}</div>}
        {state.status === "question" && state.phase==="answering" ? <button className="stageButton" onClick={() => hostAction("reveal")}>Encerrar respostas</button> : state.status==="reveal" ? <div className="revealBar"><p><b>Explicação:</b> {state.explanation}</p><button className="primary" onClick={() => hostAction("next")}>{state.question.index + 1 === state.question.total ? "Ver pódio" : "Próxima pergunta"}</button></div> : null}
      </section>}
      {state.status === "finished" && <Podium players={topThree} onRestart={() => location.reload()} />}
    </main></div>
  );

  return (
    <div className="gq"><main className="game playerView">
      <header className="gameHeader"><div className="gqBrand compact"><span className="brandMark">Y</span><span>{state.title}</span></div><div className="roomCode">Sala <b>{code}</b></div></header>
      {state.status==="cancelled"&&<section className="gameEnded"><div className="endedIcon">■</div><h1>Partida encerrada</h1><p>O apresentador finalizou esta rodada.</p><button className="primary" onClick={()=>location.href="/"}>Voltar ao início</button></section>}
      {state.status === "lobby" && <section className="waiting"><div className="avatar">{name.slice(0,1).toUpperCase()}</div><h1>Você está dentro, {name}!</h1><p>Aguarde o apresentador iniciar.</p><div className="pulseDots"><i/><i/><i/></div></section>}
      {state.status === "question" && state.question && <section key={state.question.index} className={`playerQuestion ${state.phase==="intro"?"introPhase":"answerPhase"}`}>
        <div className="mobileMeta"><span>{state.phase==="intro"?"LEIA":`${state.question.index + 1}/${state.question.total}`}</span><div className={`timer ${state.phase==="answering"&&remaining <= 5 ? "danger" : ""}`}>{remaining}</div><span>{state.players.find(p => p.id === playerId)?.score ?? 0} pts</span></div>
        <h1>{state.question.text}</h1>
        {state.phase==="intro" ? <div className="readingOnly"><div className="eyePulse">{remaining}</div><b>10 segundos para pensar</b><span>As alternativas serão liberadas em instantes</span></div> : privateFeedback !== undefined ? <div className={`privateFeedback ${privateFeedback?"right":"wrong"}`}><div>{privateFeedback?"✓":"×"}</div><b>{privateFeedback?"Você acertou!":"Você errou"}</b></div> : awaitingAnswer ? <div className="answerWaiting"><div className="pulseDots"><i/><i/><i/></div><b>Aguarde</b><span>Sua resposta já foi registrada.</span></div> : <div className="answers revealedAnswers">{state.question.options.map((opt, i) => <button key={opt} disabled={selected !== null || state.answered} onClick={() => answer(i)} className={`answer answer${i} ${selected === i ? "selected" : ""}`}><b>{letters[i]}</b><span>{opt}</span></button>)}</div>}
      </section>}
      {state.status === "reveal" && state.question && <section className="resultCard"><div className="revealWaitIcon">•••</div><h1>Aguarde</h1><p>{state.explanation}</p><div className="myScore">{state.players.find(p => p.id === playerId)?.score ?? 0}<small> pontos</small></div><MiniRanking players={state.players} playerId={playerId}/></section>}
      {state.status === "finished" && <Podium players={topThree} playerId={playerId} onRestart={() => location.reload()} />}
      {error && <div className="error floating" role="alert">{error}</div>}
    </main></div>
  );
}

function SetupScreen({title,subject,questions,niche,categoryTopic,count,difficulty,pdfName,pdfLoading,loading,error,musicTrack,musicScope,onTitle,onSubject,onCount,onDifficulty,onNiche,onCategory,onPdf,onOriginal,onMusicTrack,onMusicScope,onBack,onCreate}:{title:string;subject:string;questions:CustomQuestion[]|null;niche:StudyNiche|"";categoryTopic:CategoryTopic|"";count:number;difficulty:Difficulty;pdfName:string;pdfLoading:boolean;loading:boolean;error:string;musicTrack:string;musicScope:MusicScope;onTitle:(v:string)=>void;onSubject:(v:string)=>void;onCount:(v:number)=>void;onDifficulty:(v:Difficulty)=>void;onNiche:(v:StudyNiche)=>void;onCategory:(v:CategoryTopic)=>void;onPdf:(f?:File)=>void;onOriginal:()=>void;onMusicTrack:(id:string)=>void;onMusicScope:(s:MusicScope)=>void;onBack:()=>void;onCreate:()=>void}){
 const [category,setCategory]=useState("agro");
 const current=categoryCatalog.find(item=>item.id===category)!;
 return <main className="creatorPage"><a className="gqBrand" href="/"><span className="brandMark">?</span><span className="giroWord">Giro<strong>Quiz</strong></span></a><section className="creatorCard catalogCreator"><button className="back" onClick={onBack}>← Voltar</button><div className="eyebrow">Biblioteca GiroQuiz</div><h1>Escolha o tema da rodada</h1>
 <div className="quizControls"><label>Quantidade<select value={count} onChange={e=>onCount(Number(e.target.value))}><option value={5}>5 perguntas</option><option value={10}>10 perguntas</option></select></label><fieldset><legend>Dificuldade</legend>{(["facil","medio","avancado"] as Difficulty[]).map(level=><button type="button" key={level} className={difficulty===level?"active":""} onClick={()=>onDifficulty(level)}>{level==="facil"?"Fácil":level==="medio"?"Médio":"Avançado"}</button>)}</fieldset></div>
 <section className="catalogSection"><div className="catalogHeading"><div><b>Catálogo de categorias</b><span>Cada categoria possui um banco com 40 perguntas.</span></div><small>Categoria → Subcategoria → Dificuldade</small></div><div className="categoryGrid">{categoryCatalog.map(item=><button type="button" key={item.id} className={`${category===item.id?"active":""} ready`} onClick={()=>{setCategory(item.id);if(item.id==="agro")onOriginal();else onCategory(item.id as CategoryTopic);}}><i>{item.icon}</i><b>{item.name}</b><span>40 perguntas disponíveis</span></button>)}</div>
 <div className="subcategoryPanel"><div><span>Categoria selecionada</span><h2>{current.icon} {current.name}</h2></div>{category==="agro"?<div className="nicheGrid">{(Object.keys(nicheInfo) as StudyNiche[]).map(key=>{const info=nicheInfo[key];return <button type="button" key={key} className={niche===key?"active":""} onClick={()=>onNiche(key)}><i>{info.icon}</i><b>{info.name}</b><span>{info.description}</span></button>})}</div>:<><div className="mixedReady">✓ Quiz misto selecionado: 40 perguntas distribuídas entre os assuntos abaixo</div><div className="subChips">{current.subs.map(sub=><span key={sub}>{sub}</span>)}</div></>}</div></section>
 <div className="creationModes compactModes"><section className="pdfMode"><div><b>Usar meu próprio conteúdo</b><span>Envie um PDF organizado com perguntas e quatro respostas.</span></div><label className="uploadPdf">{pdfLoading?"Lendo PDF…":"Selecionar PDF"}<input type="file" accept="application/pdf" disabled={pdfLoading} onChange={e=>onPdf(e.target.files?.[0])}/></label>{pdfName&&<small>✓ {pdfName}</small>}</section></div>
 <div className="creatorFields"><label>Nome do quiz<input maxLength={80} value={title} onChange={e=>onTitle(e.target.value)}/></label><label>Assunto<input maxLength={100} value={subject} onChange={e=>onSubject(e.target.value)}/></label></div>
 <MusicPanel track={musicTrack} scope={musicScope} onTrack={onMusicTrack} onScope={onMusicScope}/>
 {questions&&<div className="selectedQuiz"><div><b>{niche?`${nicheInfo[niche].icon} ${nicheInfo[niche].name} · ${difficulty}`:categoryTopic?`${categoryNames[categoryTopic]} · ${difficulty}`:"📄 Conteúdo importado"}</b><span>{questions.length} perguntas escolhidas de um banco com 40</span></div><button onClick={onOriginal}>Limpar seleção</button></div>}{questions&&<div className="questionPreview"><b>Prévia das perguntas</b>{questions.slice(0,3).map((q,i)=><div key={i}><span>{i+1}</span><p>{q.text}</p><small>Resposta: {letters[q.correct]}) {q.options[q.correct]}</small></div>)}{questions.length>3&&<em>+ {questions.length-3} perguntas</em>}</div>}{!questions&&<div className="starterNotice">Escolha uma categoria ou envie seu próprio PDF.</div>}{error&&<div className="error" role="alert">{error}</div>}<button className="primary createNow" onClick={onCreate} disabled={loading||!title.trim()||!subject.trim()||!questions?.length}>{loading?"Criando…":questions?.length?`Criar sala com ${questions.length} perguntas`:"Selecione um quiz para continuar"}</button></section></main>;
}
function HostGameMenu({onRestart,onExit}:{onRestart:()=>void;onExit:()=>void}) {
  return <aside className="hostGameMenu" aria-label="Controles da partida">
    <span>Controles da partida</span>
    <button onClick={onRestart}>↻ Reiniciar jogo</button>
    <button className="exitGame" onClick={onExit}>■ Encerrar e sair</button>
  </aside>;
}
function ShareBox({ joinUrl, qrDataUrl, copied, onCopy }: { joinUrl: string; qrDataUrl: string; copied: boolean; onCopy: () => void }) {
  return <div className="shareBox">
    <div className="shareLink">
      <label>Link de acesso rápido</label>
      <div><input readOnly value={joinUrl} onFocus={e => e.target.select()} /><button onClick={onCopy}>{copied ? "Copiado!" : "Copiar"}</button></div>
    </div>
    {qrDataUrl && <div className="qrBox"><img src={qrDataUrl} alt="QR code para entrar na sala" width={110} height={110} /><small>Aponte a câmera</small></div>}
  </div>;
}
function PlayerGrid({ players }: { players: Player[] }) { return <div className="playerGrid"><h2>Jogadores na sala</h2><div>{players.map((p, i) => <span key={p.id}><i style={{background: ["#F0C808","#6CCB9A","#F47B54","#71A8E3"][i%4]}}/>{p.name}</span>)}</div></div>; }
function MusicPanel({track,scope,onTrack,onScope}:{track:string;scope:MusicScope;onTrack:(id:string)=>void;onScope:(s:MusicScope)=>void}){
  return <div className="soundPanel">
    <div><b>Trilha sonora</b><span>Escolha a música e para quem ela toca</span></div>
    <div className="trackGrid">{musicTracks.map(t=><button type="button" key={t.id} className={track===t.id?"active":""} onClick={()=>onTrack(t.id)}>{t.label}</button>)}</div>
    <div className="soundChoices">
      <button type="button" className={scope==="all"?"active":""} onClick={()=>onScope("all")}>🔊 Todos os jogadores</button>
      <button type="button" className={scope==="host"?"active":""} onClick={()=>onScope("host")}>🎧 Só o apresentador</button>
      <button type="button" className={scope==="off"?"active":""} onClick={()=>onScope("off")}>🔇 Sem música</button>
    </div>
  </div>;
}
function MusicScopeToggle({scope,onScope}:{scope:MusicScope;onScope:(s:MusicScope)=>void}){
  const next:Record<MusicScope,MusicScope>={all:"host",host:"off",off:"all"};
  const label={all:"🔊 Todos",host:"🎧 Só eu",off:"🔇 Mudo"}[scope];
  return <button type="button" className="musicToggle" onClick={()=>onScope(next[scope])} title="Alternar quem ouve a música">{label}</button>;
}
function MiniRanking({ players, playerId }: { players: Player[]; playerId: number | null }) { return <div className="miniRanking">{players.slice(0,5).map((p,i) => <div key={p.id} className={p.id===playerId ? "me" : ""}><b>{i+1}</b><span>{p.name}</span><strong>{p.score}</strong></div>)}</div>; }
function Podium({ players, playerId, onRestart }: { players: Player[]; playerId?: number | null; onRestart: () => void }) { const order=[players[1],players[0],players[2]]; return <section className="podium"><div className="eyebrow">Resultado final</div><h1>O pódio do conhecimento</h1><div className="podiumBlocks">{order.map((p,i) => p && <div key={p.id} className={`place place${i} ${p.id===playerId ? "me" : ""}`}><div className="medal">{i===1?"🏆":i===0?"🥈":"🥉"}</div><b>{p.name}</b><strong>{p.score}</strong><div className="block">{i===1?1:i===0?2:3}</div></div>)}</div><button className="secondary light" onClick={onRestart}>Voltar ao início</button></section>; }
