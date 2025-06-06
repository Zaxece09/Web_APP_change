// Автоматическое разворачивание Telegram WebApp на весь экран
if (window.Telegram && window.Telegram.WebApp) {
    window.Telegram.WebApp.ready();
    window.Telegram.WebApp.expand();
}

function convertUSDTtoRUB() {
	const usdtInput = document.getElementById('usdt-input').value
	const rubInput = document.getElementById('rub-input')
	const exchangeRate = 90
	if (usdtInput && !isNaN(usdtInput) && usdtInput >= 0) {
		const rubAmount = (usdtInput * exchangeRate).toFixed(2)
		rubInput.value = rubAmount
	} else {
		rubInput.value = ''
		alert('Please enter a valid USDT amount.')
	}
}
