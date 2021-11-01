let WebSocket = require("ws");
let Config = require("./config.js");
// let READY = require("./classes/READY.js");

// const ws1 = new WebSocket("wss://gateway.discord.gg/?v=6&encoding=json");
const config = new Config();

const OPCodes = {
  HEARTBEAT: 1,
  IDENTIFY: 2,
  PresenceUpdate: 3,
  HELLO: 10,
  HEARTBEAT_ACK: 11,
};

class Fake {
  constructor(url) {
    this.ws = new WebSocket(url);
    this.setup();
    this.sequence = 0;
    this.alive = true;
  }

  setup() {
    // this.ws.on("open", () => this.onOpen());
    this.ws.on("message", (message) => this.onMessage(message));
  }

  onOpen() {
    // this.ws.send(config.getAuth());
    // this.setActivities();
    // this.sendHeartBeat();
  }

  // sendHeartBeat(op, d) {
  //   setInterval(() => {}, 41250);
  // }

  sendWs(op, d) {
    this.ws.send(JSON.stringify({ op, d }));
  }

  setActivities() {
    this.sendWs(OPCodes.PresenceUpdate, {
      since: 91879201,
      activities: [
        {
          name: "FiveM",
          type: 0,
          application_id: "897790000169623552",
          state: "Babalone Buly | 1/48 Players",
          details: "Feeling FiveM Sevrer",
          timestamps: {
            start: 1635445042000
          },
          assets: {
            large_image: "900218720478195752",
            large_text: "Feeling Logo",
            small_image: "900218720478195752",
            small_text: "Feeling Logo",
          },
        },
      ],
      status: "online",
      afk: false,
    });
  }

  onMessage(message) {
    let data = JSON.parse(message);
    if (data.s) this.sequence = data.s;
    switch (data.op) {
      case OPCodes.HELLO:
        setInterval(
          () => this.sendWs(OPCodes.HEARTBEAT, this.sequence),
          data.d.heartbeat_interval
        );
        this.sendWs(OPCodes.IDENTIFY, {
          token: config.token,
          properties: {
            $os: "Windows",
            $browser: "Chrome",
            $device: "",
          },
          compress: false,
        });
        this.setActivities()
    }

    if (!data.t) return;
    switch (data.t) {
      // we should get this after we send identify
      case "READY":
        console.log("ready as", data.d.user.username);
        break;
    }
  }
}

new Fake("wss://gateway.discord.gg/?v=6&encoding=json");

// ws.on("open", function open() {
//   ws.send(config.getAuth());
//   ws.send(
//     JSON.stringify({
//       op: 3,
//       d: {
//         since: 91879201,
//         activities: [
//           {
//             name: "55555",
//             type: 0,
//           },
//         ],
//         status: "online",
//         afk: false,
//       },
//     })
//   );
//   setInterval(() => {
//     ws.send(
//       JSON.stringify({
//         op: 3,
//         d: {
//           since: 91879201,
//           activities: [
//             {
//               name: "55555",
//               type: 0,
//             },
//           ],
//           status: "online",
//           afk: false,
//         },
//       })
//     );
//   }, 10000);
// });

// ws.on("message", function incoming(message) {
//   let data = JSON.parse(message);
//   switch (data.t) {
//     case "MESSAGE_CREATE":
//       console.log(data);
//       break;

//     default:
//       break;
//   }
// });
