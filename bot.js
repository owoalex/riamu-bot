const Discord = require('discord.js');
const discordClientObject = new Discord.Client();
const httpRequest = require('got');
const fileSystem = require('fs');
const URL = require('url');
const path = require('path');
var configFile = undefined;
var passedConfigFile = undefined;
process.argv.forEach(function (val, index, array) {
    if (index == array.length - 1) {
        passedConfigFile = val;
    }
});

try {
    try {
        try {
            configFile = require(passedConfigFile);
            if ((configFile["keys"] == undefined) || (configFile["keys"] == "")) {
                throw "No Api Key in passed config file";
            }
            console.log("[   INFO   ] Applying config file passed from cli [" + passedConfigFile + "]")
        } catch(ex) {
            configFile = require("./"+passedConfigFile);
            if ((configFile["keys"] == undefined) || (configFile["keys"] == "")) {
                console.log("[ WARNING  ] No Api Key in config file passed from cli [" + passedConfigFile + "]")
                throw "No Api Key in passed config file";
            }
            console.log("[   INFO   ] Applying config file passed from cli [./"+passedConfigFile + "]")
        }
    } catch(ex) {
        configFile = require('./config');
        if ((configFile["keys"] == undefined) || (configFile["keys"] == "")) {
            console.log("[ WARNING  ] No Api Key in config file from local directory")
            throw "No Api Key in passed config file";
        }
        console.log("[   INFO   ] Applying config file from local directory")
    }
} catch(ex) {
    console.log("[*CRITICAL*] NO VALID CONFIG FILE")
}
var discordApiKey = null;
var keyFile = null;
var keys = null;
var serverGlobVars = [];
var botUsername = null;
var botUserId = null;
var debugLevel = 3;
var triggerSuffix = "~";
var triggerPrefix = "BOTTEST";
var experimentalFeatureLevel = 0;
console.log("[   INFO   ] Initialising riamu-bot");
try{keyFile = configFile["keys"];if(keyFile == undefined){throw "notFound";};}catch(ex){console.log("[*CRITICAL*] NO API KEYS!")}
try{botUsername = configFile["botUsername"];if(botUsername == undefined){throw "notFound";};}catch(ex){console.log("[ WARNING  ] No username for bot, it may start talking to itself")}
try{botUserId = configFile["botUserId"];if(botUserId == undefined){throw "notFound";};}catch(ex){console.log("[ WARNING  ] No user id for bot, it may start talking to itself")}
try{debugLevel = configFile["debugLevel"];if(debugLevel == undefined){throw "notFound";};}catch(ex){console.log("[ WARNING  ] No debug level set, defaulting to max (you may get a lot of console clutter)");debugLevel = 3;}
try{triggerSuffix = configFile["triggerSuffix"];if(triggerSuffix == undefined){throw "notFound";};}catch(ex){console.log("[   INFO   ] No trigger suffix set, defaulting to ~");triggerSuffix = "~";}
try{triggerPrefix = configFile["triggerPrefix"];if(triggerPrefix == undefined){throw "notFound";};}catch(ex){console.log("[   INFO   ] No trigger prefix set, defaulting to yuri");triggerPrefix = "yuri";}
try{experimentalFeatureLevel = configFile["experimentalFeatureLevel"];if(experimentalFeatureLevel == undefined){throw "notFound";};}catch(ex){console.log("[   INFO   ] No experimental feature level set, defaulting to stable features");experimentalFeatureLevel = 0;}

