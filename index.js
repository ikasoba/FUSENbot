const Discord = require('discord.js');
require('discord-reply');
const Parser = require('rss-parser');
const DiscordOauth2 = require("discord-oauth2");
const parser = new Parser();
const client = new Discord.Client();
const discord_buttons = require("discord-buttons")
discord_buttons(client)
const fs = require("fs")
const setting = JSON.parse(fs.readFileSync("setting.json","UTF-8"))
let port = process.env["PORT"] || setting.port
const prefix = "f."
var helpEmbed
const version = "v1.0Z"

async function Afilter (array,fnc){
	let res=[]
	for (var i=0;i<array.length;i++){
		if (await fnc(array[i])){
			res.push(array[i])
		}
	}
	return res
}

function _split(str,sep,max){
	var result = []
	var a = ""
	var split_cnt = 0
	max--
	for (var i=0;i<str.length+1;i++){
		a+=str.substr(i,1)
		if ( (str.substr(i,1)==sep && split_cnt<max) || i==str.length){
			if (i==str.length)a+="a"
			result.push(a.substr(0,a.length-1))
			a=""
			split_cnt++
		}
	}
	return result
}

async function sendAll(str){
	var list=client.guilds.cache.keys()
	for (var i=0;i<client.guilds.cache.size;i++){
		var a=list.next().value
		a=client.guilds.cache.get(a)
		a=a.channels.cache.find((x)=> (x.type=="text" && x.name.match(/^(2y2t).*/)) )
		a.send(str)
	}
}

var txt
try {
	txt=fs.readFileSync("serverData.json","UTF-8")
}catch{
	fs.writeFileSync("serverData.json","{}")
	txt=fs.readFileSync("serverData.json","UTF-8")
}

var serverData=JSON.parse(txt)
var SAMPLEserverData={
	"(serverID)":{
		"prefix":"",
		"adminRoles":[],
		"stickys":{
			"(messageID)":{
				"channel":"",
				"History":["MAX=10"],
				"content":"hogehoge"
			}
		}
	}
}

var date=new Date()
function zerofill(int,max){
	return "0".repeat( max-((int+"").length) )+(int+"")
}

var omikuji=[
	{
		"name":"大吉",
		"info":[
			"あなたはやれば出来る子！",
			"焦らずゆっくりでいいから頑張ろう",
			"辛い時を耐え抜けばきっといいことがある",
			"色々挑戦したらいいことがあるかも",
		]
	},
	{
		"name":"中吉",
		"info":[
			"大切な人に感謝を伝えよう",
			"今日はいいことがありそう！",
			"祈るだけじゃ届かない！目標に近づくには頑張りも必要だ！",
			"真剣に取り組めばきっと成功する！",
		]
	},
	{
		"name":"吉",
		"info":[
			"頑張り過ぎずに少しずつ進もう",
			"疲れたときは休もう",
			"休みすぎるとチャンスは離れていく",
			"頑張った数だけいいことが起こる",
		]
	},
	{
		"name":"末吉",
		"info":[
			"休むこともたいせつ",
			"二度寝したっていいさ",
			"逆に考えるんだ。行かなくていいさと",
			"失敗したっていい。経験は大切！",
		]
	},
	{
		"name":"末凶",
		"info":[
			"お会計をしているときにあと２０円足りないなんてことがあるかもしれない",
			"ゴキブリなんて怖くない！",
			"幽霊があなたのパンツを裏表反対にするかも",
			"舌を噛むかも",
		]
	},
	{
		"name":"凶",
		"info":[
			"ころんだ時、石が足に食い込むかも",
			"お賽銭を入れようと５円玉を出したら真っ二つに割れてるかも",
			"靴紐が切れるかも",
			"足に重いものを落とすかも",
		]
	},
	{
		"name":"半凶",
		"info":[
			"辛い時こそ笑っていよう",
			"朝起きたら目の前に全裸のおっさんがいるかもしれない",
			"逆に考えるんだ。これ以上不幸にならないと",
			"失敗したっていいけど失敗はよくないよね",
		]
	},
	{
		"name":"大凶",
		"info":[
			"深夜にトイレに行くとおっさんが便座を温めていることがあるよ",
			"全裸のおっさんが奇声をあげながら追いかけてくるかも",
			"辛い時はおっさんが慰めてくれる",
			"おっさんはいつだって君を見守っているよ",
			"おっさんが身代わりになってくれるよ",
			"おっさんに「違う、私がおまえの父親だ」と言われても冷静さを保とう",
			"おっさんはいつだって君を追いかけるよ",
			"||`|д・)ﾁﾗｯ`||",
			`\`\`\`
			＿人人人人人＿
			＞　大　凶　＜
			￣Y^Y^Y^Y^Y￣
			\`\`\``
		]
	},
]

