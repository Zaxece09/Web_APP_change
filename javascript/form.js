window.Telegram.WebApp.ready()
window.Telegram.WebApp.expand()

const tg = window.Telegram.WebApp
const user = tg.initDataUnsafe?.user

function getUrlParameter(name) {
	const urlParams = new URLSearchParams(window.location.search)
	return urlParams.get(name)
}

let selectedFile = null

function showModal(modalId) {
	document.getElementById(modalId).style.display = 'flex'
}

function hideModal(modalId) {
	document.getElementById(modalId).style.display = 'none'
}

function showError(message) {
	document.getElementById('errorMessage').textContent = message
	showModal('errorModal')
}

function formatPhoneNumber(value) {
	const numbers = value.replace(/\D/g, '')

	let formatted = numbers.startsWith('8') ? '7' + numbers.slice(1) : numbers
	
	if (formatted.length > 11) {
		formatted = formatted.slice(0, 11)
	}

	if (formatted.startsWith('7') && formatted.length <= 11) {
		const match = formatted.match(/^7(\d{0,3})(\d{0,3})(\d{0,2})(\d{0,2})$/)
		if (match) {
			let result = '+7'
			if (match[1]) {
				result += ` (${match[1]}`
				if (match[1].length === 3) {
					result += ') '
					if (match[2]) result += `${match[2]}`
					if (match[3]) result += `-${match[3]}`
					if (match[4]) result += `-${match[4]}`
				}
			}
			return result
		}
	}

	return value
}

function getCleanPhoneNumber(formattedPhone) {
	const numbers = formattedPhone.replace(/\D/g, '')
	return numbers.startsWith('8') ? '7' + numbers.slice(1) : numbers
}

function isValidEmail(email) {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
	return emailRegex.test(email)
}

async function submitProfile(profileData) {
	try {
		const userid = user?.id || getUrlParameter('userid')

		if (!userid) {
			throw new Error('User ID not found')
		}

		const dataToSend = {
			userid: userid,
			name: profileData.name,
			phone: profileData.phone,
			phone_additional: profileData.phone_additional || '',
			email: profileData.email,
		}

		const response = await fetch('/api/profile', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(dataToSend),
		})

		const data = await response.json()

		if (!data.success) {
			throw new Error(data.error || 'Failed to save profile')
		}

		return data
	} catch (error) {
		console.error('Error submitting profile:', error)
		throw error
	}
}

async function uploadPassport() {
	if (!selectedFile) {
		return true
	}

	try {
		const userid = user?.id || getUrlParameter('userid')

		if (!userid) {
			throw new Error('User ID not found')
		}

		const formData = new FormData()
		formData.append('userid', userid)
		formData.append('passport_photo', selectedFile)

		const response = await fetch('/api/passport', {
			method: 'POST',
			body: formData,
		})

		const data = await response.json()

		if (!data.success) {
			throw new Error(data.error || 'Failed to upload passport')
		}

		return true
	} catch (error) {
		console.error('Error uploading passport:', error)
		throw error
	}
}

function validateForm(profileData) {
	const name = profileData.name
	const phone = profileData.phone
	const email = profileData.email

	if (!name || name.trim().length < 2) {
		throw new Error('Пожалуйста, введите корректное имя (минимум 2 символа)')
	}

	if (!phone || phone.length < 10) {
		throw new Error('Пожалуйста, введите корректный номер телефона')
	}

	if (!email || !isValidEmail(email)) {
		throw new Error('Пожалуйста, введите корректный email адрес')
	}

	return true
}

