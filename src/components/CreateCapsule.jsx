// =============================================================
// 🔒 CreateCapsule.jsx - "Seal a New Memory" Form
// =============================================================
// ฟอร์มสร้างแคปซูลสไตล์โปสการ์ดวินเทจ
// พร้อม Tab System: Quick Timer / Calendar & Time
// =============================================================

import { useState } from 'react'
import { Contract } from 'ethers'
import { Lock } from 'lucide-react'
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../contracts/config.js'
import { resolveCapsuleIdFromReceipt, saveTxHash } from '../utils/capsuleTx.js'

// ─── Preset Timer Durations ───
const PRESET_DURATIONS = [
  { label: '1 min', seconds: 60 },
  { label: '5 min', seconds: 300 },
  { label: '10 min', seconds: 600 },
  { label: '1 hr', seconds: 3600 },
  { label: '3 hrs', seconds: 10800 },
  { label: '5 hrs', seconds: 18000 },
  { label: '7 hrs', seconds: 25200 },
  { label: '9 hrs', seconds: 32400 },
  { label: '11 hrs', seconds: 39600 },
  { label: '13 hrs', seconds: 46800 },
  { label: '15 hrs', seconds: 54000 },
  { label: '17 hrs', seconds: 61200 },
  { label: '19 hrs', seconds: 68400 },
  { label: '21 hrs', seconds: 75600 },
  { label: '24 hrs', seconds: 86400 },
]

