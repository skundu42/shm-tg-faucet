module.exports = {
        apps: [
          {
                name: "SHMFaucetBot",
                exec_mode: "cluster",
                instances: "1",
                script: "./index.js",
                args: "start",
                env: {
                  NODE_ENV: "production",
                  pKey: "<WALLET PRIVATE KEY>",
                  token: "5739241079:AAHwyzGegs5-_rzPOHpAa8jE8UC2ZokF-ps"
                },
          },
        ],
  };
