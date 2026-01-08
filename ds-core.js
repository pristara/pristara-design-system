// public/js/pristara/ds-core.js
/**
 * Pristara Design System - Core JavaScript
 * هسته اصلی سیستم طراحی پریستارا
 * نسخه: 1.0.0
 */

const PristaraDS = (function() {
  'use strict';

  // ====== متغیرهای داخلی ======
  const config = {
    version: '1.0.0',
    themeStorageKey: 'pristara_theme',
    themeAttribute: 'data-theme',
    defaultTheme: 'light',
    themes: ['light', 'dark', 'blue', 'green', 'purple'],
    rtl: true,
    debug: false
  };

  // ====== Utility Functions ======
  const utils = {
    /**
     * لاگ برای حالت دیباگ
     */
    log: function(...args) {
      if (config.debug) {
        console.log('[PristaraDS]', ...args);
      }
    },

    /**
     * خطا
     */
    error: function(...args) {
      console.error('[PristaraDS]', ...args);
    },

    /**
     * هشدار
     */
    warn: function(...args) {
      console.warn('[PristaraDS]', ...args);
    },

    /**
     * بررسی وجود localStorage
     */
    hasLocalStorage: function() {
      try {
        const test = '__test__';
        localStorage.setItem(test, test);
        localStorage.removeItem(test);
        return true;
      } catch (e) {
        return false;
      }
    },

    /**
     * ذخیره در localStorage
     */
    saveToStorage: function(key, value) {
      if (this.hasLocalStorage()) {
        try {
          localStorage.setItem(key, JSON.stringify(value));
          return true;
        } catch (e) {
          this.error('خطا در ذخیره‌سازی:', e);
          return false;
        }
      }
      return false;
    },

    /**
     * خواندن از localStorage
     */
    getFromStorage: function(key) {
      if (this.hasLocalStorage()) {
        try {
          const item = localStorage.getItem(key);
          return item ? JSON.parse(item) : null;
        } catch (e) {
          this.error('خطا در خواندن از ذخیره‌سازی:', e);
          return null;
        }
      }
      return null;
    },

    /**
     * حذف از localStorage
     */
    removeFromStorage: function(key) {
      if (this.hasLocalStorage()) {
        try {
          localStorage.removeItem(key);
          return true;
        } catch (e) {
          this.error('خطا در حذف از ذخیره‌سازی:', e);
          return false;
        }
      }
      return false;
    },

    /**
     * انتشار رویداد سفارشی
     */
    dispatchEvent: function(eventName, detail = {}) {
      const event = new CustomEvent(`pristara.${eventName}`, {
        detail: {
          timestamp: Date.now(),
          ...detail
        }
      });
      document.dispatchEvent(event);
      this.log(`رویداد "${eventName}" منتشر شد`, detail);
    },

    /**
     * دریافت تم سیستمی
     */
    getSystemTheme: function() {
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
      return 'light';
    },

    /**
     * اضافه کردن کلاس به body
     */
    addBodyClass: function(className) {
      document.body.classList.add(className);
    },

    /**
     * حذف کلاس از body
     */
    removeBodyClass: function(className) {
      document.body.classList.remove(className);
    },

    /**
     * بررسی وجود کلاس در body
     */
    hasBodyClass: function(className) {
      return document.body.classList.contains(className);
    },

    /**
     * تنظیم attribute روی html
     */
    setHtmlAttribute: function(name, value) {
      document.documentElement.setAttribute(name, value);
    },

    /**
     * حذف attribute از html
     */
    removeHtmlAttribute: function(name) {
      document.documentElement.removeAttribute(name);
    },

    /**
     * دریافت attribute از html
     */
    getHtmlAttribute: function(name) {
      return document.documentElement.getAttribute(name);
    },

    /**
     * تاخیر (delay)
     */
    delay: function(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    },

    /**
     * اعتبارسنجی نام تم
     */
    isValidTheme: function(theme) {
      return config.themes.includes(theme);
    }
  };

  // ====== Theme Manager ======
  const themeManager = {
    /**
     * دریافت تم فعلی
     */
    getCurrentTheme: function() {
      const savedTheme = utils.getFromStorage(config.themeStorageKey);
      const htmlTheme = utils.getHtmlAttribute(config.themeAttribute);
      
      if (savedTheme && utils.isValidTheme(savedTheme)) {
        return savedTheme;
      } else if (htmlTheme && utils.isValidTheme(htmlTheme)) {
        return htmlTheme;
      } else if (utils.hasBodyClass('psa-theme-dark')) {
        return 'dark';
      } else if (utils.hasBodyClass('psa-theme-light')) {
        return 'light';
      } else {
        return config.defaultTheme;
      }
    },

    /**
     * تنظیم تم جدید
     */
    setTheme: function(theme, persist = true) {
      if (!utils.isValidTheme(theme)) {
        utils.error(`تم "${theme}" نامعتبر است. تم‌های مجاز:`, config.themes);
        return false;
      }

      const oldTheme = this.getCurrentTheme();
      
      // حذف تم قبلی
      config.themes.forEach(t => {
        utils.removeBodyClass(`psa-theme-${t}`);
        utils.removeHtmlAttribute(`${config.themeAttribute}-${t}`);
      });
      
      // حذف attribute تم قبلی
      utils.removeHtmlAttribute(config.themeAttribute);
      
      // اضافه کردن تم جدید
      utils.addBodyClass(`psa-theme-${theme}`);
      utils.setHtmlAttribute(config.themeAttribute, theme);
      
      // ذخیره در صورت درخواست
      if (persist) {
        utils.saveToStorage(config.themeStorageKey, theme);
      }
      
      // انتشار رویداد تغییر تم
      utils.dispatchEvent('themeChange', {
        oldTheme: oldTheme,
        newTheme: theme,
        persisted: persist
      });
      
      utils.log(`تم تغییر کرد از "${oldTheme}" به "${theme}"`);
      return true;
    },

    /**
     * تغییر تم (toggle بین light و dark)
     */
    toggleTheme: function() {
      const current = this.getCurrentTheme();
      const newTheme = current === 'light' ? 'dark' : 'light';
      return this.setTheme(newTheme);
    },

    /**
     * بازنشانی به تم پیش‌فرض
     */
    resetTheme: function() {
      utils.removeFromStorage(config.themeStorageKey);
      return this.setTheme(config.defaultTheme, false);
    },

    /**
     * همگام‌سازی با تم سیستمی
     */
    syncWithSystem: function() {
      const systemTheme = utils.getSystemTheme();
      const currentTheme = this.getCurrentTheme();
      
      // فقط اگر کاربر به صورت دستی تم را تغییر نداده باشد
      const savedTheme = utils.getFromStorage(config.themeStorageKey);
      if (!savedTheme) {
        if (systemTheme !== currentTheme) {
          this.setTheme(systemTheme, false);
        }
      }
    },

    /**
     * راه‌اندازی نظارت بر تغییرات تم سیستمی
     */
    watchSystemTheme: function() {
      if (window.matchMedia) {
        const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        
        const handleChange = (e) => {
          const newTheme = e.matches ? 'dark' : 'light';
          const savedTheme = utils.getFromStorage(config.themeStorageKey);
          
          // فقط اگر کاربر به صورت دستی تم را تغییر نداده باشد
          if (!savedTheme) {
            this.setTheme(newTheme, false);
          }
        };
        
        // اضافه کردن listener
        darkModeMediaQuery.addEventListener('change', handleChange);
        
        // ذخیره reference برای حذف بعدی
        this.systemThemeWatcher = darkModeMediaQuery;
        this.systemThemeHandler = handleChange;
        
        utils.log('نظارت بر تغییرات تم سیستمی فعال شد');
      }
    },

    /**
     * توقف نظارت بر تغییرات تم سیستمی
     */
    unwatchSystemTheme: function() {
      if (this.systemThemeWatcher && this.systemThemeHandler) {
        this.systemThemeWatcher.removeEventListener('change', this.systemThemeHandler);
        delete this.systemThemeWatcher;
        delete this.systemThemeHandler;
        utils.log('نظارت بر تغییرات تم سیستمی غیرفعال شد');
      }
    },

    /**
     * دریافت لیست تم‌های موجود
     */
    getAvailableThemes: function() {
      return [...config.themes];
    },

    /**
     * بررسی اینکه آیا تم ذخیره شده است
     */
    hasSavedTheme: function() {
      return !!utils.getFromStorage(config.themeStorageKey);
    }
  };

  // ====== Component Manager ======
  const componentManager = {
    /**
     * ایجاد toast
     */
    showToast: function(options) {
      const defaults = {
        message: '',
        type: 'info', // info, success, warning, error
        duration: 5000,
        position: 'top-right', // top-right, top-left, bottom-right, bottom-left, top-center, bottom-center
        closeButton: true,
        action: null,
        actionText: 'انجام شد'
      };
      
      const settings = { ...defaults, ...options };
      
      // ساخت toast element
      const toast = document.createElement('div');
      toast.className = `psa-toast psa-toast-${settings.type} psa-toast-${settings.position}`;
      toast.setAttribute('role', 'alert');
      toast.setAttribute('aria-live', 'assertive');
      toast.setAttribute('aria-atomic', 'true');
      
      // محتوای toast
      toast.innerHTML = `
        <div class="psa-toast-content">
          <div class="psa-toast-message">${settings.message}</div>
          ${settings.action ? `
            <button class="psa-toast-action" data-action="toast-action">
              ${settings.actionText}
            </button>
          ` : ''}
          ${settings.closeButton ? `
            <button class="psa-toast-close" data-action="toast-close" aria-label="بستن">
              &times;
            </button>
          ` : ''}
        </div>
      `;
      
      // اضافه کردن به DOM
      const container = this.getToastContainer(settings.position);
      container.appendChild(toast);
      
      // نمایش با انیمیشن
      setTimeout(() => {
        toast.classList.add('psa-toast-show');
      }, 10);
      
      // رویداد action
      if (settings.action) {
        const actionBtn = toast.querySelector('[data-action="toast-action"]');
        actionBtn.addEventListener('click', () => {
          settings.action();
          this.hideToast(toast);
        });
      }
      
      // رویداد close
      const closeBtn = toast.querySelector('[data-action="toast-close"]');
      if (closeBtn) {
        closeBtn.addEventListener('click', () => this.hideToast(toast));
      }
      
      // حذف خودکار
      if (settings.duration > 0) {
        setTimeout(() => {
          this.hideToast(toast);
        }, settings.duration);
      }
      
      // انتشار رویداد
      utils.dispatchEvent('toastShow', {
        id: toast.id,
        message: settings.message,
        type: settings.type
      });
      
      return toast.id;
    },
    
    /**
     * مخفی کردن toast
     */
    hideToast: function(toast) {
      toast.classList.remove('psa-toast-show');
      toast.classList.add('psa-toast-hide');
      
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
      
      utils.dispatchEvent('toastHide', {
        id: toast.id
      });
    },
    
    /**
     * دریافت container مناسب برای toast
     */
    getToastContainer: function(position) {
      const containerId = `psa-toast-container-${position}`;
      let container = document.getElementById(containerId);
      
      if (!container) {
        container = document.createElement('div');
        container.id = containerId;
        container.className = `psa-toast-container psa-toast-container-${position}`;
        document.body.appendChild(container);
      }
      
      return container;
    },
    
    /**
     * نمایش loading overlay
     */
    showLoading: function(options = {}) {
      const defaults = {
        message: 'لطفاً صبر کنید...',
        overlay: true,
        spinner: true,
        backdrop: true,
        target: document.body
      };
      
      const settings = { ...defaults, ...options };
      
      // ساخت loading element
      const loading = document.createElement('div');
      loading.className = 'psa-loading';
      if (settings.overlay) loading.classList.add('psa-loading-overlay');
      if (settings.backdrop) loading.classList.add('psa-loading-backdrop');
      
      loading.innerHTML = `
        <div class="psa-loading-content">
          ${settings.spinner ? '<div class="psa-spinner"></div>' : ''}
          ${settings.message ? `<div class="psa-loading-message">${settings.message}</div>` : ''}
        </div>
      `;
      
      // اضافه کردن به DOM
      if (settings.target === document.body) {
        document.body.appendChild(loading);
        document.body.classList.add('psa-loading-active');
      } else {
        settings.target.appendChild(loading);
        settings.target.classList.add('psa-loading-active');
      }
      
      // نمایش با انیمیشن
      setTimeout(() => {
        loading.classList.add('psa-loading-show');
      }, 10);
      
      utils.dispatchEvent('loadingShow', {
        target: settings.target,
        message: settings.message
      });
      
      return {
        hide: () => this.hideLoading(loading, settings.target)
      };
    },
    
    /**
     * مخفی کردن loading
     */
    hideLoading: function(loadingElement, target) {
      loadingElement.classList.remove('psa-loading-show');
      loadingElement.classList.add('psa-loading-hide');
      
      setTimeout(() => {
        if (loadingElement.parentNode) {
          loadingElement.parentNode.removeChild(loadingElement);
        }
        
        if (target === document.body) {
          document.body.classList.remove('psa-loading-active');
        } else {
          target.classList.remove('psa-loading-active');
        }
      }, 300);
      
      utils.dispatchEvent('loadingHide', {
        target: target
      });
    },
    
    /**
     * ایجاد modal
     */
    showModal: function(options) {
      const defaults = {
        title: '',
        content: '',
        size: 'md', // sm, md, lg, xl
        closeButton: true,
        backdrop: true,
        closeOnBackdropClick: true,
        buttons: [],
        onClose: null,
        onOpen: null
      };
      
      const settings = { ...defaults, ...options };
      
      // ساخت modal element
      const modal = document.createElement('div');
      modal.className = `psa-modal psa-modal-${settings.size}`;
      if (settings.backdrop) modal.classList.add('psa-modal-backdrop');
      
      modal.innerHTML = `
        <div class="psa-modal-dialog" role="document">
          <div class="psa-modal-content">
            ${settings.title ? `
              <div class="psa-modal-header">
                <h3 class="psa-modal-title">${settings.title}</h3>
                ${settings.closeButton ? `
                  <button type="button" class="psa-modal-close" data-action="modal-close" aria-label="بستن">
                    &times;
                  </button>
                ` : ''}
              </div>
            ` : ''}
            <div class="psa-modal-body">
              ${typeof settings.content === 'string' ? settings.content : ''}
            </div>
            ${settings.buttons.length > 0 ? `
              <div class="psa-modal-footer">
                ${settings.buttons.map((btn, index) => `
                  <button type="button" 
                          class="psa-btn ${btn.className || ''}"
                          data-action="modal-button"
                          data-button-index="${index}">
                    ${btn.text}
                  </button>
                `).join('')}
              </div>
            ` : ''}
          </div>
        </div>
      `;
      
      // اضافه کردن به DOM
      document.body.appendChild(modal);
      document.body.classList.add('psa-modal-open');
      
      // اگر content یک element است
      if (typeof settings.content !== 'string') {
        const body = modal.querySelector('.psa-modal-body');
        body.innerHTML = '';
        body.appendChild(settings.content);
      }
      
      // نمایش با انیمیشن
      setTimeout(() => {
        modal.classList.add('psa-modal-show');
        if (settings.onOpen) settings.onOpen();
      }, 10);
      
      // رویداد close
      const closeBtn = modal.querySelector('[data-action="modal-close"]');
      if (closeBtn) {
        closeBtn.addEventListener('click', () => this.hideModal(modal, settings.onClose));
      }
      
      // رویداد backdrop click
      if (settings.closeOnBackdropClick) {
        modal.addEventListener('click', (e) => {
          if (e.target === modal) {
            this.hideModal(modal, settings.onClose);
          }
        });
      }
      
      // رویدادهای دکمه‌ها
      const buttons = modal.querySelectorAll('[data-action="modal-button"]');
      buttons.forEach((btn, index) => {
        btn.addEventListener('click', () => {
          if (settings.buttons[index].onClick) {
            settings.buttons[index].onClick();
          }
          if (settings.buttons[index].closeOnClick !== false) {
            this.hideModal(modal, settings.onClose);
          }
        });
      });
      
      // رویداد escape key
      const handleEscape = (e) => {
        if (e.key === 'Escape') {
          this.hideModal(modal, settings.onClose);
        }
      };
      
      document.addEventListener('keydown', handleEscape);
      modal._escapeHandler = handleEscape;
      
      utils.dispatchEvent('modalShow', {
        title: settings.title,
        size: settings.size
      });
      
      return {
        hide: () => this.hideModal(modal, settings.onClose),
        element: modal
      };
    },
    
    /**
     * مخفی کردن modal
     */
    hideModal: function(modalElement, onCloseCallback) {
      modalElement.classList.remove('psa-modal-show');
      modalElement.classList.add('psa-modal-hide');
      
      setTimeout(() => {
        if (modalElement.parentNode) {
          modalElement.parentNode.removeChild(modalElement);
        }
        
        document.body.classList.remove('psa-modal-open');
        
        // حذف event listener
        if (modalElement._escapeHandler) {
          document.removeEventListener('keydown', modalElement._escapeHandler);
        }
        
        if (onCloseCallback) onCloseCallback();
      }, 300);
      
      utils.dispatchEvent('modalHide');
    },
    
    /**
     * فعال‌سازی tooltip
     */
    initTooltips: function(selector = '[data-psa-tooltip]') {
      const elements = document.querySelectorAll(selector);
      
      elements.forEach(element => {
        const tooltipText = element.getAttribute('data-psa-tooltip');
        const position = element.getAttribute('data-psa-tooltip-position') || 'top';
        
        // ساخت tooltip element
        const tooltip = document.createElement('div');
        tooltip.className = `psa-tooltip psa-tooltip-${position}`;
        tooltip.textContent = tooltipText;
        tooltip.setAttribute('role', 'tooltip');
        
        // اضافه کردن به DOM
        document.body.appendChild(tooltip);
        
        // موقعیت‌دهی
        const updatePosition = () => {
          const rect = element.getBoundingClientRect();
          
          switch (position) {
            case 'top':
              tooltip.style.top = `${rect.top - tooltip.offsetHeight - 8}px`;
              tooltip.style.left = `${rect.left + (rect.width - tooltip.offsetWidth) / 2}px`;
              break;
            case 'bottom':
              tooltip.style.top = `${rect.bottom + 8}px`;
              tooltip.style.left = `${rect.left + (rect.width - tooltip.offsetWidth) / 2}px`;
              break;
            case 'left':
              tooltip.style.top = `${rect.top + (rect.height - tooltip.offsetHeight) / 2}px`;
              tooltip.style.left = `${rect.left - tooltip.offsetWidth - 8}px`;
              break;
            case 'right':
              tooltip.style.top = `${rect.top + (rect.height - tooltip.offsetHeight) / 2}px`;
              tooltip.style.left = `${rect.right + 8}px`;
              break;
          }
        };
        
        // رویدادها
        const showTooltip = () => {
          tooltip.classList.add('psa-tooltip-show');
          updatePosition();
        };
        
        const hideTooltip = () => {
          tooltip.classList.remove('psa-tooltip-show');
        };
        
        element.addEventListener('mouseenter', showTooltip);
        element.addEventListener('mouseleave', hideTooltip);
        element.addEventListener('focus', showTooltip);
        element.addEventListener('blur', hideTooltip);
        
        // ذخیره reference
        element._tooltip = tooltip;
        element._tooltipHandlers = { showTooltip, hideTooltip };
        
        // موقعیت‌دهی اولیه
        updatePosition();
      });
      
      utils.log(`Tooltip ها برای ${elements.length} المان فعال شد`);
    },
    
    /**
     * غیرفعال‌سازی tooltip
     */
    destroyTooltips: function(selector = '[data-psa-tooltip]') {
      const elements = document.querySelectorAll(selector);
      
      elements.forEach(element => {
        if (element._tooltipHandlers) {
          element.removeEventListener('mouseenter', element._tooltipHandlers.showTooltip);
          element.removeEventListener('mouseleave', element._tooltipHandlers.hideTooltip);
          element.removeEventListener('focus', element._tooltipHandlers.showTooltip);
          element.removeEventListener('blur', element._tooltipHandlers.hideTooltip);
          
          delete element._tooltipHandlers;
        }
        
        if (element._tooltip && element._tooltip.parentNode) {
          element._tooltip.parentNode.removeChild(element._tooltip);
          delete element._tooltip;
        }
      });
      
      utils.log(`Tooltip ها برای ${elements.length} المان غیرفعال شد`);
    }
  };

  // ====== Public API ======
  return {
    /**
     * تنظیمات
     */
    config: config,
    
    /**
     * راه‌اندازی اولیه سیستم طراحی
     */
    init: function(options = {}) {
      // اعمال تنظیمات
      if (options.debug !== undefined) {
        config.debug = options.debug;
      }
      
      if (options.defaultTheme && utils.isValidTheme(options.defaultTheme)) {
        config.defaultTheme = options.defaultTheme;
      }
      
      utils.log('Pristara Design System در حال راه‌اندازی...');
      utils.log(`نسخه: ${config.version}`);
      utils.log(`RTL: ${config.rtl ? 'فعال' : 'غیرفعال'}`);
      
      // تنظیم RTL
      if (config.rtl) {
        document.documentElement.setAttribute('dir', 'rtl');
        utils.addBodyClass('psa-rtl');
      }
      
      // تنظیم تم
      const savedTheme = utils.getFromStorage(config.themeStorageKey);
      if (savedTheme && utils.isValidTheme(savedTheme)) {
        themeManager.setTheme(savedTheme, false);
      } else {
        themeManager.syncWithSystem();
      }
      
      // شروع نظارت بر تغییرات تم سیستمی
      themeManager.watchSystemTheme();
      
      // انتشار رویداد راه‌اندازی
      utils.dispatchEvent('init', {
        version: config.version,
        theme: themeManager.getCurrentTheme(),
        rtl: config.rtl
      });
      
      utils.log('Pristara Design System با موفقیت راه‌اندازی شد');
      utils.log(`تم فعلی: ${themeManager.getCurrentTheme()}`);
      
      return this;
    },
    
    /**
     * تخریب و پاک‌سازی
     */
    destroy: function() {
      // توقف نظارت بر تم سیستمی
      themeManager.unwatchSystemTheme();
      
      // پاک‌سازی event listeners
      // (در نسخه کامل باید همه event listeners مدیریت شوند)
      
      utils.log('Pristara Design System تخریب شد');
      utils.dispatchEvent('destroy');
    },
    
    /**
     * ====== Theme API ======
     */
    theme: {
      /**
       * دریافت تم فعلی
       */
      get: function() {
        return themeManager.getCurrentTheme();
      },
      
      /**
       * تنظیم تم جدید
       */
      set: function(theme) {
        return themeManager.setTheme(theme);
      },
      
      /**
       * تغییر تم (toggle)
       */
      toggle: function() {
        return themeManager.toggleTheme();
      },
      
      /**
       * بازنشانی به تم پیش‌فرض
       */
      reset: function() {
        return themeManager.resetTheme();
      },
      
      /**
       * دریافت لیست تم‌ها
       */
      list: function() {
        return themeManager.getAvailableThemes();
      },
      
      /**
       * همگام‌سازی با تم سیستمی
       */
      sync: function() {
        return themeManager.syncWithSystem();
      },
      
      /**
       * بررسی وجود تم ذخیره شده
       */
      hasSaved: function() {
        return themeManager.hasSavedTheme();
      }
    },
    
    /**
     * ====== Component API ======
     */
    components: {
      /**
       * نمایش toast
       */
      toast: function(options) {
        return componentManager.showToast(options);
      },
      
      /**
       * نمایش loading
       */
      loading: function(options) {
        return componentManager.showLoading(options);
      },
      
      /**
       * نمایش modal
       */
      modal: function(options) {
        return componentManager.showModal(options);
      },
      
      /**
       * فعال‌سازی tooltip ها
       */
      initTooltips: function(selector) {
        return componentManager.initTooltips(selector);
      },
      
      /**
       * غیرفعال‌سازی tooltip ها
       */
      destroyTooltips: function(selector) {
        return componentManager.destroyTooltips(selector);
      }
    },
    
    /**
     * ====== Utility API ======
     */
    utils: {
      /**
       * فعال‌سازی حالت دیباگ
       */
      debug: function(enable = true) {
        config.debug = enable;
        utils.log(`حالت دیباگ ${enable ? 'فعال' : 'غیرفعال'} شد`);
      },
      
      /**
       * انتشار رویداد سفارشی
       */
      dispatch: function(eventName, detail) {
        return utils.dispatchEvent(eventName, detail);
      },
      
      /**
       * تاخیر
       */
      delay: function(ms) {
        return utils.delay(ms);
      },
      
      /**
       * بررسی localStorage
       */
      hasStorage: function() {
        return utils.hasLocalStorage();
      }
    },
    
    /**
     * ====== Version Info ======
     */
    version: config.version,
    
    /**
     * ====== Event Listeners ======
     */
    on: function(eventName, callback) {
      document.addEventListener(`pristara.${eventName}`, callback);
      return this;
    },
    
    off: function(eventName, callback) {
      document.removeEventListener(`pristara.${eventName}`, callback);
      return this;
    }
  };
})();

// خودکار راه‌اندازی شود وقتی DOM آماده است
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function() {
    PristaraDS.init();
  });
} else {
  PristaraDS.init();
}

// در دسترس قرار دادن در scope جهانی
if (typeof window !== 'undefined') {
  window.PristaraDS = PristaraDS;
}

// export برای ماژول‌ها
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PristaraDS;
}

export default PristaraDS;