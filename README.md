# VisionMate ♿🗺️

**A crowdsourced, real-time PWD accessibility map powered by Gemini AI.**  
Built for **SparkFest 2026** — Empowering mobility-impaired individuals through technology.

---

## 🌐 Live Demo

**[visionmate.pages.dev](https://visionmate.pages.dev)**

---

## ✨ Features

### 🗺️ Real-Time Accessibility Map
- Live OpenStreetMap with crowdsourced accessibility pins
- **4-level severity color coding:**
  - 🟢 **Safe** — Fully accessible (rating 4.0–5.0)
  - 🟡 **Minor** — Slightly difficult (rating 3.0–3.9)
  - 🟠 **Moderate** — Significant barriers (rating 2.0–2.9)
  - 🔴 **Dangerous** — Not passable (rating 1.0–1.9)
- 🔵 **Live user location dot** with pulsing animation

### 📸 AI-Powered Inspection
- **Gemini 2.0 Flash** automatically analyzes uploaded photos
- Returns an **Accessibility Score (1.0–5.0)** with star rating
- Lists specific **positive features** (e.g. Wheelchair Ramp, Wide Entrance)
- Lists specific **warnings** (e.g. Steep Incline, No Handrails)
- **Report categories** help the AI inspect more accurately:
  - Broken Sidewalk, No Ramp, Stairs Only, Flood, Construction,
  - Blocked Sidewalk, Broken Elevator, No Accessible CR, Narrow Entrance, Others

### 🧭 Accessible Navigation
- 🔍 **Location Search** — Search any destination with autocomplete (Nominatim/OpenStreetMap)
- **Walk 🚶 / Wheelchair ♿ Mode** routing powered by OSRM
- Route automatically flags **nearby community-reported hazards**
- **"Start in Google Maps"** button for real GPS turn-by-turn navigation

### 🆘 Emergency SOS Button
- Floating **SOS button** always visible on the map
- Options: **Call Family**, **Call Caregiver**, **Share Live Location**
- Shares GPS coordinates via native share sheet or clipboard

### 📱 Mobile-First Design
- Dark glassmorphism UI optimized for outdoor use
- Works fully on mobile browsers — no app install needed

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Hosting | Cloudflare Pages (Edge Runtime) |
| Map | Leaflet + OpenStreetMap |
| Routing | OSRM (Open Source Routing Machine) |
| Geocoding | Nominatim (OpenStreetMap) |
| AI Inspection | Google Gemini 2.0 Flash |
| Database | Firebase Firestore |
| Image Storage | Cloudinary |
| Styling | Vanilla CSS (Dark Mode + Glassmorphism) |

---

## 🚀 Getting Started (Local Development)

### Prerequisites
- Node.js 18+
- npm

### Installation

```bash
git clone https://github.com/s2023102048-ux/VisionMate.git
cd VisionMate
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📱 How to Use

### Reporting a Hazard
1. **Open the app** on your mobile browser
2. **Allow location access** to center the map on your position
3. **Tap "Report"** and click anywhere on the map to set location
4. **Take a photo** of the sidewalk, ramp, entrance, or obstacle
5. **Select a category** (e.g. "Broken Sidewalk") to help the AI
6. **Gemini AI** automatically analyzes the image and gives a severity score
7. The report appears as a **colored pin** for the whole community to see

### Navigation
1. **Search** for a destination using the search bar
2. Choose **Walk 🚶** or **Wheelchair ♿** mode
3. View your route with **hazard warnings** from community reports
4. Tap **"Start in Google Maps"** for turn-by-turn GPS navigation

### Emergency
1. Tap the **SOS button** (bottom-left corner)
2. Choose **Call Family**, **Call Caregiver**, or **Share Location**

---

## 🏗️ Project Structure

```
VisionMate/
├── app/
│   ├── api/
│   │   ├── inspect/route.js    # Gemini AI image inspection (Edge)
│   │   └── upload/route.js     # Cloudinary image upload (Edge)
│   ├── globals.css             # Global styles
│   ├── layout.js               # Root layout + metadata
│   └── page.js                 # Main app page
├── components/
│   ├── EmergencyButton.js      # SOS emergency button
│   ├── Header.js               # Top navigation bar
│   ├── Map.js                  # Leaflet map with pins & routing
│   ├── NavPanel.js             # Navigation panel (walk/wheelchair)
│   ├── ReportModal.js          # Report submission modal
│   ├── SearchBar.js            # Location search with autocomplete
│   ├── LoadingOverlay.js       # Loading state overlay
│   └── Toast.js                # Toast notifications
├── lib/
│   └── firebase.js             # Firebase config & helpers
└── public/
    ├── logo.png                # App logo
    └── favicon.png             # Browser favicon
```

---

## 🔒 Security

- Gemini API key is **server-side only** (Edge Runtime) — never exposed to the browser
- Cloudinary uploads are **server-side signed** — API secret never reaches the client
- Firebase Firestore rules restrict unauthorized writes

---

## 👨‍💻 Authors

**Darwin Villanueva Jr.** — FAITH Colleges (Tanauan City)  
**Precious Mae Ubaldo** — PUP Main (Sta. Mesa, Manila)  
**Charmen Claire Benitez** — PUP Main (Sta. Mesa, Manila)  
**Shaina Cadlaon** — PUP Main (Sta. Mesa, Manila)  

Built for **SparkFest 2026**

---

## 📄 License

MIT License — Free to use, modify, and distribute.
