import { fullList } from "./words.js";

// html elements
const triesContainer = document.getElementById("tries-container");
const keyboardContaier = document.getElementById("keyboard-container");
const resultElement = document.getElementById("result");
const resultTitle = document.getElementById("result-title");
const guessNextBtn = document.getElementById("guess-next-btn");
const correctWordSpan = document.getElementById("correct-word");
const leaderboardElement = document.getElementById("leaderboard");
const leaderboardCloseBtn = document.getElementById("leaderboard-close-btn");
const leaderboardOpenBtn = document.getElementById("leaderboard-open-btn");
const leaderboardTableBody = document.getElementById("leaderboard-table-body");
const status = document.getElementById("status");
const giveUpBtn = document.getElementById("giveup-btn");
const startScreen = document.getElementById("start-screen");
const initialsInput = document.getElementById("initials");
const initialsError = document.getElementById("initials-error");
const startBtn = document.getElementById("start-btn");
const currentScoreSpan = document.getElementById("current-score");
const comeBackScreen = document.getElementById("comeback-screen");

let isAlreadyPlayed = false;

const checkIsAlreadyPlayed = async () => {
	const result = await fetch("/get-shuffled-time", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
	});
	const jsonResult = await result.json();
	const userData = localStorage.getItem("userData");
	if (userData) {
		const userJsonData = JSON.parse(userData);
		if (
			userJsonData.isPlayed &&
			userJsonData.shuffledTime == jsonResult.shuffledTime
		) {
			isAlreadyPlayed = true;
			comeBackScreen.classList.toggle("flex");
			comeBackScreen.classList.toggle("hidden");
		} else {
			localStorage.setItem(
				"userData",
				JSON.stringify({
					isPlayed: false,
					shuffledTime: jsonResult.shuffledTime,
				})
			);
		}
	} else {
		localStorage.setItem(
			"userData",
			JSON.stringify({
				isPlayed: false,
				shuffledTime: jsonResult.shuffledTime,
			})
		);
	}
};

await checkIsAlreadyPlayed();

