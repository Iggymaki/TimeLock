// =============================================================
// 🔍 CapsuleExplorer.jsx - My Capsules with Live Countdown
// =============================================================
// แสดงเฉพาะแคปซูลของกระเป๋าตังที่เชื่อมต่ออยู่เท่านั้น
// พร้อม Live Countdown Timer สำหรับแคปซูลที่ยังล็อคอยู่
// =============================================================

import { useState, useEffect, useRef, useCallback } from 'react'
import { Contract } from 'ethers'
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../contracts/config.js'

function CapsuleExplorer({ provider, signer, walletAddress }) {
  const [capsules, setCapsules] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [now, setNow] = useState(Math.floor(Date.now() / 1000))
  const intervalRef = useRef(null)

  // ─── Live clock: update every second for countdown ───
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setNow(Math.floor(Date.now() / 1000))
    }, 1000)
    return () => clearInterval(intervalRef.current)
  }, [])

  // ─── Load only MY capsules from contract ───
  const loadMyCapsules = useCallback(async () => {
    if (!walletAddress || (!provider && !signer)) return

    setIsLoading(true)
    setError(null)

    try {
      const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer || provider)
      const totalCount = await contract.capsuleCount()
      const total = Number(totalCount)

      if (total === 0) {
        setCapsules([])
        setIsLoading(false)
        return
      }

      const myCapsules = []
      const batchSize = 10

      for (let i = 1; i <= total; i += batchSize) {
        const batch = []
        for (let j = i; j <= Math.min(i + batchSize - 1, total); j++) {
          batch.push(
            contract.capsules(j).then((data) => ({
              id: j,
              message: data[0],
              unlockTime: Number(data[1]),
              creator: data[2],
            })).catch((err) => {
              console.warn(`Failed to fetch capsule ${j}`, err)
              return null
            })
          )
        }

        const results = await Promise.all(batch)
        for (const capsule of results) {
          // ✅ Filter เฉพาะแคปซูลที่ creator === wallet ของเรา
          if (
            capsule &&
            capsule.creator &&
            capsule.creator.toLowerCase() === walletAddress.toLowerCase()
          ) {
            myCapsules.push(capsule)
          }
        }
      }

      // Sort newest first
      myCapsules.sort((a, b) => b.id - a.id)
      setCapsules(myCapsules)
    } catch (err) {
      console.error('Failed to load capsules:', err)
      setError('ไม่สามารถโหลดข้อมูลจาก Blockchain ได้')
    } finally {
      setIsLoading(false)
    }
  }, [walletAddress, provider, signer])

  // Reload when wallet changes
  useEffect(() => {
    if (walletAddress && (provider || signer)) {
      loadMyCapsules()
    } else {
      setCapsules([])
    }
  }, [walletAddress, provider, signer, loadMyCapsules])

  // ─── Countdown formatter ───
  const formatCountdown = (unlockTime) => {
    const diff = unlockTime - now
    if (diff <= 0) return null

    const days = Math.floor(diff / 86400)
    const hours = Math.floor((diff % 86400) / 3600)
    const minutes = Math.floor((diff % 3600) / 60)
    const seconds = diff % 60

    if (days > 0) return `${days}d ${hours}h ${minutes}m ${seconds}s`
    if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`
    if (minutes > 0) return `${minutes}m ${seconds}s`
    return `${seconds}s`
  }

  const formatDate = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  const shortenAddress = (addr) => {
    if (!addr) return ''
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  const isUnlocked = (unlockTime) => now >= unlockTime

  // ─── Not connected state ───
  if (!walletAddress) {
    return (
      <section className="explorer-section" id="explorer-section">
        <div className="explorer-header">
          <div className="card-header-label">My Wallet</div>
          <h2 className="card-title">My Capsules</h2>
          <p className="card-subtitle">Connect your wallet to view your time capsules</p>
        </div>
        <div className="explorer-empty">
          <div className="explorer-empty-icon">🔗</div>
          <p>Please connect MetaMask to view your capsules</p>
        </div>
      </section>
    )
  }

  return (
    <section className="explorer-section" id="explorer-section">
      <div className="explorer-header">
        <div className="card-header-label">My Wallet</div>
        <h2 className="card-title">My Capsules</h2>
        <p className="card-subtitle">
          Capsules created by {shortenAddress(walletAddress)}
        </p>
        <button
          className="explorer-refresh"
          onClick={loadMyCapsules}
          disabled={isLoading}
        >
          {isLoading ? '⏳ Loading...' : '🔄 Refresh'}
        </button>
      </div>

      {/* Stats bar */}
      {capsules.length > 0 && (
        <div className="explorer-stats">
          <div className="explorer-stat-item">
            <span className="explorer-stat-number">{capsules.length}</span>
            <span className="explorer-stat-label">Total</span>
          </div>
          <div className="explorer-stat-item">
            <span className="explorer-stat-number unlocked">
              {capsules.filter((c) => isUnlocked(c.unlockTime)).length}
            </span>
            <span className="explorer-stat-label">🔓 Unlocked</span>
          </div>
          <div className="explorer-stat-item">
            <span className="explorer-stat-number locked">
              {capsules.filter((c) => !isUnlocked(c.unlockTime)).length}
            </span>
            <span className="explorer-stat-label">🔒 Locked</span>
          </div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="explorer-error">
          <p>⚠️ {error}</p>
          <button onClick={loadMyCapsules}>Try Again</button>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="explorer-loading">
          <div className="loading-spinner" />
          <p>Scanning the blockchain for your capsules...</p>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !error && capsules.length === 0 && (
        <div className="explorer-empty">
          <div className="explorer-empty-icon">✉️</div>
          <p className="explorer-empty-title">No Capsules Yet</p>
          <p>You haven't sealed any memories yet. Create your first time capsule above!</p>
        </div>
      )}

      {/* Capsule grid */}
      {!isLoading && capsules.length > 0 && (
        <div className="explorer-grid">
          {capsules.map((capsule) => {
            const unlocked = isUnlocked(capsule.unlockTime)
            const countdown = formatCountdown(capsule.unlockTime)

            return (
              <div
                key={capsule.id}
                className={`explorer-card ${unlocked ? 'unlocked' : 'locked'}`}
              >
                {/* Header with ID + Status */}
                <div className="explorer-card-top">
                  <span className="explorer-card-id">#{capsule.id}</span>
                  <span
                    className={`explorer-card-status ${
                      unlocked ? 'unlocked' : 'locked'
                    }`}
                  >
                    {unlocked ? '🔓 Unlocked' : '🔒 Locked'}
                  </span>
                </div>

                {/* Countdown or unlocked indicator */}
                {!unlocked && countdown ? (
                  <div className="explorer-countdown">
                    <div className="explorer-countdown-label">Unlocks in</div>
                    <div className="explorer-countdown-timer">{countdown}</div>
                    {/* Progress bar */}
                    <div className="explorer-progress-bar">
                      <div
                        className="explorer-progress-fill"
                        style={{ width: `${Math.min(95, Math.max(5, ((now - (capsule.unlockTime - 86400)) / 86400) * 100))}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="explorer-unlocked-badge">
                    <span>✨ Ready to open</span>
                  </div>
                )}

                {/* Details */}
                <div className="explorer-card-details">
                  <div className="explorer-detail-row">
                    <span className="explorer-detail-label">
                      {unlocked ? 'Unlocked at' : 'Unlock date'}
                    </span>
                    <span className="explorer-detail-value">
                      {formatDate(capsule.unlockTime)}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}

export default CapsuleExplorer
