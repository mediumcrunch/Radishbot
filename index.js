console.clear();

const { prefix, token, giphyToken } = require("./config.json");

// discord
const Discord = require("discord.js");
const client = new Discord.Client();

// giphy
const GphApiClient = require("giphy-js-sdk-core");
giphy = GphApiClient(giphyToken);

// nedb
const Datastore = require("nedb");
const db = new Datastore("database.db");
db.loadDatabase();

client.once("ready", () => {
  console.log(`${client.user.tag} is ready!`);
});

client.on("message", message => {
  if (!message.content.startsWith(prefix) || message.author.bot) return;

  const moos = ["646488717506248705", "646487248191356971"];
  const moo = moos[Math.floor(Math.random() * moos.length)];
  const args = message.content.slice(prefix.length).split(/ +/);
  const commandAuthor = message.author;
  const command = args.shift().toLowerCase();

  // first ever test command and birthdate
  if (command === "rad") {
    message.channel
      .send(`Radishbot was born on November 5ᵗʰ, 2019 at approximately 9:37am PST and weighed 0kb. Rad was the first command it ever learned.`)
      .then(message => console.log(`Sent message: ${message.content}`))
      .catch(console.error);
  }

  // mamamoo gif commands
  if (command === "solar" || command === "moonbyul" || command === "wheein" || command === "hwasa" || command === "moonsun" || command === "mamamoo") {
    giphy
      .search("gifs", { q: `${command} mamamoo` })
      .then(response => {
        let totalGifs = response.data.length;
        let rand = Math.floor(Math.random() * totalGifs);
        let gif = response.data[rand];

        message.channel.send(gif.url);
      })
      .catch(() => {
        message.channel.send("Error");
      });
  }

  // meme command
  if (command === "meme") {
    const memes = ["asdf", "asdf2"];

    let msg = memes[Math.floor(Math.random() * memes.length)];

    message.channel.send(`${msg}`);
  }

  // count command
  // TODO count cleanup in database
  if (command === "count") {
    db.update({ count: { $exists: true } }, { $inc: { count: 1 } }, (err, docs) => {
      // do something
    });

    db.findOne({ count: { $exists: true } }, (err, docs) => {
      message.channel
        .send(docs.count)
        .then(msg => {
          msg.react(moo);
          console.log(`Sent message: ${msg.content} | Requested by: ${commandAuthor.tag}`);
        })
        .catch(console.error);
    });
  }

  // test command
  if (command === "test") {
    // db.find
    db.update({ user: commandAuthor.id }, { $inc: { count: 1 } }, { upsert: true }, (err, docs, upsert) => {
      db.findOne({ user: commandAuthor.id }, (err, doc) => {
        // let docTag = client.users.get(doc.user).tag;

        message.channel
          .send(`:credit_card: | **${commandAuthor.username}** has ${doc.count}`) // <@${commandAuthor.id}>
          .then(msg => {
            msg.react(moo);
          });
      });
    });
  }

  // leaderboard command
  if (command === "top") {
    db.find({ user: { $exists: true } })
      .sort({ count: -1 })
      .exec((err, docs) => {
        console.log(docs[0].user, docs[0].count);

        // TODO currently this is sending multiple messages
        docs.forEach((doc, i) => {
          message.channel.send(`\`\`\`${i + 1} ${client.users.get(doc.user).username} ${doc.count}\`\`\``);
        });
      });

    // db.findOne({ user: {$exists:true}}, err)
  }
});

client.login(token);
