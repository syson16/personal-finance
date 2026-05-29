import { Chart, registerables } from 'chart.js';
import annotationPlugin from 'chartjs-plugin-annotation';

Chart.register(...registerables);
Chart.register(annotationPlugin);

(() => {
	'use strict'

	const startingBudget = 100;
	const winProbability = 0.5;
	const winAmount = 30;
	const lossAmount = 30;
	let cols = [0];
	let res = [startingBudget];
	const budgetText = document.getElementById('total-budget');
	const gamblerResultBtn = document.getElementById('gambler-result');
	const ctx = document.getElementById('myChart')
	const gamblerBtn = document.getElementById('gambler-run');
	const gamblerOneTimeBtn = document.getElementById('gambler-onetime-run');
	const gamblerResetBtn = document.getElementById('gambler-reset');
	const gamblerDeadOverlay = document.getElementById('gambler-dead-overlay');
	const gamblerDeadResetBtn = document.getElementById('gambler-dead-reset');
	const gamblerWinProbability = document.getElementById('gambler-win-probability');
	const gamblerLossProbability = document.getElementById('gambler-loss-probability');
	const gamblerWinAmount = document.getElementById('gambler-win-amount');
	const gamblerLossAmount = document.getElementById('gambler-loss-amount');

	if (!budgetText || !gamblerResultBtn || !ctx || !gamblerBtn || !gamblerOneTimeBtn || !gamblerResetBtn) {
		return;
	}

	function budgetUpdate() {
		let currentBudget = res[res.length - 1];

		budgetText.classList.toggle("text-primary", currentBudget > 0);
		budgetText.classList.toggle("text-danger", currentBudget <= 0);

		if (currentBudget > 0) {
			budgetText.innerHTML = "$" + currentBudget;
		} else {
			currentBudget = -1 * currentBudget;
			budgetText.innerHTML = "-$" + currentBudget;
		}
	}

	function formatBudget(value) {
		if (value < 0) {
			return `-$${Math.abs(value)}`;
		}
		return `$${value}`;
	}

	function updateGamblerRules() {
		if (gamblerWinProbability) {
			gamblerWinProbability.innerHTML = `${winProbability * 100}%`;
		}
		if (gamblerLossProbability) {
			gamblerLossProbability.innerHTML = `${(1 - winProbability) * 100}%`;
		}
		if (gamblerWinAmount) {
			gamblerWinAmount.innerHTML = `+$${winAmount}`;
		}
		if (gamblerLossAmount) {
			gamblerLossAmount.innerHTML = `-$${lossAmount}`;
		}
	}

	function isGamblerDead() {
		return res[res.length - 1] <= 0;
	}

	function updateGamblerControls() {
		if (isGamblerDead()) {
			gamblerBtn.disabled = true;
			gamblerOneTimeBtn.disabled = true;
			if (gamblerDeadOverlay) {
				gamblerDeadOverlay.classList.remove("d-none");
			}
			gamblerResultBtn.classList.remove("btn-secondary");
			gamblerResultBtn.classList.remove("btn-success");
			gamblerResultBtn.classList.remove("btn-danger");
			gamblerResultBtn.classList.add("btn-danger");
			gamblerResultBtn.innerHTML = "YOU DIED";
		} else {
			gamblerBtn.disabled = false;
			gamblerOneTimeBtn.disabled = false;
			if (gamblerDeadOverlay) {
				gamblerDeadOverlay.classList.add("d-none");
			}
		}
	}

	function addColumnOneTime(cols) {
		cols.push(cols[cols.length - 1] + 1);

		return cols
	}

	function flipCoinOneTime(res) {
		if (isGamblerDead()) {
			return res;
		}

		gamblerResultBtn.classList.remove("btn-secondary");
		gamblerResultBtn.classList.remove("btn-success");
		gamblerResultBtn.classList.remove("btn-danger");

		if (Math.random() < winProbability) {
			res.push(res[res.length - 1] + winAmount);
			gamblerResultBtn.classList.add("btn-success");
			gamblerResultBtn.innerHTML = "WIN";
		} else {
			res.push(res[res.length - 1] - lossAmount);
			gamblerResultBtn.classList.add("btn-danger");
			gamblerResultBtn.innerHTML = "LOSE";
		}

		updateGamblerControls();

		return res
	}

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
			interaction: {
				mode: 'index',
				intersect: false
			},
			plugins: {
				legend: {
					display: false
				},
				tooltip: {
					mode: 'index',
					intersect: false,
					boxPadding: 3,
					callbacks: {
						title: function(context) {
							return `Flip ${context[0].label}`;
						},
						label: function(context) {
							return `Bankroll: ${formatBudget(context.parsed.y)}`;
						}
					}
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
			scales: {
				y: {
					ticks: {
						callback: function(value) {
							return formatBudget(value);
						}
					}
				}
			}
		}
	})

	function resetGambler() {
		cols = [0];
		res = [startingBudget];
		gamblerResultBtn.classList.remove("btn-success");
		gamblerResultBtn.classList.remove("btn-danger");
		gamblerResultBtn.classList.add("btn-secondary");
		gamblerResultBtn.innerHTML = "START";
		myChart.data.datasets.forEach((dataset) => {
			dataset.data = res;
		});
		myChart.data.labels = cols;
		myChart.update();
		budgetUpdate()
		updateGamblerControls()
	}

	budgetUpdate()
	updateGamblerRules()
	updateGamblerControls()

	gamblerOneTimeBtn.addEventListener("click", function() {
		addColumnOneTime(cols)
		flipCoinOneTime(res)
		myChart.update();
		budgetUpdate()
	});

	gamblerResetBtn.addEventListener("click", resetGambler);

	if (gamblerDeadResetBtn) {
		gamblerDeadResetBtn.addEventListener("click", resetGambler);
	}

	gamblerBtn.addEventListener("click", function() {
		for (let i = 0; i < 10; i++) {
			if (isGamblerDead()) {
				break;
			}
			addColumnOneTime(cols)
			flipCoinOneTime(res)
		}
		myChart.update();
		budgetUpdate()
	});
})()
