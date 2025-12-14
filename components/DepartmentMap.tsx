
import React from 'react';
import Map, { Source, Layer, FillLayer, LineLayer } from 'react-map-gl';

interface DepartmentMapProps {
  departments: string[]; // List of department codes (e.g. ['75', '33'])
}

const GEOJSON_SOURCE = "https://france-geojson.gregoiredavid.fr/repo/departements.geojson";
// Use process.env or fallback to the direct string to ensure it works in all environments
const MAPBOX_TOKEN = process.env.MAPBOX_PUBLIC_KEY;
const MAP_STYLE = "mapbox://styles/colinjamier/cmj5rlaod000c01s85lvyfybn";

const DepartmentMap: React.FC<DepartmentMapProps> = ({ departments }) => {
  // Clean department codes (remove names if present, e.g., "01 - Ain" -> "01")
  const codes = departments.map(d => d.split(' ')[0].trim());

  // Layer for the highlighted departments (Fill)
  const highlightLayer: FillLayer = {
    id: 'dept-highlight',
    type: 'fill',
    paint: {
      'fill-color': '#3b82f6', // Primary Blue
      'fill-opacity': 0.6,
    },
    // Filter: only show features where 'code' property is in our list
    filter: ['in', ['get', 'code'], ['literal', codes]]
  };

  // Layer for boundaries (Line)
  const outlineLayer: LineLayer = {
    id: 'dept-outline',
    type: 'line',
    paint: {
      'line-color': '#1e293b', // Slate-800
      'line-width': 1,
      'line-opacity': 0.5
    }
  };

  if (!MAPBOX_TOKEN) {
    return <div className="bg-slate-900 h-48 rounded-xl flex items-center justify-center text-slate-500 text-xs">Mapbox Token Missing</div>;
  }

  return (
    <div className="h-64 w-full rounded-xl overflow-hidden relative border border-white/5 shadow-inner bg-slate-900">
      <Map
        initialViewState={{
          longitude: 2.2137,
          latitude: 46.2276,
          zoom: 4.2
        }}
        style={{ width: '100%', height: '100%' }}
        mapStyle={MAP_STYLE}
        mapboxAccessToken={MAPBOX_TOKEN}
        attributionControl={false}
        scrollZoom={false}
      >
        <Source id="france-depts" type="geojson" data={GEOJSON_SOURCE}>
          {/* Base outlines for all departments */}
          <Layer {...outlineLayer} />
          {/* Highlighted departments */}
          <Layer {...highlightLayer} />
        </Source>
      </Map>
      
      {/* Legend overlay */}
      <div className="absolute bottom-2 left-2 bg-slate-900/80 backdrop-blur px-2 py-1 rounded text-[10px] text-slate-300 border border-slate-700 pointer-events-none">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 bg-blue-500 rounded-sm"></div>
          <span>Zone Ciblée</span>
        </div>
      </div>
    </div>
  );
};

export default DepartmentMap;
