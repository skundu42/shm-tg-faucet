const TelegramBot = require('node-telegram-bot-api');
const ethers = require('ethers');
const fs = require('fs');
const bot = new TelegramBot(process.env.token, {polling: true});
let config = JSON.parse(fs.readFileSync('config.json', 'utf8'));
global.config = config;
const DB = require('./db');
const database = new DB();
const RPC_DATA = {
    url: "https://dapps.shardeum.org",
    chainID: 8081,
    name: "Shardeum Sphinx Dapp 1.X"
};
const provider = new ethers.JsonRpcProvider(RPC_DATA.url);
const wallet = new ethers.Wallet(process.env.pKey, provider);

bot.setMyCommands([
    {
        command: 'claim',
        description: 'Claim SHM from the faucet'
    },
    {
        command: 'help',
        description: 'View help message'
    }
])
bot.onText(/^\/fetchConfig/, function (msg) {
    let config = JSON.parse(fs.readFileSync('config.json', 'utf8'));
    global.config = config;
    bot.sendMessage(msg.chat.id, "Configuration has been updated");
})
bot.onText(/^(\/help|\/start)/, function(msg){
	let message = "Please donate SHM (Shardeum Sphinx) to the below address\n\n" + wallet.address + "\n\n\nPS: _Nobody from Shardeum community will ever DM you first. If you get a DM from someone pretending to be from team Shardeum, it's probably a scam._";
	provider.getBalance(wallet.address).then(
		(balance) => {
			let currentBalance = 0;
			if(balance > 0){
				currentBalance = parseInt(balance) / 10 ** 18;
			}
			message = `Current balance in faucet: ${currentBalance} SHM.\n\n${message}`;
		}
	).catch(
		(e) => {
		}
	).finally(
		() => {
			bot.sendMessage(msg.chat.id, `Welcome to Shardeum Faucet Bot.\n\nUse _/claim <your erc20 address>_ to use the faucet for the first time. There after, you can use _/claim_ to claim SHM tokens.\n\n${message}`, {
				parse_mode: 'markdown',
			});
		}
	)
})
bot.onText(/^\/claim/, function(msg){
    console.log(config.faucet);
    let userId = msg.from.id;
    let prepend = msg.from.first_name;
    if(config.faucet){
        database.getUserDetails(userId).then(
            (data) => {
                if(!data){
                    const addr = msg.text.replace(/^\/claim\s?/, "");
                    console.log("Test");
                    if(!ethers.isAddress(addr)){
                        bot.sendMessage(msg.chat.id, `Hey ${prepend}, please send a valid ERC20 address in the format */claim <your-address>*\n\n\nPS: _Nobody from Shardeum community will ever DM you first. If you get a DM from someone pretending to be from team Shardeum, it's probably a scam._`, {
                            parse_mode: 'markdown',
                        })
                        
                    }
                    else{
                        //set address, claim
                        database.checkIfUserOrWalletExist(userId, addr).then(
                            (userData) => {
                                if(!userData){
                                    database.addUser(userId, addr).then(
                                        (result) => {
                                            provider.getBalance(wallet.address).then(
                                                (balance) => {
                                                    if(balance < ((config.perClaim + 1) * 10 ** 18)){
                                                        bot.sendMessage(msg.chat.id, "Not enough funds in the faucet. Please try after some time.");
                                                    }
                                                    else{
                                                        database.setClaimTime(userId, new Date().getTime()).then(
                                                            (result) => {
                                                                if(result){
                                                                    let amountInEther = config.perClaim.toString();
                                                                    wallet.getNonce().then(nonce => {
                                                                        let txDetails = {
                                                                            nonce,
                                                                            to: addr,
                                                                            value: ethers.parseEther(amountInEther)
                                                                        }
                                                                        wallet.sendTransaction(txDetails).then((tx) => {
                                                                            console.log("tx", tx);
                                                                            database.setLastClaimTx(tx.hash, msg.from.id).then(
                                                                                () => {
                                                                                    bot.sendMessage(msg.chat.id, `Congrats ${prepend}. Your funds has been transferred \n\nhash: [tx](https://explorer-sphinx.shardeum.org/transaction/${tx.hash})`, {
                                                                                        parse_mode: 'markdown'
                                                                                    });
                                                                                }
                                                                            ).catch(
                                                                                () => {
                                                                                    bot.sendMessage(msg.chat.id, `Congrats ${prepend}. Your funds has been transferred \n\nhash: [tx](https://explorer-sphinx.shardeum.org/transaction/${tx.hash})`, {
                                                                                        parse_mode: 'markdown'
                                                                                    });
                                                                                }
                                                                            )
                                                                            
                                                                        }).catch(
                                                                            (e) => {
                                                                                console.log(e);
                                                                                database.setClaimTime(userId, 0).then(
                                                                                    () => {
                                                                                        bot.sendMessage(msg.chat.id, `Error occured while sending Transaction. Please try again ${prepend}.`)
                                                                                    }
                                                                                ).catch(
                                                                                    () => {
                                                                                        bot.sendMessage(msg.chat.id, `Error occured while sending Transaction. Please try again ${prepend}.`)
                                                                                    }
                                                                                )
                                                                            }
                                                                        )
                                                                    }).catch(
                                                                        (e) => {
                                                                            console.log(e);
                                                                            bot.sendMessage(msg.chat.id, `Error occured while sending Transaction. Please try again ${prepend}.`)
                                                                        }
                                                                    )
                                                                    
                                                                }
                                                                else{
                                                                    bot.sendMessage(msg.chat.id, `Error connecting database. Please try again ${prepend}.`)
                                                                }
                                                            }
                                                        ).catch(
                                                            (e) => {
                                                                bot.sendMessage(msg.chat.id, `Error occured while connecting to database. Please try again ${prepend}.`)
                                                            }
                                                        )
                                                    }
                                                }).catch(
                                                    (e) =>{
                                                        console.log(e);
                                                        bot.sendMessage(msg.chat.id, `Error occured while claiming SHM. Please try again ${prepend}.`)
                                                    }
                                                )
                                        }
                                    ).catch(
                                        (e) => {
                                            bot.sendMessage(msg.chat.id, `Error occured while adding wallet. Please try again ${prepend}.`)
                                        }
                                    )
                                }
                                else{
                                    bot.sendMessage(msg.chat.id, `User or wallet already exist in our system. Please use _/claim_ to get SHM, ${prepend}`, {
                                        parse_mode: 'markdown'
                                    });
                                }
                            }
                        ).catch(
                            (e) => {
                                bot.sendMessage(msg.chat.id, `Error occured while adding wallet. Please try again ${prepend}.`)
                            }
                        )
                    }
                }
                else{
                    if(data.lastClaim > 0 && new Date().getTime() < data.lastClaim + (60 * 60 * config.coolOff * 1000)){
                        let nextClaim = new Date(data.lastClaim + (60 * 60 * config.coolOff * 1000)).toLocaleString('nu', {dateStyle: 'medium', timeStyle: 'medium'});
                        bot.sendMessage(msg.chat.id, `Hey ${prepend}, please wait till ${nextClaim} (UTC) to claim again.`);
                    }
                    else{
                        //
                        //
                        provider.getBalance(wallet.address).then(
                            (balance) => {
                                if(balance < ((config.perClaim + 1) * 10 ** 18)){
                                    bot.sendMessage(msg.chat.id, "Not enough funds in the faucet. Please try after some time.");
                                }
                                else{
                                    database.setClaimTime(userId, new Date().getTime()).then(
                                        (result) => {
                                            if(result){
                                                let amountInEther = config.perClaim.toString();
                                                wallet.getNonce().then(nonce => {
                                                    let txDetails = {
                                                        nonce,
                                                        to: data.wallet,
                                                        value: ethers.parseEther(amountInEther)
                                                    }
                                                    console.log(txDetails);
                                                    wallet.sendTransaction(txDetails).then((tx) => {
                                                        console.log("tx", tx);
                                                        database.setLastClaimTx(tx.hash, msg.from.id).then(
                                                            () => {
                                                                bot.sendMessage(msg.chat.id, `Congrats ${prepend}. Your funds has been transferred \n\nhash: [tx](https://explorer-sphinx.shardeum.org/transaction/${tx.hash})`, {
                                                                    parse_mode: 'markdown'
                                                                });
                                                            }
                                                        ).catch(
                                                            () => {
                                                                bot.sendMessage(msg.chat.id, `Congrats ${prepend}. Your funds has been transferred \n\nhash: [tx](https://explorer-sphinx.shardeum.org/transaction/${tx.hash})`, {
                                                                    parse_mode: 'markdown'
                                                                });
                                                            }
                                                        )
                                                        
                                                    }).catch(
                                                        (e) => {
                                                            console.log(e);
                                                            database.setClaimTime(userId, data.lastClaim).then(
                                                                () => {
                                                                    bot.sendMessage(msg.chat.id, `Error occured while sending Transaction. Please try again ${prepend}.`)
                                                                }
                                                            ).catch(
                                                                () => {
                                                                    bot.sendMessage(msg.chat.id, `Error occured while sending Transaction. Please try again ${prepend}.`)
                                                                }
                                                            )
                                                        }
                                                    )
                                                }).catch(
                                                    (e) => {
                                                        console.log(e);
                                                        bot.sendMessage(msg.chat.id, `Error occured while sending Transaction. Please try again ${prepend}.`)
                                                    }
                                                )
                                                
                                            }
                                            else{
                                                bot.sendMessage(msg.chat.id, `Error connecting database. Please try again ${prepend}.`)
                                            }
                                        }
                                    ).catch(
                                        (e) => {
                                            bot.sendMessage(msg.chat.id, `Error occured while connecting to database. Please try again ${prepend}.`)
                                        }
                                    )
                                }
                            }).catch(
                                (e) =>{
                                    console.log(e);
                                    bot.sendMessage(msg.chat.id, `Error occured while claiming SHM. Please try again ${prepend}.`)
                                }
                            )
                    }
                }
            }).catch(
                (e) => {
                    bot.sendMessage(msg.chat.id, `Error occured while claiming SHM. Please try again ${prepend}.`)
                }
            )
    }
    else{
        bot.sendMessage(msg.chat.id, "Faucet is currently turned off for maintenance. Please try after some time.\n\n\nPS: _Nobody from Shardeum community will ever DM you first. If you get a DM from someone pretending to be from team Shardeum, it's probably a scam._", {
            parse_mode: 'markdown'
        })
    }
})

module.exports = bot;