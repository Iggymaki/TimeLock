// =============================================================
// 🔗 capsuleTx.js - Map Capsule ID ➜ Transaction Hash
// =============================================================
// Contract TimeCapsule ไม่มี Event และไม่ได้เก็บ tx hash ไว้
// เราจึงต้อง:
//   1) บันทึก tx hash ลง localStorage ตอนสร้างแคปซูล (เร็วที่สุด)
//   2) ถ้าไม่มีใน cache (แคปซูลเก่า / คนละเครื่อง) ➜ ค้นหาจาก Blockchain
//      โดย binary search หา block ที่ capsuleCount เพิ่มขึ้นถึง ID นั้น
//      แล้วหา tx createCapsule ใน block นั้น
// =============================================================

import { Contract, JsonRpcProvider } from 'ethers'
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../contracts/config.js'

const ETHERSCAN = 'https://sepolia.etherscan.io'
const STORAGE_KEY = `capsuleTx:${CONTRACT_ADDRESS.toLowerCase()}`
const SEPOLIA_CHAIN_ID = 11155111
// block ที่สร้างแคปซูล #1 (ก่อนหน้านี้ capsuleCount = 0 แน่นอน) ➜ ใช้เป็นจุดเริ่ม binary search
// ⚠️ ถ้า deploy contract ใหม่ ให้ตั้งเป็น 0 หรือ block ที่ deploy
const SEARCH_FROM_BLOCK = 11707522

// RPC ที่เก็บ state ย้อนหลัง (archive) ได้ ➜ จำเป็นสำหรับอ่าน capsuleCount ในอดีต
// (RPC ทั่วไปหลายเจ้าเก็บ state แค่ไม่กี่พัน block ล่าสุด)
const ARCHIVE_RPCS = ['https://sepolia.gateway.tenderly.co', 'https://sepolia.rpc.thirdweb.com']
let archiveProviders = null
const getArchiveProviders = () =>
  (archiveProviders ??= ARCHIVE_RPCS.map(
    (url) => new JsonRpcProvider(url, SEPOLIA_CHAIN_ID, { staticNetwork: true })
  ))

export const txUrl = (hash) => `${ETHERSCAN}/tx/${hash}`
export const addressUrl = (addr) => `${ETHERSCAN}/address/${addr}`

// ─── localStorage cache ───
const readCache = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}
  } catch {
    return {}
  }
}

export const getCachedTxHash = (id) => readCache()[String(id)] || null

export const saveTxHash = (id, hash) => {
  const cache = readCache()
  cache[String(id)] = hash
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cache))
}

// ─── Helpers ───
const CONTRACT_HEX = CONTRACT_ADDRESS.toLowerCase().slice(2)

// tx ที่ "เกี่ยวข้อง" กับ contract:
//  - เรียก contract ตรงๆ (tx.to === contract) หรือ
//  - เรียกผ่าน Smart Account / EIP-7702 / batch (tx.to เป็น address อื่น
//    แต่ใน calldata มี address ของ contract ฝังอยู่) ➜ Etherscan จะไม่แสดงใน
//    แท็บ Transactions ของ contract เพราะเป็น internal call
const touchesContract = (tx) =>
  tx?.to?.toLowerCase() === `0x${CONTRACT_HEX}` ||
  (tx?.data || '').toLowerCase().includes(CONTRACT_HEX)

// capsuleCount ณ block ที่กำหนด
//  - ก่อน deploy (ไม่มี code ➜ ได้ "0x") ➜ 0
//  - error อื่น (เช่น RPC prune state ทิ้งแล้ว) ➜ throw เพื่อไม่ให้ได้ผลผิด
const countAt = async (contract, blockTag) => {
  try {
    return Number(await contract.capsuleCount({ blockTag }))
  } catch (err) {
    if (err?.code === 'BAD_DATA' && err?.value === '0x') return 0
    throw err
  }
}

