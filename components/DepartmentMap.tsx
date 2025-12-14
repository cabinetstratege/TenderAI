import React, { useEffect, useRef, useState } from 'react';
import { Map, Source, Layer, FillLayer, LineLayer, MapRef } from 'react-map-gl';

interface DepartmentMapProps {
  departments: string[]; // List of department codes (e.g. ['75', '33'])
}

const GEOJSON_SOURCE = "https://france-geojson.gregoiredavid.fr/repo/departements.geojson";
// Use process.env or fallback to the direct string to ensure it works in all environments
const MAPBOX_TOKEN = process.env.MAPBOX_PUBLIC_KEY;
const MAP_STYLE = "mapbox://styles/colinjamier/cmj5rlaod000c01s85lvyfybn";

const DepartmentMap: React.FC<DepartmentMapProps> = ({ departments }) => {
  const mapRef = useRef<MapRef>(null);
  const [geoJsonData, setGeoJsonData] = useState<any>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

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
    if (!mapRef.current || !geoJsonData) return;

    if (codes.length === 1) {
      // Find the feature for the single selected department
      const feature = geoJsonData.features.find((f: any) => f.properties.code === codes[0]);
      
      if (feature) {
        const bounds = calculateBounds(feature.geometry);
        if (bounds) {
          mapRef.current.fitBounds(bounds, { padding: 40, maxZoom: 5.2, offset: [-300, -100], duration: 1500 });
        }
      }
    } else {
      // Reset to France view if multiple or none
      mapRef.current.flyTo({
        center: [2.2137, 46.2276],
        zoom: 2.2,
        duration: 1500
      });
    }
  }, [departments, geoJsonData]); // Re-run when departments change or data loads

  // --- Layers ---

  // 1. Highlighted Fill (Light Blue)
  const highlightLayer: FillLayer = {
    id: 'dept-highlight',
    type: 'fill',
    paint: {
      'fill-color': '#29b5ff', // Sky-400 (Light Blue)
      'fill-opacity': 0.7,
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
    return <div className="bg-slate-900 h-48 rounded-xl flex items-center justify-center text-slate-500 text-xs">Mapbox Token Missing</div>;
  }

  if (!Map) {
      return null;
  }

  return (
    <div className="h-64 w-full rounded-xl overflow-hidden relative border border-white/5 shadow-inner bg-slate-900">
      <Map
        ref={mapRef}
        initialViewState={{
          longitude: 2.2137,
          latitude: 46.2276,
          zoom: 2.2
        }}
        style={{ width: '100%', height: '100%' }}
        mapStyle={MAP_STYLE}
        mapboxAccessToken={MAPBOX_TOKEN}
        attributionControl={false}
        scrollZoom={false} // Prevent scrolling interfering with page scroll
        onLoad={() => setIsMapLoaded(true)}
      >
        {isMapLoaded && (
            <Source id="france-depts" type="geojson" data={GEOJSON_SOURCE}>
            <Layer {...baseOutlineLayer} />
            <Layer {...highlightLayer} />
            <Layer {...highlightOutlineLayer} />
            </Source>
        )}
      </Map>
      
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
// const calculateBounds = (geometry: any): [[number, number], [number, number]] | null => {
//   let coords: number[][] = [];
  
//   // Handle Polygon (Standard Depts) and MultiPolygon (e.g., Coastal Depts with islands)
//   if (geometry.type === 'Polygon') {
//       coords = geometry.coordinates.flat();
//   } else if (geometry.type === 'MultiPolygon') {
//       // Find the polygon with the most points (Main landmass)
//       // This avoids zooming out too much or centering on water for coastal departments
//       let maxPoints = -1;
//       let mainPolyCoords: any[] = [];

//       geometry.coordinates.forEach((poly: any[]) => {
//           // poly is an array of rings. poly[0] is the outer ring.
//           // We use the number of points in the outer ring as a proxy for size/importance
//           if (poly[0].length > maxPoints) {
//               maxPoints = poly[0].length;
//               mainPolyCoords = poly;
//           }
//       });
      
//       if (mainPolyCoords.length > 0) {
//           coords = mainPolyCoords.flat();
//       } else {
//           // Fallback if empty
//           coords = geometry.coordinates.flat(2);
//       }
//   } else {
//       return null;
//   }

//   if (coords.length === 0) return null;

//   let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity;

//   for (const [lng, lat] of coords) {
//       if (lng < minLng) minLng = lng;
//       if (lng > maxLng) maxLng = lng;
//       if (lat < minLat) minLat = lat;
//       if (lat > maxLat) maxLat = lat;
//   }

//   return [[minLng, minLat], [maxLng, maxLat]];
// };

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