import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

// Fix marker icon issue in React + Vite
import L from "leaflet";
import markerIconPng from "leaflet/dist/images/marker-icon.png?url";
import markerShadowPng from "leaflet/dist/images/marker-shadow.png?url";

export default function MapComponent({ openChat, colors = {} }) {
  const [herbData, setHerbData] = useState([]);

  useEffect(() => {
  // Replace dummyData with the actual backend call
  fetch("http://127.0.0.1:8000/dashboard/")
    .then((res) => res.json())
    .then((result) => {
      if (result.status === "success") {
        // Map backend fields (name, latitude, etc.) to the state
        setHerbData(result.data); 
      }
    })
    .catch((err) => console.error("Error fetching blockchain records:", err));
}, []);

  return (
    <MapContainer center={[20, 77]} zoom={5} style={{ height: "100%", width: "100%" }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; OpenStreetMap contributors"
      />
      {herbData.map((herb) => (
        <Marker
          key={herb.id}
          position={[herb.latitude, herb.longitude]}
          icon={L.icon({
            iconUrl: markerIconPng,
            shadowUrl: markerShadowPng,
            iconSize: [25, 41],
            iconAnchor: [12, 41],
          })}
        >
          <Popup>
            <div>
              <h3 style={{ color: colors.primaryGreen || "#4a7c59" }}>{herb.name}</h3>
              <p>Species: {herb.verified_species}</p>
              <p>Confidence: {herb.confidence_score}</p>
              <button
                className="mt-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                onClick={() => openChat(herb)}
              >
                Chat about this herb
              </button>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
