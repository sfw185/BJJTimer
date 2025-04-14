# BJJTimer - Brazilian Jiu-Jitsu Round Timer

## Overview

BJJTimer is a React-based web application designed for Brazilian Jiu-Jitsu practitioners to time their training rounds and rest periods. The application provides a clean, responsive interface with visual and audio cues to manage training sessions effectively.

## Features

- **Customizable Round Times**: Adjust the duration of your training rounds (default: 5 minutes)
- **Customizable Rest Times**: Adjust the duration of rest periods between rounds (default: 20 seconds)
- **Visual Indicators**: 
  - Color-coded display for round time (white), rest time (blue), and ready stage (blue)
  - Blinking red indicator when round is about to end (final 10 seconds)
  - 3-second "Get Ready" countdown before the first round starts
- **Audio Notifications**:
  - "Ready" sound at the start of the initial 3-second countdown before round 1
  - "Go" sound at the start of each round
  - "Soon" sound when 10 seconds are left in a round
  - "Ready" sound 3 seconds before a rest period ends
  - "Finish" sound when a round ends
- **Persistent Settings**: Round and rest time preferences are saved to localStorage
- **Progressive Web App (PWA) Support**: Can be installed on mobile devices for offline use
- **Responsive Design**: Works on desktop, tablet, and mobile devices

## Technical Details

### Technology Stack

- **Frontend Framework**: React 18.2.0
- **UI Components**: React Bootstrap 2.9.1
- **Build Tool**: Vite 5.0.0
- **PWA Support**: vite-plugin-pwa 0.20.1

### Project Structure

```
BJJTimer/
├── public/                 # Static assets
│   ├── favicon.ico         # App icon
│   ├── go.mp3              # Sound file for round start
│   ├── soon.mp3            # Sound file for "10 seconds left" warning
│   ├── ready.mp3           # Sound file for "get ready" warning
│   ├── finish.mp3          # Sound file for round end
│   ├── logo.png            # App logo
│   ├── manifest.json       # PWA manifest
│   └── ...
├── src/                    # Source code
│   ├── App.jsx             # Main application component
│   ├── Timer.jsx           # Core timer functionality
│   ├── Timer.css           # Styling
│   ├── main.jsx            # Entry point
│   └── utils/
│       └── storage.js      # Local storage utilities
├── index.html              # HTML entry point
├── package.json            # Dependencies and scripts
└── vite.config.js          # Vite configuration
```

### Key Components

#### Timer.jsx

The main component that handles all the timer functionality:

- Uses React hooks for state management (useState, useEffect, useRef, useCallback)
- Implements audio cues using the Web Audio API
- Handles timing logic with precision updates (5 updates per second)
- Provides UI for controlling and displaying the timer state

#### storage.js

Utility functions to manage persistence of user preferences:

- `loadFromLocalStorage`: Retrieves saved settings with fallback defaults
- `saveToLocalStorage`: Saves user preferences to browser's localStorage

## Installation and Setup

### Prerequisites

- Node.js (v14 or newer recommended)
- npm or yarn package manager

### Development Setup

1. Clone the repository or download the source code
2. Navigate to the project directory
3. Install dependencies:
   ```
   npm install
   ```
4. Start the development server:
   ```
   npm run dev
   ```
5. Open your browser to the URL shown in the terminal (typically http://localhost:5173)

### Building for Production

To create a production-ready build:

```
npm run build
```

The built files will be in the `dist` directory and can be deployed to any static web server.

## Usage Instructions

1. **Setting Time Durations**:
   - Use the "+" and "-" buttons next to "Round" to adjust round duration (30-second increments)
   - Use the "+" and "-" buttons next to "Rest" to adjust rest duration (10-second increments)

2. **Controls**:
   - Click the "Start" button to begin the timer
   - During an active session, the button changes to "Stop" which pauses the timer
   - "Reset" returns to the initial state and resets the round counter

3. **Understanding the Display**:
   - The current time is shown at the top
   - The status ("Get Ready", "Round X", or "Rest X") is displayed below that
   - The large numbers show the remaining time in the current round, rest period, or ready countdown
   - The timer display turns red and blinks when 10 seconds remain in a round
   - When starting the first round, there is a 3-second "Get Ready" countdown with blue display

4. **Audio Cues**:
   - Start of round: "Go" sound
   - 10 seconds left in round: "Soon" sound
   - 3 seconds before rest ends: "Ready" sound
   - End of round: "Finish" sound

## PWA Installation

To install the app on mobile devices:

1. Open the website in a compatible browser (Chrome, Safari, etc.)
2. For iOS: Tap the share button and select "Add to Home Screen"
3. For Android: Tap the browser menu and select "Add to Home Screen" or "Install App"

## Troubleshooting

- **No Sound**: Make sure your device is not muted and media volume is turned up
- **Settings Not Saving**: Check if your browser allows localStorage (private browsing may disable it)
- **Display Issues**: Try refreshing the page or testing in another browser

## License

This project is private and not licensed for public distribution.