async function initializeForm() {
	const loader = window.universalLoader
	
	if (!loader) {
		console.error('Universal loader not found')
		const formContainer = document.querySelector('.form-container')
		if (formContainer) {
			formContainer.style.display = 'block'
		}
		return
	}

	try {
		loader.show('Загрузка формы...')
		loader.setProgress(30, 'Проверка данных...')
		await loader.delay(500)
		
		loader.setProgress(70, 'Настройка интерфейса...')
		await loader.delay(300)
		
		loader.setProgress(100, 'Готово!')
		await loader.delay(200)
		
		loader.hide()

		const formContainer = document.querySelector('.form-container')
		if (formContainer) {
			formContainer.style.display = 'block'
		} else {
			console.error('Form container not found')
		}
	} catch (error) {
		console.error('Error initializing form:', error)
		if (loader) {
			loader.hide()
		}
		
		const formContainer = document.querySelector('.form-container')
		if (formContainer) {
			formContainer.style.display = 'block'
		}
	}
}

document.addEventListener('DOMContentLoaded', function () {
	initializeForm()
	
	const form = document.getElementById('profileForm')
	const passportInput = document.getElementById('passport')
	const passportText = document.getElementById('passport-text')
	const submitBtn = document.getElementById('submit-button')
	const phoneInput = document.getElementById('phone1')
	const phone2Input = document.getElementById('phone2')
	const emailInput = document.getElementById('email')

	if (!form || !submitBtn) {
		console.error('Required form elements not found')
		return
	}

	function handlePhoneInput(input) {
		if (!input) return
		
		input.addEventListener('input', function (e) {
			const cursorPosition = e.target.selectionStart
			const oldLength = e.target.value.length

			e.target.value = formatPhoneNumber(e.target.value)

			const newLength = e.target.value.length
			const newCursorPosition = cursorPosition + (newLength - oldLength)

			setTimeout(() => {
				e.target.setSelectionRange(newCursorPosition, newCursorPosition)
			}, 0)
		})
	}

	handlePhoneInput(phoneInput)
	handlePhoneInput(phone2Input)

	if (emailInput) {
		emailInput.addEventListener('blur', function (e) {
			const email = e.target.value.trim().toLowerCase()
			e.target.value = email
		})
	}

	if (passportInput && passportText) {
		passportInput.addEventListener('change', function (e) {
			const file = e.target.files[0]
			if (file) {
				if (!file.type.startsWith('image/')) {
					showError('Пожалуйста, выберите изображение')
					return
				}
				if (file.size > 5 * 1024 * 1024) {
					showError('Размер файла не должен превышать 5MB')
					return
				}

				selectedFile = file
				passportText.innerHTML = `Выбран файл:<br>${file.name}`
			}
		})
	}

	submitBtn.addEventListener('click', async function (e) {
		e.preventDefault()

		try {
			const nameField = document.getElementById('name')
			const phone1Field = document.getElementById('phone1')
			const phone2Field = document.getElementById('phone2')
			const emailField = document.getElementById('email')

			if (!nameField || !phone1Field || !emailField) {
				throw new Error('Не все поля формы найдены')
			}

			const profileData = {
				name: nameField.value.trim(),
				phone: getCleanPhoneNumber(phone1Field.value),
				phone_additional: phone2Field ? getCleanPhoneNumber(phone2Field.value) || '' : '',
				email: emailField.value.trim().toLowerCase(),
			}

			console.log('Profile data:', profileData)

			validateForm(profileData)

			submitBtn.disabled = true
			submitBtn.textContent = 'Отправка...'

			await submitProfile(profileData)
			await uploadPassport()

			showModal('successModal')
			
			setTimeout(() => {
				const userid = user?.id || getUrlParameter('userid')
				window.location.href = `/html/home.html?userid=${userid}&loaded=1`
			}, 2000)
		} catch (error) {
			console.error('Form submission error:', error)
			showError(error.message)
		} finally {
			submitBtn.disabled = false
			submitBtn.textContent = 'ДАЛЕЕ'
		}
	})

	const closeErrorBtn = document.getElementById('closeErrorModal')
	if (closeErrorBtn) {
		closeErrorBtn.addEventListener('click', function () {
			hideModal('errorModal')
		})
	}

	window.addEventListener('click', function (e) {
		if (e.target.classList.contains('modal')) {
			hideModal(e.target.id)
		}
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
