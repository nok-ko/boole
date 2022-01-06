const tableEl = document.getElementsByTagName("table")[0];

const container = document.getElementsByTagName("tbody");
const tableBodyEl = tableEl.getElementsByTagName("tbody")[0]


class TruthTable {
	/**
	 * @param  {Number} width
	 * @param  {HTMLTableElement} tableEl
	 */
	constructor(width, tableEl) {
		this.width = width
		this.data = this.createBaseValues(width)
		this.rootEl = tableEl
		/** @param {HTMLTableSectionElement} */
		this.bodyEl = tableEl.getElementsByTagName("tbody")[0]
		this.refresh()

		/** @type {Column[]} */
		this.additionalCols = []
	}

	/**
	 * Creates an n-wide truth table: an array of the numbers [0, 2^n), 
	 * where each element is itself an array of the number's digits.
	 * For example, `createBaseValues(3)` results in: `[ [0,0,0], [0,0,1], [0,1,0], …, [1,1,1] ]`
	 * @param   {Number} n - how many variables should be in each row
	 * @returns {Number[][]}
	 */
	createBaseValues(n) {
		const table = []
		for (let i = 0; i < (2 ** n); i++) {
			const row = []
			// [i >> 3 & 1, i >> 2 & 1, i >> 1 & 1, i >> 0 & 1])
			for (let j = (n - 1); j >= 0; j--) {
				row.push(i >> j & 1)
			}
			table.push(row)
		}
		return table
	}

	/**
	 * Updates the DOM representation of this `TruthTable` to match the internal `data`.
	 * @param  {Number[][]} data
	 * @param  {HTMLElement} baseEl
	 */
	refresh() {
		// Clear out the element before writing
		this.bodyEl.textContent = ""

		const frag = document.createDocumentFragment()
		for (const row of this.data) {
			const rowEl = document.createElement("tr");
			for (const [idx, value] of row.entries()) {
				const valueEl = document.createElement("td");
				valueEl.textContent = value;
				if (value == 1 && idx >= this.width) {
					valueEl.classList.add("true");
				}
				rowEl.appendChild(valueEl);
			}
			frag.appendChild(rowEl)
		}
		this.bodyEl.appendChild(frag);
	}


