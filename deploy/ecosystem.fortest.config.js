module.exports = {
  apps: [
    {
      name: 'orangy-backend-fortest',
      cwd: './backend',
      script: 'dist/index.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '450M',
      env: {
        NODE_ENV: 'production',
        PORT: 5002,
        HOST: '0.0.0.0',
      },
      error_file: './logs/fortest-error.log',
      out_file: './logs/fortest-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
  ],
};
