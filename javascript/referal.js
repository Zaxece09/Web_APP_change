window.Telegram.WebApp.ready()
window.Telegram.WebApp.expand()

const tg = window.Telegram.WebApp
const user = tg.initDataUnsafe?.user

function getUrlParameter(name) {
	const urlParams = new URLSearchParams(window.location.search)
	return urlParams.get(name)
}

async function loadReferralData() {
	const loader = window.universalLoader

	try {
		loader.show('Загрузка реферальной системы...')
		loader.setProgress(20, 'Проверка авторизации...')

		const userid = user?.id || getUrlParameter('userid')
		console.log('Loading referral data for userid:', userid)

		if (!userid) {
			console.error('No userid found')
			loader.hide()
			window.location.href = '/'
			return
		}

		loader.setProgress(40, 'Загрузка статистики...')
		
		const [referralDataResponse, configResponse] = await Promise.all([
			fetch(`/api/referral/stats?userid=${userid}`),
			fetch('/api/config'),
			loader.delay(800)
		])
		
		loader.setProgress(70, 'Обработка данных...')
		
		const [referralData, configData] = await Promise.all([
			referralDataResponse.json(),
			configResponse.json()
		])
		
		console.log('Referral API Response:', referralData)
		console.log('Config response:', configData)

		loader.setProgress(90, 'Настройка интерфейса...')
		
		let displayData
		if (referralData.success) {
			displayData = referralData
		} else {
			console.error('API returned error:', referralData.error)
			displayData = {
				referral_code: 'DEFAULT',
				referral_count: 0,
				referral_earnings: 0
			}
		}
		
		loader.setProgress(100, 'Готово!')
		await loader.delay(200)
		
		document.querySelector('.container').style.display = 'flex'
		document.querySelector('.bottom-nav').style.display = 'flex'
		
		loader.hide()
		
		await displayReferralData(displayData, configData)
		
	} catch (error) {
		console.error('Error loading referral data:', error)
		loader.setProgress(100, 'Ошибка сети')
		await loader.delay(500)
		
		document.querySelector('.container').style.display = 'flex'
		document.querySelector('.bottom-nav').style.display = 'flex'
		
		loader.hide()

		await displayReferralData({
			referral_code: 'DEFAULT',
			referral_count: 0,
			referral_earnings: 0
		})
	}
}

async function displayReferralData(data, configData = null) {
	console.log('Displaying referral data:', data)

	const countElement = document.getElementById('referral-count')
	if (countElement) {
		countElement.textContent = data.referral_count || 0
	}

	let botUsername = 'Ajnsfgsinjh1243_bot'
	if (configData && configData.success) {
		botUsername = configData.bot_username
	} else {
		botUsername = await getBotUsername()
	}
	
	const referralCodeToUse = data.referral_code || 'DEFAULT'
	
	if (referralCodeToUse && referralCodeToUse !== 'ERROR') {
		const referralLink = `https://t.me/${botUsername.replace('@', '')}?start=ref${referralCodeToUse}`
		const linkElement = document.getElementById('referral-link')
		if (linkElement) {
			linkElement.value = referralLink
		}
		console.log('Generated referral link:', referralLink)
	} else {
		const linkElement = document.getElementById('referral-link')
		if (linkElement) {
			linkElement.value = 'Ошибка загрузки ссылки'
		}
	}
}

async function getBotUsername() {
	try {
		const response = await fetch('/api/config')
		const data = await response.json()
		console.log('Config response:', data)
		return data.success ? data.bot_username : 'Ajnsfgsinjh1243_bot'
	} catch (error) {
		console.error('Error getting bot username:', error)
		return 'Ajnsfgsinjh1243_bot'
	}
}

function copyReferralLink() {
	const referralInput = document.getElementById('referral-link')
	const referralLink = referralInput.value

	if (referralLink === 'Загрузка...' || referralLink === 'Ошибка загрузки ссылки') {
		showNotification('Ссылка еще не загружена')
		return
	}

	if (navigator.clipboard) {
		navigator.clipboard
			.writeText(referralLink)
			.then(() => {
				showNotification('Реферальная ссылка скопирована!')
			})
			.catch(err => {
				console.error('Failed to copy: ', err)
				fallbackCopyTextToClipboard(referralLink)
			})
	} else {
		fallbackCopyTextToClipboard(referralLink)
	}
}

function fallbackCopyTextToClipboard(text) {
	const textArea = document.createElement('textarea')
	textArea.value = text
	textArea.style.top = '0'
	textArea.style.left = '0'
	textArea.style.position = 'fixed'

	document.body.appendChild(textArea)
	textArea.focus()
	textArea.select()

	try {
		const successful = document.execCommand('copy')
		if (successful) {
			showNotification('Реферальная ссылка скопирована!')
		} else {
			showNotification('Не удалось скопировать ссылку')
		}
	} catch (err) {
		console.error('Fallback: Oops, unable to copy', err)
		showNotification('Не удалось скопировать ссылку')
	}

	document.body.removeChild(textArea)
}

