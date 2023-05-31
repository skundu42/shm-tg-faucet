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
		  pKey: "a0ba0c60a2c8f89d972b77b6480dfe1e214bc81ed9cebf558466bfafae43d9f3",
		  token: "6048860079:AAGdEqtpqnmHRcF0XWq8fmEvVVfFhdu90yc"
		},
	  },
	],
  };