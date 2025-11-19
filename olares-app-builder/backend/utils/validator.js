const yaml = require('js-yaml');

/**
 * Validate application name
 */
function validateAppName(name) {
  const errors = [];

  if (!name) {
    errors.push('App name is required');
    return errors;
  }

  if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(name)) {
    errors.push('App name must be lowercase alphanumeric with hyphens, and cannot start/end with hyphen');
  }

  if (name.length > 63) {
    errors.push('App name must be 63 characters or less');
  }

  return errors;
}

/**
 * Validate semantic version
 */
function validateSemver(version) {
  const semverRegex = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;
  return semverRegex.test(version);
}

/**
 * Validate port number
 */
function validatePort(port) {
  const portNum = parseInt(port);
  return !isNaN(portNum) && portNum >= 1 && portNum <= 65535;
}

/**
 * Validate URL
 */
function validateUrl(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate YAML syntax
 */
function validateYaml(content) {
  try {
    yaml.load(content);
    return { valid: true };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

/**
 * Validate complete project configuration
 */
function validateProject(config) {
  const errors = [];

  // Validate metadata
  if (!config.metadata) {
    errors.push('Metadata is required');
  } else {
    const nameErrors = validateAppName(config.metadata.name);
    errors.push(...nameErrors);

    if (!config.metadata.title) {
      errors.push('Title is required');
    }

    if (!config.metadata.description) {
      errors.push('Description is required');
    }

    if (!validateSemver(config.metadata.version)) {
      errors.push('Invalid semantic version format');
    }

    if (config.metadata.icon && !validateUrl(config.metadata.icon)) {
      errors.push('Icon must be a valid URL');
    }
  }

  // Validate Docker
  if (!config.docker || !config.docker.repository) {
    errors.push('Docker repository is required');
  }

  // Validate ports
  if (!config.ports || config.ports.length === 0) {
    errors.push('At least one port must be defined');
  } else {
    config.ports.forEach((port, idx) => {
      if (!port.name) {
        errors.push(`Port ${idx + 1}: name is required`);
      }
      if (!validatePort(port.containerPort)) {
        errors.push(`Port ${idx + 1}: invalid port number`);
      }
    });
  }

  // Validate resources
  if (!config.resources) {
    errors.push('Resources configuration is required');
  }

  return errors;
}

module.exports = {
  validateAppName,
  validateSemver,
  validatePort,
  validateUrl,
  validateYaml,
  validateProject
};
