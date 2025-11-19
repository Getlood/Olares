export const getDefaultConfig = () => ({
  metadata: {
    name: '',
    appid: '',
    title: '',
    description: '',
    descriptionLong: '',
    category: 'Utilities',
    icon: 'https://file.bttcdn.com/appstore/default/defaulticon.webp',
    version: '0.1.0',
    maintainer: {
      name: 'community',
      email: ''
    }
  },
  docker: {
    repository: '',
    tag: 'latest',
    pullPolicy: 'IfNotPresent'
  },
  ports: [],
  storage: {
    pvc: {
      enabled: false,
      size: '10Gi',
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
  environment: [],
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
  probes: {
    liveness: {
      enabled: true,
      type: 'tcpSocket',
      port: '',
      initialDelaySeconds: 30,
      periodSeconds: 10
    },
    readiness: {
      enabled: true,
      type: 'tcpSocket',
      port: '',
      initialDelaySeconds: 10,
      periodSeconds: 5
    }
  }
});

export const categories = [
  'Utilities',
  'Productivity',
  'Social',
  'Entertainment',
  'Development',
  'Communication',
  'Blockchain'
];
