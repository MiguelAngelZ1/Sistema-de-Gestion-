/**
 * SISTEMA DE TEMA CLARO/OSCURO
 * Permite alternar entre modo claro y oscuro en todo el sistema
 */

class ThemeManager {
    constructor() {
        this.currentTheme = this.getStoredTheme() || 'light';
        this.init();
    }

    // Inicializar el sistema de temas
    init() {
        this.applyTheme(this.currentTheme);
        this.createToggleButton();
        this.setupEventListeners();
        
        // Log para debug
        console.log(`[ThemeManager] Tema inicializado: ${this.currentTheme}`);
    }

    // Obtener tema almacenado en localStorage
    getStoredTheme() {
        try {
            return localStorage.getItem('sistema-gestion-theme');
        } catch (error) {
            console.warn('[ThemeManager] Error al acceder a localStorage:', error);
            return null;
        }
    }

    // Guardar tema en localStorage
    setStoredTheme(theme) {
        try {
            localStorage.setItem('sistema-gestion-theme', theme);
        } catch (error) {
            console.warn('[ThemeManager] Error al guardar en localStorage:', error);
        }
    }

    // Aplicar tema al documento
    applyTheme(theme) {
        const html = document.documentElement;
        const body = document.body;
        
        if (theme === 'dark') {
            html.setAttribute('data-theme', 'dark');
            body.classList.add('dark-theme');
        } else {
            html.setAttribute('data-theme', 'light');
            body.classList.remove('dark-theme');
        }
        
        // Actualizar el ícono del botón si existe
        this.updateToggleIcon(theme);
        
        this.currentTheme = theme;
        this.setStoredTheme(theme);
        
        // Emitir evento personalizado para que otros componentes puedan reaccionar
        const themeEvent = new CustomEvent('themeChanged', {
            detail: { theme: theme }
        });
        document.dispatchEvent(themeEvent);
    }

    // Alternar entre temas
    toggleTheme() {
        const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.applyTheme(newTheme);
        
        // Animación del botón
        const button = document.getElementById('theme-toggle');
        if (button) {
            button.style.transform = 'rotate(360deg) scale(1.2)';
            setTimeout(() => {
                button.style.transform = '';
            }, 300);
        }
        
        // Feedback al usuario
        const message = newTheme === 'dark' ? 'Modo oscuro activado' : 'Modo claro activado';
        this.showToast(message);
    }

    // Crear botón de toggle
    createToggleButton() {
        // Verificar si el botón ya existe
        if (document.getElementById('theme-toggle')) {
            return;
        }

        const button = document.createElement('button');
        button.id = 'theme-toggle';
        button.className = 'theme-toggle';
        button.setAttribute('aria-label', 'Cambiar tema');
        button.setAttribute('title', 'Cambiar entre modo claro y oscuro');
        
        this.updateToggleIcon(this.currentTheme);
        
        // Insertar el botón en el body
        document.body.appendChild(button);
        
        // Evento de clic
        button.addEventListener('click', () => this.toggleTheme());
    }

    // Actualizar ícono del botón toggle
    updateToggleIcon(theme) {
        const button = document.getElementById('theme-toggle');
        if (!button) return;
        
        if (theme === 'dark') {
            button.innerHTML = '<i class="bi bi-sun-fill"></i>';
            button.setAttribute('title', 'Cambiar a modo claro');
        } else {
            button.innerHTML = '<i class="bi bi-moon-stars-fill"></i>';
            button.setAttribute('title', 'Cambiar a modo oscuro');
        }
    }

    // Setup de event listeners adicionales
    setupEventListeners() {
        // Detectar cambio de preferencia del sistema
        if (window.matchMedia) {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            mediaQuery.addListener((e) => {
                // Solo cambiar si el usuario no ha establecido una preferencia manual
                if (!this.getStoredTheme()) {
                    const systemTheme = e.matches ? 'dark' : 'light';
                    this.applyTheme(systemTheme);
                }
            });
        }

        // Keyboard shortcut: Ctrl/Cmd + Shift + T
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'T') {
                e.preventDefault();
                this.toggleTheme();
            }
        });
    }

    // Mostrar toast notification
    showToast(message) {
        // Crear elemento toast
        const toast = document.createElement('div');
        toast.className = 'toast-notification';
        toast.innerHTML = `
            <div class="toast-content">
                <i class="bi bi-palette me-2"></i>
                ${message}
            </div>
        `;
        
        // Estilos inline para el toast
        toast.style.cssText = `
            position: fixed;
            top: 130px;
            right: 20px;
            z-index: 1060;
            background: var(--primary-color);
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px var(--shadow-medium);
            transform: translateX(100%);
            transition: transform 0.3s ease;
            font-size: 0.9rem;
            font-weight: 500;
            max-width: 250px;
        `;
        
        document.body.appendChild(toast);
        
        // Animación de entrada
        setTimeout(() => {
            toast.style.transform = 'translateX(0)';
        }, 100);
        
        // Remover después de 3 segundos
        setTimeout(() => {
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (document.body.contains(toast)) {
                    document.body.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }

    // Método público para obtener el tema actual
    getCurrentTheme() {
        return this.currentTheme;
    }

    // Método público para establecer tema específico
    setTheme(theme) {
        if (theme === 'light' || theme === 'dark') {
            this.applyTheme(theme);
        }
    }
}

// Inicializar el sistema de temas cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    // Crear instancia global del administrador de temas
    window.themeManager = new ThemeManager();
    
    console.log('[ThemeManager] Sistema de temas inicializado correctamente');
});

// Exportar para uso en módulos (opcional)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ThemeManager;
}
