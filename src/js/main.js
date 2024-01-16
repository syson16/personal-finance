import _ from 'lodash';

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

// document.body.appendChild(component());
// document.body.appendChild(jsonText());

/* globals Chart:false */

(() => {
	'use strict'
  
	// Graphs
	const ctx = document.getElementById('myChart')
	// eslint-disable-next-line no-unused-vars
	const myChart = new Chart(ctx, {
	  type: 'line',
	  data: {
		labels: [
		  'Sunday',
		  'Monday',
		  'Tuesday',
		  'Wednesday',
		  'Thursday',
		  'Friday',
		  'Saturday'
		],
		datasets: [{
		  data: [
			15339,
			21345,
			18483,
			24003,
			23489,
			24092,
			12034
		  ],
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
		  }
		}
	  }
	})
  })()
  