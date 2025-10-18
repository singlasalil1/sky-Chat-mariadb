import React, { useState, useEffect, useRef, useCallback } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { getHubAirports, getRoutesFromAirport } from '../services/api';
import '../styles/NetworkViewer.css';

const NetworkViewer = () => {
  const [hubs, setHubs] = useState([]);
  const [selectedAirport, setSelectedAirport] = useState(null);
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [highlightNodes, setHighlightNodes] = useState(new Set());
  const [highlightLinks, setHighlightLinks] = useState(new Set());
  const [hoverNode, setHoverNode] = useState(null);
  const fgRef = useRef();

  useEffect(() => {
    loadHubAirports();
  }, []);

  const loadHubAirports = async () => {
    try {
      const data = await getHubAirports(30);
      setHubs(data);
      if (data.length > 0) {
        selectAirport(data[0]);
      }
    } catch (error) {
      console.error('Error loading hubs:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectAirport = async (airport) => {
    setSelectedAirport(airport);
    try {
      const routeData = await getRoutesFromAirport(airport.iata);
      setRoutes(routeData.slice(0, 50));

      // Build graph data
      const nodes = [
        {
          id: airport.iata,
          name: airport.name,
          city: airport.city,
          country: airport.country,
          type: 'hub',
          val: 20
        }
      ];

      const links = [];
      const destNodes = new Set();

      routeData.slice(0, 50).forEach((route) => {
        if (!destNodes.has(route.dest_iata)) {
          nodes.push({
            id: route.dest_iata,
            name: route.dest_name || route.dest_iata,
            city: route.dest_city || '',
            type: 'destination',
            val: 8
          });
          destNodes.add(route.dest_iata);
        }

        links.push({
          source: airport.iata,
          target: route.dest_iata,
          airline: route.airline_name || '',
          distance: route.distance_km || 0
        });
      });

      setGraphData({ nodes, links });
    } catch (error) {
      console.error('Error loading routes:', error);
      setRoutes([]);
      setGraphData({ nodes: [], links: [] });
    }
  };

  const handleNodeHover = useCallback((node) => {
    setHoverNode(node);
    if (node) {
      const neighbors = new Set();
      const links = new Set();

      graphData.links.forEach(link => {
        if (link.source.id === node.id || link.target.id === node.id) {
          neighbors.add(link.source.id);
          neighbors.add(link.target.id);
          links.add(`${link.source.id}-${link.target.id}`);
        }
      });

      setHighlightNodes(neighbors);
      setHighlightLinks(links);
    } else {
      setHighlightNodes(new Set());
      setHighlightLinks(new Set());
    }
  }, [graphData]);

  const handleNodeClick = useCallback((node) => {
    if (node.type === 'destination') {
      // Find the hub that matches this destination node
      const hub = hubs.find(h => h.iata === node.id);
      if (hub) {
        selectAirport(hub);
      }
    }

    // Center camera on node
    if (fgRef.current) {
      fgRef.current.centerAt(node.x, node.y, 1000);
      fgRef.current.zoom(3, 1000);
    }
  }, [hubs]);

  const handleZoomIn = () => {
    if (fgRef.current) {
      fgRef.current.zoom(fgRef.current.zoom() * 1.5, 500);
    }
  };

  const handleZoomOut = () => {
    if (fgRef.current) {
      fgRef.current.zoom(fgRef.current.zoom() / 1.5, 500);
    }
  };

  const handleRecenter = () => {
    if (fgRef.current) {
      fgRef.current.zoomToFit(500, 100);
    }
  };

  const paintNode = useCallback((node, ctx, globalScale) => {
    const label = node.id;
    const fontSize = node.type === 'hub' ? 14/globalScale : 10/globalScale;
    ctx.font = `${fontSize}px Sans-Serif`;

    const isHighlight = highlightNodes.has(node.id);
    const isHovered = hoverNode?.id === node.id;

    // Draw node circle
    ctx.beginPath();
    ctx.arc(node.x, node.y, node.val, 0, 2 * Math.PI, false);

    if (node.type === 'hub') {
      ctx.fillStyle = isHovered ? '#1d4ed8' : '#2563eb';
    } else {
      ctx.fillStyle = isHighlight ? '#dbeafe' : '#f1f5f9';
    }
    ctx.fill();

    // Border
    ctx.strokeStyle = node.type === 'hub' ? '#1d4ed8' : (isHighlight ? '#2563eb' : '#cbd5e1');
    ctx.lineWidth = isHovered ? 3 : (isHighlight ? 2 : 1);
    ctx.stroke();

    // Draw label
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = node.type === 'hub' ? '#ffffff' : (isHighlight ? '#0f172a' : '#64748b');
    ctx.fillText(label, node.x, node.y);

    // Draw city name below for hub
    if (node.type === 'hub' && globalScale > 1) {
      const cityFontSize = 10/globalScale;
      ctx.font = `${cityFontSize}px Sans-Serif`;
      ctx.fillStyle = '#ffffff';
      ctx.fillText(node.city, node.x, node.y + node.val + 15);
    }
  }, [highlightNodes, hoverNode]);

  const paintLink = useCallback((link, ctx, globalScale) => {
    const linkKey = `${link.source.id}-${link.target.id}`;
    const isHighlight = highlightLinks.has(linkKey);

    ctx.strokeStyle = isHighlight ? '#2563eb' : '#e2e8f0';
    ctx.lineWidth = isHighlight ? 2 : 1;
    ctx.globalAlpha = isHighlight ? 1 : 0.3;

    ctx.beginPath();
    ctx.moveTo(link.source.x, link.source.y);
    ctx.lineTo(link.target.x, link.target.y);
    ctx.stroke();

    ctx.globalAlpha = 1;
  }, [highlightLinks]);

  if (loading) {
    return (
      <div className="network-viewer">
        <div className="network-loading">
          <div className="spinner">⟳</div>
          <p>Loading airport network...</p>
        </div>
      </div>
    );
  }

  const filteredHubs = hubs.filter(hub =>
    hub.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    hub.iata.toLowerCase().includes(searchTerm.toLowerCase()) ||
    hub.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
    hub.country.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="network-viewer">
      <div className="network-sidebar">
        <div className="sidebar-header">
          <h3>✈️ Hub Airports</h3>
          <div className="hub-count">{hubs.length} hubs</div>
        </div>

        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search airports..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          {searchTerm && (
            <button
              className="clear-search"
              onClick={() => setSearchTerm('')}
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        <div className="hub-list">
          {filteredHubs.length > 0 ? (
            filteredHubs.map((hub) => (
              <button
                key={hub.airport_id}
                className={`hub-item ${selectedAirport?.airport_id === hub.airport_id ? 'active' : ''}`}
                onClick={() => selectAirport(hub)}
              >
                <div className="hub-code">{hub.iata}</div>
                <div className="hub-info">
                  <div className="hub-name">{hub.name}</div>
                  <div className="hub-location">📍 {hub.city}, {hub.country}</div>
                  {hub.route_count && (
                    <div className="hub-routes">🔗 {hub.route_count} routes</div>
                  )}
                </div>
              </button>
            ))
          ) : (
            <div className="no-results">
              <p>No airports found</p>
              <span>Try a different search term</span>
            </div>
          )}
        </div>
      </div>

      <div className="network-canvas">
        <div className="network-header">
          <div className="header-content">
            <h2>
              {selectedAirport ? (
                <>
                  <span className="airport-code">{selectedAirport.iata}</span>
                  <span className="airport-name">{selectedAirport.name}</span>
                </>
              ) : (
                'Select an airport to view connections'
              )}
            </h2>
            {selectedAirport && (
              <p className="airport-location">
                📍 {selectedAirport.city}, {selectedAirport.country}
              </p>
            )}
          </div>
          <div className="network-stats">
            <div className="stat-card">
              <span className="stat-value">{routes.length}</span>
              <span className="stat-label">Connections</span>
            </div>
            {hoverNode && hoverNode.type === 'destination' && (
              <div className="stat-card highlight">
                <span className="stat-value">{hoverNode.id}</span>
                <span className="stat-label">{hoverNode.city}</span>
              </div>
            )}
          </div>
        </div>

        <div className="network-graph-container">
          {selectedAirport && routes.length > 0 ? (
            <>
              <ForceGraph2D
                ref={fgRef}
                graphData={graphData}
                nodeCanvasObject={paintNode}
                linkCanvasObject={paintLink}
                onNodeHover={handleNodeHover}
                onNodeClick={handleNodeClick}
                nodePointerAreaPaint={(node, color, ctx) => {
                  ctx.fillStyle = color;
                  ctx.beginPath();
                  ctx.arc(node.x, node.y, node.val * 1.5, 0, 2 * Math.PI, false);
                  ctx.fill();
                }}
                d3AlphaDecay={0.02}
                d3VelocityDecay={0.3}
                cooldownTicks={100}
                enableNodeDrag={true}
                enableZoomInteraction={true}
                enablePanInteraction={true}
                backgroundColor="#f8fafc"
              />

              <div className="zoom-controls">
                <button className="zoom-btn" onClick={handleZoomIn} title="Zoom In">
                  <span>🔍+</span>
                </button>
                <button className="zoom-btn" onClick={handleZoomOut} title="Zoom Out">
                  <span>🔍-</span>
                </button>
                <button className="zoom-btn" onClick={handleRecenter} title="Reset View">
                  <span>⟲</span>
                </button>
              </div>

              <div className="interaction-hint">
                💡 Click nodes to explore • Drag to pan • Scroll to zoom
              </div>
            </>
          ) : selectedAirport ? (
            <div className="empty-state">
              <span className="empty-icon">✈️</span>
              <p>No routes found from this airport</p>
            </div>
          ) : (
            <div className="empty-state">
              <span className="empty-icon">🌐</span>
              <p>Select a hub airport to explore its network</p>
              <span className="empty-hint">Choose from the list on the left</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NetworkViewer;
