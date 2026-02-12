
import React, { useEffect, useRef, useState } from 'react';
import { Map as MapGL, Source, Layer, FillLayer, LineLayer, MapRef } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { AlertTriangle } from 'lucide-react';

interface DepartmentMapProps {
  departments: string[]; // List of department codes (e.g. ['75', '33'])
}

const GEOJSON_SOURCE = "https://france-geojson.gregoiredavid.fr/repo/departements.geojson";
// Next.js exposes client env vars when prefixed with NEXT_PUBLIC_
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_PUBLIC_KEY;
const MAP_STYLE = "mapbox://styles/colinjamier/cmj647vzs002u01qudiep8rnx";

const DepartmentMap: React.FC<DepartmentMapProps> = ({ departments }) => {
  const mapRef = useRef<MapRef>(null);
  const [geoJsonData, setGeoJsonData] = useState<any>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  // Clean department codes (remove names if present, e.g., "01 - Ain" -> "01")
  const codes = departments.map(d => d.split(' ')[0].trim());

  // 1. Fetch GeoJSON Data once to allow calculating bounds for zooming
  useEffect(() => {
    fetch(GEOJSON_SOURCE)
      .then((res) => res.json())
      .then((data) => setGeoJsonData(data))
      .catch((err) => console.error("Failed to load map data", err));
  }, []);

  // 2. Handle Zoom Logic
  useEffect(() => {
    if (!mapRef.current || !geoJsonData || !isMapLoaded) return;

    // Aucun département sélectionné → rester centrée sur la France
    if (codes.length === 0) {
        mapRef.current.flyTo({
        center: [3.218369, 46.891570],
        zoom: 4.2,
        duration: 0
        });
        return;
    }

    // Un seul département sélectionné → zoom ciblé
    if (codes.length === 1) {
        const feature = geoJsonData.features.find(
        (f: any) => f.properties.code === codes[0]
        );
        if (feature) {
        const bounds = calculateBounds(feature.geometry);
        if (bounds) {
            mapRef.current.fitBounds(bounds, {
            padding: 40,
            maxZoom: 4.2,
            duration: 1500
            });
        }
        }
        return;
    }

    // Plusieurs départements → vue France
    mapRef.current.flyTo({
        center: [3.218369, 46.891570],
        zoom: 4.2,
        duration: 1500
    });
  }, [departments, geoJsonData, isMapLoaded]);


  // --- Layers ---

  // 1. Highlighted Fill (Light Blue)
  const highlightLayer: FillLayer = {
    id: 'dept-highlight',
    type: 'fill',
    paint: {
      'fill-color': '#29b5ff', // Sky-400 (Light Blue)
      'fill-opacity': 0.6,
    },
    filter: ['in', ['get', 'code'], ['literal', codes]]
  };

  // 2. Highlighted Outline (Lighter Blue/White)
  const highlightOutlineLayer: LineLayer = {
    id: 'dept-highlight-outline',
    type: 'line',
    paint: {
      'line-color': '#bae6fd', // Sky-200 (Very Light Blue)
      'line-width': 2,
      'line-opacity': 1
    },
    filter: ['in', ['get', 'code'], ['literal', codes]]
  };

  // 3. Base Outline for all departments (Subtle)
  const baseOutlineLayer: LineLayer = {
    id: 'dept-outline',
    type: 'line',
    paint: {
      'line-color': '#1e293b', // Slate-800
      'line-width': 0.5,
      'line-opacity': 0.5
    }
  };

  if (!MAPBOX_TOKEN) {
    return <div className="bg-slate-900 h-48 rounded-xl flex items-center justify-center text-slate-500 text-xs border border-white/5">Carte non disponible (Clé API manquante)</div>;
  }

  if (mapError) {
      return (
          <div className="h-64 w-full rounded-xl overflow-hidden relative border border-red-500/20 shadow-inner bg-slate-900 flex flex-col items-center justify-center text-center p-4">
              <AlertTriangle className="text-red-400 mb-2" size={24} />
              <p className="text-red-300 text-xs font-medium">Erreur chargement carte</p>
              <p className="text-slate-500 text-[10px] mt-1">{mapError}</p>
          </div>
      );
  }

  return (
    <div className="h-64 w-full rounded-xl overflow-hidden relative border border-white/5 shadow-inner bg-slate-900">
      <MapGL
        ref={mapRef}
        initialViewState={{
            longitude: 2.2137,   // centre géographique de la France
            latitude: 46.2276,
            zoom: 4.2            // zoom idéal pour voir tout le pays
        }}
        style={{ width: '100%', height: '100%' }}
        mapStyle={MAP_STYLE}
        mapboxAccessToken={MAPBOX_TOKEN}
        attributionControl={false}
        scrollZoom={false} // Prevent scrolling interfering with page scroll
        onLoad={() => setIsMapLoaded(true)}
        onError={(e) => {
            console.error("Mapbox Error Event:", e);
            let msg = "Erreur inconnue";
            
            // Handle React Map GL error object safely
            if (e.error) {
                 if (e.error.message) {
                     msg = e.error.message;
                 } else if (typeof e.error === 'string') {
                     msg = e.error;
                 } else {
                     // If it's a raw object, generic message to avoid [object Object]
                     msg = "Problème d'initialisation de la carte (Clé ou Réseau)";
                 }
            }
            
            setMapError(msg.length > 100 ? "Problème de connexion Mapbox" : msg);
        }}
      >
        {isMapLoaded && (
            <Source id="france-depts" type="geojson" data={GEOJSON_SOURCE}>
            <Layer {...baseOutlineLayer} />
            <Layer {...highlightLayer} />
            <Layer {...highlightOutlineLayer} />
            </Source>
        )}
      </MapGL>
      
      {/* Legend overlay */}
      <div className="absolute bottom-2 left-2 bg-slate-900/80 backdrop-blur px-2 py-1 rounded text-[10px] text-slate-300 border border-slate-700 pointer-events-none">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 bg-sky-400 rounded-sm border border-sky-200"></div>
          <span>Zone Ciblée</span>
        </div>
      </div>
    </div>
  );
};

// --- Helper: Calculate Bounding Box from GeoJSON Geometry ---

const ringArea = (ring: number[][]) => {
  let a = 0;
  for (let i=0, j=ring.length-1; i<ring.length; j=i++) {
    const [x1,y1] = ring[j], [x2,y2] = ring[i];
    a += (x1*y2 - x2*y1);
  }
  return Math.abs(a)/2;
};

const mainPolygon = (geometry: any) => {
  if (geometry.type === 'Polygon') return geometry;
  if (geometry.type === 'MultiPolygon') {
    let best: any = null, bestA = -1;
    for (const poly of geometry.coordinates) {
      const outer = poly[0];
      const A = ringArea(outer);
      if (A > bestA) { bestA = A; best = poly; }
    }
    return best ? { type: 'Polygon', coordinates: best } : null;
  }
  return null;
};

const calculateBounds = (geometry: any) => {
  const g = mainPolygon(geometry);
  if (!g) return null;
  const coords: number[][] = g.coordinates.flat();
  let minLng=Infinity,minLat=Infinity,maxLng=-Infinity,maxLat=-Infinity;
  for (const [lng,lat] of coords) {
    if (lng<minLng) minLng=lng; if (lng>maxLng) maxLng=lng;
    if (lat<minLat) minLat=lat; if (lat>maxLat) maxLat=lat;
  }
  return [[minLng,minLat],[maxLng,maxLat]] as [[number,number],[number,number]];
};

export default DepartmentMap;
