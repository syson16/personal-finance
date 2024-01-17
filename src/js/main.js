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

	Chart.register(...registerables);
	Chart.register(annotationPlugin);

	let cols = [0];
	let res = [100];

	function flipCoinOneTime(res) {
		
		if(flipCoin()) {
			res.push(res[res.length - 1] + 30);
		} else {
			res.push(res[res.length - 1] - 30);
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

	// Graphs
	const ctx = document.getElementById('myChart')

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

	const gamblerBtn = document.getElementById('gambler-run');
	const gamblerOneTimeBtn = document.getElementById('gambler-onetime-run');
	const gamblerResetBtn = document.getElementById('gambler-reset');

	gamblerOneTimeBtn.addEventListener("click", function() {
		addColumnOneTime(cols)
		flipCoinOneTime(res)
		myChart.update();
	});

	gamblerResetBtn.addEventListener("click", function() {
		cols = [0];
		res = [100];
		myChart.data.datasets.forEach((dataset) => {
			dataset.data = res;
		});
		myChart.data.labels = cols;
		myChart.update();
	});

	gamblerBtn.addEventListener("click", function() {
		for(let i = 0; i < 10; i++) {
			addColumnOneTime(cols)
			flipCoinOneTime(res)
		}
		myChart.update();
	});
  })()
  