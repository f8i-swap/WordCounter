let Discord = require("discord.js");
let client2 = new Discord.Client();
var faunadb = require("faunadb"),
  q = faunadb.query;
let word = "";
let adminid = "YOUR_DISCORD_ID"

var client = new faunadb.Client({
  secret: "YOUR_ADMIN_KEY",
  domain: "db.eu.fauna.com",
  scheme: "https",
});

function getWord() {
  client
    .query(q.Get(q.Match(q.Index("data_from_id"), "SET_WORD")))
    .then((ret) => {
      word = ret.data.word;
    })
    .catch(function (e) {});
}

client2.on("ready", () => {
  client2.user.setActivity(`.cmds`, { type: "PLAYING" });
});

client2.on("message", async (message) => {
  getWord();

  if (message.content.includes(word)) {
    client
      .query(q.Get(q.Match(q.Index("data_from_id"), message.author.id)))
      .then((ret) => {
        client.query(
          q.Update(q.Ref(q.Collection("discord-db"), ret.ref.value.id), {
            data: {
              messages: ret.data.messages + 1,
              username:
                message.author.username + "#" + message.author.discriminator,
            },
          })
        );
      })
      .catch(function (e) {
        client
          .query(
            q.Create(q.Collection("discord-db"), {
              data: {
                id: message.author.id,
                username:
                  message.author.username + "#" + message.author.discriminator,
                messages: 1,
              },
            })
          )
          .then(function (ret) {
            const embed = new Discord.MessageEmbed();
            embed.setColor("RANDOM");
            embed.setTitle("Account Creation");
            embed.setDescription(
              message.author.username +
                "#" +
                message.author.discriminator +
                ", you were not found in our database so an account has been created."
            );
            message.channel.send(embed);
          });
      });
  }

  if (message.content.startsWith(".leaderboard")) {
    var players = [];
    let result = "";
    var pos = 0;
    let users = 0;

    getWord();

    client
      .query(
        q.Map(
          q.Paginate(q.Documents(q.Collection("discord-db"))),
          q.Lambda((x) => q.Get(x))
        )
      )
      .then(function (x) {
        users = x.data.length;
        for (let i = 0; i < x.data.length; i++) {
          if (
            x.data[i].data.username == undefined ||
            x.data[i].data.username == null
          ) {
          } else {
            players.push({
              id: x.data[i].data.id,
              username: x.data[i].data.username,
              messages: x.data[i].data.messages,
            });
          }
        }

        const playersSorted = players.sort(function (a, b) {
          if (Number(a.messages) < Number(b.messages)) return -1;
          if (Number(a.messages) > Number(b.messages)) return 1;
          return 0;
        });

        playersSorted.reverse();

        if (x.data.length > 10) {
          players.slice(0, 10);
        }

        const embed = new Discord.MessageEmbed();
        embed.setColor("RANDOM");
        embed.setTitle("Global `" + word + "` Leaderboard");
        for (let i = 0; i < playersSorted.length; i++) {
          let medal = "";
          let level = "";
          let words = "";
          pos = pos + 1;
          let player = playersSorted[i];
          if (player.messages < 0) {
            level = "💎 ?????";
          }
          if (player.messages < 50 && player.messages > 0) {
            level = "1";
          }
          if (player.messages < 100 && player.messages > 50) {
            level = "2";
          }
          if (player.messages < 150 && player.messages > 100) {
            level = "3";
          }
          if (player.messages < 200 && player.messages > 150) {
            level = "4";
          }
          if (player.messages < 250 && player.messages > 200) {
            level = "💎 5";
          }
          if (player.messages < 300 && player.messages > 250) {
            level = "💎 6";
          }
          if (player.messages < 350 && player.messages > 300) {
            level = "💎 7";
          }
          if (player.messages < 400 && player.messages > 350) {
            level = "💎 8";
          }
          if (player.messages < 450 && player.messages > 400) {
            level = "💎 9";
          }
          if (player.messages < 500 && player.messages > 450) {
            level = "💎 10";
          }
          if (player.messages < 499999 && player.messags > 500)
            {
              level = "💎 11 💎"
            }
          if (player.messages > 500000) {
            level = "😱 Admin 😱";
          }

          if (pos == 1) {
            medal = "🥇";
          }
          if (pos == 2) {
            medal = "🥈";
          }
          if (pos == 3) {
            medal = "🥉";
          }

          result =
            result +
            "__(" +
            medal +
            pos +
            ")__ " +
            player.username +
            ": **" +
            player.messages +
            " " +
            " messages" +
            "** *[Level: " +
            level +
            "]*" +
            "\n";
        }
        embed.setDescription(result);
        embed.setFooter("Total Users: " + (users - 1));
        message.channel.send(embed);
      });
  }

  if (message.content.startsWith(".lookup")) {
    getWord();
    client
      .query(
        q.Get(
          q.Match(q.Index("data_from_id"), message.content.split(".lookup ")[1])
        )
      )
      .then((ret) => {
        const embed = new Discord.MessageEmbed();
        embed.setColor("RANDOM");
        embed.setTitle("Account Lookup");
        embed.setDescription(
          "Username: **" +
            ret.data.username +
            "**\nWord `" +
            word +
            "` Sent: **" +
            ret.data.messages +
            "**"
        );
        message.channel.send(embed);
      })
      .catch(function (e) {
        const embed = new Discord.MessageEmbed();
        embed.setColor("RANDOM");
        embed.setTitle("Account Lookup");
        embed.setDescription("This account was not found in our database.");
        message.channel.send(embed);
      });
  }

  if (message.content.startsWith(".setword")) {
    if (message.author.id != adminid) {
      const embed = new Discord.MessageEmbed();
      embed.setColor("RANDOM");
      embed.setTitle("Set Word");
      embed.setDescription("Only administrators can use this command.");
      message.channel.send(embed);
    } else {
      client
        .query(
          q.Map(
            q.Paginate(q.Documents(q.Collection("discord-db"))),
            q.Lambda((x) => q.Get(x))
          )
        )
        .then(function (x) {});

      client
        .query(q.Get(q.Match(q.Index("data_from_id"), "SET_WORD")))
        .then((ret) => {
          client.query(
            q.Update(q.Ref(q.Collection("discord-db"), ret.ref.value.id), {
              data: {
                word: message.content.split(".setword ")[1],
              },
            })
          );

          const embed = new Discord.MessageEmbed();
          embed.setColor("RANDOM");
          embed.setTitle("Set Word");
          embed.setDescription(
            "Word successfully set to `" +
              message.content.split(".setword ")[1] +
              "`"
          );
          message.channel.send(embed);
        })
        .catch(function (e) {
          client
            .query(
              q.Create(q.Collection("discord-db"), {
                data: {
                  id: "SET_WORD",
                  word: message.content.split(".setword ")[1],
                },
              })
            )
            .then(function (ret) {
              const embed = new Discord.MessageEmbed();
              embed.setColor("RANDOM");
              embed.setTitle("Set Word");
              embed.setDescription(
                "A word file was not found, but one containing the word `" +
                  message.content.split(".setword ")[1] +
                  "` was set up automatically."
              );
              message.channel.send(embed);
            });
        });
    }
  }

  if (message.content.startsWith(".word")) {
    client
      .query(q.Get(q.Match(q.Index("data_from_id"), "SET_WORD")))
      .then((ret) => {
        const embed = new Discord.MessageEmbed();
        embed.setColor("RANDOM");
        embed.setTitle("Current Word");
        embed.setDescription(
          "The current word in use is `" + ret.data.word + "`"
        );
        message.channel.send(embed);
      })
      .catch(function (e) {
        const embed = new Discord.MessageEmbed();
        embed.setColor("RANDOM");
        embed.setTitle("Current Word");
        embed.setDescription(
          "There is no current word in use. If you are an admin, try setting one up with the `.setword` command."
        );
        message.channel.send(embed);
      });
  }

  if (message.content.startsWith(".clearall")) {
    
    if (message.author.id != adminid) {
      const embed = new Discord.MessageEmbed();
      embed.setColor("RANDOM");
      embed.setTitle("Remove All Users");
      embed.setDescription("Only administrators can use this command.");
      message.channel.send(embed);
    } else {
    let users = 0;
    client
      .query(
        q.Map(
          q.Paginate(q.Documents(q.Collection("discord-db"))),
          q.Lambda((x) => q.Get(x))
        )
      )
      .then(function (x) {
        for (let i = 0; i < x.data.length; i++) {
          if (x.data[i].data.id == "SET_WORD") {
          } else {
            users = users + 1;
            client
              .query(
                q.Delete(
                  q.Ref(q.Collection("discord-db"), x.data[i].ref.value.id)
                )
              )
              .then(function (ret) {})
              .catch((err) => console.error("Error: %s", err));
          }
        }

        const embed = new Discord.MessageEmbed();
        embed.setColor("RANDOM");
        embed.setTitle("Remove All Users");
        embed.setDescription(
          "Success! A total of " + users + " user(s) have been removed."
        );
        message.channel.send(embed);
      });
    }
  }
  
  if (message.content.startsWith(".cmds")) {
    
    const embed = new Discord.MessageEmbed();
        embed.setColor("RANDOM");
        embed.setTitle("Command List");
        embed.setDescription("**List of commands for WordCounter**");
        embed.addField("``.setword <word>`` (Admin Only)", "*Sets the word for WordCounter to track.*")
        embed.addField("``.clearall`` (Admin Only)", "*Removes all users from the WordCounter database.*")
        embed.addField("``.leaderboard``", "*Displays the users who have used the current word the most.*")
        embed.addField("``.word``", "*Displays the current word in use.*")
        embed.addField("``.lookup <user id>``", "*Displays the username and word usage amount for the mentioned ID.*")
        message.channel.send(embed);
    
  }
});

client2.login("YOUR_BOT_TOKEN");
