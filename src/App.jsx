import { useCallback, useEffect, useRef, useState } from 'react';

async function api(path, body, signal) {
  const response = await fetch(`/api/${path}`, {
    method: body === undefined ? 'GET' : 'POST', credentials: 'same-origin', signal,
    headers: body === undefined ? {} : { 'Content-Type': 'application/json', 'X-Quiz-Client': 'php-pratique' },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error || 'Le service ne répond pas. Réessayez dans un instant.');
    error.status = response.status;
    throw error;
  }
  return { ...data, receivedAt: performance.now() };
}

function Arrow() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6 6"/></svg>; }
function StatusIcon({ correct = true }) { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d={correct ? 'm5 12 4 4L19 6' : 'm6 6 12 12M6 18 18 6'}/></svg>; }
function Clock() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 1.5M9 2h6M12 2v3"/></svg>; }

function Timer({ snapshot, onExpire }) {
  const [tick, setTick] = useState(() => performance.now());
  const fired = useRef(false);
  const remaining = Math.max(0, Math.ceil((snapshot.deadline - snapshot.serverTime - (tick - snapshot.receivedAt)) / 1000));
  useEffect(() => {
    if (snapshot.feedback) return;
    const interval = setInterval(() => setTick(performance.now()), 200);
    return () => clearInterval(interval);
  }, [snapshot.feedback]);
  useEffect(() => {
    if (remaining === 0 && !snapshot.feedback && !fired.current) { fired.current = true; onExpire(); }
  }, [remaining, snapshot.feedback, onExpire]);
  const urgent = remaining <= 10 && !snapshot.feedback;
  return <div className={`timer ${urgent ? 'timer-urgent' : ''} ${snapshot.feedback ? 'timer-paused' : ''}`}>
    <Clock/><div><span className="timer-label">{snapshot.feedback ? 'Question terminée' : urgent ? 'Dernières secondes' : 'Temps restant'}</span>
      <span className="timer-value" role="timer" aria-label={`${remaining} secondes restantes`}>{snapshot.feedback ? '-' : `${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, '0')}`}</span></div>
    <span className="sr-only" role="status">{urgent ? 'Attention, il reste moins de dix secondes.' : ''}</span>
  </div>;
}

function Home({ levels, count, selected, setSelected, onStart, busy }) {
  const current = levels.find((level) => level.id === selected);
  return <>
    <div className="breadcrumb">Votre espace d'entraînement <span>/</span> PHP</div>
    <section className="intro">
      <div className="eyebrow">APPRENDRE EN PRATIQUANT</div>
      <h1>Un peu de PHP.<br/>Et beaucoup de pratique.</h1>
      <p>Faites le point sur vos connaissances, une question à la fois.<br className="desktop-break"/> Choisissez votre niveau, on s'occupe de la suite.</p>
      <div className="intro-meta"><span><Clock/> À votre rythme, avec un temps par question</span><span><span className="check-icon"><StatusIcon/></span> Corrections expliquées</span></div>
    </section>
    <section className="level-section" aria-labelledby="level-heading">
      <div className="section-heading"><h2 id="level-heading">Par où voulez-vous commencer ?</h2><span>{count} questions par session</span></div>
      <div className="levels" role="radiogroup" aria-label="Niveau de difficulté">
        {levels.map((level) => <label className={`level ${selected === level.id ? 'level-selected' : ''}`} key={level.id}>
          <div className="level-top"><span className="level-name">{level.name}</span><input type="radio" name="level" value={level.id} checked={selected === level.id} onChange={() => setSelected(level.id)}/></div>
          <p className="level-subtitle">{level.subtitle}</p><p className="level-description">{level.description}</p>
          <div className="topics">{level.topics.join(' / ')}</div><div className="level-time"><Clock/>{level.seconds} secondes par question</div>
        </label>)}
      </div>
      <div className="start-row"><p>Une seule bonne réponse. Aucun point retiré en cas d'erreur.</p><button className="primary" onClick={onStart} disabled={busy || !current}>{busy ? 'Préparation...' : 'Commencer le quiz'}<Arrow/></button></div>
    </section>
    <aside className="how-it-works"><span className="note-symbol" aria-hidden="true">i</span><div><h3>Le but, c'est de comprendre.</h3><p>Après chaque réponse, découvrez la correction et son explication. À la fin, retrouvez votre score et les notions à revoir. Vous pourrez retenter votre chance.</p></div></aside>
  </>;
}

