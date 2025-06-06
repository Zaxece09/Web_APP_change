let userid = null

const urlParams = new URLSearchParams(window.location.search)
userid = urlParams.get('userid')

if (!userid) {
	alert('Ошибка: не найден ID пользователя')
	window.location.href = '../index.html'
}

function navigateWithUserId(url) {
	const urlParams = new URLSearchParams(window.location.search)
	const userid = urlParams.get('userid')

	if (userid) {
		const separator = url.includes('?') ? '&' : '?'
		url += separator + 'userid=' + userid
	}

	window.location.href = url
}

window.navigateWithUserId = navigateWithUserId

async function loadTradeHistory() {
	try {
		const response = await fetch(`/api/trades?userid=${userid}`)
		const result = await response.json()

		if (result.success) {
			displayTradeHistory(result.data)
		} else {
			console.error('Ошибка загрузки истории:', result.error)
			displayEmptyHistory()
		}
	} catch (error) {
		console.error('Ошибка при загрузке истории обменов:', error)
		displayEmptyHistory()
	}
}

function displayTradeHistory(trades) {
	const historyContainer = document.querySelector('.history-container')
	
	if (!trades || trades.length === 0) {
		displayEmptyHistory()
		return
	}
	
	trades.forEach(trade => {
		const statusClass = getStatusClass(trade.status)
		const statusIcon = getStatusIcon(trade.status)
		
		const tradeDate = formatTradeDate(trade.created_at)
		
		historyHTML += `
			<div class="trade-item" onclick="showTradeDetails('${trade.trade_id}')">
				<div class="trade-info">
					<h3 class="trade-id">ID: ${trade.trade_id}</h3>
					<p class="trade-date">${tradeDate}</p>
					<p class="trade-amount">${trade.amount_usdt} <img src="../icons/usdt.png" alt="USDT" class="currency-icon"> ➜ ${trade.amount_rub.toFixed(0)} <img src="../icons/rub.png" alt="RUB" class="currency-icon"></p>
					<p class="trade-time">${trade.trade_date} ${trade.trade_time}</p>
				</div>
				<div class="trade-status ${statusClass}">
					${statusIcon} ${trade.status}
				</div>
			</div>
		`
	})
	
	historyContainer.innerHTML = historyHTML
}

function displayEmptyHistory() {
	const historyContainer = document.querySelector('.history-container')
	historyContainer.innerHTML = `
		<div class="empty-history">
			<p>У вас пока нет обменов</p>
			<button onclick="navigateWithUserId('trade.html')" class="empty-btn">Создать первый обмен</button>
		</div>
	`
}

function getStatusClass(status) {
	switch (status) {
		case 'Успех': return 'status-success'
		case 'Ожидание': return 'status-pending'
		case 'Отмена': return 'status-cancelled'
		default: return 'status-pending'
	}
}

function getStatusIcon(status) {
	switch (status) {
		case 'Успех': return '<img src="../icons/success.png" alt="Успех" class="status-icon">'
		case 'Ожидание': return '<img src="../icons/waiting.png" alt="Ожидание" class="status-icon">'
		case 'Отмена': return '<img src="../icons/cancel.png" alt="Отмена" class="status-icon">'
		default: return '<img src="../icons/waiting.png" alt="Ожидание" class="status-icon">'
	}
}

function formatTradeDate(dateString) {
	const date = new Date(dateString)
	const day = date.getDate().toString().padStart(2, '0')
	const month = (date.getMonth() + 1).toString().padStart(2, '0')
	const year = date.getFullYear()
	const hours = date.getHours().toString().padStart(2, '0')
	const minutes = date.getMinutes().toString().padStart(2, '0')
	
	return `${day}.${month}.${year} ${hours}:${minutes}`
}

async function showTradeDetails(tradeId) {
	try {
		const response = await fetch(`/api/trade/${tradeId}`)
		const result = await response.json()

		if (result.success) {
			displayTradeModal(result.data)
		} else {
			alert('Ошибка загрузки деталей обмена')
		}
	} catch (error) {
		console.error('Ошибка при загрузке деталей обмена:', error)
		alert('Произошла ошибка при загрузке деталей')
	}
}

function displayTradeModal(trade) {
	let modal = document.getElementById('tradeDetailsModal')
	if (!modal) {
		modal = document.createElement('div')
		modal.id = 'tradeDetailsModal'
		modal.className = 'modal-overlay'
		document.body.appendChild(modal)
	}

	const statusClass = getStatusClass(trade.status)
	const statusIcon = getStatusIcon(trade.status)
	const createdDate = formatTradeDate(trade.created_at)

	modal.innerHTML = `
		<div class="modal-content trade-details-modal">
			<div class="modal-header">
				<h2>Детали обмена</h2>
				<span class="modal-close" onclick="closeTradeModal()">&times;</span>
			</div>
			<div class="modal-body">
				<div class="detail-row">
					<span class="detail-label">ID:</span>
					<span class="detail-value">${trade.trade_id}</span>
				</div>
				<div class="detail-row">
					<span class="detail-label">Дата и время проведения обмена:</span>
					<span class="detail-value">${trade.trade_date} ${trade.trade_time}</span>
				</div>
				<div class="detail-row">
					<span class="detail-label">USDT:</span>
					<span class="detail-value">${trade.amount_usdt} <img src="../icons/usdt.png" alt="USDT" class="currency-icon"></span>
				</div>
				<div class="detail-row">
					<span class="detail-label">RUB:</span>
					<span class="detail-value">${trade.amount_rub.toFixed(0)} <img src="../icons/rub.png" alt="RUB" class="currency-icon"></span>
				</div>
				<div class="detail-row">
					<span class="detail-label">Имя:</span>
					<span class="detail-value">${trade.user_name || 'Не указано'}</span>
				</div>
				<div class="detail-row">
					<span class="detail-label">E-mail:</span>
					<span class="detail-value">${trade.user_email || 'Не указано'}</span>
				</div>
				<div class="detail-row">
					<span class="detail-label">Адрес проведения сделки:</span>
					<span class="detail-value">${trade.user_address || 'Не указан'}</span>
				</div>
				<div class="detail-row">
					<span class="detail-label">Статус:</span>
					<span class="detail-value status ${statusClass}">${statusIcon} ${trade.status}</span>
				</div>
				<div class="detail-row">
					<span class="detail-label">Создан:</span>
					<span class="detail-value">${createdDate}</span>
				</div>
				${trade.transaction_hash ? `
				<div class="detail-row">
					<span class="detail-label">Хеш транзакции:</span>
					<span class="detail-value" style="word-break: break-all; font-family: monospace; font-size: 0.8rem;">${trade.transaction_hash}</span>
				</div>
				` : ''}
			</div>
		</div>
	`

	modal.style.display = 'flex'
	
	modal.onclick = (e) => {
		if (e.target === modal) {
			closeTradeModal()
		}
	}
}

function closeTradeModal() {
	const modal = document.getElementById('tradeDetailsModal')
	if (modal) {
		modal.style.display = 'none'
	}
}

window.showTradeDetails = showTradeDetails
window.closeTradeModal = closeTradeModal

document.addEventListener('DOMContentLoaded', () => {
	if (window.pageLoader) {
		window.pageLoader.init();
		window.pageLoader.startHistoryProgress();
	}

	loadTradeHistory().then(() => {
		if (window.pageLoader) {
			window.pageLoader.completeProgress();
		}
	}).finally(() => {
		if (window.pageLoader) {
			setTimeout(() => {
				window.pageLoader.hide();
			}, 600);
		}
	});
})
