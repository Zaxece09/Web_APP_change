class PageLoader {
    constructor() {
        this.loaderElement = null;
        this.progressBar = null;
        this.progressText = null;
        this.currentProgress = 0;
        this.targetProgress = 0;
        this.animationId = null;
        this.stepInterval = null;
        this.loadingSteps = [];
        this.currentStep = 0;
        
        this.init();
    }
    
    init() {
        this.loaderElement = document.getElementById('pageLoader');
        this.progressBar = document.querySelector('.loader-progress-bar');
        this.progressText = document.querySelector('.loader-text');
        this.titleElement = document.querySelector('.loader-title');
        
        if (!this.loaderElement) {
            this.createLoader();
            this.loaderElement = document.getElementById('pageLoader');
            this.progressBar = document.querySelector('.loader-progress-bar');
            this.progressText = document.querySelector('.loader-text');
            this.titleElement = document.querySelector('.loader-title');
        }
        
        this.currentProgress = 0;
        this.targetProgress = 0;
        this.updateProgressBar();
    }
    
    createLoader() {
        const loader = document.createElement('div');
        loader.id = 'pageLoader';
        loader.className = 'page-loader';
        
        loader.innerHTML = `
            <div class="loader-content">
                <div class="loader-title">Загружается...</div>
                <div class="loader-progress">
                    <div class="loader-progress-bar"></div>
                </div>
                <div class="loader-text">Подготовка данных...</div>
            </div>
        `;
        
        document.body.appendChild(loader);
    }
    
    show(title = 'Загружается...', steps = []) {
        this.init();
        
        const titleElement = document.querySelector('.loader-title');
        if (titleElement) {
            titleElement.textContent = title;
        }
        
        this.loadingSteps = steps.length > 0 ? steps : ['Загрузка данных...'];
        this.currentStep = 0;
        
        this.currentProgress = 0;
        this.targetProgress = 0;
        this.updateProgressBar();
        
        this.loaderElement.classList.remove('hidden');
        
        this.startProgress();
    }
    
    hide() {
        if (this.loaderElement) {
            this.loaderElement.classList.add('hidden');
        }
        
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        
        this.currentProgress = 0;
        this.targetProgress = 0;
        this.currentStep = 0;
    }
    
    setProgress(progress, text = '') {
        this.targetProgress = Math.min(Math.max(progress, 0), 100);
        
        if (text && this.progressText) {
            this.progressText.textContent = text;
        }
        
        this.animateProgress();
    }
    
    nextStep() {
        if (this.currentStep < this.loadingSteps.length - 1) {
            this.currentStep++;
        }
        
        const progress = ((this.currentStep + 1) / this.loadingSteps.length) * 100;
        const stepText = this.loadingSteps[this.currentStep];
        
        this.setProgress(progress, stepText);
    }
    
    startProgress() {
        let stepIndex = 0;
        this.stepInterval = setInterval(() => {
            if (stepIndex < this.loadingSteps.length) {
                const progress = ((stepIndex + 1) / this.loadingSteps.length) * 100;
                this.setProgress(progress, this.loadingSteps[stepIndex]);
                stepIndex++;
            } else {
                clearInterval(this.stepInterval);
                this.stepInterval = null;
            }
        }, 200);
    }
    
    completeProgress() {
        if (this.stepInterval) {
            clearInterval(this.stepInterval);
            this.stepInterval = null;
        }
        
        this.setProgress(100, 'Готово!');
        
        setTimeout(() => {
            this.currentProgress = 100;
            this.updateProgressBar();
        }, 100);
    }
    
    startProfileProgress() {
        this.loadingSteps = [
            'Получение данных профиля...',
            'Загрузка документов...',
            'Подготовка интерфейса...',
            'Завершение...'
        ];
        this.currentStep = 0;
        this.startProgress();
    }
    
    startTradeProgress() {
        this.loadingSteps = [
            'Проверка профиля...',
            'Загрузка настроек...',
            'Проверка активных сделок...',
            'Подготовка формы...',
            'Завершение...'
        ];
        this.currentStep = 0;
        this.startProgress();
    }
    
    startHistoryProgress() {
        this.loadingSteps = [
            'Получение списка обменов...',
            'Загрузка деталей...',
            'Подготовка отображения...',
            'Завершение...'
        ];
        this.currentStep = 0;
        this.startProgress();
    }
    
    startPassportProgress() {
        this.loadingSteps = [
            'Проверка данных...',
            'Загрузка фото...',
            'Подготовка интерфейса...',
            'Завершение...'
        ];
        this.currentStep = 0;
        this.startProgress();
    }
    
    startConvertProgress() {
        this.loadingSteps = [
            'Инициализация...',
            'Загрузка курсов...',
            'Завершение...'
        ];
        this.currentStep = 0;
        this.startProgress();
    }
    
    animateProgress() {
        const animate = () => {
            const diff = this.targetProgress - this.currentProgress;
            
            if (Math.abs(diff) > 0.1) {
                this.currentProgress += diff * 0.3;
                this.updateProgressBar();
                this.animationId = requestAnimationFrame(animate);
            } else {
                this.currentProgress = this.targetProgress;
                this.updateProgressBar();
            }
        };
        
        animate();
    }
    
    updateProgressBar() {
        if (this.progressBar) {
            this.progressBar.style.width = `${this.currentProgress}%`;
        }
    }
    
    showDataLoading() {
        this.show('Загрузка данных', [
            'Подключение к серверу...',
            'Получение данных...',
            'Обработка информации...',
            'Готово!'
        ]);
    }
    
    showProfileLoading() {
        this.show('Загрузка профиля', [
            'Получение данных профиля...',
            'Загрузка документов...',
            'Подготовка интерфейса...',
            'Готово!'
        ]);
    }
    
    showTradeLoading() {
        this.show('Создание обмена', [
            'Проверка данных...',
            'Создание заявки...',
            'Сохранение в базу...',
            'Готово!'
        ]);
    }
    
    showHistoryLoading() {
        this.show('Загрузка истории', [
            'Получение списка обменов...',
            'Загрузка деталей...',
            'Подготовка отображения...',
            'Готово!'
        ]);
    }
}

const pageLoader = new PageLoader();

window.pageLoader = pageLoader;