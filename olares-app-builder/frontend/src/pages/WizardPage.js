import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Button,
  Paper,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  CircularProgress,
  Grid,
  IconButton,
  Checkbox,
  FormControlLabel
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, CloudDownload as DownloadIcon } from '@mui/icons-material';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import api from '../services/api';
import { getDefaultConfig, categories } from '../utils/defaultConfig';

const steps = ['Basic Info', 'Docker Source', 'Ports', 'Storage', 'Environment', 'Review'];

function WizardPage() {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const location = useLocation();
  const [activeStep, setActiveStep] = useState(0);
  const [config, setConfig] = useState(getDefaultConfig());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [validationErrors, setValidationErrors] = useState([]);

  // Load project if editing
  useEffect(() => {
    if (projectId) {
      loadProject();
    } else if (location.state?.template) {
      loadTemplate(location.state.template);
    }
  }, [projectId]);

  const loadProject = async () => {
    try {
      setLoading(true);
      const res = await api.getProject(projectId);
      setConfig(res.data);
    } catch (err) {
      setError('Failed to load project: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadTemplate = async (template) => {
    try {
      const res = await api.getTemplate(template.id);
      const newConfig = { ...getDefaultConfig(), ...res.data.preset };
      setConfig(newConfig);
    } catch (err) {
      setError('Failed to load template: ' + err.message);
    }
  };

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
    setError('');
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
    setError('');
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      if (projectId) {
        await api.updateProject(projectId, config);
        setSuccess('Project saved successfully');
      } else {
        await api.saveProject(config);
        setSuccess('Project saved successfully');
      }
    } catch (err) {
      setError('Failed to save project: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
      setLoading(true);
      setValidationErrors([]);

      // Validate first
      const validateRes = await api.validateConfig(config);
      if (!validateRes.data.valid) {
        setValidationErrors(validateRes.data.errors);
        setError('Please fix validation errors before downloading');
        return;
      }

      // Generate package
      const res = await api.packageChart(config);
      const filename = `${config.metadata.name}-v${config.metadata.version}.tar.gz`;
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setSuccess(`Package downloaded: ${filename}`);
    } catch (err) {
      setError('Failed to generate package: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateConfig = (path, value) => {
    setConfig((prev) => {
      const newConfig = { ...prev };
      const keys = path.split('.');
      let current = newConfig;
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;
      return newConfig;
    });
  };

  const addPort = () => {
    const newPort = {
      name: '',
      containerPort: 80,
      protocol: 'TCP',
      type: 'web',
      description: '',
      entrance: {
        enabled: false,
        title: '',
        authLevel: 'private'
      }
    };
    setConfig((prev) => ({
      ...prev,
      ports: [...prev.ports, newPort]
    }));
  };

  const removePort = (index) => {
    setConfig((prev) => ({
      ...prev,
      ports: prev.ports.filter((_, i) => i !== index)
    }));
  };

  const updatePort = (index, field, value) => {
    setConfig((prev) => ({
      ...prev,
      ports: prev.ports.map((port, i) =>
        i === index ? { ...port, [field]: value } : port
      )
    }));
  };

  const addEnv = () => {
    const newEnv = {
      name: '',
      value: '',
      type: 'string',
      secret: false,
      description: ''
    };
    setConfig((prev) => ({
      ...prev,
      environment: [...prev.environment, newEnv]
    }));
  };

  const removeEnv = (index) => {
    setConfig((prev) => ({
      ...prev,
      environment: prev.environment.filter((_, i) => i !== index)
    }));
  };

  const updateEnv = (index, field, value) => {
    setConfig((prev) => ({
      ...prev,
      environment: prev.environment.map((env, i) =>
        i === index ? { ...env, [field]: value } : env
      )
    }));
  };

  const analyzeGitHub = async (repoUrl) => {
    try {
      setLoading(true);
      const res = await api.analyzeGitHub(repoUrl);
      const data = res.data;

      // Update config with detected values
      if (data.repository.description) {
        updateConfig('metadata.description', data.repository.description);
      }

      if (data.docker.image) {
        const [repository, tag] = data.docker.image.split(':');
        updateConfig('docker.repository', repository);
        updateConfig('docker.tag', tag || 'latest');
      }

      if (data.docker.ports && data.docker.ports.length > 0) {
        const ports = data.docker.ports.map((p) => ({
          name: p.name,
          containerPort: p.container,
          protocol: p.protocol,
          type: p.container === 80 || p.container === 8080 || p.name === 'http' ? 'web' : 'network',
          description: '',
          entrance: {
            enabled: p.container === 80 || p.container === 8080 || p.name === 'http',
            title: config.metadata.title || 'Web UI',
            authLevel: 'private'
          }
        }));
        setConfig((prev) => ({ ...prev, ports }));
      }

      if (data.docker.env && data.docker.env.length > 0) {
        const env = data.docker.env.map((e) => ({
          name: e.name,
          value: e.default || '',
          type: 'string',
          secret: e.name.includes('PASSWORD') || e.name.includes('SECRET') || e.name.includes('KEY'),
          description: ''
        }));
        setConfig((prev) => ({ ...prev, environment: env }));
      }

      if (data.docker.volumes && data.docker.volumes.length > 0) {
        updateConfig('storage.pvc.enabled', true);
        updateConfig('storage.pvc.mountPath', data.docker.volumes[0].path);
      }

      setSuccess('GitHub repository analyzed successfully');
    } catch (err) {
      setError('Failed to analyze GitHub repository: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !config.metadata.name) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
          {projectId ? 'Edit Application' : 'Create New Application'}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Follow the steps to configure your Olares application
        </Typography>
      </Box>

      {/* Alerts */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}
      {validationErrors.length > 0 && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Validation Errors:
          </Typography>
          <ul style={{ marginTop: 8, paddingLeft: 20 }}>
            {validationErrors.map((err, idx) => (
              <li key={idx}>{err}</li>
            ))}
          </ul>
        </Alert>
      )}

      {/* Stepper */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Stepper activeStep={activeStep}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Paper>

      {/* Step Content */}
      <Paper sx={{ p: 4 }}>
        {activeStep === 0 && (
          <StepBasicInfo config={config} updateConfig={updateConfig} categories={categories} />
        )}
        {activeStep === 1 && (
          <StepDockerSource
            config={config}
            updateConfig={updateConfig}
            analyzeGitHub={analyzeGitHub}
            loading={loading}
          />
        )}
        {activeStep === 2 && (
          <StepPorts
            config={config}
            ports={config.ports}
            addPort={addPort}
            removePort={removePort}
            updatePort={updatePort}
          />
        )}
        {activeStep === 3 && (
          <StepStorage config={config} updateConfig={updateConfig} />
        )}
        {activeStep === 4 && (
          <StepEnvironment
            config={config}
            environment={config.environment}
            addEnv={addEnv}
            removeEnv={removeEnv}
            updateEnv={updateEnv}
          />
        )}
        {activeStep === 5 && (
          <StepReview config={config} />
        )}

        {/* Navigation */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
          <Button onClick={() => navigate('/')}>
            Back to Dashboard
          </Button>
          <Box>
            {activeStep > 0 && (
              <Button onClick={handleBack} sx={{ mr: 1 }}>
                Previous
              </Button>
            )}
            {activeStep < steps.length - 1 ? (
              <Button variant="contained" onClick={handleNext}>
                Next
              </Button>
            ) : (
              <>
                <Button variant="outlined" onClick={handleSave} sx={{ mr: 1 }} disabled={loading}>
                  Save Project
                </Button>
                <Button
                  variant="contained"
                  startIcon={<DownloadIcon />}
                  onClick={handleDownload}
                  disabled={loading}
                >
                  {loading ? 'Generating...' : 'Download Package'}
                </Button>
              </>
            )}
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}

// Step Components
function StepBasicInfo({ config, updateConfig, categories }) {
  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>
          Basic Information
        </Typography>
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Application Name"
          helperText="Lowercase, alphanumeric with hyphens (e.g., my-app)"
          value={config.metadata.name}
          onChange={(e) => updateConfig('metadata.name', e.target.value)}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Display Title"
          helperText="The name shown in Olares"
          value={config.metadata.title}
          onChange={(e) => updateConfig('metadata.title', e.target.value)}
        />
      </Grid>
      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Short Description"
          helperText="One line description"
          value={config.metadata.description}
          onChange={(e) => updateConfig('metadata.description', e.target.value)}
        />
      </Grid>
      <Grid item xs={12}>
        <TextField
          fullWidth
          multiline
          rows={4}
          label="Full Description"
          helperText="Detailed description (Markdown supported)"
          value={config.metadata.descriptionLong}
          onChange={(e) => updateConfig('metadata.descriptionLong', e.target.value)}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <FormControl fullWidth>
          <InputLabel>Category</InputLabel>
          <Select
            value={config.metadata.category}
            label="Category"
            onChange={(e) => updateConfig('metadata.category', e.target.value)}
          >
            {categories.map((cat) => (
              <MenuItem key={cat} value={cat}>
                {cat}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Version"
          helperText="Semantic version (e.g., 0.1.0)"
          value={config.metadata.version}
          onChange={(e) => updateConfig('metadata.version', e.target.value)}
        />
      </Grid>
      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Icon URL"
          helperText="URL to SVG or PNG icon"
          value={config.metadata.icon}
          onChange={(e) => updateConfig('metadata.icon', e.target.value)}
        />
      </Grid>
    </Grid>
  );
}

function StepDockerSource({ config, updateConfig, analyzeGitHub, loading }) {
  const [githubUrl, setGithubUrl] = useState('');

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>
          Docker Source
        </Typography>
      </Grid>
      <Grid item xs={12}>
        <Typography variant="subtitle2" color="primary" gutterBottom>
          Option 1: Analyze GitHub Repository
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            fullWidth
            label="GitHub Repository URL"
            placeholder="https://github.com/owner/repo"
            value={githubUrl}
            onChange={(e) => setGithubUrl(e.target.value)}
          />
          <Button
            variant="outlined"
            onClick={() => analyzeGitHub(githubUrl)}
            disabled={!githubUrl || loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Analyze'}
          </Button>
        </Box>
      </Grid>
      <Grid item xs={12}>
        <Typography variant="subtitle2" color="primary" gutterBottom>
          Option 2: Manual Docker Image
        </Typography>
      </Grid>
      <Grid item xs={12} md={8}>
        <TextField
          fullWidth
          label="Docker Repository"
          placeholder="owner/image-name"
          helperText="E.g., stalwartlabs/stalwart"
          value={config.docker.repository}
          onChange={(e) => updateConfig('docker.repository', e.target.value)}
        />
      </Grid>
      <Grid item xs={12} md={4}>
        <TextField
          fullWidth
          label="Tag"
          placeholder="latest"
          value={config.docker.tag}
          onChange={(e) => updateConfig('docker.tag', e.target.value)}
        />
      </Grid>
    </Grid>
  );
}

function StepPorts({ ports, addPort, removePort, updatePort }) {
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">
          Ports Configuration
        </Typography>
        <Button startIcon={<AddIcon />} onClick={addPort}>
          Add Port
        </Button>
      </Box>

      {ports.length === 0 ? (
        <Alert severity="info">No ports configured. Click "Add Port" to add one.</Alert>
      ) : (
        <Grid container spacing={3}>
          {ports.map((port, index) => (
            <Grid item xs={12} key={index}>
              <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} sm={3}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Port Name"
                      placeholder="http"
                      value={port.name}
                      onChange={(e) => updatePort(index, 'name', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={2}>
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      label="Port"
                      value={port.containerPort}
                      onChange={(e) => updatePort(index, 'containerPort', parseInt(e.target.value))}
                    />
                  </Grid>
                  <Grid item xs={12} sm={2}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Protocol</InputLabel>
                      <Select
                        value={port.protocol}
                        label="Protocol"
                        onChange={(e) => updatePort(index, 'protocol', e.target.value)}
                      >
                        <MenuItem value="TCP">TCP</MenuItem>
                        <MenuItem value="UDP">UDP</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Description"
                      value={port.description}
                      onChange={(e) => updatePort(index, 'description', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={1}>
                    <IconButton color="error" onClick={() => removePort(index)}>
                      <DeleteIcon />
                    </IconButton>
                  </Grid>
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={port.entrance?.enabled || false}
                          onChange={(e) =>
                            updatePort(index, 'entrance', {
                              ...port.entrance,
                              enabled: e.target.checked,
                              title: port.entrance?.title || 'Web UI',
                              authLevel: port.entrance?.authLevel || 'private'
                            })
                          }
                        />
                      }
                      label="This is a web interface (create entrance)"
                    />
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}

function StepStorage({ config, updateConfig }) {
  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>
          Storage Configuration
        </Typography>
      </Grid>
      <Grid item xs={12}>
        <FormControlLabel
          control={
            <Checkbox
              checked={config.storage.pvc.enabled}
              onChange={(e) => updateConfig('storage.pvc.enabled', e.target.checked)}
            />
          }
          label="Enable Persistent Volume (for critical data)"
        />
      </Grid>
      {config.storage.pvc.enabled && (
        <>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Storage Size"
              placeholder="10Gi"
              value={config.storage.pvc.size}
              onChange={(e) => updateConfig('storage.pvc.size', e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Mount Path"
              placeholder="/data"
              value={config.storage.pvc.mountPath}
              onChange={(e) => updateConfig('storage.pvc.mountPath', e.target.value)}
            />
          </Grid>
        </>
      )}
      <Grid item xs={12}>
        <FormControlLabel
          control={
            <Checkbox
              checked={config.storage.appData.enabled}
              onChange={(e) => updateConfig('storage.appData.enabled', e.target.checked)}
            />
          }
          label="Use appData (for configuration files)"
        />
      </Grid>
      <Grid item xs={12}>
        <FormControlLabel
          control={
            <Checkbox
              checked={config.storage.appCache.enabled}
              onChange={(e) => updateConfig('storage.appCache.enabled', e.target.checked)}
            />
          }
          label="Use appCache (for temporary files)"
        />
      </Grid>
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
          Resource Limits
        </Typography>
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="CPU Request"
          placeholder="100m"
          helperText="Minimum CPU guaranteed"
          value={config.resources.requests.cpu}
          onChange={(e) => updateConfig('resources.requests.cpu', e.target.value)}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="CPU Limit"
          placeholder="1000m"
          helperText="Maximum CPU allowed"
          value={config.resources.limits.cpu}
          onChange={(e) => updateConfig('resources.limits.cpu', e.target.value)}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Memory Request"
          placeholder="256Mi"
          helperText="Minimum memory guaranteed"
          value={config.resources.requests.memory}
          onChange={(e) => updateConfig('resources.requests.memory', e.target.value)}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Memory Limit"
          placeholder="1Gi"
          helperText="Maximum memory allowed"
          value={config.resources.limits.memory}
          onChange={(e) => updateConfig('resources.limits.memory', e.target.value)}
        />
      </Grid>
    </Grid>
  );
}

function StepEnvironment({ environment, addEnv, removeEnv, updateEnv }) {
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">
          Environment Variables
        </Typography>
        <Button startIcon={<AddIcon />} onClick={addEnv}>
          Add Variable
        </Button>
      </Box>

      {environment.length === 0 ? (
        <Alert severity="info">
          No environment variables configured. Click "Add Variable" to add one.
        </Alert>
      ) : (
        <Grid container spacing={3}>
          {environment.map((env, index) => (
            <Grid item xs={12} key={index}>
              <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} sm={3}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Variable Name"
                      placeholder="API_KEY"
                      value={env.name}
                      onChange={(e) => updateEnv(index, 'name', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Default Value"
                      type={env.secret ? 'password' : 'text'}
                      value={env.value}
                      onChange={(e) => updateEnv(index, 'value', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Description"
                      value={env.description}
                      onChange={(e) => updateEnv(index, 'description', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={1}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={env.secret}
                          onChange={(e) => updateEnv(index, 'secret', e.target.checked)}
                        />
                      }
                      label="Secret"
                    />
                  </Grid>
                  <Grid item xs={12} sm={1}>
                    <IconButton color="error" onClick={() => removeEnv(index)}>
                      <DeleteIcon />
                    </IconButton>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}

function StepReview({ config }) {
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Review Configuration
        </Typography>
      <Alert severity="info" sx={{ mb: 3 }}>
        Review your configuration below. Click "Download Package" to generate the Helm chart.
      </Alert>

      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Typography variant="subtitle2" color="primary">Metadata</Typography>
          <Typography>Name: {config.metadata.name}</Typography>
          <Typography>Title: {config.metadata.title}</Typography>
          <Typography>Version: {config.metadata.version}</Typography>
          <Typography>Category: {config.metadata.category}</Typography>
        </Grid>
        <Grid item xs={12}>
          <Typography variant="subtitle2" color="primary">Docker</Typography>
          <Typography>Image: {config.docker.repository}:{config.docker.tag}</Typography>
        </Grid>
        <Grid item xs={12}>
          <Typography variant="subtitle2" color="primary">Ports ({config.ports.length})</Typography>
          {config.ports.map((port, idx) => (
            <Typography key={idx}>
              - {port.name}: {port.containerPort}/{port.protocol}
              {port.entrance?.enabled && ' (with entrance)'}
            </Typography>
          ))}
        </Grid>
        <Grid item xs={12}>
          <Typography variant="subtitle2" color="primary">Storage</Typography>
          <Typography>
            PVC: {config.storage.pvc.enabled ? `${config.storage.pvc.size} at ${config.storage.pvc.mountPath}` : 'Disabled'}
          </Typography>
          <Typography>appData: {config.storage.appData.enabled ? 'Enabled' : 'Disabled'}</Typography>
          <Typography>appCache: {config.storage.appCache.enabled ? 'Enabled' : 'Disabled'}</Typography>
        </Grid>
        <Grid item xs={12}>
          <Typography variant="subtitle2" color="primary">Environment Variables ({config.environment.length})</Typography>
          {config.environment.map((env, idx) => (
            <Typography key={idx}>
              - {env.name} {env.secret && '(secret)'}
            </Typography>
          ))}
        </Grid>
        <Grid item xs={12}>
          <Typography variant="subtitle2" color="primary">Resources</Typography>
          <Typography>
            CPU: {config.resources.requests.cpu} - {config.resources.limits.cpu}
          </Typography>
          <Typography>
            Memory: {config.resources.requests.memory} - {config.resources.limits.memory}
          </Typography>
        </Grid>
      </Grid>
    </Box>
  );
}

export default WizardPage;
