import React, { useEffect, useRef, useState, useCallback } from 'react';

const StoreMap = ({ showMap, onAislePin }) => {
  const svgRef = useRef(null);
  const [pins, setPins] = useState([]);

  const addPin = useCallback((aisleId, color) => {
    console.log('🗺️ addPin called:', aisleId, color);
    if (!svgRef.current) {
      console.log('🗺️ SVG ref not available, will retry');
      // Retry after a short delay
      setTimeout(() => {
        if (svgRef.current) {
          addPin(aisleId, color);
        }
      }, 100);
      return;
    }

    const aisleElement = svgRef.current.getElementById(aisleId);
    if (!aisleElement) {
      console.log('🗺️ Aisle element not found:', aisleId);
      return;
    }

    const bbox = aisleElement.getBBox();
    const cx = bbox.x + bbox.width / 2;
    const cy = bbox.y + bbox.height / 2;

    const newPin = {
      id: `${aisleId}-${Date.now()}`,
      aisleId,
      cx,
      cy,
      color
    };

    setPins(prev => {
      // Remove existing pin for this aisle
      const filtered = prev.filter(pin => pin.aisleId !== aisleId);
      return [...filtered, newPin];
    });
  }, []);

  const clearPins = useCallback(() => {
    setPins([]);
  }, []);

  useEffect(() => {
    if (showMap && svgRef.current) {
      console.log('🗺️ StoreMap mounted, adding customer location pin');
      console.log('🗺️ SVG ref available:', !!svgRef.current);
      // Add initial green pin at N8 to represent customer's current location
      addPin('N8', '#22c55e');
    }
  }, [showMap, addPin]);

  // Expose methods to parent component
  useEffect(() => {
    if (onAislePin) {
      console.log('🗺️ Exposing map controls to parent');
      onAislePin({ addPin, clearPins });
    }
  }, [onAislePin, addPin, clearPins]);

  if (!showMap) return null;

  return (
    <div className="store-map-container" style={{ animation: 'mapSlideIn 0.4s ease-out' }}>
      <div className="map-header">
        <h2>WinMart Store Map</h2>
        <button onClick={clearPins} className="clear-pins-btn">
          Clear All Pins
        </button>
      </div>
      
      <div className="map-wrapper">
        <svg 
          ref={svgRef}
          id="store-map-svg" 
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 1800 1150" 
          aria-labelledby="mapTitle" 
          role="img"
        >
          <title id="mapTitle">WinMart Store Map</title>
          <defs>
            <filter id="drop-shadow" x="-0.1" y="-0.1" width="1.2" height="1.2">
              <feGaussianBlur in="SourceAlpha" stdDeviation="3"/>
              <feOffset dx="2" dy="2"/>
              <feMerge>
                <feMergeNode/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          <style>
            {`
              .bg { fill: #f8fafc; }
              .aisle-grocery { fill: #dcfce7; stroke: #bbf7d0; }
              .aisle-gm { fill: #dbeafe; stroke: #bfdbfe; }
              .aisle-apparel { fill: #e0e7ff; stroke: #c7d2fe; }
              .store-features { fill: #fef3c7; stroke: #fde68a; }
              .text-label { font-family: 'Inter', sans-serif; font-size: 11px; font-weight: 500; fill: #374151; text-anchor: middle; pointer-events: none;}
              .section-label { font-family: 'Inter', sans-serif; font-size: 24px; font-weight: 700; fill: #4b5563; text-anchor: middle; }
              .feature-label { font-family: 'Inter', sans-serif; font-size: 14px; font-weight: 600; fill: #374151; text-anchor: middle; }
              .department-label { font-family: 'Inter', sans-serif; font-size: 16px; font-weight: 600; fill: #6b7280; text-anchor: middle; }
            `}
          </style>
          
          <rect className="bg" width="1800" height="1150"/>
          <path stroke="#cbd5e1" strokeWidth="1.5" fill="#fff" d="M 1750 50 L 50 50 L 50 950 L 300 1020 L 1500 1020 L 1750 950 L 1750 50 Z" style={{filter: 'url(#drop-shadow)'}}/>
          
          <text className="section-label" x="250" y="90">GROCERY</text>
          <text className="section-label" x="600" y="90">APPAREL & HOME</text>
          <text className="section-label" x="1250" y="90">GENERAL MERCHANDISE</text>
          
          {/* Store Features */}
          <g id="store-features">
            <rect className="store-features" x="310" y="960" width="1080" height="50" rx="5" />
            <text className="feature-label" x="850" y="990">CHECK OUT</text>
            <rect className="store-features" x="1400" y="960" width="120" height="50" rx="5" />
            <text className="feature-label" x="1460" y="990">RESTROOMS</text>
            
            {/* Separate Entrance and Exit */}
            <rect className="store-features" fill="#dbeafe" x="1530" y="880" width="120" height="130" rx="5"/>
            <text className="feature-label" x="1590" y="950">ENTRANCE</text>
            <rect className="store-features" fill="#e0f2fe" x="1660" y="880" width="80" height="130" rx="5"/>
            <text className="feature-label" x="1700" y="950">EXIT</text>
          </g>

          {/* Aisles - Grocery */}
          <g id="group-A">
            <rect id="A1" className="aisle-grocery" x="100" y="120" width="40" height="150"/>
            <text className="text-label" x="120" y="205">A1</text>
            <rect id="A2" className="aisle-grocery" x="150" y="120" width="40" height="150"/>
            <text className="text-label" x="170" y="205">A2</text>
            <rect id="A3" className="aisle-grocery" x="200" y="120" width="40" height="150"/>
            <text className="text-label" x="220" y="205">A3</text>
            <rect id="A4" className="aisle-grocery" x="250" y="120" width="40" height="150"/>
            <text className="text-label" x="270" y="205">A4</text>
            <rect id="A5" className="aisle-grocery" x="300" y="120" width="40" height="150"/>
            <text className="text-label" x="320" y="205">A5</text>
            <rect id="A6" className="aisle-grocery" x="100" y="280" width="40" height="150"/>
            <text className="text-label" x="120" y="365">A6</text>
            <rect id="A7" className="aisle-grocery" x="150" y="280" width="40" height="150"/>
            <text className="text-label" x="170" y="365">A7</text>
            <rect id="A8" className="aisle-grocery" x="200" y="280" width="40" height="150"/>
            <text className="text-label" x="220" y="365">A8</text>
            <rect id="A9" className="aisle-grocery" x="250" y="280" width="40" height="150"/>
            <text className="text-label" x="270" y="365">A9</text>
            <rect id="A10" className="aisle-grocery" x="300" y="280" width="40" height="150"/>
            <text className="text-label" x="320" y="365">A10</text>
            <rect id="A11" className="aisle-grocery" x="350" y="280" width="40" height="150"/>
            <text className="text-label" x="370" y="365">A11</text>
          </g>

          <g id="group-B">
            <rect id="B1" className="aisle-grocery" x="100" y="460" width="40" height="150"/>
            <text className="text-label" x="120" y="545">B1</text>
            <rect id="B2" className="aisle-grocery" x="150" y="460" width="40" height="150"/>
            <text className="text-label" x="170" y="545">B2</text>
            <rect id="B3" className="aisle-grocery" x="200" y="460" width="40" height="150"/>
            <text className="text-label" x="220" y="545">B3</text>
            <rect id="B4" className="aisle-grocery" x="250" y="460" width="40" height="150"/>
            <text className="text-label" x="270" y="545">B4</text>
            <rect id="B5" className="aisle-grocery" x="300" y="460" width="40" height="150"/>
            <text className="text-label" x="320" y="545">B5</text>
            <rect id="B6" className="aisle-grocery" x="350" y="460" width="40" height="150"/>
            <text className="text-label" x="370" y="545">B6</text>
            <rect id="B7" className="aisle-grocery" x="400" y="460" width="40" height="150"/>
            <text className="text-label" x="420" y="545">B7</text>
            <rect id="B8" className="aisle-grocery" x="100" y="620" width="40" height="150"/>
            <text className="text-label" x="120" y="705">B8</text>
            <rect id="B9" className="aisle-grocery" x="150" y="620" width="40" height="150"/>
            <text className="text-label" x="170" y="705">B9</text>
            <rect id="B10" className="aisle-grocery" x="200" y="620" width="40" height="150"/>
            <text className="text-label" x="220" y="705">B10</text>
            <rect id="B11" className="aisle-grocery" x="250" y="620" width="40" height="150"/>
            <text className="text-label" x="270" y="705">B11</text>
            <rect id="B12" className="aisle-grocery" x="300" y="620" width="40" height="150"/>
            <text className="text-label" x="320" y="705">B12</text>
            <rect id="B13" className="aisle-grocery" x="350" y="620" width="40" height="150"/>
            <text className="text-label" x="370" y="705">B13</text>
            <rect id="B14" className="aisle-grocery" x="400" y="620" width="40" height="150"/>
            <text className="text-label" x="420" y="705">B14</text>
            <rect id="B15" className="aisle-grocery" x="100" y="780" width="40" height="150"/>
            <text className="text-label" x="120" y="865">B15</text>
            <rect id="B16" className="aisle-grocery" x="150" y="780" width="40" height="150"/>
            <text className="text-label" x="170" y="865">B16</text>
          </g>

          {/* APPAREL & HOME */}
          <g id="group-C">
            <rect id="C1" className="aisle-apparel" x="480" y="120" width="40" height="100"/>
            <text className="text-label" x="500" y="175">C1</text>
            <rect id="C2" className="aisle-apparel" x="530" y="120" width="40" height="100"/>
            <text className="text-label" x="550" y="175">C2</text>
            <rect id="C3" className="aisle-apparel" x="580" y="120" width="40" height="100"/>
            <text className="text-label" x="600" y="175">C3</text>
            <rect id="C4" className="aisle-apparel" x="630" y="120" width="40" height="100"/>
            <text className="text-label" x="650" y="175">C4</text>
            <rect id="C5" className="aisle-apparel" x="680" y="120" width="40" height="100"/>
            <text className="text-label" x="700" y="175">C5</text>
            <rect id="C6" className="aisle-apparel" x="730" y="120" width="40" height="100"/>
            <text className="text-label" x="750" y="175">C6</text>
            <rect id="C7" className="aisle-apparel" x="480" y="230" width="40" height="100"/>
            <text className="text-label" x="500" y="285">C7</text>
            <rect id="C8" className="aisle-apparel" x="530" y="230" width="40" height="100"/>
            <text className="text-label" x="550" y="285">C8</text>
            <rect id="C9" className="aisle-apparel" x="580" y="230" width="40" height="100"/>
            <text className="text-label" x="600" y="285">C9</text>
            <rect id="C10" className="aisle-apparel" x="630" y="230" width="40" height="100"/>
            <text className="text-label" x="650" y="285">C10</text>
            <rect id="C11" className="aisle-apparel" x="680" y="230" width="40" height="100"/>
            <text className="text-label" x="700" y="285">C11</text>
            <rect id="C12" className="aisle-apparel" x="730" y="230" width="40" height="100"/>
            <text className="text-label" x="750" y="285">C12</text>
          </g>
          
          <g id="group-D">
            <rect id="D1" className="aisle-apparel" x="480" y="360" width="40" height="100"/>
            <text className="text-label" x="500" y="415">D1</text>
            <rect id="D2" className="aisle-apparel" x="530" y="360" width="40" height="100"/>
            <text className="text-label" x="550" y="415">D2</text>
            <rect id="D3" className="aisle-apparel" x="580" y="360" width="40" height="100"/>
            <text className="text-label" x="600" y="415">D3</text>
            <rect id="D4" className="aisle-apparel" x="630" y="360" width="40" height="100"/>
            <text className="text-label" x="650" y="415">D4</text>
            <rect id="D5" className="aisle-apparel" x="680" y="360" width="40" height="100"/>
            <text className="text-label" x="700" y="415">D5</text>
            <rect id="D6" className="aisle-apparel" x="730" y="360" width="40" height="100"/>
            <text className="text-label" x="750" y="415">D6</text>
            <rect id="D7" className="aisle-apparel" x="480" y="470" width="40" height="100"/>
            <text className="text-label" x="500" y="525">D7</text>
            <rect id="D8" className="aisle-apparel" x="530" y="470" width="40" height="100"/>
            <text className="text-label" x="550" y="525">D8</text>
            <rect id="D9" className="aisle-apparel" x="580" y="470" width="40" height="100"/>
            <text className="text-label" x="600" y="525">D9</text>
            <rect id="D10" className="aisle-apparel" x="630" y="470" width="40" height="100"/>
            <text className="text-label" x="650" y="525">D10</text>
          </g>
          
          <g id="group-E">
            <rect id="E1" className="aisle-apparel" x="480" y="600" width="30" height="100"/>
            <text className="text-label" x="495" y="655">E1</text>
            <rect id="E2" className="aisle-apparel" x="520" y="600" width="30" height="100"/>
            <text className="text-label" x="535" y="655">E2</text>
            <rect id="E3" className="aisle-apparel" x="550" y="600" width="30" height="100"/>
            <text className="text-label" x="565" y="655">E3</text>
            <rect id="E4" className="aisle-apparel" x="580" y="600" width="30" height="100"/>
            <text className="text-label" x="595" y="655">E4</text>
            <rect id="E5" className="aisle-apparel" x="610" y="600" width="30" height="100"/>
            <text className="text-label" x="625" y="655">E5</text>
            <rect id="E6" className="aisle-apparel" x="640" y="600" width="30" height="100"/>
            <text className="text-label" x="655" y="655">E6</text>
            <rect id="E7" className="aisle-apparel" x="670" y="600" width="30" height="100"/>
            <text className="text-label" x="685" y="655">E7</text>
            <rect id="E8" className="aisle-apparel" x="700" y="600" width="30" height="100"/>
            <text className="text-label" x="715" y="655">E8</text>
            <rect id="E9" className="aisle-apparel" x="730" y="600" width="30" height="100"/>
            <text className="text-label" x="745" y="655">E9</text>
            <rect id="E10" className="aisle-apparel" x="760" y="600" width="30" height="100"/>
            <text className="text-label" x="775" y="655">E10</text>
            <rect id="E11" className="aisle-apparel" x="480" y="710" width="30" height="100"/>
            <text className="text-label" x="495" y="765">E11</text>
            <rect id="E12" className="aisle-apparel" x="520" y="710" width="30" height="100"/>
            <text className="text-label" x="535" y="765">E12</text>
            <rect id="E13" className="aisle-apparel" x="550" y="710" width="30" height="100"/>
            <text className="text-label" x="565" y="765">E13</text>
          </g>
          
          {/* GENERAL MERCHANDISE */}
          <g id="group-F">
            <rect id="F1" className="aisle-gm" x="820" y="120" width="35" height="80"/>
            <text className="text-label" x="837.5" y="165">F1</text>
            <rect id="F2" className="aisle-gm" x="865" y="120" width="35" height="80"/>
            <text className="text-label" x="882.5" y="165">F2</text>
            <rect id="F3" className="aisle-gm" x="910" y="120" width="35" height="80"/>
            <text className="text-label" x="927.5" y="165">F3</text>
            <rect id="F4" className="aisle-gm" x="955" y="120" width="35" height="80"/>
            <text className="text-label" x="972.5" y="165">F4</text>
            <rect id="F5" className="aisle-gm" x="1000" y="120" width="35" height="80"/>
            <text className="text-label" x="1017.5" y="165">F5</text>
            <rect id="F6" className="aisle-gm" x="1045" y="120" width="35" height="80"/>
            <text className="text-label" x="1062.5" y="165">F6</text>
            <rect id="F7" className="aisle-gm" x="1090" y="120" width="35" height="80"/>
            <text className="text-label" x="1107.5" y="165">F7</text>
            <rect id="F8" className="aisle-gm" x="1135" y="120" width="35" height="80"/>
            <text className="text-label" x="1152.5" y="165">F8</text>
            <rect id="F9" className="aisle-gm" x="1180" y="120" width="35" height="80"/>
            <text className="text-label" x="1197.5" y="165">F9</text>
            <rect id="F10" className="aisle-gm" x="1225" y="120" width="35" height="80"/>
            <text className="text-label" x="1242.5" y="165">F10</text>
            <rect id="F11" className="aisle-gm" x="1270" y="120" width="35" height="80"/>
            <text className="text-label" x="1287.5" y="165">F11</text>
            <rect id="F12" className="aisle-gm" x="1315" y="120" width="35" height="80"/>
            <text className="text-label" x="1332.5" y="165">F12</text>
          </g>

          <g id="group-G">
            <rect id="G1" className="aisle-gm" x="820" y="210" width="35" height="80"/>
            <text className="text-label" x="837.5" y="255">G1</text>
            <rect id="G2" className="aisle-gm" x="865" y="210" width="35" height="80"/>
            <text className="text-label" x="882.5" y="255">G2</text>
            <rect id="G3" className="aisle-gm" x="910" y="210" width="35" height="80"/>
            <text className="text-label" x="927.5" y="255">G3</text>
            <rect id="G4" className="aisle-gm" x="955" y="210" width="35" height="80"/>
            <text className="text-label" x="972.5" y="255">G4</text>
            <rect id="G5" className="aisle-gm" x="1000" y="210" width="35" height="80"/>
            <text className="text-label" x="1017.5" y="255">G5</text>
            <rect id="G6" className="aisle-gm" x="1045" y="210" width="35" height="80"/>
            <text className="text-label" x="1062.5" y="255">G6</text>
            <rect id="G7" className="aisle-gm" x="1090" y="210" width="35" height="80"/>
            <text className="text-label" x="1107.5" y="255">G7</text>
            <rect id="G8" className="aisle-gm" x="1135" y="210" width="35" height="80"/>
            <text className="text-label" x="1152.5" y="255">G8</text>
            <rect id="G9" className="aisle-gm" x="1180" y="210" width="35" height="80"/>
            <text className="text-label" x="1197.5" y="255">G9</text>
            <rect id="G10" className="aisle-gm" x="1225" y="210" width="35" height="80"/>
            <text className="text-label" x="1242.5" y="255">G10</text>
            <rect id="G11" className="aisle-gm" x="1270" y="210" width="35" height="80"/>
            <text className="text-label" x="1287.5" y="255">G11</text>
          </g>
          <g id="group-H">
            <rect id="H1" className="aisle-gm" x="820" y="300" width="35" height="80"/>
            <text className="text-label" x="837.5" y="345">H1</text>
            <rect id="H2" className="aisle-gm" x="865" y="300" width="35" height="80"/>
            <text className="text-label" x="882.5" y="345">H2</text>
            <rect id="H3" className="aisle-gm" x="910" y="300" width="35" height="80"/>
            <text className="text-label" x="927.5" y="345">H3</text>
            <rect id="H4" className="aisle-gm" x="955" y="300" width="35" height="80"/>
            <text className="text-label" x="972.5" y="345">H4</text>
            <rect id="H5" className="aisle-gm" x="1000" y="300" width="35" height="80"/>
            <text className="text-label" x="1017.5" y="345">H5</text>
            <rect id="H6" className="aisle-gm" x="1045" y="300" width="35" height="80"/>
            <text className="text-label" x="1062.5" y="345">H6</text>
            <rect id="H7" className="aisle-gm" x="1090" y="300" width="35" height="80"/>
            <text className="text-label" x="1107.5" y="345">H7</text>
            <rect id="H8" className="aisle-gm" x="1135" y="300" width="35" height="80"/>
            <text className="text-label" x="1152.5" y="345">H8</text>
            <rect id="H9" className="aisle-gm" x="1180" y="300" width="35" height="80"/>
            <text className="text-label" x="1197.5" y="345">H9</text>
            <rect id="H10" className="aisle-gm" x="1225" y="300" width="35" height="80"/>
            <text className="text-label" x="1242.5" y="345">H10</text>
            <rect id="H11" className="aisle-gm" x="1270" y="300" width="35" height="80"/>
            <text className="text-label" x="1287.5" y="345">H11</text>
            <rect id="H12" className="aisle-gm" x="1315" y="300" width="35" height="80"/>
            <text className="text-label" x="1332.5" y="345">H12</text>
            <rect id="H13" className="aisle-gm" x="1360" y="300" width="35" height="80"/>
            <text className="text-label" x="1377.5" y="345">H13</text>
            <rect id="H14" className="aisle-gm" x="1405" y="300" width="35" height="80"/>
            <text className="text-label" x="1422.5" y="345">H14</text>
            <rect id="H15" className="aisle-gm" x="1450" y="300" width="35" height="80"/>
            <text className="text-label" x="1467.5" y="345">H15</text>
            <rect id="H16" className="aisle-gm" x="1495" y="300" width="35" height="80"/>
            <text className="text-label" x="1512.5" y="345">H16</text>
            <rect id="H17" className="aisle-gm" x="1540" y="300" width="35" height="80"/>
            <text className="text-label" x="1557.5" y="345">H17</text>
          </g>
          <g id="group-I">
            <rect id="I1" className="aisle-gm" x="820" y="390" width="35" height="80"/>
            <text className="text-label" x="837.5" y="435">I1</text>
            <rect id="I2" className="aisle-gm" x="865" y="390" width="35" height="80"/>
            <text className="text-label" x="882.5" y="435">I2</text>
            <rect id="I3" className="aisle-gm" x="910" y="390" width="35" height="80"/>
            <text className="text-label" x="927.5" y="435">I3</text>
            <rect id="I4" className="aisle-gm" x="955" y="390" width="35" height="80"/>
            <text className="text-label" x="972.5" y="435">I4</text>
            <rect id="I5" className="aisle-gm" x="1000" y="390" width="35" height="80"/>
            <text className="text-label" x="1017.5" y="435">I5</text>
            <rect id="I6" className="aisle-gm" x="1045" y="390" width="35" height="80"/>
            <text className="text-label" x="1062.5" y="435">I6</text>
            <rect id="I7" className="aisle-gm" x="1090" y="390" width="35" height="80"/>
            <text className="text-label" x="1107.5" y="435">I7</text>
            <rect id="I8" className="aisle-gm" x="1135" y="390" width="35" height="80"/>
            <text className="text-label" x="1152.5" y="435">I8</text>
            <rect id="I9" className="aisle-gm" x="1180" y="390" width="35" height="80"/>
            <text className="text-label" x="1197.5" y="435">I9</text>
            <rect id="I10" className="aisle-gm" x="1225" y="390" width="35" height="80"/>
            <text className="text-label" x="1242.5" y="435">I10</text>
            <rect id="I11" className="aisle-gm" x="1270" y="390" width="35" height="80"/>
            <text className="text-label" x="1287.5" y="435">I11</text>
            <rect id="I12" className="aisle-gm" x="1315" y="390" width="35" height="80"/>
            <text className="text-label" x="1332.5" y="435">I12</text>
          </g>
          <g id="group-J">
            <rect id="J1" className="aisle-gm" x="820" y="480" width="35" height="80"/>
            <text className="text-label" x="837.5" y="525">J1</text>
            <rect id="J2" className="aisle-gm" x="865" y="480" width="35" height="80"/>
            <text className="text-label" x="882.5" y="525">J2</text>
            <rect id="J3" className="aisle-gm" x="910" y="480" width="35" height="80"/>
            <text className="text-label" x="927.5" y="525">J3</text>
            <rect id="J4" className="aisle-gm" x="955" y="480" width="35" height="80"/>
            <text className="text-label" x="972.5" y="525">J4</text>
            <rect id="J5" className="aisle-gm" x="1000" y="480" width="35" height="80"/>
            <text className="text-label" x="1017.5" y="525">J5</text>
            <rect id="J6" className="aisle-gm" x="1045" y="480" width="35" height="80"/>
            <text className="text-label" x="1062.5" y="525">J6</text>
            <rect id="J7" className="aisle-gm" x="1090" y="480" width="35" height="80"/>
            <text className="text-label" x="1107.5" y="525">J7</text>
            <rect id="J8" className="aisle-gm" x="1135" y="480" width="35" height="80"/>
            <text className="text-label" x="1152.5" y="525">J8</text>
          </g>
          <g id="group-K">
            <rect id="K1" className="aisle-gm" x="820" y="570" width="35" height="80"/>
            <text className="text-label" x="837.5" y="615">K1</text>
            <rect id="K2" className="aisle-gm" x="865" y="570" width="35" height="80"/>
            <text className="text-label" x="882.5" y="615">K2</text>
            <rect id="K3" className="aisle-gm" x="910" y="570" width="35" height="80"/>
            <text className="text-label" x="927.5" y="615">K3</text>
            <rect id="K4" className="aisle-gm" x="955" y="570" width="35" height="80"/>
            <text className="text-label" x="972.5" y="615">K4</text>
            <rect id="K5" className="aisle-gm" x="1000" y="570" width="35" height="80"/>
            <text className="text-label" x="1017.5" y="615">K5</text>
            <rect id="K6" className="aisle-gm" x="1045" y="570" width="35" height="80"/>
            <text className="text-label" x="1062.5" y="615">K6</text>
            <rect id="K7" className="aisle-gm" x="1090" y="570" width="35" height="80"/>
            <text className="text-label" x="1107.5" y="615">K7</text>
            <rect id="K8" className="aisle-gm" x="1135" y="570" width="35" height="80"/>
            <text className="text-label" x="1152.5" y="615">K8</text>
            <rect id="K9" className="aisle-gm" x="1180" y="570" width="35" height="80"/>
            <text className="text-label" x="1197.5" y="615">K9</text>
            <rect id="K10" className="aisle-gm" x="1225" y="570" width="35" height="80"/>
            <text className="text-label" x="1242.5" y="615">K10</text>
            <rect id="K11" className="aisle-gm" x="1270" y="570" width="35" height="80"/>
            <text className="text-label" x="1287.5" y="615">K11</text>
            <rect id="K12" className="aisle-gm" x="1315" y="570" width="35" height="80"/>
            <text className="text-label" x="1332.5" y="615">K12</text>
          </g>
          <g id="group-L">
            <rect id="L1" className="aisle-gm" x="820" y="660" width="35" height="80"/>
            <text className="text-label" x="837.5" y="705">L1</text>
            <rect id="L2" className="aisle-gm" x="865" y="660" width="35" height="80"/>
            <text className="text-label" x="882.5" y="705">L2</text>
            <rect id="L3" className="aisle-gm" x="910" y="660" width="35" height="80"/>
            <text className="text-label" x="927.5" y="705">L3</text>
            <rect id="L4" className="aisle-gm" x="955" y="660" width="35" height="80"/>
            <text className="text-label" x="972.5" y="705">L4</text>
            <rect id="L5" className="aisle-gm" x="1000" y="660" width="35" height="80"/>
            <text className="text-label" x="1017.5" y="705">L5</text>
            <rect id="L6" className="aisle-gm" x="1045" y="660" width="35" height="80"/>
            <text className="text-label" x="1062.5" y="705">L6</text>
            <rect id="L7" className="aisle-gm" x="1090" y="660" width="35" height="80"/>
            <text className="text-label" x="1107.5" y="705">L7</text>
            <rect id="L8" className="aisle-gm" x="1135" y="660" width="35" height="80"/>
            <text className="text-label" x="1152.5" y="705">L8</text>
            <rect id="L9" className="aisle-gm" x="1180" y="660" width="35" height="80"/>
            <text className="text-label" x="1197.5" y="705">L9</text>
            <rect id="L10" className="aisle-gm" x="1225" y="660" width="35" height="80"/>
            <text className="text-label" x="1242.5" y="705">L10</text>
            <rect id="L11" className="aisle-gm" x="1270" y="660" width="35" height="80"/>
            <text className="text-label" x="1287.5" y="705">L11</text>
            <rect id="L12" className="aisle-gm" x="1315" y="660" width="35" height="80"/>
            <text className="text-label" x="1332.5" y="705">L12</text>
            <rect id="L13" className="aisle-gm" x="1360" y="660" width="35" height="80"/>
            <text className="text-label" x="1377.5" y="705">L13</text>
            <rect id="L14" className="aisle-gm" x="1405" y="660" width="35" height="80"/>
            <text className="text-label" x="1422.5" y="705">L14</text>
            <rect id="L15" className="aisle-gm" x="1450" y="660" width="35" height="80"/>
            <text className="text-label" x="1467.5" y="705">L15</text>
          </g>
          <g id="group-M">
            <rect id="M1" className="aisle-gm" x="820" y="750" width="35" height="80"/>
            <text className="text-label" x="837.5" y="795">M1</text>
            <rect id="M2" className="aisle-gm" x="865" y="750" width="35" height="80"/>
            <text className="text-label" x="882.5" y="795">M2</text>
            <rect id="M3" className="aisle-gm" x="910" y="750" width="35" height="80"/>
            <text className="text-label" x="927.5" y="795">M3</text>
            <rect id="M4" className="aisle-gm" x="955" y="750" width="35" height="80"/>
            <text className="text-label" x="972.5" y="795">M4</text>
            <rect id="M5" className="aisle-gm" x="1000" y="750" width="35" height="80"/>
            <text className="text-label" x="1017.5" y="795">M5</text>
            <rect id="M6" className="aisle-gm" x="1045" y="750" width="35" height="80"/>
            <text className="text-label" x="1062.5" y="795">M6</text>
            <rect id="M7" className="aisle-gm" x="1090" y="750" width="35" height="80"/>
            <text className="text-label" x="1107.5" y="795">M7</text>
            <rect id="M8" className="aisle-gm" x="1135" y="750" width="35" height="80"/>
            <text className="text-label" x="1152.5" y="795">M8</text>
            <rect id="M9" className="aisle-gm" x="1180" y="750" width="35" height="80"/>
            <text className="text-label" x="1197.5" y="795">M9</text>
          </g>
          <g id="group-N">
            <rect id="N1" className="aisle-gm" x="1225" y="750" width="35" height="80"/>
            <text className="text-label" x="1242.5" y="795">N1</text>
            <rect id="N2" className="aisle-gm" x="1270" y="750" width="35" height="80"/>
            <text className="text-label" x="1287.5" y="795">N2</text>
            <rect id="N3" className="aisle-gm" x="1315" y="750" width="35" height="80"/>
            <text className="text-label" x="1332.5" y="795">N3</text>
            <rect id="N4" className="aisle-gm" x="1360" y="750" width="35" height="80"/>
            <text className="text-label" x="1377.5" y="795">N4</text>
            <rect id="N5" className="aisle-gm" x="1405" y="750" width="35" height="80"/>
            <text className="text-label" x="1422.5" y="795">N5</text>
            <rect id="N6" className="aisle-gm" x="1450" y="750" width="35" height="80"/>
            <text className="text-label" x="1467.5" y="795">N6</text>
            <rect id="N7" className="aisle-gm" x="1495" y="750" width="35" height="80"/>
            <text className="text-label" x="1512.5" y="795">N7</text>
            <rect id="N8" className="aisle-gm" x="1540" y="750" width="35" height="80"/>
            <text className="text-label" x="1557.5" y="795">N8</text>
          </g>
          <g id="group-O">
            <rect id="O1" className="aisle-gm" x="820" y="840" width="35" height="80"/>
            <text className="text-label" x="837.5" y="885">O1</text>
            <rect id="O2" className="aisle-gm" x="865" y="840" width="35" height="80"/>
            <text className="text-label" x="882.5" y="885">O2</text>
            <rect id="O3" className="aisle-gm" x="910" y="840" width="35" height="80"/>
            <text className="text-label" x="927.5" y="885">O3</text>
            <rect id="O4" className="aisle-gm" x="955" y="840" width="35" height="80"/>
            <text className="text-label" x="972.5" y="885">O4</text>
            <rect id="O5" className="aisle-gm" x="1000" y="840" width="35" height="80"/>
            <text className="text-label" x="1017.5" y="885">O5</text>
            <rect id="O6" className="aisle-gm" x="1045" y="840" width="35" height="80"/>
            <text className="text-label" x="1062.5" y="885">O6</text>
            <rect id="O7" className="aisle-gm" x="1090" y="840" width="35" height="80"/>
            <text className="text-label" x="1107.5" y="885">O7</text>
            <rect id="O8" className="aisle-gm" x="1135" y="840" width="35" height="80"/>
            <text className="text-label" x="1152.5" y="885">O8</text>
            <rect id="O9" className="aisle-gm" x="1180" y="840" width="35" height="80"/>
            <text className="text-label" x="1197.5" y="885">O9</text>
            <rect id="O10" className="aisle-gm" x="1225" y="840" width="35" height="80"/>
            <text className="text-label" x="1242.5" y="885">O10</text>
            <rect id="O11" className="aisle-gm" x="1270" y="840" width="35" height="80"/>
            <text className="text-label" x="1287.5" y="885">O11</text>
            <rect id="O12" className="aisle-gm" x="1315" y="840" width="35" height="80"/>
            <text className="text-label" x="1332.5" y="885">O12</text>
          </g>
          <g id="group-P">
            <rect id="P1" className="aisle-gm" x="570" y="710" width="30" height="100"/>
            <text className="text-label" x="585" y="765">P1</text>
            <rect id="P2" className="aisle-gm" x="610" y="710" width="30" height="100"/>
            <text className="text-label" x="625" y="765">P2</text>
            <rect id="P3" className="aisle-gm" x="650" y="710" width="30" height="100"/>
            <text className="text-label" x="665" y="765">P3</text>
            <rect id="P4" className="aisle-gm" x="690" y="710" width="30" height="100"/>
            <text className="text-label" x="705" y="765">P4</text>
            <rect id="P5" className="aisle-gm" x="730" y="710" width="30" height="100"/>
            <text className="text-label" x="745" y="765">P5</text>
            <rect id="P6" className="aisle-gm" x="770" y="710" width="30" height="100"/>
            <text className="text-label" x="785" y="765">P6</text>
          </g>
          <g id="group-Q">
            <rect id="Q1" className="aisle-gm" x="590" y="820" width="30" height="100"/>
            <text className="text-label" x="605" y="875">Q1</text>
            <rect id="Q2" className="aisle-gm" x="630" y="820" width="30" height="100"/>
            <text className="text-label" x="645" y="875">Q2</text>
            <rect id="Q3" className="aisle-gm" x="670" y="820" width="30" height="100"/>
            <text className="text-label" x="685" y="875">Q3</text>
            <rect id="Q4" className="aisle-gm" x="710" y="820" width="30" height="100"/>
            <text className="text-label" x="725" y="875">Q4</text>
            <rect id="Q5" className="aisle-gm" x="750" y="820" width="30" height="100"/>
            <text className="text-label" x="765" y="875">Q5</text>
          </g>
          <g id="group-R">
            <rect id="R1" className="aisle-gm" x="1360" y="120" width="35" height="80"/>
            <text className="text-label" x="1377.5" y="165">R1</text>
            <rect id="R2" className="aisle-gm" x="1405" y="120" width="35" height="80"/>
            <text className="text-label" x="1422.5" y="165">R2</text>
            <rect id="R3" className="aisle-gm" x="1450" y="120" width="35" height="80"/>
            <text className="text-label" x="1467.5" y="165">R3</text>
            <rect id="R4" className="aisle-gm" x="1495" y="120" width="35" height="80"/>
            <text className="text-label" x="1512.5" y="165">R4</text>
            <rect id="R5" className="aisle-gm" x="1540" y="120" width="35" height="80"/>
            <text className="text-label" x="1557.5" y="165">R5</text>
            <rect id="R6" className="aisle-gm" x="1360" y="210" width="35" height="80"/>
            <text className="text-label" x="1377.5" y="255">R6</text>
            <rect id="R7" className="aisle-gm" x="1405" y="210" width="35" height="80"/>
            <text className="text-label" x="1422.5" y="255">R7</text>
            <rect id="R8" className="aisle-gm" x="1450" y="210" width="35" height="80"/>
            <text className="text-label" x="1467.5" y="255">R8</text>
            <rect id="R9" className="aisle-gm" x="1495" y="210" width="35" height="80"/>
            <text className="text-label" x="1512.5" y="255">R9</text>
            <rect id="R10" className="aisle-gm" x="1540" y="210" width="35" height="80"/>
            <text className="text-label" x="1557.5" y="255">R10</text>
            <rect id="R11" className="aisle-gm" x="1585" y="210" width="35" height="80"/>
            <text className="text-label" x="1602.5" y="255">R11</text>
            <rect id="R12" className="aisle-gm" x="1630" y="210" width="35" height="80"/>
            <text className="text-label" x="1647.5" y="255">R12</text>
            <rect id="R13" className="aisle-gm" x="1675" y="210" width="35" height="80"/>
            <text className="text-label" x="1692.5" y="255">R13</text>
            <rect id="R14" className="aisle-gm" x="1585" y="120" width="35" height="80"/>
            <text className="text-label" x="1602.5" y="165">R14</text>
            <rect id="R15" className="aisle-gm" x="1630" y="120" width="35" height="80"/>
            <text className="text-label" x="1647.5" y="165">R15</text>
          </g>
          <g id="group-S">
            <rect id="S1" className="aisle-gm" x="1360" y="390" width="35" height="80"/>
            <text className="text-label" x="1377.5" y="435">S1</text>
            <rect id="S2" className="aisle-gm" x="1405" y="390" width="35" height="80"/>
            <text className="text-label" x="1422.5" y="435">S2</text>
            <rect id="S3" className="aisle-gm" x="1450" y="390" width="35" height="80"/>
            <text className="text-label" x="1467.5" y="435">S3</text>
            <rect id="S4" className="aisle-gm" x="1495" y="390" width="35" height="80"/>
            <text className="text-label" x="1512.5" y="435">S4</text>
            <rect id="S5" className="aisle-gm" x="1540" y="390" width="35" height="80"/>
            <text className="text-label" x="1557.5" y="435">S5</text>
            <rect id="S6" className="aisle-gm" x="1360" y="480" width="35" height="80"/>
            <text className="text-label" x="1377.5" y="525">S6</text>
            <rect id="S7" className="aisle-gm" x="1405" y="480" width="35" height="80"/>
            <text className="text-label" x="1422.5" y="525">S7</text>
            <rect id="S8" className="aisle-gm" x="1450" y="480" width="35" height="80"/>
            <text className="text-label" x="1467.5" y="525">S8</text>
            <rect id="S9" className="aisle-gm" x="1495" y="480" width="35" height="80"/>
            <text className="text-label" x="1512.5" y="525">S9</text>
          </g>


          {/* Render pins */}
          {pins.map(pin => (
            <g key={pin.id} className="pin">
              <path
                d={`M${pin.cx},${pin.cy} L${pin.cx - 17},${pin.cy - 48 + 17} A17,17,0,1,1,${pin.cx + 17},${pin.cy - 48 + 17} Z`}
                fill={pin.color}
                stroke="#ffffff"
                strokeWidth="2"
              />
              <circle
                cx={pin.cx}
                cy={pin.cy - 48 + 17}
                r="8"
                fill="white"
              />
            </g>
          ))}
        </svg>
      </div>
      
      {/* Location Legend */}
      <div className="map-legend">
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: '#22c55e' }}></div>
          <span>You are here</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: '#ef4444' }}></div>
          <span>Store locations</span>
        </div>
      </div>
    </div>
  );
};

export default StoreMap;
