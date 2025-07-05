# Installation

## Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [npm](https://www.npmjs.com/) (v8 or higher)

## Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/halbritter-lab/nc-scorer.git
   cd nc-scorer
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```
   
   To expose on your network:
   ```bash
   npm run dev -- --host
   ```

4. **Build for production**
   ```bash
   npm run build
   ```

5. **Preview production build**
   ```bash
   npm run preview
   ```

## Development Server

The application runs on `http://localhost:5173` by default. The development server includes:

- Hot module replacement
- Ensembl API proxy (`/ensembl/` routes)
- Performance monitoring (enable via `ENABLE_PERFORMANCE_HINTS`)

## Common Issues

### WSL Users
The development server includes polling configuration for better compatibility with Windows Subsystem for Linux.

### Port Conflicts
If port 5173 is in use, Vite will automatically try the next available port.