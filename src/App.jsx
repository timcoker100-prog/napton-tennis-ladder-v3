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
  const [adminCode, setAdminCode] = useState('')
const [isAdmin, setIsAdmin] = useState(false)
const [loginEmail, setLoginEmail] = useState('')
const [loggedInPlayer, setLoggedInPlayer] = useState(null)
const [page, setPage] = useState('login')
const [phone, setPhone] = useState('')
const [whatsapp, setWhatsapp] = useState('')
const [showEmail, setShowEmail] = useState(false)
const [showPhone, setShowPhone] = useState(false)
const [showWhatsapp, setShowWhatsapp] = useState(false)
const [password, setPassword] = useState('')
const [loginPassword, setLoginPassword] = useState('')
const [resetEmail, setResetEmail] = useState('')
const [selectedPlayersToDelete, setSelectedPlayersToDelete] = useState([])
  

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
      .order('id', { ascending: false })

    setMatches(data || [])
  }

  useEffect(() => {
    loadPlayers()
    loadMatches()
  }, [])

  async function addPlayer() {
    if (!name.trim()) {
  alert('Please enter your name.')
  return
}

if (!email.trim()) {
  alert('Please enter your email address.')
  return
}

if (!password.trim()) {
  alert('Please create a password.')
  return
}
   if (!password) {
  alert('Please create a password.')
  return
}

if (phone && !isValidInternationalNumber(phone)) {
  alert('Please enter your phone number with country code, for example +447927315429.')
  return
}

if (whatsapp && !isValidInternationalNumber(whatsapp)) {
  alert('Please enter your WhatsApp number with country code, for example +447927315429.')
  return
}

    const { data, error } = await supabase
  .from('players')
  .insert([
    {
      name,
      email,
      password,
      phone,
whatsapp,
show_email: showEmail,
show_phone: showPhone,
show_whatsapp: showWhatsapp,
      played: 0,
      won: 0,
      lost: 0,
      points: 0,
    },
  ])
  .select()

    if (error) {

  if (error.message.includes('duplicate')) {
    alert('That email address is already being used.')
  } else {
    alert(error.message)
  }

  return
}
const newPlayer = data?.[0]

if (newPlayer) {
  setLoggedInPlayer(newPlayer)
}

    setName('')
    setEmail('')
    loadPlayers()
  }
function loginPlayer() {
  if (!loginEmail.trim()) {
  alert('Please enter your email address.')
  return
}

if (!loginPassword.trim()) {
  alert('Please enter your password.')
  return
}
  const foundPlayer = players.find(
    (player) =>
      String(player.email || '').toLowerCase() === loginEmail.toLowerCase() &&
      String(player.password || '') === loginPassword
  )

  if (!foundPlayer) {
    alert('Incorrect email or password.')
    return
  }

  setLoggedInPlayer(foundPlayer)
  setPage('ladder')
}


  async function submitMatch() {
    if (!loggedInPlayer) {
  alert('You must be logged in to submit a match result.')
  return
}

if (player1Id !== loggedInPlayer.id && player2Id !== loggedInPlayer.id) {
  alert('You can only submit a match result involving yourself.')
  return
}
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
const existingMatch = matches.find(
  (match) =>
    (match.player_a === player1Id && match.player_b === player2Id) ||
    (match.player_a === player2Id && match.player_b === player1Id)
)

if (existingMatch) {
  alert('These two players have already played each other.')
  return
}
    const player1 = players.find((p) => p.id === player1Id)
    const player2 = players.find((p) => p.id === player2Id)

    const player1Won = p1Score > p2Score
    const player2Won = p2Score > p1Score

 const { error: matchError } = await supabase.from('matches').insert([
  {
       player_a: player1Id,
    player_b: player2Id,
    player_a_games: p1Score,
    player_b_games: p2Score,
    status: 'confirmed',
  },
])
if (matchError) {
  alert(matchError.message)
  return
}
const { error: player1Error } = await supabase
  .from('players')
  .update({
    played: player1.played + 1,
    won: player1.won + (player1Won ? 1 : 0),
    lost: player1.lost + (player2Won ? 1 : 0),
    points: player1.points + p1Score,
  })
  .eq('id', player1Id)

if (player1Error) {
  alert(player1Error.message)
  return
}

const { error: player2Error } = await supabase
  .from('players')
  .update({
    played: player2.played + 1,
    won: player2.won + (player2Won ? 1 : 0),
    lost: player2.lost + (player1Won ? 1 : 0),
    points: player2.points + p2Score,
  })
  .eq('id', player2Id)

if (player2Error) {
  alert(player2Error.message)
  return
}
    

    setPlayer1Id('')
    setPlayer2Id('')
    setPlayer1Score('')
    setPlayer2Score('')
    
const winner = player1Won ? player1 : player2
const loser = player1Won ? player2 : player1
const winnerScore = player1Won ? p1Score : p2Score
const loserScore = player1Won ? p2Score : p1Score


  await loadPlayers()
await loadMatches()

setPage('ladder')
setTimeout(() => {
  loadPlayers()
  loadMatches()
}, 500)
const emailResponse = await fetch(
  'https://fblxqfzzgbxtaswedstv.supabase.co/functions/v1/quick-worker',
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({
      winnerEmail: winner.email,
      loserEmail: loser.email,
      winnerName: winner.name,
      loserName: loser.name,
      winnerScore,
      loserScore,
    }),
  }
)

