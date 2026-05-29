// Import our custom CSS
import '../scss/styles.scss'

// Import all of Bootstrap's JS
import 'bootstrap'

// Import JS files
import './color-modes.js'

(() => {
	'use strict'

	const currentPage = window.location.pathname.split('/').pop() || 'index.html';

	document.querySelectorAll('.sidebar .nav-link').forEach((link) => {
		const linkPage = link.getAttribute('href').replace('./', '');
		const isActive = linkPage === currentPage;

		link.classList.toggle('active', isActive);
		if (isActive) {
			link.setAttribute('aria-current', 'page');
		} else {
			link.removeAttribute('aria-current');
		}
	});
})()
