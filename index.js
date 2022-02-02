require('dotenv').config();
const prefix = process.env.BOT_PREFIX;
const token = process.env.BOT_TOKEN;
const { log } = console;
const { Client, Intents, MessageEmbed, MessageAttachment, MessageActionRow, MessageButton } = require('discord.js');