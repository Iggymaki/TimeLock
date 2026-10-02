// =============================================================
// 👤 ProfileModal.jsx - My Profile & Capsule History
// =============================================================
// แสดงประวัติแคปซูลทั้งหมดของ Wallet ที่เชื่อมต่ออยู่
// อ่านข้อมูลจาก Smart Contract โดย iterate capsuleCount
// และ filter เฉพาะ capsules ที่ creator === walletAddress
// =============================================================

import { useState, useEffect, useCallback } from 'react'
import { Contract } from 'ethers'
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../contracts/config.js'

function ProfileModal({ walletAddress, provider, signer, onClose }) {
  const [capsules, setCapsules] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [copiedId, setCopiedId] = useState(null)

  // ─── ย่อ Address ───
  const shortenAddress = (address) => {
    if (!address) return ''
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  // ─── โหลดข้อมูลแคปซูลทั้งหมดของผู้ใช้ ───
  const loadCapsules = useCallback(async () => {
    if (!walletAddress || (!provider && !signer)) return

    setIsLoading(true)
    setError(null)

    try {
      const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer || provider)

      // อ่านจำนวนแคปซูลทั้งหมด
      const totalCount = await contract.capsuleCount()
      const total = Number(totalCount)

      if (total === 0) {
        setCapsules([])
        setIsLoading(false)
        return
      }

      // ดึงข้อมูลแคปซูลทั้งหมดและ filter ตาม creator (รองรับ ID แบบ 1-indexed)
      const userCapsules = []
      const batchSize = 10

      // วนลูปตั้งแต่ 1 ถึง total (inclusive) เพื่อไม่ให้พลาด capsule ล่าสุด
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
          // ตรวจสอบว่า creator ตรงกับกระเป๋าปัจจุบัน (ข้าม capsule ที่เป็น null หรือ ID ว่าง)
          if (capsule && capsule.creator && capsule.creator.toLowerCase() === walletAddress.toLowerCase()) {
            userCapsules.push(capsule)
          }
        }
      }

      // เรียงจากใหม่ไปเก่า
      userCapsules.sort((a, b) => b.id - a.id)
      setCapsules(userCapsules)
    } catch (err) {
      console.error('Failed to load capsules:', err)
      setError('ไม่สามารถโหลดข้อมูลแคปซูลได้ กรุณาลองใหม่')
    } finally {
      setIsLoading(false)
    }
  }, [walletAddress, provider, signer])

  useEffect(() => {
    loadCapsules()

    // ─── Real-time Event Listeners ───
    if (!provider && !signer) return
    const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer || provider)

    const onCapsuleUpdate = (id, creator) => {
      // Refresh only if the capsule belongs to the current user
      if (creator && walletAddress && creator.toLowerCase() === walletAddress.toLowerCase()) {
        loadCapsules()
      } else if (!creator) {
        // Fallback for events that might not return creator easily
        loadCapsules()
      }
    }

    contract.on('CapsuleCreated', onCapsuleUpdate)
    // If the contract has a CapsuleOpened event (optional):
    // contract.on('CapsuleOpened', onCapsuleUpdate)

    return () => {
      contract.off('CapsuleCreated', onCapsuleUpdate)
      // contract.off('CapsuleOpened', onCapsuleUpdate)
    }
  }, [loadCapsules, provider, signer, walletAddress])

  // ─── Copy Capsule ID ───
  const copyId = async (id) => {
    try {
      await navigator.clipboard.writeText(String(id))
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch {
      // Fallback
      const textArea = document.createElement('textarea')
      textArea.value = String(id)
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    }
  }

  // ─── จัดรูปแบบวันที่ ───
  const formatDate = (timestamp) => {
    const date = new Date(timestamp * 1000)
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // ─── ตรวจสอบว่าปลดล็อคแล้วหรือยัง ───
  const isUnlocked = (unlockTime) => {
    return Math.floor(Date.now() / 1000) >= unlockTime
  }

  // ─── ย่อข้อความ ───
  const truncateMessage = (msg, maxLen = 50) => {
    if (msg.length <= maxLen) return msg
    return msg.slice(0, maxLen) + '…'
  }

  return (
    <div className="profile-overlay" onClick={onClose}>
      <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
        {/* ─── Modal Header ─── */}
        <div className="profile-header">
          <div>
            <div className="profile-header-label">
              My Profile
              <button 
                onClick={loadCapsules} 
                className="btn-refresh" 
                title="Refresh History"
                style={{ background: 'none', border: 'none', cursor: 'pointer', marginLeft: '8px', fontSize: '1rem', color: 'var(--text-muted)' }}
              >
                🔄
              </button>
            </div>
            <h2 className="profile-title">Capsule History</h2>
            <p className="profile-address">
              <span className="wallet-dot" style={{ display: 'inline-block', marginRight: '6px', verticalAlign: 'middle' }} />
              {shortenAddress(walletAddress)}
            </p>
          </div>
          <button className="profile-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        {/* ─── Content ─── */}
        <div className="profile-content">
          {isLoading ? (
            <div className="profile-loading">
              <div className="loading-spinner" />
              <p>Scanning the blockchain for your capsules...</p>
            </div>
          ) : error ? (
            <div className="profile-error">
              <p>⚠️ {error}</p>
              <button className="btn-retry" onClick={loadCapsules}>
                Try Again
              </button>
            </div>
          ) : capsules.length === 0 ? (
            <div className="profile-empty">
              <div className="profile-empty-icon">✉️</div>
              <p className="profile-empty-title">No Capsules Yet</p>
              <p className="profile-empty-text">
                You haven't sealed any memories yet. Create your first time capsule to see it here.
              </p>
            </div>
          ) : (
            <>
              <div className="profile-stats">
                <span className="profile-stat">
                  📬 Total: <strong>{capsules.length}</strong> capsule{capsules.length !== 1 ? 's' : ''}
                </span>
                <span className="profile-stat">
                  🔓 Unlocked: <strong>{capsules.filter(c => isUnlocked(c.unlockTime)).length}</strong>
                </span>
                <span className="profile-stat">
                  🔒 Locked: <strong>{capsules.filter(c => !isUnlocked(c.unlockTime)).length}</strong>
                </span>
              </div>

              <div className="capsule-list">
                {capsules.map((capsule) => {
                  const unlocked = isUnlocked(capsule.unlockTime)
                  return (
                    <div key={capsule.id} className={`capsule-item ${unlocked ? 'unlocked' : 'locked'}`}>
                      {/* Capsule ID badge */}
                      <div className="capsule-item-header">
                        <span className="capsule-id-badge">
                          #{capsule.id}
                        </span>
                        <span className={`capsule-status-badge ${unlocked ? 'unlocked' : 'locked'}`}>
                          {unlocked ? '🔓 Unlocked' : '🔒 Locked'}
                        </span>
                      </div>

                      {/* Message preview */}
                      <p className="capsule-item-message">
                        {unlocked ? truncateMessage(capsule.message) : '••••••••••••••••'}
                      </p>

                      {/* Unlock time */}
                      <p className="capsule-item-time">
                        {unlocked ? '🕰️ Unsealed since' : '🕰️ Unseals on'}: {formatDate(capsule.unlockTime)}
                      </p>

                      {/* Actions */}
                      <div className="capsule-item-actions">
                        <button
                          className="btn-capsule-action"
                          onClick={() => copyId(capsule.id)}
                        >
                          {copiedId === capsule.id ? '✅ Copied!' : '📋 Copy ID'}
                        </button>
                        {unlocked && (
                          <button
                            className="btn-capsule-action primary"
                            onClick={() => {
                              // Scroll to open capsule section and close modal
                              onClose()
                              setTimeout(() => {
                                const el = document.getElementById('open-capsule-section')
                                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
                              }, 300)
                            }}
                          >
                            🔓 Go to Open
                          </button>
                        )}
                        <button
                          className="btn-capsule-action etherscan"
                          onClick={() => {
                            window.open(
                              `https://sepolia.etherscan.io/address/${CONTRACT_ADDRESS}`,
                              '_blank',
                              'noopener,noreferrer'
                            )
                          }}
                        >
                          🔍 Etherscan
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>

        {/* ─── Modal Footer ─── */}
        <div className="profile-footer">
          <button className="btn-dismiss" onClick={onClose}>
            Close ✦
          </button>
        </div>
      </div>
    </div>
  )
}

export default ProfileModal
