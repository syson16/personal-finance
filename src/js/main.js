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

	function flipCoinMultipleTime(n) {
		let res = [];

		for(let i = 0; i < n; i++) {
			if(flipCoin()) {
				res.push(1);
			} else {
				res.push(-1);
			}
		}

		return res
	}

	function flipCoinMultipleTimeColumns(n) {
		let cols = [];

		for(let i = 0; i < n + 1; i++) {
			cols.push(i)
		}

		return cols
	}
	
	let coinFlipNumber = 500;
	let result = flipCoinMultipleTime(coinFlipNumber);
	let columns = flipCoinMultipleTimeColumns(coinFlipNumber);

	// Graphs
	const ctx = document.getElementById('myChart')

	let start = 10

	let totalResult = result.reduce((accumulator, currentValue) => {
		let newVal = accumulator[accumulator.length - 1] + currentValue
		accumulator.push(newVal)
		return accumulator
		}
		,
		[start]
	)


	// eslint-disable-next-line no-unused-vars
	const myChart = new Chart(ctx, {
	  type: 'line',
	  data: {
		labels: columns,
		datasets: [{
		  data: totalResult,
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
  })()
  