function showNotification(message) {
	const notification = document.createElement('div')
	notification.className = 'notification'
	notification.textContent = message
	notification.style.cssText = `
		position: fixed;
		top: 20px;
		left: 50%;
		margin-top: 60px;
		transform: translateX(-50%);
		background: var(--tg-theme-bg-color, #ffffff);
		color: var(--tg-theme-text-color, #000000);
		padding: 12px 20px;
		border-radius: 8px;
		box-shadow: 0 4px 12px rgba(0,0,0,0.15);
		z-index: 1000;
		font-size: 14px;
		border: 1px solid var(--tg-theme-hint-color, #cccccc);
	`
	document.body.appendChild(notification)

	setTimeout(() => {
		if (notification.parentNode) {
			notification.parentNode.removeChild(notification)
		}
	}, 3000)
}

function shareReferralLink() {
	const referralLink = document.getElementById('referral-link').value
	
	if (referralLink === 'Загрузка...' || referralLink === 'Ошибка загрузки ссылки') {
		showNotification('Ссылка еще не загружена')
		return
	}

	const shareText = `\n🚀 Присоединяйся к лучшему криптообменнику! 
    
💰 Выгодные курсы обмена
🔒 Безопасные сделки  
⚡ Быстрые переводы`

	if (tg.openTelegramLink) {
		tg.openTelegramLink(
			`https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(shareText)}`
		)
	} else {
		window.open(
			`https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(shareText)}`,
			'_blank'
		)
	}
}

async function goHome() {
	const loader = window.universalLoader
	
	try {
		if (loader) {
			if (!loader.isVisible()) {
				loader.show('Переход на профиль...')
			} else {
				loader.setProgress(loader.getProgress(), 'Переход на профиль...')
			}
			
			loader.setProgress(0, 'Инициализация...')
			await loader.delay(100)
			
			loader.setProgress(20, 'Проверка авторизации...')
		}

		const userid = user?.id || getUrlParameter('userid')
		
		if (!userid) {
			if (loader) loader.hide()
			window.location.href = '/'
			return
		}

		if (loader) {
			loader.setProgress(50, 'Загрузка данных профиля...')
		}
		
		try {
			const response = await fetch(`/api/profile?userid=${userid}`)
			const profileData = await response.json()
			
			if (profileData.success) {
				localStorage.setItem('userProfile', JSON.stringify(profileData.data))
			}
		} catch (error) {
			console.error('Error preloading profile data:', error)
		}

		if (loader) {
			loader.setProgress(80, 'Настройка интерфейса...')
			await loader.delay(200)
			
			loader.setProgress(100, 'Переход...')
			await loader.delay(500)
			
			loader.hide()
		}
		
		window.location.href = `/html/home.html?userid=${userid}&loaded=1`
		
	} catch (error) {
		console.error('Error navigating to home:', error)
		if (loader) loader.hide()
		
		const userid = user?.id || getUrlParameter('userid')
		if (userid) {
			window.location.href = `/html/home.html?userid=${userid}&loaded=1`
		} else {
			window.location.href = '/'
		}
	}
}

document.addEventListener('DOMContentLoaded', function () {
	console.log('DOM loaded, starting referral system...')
	
	loadReferralData()

	const copyBtn = document.getElementById('copy-btn')
	const shareBtn = document.getElementById('share-btn')
	const okBtn = document.getElementById('ok-btn')
	
	if (copyBtn) copyBtn.addEventListener('click', copyReferralLink)
	if (shareBtn) shareBtn.addEventListener('click', shareReferralLink)
	if (okBtn) okBtn.addEventListener('click', goHome)

	const userid = user?.id || getUrlParameter('userid')
	if (userid) {
		const tradeNav = document.getElementById('trade-nav')
		const historyNav = document.getElementById('history-nav')
		const profileNav = document.getElementById('profile-nav')
		
		if (tradeNav) tradeNav.href = `/html/TRADE.html?userid=${userid}`
		if (historyNav) historyNav.href = `/html/history.html?userid=${userid}`
		if (profileNav) profileNav.href = `/html/home.html?userid=${userid}&loaded=1`
	}
})

if (tg.themeParams) {
	document.documentElement.style.setProperty(
		'--tg-theme-bg-color',
		tg.themeParams.bg_color
	)
	document.documentElement.style.setProperty(
		'--tg-theme-text-color',
		tg.themeParams.text_color
	)
	document.documentElement.style.setProperty(
		'--tg-theme-hint-color',
		tg.themeParams.hint_color
	)
	document.documentElement.style.setProperty(
		'--tg-theme-link-color',
		tg.themeParams.link_color
	)
	document.documentElement.style.setProperty(
		'--tg-theme-button-color',
		tg.themeParams.button_color
	)
	document.documentElement.style.setProperty(
		'--tg-theme-button-text-color',
		tg.themeParams.button_text_color
	)
}
