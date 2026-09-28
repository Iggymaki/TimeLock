// =============================================================
// 🧭 Navbar.jsx - Vintage Postal Navigation & Wallet Connect
// =============================================================
// แถบนำทางสไตล์จดหมายวินเทจ พร้อมเมนู pill-shaped
// ปุ่ม Connect Wallet และปุ่ม My Profile
// =============================================================

import { useState } from 'react'
import { BrowserProvider } from 'ethers'

function Navbar({ walletAddress, setWalletAddress, setProvider, setSigner, showNotification, onOpenProfile }) {
  const [isConnecting, setIsConnecting] = useState(false)

  // ─── ย่อ Address ───
  const shortenAddress = (address) => {
    if (!address) return ''
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  // ─── เชื่อมต่อ MetaMask Wallet ───
  const connectWallet = async () => {
    if (!window.ethereum) {
      showNotification(
        'error',
        '🦊 MetaMask Not Found',
        'กรุณาติดตั้ง MetaMask Extension ก่อนใช้งาน DApp นี้'
      )
      return
    }

    setIsConnecting(true)

    try {
      const browserProvider = new BrowserProvider(window.ethereum)
      
      // บังคับให้ MetaMask ถามยืนยันการเชื่อมต่อทุกครั้ง
      await browserProvider.send('wallet_requestPermissions', [
        { eth_accounts: {} }
      ])
      
      const accounts = await browserProvider.send('eth_requestAccounts', [])
      const walletSigner = await browserProvider.getSigner()

      setProvider(browserProvider)
      setSigner(walletSigner)
      setWalletAddress(accounts[0])

      showNotification(
        'success',
        '✅ Wallet Connected',
        `เชื่อมต่อสำเร็จ: ${shortenAddress(accounts[0])}`
      )
    } catch (error) {
      console.error('Wallet connection error:', error)
      showNotification(
        'error',
        '❌ Connection Failed',
        'ไม่สามารถเชื่อมต่อ MetaMask ได้ กรุณาลองใหม่อีกครั้ง'
      )
    } finally {
      setIsConnecting(false)
    }
  }

  // ─── ตัดการเชื่อมต่อ Wallet (Logout) ───
  const disconnectWallet = () => {
    setWalletAddress(null)
    setProvider(null)
    setSigner(null)
    showNotification('info', '👋 Disconnected', 'กระเป๋าของคุณถูกตัดการเชื่อมต่อจากระบบแล้ว')
  }

  // ─── Smooth scroll navigation ───
  const scrollTo = (id) => {
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <nav className="navbar">
      {/* ─── Brand / Logo ─── */}
      <div className="navbar-brand">
        <div className="navbar-logo">✉️</div>
        <div>
          <div className="navbar-title">TimeLock</div>
          <div className="navbar-subtitle">Digital Time Capsule</div>
        </div>
      </div>

      {/* ─── Navigation Pills ─── */}
      <div className="navbar-menu">
        <button className="nav-pill" onClick={() => scrollTo('tx-flow-section')}>
          Flow
        </button>
        <button className="nav-pill" onClick={() => scrollTo('create-capsule-section')}>
          Seal
        </button>
        <button className="nav-pill" onClick={() => scrollTo('open-capsule-section')}>
          Open
        </button>
        <button className="nav-pill" onClick={() => scrollTo('explorer-section')}>
          My Capsule
        </button>
      </div>

      {/* ─── Right Actions: Profile + Connect Wallet ─── */}
      <div className="navbar-actions">
        {/* My Profile — visible only when wallet is connected */}
        {walletAddress && (
          <>
            <button
              id="btn-my-profile"
              className="btn-profile"
              onClick={onOpenProfile}
            >
              👤 My Profile
            </button>
            <button
              id="btn-logout"
              className="btn-profile logout-btn"
              onClick={disconnectWallet}
              title="Disconnect Wallet"
              style={{ padding: '0.55rem 0.8rem' }}
            >
              🔌 Logout
            </button>
          </>
        )}

        {/* Connect Wallet */}
        <button
          id="btn-connect-wallet"
          className={`btn-connect ${walletAddress ? 'connected' : ''}`}
          onClick={connectWallet}
          disabled={isConnecting}
        >
          {isConnecting ? (
            <>
              <div className="loading-spinner" />
              <span>Connecting...</span>
            </>
          ) : walletAddress ? (
            <>
              <img src="/metamask-logo.png" alt="MetaMask" className="metamask-logo-small" />
              <span>{shortenAddress(walletAddress)}</span>
            </>
          ) : (
            <>
              <img src="/metamask-logo.png" alt="MetaMask" className="metamask-logo" />
              <span>Connect Wallet</span>
            </>
          )}
        </button>
      </div>
    </nav>
  )
}

export default Navbar
