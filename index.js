require('dotenv').config();
const prefix = process.env.BOT_PREFIX;
const token = process.env.BOT_TOKEN;
const { log } = console;
const { Client, Intents, MessageEmbed, MessageAttachment, MessageActionRow, MessageButton } = require('discord.js');

bot.login(token);
bot.once("ready", () => { log("Bot connected"); BOT_NAME = bot.user.username; });
bot.on("messageCreate", msg => messageCreateAndUpdateMethod(msg));
bot.on("messageUpdate", (old_msg, msg) => messageCreateAndUpdateMethod(msg));
bot.on('interactionCreate', interaction => {
	if(interaction.isButton) reactToButton(interaction);
});