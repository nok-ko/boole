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
	// !A!B!C + AD -> ["!A!B!C"]
	const terms = b.split(/\s*\+\s*/)
		.map(
			p => p.match(/!?[A-Z]/g)
			.join("&&")
		)
	const rejoined = terms.join(" || ")
	console.log(rejoined)
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



// First Simplification [[
// addCol("AC'D + AB'D");
// addBackRefExprValues((values, backs) => {
// 	const [A, B, C, D] = values;
// 	return (
// 		(A && !C && D) || (A && !B && D)
// 	) ? "1" : "0";
// });

// addCol("(AD) * (BC)'");
// addBackRefExprValues((values, backs) => {
// 	const [A, B, C, D] = values;
// 	return (
// 		(A && D) && !(B && C)
// 	) ? "1" : "0";
// });
// First Simplification ]]


// Second Simplification [[

// addCol("D'BC' + D'A'B");
// addExprValues((values) => {
// 	const [A, B, C, D] = values;
// 	return (
// 		(B && !C && !D) || (!A && B && !D)
// 	) ? "1" : "0";
// });

// addCol("D'(BC') + D'(A'B)");
// addExprValues((values) => {
// 	const [A, B, C, D] = values;
// 	return (
// 		(!D && B && !C) || (!D && !A && B)
// 	) ? "1" : "0";
// });

// addCol("D'(BC' + A'B)");
// addExprValues((values) => {
// 	const [A, B, C, D] = values;
// 	return (
// 		!D && ( B && !C || !A && B)
// 	) ? "1" : "0";
// });

// addCol("D'(B(C' + A)");
// addExprValues((values) => {
// 	const [A, B, C, D] = values;
// 	return (
// 		!D && ( B && ( !C || !A )  )
// 	) ? "1" : "0";
// });

// Second Simplification ]]


// addCol("Q?");
// addExprValues((values) => {
// 	const [A, B, C, D] = values;
// 	return (
// 		!D && B && (!C || !A) || (A && B && C) || ((A && D) && !(B && C))
// 	) ? "1" : "0";
// });

// addCol("Q? 2");
// addExprValues((values) => {
// 	const [A, B, C, D] = values;
// 	return (
// 		!D && B && (!C || !A) || (A && B && C) || A && D
// 	) ? "1" : "0";
// });

// addCol("BC'D' + A'BD' + ABC + AD");
// addExprValues(values => {
// 	const [A, B, C, D] = values;
// 	return (
// 		B && !C && !D || !A && B && !D || A && B && C || A && D
// 	) ? "1" : "0";
// });

// addCol("BC'D' + A'BD' + ABC + AD");
// addExprValues(values => {
// 	const [A, B, C, D] = values;
// 	return (
// 		B && !C && !D || !A && B && !D || A && B && C || A && D
// 	) ? "1" : "0";
// });

// distributive pty.

// addCol("BD'(C' + A') + ABC + AD");
// addExprValues(values => {
// 	const [A, B, C, D] = values;
// 	return (
// 		B && !D && (!C || !A) || A&& B && C  || A && D) 
// 		? "1" : "0";
// });

// addCol("BD'(C' + A') + A(BC + D)");
// addExprValues(values => {
// 	const [A, B, C, D] = values;
// 	return (
// 		B && !D && (!C || !A) || A && (B && C  || D) )
// 		? "1" : "0";
// });

// =Q

// addCol("BD'C' + A'BD' + ABC + AD");
// addExprValues(values => {
// 	const [A, B, C, D] = values;
// 	return (
// 		B && !D && !C || !A && B && !D || A && B && C  || A && D )
// 		? "1" : "0";
// });

// addCol("BD'C' + B(A'D' + AC) + AD");
// addExprValues(values => {
// 	const [A, B, C, D] = values;
// 	return (
// 		B && !D && !C || B && (!A && !D || A && C)  || A && D )
// 		? "1" : "0";
// });

// still =Q

// addCol("B(C'D' + A'D' + AC) + AD");
// addExprValues(values => {
// 	const [A, B, C, D] = values;
// 	return (
// 		B && ( !C && !D || !A && !D || A && C ) || A && D )
// 		? "1" : "0";
// });

// addCol("BC'D' + A'BD' + ABC + AD");
// addExprValues(values => {
// 	const [A, B, C, D] = values;
// 	return (
// 		B && !C && !D || !A && B && !D || A && B && C || A && D
// 	) ? "1" : "0";
// });

// addCol("BD'(C' + A') + A(BC + D)");
// addExprValues(values => {
// 	const [A, B, C, D] = values;
// 	return (
// 		(B && !D) && (!C || !A) || A && ((B && C) || D)
// 	) ? "1" : "0";
// });

// // (A + BD') * B(A'D' + C)

