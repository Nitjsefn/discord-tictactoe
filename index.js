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
        let sentMsg = await msg.channel.send({content: `\`Game between\` **\`${player1}\`** \`and\` **\`${player2}\`**\n**\`${player1}\`**'s turn.`, components: rows });
        let grid = new Array(6);
        for(let i = 0; i < 3; i++)
        {
            grid[i] = new Array(3).fill('-');
        }
        grid[3] = sentMsg.id
        grid[4] = setTimeout(() =>
        {
            tttGridInChannel.delete('' + msg.guildId + msg.channel.id);
            registeredPlayers.delete('' + msg.guildId + msg.channel.id);
            return;
        }, 600000);
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
	//let rows = Array.from(msg.components);
    let grid = Array.from(tttGridInChannel.get('' + msg.guildId + msg.channel.id));
    let turn = grid.pop();
    let timeoutId = grid[grid.length-1];
    let activeMsgId = grid[grid.length-2];
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
    if(turn !== button.user.tag) { button.deferUpdate(); return; }
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
    let winButtons = new Array();
    for(let d = 0; d < 3; d++)
    {
        if(result === 'x' || result === 'o') break;
        let firstSign = grid[rowIndex][colIndex];
        for(let i = 0; i < 3; i++)
        {
            if(grid[d][i] === '-') result = 'none';
            if(grid[d][i] !== firstSign) break;
            if(i == 2) 
            {
                result = firstSign;
                winButtons = [''+d+0, ''+d+1, ''+d+2];
            }
        }
    }
    for(let d = 0; d < 3; d++)
    {
        if(result === 'x' || result === 'o') break;
        let firstSign = [rowIndex][colIndex];
        for(let i = 0; i < 3; i++)
        {
            if(grid[i][d] === '-') result = 'none';
            if(grid[i][d] !== firstSign) break;
            if(i == 2) 
            {
                result = firstSign;
                winButtons = [''+0+i, ''+1+i, ''+2+i];
            }
        }
    }
    for(let d = 0; d < 3; d++)
    {
        if(result === 'x' || result === 'o') break;
        let firstSign = grid[rowIndex][colIndex];
        if(grid[d][d] === '-') result = 'none';
        if(grid[d][d] !== firstSign) break;
        if(d == 2) 
        {
            result = firstSign;
            winButtons = ['00', '11', '22'];
        }
    }
    for(let d = 0; d < 3; d++)
    {
        if(result === 'x' || result === 'o') break;
        let firstSign = grid[rowIndex][colIndex];
        if(grid[d][2-d] === '-') result = 'none';
        if(grid[d][2-d] !== firstSign) break;
        if(d == 2) 
        {
            result = firstSign;
            winButtons = ['02', '11', '20'];
        }
    }
    log(grid[0]);
    log(grid[1]);
    log(grid[2]);
    log(result);
    log("11111111111111111111111111111111111111111111111111111111111111111111111111111111");
    if(result == 'none')
    {
        let rows = new Array();
        for(let i = 0; i < 3; i++)
        {
            let row = msg.components[i];
            let buttons = new Array();
            for(let d = 0; d < 3; d++)
            {
                buttons.push(row.components[d]);
                if(buttons[d].customId === button.customId)
                {
                    buttons[d].setLabel(grid[rowIndex][colIndex]);
                    buttons[d].setDisabled(true);
                }
            }
            row.setComponents(buttons[0], buttons[1], buttons[2]);
            rows.push(row);
        }
        rows.push(msg.components[3]);
        msg.edit({ content: `\`Game between\` **\`${player1}\`** \`and\` **\`${player2}\`**\n**\`${turn}\`**'s turn.`, components: rows });
        button.deferUpdate();
        grid.push(turn);
        tttGridInChannel.set('' + msg.guildId + msg.channel.id, grid);
        return;
    }
    if(result == 'draw')
    {
        let rows = new Array();
        for(let i = 0; i < 3; i++)
        {
            let row = msg.components[i];
            let buttons = new Array();
            for(let d = 0; d < 3; d++)
            {
                buttons.push(row.components[d]);
                if(i == rowIndex && d == colIndex)
                    buttons[d].setLabel(grid[rowIndex][colIndex]);
                buttons[d].setDisabled(true);
            }
            row.setComponents(buttons[0], buttons[1], buttons[2]);
            rows.push(row);
        }
        msg.edit({ components: rows });
        msg.reply("**Draw**. Nobody wins. Good luck next time.");
        button.deferUpdate();
        clearTimeout(timeoutId);
        grid.push(turn);
        tttGridInChannel.delete('' + msg.guildId + msg.channel.id);
        registeredPlayers.delete('' + msg.guildId + msg.channel.id);
        return;
    }
    if(result == 'x' || result == 'o')
    {
        let rows = new Array();
        for(let i = 0; i < 3; i++)
        {
            let row = msg.components[i];
            let buttons = new Array();
            for(let d = 0; d < 3; d++)
            {
                buttons.push(row.components[d]);
                if(i == rowIndex && d == colIndex)
                    buttons[d].setLabel(grid[rowIndex][colIndex]);
                for(let y = 0; y < 3; y++)
                {
                    if(parseInt(winButtons[y][0]) == i && parseInt(winButtons[y][1]) == d)
                        buttons[d].setStyle('SUCCESS');
                }
                buttons[d].setDisabled(true);

            }
            row.setComponents(buttons[0], buttons[1], buttons[2]);
            rows.push(row);
        }
        msg.edit({ components: rows });
        button.deferUpdate();
        clearTimeout(timeoutId);
        grid.push(turn);
        tttGridInChannel.delete('' + msg.guildId + msg.channel.id);
        registeredPlayers.delete('' + msg.guildId + msg.channel.id);
        msg.reply(`**\`${button.user.tag}\` won**`);
        return;
    }
}
