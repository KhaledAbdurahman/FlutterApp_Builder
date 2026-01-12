# Flutter App Builder

A visual drag-and-drop Flutter app builder built with React and TypeScript. Design Flutter applications with an intuitive interface and generate production-ready Flutter code.

![Flutter App Builder](https://img.shields.io/badge/React-18.3-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue) ![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-blue) ![Vite](https://img.shields.io/badge/Vite-5.0-purple)

## 🚀 Features

- **Visual Drag & Drop Interface** - Build Flutter UIs by dragging widgets onto a phone canvas
- **Real-time Preview** - See your Flutter app layout as you build it
- **Widget Palette** - Access layout, content, and input widgets (Scaffold, Column, Row, Text, Button, etc.)
- **Component Tree** - Navigate and manage widget hierarchy with ease
- **Properties Panel** - Customize widget properties including colors, sizes, alignment, and more
- **Multi-Screen Support** - Create multiple screens with navigation between them
- **Project Management** - Save, load, and manage multiple projects
- **Flutter Code Generation** - Export your designs as ready-to-run Flutter projects (ZIP)
- **Generation Logs** - Track build progress and debug issues

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18.0.0 or higher) - [Install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)
- **npm** (v9.0.0 or higher) or **bun** (recommended)
- **Django Backend** (for full functionality) - See [Backend Repository](https://github.com/NabilDev0/FlutterApp_Builder_Project.git)

## 🛠️ Installation

### Step 1: Clone the Repository

```bash
git clone https://github.com/KhaledAbdurahman/FlutterApp_Builder.git
cd FlutterApp_Builder
```

### Step 2: Install Dependencies

Using npm:

```bash
npm install
```

Or using bun (recommended for faster installation):

```bash
bun install
```

### Step 3: Start the Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## 🔧 Backend Setup

The Flutter App Builder requires a Django backend for full functionality including:

- Saving and loading projects
- Flutter code generation
- Project download

### Backend API Endpoints

The frontend expects the following API endpoints at `http://localhost:8000/api`:

| Endpoint                    | Method | Description                   |
| --------------------------- | ------ | ----------------------------- |
| `/projects/`                | GET    | List all saved projects       |
| `/projects/`                | POST   | Create a new project          |
| `/projects/{id}/`           | GET    | Get a specific project        |
| `/projects/{id}/`           | PATCH  | Update a project              |
| `/projects/{id}/`           | DELETE | Delete a project              |
| `/projects/{id}/generate/`  | POST   | Generate Flutter code         |
| `/projects/{id}/download/`  | GET    | Download generated ZIP        |
| `/projects/{id}/logs/`      | GET    | Get generation logs           |
| `/generate/quick_generate/` | POST   | Quick generate without saving |

### Backend Configuration

To change the backend URL, modify the `API_BASE_URL` in `src/lib/api.ts`:

```typescript
const API_BASE_URL = "http://localhost:8000/api";
```

## 📁 Project Structure

```
src/
├── components/
│   ├── builder/
│   │   ├── BuilderLayout.tsx    # Main builder container
│   │   ├── TopBar.tsx           # Navigation and actions
│   │   ├── WidgetPalette.tsx    # Draggable widget list
│   │   ├── PhoneCanvas.tsx      # Visual preview area
│   │   ├── ComponentTree.tsx    # Widget hierarchy tree
│   │   ├── PropertiesPanel.tsx  # Widget property editor
│   │   ├── ProjectManager.tsx   # Save/load projects dialog
│   │   └── GenerationLogs.tsx   # Build log viewer
│   └── ui/                      # Shadcn UI components
├── hooks/
│   └── use-mobile.tsx           # Mobile detection hook
├── lib/
│   ├── api.ts                   # Backend API service
│   └── utils.ts                 # Utility functions
├── pages/
│   ├── Index.tsx                # Main page (Builder)
│   └── NotFound.tsx             # 404 page
├── store/
│   └── builderStore.ts          # Zustand state management
├── types/
│   └── flutter.ts               # TypeScript type definitions
├── App.tsx                      # Root component with routing
├── index.css                    # Global styles and design tokens
└── main.tsx                     # Application entry point
```

## 🧩 Available Widgets

### Layout Widgets

| Widget         | Description                               |
| -------------- | ----------------------------------------- |
| **Scaffold**   | Base layout structure for screens         |
| **AppBar**     | Top navigation bar with title             |
| **Container**  | Flexible box with padding, margin, colors |
| **Row**        | Horizontal layout container               |
| **Column**     | Vertical layout container                 |
| **Stack**      | Overlay widgets on top of each other      |
| **Positioned** | Position child within Stack               |
| **Center**     | Center child widget                       |
| **Padding**    | Add padding around child                  |
| **SizedBox**   | Fixed size spacing widget                 |
| **Expanded**   | Expand to fill available space            |
| **Card**       | Material card with elevation              |
| **ListView**   | Scrollable list of items                  |

### Content Widgets

| Widget    | Description                       |
| --------- | --------------------------------- |
| **Text**  | Display text with styling options |
| **Icon**  | Material icons                    |
| **Image** | Display images from URL           |

### Input Widgets

| Widget        | Description                   |
| ------------- | ----------------------------- |
| **Button**    | Clickable button with actions |
| **TextField** | Text input field              |

## 🔄 State Management

The application uses **Zustand** for state management. The main store (`builderStore.ts`) manages:

- **Project data** - App name, package name, screens
- **Active screen** - Currently selected screen for editing
- **Selected widget** - Currently selected widget for property editing
- **Drag state** - Track drag-and-drop operations

### Key Store Actions

```typescript
// Screen management
addScreen(name: string)
deleteScreen(screenId: string)
renameScreen(screenId: string, newName: string)

// Widget management
addWidget(type: WidgetType, parentId?: string)
updateWidgetProps(widgetId: string, props: Partial<WidgetProps>)
deleteWidget(widgetId: string)
moveWidget(widgetId: string, newParentId: string | null, index?: number)

// Project management
loadProject(savedProject: SavedProject)
exportProject(): Project
setProjectName(name: string)
setPackageName(name: string)
```

## 🎨 Styling & Design System

The project uses **Tailwind CSS** with a custom design system defined in `index.css` and `tailwind.config.ts`.

### CSS Variables

```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 222.2 47.4% 11.2%;
  --secondary: 210 40% 96%;
  /* ... more tokens */
}
```

### Using Design Tokens

Always use semantic tokens instead of hardcoded colors:

```tsx
// ✅ Good
<div className="bg-background text-foreground border-border" />

// ❌ Bad
<div className="bg-white text-gray-900 border-gray-200" />
```

## 📦 Key Dependencies

| Package                 | Version   | Purpose                     |
| ----------------------- | --------- | --------------------------- |
| `react`                 | ^18.3.1   | UI framework                |
| `zustand`               | ^5.0.9    | State management            |
| `@dnd-kit/core`         | ^6.3.1    | Drag and drop functionality |
| `@tanstack/react-query` | ^5.83.0   | Server state management     |
| `framer-motion`         | ^12.24.12 | Animations                  |
| `react-router-dom`      | ^6.30.1   | Client-side routing         |
| `uuid`                  | ^13.0.0   | Unique ID generation        |
| `tailwindcss`           | ^3.4      | Utility-first CSS           |

## 🚀 Usage Guide

### Create New Project

1. Click on the `Create new project button`
2. Name the project
3. Click **Create**

### Creating a New Screen

1. Click the **+** button next to "Screens" in the left sidebar
2. Enter a name for your new screen
3. The new screen will be created with an empty canvas

### Adding Widgets

1. Open the **Widget Palette** in the left sidebar
2. Drag a widget from the palette onto the phone canvas
3. Drop it on the canvas or onto an existing widget (for nesting)

### Editing Widget Properties

1. Click on a widget in the canvas or component tree
2. The **Properties Panel** will open on the right
3. Modify properties like text, colors, sizes, alignment
4. Changes are reflected in real-time

### Saving a Project

1. Click the **Save** icon in the top bar
2. Enter a project name and optional description
3. Click **Save** to store the project on the backend

### Generating Flutter Code

1. Click the **Generate App** button in the top bar
2. Wait for the generation process to complete
3. The Flutter project will download as a ZIP file

### Running the Generated Flutter App

1. Extract the downloaded ZIP file
2. Navigate to the extracted folder
3. Run:
   ```bash
   flutter pub get
   flutter run
   ```

## 🔍 API Service

The `src/lib/api.ts` module provides typed functions for all backend interactions:

```typescript
// Project CRUD
listProjects(): Promise<SavedProject[]>
getProject(projectId: number): Promise<SavedProject>
createProject(data): Promise<SavedProject>
updateProject(projectId, data): Promise<SavedProject>
deleteProject(projectId: number): Promise<void>

// Generation
quickGenerate(payload): Promise<Blob>
generateFromSaved(projectId: number): Promise<GenerateSavedProjectResponse>
downloadProject(projectId: number): Promise<Blob>
getProjectLogs(projectId: number): Promise<GenerationLog[]>
```

## 🐛 Troubleshooting

### CORS Errors

If you see CORS errors, ensure your Django backend has CORS headers configured:

```python
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
]
```

### Generation Fails

1. Check the Generation Logs for error messages
2. Verify the backend is running at `http://localhost:8000`
3. Ensure all required widgets have valid properties

### ZIP File Won't Open

This typically means the backend returned an error instead of the ZIP file. Check:

1. Backend logs for generation errors
2. Network tab for the response content
3. Generation logs in the app

## 📝 Environment Variables

Create a `.env` file in the root directory for environment-specific configuration:

```env
VITE_API_BASE_URL=http://localhost:8000/api
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit changes: `git commit -m 'Add my feature'`
4. Push to branch: `git push origin feature/my-feature`
5. Open a Pull Request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🔗 Links

- [Flutter Documentation](https://docs.flutter.dev/)
- [React Documentation](https://react.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
