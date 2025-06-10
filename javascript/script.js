document.addEventListener('DOMContentLoaded', () => {
	const startButton = document.getElementById('startButton')

	if (startButton) {
		startButton.addEventListener('click', () => {
			console.log('Button clicked!')
			window.location.href = '/html/FORM-START.html'
		})
	}
})
