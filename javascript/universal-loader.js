class UniversalLoader {
    constructor() {
        this.loader = null;
        this.progressFill = null;
        this.progressStatus = null;
        this.progressPercent = null;
        this.currentProgress = 0;
        this.isInitialized = false;
        this.fullscreenRequested = false;
        
        this.init();
    }
    
    init() {
        this.loader = document.getElementById('universal-loader');
        if (this.loader) {
            this.progressFill = document.getElementById('progress-fill');
            this.progressStatus = document.getElementById('progress-status');
            this.progressPercent = document.getElementById('progress-percent');
            this.isInitialized = true;
        }
    }
    
    show(initialStatus = 'Загрузка...') {
        if (!this.isInitialized) this.init();
        
        if (this.loader) {
            this.loader.style.display = 'flex';
            this.setProgress(0, initialStatus);
            
            if (!this.fullscreenRequested && window.Telegram?.WebApp?.requestFullscreen) {
                window.Telegram.WebApp.requestFullscreen();
                this.fullscreenRequested = true;
            }
        }
    }
    
    hide() {
        if (this.loader) {
            this.setProgress(100, 'Завершено');
            
            setTimeout(() => {
                this.currentProgress = 0;
                this.loader.style.display = 'none';
                
                this.activateWebApp();
            }, 500);
        }
    }
    
    activateWebApp() {
        if (window.TelegramWebAppUtils) {
            window.TelegramWebAppUtils.enableInteraction();
        } else if (window.Telegram?.WebApp) {
            const tg = window.Telegram.WebApp;
            
            tg.enableClosingConfirmation();
            
            setTimeout(() => {
                document.body.focus();
                document.body.click();
                
                setTimeout(() => {
                    if (document.activeElement === document.body) {
                        const firstInteractiveElement = document.querySelector('button, input, a, [tabindex]');
                        if (firstInteractiveElement) {
                            firstInteractiveElement.focus();
                        }
                    }
                }, 100);
            }, 100);
        }
    }
    
    setProgress(percent, status = null) {
        if (!this.isInitialized) return;
        
        this.currentProgress = Math.min(100, Math.max(0, percent));
        
        if (this.progressFill) {
            this.progressFill.style.width = this.currentProgress + '%';
        }
        
        if (this.progressPercent) {
            this.progressPercent.textContent = Math.round(this.currentProgress) + '%';
        }
        
        if (status && this.progressStatus) {
            this.progressStatus.textContent = status;
        }
    }
    
    incrementProgress(increment, status = null) {
        this.setProgress(this.currentProgress + increment, status);
    }
    
    async autoProgress(steps = []) {
        for (let i = 0; i < steps.length; i++) {
            const step = steps[i];
            const targetProgress = ((i + 1) / steps.length) * 100;
            
            this.setProgress(targetProgress, step.status);
            
            if (step.action) {
                await step.action();
            }
            
            if (step.delay) {
                await this.delay(step.delay);
            }
        }
    }
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    getProgress() {
        return this.currentProgress;
    }
    
    isVisible() {
        return this.loader && this.loader.style.display !== 'none';
    }
}

window.universalLoader = new UniversalLoader();

document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('universal-loader')) {
        const urlParams = new URLSearchParams(window.location.search);
        const isDataLoaded = urlParams.get('loaded') === '1';
        
        if (!isDataLoaded) {
            window.universalLoader.show('Инициализация...');
        }
    }
}); 