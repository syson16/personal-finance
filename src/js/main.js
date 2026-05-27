import _ from 'lodash';

import { Chart, registerables } from 'chart.js';
import annotationPlugin from 'chartjs-plugin-annotation';

// Import our custom CSS
import '../scss/styles.scss'

// Import all of Bootstrap's JS
import * as bootstrap from 'bootstrap'

// Import JS files
import './color-modes.js'

const json = require('../json/sample.json');

function component() {
	var element = document.createElement('div');

	// Lodash, currently included via a script, is required for this line to work
	// Lodash, now imported by this script
	element.innerHTML = _.join(['Hello', 'webpack'], ' ');

	return element;
}

function jsonText() {
	var element = document.createElement('div');

	element.innerHTML = json.sample;

	return element;
}

function flipCoin() {
	return Math.random() < 0.5
}

// document.body.appendChild(component());
// document.body.appendChild(jsonText());

/* globals Chart:false */

(() => {
	'use strict'

	const currentPage = window.location.pathname.split('/').pop() || 'index.html';
	document.querySelectorAll('.sidebar .nav-link').forEach((link) => {
		const linkPage = link.getAttribute('href').replace('./', '');
		const isActive = linkPage === currentPage;
		link.classList.toggle('active', isActive);
		if (isActive) {
			link.setAttribute('aria-current', 'page');
		} else {
			link.removeAttribute('aria-current');
		}
	});

	Chart.register(...registerables);
	Chart.register(annotationPlugin);

	const compoundForm = document.getElementById('compound-form');
	const principalInput = document.getElementById('compound-principal');
	const contributionInput = document.getElementById('compound-contribution');
	const rateInput = document.getElementById('compound-rate');
	const yearsInput = document.getElementById('compound-years');
	const addYearButton = document.getElementById('compound-add-year');
	const resetButton = document.getElementById('compound-reset');
	const compoundFinal = document.getElementById('compound-final');
	const compoundInvested = document.getElementById('compound-invested');
	const compoundEarned = document.getElementById('compound-earned');
	const compoundAdvantage = document.getElementById('compound-advantage');
	const compoundAdvantageNote = document.getElementById('compound-advantage-note');
	const compoundCtx = document.getElementById('compoundChart');
	const formulaPrincipal = document.getElementById('formula-principal');
	const formulaContribution = document.getElementById('formula-contribution');
	const formulaRate = document.getElementById('formula-rate');
	const formulaMonthlyRate = document.getElementById('formula-monthly-rate');
	const formulaYears = document.getElementById('formula-years');
	const formulaMonths = document.getElementById('formula-months');
	const currencyFormatter = new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD',
		maximumFractionDigits: 0
	});
	const numberFormatter = new Intl.NumberFormat('en-US', {
		maximumFractionDigits: 0
	});
	const percentFormatter = new Intl.NumberFormat('en-US', {
		style: 'percent',
		minimumFractionDigits: 2,
		maximumFractionDigits: 2
	});

	if (compoundForm && principalInput && contributionInput && rateInput && yearsInput && compoundFinal && compoundInvested && compoundEarned && compoundCtx) {
		const defaultCompoundValues = {
			principal: 100000,
			contribution: 500,
			rate: 7,
			years: 20
		};

		function parseDollarInput(input) {
			return Number(input.value.replace(/,/g, '')) || 0;
		}

		function formatDollarInput(input) {
			input.value = numberFormatter.format(parseDollarInput(input));
		}

		const compoundChart = new Chart(compoundCtx, {
			type: 'line',
			data: {
				labels: [],
				datasets: [
					{
						label: 'Balance',
						data: [],
						backgroundColor: 'transparent',
						borderColor: '#198754',
						borderWidth: 4,
						pointBackgroundColor: '#198754'
					},
					{
						label: 'Contributions',
						data: [],
						backgroundColor: 'transparent',
						borderColor: '#6c757d',
						borderDash: [6, 6],
						borderWidth: 2,
						pointRadius: 0
					},
					{
						label: 'Flat interest + contributions',
						data: [],
						backgroundColor: 'transparent',
						borderColor: '#dc3545',
						borderDash: [2, 5],
						borderWidth: 2,
						pointRadius: 0
					}
				]
			},
			options: {
				interaction: {
					mode: 'index',
					intersect: false
				},
				plugins: {
					tooltip: {
						mode: 'index',
						intersect: false,
						callbacks: {
							label: function(context) {
								return `${context.dataset.label}: ${currencyFormatter.format(context.parsed.y)}`;
							}
						}
					}
				},
				scales: {
					x: {
						title: {
							display: true,
							text: 'Years'
						}
					},
					y: {
						ticks: {
							callback: function(value) {
								return currencyFormatter.format(value);
							}
						}
					}
				}
			}
		});

		function calculateCompoundInterest() {
			const principal = parseDollarInput(principalInput);
			const monthlyContribution = parseDollarInput(contributionInput);
			const annualRate = (Number(rateInput.value) || 0) / 100;
			const years = Math.max(Number(yearsInput.value) || 1, 1);
			const monthlyRate = annualRate / 12;
			const months = years * 12;
			const labels = [0];
			const balances = [principal];
			const contributions = [principal];
			const flatInterest = [principal];
			const flatFinalBalance = principal * (1 + annualRate * years) + monthlyContribution * months;
			let balance = principal;
			let totalInvested = principal;

			for (let month = 1; month <= months; month++) {
				balance = balance * (1 + monthlyRate) + monthlyContribution;
				totalInvested += monthlyContribution;

				if (month % 12 === 0) {
					const year = month / 12;
					labels.push(month / 12);
					balances.push(Math.round(balance));
					contributions.push(totalInvested);
					flatInterest.push(principal * (1 + annualRate * year) + monthlyContribution * month);
				}
			}

			return {
				labels,
				balances,
				contributions,
				flatInterest,
				totalInvested,
				finalBalance: balance,
				flatFinalBalance,
				principal,
				monthlyContribution,
				annualRate,
				monthlyRate,
				years,
				months
			};
		}

		function updateCompoundInterest() {
			const result = calculateCompoundInterest();
			const interestEarned = result.finalBalance - result.totalInvested;
			const compoundingAdvantage = result.finalBalance - result.flatFinalBalance;
			const compoundingLift = result.flatFinalBalance > 0 ? compoundingAdvantage / result.flatFinalBalance : 0;

			compoundFinal.innerHTML = currencyFormatter.format(result.finalBalance);
			compoundInvested.innerHTML = currencyFormatter.format(result.totalInvested);
			compoundEarned.innerHTML = currencyFormatter.format(interestEarned);
			if (compoundAdvantage) {
				compoundAdvantage.innerHTML = currencyFormatter.format(compoundingAdvantage);
			}
			if (compoundAdvantageNote) {
				compoundAdvantageNote.innerHTML = `Compound growth ends ${percentFormatter.format(compoundingLift)} above flat interest plus contributions (${currencyFormatter.format(result.flatFinalBalance)}).`;
			}

			compoundChart.data.labels = result.labels;
			compoundChart.data.datasets[0].data = result.balances;
			compoundChart.data.datasets[1].data = result.contributions;
			compoundChart.data.datasets[2].data = result.flatInterest;
			compoundChart.update();

			if (formulaPrincipal) {
				formulaPrincipal.innerHTML = currencyFormatter.format(result.principal);
			}
			if (formulaContribution) {
				formulaContribution.innerHTML = currencyFormatter.format(result.monthlyContribution);
			}
			if (formulaRate) {
				formulaRate.innerHTML = percentFormatter.format(result.annualRate);
			}
			if (formulaMonthlyRate) {
				formulaMonthlyRate.innerHTML = percentFormatter.format(result.monthlyRate);
			}
			if (formulaYears) {
				formulaYears.innerHTML = result.years;
			}
			if (formulaMonths) {
				formulaMonths.innerHTML = result.months;
			}
		}

		compoundForm.addEventListener('submit', function(event) {
			event.preventDefault();
			updateCompoundInterest();
		});

		[principalInput, contributionInput].forEach((input) => {
			input.addEventListener('input', function() {
				const cursorPosition = input.selectionStart;
				const originalLength = input.value.length;
				formatDollarInput(input);
				const lengthDifference = input.value.length - originalLength;
				input.setSelectionRange(cursorPosition + lengthDifference, cursorPosition + lengthDifference);
				updateCompoundInterest();
			});
			input.addEventListener('blur', function() {
				formatDollarInput(input);
			});
		});

		[rateInput, yearsInput].forEach((input) => {
			input.addEventListener('input', updateCompoundInterest);
		});

		if (addYearButton) {
			addYearButton.addEventListener('click', function() {
				const currentYears = Number(yearsInput.value) || 1;
				const maxYears = Number(yearsInput.max) || 80;
				yearsInput.value = Math.min(currentYears + 1, maxYears);
				updateCompoundInterest();
			});
		}

		if (resetButton) {
			resetButton.addEventListener('click', function() {
				principalInput.value = numberFormatter.format(defaultCompoundValues.principal);
				contributionInput.value = numberFormatter.format(defaultCompoundValues.contribution);
				rateInput.value = defaultCompoundValues.rate;
				yearsInput.value = defaultCompoundValues.years;
				updateCompoundInterest();
			});
		}

		formatDollarInput(principalInput);
		formatDollarInput(contributionInput);
		updateCompoundInterest();
	}

	let cols = [0];
	let res = [100];
	const budgetText = document.getElementById('total-budget');
	const gamblerResultBtn = document.getElementById('gambler-result');
	const ctx = document.getElementById('myChart')
	const gamblerBtn = document.getElementById('gambler-run');
	const gamblerOneTimeBtn = document.getElementById('gambler-onetime-run');
	const gamblerResetBtn = document.getElementById('gambler-reset');

	if (!budgetText || !gamblerResultBtn || !ctx || !gamblerBtn || !gamblerOneTimeBtn || !gamblerResetBtn) {
		return;
	}

	function budgetUpdate() {
		let currentBudget = res[res.length - 1];

		if (currentBudget > 0) {
			budgetText.innerHTML = "$" + currentBudget;
		} else {
			currentBudget = -1 * currentBudget;
			budgetText.innerHTML = "-$" + currentBudget;
		}
	}

	budgetUpdate()

	function flipCoinOneTime(res) {
		
		gamblerResultBtn.classList.remove("btn-secondary");
		gamblerResultBtn.classList.remove("btn-success");
		gamblerResultBtn.classList.remove("btn-danger");

		if(flipCoin()) {
			res.push(res[res.length - 1] + 30);
			gamblerResultBtn.classList.add("btn-success");
			gamblerResultBtn.innerHTML = "WIN";
		} else {
			res.push(res[res.length - 1] - 30);
			gamblerResultBtn.classList.add("btn-danger");
			gamblerResultBtn.innerHTML = "LOSE";
		}

		return res
	}

	function flipCoinMultipleTime(n, res) {

		for(let i = 0; i < n; i++) {
			res = flipCoinOneTime(res)
		}

		return res
	}

	function addColumnOneTime(cols) {

		cols.push(cols[cols.length - 1] + 1);

		return cols
	}

	function flipCoinMultipleTimeColumns(n, cols) {

		for(let i = 0; i < n; i++) {
			cols = addColumnOneTime(cols)
		}

		return cols
	}

	// eslint-disable-next-line no-unused-vars
	const myChart = new Chart(ctx, {
	  type: 'line',
	  data: {
		labels: cols,
		datasets: [{
		  data: res,
		  lineTension: 0,
		  backgroundColor: 'transparent',
		  borderColor: '#007bff',
		  borderWidth: 4,
		  pointBackgroundColor: '#007bff'
		}]
	  },
	  options: {
		plugins: {
		  legend: {
			display: false
		  },
		  tooltip: {
			boxPadding: 3
		  },
		  annotation: {
			annotations: {
			  line1: {
				type: 'line',
				yMin: 0,
				yMax: 0,
				borderColor: 'rgb(255, 99, 132)',
				borderWidth: 2,
				label: {
					display: true,
					position: 'center',
					content: 'Dead',
					color: 'rgb(255, 99, 132)',
					borderColor: 'white'
				}
			  }
			}
		  }
		},
	  }
	})

	gamblerOneTimeBtn.addEventListener("click", function() {
		addColumnOneTime(cols)
		flipCoinOneTime(res)
		myChart.update();
		budgetUpdate()
	});

	gamblerResetBtn.addEventListener("click", function() {
		cols = [0];
		res = [100];
		myChart.data.datasets.forEach((dataset) => {
			dataset.data = res;
		});
		myChart.data.labels = cols;
		myChart.update();
		budgetUpdate()
	});

	gamblerBtn.addEventListener("click", function() {
		for(let i = 0; i < 10; i++) {
			addColumnOneTime(cols)
			flipCoinOneTime(res)
		}
		myChart.update();
		budgetUpdate()
	});
  })()
  
