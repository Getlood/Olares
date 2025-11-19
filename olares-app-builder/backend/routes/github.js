const express = require('express');
const router = express.Router();
const { Octokit } = require('@octokit/rest');
const axios = require('axios');

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

/**
 * POST /api/github/analyze
 * Analyze a GitHub repository to extract Docker configuration
 */
router.post('/analyze', async (req, res) => {
  try {
    const { repoUrl, branch = 'main' } = req.body;

    if (!repoUrl) {
      return res.status(400).json({ error: 'Repository URL is required' });
    }

    // Parse GitHub URL
    const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!match) {
      return res.status(400).json({ error: 'Invalid GitHub URL' });
    }

    const [, owner, repoName] = match;
    const repo = repoName.replace(/\.git$/, '');

    // Initialize Octokit
    const octokit = new Octokit(GITHUB_TOKEN ? { auth: GITHUB_TOKEN } : {});

    // Get repository info
    const { data: repoData } = await octokit.repos.get({ owner, repo });

    const result = {
      repository: {
        name: repo,
        description: repoData.description || '',
        language: repoData.language || '',
        stars: repoData.stargazers_count,
        license: repoData.license?.spdx_id || ''
      },
      docker: {
        image: null,
        ports: [],
        env: [],
        volumes: []
      }
    };

    // Try to get Dockerfile
    try {
      const { data: dockerfileData } = await octokit.repos.getContent({
        owner,
        repo,
        path: 'Dockerfile',
        ref: branch
      });

      if (dockerfileData.content) {
        const dockerfile = Buffer.from(dockerfileData.content, 'base64').toString('utf-8');
        const dockerConfig = parseDockerfile(dockerfile);
        result.docker = { ...result.docker, ...dockerConfig };
      }
    } catch (error) {
      console.log('No Dockerfile found');
    }

    // Try to get docker-compose.yml
    try {
      const { data: composeData } = await octokit.repos.getContent({
        owner,
        repo,
        path: 'docker-compose.yml',
        ref: branch
      });

      if (composeData.content) {
        const compose = Buffer.from(composeData.content, 'base64').toString('utf-8');
        const composeConfig = parseDockerCompose(compose);
        result.docker = { ...result.docker, ...composeConfig };
      }
    } catch (error) {
      console.log('No docker-compose.yml found');
    }

    // Try to get README for description
    try {
      const { data: readmeData } = await octokit.repos.getReadme({ owner, repo });
      if (readmeData.content) {
        const readme = Buffer.from(readmeData.content, 'base64').toString('utf-8');
        // Extract first paragraph as description
        const firstPara = readme.split('\n\n')[1] || readme.split('\n')[0];
        if (firstPara && !result.repository.description) {
          result.repository.description = firstPara.replace(/[#*`\[\]]/g, '').trim().substring(0, 200);
        }
      }
    } catch (error) {
      console.log('Could not read README');
    }

    res.json(result);

  } catch (error) {
    console.error('GitHub analysis error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Parse Dockerfile to extract configuration
 */
function parseDockerfile(content) {
  const result = {
    image: null,
    ports: [],
    env: [],
    volumes: []
  };

  const lines = content.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();

    // Extract FROM (last one for multi-stage builds)
    if (trimmed.startsWith('FROM ')) {
      const fromMatch = trimmed.match(/FROM\s+([^\s]+)/);
      if (fromMatch && !fromMatch[1].includes('AS')) {
        result.image = fromMatch[1];
      }
    }

    // Extract EXPOSE
    if (trimmed.startsWith('EXPOSE ')) {
      const exposeMatch = trimmed.match(/EXPOSE\s+(.+)/);
      if (exposeMatch) {
        const ports = exposeMatch[1].split(/\s+/);
        ports.forEach(port => {
          const portMatch = port.match(/(\d+)(?:\/(tcp|udp))?/);
          if (portMatch) {
            result.ports.push({
              container: parseInt(portMatch[1]),
              protocol: (portMatch[2] || 'tcp').toUpperCase(),
              name: guessPortName(parseInt(portMatch[1]))
            });
          }
        });
      }
    }

    // Extract ENV
    if (trimmed.startsWith('ENV ')) {
      const envMatch = trimmed.match(/ENV\s+([A-Z_][A-Z0-9_]*)\s*=?\s*(.*)$/);
      if (envMatch) {
        result.env.push({
          name: envMatch[1],
          default: envMatch[2].replace(/['"]/g, '')
        });
      }
    }

    // Extract VOLUME
    if (trimmed.startsWith('VOLUME ')) {
      const volumeMatch = trimmed.match(/VOLUME\s+\[?"?(\/[^\]"]+)"?\]?/);
      if (volumeMatch) {
        result.volumes.push({
          path: volumeMatch[1]
        });
      }
    }
  }

  return result;
}

/**
 * Parse docker-compose.yml to extract configuration
 */
function parseDockerCompose(content) {
  const result = {
    image: null,
    ports: [],
    env: [],
    volumes: []
  };

  try {
    const yaml = require('js-yaml');
    const compose = yaml.load(content);

    // Get first service
    const services = compose.services;
    if (services) {
      const serviceName = Object.keys(services)[0];
      const service = services[serviceName];

      // Image
      if (service.image) {
        result.image = service.image;
      }

      // Ports
      if (service.ports) {
        service.ports.forEach(port => {
          let containerPort, hostPort, protocol = 'TCP';

          if (typeof port === 'string') {
            const parts = port.split(':');
            containerPort = parseInt(parts[parts.length - 1]);
          } else if (typeof port === 'object') {
            containerPort = port.target || port.published;
            protocol = (port.protocol || 'tcp').toUpperCase();
          }

          if (containerPort) {
            result.ports.push({
              container: containerPort,
              protocol,
              name: guessPortName(containerPort)
            });
          }
        });
      }

      // Environment
      if (service.environment) {
        if (Array.isArray(service.environment)) {
          service.environment.forEach(env => {
            const [name, value] = env.split('=');
            result.env.push({ name, default: value || '' });
          });
        } else {
          Object.entries(service.environment).forEach(([name, value]) => {
            result.env.push({ name, default: value || '' });
          });
        }
      }

      // Volumes
      if (service.volumes) {
        service.volumes.forEach(vol => {
          let volumePath;
          if (typeof vol === 'string') {
            const parts = vol.split(':');
            volumePath = parts[1] || parts[0];
          } else if (typeof vol === 'object') {
            volumePath = vol.target;
          }

          if (volumePath && volumePath.startsWith('/')) {
            result.volumes.push({ path: volumePath });
          }
        });
      }
    }
  } catch (error) {
    console.error('Error parsing docker-compose.yml:', error);
  }

  return result;
}

/**
 * Guess port name based on common port numbers
 */
function guessPortName(port) {
  const portNames = {
    80: 'http',
    443: 'https',
    8080: 'http',
    8443: 'https',
    3000: 'http',
    5000: 'http',
    25: 'smtp',
    587: 'smtp-submission',
    465: 'smtps',
    143: 'imap',
    993: 'imaps',
    110: 'pop3',
    995: 'pop3s',
    3306: 'mysql',
    5432: 'postgres',
    6379: 'redis',
    27017: 'mongodb',
    9200: 'elasticsearch',
    5672: 'rabbitmq'
  };

  return portNames[port] || `port-${port}`;
}

module.exports = router;
