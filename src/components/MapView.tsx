"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, Navigation, Layers } from "lucide-react";

interface MapMarker {
  lat: number;
  lng: number;
  label: string;
  type?: string;
  emoji?: string;
  time?: string;
}

interface MapViewProps {
  markers?: MapMarker[];
  center?: { lat: number; lng: number };
  zoom?: number;
  height?: string;
  showRoute?: boolean;
  className?: string;
}

const GOOGLE_MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || "";

// Type colors matching itinerary
const TYPE_COLORS: Record<string, string> = {
  Cultural: "#a855f7",
  Food: "#f59e0b",
  Shopping: "#06b6d4",
  Art: "#ec4899",
  Sightseeing: "#6366f1",
  Nature: "#22c55e",
  Transport: "#94a3b8",
  Adventure: "#ef4444",
  default: "#6366f1",
};

// Demo markers (Tokyo itinerary locations)
const DEMO_MARKERS: MapMarker[] = [
  { lat: 35.7148, lng: 139.7967, label: "Senso-ji Temple", type: "Cultural", emoji: "⛩️", time: "09:00" },
  { lat: 35.6762, lng: 139.6503, label: "Shibuya Crossing", type: "Sightseeing", emoji: "🚶", time: "18:30" },
  { lat: 35.6585, lng: 139.7015, label: "teamLab Planets", type: "Art", emoji: "🎨", time: "14:00" },
  { lat: 35.6595, lng: 139.7005, label: "Ichiran Ramen", type: "Food", emoji: "🍜", time: "20:00" },
];