function Quiz({ snapshot, selected, setSelected, submit, next, busy, quit }) {
  const { question, feedback, index, total } = snapshot;
  const titleRef = useRef(null);
  useEffect(() => { titleRef.current?.focus(); }, [question.id]);
  return <>
    <div className="quiz-nav"><span>PHP <span className="separator">/</span> {snapshot.level.name}</span><button className="text-button" onClick={quit} disabled={busy}>Quitter le quiz</button></div>
    <div className="quiz-layout">
      <section className="question-panel" aria-labelledby="question-title">
        <div className="question-meta"><span>Question {index + 1} sur {total}</span><span>{question.topic}</span></div>
        <progress className="quiz-progress" value={index} max={total} aria-label="Progression du quiz"/>
        <h1 id="question-title" ref={titleRef} tabIndex={-1}>{question.prompt}</h1>
        {question.code && <pre className="code-block"><span className="code-language">PHP</span><code>{question.code}</code></pre>}
        <fieldset className="options" disabled={busy || !!feedback}><legend className="sr-only">Choisissez une réponse</legend>
          {question.options.map((option, i) => {
            const right = feedback?.correctOption === option.id;
            const wrong = feedback?.selected === option.id && !feedback.correct;
            return <label key={option.id} className={`option ${selected === option.id ? 'option-selected' : ''} ${right ? 'option-right' : ''} ${wrong ? 'option-wrong' : ''}`}>
              <input type="radio" name={`answer-${question.id}`} value={option.id} checked={(feedback ? feedback.selected : selected) === option.id} onChange={() => setSelected(option.id)}/>
              <span className="option-letter" aria-hidden="true">{String.fromCharCode(65 + i)}</span><span className="option-text">{option.text}</span>{right && <span className="option-state"><StatusIcon/><span className="sr-only"> Bonne réponse</span></span>}{wrong && <span className="option-state"><StatusIcon correct={false}/><span className="sr-only"> Votre réponse incorrecte</span></span>}
            </label>;
          })}
        </fieldset>
        {feedback && <div className={`feedback ${feedback.correct ? 'feedback-correct' : 'feedback-wrong'}`} role="status"><h2>{feedback.timedOut ? 'Le temps est écoulé.' : feedback.correct ? 'Bien joué, c\'est la bonne réponse.' : feedback.selected === null ? 'Question passée. Voici la réponse.' : 'Pas tout à fait. On reprend ensemble.'}</h2><p>{feedback.explanation}</p></div>}
        <div className="question-actions"><span>{feedback ? 'Prenez le temps de lire la correction.' : 'Sélectionnez votre réponse, puis validez.'}</span>{feedback ? <button className="primary" onClick={next} disabled={busy}>{busy ? 'Chargement...' : index === total - 1 ? 'Voir mon résultat' : 'Question suivante'}<Arrow/></button> : <button className="primary" disabled={!selected || busy} onClick={() => submit(selected)}>{busy ? 'Vérification...' : 'Valider ma réponse'}<Arrow/></button>}</div>
      </section>
      <aside className="quiz-aside"><Timer key={question.id} snapshot={snapshot} onExpire={() => submit(null)}/><div className="session-note"><h2>Une question à la fois.</h2><p>Une seule bonne réponse. Prenez un instant pour lire le code avant de choisir.</p><div className="session-score"><span>Bonnes réponses</span><strong>{snapshot.score} <span>/ {snapshot.answered}</span></strong></div></div></aside>
    </div>
  </>;
}

function Result({ snapshot, restart, busy }) {
  const [onlyWrong, setOnlyWrong] = useState(false);
  const wrong = snapshot.review.filter((item) => !item.correct);
  const items = onlyWrong ? wrong : snapshot.review;
  return <>
    <div className="breadcrumb">PHP <span>/</span> {snapshot.level.name} <span>/</span> Résultat</div>
    <section className="result-header"><div><div className="eyebrow">SESSION TERMINÉE</div><h1>{snapshot.score >= 8 ? 'Vous êtes sur la bonne voie.' : snapshot.score >= 5 ? 'Les bases sont là. Continuez.' : 'Chaque essai fait avancer.'}</h1><p>{wrong.length ? `${wrong.length} notion${wrong.length > 1 ? 's' : ''} à revoir. Retrouvez les explications ci-dessous.` : 'Un sans-faute ! Vous pouvez essayer un autre niveau.'}</p><button className="primary" onClick={restart} disabled={busy}>Choisir un niveau<Arrow/></button></div><div className="result-score"><span>Votre score</span><strong>{snapshot.score}<small> / {snapshot.total}</small></strong><span>{snapshot.score * 10} % de bonnes réponses</span></div></section>
    <section className="review-section"><div className="section-heading"><h2>Reprenons vos réponses</h2><label className="review-filter"><input type="checkbox" checked={onlyWrong} onChange={(event) => setOnlyWrong(event.target.checked)}/> Mes erreurs seulement</label></div>
      {items.length === 0 && <p className="empty-review">Aucune erreur à revoir. Bien joué !</p>}
      {items.map((item) => <details className="review-item" key={item.id}><summary><span className={`review-symbol ${item.correct ? 'is-correct' : 'is-wrong'}`} aria-label={item.correct ? 'Correct' : 'Incorrect'}><StatusIcon correct={item.correct}/></span><span>{item.prompt}<small>{item.topic}{item.timedOut ? ' / Temps écoulé' : ''}</small></span><span className="expand-icon" aria-hidden="true">+</span></summary><div className="review-body">{item.code && <pre className="code-block"><code>{item.code}</code></pre>}<p><strong>Votre réponse : </strong>{item.options.find((option) => option.id === item.selected)?.text || (item.timedOut ? 'Temps écoulé' : 'Aucune réponse')}</p>{!item.correct && <p className="correct-text"><strong>Bonne réponse : </strong>{item.options.find((option) => option.id === item.correctOption)?.text}</p>}<p>{item.explanation}</p></div></details>)}
    </section>
  </>;
}

