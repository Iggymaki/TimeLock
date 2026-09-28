# ⏳ TimeCapsule DApp - Decentralized Time-Locked Message System

เว็บบล็อกเชนแอปพลิเคชัน (DApp) สำหรับฝากข้อความลับกาลเวลา (Time Capsule) ลงบนบล็อกเชน Ethereum (Sepolia Testnet) โดยข้อความจะถูกล็อคไว้อัตโนมัติด้วย Smart Contract และสามารถอ่านได้เมื่อถึงเวลาที่กำหนดเท่านั้น

---

## 📌 ข้อมูล Smart Contract (Sepolia Testnet)

- **Network:** Sepolia Testnet
- **Contract Address:** [`0x6478C759CEe955d2A7FEf41736c5e9C53B1378c0`](https://sepolia.etherscan.io/address/0x6478C759CEe955d2A7FEf41736c5e9C53B1378c0)
- **Solidity Version:** `^0.8.0`
- **Smart Contract Code Path:** [`contracts/TimeCapsule.sol`](./contracts/TimeCapsule.sol)

---

## ✨ ฟีเจอร์หลัก (Features)

1. **Web3 Wallet Connection:** เชื่อมต่อกับ MetaMask Wallet เพื่อยืนยันตัวตนบน Sepolia Testnet
2. **Create Time Capsule:** สร้างแคปซูลใหม่โดยระบุข้อความลับและระยะเวลาปลดล็อค (วินาที/นาที/ชั่วโมง/วัน)
3. **Decentralized Storage:** ข้อมูลแคปซูลถูกจัดเก็บอย่างปลอดภัยบน Smart Contract บน Ethereum Blockchain
4. **Time Lock Validation:** ระบบ Smart Contract ตรวจสอบเวลา `block.timestamp` บน Blockchain จริง หากยังไม่ถึงเวลาเปิด ระบบจะไม่ยินยอมให้เปิดอ่านข้อความได้
5. **Real-time Countdown & Status:** แสดงสถานะแคปซูลและเวลานับถอยหลัง (Countdown Timer) แบบเรียลไทม์
6. **Open Capsule:** ปุ่มเปิดอ่านข้อความลับเมื่อเวลามาถึง พร้อมเอฟเฟกต์การแสดงผลและโมเดลแจ้งเตือน

---

## 🛠️ เทคโนโลยีที่ใช้ (Tech Stack)

### **Blockchain & Smart Contract**
- **Solidity** (`^0.8.0`) - ภาษาสำหรับเขียน Smart Contract
- **Ethers.js (v6)** - Library สำหรับสื่อสารระหว่าง Frontend กับ Ethereum Blockchain
- **MetaMask** - กระเป๋าเงินดิจิทัล (Web3 Provider)
- **Sepolia Testnet** - เครือข่ายทดสอบสำหรับ Deploy Smart Contract

### **Frontend & User Interface**
- **React** + **Vite** - Framework หลักสำหรับพัฒนา Frontend
- **Tailwind CSS** + **Custom CSS Animation** - ตกแต่ง UI ในธีม Space & Futuristic Glassmorphism
- **Lucide React** - ชุด Icon สำหรับ Interface

---

## 📁 โครงสร้างโปรเจกต์ (Project Directory Structure)

```text
Blockchain DApp Development Project/
├── contracts/
│   └── TimeCapsule.sol      # ซอร์สโค้ด Solidity Smart Contract
├── src/
│   ├── components/          # ส่วนประกอบ UI (Navbar, Form, Card, Modal ฯลฯ)
│   ├── contracts/
│   │   └── config.js        # กำหนดค่า Contract Address และ ABI
│   ├── App.jsx              # หน้าหลักของ DApp แอปพลิเคชัน
│   ├── index.css            # Stylesheets หลักและ Animations
│   └── main.jsx             # React Entry Point
├── index.html               # HTML Template
├── package.json             # รายการ Dependencies ของโปรเจกต์
└── README.md                # เอกสารประกอบโปรเจกต์
```

---

## 🚀 ขั้นตอนการติดตั้งและเปิดใช้งานโปรเจกต์ (Getting Started)

### **ข้อกำหนดเบื้องต้น (Prerequisites)**
- ติดตั้ง [Node.js](https://nodejs.org/) (เวอร์ชัน 18 ขึ้นไป)
- ติดตั้งส่วนขยาย [MetaMask](https://metamask.io/) บนเว็บเบราว์เซอร์
- มีเหรียญ Sepolia ETH ในกระเป๋าสำหรับจ่ายค่า Gas (รับได้จาก Sepolia Faucet)

### **1. ติดตั้ง Dependencies**
```bash
npm install
```

### **2. เริ่มรัน Development Server**
```bash
npm run dev
```
หลังจากนั้นเปิดเบราว์เซอร์ไปที่ `http://localhost:5173` เพื่อทดลองใช้งานแอปพลิเคชัน

---

## 📝 ฟังก์ชันหลักใน Smart Contract (`TimeCapsule.sol`)

1. **`createCapsule(string _message, uint256 _unlockDelayInSeconds)`**
   - ฟังก์ชันสำหรับสร้างแคปซูลกาลเวลา คำนวณเวลาปลดล็อคจาก `block.timestamp + delay`
2. **`openCapsule(uint256 _id)`**
   - ฟังก์ชันอ่านข้อความลับ ตรวจสอบความถูกต้องด้วย `require(block.timestamp >= unlockTime)`
3. **`capsules(uint256)` / `capsuleCount()`**
   - ฟังก์ชันสำหรับดึงข้อมูลแคปซูลและจำนวนแคปซูลทั้งหมดบนสัญญา

---

## 👥 ผู้จัดทำ (Project Members)

| รหัสนิสิต/นักศึกษา | ชื่อ-นามสกุล |
| :---: | :--- |
| `662415060` | `Sirikorn Srirojanakul` |
| `672415037` | `Punyanuch Viriyaprasit` |
| `672415061` | `Achima Rueankaew` |

---
*จัดทำขึ้นเพื่อการส่งโครงงานวิชาพัฒนา Blockchain DApp*
