# BJJTimer - Brazilian Jiu-Jitsu Round Timer

## Overview

BJJTimer is a React-based web application designed for Brazilian Jiu-Jitsu practitioners to time their training rounds and rest periods. The application provides a clean, responsive interface with visual and audio cues to manage training sessions effectively.

🌐 **Live App**: [https://bjj-timer.com/](https://bjj-timer.com/)

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

- **Frontend Framework**: React
- **UI Components**: React Bootstrap
- **Build Tool**: Vite
- **PWA Support**: vite-plugin-pwa

## Development

### Prerequisites

- Node.js (v14 or newer recommended)
- npm or yarn package manager

### Available Scripts

In the project directory, you can run:

#### `npm run dev`

Runs the app in development mode using Vite.\
Open [http://localhost:5173](http://localhost:5173) to view it in your browser.

The page will hot-reload when you make changes.

#### `npm run build`

Builds the app for production to the `dist` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

#### `npm run preview`

Previews the production build locally.

## Installation as PWA

To install the app on mobile devices:

1. Open [https://bjj-timer.com/](https://bjj-timer.com/) in a compatible browser (Chrome, Safari, etc.)
2. For iOS: Tap the share button and select "Add to Home Screen"
3. For Android: Tap the browser menu and select "Add to Home Screen" or "Install App"

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

## Troubleshooting

- **No Sound**: Make sure your device is not muted and media volume is turned up
- **Settings Not Saving**: Check if your browser allows localStorage (private browsing may disable it)
- **Display Issues**: Try refreshing the page or testing in another browser
