import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

(() => {
	'use strict'

	const growthAddStepButton = document.getElementById('growth-add-step');
	const growthAddTenButton = document.getElementById('growth-add-ten');
	const growthResetButton = document.getElementById('growth-reset');
	const growthCurrentStep = document.getElementById('growth-current-step');
	const growthPolynomialValue = document.getElementById('growth-polynomial-value');
	const growthExponentialValue = document.getElementById('growth-exponential-value');
	const growthLeader = document.getElementById('growth-leader');
	const growthCrossoverAlert = document.getElementById('growth-crossover-alert');
	const growthCrossoverNote = document.getElementById('growth-crossover-note');
	const growthValuesTable = document.getElementById('growth-values-table');
	const growthComparisonCtx = document.getElementById('growthComparisonChart');
	const growthFormatter = new Intl.NumberFormat('en-US', {
		maximumFractionDigits: 2
	});

	if (!growthAddStepButton || !growthAddTenButton || !growthResetButton || !growthCurrentStep || !growthPolynomialValue || !growthExponentialValue || !growthLeader || !growthValuesTable || !growthComparisonCtx) {
		return;
	}

	const exponentialBase = 1.07;
	const initialStep = 8;
	let growthSteps = Array.from({ length: initialStep }, function(_value, index) {
		return index + 1;
	});

	function calculateGrowthPoint(step) {
		return {
			step,
			polynomial: step ** 2,
			exponential: exponentialBase ** step
		};
	}

	function findGrowthCrossover(points) {
		for (let index = 1; index < points.length; index++) {
			const previousPoint = points[index - 1];
			const currentPoint = points[index];

			if (previousPoint.exponential <= previousPoint.polynomial && currentPoint.exponential > currentPoint.polynomial) {
				return currentPoint;
			}
		}

		return null;
	}

	function formatGrowthValue(value) {
		return growthFormatter.format(value);
	}

	const growthComparisonChart = new Chart(growthComparisonCtx, {
		type: 'line',
		data: {
			labels: [],
			datasets: [
				{
					label: 'Polynomial n^2',
					data: [],
					backgroundColor: 'transparent',
					borderColor: '#0d6efd',
					borderWidth: 4,
					pointBackgroundColor: '#0d6efd'
				},
				{
					label: 'Exponential 1.07^n',
					data: [],
					backgroundColor: 'transparent',
					borderColor: '#198754',
					borderWidth: 4,
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
							return `${context.dataset.label}: ${formatGrowthValue(context.parsed.y)}`;
						}
					}
				}
			},
			scales: {
				x: {
					title: {
						display: true,
						text: 'n'
					}
				},
				y: {
					ticks: {
						callback: function(value) {
							return formatGrowthValue(value);
						}
					}
				}
			}
		}
	});

	function updateGrowthComparison() {
		const points = growthSteps.map(calculateGrowthPoint);
		const currentPoint = points[points.length - 1];
		const crossoverPoint = findGrowthCrossover(points);
		const leader = currentPoint.exponential > currentPoint.polynomial ? 'Exponential' : 'Polynomial';

		growthCurrentStep.innerHTML = currentPoint.step;
		growthPolynomialValue.innerHTML = formatGrowthValue(currentPoint.polynomial);
		growthExponentialValue.innerHTML = formatGrowthValue(currentPoint.exponential);
		growthLeader.innerHTML = leader;
		growthLeader.classList.toggle('text-success', leader === 'Exponential');
		growthLeader.classList.toggle('text-primary', leader === 'Polynomial');

		if (growthCrossoverAlert && growthCrossoverNote) {
			growthCrossoverAlert.classList.toggle('d-none', !crossoverPoint);
			if (crossoverPoint) {
				growthCrossoverNote.innerHTML = `At n = ${crossoverPoint.step}, 1.07^n reaches ${formatGrowthValue(crossoverPoint.exponential)} while n^2 is ${formatGrowthValue(crossoverPoint.polynomial)}.`;
			}
		}

		growthValuesTable.innerHTML = points.slice(-8).reverse().map((point) => (
			`<tr>
				<th scope="row">${point.step}</th>
				<td>${formatGrowthValue(point.polynomial)}</td>
				<td>${formatGrowthValue(point.exponential)}</td>
			</tr>`
		)).join('');

		growthComparisonChart.data.labels = points.map((point) => point.step);
		growthComparisonChart.data.datasets[0].data = points.map((point) => point.polynomial);
		growthComparisonChart.data.datasets[1].data = points.map((point) => point.exponential);
		growthComparisonChart.update();
	}

	growthAddStepButton.addEventListener('click', function() {
		growthSteps.push(growthSteps[growthSteps.length - 1] + 1);
		updateGrowthComparison();
	});

	growthAddTenButton.addEventListener('click', function() {
		for (let i = 0; i < 10; i++) {
			growthSteps.push(growthSteps[growthSteps.length - 1] + 1);
		}
		updateGrowthComparison();
	});

	growthResetButton.addEventListener('click', function() {
		growthSteps = Array.from({ length: initialStep }, function(_value, index) {
			return index + 1;
		});
		updateGrowthComparison();
	});

	updateGrowthComparison();
})()