const emailData = await emailResponse.json()
console.log(emailData)

console.log(emailData)


}

async function deletePlayer(playerId) {
  if (!isAdmin) return
  alert('Delete function started for ' + playerId)

  const confirmed = window.confirm(
    'Delete this player and all related matches?'
  )

  if (!confirmed) return

  const { error: matchDeleteError } = await supabase
    .from('matches')
    .delete()
    .or(`player_a.eq.${playerId},player_b.eq.${playerId}`)

  if (matchDeleteError) {
    alert(matchDeleteError.message)
    return
  }

  const { error: playerDeleteError } = await supabase
    .from('players')
    .delete()
    .eq('id', playerId)

  if (playerDeleteError) {
    alert(playerDeleteError.message)
    return
  }

  await loadPlayers()
  await loadMatches()
  setPage('ladder')
}
async function updateMyDetails() {
  if (!loggedInPlayer || loggedInPlayer.id === 'admin') {
    alert('Only a registered player can update their own details.')
    return
  }

  const { error } = await supabase
    .from('players')
    .update({
      phone,
      whatsapp,
      show_email: showEmail,
      show_phone: showPhone,
      show_whatsapp: showWhatsapp,
      password,
    })
    .eq('id', loggedInPlayer.id)

  if (error) {
    alert(error.message)
    return
  }

  alert('Your details have been updated.')

  await loadPlayers()

  setLoggedInPlayer({
    ...loggedInPlayer,
    phone,
    whatsapp,
    show_email: showEmail,
    show_phone: showPhone,
    show_whatsapp: showWhatsapp,
    password,
  })
}
async function deleteSelectedPlayers() {
  if (!isAdmin) return

  if (selectedPlayersToDelete.length === 0) {
    alert('Please select at least one player to delete.')
    return
  }

  const confirmed = window.confirm(
    'Delete selected players and all their related matches?'
  )

  if (!confirmed) return

  for (const playerId of selectedPlayersToDelete) {
    await deletePlayer(playerId)
  }

  setSelectedPlayersToDelete([])
  alert('Selected players deleted.')
}
function cleanInternationalNumber(value) {
  return String(value || '').replace(/[^\d+]/g, '')
}

function isValidInternationalNumber(value) {
  if (!value) return true
  return /^\+\d{8,15}$/.test(value)
}

