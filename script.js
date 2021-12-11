const tableEl = document.getElementsByTagName("table")[0];

const container = document.getElementsByTagName("tbody");
const tableBodyEl = tableEl.getElementsByTagName("tbody")[0]

// n-wide truth table
function makeTable(n) {
	const table = [];
	for (let i = 0; i < n ** 2; i++) {
		const row = [];
		// [i >> 3 & 1, i >> 2 & 1, i >> 1 & 1, i >> 0 & 1])
		for (let j = (n - 1); j >= 0; j--) {
			row.push(i >> j & 1);
		}
		table.push(row);
	}
	return table;
}

// Slam it into the DOM
function writeTable(table) {
	for (let row of table) {
		const rowEl = document.createElement("tr");
		for (let value of row) {
			const valueEl = document.createElement("td");
			valueEl.textContent = value;
			if (value == 1) {
				// valueEl.classList.add("true");
			}
			rowEl.appendChild(valueEl);
		}
		tableBodyEl.appendChild(rowEl);
	}
}

/**
 * Evil regex fn that converts BC'D' notation to
 * JS Notation. Parens get yeeted, whoops.
 * @param {String} exprString
 * @returns {String}
 **/
function parseExpr(exprString) {
	// A' -> 'A
	const a = exprString.replace(/([A-Z])(')?/g, "$2$1")
	// 'A -> !A
	const b = a.replace(/'/g, "!")
	// !A!B!C + AD -> ["!A!B!C", "AD"]
	const terms = b.split(/\s*\+\s*/)
		.map(
			// ["!A!B!C", "AD"] -> ["!A&&!B&&!C", "A&&D"] 
			p => p.match(/!?[A-Z]/g)
			.join("&&")
		)
	// ["!A&&!B&&!C", "A&&D"]  -> "!A&&!B&&!C || A&&D"
	const rejoined = terms.join(" || ")
	return rejoined
}

/**
 * Run the specified exprString on `terms`
 * @param {String} exprString
 * @param {Array<Number>} terms
 */
function runExpr(exprString, terms) {
	const fn = new Function(`
	  const [A, B, C, D, E, F, G, H, I, J, K, L] = arguments
	  return Number(${exprString})
	  `)
	//   console.log(fn.apply(this, terms))
	return fn.apply(this, terms)
}
/**
 * @param  {number[][]} tableData
 */
function addInteractiveCol(tableData) {
	const colHeadEl = document.createElement("td")
	const colHeadInput = document.createElement("input")
	colHeadEl.appendChild(colHeadInput)
	tableEl.querySelector("thead > tr").appendChild(colHeadEl)

	const column = []

	for (const rowEl of tableBodyEl.children) {
		const blankDataEl = document.createElement("td")
		rowEl.appendChild(blankDataEl)
		column.push(blankDataEl)
	}

	colHeadInput.addEventListener("keydown", (e) => {
		if (e.key == "Enter") {
			// Remove the <input> and replace with a simple text label
			colHeadEl.textContent = colHeadInput.value
			colHeadInput.remove()
			addInteractiveCol(values)
		}
	})

	colHeadInput.addEventListener("input", function (e) {
		exprString = parseExpr(this.value.toUpperCase())
		for (const [idx, cellEl] of column.entries()) {
			const result = runExpr(exprString, tableData[idx])
			if (result == 1) {
				cellEl.classList.add("true");
			} else {
				cellEl.classList.remove("true");
			}
			cellEl.textContent = result;
		}
	})
}

function addExprValues(expr) {
	let i = 0;
	for (let node of tableBodyEl.children) {
		const calculatedVal = expr(values[i]);
		const exprEl = document.createElement("td");
		exprEl.textContent = calculatedVal;
		if (calculatedVal == "1") {
			exprEl.classList.add("true");
		}
		node.appendChild(exprEl);
		i++;
	}
}

function addBackRefExprValues(expr) {
	let i = 0;
	for (let node of tableBodyEl.children) {
		const backReferences = [];
		for (let neighbour of node.childNodes) {
			backReferences.push(neighbour.textContent == "1");
		}

		const calculatedVal = expr(values[i], backReferences);
		const exprEl = document.createElement("td");
		exprEl.textContent = calculatedVal;
		if (calculatedVal == "1") {
			exprEl.classList.add("true");
		}
		node.appendChild(exprEl);
		i++;
	}
}


function addCol(text) {
	const headRowEl = document.querySelector("thead>tr");
	const valueEl = document.createElement("td");
	valueEl.textContent = text;
	headRowEl.appendChild(valueEl);
}


const values = makeTable(4);
writeTable(values);

function writeAllTerms() {
	addCol("BC'D'");
	addExprValues((values => {
		const [a, b, c, d] = values;
		return (b && !c && !d) ? "1" : "0";
	}));

	addCol("ABC");
	addExprValues((values => {
		const [a, b, c] = values;
		return (a && b && c) ? "1" : "0";
	}));

	addCol("AC'D");
	addExprValues((values => {
		const [a, b, c, d] = values;
		return (a && !c && d) ? "1" : "0";
	}));

	addCol("AB'D");
	addExprValues((values => {
		const [a, b, c, d] = values;
		return (a && !b && d) ? "1" : "0";
	}));

	addCol("A'BD'");
	addExprValues((values => {
		const [a, b, c, d] = values;
		return (!a && b && !d) ? "1" : "0";
	}));

	addCol("Q");
	addBackRefExprValues((values, backs) => {
		const [a, b, c, d] = values;
		// console.log("backs:");
		// console.log(backs);
		return (backs[4] || backs[5] || backs[6] || backs[7] || backs[8]) ?
			"1" : "0";
	});
}

// writeAllTerms();
addInteractiveCol(values);