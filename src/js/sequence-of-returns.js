import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

(() => {
	'use strict'

	const sequenceForm = document.getElementById('sequence-form');
	const startInput = document.getElementById('sequence-start');
	const withdrawalInput = document.getElementById('sequence-withdrawal');
	const averageReturnInput = document.getElementById('sequence-average-return');
	const badReturnInput = document.getElementById('sequence-bad-return');
	const badYearsInput = document.getElementById('sequence-bad-years');
	const yearsInput = document.getElementById('sequence-years');
	const addWithdrawalButton = document.getElementById('sequence-add-withdrawal');
	const addBadYearButton = document.getElementById('sequence-add-bad-year');
	const resetButton = document.getElementById('sequence-reset');
	const badEarlyFinal = document.getElementById('sequence-bad-early-final');
	const badLateFinal = document.getElementById('sequence-bad-late-final');
	const finalGap = document.getElementById('sequence-final-gap');
	const failureYear = document.getElementById('sequence-failure-year');
	const riskNote = document.getElementById('sequence-risk-note');
	const withdrawalNote = document.getElementById('sequence-withdrawal-note');
	const returnTable = document.getElementById('sequence-return-table');
	const sequenceCtx = document.getElementById('sequenceChart');

	if (!sequenceForm || !startInput || !withdrawalInput || !averageReturnInput || !badReturnInput || !badYearsInput || !yearsInput || !badEarlyFinal || !badLateFinal || !finalGap || !failureYear || !sequenceCtx) {
		return;
	}

	const defaultValues = {
		start: 2000000,
		withdrawal: 80000,
		averageReturn: 6,
		badReturn: -18,
		badYears: 3,
		years: 30
	};

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
		minimumFractionDigits: 1,
		maximumFractionDigits: 1
	});

	function parseDollarInput(input) {
		return Number(input.value.replace(/,/g, '')) || 0;
	}

	function formatDollarInput(input) {
		input.value = numberFormatter.format(parseDollarInput(input));
	}

	function getReturnSet(years, badYears, averageReturn, badReturn) {
		const clampedBadYears = Math.min(Math.max(badYears, 1), Math.max(years - 1, 1));
		const goodYears = Math.max(years - clampedBadYears, 1);
		const goodReturn = ((averageReturn * years) - (badReturn * clampedBadYears)) / goodYears;

		return {
			badYears: clampedBadYears,
			goodYears,
			goodReturn,
			badReturn
		};
	}

	function runPath(start, withdrawal, returns) {
		const labels = [0];
		const balances = [start];
		let balance = start;
		let failureYear = null;
		let peak = start;
		let worstDrawdown = 0;

		returns.forEach((returnRate, index) => {
			const year = index + 1;
			balance = Math.max(balance - withdrawal, 0);
			balance *= 1 + returnRate;

			if (balance <= 0 && failureYear === null) {
				failureYear = year;
			}

			peak = Math.max(peak, balance);
			if (peak > 0) {
				worstDrawdown = Math.min(worstDrawdown, (balance - peak) / peak);
			}

			labels.push(year);
			balances.push(balance);
		});

		return {
			labels,
			balances,
			finalBalance: balance,
			failureYear,
			worstDrawdown
		};
	}

	function calculateSequenceRisk() {
		const start = parseDollarInput(startInput);
		const withdrawal = parseDollarInput(withdrawalInput);
		const averageReturn = (Number(averageReturnInput.value) || 0) / 100;
		const badReturn = (Number(badReturnInput.value) || 0) / 100;
		const years = Math.max(Number(yearsInput.value) || 2, 2);
		const badYears = Math.max(Number(badYearsInput.value) || 1, 1);
		const returnSet = getReturnSet(years, badYears, averageReturn, badReturn);
		const badReturns = Array(returnSet.badYears).fill(returnSet.badReturn);
		const goodReturns = Array(returnSet.goodYears).fill(returnSet.goodReturn);
		const badEarlyReturns = badReturns.concat(goodReturns);
		const badLateReturns = goodReturns.concat(badReturns);
		const badEarly = runPath(start, withdrawal, badEarlyReturns);
		const badLate = runPath(start, withdrawal, badLateReturns);

		return {
			start,
			withdrawal,
			averageReturn,
			years,
			returnSet,
			badEarly,
			badLate,
			finalGap: badLate.finalBalance - badEarly.finalBalance
		};
	}

	const sequenceChart = new Chart(sequenceCtx, {
		type: 'line',
		data: {
			labels: [],
			datasets: [
				{
					label: 'Bad returns early',
					data: [],
					backgroundColor: 'transparent',
					borderColor: '#dc3545',
					borderWidth: 4,
					pointBackgroundColor: '#dc3545'
				},
				{
					label: 'Bad returns late',
					data: [],
					backgroundColor: 'transparent',
					borderColor: '#198754',
					borderDash: [5, 5],
					borderWidth: 3,
					pointBackgroundColor: '#198754'
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

	function updateReturnTable(result) {
		if (!returnTable) {
			return;
		}

		returnTable.innerHTML = `
			<tr>
				<td>${result.returnSet.badYears} bad years</td>
				<td>${percentFormatter.format(result.returnSet.badReturn)}</td>
			</tr>
			<tr>
				<td>${result.returnSet.goodYears} remaining years</td>
				<td>${percentFormatter.format(result.returnSet.goodReturn)}</td>
			</tr>
			<tr>
				<td>Full period average</td>
				<td>${percentFormatter.format(result.averageReturn)}</td>
			</tr>
		`;
	}

	function updateSequenceRisk() {
		const result = calculateSequenceRisk();
		const failedYear = result.badEarly.failureYear || result.badLate.failureYear;

		badEarlyFinal.innerHTML = currencyFormatter.format(result.badEarly.finalBalance);
		badLateFinal.innerHTML = currencyFormatter.format(result.badLate.finalBalance);
		finalGap.innerHTML = currencyFormatter.format(result.finalGap);
		finalGap.classList.toggle('text-success', result.finalGap >= 0);
		finalGap.classList.toggle('text-danger', result.finalGap < 0);
		failureYear.innerHTML = failedYear ? `Year ${failedYear}` : 'Never';
		failureYear.classList.toggle('text-danger', Boolean(failedYear));
		failureYear.classList.toggle('text-success', !failedYear);

		if (riskNote) {
			riskNote.innerHTML = `Both paths average ${percentFormatter.format(result.averageReturn)}, but the bad-early path ends ${currencyFormatter.format(Math.abs(result.finalGap))} ${result.finalGap >= 0 ? 'lower' : 'higher'}.`;
		}
		if (withdrawalNote) {
			withdrawalNote.innerHTML = `The model withdraws ${currencyFormatter.format(result.withdrawal)} at the start of each year before applying that year's return.`;
		}

		updateReturnTable(result);

		sequenceChart.data.labels = result.badEarly.labels;
		sequenceChart.data.datasets[0].data = result.badEarly.balances;
		sequenceChart.data.datasets[1].data = result.badLate.balances;
		sequenceChart.update();
	}

	sequenceForm.addEventListener('submit', function(event) {
		event.preventDefault();
		updateSequenceRisk();
	});

	[startInput, withdrawalInput].forEach((input) => {
		input.addEventListener('input', function() {
			const cursorPosition = input.selectionStart;
			const originalLength = input.value.length;
			formatDollarInput(input);
			const lengthDifference = input.value.length - originalLength;
			input.setSelectionRange(cursorPosition + lengthDifference, cursorPosition + lengthDifference);
			updateSequenceRisk();
		});
		input.addEventListener('blur', function() {
			formatDollarInput(input);
		});
	});

	[averageReturnInput, badReturnInput, badYearsInput, yearsInput].forEach((input) => {
		input.addEventListener('input', updateSequenceRisk);
	});

	if (addWithdrawalButton) {
		addWithdrawalButton.addEventListener('click', function() {
			withdrawalInput.value = numberFormatter.format(parseDollarInput(withdrawalInput) + 10000);
			updateSequenceRisk();
		});
	}

	if (addBadYearButton) {
		addBadYearButton.addEventListener('click', function() {
			const maxBadYears = Number(badYearsInput.max) || 15;
			badYearsInput.value = Math.min((Number(badYearsInput.value) || 0) + 1, maxBadYears);
			updateSequenceRisk();
		});
	}

	if (resetButton) {
		resetButton.addEventListener('click', function() {
			startInput.value = numberFormatter.format(defaultValues.start);
			withdrawalInput.value = numberFormatter.format(defaultValues.withdrawal);
			averageReturnInput.value = defaultValues.averageReturn;
			badReturnInput.value = defaultValues.badReturn;
			badYearsInput.value = defaultValues.badYears;
			yearsInput.value = defaultValues.years;
			updateSequenceRisk();
		});
	}

	formatDollarInput(startInput);
	formatDollarInput(withdrawalInput);
	updateSequenceRisk();
})()
