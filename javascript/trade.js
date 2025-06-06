document.addEventListener('DOMContentLoaded', () => {
	if (window.pageLoader) {
		window.pageLoader.init();
		window.pageLoader.startTradeProgress();
	}

	const tradeForm = document.getElementById('tradeForm')
	const nameInput = document.getElementById('name')
	const phoneInput = document.getElementById('phone')
	const addressInput = document.getElementById('address')
	const dateInput = document.getElementById('date')
	const prevDateBtn = document.getElementById('prevDate')
	const nextDateBtn = document.getElementById('nextDate')
	const timeSlots = document.querySelectorAll('input[name="time"]')
	const amountInput = document.getElementById('amount')

	const modalOverlay = document.querySelector('.modal-overlay')
	const modalUsdtAddressElem = document.getElementById('modalUsdtAddress')
	const modalAmountElem = document.getElementById('modalAmount')
	const modalCloseBtn = document.getElementById('modalCloseBtn')
	const transactionHashInput = document.getElementById('transactionHash')
	const copyAddressBtn = document.getElementById('copyAddressBtn')

	let userid = null
	let currentTradeId = null

	if (modalOverlay) {
		modalOverlay.classList.remove('active')
	}

	const urlParams = new URLSearchParams(window.location.search)
	userid = urlParams.get('userid')

	if (!userid) {
		alert('Ошибка: не найден ID пользователя')
		return
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

	async function loadProfile() {
		try {
			const response = await fetch(`/api/profile?userid=${userid}`)
			const result = await response.json()

			if (result.success && result.data) {
				const profile = result.data
				nameInput.value = profile.name || ''
				phoneInput.value = profile.phone || ''
				addressInput.value = profile.address || ''
			} else {
				console.log('Профиль не найден, поля остаются пустыми')
			}
		} catch (error) {
			console.error('Ошибка при загрузке профиля:', error)
		}
	}

	async function checkUserStatus() {
		try {
			const response = await fetch(`/api/user-status?userid=${userid}`)
			const result = await response.json()

			if (result.success && result.data) {
				const status = result.data
				
				if (status.has_pending_trades) {
					disableTradeForm(status.pending_trade_id)
				} else {
					enableTradeForm()
				}
				
				return status.can_create_trade
			} else {
				console.error('Ошибка проверки статуса:', result.error)
				return true
			}
		} catch (error) {
			console.error('Ошибка при проверке статуса пользователя:', error)
			return true
		}
	}

	function disableTradeForm(pendingTradeId) {
		const form = document.getElementById('tradeForm')
		const submitBtn = form.querySelector('.submit-btn')
		const inputs = form.querySelectorAll('input:not([readonly]), button:not(.submit-btn)')
		
		inputs.forEach(input => {
			input.disabled = true
		})
		
		submitBtn.textContent = 'У вас есть активная сделка'
		submitBtn.disabled = true
		submitBtn.style.background = '#ccc'
		submitBtn.style.cursor = 'not-allowed'
		
		showPendingTradeWarning(pendingTradeId)
	}

	function enableTradeForm() {
		const form = document.getElementById('tradeForm')
		const submitBtn = form.querySelector('.submit-btn')
		const inputs = form.querySelectorAll('input:not([readonly]), button:not(.submit-btn)')
		
		inputs.forEach(input => {
			input.disabled = false
		})
		
		submitBtn.textContent = 'Создать обмен'
		submitBtn.disabled = false
		submitBtn.style.background = ''
		submitBtn.style.cursor = ''
		
		hidePendingTradeWarning()
	}

	function showPendingTradeWarning(tradeId) {
		let warning = document.getElementById('pendingTradeWarning')
		if (!warning) {
			warning = document.createElement('div')
			warning.id = 'pendingTradeWarning'
			warning.className = 'pending-trade-warning'
			warning.innerHTML = `
				<div class="warning-content">
					<img src="../icons/warning.png" alt="Предупреждение" class="warning-icon">
					<div class="warning-text">
						<h3>У вас есть активная сделка</h3>
						<p>ID сделки: <strong>${tradeId}</strong></p>
						<p>Дождитесь завершения текущей сделки перед созданием новой.</p>
						<button onclick="navigateWithUserId('history.html')" class="view-trade-btn">Посмотреть сделку</button>
					</div>
				</div>
			`
			
			const container = document.querySelector('.container')
			container.insertBefore(warning, container.querySelector('.trade-form'))
		}
	}

	function hidePendingTradeWarning() {
		const warning = document.getElementById('pendingTradeWarning')
		if (warning) {
			warning.remove()
		}
	}

	const today = new Date()
	let selectedDate = new Date(today)

	function formatDate(date) {
		const day = date.getDate().toString().padStart(2, '0')
		const month = (date.getMonth() + 1).toString().padStart(2, '0')
		const year = date.getFullYear()
		return `${day}.${month}.${year}`
	}

	function updateDateDisplay() {
		dateInput.value = formatDate(selectedDate)
		updateTimeSlots()
	}

	async function loadOccupiedSlots(date) {
		try {
			const response = await fetch(`/api/occupied-slots?date=${encodeURIComponent(date)}`)
			const result = await response.json()
			
			if (result.success) {
				return result.data || []
			} else {
				console.error('Ошибка загрузки занятых слотов:', result.error)
				return []
			}
		} catch (error) {
			console.error('Ошибка при загрузке занятых слотов:', error)
			return []
		}
	}

	async function updateTimeSlots() {
		const currentDate = formatDate(selectedDate)
		const occupiedSlots = await loadOccupiedSlots(currentDate)
		
		timeSlots.forEach(slot => {
			const timeValue = slot.value
			const isOccupied = occupiedSlots.includes(timeValue)
			
			if (isOccupied) {
				slot.disabled = true
				slot.checked = false
				slot.parentElement.classList.add('disabled')
				slot.parentElement.title = 'Это время уже занято'
			} else {
				slot.disabled = false
				slot.parentElement.classList.remove('disabled')
				slot.parentElement.title = ''
			}
		})
	}

	prevDateBtn.addEventListener('click', () => {
		selectedDate.setDate(selectedDate.getDate() - 1)
		updateDateDisplay()
	})

	nextDateBtn.addEventListener('click', () => {
		selectedDate.setDate(selectedDate.getDate() + 1)
		updateDateDisplay()
	})

	updateDateDisplay()

	tradeForm.addEventListener('submit', async (e) => {
		e.preventDefault()

		const canCreate = await checkUserStatus()
		if (!canCreate) {
			alert('У вас уже есть активная сделка в ожидании. Дождитесь её завершения.')
			return
		}

		if (!amountInput.value) {
			alert('Пожалуйста, введите сумму в USDT')
			amountInput.focus()
			return
		}

		const amount = parseFloat(amountInput.value)
		if (isNaN(amount) || amount <= 0) {
			alert('Пожалуйста, введите корректную сумму больше 0')
			amountInput.focus()
			return
		}

		if (amount < 10) {
			alert('Минимальная сумма для обмена: 10 USDT')
			amountInput.focus()
			return
		}

		if (amount > 50000) {
			alert('Максимальная сумма для обмена: 50,000 USDT')
			amountInput.focus()
			return
		}

		const selectedTime = document.querySelector('input[name="time"]:checked')
		if (!selectedTime) {
			alert('Пожалуйста, выберите время для обмена')
			return
		}

		if (!nameInput.value || !phoneInput.value || !addressInput.value) {
			alert('Пожалуйста, сначала заполните профиль во вкладке "Профиль"')
			return
		}

		const submitBtn = tradeForm.querySelector('.submit-btn')
		const originalBtnText = submitBtn.textContent
		submitBtn.textContent = 'Создание обмена...'
		submitBtn.disabled = true

		const tradeData = {
			userid: userid,
			amount: amount,
			date: dateInput.value,
			time: selectedTime.value
		}

		try {
			console.log('Создание обмена:', tradeData)
			
			const response = await fetch('/api/trade', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(tradeData)
			})

			const result = await response.json()

			if (result.success && result.data) {
				currentTradeId = result.data.trade_id
				
				modalUsdtAddressElem.textContent = result.data.usdt_address
				modalAmountElem.textContent = `${parseFloat(result.data.amount_usdt).toFixed(2)} USDT`
				
				transactionHashInput.value = ''
				
				modalOverlay.classList.add('active')
				
				console.log('Обмен успешно создан:', currentTradeId)
			} else {
				alert('Ошибка при создании обмена: ' + (result.error || 'Неизвестная ошибка'))
			}
		} catch (error) {
			console.error('Ошибка при создании обмена:', error)
			alert('Произошла ошибка при создании обмена. Проверьте подключение к интернету.')
		} finally {
			submitBtn.textContent = originalBtnText
			submitBtn.disabled = false
		}
	})

	function validateTransactionHash(hash) {
		const hexRegex = /^[a-fA-F0-9]{64}$/
		return hexRegex.test(hash)
	}

	modalCloseBtn.addEventListener('click', async () => {
		const txHash = transactionHashInput.value.trim()
		if (!txHash) {
			alert('Пожалуйста, введите хеш транзакции.')
			transactionHashInput.focus()
			return
		}

		if (!validateTransactionHash(txHash)) {
			alert('Некорректный хеш транзакции. Хеш должен содержать 64 символа (0-9, a-f).')
			transactionHashInput.focus()
			return
		}

		if (!currentTradeId) {
			alert('Ошибка: не найден ID обмена')
			return
		}

		try {
			const response = await fetch(`/api/trade/${currentTradeId}/complete`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					transaction_hash: txHash
				})
			})

			const result = await response.json()

			if (result.success) {
				alert(`Хеш транзакции сохранен! Обмен ${currentTradeId} создан и находится в обработке.`)
				modalOverlay.classList.remove('active')
				
				amountInput.value = ''
				document.querySelectorAll('input[name="time"]').forEach(radio => radio.checked = false)
				transactionHashInput.value = ''
				currentTradeId = null
				
			} else {
				alert('Ошибка при завершении обмена: ' + result.error)
			}
		} catch (error) {
			console.error('Ошибка при завершении обмена:', error)
			alert('Произошла ошибка при завершении обмена')
		}
	})

	modalOverlay.addEventListener('click', (event) => {
		if (event.target === modalOverlay) {
			if (confirm('Вы уверены, что хотите закрыть окно? Обмен не будет создан.')) {
				modalOverlay.classList.remove('active')
				currentTradeId = null
			}
		}
	})

	if (copyAddressBtn && modalUsdtAddressElem) {
		copyAddressBtn.addEventListener('click', async () => {
			const addressToCopy = modalUsdtAddressElem.textContent
			if (addressToCopy && addressToCopy !== 'ТУТ_БУДЕТ_АДРЕС_USDT') {
				try {
					await navigator.clipboard.writeText(addressToCopy)
					alert('Адрес скопирован в буфер обмена!')
				} catch (err) {
					console.error('Ошибка копирования адреса: ', err)
					alert('Не удалось скопировать адрес. Попробуйте вручную.')
				}
			} else {
				alert('Нет адреса для копирования.')
			}
		})
	}

	Promise.all([
		loadProfile(),
		checkUserStatus(),
		updateTimeSlots()
	]).then(() => {
		if (window.pageLoader) {
			window.pageLoader.completeProgress();
		}
		setTimeout(() => {
			if (window.pageLoader) {
				window.pageLoader.hide();
			}
		}, 600);
	}).catch((error) => {
		console.error('Ошибка при инициализации:', error);
		if (window.pageLoader) {
			window.pageLoader.completeProgress();
			setTimeout(() => {
				window.pageLoader.hide();
			}, 600);
		}
	});
})