function numberForWhatsapp(value) {
  return String(value || '').replace(/\D/g, '')
}
return (
    <div className="container">
      <h1>Napton Tennis Ladder</h1>
     {!loggedInPlayer && page === 'login' && (
  <>
    <div className="login-box">
      <h2>Log In</h2>

      <input
        value={loginEmail}
        onChange={(e) => setLoginEmail(e.target.value)}
        placeholder="Email address"
      />

      <input
        type="password"
        value={loginPassword}
        onChange={(e) => setLoginPassword(e.target.value)}
        placeholder="Password"
      />

      <button onClick={loginPlayer}>Log In</button>

      <button className="link-button" onClick={() => setPage('register')}>
        If you have not registered yet, click here
      </button>

      <button className="link-button" onClick={() => setPage('instructions')}>
        Instructions
      </button>

      <p>
        If you have forgotten your password, please contact the administrator:
        timcoker100@gmail.com
      </p>

      
    </div>
  </>
)}
{page === 'forgot' && (
  <div className="card">
    <h2>Forgot Password</h2>

    <input
      value={resetEmail}
      onChange={(e) => setResetEmail(e.target.value)}
      placeholder="Enter your registered email"
    />

    <p>
      Contact the ladder administrator and ask for your password to be reset.
    </p>

    <button className="link-button" onClick={() => setPage('login')}>
  Back to Login
</button>
  </div>
)}
{page === 'instructions' && (
  <div className="card">
    <button
      className="link-button"
      onClick={() => setPage('login')}
    >
      Back
    </button>

    <h2>Instructions</h2>

   1. Register with your name, email address and password.

2. Phone number and WhatsApp number are optional. If you choose to provide them, please include the international dialling code (for example +44 for the UK).

3. You can choose whether your email address, phone number and WhatsApp number are visible to other registered players. If you choose not to share any contact details, other players may find it difficult to arrange matches with you.

4. Use the Contacts page to find opponents and contact them to arrange a match.

5. Each ladder match consists of 15 games. Every game won earns one ladder point. For example, a score of 9–6 awards 9 ladder points to the winner and 6 ladder points to the loser.

6. Your ladder ranking is based on the total number of ladder points you have accumulated.

7. You may only submit one ladder match against any particular opponent. You are welcome to play the same opponent again socially, but additional matches against the same opponent cannot be entered into the ladder.

8. After a match has been played, either player may submit the result using the Submit Match Result page.

9. Once a result has been submitted, both players will receive an email confirming the recorded score.

10. The History page shows all ladder matches played, including player names, match date and score.

11. Only your own contact details and password can be edited.

12. The system automatically logs out after 5 minutes of inactivity.

13. If you forget your password, please contact the ladder administrator. timcoker100@gmail.com

   <button
  className="link-button"
  onClick={() => setPage('login')}
>
  Back to Login
</button>

   
  </div>
)}

      <div className="admin-box">
  <input
    value={adminCode}
    onChange={(e) => setAdminCode(e.target.value)}
    placeholder="Admin code"
  />

  <button
    onClick={() => {
     if (adminCode === 'ADMIN2026') {
  setIsAdmin(true)
  setLoggedInPlayer({
    id: 'admin',
    name: 'Administrator',
    email: 'admin'
  })
  setPage('ladder')
  alert('Admin access enabled')
}
        alert('Wrong admin code')
      }
    }
  >
    Admin Login
  </button>
</div>
{page === 'register' && (
      
  <>

      <div className="add-player">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Player name" />
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Player email" />
 <input
  type="password"
  value={password}
  onChange={(e) => setPassword(e.target.value)}
  placeholder="Create password"
/>
<input
  value={phone}
  onChange={(e) => setPhone(cleanInternationalNumber(e.target.value))}
  placeholder="+44 phone number optional"
/>
<input
  value={whatsapp}
  onChange={(e) => setWhatsapp(cleanInternationalNumber(e.target.value))}
  placeholder="+44 phone number optional"
/>
  <div className="consent-row">
  <input
    type="checkbox"
    checked={showPhone}
    onChange={(e) => setShowPhone(e.target.checked)}
  />
  <span>I consent to my phone number being visible to other registered players.</span>
</div>

<div className="consent-row">
  <input
    type="checkbox"
    checked={showWhatsapp}
    onChange={(e) => setShowWhatsapp(e.target.checked)}
  />
  <span>I consent to my WhatsApp number being visible to other registered players.</span>
</div>

<div className="consent-row">
  <input
    type="checkbox"
    checked={showEmail}
    onChange={(e) => setShowEmail(e.target.checked)}
  />
  <span>I consent to my email address being visible to other registered players.</span>
</div>

<button className="register-button" onClick={addPlayer}>
  Register
</button>
<button className="link-button" onClick={() => setPage('login')}>
  Back to Login
</button>
      </div>
        </>
)}

{loggedInPlayer && (
  <>

  <div className="logged-in-bar">
  <p>Logged in as {loggedInPlayer.name}</p>

  <button
    className="logout-button"
    onClick={() => {
      setLoggedInPlayer(null)
      setLoginEmail('')
      setLoginPassword('')
      setPage('login')
    }}
  >
    Log out
  </button>

  <button onClick={() => setPage('submit')}>
    Submit Match Result
  </button>

  <button onClick={() => setPage('contacts')}>
    Player Contacts
  </button>

  <button onClick={() => setPage('ladder')}>
    Ladder
  </button>

  {isAdmin && (
    <div className="card">
      <h2>Admin Dashboard</h2>

      <p>Total players: {players.length}</p>

      <p>Total matches: {matches.length}</p>

      <p>
        Admin can delete players using the Delete buttons in the ladder table.
      </p>
    </div>
  )}
</div>

     {page === 'submit' && (
  <div className="match-form">

    <button
      className="link-button"
      onClick={() => setPage('ladder')}
    >
      Back
    </button>
        <h2>Submit Match Result</h2>

        <select value={player1Id} onChange={(e) => setPlayer1Id(e.target.value)}>
          <option value="">Player 1</option>
          {players.map((player) => (
            <option key={player.id} value={player.id}>
  {player.name} - Played {player.played}, Points {player.points}
</option>
          ))}
        </select>

        <input value={player1Score} onChange={(e) => setPlayer1Score(e.target.value)} placeholder="Player 1 score" />

        <select value={player2Id} onChange={(e) => setPlayer2Id(e.target.value)}>
          <option value="">Player 2</option>
          {players.map((player) => (
            <option key={player.id} value={player.id}>
  {player.name} - Played {player.played}, Points {player.points}
</option>
          ))}
        </select>

        <input value={player2Score} onChange={(e) => setPlayer2Score(e.target.value)} placeholder="Player 2 score" />

        <button onClick={submitMatch}>Submit Match</button>
      </div>
    
)}
      {page === 'ladder' && (
  <>
     <button onClick={() => setPage('history')}>
  Match History
</button>
      <button onClick={() => setPage('submit')}>
  Submit Match Result
</button>
     

    {isAdmin && (
      <button onClick={deleteSelectedPlayers}>
        Delete Selected Players
      </button>
    )}

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
            {isAdmin && <th>Admin</th>}
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
              {isAdmin && (
  <td>
   <input
  type="checkbox"
  checked={selectedPlayersToDelete.includes(player.id)}
  onChange={(e) => {
    if (e.target.checked) {
      setSelectedPlayersToDelete([...selectedPlayersToDelete, player.id])
    } else {
      setSelectedPlayersToDelete(
        selectedPlayersToDelete.filter((id) => id !== player.id)
      )
    }
  }}
/>
    <button onClick={() => deletePlayer(player.id)}>
      Delete
    </button>
  </td>
)}
            </tr>
          ))}
       </tbody>
</table>
  </>
)}

