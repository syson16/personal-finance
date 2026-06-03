import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

(() => {
	'use strict'

	const drawdownForm = document.getElementById('drawdown-form');
	const startInput = document.getElementById('drawdown-start');
	const lossInput = document.getElementById('drawdown-loss');
	const returnInput = document.getElementById('drawdown-return');
	const contributionInput = document.getElementById('drawdown-contribution');
	const yearsInput = document.getElementById('drawdown-years');
	const addLossButton = document.getElementById('drawdown-add-loss');
	const addReturnButton = document.getElementById('drawdown-add-return');
	const resetButton = document.getElementById('drawdown-reset');
	const afterLoss = document.getElementById('drawdown-after-loss');
	const requiredGain = document.getElementById('drawdown-required-gain');
	const recoveryTime = document.getElementById('drawdown-recovery-time');
	const recoveryNote = document.getElementById('drawdown-recovery-note');
	const contributionNote = document.getElementById('drawdown-contribution-note');
	const referenceTable = document.getElementById('drawdown-reference-table');
	const drawdownCtx = document.getElementById('drawdownChart');

	if (!drawdownForm || !startInput || !lossInput || !returnInput || !contributionInput || !yearsInput || !afterLoss || !requiredGain || !recoveryTime || !drawdownCtx) {
		return;
	}

	const defaultValues = {
		start: 100000,
		loss: 50,
		returnRate: 8,
		contribution: 0,
		years: 20
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

	function calculateRequiredGain(lossRate) {
		if (lossRate >= 1) {
			return Infinity;
		}

		return lossRate / (1 - lossRate);
	}

	function formatRecoveryTime(months, didRecover) {
		if (!didRecover) {
			return 'Not yet';
		}

		if (months === 0) {
			return 'Immediate';
		}

		const years = months / 12;
		return `${years.toFixed(1)} years`;
	}

	function calculateDrawdownRecovery() {
		const start = parseDollarInput(startInput);
		const lossRate = Math.min(Math.max((Number(lossInput.value) || 0) / 100, 0), .99);
		const annualReturn = Math.max((Number(returnInput.value) || 0) / 100, 0);
		const monthlyContribution = parseDollarInput(contributionInput);
		const years = Math.max(Number(yearsInput.value) || 1, 1);
		const months = years * 12;
		const monthlyReturn = annualReturn / 12;
		const drawdownBalance = start * (1 - lossRate);
		const labels = [0];
		const balances = [drawdownBalance];
		const targetBalances = [start];
		let balance = drawdownBalance;
		let recoveryMonth = balance >= start ? 0 : null;

		for (let month = 1; month <= months; month++) {
			balance = balance * (1 + monthlyReturn) + monthlyContribution;

			if (recoveryMonth === null && balance >= start) {
				recoveryMonth = month;
			}

			if (month % 12 === 0 || month === months || recoveryMonth === month) {
				labels.push(month / 12);
				balances.push(balance);
				targetBalances.push(start);
			}
		}

		return {
			start,
			lossRate,
			annualReturn,
			monthlyContribution,
			years,
			months,
			drawdownBalance,
			requiredGain: calculateRequiredGain(lossRate),
			recoveryMonth,
			endingBalance: balance,
			labels,
			balances,
			targetBalances
		};
	}

	function updateReferenceTable() {
		if (!referenceTable) {
			return;
		}

		const losses = [.1, .25, .5, .8];
		referenceTable.innerHTML = losses.map((lossRate) => (
			`<tr>
				<td>${percentFormatter.format(lossRate)}</td>
				<td>${percentFormatter.format(calculateRequiredGain(lossRate))}</td>
			</tr>`
		)).join('');
	}

	const drawdownChart = new Chart(drawdownCtx, {
		type: 'line',
		data: {
			labels: [],
			datasets: [
				{
					label: 'Recovery balance',
					data: [],
					backgroundColor: 'transparent',
					borderColor: '#198754',
					borderWidth: 4,
					pointBackgroundColor: '#198754'
				},
				{
					label: 'Break-even target',
					data: [],
					backgroundColor: 'transparent',
					borderColor: '#6c757d',
					borderDash: [6, 6],
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
						text: 'Years after drawdown'
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

	function updateDrawdownRecovery() {
		const result = calculateDrawdownRecovery();
		const didRecover = result.recoveryMonth !== null;
		const endingGap = result.endingBalance - result.start;

		afterLoss.innerHTML = currencyFormatter.format(result.drawdownBalance);
		requiredGain.innerHTML = percentFormatter.format(result.requiredGain);
		recoveryTime.innerHTML = formatRecoveryTime(result.recoveryMonth, didRecover);
		recoveryTime.classList.toggle('text-success', didRecover);
		recoveryTime.classList.toggle('text-danger', !didRecover);

		if (recoveryNote) {
			if (didRecover) {
				recoveryNote.innerHTML = `At ${percentFormatter.format(result.annualReturn)} annual return, the account recovers in ${formatRecoveryTime(result.recoveryMonth, true)}.`;
			} else {
				recoveryNote.innerHTML = `After ${result.years} years, the account is still ${currencyFormatter.format(Math.abs(endingGap))} below break-even.`;
			}
		}
		if (contributionNote) {
			contributionNote.innerHTML = result.monthlyContribution > 0
				? `Monthly contributions of ${currencyFormatter.format(result.monthlyContribution)} shorten the recovery path.`
				: 'With no new contributions, recovery depends entirely on returns from the reduced balance.';
		}

		drawdownChart.data.labels = result.labels;
		drawdownChart.data.datasets[0].data = result.balances;
		drawdownChart.data.datasets[1].data = result.targetBalances;
		drawdownChart.update();
	}

	drawdownForm.addEventListener('submit', function(event) {
		event.preventDefault();
		updateDrawdownRecovery();
	});

	[startInput, contributionInput].forEach((input) => {
		input.addEventListener('input', function() {
			const cursorPosition = input.selectionStart;
			const originalLength = input.value.length;
			formatDollarInput(input);
			const lengthDifference = input.value.length - originalLength;
			input.setSelectionRange(cursorPosition + lengthDifference, cursorPosition + lengthDifference);
			updateDrawdownRecovery();
		});
		input.addEventListener('blur', function() {
			formatDollarInput(input);
		});
	});

	[lossInput, returnInput, yearsInput].forEach((input) => {
		input.addEventListener('input', updateDrawdownRecovery);
	});

	if (addLossButton) {
		addLossButton.addEventListener('click', function() {
			const maxLoss = Number(lossInput.max) || 95;
			lossInput.value = Math.min((Number(lossInput.value) || 0) + 5, maxLoss);
			updateDrawdownRecovery();
		});
	}

	if (addReturnButton) {
		addReturnButton.addEventListener('click', function() {
			const maxReturn = Number(returnInput.max) || 50;
			returnInput.value = Math.min((Number(returnInput.value) || 0) + 1, maxReturn);
			updateDrawdownRecovery();
		});
	}

	if (resetButton) {
		resetButton.addEventListener('click', function() {
			startInput.value = numberFormatter.format(defaultValues.start);
			lossInput.value = defaultValues.loss;
			returnInput.value = defaultValues.returnRate;
			contributionInput.value = numberFormatter.format(defaultValues.contribution);
			yearsInput.value = defaultValues.years;
			updateDrawdownRecovery();
		});
	}

	formatDollarInput(startInput);
	formatDollarInput(contributionInput);
	updateReferenceTable();
	updateDrawdownRecovery();
})()
