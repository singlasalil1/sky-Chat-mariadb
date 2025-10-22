import React, { useState, useEffect, useRef, useCallback } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { getHubAirports, getRoutesFromAirport, getAirlinesFromAirport, searchAirports, findShortestPath } from '../services/api';
import '../styles/NetworkViewer.css';

const NetworkViewer = () => {
  const [hubs, setHubs] = useState([]);
  const [selectedAirport, setSelectedAirport] = useState(null);
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [expandedNodes, setExpandedNodes] = useState(new Set());
  const [highlightNodes, setHighlightNodes] = useState(new Set());
  const [highlightLinks, setHighlightLinks] = useState(new Set());
  const [hoverNode, setHoverNode] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [pathToSelected, setPathToSelected] = useState([]);
  const [selectedNodeDistance, setSelectedNodeDistance] = useState(null);
  const fgRef = useRef();

  // Path Finder State
  const [showPathFinder, setShowPathFinder] = useState(false);
  const [pathFromAirport, setPathFromAirport] = useState('');
  const [pathToAirport, setPathToAirport] = useState('');
  const [pathResults, setPathResults] = useState(null);
  const [pathLoading, setPathLoading] = useState(false);
  const [pathError, setPathError] = useState(null);
  const [fromSuggestions, setFromSuggestions] = useState([]);
  const [toSuggestions, setToSuggestions] = useState([]);
  const [showFromSuggestions, setShowFromSuggestions] = useState(false);
  const [showToSuggestions, setShowToSuggestions] = useState(false);

  // Airline comparison state
  const [airlines, setAirlines] = useState([]);
  const [selectedAirlines, setSelectedAirlines] = useState([]);
  const [showAirlinePanel, setShowAirlinePanel] = useState(true);
  const [comparisonMode, setComparisonMode] = useState(false);

  // Collapsible sections state
  const [showHubsPanel, setShowHubsPanel] = useState(false);
  const [showPathFinderPanel, setShowPathFinderPanel] = useState(false);

  // Metrics state
  const [networkMetrics, setNetworkMetrics] = useState({
    totalDistance: 0,
    avgDistance: 0,
    countries: new Set(),
    airlines: new Set()
  });

  // MariaDB query insights state
  const [queryInsights, setQueryInsights] = useState([]);
  const [showQueryPanel, setShowQueryPanel] = useState(false);

  // Airline color mapping - generate consistent colors for airlines
  const airlineColors = useRef(new Map());

  const getAirlineColor = useCallback((airlineIata) => {
    if (!airlineColors.current.has(airlineIata)) {
      const colors = [
        '#2563eb', '#dc2626', '#059669', '#d97706', '#7c3aed',
        '#db2777', '#0891b2', '#ea580c', '#65a30d', '#0284c7'
      ];
      const colorIndex = airlineColors.current.size % colors.length;
      airlineColors.current.set(airlineIata, colors[colorIndex]);
    }
    return airlineColors.current.get(airlineIata);
  }, []);

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
    setExpandedNodes(new Set([airport.iata]));
    setSelectedNode(null);
    setPathToSelected([]);
    setSelectedNodeDistance(null);
    setSelectedAirlines([]);
    setComparisonMode(false);

    try {
      const insights = [];

      // Load airlines operating from this airport
      const airlineResponse = await getAirlinesFromAirport(airport.iata);
      const airlineData = airlineResponse.airlines || airlineResponse;
      setAirlines(airlineData);

      if (airlineResponse.query_info) {
        insights.push({
          timestamp: new Date().toLocaleTimeString(),
          operation: 'Get Airlines',
          ...airlineResponse.query_info
        });
      }

      const routeResponse = await getRoutesFromAirport(airport.iata, null);
      const routeData = routeResponse.routes || routeResponse;
      setRoutes(routeData);

      if (routeResponse.query_info) {
        insights.push({
          timestamp: new Date().toLocaleTimeString(),
          operation: 'Get Routes',
          ...routeResponse.query_info
        });
      }

      setQueryInsights(insights);

      // Calculate network metrics
      const countries = new Set();
      const airlinesSet = new Set();
      let totalDist = 0;

      routeData.forEach(route => {
        if (route.dest_country) countries.add(route.dest_country);
        if (route.airline_iata) airlinesSet.add(route.airline_iata);
        if (route.distance_km) totalDist += route.distance_km;
      });

      setNetworkMetrics({
        totalDistance: totalDist,
        avgDistance: routeData.length > 0 ? totalDist / routeData.length : 0,
        countries: countries,
        airlines: airlinesSet
      });

      const nodes = [
        {
          id: airport.iata,
          name: airport.name,
          city: airport.city,
          country: airport.country,
          type: 'root',
          level: 0,
          val: 12,
          expanded: true,
          distance: 0
        }
      ];

      const links = [];
      const destNodes = new Set();

      routeData.slice(0, 25).forEach((route) => {
        if (!destNodes.has(route.dest_iata)) {
          const isHub = hubs.some(h => h.iata === route.dest_iata);
          nodes.push({
            id: route.dest_iata,
            name: route.dest_name || route.dest_iata,
            city: route.dest_city || '',
            type: isHub ? 'hub' : 'airport',
            level: 1,
            val: isHub ? 10 : 8,
            expanded: false,
            parent: airport.iata,
            distance: route.distance_km || 0
          });
          destNodes.add(route.dest_iata);
        }

        links.push({
          source: airport.iata,
          target: route.dest_iata,
          level: 1,
          distance: route.distance_km || 0,
          airline: route.airline_iata || '',
          airlineName: route.airline_name || '',
          equipment: route.equipment || ''
        });
      });

      setGraphData({ nodes, links });
    } catch (error) {
      console.error('Error loading routes:', error);
      setRoutes([]);
      setGraphData({ nodes: [], links: [] });
    }
  };

  // Handle airline selection for comparison
  const handleAirlineToggle = (airlineIata) => {
    setSelectedAirlines(prev => {
      if (prev.includes(airlineIata)) {
        return prev.filter(a => a !== airlineIata);
      } else {
        return [...prev, airlineIata];
      }
    });
  };

  // Handle comparison mode
  const handleCompareSelected = async () => {
    if (!selectedAirport || selectedAirlines.length === 0) return;

    setComparisonMode(true);
    await loadRoutesForComparison();
  };

  const handleShowAll = async () => {
    setComparisonMode(false);
    setSelectedAirlines([]);
    if (selectedAirport) {
      await loadRoutesForComparison();
    }
  };

  const loadRoutesForComparison = async () => {
    if (!selectedAirport) return;

    try {
      // Always load all routes, then filter on the client side
      const routeResponse = await getRoutesFromAirport(selectedAirport.iata, null);
      let routeData = routeResponse.routes || routeResponse;

      // Filter routes by selected airlines if in comparison mode
      if (comparisonMode && selectedAirlines.length > 0) {
        routeData = routeData.filter(route =>
          selectedAirlines.includes(route.airline_iata)
        );
      }

      setRoutes(routeData);

      // Add query insight
      if (routeResponse.query_info) {
        setQueryInsights(prev => [{
          timestamp: new Date().toLocaleTimeString(),
          operation: comparisonMode ? `Compare Selected Airlines` : 'Show All Airlines',
          ...routeResponse.query_info
        }, ...prev.slice(0, 4)]); // Keep last 5 queries
      }

      // Recalculate metrics
      const countries = new Set();
      const airlinesSet = new Set();
      let totalDist = 0;

      routeData.forEach(route => {
        if (route.dest_country) countries.add(route.dest_country);
        if (route.airline_iata) airlinesSet.add(route.airline_iata);
        if (route.distance_km) totalDist += route.distance_km;
      });

      setNetworkMetrics({
        totalDistance: totalDist,
        avgDistance: routeData.length > 0 ? totalDist / routeData.length : 0,
        countries: countries,
        airlines: airlinesSet
      });

      // Rebuild graph
      const nodes = [
        {
          id: selectedAirport.iata,
          name: selectedAirport.name,
          city: selectedAirport.city,
          country: selectedAirport.country,
          type: 'root',
          level: 0,
          val: 12,
          expanded: true,
          distance: 0
        }
      ];

      const links = [];
      const destNodes = new Set();

      routeData.slice(0, 25).forEach((route) => {
        if (!destNodes.has(route.dest_iata)) {
          const isHub = hubs.some(h => h.iata === route.dest_iata);
          nodes.push({
            id: route.dest_iata,
            name: route.dest_name || route.dest_iata,
            city: route.dest_city || '',
            type: isHub ? 'hub' : 'airport',
            level: 1,
            val: isHub ? 10 : 8,
            expanded: false,
            parent: selectedAirport.iata,
            distance: route.distance_km || 0
          });
          destNodes.add(route.dest_iata);
        }

        links.push({
          source: selectedAirport.iata,
          target: route.dest_iata,
          level: 1,
          distance: route.distance_km || 0,
          airline: route.airline_iata || '',
          airlineName: route.airline_name || '',
          equipment: route.equipment || ''
        });
      });

      setGraphData({ nodes, links });
      setExpandedNodes(new Set([selectedAirport.iata]));
    } catch (error) {
      console.error('Error filtering by airline:', error);
    }
  };

  const findPathToNode = (targetNodeId) => {
    const path = [];
    let currentId = targetNodeId;

    while (currentId) {
      const node = graphData.nodes.find(n => n.id === currentId);
      if (!node) break;
      path.unshift(node);
      currentId = node.parent;
    }

    return path;
  };

  const expandNode = async (node) => {
    if (expandedNodes.has(node.id)) {
      return;
    }

    try {
      const routeResponse = await getRoutesFromAirport(node.id);
      const routeData = routeResponse.routes || routeResponse;

      if (!routeData || routeData.length === 0) {
        return;
      }

      setExpandedNodes(prev => new Set([...prev, node.id]));

      const newNodes = [...graphData.nodes];
      const newLinks = [...graphData.links];
      const existingNodeIds = new Set(newNodes.map(n => n.id));

      const nodeIndex = newNodes.findIndex(n => n.id === node.id);
      if (nodeIndex !== -1) {
        newNodes[nodeIndex] = { ...newNodes[nodeIndex], expanded: true };
      }

      routeData.slice(0, 15).forEach((route) => {
        if (!existingNodeIds.has(route.dest_iata)) {
          const isHub = hubs.some(h => h.iata === route.dest_iata);
          newNodes.push({
            id: route.dest_iata,
            name: route.dest_name || route.dest_iata,
            city: route.dest_city || '',
            type: isHub ? 'hub' : 'airport',
            level: node.level + 1,
            val: isHub ? 10 : 7,
            expanded: false,
            parent: node.id,
            distance: route.distance_km || 0
          });
          existingNodeIds.add(route.dest_iata);
        }

        const linkExists = newLinks.some(
          l => (l.source.id || l.source) === node.id && (l.target.id || l.target) === route.dest_iata
        );

        if (!linkExists) {
          newLinks.push({
            source: node.id,
            target: route.dest_iata,
            level: node.level + 1,
            distance: route.distance_km || 0,
            airline: route.airline_iata || '',
            airlineName: route.airline_name || '',
            equipment: route.equipment || ''
          });
        }
      });

      setGraphData({ nodes: newNodes, links: newLinks });

      setTimeout(() => {
        if (fgRef.current) {
          fgRef.current.zoomToFit(800, 40);
        }
      }, 100);
    } catch (error) {
      console.error('Error expanding node:', error);
    }
  };

  const collapseNode = (node) => {
    if (node.level === 0) return;

    const nodesToRemove = new Set();
    const findChildNodes = (nodeId) => {
      graphData.nodes.forEach(n => {
        if (n.parent === nodeId) {
          nodesToRemove.add(n.id);
          findChildNodes(n.id);
        }
      });
    };

    findChildNodes(node.id);
    nodesToRemove.add(node.id);

    const newNodes = graphData.nodes.filter(n => !nodesToRemove.has(n.id));
    const newLinks = graphData.links.filter(l => {
      const sourceId = l.source.id || l.source;
      const targetId = l.target.id || l.target;
      return !nodesToRemove.has(sourceId) && !nodesToRemove.has(targetId);
    });

    const newExpandedNodes = new Set(expandedNodes);
    nodesToRemove.forEach(id => newExpandedNodes.delete(id));
    setExpandedNodes(newExpandedNodes);

    setGraphData({ nodes: newNodes, links: newLinks });
    setSelectedNode(null);
    setPathToSelected([]);
    setSelectedNodeDistance(null);

    setTimeout(() => {
      if (fgRef.current) {
        fgRef.current.zoomToFit(800, 40);
      }
    }, 100);
  };

  const handleNodeHover = useCallback((node) => {
    setHoverNode(node);
    if (node) {
      const neighbors = new Set();
      const links = new Set();

      graphData.links.forEach(link => {
        const sourceId = link.source.id || link.source;
        const targetId = link.target.id || link.target;

        if (sourceId === node.id || targetId === node.id) {
          neighbors.add(sourceId);
          neighbors.add(targetId);
          links.add(`${sourceId}-${targetId}`);
        }
      });

      setHighlightNodes(neighbors);
      setHighlightLinks(links);
    } else {
      setHighlightNodes(new Set());
      setHighlightLinks(new Set());
    }
  }, [graphData]);

  const handleNodeClick = useCallback((node, event) => {
    setSelectedNode(node);

    // Find path from root to selected node
    const path = findPathToNode(node.id);
    setPathToSelected(path);

    // Calculate total distance
    let totalDistance = 0;
    for (let i = 1; i < path.length; i++) {
      const link = graphData.links.find(l => {
        const sourceId = l.source.id || l.source;
        const targetId = l.target.id || l.target;
        return (sourceId === path[i-1].id && targetId === path[i].id);
      });
      if (link && link.distance) {
        totalDistance += link.distance;
      }
    }

    setSelectedNodeDistance(totalDistance > 0 ? totalDistance : null);
  }, [graphData]);

  const handleExpandClick = () => {
    if (selectedNode && !selectedNode.expanded) {
      expandNode(selectedNode);
      setSelectedNode(null);
      setPathToSelected([]);
      setSelectedNodeDistance(null);
    }
  };

  const handleCollapseClick = () => {
    if (selectedNode) {
      collapseNode(selectedNode);
    }
  };

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
      fgRef.current.zoomToFit(500, 40);
    }
  };

  const getNodeColor = (node) => {
    if (node.type === 'root') return '#2563eb';
    if (node.type === 'hub') return '#0891b2';
    if (node.level === 1) return '#10b981';
    if (node.level === 2) return '#f59e0b';
    if (node.level >= 3) return '#ef4444';
    return '#64748b';
  };

  const paintNode = useCallback((node, ctx, globalScale) => {
    const fontSize = 11 / globalScale;
    const isHighlight = highlightNodes.has(node.id);
    const isHovered = hoverNode?.id === node.id;
    const isSelected = selectedNode?.id === node.id;
    const isInPath = pathToSelected.some(n => n.id === node.id);

    const nodeSize = node.val;
    const color = getNodeColor(node);

    // Glow for path nodes
    if (isInPath && !isSelected) {
      ctx.shadowColor = color;
      ctx.shadowBlur = 12;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
    }

    // Shadow for depth
    if (isSelected || isHovered) {
      ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
      ctx.shadowBlur = 15;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 4;
    }

    // Draw flat circle
    ctx.beginPath();
    ctx.arc(node.x, node.y, nodeSize, 0, 2 * Math.PI, false);
    ctx.fillStyle = color;
    ctx.fill();

    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;

    // Border
    if (isSelected) {
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 3;
      ctx.stroke();
    } else if (isInPath) {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.5;
      ctx.stroke();
    } else if (isHighlight || isHovered) {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Airport code
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.font = `600 ${fontSize}px Inter, sans-serif`;
    ctx.fillText(node.id, node.x, node.y);

    // City name
    if (globalScale > 1.2) {
      const cityFontSize = 8 / globalScale;
      ctx.font = `500 ${cityFontSize}px Inter, sans-serif`;
      ctx.fillStyle = '#1e293b';
      ctx.fillText(node.city, node.x, node.y + nodeSize + 10);
    }

    // Expansion indicator
    if (!node.expanded && node.type !== 'root') {
      const indicatorSize = 4;
      const indicatorX = node.x + nodeSize - 4;
      const indicatorY = node.y - nodeSize + 4;

      ctx.beginPath();
      ctx.arc(indicatorX, indicatorY, indicatorSize, 0, 2 * Math.PI, false);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }, [highlightNodes, hoverNode, selectedNode, pathToSelected]);

  const paintLink = useCallback((link, ctx) => {
    const sourceId = link.source.id || link.source;
    const targetId = link.target.id || link.target;
    const linkKey = `${sourceId}-${targetId}`;
    const isHighlight = highlightLinks.has(linkKey);

    // Check if link is in selected path
    const isInPath = pathToSelected.length > 1 && pathToSelected.some((node, i) => {
      if (i === 0) return false;
      return pathToSelected[i-1].id === sourceId && node.id === targetId;
    });

    let strokeStyle = '#cbd5e1';
    let lineWidth = 1;
    let alpha = 0.3;

    // Check if this route's airline is selected for comparison
    const isSelectedAirline = comparisonMode && selectedAirlines.length > 0
      ? selectedAirlines.includes(link.airline)
      : true;

    // Color by airline if airline data exists
    if (link.airline) {
      strokeStyle = getAirlineColor(link.airline);
      if (comparisonMode && selectedAirlines.length > 0) {
        // In comparison mode
        if (isSelectedAirline) {
          lineWidth = 2.5;
          alpha = 0.9;
        } else {
          alpha = 0.15; // Dim non-selected airlines
        }
      } else {
        // Show all mode
        lineWidth = 1.5;
        alpha = 0.5;
      }
    }

    if (isInPath) {
      strokeStyle = link.airline ? getAirlineColor(link.airline) : '#2563eb';
      lineWidth = 3;
      alpha = 1;
    } else if (isHighlight) {
      strokeStyle = link.airline ? getAirlineColor(link.airline) : '#2563eb';
      lineWidth = 2;
      alpha = 0.9;
    }

    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = lineWidth;
    ctx.globalAlpha = alpha;

    ctx.beginPath();
    ctx.moveTo(link.source.x, link.source.y);
    ctx.lineTo(link.target.x, link.target.y);
    ctx.stroke();

    ctx.globalAlpha = 1;
  }, [highlightLinks, pathToSelected, comparisonMode, selectedAirlines, getAirlineColor]);

  // Path Finder Functions
  const handleFromAirportChange = async (e) => {
    const value = e.target.value.toUpperCase();
    setPathFromAirport(value);
    setPathError(null);

    if (value.length >= 2) {
      try {
        const results = await searchAirports(value);
        setFromSuggestions(results.slice(0, 5));
        setShowFromSuggestions(true);
      } catch (error) {
        console.error('Error searching airports:', error);
      }
    } else {
      setFromSuggestions([]);
      setShowFromSuggestions(false);
    }
  };

  const handleToAirportChange = async (e) => {
    const value = e.target.value.toUpperCase();
    setPathToAirport(value);
    setPathError(null);

    if (value.length >= 2) {
      try {
        const results = await searchAirports(value);
        setToSuggestions(results.slice(0, 5));
        setShowToSuggestions(true);
      } catch (error) {
        console.error('Error searching airports:', error);
      }
    } else {
      setToSuggestions([]);
      setShowToSuggestions(false);
    }
  };

  const selectFromAirport = (airport) => {
    setPathFromAirport(airport.iata);
    setShowFromSuggestions(false);
  };

  const selectToAirport = (airport) => {
    setPathToAirport(airport.iata);
    setShowToSuggestions(false);
  };

  const handleFindPath = async () => {
    if (!pathFromAirport || !pathToAirport) {
      setPathError('Please enter both airports');
      return;
    }

    if (pathFromAirport === pathToAirport) {
      setPathError('Source and destination must be different');
      return;
    }

    setPathLoading(true);
    setPathError(null);
    setPathResults(null);

    try {
      const result = await findShortestPath(pathFromAirport, pathToAirport);
      setPathResults(result);

      if (result.paths && result.paths.length === 0) {
        setPathError('No path found between these airports');
      }
    } catch (error) {
      console.error('Error finding path:', error);
      setPathError('Error finding path. Please check airport codes.');
    } finally {
      setPathLoading(false);
    }
  };

  const clearPathFinder = () => {
    setPathFromAirport('');
    setPathToAirport('');
    setPathResults(null);
    setPathError(null);
    setFromSuggestions([]);
    setToSuggestions([]);
    setShowFromSuggestions(false);
    setShowToSuggestions(false);
  };

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
        {/* Compare Airlines Section - PRIMARY */}
        {selectedAirport && airlines.length > 0 && (
          <div className="sidebar-section airline-comparison-section">
            <button
              className="section-toggle"
              onClick={() => setShowAirlinePanel(!showAirlinePanel)}
            >
              <span className="toggle-icon">{showAirlinePanel ? '▼' : '▶'}</span>
              <span className="section-title">✈️ Compare Airlines</span>
              <span className="section-badge">{airlines.length}</span>
            </button>

            {showAirlinePanel && (
              <div className="airline-comparison-panel">
                <div className="comparison-hint">
                  Select airlines to compare their networks from {selectedAirport.iata}
                </div>

                {/* Comparison Action Buttons */}
                <div className="comparison-actions">
                  <button
                    className="compare-btn"
                    onClick={handleCompareSelected}
                    disabled={selectedAirlines.length === 0}
                  >
                    🔍 Compare Selected ({selectedAirlines.length})
                  </button>
                  <button
                    className="show-all-btn"
                    onClick={handleShowAll}
                    disabled={!comparisonMode && selectedAirlines.length === 0}
                  >
                    Show All
                  </button>
                </div>

                {/* Airlines List with Checkboxes */}
                <div className="airlines-list">
                  {airlines.slice(0, 15).map((airline) => (
                    <label
                      key={airline.airline_id}
                      className={`airline-item ${selectedAirlines.includes(airline.airline_iata) ? 'selected' : ''}`}
                    >
                      <input
                        type="checkbox"
                        className="airline-checkbox"
                        checked={selectedAirlines.includes(airline.airline_iata)}
                        onChange={() => handleAirlineToggle(airline.airline_iata)}
                      />
                      <div
                        className="airline-color-dot"
                        style={{ background: getAirlineColor(airline.airline_iata) }}
                      ></div>
                      <div className="airline-info">
                        <div className="airline-code">{airline.airline_iata || airline.airline_icao}</div>
                        <div className="airline-name">{airline.airline_name}</div>
                        <div className="airline-stats">
                          {airline.route_count} routes • {airline.countries_served} countries
                        </div>
                      </div>
                    </label>
                  ))}
                </div>

                {/* Comparison Stats Panel */}
                {selectedAirlines.length >= 2 && (
                  <div className="comparison-stats-panel">
                    <div className="comparison-title">Comparison</div>
                    {selectedAirlines.map(airlineIata => {
                      const airline = airlines.find(a => a.airline_iata === airlineIata);
                      if (!airline) return null;
                      return (
                        <div key={airlineIata} className="airline-comparison-row">
                          <div
                            className="comparison-color"
                            style={{ background: getAirlineColor(airlineIata) }}
                          ></div>
                          <div className="comparison-details">
                            <div className="comparison-airline-name">{airline.airline_iata}</div>
                            <div className="comparison-metrics">
                              <span>{airline.route_count} routes</span>
                              <span>•</span>
                              <span>{airline.countries_served} countries</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Hub Airports Section */}
        <div className="sidebar-section">
          <button
            className="section-toggle"
            onClick={() => setShowHubsPanel(!showHubsPanel)}
          >
            <span className="toggle-icon">{showHubsPanel ? '▼' : '▶'}</span>
            <span className="section-title">✈️ Hub Airports</span>
            <span className="section-badge">{hubs.length}</span>
          </button>

          {showHubsPanel && (
            <>
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
            </>
          )}
        </div>

        {/* Path Finder Section */}
        <div className="sidebar-section">
          <button
            className="section-toggle"
            onClick={() => setShowPathFinderPanel(!showPathFinderPanel)}
          >
            <span className="toggle-icon">{showPathFinderPanel ? '▼' : '▶'}</span>
            <span className="section-title">🔍 Shortest Path</span>
            <span className="section-badge cte-badge">CTE</span>
          </button>

          {showPathFinderPanel && (
            <div className="path-finder-panel">
              <div className="path-finder-inputs">
                <div className="input-group">
                  <label className="input-label">From</label>
                  <input
                    type="text"
                    className="path-input"
                    placeholder="JFK"
                    value={pathFromAirport}
                    onChange={handleFromAirportChange}
                    onFocus={() => setShowFromSuggestions(fromSuggestions.length > 0)}
                  />
                  {showFromSuggestions && fromSuggestions.length > 0 && (
                    <div className="suggestions-list">
                      {fromSuggestions.map((airport) => (
                        <button
                          key={airport.airport_id}
                          className="suggestion-item"
                          onClick={() => selectFromAirport(airport)}
                        >
                          <span className="suggestion-code">{airport.iata}</span>
                          <span className="suggestion-name">{airport.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="input-group">
                  <label className="input-label">To</label>
                  <input
                    type="text"
                    className="path-input"
                    placeholder="LAX"
                    value={pathToAirport}
                    onChange={handleToAirportChange}
                    onFocus={() => setShowToSuggestions(toSuggestions.length > 0)}
                  />
                  {showToSuggestions && toSuggestions.length > 0 && (
                    <div className="suggestions-list">
                      {toSuggestions.map((airport) => (
                        <button
                          key={airport.airport_id}
                          className="suggestion-item"
                          onClick={() => selectToAirport(airport)}
                        >
                          <span className="suggestion-code">{airport.iata}</span>
                          <span className="suggestion-name">{airport.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="path-finder-actions">
                <button
                  className="find-path-btn"
                  onClick={handleFindPath}
                  disabled={pathLoading}
                >
                  {pathLoading ? '🔄 Searching...' : '🚀 Find Path'}
                </button>
                <button
                  className="clear-path-btn"
                  onClick={clearPathFinder}
                >
                  Clear
                </button>
              </div>

              {pathError && (
                <div className="path-error">⚠️ {pathError}</div>
              )}

              {pathResults && pathResults.paths && pathResults.paths.length > 0 && (
                <div className="path-results">
                  <div className="results-header">
                    <span className="results-title">Found {pathResults.paths.length} path(s)</span>
                    <span className="query-time">{pathResults.metrics.db_time}ms</span>
                  </div>

                  <div className="paths-list">
                    {pathResults.paths.map((path, index) => (
                      <div key={index} className="path-result-item">
                        <div className="path-route">{path.path}</div>
                        <div className="path-details">
                          <span className="path-hops">{path.hops} hop{path.hops > 1 ? 's' : ''}</span>
                          <span className="path-separator">•</span>
                          <span className="path-distance">{Math.round(path.total_distance)} km</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* MariaDB Features Showcase */}
                  <div className="mariadb-features">
                    <div className="features-title">🔥 MariaDB Features</div>
                    <div className="features-list">
                      {pathResults.metrics.mariadb_features.map((feature, index) => (
                        <div key={index} className="feature-item">
                          <span className="feature-bullet">✓</span>
                          <span className="feature-text">{feature}</span>
                        </div>
                      ))}
                    </div>
                    <div className="complexity-info">
                      <span className="complexity-label">Complexity:</span>
                      <span className="complexity-value">{pathResults.metrics.query_complexity}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

      </div>

      <div className="network-canvas">
        <div className="network-header">
          <div className="header-content">
            {selectedNode ? (
              <>
                <div className="breadcrumb-path">
                  {pathToSelected.map((node, index) => (
                    <React.Fragment key={node.id}>
                      <span className={`breadcrumb-item ${index === pathToSelected.length - 1 ? 'active' : ''}`}>
                        {node.id}
                      </span>
                      {index < pathToSelected.length - 1 && <span className="breadcrumb-arrow">→</span>}
                    </React.Fragment>
                  ))}
                </div>
                <p className="selection-info">
                  <span className="info-label">Route:</span>
                  <span className="info-value">
                    {pathToSelected.length === 1 ? 'Origin' :
                     pathToSelected.length === 2 ? 'Direct' :
                     `${pathToSelected.length - 2} stop${pathToSelected.length - 2 > 1 ? 's' : ''}`}
                  </span>
                  {selectedNodeDistance && (
                    <>
                      <span className="info-separator">•</span>
                      <span className="info-label">Distance:</span>
                      <span className="info-value">{Math.round(selectedNodeDistance).toLocaleString()} km</span>
                    </>
                  )}
                </p>
              </>
            ) : (
              <>
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
              </>
            )}
          </div>
          <div className="network-stats">
            <div className="stat-card">
              <span className="stat-value">{graphData.nodes.length}</span>
              <span className="stat-label">Airports</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">{graphData.links.length}</span>
              <span className="stat-label">Routes</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">{networkMetrics.countries.size}</span>
              <span className="stat-label">Countries</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">{networkMetrics.airlines.size}</span>
              <span className="stat-label">Airlines</span>
            </div>
            {networkMetrics.avgDistance > 0 && (
              <div className="stat-card">
                <span className="stat-value">{Math.round(networkMetrics.avgDistance)}</span>
                <span className="stat-label">Avg km</span>
              </div>
            )}
            {hoverNode && !selectedNode && (
              <div className="stat-card highlight">
                <span className="stat-value">{hoverNode.id}</span>
                <span className="stat-label">{hoverNode.city || 'Airport'}</span>
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
                  ctx.arc(node.x, node.y, node.val * 1.4, 0, 2 * Math.PI, false);
                  ctx.fill();
                }}
                d3AlphaDecay={0.025}
                d3VelocityDecay={0.35}
                cooldownTicks={100}
                enableNodeDrag={true}
                enableZoomInteraction={true}
                enablePanInteraction={true}
                backgroundColor="#ffffff"
              />

              <div className="zoom-controls">
                <button className="zoom-btn" onClick={handleZoomIn} title="Zoom In">
                  ➕
                </button>
                <button className="zoom-btn" onClick={handleZoomOut} title="Zoom Out">
                  ➖
                </button>
                <button className="zoom-btn" onClick={handleRecenter} title="Fit View">
                  ⊡
                </button>
              </div>

              {selectedNode && (
                <div className="node-actions">
                  <div className="action-header">
                    <span className="action-airport">{selectedNode.id}</span>
                    <span className="action-city">{selectedNode.city}</span>
                  </div>
                  <div className="action-buttons">
                    {!selectedNode.expanded && selectedNode.type !== 'root' && (
                      <button className="action-btn expand-btn" onClick={handleExpandClick}>
                        ➕ Expand
                      </button>
                    )}
                    {selectedNode.level > 0 && (
                      <button className="action-btn collapse-btn" onClick={handleCollapseClick}>
                        ✕ Remove
                      </button>
                    )}
                    <button className="action-btn close-btn" onClick={() => {
                      setSelectedNode(null);
                      setPathToSelected([]);
                      setSelectedNodeDistance(null);
                    }}>
                      Close
                    </button>
                  </div>
                </div>
              )}

              <div className="color-legend">
                <div className="legend-title">Network Levels</div>
                <div className="legend-items">
                  <div className="legend-item">
                    <div className="legend-dot" style={{ background: '#2563eb' }}></div>
                    <span>Origin</span>
                  </div>
                  <div className="legend-item">
                    <div className="legend-dot" style={{ background: '#0891b2' }}></div>
                    <span>Hub</span>
                  </div>
                  <div className="legend-item">
                    <div className="legend-dot" style={{ background: '#10b981' }}></div>
                    <span>Level 1</span>
                  </div>
                  <div className="legend-item">
                    <div className="legend-dot" style={{ background: '#f59e0b' }}></div>
                    <span>Level 2+</span>
                  </div>
                </div>
              </div>

              <div className="interaction-hint">
                💡 Select airlines in sidebar to compare • Click nodes to explore • Pan & Zoom
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
              <p className="empty-title">Compare Airline Networks</p>
              <span className="empty-hint">Select a hub airport to start comparing airlines</span>
              <div className="empty-features">
                <div className="empty-feature">✈️ Compare route coverage</div>
                <div className="empty-feature">🌍 Analyze country reach</div>
                <div className="empty-feature">🔍 Find best routes</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NetworkViewer;
