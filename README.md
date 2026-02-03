# VestaGuard: Autonomous AI Security & Compliance Orchestrator

[![VestaGuard CI](https://img.shields.io/badge/VestaGuard-v1.2.0-blue?style=flat-square&logo=shield)](https://github.com/tu-usuario/VestaGuard)
[![Backend: AutoGen](https://img.shields.io/badge/Engine-Microsoft%20AutoGen-0078d4?style=flat-square)](https://github.com/microsoft/autogen)
[![Frontend: React](https://img.shields.io/badge/UI-React%20%2B%20TypeScript-61dafb?style=flat-square)](https://reactjs.org/)

**VestaGuard** is an advanced AI-driven Security Orchestration and Automation platform. It leverages a **Multi-Agent System (MAS)** to analyze artifacts, code snippets, and logs, mapping findings directly to **ISO 27001** and **NIST 800-53** compliance frameworks.

---

## 🚀 Key Features

- **Autonomous Agentic Workflow:** Powered by **Microsoft AutoGen**. A decentralized conversation between a *Security Analyst Agent* and a *Compliance Auditor Agent* to ensure accurate threat assessment.
- **Hybrid Threat Intel:** Real-time reputation checks (mocked for demo) and context analysis using LLMs.
- **Interactive Workbench:** Clean, industrial "Command Center" UI with drag-and-drop artifact ingestion.
- **File Previsualization:** Professional-grade preview for PDF, Images, and Code/Text files.
- **Compliance Mapping:** Direct translation of technical vulnerabilities to regulatory controls.
- **Boot Sequence:** Immersive system initialization sequence for a premium SaaS experience.

## 🛠️ Tech Stack

### Frontend (The Control Plane)
- **Framework:** React 18 + TypeScript (Strict Mode).
- **Architecture:** **Hexagonal / Clean Architecture** (Decoupled Domain, Infrastructure, and UI).
- **Icons:** Lucide-React.
- **Styling:** Pure CSS (Custom Zinc/Slate Industrial Palette).

### Backend (The Neural Core)
- **Engine:** **Microsoft AutoGen** (Multi-Agent Orchestration).
- **API:** FastAPI (Python 3.11).
- **Deployment:** Dockerized for high scalability (Render/Azure/AWS ready).

---

## 📂 Project Structure

```text
VestaGuard/
├── src/                # React Frontend
│   ├── core/           # Hexagonal Domain Logic
│   ├── infrastructure/ # API Adapters & Mock Engines
│   └── ui/             # Components & Styles
├── backend/            # Python Services
│   ├── agents.py       # AutoGen Multi-Agent Logic
│   ├── main.py         # FastAPI Entry Point
│   └── Dockerfile      # Container Orchestration
└── .env.example        # Environment Configuration
```

## ⚙️ Setup & Installation

### Prerequisites
- Node.js (v18+)
- Python 3.11+
- Docker (Optional for local backend execution)

### 1. Frontend
```bash
cd Vesta
npm install
npm run dev
```

### 2. Backend (Docker)
```bash
cd backend
docker build -t vestaguard-core .
docker run -p 8000:8000 --env-file .env vestaguard-core
```

---

## 🔒 Security by Design
VestaGuard was built with the principle of **Zero Trust UI**. The frontend acts purely as an interface, while the heavy-lifting, sandboxed analysis happens in containerized environments, ensuring that malicious artifacts never compromise the orchestrator.

## 📄 License
This project is licensed under the MIT License - see the LICENSE file for details.

---
*Developed by Nahuel Marcilli - Software Engineer & Cybersecurity Specialist.*