if (!isAlreadyPlayed) {
	// constants
	const NUMBER_OF_ATTEMPTS = 6;
	const WORD_LENGTH = 5;

	// variables
	let remainingAttempts = NUMBER_OF_ATTEMPTS;
	let currentUserWord = "";
	let currentGuess = "WORLD";
	let currentGuessIndex = 0;
	let isStarted = false;
	let isWin = false;
	let gameOver = false;
	let userInitials = "";
	let userId = null;
	let score = 0;

	// lists
	let triesBlocks = [];
	let keyboard = [
		["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
		["A", "S", "D", "F", "G", "H", "J", "K", "L"],
		["Backspace", "Z", "X", "C", "V", "B", "N", "M", "Enter"],
	];
	let keyboardKeys = [];

	startBtn.addEventListener("click", () => {
		const initials = initialsInput.value;
		if (initials === "") {
			initialsError.innerText = "Initials can not be empty.";
			return;
		}
		initialsError.innerText = "";
		userInitials = initials.toUpperCase();
		startScreen.classList.toggle("hidden");
		startScreen.classList.toggle("flex");
		startScreen.classList.toggle("fixed");
		isStarted = true;
	});

	giveUpBtn.addEventListener("click", async () => {
		resultElement.classList.toggle("hidden");
		resultElement.classList.toggle("fixed");
		resultElement.classList.toggle("flex");
		resultTitle.innerText = "";
		correctWordSpan.innerText = currentGuess.toUpperCase();
		await getNextGuess();
	});

	leaderboardOpenBtn.addEventListener("click", async () => {
		leaderboardTableBody.innerHTML = null;
		let userData = [];
		const result = await fetch("/getleaderboard", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
		});
		userData = (await result.json()).leaderboard;
		if (userData) {
			for (let i = 0; i < userData.length; i++) {
				const element = userData[i];
				let row = document.createElement("tr");
				row.classList.add(
					"bg-violet-100",
					"border-b",
					"text-violet-800",
					"font-medium"
				);
				let td1 = document.createElement("td");
				td1.classList.add("px-6", "py-4");
				td1.innerText = i + 1;
				row.appendChild(td1);
				let td2 = document.createElement("td");
				td2.classList.add("px-6", "py-4");
				td2.innerText = element.initials;
				row.appendChild(td2);
				let td3 = document.createElement("td");
				td3.classList.add("px-6", "py-4");
				td3.innerText = element.correct_attempt_count;
				row.appendChild(td3);
				leaderboardTableBody.appendChild(row);
			}
		}
		leaderboardElement.classList.toggle("hidden");
		leaderboardElement.classList.toggle("fixed");
		leaderboardElement.classList.toggle("flex");
	});

	leaderboardCloseBtn.addEventListener("click", () => {
		leaderboardElement.classList.toggle("hidden");
		leaderboardElement.classList.toggle("fixed");
		leaderboardElement.classList.toggle("flex");
	});

	guessNextBtn.addEventListener("click", () => {
		if (gameOver) {
			window.location.reload();
		} else {
			resultElement.classList.toggle("hidden");
			resultElement.classList.toggle("fixed");
			resultElement.classList.toggle("flex");
			resetGame();
		}
	});

	// reset game
	const resetGame = async () => {
		if (!isWin) return;
		if (isWin) {
			await getNextGuess();
			currentUserWord = "";
			score += 1;
			currentScoreSpan.innerText = score;
		}
		for (let i = 0; i < triesBlocks.length; i++) {
			if (i + 1 < triesBlocks.length) {
				for (let j = 0; j < triesBlocks[i].length; j++) {
					if (remainingAttempts < 4) {
						triesBlocks[i][j].innerHTML =
							triesBlocks[i + 1][j].innerHTML;
					}
					let c = remainingAttempts > 3 ? i : i + 1;
					if (triesBlocks[c][j].innerHTML) {
						let color = "gray";
						if (currentGuess[j] === triesBlocks[i][j].innerText) {
							color = "green";
						} else if (
							currentGuess.includes(triesBlocks[i][j].innerText)
						) {
							color = "yellow";
						}
						triesBlocks[i][j].classList = [];
						triesBlocks[i][j].classList.add(
							"h-14",
							`bg-${color}-400`,
							"rounded-md",
							"border-2",
							`border-${color}-600`,
							"text-white",
							"flex",
							"justify-center",
							"items-center",
							"text-3xl",
							"font-semibold",
							"transition-all",
							"duration-500"
						);
					} else {
						triesBlocks[i][j].classList =
							triesBlocks[i + 1][j].classList;
					}
				}
			} else {
				for (let j = 0; j < triesBlocks[i].length; j++) {
					triesBlocks[i][j].classList = [];
					triesBlocks[i][j].classList.add(
						"h-14",
						"bg-violet-100",
						"rounded-md",
						"border-2",
						"border-violet-300",
						"flex",
						"justify-center",
						"items-center",
						"text-3xl",
						"font-semibold",
						"transition-all",
						"duration-500"
					);
					triesBlocks[i][j].innerHTML = null;
				}
			}
		}
		if (remainingAttempts < 4) {
			remainingAttempts += 1;
		}
		isWin = false;
		addKeyboard();
	};

	// get random word
	const getNextGuess = async () => {
		const result = await fetch("/next-guess", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ index: currentGuessIndex }),
		});
		const jsonResult = await result.json();
		currentGuess = jsonResult.word;
		// console.log("currentGuess: ", currentGuess);
		currentGuessIndex += 1;
	};

	// function to add tries blocks
	const addTriesBlocks = () => {
		triesContainer.innerHTML = null;
		for (let i = 0; i < NUMBER_OF_ATTEMPTS; i++) {
			let triesRow = document.createElement("div");
			triesRow.classList.add("grid", "grid-cols-5", "w-full", "gap-1");
			let triesRowBlocks = [];
			for (let i = 0; i < WORD_LENGTH; i++) {
				let triesBlock = document.createElement("div");
				triesBlock.classList.add(
					"h-14",
					"bg-violet-100",
					"rounded-md",
					"border-2",
					"border-violet-300",
					"flex",
					"justify-center",
					"items-center",
					"text-3xl",
					"font-semibold",
					"transition-all",
					"duration-500"
				);
				triesRow.appendChild(triesBlock);
				triesRowBlocks.push(triesBlock);
			}
			triesContainer.appendChild(triesRow);
			triesBlocks.push(triesRowBlocks);
		}
	};

	// function to add keyboard
	const addKeyboard = () => {
		keyboardKeys = [];
		keyboardContaier.innerHTML = null;
		keyboard.forEach((row) => {
			let keyboardRow = document.createElement("div");
			keyboardRow.classList.add(
				"grid",
				`grid-cols-${
					row[0].toUpperCase() === "Q"
						? "10"
						: row[0].toUpperCase() === "A"
						? "9"
						: "11"
				}`,
				"w-full",
				"text-center",
				"gap-1"
			);
			row.forEach((key) => {
				let keyboardKey = document.createElement("div");
				keyboardKey.classList.add(
					"rounded-md",
					"cursor-pointer",
					"select-none",
					"py-1",
					"md:py-3",
					"bg-violet-100",
					"transition-all",
					"duration-300"
				);
				if (
					key.toUpperCase() === "BACKSPACE" ||
					key.toUpperCase() === "ENTER"
				) {
					keyboardKey.classList.add("col-span-2", "group");
				}
				if (key.toUpperCase() === "BACKSPACE") {
					keyboardKey.innerHTML =
						'<img src="/assets/images/backspace-dark.png" alt="backspace" class="h-6 md:h-8 mx-auto">';
				} else {
					keyboardKey.innerHTML = key;
				}
				keyboardKey.addEventListener("click", () => {
					keyboardClicked(key);
				});
				keyboardRow.appendChild(keyboardKey);
				keyboardKeys.push(keyboardKey);
			});
			keyboardContaier.appendChild(keyboardRow);
		});
	};

	// keyboard valid key clicked
	const keyboardClicked = async (key) => {
		if (!isStarted) return;
		if (remainingAttempts === 0) return;
		if (
			key.toUpperCase() === "ENTER" &&
			currentUserWord.length === WORD_LENGTH
		) {
			if (!fullList.includes(currentUserWord)) {
				status.innerText = "word not in the list";
				return;
			} else {
				status.innerText = "";
			}
			for (let i = 0; i < currentUserWord.length; i++) {
				let color = "gray";
				if (currentGuess[i] === currentUserWord[i]) {
					color = "green";
				} else if (currentGuess.includes(currentUserWord[i])) {
					color = "yellow";
				}
				triesBlocks[NUMBER_OF_ATTEMPTS - remainingAttempts][
					i
				].classList.remove("bg-violet-100", "border-violet-300");
				triesBlocks[NUMBER_OF_ATTEMPTS - remainingAttempts][
					i
				].classList.add(
					`bg-${color}-400`,
					`border-${color}-600`,
					"text-white"
				);
				// keyboard buttons
				keyboardKeys.forEach((element) => {
					if (element.innerText === currentUserWord[i]) {
						element.classList.remove("bg-violet-100");
						element.classList.add(`bg-${color}-400`, "text-white");
					}
				});
			}
			remainingAttempts -= 1;
			if (currentUserWord === currentGuess) {
				setTimeout(() => {
					isWin = true;
					resetGame();
				}, 700);
				const result = await fetch("/add-userattempt", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						currentGuess,
						isCorrect: true,
						initials: userInitials,
						userId,
					}),
				});
				const jsonResult = await result.json();
				if (jsonResult.userId) {
					userId = jsonResult.userId;
				}
			} else if (remainingAttempts === 0) {
				setTimeout(() => {
					resultElement.classList.toggle("hidden");
					resultElement.classList.toggle("fixed");
					resultElement.classList.toggle("flex");
					resultTitle.innerText = "You Loss!!";
					guessNextBtn.innerText = "Start Again!";
					gameOver = true;
					correctWordSpan.innerText = currentGuess.toUpperCase();
					const userData = localStorage.getItem("userData");
					const userJsonData = JSON.parse(userData);
					userJsonData.isPlayed = true;
					localStorage.setItem(
						"userData",
						JSON.stringify(userJsonData)
					);
				}, 500);
				const result = await fetch("/add-userattempt", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						currentGuess,
						isCorrect: false,
						initials: userInitials,
						userId,
					}),
				});
				const jsonResult = await result.json();
				if (jsonResult.userId) {
					userId = jsonResult.userId;
				}
			}
			currentUserWord = "";
		}
		if (key.toUpperCase() === "BACKSPACE" && currentUserWord.length !== 0) {
			triesBlocks[NUMBER_OF_ATTEMPTS - remainingAttempts][
				currentUserWord.length - 1
			].innerHTML = null;
			currentUserWord = currentUserWord.slice(0, -1);
		}
		if (currentUserWord.length === WORD_LENGTH) return;
		if (
			key.toUpperCase() !== "BACKSPACE" &&
			key.toUpperCase() !== "ENTER"
		) {
			currentUserWord += key;
			triesBlocks[NUMBER_OF_ATTEMPTS - remainingAttempts][
				currentUserWord.length - 1
			].innerHTML = key;
		}
	};

	// add keyboard event listner
	const addKeyboardEventListner = () => {
		document.addEventListener("keyup", (event) => {
			let pressedKey = event.key;
			if (!pressedKey) return;
			pressedKey =
				pressedKey === "Backspace"
					? pressedKey
					: pressedKey === "Enter"
					? pressedKey
					: pressedKey.toUpperCase();
			if (isKeyInKeyboard(pressedKey)) {
				keyboardClicked(pressedKey);
			}
		});
	};

	// Function to check if a key is in the keyboard array
	function isKeyInKeyboard(key) {
		return keyboard.flat().includes(key);
	}

	addTriesBlocks();
	addKeyboard();
	addKeyboardEventListner();
	await getNextGuess();
}
