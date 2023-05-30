const TelegramBot = require('node-telegram-bot-api');
const ethers = require('ethers');
const bot = new TelegramBot(process.env.token, {polling: true});

const DB = require('./db');
const database = new DB();
const RPC_DATA = {
    url: "https://sphinx.shardeum.org/", //"https://liberty20.shardeum.org/"
    chainID: 8082, //8081
    name: "Shardeum Sphinx 1.X" //"Shardeum Liberty 2.X"
};
const provider = new ethers.JsonRpcProvider(RPC_DATA.url);
const wallet = new ethers.Wallet(process.env.pKey, provider);
const mainMenu = {
    reply_markup: {
        resize_keyboard: true,
        one_time_keyboard: true,
        keyboard: [["Get SHM", "Donate"],["Help", "Profile"], /*[/*"Stats", "About"]*/]
    }
};
const EMOJIS = [
    {
        "item": "Rocket", //from https://unicode-table.com/en/1F697/
        "emoji": "🚀"
    },
    {
        "item": "Helicopter",
        "emoji": "🚁"
    },
    {
        "item": "Train",
        "emoji": "🚆"
    },
    {
        "item": "Car",
        "emoji": "🚗"
    }
]


bot.setMyCommands([
    {
        command: 'wallet',
        description: 'Set Wallet'
    },
    {
        command: 'profile',
        description: 'View your Profile'
    },
    {
        command: 'donate',
        description: 'Donate to keep the faucet up and running.'
    },
    {
        command: 'claim',
        description: 'Claim SHM from the faucet'
    },
    {
        command: 'start',
        description: 'Go To main menu'
    },
    {
        command: 'help',
        description: 'View help message'
    },
    // {
    //     command: 'stats',
    //     description: 'View Shardeum network stats'
    // },
    {
        command: 'about',
        description: 'About Shardeum Faucet Bot'
    }
])

bot.onText(/^\/start/, function (msg) {
    console.log(msg);
    bot.sendMessage(msg.chat.id, `ShardeumSphinxBot is a faucet for Shardeum Betanet (Sphinx). You can get ${config.perClaim} SHM every ${config.coolOff} hours from this bot.\n\n*How to use*\n\n1. Set wallet using /wallet command.\n2.Click on Get SHM.\n3. Complete Captcha.\n\n*Donate*\n\nTo keep the bot up and running, please consider donating Sphinx SHM. Use /donate command to see how you can help this bot.\n\n\n_Nobody from Shardeum community will ever DM you first. If you get a DM from someone pretending to be from team Shardeum, it's probably a scam._`,{
        parse_mode: 'markdown',
        ...mainMenu
    });
});

bot.onText(/^Main\sMenu/, function(msg){
    console.log(msg);
    bot.sendMessage(msg.chat.id, "Please select an option below\n\n\n_Nobody from Shardeum community will ever DM you first. If you get a DM from someone pretending to be from team Shardeum, it's probably a scam._", {
        parse_mode: 'markdown',
        ...mainMenu
    });
})

bot.onText(/^(Help|\/help)/, function(msg){
    console.log(msg);
    bot.sendMessage(msg.chat.id, "Welcome to Shardeum Faucet Bot.\n\nTo use the faucet, Please set a wallet first using the command _/wallet <your erc20 address>_.\n\nAfter that, tap on *Get SHM* to get SHM tokens on Shardeum Betanet (Sphinx).\n\nTo view your details, tap on Profile.\n\n\n_Nobody from Shardeum community will ever DM you first. If you get a DM from someone pretending to be from team Shardeum, it's probably a scam._", {
        parse_mode: 'markdown',
        ...mainMenu
    });
})

