import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

(() => {
	'use strict'

	const richForm = document.getElementById('rich-once-form');
	const currentInput = document.getElementById('rich-current');
	const targetInput = document.getElementById('rich-target');
	const aggressiveReturnInput = document.getElementById('rich-aggressive-return');
	const modestReturnInput = document.getElementById('rich-modest-return');
	const spendingInput = document.getElementById('rich-spending');
	const yearsInput = document.getElementById('rich-years');
	const addTargetButton = document.getElementById('rich-add-target');
	const addModestReturnButton = document.getElementById('rich-add-modest-return');
	const resetButton = document.getElementById('rich-reset');
	const targetYear = document.getElementById('rich-target-year');
	const modestIncome = document.getElementById('rich-modest-income');
	const requiredReturn = document.getElementById('rich-required-return');
	const incomeGapValue = document.getElementById('rich-income-gap');
	const onceNote = document.getElementById('rich-once-note');
	const incomeNote = document.getElementById('rich-income-note');
	const baseReturnLabel = document.getElementById('rich-base-return-label');
	const baseTable = document.getElementById('rich-base-table');
	const richCtx = document.getElementById('richOnceChart');

	if (!richForm || !currentInput || !targetInput || !aggressiveReturnInput || !modestReturnInput || !spendingInput || !yearsInput || !targetYear || !modestIncome || !requiredReturn || !incomeGapValue || !richCtx) {
		return;
	}

	const defaultValues = {
		current: 250000,
		target: 2000000,
		aggressiveReturn: 12,
		modestReturn: 5,
		spending: 80000,
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

	function calculateRichOnce() {
		const current = parseDollarInput(currentInput);
		const target = Math.max(parseDollarInput(targetInput), 1);
		const aggressiveReturn = Math.max((Number(aggressiveReturnInput.value) || 0) / 100, 0);
		const modestReturn = Math.max((Number(modestReturnInput.value) || 0) / 100, 0);
		const spending = parseDollarInput(spendingInput);
		const years = Math.max(Number(yearsInput.value) || 1, 1);
		const labels = [0];
		const twoPhaseBalances = [current];
		const targetLine = [target];
		let twoPhaseBalance = current;
		let reachedYear = current >= target ? 0 : null;

		for (let year = 1; year <= years; year++) {
			const twoPhaseReturn = twoPhaseBalance >= target ? modestReturn : aggressiveReturn;
			twoPhaseBalance *= 1 + twoPhaseReturn;

			if (reachedYear === null && twoPhaseBalance >= target) {
				reachedYear = year;
			}

			labels.push(year);
			twoPhaseBalances.push(twoPhaseBalance);
			targetLine.push(target);
		}

		return {
			current,
			target,
			aggressiveReturn,
			modestReturn,
			spending,
			years,
			labels,
			twoPhaseBalances,
			targetLine,
			reachedYear,
			modestIncome: target * modestReturn,
			requiredReturn: spending > 0 ? spending / target : 0,
			finalBalance: twoPhaseBalance
		};
	}

	const richOnceChart = new Chart(richCtx, {
		type: 'line',
		data: {
			labels: [],
			datasets: [
				{
					label: 'Reach enough, then moderate',
					data: [],
					backgroundColor: 'transparent',
					borderColor: '#198754',
					borderWidth: 4,
					pointBackgroundColor: '#198754'
				},
				{
					label: 'Rich enough target',
					data: [],
					backgroundColor: 'transparent',
					borderColor: '#6c757d',
					borderDash: [2, 6],
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

	function updateBaseTable(result) {
		if (!baseTable) {
			return;
		}

		const values = [100000, 500000, 1000000, result.target];
		if (baseReturnLabel) {
			baseReturnLabel.innerHTML = `${percentFormatter.format(result.modestReturn)} return`;
		}
		baseTable.innerHTML = values.map((capital) => (
			`<tr>
				<td>${currencyFormatter.format(capital)}</td>
				<td>${currencyFormatter.format(capital * result.modestReturn)}</td>
			</tr>`
		)).join('');
	}

	function updateRichOnce() {
		const result = calculateRichOnce();
		const incomeGap = result.modestIncome - result.spending;

		targetYear.innerHTML = result.reachedYear === null ? 'Not yet' : `Year ${result.reachedYear}`;
		targetYear.classList.toggle('text-success', result.reachedYear !== null);
		targetYear.classList.toggle('text-danger', result.reachedYear === null);
		modestIncome.innerHTML = currencyFormatter.format(result.modestIncome);
		requiredReturn.innerHTML = percentFormatter.format(result.requiredReturn);
		requiredReturn.classList.toggle('text-success', result.requiredReturn <= result.modestReturn);
		requiredReturn.classList.toggle('text-danger', result.requiredReturn > result.modestReturn);
		incomeGapValue.innerHTML = currencyFormatter.format(incomeGap);
		incomeGapValue.classList.toggle('text-success', incomeGap >= 0);
		incomeGapValue.classList.toggle('text-danger', incomeGap < 0);

		if (onceNote) {
			onceNote.innerHTML = result.reachedYear === null
				? `At ${percentFormatter.format(result.aggressiveReturn)}, the target is not reached within ${result.years} years.`
				: `${currencyFormatter.format(result.target)} at ${percentFormatter.format(result.modestReturn)} produces ${currencyFormatter.format(result.modestIncome)} per year before taxes or inflation.`;
		}
		if (incomeNote) {
			const incomeText = incomeGap >= 0
				? `That covers the ${currencyFormatter.format(result.spending)} spending goal with ${currencyFormatter.format(incomeGap)} left over each year.`
				: `That is ${currencyFormatter.format(Math.abs(incomeGap))} short of the ${currencyFormatter.format(result.spending)} spending goal, so the target or return needs to move.`;
			incomeNote.innerHTML = incomeText;
		}

		updateBaseTable(result);

		richOnceChart.data.labels = result.labels;
		richOnceChart.data.datasets[0].data = result.twoPhaseBalances;
		richOnceChart.data.datasets[1].data = result.targetLine;
		richOnceChart.update();
	}

	richForm.addEventListener('submit', function(event) {
		event.preventDefault();
		updateRichOnce();
	});

	[currentInput, targetInput, spendingInput].forEach((input) => {
		input.addEventListener('input', function() {
			const cursorPosition = input.selectionStart;
			const originalLength = input.value.length;
			formatDollarInput(input);
			const lengthDifference = input.value.length - originalLength;
			input.setSelectionRange(cursorPosition + lengthDifference, cursorPosition + lengthDifference);
			updateRichOnce();
		});
		input.addEventListener('blur', function() {
			formatDollarInput(input);
		});
	});

	[aggressiveReturnInput, modestReturnInput, yearsInput].forEach((input) => {
		input.addEventListener('input', updateRichOnce);
	});

	if (addTargetButton) {
		addTargetButton.addEventListener('click', function() {
			targetInput.value = numberFormatter.format(parseDollarInput(targetInput) + 500000);
			updateRichOnce();
		});
	}

	if (addModestReturnButton) {
		addModestReturnButton.addEventListener('click', function() {
			const maxReturn = Number(modestReturnInput.max) || 20;
			modestReturnInput.value = Math.min((Number(modestReturnInput.value) || 0) + 1, maxReturn);
			updateRichOnce();
		});
	}

	if (resetButton) {
		resetButton.addEventListener('click', function() {
			currentInput.value = numberFormatter.format(defaultValues.current);
			targetInput.value = numberFormatter.format(defaultValues.target);
			aggressiveReturnInput.value = defaultValues.aggressiveReturn;
			modestReturnInput.value = defaultValues.modestReturn;
			spendingInput.value = numberFormatter.format(defaultValues.spending);
			yearsInput.value = defaultValues.years;
			updateRichOnce();
		});
	}

	formatDollarInput(currentInput);
	formatDollarInput(targetInput);
	formatDollarInput(spendingInput);
	updateRichOnce();
})()