client.on('message', (message)=>{

	if(message.author.bot)return;
	if (message.channel.type=="dm")return;
	if (!serverData[message.guild.id])serverData[message.guild.id]={"adminRoles":[],"stickys":{}}
	if (message.content.startsWith(prefix)){
		command=message.content.substr(prefix.length).split(" ")
		switch (command[0].toLowerCase()){
			default:
				message.channel.send({embed:helpEmbed})
			break;
			case "vote":
				var button = new discord_buttons.MessageButton()
					.setStyle("green")
					.setID("vote")
					.setEmoji("🗳️")
				message.channel.send(Object.assign({embed:[

				]},{component:button}))
			break;
			case "create":
				if (!message.member.permissions.has("ADMINISTRATOR") || (serverData[message.guild.id] && !message.member.roles.cache.filter(x => serverData[message.guild.id]["adminRoles"].includes(x.name))))break;
				if (!command[1]){
					message.channel.send(`CreateFUSEN <message>\n引数を指定してください`)
					break;
				}
				message.channel.send(`${command[1]}\nMessageId: ${message.id}`)
				.then((msg)=>{
					console.log("[MSG] modified to serverData")
					if (!serverData[message.guild.id])serverData[message.guild.id]={"adminRoles":[],"stickys":{}}
					if (!serverData[message.guild.id]["stickys"][msg.id])serverData[message.guild.id]["stickys"][msg.id]={"content":"","History":[]}
					serverData[message.guild.id]["stickys"][msg.id]["content"]=command[1]
					serverData[message.guild.id]["stickys"][msg.id]["channel"]=msg.channel.id
				})
			break;
			case "configure":
				if (!message.member.permissions.has("ADMINISTRATOR"))break;
				if (!command[1] || !command[2]){
					message.channel.send("configure <config> <value>\n引数を指定してください")
					break;
				}
			break;
			case "addrole":
			if (!message.member.permissions.has("ADMINISTRATOR"))break;
				if (!command[1]){
					message.channel.send("AddRole <RoleName>\n引数を指定してください")
					break;
				}
				if (!serverData[message.guild.id])serverData[message.guild.id]={"adminRoles":[],"stickys":{}}
				serverData[message.guild.id]["adminRoles"].push(command[1])
				message.channel.send("たぶん成功")
				//console.log( message.member.roles.cache.filter(x => x.name=="admin") )
			break;
			case "delrole":
				if (!message.member.permissions.has("ADMINISTRATOR"))break;
				if (!command[1]){
					message.channel.send("DelRole <RoleName>\n引数を指定してください")
					break;
				}
				if (!serverData[message.guild.id])serverData[message.guild.id]={"adminRoles":[],"stickys":{}}
				if (serverData[message.guild.id]["adminRoles"].indexOf(command[1])!=-1){
					let index=serverData[message.guild.id]["adminRoles"].indexOf(command[1])
					serverData[message.guild.id]["adminRoles"].splice(index,1)
					message.channel.send("たぶん成功")
				}
				//	console.log( message.member.roles.cache.filter(x => x.name=="admin") )
			break;
			case "edit":
				if (!message.member.permissions.has("ADMINISTRATOR") || !message.member.roles.cache.filter(x => serverData[message.guild.id]["adminRoles"].includes(x.name)))break;
				let arg=_split(message.content.substr(prefix.length)," ",3)
				if (!arg[1] || !arg[2]){
					message.channel.send("edit <messageID> <message>\n引数を指定してください")
					break;
				}
				if (!serverData[message.guild.id]["stickys"])break;
				if (!serverData[message.guild.id]["stickys"][arg[1]])break;
				let chid=serverData[message.guild.id]["stickys"][arg[1]]["channel"]
				client.channels.fetch(chid).then((x)=>{
					let a=new Discord.GuildChannel(message.guild,x);
					a=new Discord.TextChannel(message.guild,a);
					a.messages.fetch(arg[1]).then((y)=>{
						y.edit(arg[2]+"\nMessageId: "+arg[1])
						let content=serverData[message.guild.id]["stickys"][arg[1]]["content"]
						serverData[message.guild.id]["stickys"][arg[1]]["History"].unshift(content)
						serverData[message.guild.id]["stickys"][arg[1]]["History"]=serverData[message.guild.id]["stickys"][arg[1]]["History"].slice(0,9)
						serverData[message.guild.id]["stickys"][arg[1]]["content"]=arg[2]
						message.channel.send(`\`${x.name}\` のメッセージの内容を\n\`\`\`${arg[2]}\`\`\`にしました`)
					})
				})
			break;
			case "omikuji":
				let res=omikuji[~~(Math.random()*omikuji.length)]
				message.channel.send({embed:{
					"author":{
						"name":`${message.author.username}`
					},
					"title":`${res.name}`,
					"description":`${res.info[~~(Math.random()*res.info.length)]}`,
				}})
			break;
			case "coord.tonether":
				if (!command[1] || !command[2]){
					message.channel.send("引数すくない")
					break;
				}
				var hoge=""
				if (!command[3]){
					var x=parseFloat(command[1])
					var z=parseFloat(command[2])
					x=Math.floor(x/8)
					z=Math.floor(z/8)
					hoge=`${x} y ${z}`
				}else{
					var x=parseFloat(command[1])
					var z=parseFloat(command[2])
					x=Math.floor(x)/8
					z=Math.floor(z)/8
					hoge=`${x} ${Math.floor(parseFloat(command[3]))} ${z}`
				}
				message.channel.send(hoge)
			break;
			case "coord.tooverworld":
				if (!command[1] || !command[2]){
					message.channel.send("引数すくない")
					break;
				}
				var hoge=""
				if (!command[3]){
					var x=parseFloat(command[1])
					var z=parseFloat(command[2])
					x=Math.floor(x*8)
					z=Math.floor(z*8)
					hoge=`${x} ~ ${z}`
				}else{
					var x=parseFloat(command[1])
					var z=parseFloat(command[2])
					x=Math.floor(x)*8
					z=Math.floor(z)*8
					hoge=`${x} ${Math.floor(parseFloat(command[3]))} ${z}`
				}
				message.channel.send(hoge)
			break;
			case "length":
				if (command.length-1<4){
					message.channel.send("引数が少ない 最小4個から～")
					break;
				}
				var a
				var speed=``
				console.log(command)
				if(command.length-1>=6){

					// x,y,z,x,y,z
					a=Math.sqrt((command[1]-command[4])**2 + (command[2]-command[5])**2 + (command[3]-command[6])**2)

				}else if (command.length-1>=4){

					// x,z,x,z
					a=Math.sqrt((command[1]-command[3])**2 + (command[2]-command[4])**2)

				}
				if((command.length-1)%2==1){
					speed=`\n${~~(a/command[command.length-1])}秒かかるかも...?`
				}
				message.channel.send(`距離は${~~a}ブロックの気がする...。${speed}`)
			break;
			case "dice":
				if (!command[1]){
					break;
				}
				message.channel.send(""+~~(Math.random()*parseInt(command[1])))
			break;
			case "ncodice":
				var r="";
				message.channel.send("...").then((msg)=>{
					for (var i=0;i<6;i++){
						r+=(["う","ま","ち","ん","こ","お"])[~~(Math.random()*6)]
					}
					var ncoanim=(str,i,msg)=>{
						msg.edit(str.substr(0,i))
						if (i<=str.length){setTimeout(ncoanim,500,str,i+2,msg)
						}
					}
					setTimeout(ncoanim,2000,r,2,msg)
				})
			break;
		}
	}
});

