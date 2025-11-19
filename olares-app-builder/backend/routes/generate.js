const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const Handlebars = require('handlebars');
const yaml = require('js-yaml');
const tar = require('tar-stream');
const { calculateAppId } = require('../utils/appid');
const { validateProject } = require('../utils/validator');

// Register Handlebars helper for equality check
Handlebars.registerHelper('eq', function(a, b) {
  return a === b;
});

/**
 * POST /api/generate
 * Generate chart files from project configuration
 */
router.post('/', async (req, res) => {
  try {
    const config = req.body;

    // Validate configuration
    const errors = validateProject(config);
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    // Calculate appid if not provided
    if (!config.metadata.appid) {
      config.metadata.appid = calculateAppId(config.metadata.name);
    }

    // Set defaults
    if (!config.metadata.maintainer) {
      config.metadata.maintainer = { name: 'community', email: '' };
    }

    // Generate files
    const files = await generateChartFiles(config);

    res.json({
      success: true,
      files,
      appid: config.metadata.appid
    });

  } catch (error) {
    console.error('Generation error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/generate/package
 * Generate and package chart as .tar.gz
 */
router.post('/package', async (req, res) => {
  try {
    const config = req.body;

    // Validate configuration
    const errors = validateProject(config);
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    // Calculate appid if not provided
    if (!config.metadata.appid) {
      config.metadata.appid = calculateAppId(config.metadata.name);
    }

    // Set defaults
    if (!config.metadata.maintainer) {
      config.metadata.maintainer = { name: 'community', email: '' };
    }

    // Generate files
    const files = await generateChartFiles(config);

    // Create tar archive
    const pack = tar.pack();
    const chunks = [];

    pack.on('data', chunk => chunks.push(chunk));
    pack.on('end', () => {
      const tarBuffer = Buffer.concat(chunks);
      const filename = `${config.metadata.name}-v${config.metadata.version}.tar.gz`;

      res.setHeader('Content-Type', 'application/gzip');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(tarBuffer);
    });

    // Add files to archive
    const appName = config.metadata.name;

    // Root files
    pack.entry({ name: `${appName}/Chart.yaml` }, files['Chart.yaml']);
    pack.entry({ name: `${appName}/OlaresManifest.yaml` }, files['OlaresManifest.yaml']);
    pack.entry({ name: `${appName}/values.yaml` }, files['values.yaml']);
    pack.entry({ name: `${appName}/README.md` }, files['README.md']);
    pack.entry({ name: `${appName}/.helmignore` }, files['.helmignore']);

    // Templates directory
    pack.entry({ name: `${appName}/templates/_helpers.tpl` }, files['templates/_helpers.tpl']);
    pack.entry({ name: `${appName}/templates/deployment.yaml` }, files['templates/deployment.yaml']);
    pack.entry({ name: `${appName}/templates/service.yaml` }, files['templates/service.yaml']);

    if (config.storage && config.storage.pvc && config.storage.pvc.enabled) {
      pack.entry({ name: `${appName}/templates/pvc.yaml` }, files['templates/pvc.yaml']);
    }

    pack.entry({ name: `${appName}/templates/NOTES.txt` }, files['templates/NOTES.txt']);

    pack.finalize();

  } catch (error) {
    console.error('Packaging error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/generate/validate
 * Validate project configuration
 */
router.post('/validate', async (req, res) => {
  try {
    const config = req.body;
    const errors = validateProject(config);

    if (errors.length > 0) {
      return res.json({ valid: false, errors });
    }

    // Try to generate files to check for template errors
    try {
      await generateChartFiles(config);
      res.json({ valid: true, errors: [] });
    } catch (error) {
      res.json({ valid: false, errors: [error.message] });
    }

  } catch (error) {
    console.error('Validation error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Generate all chart files from configuration
 */
async function generateChartFiles(config) {
  const templatesDir = path.join(__dirname, '../chart-templates');
  const files = {};

  // List of template files to generate
  const templateFiles = [
    'Chart.yaml.hbs',
    'OlaresManifest.yaml.hbs',
    'values.yaml.hbs',
    'README.md.hbs',
    '.helmignore.hbs'
  ];

  const templateSubdirFiles = [
    'templates/_helpers.tpl.hbs',
    'templates/deployment.yaml.hbs',
    'templates/service.yaml.hbs',
    'templates/pvc.yaml.hbs',
    'templates/NOTES.txt.hbs'
  ];

  // Generate root files
  for (const templateFile of templateFiles) {
    const templatePath = path.join(templatesDir, templateFile);
    const templateContent = await fs.readFile(templatePath, 'utf-8');
    const template = Handlebars.compile(templateContent);
    const outputName = templateFile.replace('.hbs', '');
    files[outputName] = template(config);
  }

  // Generate templates subdirectory files
  for (const templateFile of templateSubdirFiles) {
    const templatePath = path.join(templatesDir, templateFile);
    const templateContent = await fs.readFile(templatePath, 'utf-8');
    const template = Handlebars.compile(templateContent);
    const outputName = templateFile.replace('.hbs', '');
    files[outputName] = template(config);
  }

  return files;
}

module.exports = router;