	/**
	 * Evil regex fn that converts BC'D' notation to
	 * JS Notation. Parens get yeeted, whoops.
	 * @param {String} exprString
	 * @returns {String}
	 */
	static parseExpr(exprString) {
		// A' -> 'A
		const a = exprString.replace(/([A-Z])(')?/g, "$2$1")
		// 'A -> !A
		const b = a.replace(/'/g, "!")
		// !A!B!C + AD -> ["!A!B!C", "AD"]
		try {
			const terms = b.split(/\s*\+\s*/)
				.map(
					// ["!A!B!C", "AD"] -> ["!A&&!B&&!C", "A&&D"] 
					p => p.match(/!?[A-Z]/g)
						.join("&&")
				)
			// ["!A&&!B&&!C", "A&&D"]  -> "!A&&!B&&!C || A&&D"
			const rejoined = terms.join(" || ")
			return rejoined
		} catch (exception) {
			if (exception.name == "TypeError") {
				// If the match() doesn't find anything, JS will throw a
				// TypeError. Not catastrophic, just means the expr string
				// couldn't be parsed. 
				// console.debug("Incomplete expr string?")
			}
			// Fail silently, we'll get 'em next time.
			return ""
		}

	}

	/**
	 * Run the specified exprString on `terms`
	 * @param {String} exprString
	 * @param {Array<Number>} terms
	 */
	static runExpr(exprString, terms) {
		const fn = new Function(`
		const [A, B, C, D, E, F, G, H, I, J, K, L] = arguments
		return Number(${exprString})`)
		//   console.log(fn.apply(this, terms))
		return fn.apply(this, terms)
	}

	/**
	 * Add a column to internal state of this `TruthTable`, fill it with
	 * the result of running `expr` on each row, and refresh the visual
	 * representation of the table.
	 * @param  {Function} expr
	 */
	addExprValues(expr) {
		for (let row of this.data) {
			const calculatedVal = expr(row);
			row.push(calculatedVal);
		}
		this.refresh()
	}

	/** 
	 * Add the heading part of a column to the this `TruthTable`'s 
	 * `<thead>` element.
	 * @param {String} text - the text to put in the column's heading
	 */
	addCol(text) {
		const headRowEl = this.rootEl.querySelector("thead>tr");
		const valueEl = document.createElement("td");
		valueEl.textContent = text;
		headRowEl.appendChild(valueEl);
	}
}

class Column {
	constructor(heading, rootEl, values) {
		this.heading = heading
		this.values = values
		this.rootEl = rootEl
	}
}

/**
 * @param  {number[][]} tableData
 */
function addInteractiveCol(tableData) {
	const colHeadEl = document.createElement("td")
	const colHeadInput = document.createElement("input")
	colHeadEl.appendChild(colHeadInput)
	tableEl.querySelector("thead > tr").appendChild(colHeadEl)

	const colIdx = tableData[0].length
	for (const row of tableData) {
		row.push(0)
	}
	// refresh after update
	writeTable(tableData, tableBodyEl, true)

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
		for (const row of tableData) {
			const result = runExpr(exprString, row)
			row[colIdx] = result
		}
		// refresh after update

		// for (const [idx, cellEl] of column.entries()) {
		// 	const result = runExpr(exprString, tableData[idx])
		// 	if (result == 1) {
		// 		cellEl.classList.add("true");
		// 	} else {
		// 		cellEl.classList.remove("true");
		// 	}
		// 	cellEl.textContent = result;
		// }
	})
}


function addBackRefExprValues(expr) {
	let i = 0;
	for (let rowEl of tableBodyEl.children) {
		const backReferences = [];
		for (let neighbour of rowEl.childNodes) {
			backReferences.push(neighbour.textContent == "1");
		}

		const calculatedVal = expr(values[i], backReferences);
		const exprEl = document.createElement("td");
		exprEl.textContent = calculatedVal;
		if (calculatedVal == "1") {
			exprEl.classList.add("true");
		}
		rowEl.appendChild(exprEl);
		i++;
	}
}



// // const values = makeTable(4);
// writeTable(values, tableBodyEl);

function writeAllTerms(truthTable) {
	truthTable.addCol("BC'D'");
	truthTable.addExprValues((values => {
		const [a, b, c, d] = values;
		return (b && !c && !d) ? "1" : "0";
	}));

	truthTable.addCol("ABC");
	truthTable.addExprValues((values => {
		const [a, b, c] = values;
		return (a && b && c) ? "1" : "0";
	}));

	truthTable.addCol("AC'D");
	truthTable.addExprValues((values => {
		const [a, b, c, d] = values;
		return (a && !c && d) ? "1" : "0";
	}));

	truthTable.addCol("AB'D");
	truthTable.addExprValues((values => {
		const [a, b, c, d] = values;
		return (a && !b && d) ? "1" : "0";
	}));

	truthTable.addCol("A'BD'");
	truthTable.addExprValues((values => {
		const [a, b, c, d] = values;
		return (!a && b && !d) ? "1" : "0";
	}));

	// addCol("Q");
	// addBackRefExprValues((values, backs) => {
	// 	const [a, b, c, d] = values;
	// 	// console.log("backs:");
	// 	// console.log(backs);
	// 	return (backs[4] || backs[5] || backs[6] || backs[7] || backs[8]) ?
	// 		"1" : "0";
	// });
}

const truthTable = new TruthTable(4, tableEl)
writeAllTerms(truthTable);
// addInteractiveCol(values);
/**
 * Add a Karnaugh map element to the page.
 * @param  {} data
 */
function addKMap(data) {

}