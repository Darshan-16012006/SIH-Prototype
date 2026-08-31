import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { api } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';

// Fix default Leaflet icon paths in React bundle
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export function ProjectMap() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadMapData();
  }, []);

  const loadMapData = async () => {
    try {
      setLoading(true);
      const data = await api.getProjectsMap();
      setProjects(data);
    } catch (err) {
      console.error('Error loading map projects:', err);
    } finally {
      setLoading(false);
    }
  };

  // Center on India (20.5937, 78.9629)
  const centerIndia = [20.5937, 78.9629];

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 600 }}>GIS Project Locations & Spatial Monitoring Map</h2>
        <p style={{ fontSize: '13px', color: '#64748B', marginTop: '4px' }}>
          Interactive map displaying infrastructure project sites across India with real-time risk status markers.
        </p>
      </div>

      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#64748B' }}>Loading Leaflet map...</div>
        ) : (
          <div style={{ height: '620px', width: '100%' }}>
            <MapContainer center={centerIndia} zoom={5} style={{ height: '100%', width: '100%' }}>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {projects.map((p) => (
                <Marker key={p.id} position={[p.latitude, p.longitude]}>
                  <Popup>
                    <div style={{ padding: '6px', maxWidth: '240px' }}>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: '#005F73' }}>{p.project_id}</div>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: '#1E293B', marginBottom: '4px' }}>{p.name}</div>
                      <div style={{ fontSize: '12px', color: '#64748B', marginBottom: '6px' }}>{p.location}</div>

                      <div style={{ marginBottom: '8px' }}>
                        <StatusBadge status={p.status} />
                      </div>

                      <div style={{ fontSize: '12px', marginBottom: '4px' }}>
                        <strong>Budget:</strong> ₹{p.approved_budget} Cr
                      </div>
                      <div style={{ fontSize: '12px', marginBottom: '8px' }}>
                        <strong>Physical Progress:</strong> {p.physical_progress}% / {p.planned_physical_progress}%
                      </div>

                      <button
                        className="btn btn-primary btn-sm"
                        style={{ width: '100%', fontSize: '11px' }}
                        onClick={() => navigate(`/projects/${p.id}`)}
                      >
                        Open Details
                      </button>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        )}
      </div>
    </div>
  );
}