if (!keyFile.startsWith("/")) {
    keyFile = path.join(__dirname,keyFile);
}
console.log("[   INFO   ] keyFile = "+keyFile);
keys = JSON.parse(fileSystem.readFileSync(keyFile).toString());
console.log("[   INFO   ] keyData = ");
console.log(JSON.stringify(keys));
try{discordApiKey = keys["discordApiKey"];if(discordApiKey == undefined){throw "notFound";};}catch(ex){console.log("[*CRITICAL*] NO DISCORD API KEY!")}
console.log("[   INFO   ] discordApiKey = "+discordApiKey);
console.log("[   INFO   ] botUsername = "+botUsername);
console.log("[   INFO   ] botUserId = "+botUserId);
console.log("[   INFO   ] debugLevel = "+debugLevel);
console.log("[   INFO   ] triggerSuffix = "+triggerSuffix);
console.log("[   INFO   ] triggerPrefix = "+triggerPrefix);
console.log("[   INFO   ] experimentalFeatureLevell = "+experimentalFeatureLevel);

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}
Number.prototype.pad = function(size) {
    var s = String(this);
    while (s.length < (size || 2)) {s = "0" + s;}
    return s;
}

discordClientObject.on('ready', function (evt) {
    try{
        console.log('[   INFO   ] Connected to Discord servers');
    } catch(ex) {
        if (debugLevel > 0){console.log("[  ERROR   ] " + ex);}
    }
});
discordClientObject.on('error', er => {
    try{
        if (debugLevel > 0){console.log("[  ERROR   ] " + er);}
    } catch(ex) {
        if (debugLevel > 0){console.log("[  ERROR   ] " + ex);}
    }
});
discordClientObject.on('ratelimit', function (ret) {
    try{
        console.log('[   INFO   ] Rate limiting detected: '+ret);
    } catch(ex) {
        if (debugLevel > 0){console.log("[  ERROR   ] " + ex);}
    }
});
discordClientObject.on('guildMemberAdd', member => {
    try{
        const channel = member.guild.channels.find('name', 'member-log');
        if (!channel) return;
        channel.send("Welcome to the server, "+member);
    } catch(ex) {
        if (debugLevel > 0){console.log("[  ERROR   ] " + ex);}
    }
});
discordClientObject.on("disconnect", event => {
	if (debugLevel > 1){console.log("[   INFO   ] Disconnected: " + event.reason + " (" + event.code + ")");}
})
discordClientObject.on('messageReactionAdd', (reaction, user) => {
    try{
        if (user.id != botUserId) {
            var serverID = undefined;
            //console.log(message.guild.name)
            var foundServer = false;
            for (i=0;i<serverGlobVars.length;i++) {
                if (serverGlobVars[i]["server"] == reaction.message.guild) {
                    foundServer = true;
                    serverID = i;
                }
            }

            if (foundServer) {
                if (permissionState(user.id,serverID,"music","skip")){
                    if (serverGlobVars[serverID]["lastQueue"].id == reaction.message.id) {
                        var reactionEmoji = reaction.emoji.name;

                        switch(reactionEmoji) {
                            case "\u23EE":
                                if (debugLevel > 2){console.log("[   INFO   ] Button: PrevTrack");};
                                commands.skipBack(null,reaction.message.channel,user.id,serverID);
                                break;
                            case "\u23ED":
                                if (debugLevel > 2){console.log("[   INFO   ] Button: SkipForward");};
                                commands.skipAhead(null,reaction.message.channel,user.id,serverID);
                                break;
                            case "\u23EA":
                                if (debugLevel > 2){console.log("[   INFO   ] Button: ScrubBack");};
                                break;
                            case "\u23EF":
                                if (debugLevel > 2){console.log("[   INFO   ] Button: PlayPause");};
                                break;//FE0F
                            case "\u23E9":
                                if (debugLevel > 2){console.log("[   INFO   ] Button: ScrubForward");};
                                break;//FE0F
                            case "\u{1F500}":
                                if (debugLevel > 2){console.log("[   INFO   ] Button: Shuffle");};
                                commands.shuffle(null,reaction.message.channel,user.id,serverID);
                                break;//FE0F
                            case "\u{1F501}":
                                if (debugLevel > 2){console.log("[   INFO   ] Button: Loop");};
                                commands.loop(null,reaction.message.channel,user.id,serverID);
                                break;//FE0F
                        }

                        reaction.remove(user).then(reaction => {
                            if (debugLevel > 2){console.log("[   INFO   ] Removed reaction from buttons");};
                    	});
                        //reaction.message.delete();
                        //displayQueue(serverID);
                    }
                } else {
                    serverGlobVars[serverID].messageChannel.send("You don't have the permission [music.skip] to do that ;-;");
                }
            }
            //if (reaction) {

            //}
        }
    } catch(ex) {
        if (debugLevel > 0){console.log("[  ERROR   ] " + ex);}
    };
});

