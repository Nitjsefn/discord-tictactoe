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

function messageCreateAndUpdateMethod(msg)
{
    if(msg.author.isBot) return;
    if(msg.content[0] != prefix) return;
	let arguments = msg.content.split(' ');
	arguments[0] = arguments[0].slice(1);
	let command = arguments.shift();
	switch(command)
	{
		case "start": startGame(msg, arguments); break;
		default: msg.reply("Wrong command!"); break;
	}
}