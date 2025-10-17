# SkyChat Frontend

Modern React frontend for SkyChat flight discovery platform.

## Tech Stack

- **React 18**: Modern UI library
- **React Router**: Client-side routing
- **Vite**: Fast build tool and dev server
- **Axios**: HTTP client for API calls

## Getting Started

### Install Dependencies

```bash
cd frontend
npm install
```

### Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

### Build for Production

```bash
npm run build
```

## Project Structure

```
frontend/
├── src/
│   ├── components/      # Reusable UI components
│   ├── pages/           # Page components
│   ├── services/        # API integration
│   ├── styles/          # CSS files
│   ├── App.jsx          # Main app component
│   └── main.jsx         # Entry point
├── public/              # Static assets
└── index.html           # HTML template
```

## Features

- **Home**: Landing page with features overview
- **Chat**: AI-powered conversational interface
- **Search**: Advanced flight, airport, and airline search
- **Analytics**: Visual dashboard with flight statistics
- **About**: Project information and tech stack

## API Integration

The frontend communicates with the Flask backend API running on port 5000. Vite proxy configuration handles API requests during development.

## Components

### Layout Components
- `Navbar`: Navigation bar with routing
- `Footer`: Page footer

### Feature Components
- `ChatMessage`: Formatted chat messages
- `RouteCard`: Flight route display
- `AirportCard`: Airport information card
- `StatCard`: Statistics display
- `SearchTabs`: Tab navigation for search

## Styling

Custom CSS with modern design:
- Gradient backgrounds
- Card-based layouts
- Responsive design
- Smooth animations
- Consistent color scheme