// tx ที่สำเร็จใน block ที่เกี่ยวข้องกับ contract (เรียงตามลำดับใน block)
const successfulContractTxs = async (provider, blockNumber, creator) => {
  const block = await provider.getBlock(blockNumber, true)
  const all = block?.prefetchedTransactions || []
  let candidates = all.filter(touchesContract)
  // fallback: ใช้ tx ที่ส่งจากกระเป๋าของ creator
  if (candidates.length === 0 && creator) {
    candidates = all.filter((tx) => tx.from?.toLowerCase() === creator.toLowerCase())
  }
  if (candidates.length <= 1) return candidates
  // มีหลาย tx ใน block เดียวกัน ➜ ตัด tx ที่ revert ออก
  const receipts = await Promise.all(candidates.map((tx) => provider.getTransactionReceipt(tx.hash)))
  return candidates.filter((_, i) => receipts[i]?.status === 1)
}

// ─── หา Capsule ID จาก receipt (ใช้ตอนสร้างแคปซูลเสร็จ) ───
export const resolveCapsuleIdFromReceipt = async (provider, receipt) => {
  const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider)
  const before = await countAt(contract, receipt.blockNumber - 1)
  const after = await countAt(contract, receipt.blockNumber)
  // กรณีปกติ: block นี้มีแคปซูลใหม่แค่อันเดียว ➜ คืออันของเรา
  if (after - before === 1) return after
  const txs = await successfulContractTxs(provider, receipt.blockNumber, receipt.from)
  const idx = txs.findIndex((tx) => tx.hash === receipt.hash)
  return idx >= 0 ? before + idx + 1 : null
}

// ค้นหาด้วย provider ตัวเดียว
const searchWith = async (provider, id, creator) => {
  const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider)

  // Binary search: block แรกที่ capsuleCount >= id
  let low = SEARCH_FROM_BLOCK
  let high = await provider.getBlockNumber()
  if ((await countAt(contract, high)) < id) return null

  while (low < high) {
    const mid = Math.floor((low + high) / 2)
    if ((await countAt(contract, mid)) >= id) high = mid
    else low = mid + 1
  }

  const before = await countAt(contract, low - 1)
  const txs = await successfulContractTxs(provider, low, creator)
  return (txs.length === 1 ? txs[0] : txs[id - before - 1])?.hash || null
}

// ─── ค้นหา tx hash ของแคปซูลจาก Blockchain ───
export const findCapsuleTxHash = async (walletProvider, id, creator) => {
  const cached = getCachedTxHash(id)
  if (cached) return cached

  const providers = [...getArchiveProviders(), walletProvider].filter(Boolean)
  for (const provider of providers) {
    try {
      const hash = await searchWith(provider, id, creator)
      if (hash) {
        saveTxHash(id, hash)
        return hash
      }
    } catch (err) {
      console.warn('Capsule tx lookup failed on a provider, trying next…', err)
    }
  }
  return null
}

// ─── เปิด Etherscan ไปที่ tx ของแคปซูล ───
// เปิดแท็บทันทีตอนคลิก (กัน popup blocker) แล้วค่อยเปลี่ยน URL เมื่อหา tx เจอ
// ถ้าหาไม่เจอ ➜ fallback ไปหน้า address ของกระเป๋า (เห็น tx ของเราเอง ไม่ปนกับคนอื่น)
export const openCapsuleOnEtherscan = async (provider, id, walletAddress) => {
  const cached = getCachedTxHash(id)
  if (cached) {
    window.open(txUrl(cached), '_blank', 'noopener,noreferrer')
    return
  }

  const win = window.open('', '_blank')
  if (win) {
    win.opener = null
    win.document.title = 'Finding transaction…'
    win.document.body.innerHTML =
      '<p style="font-family:sans-serif;padding:2rem">🔍 Finding capsule transaction on Sepolia…</p>'
  }

  let url = addressUrl(walletAddress || CONTRACT_ADDRESS)
  try {
    const hash = provider ? await findCapsuleTxHash(provider, id, walletAddress) : null
    if (hash) url = txUrl(hash)
  } catch (err) {
    console.warn(`Could not find tx for capsule #${id}`, err)
  }

  if (win) win.location.href = url
  else window.open(url, '_blank', 'noopener,noreferrer')
}