bot.onText(/^(Donate|\/donate)/, function(msg){
    console.log(msg);
    provider.getBalance(wallet.address).then(
        (balance) => {
            let currentBalance = 0;
            if(balance > 0){
                currentBalance = parseInt(balance) / 10 ** 18;
            }
            bot.sendMessage(msg.chat.id, `Current balance in faucet: ${currentBalance} SHM.\n\nPlease donate SHM (Shardeum Betanet Sphinx) to the below address\n\n${wallet.address}\n\n\n_Nobody from Shardeum community will ever DM you first. If you get a DM from someone pretending to be from team Shardeum, it's probably a scam._`, {
                parse_mode: 'markdown',
                ...mainMenu
            });
        }
    ).catch(
        (e) => {
            bot.sendMessage(msg.chat.id, "Please donate SHM (Shardeum Betanet Sphinx) to the below address\n\n" + wallet.address + "\n\n\n_Nobody from Shardeum community will ever DM you first. If you get a DM from someone pretending to be from team Shardeum, it's probably a scam._", {
                parse_mode: 'markdown',
                ...mainMenu
            });
        }
    )
});

bot.onText(/^(Profile|\/profile)/, function(msg){
    console.log(msg);
    let userId = msg.from.id;
    database.getUserDetails(userId).then(
        (data) => {
            if(!data){
                bot.sendMessage(msg.chat.id, "*Your Details*\n\nAddress: _Not Set_\n\nPlease set an address using */wallet <your-address>* command.\n\n\n_Nobody from Shardeum community will ever DM you first. If you get a DM from someone pretending to be from team Shardeum, it's probably a scam._", {
                    parse_mode: 'markdown',
                    ...mainMenu
                });
            }
            else{
                let message = `*Your Details*\n\nAddress: _${data.wallet}_\n\n`;
                if(data.lastClaim){
                    let lastClaim = new Date(data.lastClaim).toLocaleString('nu', {dateStyle: 'medium', timeStyle: 'medium'});
                    message += `Last claimed on: _${lastClaim}_ UTC`;
                    if(data.lastTx && data.lastTx != ''){
                        message +=` ([tx](https://explorer-sphinx.shardeum.org/transaction/${data.lastTx})).`;
                    }
                }
                message += "\n\n\n_Nobody from Shardeum community will ever DM you first. If you get a DM from someone pretending to be from team Shardeum, it's probably a scam._";
                bot.sendMessage(msg.chat.id, message, {
                    parse_mode: 'markdown',
                    ...mainMenu
                });
            }
        }
    ).catch(
        (e) => {
            bot.sendMessage(msg.chat.id, "Unable to fetch profile details. Please try again",{
                reply_markup: {
                    resize_keyboard: true,
                    one_time_keyboard: true,
                    keyboard: [["Main Menu"]]
                }
            });
        }
    )
})

bot.onText(/^\/wallet/, async function(msg){
    console.log(msg);
    let userId = msg.from.id;
    const addr = msg.text.replace(/^\/wallet\s?/, "");
    if(!ethers.isAddress(addr)){
        bot.sendMessage(msg.chat.id, "Please send a valid ERC20 address in the format */wallet <your-address>*\n\n\n_Nobody from Shardeum community will ever DM you first. If you get a DM from someone pretending to be from team Shardeum, it's probably a scam._", {
            parse_mode: 'markdown',
            ...mainMenu
        })
    }
    else{
        database.checkIfUserOrWalletExist(userId, addr).then(
            (data) => {
                if(!data){
                    database.addUser(userId, addr).then(
                        (result) => {
                            bot.sendMessage(msg.chat.id, "Wallet set succesfully.\n\n\n_Nobody from Shardeum community will ever DM you first. If you get a DM from someone pretending to be from team Shardeum, it's probably a scam._", {
                                reply_markup: {
                                    resize_keyboard: true,
                                    one_time_keyboard: true,
                                    keyboard: [["Main Menu"]]
                                }
                            })
                        }
                    ).catch(
                        (e) => {
                            bot.sendMessage(msg.chat.id, "Error occured while adding wallet. Please try again.", {
                                reply_markup: {
                                    resize_keyboard: true,
                                    one_time_keyboard: true,
                                    keyboard: [["Main Menu"]]
                                }
                            })
                        }
                    )
                }
                else{
                    bot.sendMessage(msg.chat.id, "User or wallet already exist in our system.", {
                        reply_markup: {
                            resize_keyboard: true,
                            one_time_keyboard: true,
                            keyboard: [["Main Menu"]]
                        }
                    });
                }
            }
        ).catch(
            (e) => {
                bot.sendMessage(msg.chat.id, "Error occured while adding wallet. Please try again.", {
                    reply_markup: {
                        resize_keyboard: true,
                        one_time_keyboard: true,
                        keyboard: [["Main Menu"]]
                    }
                })
            }
        )
    }

})

