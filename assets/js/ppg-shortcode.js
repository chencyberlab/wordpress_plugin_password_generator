(function () {
	"use strict";

	const CHARSETS = {
		upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
		lower: "abcdefghijklmnopqrstuvwxyz",
		number: "0123456789",
		symbol: "!@#$%^&*()_+-={}[]|:;<>,.?/~`",
	};

	const AMBIGUOUS = new Set(["0", "O", "o", "1", "l", "I"]);

	function secureIndex(maxExclusive) {
		if (maxExclusive <= 0) {
			return 0;
		}

		if (window.crypto && window.crypto.getRandomValues) {
			const bucketLimit = Math.floor(4294967296 / maxExclusive) * maxExclusive;
			const randomBuffer = new Uint32Array(1);
			let randomValue = 0;

			do {
				window.crypto.getRandomValues(randomBuffer);
				randomValue = randomBuffer[0];
			} while (randomValue >= bucketLimit);

			return randomValue % maxExclusive;
		}

		return Math.floor(Math.random() * maxExclusive);
	}

	function pickChar(charset) {
		return charset.charAt(secureIndex(charset.length));
	}

	function shuffle(chars) {
		for (let i = chars.length - 1; i > 0; i -= 1) {
			const j = secureIndex(i + 1);
			[chars[i], chars[j]] = [chars[j], chars[i]];
		}
	}

	function classifyChar(char) {
		if (/[0-9]/.test(char)) {
			return "number";
		}

		if (/[A-Z]/.test(char)) {
			return "upper";
		}

		if (/[a-z]/.test(char)) {
			return "lower";
		}

		return "symbol";
	}

	function renderPassword(outputNode, password) {
		outputNode.textContent = "";

		for (const char of password) {
			const span = document.createElement("span");
			const charType = classifyChar(char);
			span.className = `ppg-char ppg-char--${charType}`;
			if (AMBIGUOUS.has(char)) {
				span.classList.add("ppg-char--ambiguous");
			}
			span.textContent = char;
			outputNode.appendChild(span);
		}
	}

	function generatePassword(length, selectedTypes) {
		const pools = selectedTypes.map((type) => CHARSETS[type]).filter(Boolean);
		if (!pools.length) {
			return "";
		}

		const passwordChars = pools.map((pool) => pickChar(pool));
		const fullPool = pools.join("");

		while (passwordChars.length < length) {
			passwordChars.push(pickChar(fullPool));
		}

		shuffle(passwordChars);
		return passwordChars.join("");
	}

	function initGenerator(widget) {
		const rangeInput = widget.querySelector("[data-ppg-range]");
		const lengthValue = widget.querySelector("[data-ppg-length]");
		const generateButton = widget.querySelector("[data-ppg-generate]");
		const copyButton = widget.querySelector("[data-ppg-copy]");
		const output = widget.querySelector("[data-ppg-output]");
		const message = widget.querySelector("[data-ppg-message]");
		const min = Number(widget.getAttribute("data-min")) || 4;
		const max = Number(widget.getAttribute("data-max")) || 128;
		if (!rangeInput || !lengthValue || !generateButton || !copyButton || !output || !message) {
			return;
		}

		rangeInput.min = String(min);
		rangeInput.max = String(max);

		function getSelectedTypes() {
			return Array.from(widget.querySelectorAll("[data-ppg-type]:checked"))
				.map((node) => node.getAttribute("data-ppg-type"))
				.filter(Boolean);
		}

		function updateLengthLabel() {
			lengthValue.textContent = rangeInput.value;
		}

		function setMessage(text, type) {
			message.className = "ppg-message";
			if (type) {
				message.classList.add(`ppg-message--${type}`);
			}
			message.textContent = text;
		}

		function runGeneration() {
			updateLengthLabel();
			const length = Math.max(min, Math.min(max, Number(rangeInput.value) || min));
			const selectedTypes = getSelectedTypes();

			if (!selectedTypes.length) {
				setMessage("Select at least one character type.", "error");
				output.textContent = "";
				return;
			}

			setMessage("", "");
			const password = generatePassword(length, selectedTypes);
			renderPassword(output, password);
		}

		async function copyPassword() {
			const password = output.textContent || "";
			if (!password) {
				setMessage("Generate a password first.", "error");
				return;
			}

			try {
				if (navigator.clipboard && window.isSecureContext) {
					await navigator.clipboard.writeText(password);
				} else {
					const fallbackInput = document.createElement("textarea");
					fallbackInput.value = password;
					fallbackInput.setAttribute("readonly", "");
					fallbackInput.style.position = "fixed";
					fallbackInput.style.opacity = "0";
					document.body.appendChild(fallbackInput);
					fallbackInput.select();
					document.execCommand("copy");
					document.body.removeChild(fallbackInput);
				}
				setMessage("Password copied.", "success");
			} catch (err) {
				setMessage("Copy failed. Please copy manually.", "error");
			}
		}

		rangeInput.addEventListener("input", updateLengthLabel);
		generateButton.addEventListener("click", runGeneration);
		copyButton.addEventListener("click", copyPassword);

		runGeneration();
	}

	document.querySelectorAll("[data-ppg]").forEach(initGenerator);
})();
