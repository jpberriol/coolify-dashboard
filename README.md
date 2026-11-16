# Coolify Dashboard

![React](https://img.shields.io/badge/React-19.1.1-61DAFB?style=flat&logo=react&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-20.x-339933?style=flat&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-4.18.2-000000?style=flat&logo=express&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-7.1.7-646CFF?style=flat&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-4.1.14-06B6D4?style=flat&logo=tailwindcss&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat&logo=docker&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-000000?style=flat&logo=jsonwebtokens&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat)

A modern, production-ready dashboard for monitoring Coolify applications, services, and databases with comprehensive multi-language support.

## Quick Start

### Docker Deployment

```bash
docker pull torukobyte/coolify-dashboard:latest

docker run -d -p 5000:5000 \
  --name coolify-dashboard \
  -e "ADMIN_USERNAME=admin" \
  -e "ADMIN_PASSWORD=your_secure_password" \
  -e "JWT_SECRET=your_jwt_secret_key" \
  -e "ALLOWED_ORIGINS=https://dashboard.kalayciburak.com.tr" \
  -e "COOLIFY_BASE_URL=https://coolify.kalayciburak.com.tr" \
  -e "COOLIFY_TOKEN=your_coolify_api_token" \
  -e "DASHBOARD_USER_TYPE=admin" \
  torukobyte/coolify-dashboard:latest
```

Access the dashboard at `http://localhost:5000`

---

## Installation on Coolify

### Step 1: Create New Application

Navigate to your Coolify instance and create a new application:

- Click **"Add New"** in the Coolify dashboard
- Select **"Docker Image"** as the deployment type
- Enter image name: `torukobyte/coolify-dashboard:latest`

### Step 2: General Configuration

Configure the basic settings:

- **Domain**: `dashboard.kalayciburak.com.tr`
- **Port**: `5000`
- Configure network and storage settings as needed

### Step 3: Environment Variables

Set the following required environment variables:

```env
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_secure_password
JWT_SECRET=your_jwt_secret_key
ALLOWED_ORIGINS=https://dashboard.kalayciburak.com.tr
COOLIFY_BASE_URL=https://coolify.kalayciburak.com.tr
COOLIFY_TOKEN=your_coolify_api_token
DASHBOARD_USER_TYPE=admin
```

### Step 4: Generate Coolify API Token

**Important**: Before deploying, generate your Coolify API token with proper permissions based on your user type:

#### For Viewer Mode (Read-Only Access)
1. Navigate to your Coolify instance settings
2. Go to **API Tokens** section
3. Click **"Create New Token"**
4. Select the following permissions:
   - **read**: Enable all read permissions
   - **read:sensitive**: Enable sensitive data read access
5. Copy the generated token and use it as `COOLIFY_TOKEN`
6. Set `DASHBOARD_USER_TYPE=viewer` in environment variables

**Note**: The `read:sensitive` permission is required to access detailed resource information, including environment variables and sensitive configuration data.

#### For Admin Mode (Full Control)
1. Navigate to your Coolify instance settings
2. Go to **API Tokens** section
3. Click **"Create New Token"**
4. Select the following permissions:
   - **write**: Enable all write permissions (includes read access)
5. Copy the generated token and use it as `COOLIFY_TOKEN`
6. Set `DASHBOARD_USER_TYPE=admin` in environment variables

**Note**: The `write` permission is **required** for admin features, which include:
- Starting and stopping services
- Deleting services
- Viewing live service logs with filtering
- All read operations available in viewer mode

**Warning**: Only use admin mode with users you trust, as it grants full control over your Coolify services.

### Step 5: Deploy

- Save the configuration
- Click **"Deploy"** to start the application
- The dashboard will be available at your configured domain

---

## Screenshots

### Login Screen

![Login Screen](https://raw.githubusercontent.com/kalayciburak/coolify-dashboard/master/docs/screenshots/1.png)

### Application Overview

![Application Overview](https://raw.githubusercontent.com/kalayciburak/coolify-dashboard/master/docs/screenshots/3.png)

### Real-time log monitoring with filtering

![Real-time log monitoring with filtering](https://raw.githubusercontent.com/kalayciburak/coolify-dashboard/master/docs/screenshots/4.png)

### Services Overview

![Services Overview](https://raw.githubusercontent.com/kalayciburak/coolify-dashboard/master/docs/screenshots/5.png)

### Services Details

![Services Details](https://raw.githubusercontent.com/kalayciburak/coolify-dashboard/master/docs/screenshots/6.png)

### Database Configuration

![Database Details](https://raw.githubusercontent.com/kalayciburak/coolify-dashboard/master/docs/screenshots/7.png)

---

## Environment Variables

| Variable              | Description                                                       | Example                                 | Required | Default      |
| --------------------- | ----------------------------------------------------------------- | --------------------------------------- | -------- | ------------ |
| `ADMIN_USERNAME`      | Dashboard administrator username                                  | `admin`                                 | Yes      | -            |
| `ADMIN_PASSWORD`      | Dashboard administrator password                                  | `secure_password`                       | Yes      | -            |
| `JWT_SECRET`          | Secret key for JWT token generation                               | `random_secret_key`                     | Yes      | -            |
| `ALLOWED_ORIGINS`     | CORS allowed origins (comma-separated for multiple)               | `https://dashboard.kalayciburak.com.tr` | Yes      | -            |
| `COOLIFY_BASE_URL`    | Your Coolify instance base URL                                    | `https://coolify.kalayciburak.com.tr`   | Yes      | -            |
| `COOLIFY_TOKEN`       | Coolify API token (read+read:sensitive for viewer, write for admin) | `your_api_token`                     | Yes      | -            |
| `DASHBOARD_USER_TYPE` | User access level: `viewer` (read-only) or `admin` (full control) | `admin` or `viewer`                   | No       | `viewer`     |

---

## Motivation

While using Coolify, I found myself constantly clicking through each application and service individually just to view their URLs and basic information. This repetitive process became tedious when managing multiple resources. I thought, "Why not build a simple, elegant solution that displays everything at a glance?" This dashboard was born from that need—a centralized view to monitor all resources efficiently. If others find it useful too, that's even better.

---

## Features

- **Role-Based Access Control**: Viewer mode (read-only) and Admin mode (full control)
- **Admin Service Management**:
  - Start and stop services with one click
  - Delete services directly from the dashboard
  - View live service logs with real-time streaming
  - Filter logs with keyword search
  - Auto-scroll toggle for log viewing
  - Real-time action loading states with elapsed time indicators
  - Visual feedback with animated borders and icons
  - Modern glassmorphism status banner with real-time elapsed time display
  - Localized time format (shows "1d 30s" in Turkish, "1m 30s" in English)
- **Intelligent State Management**:
  - **Zustand Store**: Lightweight, centralized state management
  - **Adaptive Polling**: Smart polling intervals (5s → 30s) for resource efficiency
  - **Optimistic Updates**: Instant UI feedback before API confirmation
  - **Silent Background Sync**: Updates data without disrupting user experience
  - **Action-Specific Loading**: Per-resource, per-action loading states
  - **Auto-Cleanup**: Prevents memory leaks with proper interval cleanup
- **Sound Effects System**: Subtle audio feedback for button interactions with toggle control in bottom-right corner
- **Multi-language Support**: Seamless switching between English and Turkish
- **Responsive Design**: Modern UI optimized for desktop and mobile devices
- **Real-time Monitoring**: Track resource status and health in real-time
- **Secure Authentication**: JWT-based authentication with secure token management
- **Monitoring** (server-side collector, no extra setup):
  - Host CPU / RAM / disk with history
  - Per-resource history charts: CPU, memory, network and disk I/O (last ~2h, in memory)
  - Container restarts, OOM kills and Docker health
  - Public URL health checks (status code, latency, uptime) and SSL expiry
  - Recent deployments per application (from the Coolify API)
  - Incidents view: active problems plus a persisted timeline (`DATA_DIR`, default `server/data`)
- **Resource Monitoring**: Monitor applications, services, and databases
- **Modern Tech Stack**: Built with React 19, Zustand, Tailwind CSS 4, and Express.js

---

## Project Structure

```
coolify-dashboard/
├── client/                 # React frontend application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── store/          # Zustand state management
│   │   ├── api/            # API client services
│   │   ├── services/       # Business logic layer
│   │   ├── utils/          # Utility functions
│   │   └── i18n/           # Internationalization (EN/TR)
├── server/                 # Express backend application
│   ├── routes/             # API route definitions
│   ├── middleware/         # Custom middleware
│   ├── services/           # Backend services
│   └── utils/              # Backend utilities
└── Dockerfile              # Docker configuration
```

---

## Development

### Prerequisites

- Node.js 20.x or higher
- npm or yarn
- Git

### Local Setup

```bash
# Clone the repository
git clone https://github.com/kalayciburak/coolify-dashboard.git

# Navigate to project directory
cd coolify-dashboard

# Install dependencies
npm install

# Create server/.env file with required variables
# See "Environment Variables" section below for all options

# Start development server
npm run dev
```

### Available Scripts

| Command          | Description                                      |
| ---------------- | ------------------------------------------------ |
| `npm run dev`    | Start both client and server in development mode |
| `npm run build`  | Build frontend for production                    |
| `npm run start`  | Start production server                          |
| `npm run lint`   | Run ESLint code quality checks                   |
| `npm run format` | Format code using Prettier                       |

---

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m 'Add new feature'`
4. Push to the branch: `git push origin feature/your-feature-name`
5. Open a Pull Request

### Guidelines

- Follow the existing code style and conventions
- Write clear and descriptive commit messages
- Add tests for new features
- Update documentation when necessary
- Ensure all tests pass before submitting PR

---

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

## Support

For bug reports, feature requests, or questions, please open an issue on [GitHub](https://github.com/kalayciburak/coolify-dashboard/issues).
