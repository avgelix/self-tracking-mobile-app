# Self-Tracking Mobile App

A comprehensive, customizable self-tracking web application that enables users to monitor and analyze various aspects of their daily life through custom projects, data visualization, and widgets.

## 📋 About the Project

This self-tracking mobile app provides a flexible platform for tracking anything you want - from daily habits and wellness metrics to workout sessions, study time, or any custom activity. The app features:

- **Custom Projects**: Create unlimited tracking projects with configurable fields
- **Flexible Data Collection**: Support for 20+ field types including numbers, scales, durations, ratings, choices, dates, locations, file uploads, and more
- **Data Visualization**: Interactive charts and graphs to visualize your tracking data over time
- **Dashboard & Widgets**: Home screen widgets for quick data entry and at-a-glance statistics
- **Reminders**: Set up notifications to maintain tracking consistency
- **Data Management**: Import/export capabilities and comprehensive data persistence
- **Multi-device Sync**: Cloud synchronization via Supabase backend
- **Progressive Web App**: Mobile-friendly responsive design

### Original Design

The original Figma design is available at: https://www.figma.com/design/VH9BYhg0uniSDiV5DPybx3/Self-Tracking-Mobile-App

## 🛠️ Technologies Used

### Core Framework & Build Tools
- **React 18.3.1** - Modern React with hooks for UI components
- **TypeScript** - Type-safe development
- **Vite 6.3.5** - Fast build tool and development server with SWC plugin for React

### Styling & UI Components
- **Tailwind CSS v4.1.3** - Utility-first CSS framework
- **Radix UI** - Accessible, unstyled UI component primitives:
  - Accordion, Alert Dialog, Avatar, Checkbox, Dialog, Dropdown Menu
  - Label, Navigation Menu, Popover, Progress, Radio Group, Scroll Area
  - Select, Separator, Slider, Switch, Tabs, Toggle, Tooltip
- **shadcn/ui** - Re-usable component collection built on Radix UI
- **Lucide React** - Beautiful icon library (v0.487.0)
- **class-variance-authority** - CVA for component variants
- **tailwind-merge** - Merge Tailwind CSS classes without conflicts

### Animation & Interactions
- **Motion (Framer Motion)** - Smooth animations and transitions
- **Embla Carousel** - Touch-friendly carousel components

### Data Visualization
- **Recharts 2.15.2** - Composable charting library for React

### Forms & Input
- **React Hook Form 7.55.0** - Performant, flexible form validation
- **React Day Picker 8.10.1** - Date picker component
- **input-otp** - One-time password input component
- **cmdk** - Command menu component

### Backend & Data Persistence
- **Supabase** - Backend-as-a-Service for:
  - Authentication
  - Database (PostgreSQL)
  - Edge Functions (Hono server)
  - Real-time synchronization
  - KV store for data persistence
- **Hono** - Lightweight web framework for Edge Functions

### UI Enhancements
- **next-themes** - Theme management (dark/light mode support)
- **Sonner** - Toast notifications
- **Vaul** - Drawer component
- **react-resizable-panels** - Resizable panel layouts

## 🚀 Getting Started

### Prerequisites
- Node.js (v20 or higher recommended)
- npm or yarn package manager

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/avgelix/self-tracking-mobile-app.git
   cd self-tracking-mobile-app
   ```

2. Install dependencies:
   ```bash
   npm i
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

   The app will open automatically at http://localhost:3000

### Build for Production

```bash
npm run build
```

The production-ready files will be generated in the `build` directory.

## 📁 Project Structure

```
src/
├── components/        # React components
│   ├── ui/           # shadcn/ui components
│   ├── Dashboard.tsx # Main dashboard view
│   ├── Charts.tsx    # Data visualization
│   ├── Projects.tsx  # Project management
│   ├── Settings.tsx  # App settings
│   └── ...
├── contexts/         # React context providers
├── types/            # TypeScript type definitions
├── utils/            # Utility functions and helpers
└── styles/           # CSS and styling files
```

## 🎯 Key Features

### Field Types Supported
- **Numeric**: number, scale, rating, duration, tally
- **Text**: text, email, url, phone
- **Temporal**: date, time, datetime
- **Selection**: choice, multi-choice, boolean
- **Advanced**: location, file, path (GPS tracking), color, spectrum

### Data Management
- Local storage fallback for offline functionality
- Cloud synchronization via Supabase
- Import/export data capabilities
- Automatic data persistence

### Customization
- Custom project templates
- Configurable field types and validation
- Color and icon selection for projects
- Widget configuration for quick access

## 📄 License

This project includes components from [shadcn/ui](https://ui.shadcn.com/) used under [MIT license](https://github.com/shadcn-ui/ui/blob/main/LICENSE.md).

This project includes photos from [Unsplash](https://unsplash.com) used under [license](https://unsplash.com/license).

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

## 📝 Documentation

For detailed integration and architecture documentation, see:
- [Supabase Integration](src/SUPABASE_INTEGRATION.md)
- [Authentication Guide](src/AUTHENTICATION_GUIDE.md)
- [Data Persistence Guide](src/DATA_PERSISTENCE_GUIDE.md)
- [Changelog](changelog.md)