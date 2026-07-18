module.exports = {
  apps: [
    {
      name: "feishusaver-bot",
      script: "./backend/dist/bot.js",
      cwd: "/home/ubuntu/FeishuSaver",
      watch: false,
      env: {
        NODE_ENV: "production"
      }
    }
  ]
};
