const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const path = require("path");

const app = express();

app.use(express.json());

const dbPath = path.join(__dirname, "cricketMatchDetails.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running At http://localhost:3000");
    });
  } catch (error) {
    console.log(`ErrorDB:${error.message}`);
  }
};

initializeDBAndServer();

const convertPlayersArrayObject = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};

const convertPlayer = (dbObject) => {
  return {
    playerName: dbObject.player_name,
  };
};

const convertMatchArrayObject = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};

//API 1 Returns a list of all the players in the player table

app.get("/players/", async (Request, Response) => {
  const getPlayersQuery = `
    SELECT * FROM player_details;`;
  const playersArray = await db.all(getPlayersQuery);
  Response.send(playersArray.map((each) => convertPlayersArrayObject(each)));
});

//API 2 Returns a specific player based on the player ID

app.get("/players/:playerId/", async (Request, Response) => {
  const { playerId } = Request.params;
  const getPlayerQuery = `
    SELECT * FROM player_details
    WHERE player_id = '${playerId}';`;
  const getPlayer = await db.get(getPlayerQuery);
  Response.send(convertPlayersArrayObject(getPlayer));
});

//API 3 Updates the details of a specific player based on the player ID

app.put("/players/:playerId/", async (Request, Response) => {
  const { playerId } = Request.params;
  const { playerName } = Request.body;
  const updatePlayerQuery = `
    UPDATE player_details
    SET
        player_name = '${playerName}'
    WHERE 
        player_id = '${playerId}';`;
  const player = await db.get(updatePlayerQuery);
  Response.send("Player Details Updated");
});

//API 4 Returns the match details of a specific match

app.get("/matches/:matchId/", async (Request, Response) => {
  const { matchId } = Request.params;
  const getMatchQuery = `
    SELECT * FROM match_details
    WHERE match_id = ${matchId};`;
  const match = await db.get(getMatchQuery);
  Response.send(convertMatchArrayObject(match));
});

//API 5 Returns a list of all the matches of a player

app.get("/players/:playerId/matches", async (Request, Response) => {
  const { playerId } = Request.params;
  const getPlayerMatchQuery = `
    SELECT * FROM 
        player_match_score
    NATURAL JOIN 
        match_details   
    WHERE 
        player_id = '${playerId}';`;
  const playerMatch = await db.all(getPlayerMatchQuery);
  Response.send(playerMatch.map((each) => convertMatchArrayObject(each)));
});

// API 6 Returns a list of players of a specific match

app.get("/matches/:matchId/players", async (Request, Response) => {
  const { matchId } = Request.params;
  const getMatchPlayerQuery = `
  SELECT * FROM 
      player_match_score
  NATURAL JOIN
      player_details
  WHERE 
      match_id = '${matchId}';`;
  const matchPlayer = await db.all(getMatchPlayerQuery);
  Response.send(matchPlayer.map((each) => convertPlayersArrayObject(each)));
});

//API 7 Returns the statistics of the total score, fours, sixes of a specific player based on the player ID

app.get("/players/:playerId/playerScores", async (Request, Response) => {
  const { playerId } = Request.params;
  const getplayerScoreCardDetaileQuery = `
    SELECT
       player_id AS playerId,
       player_name AS playerName,
       SUM(score) AS totalScore,
       SUM(fours) AS totalFours,
       SUM(sixes) AS totalSixes
    FROM
        player_match_score
    NATURAL JOIN
        player_details
    WHERE 
        player_id = '${playerId}';`;
  const playerScoreDetails = await db.get(getplayerScoreCardDetaileQuery);
  Response.send(playerScoreDetails);
});

module.exports = app;