function commandsClass() {}
const commands = new commandsClass();

function removeRole(message,roleName) {
    try {
        // message.member will be null for a DM, so check that the message is not a DM.
        if (!message.guild) message.channel.send('You must be in a guild.');

        // If the user has Role 1, remove it from them.
        let roleToMod = message.member.roles.find(role => role.name === roleName);
        if (roleToMod) message.member.removeRole(roleToMod);
        
    } catch(err) {
        // Log any errors.
        console.error(err);
    }
}

function addRole(message,roleName) {
    try {
        // message.member will be null for a DM, so check that the message is not a DM.
        if (!message.guild) message.channel.send('You must be in a guild.');


        let roleToMod = message.guild.roles.find(role => role.name === roleName);
        if (roleToMod) message.member.addRole(roleToMod);
        
    } catch(err) {
        // Log any errors.
        console.error(err);
    }
}

//returns trus if user has role
function getRoleStatus(message,roleName) {
    try {
        // message.member will be null for a DM, so check that the message is not a DM.
        if (!message.guild) message.channel.send('You must be in a guild.');

        // If the user has Role 1, remove it from them.
        let roleToMod = message.member.roles.find(role => role.name === roleName);
        if (roleToMod) {
            return true;
        } else {
            return false;
        }
        
    } catch(err) {
        // Log any errors.
        console.error(err);
    }
}

let colorRoles = ["Orang","Gold","Degen Green","R","G","B","Purple","Magenta","Hot Pink","Pastel Pink"];

function makeLowerCase(value) {
  return value.toString().toLowerCase();
}

