module.exports = {
  apps: [
    {
      name: 'Newoon-new-5055',
      cwd: '/var/www/newoon-new/backend',
      script: 'server.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 5055
      }
    }
  ]
};
