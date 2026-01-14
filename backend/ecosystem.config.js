module.exports = {
  apps: [{
    name: 'lpv-api',
    script: 'server.js',
    cwd: '/var/www/lpv-api/Vault/backend',
    interpreter: '/www/server/nodejs/v20.19.6/bin/node',
    env_file: '/var/www/lpv-api/Vault/backend/.env',
    instances: 1,
    exec_mode: 'fork',
    watch: false,
    max_memory_restart: '1G',
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
  }]
};
