require('dotenv').config();
const prefix = process.env.BOT_PREFIX;
const token = process.env.BOT_TOKEN;
const { log } = console;
const { Client, Intents, MessageEmbed, MessageAttachment, MessageActionRow, MessageButton } = require('discord.js');
const bot = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_VOICE_STATES] });
var registeredPlayers = new Map();
var tttGridInChannel = new Map();

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
		case "tictactoe": startGame(msg); break;
		default: msg.reply("Wrong command!"); break;
	}
}

async function startGame(msg, args)
{
    if(registeredPlayers.has('' + msg.guildId + msg.channel.id))
    {
        let playersIDs = registeredPlayers.get('' + msg.guildId + msg.channel.id)
        if(playersIDs.length > 1) { msg.reply(`There can be only one match per channel`); return; }
        playersIDs.push(msg.author.tag);
        registeredPlayers.set('' + msg.guildId + msg.channel.id, playersIDs);
        let rows = new Array();
        for(let i = 0; i < 3; i++)
        {
            let row = new MessageActionRow();
            for(let d = 0; d < 3; d++)
            {
                let defaultButton = new MessageButton()
                    .setCustomId(''+i+d)
	                .setLabel('\u200b')
	                .setStyle('SECONDARY')
	                .setDisabled(false);
                row.addComponents(defaultButton);
            }
                rows.push(row);
        }
        let stopButton = new MessageButton()
             .setCustomId('stop')
		    .setLabel('STOP GAME')
		    .setStyle('DANGER')
		    .setDisabled(false);
        rows.push(new MessageActionRow().addComponents(stopButton));
        let player1 = playersIDs[0];
        let player2 = playersIDs[1];
        let sentMsg = await msg.channel.send({content: `\`Game between\` **\`${player1}\`** \`and\` **\`${player2}\`**`, components: rows });
        let grid = new Array(6);
        for(let i = 0; i < 3; i++)
        {
            grid[i] = new Array(3).fill('-');
        }
        grid[3] = sentMsg.id
        grid[4] = setTimeout(() =>
        {
            return;
        }, 600);
        grid[5] = player1;
        tttGridInChannel.set('' + msg.guildId + msg.channel.id, grid);
    }
    else
    {
        let playersIDs = new Array();
        playersIDs.push(msg.author.tag);
        registeredPlayers.set('' + msg.guildId + msg.channel.id, playersIDs);
        msg.reply("Waiting for another player. He should type the same command to join.");
    }
}

function reactToButton(button)
{
	if(button.message.author.username !== BOT_NAME) return;
    let msg = button.message;
    if(!tttGridInChannel.has('' + msg.guildId + msg.channel.id))
    {
        msg.reply("This game is not up to date. Start the new one!");
        let rows = new Array();
        for(let i = 0; i < 3; i++)
        {
            let row = msg.components[i];
            let defaultButton = row.components[0];
	        defaultButton.setDisabled(true);
            let defaultButton2 = row.components[1];
	        defaultButton2.setDisabled(true);
            let defaultButton3 = row.components[2];
	        defaultButton3.setDisabled(true);
            row.setComponents(defaultButton, defaultButton2, defaultButton3);
            rows.push(row);
        }
        msg.edit({ components: rows });
        button.deferUpdate();
        return;
    }
	let rows = Array.from(msg.components);
    let grid = Array.from(tttGridInChannel.get('' + msg.guildId + msg.channel.id));
    let turn = grid.pop();
    let timeoutId = grid.pop();
    let activeMsgId = grid.pop();
    let players = Array.from(registeredPlayers.get('' + msg.guildId + msg.channel.id));
    let player1 = players[0]; // x
    let player2 = players[1]; // o
    if(activeMsgId !== msg.id)
    {
        msg.reply("This game is not up to date. Find current one!");
        let rows = new Array();
        for(let i = 0; i < 3; i++)
        {
            let row = msg.components[i];
            let defaultButton = row.components[0];
	        defaultButton.setDisabled(true);
            let defaultButton2 = row.components[1];
	        defaultButton2.setDisabled(true);
            let defaultButton3 = row.components[2];
	        defaultButton3.setDisabled(true);
            row.setComponents(defaultButton, defaultButton2, defaultButton3);
            rows.push(row);
        }
        msg.edit({ components: rows });
        button.deferUpdate();
        return;
    }
    if(!msg.editable)
	{
		msg.channel.send("I can't edit this message.");
		if(msg.deletable)
		{
			msg.channel.send("I deleted this message.");
			msg.delete();
		}
		registeredPlayers.delete('' + msg.guildId + msg.channel.id);
        tttGridInChannel.delete('' + msg.guildId + msg.channel.id);
		clearTimeout(timeoutId);
		return;
	}
	if(button.customId === 'stop')
	{
        registeredPlayers.delete('' + msg.guildId + msg.channel.id);
        tttGridInChannel.delete('' + msg.guildId + msg.channel.id);
        let rows = new Array();
        for(let i = 0; i < 3; i++)
        {
            let row = msg.components[i];
            let defaultButton = row.components[0];
	        defaultButton.setDisabled(true);
            let defaultButton2 = row.components[1];
	        defaultButton2.setDisabled(true);
            let defaultButton3 = row.components[2];
	        defaultButton3.setDisabled(true);
            row.setComponents(defaultButton, defaultButton2, defaultButton3);
            rows.push(row);
        }
        msg.edit({ components: rows });
        button.deferUpdate();
		clearTimeout(timeoutId);
        return;
	}
    if(turn !== button.user.tag) return;
    let rowIndex = parseInt(button.customId[0]);
    let colIndex = parseInt(button.customId[1]);
    if(turn === player1)
    {
        grid[rowIndex][colIndex] = 'x';
        turn = player2;
    }
    else
    {
        grid[rowIndex][colIndex] = 'o';
        turn = player1;
    }
    let result = 'draw';
    let firstSign = grid[0][0];
    for(let i = 1; i < 3; i++)
    {
        if(grid[0][i] === '-') result = 'none';
        if(grid[0][i] !== firstSign) break;
        if(i == 2) result = firstSign;
    }
}