{page === 'history' && (
  <div className="card">
    <button className="link-button" onClick={() => setPage('ladder')}>
      Back
    </button>

    <h2>Match History</h2>

    <table>
      <thead>
        <tr>
          <th>Date</th>
          <th>Player 1</th>
          <th>Player 2</th>
          <th>Score</th>
        </tr>
      </thead>

      <tbody>
        {matches.map((match) => {
          const player1 = players.find((p) => p.id === match.player_a)
          const player2 = players.find((p) => p.id === match.player_b)

          return (
            <tr key={match.id}>
              <td>{new Date(match.created_at).toLocaleDateString('en-GB')}</td>
              <td>{player1?.name || 'Unknown'}</td>
              <td>{player2?.name || 'Unknown'}</td>
              <td>
                {match.player_a_games} - {match.player_b_games}
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  </div>
)}

{page === 'contacts' && (

  <div className="card">

    <button
      className="link-button"
      onClick={() => setPage('ladder')}
    >
      Back
    </button>
<h2>Player Contacts</h2>
<p>
  This page shows player contact details where players have agreed to share them.
  You can edit only your own contact details and password.
</p>

{loggedInPlayer && loggedInPlayer.id !== 'admin' && (
  <div className="card">
    <h3>Edit My Details</h3>

    <input
      value={phone}
      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
      placeholder="Phone number"
    />

    <input
      value={whatsapp}
      onChange={(e) => setWhatsapp(e.target.value.replace(/\D/g, ''))}
      placeholder="WhatsApp number"
    />

    <input
      type="password"
      value={password}
      onChange={(e) => setPassword(e.target.value)}
      placeholder="New password"
    />

    <div className="consent-row">
      <input
        type="checkbox"
        checked={showEmail}
        onChange={(e) => setShowEmail(e.target.checked)}
      />
      <span>Share my email with registered players</span>
    </div>

    <div className="consent-row">
      <input
        type="checkbox"
        checked={showPhone}
        onChange={(e) => setShowPhone(e.target.checked)}
      />
      <span>Share my phone number with registered players</span>
    </div>

    <div className="consent-row">
      <input
        type="checkbox"
        checked={showWhatsapp}
        onChange={(e) => setShowWhatsapp(e.target.checked)}
      />
      <span>Share my WhatsApp number with registered players</span>
    </div>

    <button onClick={updateMyDetails}>
      Update My Details
    </button>
  </div>
)}
<table>
  <thead>
    <tr>
      <th>Name</th>
      <th>Email</th>
      <th>Phone</th>
      <th>WhatsApp</th>
    </tr>
  </thead>

  <tbody>
    {players.map((player) => (
      <tr key={player.id}>
        <td>{player.name}</td>

        <td>
          {player.show_email ? (
            <a href={`mailto:${player.email}`}>{player.email}</a>
          ) : (
            'Not shared'
          )}
        </td>

        <td>
          {player.show_phone && player.phone ? (
            <a href={`tel:${player.phone}`}>{player.phone}</a>
          ) : (
            'Not shared'
          )}
        </td>

        <td>
          {player.show_whatsapp && player.whatsapp ? (
            <a
              href={`https://wa.me/${numberForWhatsapp(player.whatsapp)}`}
              target="_blank"
              rel="noreferrer"
            >
              WhatsApp
            </a>
          ) : (
            'Not shared'
          )}
        </td>
      </tr>
    ))}
  </tbody>
</table>


  
      </div>
)}
        </>
)}
    </div>
  )
}

createRoot(document.getElementById('root')).render(<App />)