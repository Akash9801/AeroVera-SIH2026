import { useState, useRef, useEffect, useCallback } from "react";
import {
  Plane, Radio, Layers, Box, Mountain, Building2, Route, Trees, Package,
  Grid3x3, Scan, ChevronRight, Upload as UploadIcon, X, CheckCircle2, Circle,
  Settings2, MapPin, Gauge, Camera, Satellite, Compass, Play, RotateCcw,
  Maximize2, Ruler, Layers3, Download, ArrowRight, Menu, Cpu, Waves,
  ShieldCheck, Landmark, HardHat, Building, Radar, TowerControl, Loader2,
} from "lucide-react";

/* ============================================================
   AEROVERA — Single-Pass Drone Video to 3D Model Generation
   Frontend prototype — SIH 2026
   ============================================================ */

const FONT_IMPORT = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&family=Inter:wght@400;500;600&display=swap');
`;

const COLORS = {
  saffron: "#E8720C",
  saffronLight: "#FFA94D",
  saffronDim: "#F4B27A",
  ink: "#17140F",
  inkSoft: "#3A362E",
  warmGray: "#7A7266",
  hair: "#E4DFD4",
  paper: "#FBFAF7",
  paperDim: "#F3F1EA",
};

/* ---------------------------------------------------------
   Utility: telemetry label
--------------------------------------------------------- */
function Telemetry({ children }) {
  return (
    <span
      style={{ fontFamily: "'IBM Plex Mono', monospace", color: COLORS.warmGray }}
      className="text-[11px] tracking-tight"
    >
      {children}
    </span>
  );
}

/* ---------------------------------------------------------
   Wireframe / point-cloud terrain canvas
   Used both as hero visual and as the reconstruction viewer
--------------------------------------------------------- */
function TerrainCanvas({ mode = "hero", wireframe = true, spin = true, resetToken = 0, zoomLevel = 1 }) {
  const canvasRef = useRef(null);
  const stateRef = useRef({ ry: 0.5, rx: 0.55, dragging: false, lastX: 0, lastY: 0, zoom: 1 });
  const rafRef = useRef(null);

  useEffect(() => {
    stateRef.current.ry = 0.5;
    stateRef.current.rx = 0.55;
    stateRef.current.zoom = 1;
  }, [resetToken]);

  useEffect(() => {
    stateRef.current.zoom = zoomLevel;
  }, [zoomLevel]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let width, height, dpr;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    // Terrain grid (procedural heightmap)
    const N = mode === "hero" ? 26 : 34;
    const size = 3.4;
    const heights = [];
    for (let i = 0; i <= N; i++) {
      const row = [];
      for (let j = 0; j <= N; j++) {
        const x = (i / N - 0.5) * size;
        const y = (j / N - 0.5) * size;
        const h =
          Math.sin(x * 1.6) * 0.18 +
          Math.cos(y * 1.3 + x * 0.6) * 0.16 +
          Math.sin((x + y) * 2.1) * 0.07;
        row.push(h);
      }
      heights.push(row);
    }
    // A few "buildings" as extruded blocks at fixed grid cells
    const buildings = mode === "hero"
      ? [{ i: 12, j: 14, w: 2, h: 0.55 }, { i: 16, j: 10, w: 1, h: 0.32 }]
      : [
          { i: 10, j: 12, w: 2, h: 0.62 },
          { i: 14, j: 18, w: 2, h: 0.4 },
          { i: 20, j: 10, w: 1, h: 0.28 },
          { i: 24, j: 20, w: 2, h: 0.5 },
        ];

    function project(x, y, z, rx, ry, zoom) {
      // rotate around Y then X
      let cx = x * Math.cos(ry) - z * Math.sin(ry);
      let cz = x * Math.sin(ry) + z * Math.cos(ry);
      let cy = y * Math.cos(rx) - cz * Math.sin(rx);
      cz = y * Math.sin(rx) + cz * Math.cos(rx);
      const perspective = 3.2 / (3.2 + cz);
      const scale = width * 0.24 * zoom * perspective;
      return {
        x: width / 2 + cx * scale,
        y: height / 2 + 0.22 * height + cy * scale * -1,
        depth: cz,
      };
    }

    function draw(time) {
      ctx.clearRect(0, 0, width, height);
      const s = stateRef.current;
      if (spin && !s.dragging) s.ry += 0.0011;

      const pts = [];
      for (let i = 0; i <= N; i++) {
        pts.push([]);
        for (let j = 0; j <= N; j++) {
          const x = (i / N - 0.5) * size;
          const y = (j / N - 0.5) * size;
          const z = heights[i][j];
          pts[i].push(project(x, z, y, s.rx, s.ry, s.zoom));
        }
      }

      // draw grid lines / mesh
      ctx.lineWidth = 1;
      for (let i = 0; i <= N; i++) {
        for (let j = 0; j <= N; j++) {
          const p = pts[i][j];
          const fade = Math.max(0.08, Math.min(1, 1 - p.depth * 0.28));
          if (wireframe) {
            if (i < N) {
              const p2 = pts[i + 1][j];
              ctx.strokeStyle = `rgba(232,114,12,${0.14 * fade})`;
              ctx.beginPath();
              ctx.moveTo(p.x, p.y);
              ctx.lineTo(p2.x, p2.y);
              ctx.stroke();
            }
            if (j < N) {
              const p2 = pts[i][j + 1];
              ctx.strokeStyle = `rgba(58,54,46,${0.10 * fade})`;
              ctx.beginPath();
              ctx.moveTo(p.x, p.y);
              ctx.lineTo(p2.x, p2.y);
              ctx.stroke();
            }
          } else {
            ctx.fillStyle = `rgba(232,114,12,${0.55 * fade})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 1.15, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      // buildings as wire boxes
      buildings.forEach((b) => {
        const x = (b.i / N - 0.5) * size;
        const y = (b.j / N - 0.5) * size;
        const baseH = heights[b.i][b.j];
        const w = (b.w / N) * size;
        const corners = [
          [x, baseH, y], [x + w, baseH, y], [x + w, baseH, y + w], [x, baseH, y + w],
          [x, baseH + b.h, y], [x + w, baseH + b.h, y], [x + w, baseH + b.h, y + w], [x, baseH + b.h, y + w],
        ].map(([cx, cy, cz]) => project(cx, cy, cz, s.rx, s.ry, s.zoom));
        const edges = [[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]];
        ctx.strokeStyle = "rgba(23,20,15,0.55)";
        ctx.lineWidth = 1.2;
        edges.forEach(([a, b2]) => {
          ctx.beginPath();
          ctx.moveTo(corners[a].x, corners[a].y);
          ctx.lineTo(corners[b2].x, corners[b2].y);
          ctx.stroke();
        });
      });

      rafRef.current = requestAnimationFrame(draw);
    }
    rafRef.current = requestAnimationFrame(draw);

    const onDown = (e) => {
      stateRef.current.dragging = true;
      stateRef.current.lastX = e.clientX ?? e.touches?.[0]?.clientX;
      stateRef.current.lastY = e.clientY ?? e.touches?.[0]?.clientY;
    };
    const onMove = (e) => {
      const s = stateRef.current;
      if (!s.dragging) return;
      const cx = e.clientX ?? e.touches?.[0]?.clientX;
      const cy = e.clientY ?? e.touches?.[0]?.clientY;
      s.ry += (cx - s.lastX) * 0.005;
      s.rx = Math.max(0.1, Math.min(1.3, s.rx + (cy - s.lastY) * 0.004));
      s.lastX = cx;
      s.lastY = cy;
    };
    const onUp = () => (stateRef.current.dragging = false);
    const onWheel = (e) => {
      e.preventDefault();
      const s = stateRef.current;
      s.zoom = Math.max(0.5, Math.min(2.4, s.zoom - e.deltaY * 0.001));
    };

    canvas.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    canvas.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
      canvas.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("wheel", onWheel);
    };
  }, [mode, wireframe, spin]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full touch-none"
      style={{ cursor: "grab" }}
    />
  );
}

