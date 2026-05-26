import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Trophy, CheckCircle, Clock, LogOut, UserPlus } from 'lucide-react';
import { supabase } from './supabaseClient';
import './styles.css';

const CLUB_NAME = 'Napton Tennis Singles Ladder';

function pointsFromMatch(won, lost) {
  return Math.max(0, won) + (won > lost ? 5 : 0);
}

function Auth({ onSession }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState('sign-in');
  const [message, setMessage] = useState('');

  async function submit(e) {
    e.preventDefault();
    setMessage('');
    const fn = mode === 'sign-up' ? supabase.auth.signUp : supabase.auth.signInWithPassword;
    const { data, error } = await fn.call(supabase.auth, { email, password });
    if (error) return setMessage(error.message);
    if (data.session) onSession(data.session);
    setMessage(mode === 'sign-up' ? 'Check your email if confirmation is enabled.' : 'Signed in.');
  }

  return <main className="auth-card">
    <h1>{CLUB_NAME}</h1>
    <p>Singles ladder with pending score confirmation.</p>
    <form onSubmit={submit}>
      <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" type="email" required />
      <input value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" type="password" required minLength={6} />
      <button>{mode === 'sign-up' ? 'Create account' : 'Sign in'}</button>
    </form>
    <button className="link-button" onClick={() => setMode(mode === 'sign-up' ? 'sign-in' : 'sign-up')}>
      {mode === 'sign-up' ? 'Already registered? Sign in' : 'New player? Create account'}
    </button>
    {message && <p className="message">{message}</p>}
  </main>;
}

function App() {
  const [session, setSession] = useState(null);
  const [players, setPlayers] = useState([]);
  const [matches, setMatches] = useState([]);
  const [profile, setProfile] = useState(null);
  const [name, setName] = useState('');
  const [opponentId, setOpponentId] = useState('');
  const [myGames, setMyGames] = useState('8');
  const [oppGames, setOppGames] = useState('7');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => setSession(sess));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => { if (session) loadAll(); }, [session]);

  async function loadAll() {
    const [{ data: ps }, { data: ms }] = await Promise.all([
      supabase.from('profiles').select('*').order('name'),
      supabase.from('matches').select('*').order('created_at', { ascending: false })
    ]);
    setPlayers(ps || []);
    setMatches(ms || []);
    const mine = (ps || []).find(p => p.id === session.user.id);
    setProfile(mine || null);
    if (mine) setName(mine.name);
  }

  async function saveProfile() {
    const { error } = await supabase.from('profiles').upsert({ id: session.user.id, name, active: true });
    setNotice(error ? error.message : 'Profile saved.');
    await loadAll();
  }

  async function submitMatch(e) {
    e.preventDefault();
    const a = Number(myGames), b = Number(oppGames);
    if (!profile) return setNotice('Save your player profile first.');
    if (!opponentId || opponentId === profile.id) return setNotice('Choose an opponent.');
    if (a + b > 15) return setNotice('Total games must not exceed 15.');
    const { error } = await supabase.from('matches').insert({
      submitted_by: profile.id,
      player_a: profile.id,
      player_b: opponentId,
      player_a_games: a,
      player_b_games: b,
      status: 'pending'
    });
    setNotice(error ? error.message : 'Result submitted. Opponent must confirm it.');
    await loadAll();
  }

  async function confirmMatch(match) {
    const { error } = await supabase.from('matches').update({ status: 'confirmed', confirmed_at: new Date().toISOString() }).eq('id', match.id);
    setNotice(error ? error.message : 'Match confirmed. Ladder updated.');
    await loadAll();
  }

  const table = useMemo(() => {
    const stats = Object.fromEntries(players.map(p => [p.id, { ...p, played: 0, wins: 0, gamesFor: 0, gamesAgainst: 0, points: 0 }]));
    matches.filter(m => m.status === 'confirmed').forEach(m => {
      const a = stats[m.player_a], b = stats[m.player_b];
      if (!a || !b) return;
      a.played++; b.played++;
      a.gamesFor += m.player_a_games; a.gamesAgainst += m.player_b_games;
      b.gamesFor += m.player_b_games; b.gamesAgainst += m.player_a_games;
      if (m.player_a_games > m.player_b_games) a.wins++; else if (m.player_b_games > m.player_a_games) b.wins++;
      a.points += pointsFromMatch(m.player_a_games, m.player_b_games);
      b.points += pointsFromMatch(m.player_b_games, m.player_a_games);
    });
    return Object.values(stats).sort((x, y) => y.points - x.points || y.wins - x.wins || (y.gamesFor - y.gamesAgainst) - (x.gamesFor - x.gamesAgainst));
  }, [players, matches]);

  if (!session) return <Auth onSession={setSession} />;

  const nameOf = id => players.find(p => p.id === id)?.name || 'Unknown player';
  const pendingForMe = matches.filter(m => m.status === 'pending' && m.player_b === profile?.id);

  return <main className="app">
    <header>
      <div><h1>{CLUB_NAME}</h1><p>Games-based singles ladder. Total games per match must be 15 or fewer.</p></div>
      <button className="secondary" onClick={() => supabase.auth.signOut()}><LogOut size={16}/> Sign out</button>
    </header>

    <section className="grid">
      <div className="card">
        <h2><UserPlus size={20}/> Your player profile</h2>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" />
        <button onClick={saveProfile}>Save profile</button>
      </div>

      <div className="card">
        <h2><Trophy size={20}/> Submit result</h2>
        <form onSubmit={submitMatch} className="match-form">
          <select value={opponentId} onChange={e => setOpponentId(e.target.value)} required>
            <option value="">Choose opponent</option>
            {players.filter(p => p.id !== profile?.id).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <label>Your games <input type="number" min="0" max="15" value={myGames} onChange={e => setMyGames(e.target.value)} /></label>
          <label>Opponent games <input type="number" min="0" max="15" value={oppGames} onChange={e => setOppGames(e.target.value)} /></label>
          <button>Submit for confirmation</button>
        </form>
      </div>
    </section>

    {notice && <p className="notice">{notice}</p>}

    <section className="card">
      <h2><Trophy size={20}/> Ladder</h2>
      <table><thead><tr><th>#</th><th>Player</th><th>Played</th><th>Wins</th><th>Games +/-</th><th>Points</th></tr></thead><tbody>
        {table.map((p, i) => <tr key={p.id}><td>{i+1}</td><td>{p.name}</td><td>{p.played}</td><td>{p.wins}</td><td>{p.gamesFor - p.gamesAgainst}</td><td>{p.points}</td></tr>)}
      </tbody></table>
    </section>

    <section className="grid">
      <div className="card">
        <h2><Clock size={20}/> Awaiting your confirmation</h2>
        {pendingForMe.length === 0 && <p>No pending results.</p>}
        {pendingForMe.map(m => <div className="match" key={m.id}>
          <p>{nameOf(m.player_a)} says: {m.player_a_games}–{m.player_b_games} v {nameOf(m.player_b)}</p>
          <button onClick={() => confirmMatch(m)}><CheckCircle size={16}/> Confirm</button>
        </div>)}
      </div>

      <div className="card">
        <h2>Recent matches</h2>
        {matches.map(m => <div className="match" key={m.id}>
          <strong>{nameOf(m.player_a)} {m.player_a_games}–{m.player_b_games} {nameOf(m.player_b)}</strong>
          <span className={m.status}>{m.status}</span>
        </div>)}
      </div>
    </section>
  </main>;
}

createRoot(document.getElementById('root')).render(<App />);
