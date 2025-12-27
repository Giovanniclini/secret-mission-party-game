# Secret Mission - Party Game App

A sophisticated offline party game app that transforms any gathering into an engaging experience through secret missions and pass-the-phone mechanics.

## Features

- **Complete Offline Game**: No internet connection required
- **Pass-the-Phone Mechanics**: Game mechanics that involve all participants
- **Secure Mission Reveal**: Press-and-hold mission revelation system
- **Player Management**: Add/remove players during the game
- **Winner Detection**: Automatic victory system and celebration
- **Sophisticated Design**: Premium iOS-native UI without cartoon elements
- **Color-Coded Difficulty**: Visual difficulty indicators with green/orange/red badges
- **Multiple Game Modes**: Uniform difficulty or mixed difficulty modes
- **Comprehensive Mission Pool**: 150 missions across three difficulty levels

## Technical Architecture

- **Framework**: React Native + Expo + TypeScript
- **State Management**: Context + useReducer pattern
- **Persistence**: AsyncStorage for offline functionality
- **Testing**: Jest + Property-Based Testing with fast-check
- **Design System**: Custom design system with mandatory color palette

## Design System

### Color Palette
- **Primary/Brand**: `#F5B301` (gold)
- **Secondary**: `#1F2A44` (deep navy blue)
- **Accent**: `#2EC4C6` (soft teal)
- **Success**: `#10B981` (green - easy difficulty)
- **Warning**: `#F59E0B` (orange - medium difficulty)
- **Error**: `#EF4444` (red - hard difficulty)
- **Text Primary**: `#2B2B2B`
- **Background**: `#FFFFFF` / `#F5F6F8`

### Design Principles
- Modern, clean, premium iOS feel
- Engaging but NOT cartoonish or childish
- Fast and frictionless UX
- Privacy-first by design

## Installation and Setup

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Expo CLI
- iOS Simulator or iOS device

### Installation
```bash
# Clone the repository
git clone https://github.com/Giovanniclini/secret-mission-party-game.git
cd secret-mission-party-game/SecretMission

# Install dependencies
npm install

# Start the app
npm start
```

### Available Commands
```bash
npm start          # Start Expo development server
npm run ios        # Run on iOS simulator
npm run android    # Run on Android emulator
npm test           # Run all tests
npm run lint       # Run ESLint
```

## Testing

The project includes a comprehensive test suite:
- **139 tests** all passing
- **Property-Based Testing** for robust validation
- **MVP Validation** and QA checklist
- **Complete error coverage**

```bash
npm test           # Run all tests
npm run test:watch # Run tests in watch mode
```

## How to Play

1. **Setup**: Add at least 3 players
2. **Configuration**: Choose difficulty mode (Uniform or Mixed)
3. **Assignment**: Each player receives secret missions
4. **Gameplay**: Players attempt to complete their missions during the party
5. **Revelation**: Use "View or update mission status" to reveal and update
6. **Victory**: First player to complete their target missions wins!

## Key Features

### Player Management
- Dynamic add/remove during gameplay
- Name validation (2-20 characters, no duplicates)
- Minimum 3 players required

### Mission System
- **150 unique missions** across three difficulty levels:
  - **Easy (50 missions)**: 1 point each - Simple social interactions
  - **Medium (50 missions)**: 2 points each - Moderate challenges
  - **Hard (50 missions)**: 3 points each - Complex group interactions
- Secure reveal with press-and-hold
- States: Waiting → Active → Completed/Caught
- Automatic assignment for new players
- **Color-coded difficulty badges**: Green (Easy), Orange (Medium), Red (Hard)

### Game Modes
- **Uniform Mode**: All missions have the same difficulty level
- **Mixed Mode**: Players choose difficulty for each mission individually
- Configurable missions per player (1-10)

### Privacy and Security
- Never show mission lists
- Individual revelations only
- Design that protects mission content

## Project Structure

```
src/
├── screens/           # App screens
│   ├── AssignMissionsScreen.tsx    # Mission assignment with color-coded badges
│   ├── GameDashboardScreen.tsx     # Main game dashboard
│   ├── GameConfigurationScreen.tsx # Game setup and configuration
│   ├── SetupPlayersScreen.tsx      # Player management
│   ├── MyTurnScreen.tsx           # Individual mission view
│   └── EndGameScreen.tsx          # Game completion and results
├── components/        # Reusable components
│   ├── ui/           # UI components (Button, StatusIndicator)
│   ├── MissionCard.tsx           # Mission display component
│   ├── SecureReveal.tsx          # Press-and-hold reveal component
│   ├── PrivacyScreen.tsx         # Privacy protection overlay
│   └── GameRulesModal.tsx        # Game rules and instructions
├── store/            # State management (Context + Reducer)
├── models/           # TypeScript types and interfaces
├── data/             # Static data (150 missions in Italian)
├── utils/            # Utility functions
├── theme/            # Design system and constants
└── __tests__/        # Test suite (139 tests)
```

## Recent Updates

### Version 1.0 (Latest)
- **Color-coded difficulty badges**: Easy (Green), Medium (Orange), Hard (Hard)
- **Enhanced mission assignment flow**: Improved race condition handling
- **Game rules modal**: In-app instructions and help
- **Comprehensive test coverage**: 139 passing tests
- **Bug fixes**: Player 2+ loading issues resolved
- **Code cleanup**: Removed debug code and unnecessary test files

## Roadmap

- [ ] Android expansion
- [ ] More mission categories
- [ ] Tournament mode
- [ ] Theme customization
- [ ] Advanced statistics
- [ ] Mission editor
- [ ] Multiplayer networking (future consideration)

## Contributing

1. Fork the project
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License. See the `LICENSE` file for details.

## MVP Status

**Completed** - The app is ready for use with all core features implemented and tested.

---

*Developed with care to create moments of fun and connection at parties*