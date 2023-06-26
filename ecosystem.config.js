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
                  pKey: "086efbc395b619b9fdcab01e2588296cb0641b04d09e4cf38e8f34eb989e0261",
                  token: "5739241079:AAHwyzGegs5-_rzPOHpAa8jE8UC2ZokF-ps"
                },
          },
        ],
  };