bot.onText(/^(Get\sSHM|\/claim)/, function(msg){
    console.log(msg);
    let userId = msg.from.id;
    if(config.faucet){
        database.getUserDetails(userId).then(
            (data) => {
                if(!data){
                    bot.sendMessage(msg.chat.id, "Please set an address first using _/wallet <your-address>_ command.\n\n\n_Nobody from Shardeum community will ever DM you first. If you get a DM from someone pretending to be from team Shardeum, it's probably a scam._", {
                        parse_mode: 'markdown',
                        ...mainMenu
                    });
                }
                else{
                    if(data.lastClaim > 0 && new Date().getTime() < data.lastClaim + (60 * 60 * config.coolOff * 1000)){
                        let nextClaim = new Date(data.lastClaim + (60 * 60 * config.coolOff * 1000)).toLocaleString('nu', {dateStyle: 'medium', timeStyle: 'medium'});
                        bot.sendMessage(msg.chat.id, `Please wait till ${nextClaim} to claim again.`, {
                            reply_markup: {
                                resize_keyboard: true,
                                one_time_keyboard: true,
                                keyboard: [["Main Menu"]]
                            }
                        });
                    }
                    else{
                        provider.getBalance(wallet.address).then(
                            (balance) => {
                                if(balance < ((config.perClaim + 1) * 10 ** 18)){
                                    bot.sendMessage(msg.chat.id, "Not enough funds in the faucet. Please try after some time.");
                                }
                                else{
                                    let captchaIndex = Math.floor((Math.random()*10)) % 4;
                                    let captcha = EMOJIS[captchaIndex].item;
                                    let inlineKeyboard = [];
                                    EMOJIS.forEach(x => {
                                        inlineKeyboard.push({
                                            text: x.emoji,
                                            callback_data: x.item
                                        });
                                    });
                                
                                    bot.sendMessage(msg.chat.id, `Verify the captcha. Tap on ^*${captcha}*^ from the below emojis`, {
                                        parse_mode: "markdown",
                                        reply_markup: {
                                            inline_keyboard: [inlineKeyboard]
                                        }
                                    })
                                }
                            }).catch(
                                (e) => {
                                    bot.sendMessage(msg.chat.id, "Error occured while claiming SHM. Please try again.", {
                                        reply_markup: {
                                            resize_keyboard: true,
                                            one_time_keyboard: true,
                                            keyboard: [["Main Menu"]]
                                        }
                                    })
                                }
                            )
                    }
                }
            }).catch(
                (e) => {
                    bot.sendMessage(msg.chat.id, "Error occured while claiming SHM. Please try again.", {
                        reply_markup: {
                            resize_keyboard: true,
                            one_time_keyboard: true,
                            keyboard: [["Main Menu"]]
                        }
                    })
                }
            )
    }
    else{
        bot.sendMessage(msg.chat.id, "Faucet is currently turned off for maintenance. Please try after some time.\n\n\n_Nobody from Shardeum community will ever DM you first. If you get a DM from someone pretending to be from team Shardeum, it's probably a scam._", {
            reply_markup: {
                resize_keyboard: true,
                one_time_keyboard: true,
                keyboard: [["Main Menu"]]
            },
            parse_mode: 'markdown'
        })
    }
})


