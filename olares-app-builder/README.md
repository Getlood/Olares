# Olares App Builder

Interactive wizard to create custom Olares applications from GitHub repositories.

## Features

- **Import from GitHub**: Analyze GitHub repositories and auto-detect Docker configuration
- **Guided Wizard**: 6-step process to configure your application
- **Auto-Detection**: Automatically parse Dockerfile and docker-compose.yml
- **Validation**: Built-in validation with helm lint
- **Templates**: Start from predefined templates for common app types
- **Project Management**: Save, load, and manage multiple projects
- **Download Package**: Generate ready-to-deploy .tar.gz packages

## Installation

1. Open Olares DevBox/Studio
2. Upload `olares-app-builder-v0.1.0.tar.gz`
3. Click Install
4. Wait for deployment to complete

## Usage

### 1. Access the Application

- Open App Builder from your Olares Desktop
- You'll see the dashboard with templates and recent projects

### 2. Create New Application

Click "Create New Application" and follow the 6-step wizard:

#### Step 1: Basic Information
- Application name (lowercase, alphanumeric)
- Display title
- Short and full descriptions
- Category
- Version
- Icon URL

#### Step 2: Docker Source
Choose one of two options:
- **Analyze GitHub Repository**: Paste a GitHub URL to auto-detect configuration
- **Manual Docker Image**: Specify Docker repository and tag manually

#### Step 3: Ports Configuration
- Add ports your application exposes
- Configure which ports are web interfaces (entrances)
- Specify protocols (TCP/UDP)

#### Step 4: Storage
- Enable persistent volume (PVC) if needed
- Configure appData and appCache
- Set resource limits (CPU, memory)

#### Step 5: Environment Variables
- Add environment variables your app needs
- Mark sensitive variables as secrets
- Provide default values

#### Step 6: Review & Download
- Review your configuration
- Save project for later
- Download the generated .tar.gz package

### 3. Deploy Your Application

- Upload the downloaded package to Olares Market
- Install like any other Olares application

## Templates

Pre-configured templates available:

- **Web App Simple**: Basic web application with HTTP interface
- **App with Database**: Application with persistent database storage
- **Mail Server**: Mail server with SMTP, IMAP protocols
- **Media Server**: Media streaming with large storage
- **Backend API Service**: API service without web UI

## API Endpoints

The backend exposes the following REST API:

### Generation
- `POST /api/generate` - Generate chart files
- `POST /api/generate/package` - Generate and package chart
- `POST /api/generate/validate` - Validate configuration

### GitHub
- `POST /api/github/analyze` - Analyze GitHub repository

### Projects
- `GET /api/projects` - List all projects
- `GET /api/projects/:id` - Get specific project
- `POST /api/projects` - Create/update project
- `DELETE /api/projects/:id` - Delete project

### Templates
- `GET /api/templates` - List all templates
- `GET /api/templates/:id` - Get specific template

## Development

### Prerequisites
- Node.js 18+
- npm or yarn

### Backend Development

```bash
cd backend
npm install
npm run dev
```

Backend runs on http://localhost:3000

### Frontend Development

```bash
cd frontend
npm install
npm start
```

Frontend runs on http://localhost:3001 (proxies API to :3000)

### Build Docker Image

```bash
docker build -t olares/app-builder:1.0.0 .
```

### Run Locally

```bash
docker run -p 3000:3000 \
  -v $(pwd)/data:/appdata \
  olares/app-builder:1.0.0
```

## Architecture

```
olares-app-builder/
├── backend/              # Node.js/Express backend
│   ├── server.js        # Main server file
│   ├── routes/          # API routes
│   ├── utils/           # Utilities (validation, appid)
│   └── chart-templates/ # Handlebars templates
├── frontend/            # React frontend
│   ├── src/
│   │   ├── pages/      # Dashboard, Wizard
│   │   ├── services/   # API client
│   │   └── utils/      # Helper functions
│   └── public/
├── templates/           # Helm chart templates
├── Chart.yaml
├── OlaresManifest.yaml
├── values.yaml
└── Dockerfile
```

## Configuration

### Environment Variables

- `NODE_ENV`: Environment mode (development/production)
- `PORT`: Server port (default: 3000)
- `DATA_PATH`: Path to store project data (default: /appdata)
- `GITHUB_TOKEN`: Optional GitHub personal access token (for higher API rate limits)

## Storage

Projects are saved in:
- `/appdata/projects/`: Project JSON files
- `/appdata/temp/`: Temporary files during generation

## Resource Requirements

- **Memory**: 256Mi - 1Gi
- **CPU**: 100m - 1000m
- **Storage**: 5Gi (for project storage)

## Troubleshooting

### Port already in use
```bash
kubectl get pods -n user-space-<username> | grep app-builder
kubectl logs -n user-space-<username> <pod-name>
```

### Generation fails
- Check that all required fields are filled
- Verify Docker image exists
- Ensure at least one port is defined
- Check validation errors in the UI

### GitHub analysis fails
- Verify repository URL is correct
- Check if repository is public
- Add GITHUB_TOKEN if hitting rate limits

## Support

- GitHub: https://github.com/beclab/Olares
- Issues: https://github.com/beclab/Olares/issues

## License

Generated charts follow the license of the upstream application.
App Builder itself is open source.

## Credits

Created as part of the Olares ecosystem.
Based on the successful Stalwart v0.1.0 chart implementation.
