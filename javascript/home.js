window.Telegram.WebApp.ready()
window.Telegram.WebApp.expand()
window.Telegram.WebApp.enableClosingConfirmation()

const tg = window.Telegram.WebApp
const user = tg.initDataUnsafe?.user

function getUrlParameter(name) {
	const urlParams = new URLSearchParams(window.location.search)
	return urlParams.get(name)
}

;(function () {
	const urlParams = new URLSearchParams(window.location.search)
	const isDataLoaded = urlParams.get('loaded') === '1'

	if (isDataLoaded) {
		const style = document.createElement('style')
		style.textContent = `
            #universal-loader { display: none !important; }
            .container { display: flex !important; }
            .bottom-nav { display: flex !important; }
        `
		document.head.appendChild(style)

		window.dataAlreadyLoaded = true
	}
})()

function initSwiper() {
	if (document.querySelector('.swiper-container').swiper) {
		return
	}

	new Swiper('.swiper-container', {
		loop: true,
		pagination: {
			el: '.swiper-pagination',
			clickable: true,
		},
		autoplay: {
			delay: 3000,
			disableOnInteraction: false,
		},
	})
}

async function loadUserData() {
	const loader = window.universalLoader

	try {
		loader.show('Загрузка профиля...')
		loader.setProgress(20, 'Проверка авторизации...')

		const userid = user?.id || getUrlParameter('userid')

		if (!userid) {
			loader.hide()
			window.location.href = '/'
			return
		}

		loader.setProgress(50, 'Загрузка данных...')
		const response = await fetch(`/api/profile?userid=${userid}`)
		const data = await response.json()

		loader.setProgress(80, 'Настройка интерфейса...')

		if (data.success) {
			displayUserInfo(data.data)
			loader.setProgress(100, 'Готово!')
		} else {
			console.error('Failed to load user data:', data.message)
			loader.setProgress(100, 'Ошибка загрузки')
		}

		await loader.delay(300)
		loader.hide()

		document.querySelector('.container').style.display = 'flex'
		document.querySelector('.bottom-nav').style.display = 'flex'
		initSwiper()
	} catch (error) {
		console.error('Error loading user data:', error)
		loader.setProgress(100, 'Ошибка сети')
		await loader.delay(1000)
		loader.hide()

		document.querySelector('.container').style.display = 'flex'
		document.querySelector('.bottom-nav').style.display = 'flex'
		initSwiper()
	}
}

function displayUserInfo(userData) {
	const usernameElement = document.getElementById('username')

	let displayName = ''
	if (userData.username) {
		displayName = '@' + userData.username
	} else if (userData.name) {
		displayName = userData.name
	} else if (userData.first_name) {
		displayName = userData.first_name
	} else {
		displayName = 'Пользователь'
	}

	usernameElement.textContent = displayName
}

async function loadUserDataSilent() {
	try {
		const userid = user?.id || getUrlParameter('userid')

		if (!userid) {
			window.location.href = '/'
			return
		}

		if (window.shouldDisplayDataImmediately) {
			return
		}

		const cachedData = localStorage.getItem('userProfile')
		if (cachedData) {
			try {
				const userData = JSON.parse(cachedData)
				displayUserInfo(userData)

				localStorage.removeItem('userProfile')
				return
			} catch (e) {
				console.error('Error parsing cached profile data:', e)
			}
		}

		const response = await fetch(`/api/profile?userid=${userid}`)
		const data = await response.json()

		if (data.success) {
			displayUserInfo(data.data)
		} else {
			console.error('Failed to load user data:', data.message)
			if (data.message === 'Profile not found') {
				window.location.href = `/?userid=${userid}`
				return
			}
		}
	} catch (error) {
		console.error('Error loading user data:', error)
		const userid = user?.id || getUrlParameter('userid')
		if (userid) {
			window.location.href = `/?userid=${userid}`
			return
		}
	} finally {
		initSwiper()
	}
}

document.addEventListener('DOMContentLoaded', function () {
	const isDataLoaded =
		window.dataAlreadyLoaded || getUrlParameter('loaded') === '1'

	if (isDataLoaded) {
		loadUserDataSilent()
	} else {
		loadUserData()
	}

	document
		.getElementById('referral-btn')
		.addEventListener('click', function () {
			const userid = user?.id || getUrlParameter('userid')
			window.location.href = `/html/REFERAL.html?userid=${userid}`
		})

	document.getElementById('course-btn').addEventListener('click', function () {
		alert('Функция курса валют в разработке')
	})
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