discordClientObject.on('message', message => {
    try{
        if (message.content.endsWith(triggerSuffix) || message.content.startsWith(triggerPrefix)) {
            if (message.author.id != botUserId) {
                var rawMessage = message.content;
                if (message.content.endsWith(triggerSuffix)){
                    rawMessage = rawMessage.substring(0, message.content.length - (triggerSuffix.length));
                } else {
                    rawMessage = rawMessage.substring(triggerPrefix.length + 1, rawMessage.length);
                }
                var args = rawMessage.split(' ');
                while (args.indexOf("") > -1) {
                    args.splice(args.indexOf(""),1);
                }
                var cmd = makeLowerCase(args[0]);
                var serverID = undefined;
                //console.log(message.guild.name)
                var foundServer = false;
                for (i=0;i<serverGlobVars.length;i++) {
                    if (serverGlobVars[i]["server"] == message.guild) {
                        foundServer = true;
                        serverID = i;
                    }
                }
                if (foundServer == false) {
                    var testRowIndex = serverGlobVars.push({
                        server:message.guild,
                    }) - 1;
                    serverID = testRowIndex;
                }

                serverGlobVars[serverID].messageChannel = message.channel;
                try {
                    serverGlobVars[serverID].voiceChannel = message.member.voiceChannel;
                } catch(ex) {
                    if (debugLevel > 0){console.log("[  ERROR   ] " + ex);}
                }

                args = args.splice(1);
                switch(cmd) {
                    // !ping
                    case 'kyaa':
                        message.channel.send("You have nothing to be proud of "+message.author.username+", you fucking degenerate");
                        break;
                    case 'hewwo':
                        message.channel.send("Fuck off ***NEET***");
                        break;
                        
                        colorRoles
                    case 'colour':
                        if (args.length > 0) {
                            let matched = false;
                            for (let i=0; i<colorRoles.length; i++) {
                                if (makeLowerCase(colorRoles[i]) == makeLowerCase(args.join(" "))) {
                                    matched = true;
                                    if (!getRoleStatus(message,colorRoles[i])) {
                                        message.channel.send("Giving you the colour " + colorRoles[i]);
                                        for (let j=0; j<colorRoles.length; j++) {
                                            if (getRoleStatus(message,colorRoles[j])) {
                                                removeRole(message,colorRoles[j]);
                                            }
                                        }
                                        addRole(message,colorRoles[i]);
                                    } else {
                                        message.channel.send("You're already that colour!");
                                    }
                                }
                            }
                            if (!matched) {message.channel.send("That colour doesn't exist in my world :(");}
                        } else {
                            let colorRoleList = colorRoles.join(", ");
                            message.channel.send("You need to specify one of the colour roles! [" + colorRoleList + "]");
                        }
                        break;
                    case 'notify':
                        if (args.length > 0) {
                            switch(makeLowerCase(args[0])) {
                                case "events":
                                    if (getRoleStatus(message,"Notify Me About Events")) {
                                        message.channel.send("You won't be notified of official society events");
                                        removeRole(message,"Notify Me About Events");
                                    } else {
                                        message.channel.send("Okay, notifying you of all official society events");
                                        addRole(message,"Notify Me About Events");
                                    }
                                    break;
                                case "screenings":
                                    if (getRoleStatus(message,"Notify Me About Screenings")) {
                                        message.channel.send("You won't be notified of official society screenings");
                                        removeRole(message,"Notify Me About Screenings");
                                    } else {
                                        message.channel.send("Okay, notifying you of all official society screenings");
                                        addRole(message,"Notify Me About Screenings");
                                    }
                                    break;
                                case "unofficial":
                                    if (args.length > 1) {
                                        switch(makeLowerCase(args[1])) {
                                            case "events":
                                                if (getRoleStatus(message,"Notify Me About Unofficial Events")) {
                                                    message.channel.send("You won't be notified of unofficial society events");
                                                    removeRole(message,"Notify Me About Unofficial Events");
                                                } else {
                                                    message.channel.send("Okay, notifying you of all unofficial society events (Warning: anyone can ping this group!)");
                                                    addRole(message,"Notify Me About Unofficial Events");
                                                }
                                                break;
                                            case "screenings":
                                                if (getRoleStatus(message,"Notify Me About Unofficial Screenings")) {
                                                    message.channel.send("You won't be notified of unofficial society screenings");
                                                    removeRole(message,"Notify Me About Unofficial Screenings");
                                                } else {
                                                    message.channel.send("Okay, notifying you of all unofficial society screenings (Warning: anyone can ping this group!)");
                                                    addRole(message,"Notify Me About Unofficial Screenings");
                                                }
                                                break;
                                            default:
                                                message.channel.send("I'm not sure what you want me to notify you of...");
                                        }
                                    }
                                    break;
                                default:
                                    message.channel.send("I'm not sure what you want me to notify you of...");
                            }
                        } else {
                            message.channel.send("You need to specify what you want to be put on/taken off the notification list for! (events, screenings, unofficial events, unofficial screenings)");
                        }
                        break;
                    case 'fresher':
                        if (getRoleStatus(message,"Elderly/cultured")) {
                            removeRole(message,"Elderly/cultured");
                        }
                        if (!getRoleStatus(message,"Fresher")) {
                            addRole(message,"Fresher");
                            message.channel.send("uwu welcome to aber!");
                        } else {
                            message.channel.send("You're already marked a fresher!");
                        }
                        break;
                    case 'elderly':
                        if (getRoleStatus(message,"Fresher")) {
                            removeRole(message,"Fresher");
                        }
                        if (!getRoleStatus(message,"Elderly/cultured")) {
                            addRole(message,"Elderly/cultured")
                            message.channel.send("Hi ojiisan");
                        } else {
                            message.channel.send("You're already marked as elderly!");
                        }
                        break;
                    case 'student':
                        if (getRoleStatus(message,"Fresher")) {
                            removeRole(message,"Fresher");
                        }
                        if (getRoleStatus(message,"Elderly/cultured")) {
                            removeRole(message,"Elderly/cultured");
                        }
                        break;
                    case 'debug':
                        var builtInsert = "Servers (" + serverGlobVars.length + ") :" + "\n";
                        for (i=0;i<serverGlobVars.length;i++) {
                            try{
                                builtInsert = builtInsert + "    [" + i + "]" + serverGlobVars[i].server.name + "\n"
                            }catch(ex){}
                        }
                        builtInsert = builtInsert + "Current Server ID :" + serverID + "\n"
                        serverGlobVars[serverID].messageChannel.send("```markdown\n" + builtInsert + "```");
                        break;
                    case 'help':
                        displayHelp(serverID)
                        break;
                    default:
                        message.channel.send(cmd+"? That's not a valid command "+message.author.username);
                    // Just add any case commands if you want to..
                }
            }
        }
    } catch(ex) {
        if (debugLevel > 0){console.log("[  ERROR   ] " + ex);}
    };
});

