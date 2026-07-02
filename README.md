# VisionMate ♿
### *Crowdsourced PWD Accessibility Map — Real-Time · Community-Powered · AI-Assisted*

> Submitted for **SparkFest 2026** — A hackathon promoting *Public Safety, Justice, and Strong Institutions* (UN SDG 16)

---

## 🚀 About the Project

VisionMate was built during **SparkFest 2026** to address one of the most overlooked accessibility gaps in Filipino communities — the lack of real-time, reliable information about whether a sidewalk, ramp, or public space is actually usable for persons with disabilities (PWD).

Built by students, for the community.

---

## 🎯 Problem Statement

Millions of Filipinos living with mobility impairments face daily uncertainty when navigating public spaces. Broken ramps, missing curb cuts, flooded walkways, and construction-blocked paths are not reported anywhere in real time. No platform exists to crowdsource, visualize, and act on this information.

> **PWD users are left to discover barriers the hard way — by arriving and finding them impassable.**

---

## 💡 Proposed Solution

VisionMate is a **community-powered accessibility map** where any user can:
- 📍 **Drop a pin** anywhere on a live OpenStreetMap
- 📸 **Upload a photo** of a ramp, sidewalk, or obstacle
- 🤖 **Get an instant AI inspection** via Google Gemini — which rates the location's accessibility from 1–5 and flags specific hazards
- ♿ **Navigate** using Walk or Wheelchair-accessible route modes
- 🆘 **Trigger an SOS** that instantly calls a saved family member or care network contact

What sets VisionMate apart is its **zero-friction reporting pipeline**: tap → photo → AI result → pinned on the map in under 30 seconds. No forms. No manual categorization required.

---

## ⚙️ Features

| Feature | Description |
|---|---|
| 🗺️ **Live Accessibility Map** | Real-time pins from community reports, color-coded by severity |
| 🤖 **AI Photo Inspection** | Google Gemini analyzes photos and rates accessibility (1–5 scale) |
| 📍 **Draggable Report Pin** | Tap to place, drag to fine-tune, then report or navigate |
| ♿ **Dual Navigation Modes** | Walk mode & Wheelchair mode with OSRM routing |
| 🆘 **SOS Emergency Button** | One-tap call to saved Family or Care Network contacts |
| 🔔 **Push Notifications** | Browser-native alerts for nearby hazard updates |
| 🌙 **Dark Mode** | Toggle in Settings, persisted to local storage |
| 🌐 **Language Support** | Filipino, Cebuano, Ilocano (progressive rollout) |
| 👤 **Google Auth + Profile** | Sign in with Google, save emergency contacts on first use |
| 🛡️ **Privacy Controls** | View, download, or request deletion of personal data |

---

## 🧪 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 15 (App Router), Vanilla CSS |
| **Map Engine** | Leaflet.js + OpenStreetMap tiles |
| **Routing** | OSRM (Open Source Routing Machine) |
| **AI Inspection** | Google Gemini 2.0 Flash |
| **Auth & Database** | Firebase Authentication + Firestore |
| **File Storage** | Firebase Cloud Storage |
| **Deployment** | Cloudflare Pages |
| **Fonts** | Inter (Google Fonts) |

---

## 🌐 Deployed Project

| | Link |
|---|---|
| 🌍 **Live Demo** | https://visionmate.pages.dev |
| 🔗 **Backup / Mirror** | https://visionmate-nextjs.pages.dev |
| 💻 **GitHub Repository** | https://github.com/[YOUR_GITHUB]/visionmate |

---

## 📸 Screenshots

> *(Screenshots taken from the live deployment)*

### 🗺️ Main Map View
The real-time community accessibility map with color-coded severity pins.

### 📋 Report Flow
Tap → Photo → AI Inspection → Pinned on map.

### 🆘 SOS Panel
One-tap emergency calling with saved contact numbers displayed.

---

## 🏃 How to Run Locally

```bash
# 1. Clone the repository
git clone https://github.com/[YOUR_GITHUB]/visionmate.git
cd visionmate

# 2. Install dependencies
npm install

# 3. Set up environment variables
# Create a .env.local file with:
NEXT_PUBLIC_FIREBASE_API_KEY=your_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
GEMINI_API_KEY=your_gemini_key

# 4. Start the development server
npm run dev
```

Visit `http://localhost:3000`

---

## 🎯 Alignment with SparkFest 2026 Theme

VisionMate directly supports **UN SDG 16 — Peace, Justice, and Strong Institutions** by:

- **Empowering marginalized citizens** to report and document infrastructure accessibility gaps
- **Creating transparent, community-governed data** about public space conditions
- **Strengthening civic participation** by giving PWD users a voice in urban planning conversations
- **Enabling safer navigation** for one of the most vulnerable segments of the population

---

## 👨‍💻 Authors

- **Darwin Villanueva Jr.** — FAITH Colleges (Tanauan City)
- **Precious Mae Ubaldo** — PUP Main (Sta. Mesa, Manila)
- **Charmen Claire Benitez** — PUP Main (Sta. Mesa, Manila)
- **Shaina Cadlaon** — PUP Main (Sta. Mesa, Manila)

Built for SparkFest 2026

---

## 📄 License

This project is open source for educational and community purposes.
