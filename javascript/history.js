// Автоматическое разворачивание Telegram WebApp на весь экран
if (window.Telegram && window.Telegram.WebApp) {
    window.Telegram.WebApp.ready();
    window.Telegram.WebApp.expand();
}

const tradeHistory = [
	{
		id: 'XXXXXX1',
		date: '04.06.2025 14:30',
		usdt: '100',
		rub: '9500',
		name: 'Иван Иванов',
		email: 'ivan@example.com',
		status: 'Успех',
	},
	{
		id: 'XXXXXX2',
		date: '05.06.2025 15:45',
		usdt: '200',
		rub: '19000',
		name: 'Анна Петрова',
		email: 'anna@example.com',
		status: 'Ожидание',
	},
	{
		id: 'XXXXXX3',
		date: '06.06.2025 09:20',
		usdt: '150',
		rub: '14250',
		name: 'Сергей Сидоров',
		email: 'sergey@example.com',
		status: 'Отмена',
	},
	{
		id: 'XXXXXX4',
		date: '07.06.2025 12:00',
		usdt: '300',
		rub: '28500',
		name: 'Мария Кузнецова',
		email: 'maria@example.com',
		status: 'Успех',
	},
	{
		id: 'XXXXXX5',
		date: '08.06.2025 16:10',
		usdt: '250',
		rub: '23750',
		name: 'Дмитрий Попов',
		email: 'dmitry@example.com',
		status: 'Успех',
	},
	{
		id: 'XXXXXX6',
		date: '09.06.2025 11:30',
		usdt: '400',
		rub: '38000',
		name: 'Елена Смирнова',
		email: 'elena@example.com',
		status: 'Успех',
	},
	{
		id: 'XXXXXX7',
		date: '04.06.2025 10:15',
		usdt: '120',
		rub: '11400',
		name: 'Алексей Морозов',
		email: 'alexey@example.com',
		status: 'Успех',
	},
	{
		id: 'XXXXXX8',
		date: '04.06.2025 13:25',
		usdt: '180',
		rub: '17100',
		name: 'Ольга Васильева',
		email: 'olga@example.com',
		status: 'Успех',
	},
	{
		id: 'XXXXXX9',
		date: '04.06.2025 17:50',
		usdt: '90',
		rub: '8550',
		name: 'Павел Козлов',
		email: 'pavel@example.com',
		status: 'Успех',
	},
	{
		id: 'XXXXXX10',
		date: '04.06.2025 08:40',
		usdt: '500',
		rub: '47500',
		name: 'Наталья Романова',
		email: 'natalia@example.com',
		status: 'Успех',
	},
	{
		id: 'XXXXXX11',
		date: '04.06.2025 19:00',
		usdt: '220',
		rub: '20900',
		name: 'Виктор Лебедев',
		email: 'victor@example.com',
		status: 'Успех',
	},
	{
		id: 'XXXXXX12',
		date: '04.06.2025 12:30',
		usdt: '300',
		rub: '28500',
		name: 'Татьяна Белова',
		email: 'tatyana@example.com',
		status: 'Успех',
	},
	{
		id: 'XXXXXX13',
		date: '04.06.2025 15:15',
		usdt: '270',
		rub: '25650',
		name: 'Роман Зайцев',
		email: 'roman@example.com',
		status: 'Успех',
	},
	{
		id: 'XXXXXX14',
		date: '04.06.2025 09:10',
		usdt: '350',
		rub: '33250',
		name: 'Светлана Фролова',
		email: 'svetlana@example.com',
		status: 'Успех',
	},
	{
		id: 'XXXXXX15',
		date: '04.06.2025 14:20',
		usdt: '400',
		rub: '38000',
		name: 'Михаил Громов',
		email: 'mikhail@example.com',
		status: 'Успех',
	},
	{
		id: 'XXXXXX16',
		date: '04.06.2025 16:45',
		usdt: '130',
		rub: '12350',
		name: 'Екатерина Орлова',
		email: 'ekaterina@example.com',
		status: 'Успех',
	},
	{
		id: 'XXXXXX17',
		date: '04.06.2025 11:55',
		usdt: '200',
		rub: '19000',
		name: 'Артем Соколов',
		email: 'artem@example.com',
		status: 'Успех',
	},
	{
		id: 'XXXXXX18',
		date: '04.06.2025 18:30',
		usdt: '280',
		rub: '26600',
		name: 'Юлия Новикова',
		email: 'yulia@example.com',
		status: 'Успех',
	},
]

document.addEventListener('DOMContentLoaded', () => {
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

	const historyList = document.getElementById('tradeHistoryBody')
	const modal = document.getElementById('tradeModal')
	const closeBtn = document.querySelector('.close-btn')

	tradeHistory.forEach((trade, index) => {
		const historyItem = document.createElement('div')
		historyItem.classList.add('history-item')
		historyItem.dataset.index = index
		historyItem.innerHTML = `
            <span>ID: ${trade.id}</span>
            <span>${trade.date.split(' ')[0]}</span>
            <span>Статус: ${trade.status}</span>
        `
		historyList.appendChild(historyItem)
	})

	const historyItems = document.querySelectorAll('.history-item')
	historyItems.forEach(item => {
		item.addEventListener('click', () => {
			const index = item.dataset.index
			const trade = tradeHistory[index]

			document.getElementById('modal-id').textContent = trade.id
			document.getElementById('modal-date').textContent = trade.date
			document.getElementById('modal-usdt').textContent = trade.usdt
			document.getElementById('modal-rub').textContent = trade.rub
			document.getElementById('modal-name').textContent = trade.name
			document.getElementById('modal-email').textContent = trade.email
			document.getElementById('modal-status').textContent = trade.status

			modal.style.display = 'flex'
		})
	})

	closeBtn.addEventListener('click', () => {
		modal.style.display = 'none'
	})

	modal.addEventListener('click', e => {
		if (e.target === modal) {
			modal.style.display = 'none'
		}
	})
})
