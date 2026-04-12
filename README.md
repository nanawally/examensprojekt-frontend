# Music Runner

This repository contains the frontend for Music Runner, a 2D side-scrolling rhythm game built with [Phaser](https://phaser.io/) and [React](https://react.dev/). The project is bootstrapped with [Vite](https://vitejs.dev/) and written in [TypeScript](https://www.typescriptlang.org/).

## Gameplay

In Music Runner, the player controls a character that runs automatically from left to right. The objective is to jump and collect musical notes that scroll towards the player.

-   **Rhythm & Music:** Levels are synchronized to multi-track songs. Each level corresponds to a specific vocal part (e.g., Soprano, Alto).
-   **Scoring:** Successfully collecting a note awards points.
-   **Dynamic Audio:** If the player misses a note, the audio track for their specific part fades out. Successfully collecting another note will fade the music back in, providing instant auditory feedback on performance.
-   **Levels:** The game supports multiple songs and parts, each with unique character sprites, backgrounds, and note patterns defined in JSON "song maps".

## Features

-   **Phaser & React Integration:** Utilizes React to initialize and manage the Phaser game canvas within a modern web application structure.
-   **Data-Driven Levels:** Songs, parts, character sprites, and note timings are all configured through a central `SongRegistry` and external JSON files, making it easy to add new content.
-   **Responsive Canvas:** The game view automatically resizes to fit the browser window while maintaining the aspect ratio.
-   **Custom Phaser UI:** In-game menus and popups for song/part selection and player information are built using custom UI components within Phaser.
-   **Backend Integration:** An `ApiService` is implemented to submit run data, including hit/miss events, to a backend for scoring and leaderboard functionality.
-   **Multi-track Audio System:** Manages and synchronizes multiple audio tracks, dynamically adjusting the volume of the player-controlled track based on performance.

## Project Structure

The codebase is organized to separate game logic, assets, and configuration.

```
nanawally-examensprojekt-frontend/
├── public/
│   └── assets/             # All game assets (images, spritesheets, audio, song maps)
├── src/
│   ├── components/ui/      # Reusable Phaser UI components (Button, Popup)
│   ├── logic/              # Core game logic (ApiService, ScoreManager)
│   ├── scenes/             # Phaser scenes (Menus, Gameplay Levels)
│   │   ├── gameplay/       # Scenes for playable levels
│   │   └── util/           # Utility scenes like Start and End menus
│   ├── songconfig/         # TypeScript definitions and registry for all songs
│   ├── sprites/            # Game object classes (Player, MusicNote)
│   ├── App.tsx             # React component to mount the Phaser game
│   └── main.tsx            # Main application entry point
└── package.json            # Project dependencies and scripts
```

## Getting Started

To run the project locally, follow these steps.

**Prerequisites:**
- Node.js and npm

**Installation & Execution:**

1.  **Clone the repository:**
    ```sh
    git clone https://github.com/nanawally/examensprojekt-frontend.git
    cd examensprojekt-frontend
    ```

2.  **Install dependencies:**
    ```sh
    npm install
    ```

3.  **Run the development server:**
    ```sh
    npm run dev
    ```
    The application will be available at `http://localhost:5173`.

**Note:** For full functionality, including score submission, the corresponding [backend service](https://github.com/nanawally/examensprojekt-backend) must be running. The frontend expects the backend to be available at `http://localhost:8080`.

## Song Map Format

New levels can be created by adding JSON files that define the timing and placement of notes. The structure is as follows:

```json
{
  "notes": [
    { "time": 500, "lane": 1, "frame": 0 },
    { "time": 1000, "lane": 2, "frame": 1 },
    { "time": 1500, "lane": 1, "frame": 2 }
  ]
}
```

-   `time`: The timestamp in milliseconds from the start of the song when the note should be collected by the player.
-   `lane`: An integer representing the vertical lane where the note will appear.
-   `frame`: An optional integer specifying which frame from the music note spritesheet to use.