export default function App() {
  const [snapshot, setSnapshot] = useState({ phase: 'loading' });
  const [catalog, setCatalog] = useState({ levels: [], questionCount: 10 });
  const [level, setLevel] = useState('debutant');
  const [selected, setSelected] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [confirmQuit, setConfirmQuit] = useState(false);
  const lock = useRef(false);
  const dialog = useRef(null);

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([api('levels', undefined, controller.signal), api('attempt', undefined, controller.signal)])
      .then(([levels, attempt]) => { setCatalog(levels); setSnapshot(attempt); })
      .catch((err) => { if (err.name !== 'AbortError') { setError('Connexion au serveur impossible. Vérifiez qu\'il est lancé, puis réessayez.'); setSnapshot({ phase: 'unavailable' }); } });
    return () => controller.abort();
  }, []);
  useEffect(() => {
    if (confirmQuit) dialog.current?.showModal();
    else dialog.current?.close();
  }, [confirmQuit]);

  const act = useCallback(async (path, body) => {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError('');
    try {
      const data = await api(path, body);
      setSnapshot(data); setSelected(null); setConfirmQuit(false);
      if (path !== 'answer') window.scrollTo({ top: 0, behavior: 'instant' });
    } catch (err) {
      if (err.status === 401) { setSnapshot({ phase: 'home' }); setConfirmQuit(false); }
      setError(err.message || 'Connexion interrompue. Reprenez votre tentative pour vérifier votre réponse.');
    } finally { lock.current = false; setBusy(false); }
  }, []);
  const submit = (optionId) => act('answer', { questionId: snapshot.question.id, optionId });

  return <div className="app-shell">
    <header className="site-header"><div className="header-inner"><a className="brand" href="/" aria-label="PHP pratique, accueil"><span className="brand-mark">php</span><span>pratique<span className="brand-dot">.</span></span></a><span className="header-description">Un espace pour progresser.</span><span className="header-tag">QCM PHP</span></div></header>
    <main id="main-content">
      {error && <div className="error-banner" role="alert"><span>{error}</span><button className="text-button" disabled={busy} onClick={() => snapshot.phase === 'unavailable' ? window.location.reload() : act('attempt')}>Reprendre la tentative</button></div>}
      {snapshot.phase === 'loading' && <div className="loading" role="status"><span className="spinner"/>Préparation de votre espace...</div>}
      {snapshot.phase === 'home' && <Home levels={catalog.levels} count={catalog.questionCount} selected={level} setSelected={setLevel} onStart={() => act('attempt', { level })} busy={busy}/>}
      {snapshot.phase === 'quiz' && <Quiz snapshot={snapshot} selected={selected} setSelected={setSelected} submit={submit} next={() => act('next', { questionId: snapshot.question.id })} busy={busy} quit={() => setConfirmQuit(true)}/>}
      {snapshot.phase === 'result' && <Result snapshot={snapshot} restart={() => act('reset', {})} busy={busy}/>}
    </main>
    <footer className="site-footer"><span>PHP pratique<span className="brand-dot">.</span></span><span>On apprend aussi en se trompant.</span></footer>
    <dialog ref={dialog} onCancel={() => setConfirmQuit(false)} onClose={() => setConfirmQuit(false)}><h2>Quitter cette tentative ?</h2><p>Votre progression sera effacée. Vous pourrez commencer un nouveau quiz.</p><div className="dialog-actions"><button className="secondary" onClick={() => setConfirmQuit(false)}>Continuer le quiz</button><button className="primary" disabled={busy} onClick={() => act('reset', {})}>Quitter</button></div></dialog>
  </div>;
}
