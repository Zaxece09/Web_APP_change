document.addEventListener('DOMContentLoaded', () => {
	const allStepButtons = document.querySelectorAll('[data-next], [data-back]')

	allStepButtons.forEach(button => {
		button.addEventListener('click', () => {
			const currentStep = button.closest('.trade-container')
			const nextStepId = button.dataset.next || button.dataset.back
			const nextStep = document.getElementById(nextStepId)

			if (currentStep && nextStep) {
				currentStep.style.display = 'none'
				nextStep.style.display = 'flex'
			}
		})
	})

	const timeSlots = document.querySelectorAll('.time-slot')

	timeSlots.forEach(slot => {
		slot.addEventListener('click', () => {
			timeSlots.forEach(s => s.classList.remove('selected'))
			slot.classList.add('selected')
		})
	})
})
