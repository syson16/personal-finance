import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

(() => {
	'use strict'

	const volatilityForm = document.getElementById('volatility-form');
	const startInput = document.getElementById('volatility-start');
	const upReturnInput = document.getElementById('volatility-up-return');
	const downReturnInput = document.getElementById('volatility-down-return');
	const leverageInput = document.getElementById('volatility-leverage');
	const cyclesInput = document.getElementById('volatility-cycles');
	const addCycleButton = document.getElementById('volatility-add-cycle');
	const addFiveButton = document.getElementById('volatility-add-five');
	const resetButton = document.getElementById('volatility-reset');
	const indexFinal = document.getElementById('volatility-index-final');
	const leveragedFinal = document.getElementById('volatility-leveraged-final');
	const finalGap = document.getElementById('volatility-final-gap');
	const dragNote = document.getElementById('volatility-drag-note');
	const drawdownNote = document.getElementById('volatility-drawdown-note');
	const exampleTable = document.getElementById('volatility-example-table');
	const volatilityCtx = document.getElementById('volatilityChart');

	if (!volatilityForm || !startInput || !upReturnInput || !downReturnInput || !leverageInput || !cyclesInput || !indexFinal || !leveragedFinal || !finalGap || !volatilityCtx) {
		return;
	}

	const defaultValues = {
		start: 10000,
		upReturn: 10,
		downReturn: -10,
		leverage: 3,
		cycles: 6
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
		minimumFractionDigits: 2,
		maximumFractionDigits: 2
	});

	function parseDollarInput(input) {
		return Number(input.value.replace(/,/g, '')) || 0;
	}

	function formatDollarInput(input) {
		input.value = numberFormatter.format(parseDollarInput(input));
	}

	function clampLeveragedReturn(returnValue, leverage) {
		return Math.max(returnValue * leverage, -1);
	}

	function calculateMaxDrawdown(values) {
		let peak = values[0] || 0;
		let maxDrawdown = 0;

		values.forEach((value) => {
			peak = Math.max(peak, value);
			if (peak > 0) {
				maxDrawdown = Math.min(maxDrawdown, (value - peak) / peak);
			}
		});

		return maxDrawdown;
	}

	function calculateVolatilityPath() {
		const start = parseDollarInput(startInput);
		const upReturn = (Number(upReturnInput.value) || 0) / 100;
		const downReturn = (Number(downReturnInput.value) || 0) / 100;
		const leverage = Math.max(Number(leverageInput.value) || 1, 1);
		const cycles = Math.max(Number(cyclesInput.value) || 1, 1);
		const returns = [];
		const labels = ['Start'];
		const indexValues = [start];
		const leveragedValues = [start];
		let indexBalance = start;
		let leveragedBalance = start;

		for (let cycle = 1; cycle <= cycles; cycle++) {
			returns.push(upReturn, downReturn);
		}

		returns.forEach((returnValue, index) => {
			const leveragedReturn = clampLeveragedReturn(returnValue, leverage);

			indexBalance *= 1 + returnValue;
			leveragedBalance *= 1 + leveragedReturn;
			labels.push(String(index + 1));
			indexValues.push(indexBalance);
			leveragedValues.push(leveragedBalance);
		});

		return {
			start,
			upReturn,
			downReturn,
			leverage,
			cycles,
			labels,
			indexValues,
			leveragedValues,
			indexFinal: indexBalance,
			leveragedFinal: leveragedBalance,
			indexReturn: start > 0 ? (indexBalance / start) - 1 : 0,
			leveragedReturn: start > 0 ? (leveragedBalance / start) - 1 : 0,
			indexMaxDrawdown: calculateMaxDrawdown(indexValues),
			leveragedMaxDrawdown: calculateMaxDrawdown(leveragedValues)
		};
	}

	const volatilityChart = new Chart(volatilityCtx, {
		type: 'line',
		data: {
			labels: [],
			datasets: [
				{
					label: 'Index',
					data: [],
					backgroundColor: 'transparent',
					borderColor: '#0d6efd',
					borderWidth: 4,
					pointBackgroundColor: '#0d6efd'
				},
				{
					label: 'Daily reset leveraged fund',
					data: [],
					backgroundColor: 'transparent',
					borderColor: '#dc3545',
					borderWidth: 4,
					pointBackgroundColor: '#dc3545'
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
						text: 'Trading days'
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

	function updateExampleTable(result) {
		if (!exampleTable) {
			return;
		}

		const upLeveragedReturn = clampLeveragedReturn(result.upReturn, result.leverage);
		const downLeveragedReturn = clampLeveragedReturn(result.downReturn, result.leverage);
		const start = 100;
		const dayOneIndex = start * (1 + result.upReturn);
		const dayOneLeveraged = start * (1 + upLeveragedReturn);
		const dayTwoIndex = dayOneIndex * (1 + result.downReturn);
		const dayTwoLeveraged = dayOneLeveraged * (1 + downLeveragedReturn);

		exampleTable.innerHTML = `
			<tr>
				<th scope="row">Start</th>
				<td>${currencyFormatter.format(start)}</td>
				<td>${currencyFormatter.format(start)}</td>
			</tr>
			<tr>
				<th scope="row">Up day</th>
				<td>${currencyFormatter.format(dayOneIndex)}</td>
				<td>${currencyFormatter.format(dayOneLeveraged)}</td>
			</tr>
			<tr>
				<th scope="row">Down day</th>
				<td>${currencyFormatter.format(dayTwoIndex)}</td>
				<td>${currencyFormatter.format(dayTwoLeveraged)}</td>
			</tr>
		`;
	}

	function updateVolatilityDrag() {
		const result = calculateVolatilityPath();
		const gap = result.leveragedFinal - result.indexFinal;
		const drag = result.leveragedReturn - (result.indexReturn * result.leverage);

		indexFinal.innerHTML = currencyFormatter.format(result.indexFinal);
		leveragedFinal.innerHTML = currencyFormatter.format(result.leveragedFinal);
		finalGap.innerHTML = currencyFormatter.format(gap);
		finalGap.classList.toggle('text-danger', gap < 0);
		finalGap.classList.toggle('text-success', gap >= 0);

		if (dragNote) {
			dragNote.innerHTML = `${result.leverage}x daily reset ends at ${percentFormatter.format(result.leveragedReturn)} versus ${percentFormatter.format(result.indexReturn)} for the index.`;
		}
		if (drawdownNote) {
			drawdownNote.innerHTML = `Max drawdown: ${percentFormatter.format(result.indexMaxDrawdown)} for the index, ${percentFormatter.format(result.leveragedMaxDrawdown)} for the leveraged fund. Volatility drag versus simple ${result.leverage}x is ${percentFormatter.format(drag)}.`;
		}

		updateExampleTable(result);

		volatilityChart.data.labels = result.labels;
		volatilityChart.data.datasets[0].data = result.indexValues;
		volatilityChart.data.datasets[1].data = result.leveragedValues;
		volatilityChart.update();
	}

	volatilityForm.addEventListener('submit', function(event) {
		event.preventDefault();
		updateVolatilityDrag();
	});

	startInput.addEventListener('input', function() {
		const cursorPosition = startInput.selectionStart;
		const originalLength = startInput.value.length;
		formatDollarInput(startInput);
		const lengthDifference = startInput.value.length - originalLength;
		startInput.setSelectionRange(cursorPosition + lengthDifference, cursorPosition + lengthDifference);
		updateVolatilityDrag();
	});

	startInput.addEventListener('blur', function() {
		formatDollarInput(startInput);
	});

	[upReturnInput, downReturnInput, leverageInput, cyclesInput].forEach((input) => {
		input.addEventListener('input', updateVolatilityDrag);
	});

	if (addCycleButton) {
		addCycleButton.addEventListener('click', function() {
			const maxCycles = Number(cyclesInput.max) || 60;
			cyclesInput.value = Math.min((Number(cyclesInput.value) || 1) + 1, maxCycles);
			updateVolatilityDrag();
		});
	}

	if (addFiveButton) {
		addFiveButton.addEventListener('click', function() {
			const maxCycles = Number(cyclesInput.max) || 60;
			cyclesInput.value = Math.min((Number(cyclesInput.value) || 1) + 5, maxCycles);
			updateVolatilityDrag();
		});
	}

	if (resetButton) {
		resetButton.addEventListener('click', function() {
			startInput.value = numberFormatter.format(defaultValues.start);
			upReturnInput.value = defaultValues.upReturn;
			downReturnInput.value = defaultValues.downReturn;
			leverageInput.value = defaultValues.leverage;
			cyclesInput.value = defaultValues.cycles;
			updateVolatilityDrag();
		});
	}

	formatDollarInput(startInput);
	updateVolatilityDrag();
})()