function displayHelp(serverID) {
    var builtInsert = "";
    builtInsert = builtInsert + "\n\n**Hi, I'm riamu-bot!**";
    builtInsert = builtInsert + "\nWhen you want me to respond to a command either add a ~ to the end of your message or add my name (riamu)! to the start";
    builtInsert = builtInsert + "\n\n**Commands:**";
    builtInsert = builtInsert + "\n\ncolour <your desired colour>";
    builtInsert = builtInsert + "\n  Change the colour of your name";
    builtInsert = builtInsert + "\n\nnotify <events/screenings/unofficial events/unofficial screenings>";
    builtInsert = builtInsert + "\n  Change what you get pinged for";
    builtInsert = builtInsert + "\n\nfresher";
    builtInsert = builtInsert + "\n  Gives you the fresher role";
    builtInsert = builtInsert + "\n\nelderly";
    builtInsert = builtInsert + "\n  Gives you the elderly role";
    builtInsert = builtInsert + "\n\nstudent";
    builtInsert = builtInsert + "\n  Removes the fresher/elderly role";
    serverGlobVars[serverID].messageChannel.send(builtInsert);
}

function secondsToHumanTime(time) {
    var secNum = parseInt(time, 10); // don't forget the second param
    var hours   = Math.floor(secNum / 3600);
    var minutes = Math.floor((secNum - (hours * 3600)) / 60);
    var seconds = secNum - (hours * 3600) - (minutes * 60);

    if (hours   < 10) {hours   = "0"+hours;}
    if (minutes < 10) {minutes = "0"+minutes;}
    if (seconds < 10) {seconds = "0"+seconds;}
    if (hours > 0) {
        return hours+':'+minutes+':'+seconds;
    } else {
        return minutes+':'+seconds;
    }
}

function randomString(length, chars) {
    var mask = '';
    if (chars.indexOf('a') > -1) mask += 'abcdefghijklmnopqrstuvwxyz';
    if (chars.indexOf('A') > -1) mask += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (chars.indexOf('#') > -1) mask += '0123456789';
    if (chars.indexOf('!') > -1) mask += '~`!@#$%^&*()_+-={}[]:";\'<>?,./|\\';
    var result = '';
    for (var i = length; i > 0; --i) result += mask[Math.floor(Math.random() * mask.length)];
    return result;
}

//setInterval(updateServerPlaylists, 2000);

try{
    discordClientObject.login(discordApiKey);
} catch(ex) {
    console.log("[*CRITICAL*] COULD NOT LOGIN TO DISCORD")
    console.log("[  DETAIL  ] " + ex);
}