client.on("guildMemberAdd",(member)=>{
})

client.on('clickButton', async (button) => {
	if (button.id=="reflesh_help"){
		button.message.edit({embed:helpEmbed})
		setTimeout(()=>{
			let btn = new discord_buttons.MessageButton()
					.setStyle("green")
					.setID("reflesh_help")
					.setEmoji("🔄")
			button.message.edit({embed:helpEmbed,component:btn})
		},60000)
		await button.defer()

	}
})

var bootTime
client.on('ready', async()=>{
	helpEmbed = {
		"title":"ヘルプ",
		"footer":{
			"text":`prefix: ${prefix}`
		},
		"thumbnail":{
			"url":`${client.user.displayAvatarURL()}`
		},
		"fields":[
			{
				name:"自己紹介",
				value:"FUSENbotはたのしいたのしいボットだよ！",
			},
			/*{
                name:"付箋の編集はweb上からでもできます",
                value:`${domain}/oauth/login`,
            },
            {
            	name:"招待リンク",
            	value:`${domain}/invite`
            },*/
			{
				name:"create",
				value:"新しく付箋を作るよ",
				inline:true,
			},
			{
				name:"edit",
				value:"付箋の内容を編集するよ",
				inline:true,
			},
			{
				name:"AddRole",
				value:"引数に指定したロールを付箋を編集できるロールリストに追加するよ",
				inline:true,
			},
			{
				name:"DelRole",
				value:"引数に指定したロールを付箋を編集できるロールリストから外すよ",
				inline:true,
			},
			{
				name:"omikuji",
				value:"おみくじが引けるよ！",
				inline:true,
			},
			{
				name:"server.iconURL",
				value:"サーバーのアイコンを表示するよ",
				inline:true,
			},
			{
				name:"coord.toNether",
				value:"オーバーワールドの座標をネザーの座標に変換するよ",
				inline:true
			},
			{
				name:"coord.toOverworld",
				value:"ネザーの座標をオーバーワールドの座標に変換するよ",
				inline:true
			},
			{
				name:"length",
				value:"距離と時間を計算するやつ",
				inline:true
			},
			{
				name:"ncodice",
				value:"雑にNCODICEを再現してみたよ",
				inline:true
			}
		]
	}
	bootTime=new Date().getTime()
	console.log(`Logged in as ${client.user.tag}`);
	client.user.setActivity(`${prefix}help | ${version}`,{type:"PLAYING"})
})

process.on("exit", function() {
    var json = JSON.stringify(serverData, null, "\t");
    fs.writeFileSync("serverData.json", json);
})
process.on("SIGINT", function () {
    process.exit(1);
});

function autosave(func){
	var json = JSON.stringify(serverData, null, "\t");
    fs.writeFileSync("serverData.json", json);
	setTimeout(func,1000*60*5)
}

setTimeout(autosave,1000*60*5,autosave)

const token = process.env["FUSENtoken"]
client.login(token);