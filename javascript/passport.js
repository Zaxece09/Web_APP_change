document.addEventListener('DOMContentLoaded', () => {
	if (window.pageLoader) {
		window.pageLoader.init();
		window.pageLoader.startPassportProgress();
	}

	const passportPreview = document.getElementById('passportPreview')
	const passportInput = document.getElementById('passportInput')
	const previewImage = document.getElementById('previewImage')
	const uploadPlaceholder = document.getElementById('uploadPlaceholder')
	const editButton = document.getElementById('editButton')

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

	loadPassportPhoto().then(() => {
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

	async function loadPassportPhoto() {
		try {
			const response = await fetch(`/api/passport/${userid}`);
			if (response.ok) {
				const blob = await response.blob();
				const imageUrl = URL.createObjectURL(blob);
				previewImage.src = imageUrl;
				previewImage.style.display = 'block';
				uploadPlaceholder.style.display = 'none';
				editButton.style.display = 'block';
			}
		} catch (error) {
			console.log('No existing passport photo found');
		}
	}

	passportPreview.addEventListener('click', () => {
		passportInput.click()
	})

	passportPreview.addEventListener('dragover', e => {
		e.preventDefault()
		passportPreview.style.borderColor = '#a5977a'
		passportPreview.style.backgroundColor = 'rgba(145, 129, 104, 0.05)'
	})

	passportPreview.addEventListener('dragleave', () => {
		passportPreview.style.borderColor = '#918168'
		passportPreview.style.backgroundColor = 'transparent'
	})

	passportPreview.addEventListener('drop', e => {
		e.preventDefault()
		passportPreview.style.borderColor = '#918168'
		passportPreview.style.backgroundColor = 'transparent'

		const file = e.dataTransfer.files[0]
		if (file && isValidFileType(file)) {
			handleFile(file)
		} else if (file) {
			alert('Пожалуйста, загрузите только JPG, JPEG или PNG файлы.')
		}
	})

	passportInput.addEventListener('change', e => {
		const file = e.target.files[0]
		if (file && isValidFileType(file)) {
			handleFile(file)
		} else if (file) {
			alert('Пожалуйста, загрузите только JPG, JPEG или PNG файлы.')
		}
	})

	function isValidFileType(file) {
		const validTypes = ['image/jpeg', 'image/jpg', 'image/png']
		return validTypes.includes(file.type)
	}

	async function handleFile(file) {
		const reader = new FileReader()
		reader.onload = e => {
			previewImage.src = e.target.result
			previewImage.style.display = 'block'
			uploadPlaceholder.style.display = 'none'
			editButton.style.display = 'block'
		}
		reader.readAsDataURL(file)

		await uploadPassportPhoto(file);
	}

	async function uploadPassportPhoto(file) {
		const formData = new FormData();
		formData.append('passport_photo', file);
		formData.append('userid', userid);

		try {
			const response = await fetch('/api/passport', {
				method: 'POST',
				body: formData
			});

			const result = await response.json();

			if (response.ok && result.success) {
				alert('Фото паспорта успешно загружено!');
				if (window.Telegram && window.Telegram.WebApp) {
					window.Telegram.WebApp.HapticFeedback.impactOccurred('medium');
				}
			} else {
				alert('Ошибка при загрузке фото: ' + (result.error || 'Неизвестная ошибка'));
				previewImage.style.display = 'none';
				uploadPlaceholder.style.display = 'block';
				editButton.style.display = 'none';
			}
		} catch (error) {
			console.error('Error uploading passport photo:', error);
			alert('Ошибка при загрузке фото. Попробуйте еще раз.');
			previewImage.style.display = 'none';
			uploadPlaceholder.style.display = 'block';
			editButton.style.display = 'none';
		}
	}

	editButton.addEventListener('click', () => {
		passportInput.click()
	})
})
