# Store Map Features

## Overview
The StorePal application now includes an interactive store map that automatically shows when the AI agent mentions specific aisle locations. The map displays the WinMart store layout with all aisles and departments.

## Features

### 1. Automatic Map Display
- The map automatically appears when the AI agent mentions aisle locations (e.g., "A5", "K10", "N8")
- The animation UI is hidden when the map is shown
- Users can manually toggle the map using the "Show Map" / "Hide Map" button

### 2. Interactive Pins
- **Green Pin (N8)**: Automatically placed at N8 location when map is first shown
- **Red Pins**: Automatically placed on aisles mentioned by the AI agent
- Pins are interactive with hover effects
- Users can clear all pins using the "Clear All Pins" button

### 3. Store Layout
The map includes:
- **Grocery Section**: Aisles A1-A11, B1-B16 (Dairy, Frozen, Produce, Bakery)
- **Apparel & Home**: Aisles C1-C12, D1-D10, E1-E13 (Clothing, Home goods)
- **General Merchandise**: Aisles F1-F12, G1-G11, H1-H17, I1-I12, J1-J8, K1-K12, L1-L15, M1-M9, N1-N8, O1-O12, P1-P6, Q1-Q5, R1-R15, S1-S9
- **Store Features**: Checkout, Restrooms, Entrance, Exit

### 4. Aisle Detection
The system automatically detects aisle mentions using the pattern: `[A-Z]\d{1,2}`
Examples:
- "A5" - Grocery aisle
- "K10" - General merchandise
- "N8" - Seasonal items
- "S3" - Toys & Sporting

### 5. Responsive Design
- Map scales appropriately on different screen sizes
- Maintains aspect ratio and readability
- Smooth transitions between animation and map views

## Usage

### For Users
1. Connect to the StorePal AI
2. Ask about product locations (e.g., "Where can I find milk?")
3. When the AI mentions an aisle, the map automatically appears
4. Use the "Show Map" button to manually view the map
5. Use "Clear All Pins" to remove all location markers

### For Developers
The map functionality is implemented in:
- `StoreMap.js` - React component for the map display
- `App.js` - Integration with the main application
- `App.css` - Styling for the map interface

### Key Functions
- `checkForAisleMention(text)` - Detects aisle mentions in agent responses
- `addPin(aisleId, color)` - Adds a pin to the specified aisle
- `clearPins()` - Removes all pins from the map
- `toggleMap()` - Shows/hides the map interface

## Technical Details

### Map Data
- SVG-based store layout with 1800x1150 viewBox
- Organized by department sections
- Color-coded aisle types (Grocery: Green, Apparel: Purple, GM: Blue)
- Interactive elements with hover effects

### Pin System
- Dynamic pin placement based on aisle coordinates
- Color-coded pins (Green: Default location, Red: Mentioned aisles)
- Smooth animations and transitions
- Click-to-remove functionality

### Integration
- Seamless switching between voice animation and map
- Real-time aisle detection from AI responses
- State management for map visibility and pin locations
- Responsive design for all screen sizes
