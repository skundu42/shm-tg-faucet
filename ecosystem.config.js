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
                  pKey: "96f594cc9d90c6b2c3461605ac11ca57bfb7422eba66a964e11d95422fb88673",
                  token: "6326326139:AAGTxlBIEAI4rXxWRW1T2nbEiu1vO1gtZtE"
                },
          },
        ],
  };
