# AyurTrace: AI-Powered Ayurvedic Herb Traceability System

AyurTrace is a full-stack decentralized application (dApp) designed to bring transparency, authenticity, and quality assurance to the Ayurvedic supply chain. By combining **Machine Learning (TensorFlow)** for species identification and **Blockchain (Ethereum/Solidity)** for immutable record-keeping, AyurTrace ensures that every herb can be traced from the farm to the consumer.

---

## 🌟 Key Features

### 🚜 For Farmers (Producers)
- **Herb Registration:** Upload images of harvested herbs for instant AI-based species verification.
- **On-Chain Logging:** Securely record harvest location (GPS) and timestamps directly to the blockchain.
- **QR Code Generation:** Automatically generate unique QR codes for each herb batch for easy tracking.

### 🏭 For Processors
- **Batch Verification:** Scan QR codes to verify the origin and authenticity of raw materials.
- **Quality Check:** AI-assisted quality assessment to confirm herb grade and purity.
- **Processing History:** Record cleaning, drying, and packaging steps on the blockchain.

### 🛍️ For Consumers
- **End-to-End Traceability:** Scan product QR codes to see the entire journey from the specific farm to the retail shelf.
- **AI Chatbot:** Interact with an Ayurvedic expert bot (powered by Gemini AI) to learn about herb benefits and traditional uses.
- **Interactive Map:** Visualize the geographic origin of Ayurvedic ingredients.

---

## 🛠️ Tech Stack

- **Frontend:** React.js, Tailwind CSS, Framer Motion (Animations), Lucide React (Icons).
- **Backend:** FastAPI (Python), Uvicorn.
- **AI/ML:** TensorFlow (CNN for Herb Classification), Google Gemini API (Natural Language Chat).
- **Blockchain:** Solidity (Smart Contracts), Web3.py, Ganache (Local Blockchain), OpenZeppelin (Access Control).
- **Other:** QR Code generation, Leaflet.js (Mapping).

---

## 🚀 Getting Started

### Prerequisites
- Node.js & npm
- Python 3.9+
- [Ganache](https://trufflesuite.com/ganache/) (For local blockchain deployment)
- Google Gemini API Key

### Installation

1. **Clone the Repository:**
   ```bash
   git clone [https://github.com/your-username/AyurTrace.git](https://github.com/your-username/AyurTrace.git)
   cd AyurTrace
