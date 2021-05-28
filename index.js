const Discord = require('discord.js');
require('discord-reply');
const Parser = require('rss-parser');
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const https = require('https');
const fetch = require('node-fetch');
const DiscordOauth2 = require("discord-oauth2");
var session = require('express-session');
var NedbStore = require('nedb-session-store')(session);
const app = express();
const parser = new Parser();
const client = new Discord.Client();
const fs = require("fs")
let port = 80
const prefix = "%"
const setting = JSON.parse(fs.readFileSync("setting.json","UTF-8"))
const version = "v1.0"

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

if (setting.https){
	var options = {
	  key:  fs.readFileSync('./server_key.pem'),
	  cert: fs.readFileSync('./server_crt.pem')
	};
	var server = https.createServer(options,app);
	port = 443
}

app.use(session({
	secret: 'hogefugafoobar',
	resave: false,
	saveUninitialized: false,
	cookie:{
		httpOnly: true,
		maxage: 1000 * 60 * 60 * 24 * 7
	},
	store: new NedbStore({
		filename: './db/session.db'
	})
}));

app.use(bodyParser.urlencoded({
    extended: true
}))
app.set('ejs', ejs.renderFile);
app.use(express.static('static'));
app.use(bodyParser.json());

app.get('/', (req, res) => {
	res.render('index.ejs', {
	})
})

app.get('/dev/null', (req, res) => {
	res.status(200).send("null")
})

app.get('/data/reset', (req, res) => {
	req.session.servers=undefined
	res.status(200).send("updated")
})

app.get('/manage/:id', (req, res,next) => {
	let servers=JSON.parse(req.session.servers)
	if (servers.filter((x)=>x.id==req.params.id).length==0){
		res.status(500).send("<pre>"+JSON.stringify(servers,null," ").replace(req.params.id,`<b>${req.params.id}</b>`)+"</pre>")
		next()
		return
	}
	let messages={}
	for (var key in serverData[req.params.id]["stickys"]){
		messages[key]={
			"content":serverData[req.params.id]["stickys"][key]["content"]
		}
	}
	let icon
	let guild = (servers.filter((x)=>x.id==req.params.id))[0]
	icon = `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`
	if (guild.icon==null)icon = "/null.png"
	res.render('messages.ejs', {
		messages:messages,
		guild:(servers.filter((x)=>x.id==req.params.id))[0],
		icon:icon,
	})
})

app.get('/manage/:id/:msgid', (req, res,next) => {
	let servers=JSON.parse(req.session.servers)
	if (servers.filter((x)=>x.id==req.params.id).length==0){
		res.status(500).send("<pre>"+JSON.stringify(servers,null," ").replace(req.params.id,`<b>${req.params.id}</b>`)+"</pre>")
		next()
		return
	}
	let message = "null"
	if (serverData[req.params.id]["stickys"][req.params.msgid]["content"]){
		message=serverData[req.params.id]["stickys"][req.params.msgid]["content"]
	}
	let icon
	let guild = (servers.filter((x)=>x.id==req.params.id))[0]
	icon = `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`
	if (guild.icon==null)icon = "/null.png"
	res.render('edit.ejs', {
		message:message,
		guild:(servers.filter((x)=>x.id==req.params.id))[0],
		icon:icon,
	})
})

app.post('/manage/:id/:msgid', async(req, res,next) => {
	if (!req.body.content){
		res.status(401).send(JSON.stringify({"error":true}))
		next()
		return
	}
	let content = req.body.content
	let guild = await client.guilds.fetch(req.params.id)
	let x = await client.channels.fetch(serverData[req.params.id]["stickys"][req.params.msgid]["channel"])
	let a=new Discord.GuildChannel(guild,x);
	a=new Discord.TextChannel(guild,a);
	let y = await a.messages.fetch(req.params.msgid)
	y.edit(`${content}\nMessageId: ${req.params.msgid}`)
	serverData[req.params.id]["stickys"][req.params.msgid]["History"].unshift(serverData[req.params.id]["stickys"][req.params.msgid]["content"])
	serverData[req.params.id]["stickys"][req.params.msgid]["History"]=serverData[req.params.id]["stickys"][req.params.msgid]["History"].slice(0,9)
	serverData[req.params.id]["stickys"][req.params.msgid]["content"]=`${content}`
	res.json({"value":serverData[req.params.id]["stickys"][req.params.msgid]["content"]})
})

