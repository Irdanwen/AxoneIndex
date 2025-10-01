module.exports = {
  apps: [
    {
      name: 'core-monitor',
      script: 'src/monitor-core-actions.js',
      cwd: __dirname,
      env: {
        NODE_ENV: 'production'
      },
      watch: false,
      time: true,
      max_restarts: 10,
      restart_delay: 3000,
      error_file: 'logs/core-monitor-error.log',
      out_file: 'logs/core-monitor.log',
      merge_logs: true
    }
  ]
};


