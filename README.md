# Coolify Dashboard

![React](https://img.shields.io/badge/React-19.1.1-61DAFB?style=flat&logo=react&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-20.x-339933?style=flat&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-4.18.2-000000?style=flat&logo=express&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-7.1.7-646CFF?style=flat&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-4.1.14-06B6D4?style=flat&logo=tailwindcss&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat&logo=docker&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-000000?style=flat&logo=jsonwebtokens&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat)

A modern, production-ready dashboard for monitoring Coolify applications, services, and databases.

## Quick Start

### Docker

```bash
docker build -t coolify-dashboard .

docker run -d -p 5000:5000 \
  --name coolify-dashboard \
  -e "ADMIN_USERNAME=admin" \
  -e "ADMIN_PASSWORD=a_long_random_password" \
  -e "JWT_SECRET=$(openssl rand -hex 48)" \
  -e "COOLIFY_BASE_URL=https://coolify.example.com" \
  -e "COOLIFY_TOKEN=your_coolify_api_token" \
  -e "DASHBOARD_USER_TYPE=admin" \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v coolify-dashboard-data:/app/server/data \
  coolify-dashboard
```

Access the dashboard at `http://localhost:5000`.

The two `-v` options are what enable live usage and keep the monitoring history. See [Volumes](#volumes).

---

## Installation on Coolify

### Step 1: Create the application

- Click **Add New → Application** and pick your Git repository (this project).
- Build pack: **Dockerfile** (the repository root `Dockerfile`).
- Alternatively, use **Docker Image** with an image you built and pushed yourself.

### Step 2: General configuration

- **Domain**: the domain you want for the dashboard, e.g. `https://dashboard.example.com`
- **Ports Exposes**: `5000`

### Step 3: Environment variables

Add these in **Environment Variables** (see [Environment Variables](#environment-variables) for the full list):

```env
ADMIN_USERNAME=admin
ADMIN_PASSWORD=a_long_random_password
JWT_SECRET=output_of__openssl_rand_-hex_48
COOLIFY_BASE_URL=https://coolify.example.com
COOLIFY_TOKEN=your_coolify_api_token
DASHBOARD_USER_TYPE=admin
```

The server refuses to start, and prints which variables are missing, if any of the five required ones is absent.

### Step 4: Persistent storage (volumes)

Open **Persistent Storage** and add both. Details in [Volumes](#volumes).

| Type         | Source / Name         | Destination (path in container) |
| ------------ | --------------------- | ------------------------------- |
| Bind mount   | `/var/run/docker.sock` | `/var/run/docker.sock`          |
| Volume mount | `dashboard-data`      | `/app/server/data`              |

### Step 5: Create the Coolify API token

Create it in Coolify under **Keys & Tokens → API tokens** and copy it right away (it is shown only once).

| Mode                             | Token permissions                                   | `DASHBOARD_USER_TYPE` |
| -------------------------------- | --------------------------------------------------- | --------------------- |
| Viewer (read-only)               | `read`, `read:sensitive`                            | `viewer`              |
| Admin (start / stop / redeploy / logs) | `read`, `read:sensitive`, `write`, `deploy`   | `admin`               |

- `deploy` is needed for the **Redeploy** button (it calls Coolify's deploy endpoint).
- Also make sure the API is enabled: **Settings → Advanced → API Access**.
- If you restrict **Allowed IPs for API Access**, add the IP the dashboard connects from, otherwise Coolify answers `403`.

**Warning**: admin mode lets anyone who can log in start, stop and redeploy your applications.

### Step 6: Deploy

Save and click **Deploy**. Open your domain and log in with `ADMIN_USERNAME` / `ADMIN_PASSWORD`.

---

## Volumes

The dashboard needs two mounts. Without them it still starts, but monitoring is incomplete or short-lived (it logs a warning at startup).

### 1. Docker socket: `/var/run/docker.sock` (bind mount)

- **Why**: Coolify's API does not expose real resource consumption. The dashboard reads it from Docker: live CPU/RAM per resource, network and disk I/O, container restarts, OOM kills, Docker health, and host CPU/RAM/disk.
- **Mount**: source `/var/run/docker.sock` → destination `/var/run/docker.sock`. It is only used to read (list containers, stats, inspect); the dashboard never starts or stops containers through it.
- **Without it**: the Live Usage columns, charts and host panel stay empty. Status, URL health checks, SSL checks and deployments still work (they use the Coolify API and the network).
- **Scope**: it only sees containers of the server where the dashboard runs. Resources on other Coolify servers show no usage metrics.
- **Security**: access to the Docker socket is powerful. Keep the dashboard behind a strong password and HTTPS.

### 2. Data volume: `/app/server/data` (volume mount)

- **Why**: monitoring history and incident events are kept in memory and saved here. Without a volume they are erased on every redeploy.
- **Files**:
  - `monitor-history.json`: metric history (10 s samples for 3 h, 1-minute averages for 3 days, 15-minute averages for 90 days). Saved every 10 minutes and on shutdown. About 650 KB per resource at full retention (roughly 20 MB for 30 resources).
  - `monitor-events.json`: incidents timeline (up to 2000 events, 90 days).
- **Mount**: a Docker *volume* (not a bind mount), e.g. name `dashboard-data` → `/app/server/data`.
- **Custom path**: set `DATA_DIR` and mount the volume at that path instead.
- **Reset history**: stop the app, delete the volume (or both files), start again.

---

## Environment Variables

### Required

The server exits at startup with a clear message if any of these is missing.

| Variable           | Description                                                                 | Example                          |
| ------------------ | --------------------------------------------------------------------------- | -------------------------------- |
| `ADMIN_USERNAME`   | Dashboard login username                                                    | `admin`                          |
| `ADMIN_PASSWORD`   | Dashboard login password. Use 12+ characters: it is the only protection.    | `a_long_random_password`         |
| `JWT_SECRET`       | Secret that signs login tokens. Use 32+ random characters.                  | `openssl rand -hex 48`           |
| `COOLIFY_BASE_URL` | Your Coolify URL. A trailing `/` or `/api/v1` is removed automatically. It must be reachable **from the container**. | `https://coolify.example.com` |
| `COOLIFY_TOKEN`    | Coolify API token (permissions in [Step 5](#step-5-create-the-coolify-api-token)) | `1\|abc...`                     |

### Optional

| Variable              | Description                                                                                          | Default                  |
| --------------------- | ---------------------------------------------------------------------------------------------------- | ------------------------ |
| `DASHBOARD_USER_TYPE` | `viewer` (read-only) or `admin` (start, stop, redeploy, logs). Invalid values fall back to `viewer`. | `viewer`                 |
| `ALLOWED_ORIGINS`     | Extra origins allowed by CORS, comma-separated. Not needed when the UI is served by the dashboard itself (same origin is always allowed). | `http://localhost:5173` |
| `PORT`                | Port the server listens on                                                                           | `5000`                   |
| `NODE_ENV`            | `production` or `development`. Only affects startup logging.                                          | `production`             |
| `DATA_DIR`            | Folder for monitoring history and events. Mount a volume here.                                       | `/app/server/data`       |

### Monitoring tuning (optional)

| Variable                        | Description                                                              | Default  |
| ------------------------------- | ------------------------------------------------------------------------ | -------- |
| `MONITOR_RETENTION_DAYS`        | Days of history kept (also the maximum custom range)                     | `90`     |
| `MONITOR_STATS_INTERVAL_MS`     | How often container/host metrics are sampled                             | `10000`  |
| `MONITOR_RESOURCES_INTERVAL_MS` | How often resources are read from the Coolify API                        | `30000`  |
| `MONITOR_HEALTH_INTERVAL_MS`    | How often public URLs are probed                                         | `30000`  |
| `MONITOR_HISTORY_POINTS`        | Number of raw 10 s samples kept in memory (1080 = 3 h)                   | `1080`   |
| `HOST_DISK_PATH`                | Path whose disk usage is reported as the host disk                       | `/`      |

---

## Troubleshooting

| Symptom                                           | Cause and fix                                                                                                   |
| ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Container exits with `Missing required environment variables` | Add the listed variables in Coolify and redeploy.                                                  |
| `Cannot reach Coolify at ... (ENOTFOUND / ECONNREFUSED)` | `COOLIFY_BASE_URL` is wrong or not reachable from the container. Try the server IP and port.            |
| `Coolify answered 401`                            | Invalid `COOLIFY_TOKEN`.                                                                                        |
| `Coolify answered 403`                            | Token lacks permissions, or your IP is not in Coolify's *Allowed IPs for API Access*.                          |
| Redeploy button fails with 403                    | The token needs the `deploy` permission (and `write`). Create a new token; permissions cannot be edited.       |
| Live Usage / host panel empty                     | The Docker socket is not mounted. See [Volumes](#volumes).                                                      |
| Incidents timeline / history empty after redeploy | The data volume is missing. See [Volumes](#volumes).                                                            |
| Every URL shows as down                           | The container cannot reach your public domains (DNS or hairpin NAT). Check from inside the container.           |

---

## Features

- **Role-Based Access Control**: Viewer mode (read-only) and Admin mode (full control)
- **Admin Service Management**:
  - Start and stop resources with one click
  - Redeploy applications: pulls the latest code and deploys again, tracking the deployment until it finishes
  - View live service logs with real-time streaming
  - Filter logs with keyword search
  - Auto-scroll toggle for log viewing
  - Real-time action loading states with elapsed time indicators
  - Visual feedback with animated borders and icons
- **Intelligent State Management**:
  - **Zustand Store**: Lightweight, centralized state management
  - **Adaptive Polling**: Smart polling intervals (5s → 30s) for resource efficiency
  - **Optimistic Updates**: Instant UI feedback before API confirmation
  - **Silent Background Sync**: Updates data without disrupting user experience
  - **Action-Specific Loading**: Per-resource, per-action loading states
  - **Auto-Cleanup**: Prevents memory leaks with proper interval cleanup
- **Sound Effects System**: Subtle audio feedback for button interactions with a toggle in the bottom-left corner
- **Responsive Design**: Modern UI optimized for desktop and mobile devices
- **Real-time Monitoring**: Track resource status and health in real-time
- **Secure Authentication**: JWT-based authentication with secure token management
- **Monitoring** (server-side collector, no extra setup):
  - Host CPU / RAM / disk with history
  - Per-resource history charts: CPU, memory, network and disk I/O, with selectable ranges (5m, 30m, 3h, 24h or custom). History is kept for 90 days (`MONITOR_RETENTION_DAYS`) and persisted in `DATA_DIR` (default `server/data`; mount a volume at `/app/server/data`)
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
│   │   └── i18n/           # Translations (English)
├── server/                 # Express backend application
│   ├── config/             # Environment loading and validation
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
git clone https://github.com/jpberriol/coolify-dashboard.git

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

For bug reports, feature requests, or questions, please open an issue on [GitHub](https://github.com/jpberriol/coolify-dashboard/issues).
