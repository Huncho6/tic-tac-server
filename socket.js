module.exports = (io) => {
    let arr = [];
    let playingArray = [];
  
    io.on("connection", (socket) => {
      console.log(`User connected: ${socket.id}`);
  
      socket.on("set-username", (username) => {
        arr.push(username);
  
        if (arr.length >= 2) {
          let p1obj = {
            p1name: arr[0],
            p1value: "X",
            p1move: "",
          };
          let p2obj = {
            p2name: arr[1],
            p2value: "O",
            p2move: "",
          };
  
          let obj = {
            p1: p1obj,
            p2: p2obj,
            sum: 1,
          };
          playingArray.push(obj);
  
          arr.splice(0, 2);
  
          io.emit("start-game", { allPlayers: playingArray });
        }
      });
  
      socket.on("make-move", ({ roomId, index, playerRole }) => {
        let objToChange;
        if (playerRole === "X") {
          objToChange = playingArray.find((obj) => obj.p1.p1name === roomId);
          objToChange.p1.p1move = index;
        } else if (playerRole === "O") {
          objToChange = playingArray.find((obj) => obj.p2.p2name === roomId);
          objToChange.p2.p2move = index;
        }
        objToChange.sum++;
  
        io.emit("update-game", { allPlayers: playingArray });
      });
  
      socket.on("gameOver", (e) => {
        playingArray = playingArray.filter((obj) => obj.p1.p1name !== e.name);
        console.log(playingArray);
      });
  
      socket.on("disconnect", () => {
        console.log(`User disconnected: ${socket.id}`);
      });
    });
  };