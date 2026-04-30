module.exports = {
  apps: [
    {
      name: 'crm-vulcanizadora',
      script: 'dist/main.js',
      cwd: '/root/crm-vulcanizadora/backend',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '400M',
      env_production: {
        NODE_ENV: 'production',
      },
      error_file: '/root/.pm2/logs/crm-error.log',
      out_file: '/root/.pm2/logs/crm-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },
  ],
};
