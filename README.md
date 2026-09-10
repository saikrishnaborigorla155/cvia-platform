# CVIA Platform — Computer Vision Integrity Assurance

[![Deploy with Vercel](https://vercel.com/button)](https://sih-cvia-platform.vercel.app)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.2-61dafb.svg)](https://react.dev/)

> **SIH26228 · Ministry of Defence / DGIS**  
> A defense-grade platform engineered to ensure the authenticity, provenance, and tamper-resistance of computer vision datasets, deep learning model weights, and inference pipelines.

🌐 **Live Production Deployment**: [https://sih-cvia-platform.vercel.app](https://sih-cvia-platform.vercel.app)

---

## 🏛️ System Architecture

```
                        MILITARY OPERATOR / COMMAND
                                    │
                                    ▼
                     FRONTEND / UI LAYER (React 19 + Vite)
                     ├── Verification Console (/verify)
                     ├── Mission Dashboard (/console)
                     ├── Data, Model & Provenance Analyzers
                     ├── Operator Session Switcher (Topbar)
                     └── Unified Design System (CSS Tokens)
                                    │
                                    │ Bearer Token Authentication
                                    ▼
                      BACKEND / API LAYER (/api/*)
                     ├── Operator Auth Controller (/api/auth)
                     ├── Verification Lifecycle Engine (/api/verifications)
                     ├── Asset Registry Service (/api/assets)
                     └── Immutable Audit Controller (/api/audit)
                                    │
                    ┌───────────────┴───────────────┐
                    ▼                               ▼
          SUPABASE / POSTGRESQL            ASSURANCE ENGINE
          ├── cvia_users                   ├── Cryptographic Hashing (SHA-256)
          ├── verifications                ├── Perceptual Hash Clustering (pHash)
          ├── database_assets              ├── Contributor Risk Analysis
          ├── ingest_history               └── Immutable Hash-Chained Audit Logs
          └── audit_events
```

---

## 🚀 Key Capabilities

### 1. Multi-User Isolation & Operator Authentication
- Multi-tier operator session validation via signed bearer tokens.
- Strict data isolation across military units (e.g. Unit Alpha `C01`, Unit Delta `C04`, Unit Golf `C07`).
- Queries enforce session user boundaries, preventing cross-unit data leakage.

### 2. Persistent Verification Records & Refresh Stability
- Verification runs (`VER-2026-00124`, etc.) are computed and stored directly in PostgreSQL / Supabase.
- Full state persistence across page reloads and browser sessions.
- Telemetry captures exact duplicates, near duplicates, malfunction data, and health scoring.

### 3. Comprehensive Computer Vision Assurance
- **Data Integrity**: Batch duplicate detection, perceptual hash clustering (pHash), label distribution anomalies, and out-of-distribution (OOD) flagging.
- **Model Integrity**: Cryptographic weight fingerprinting, adversarial perturbation detection, and architectural validation.
- **Cryptographic Provenance**: End-to-end hash chaining from contributor ingestion through training checkpoint to inference output.
- **Distribution Shift**: Jensen-Shannon divergence and distribution drift tracking against certified baselines.
- **Inference Nonce & Replay Detection**: Cryptographic binding to prevent replay attacks and model substitutions.
- **Tamper-Evident Audit Trail**: Chronological, immutable cryptographic block logs with verification hashes.

---

## 🛠️ Quickstart Guide

### Prerequisites
- Node.js 18+ or 20+
- npm or yarn

### Installation
```bash
# Clone repository
git clone https://github.com/saikrishnaborigorla155/cvia-platform.git
cd cvia-platform

# Install dependencies
npm install
```

### Local Development
```bash
# Start local development server with integrated API middleware
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### Type Check & Production Build
```bash
# Type check and build client bundle
npm run build

# Run Oxlint
npm run lint

# Preview production build locally
npm run preview
```

---

## 🔐 Environment Configuration

Create a `.env.local` file in the root directory:

```env
# Supabase Cloud Database Configuration
VITE_SUPABASE_URL=https://<project-id>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
```
*Note: The platform features a built-in air-gapped simulation mode with automatic fallback credentials, allowing full functionality even when disconnected from the cloud.*

---

## 🗄️ Database Schema & Migrations

The database migration script is provided in [`supabase_schema_v2.sql`](supabase_schema_v2.sql). It can be executed directly in the Supabase SQL Editor:
- Creates `cvia_users` and `verifications` tables.
- Adds `user_id` multi-user isolation columns to `database_assets`, `ingest_history`, and `audit_events`.
- Configures Row Level Security (RLS) policies and performance indexes.

---

## 📜 Problem Statement Compliance

- **Problem ID**: SIH26228
- **Organization**: Ministry of Defence / Defence Geospatial Information Services (DGIS)
- **Domain**: Trustworthy AI & Computer Vision Security

---

## 📄 License
This project is licensed under the MIT License.