/* ---------------------------------------------------------
   Nav bar
--------------------------------------------------------- */
function Navbar({ page, setPage }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const items = [
    { id: "landing", label: "Overview" },
    { id: "upload", label: "Upload" },
    { id: "reconstruction", label: "Reconstruction" },
  ];
  return (
    <header
      className="sticky top-0 z-50 border-b backdrop-blur-sm"
      style={{ borderColor: COLORS.hair, background: "rgba(251,250,247,0.9)" }}
    >
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <button
          onClick={() => setPage("landing")}
          className="flex items-center gap-2.5"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L3 20h18L12 2z" stroke={COLORS.saffron} strokeWidth="1.6" fill="none" />
            <circle cx="12" cy="14" r="1.6" fill={COLORS.saffron} />
            <path d="M12 8v3M8 20l4-6 4 6" stroke={COLORS.ink} strokeWidth="1.3" />
          </svg>
          <span
            style={{ fontFamily: "'Space Grotesk', sans-serif", color: COLORS.ink }}
            className="text-[15px] font-semibold tracking-tight"
          >
            AEROVERA
          </span>
        </button>

        <nav className="hidden md:flex items-center gap-8">
          {items.map((it) => (
            <button
              key={it.id}
              onClick={() => setPage(it.id)}
              className="text-[13.5px] transition-colors relative py-1"
              style={{
                fontFamily: "'Inter', sans-serif",
                color: page === it.id ? COLORS.ink : COLORS.warmGray,
                fontWeight: page === it.id ? 600 : 500,
              }}
            >
              {it.label}
              {page === it.id && (
                <span
                  className="absolute -bottom-[17px] left-0 right-0 h-[2px]"
                  style={{ background: COLORS.saffron }}
                />
              )}
            </button>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-2">
          <span className="relative flex h-1.5 w-1.5">
            <span
              className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60"
              style={{ background: "#3CA85A" }}
            />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ background: "#3CA85A" }} />
          </span>
          <Telemetry>SYSTEM READY</Telemetry>
        </div>

        <button className="md:hidden" onClick={() => setMenuOpen((v) => !v)}>
          <Menu size={20} color={COLORS.ink} />
        </button>
      </div>

      {menuOpen && (
        <div className="md:hidden border-t px-6 py-3 flex flex-col gap-3" style={{ borderColor: COLORS.hair }}>
          {items.map((it) => (
            <button
              key={it.id}
              onClick={() => { setPage(it.id); setMenuOpen(false); }}
              className="text-left text-sm py-1"
              style={{ color: page === it.id ? COLORS.saffron : COLORS.inkSoft, fontFamily: "'Inter', sans-serif" }}
            >
              {it.label}
            </button>
          ))}
        </div>
      )}
    </header>
  );
}

/* ---------------------------------------------------------
   LANDING PAGE
--------------------------------------------------------- */
function Landing({ setPage }) {
  const reconstructs = [
    { icon: Mountain, label: "3D Terrain" },
    { icon: Building2, label: "Buildings" },
    { icon: Route, label: "Roads & Infrastructure" },
    { icon: Trees, label: "Vegetation" },
    { icon: Package, label: "Obstacles" },
    { icon: Layers, label: "Textured Meshes" },
    { icon: Grid3x3, label: "Point Clouds" },
  ];

  const capabilities = [
    { label: "SINGLE-PASS INPUT", value: "1", unit: "flight" },
    { label: "VIDEO SUPPORT", value: "1080p / 4K", unit: "" },
    { label: "TARGET PROCESSING", value: "< 15", unit: "min / 10-min clip" },
    { label: "TARGET ACCURACY", value: "≤ 1", unit: "m" },
    { label: "OUTPUT FORMAT", value: "Mesh", unit: "/ point cloud" },
    { label: "COVERAGE", value: "100", unit: "% visible scene" },
  ];

  const applications = [
    { icon: ShieldCheck, label: "Border & Strategic Mapping" },
    { icon: HardHat, label: "Disaster Damage Assessment" },
    { icon: TowerControl, label: "Infrastructure Inspection" },
    { icon: Landmark, label: "Urban Planning" },
    { icon: Building, label: "Construction Monitoring" },
    { icon: Box, label: "Digital Twins" },
    { icon: Scan, label: "Archaeological Documentation" },
    { icon: Radar, label: "Reconnaissance & Mission Planning" },
  ];

  const steps = [
    { n: "01", title: "Capture", body: "A single-pass drone video is recorded during one uninterrupted flight over the target area.", icon: Camera },
    { n: "02", title: "Analyze", body: "Video frames, GPS track, and available sensor data are extracted and aligned.", icon: Cpu },
    { n: "03", title: "Reconstruct", body: "AI-based spatial reconstruction estimates scene geometry and builds a 3D representation.", icon: Layers3 },
    { n: "04", title: "Visualize", body: "The resulting mesh or point cloud can be inspected, measured, and exported.", icon: Scan },
  ];

  return (
    <div style={{ background: COLORS.paper }}>
      {/* HERO */}
      <section className="max-w-6xl mx-auto px-6 pt-16 pb-20 grid md:grid-cols-2 gap-10 items-center">
        <div>
          <div className="flex items-center gap-2 mb-6">
            <Satellite size={14} color={COLORS.saffron} />
            <Telemetry>SIH 2026 · SPATIAL INTELLIGENCE SYSTEM</Telemetry>
          </div>
          <h1
            style={{ fontFamily: "'Space Grotesk', sans-serif", color: COLORS.ink, lineHeight: 1.06 }}
            className="text-[42px] md:text-[54px] font-semibold tracking-tight mb-6"
          >
            Turn one drone flight into a 3D world.
          </h1>
          <p
            style={{ fontFamily: "'Inter', sans-serif", color: COLORS.inkSoft, maxWidth: "34rem" }}
            className="text-[16px] leading-relaxed mb-9"
          >
            AeroVera uses AI-powered reconstruction to transform a single-pass drone
            video into a georeferenced, metrically accurate 3D representation of the
            visible scene — no repeat flights, no extensive overlap planning.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <button
              onClick={() => setPage("upload")}
              className="flex items-center gap-2 px-6 py-3.5 text-[14px] font-medium transition-transform hover:-translate-y-0.5"
              style={{ background: COLORS.ink, color: COLORS.paper, fontFamily: "'Inter', sans-serif" }}
            >
              Start Reconstruction <ArrowRight size={15} />
            </button>
            <a
              href="#how-it-works"
              className="text-[14px] font-medium px-2 py-3.5"
              style={{ color: COLORS.inkSoft, fontFamily: "'Inter', sans-serif", borderBottom: `1px solid ${COLORS.hair}` }}
            >
              Explore how it works
            </a>
          </div>
        </div>

        <div
          className="relative h-[380px] md:h-[440px] border overflow-hidden"
          style={{ borderColor: COLORS.hair, background: "linear-gradient(180deg,#FFFFFF 0%, #F6F4EE 100%)" }}
        >
          <div className="absolute top-3 left-3 flex items-center gap-1.5 z-10">
            <Telemetry>FLIGHT_001 · 12.9716°N 77.5946°E</Telemetry>
          </div>
          <TerrainCanvas mode="hero" wireframe zoomLevel={1} />
          <div className="absolute bottom-3 right-3 z-10">
            <Telemetry>DRAG TO ORBIT</Telemetry>
          </div>
        </div>
      </section>

      {/* PROBLEM / SOLUTION */}
      <section className="border-t" style={{ borderColor: COLORS.hair, background: COLORS.paperDim }}>
        <div className="max-w-6xl mx-auto px-6 py-20">
          <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", color: COLORS.ink }} className="text-[28px] font-semibold mb-3">
            Why single-pass reconstruction?
          </h2>
          <p style={{ fontFamily: "'Inter', sans-serif", color: COLORS.inkSoft }} className="max-w-2xl mb-12 text-[15px] leading-relaxed">
            Accurate 3D reconstruction conventionally requires multiple flights and
            heavy image overlap. In disaster response, reconnaissance, or rapid
            mapping, there may only be one opportunity to capture the target area.
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="border p-7" style={{ borderColor: COLORS.hair, background: COLORS.paper }}>
              <Telemetry>TRADITIONAL WORKFLOW</Telemetry>
              <div className="mt-5 flex flex-col gap-0">
                {["Multiple flights", "High image overlap", "Extensive flight planning", "Heavy post-processing", "Delayed 3D model"].map((s, i, arr) => (
                  <div key={s}>
                    <div className="py-3 text-[14.5px]" style={{ fontFamily: "'Inter', sans-serif", color: COLORS.warmGray }}>{s}</div>
                    {i < arr.length - 1 && <div className="h-px" style={{ background: COLORS.hair }} />}
                  </div>
                ))}
              </div>
            </div>

            <div className="border p-7" style={{ borderColor: COLORS.saffron, background: COLORS.paper }}>
              <Telemetry>AEROVERA</Telemetry>
              <div className="mt-5 flex flex-col gap-0">
                {["One drone pass", "Video + flight data", "AI-based reconstruction", "3D mesh / point cloud", "Rapid spatial intelligence"].map((s, i, arr) => (
                  <div key={s}>
                    <div className="py-3 text-[14.5px] flex items-center gap-2" style={{ fontFamily: "'Inter', sans-serif", color: COLORS.ink }}>
                      <span className="w-1 h-1" style={{ background: COLORS.saffron }} />
                      {s}
                    </div>
                    {i < arr.length - 1 && <div className="h-px" style={{ background: COLORS.hair }} />}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="max-w-6xl mx-auto px-6 py-20">
        <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", color: COLORS.ink }} className="text-[28px] font-semibold mb-12">
          How it works
        </h2>
        <div className="grid md:grid-cols-4 gap-0 relative">
          <div className="hidden md:block absolute top-6 left-0 right-0 h-px" style={{ background: COLORS.hair }} />
          {steps.map((s) => (
            <div key={s.n} className="relative px-0 md:px-5 pt-0 md:pt-0 pb-6 md:border-l first:border-l-0" style={{ borderColor: COLORS.hair }}>
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-12 h-12 flex items-center justify-center border relative z-10"
                  style={{ borderColor: COLORS.saffron, background: COLORS.paper }}
                >
                  <s.icon size={18} color={COLORS.saffron} />
                </div>
                <Telemetry>{s.n}</Telemetry>
              </div>
              <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", color: COLORS.ink }} className="text-[17px] font-semibold mb-2">
                {s.title}
              </h3>
              <p style={{ fontFamily: "'Inter', sans-serif", color: COLORS.warmGray }} className="text-[13.5px] leading-relaxed">
                {s.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* WHAT AEROVERA RECONSTRUCTS */}
      <section className="border-t" style={{ borderColor: COLORS.hair, background: COLORS.paperDim }}>
        <div className="max-w-6xl mx-auto px-6 py-20">
          <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", color: COLORS.ink }} className="text-[28px] font-semibold mb-12">
            What AeroVera reconstructs
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px" style={{ background: COLORS.hair }}>
            {reconstructs.map((r) => (
              <div key={r.label} className="p-7 flex flex-col gap-4" style={{ background: COLORS.paper }}>
                <r.icon size={20} color={COLORS.ink} strokeWidth={1.5} />
                <span style={{ fontFamily: "'Inter', sans-serif", color: COLORS.inkSoft }} className="text-[13.5px] font-medium">
                  {r.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CAPABILITIES DASHBOARD */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="flex items-baseline justify-between mb-12 flex-wrap gap-2">
          <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", color: COLORS.ink }} className="text-[28px] font-semibold">
            Key capabilities
          </h2>
          <Telemetry>TARGET SPECIFICATIONS · NOT YET VALIDATED IN PROTOTYPE</Telemetry>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 border-t border-l" style={{ borderColor: COLORS.hair }}>
          {capabilities.map((c) => (
            <div key={c.label} className="border-r border-b p-7" style={{ borderColor: COLORS.hair }}>
              <Telemetry>{c.label}</Telemetry>
              <div className="mt-3 flex items-baseline gap-2">
                <span style={{ fontFamily: "'Space Grotesk', sans-serif", color: COLORS.saffron }} className="text-[30px] font-semibold">
                  {c.value}
                </span>
                {c.unit && (
                  <span style={{ fontFamily: "'Inter', sans-serif", color: COLORS.warmGray }} className="text-[12.5px]">
                    {c.unit}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* APPLICATIONS */}
      <section className="border-t" style={{ borderColor: COLORS.hair, background: COLORS.paperDim }}>
        <div className="max-w-6xl mx-auto px-6 py-20">
          <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", color: COLORS.ink }} className="text-[28px] font-semibold mb-3">
            Built for mission-critical spatial intelligence
          </h2>
          <p style={{ fontFamily: "'Inter', sans-serif", color: COLORS.inkSoft }} className="max-w-2xl mb-12 text-[15px]">
            A single reconstruction pipeline, applied wherever ground conditions
            limit repeat access.
          </p>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6">
            {applications.map((a) => (
              <div key={a.label} className="flex flex-col gap-3">
                <a.icon size={19} color={COLORS.saffron} strokeWidth={1.6} />
                <span style={{ fontFamily: "'Inter', sans-serif", color: COLORS.ink }} className="text-[13.5px] leading-snug">
                  {a.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="max-w-6xl mx-auto px-6 py-24 text-center">
        <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", color: COLORS.ink }} className="text-[32px] font-semibold mb-8">
          Ready to reconstruct the scene?
        </h2>
        <button
          onClick={() => setPage("upload")}
          className="inline-flex items-center gap-2 px-7 py-4 text-[14.5px] font-medium transition-transform hover:-translate-y-0.5"
          style={{ background: COLORS.saffron, color: "#fff", fontFamily: "'Inter', sans-serif" }}
        >
          Upload Drone Video <ArrowRight size={16} />
        </button>
      </section>

      <Footer />
    </div>
  );
}

function Footer() {
  return (
    <footer className="border-t" style={{ borderColor: COLORS.hair }}>
      <div className="max-w-6xl mx-auto px-6 py-8 flex items-center justify-between flex-wrap gap-3">
        <Telemetry>AEROVERA · AI SPATIAL RECONSTRUCTION</Telemetry>
        <Telemetry>SIH 2026 PROTOTYPE — BACKEND INTEGRATION PENDING</Telemetry>
      </div>
    </footer>
  );
}

/* ---------------------------------------------------------
   UPLOAD PAGE
--------------------------------------------------------- */
function UploadPage({ setPage }) {
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const inputRef = useRef(null);

  const acceptFile = (f) => {
    if (!f) return;
    setFile({
      name: f.name,
      size: (f.size / (1024 * 1024)).toFixed(1),
    });
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    acceptFile(e.dataTransfer.files?.[0]);
  };

  const checks = [
    { label: "Video format supported", ok: !!file },
    { label: "Resolution detected — 4K · 30 FPS", ok: !!file },
    { label: "GPS data available", ok: true },
    { label: "Flight metadata available", ok: true },
    { label: "Input ready for reconstruction", ok: !!file },
  ];
  const allReady = checks.every((c) => c.ok);

  const startReconstruction = () => {
    setProcessing(true);
    setProgress(0);
    const id = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(id);
          setTimeout(() => setPage("reconstruction"), 300);
          return 100;
        }
        return p + 4;
      });
    }, 90);
  };

  return (
    <div style={{ background: COLORS.paper }} className="max-w-5xl mx-auto px-6 py-16">
      <div className="flex items-center gap-2 mb-4">
        <Radio size={13} color={COLORS.saffron} />
        <Telemetry>ACQUISITION CONSOLE</Telemetry>
      </div>
      <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", color: COLORS.ink }} className="text-[34px] font-semibold mb-2">
        Initialize reconstruction
      </h1>
      <p style={{ fontFamily: "'Inter', sans-serif", color: COLORS.inkSoft }} className="text-[15px] mb-12 max-w-xl">
        Provide the drone video and available flight data to begin spatial reconstruction.
      </p>

      {/* Upload zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className="border-2 border-dashed cursor-pointer transition-colors flex flex-col items-center justify-center text-center px-6"
        style={{
          borderColor: dragOver ? COLORS.saffron : COLORS.hair,
          background: dragOver ? "#FFF6EC" : COLORS.paperDim,
          minHeight: file ? "auto" : "260px",
          padding: file ? "24px" : undefined,
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept="video/mp4,video/quicktime,video/x-msvideo,video/x-matroska"
          className="hidden"
          onChange={(e) => acceptFile(e.target.files?.[0])}
        />
        {!file ? (
          <>
            <UploadIcon size={26} color={COLORS.saffron} strokeWidth={1.5} className="mb-4" />
            <p style={{ fontFamily: "'Inter', sans-serif", color: COLORS.ink }} className="text-[15px] font-medium mb-1">
              Drag and drop your drone video, or click to browse
            </p>
            <Telemetry>MP4 · MOV · AVI · MKV — recommended: 1080p or 4K</Telemetry>
          </>
        ) : (
          <div className="w-full flex items-center justify-between">
            <div className="flex items-center gap-3 text-left">
              <Plane size={18} color={COLORS.saffron} />
              <div>
                <div style={{ fontFamily: "'Inter', sans-serif", color: COLORS.ink }} className="text-[14px] font-medium">
                  {file.name}
                </div>
                <Telemetry>{file.size} MB · duration detected on ingest</Telemetry>
              </div>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); setFile(null); }}
              className="p-2 hover:bg-white/60"
            >
              <X size={16} color={COLORS.warmGray} />
            </button>
          </div>
        )}
      </div>

      {/* Flight data */}
      <div className="mt-12">
        <div className="flex items-center gap-2 mb-6">
          <MapPin size={14} color={COLORS.ink} />
          <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", color: COLORS.ink }} className="text-[18px] font-semibold">
            Acquisition data
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 gap-px border" style={{ background: COLORS.hair, borderColor: COLORS.hair }}>
          <FieldBlock required label="GPS coordinates" value="12.9716° N, 77.5946° E" icon={Compass} />
          <FieldBlock required label="Flight altitude" value="120 m" icon={Gauge} />
          <FieldBlock required label="Camera" value="4K · 30 FPS" icon={Camera} />
          <FieldBlock required label="Flight metadata" value="Single pass · 6m 40s" icon={Route} />
        </div>

        <button
          onClick={() => setAdvancedOpen((v) => !v)}
          className="mt-4 flex items-center gap-2 text-[13.5px]"
          style={{ fontFamily: "'Inter', sans-serif", color: COLORS.warmGray }}
        >
          <Settings2 size={14} />
          Advanced sensor data (optional)
          <ChevronRight size={14} style={{ transform: advancedOpen ? "rotate(90deg)" : "none", transition: "transform 0.15s" }} />
        </button>

        {advancedOpen && (
          <div className="grid sm:grid-cols-2 gap-px border mt-3" style={{ background: COLORS.hair, borderColor: COLORS.hair }}>
            <FieldBlock label="IMU data" value="Not provided" muted icon={Waves} />
            <FieldBlock label="Barometric altitude" value="Not provided" muted icon={Gauge} />
            <FieldBlock label="Camera intrinsics" value="Not provided" muted icon={Camera} />
            <FieldBlock label="RTK / PPK corrections" value="Not provided" muted icon={Satellite} />
          </div>
        )}
      </div>

      {/* Validation */}
      <div className="mt-12">
        <div className="flex items-center gap-2 mb-6">
          <ShieldCheck size={14} color={COLORS.ink} />
          <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", color: COLORS.ink }} className="text-[18px] font-semibold">
            Validation
          </h2>
        </div>
        <div className="border" style={{ borderColor: COLORS.hair }}>
          {checks.map((c, i) => (
            <div
              key={c.label}
              className="flex items-center gap-3 px-5 py-3.5"
              style={{ borderBottom: i < checks.length - 1 ? `1px solid ${COLORS.hair}` : "none" }}
            >
              {c.ok ? <CheckCircle2 size={16} color={COLORS.saffron} /> : <Circle size={16} color={COLORS.hair} />}
              <span
                style={{ fontFamily: "'Inter', sans-serif", color: c.ok ? COLORS.ink : COLORS.warmGray }}
                className="text-[13.5px]"
              >
                {c.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Start */}
      <div className="mt-12">
        {!processing ? (
          <button
            disabled={!allReady}
            onClick={startReconstruction}
            className="w-full flex items-center justify-center gap-2 py-5 text-[15px] font-medium transition-opacity"
            style={{
              background: allReady ? COLORS.saffron : COLORS.hair,
              color: allReady ? "#fff" : COLORS.warmGray,
              fontFamily: "'Inter', sans-serif",
              cursor: allReady ? "pointer" : "not-allowed",
            }}
          >
            Start Reconstruction <ArrowRight size={16} />
          </button>
        ) : (
          <div className="border p-6" style={{ borderColor: COLORS.hair }}>
            <div className="flex items-center justify-between mb-3">
              <span className="flex items-center gap-2 text-[13.5px]" style={{ fontFamily: "'Inter', sans-serif", color: COLORS.ink }}>
                <Loader2 size={14} className="animate-spin" color={COLORS.saffron} />
                Processing single-pass reconstruction…
              </span>
              <Telemetry>{progress}%</Telemetry>
            </div>
            <div className="h-1.5 w-full" style={{ background: COLORS.hair }}>
              <div className="h-1.5 transition-all" style={{ width: `${progress}%`, background: COLORS.saffron }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function FieldBlock({ label, value, required, muted, icon: Icon }) {
  return (
    <div className="p-5" style={{ background: COLORS.paper }}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon size={13} color={muted ? COLORS.hair : COLORS.saffron} />
          <span style={{ fontFamily: "'Inter', sans-serif", color: COLORS.warmGray }} className="text-[12px]">
            {label}
          </span>
        </div>
        {required ? (
          <Telemetry>REQUIRED</Telemetry>
        ) : (
          <Telemetry>OPTIONAL</Telemetry>
        )}
      </div>
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", color: muted ? COLORS.warmGray : COLORS.ink }} className="text-[14px]">
        {value}
      </div>
      {!muted && (
        <div className="mt-1">
          <Telemetry>DEMO DATA</Telemetry>
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------
   RECONSTRUCTION PAGE
--------------------------------------------------------- */
function ReconstructionPage() {
  const [wireframe, setWireframe] = useState(true);
  const [resetToken, setResetToken] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [fullscreen, setFullscreen] = useState(false);
  const [activeTool, setActiveTool] = useState(null);

  const stats = [
    { label: "Reconstruction Type", value: "3D Mesh" },
    { label: "Coverage", value: "Entire visible scene" },
    { label: "Estimated Accuracy", value: "≤ 1 m" },
    { label: "Processing Time", value: "08:42" },
    { label: "Input", value: "4K Drone Video" },
    { label: "Coordinate Reference", value: "Georeferenced" },
  ];

  const exportFormats = ["GLB / GLTF", "OBJ", "PLY", "LAS", "GeoTIFF", "FBX"];

  const tools = [
    { id: "distance", label: "Measure Distance", icon: Ruler },
    { id: "area", label: "Measure Area", icon: Grid3x3 },
    { id: "elevation", label: "Elevation", icon: Mountain },
    { id: "coords", label: "Coordinates", icon: MapPin },
    { id: "layers", label: "Layer Toggle", icon: Layers },
    { id: "points", label: "Point Cloud", icon: Grid3x3 },
    { id: "mesh", label: "Mesh", icon: Box },
    { id: "textures", label: "Textures", icon: Layers3 },
  ];

  const pipeline = [
    { label: "Video Ingest", done: true },
    { label: "Frame Analysis", done: true },
    { label: "Spatial Reconstruction", done: true },
    { label: "Georeferencing", done: true },
    { label: "3D Model Generation", done: true },
    { label: "Visualization", done: false },
  ];

  return (
    <div style={{ background: COLORS.paper }} className="max-w-6xl mx-auto px-6 py-16">
      <div className="flex items-center gap-2 mb-4">
        <CheckCircle2 size={13} color={COLORS.saffron} />
        <Telemetry>PIPELINE COMPLETE · SIMULATED OUTPUT</Telemetry>
      </div>
      <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", color: COLORS.ink }} className="text-[34px] font-semibold mb-2">
        Reconstruction complete
      </h1>
      <p style={{ fontFamily: "'Inter', sans-serif", color: COLORS.inkSoft }} className="text-[15px] mb-10 max-w-xl">
        Single-pass aerial data transformed into a 3D spatial model.
      </p>

      <div className="grid lg:grid-cols-[1fr_320px] gap-6">
        {/* Viewer */}
        <div className="flex flex-col gap-3">
          <div
            className="relative border"
            style={{
              borderColor: COLORS.hair,
              height: fullscreen ? "80vh" : "460px",
              background: "linear-gradient(180deg,#FFFFFF 0%, #F6F4EE 100%)",
            }}
          >
            <div className="absolute top-3 left-3 z-10">
              <Telemetry>MODEL_VIEWER · DRAG TO ORBIT · SCROLL TO ZOOM</Telemetry>
            </div>
            <TerrainCanvas mode="viewer" wireframe={wireframe} spin={false} resetToken={resetToken} zoomLevel={zoom} />

            <div className="absolute bottom-3 left-3 flex items-center gap-2 z-10">
              <button
                onClick={() => setResetToken((t) => t + 1)}
                className="p-2 border bg-white/80 hover:bg-white"
                style={{ borderColor: COLORS.hair }}
                title="Reset view"
              >
                <RotateCcw size={14} color={COLORS.ink} />
              </button>
              <button
                onClick={() => setZoom((z) => Math.min(2.4, z + 0.2))}
                className="px-2.5 py-2 border bg-white/80 hover:bg-white text-[12px]"
                style={{ borderColor: COLORS.hair, fontFamily: "'IBM Plex Mono', monospace" }}
              >
                +
              </button>
              <button
                onClick={() => setZoom((z) => Math.max(0.5, z - 0.2))}
                className="px-2.5 py-2 border bg-white/80 hover:bg-white text-[12px]"
                style={{ borderColor: COLORS.hair, fontFamily: "'IBM Plex Mono', monospace" }}
              >
                −
              </button>
              <button
                onClick={() => setWireframe((w) => !w)}
                className="px-3 py-2 border bg-white/80 hover:bg-white text-[11.5px]"
                style={{ borderColor: COLORS.hair, fontFamily: "'IBM Plex Mono', monospace", color: COLORS.ink }}
              >
                {wireframe ? "WIREFRAME" : "POINT CLOUD"}
              </button>
            </div>

            <button
              onClick={() => setFullscreen((f) => !f)}
              className="absolute bottom-3 right-3 p-2 border bg-white/80 hover:bg-white z-10"
              style={{ borderColor: COLORS.hair }}
              title="Fullscreen"
            >
              <Maximize2 size={14} color={COLORS.ink} />
            </button>
          </div>

          {/* Analysis toolbar */}
          <div className="flex flex-wrap gap-px border" style={{ background: COLORS.hair, borderColor: COLORS.hair }}>
            {tools.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTool(t.id === activeTool ? null : t.id)}
                className="flex items-center gap-2 px-4 py-3 flex-1 min-w-[130px] justify-center"
                style={{
                  background: activeTool === t.id ? "#FFF6EC" : COLORS.paper,
                }}
              >
                <t.icon size={14} color={activeTool === t.id ? COLORS.saffron : COLORS.warmGray} />
                <span
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    color: activeTool === t.id ? COLORS.ink : COLORS.warmGray,
                    fontSize: "12.5px",
                  }}
                >
                  {t.label}
                </span>
              </button>
            ))}
          </div>

          {/* Pipeline timeline */}
          <div className="border" style={{ borderColor: COLORS.hair }}>
            {pipeline.map((p, i) => (
              <div
                key={p.label}
                className="flex items-center justify-between px-5 py-3"
                style={{ borderBottom: i < pipeline.length - 1 ? `1px solid ${COLORS.hair}` : "none" }}
              >
                <span style={{ fontFamily: "'Inter', sans-serif", color: COLORS.ink }} className="text-[13px]">
                  {p.label}
                </span>
                {p.done ? (
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 size={13} color={COLORS.saffron} />
                    <Telemetry>COMPLETE</Telemetry>
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60" style={{ background: COLORS.saffron }} />
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ background: COLORS.saffron }} />
                    </span>
                    <Telemetry>READY</Telemetry>
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Side panel */}
        <div className="flex flex-col gap-6">
          <div className="border" style={{ borderColor: COLORS.hair }}>
            <div className="px-5 py-4 border-b" style={{ borderColor: COLORS.hair }}>
              <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", color: COLORS.ink }} className="text-[15px] font-semibold">
                Model intelligence
              </h2>
            </div>
            {stats.map((s, i) => (
              <div
                key={s.label}
                className="px-5 py-3.5 flex items-center justify-between"
                style={{ borderBottom: i < stats.length - 1 ? `1px solid ${COLORS.hair}` : "none" }}
              >
                <span style={{ fontFamily: "'Inter', sans-serif", color: COLORS.warmGray }} className="text-[12.5px]">
                  {s.label}
                </span>
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", color: COLORS.ink }} className="text-[12.5px]">
                  {s.value}
                </span>
              </div>
            ))}
            <div className="px-5 py-3 flex items-center gap-2" style={{ borderTop: `1px solid ${COLORS.hair}` }}>
              <Telemetry>ALL VALUES ARE PROTOTYPE / SIMULATED</Telemetry>
            </div>
          </div>

          <div className="border" style={{ borderColor: COLORS.hair }}>
            <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: COLORS.hair }}>
              <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", color: COLORS.ink }} className="text-[15px] font-semibold">
                Export model
              </h2>
              <Download size={14} color={COLORS.warmGray} />
            </div>
            <div className="grid grid-cols-2 gap-px" style={{ background: COLORS.hair }}>
              {exportFormats.map((f) => (
                <button
                  key={f}
                  onClick={() => alert("Backend integration pending — this will export a real " + f + " file once AeroVera's reconstruction API is connected.")}
                  className="px-4 py-4 text-left hover:bg-[#FFF6EC] transition-colors"
                  style={{ background: COLORS.paper }}
                >
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", color: COLORS.ink }} className="text-[12.5px]">
                    {f}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
   ROOT
--------------------------------------------------------- */
export default function App() {
  const [page, setPage] = useState("landing");

  return (
    <div style={{ minHeight: "100vh", background: COLORS.paper }}>
      <style>{FONT_IMPORT}</style>
      <Navbar page={page} setPage={setPage} />
      {page === "landing" && <Landing setPage={setPage} />}
      {page === "upload" && <UploadPage setPage={setPage} />}
      {page === "reconstruction" && <ReconstructionPage />}
    </div>
  );
}