bot.on('callback_query', function onCallbackQuery(callbackQuery) { 
    console.log(callbackQuery);
    const action = callbackQuery.data;
    const msg = callbackQuery.message;
    let userId = msg.from.id;
    let captchaProvided = callbackQuery.message.text.match(/\^[A-z]+\^/)[0];
    captchaProvided = captchaProvided.substring(1, captchaProvided.length - 1);
    if(captchaProvided == action){
        const opts = { 
                chat_id: msg.chat.id, 
                message_id: msg.message_id,
            };
        bot.editMessageText("Captcha Verified", opts);
        database.getUserDetails(userId).then(
            (data) => {
                if(data.lastClaim > 0 && new Date().getTime() < data.lastClaim + (60 * 60 * config.coolOff * 1000)){
                    let nextClaim = new Date(data.lastClaim + (60 * 60 * config.coolOff * 1000)).toLocaleString('nu', {dateStyle: 'medium', timeStyle: 'medium'});
                    bot.sendMessage(msg.chat.id, `Please wait till ${nextClaim} to claim again.`, {
                        reply_markup: {
                            resize_keyboard: true,
                            one_time_keyboard: true,
                            keyboard: [["Main Menu"]]
                        }
                    });
                }
                else{
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
                                            let txDetails = {
                                                to: data.wallet,
                                                value: ethers.parseEther(amountInEther)
                                            }
                                            wallet.sendTransaction(txDetails).then((tx) => {
                                                database.setLastClaimTx(tx.hash, msg.chat.id).then(
                                                    () => {
                                                        bot.sendMessage(msg.chat.id, `Funds has been transferred \n\nhash: [${tx.hash}](https://explorer-sphinx.shardeum.org/transaction/${tx.hash})`, {
                                                            parse_mode: 'markdown',
                                                            reply_markup: {
                                                                resize_keyboard: true,
                                                                one_time_keyboard: true,
                                                                keyboard: [["Main Menu"]]
                                                            }
                                                        });
                                                    }
                                                ).catch(
                                                    () => {
                                                        bot.sendMessage(msg.chat.id, `Funds has been transferred \n\nhash: [${tx.hash}](https://explorer-sphinx.shardeum.org/transaction/${tx.hash})`, {
                                                            parse_mode: 'markdown',
                                                            reply_markup: {
                                                                resize_keyboard: true,
                                                                one_time_keyboard: true,
                                                                keyboard: [["Main Menu"]]
                                                            }
                                                        });
                                                    }
                                                )
                                                
                                            }).catch(
                                                (e) => {
                                                    console.log(e);
                                                    database.setClaimTime(userId, data.lastClaim).then(
                                                        () => {
                                                            bot.sendMessage(msg.chat.id, "Error occured while sending Transaction. Please try again.", {
                                                                reply_markup: {
                                                                    resize_keyboard: true,
                                                                    one_time_keyboard: true,
                                                                    keyboard: [["Main Menu"]]
                                                                }
                                                            })
                                                        }
                                                    ).catch(
                                                        () => {
                                                            bot.sendMessage(msg.chat.id, "Error occured while sending Transaction. Please try again.", {
                                                                reply_markup: {
                                                                    resize_keyboard: true,
                                                                    one_time_keyboard: true,
                                                                    keyboard: [["Main Menu"]]
                                                                }
                                                            })
                                                        }
                                                    )
                                                }
                                            )
                                        }
                                        else{
                                            bot.sendMessage(msg.chat.id, "Error connecting database. Please try again.", {
                                                reply_markup: {
                                                    resize_keyboard: true,
                                                    one_time_keyboard: true,
                                                    keyboard: [["Main Menu"]]
                                                }
                                            })
                                        }
                                    }
                                ).catch(
                                    (e) => {
                                        bot.sendMessage(msg.chat.id, "Error occured while connecting to database. Please try again.", {
                                            reply_markup: {
                                                resize_keyboard: true,
                                                one_time_keyboard: true,
                                                keyboard: [["Main Menu"]]
                                            }
                                        })
                                    }
                                )
                            }
                        }).catch(
                            (e) =>{
                                bot.sendMessage(msg.chat.id, "Error occured while claiming SHM. Please try again.", {
                                    reply_markup: {
                                        resize_keyboard: true,
                                        one_time_keyboard: true,
                                        keyboard: [["Main Menu"]]
                                    }
                                })
                            }
                        )
                }
            }).catch(
                (e) => {
                    bot.sendMessage(msg.chat.id, "Error occured while claiming SHM. Please try again.", {
                        reply_markup: {
                            resize_keyboard: true,
                            one_time_keyboard: true,
                            keyboard: [["Main Menu"]]
                        }
                    })
                }
            )
    }
    else{
        const opts = { 
            chat_id: msg.chat.id, 
            message_id: msg.message_id, 
        };
        bot.editMessageText("Captcha failed. Please try again.", opts);
    }
}); 

module.exports = bot;