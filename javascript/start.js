window.Telegram.WebApp.ready();
window.Telegram.WebApp.expand();

const tg = window.Telegram.WebApp;
const user = tg.initDataUnsafe?.user;

console.log('Telegram WebApp initialized:', tg);
console.log('User data:', user);

function getUrlParameter(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}

async function loadProfileData(userid, loader) {
    try {
        loader.setProgress(90, 'Получение данных профиля...');
        
        const response = await fetch(`/api/profile?userid=${userid}`);
        const profileData = await response.json();
        
        if (profileData.success) {
            localStorage.setItem('userProfile', JSON.stringify(profileData.data));
            
            loader.setProgress(100, 'Готово!');
            await loader.delay(800);
            
            loader.hide();
            
            const userData = profileData.data;
            let displayName = '';
            if (userData.username) {
                displayName = '@' + userData.username;
            } else if (userData.name) {
                displayName = userData.name;
            } else if (userData.first_name) {
                displayName = userData.first_name;
            } else {
                displayName = 'Пользователь';
            }
            
            const encodedName = encodeURIComponent(displayName);
            window.location.href = `/html/home.html?userid=${userid}&loaded=1&name=${encodedName}`;
        } else {
            throw new Error('Failed to load profile data');
        }
    } catch (error) {
        console.error('Error loading profile data:', error);
        loader.setProgress(100, 'Ошибка загрузки');
        await loader.delay(1000);
        loader.hide();
        
        window.location.href = `/html/home.html?userid=${userid}&loaded=1`;
    }
}

async function initUser() {
    const loader = window.universalLoader;
    
    try {
        if (!loader.isVisible()) {
            loader.show('Инициализация...');
        }
        
        loader.setProgress(20, 'Проверка пользователя...');
        await loader.delay(300);
        
        const userid = user?.id || getUrlParameter('userid');
        const referrerCode = getUrlParameter('ref');
        
        console.log('Initializing user:', userid);
        
        if (!userid) {
            throw new Error('User ID not found');
        }

        loader.setProgress(40, 'Подключение к Telegram...');
        await loader.delay(400);

        loader.setProgress(60, 'Загрузка профиля...');
        
        const requestData = {
            userid: userid,
            username: user?.username,
            first_name: user?.first_name,
            last_name: user?.last_name,
            referrer_code: referrerCode
        };
        
        const fetchPromise = fetch('/api/user/init', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestData)
        });
        
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Request timeout')), 15000)
        );
        
        const response = await Promise.race([fetchPromise, timeoutPromise]);
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        console.log('Init response:', data);
        
        if (data.success) {
            console.log('User initialization successful:', {
                is_new_user: data.is_new_user,
                is_profile_completed: data.user?.is_profile_completed,
                has_referred_by: !!data.referred_by_user
            });
            
            if (!data.is_new_user && data.user && data.user.is_profile_completed) {
                loader.setProgress(80, 'Загрузка профиля...');
                await loadProfileData(userid, loader);
            } else {
                loader.setProgress(80, 'Настройка интерфейса...');
                await loader.delay(300);
                
                loader.setProgress(100, 'Готово!');
                await loader.delay(800);
                
                loader.hide();
                
                showWelcomeScreen(data.is_new_user, data.user);
                
                if (data.is_new_user && data.referred_by_user) {
                    console.log('New user referred by:', data.referred_by_user);
                    showReferralNotification(data.referred_by_user);
                }
            }
        } else {
            throw new Error(data.error || 'Failed to initialize user');
        }
    } catch (error) {
        console.error('Error initializing user:', error);
        
        loader.setProgress(100, 'Ошибка загрузки');
        await loader.delay(1000);
        loader.hide();
        
        let errorMessage = 'Ошибка загрузки. Попробуйте перезагрузить страницу.';
        
        if (error.message === 'Request timeout') {
            errorMessage = 'Превышено время ожидания. Проверьте соединение и попробуйте снова.';
        }
        
        showError(errorMessage);
    }
}

function showWelcomeScreen(isNewUser, userData) {
    const welcomeScreen = document.getElementById('welcome-screen');
    const newUserContent = document.getElementById('new-user-content');
    const existingUserContent = document.getElementById('existing-user-content');
    
    if (!welcomeScreen) {
        console.error('Welcome screen element not found');
        return;
    }
    
    welcomeScreen.style.display = 'block';
    
    if (isNewUser || !userData.is_profile_completed) {
        if (newUserContent) {
            newUserContent.style.display = 'block';
        }
        if (existingUserContent) {
            existingUserContent.style.display = 'none';
        }
    } else {
        if (newUserContent) {
            newUserContent.style.display = 'none';
        }
        if (existingUserContent) {
            existingUserContent.style.display = 'block';
        }
    }
    
    setTimeout(setupButtonHandlers, 100);
}

function showReferralNotification(referrer) {
}

function showError(message) {
    try {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #ff4444;
            color: white;
            padding: 20px;
            border-radius: 10px;
            max-width: 80%;
            text-align: center;
            z-index: 10001;
            font-size: 14px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        `;
        errorDiv.textContent = message;
        
        if (document.body) {
            document.body.appendChild(errorDiv);
            
            setTimeout(() => {
                if (errorDiv && errorDiv.parentNode) {
                    errorDiv.parentNode.removeChild(errorDiv);
                }
            }, 10000);
        } else {
            console.error('Cannot show error message - document.body not available:', message);
        }
    } catch (error) {
        console.error('Error showing error message:', error);
        console.error('Original message was:', message);
    }
}

function tryInitUser() {
    try {
        if (typeof initUser === 'function' && window.universalLoader) {
            initUser();
            
            if (window.TelegramWebAppUtils) {
                window.TelegramWebAppUtils.enableInteraction();
            }
            return true;
        }
    } catch (error) {
        console.error('Init error:', error);
    }
    return false;
}

function setupButtonHandlers() {
    const startButton = document.getElementById('startButton');
    const continueButton = document.getElementById('continueButton');
    
    if (startButton && !startButton.hasAttribute('data-handler-set')) {
        startButton.addEventListener('click', function() {
            const userid = user?.id || getUrlParameter('userid');
            if (userid) {
                window.location.href = `/html/FORM-START.html?userid=${userid}`;
            }
        });
        startButton.setAttribute('data-handler-set', 'true');
    }
    
    if (continueButton && !continueButton.hasAttribute('data-handler-set')) {
        continueButton.addEventListener('click', function() {
            const userid = user?.id || getUrlParameter('userid');
            if (userid) {
                window.location.href = `/html/home.html?userid=${userid}`;
            }
        });
        continueButton.setAttribute('data-handler-set', 'true');
    }
}

document.addEventListener('DOMContentLoaded', function() {
    setupButtonHandlers();
    
    if (tryInitUser()) return;
    
    setTimeout(() => {
        if (tryInitUser()) return;
        
        setTimeout(() => {
            tryInitUser();
        }, 1000);
    }, 200);
});

if (tg.themeParams) {
    document.documentElement.style.setProperty('--tg-theme-bg-color', tg.themeParams.bg_color);
    document.documentElement.style.setProperty('--tg-theme-text-color', tg.themeParams.text_color);
    document.documentElement.style.setProperty('--tg-theme-hint-color', tg.themeParams.hint_color);
    document.documentElement.style.setProperty('--tg-theme-link-color', tg.themeParams.link_color);
    document.documentElement.style.setProperty('--tg-theme-button-color', tg.themeParams.button_color);
    document.documentElement.style.setProperty('--tg-theme-button-text-color', tg.themeParams.button_text_color);
} 