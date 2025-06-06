document.addEventListener('DOMContentLoaded', function () {
	const sidebarLinks = document.querySelectorAll('.sidebar-link')
	const currentPath = window.location.pathname.split('/').pop()

	sidebarLinks.forEach(link => {
		const linkPath = link.getAttribute('href')
		const parentLi = link.parentElement

		parentLi.classList.remove('active')

		if (linkPath === currentPath) {
			parentLi.classList.add('active')
		}
	})
})

const dateInput = document.getElementById('selected-date')
const prevDateBtn = document.getElementById('prev-date')
const nextDateBtn = document.getElementById('next-date')
const addTimeBtn = document.getElementById('add-time-btn')
const modal = document.getElementById('time-modal')
const modalClose = document.getElementById('time-modal-close')
const modalDateDisplay = document.getElementById('modal-date-display')
const addTimeRangeBtn = document.getElementById('add-time-range-btn')
const timeRanges = document.getElementById('time-ranges')
const saveTimeBtn = document.getElementById('save-time-btn')
const timeSlots = document.getElementById('time-slots')
let timeRangeCount = 1

function formatDate(date) {
	const day = String(date.getDate()).padStart(2, '0')
	const month = String(date.getMonth() + 1).padStart(2, '0')
	const year = date.getFullYear()
	return `${day}-${month}-${year}`
}

let currentDate = new Date(2025, 5, 6) // June 06, 2025
dateInput.value = formatDate(currentDate)

prevDateBtn.addEventListener('click', () => {
	currentDate.setDate(currentDate.getDate() - 1)
	dateInput.value = formatDate(currentDate)
})

nextDateBtn.addEventListener('click', () => {
	currentDate.setDate(currentDate.getDate() + 1)
	dateInput.value = formatDate(currentDate)
})

addTimeBtn.addEventListener('click', () => {
	modalDateDisplay.textContent = `Дата: ${dateInput.value}`
	modal.style.display = 'flex'
	timeRangeCount = 1
	timeRanges.innerHTML = `
				<div class="time-range" id="time-range-1">
					<div class="time-input-group">
						<input type="time" class="form-input time-start" id="time-start-1" value="09:00">
						<span class="time-separator">-</span>
						<input type="time" class="form-input time-end" id="time-end-1" value="10:00">
					</div>
				</div>
			`
	addTimeRangeBtn.disabled = false
})

modalClose.addEventListener('click', () => {
	modal.style.display = 'none'
})

addTimeRangeBtn.addEventListener('click', () => {
	if (timeRangeCount < 3) {
		timeRangeCount++
		const newRange = document.createElement('div')
		newRange.className = 'time-range'
		newRange.id = `time-range-${timeRangeCount}`
		newRange.innerHTML = `
					<div class="time-input-group">
						<input type="time" class="form-input time-start" id="time-start-${timeRangeCount}" value="09:00">
						<span class="time-separator">-</span>
						<input type="time" class="form-input time-end" id="time-end-${timeRangeCount}" value="10:00">
					</div>
				`
		timeRanges.appendChild(newRange)
		if (timeRangeCount === 3) {
			addTimeRangeBtn.disabled = true
		}
	}
})

saveTimeBtn.addEventListener('click', () => {
	const ranges = timeRanges.querySelectorAll('.time-range')
	const slotList = document.createElement('div')
	slotList.className = 'time-slot-item'
	slotList.innerHTML = `<strong>${dateInput.value}</strong>: ${Array.from(
		ranges
	)
		.map(r => {
			const start = r.querySelector('.time-start').value
			const end = r.querySelector('.time-end').value
			return `${start} - ${end}`
		})
		.join(', ')}`
	timeSlots.appendChild(slotList)
	modal.style.display = 'none'
})

modal.addEventListener('click', e => {
	if (e.target === modal) {
		modal.style.display = 'none'
	}
})
