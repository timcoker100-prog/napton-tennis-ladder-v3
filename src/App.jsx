import { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { supabase } from './supabaseClient'
import './styles.css'

export default function App() {
  const [players, setPlayers] = useState([])
  const [matches, setMatches] = useState([])
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [player1Id, setPlayer1Id] = useState('')
  const [player2Id, setPlayer2Id] = useState('')
  const [player1Score, setPlayer1Score] = useState('')
  const [player2Score, setPlayer2Score] = useState('')

  async function loadPlayers() {
    const { data } = await supabase
      .from('players')
      .select('*')
      .order('points', { ascending: false })

    setPlayers(data || [])
  }

  async function loadMatches() {
    const { data } = await supabase
      .from('matches')
      .select('*')
      .order('played_at', { ascending: false })

    setMatches(data || [])
  }

  useEffect(() => {
    loadPlayers()
    loadMatches()
  }, [])

  async function addPlayer() {
    if (!name || !email) return

    const { error } = await supabase.from('players').insert([
      { name, email, played: 0, won: 0, lost: 0, points: 0 },
    ])

    if (error) {
      alert('That email address is already being used.')
      return
    }

    setName('')
    setEmail('')
    loadPlayers()
  }

  async function submitMatch() {
    if (!player1Id || !player2Id || player1Id === player2Id) {
      alert('Please choose two different players.')
      return
    }

    const p1Score = Number(player1Score)
    const p2Score = Number(player2Score)

    if (p1Score + p2Score !== 15) {
      alert('The total number of games must equal 15.')
      return
    }

    const player1 = players.find((p) => p.id === player1Id)
    const player2 = players.find((p) => p.id === player2Id)

    const player1Won = p1Score > p2Score
    const player2Won = p2Score > p1Score

    await supabase.from('matches').insert([
      {
        player1_id: player1Id,
        player2_id: player2Id,
        player1_score: p1Score,
        player2_score: p2Score,
      },
    ])

    await supabase.from('players').update({
      played: player1.played + 1,
      won: player1.won + (player1Won ? 1 : 0),
      lost: player1.lost + (player2Won ? 1 : 0),
      points: player1.points + p1Score,
    }).eq('id', player1Id)

    await supabase.from('players').update({
      played: player2.played + 1,
      won: player2.won + (player2Won ? 1 : 0),
      lost: player2.lost + (player1Won ? 1 : 0),
      points: player2.points + p2Score,
    }).eq('id', player2Id)

    setPlayer1Id('')
    setPlayer2Id('')
    setPlayer1Score('')
    setPlayer2Score('')

    loadPlayers()
    loadMatches()
  }

  return (
    <div className="container">
      <h1>Napton Tennis Ladder</h1>

      <div className="add-player">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Player name" />
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Player email" />
        <button onClick={addPlayer}>Add Player</button>
      </div>

      <div className="match-form">
        <h2>Submit Match Result</h2>

        <select value={player1Id} onChange={(e) => setPlayer1Id(e.target.value)}>
          <option value="">Player 1</option>
          {players.map((player) => (
            <option key={player.id} value={player.id}>{player.name}</option>
          ))}
        </select>

        <input value={player1Score} onChange={(e) => setPlayer1Score(e.target.value)} placeholder="Player 1 score" />

        <select value={player2Id} onChange={(e) => setPlayer2Id(e.target.value)}>
          <option value="">Player 2</option>
          {players.map((player) => (
            <option key={player.id} value={player.id}>{player.name}</option>
          ))}
        </select>

        <input value={player2Score} onChange={(e) => setPlayer2Score(e.target.value)} placeholder="Player 2 score" />

        <button onClick={submitMatch}>Submit Match</button>
      </div>

      <table>
        <thead>
          <tr>
            <th>Rank</th>
            <th>Name</th>
            <th>Email</th>
            <th>Played</th>
            <th>Won</th>
            <th>Lost</th>
            <th>Points</th>
          </tr>
        </thead>

        <tbody>
          {players.map((player, index) => (
            <tr key={player.id}>
              <td>{index + 1}</td>
              <td>{player.name}</td>
              <td>{player.email}</td>
              <td>{player.played}</td>
              <td>{player.won}</td>
              <td>{player.lost}</td>
              <td>{player.points}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>Match History</h2>

      <table>
        <thead>
          <tr>
            <th>Player 1</th>
            <th>Score</th>
            <th>Player 2</th>
            <th>Date</th>
          </tr>
        </thead>

        <tbody>
          {matches.map((match) => {
            const player1 = players.find((p) => p.id === match.player1_id)
            const player2 = players.find((p) => p.id === match.player2_id)

            return (
              <tr key={match.id}>
                <td>{player1?.name || 'Unknown'}</td>
                <td>{match.player1_score} - {match.player2_score}</td>
                <td>{player2?.name || 'Unknown'}</td>
                <td>{new Date(match.played_at).toLocaleDateString()}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

createRoot(document.getElementById('root')).render(<App />)