function CreateCapsule({ signer, walletAddress, showNotification }) {
  // ─── Local State ───
  const [message, setMessage] = useState('')
  const [delayMode, setDelayMode] = useState('timer') // 'timer' | 'calendar'
  const [selectedPreset, setSelectedPreset] = useState(null) // seconds from preset
  const [targetDateTime, setTargetDateTime] = useState('') // datetime-local value
  const [isLoading, setIsLoading] = useState(false)
  const [txStatus, setTxStatus] = useState(null)
  const [isTimerExpanded, setIsTimerExpanded] = useState(false)

  // ─── คำนวณจำนวนวินาทีจากโหมดที่เลือก ───
  const getDelaySeconds = () => {
    if (delayMode === 'timer') {
      return selectedPreset
    }

    if (delayMode === 'calendar' && targetDateTime) {
      const targetTimestamp = Math.floor(new Date(targetDateTime).getTime() / 1000)
      const currentTimestamp = Math.floor(Date.now() / 1000)
      const diff = targetTimestamp - currentTimestamp
      return diff > 0 ? diff : null
    }

    return null
  }

  // ─── แสดงสรุปเวลาที่เลือก ───
  const getDelaySummary = () => {
    const seconds = getDelaySeconds()
    if (!seconds) return null

    if (seconds < 3600) {
      return `${Math.floor(seconds / 60)} minute${Math.floor(seconds / 60) !== 1 ? 's' : ''}`
    }
    if (seconds < 86400) {
      const hrs = Math.floor(seconds / 3600)
      const mins = Math.floor((seconds % 3600) / 60)
      return mins > 0 ? `${hrs} hr${hrs !== 1 ? 's' : ''} ${mins} min` : `${hrs} hr${hrs !== 1 ? 's' : ''}`
    }
    const days = Math.floor(seconds / 86400)
    const hrs = Math.floor((seconds % 86400) / 3600)
    return hrs > 0 ? `${days} day${days !== 1 ? 's' : ''} ${hrs} hr${hrs !== 1 ? 's' : ''}` : `${days} day${days !== 1 ? 's' : ''}`
  }

  // ─── คำนวณ minimum datetime สำหรับ calendar picker ───
  const getMinDateTime = () => {
    const now = new Date()
    now.setMinutes(now.getMinutes() + 1) // อย่างน้อย 1 นาทีจากตอนนี้
    return now.toISOString().slice(0, 16)
  }

  // ─── ส่ง Transaction สร้างแคปซูล ───
  const handleCreateCapsule = async () => {
    if (!walletAddress) {
      showNotification('error', '🔗 Wallet Required', 'กรุณาเชื่อมต่อ MetaMask ก่อนสร้างแคปซูล')
      return
    }

    if (!message.trim()) {
      showNotification('error', '📝 Missing Message', 'กรุณากรอกข้อความลับที่ต้องการเก็บ')
      return
    }

    const delaySeconds = getDelaySeconds()
    if (!delaySeconds || delaySeconds <= 0) {
      if (delayMode === 'calendar') {
        showNotification('error', '📅 Invalid Date', 'กรุณาเลือกวันเวลาที่อยู่ในอนาคต')
      } else {
        showNotification('error', '⏱️ No Duration Selected', 'กรุณาเลือกระยะเวลาล็อคที่ต้องการ')
      }
      return
    }

    setIsLoading(true)
    setTxStatus(null)

    try {
      const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer)

      setTxStatus({ type: 'info', text: '📡 Sending transaction to the blockchain...' })
      const tx = await contract.createCapsule(message, BigInt(delaySeconds))

      setTxStatus({ type: 'info', text: '⛏️ Awaiting confirmation on Sepolia...' })
      const receipt = await tx.wait()

      // 🔗 จำ tx hash ของแคปซูลนี้ไว้ เพื่อให้ปุ่ม Etherscan ลิงก์ไปที่ tx ได้ตรงตัว
      try {
        const capsuleId = await resolveCapsuleIdFromReceipt(signer.provider, receipt)
        if (capsuleId) saveTxHash(capsuleId, receipt.hash)
      } catch (err) {
        console.warn('Could not map capsule ID to tx hash', err)
      }

      const summary = getDelaySummary()
      setTxStatus({ type: 'success', text: '✅ Your time capsule has been sealed!' })
      showNotification(
        'success',
        '🎉 Memory Sealed!',
        `Your secret has been locked for ${summary}. It now lives immutably on the blockchain.<tx>${tx.hash}</tx>`
      )

      // Reset form
      setMessage('')
      setSelectedPreset(null)
      setTargetDateTime('')
    } catch (error) {
      console.error('Create capsule error:', error)
      setTxStatus({ type: 'error', text: '❌ Transaction failed' })
      showNotification(
        'error',
        '❌ Sealing Failed',
        error?.reason || error?.message || 'Something went wrong while sealing your capsule. Please try again.'
      )
    } finally {
      setIsLoading(false)
    }
  }

  const delaySummary = getDelaySummary()

  return (
    <section className="vintage-card" id="create-capsule-section">
      {/* Decorative stamp in corner */}
      <div className="card-stamp"><Lock size={24} strokeWidth={1.5} /></div>

      {/* ─── Card Header ─── */}
      <div className="card-header">
        <div className="card-header-label">Section I</div>
        <h2 className="card-title">Seal a New Memory</h2>
        <p className="card-subtitle">Write your secret and lock it in time</p>
      </div>

      {/* ─── Message Input (lined paper) ─── */}
      <div className="form-group">
        <label className="form-label" htmlFor="input-message">
          Secret Message
          <span className="form-label-hint">— your words, preserved forever</span>
        </label>
        <textarea
          id="input-message"
          className="form-input textarea"
          placeholder="Dear future self..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          disabled={isLoading}
          rows={4}
        />
      </div>

      {/* ─── Unlock Delay — Tab System ─── */}
      <div className="form-group">
        <label className="form-label">
          Unlock Delay
          <span className="form-label-hint">— choose when to unseal</span>
        </label>

        {/* Tab Switcher */}
        <div className="delay-tabs">
          <button
            type="button"
            className={`delay-tab ${delayMode === 'timer' ? 'active' : ''}`}
            onClick={() => setDelayMode('timer')}
            disabled={isLoading}
          >
            ⏱️ Quick Timer
          </button>
          <button
            type="button"
            className={`delay-tab ${delayMode === 'calendar' ? 'active' : ''}`}
            onClick={() => setDelayMode('calendar')}
            disabled={isLoading}
          >
            📅 Calendar & Time
          </button>
        </div>

        {/* Tab Content: Quick Timer */}
        {delayMode === 'timer' && (
          <div className="delay-panel">
            <div className="preset-grid">
              {(isTimerExpanded ? PRESET_DURATIONS : PRESET_DURATIONS.slice(0, 5)).map((preset) => (
                <button
                  key={preset.seconds}
                  type="button"
                  className={`preset-chip ${selectedPreset === preset.seconds ? 'active' : ''}`}
                  onClick={() => setSelectedPreset(preset.seconds)}
                  disabled={isLoading}
                >
                  {preset.label}
                </button>
              ))}
            </div>
            <button 
              type="button" 
              className="btn-expand-timer"
              onClick={() => setIsTimerExpanded(!isTimerExpanded)}
            >
              {isTimerExpanded ? '↑ Less Options' : '↓ More Options'}
            </button>
          </div>
        )}

        {/* Tab Content: Calendar & Time */}
        {delayMode === 'calendar' && (
          <div className="delay-panel">
            <p className="calendar-hint">
              Pick the exact date & time to unseal your capsule:
            </p>
            <input
              type="datetime-local"
              className="form-input calendar-input"
              value={targetDateTime}
              onChange={(e) => setTargetDateTime(e.target.value)}
              min={getMinDateTime()}
              disabled={isLoading}
            />
          </div>
        )}

        {/* Selected Delay Summary */}
        {delaySummary && (
          <div className="delay-summary">
            🕰️ Lock duration: <strong>{delaySummary}</strong>
          </div>
        )}
      </div>

      {/* ─── Submit Button ─── */}
      <button
        id="btn-create-capsule"
        className="btn-primary"
        onClick={handleCreateCapsule}
        disabled={isLoading || !walletAddress}
      >
        {isLoading ? (
          <>
            <div className="loading-spinner" />
            Sealing your memory...
          </>
        ) : (
          <><Lock size={18} strokeWidth={2} /> Lock in Time Capsule</>
        )}
      </button>

      {/* ─── Transaction Status ─── */}
      {txStatus && (
        <div className={`status-message ${txStatus.type}`}>
          {txStatus.text}
        </div>
      )}
    </section>
  )
}

export default CreateCapsule
