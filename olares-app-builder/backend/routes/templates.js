const express = require('express');
const router = express.Router();

/**
 * Predefined templates for common app types
 */
const templates = [
  {
    id: 'web-app-simple',
    name: 'Web App Simple',
    description: 'Simple web application with HTTP interface',
    icon: 'https://file.bttcdn.com/appstore/default/defaulticon.webp',
    preset: {
      metadata: {
        category: 'Utilities'
      },
      ports: [
        {
          name: 'http',
          containerPort: 80,
          protocol: 'TCP',
          type: 'web',
          description: 'Web interface',
          entrance: {
            enabled: true,
            title: 'Web UI',
            authLevel: 'private'
          }
        }
      ],
      storage: {
        pvc: {
          enabled: false
        },
        appData: {
          enabled: true,
          mountPath: '/appdata'
        },
        appCache: {
          enabled: true,
          mountPath: '/appcache'
        }
      },
      resources: {
        requests: {
          cpu: '100m',
          memory: '128Mi'
        },
        limits: {
          cpu: '500m',
          memory: '512Mi'
        }
      },
      environment: [],
      probes: {
        liveness: {
          enabled: true,
          type: 'httpGet',
          path: '/',
          port: 'http',
          initialDelaySeconds: 30,
          periodSeconds: 10
        },
        readiness: {
          enabled: true,
          type: 'httpGet',
          path: '/',
          port: 'http',
          initialDelaySeconds: 10,
          periodSeconds: 5
        }
      }
    }
  },
  {
    id: 'app-with-database',
    name: 'App with Database',
    description: 'Application with persistent database storage',
    icon: 'https://file.bttcdn.com/appstore/default/defaulticon.webp',
    preset: {
      metadata: {
        category: 'Productivity'
      },
      ports: [
        {
          name: 'http',
          containerPort: 8080,
          protocol: 'TCP',
          type: 'web',
          description: 'Web interface',
          entrance: {
            enabled: true,
            title: 'Web UI',
            authLevel: 'private'
          }
        }
      ],
      storage: {
        pvc: {
          enabled: true,
          size: '20Gi',
          mountPath: '/data',
          storageClass: ''
        },
        appData: {
          enabled: true,
          mountPath: '/appdata'
        },
        appCache: {
          enabled: true,
          mountPath: '/appcache'
        }
      },
      resources: {
        requests: {
          cpu: '200m',
          memory: '512Mi'
        },
        limits: {
          cpu: '2000m',
          memory: '2Gi'
        }
      },
      environment: [
        {
          name: 'DB_HOST',
          value: 'localhost',
          type: 'string',
          secret: false,
          description: 'Database host'
        },
        {
          name: 'DB_PASSWORD',
          value: 'changeme',
          type: 'string',
          secret: true,
          description: 'Database password'
        }
      ],
      probes: {
        liveness: {
          enabled: true,
          type: 'tcpSocket',
          port: 'http',
          initialDelaySeconds: 60,
          periodSeconds: 10
        },
        readiness: {
          enabled: true,
          type: 'tcpSocket',
          port: 'http',
          initialDelaySeconds: 30,
          periodSeconds: 5
        }
      }
    }
  },
  {
    id: 'mail-server',
    name: 'Mail Server',
    description: 'Mail server with multiple protocols (SMTP, IMAP)',
    icon: 'https://file.bttcdn.com/appstore/default/defaulticon.webp',
    preset: {
      metadata: {
        category: 'Communication'
      },
      ports: [
        {
          name: 'http',
          containerPort: 8080,
          protocol: 'TCP',
          type: 'web',
          description: 'Admin interface',
          entrance: {
            enabled: true,
            title: 'Admin Panel',
            authLevel: 'private'
          }
        },
        {
          name: 'smtp',
          containerPort: 25,
          protocol: 'TCP',
          type: 'network',
          description: 'SMTP server'
        },
        {
          name: 'imap',
          containerPort: 143,
          protocol: 'TCP',
          type: 'network',
          description: 'IMAP server'
        },
        {
          name: 'imaps',
          containerPort: 993,
          protocol: 'TCP',
          type: 'network',
          description: 'IMAP SSL server'
        }
      ],
      storage: {
        pvc: {
          enabled: true,
          size: '50Gi',
          mountPath: '/var/mail',
          storageClass: ''
        },
        appData: {
          enabled: true,
          mountPath: '/appdata'
        },
        appCache: {
          enabled: true,
          mountPath: '/appcache'
        }
      },
      resources: {
        requests: {
          cpu: '200m',
          memory: '512Mi'
        },
        limits: {
          cpu: '2000m',
          memory: '2Gi'
        }
      },
      environment: [
        {
          name: 'ADMIN_PASSWORD',
          value: 'changeme123',
          type: 'string',
          secret: true,
          description: 'Admin password'
        }
      ],
      probes: {
        liveness: {
          enabled: true,
          type: 'tcpSocket',
          port: 'http',
          initialDelaySeconds: 60,
          periodSeconds: 10
        },
        readiness: {
          enabled: true,
          type: 'tcpSocket',
          port: 'http',
          initialDelaySeconds: 30,
          periodSeconds: 5
        }
      }
    }
  },
  {
    id: 'media-server',
    name: 'Media Server',
    description: 'Media streaming server with large storage',
    icon: 'https://file.bttcdn.com/appstore/default/defaulticon.webp',
    preset: {
      metadata: {
        category: 'Entertainment'
      },
      ports: [
        {
          name: 'http',
          containerPort: 8096,
          protocol: 'TCP',
          type: 'web',
          description: 'Web interface',
          entrance: {
            enabled: true,
            title: 'Media Library',
            authLevel: 'private'
          }
        }
      ],
      storage: {
        pvc: {
          enabled: true,
          size: '100Gi',
          mountPath: '/media',
          storageClass: ''
        },
        appData: {
          enabled: true,
          mountPath: '/config'
        },
        appCache: {
          enabled: true,
          mountPath: '/cache'
        }
      },
      resources: {
        requests: {
          cpu: '500m',
          memory: '1Gi'
        },
        limits: {
          cpu: '4000m',
          memory: '4Gi'
        }
      },
      environment: [],
      probes: {
        liveness: {
          enabled: true,
          type: 'httpGet',
          path: '/health',
          port: 'http',
          initialDelaySeconds: 60,
          periodSeconds: 10
        },
        readiness: {
          enabled: true,
          type: 'httpGet',
          path: '/health',
          port: 'http',
          initialDelaySeconds: 30,
          periodSeconds: 5
        }
      }
    }
  },
  {
    id: 'backend-api',
    name: 'Backend API Service',
    description: 'Backend API service without web UI',
    icon: 'https://file.bttcdn.com/appstore/default/defaulticon.webp',
    preset: {
      metadata: {
        category: 'Development'
      },
      ports: [
        {
          name: 'api',
          containerPort: 3000,
          protocol: 'TCP',
          type: 'network',
          description: 'API endpoint'
        }
      ],
      storage: {
        pvc: {
          enabled: false
        },
        appData: {
          enabled: true,
          mountPath: '/appdata'
        },
        appCache: {
          enabled: true,
          mountPath: '/appcache'
        }
      },
      resources: {
        requests: {
          cpu: '100m',
          memory: '256Mi'
        },
        limits: {
          cpu: '1000m',
          memory: '1Gi'
        }
      },
      environment: [
        {
          name: 'API_KEY',
          value: '',
          type: 'string',
          secret: true,
          description: 'API authentication key'
        },
        {
          name: 'LOG_LEVEL',
          value: 'info',
          type: 'select',
          options: ['debug', 'info', 'warn', 'error'],
          secret: false,
          description: 'Logging level'
        }
      ],
      probes: {
        liveness: {
          enabled: true,
          type: 'httpGet',
          path: '/health',
          port: 'api',
          initialDelaySeconds: 30,
          periodSeconds: 10
        },
        readiness: {
          enabled: true,
          type: 'httpGet',
          path: '/health',
          port: 'api',
          initialDelaySeconds: 10,
          periodSeconds: 5
        }
      }
    }
  }
];

/**
 * GET /api/templates
 * Get all available templates
 */
router.get('/', (req, res) => {
  res.json({ templates });
});

/**
 * GET /api/templates/:id
 * Get a specific template by ID
 */
router.get('/:id', (req, res) => {
  const { id } = req.params;
  const template = templates.find(t => t.id === id);

  if (!template) {
    return res.status(404).json({ error: 'Template not found' });
  }

  res.json(template);
});

module.exports = router;
