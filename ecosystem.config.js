module.exports = {
  apps: [
    {
      name: "feishusaver-bot",
      script: "./backend/dist/bot.js",
      cwd: __dirname,
      watch: false,
      env: {
        NODE_ENV: "production"
      }
    }
  ]
};
