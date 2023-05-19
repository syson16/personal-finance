import _ from 'lodash';

const json = require('./json/sample.json');

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

document.body.appendChild(component());
document.body.appendChild(jsonText());