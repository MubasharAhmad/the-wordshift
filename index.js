const express = require("express");
const path = require("path");
const app = express();
const db = require("./db");
const wordsFullList = require("./data/words.js");
const port = 3000;

let shuffledList = wordsFullList.slice();
let shuffledTime = new Date().getTime();

const shuffleArray = () => {
	shuffledList.sort(() => Math.random() - 0.5);
	shuffledTime = new Date().getTime();
};
shuffleArray();

// Set interval to shuffle words every 24 hours (in milliseconds)
const shuffleInterval = 24 * 60 * 60 * 1000;
setInterval(shuffleArray, shuffleInterval);

// Serve static files from the 'public' folder at the root
app.use(express.static("public"));
app.use(express.json());

app.get("/", (req, res) => {
	res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.post("/get-shuffled-time", async (req, res) => {
	try {
		res.json({ shuffledTime });
	} catch (error) {
		console.error("Error get shuffled time:", error);
		res.status(500).json({ error: "Internal server error" });
	}
});

app.post("/add-userattempt", async (req, res) => {
	try {
		const { currentGuess, isCorrect, initials, userId } = req.body;
		if (!userId || userId == null) {
			let sql = `INSERT INTO users (initials) VALUES(?);`;
			db.run(sql, [initials], (err) => {
				if (err) return console.log(err.message);
				sql =
					"SELECT id FROM users WHERE initials=? ORDER BY id DESC LIMIT 1;";
				let userId;
				db.all(sql, [initials], (err, rows) => {
					if (err) return console.log(err.message);
					if (rows.length > 0) {
						userId = rows[0].id;
						sql = `INSERT INTO attempts (guess, isCorrect, user_id) VALUES(?,?,?);`;
						db.run(
							sql,
							[currentGuess, isCorrect, userId],
							(err) => {
								if (err) return console.log(err.message);
								res.json({ userId });
							}
						);
					}
				});
			});
		} else {
			sql = `INSERT INTO attempts (guess, isCorrect, user_id) VALUES(?,?,?);`;
			db.run(sql, [currentGuess, isCorrect, userId], (err) => {
				if (err) return console.log(err.message);
			});
		}
	} catch (error) {
		console.error("Error adding user attempt:", error);
		res.status(500).json({ error: "Internal server error" });
	}
});

app.post("/next-guess", async (req, res) => {
	try {
		const { index } = req.body;
		let word =
			shuffledList[index] ??
			shuffledList[Math.floor(Math.random() * shuffledList.length)];
		res.json({ word });
	} catch (error) {
		console.error("Error getting next guess:", error);
		res.status(500).json({ error: "Internal server error" });
	}
});

app.post("/getleaderboard", async (req, res) => {
	try {
		let sql = `SELECT u.initials, COUNT(*) AS correct_attempt_count
		FROM attempts a
		JOIN users u ON a.user_id = u.id
		WHERE a.isCorrect = 1
		GROUP BY a.user_id, u.initials
		ORDER BY correct_attempt_count DESC;`;
		db.all(sql, [], (err, rows) => {
			if (err) return console.log(err.message);
			res.json({ leaderboard: rows });
		});
	} catch (error) {
		console.error("Error getting leaderboard:", error);
		res.status(500).json({ error: "Internal server error" });
	}
});

// Start the server
app.listen(port, () => {
	console.log(`Server is listening at http://localhost:${port}`);
});
