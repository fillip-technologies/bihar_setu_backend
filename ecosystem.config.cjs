// PM2 process file for the aaPanel server: pm2 start ecosystem.config.cjs
// Settings come from .env in this folder (see .env.production.example).
module.exports = {
  apps: [
    {
      name: 'bihar-setu-api',
      script: 'src/server.js',
      cwd: __dirname,
      instances: 1,
      autorestart: true,
      max_memory_restart: '400M',
      env: { NODE_ENV: 'production' },
    },
  ],
}