app.get('/oauth/login', async(req, res,next) => {
	let guildList=[]
	let oauth = new DiscordOauth2();
	let redirect=`https://127.0.0.1/oauth/login`
	let _res
	try {
		_res=await oauth.tokenRequest({
		    clientId: "843436875608096798",
		    clientSecret: "wAo3cDguGWy3tdNYCAyZzN-joc16FmLq",
 
    		code: `${req.query.code}`,
    		scope: "identify guilds",
   		 	grantType: "authorization_code",
   	 
   		 	redirectUri: `${redirect}`,
		})
	}catch{}
	if ((_res==undefined || !req.query.code) && (req.session.servers==undefined || req.session.servers=="[]")){
		res.redirect(setting.oauth_url)
		next()
		return
	}
	let server_arr=[]
	if (req.session.servers==undefined)req.session.servers="[]"
	if (JSON.parse(req.session.servers).length>0){
		server_arr=JSON.parse(req.session.servers)
	}
	if (_res && server_arr.length==0){
		let token=_res.access_token
		_res=await oauth.getUserGuilds(token)
		let z=await oauth.getUser(token)	// 公式apiからなのでdiscord.jsのオブジェクトは帰ってこない
		let user=new Discord.User(client,z)	// ロールが必要なので変換
		for (var i=0;i<_res.length;i++){
			let x=_res[i]
			let y=client.guilds.cache.get(x.id)
			if ((y==undefined || !serverData[x.id])==false){
				y=await client.guilds.fetch(x.id)
				let role=await y.members.fetch(user.id)
				let _roles = role.roles.cache.filter( (n)=>(
					serverData[x.id].adminRoles.includes(n.name)
				))
				if (
					serverData[x.id] &&
					(
						x.owner==true ||
						_roles!=undefined && _roles.size!=false
					)
				){
					server_arr.push(x)
				}
			}
		}
		req.session.servers=JSON.stringify(server_arr)
	}
	res.render('oauth.ejs', {
		code:req.query.code,
		servers:server_arr
	})
})

var serverData=JSON.parse(fs.readFileSync("serverData.json","UTF-8"))
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
			"||`|д・)ﾁﾗｯ`||"
		]
	},
]

client.on('message', (message)=>{

	if(message.author.bot)return;

	let helpEmbed={embed:{
		title:"ヘルプ",
		footer:{
			text:`prefix: ${prefix}`
		},
		thumbnail:{
			url:`${client.user.displayAvatarURL()}`
		},
		fields:[
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
				name:"foo",
				value:"barって送るよ",
				inline:true
			},
			{
				name:"coord.toNether",
				value:"オーバーワールドの座標をネザーの座標に変換するよ",
				inline:true
			},
			{
				name:"coord.toOverWorld",
				value:"ネザーの座標をオーバーワールドの座標に変換するよ",
				inline:true
			}
		]
	}}

	if (message.content.startsWith(prefix)){
		command=message.content.substr(prefix.length).split(" ")
		switch (command[0]){
			default:
				message.channel.send(helpEmbed)
			break;
			case "foo":
				message.reply("bar")
			break;
			case "create":
				if (!command[1]){
					message.channel.send(`CreateFUSEN <message>\n引数を指定してください`)
					break;
				}
				message.channel.send(`${command[1]}\nMessageId: ${message.id}`)
				.then((msg)=>{
					if (!serverData[message.guild.id])serverData[message.guild.id]={"adminRoles":[],"stickys":{}}
					if (!serverData[message.guild.id]["stickys"][msg.id])serverData[message.guild.id]["stickys"][msg.id]={"content":"","History":[]}
					serverData[message.guild.id]["stickys"][msg.id]["content"]=msg.content
					serverData[message.guild.id]["stickys"][msg.id]["channel"]=msg.channel.id
				})
			break;
			case "AddRole":
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
			case "DelRole":
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
				arg[2]+="\nMessageId: "+arg[1]
				if (!serverData[message.guild.id]["stickys"])break;
				if (!serverData[message.guild.id]["stickys"][arg[1]])break;
				let chid=serverData[message.guild.id]["stickys"][arg[1]]["channel"]
				client.channels.fetch(chid).then((x)=>{
					let a=new Discord.GuildChannel(message.guild,x);
					a=new Discord.TextChannel(message.guild,a);
					a.messages.fetch(arg[1]).then((y)=>{
						y.edit(arg[2])
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
			case "server.iconURL":
				message.channel.send(message.guild.iconURL())
			break;
			case "coord.toNether":
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
			case "coord.toOverWorld":
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
		}
	}
});
var bootTime
client.on('ready', ()=>{
	bootTime=new Date().getTime()
	console.log(`Logged in as ${client.user.tag}`);
	client.user.setActivity(`${prefix}help | ${version}`,{type:"PLAYING"})
})

process.on("exit", function() {
    var json = JSON.stringify(serverData, null, "\t");
    fs.writeFileSync("serverData.json", json);
})
process.on("SIGINT", function () {
    process.exit(0);
});

const token = process.env["2b2tjpDbotToken"]
client.login(token);
if (setting.https){
	server.listen(port);
}else{
	app.listen(port);
}
console.log("HTTPサーバーPORT = " + port);