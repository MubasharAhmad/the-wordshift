const sqlite = require("sqlite3").verbose();

const db = new sqlite.Database(
	"./data/database.sqlite",
	sqlite.OPEN_READWRITE,
	(err) => {
		if (err) return console.log(err.message);
	}
);

module.exports = db;
