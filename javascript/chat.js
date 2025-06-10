document.addEventListener('DOMContentLoaded', () => {
	const attachButton = document.querySelector('.fa-paperclip')
	const sendBtn = document.querySelector('.send-btn')
	const messageInput = document.querySelector('.input-wrapper input')
	const fileInput = document.getElementById('file-input')
	const emojiBtn = document.getElementById('emoji-btn')
	const emojiPicker = document.getElementById('emoji-picker')
	const viewerModal = document.getElementById('file-viewer-modal')
	const closeViewerBtn = document.getElementById('close-viewer-modal')
	const viewerBody = document.getElementById('viewer-body')
	const viewerFilename = document.getElementById('viewer-filename')
	const attachmentPreviewArea = document.getElementById(
		'attachment-preview-area'
	)
	const attachmentIcon = document.getElementById('attachment-icon')
	const attachmentFilename = document.getElementById('attachment-filename')
	const progressBarFill = document.getElementById('progress-bar-fill')
	const uploadStatus = document.getElementById('upload-status')
	const cancelAttachmentBtn = document.getElementById('cancel-attachment')

	const chatMessages = document.querySelector('.chat-messages')

	let fileToSend = null

	const allowedTypes = [
		'image/jpeg',
		'image/png',
		'application/pdf',
		'application/msword',
		'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
		'video/mp4',
		'video/quicktime',
	]
	const maxVideoDuration = 60

	function formatFileSize(bytes) {
		if (bytes >= 1024 * 1024) {
			return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
		} else {
			return `${(bytes / 1024).toFixed(1)} KB`
		}
	}

	async function compressImage(file) {
		return new Promise((resolve, reject) => {
			const image = new Image()
			image.src = URL.createObjectURL(file)
			image.onload = () => {
				const canvas = document.createElement('canvas')
				canvas.width = image.width
				canvas.height = image.height
				const ctx = canvas.getContext('2d')
				ctx.drawImage(image, 0, 0, image.width, image.height)

				canvas.toBlob(
					blob => {
						if (blob) {
							const compressedFile = new File([blob], file.name, {
								type: 'image/jpeg',
								lastModified: Date.now(),
							})
							resolve(compressedFile)
						} else {
							reject(new Error('Canvas to Blob conversion failed'))
						}
					},
					'image/jpeg',
					0.7
				)
			}
			image.onerror = err => reject(err)
		})
	}

	attachButton.addEventListener('click', () => fileInput.click())
	fileInput.addEventListener('change', handleFileSelect)
	cancelAttachmentBtn.addEventListener('click', cancelAttachment)
	sendBtn.addEventListener('click', sendMessage)
	messageInput.addEventListener('keydown', e => {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault()
			sendMessage()
		}
	})

	emojiBtn.addEventListener('click', event => {
		event.stopPropagation()
		const isPreviewVisible = attachmentPreviewArea.style.display === 'flex'
		emojiPicker.style.bottom = isPreviewVisible ? '140px' : '65px'
		emojiPicker.style.display =
			emojiPicker.style.display === 'block' ? 'none' : 'block'
	})

	emojiPicker.addEventListener('emoji-click', event => {
		messageInput.value += event.detail.unicode
		messageInput.focus()
	})

	document.addEventListener('click', event => {
		if (!emojiPicker.contains(event.target) && event.target !== emojiBtn) {
			emojiPicker.style.display = 'none'
		}
	})

	closeViewerBtn.addEventListener('click', closeViewerModal)

	async function handleFileSelect(event) {
		const file = event.target.files[0]
		if (!file) return

		cancelAttachment()

		if (
			!allowedTypes.some(type => file.type.startsWith(type.replace('*', '')))
		) {
			alert('Неверный тип файла. Разрешены: PDF, JPG, PNG, DOCX, MP4, MOV.')
			return
		}

		if (file.type.startsWith('image/') && file.size > 100 * 1024) {
			showAttachmentPreview(file)
			uploadStatus.textContent = 'Сжатие...'
			progressBarFill.style.width = '30%'

			try {
				const compressedFile = await compressImage(file)
				fileToSend = compressedFile

				progressBarFill.style.width = '100%'
				uploadStatus.textContent = `Готово к отправке (${formatFileSize(
					compressedFile.size
				)})`
			} catch (err) {
				console.error('Image compression error:', err)
				alert('Ошибка при сжатии изображения.')
				cancelAttachment()
			}
			return
		}

		if (file.type.startsWith('video/')) {
			const video = document.createElement('video')
			video.preload = 'metadata'
			video.src = URL.createObjectURL(file)
			video.onloadedmetadata = () => {
				if (video.duration > maxVideoDuration) {
					alert(
						`Видео слишком длинное. Максимальная длительность: ${maxVideoDuration} секунд.`
					)
				} else {
					fileToSend = file
					showAttachmentPreview(file)
					simulateUpload()
				}
			}
		} else {
			fileToSend = file
			showAttachmentPreview(file)
			simulateUpload()
		}
	}

	function showAttachmentPreview(file) {
		attachmentFilename.textContent = file.name

		if (emojiPicker.style.display === 'block') {
			emojiPicker.style.bottom = '140px'
		}

		if (file.type.startsWith('image/')) {
			attachmentIcon.className = 'fa-solid fa-image'
		} else if (file.type.startsWith('video/')) {
			attachmentIcon.className = 'fa-solid fa-video'
		} else {
			attachmentIcon.className = 'fa-solid fa-file'
		}

		attachmentPreviewArea.style.display = 'flex'
		simulateUpload()
	}

	function simulateUpload() {
		progressBarFill.style.width = '0%'
		uploadStatus.textContent = 'Загрузка...'

		let width = 0
		const interval = setInterval(() => {
			width += 10
			progressBarFill.style.width = `${width}%`
			if (width >= 100) {
				clearInterval(interval)
				uploadStatus.textContent = 'Готово к отправке'
			}
		}, 150)
	}

	function cancelAttachment() {
		fileToSend = null
		fileInput.value = ''
		attachmentPreviewArea.style.display = 'none'

		if (emojiPicker.style.display === 'block') {
			emojiPicker.style.bottom = '65px'
		}
	}

	function sendMessage() {
		const text = messageInput.value.trim()
		if (!fileToSend && !text) return

		const messageGroup = document.createElement('div')
		messageGroup.classList.add('message-group', 'outgoing')

		const senderLabel = document.createElement('div')
		senderLabel.classList.add('sender-label')
		senderLabel.textContent = 'Вы'
		messageGroup.appendChild(senderLabel)

		const messageContainer = document.createElement('div')
		messageContainer.classList.add('message', 'outgoing')

		const wrapper = document.createElement('div')
		wrapper.classList.add('message-content-wrapper')

		if (fileToSend) {
			const fileUrl = URL.createObjectURL(fileToSend)
			let filePart
			if (fileToSend.type.startsWith('image/')) {
				filePart = createImageMessage(fileUrl, fileToSend.name)
			} else {
				filePart = createGenericFileMessage(fileUrl, fileToSend)
			}
			wrapper.appendChild(filePart)
		}

		if (text) {
			const textPart = document.createElement('div')
			textPart.classList.add('caption')
			textPart.textContent = text
			wrapper.appendChild(textPart)
		}

		if (text && fileToSend) {
			messageContainer.classList.add('has-text')
		} else if (fileToSend && !text) {
			if (fileToSend.type.startsWith('image/')) {
				messageContainer.style.background = 'none'
				messageContainer.style.padding = '0'
			}
		}

		messageContainer.appendChild(wrapper)
		messageGroup.appendChild(messageContainer)

		chatMessages.appendChild(messageGroup)
		chatMessages.scrollTop = chatMessages.scrollHeight

		messageInput.value = ''
		cancelAttachment()
	}

	function createMessagePart(url, file, isImage) {
		const element = document.createElement('div')
		element.classList.add('file-part')
		element.dataset.url = url
		element.dataset.name = file.name
		element.dataset.type = isImage
			? 'image'
			: file.type.startsWith('video/')
			? 'video'
			: 'file'

		if (isImage) {
			element.innerHTML = `<img src="${url}" class="image-thumbnail">`
		} else {
			element.classList.add('file-message')
			let iconClass = file.type.startsWith('video/')
				? 'fa-solid fa-video'
				: 'fa-solid fa-file-lines'
			element.innerHTML = `
                <i class="${iconClass} file-icon"></i>
                <div class="file-info">
                    <div class="file-name">${file.name}</div>
                    <div class="file-size">${(file.size / 1024).toFixed(
											1
										)} KB</div>
                </div>`
		}

		element.addEventListener('click', () =>
			openViewer(
				element.dataset.url,
				element.dataset.name,
				element.dataset.type
			)
		)
		return element
	}

	function createImageMessage(url, name) {
		const container = createMessageContainer()
		container.style.background = 'none'
		container.style.padding = '0'
		const img = document.createElement('img')
		img.src = url
		img.dataset.filename = name
		img.classList.add('image-thumbnail')
		img.addEventListener('click', () => openViewer(url, name, 'image'))
		container.appendChild(img)
		return container
	}

	function createGenericFileMessage(url, file) {
		const container = createMessageContainer()
		container.classList.add('file-message')

		let iconClass = 'fa-solid fa-file-lines'
		let type = 'file'
		if (file.type.startsWith('video/')) {
			iconClass = 'fa-solid fa-video'
			type = 'video'
		}

		container.innerHTML = `
            <i class="${iconClass} file-icon"></i>
            <div class="file-info">
                <div class="file-name">${file.name}</div>
                <div class="file-size">${formatFileSize(file.size)}</div>
            </div>`

		container.addEventListener('click', () => openViewer(url, file.name, type))
		return container
	}

	function openViewer(url, name, type) {
		viewerFilename.textContent = name
		viewerBody.innerHTML = ''
		let viewerElement

		if (type === 'image') {
			viewerElement = document.createElement('img')
			viewerElement.src = url
		} else if (type === 'video') {
			viewerElement = document.createElement('video')
			viewerElement.src = url
			viewerElement.controls = true
			viewerElement.autoplay = true
		} else {
			viewerElement = document.createElement('div')
			viewerElement.style.textAlign = 'center'
			viewerElement.innerHTML = `<i class="fa-solid fa-file-lines" style="font-size: 5em; margin-bottom: 10px;"></i><p>Предпросмотр недоступен.</p><a href="${url}" download="${name}" style="color: #AA8E64; text-decoration: none; display: inline-block; margin-top: 10px; font-weight: 500;">Скачать</a>`
		}

		viewerBody.appendChild(viewerElement)
		viewerModal.style.display = 'flex'
	}

	function closeViewerModal() {
		viewerModal.style.display = 'none'
		viewerBody.innerHTML = ''
	}

	function createMessageContainer() {
		const div = document.createElement('div')
		return div
	}
})
