import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

(() => {
	'use strict'

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

	if (!compoundForm || !principalInput || !contributionInput || !rateInput || !yearsInput || !compoundFinal || !compoundInvested || !compoundEarned || !compoundCtx) {
		return;
	}

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
})()