export function MapView({
  markers = DEMO_MARKERS,
  center = { lat: 35.6762, lng: 139.6503 },
  zoom = 13,
  height = "400px",
  showRoute = true,
  className = "",
}: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mapType, setMapType] = useState<"roadmap" | "satellite" | "hybrid">("roadmap");

  // Load Google Maps script
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Check if already loaded
    if ((window as any).google?.maps) {
      setMapLoaded(true);
      return;
    }

    if (!GOOGLE_MAPS_KEY) {
      setError("no_key");
      return;
    }

    // Check if script already added
    if (document.getElementById("google-maps-script")) {
      const checkLoaded = setInterval(() => {
        if ((window as any).google?.maps) {
          clearInterval(checkLoaded);
          setMapLoaded(true);
        }
      }, 100);
      return;
    }

    const script = document.createElement("script");
    script.id = "google-maps-script";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_KEY}&libraries=places`;
    script.async = true;
    script.onload = () => setMapLoaded(true);
    script.onerror = () => setError("failed");
    document.head.appendChild(script);
  }, []);

  // Initialize map once loaded
  useEffect(() => {
    if (!mapLoaded || !mapRef.current || error) return;

    const map = new google.maps.Map(mapRef.current, {
      center,
      zoom,
      mapTypeId: mapType,
      styles: DARK_MAP_STYLES,
      disableDefaultUI: true,
      zoomControl: true,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
    });
    googleMapRef.current = map;

    // Add markers
    const bounds = new google.maps.LatLngBounds();
    const positions: google.maps.LatLng[] = [];

    markers.forEach((marker, index) => {
      const position = new google.maps.LatLng(marker.lat, marker.lng);
      bounds.extend(position);
      positions.push(position);

      const color = TYPE_COLORS[marker.type || "default"] || TYPE_COLORS.default;

      // Custom SVG marker
      const svgMarker = {
        url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
          <svg width="36" height="44" viewBox="0 0 36 44" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="2" y="2" width="32" height="32" rx="10" fill="${color}" stroke="white" stroke-width="2"/>
            <text x="18" y="23" font-size="16" text-anchor="middle" dominant-baseline="middle">${marker.emoji || "📍"}</text>
            <path d="M14 34 L18 43 L22 34 Z" fill="${color}" stroke="white" stroke-width="1.5"/>
          </svg>
        `)}`,
        scaledSize: new google.maps.Size(36, 44),
        anchor: new google.maps.Point(18, 44),
      };

      const gMarker = new google.maps.Marker({
        position,
        map,
        icon: svgMarker,
        title: marker.label,
        zIndex: index + 1,
      });

      // Info window
      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="padding:8px 12px;font-family:Inter,sans-serif;min-width:160px;">
            <div style="font-weight:700;font-size:14px;color:#0f172a;margin-bottom:4px;">${marker.label}</div>
            ${marker.time ? `<div style="font-size:12px;color:#64748b;">🕐 ${marker.time}</div>` : ""}
            ${marker.type ? `<div style="font-size:11px;color:${color};font-weight:600;margin-top:2px;">${marker.type}</div>` : ""}
          </div>
        `,
      });
      gMarker.addListener("click", () => infoWindow.open(map, gMarker));
    });

    // Draw route polyline
    if (showRoute && positions.length > 1) {
      new google.maps.Polyline({
        path: positions,
        geodesic: true,
        strokeColor: "#6366f1",
        strokeOpacity: 0.7,
        strokeWeight: 2.5,
        icons: [{
          icon: { path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW, scale: 3, fillColor: "#6366f1", fillOpacity: 0.8, strokeWeight: 0 },
          repeat: "80px",
        }],
        map,
      });
    }

    // Fit map to all markers
    if (markers.length > 1) {
      map.fitBounds(bounds, 60);
    }
  }, [mapLoaded, markers, center, zoom, error, showRoute]);

  // Update map type
  useEffect(() => {
    if (googleMapRef.current) {
      googleMapRef.current.setMapTypeId(mapType);
    }
  }, [mapType]);

  // ── No API key — show static fallback map ──────────────
  if (error === "no_key") {
    return <StaticMapFallback markers={markers} height={height} className={className} />;
  }

  return (
    <div style={{ position: "relative", height, borderRadius: "16px", overflow: "hidden", border: "1px solid var(--border)" }} className={className}>
      <div ref={mapRef} style={{ width: "100%", height: "100%" }} />

      {!mapLoaded && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-card)" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ width: "32px", height: "32px", borderRadius: "50%", border: "3px solid var(--border)", borderTopColor: "var(--brand-primary)", animation: "spin 0.7s linear infinite", margin: "0 auto 12px" }} />
            <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>Loading map...</div>
          </div>
        </div>
      )}

      {/* Map type toggle */}
      {mapLoaded && (
        <div style={{ position: "absolute", top: "12px", right: "12px", display: "flex", gap: "4px" }}>
          {(["roadmap", "satellite", "hybrid"] as const).map((type) => (
            <button
              key={type}
              onClick={() => setMapType(type)}
              title={type}
              style={{ padding: "6px 10px", borderRadius: "8px", border: "none", cursor: "pointer", fontSize: "11px", fontWeight: 600, background: mapType === type ? "var(--brand-primary)" : "rgba(0,0,0,0.6)", color: "white", backdropFilter: "blur(8px)", textTransform: "capitalize" }}
            >
              {type === "roadmap" ? "Map" : type === "satellite" ? "Sat" : "Hybrid"}
            </button>
          ))}
        </div>
      )}

      {/* Marker count badge */}
      {mapLoaded && markers.length > 0 && (
        <div style={{ position: "absolute", bottom: "12px", left: "12px", padding: "6px 12px", borderRadius: "20px", background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)", color: "white", fontSize: "12px", fontWeight: 600, display: "flex", alignItems: "center", gap: "5px" }}>
          <MapPin size={12} />
          {markers.length} stops
          {showRoute && <><Navigation size={10} style={{ marginLeft: "4px" }} /> Route</>}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ── Static fallback when no Maps API key ────────────────────
function StaticMapFallback({ markers, height, className }: { markers: MapMarker[]; height: string; className: string }) {
  return (
    <div
      style={{ height, borderRadius: "16px", overflow: "hidden", border: "1px solid var(--border)", background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)", position: "relative", display: "flex", flexDirection: "column" }}
      className={className}
    >
      {/* Decorative map grid */}
      <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(99,102,241,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.05) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />

      <div style={{ position: "relative", zIndex: 1, flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px" }}>
        <div style={{ fontSize: "32px", marginBottom: "12px" }}>🗺️</div>
        <div style={{ fontWeight: 700, fontSize: "15px", color: "white", marginBottom: "6px" }}>Interactive Map</div>
        <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)", textAlign: "center", marginBottom: "20px" }}>
          Add your Google Maps API key to enable<br />live maps with activity markers & routes
        </div>
        <div style={{ fontSize: "11px", color: "rgba(99,102,241,0.8)", background: "rgba(99,102,241,0.1)", padding: "6px 12px", borderRadius: "8px", fontFamily: "monospace" }}>
          NEXT_PUBLIC_GOOGLE_MAPS_KEY=your_key
        </div>
      </div>

      {/* Activity list */}
      <div style={{ position: "relative", zIndex: 1, padding: "0 16px 16px", display: "flex", gap: "8px", overflowX: "auto" }}>
        {markers.slice(0, 5).map((m, i) => (
          <div key={i} style={{ flexShrink: 0, padding: "8px 12px", borderRadius: "10px", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", color: "white" }}>
            <div style={{ fontSize: "16px", textAlign: "center", marginBottom: "2px" }}>{m.emoji || "📍"}</div>
            <div style={{ fontSize: "10px", fontWeight: 600, whiteSpace: "nowrap" }}>{m.label.length > 14 ? m.label.slice(0, 14) + "…" : m.label}</div>
            {m.time && <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", textAlign: "center" }}>{m.time}</div>}
          </div>
        ))}
      </div>

      {/* Layers icon */}
      <div style={{ position: "absolute", top: "12px", right: "12px" }}>
        <div style={{ padding: "8px", borderRadius: "10px", background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)", color: "#6366f1" }}>
          <Layers size={16} />
        </div>
      </div>
    </div>
  );
}

// ── Premium dark map styles ─────────────────────────────────
const DARK_MAP_STYLES: google.maps.MapTypeStyle[] = [
  { elementType: "geometry", stylers: [{ color: "#0f172a" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0f172a" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#94a3b8" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#1e293b" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#0f172a" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#334155" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#0c4a6e" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#064e3b" }] },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  { featureType: "administrative", elementType: "geometry", stylers: [{ color: "#334155" }] },
  { featureType: "administrative.country", elementType: "labels.text.fill", stylers: [{ color: "#94a3b8" }] },
  { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#cbd5e1" }] },
];
