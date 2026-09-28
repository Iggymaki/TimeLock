// =============================================================
// 🔄 TransactionFlow.jsx - Blockchain Transaction Flow Visualizer
// =============================================================
// แสดงภาพ flow ของ transaction:
// User Wallet → MetaMask → Smart Contract → Sepolia Blockchain
// พร้อม animation แบบ auto-loop วนซ้ำไม่หยุด
// =============================================================

import { useState, useEffect, useRef } from 'react'

function TransactionFlow({ walletAddress }) {
  const [activeStep, setActiveStep] = useState(-1)
  const intervalRef = useRef(null)

  useEffect(() => {
    // Auto-loop animation
    let step = -1
    const totalSteps = 4 // 0..3 = nodes, 4 = full complete, then pause & restart

    const runCycle = () => {
      step++
      if (step <= totalSteps) {
        setActiveStep(step)
      } else {
        // Pause at full-lit state, then reset
        setTimeout(() => {
          step = -1
          setActiveStep(-1)
          // Small pause before restarting
          setTimeout(() => {
            step = 0
            setActiveStep(0)
          }, 400)
        }, 1200)
      }
    }

    // Start immediately
    runCycle()
    intervalRef.current = setInterval(runCycle, 600)

    return () => clearInterval(intervalRef.current)
  }, [walletAddress])

  const steps = [
    {
      icon: '👤',
      label: 'Your Wallet',
      detail: walletAddress
        ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
        : 'Not Connected',
      color: '#8C97A5',
    },
    {
      icon: '🦊',
      label: 'MetaMask',
      detail: 'Approve & Sign',
      color: '#E2761B',
    },
    {
      icon: '📜',
      label: 'Smart Contract',
      detail: '0x6478...8c0',
      color: '#856457',
    },
    {
      icon: '⛓️',
      label: 'Sepolia Blockchain',
      detail: 'Confirmed on-chain',
      color: '#627EEA',
    },
  ]

  return (
    <section className="tx-flow-section" id="tx-flow-section">
      <div className="tx-flow-header">
        <div className="card-header-label">How It Works</div>
        <h2 className="card-title">Transaction Flow</h2>
        <p className="card-subtitle">
          See how your data travels through the blockchain
        </p>
      </div>

      <div className="tx-flow-container">
        {steps.map((step, index) => (
          <div key={index} className="tx-flow-step-wrapper">
            {/* Node */}
            <div
              className={`tx-flow-node ${activeStep >= index ? 'active' : ''} ${
                activeStep === index ? 'pulse' : ''
              }`}
              style={{
                '--node-color': step.color,
              }}
            >
              <div className="tx-flow-icon">{step.icon}</div>
              <div className="tx-flow-label">{step.label}</div>
              <div className="tx-flow-detail">{step.detail}</div>
            </div>

            {/* Arrow connector */}
            {index < steps.length - 1 && (
              <div
                className={`tx-flow-arrow ${
                  activeStep > index ? 'active' : ''
                }`}
              >
                <div className="tx-flow-arrow-line" />
                <div className="tx-flow-arrow-head">▸</div>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}

export default TransactionFlow
