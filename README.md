# Jet Lag HS Portal

A web portal created for coordinating my friend group's hide-and-seek game in Tel Aviv. While inspired by the Jet Lag format, this is a personal implementation for our private game sessions. The codebase can be adapted for similar games in other cities.

## ⚠️ Important Notice

This is an **unofficial**, fan-made project for personal use. We are not affiliated with, endorsed by, or connected to the official Jet Lag series or its creators. This is a tool created for my friend group's games in Tel Aviv, though others are welcome to adapt it for their own local games.

## 🎯 Overview

This portal was built to help coordinate our Tel Aviv hide-and-seek games. It includes tools for:

- Visualizing our game boundaries in Tel Aviv
- Managing search zones across the city
- Tracking game progress
- Handling our card system and special abilities

While built specifically for our Tel Aviv games, the code can be adapted for other cities if you want to run your own game.

## 🗺️ Features

- **Tel Aviv Configuration**: 
  - Preset boundaries for our gameplay area
  - Local landmarks and zones
  - Public transport integration
- **Game Management**:
  - Define search zones
  - Track game progress
  - Handle card mechanics
- **Interactive Tools**:
  - Map visualization
  - Drawing tools
  - Distance measurements
  - Layer management

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Modern web browser with JavaScript enabled

### Installation

1. Clone the repository:
```bash
git clone https://github.com/[your-username]/jetlag-hs-portal.git
cd jetlag-hs-portal
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Start the development server:
```bash
npm run dev
# or
yarn dev
```

## 🏗️ Project Structure

```
jetlag-hs-portal/
├── src/
│   ├── components/         # Reusable React components
│   │   ├── common/        # Common UI components
│   │   └── map/          # Map-specific components
│   ├── pages/             # Main application pages
│   ├── types/             # TypeScript type definitions
│   └── utils/             # Helper functions and utilities
├── public/                # Static assets
└── data/                  # Game data and configurations
```

## 🛠️ Technology Stack

- React
- TypeScript
- Leaflet (map visualization)
- Tailwind CSS (styling)
- Lucide React (icons)

## 🤝 Contributing

While this is primarily for personal use, contributions are welcome if you'd like to improve the core functionality. Please read our contributing guidelines before submitting pull requests.

### Trademark and Copyright Notice

When contributing, please be mindful of intellectual property rights:
- Do not include any copyrighted material from the official Jet Lag series
- Avoid using any official logos, marks, or branding
- Keep contributions focused on the technical implementation of hide-and-seek game mechanics

### Development Workflow

1. Create a new branch for your feature:
```bash
git checkout -b feature/your-feature-name
```

2. Make your changes and commit them:
```bash
git commit -m "feat: add new feature"
```

3. Push to your branch:
```bash
git push origin feature/your-feature-name
```

4. Create a Pull Request

### Code Style

- Follow the existing code style
- Use TypeScript for type safety
- Write meaningful commit messages following [Conventional Commits](https://www.conventionalcommits.org/)
- Include appropriate documentation and comments

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

- This project is inspired by the Jet Lag series, though we are not affiliated with them
- OpenStreetMap contributors
- React and Leaflet communities
