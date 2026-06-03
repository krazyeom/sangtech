module.exports = {
  apps: [{
    name: 'deptgift',
    script: 'npx',
    args: 'tsx server.ts',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 29898
    }
  },
  {
    name: 'local-crawler',
    script: 'npx',
    args: 'tsx src/scripts/local-crawler.ts',
    instances: 1,
    autorestart: false,
    watch: false,
    cron_restart: '*/10 * * * *',
    env: {
      NODE_ENV: 'production'
    }
  }]
};