// addCol("BC'D' + B(A + BD')(A'D' + C) + AD");
// addExprValues(values => {
// 	const [A, B, C, D] = values;
// 	return (
// 		B && !C && !D || B && (A || B && !D) && (!A && !D || C) || A && D
// 	) ? "1" : "0";
// });

// // expand it again??
// // BC'D' + B(A + BD')(A'D' + C) + AD
// // BC'D' + (BA + BBD')(A'D' + C) + AD
// // BC'D' + (BA + BBD')(A'D' + C) + AD

// // BAA'D' + BAC + BBD'A'D' + BBD'C

// // BC'D' + BAA'D' + BAC + BBD'A'D' + BBD'C + AD

// addCol("BC'D' + BAA'D' + BAC + BBD'A'D' + BBD'C + AD");
// addExprValues(values => {
// 	const [A, B, C, D] = values;
// 	return (
// 			B && !C && !D ||
// 			B && A && !A && !D ||
// 			B && A && C ||
// 			B && !B && !D && !A && !D ||
// 			B && B && !D && C ||
// 			A && D) ?
// 		"1" : "0";
// });

// // Idempotency 1: x and x is just x
// // addCol("BC'D' + BAA'D' + BAC + BB'D'A' + BD'C + AD");
// // addExprValues(values => {
// // 	const [A, B, C, D] = values;
// // 	return (
// // 			B && !C && !D ||
// // 			B && A && !A && !D ||
// // 			B && A && C ||
// // 			B && !B && !D && !A ||
// // 			B && !D && C ||
// // 			A && D) ?
// // 		"1" : "0";
// // });

// // Negation: x and !x is 0
// // addCol("BC'D' + B0D' + BAC + 0D'A' + BD'C + AD");
// // addExprValues(values => {
// // 	const [A, B, C, D] = values;
// // 	return (
// // 			B && !C && !D ||
// // 			B && 0 && !D ||
// // 			B && A && C ||
// // 			0 && !D && !A ||
// // 			B && !D && C ||
// // 			A && D) ?
// // 		"1" : "0";
// // });

// // Universal bound: eliminate terms with zero in them

// // addCol("BC'D' + BAC + BD'C + AD");
// // addExprValues(values => {
// // 	const [A, B, C, D] = values;
// // 	return (
// // 			B && !C && !D ||
// // 			B && A && C ||
// // 			B && !D && C ||
// // 			A && D) ?
// // 		"1" : "0";
// // });

// // undistribute?

// // addCol("B(C'D' + AC + D'C) + AD");
// // addExprValues(values => {
// // 	const [A, B, C, D] = values;
// // 	return (
// // 			B && (
// // 				!C && !D || !D && C || A && C
// // 			) ||
// // 			A && D) ?
// // 		"1" : "0";
// // });

// // addCol("B(D'(C' + C) + AC) + AD");
// // addExprValues(values => {
// // 	const [A, B, C, D] = values;
// // 	return (
// // 			B && (
// // 				!D && (!C || C) || A && C
// // 			) ||
// // 			A && D) ?
// // 		"1" : "0";
// // });

// // addCol("B(D'1 + AC) + AD");
// // addExprValues(values => {
// // 	const [A, B, C, D] = values;
// // 	return (
// // 			B && (
// // 				!D && (1) || A && C
// // 			) ||
// // 			A && D) ?
// // 		"1" : "0";
// // });

// addCol("B(D' + AC) + AD");
// addExprValues(values => {
// 	const [A, B, C, D] = values;
// 	return (
// 			B && (
// 				!D || A && C
// 			) ||
// 			A && D) ?
// 		"1" : "0";
// });

// // undistribute again i don't fucking know
// addCol("BD' + ABC + AD");
// addExprValues(values => {
// 	const [A, B, C, D] = values;
// 	return (B && !D || A && B && C || A && D) ?
// 		"1" : "0";
// });


// // distributive pty?

// //   z + xy
// // = z+x * z+y


// // A'BD' + A(BC)
// // = (A'BD' + A) * (A'BD' + BC)
// // = (A'(BD') + A) * (A'BD' + BC)
// // T14d: x + x'y = x+y
// // = (A + BD') * (A'BD' + BC)
// // = (A + BD') * B(A'D' + C)


// //   A(BC + D)
// // = A(BC + D)


// // addCol("BD'(C' + A') + A(BC + D)");
// // addExprValues(values => {
// // 	const [A, B, C, D] = values;
// // 	return (
// // 		(B && !D) && (!C || !A) || A && ((B && C) || D)
// // 	) ? "1" : "0";
// // });


// // addCol("B(D'(C' + A') + AC) + AD");
// // addExprValues(values => {
// // 	const [A, B, C, D] = values;
// // 	return (
// // 		B && (!D && (!C || !A) || A && C ) || A && D )
// // 		? "1" : "0";
// // });