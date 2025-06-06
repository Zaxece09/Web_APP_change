document.addEventListener('DOMContentLoaded', () => {
	if (window.pageLoader) {
		window.pageLoader.init();
		window.pageLoader.startProfileProgress();
	}

	const profileForm = document.getElementById('profileForm')
	const nameInput = document.getElementById('name')
	const phoneInput = document.getElementById('phone')
	const phoneAdditionalInput = document.getElementById('phoneAdditional')
	const emailInput = document.getElementById('email')
	const addressInput = document.getElementById('address')
	const passportBtn = document.querySelector('.passport-btn')

	console.log('🔍 Form elements check:');
	console.log('profileForm:', profileForm);
	console.log('nameInput:', nameInput);
	console.log('phoneInput:', phoneInput);
	console.log('phoneAdditionalInput:', phoneAdditionalInput);
	console.log('emailInput:', emailInput);
	console.log('addressInput:', addressInput);
	console.log('passportBtn:', passportBtn);

	if (!profileForm) {
		console.error('❌ Profile form not found!');
		return;
	}

	if (passportBtn) {
		passportBtn.style.display = 'none'
	}

	function togglePassportButton(show) {
		if (passportBtn) {
			passportBtn.style.display = show ? 'flex' : 'none'
		}
	}

	function formatPhoneNumber(phone) {
		if (!phone) return '';
		
		const digits = phone.replace(/\D/g, '');
		
		let cleanDigits = digits;
		if (cleanDigits.startsWith('8') && cleanDigits.length === 11) {
			cleanDigits = '7' + cleanDigits.substring(1);
		}
		
		if (cleanDigits.startsWith('7') && cleanDigits.length === 11) {
			const formatted = `+7 (${cleanDigits.substring(1, 4)}) ${cleanDigits.substring(4, 7)}-${cleanDigits.substring(7, 9)}-${cleanDigits.substring(9, 11)}`;
			return formatted;
		}
		
		if (cleanDigits.length === 10) {
			const formatted = `+7 (${cleanDigits.substring(0, 3)}) ${cleanDigits.substring(3, 6)}-${cleanDigits.substring(6, 8)}-${cleanDigits.substring(8, 10)}`;
			return formatted;
		}
		
		return phone;
	}

	function validateEmail(email) {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		return emailRegex.test(email);
	}

	function validatePhoneNumber(phone) {
		if (!phone) return false;
		
		const digits = phone.replace(/\D/g, '');
		
		if (digits.length === 11 && (digits.startsWith('7') || digits.startsWith('8'))) {
			return true;
		}
		if (digits.length === 10) {
			return true;
		}
		
		return false;
	}

	function showFieldError(input, message) {
		const existingError = input.parentNode.querySelector('.error-message');
		if (existingError) {
			existingError.remove();
		}
		
		input.classList.add('error');
		
		const errorDiv = document.createElement('div');
		errorDiv.className = 'error-message';
		errorDiv.textContent = message;
		errorDiv.style.color = '#e74c3c';
		errorDiv.style.fontSize = '0.85rem';
		errorDiv.style.marginTop = '4px';
		
		input.parentNode.appendChild(errorDiv);
	}

	function clearFieldError(input) {
		input.classList.remove('error');
		const errorMessage = input.parentNode.querySelector('.error-message');
		if (errorMessage) {
			errorMessage.remove();
		}
	}

	phoneInput.addEventListener('blur', function() {
		this.value = formatPhoneNumber(this.value);
	});

	phoneAdditionalInput.addEventListener('blur', function() {
		this.value = formatPhoneNumber(this.value);
	});

	function restrictPhoneInput(input) {
		input.addEventListener('keypress', function(e) {
			const allowedKeys = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '+', '-', '(', ')', ' '];
			const specialKeys = ['Backspace', 'Delete', 'Tab', 'Enter', 'ArrowLeft', 'ArrowRight'];
			
			if (!allowedKeys.includes(e.key) && !specialKeys.includes(e.key)) {
				e.preventDefault();
			}
		});

		input.addEventListener('input', function(e) {
			const digits = this.value.replace(/\D/g, '');
			
			if (digits.length > 11) {
				const limitedDigits = digits.substring(0, 11);
				this.value = formatPhoneNumber(limitedDigits);
			}
		});
	}

	restrictPhoneInput(phoneInput);
	restrictPhoneInput(phoneAdditionalInput);

	[nameInput, phoneInput, phoneAdditionalInput, emailInput, addressInput].forEach(input => {
		input.addEventListener('focus', function() {
			clearFieldError(this);
		});
	});

	let userid = null;
	const urlParams = new URLSearchParams(window.location.search);
	const userIdFromUrl = urlParams.get('userid') || urlParams.get('user_id');
	
	if (userIdFromUrl) {
		userid = parseInt(userIdFromUrl);
		console.log('✅ User ID получен из URL:', userid);
	} else {
		if (window.Telegram && window.Telegram.WebApp) {
			window.Telegram.WebApp.ready();
			const webAppData = window.Telegram.WebApp;
			
			if (webAppData.initDataUnsafe?.user?.id) {
				userid = webAppData.initDataUnsafe.user.id;
				console.log('✅ User ID получен из Telegram WebApp:', userid);
			}
			
			if (!userid && webAppData.initData) {
				try {
					const initDataParams = new URLSearchParams(webAppData.initData);
					const userStr = initDataParams.get('user');
					if (userStr) {
						const userObj = JSON.parse(decodeURIComponent(userStr));
						userid = userObj.id;
						console.log('✅ User ID получен парсингом initData:', userid);
					}
				} catch (e) {
					console.error('Ошибка парсинга initData:', e);
				}
			}
		}
	}

	if (!userid) {
		alert('Ошибка: не удалось получить ваш ID. Откройте приложение через /start в боте.');
		return;
	}

	console.log('🎯 Используется User ID:', userid);

	let isProfileSaved = false;
	let editingField = null;

	function showViewMode() {
		document.querySelectorAll('.field-display').forEach(display => {
			display.style.display = 'flex';
		});
		document.querySelectorAll('#profileForm input[type="text"], #profileForm input[type="tel"], #profileForm input[type="email"]').forEach(input => {
			input.style.display = 'none';
		});
		
		document.querySelectorAll('.edit-btn').forEach(btn => {
			btn.style.display = 'flex';
		});
		
		const saveBtn = document.getElementById('saveBtn');
		if (saveBtn) {
			saveBtn.style.display = 'none';
		}
		
		editingField = null;
	}

	function showEditMode() {
		document.querySelectorAll('.field-display').forEach(display => {
			display.style.display = 'none';
		});
		document.querySelectorAll('#profileForm input[type="text"], #profileForm input[type="tel"], #profileForm input[type="email"]').forEach(input => {
			input.style.display = 'block';
		});
		
		document.querySelectorAll('.edit-btn').forEach(btn => {
			btn.style.display = 'none';
		});
		
		const saveBtn = document.getElementById('saveBtn');
		if (saveBtn) {
			saveBtn.style.display = 'block';
		}
		
		editingField = 'all';
	}

	function editField(fieldName) {
		console.log('✏️ Editing field:', fieldName);
		
		const display = document.getElementById(fieldName + 'Display');
		if (display) {
			display.style.display = 'none';
		}
		
		const input = document.getElementById(fieldName);
		if (input) {
			input.style.display = 'block';
			input.focus();
			
			input.addEventListener('blur', function() {
				saveField(fieldName);
			});
			
			input.addEventListener('keydown', function(e) {
				if (e.key === 'Enter') {
					e.preventDefault();
					saveField(fieldName);
				}
				if (e.key === 'Escape') {
					cancelEditField(fieldName);
				}
			});
		}
		
		editingField = fieldName;
	}

	function saveField(fieldName) {
		console.log('💾 Saving field:', fieldName);
		
		const input = document.getElementById(fieldName);
		const display = document.getElementById(fieldName + 'Display');
		
		if (!input || !display) return;
		
		let value = input.value.trim();
		
		if (fieldName === 'phone' || fieldName === 'phoneAdditional') {
			if (value) {
				if (!validatePhoneNumber(value)) {
					alert('Введите корректный номер телефона');
					return;
				}
				value = formatPhoneNumber(value);
				input.value = value;
			}
		}
		
		if (fieldName === 'email' && value) {
			if (!validateEmail(value)) {
				alert('Введите корректный email адрес');
				return;
			}
		}
		
		if (value) {
			display.textContent = value;
			display.classList.remove('empty');
		} else {
			display.textContent = 'Не указано';
			display.classList.add('empty');
		}
		
		input.style.display = 'none';
		display.style.display = 'flex';
		
		if (isProfileSaved) {
			saveProfileData();
		}
		
		editingField = null;
	}

	function cancelEditField(fieldName) {
		const input = document.getElementById(fieldName);
		const display = document.getElementById(fieldName + 'Display');
		
		if (!input || !display) return;
		
		const currentDisplayValue = display.textContent;
		if (currentDisplayValue !== 'Не указано') {
			input.value = currentDisplayValue;
		} else {
			input.value = '';
		}
		
		input.style.display = 'none';
		display.style.display = 'flex';
		
		editingField = null;
	}

	function updateDisplayFields(profile) {
		const fields = ['name', 'phone', 'phoneAdditional', 'email', 'address'];
		const fieldMap = {
			'phoneAdditional': 'phone_additional'
		};
		
		fields.forEach(fieldName => {
			const display = document.getElementById(fieldName + 'Display');
			const input = document.getElementById(fieldName);
			const dataKey = fieldMap[fieldName] || fieldName;
			
			if (display && input) {
				const value = profile[dataKey] || '';
				input.value = value;
				
				if (value) {
					display.textContent = value;
					display.classList.remove('empty');
				} else {
					display.textContent = 'Не указано';
					display.classList.add('empty');
				}
			}
		});
	}

	window.editField = editField;

	loadProfile().then(() => {
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

	async function loadProfile() {
		try {
			const response = await fetch(`/api/profile?userid=${userid}`);
			const result = await response.json();

			if (response.ok && result.success && result.data) {
				const profile = result.data;
				console.log('✅ Профиль найден:', profile);
				
				updateDisplayFields(profile);
				
				isProfileSaved = true;
				showViewMode();
				
				togglePassportButton(true);
				console.log('✅ Профиль найден, кнопка паспорта показана');
			} else {
				console.log('📝 Profile not found, creating new profile');
				isProfileSaved = false;
				showEditMode();
				togglePassportButton(false);
			}
		} catch (error) {
			console.error('Error loading profile:', error);
			isProfileSaved = false;
			showEditMode();
			togglePassportButton(false);
		}
	}

	async function saveProfileData() {
		const name = nameInput.value.trim()
		let phone = phoneInput.value.trim()
		let phoneAdditional = phoneAdditionalInput.value.trim()
		const email = emailInput.value.trim()
		const address = addressInput.value.trim()

		console.log('📤 Saving profile data:', { name, phone, phoneAdditional, email, address });

		phone = formatPhoneNumber(phone);
		if (phoneAdditional) {
			phoneAdditional = formatPhoneNumber(phoneAdditional);
		}

		const profileData = {
			userid: userid,
			name: name,
			phone: phone,
			phone_additional: phoneAdditional,
			email: email,
			address: address,
		}

		try {
			const response = await fetch('/api/profile', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(profileData)
			});

			const result = await response.json();
			console.log('📥 Server response:', result);

			if (response.ok && result.success) {
				updateDisplayFields({
					name: name,
					phone: phone,
					phone_additional: phoneAdditional,
					email: email,
					address: address
				});
				
				return true;
			} else {
				alert('Ошибка при сохранении профиля: ' + (result.error || result.message));
				return false;
			}
		} catch (error) {
			console.error('Error saving profile:', error);
			alert('Ошибка при сохранении профиля. Попробуйте еще раз.');
			return false;
		}
	}

	document.addEventListener('click', e => {
		const target = e.target
		if (
			!target.closest('input') &&
			!target.closest('button') &&
			!target.closest('label')
		) {
			if (document.activeElement && document.activeElement.blur) {
				document.activeElement.blur()
			}
		}
	})

	profileForm.addEventListener('submit', async (e) => {
		console.log('🔄 Form submit triggered!');
		e.preventDefault()
		
		const name = nameInput.value.trim()
		let phone = phoneInput.value.trim()
		let phoneAdditional = phoneAdditionalInput.value.trim()
		const email = emailInput.value.trim()
		const address = addressInput.value.trim()

		console.log('📋 Form data:', { name, phone, phoneAdditional, email, address });

		[nameInput, phoneInput, phoneAdditionalInput, emailInput, addressInput].forEach(clearFieldError);

		let hasErrors = false;

		if (!name) {
			showFieldError(nameInput, 'Имя обязательно для заполнения');
			hasErrors = true;
		}

		if (!phone) {
			showFieldError(phoneInput, 'Номер телефона обязателен для заполнения');
			hasErrors = true;
		} else if (!validatePhoneNumber(phone)) {
			showFieldError(phoneInput, 'Введите корректный российский номер телефона');
			hasErrors = true;
		}

		if (phoneAdditional && !validatePhoneNumber(phoneAdditional)) {
			showFieldError(phoneAdditionalInput, 'Введите корректный российский номер телефона');
			hasErrors = true;
		}

		if (!email) {
			showFieldError(emailInput, 'Email обязателен для заполнения');
			hasErrors = true;
		} else if (!validateEmail(email)) {
			showFieldError(emailInput, 'Введите корректный email адрес');
			hasErrors = true;
		}

		if (!address) {
			showFieldError(addressInput, 'Адрес обязателен для заполнения');
			hasErrors = true;
		}

		if (hasErrors) {
			console.log('❌ Validation errors found, not submitting');
			return;
		}

		console.log('✅ Validation passed, submitting form');

		const success = await saveProfileData();
		
		if (success) {
			alert('Профиль успешно сохранен!');
			
			isProfileSaved = true;
			showViewMode();
			
			togglePassportButton(true);
			console.log('✅ Профиль сохранен, кнопка паспорта показана');
			
			if (window.Telegram && window.Telegram.WebApp) {
				window.Telegram.WebApp.HapticFeedback.impactOccurred('medium');
			}
		}
	})
})
