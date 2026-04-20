module.exports = {
  apps: [
    {
      name: "roi-proxy",
      script: "proxy.js",
      instances: 1,
      autorestart: true,
      watch: false,
      env: {
        PORT: 3001,
        ANTHROPIC_API_KEY: "YOUR_ANTHROPIC_API_KEY_HERE"
      }
    }
  ]
};
