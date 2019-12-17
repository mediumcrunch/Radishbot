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

// data stuff (persitence)
const tictactoeData = {
  spaces: Array(9).fill(null),
  player: 1,
  playerOne: ":x:",
  playerTwo: ":o:",
  victor: null
};

const hangmanData = {
  per: 0,
  words: ["dab", "moonbyul", "hwasa"]
};

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

  // hangman command
  if (command === "hangman" || command === "hm") {
    let letter = args[0];

    if (letter) {
      if (letter.length === 1 && letter.match(/[a-z]/)) {
        hangman(letter.toLowerCase());
      } else {
        console.log("guess a letter a-z");
      }
    } else {
      console.log("guess a letter a-z");
    }
  }

  // tictactoe command
  if (command === "tictactoe" || command === "ttt") {
    let { spaces, player, playerOne, playerTwo, victor } = tictactoeData;

    let tile = args[0];

    if (tile <= 9 && tile >= 1 && spaces[tile - 1] === null) {
      let tiles = [":one:", ":two:", ":three:", ":four:", ":five:", ":six:", ":seven:", ":eight:", ":nine:"];
      let board = [];

      // update spaces
      spaces[tile - 1] = player;

      // update board
      spaces.forEach((space, i) => {
        if (space === null) {
          board.push(tiles[i]);
        } else {
          let icon = space === 1 ? playerOne : playerTwo;
          board.push(icon);
        }

        if ((i + 1) % 3 === 0) {
          board.push("\n");
        } else {
          board.push(" ");
        }
      });

      // update player
      tictactoeData.player = player === 1 ? 2 : 1;

      message.channel.send(`${board.join("")}`).then(msg => {
        msg.react(moo);
      });
    } else if (tile === "reset") {
      tttReset();

      message.channel.send(`Board reset. Please specify a tile 1-9.`);
    } else {
      message.channel.send(`Please specify an unclaimed tile 1-9.`);
    }

    tttVictoryCheck(commandAuthor);
  }
});

client.login(token);

const tttVictoryCheck = commandAuthor => {
  console.log("checking for victory");

  let { spaces, player, victor, playerOne, playerTwo } = tictactoeData;

  const scenarios = [
    [0, 4, 8],
    [2, 4, 6],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8]
  ];

  scenarios.map(scenario => {
    let [a, b, c] = scenario;

    if (spaces[a] && spaces[a] === spaces[b] && spaces[a] === spaces[c]) {
      // somebody won
      victor = player;

      console.log(`victor`, victor);
      if (victor) {
        let player = victor === 1 ? playerOne : playerTwo;

        message.channel.send(`Player ${player} wins!`);
      }

      // upsert victory count for winner
      // TODO
      // db.update({ user: commandAuthor.id }, { $inc: { tttWins: 1 } }, { upsert: true }, err => console.log(err));

      // upsert loss count for loser
      // TODO

      console.log(victor);
    } else if (spaces.indexOf(null) === -1) {
      // upsert tied game count
    }
  });

  // tttReset();
};

const tttReset = () => {
  let { spaces, player, victor } = tictactoeData;

  spaces = Array(9).fill(null);
  player = 1;
  victor = null;
};

const hangman = letter => {
  // hangmanData.words;
  hangmanData.per += 1;
  console.log(letter, letter.length, hangmanData.per);

  if (hangmanData.per >= 3) {
    hangmanData.per = 0;
  }
};
