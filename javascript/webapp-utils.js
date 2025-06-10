class TelegramWebAppUtils {
    static activateWebApp() {
        if (window.Telegram?.WebApp) {
            const tg = window.Telegram.WebApp;
            
            tg.ready();
            tg.expand();
            setTimeout(() => {
                const clickEvent = new Event('click', { bubbles: true });
                document.body.dispatchEvent(clickEvent);
                document.body.focus();
                setTimeout(() => {
                    const touchEvent = new Event('touchstart', { bubbles: true });
                    document.body.dispatchEvent(touchEvent);
                }, 50);
            }, 100);
        }
    }
    
    static enableInteraction() {
        document.body.style.pointerEvents = 'auto';
        document.body.style.userSelect = 'auto';
        const interactiveElements = document.querySelectorAll('button, input, a, select, textarea');
        interactiveElements.forEach(element => {
            element.style.pointerEvents = 'auto';
            element.removeAttribute('disabled');
        });

        this.activateWebApp();
    }
    
    static setupPageTransition() {
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                setTimeout(() => {
                    this.enableInteraction();
                }, 100);
            }
        });

        window.addEventListener('focus', () => {
            setTimeout(() => {
                this.enableInteraction();
            }, 100);
        });

        if (window.Telegram?.WebApp) {
            const tg = window.Telegram.WebApp;

            tg.onEvent('viewportChanged', () => {
                setTimeout(() => {
                    this.enableInteraction();
                }, 200);
            });
        }
    }
    
    static initializePage() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.setupPageTransition();
                this.enableInteraction();
            });
        } else {
            this.setupPageTransition();
            this.enableInteraction();
        }
    }
}

TelegramWebAppUtils.initializePage();

window.TelegramWebAppUtils = TelegramWebAppUtils;