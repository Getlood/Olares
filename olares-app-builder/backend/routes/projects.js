const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

const DATA_PATH = process.env.DATA_PATH || '/appdata';
const PROJECTS_PATH = path.join(DATA_PATH, 'projects');

/**
 * GET /api/projects
 * List all saved projects
 */
router.get('/', async (req, res) => {
  try {
    await fs.mkdir(PROJECTS_PATH, { recursive: true });
    const files = await fs.readdir(PROJECTS_PATH);
    const projects = [];

    for (const file of files) {
      if (file.endsWith('.json')) {
        try {
          const content = await fs.readFile(path.join(PROJECTS_PATH, file), 'utf-8');
          const project = JSON.parse(content);
          projects.push({
            id: project.projectId,
            name: project.metadata.name,
            title: project.metadata.title,
            version: project.metadata.version,
            createdAt: project.createdAt,
            updatedAt: project.updatedAt
          });
        } catch (error) {
          console.error(`Error reading project ${file}:`, error);
        }
      }
    }

    // Sort by updated date descending
    projects.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

    res.json({ projects });

  } catch (error) {
    console.error('Error listing projects:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/projects/:id
 * Get a specific project by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const projectPath = path.join(PROJECTS_PATH, `${id}.json`);

    const content = await fs.readFile(projectPath, 'utf-8');
    const project = JSON.parse(content);

    res.json(project);

  } catch (error) {
    if (error.code === 'ENOENT') {
      return res.status(404).json({ error: 'Project not found' });
    }
    console.error('Error reading project:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/projects
 * Create or update a project
 */
router.post('/', async (req, res) => {
  try {
    const config = req.body;

    // Generate project ID if not exists
    if (!config.projectId) {
      config.projectId = crypto.randomUUID();
      config.createdAt = new Date().toISOString();
    }
    config.updatedAt = new Date().toISOString();

    // Ensure version is set
    if (!config.version) {
      config.version = '1.0';
    }

    await fs.mkdir(PROJECTS_PATH, { recursive: true });

    const projectPath = path.join(PROJECTS_PATH, `${config.projectId}.json`);
    await fs.writeFile(projectPath, JSON.stringify(config, null, 2), 'utf-8');

    res.json({
      success: true,
      projectId: config.projectId,
      message: 'Project saved successfully'
    });

  } catch (error) {
    console.error('Error saving project:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/projects/:id
 * Update an existing project
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const config = req.body;

    config.projectId = id;
    config.updatedAt = new Date().toISOString();

    const projectPath = path.join(PROJECTS_PATH, `${id}.json`);

    // Check if project exists
    try {
      await fs.access(projectPath);
    } catch {
      return res.status(404).json({ error: 'Project not found' });
    }

    await fs.writeFile(projectPath, JSON.stringify(config, null, 2), 'utf-8');

    res.json({
      success: true,
      projectId: id,
      message: 'Project updated successfully'
    });

  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/projects/:id
 * Delete a project
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const projectPath = path.join(PROJECTS_PATH, `${id}.json`);

    await fs.unlink(projectPath);

    res.json({
      success: true,
      message: 'Project deleted successfully'
    });

  } catch (error) {
    if (error.code === 'ENOENT') {
      return res.status(404).json({ error: 'Project not found' });
    }
    console.error('Error deleting project:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/projects/import
 * Import a project from JSON
 */
router.post('/import', async (req, res) => {
  try {
    const config = req.body;

    // Generate new project ID
    config.projectId = crypto.randomUUID();
    config.createdAt = new Date().toISOString();
    config.updatedAt = new Date().toISOString();

    await fs.mkdir(PROJECTS_PATH, { recursive: true });

    const projectPath = path.join(PROJECTS_PATH, `${config.projectId}.json`);
    await fs.writeFile(projectPath, JSON.stringify(config, null, 2), 'utf-8');

    res.json({
      success: true,
      projectId: config.projectId,
      message: 'Project imported successfully'
    });

  } catch (error) {
    console.error('Error importing project:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
