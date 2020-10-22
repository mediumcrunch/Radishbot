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
const ticTacToeData = {
  spaces: Array(9).fill(null),
  lastPlayer: null,
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
    console.log(ticTacToeData.lastPlayer);
    const { spaces, lastPlayer, player, playerOne, playerTwo } = ticTacToeData;
    const tile = parseInt(args[0] - 1);
    const tiles = [":one:", ":two:", ":three:", ":four:", ":five:", ":six:", ":seven:", ":eight:", ":nine:"];
    let board = "";
    let msg;

    // check for reset command
    if (tile === "reset") {
      tttReset();

      board = "";
      msg = `Board reset. Please specify a tile 1-9.`;
    } else {
      // check for valid tile
      if (spaces[tile] === null) {
        // check if current player is the same as the previous player
        if (lastPlayer !== commandAuthor.id) {
          spaces[tile] = player; // claim tile using current player
          ticTacToeData.player = player === 1 ? 2 : 1; // update current player
          ticTacToeData.lastPlayer = commandAuthor.id; // update previous player
          console.log("commandAuthor", commandAuthor.id);
          console.log("lastPlayer", lastPlayer);

          let nextPlayer = player === 1 ? playerTwo : playerOne;

          msg = `It is currently ${nextPlayer}'s turn.`;
        } else {
          msg = `You've already taken your turn.`;
        }
      } else {
        msg = `Please specify an unclaimed tile 1-9.`;
      }
    }

    spaces.forEach((space, i) => {
      if (space === null) {
        board += tiles[i];
      } else {
        board += space === 1 ? playerOne : playerTwo;
      }

      if ((i + 1) % 3 === 0) {
        board += `\n`;
      } else {
        board += ` `;
      }
    });

    // check for victory
    tttVictoryCheck(commandAuthor);

    if (ticTacToeData.victor === null) {
      message.channel.send(board);
      message.channel.send(msg);
    } else {
      let victor = player === 1 ? playerOne : playerTwo;
      message.channel.send(board);
      message.channel.send(`Player ${victor} wins!`);
      message.channel.send(`Board reset. Please specify a tile 1-9.`);
      tttReset();
    }
  }
});

client.login(token);

const tttVictoryCheck = commandAuthor => {
  const { spaces, player } = ticTacToeData;

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
      ticTacToeData.victor = player;

      // upsert victory count for winner
      // TODO
      // db.update({ user: commandAuthor.id }, { $inc: { tttWins: 1 } }, { upsert: true }, err => console.log(err));

      // upsert loss count for loser
      // TODO
    } else if (spaces.indexOf(null) === -1) {
      // upsert tied game count
      // TODO
    }
  });
};

const tttReset = () => {
  ticTacToeData.spaces = Array(9).fill(null);
  ticTacToeData.lastPlayer = null;
  ticTacToeData.player = 1;
  ticTacToeData.victor = null;
};

const hangman = letter => {
  // hangmanData.words;
  hangmanData.per += 1;
  console.log(letter, letter.length, hangmanData.per);

  if (hangmanData.per >= 3) {
    hangmanData.per = 0;
  }
};
