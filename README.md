# AeroVera

### Single-Pass Drone Video to Accurate 3D Model Generation System

---

# ⚡ Quick Start

Follow these steps to run AeroVera on a new Windows PC.

## 1. Install Node.js

Download and install Node.js (18 or later):

https://nodejs.org/

After installation, open a new terminal and verify:

```bash
node --version
npm --version
```

## 2. Install Git

Download and install Git:

https://git-scm.com/

Verify the installation:

```bash
git --version
```

## 3. Clone the AeroVera repository

Open PowerShell, Command Prompt, or the VS Code terminal and run:

```bash
git clone https://github.com/Akash9801/AeroVera-SIH2026.git
```

Move into the project folder:

```bash
cd AeroVera-SIH2026
```

## 4. Install project dependencies

Run:

```bash
npm install
```

This automatically installs all packages listed in `package.json`.

## 5. Start the development server

Run:

```bash
npm run dev
```

Vite will display a local URL, usually:

```text
http://localhost:5173/
```

Open that URL in your web browser.

## 6. Stop the server

To stop the development server, press:

```text
Ctrl + C
```

## 7. Run the project again later

If you have already cloned and installed the project, you only need:

```bash
cd AeroVera-SIH2026
npm run dev
```

> **Note:** If you see `npm` or `git` is not recognized, install Node.js or Git and restart VS Code/the terminal.

---

AeroVera is an AI-enabled spatial reconstruction platform designed to transform a **single-pass drone video** into a 3D representation of the captured scene.

This project is an **SIH 2026 prototype** based on the problem statement for generating georeferenced and metrically accurate 3D models from a single drone flight.

---

## 🚀 Features

- Single-pass drone video input
- Support for 1080p / 4K drone video
- Drone flight and GPS data interface
- AI-based reconstruction workflow prototype
- Interactive 3D reconstruction viewer
- Wireframe / point-cloud visualization
- Zoom and orbit controls
- Model analysis tools
- Reconstruction pipeline status
- Export format interface
- Responsive web interface
- Saffron and white AeroVera UI

---

## 🧠 Problem

Traditional 3D reconstruction of buildings, terrain and infrastructure often requires:

- Multiple drone flights
- Extensive image overlap
- Specialized flight planning
- Significant post-processing

In situations such as disaster response, reconnaissance, infrastructure inspection and rapid mapping, there may only be one opportunity to capture the target area.

AeroVera aims to address this by using a **single drone video and available flight data** to generate a usable 3D representation of the visible scene.

---

## 🏗️ Project Status

> **Current version: Frontend Prototype**

The current version demonstrates the complete workflow:

```text
Drone Video
     ↓
Input & Flight Data
     ↓
Validation
     ↓
AI Reconstruction
     ↓
3D Model / Point Cloud
     ↓
Visualization & Analysis
```

The reconstruction backend and real 3D model generation pipeline will be integrated in a future version.

The 3D reconstruction currently displayed in the application is a **simulated/prototype visualization**.

---

# 💻 Requirements

Before running AeroVera, install:

- Node.js 18 or later
- Git

Check your installations:

```bash
node --version
npm --version
git --version
```

---

# 📥 Installation

## 1. Clone the repository

```bash
git clone https://github.com/Akash9801/AeroVera-SIH2026.git
```

Enter the project directory:

```bash
cd AeroVera-SIH2026
```

## 2. Install dependencies

```bash
npm install
```

This installs all dependencies specified in `package.json`.

You do **not** need to manually install `node_modules`.

---

# ▶️ Running the Application

Start the development server:

```bash
npm run dev
```

Vite will display a local address similar to:

```text
http://localhost:5173/
```

Open that address in your browser.

---

# 🌐 Application Pages

## 1. Overview

The landing page explains:

- The reconstruction problem
- AeroVera's approach
- How the system works
- Supported reconstruction targets
- Target capabilities
- Potential applications

## 2. Upload

The upload interface allows users to provide:

### Required

- Drone video
- GPS coordinates
- Flight metadata

### Optional

- IMU data
- Barometric altitude
- Camera intrinsic parameters
- RTK / PPK corrections

Supported video formats:

```text
MP4
MOV
AVI
MKV
```

The current prototype simulates the reconstruction process after upload.

## 3. Reconstruction

The reconstruction page provides a prototype visualization environment containing:

- Interactive terrain visualization
- Wireframe mode
- Point-cloud mode
- Zoom controls
- Reset view
- Fullscreen view
- Measurement tools
- Elevation tools
- Coordinate tools
- Layer controls
- Model information
- Export format interface
- Reconstruction pipeline status

---

# 🛠️ Technology Stack

AeroVera currently uses:

- **React**
- **Vite**
- **Tailwind CSS**
- **Lucide React**
- **HTML Canvas**

The current 3D visualization is implemented using a procedural Canvas-based renderer.

Future versions can replace the prototype renderer with a backend-generated 3D model.

---

# 📁 Project Structure

```text
AeroVera-SIH2026/
│
├── public/
│
├── src/
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
│
├── .gitignore
├── index.html
├── package.json
├── package-lock.json
├── vite.config.js
└── README.md
```

---

# 🔌 Future Backend Integration

The frontend is designed to communicate with an AI reconstruction backend in a future version.

Potential inputs:

```text
Drone Video
GPS Coordinates
Flight Metadata
IMU Data
Camera Parameters
RTK / PPK Data
```

A future API can return:

```json
{
  "model_url": "...",
  "pointcloud_url": "...",
  "processing_time": "...",
  "accuracy": "...",
  "coverage": "...",
  "coordinate_reference": "..."
}
```

The current simulated reconstruction data can then be replaced with real API responses.

---

# 🎯 Target Output

The SIH problem statement specifies these target characteristics:

| Parameter | Target |
|---|---|
| Reconstruction Type | 3D Mesh / Point Cloud |
| Processing Time | < 15 minutes for a 10-minute video |
| Spatial Accuracy | ≤ 1 m |
| Coverage | Entire visible scene |
| Visualization | Web-based / Desktop |
| Output Formats | OBJ, PLY, LAS, GeoTIFF, GLB/GLTF, FBX |

These are **target specifications from the SIH problem statement**, not claims of achieved performance by the current frontend prototype.

---

# 🌍 Potential Applications

- Border and strategic area mapping
- Disaster damage assessment
- Urban planning and smart cities
- Infrastructure inspection
- Construction progress monitoring
- Archaeological documentation
- Digital twin generation
- Reconnaissance and mission planning

---

# 👥 Development

This project is being developed as part of:

**Smart India Hackathon 2026**

**Project:** AeroVera

**Category:** Software

**Theme:** Drone / Robotics

---

# ⚠️ Disclaimer

This repository currently contains a **frontend prototype**.

The AI reconstruction engine, georeferencing pipeline, metric accuracy validation, real-time processing system and production backend are planned for future development.

Performance targets listed in this README should not be interpreted as experimentally validated results unless corresponding benchmark results are provided.

---

# 📜 License

This project is currently intended for development and demonstration purposes.

Add an appropriate open-source license if the project is later released under one.
