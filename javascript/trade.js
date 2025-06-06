// Автоматическое разворачивание Telegram WebApp на весь экран
if (window.Telegram && window.Telegram.WebApp) {
    window.Telegram.WebApp.ready();
    window.Telegram.WebApp.expand();
}

document.addEventListener('DOMContentLoaded', () => {
	const tradeForm = document.getElementById('tradeForm')
	const nameInput = document.getElementById('name')
	const phoneInput = document.getElementById('phone')
	const addressInput = document.getElementById('address')
	const dateInput = document.getElementById('date')
	const prevDateBtn = document.getElementById('prevDate')
	const nextDateBtn = document.getElementById('nextDate')
	const timeSlots = document.querySelectorAll('input[name="time"]')

	let userid = null
	const urlParams = new URLSearchParams(window.location.search)
	const userIdFromUrl = urlParams.get('userid') || urlParams.get('user_id')

	if (userIdFromUrl) {
		userid = parseInt(userIdFromUrl)
		console.log('✅ User ID получен из URL:', userid)
	} else if (window.Telegram && window.Telegram.WebApp) {
		window.Telegram.WebApp.ready()
		const webAppData = window.Telegram.WebApp

		if (webAppData.initDataUnsafe?.user?.id) {
			userid = webAppData.initDataUnsafe.user.id
			console.log('✅ User ID получен из Telegram WebApp:', userid)
		} else if (webAppData.initData) {
			try {
				const initDataParams = new URLSearchParams(webAppData.initData)
				const userStr = initDataParams.get('user')
				if (userStr) {
					const userObj = JSON.parse(decodeURIComponent(userStr))
					userid = userObj.id
					console.log('✅ User ID получен парсингом initData:', userid)
				}
			} catch (e) {
				console.error('Ошибка парсинга initData:', e)
			}
		}
	}

	if (!userid) {
		alert(
			'Ошибка: не удалось получить ваш ID. Откройте приложение через /start в боте.'
		)
		return
	}

	console.log('🎯 Используется User ID:', userid);

	function navigateWithUserId(url) {
		const urlParams = new URLSearchParams(window.location.search);
		const userid = urlParams.get('userid');
		
		if (userid) {
			const separator = url.includes('?') ? '&' : '?';
			url += separator + 'userid=' + userid;
		}
		
		window.location.href = url;
	}

	window.navigateWithUserId = navigateWithUserId;

	async function loadProfile() {
		try {
			const response = await fetch(`/api/profile?userid=${userid}`)
			const result = await response.json()

			if (response.ok && result.success && result.data) {
				const profile = result.data
				nameInput.value = profile.name || ''
				phoneInput.value = profile.phone || ''
				addressInput.value = profile.address || ''
				console.log('✅ Профиль загружен')
			} else {
				console.log('📝 Профиль не найден')
				alert('Профиль не найден. Пожалуйста, заполните профиль.')
			}
		} catch (error) {
			console.error('Ошибка загрузки профиля:', error)
			alert('Ошибка загрузки профиля. Попробуйте позже.')
		}
	}

	let currentDate = new Date()
	function updateDateDisplay() {
		const day = String(currentDate.getDate()).padStart(2, '0')
		const month = String(currentDate.getMonth() + 1).padStart(2, '0')
		const year = currentDate.getFullYear()
		dateInput.value = `${day}/${month}/${year}`
	}

	prevDateBtn.addEventListener('click', () => {
		currentDate.setDate(currentDate.getDate() - 1)
		updateDateDisplay()
	})

	nextDateBtn.addEventListener('click', () => {
		currentDate.setDate(currentDate.getDate() + 1)
		updateDateDisplay()
	})

	timeSlots.forEach(slot => {
		slot.addEventListener('change', () => {
			if (slot.checked) {
				timeSlots.forEach(otherSlot => {
					if (otherSlot !== slot) otherSlot.checked = false
				})
			}
		})
	})

	tradeForm.addEventListener('submit', e => {
		e.preventDefault()

		const selectedTime = Array.from(timeSlots).find(slot => slot.checked)?.value
		if (!selectedTime) {
			alert('Пожалуйста, выберите временной интервал.')
			return
		}

		const tradeData = {
			userid: userid,
			name: nameInput.value,
			phone: phoneInput.value,
			address: addressInput.value,
			date: dateInput.value,
			time: selectedTime,
		}

		console.log('Отправка данных обмена:', tradeData)
		alert('Обмен создан! (Данные записаны в консоль)')
	})

	loadProfile()
	updateDateDisplay()
})
