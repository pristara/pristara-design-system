// public/js/pristara/theme-manager.js
/**
 * Pristara Design System - Advanced Theme Manager
 * مدیریت پیشرفته تم‌های سیستم طراحی پریستارا
 */

const PristaraThemeManager = (function() {
  'use strict';

  // ====== Utility Functions ======
  const utils = {
    log: function(...args) {
      if (window.PristaraDS && window.PristaraDS.config.debug) {
        console.log('[PristaraThemeManager]', ...args);
      }
    },

    error: function(...args) {
      console.error('[PristaraThemeManager]', ...args);
    },

    /**
     * بررسی وجود PristaraDS
     */
    checkDependency: function() {
      if (!window.PristaraDS) {
        this.error('PristaraDS یافت نشد. لطفا ابتدا فایل ds-core.js را بارگذاری کنید.');
        return false;
      }
      return true;
    },

    /**
     * انتشار رویداد
     */
    dispatchEvent: function(eventName, detail = {}) {
      if (window.PristaraDS) {
        window.PristaraDS.utils.dispatch(eventName, detail);
      } else {
        const event = new CustomEvent(`pristara.theme.${eventName}`, { detail });
        document.dispatchEvent(event);
      }
    },

    /**
     * تولید رنگ‌های تصادفی برای تم‌های پویا
     */
    generateRandomColor: function() {
      const hue = Math.floor(Math.random() * 360);
      return `hsl(${hue}, 70%, 50%)`;
    },

    /**
     * تبدیل hex به rgb
     */
    hexToRgb: function(hex) {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : null;
    },

    /**
     * تبدیل rgb به hex
     */
    rgbToHex: function(r, g, b) {
      return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    },

    /**
     * محاسبه کنتراست رنگ
     */
    getContrastRatio: function(color1, color2) {
      const luminance1 = this.getLuminance(color1);
      const luminance2 = this.getLuminance(color2);
      const brightest = Math.max(luminance1, luminance2);
      const darkest = Math.min(luminance1, luminance2);
      return (brightest + 0.05) / (darkest + 0.05);
    },

    /**
     * محاسبه luminance رنگ
     */
    getLuminance: function(color) {
      const rgb = this.hexToRgb(color);
      if (!rgb) return 0;
      
      const [r, g, b] = [rgb.r / 255, rgb.g / 255, rgb.b / 255];
      
      const adjust = (c) => {
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
      };
      
      return 0.2126 * adjust(r) + 0.7152 * adjust(g) + 0.0722 * adjust(b);
    },

    /**
     * تولید سایه‌های یک رنگ
     */
    generateShades: function(baseColor, count = 10) {
      const rgb = this.hexToRgb(baseColor);
      if (!rgb) return [];
      
      const shades = [];
      for (let i = 0; i < count; i++) {
        const factor = i / (count - 1); // 0 تا 1
        const r = Math.round(rgb.r * (1 - factor) + 255 * factor);
        const g = Math.round(rgb.g * (1 - factor) + 255 * factor);
        const b = Math.round(rgb.b * (1 - factor) + 255 * factor);
        shades.push(this.rgbToHex(r, g, b));
      }
      
      return shades;
    },

    /**
     * ذخیره در localStorage با مدیریت خطا
     */
    saveToStorage: function(key, value) {
      try {
        localStorage.setItem(`pristara_theme_${key}`, JSON.stringify(value));
        return true;
      } catch (e) {
        this.error('خطا در ذخیره‌سازی تم:', e);
        return false;
      }
    },

    /**
     * خواندن از localStorage
     */
    getFromStorage: function(key) {
      try {
        const item = localStorage.getItem(`pristara_theme_${key}`);
        return item ? JSON.parse(item) : null;
      } catch (e) {
        this.error('خطا در خواندن تم:', e);
        return null;
      }
    },

    /**
     * حذف از localStorage
     */
    removeFromStorage: function(key) {
      try {
        localStorage.removeItem(`pristara_theme_${key}`);
        return true;
      } catch (e) {
        this.error('خطا در حذف تم:', e);
        return false;
      }
    }
  };

  // ====== Theme Generator ======
  const themeGenerator = {
    /**
     * تولید تم سفارشی بر اساس رنگ اصلی
     */
    generateFromColor: function(primaryColor, themeName = 'custom') {
      const rgb = utils.hexToRgb(primaryColor);
      if (!rgb) {
        utils.error('رنگ اصلی نامعتبر است:', primaryColor);
        return null;
      }

      // محاسبه رنگ‌های مرتبط
      const theme = {
        name: themeName,
        primary: primaryColor,
        primaryDark: this.darkenColor(primaryColor, 20),
        primaryLight: this.lightenColor(primaryColor, 20),
        secondary: this.generateComplementary(primaryColor),
        accent: this.generateAccent(primaryColor),
        success: '#27ae60',
        warning: '#f39c12',
        danger: '#e74c3c',
        info: '#2980b9',
        surface: '#ffffff',
        background: '#f8f9fa',
        text: {
          primary: '#212529',
          secondary: '#6c757d',
          disabled: '#adb5bd'
        },
        generatedAt: new Date().toISOString()
      };

      // محاسبه رنگ‌های معنایی خودکار
      theme.semantic = this.generateSemanticColors(theme);
      
      // تولید سایه‌ها
      theme.shades = {
        primary: utils.generateShades(primaryColor, 10),
        gray: this.generateGrayScale()
      };

      return theme;
    },

    /**
     * تیره کردن رنگ
     */
    darkenColor: function(color, percent) {
      const rgb = utils.hexToRgb(color);
      if (!rgb) return color;
      
      const factor = 1 - (percent / 100);
      const r = Math.round(rgb.r * factor);
      const g = Math.round(rgb.g * factor);
      const b = Math.round(rgb.b * factor);
      
      return utils.rgbToHex(r, g, b);
    },

    /**
     * روشن کردن رنگ
     */
    lightenColor: function(color, percent) {
      const rgb = utils.hexToRgb(color);
      if (!rgb) return color;
      
      const factor = 1 + (percent / 100);
      const r = Math.round(Math.min(255, rgb.r * factor));
      const g = Math.round(Math.min(255, rgb.g * factor));
      const b = Math.round(Math.min(255, rgb.b * factor));
      
      return utils.rgbToHex(r, g, b);
    },

    /**
     * تولید رنگ مکمل
     */
    generateComplementary: function(color) {
      const rgb = utils.hexToRgb(color);
      if (!rgb) return '#3498db';
      
      // چرخش ۱۸۰ درجه در دایره رنگ
      const r = 255 - rgb.r;
      const g = 255 - rgb.g;
      const b = 255 - rgb.b;
      
      return utils.rgbToHex(r, g, b);
    },

    /**
     * تولید رنگ accent
     */
    generateAccent: function(color) {
      const rgb = utils.hexToRgb(color);
      if (!rgb) return '#f39c12';
      
      // چرخش ۶۰ درجه در دایره رنگ
      const hue = this.rgbToHue(rgb.r, rgb.g, rgb.b);
      const newHue = (hue + 60) % 360;
      
      return this.hslToHex(newHue, 70, 50);
    },

    /**
     * تولید رنگ‌های معنایی
     */
    generateSemanticColors: function(theme) {
      return {
        primary: theme.primary,
        secondary: theme.secondary,
        success: this.adjustColorForContrast(theme.success, theme.background),
        warning: this.adjustColorForContrast(theme.warning, theme.background),
        danger: this.adjustColorForContrast(theme.danger, theme.background),
        info: this.adjustColorForContrast(theme.info, theme.background)
      };
    },

    /**
     * تنظیم رنگ برای کنتراست مناسب
     */
    adjustColorForContrast: function(color, background, minContrast = 4.5) {
      let currentColor = color;
      let contrast = utils.getContrastRatio(currentColor, background);
      
      // اگر کنتراست کافی نباشد، رنگ را تنظیم کن
      if (contrast < minContrast) {
        const rgb = utils.hexToRgb(currentColor);
        if (!rgb) return color;
        
        // روشن یا تیره کردن تا رسیدن به کنتراست مناسب
        const isDark = utils.getLuminance(background) < 0.5;
        let attempts = 0;
        
        while (contrast < minContrast && attempts < 20) {
          if (isDark) {
            // اگر background تیره است، رنگ را روشن کن
            currentColor = this.lightenColor(currentColor, 10);
          } else {
            // اگر background روشن است، رنگ را تیره کن
            currentColor = this.darkenColor(currentColor, 10);
          }
          
          contrast = utils.getContrastRatio(currentColor, background);
          attempts++;
        }
      }
      
      return currentColor;
    },

    /**
     * تولید طیف خاکستری
     */
    generateGrayScale: function() {
      const grays = [];
      for (let i = 0; i <= 9; i++) {
        const value = Math.round(255 * (i / 10));
        const hex = utils.rgbToHex(value, value, value);
        grays.push(hex);
      }
      return grays;
    },

    /**
     * تبدیل RGB به Hue
     */
    rgbToHue: function(r, g, b) {
      r /= 255;
      g /= 255;
      b /= 255;
      
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      let hue = 0;
      
      if (max === min) {
        hue = 0;
      } else if (max === r) {
        hue = ((g - b) / (max - min)) % 6;
      } else if (max === g) {
        hue = (b - r) / (max - min) + 2;
      } else {
        hue = (r - g) / (max - min) + 4;
      }
      
      hue = Math.round(hue * 60);
      if (hue < 0) hue += 360;
      
      return hue;
    },

    /**
     * تبدیل HSL به Hex
     */
    hslToHex: function(h, s, l) {
      h /= 360;
      s /= 100;
      l /= 100;
      
      let r, g, b;
      
      if (s === 0) {
        r = g = b = l;
      } else {
        const hue2rgb = (p, q, t) => {
          if (t < 0) t += 1;
          if (t > 1) t -= 1;
          if (t < 1/6) return p + (q - p) * 6 * t;
          if (t < 1/2) return q;
          if (t < 2/3) return p + (q - p) * (4 - 6 * t);
          return p;
        };
        
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
      }
      
      const toHex = (x) => {
        const hex = Math.round(x * 255).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
      };
      
      return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    }
  };

  // ====== Theme Registry ======
  const themeRegistry = {
    themes: {},
    currentTheme: null,
    
    /**
     * ثبت تم جدید
     */
    register: function(theme) {
      if (!theme || !theme.name) {
        utils.error('تم نامعتبر است');
        return false;
      }
      
      this.themes[theme.name] = {
        ...theme,
        registeredAt: new Date().toISOString(),
        isCustom: theme.name.startsWith('custom_')
      };
      
      utils.log(`تم "${theme.name}" ثبت شد`);
      utils.dispatchEvent('themeRegistered', { theme: theme.name });
      
      return true;
    },
    
    /**
     * حذف تم
     */
    unregister: function(themeName) {
      if (!this.themes[themeName]) {
        utils.error(`تم "${themeName}" یافت نشد`);
        return false;
      }
      
      // نمی‌توان تم پیش‌فرض را حذف کرد
      if (themeName === 'light' || themeName === 'dark') {
        utils.error('نمی‌توان تم‌های پیش‌فرض را حذف کرد');
        return false;
      }
      
      delete this.themes[themeName];
      
      utils.log(`تم "${themeName}" حذف شد`);
      utils.dispatchEvent('themeUnregistered', { theme: themeName });
      
      return true;
    },
    
    /**
     * دریافت لیست تم‌ها
     */
    list: function() {
      return Object.keys(this.themes);
    },
    
    /**
     * دریافت اطلاعات تم
     */
    get: function(themeName) {
      return this.themes[themeName] || null;
    },
    
    /**
     * بررسی وجود تم
     */
    has: function(themeName) {
      return !!this.themes[themeName];
    },
    
    /**
     * دریافت تم فعلی
     */
    getCurrent: function() {
      return this.currentTheme;
    },
    
    /**
     * تنظیم تم فعلی
     */
    setCurrent: function(themeName) {
      if (!this.themes[themeName]) {
        utils.error(`تم "${themeName}" یافت نشد`);
        return false;
      }
      
      const oldTheme = this.currentTheme;
      this.currentTheme = themeName;
      
      utils.dispatchEvent('themeChanged', {
        oldTheme: oldTheme,
        newTheme: themeName
      });
      
      return true;
    },
    
    /**
     * بارگذاری تم‌های ذخیره شده
     */
    loadSavedThemes: function() {
      const savedThemes = utils.getFromStorage('custom_themes') || {};
      Object.values(savedThemes).forEach(theme => {
        this.register(theme);
      });
      
      utils.log(`${Object.keys(savedThemes).length} تم ذخیره شده بارگذاری شد`);
    },
    
    /**
     * ذخیره تم‌های سفارشی
     */
    saveCustomThemes: function() {
      const customThemes = {};
      Object.entries(this.themes).forEach(([name, theme]) => {
        if (theme.isCustom) {
          customThemes[name] = theme;
        }
      });
      
      utils.saveToStorage('custom_themes', customThemes);
    }
  };

  // ====== CSS Variable Manager ======
  const cssManager = {
    /**
     * اعمال تم به CSS Variables
     */
    applyTheme: function(theme) {
      if (!theme) {
        utils.error('تم برای اعمال نامعتبر است');
        return false;
      }
      
      const root = document.documentElement;
      const variables = this.generateCSSVariables(theme);
      
      // اعمال متغیرها
      Object.entries(variables).forEach(([key, value]) => {
        root.style.setProperty(key, value);
      });
      
      // اضافه کردن کلاس theme
      root.setAttribute('data-theme', theme.name);
      document.body.classList.add(`psa-theme-${theme.name}`);
      
      // حذف کلاس themeهای دیگر
      Object.keys(themeRegistry.themes).forEach(otherTheme => {
        if (otherTheme !== theme.name) {
          document.body.classList.remove(`psa-theme-${otherTheme}`);
        }
      });
      
      utils.log(`تم "${theme.name}" اعمال شد`);
      return true;
    },
    
    /**
     * تولید CSS Variables از تم
     */
    generateCSSVariables: function(theme) {
      const variables = {
        // رنگ‌های اصلی
        '--psa-color-primary': theme.primary,
        '--psa-color-primary-dark': theme.primaryDark,
        '--psa-color-primary-light': theme.primaryLight,
        '--psa-color-primary-50': this.lightenColor(theme.primary, 90),
        
        // رنگ‌های معنایی
        '--psa-color-secondary': theme.secondary || theme.semantic?.secondary,
        '--psa-color-success': theme.success || theme.semantic?.success,
        '--psa-color-warning': theme.warning || theme.semantic?.warning,
        '--psa-color-danger': theme.danger || theme.semantic?.danger,
        '--psa-color-info': theme.info || theme.semantic?.info,
        
        // رنگ‌های متن
        '--psa-color-text-primary': theme.text?.primary || '#212529',
        '--psa-color-text-secondary': theme.text?.secondary || '#6c757d',
        '--psa-color-text-disabled': theme.text?.disabled || '#adb5bd',
        
        // رنگ‌های background
        '--psa-color-bg-primary': theme.background || '#ffffff',
        '--psa-color-bg-secondary': this.lightenColor(theme.background || '#ffffff', 5),
        '--psa-color-bg-tertiary': this.lightenColor(theme.background || '#ffffff', 10),
        
        // رنگ‌های border
        '--psa-color-border': this.darkenColor(theme.background || '#ffffff', 10),
        '--psa-color-divider': this.darkenColor(theme.background || '#ffffff', 5),
        
        // سایه‌های خاکستری
        '--psa-color-gray-50': theme.shades?.gray?.[0] || '#fafafa',
        '--psa-color-gray-100': theme.shades?.gray?.[1] || '#f5f5f5',
        '--psa-color-gray-200': theme.shades?.gray?.[2] || '#eeeeee',
        '--psa-color-gray-300': theme.shades?.gray?.[3] || '#e0e0e0',
        '--psa-color-gray-400': theme.shades?.gray?.[4] || '#bdbdbd',
        '--psa-color-gray-500': theme.shades?.gray?.[5] || '#9e9e9e',
        '--psa-color-gray-600': theme.shades?.gray?.[6] || '#757575',
        '--psa-color-gray-700': theme.shades?.gray?.[7] || '#616161',
        '--psa-color-gray-800': theme.shades?.gray?.[8] || '#424242',
        '--psa-color-gray-900': theme.shades?.gray?.[9] || '#212529'
      };
      
      // اضافه کردن سایه‌های رنگ اصلی
      if (theme.shades?.primary) {
        theme.shades.primary.forEach((shade, index) => {
          variables[`--psa-color-primary-${index}00`] = shade;
        });
      }
      
      return variables;
    },
    
    /**
     * روشن کردن رنگ (برای CSS)
     */
    lightenColor: function(color, percent) {
      return themeGenerator.lightenColor(color, percent);
    },
    
    /**
     * تیره کردن رنگ (برای CSS)
     */
    darkenColor: function(color, percent) {
      return themeGenerator.darkenColor(color, percent);
    },
    
    /**
     * حذف تم از CSS Variables
     */
    removeTheme: function(themeName) {
      const root = document.documentElement;
      document.body.classList.remove(`psa-theme-${themeName}`);
      
      // فقط اگر تم فعلی باشد، attribute را حذف کن
      if (root.getAttribute('data-theme') === themeName) {
        root.removeAttribute('data-theme');
      }
      
      utils.log(`تم "${themeName}" از CSS حذف شد`);
    },
    
    /**
     * به‌روزرسانی یک متغیر خاص
     */
    updateVariable: function(name, value) {
      document.documentElement.style.setProperty(name, value);
      utils.dispatchEvent('variableUpdated', { name, value });
    },
    
    /**
     * دریافت مقدار یک متغیر
     */
    getVariable: function(name) {
      return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    }
  };

  // ====== Theme Switcher UI ======
  const themeSwitcher = {
    element: null,
    isOpen: false,
    
    /**
     * ایجاد رابط کاربری تغییر تم
     */
    createUI: function(container = document.body) {
      // اگر از قبل وجود دارد
      if (this.element) {
        this.destroyUI();
      }
      
      // ساخت عنصر switcher
      const switcher = document.createElement('div');
      switcher.className = 'psa-theme-switcher';
      switcher.innerHTML = `
        <button class="psa-theme-switcher-toggle" aria-label="تغییر تم">
          <svg class="psa-theme-switcher-icon" width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" 
                  stroke="currentColor" stroke-width="2"/>
            <path d="M12 2V22" stroke="currentColor" stroke-width="2"/>
            <path d="M2 12H22" stroke="currentColor" stroke-width="2"/>
          </svg>
        </button>
        <div class="psa-theme-switcher-panel">
          <div class="psa-theme-switcher-header">
            <h4>انتخاب تم</h4>
            <button class="psa-theme-switcher-close" aria-label="بستن">&times;</button>
          </div>
          <div class="psa-theme-switcher-themes">
            <!-- تم‌ها اینجا اضافه می‌شوند -->
          </div>
          <div class="psa-theme-switcher-actions">
            <button class="psa-btn psa-btn-sm psa-btn-outline-primary psa-theme-customize-btn">
              سفارشی‌سازی
            </button>
            <button class="psa-btn psa-btn-sm psa-btn-outline-secondary psa-theme-reset-btn">
              بازنشانی
            </button>
          </div>
        </div>
      `;
      
      container.appendChild(switcher);
      this.element = switcher;
      
      // پر کردن لیست تم‌ها
      this.populateThemes();
      
      // اضافه کردن event listeners
      this.setupEventListeners();
      
      utils.log('رابط کاربری تغییر تم ایجاد شد');
      return switcher;
    },
    
    /**
     * پر کردن لیست تم‌ها
     */
    populateThemes: function() {
      const themesContainer = this.element.querySelector('.psa-theme-switcher-themes');
      if (!themesContainer) return;
      
      themesContainer.innerHTML = '';
      
      Object.entries(themeRegistry.themes).forEach(([name, theme]) => {
        const themeButton = document.createElement('button');
        themeButton.className = 'psa-theme-option';
        themeButton.setAttribute('data-theme', name);
        
        // نشان دادن تم فعلی
        if (name === themeRegistry.getCurrent()) {
          themeButton.classList.add('psa-theme-option-active');
        }
        
        themeButton.innerHTML = `
          <span class="psa-theme-option-preview" style="background-color: ${theme.primary}"></span>
          <span class="psa-theme-option-name">${this.getThemeDisplayName(name)}</span>
          ${theme.isCustom ? '<span class="psa-theme-option-badge">سفارشی</span>' : ''}
        `;
        
        themesContainer.appendChild(themeButton);
      });
    },
    
    /**
     * دریافت نام نمایشی تم
     */
    getThemeDisplayName: function(themeName) {
      const names = {
        light: 'روشن',
        dark: 'تاریک',
        blue: 'آبی',
        green: 'سبز',
        purple: 'بنفش'
      };
      
      return names[themeName] || themeName.replace('custom_', 'سفارشی ');
    },
    
    /**
     * تنظیم event listeners
     */
    setupEventListeners: function() {
      if (!this.element) return;
      
      const toggleBtn = this.element.querySelector('.psa-theme-switcher-toggle');
      const closeBtn = this.element.querySelector('.psa-theme-switcher-close');
      const panel = this.element.querySelector('.psa-theme-switcher-panel');
      const customizeBtn = this.element.querySelector('.psa-theme-customize-btn');
      const resetBtn = this.element.querySelector('.psa-theme-reset-btn');
      
      // toggle panel
      toggleBtn.addEventListener('click', () => this.togglePanel());
      
      // close panel
      closeBtn.addEventListener('click', () => this.closePanel());
      
      // کلیک خارج از panel
      document.addEventListener('click', (e) => {
        if (this.isOpen && !this.element.contains(e.target)) {
          this.closePanel();
        }
      });
      
      // انتخاب تم
      panel.addEventListener('click', (e) => {
        const themeButton = e.target.closest('.psa-theme-option');
        if (themeButton) {
          const themeName = themeButton.getAttribute('data-theme');
          themeManager.apply(themeName);
          this.closePanel();
        }
      });
      
      // سفارشی‌سازی
      if (customizeBtn) {
        customizeBtn.addEventListener('click', () => {
          this.closePanel();
          themeCustomizer.open();
        });
      }
      
      // بازنشانی
      if (resetBtn) {
        resetBtn.addEventListener('click', () => {
          themeManager.reset();
          this.closePanel();
        });
      }
    },
    
    /**
     * باز کردن panel
     */
    openPanel: function() {
      if (!this.element) return;
      
      this.element.classList.add('psa-theme-switcher-open');
      this.isOpen = true;
      
      // به‌روزرسانی لیست تم‌ها
      this.populateThemes();
      
      utils.dispatchEvent('themeSwitcherOpen');
    },
    
    /**
     * بستن panel
     */
    closePanel: function() {
      if (!this.element) return;
      
      this.element.classList.remove('psa-theme-switcher-open');
      this.isOpen = false;
      
      utils.dispatchEvent('themeSwitcherClose');
    },
    
    /**
     * toggle panel
     */
    togglePanel: function() {
      if (this.isOpen) {
        this.closePanel();
      } else {
        this.openPanel();
      }
    },
    
    /**
     * تخریب رابط کاربری
     */
    destroyUI: function() {
      if (this.element && this.element.parentNode) {
        this.element.parentNode.removeChild(this.element);
      }
      this.element = null;
      this.isOpen = false;
      
      utils.log('رابط کاربری تغییر تم حذف شد');
    }
  };

  // ====== Theme Customizer ======
  const themeCustomizer = {
    element: null,
    isOpen: false,
    
    /**
     * باز کردن customizer
     */
    open: function() {
      if (this.isOpen) return;
      
      // ساخت modal
      const modal = document.createElement('div');
      modal.className = 'psa-theme-customizer';
      modal.innerHTML = `
        <div class="psa-theme-customizer-overlay"></div>
        <div class="psa-theme-customizer-dialog">
          <div class="psa-theme-customizer-header">
            <h3>سفارشی‌سازی تم</h3>
            <button class="psa-theme-customizer-close" aria-label="بستن">&times;</button>
          </div>
          <div class="psa-theme-customizer-body">
            <div class="psa-theme-customizer-section">
              <h4>رنگ اصلی</h4>
              <div class="psa-theme-customizer-color-picker">
                <input type="color" id="psa-theme-primary-color" value="#1abc9c">
                <label for="psa-theme-primary-color">انتخاب رنگ</label>
              </div>
            </div>
            
            <div class="psa-theme-customizer-section">
              <h4>پیش‌نمایش</h4>
              <div class="psa-theme-customizer-preview">
                <div class="psa-theme-customizer-preview-card">
                  <div class="psa-card">
                    <div class="psa-card-header">
                      <h5 class="psa-card-title">کارت نمونه</h5>
                    </div>
                    <div class="psa-card-body">
                      <p>این یک پیش‌نمایش از تم سفارشی شماست.</p>
                      <div class="psa-mt-3">
                        <button class="psa-btn psa-btn-primary psa-mr-2">دکمه اصلی</button>
                        <button class="psa-btn psa-btn-outline-primary">دکمه outline</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="psa-theme-customizer-section">
              <h4>نام تم</h4>
              <input type="text" 
                     class="psa-form-control" 
                     id="psa-theme-name" 
                     placeholder="نام تم سفارشی"
                     maxlength="20">
            </div>
          </div>
          <div class="psa-theme-customizer-footer">
            <button class="psa-btn psa-btn-secondary psa-theme-customizer-cancel">
              انصراف
            </button>
            <button class="psa-btn psa-btn-primary psa-theme-customizer-save">
              ذخیره تم
            </button>
          </div>
        </div>
      `;
      
      document.body.appendChild(modal);
      document.body.classList.add('psa-theme-customizer-open');
      this.element = modal;
      this.isOpen = true;
      
      // تنظیم event listeners
      this.setupEventListeners();
      
      // پیش‌نمایش real-time
      this.setupRealTimePreview();
      
      utils.dispatchEvent('themeCustomizerOpen');
    },
    
    /**
     * تنظیم event listeners
     */
    setupEventListeners: function() {
      if (!this.element) return;
      
      const closeBtn = this.element.querySelector('.psa-theme-customizer-close');
      const cancelBtn = this.element.querySelector('.psa-theme-customizer-cancel');
      const saveBtn = this.element.querySelector('.psa-theme-customizer-save');
      const overlay = this.element.querySelector('.psa-theme-customizer-overlay');
      
      // بستن
      const close = () => this.close();
      
      closeBtn.addEventListener('click', close);
      cancelBtn.addEventListener('click', close);
      overlay.addEventListener('click', close);
      
      // ذخیره
      saveBtn.addEventListener('click', () => this.saveCustomTheme());
      
      // کلید Escape
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.isOpen) {
          close();
        }
      });
    },
    
    /**
     * تنظیم پیش‌نمایش real-time
     */
    setupRealTimePreview: function() {
      const colorInput = this.element.querySelector('#psa-theme-primary-color');
      if (!colorInput) return;
      
      colorInput.addEventListener('input', (e) => {
        const color = e.target.value;
        this.updatePreview(color);
      });
    },
    
    /**
     * به‌روزرسانی پیش‌نمایش
     */
    updatePreview: function(primaryColor) {
      // تولید تم موقت
      const tempTheme = themeGenerator.generateFromColor(primaryColor, 'temp');
      if (!tempTheme) return;
      
      // اعمال موقت به preview
      const previewCard = this.element.querySelector('.psa-theme-customizer-preview-card');
      if (!previewCard) return;
      
      // ایجاد style موقت
      let style = previewCard.querySelector('.psa-theme-preview-style');
      if (!style) {
        style = document.createElement('style');
        style.className = 'psa-theme-preview-style';
        previewCard.appendChild(style);
      }
      
      // تولید CSS variables برای preview
      const variables = cssManager.generateCSSVariables(tempTheme);
      const css = Object.entries(variables)
        .map(([key, value]) => `${key}: ${value};`)
        .join('\n');
      
      style.textContent = `
        .psa-theme-customizer-preview-card {
          ${css}
        }
      `;
    },
    
    /**
     * ذخیره تم سفارشی
     */
    saveCustomTheme: function() {
      const colorInput = this.element.querySelector('#psa-theme-primary-color');
      const nameInput = this.element.querySelector('#psa-theme-name');
      
      if (!colorInput || !nameInput) return;
      
      const primaryColor = colorInput.value;
      let themeName = nameInput.value.trim();
      
      if (!themeName) {
        themeName = `custom_${Date.now()}`;
      } else {
        themeName = `custom_${themeName.toLowerCase().replace(/\s+/g, '_')}`;
      }
      
      // تولید تم
      const theme = themeGenerator.generateFromColor(primaryColor, themeName);
      if (!theme) return;
      
      // ثبت تم
      themeRegistry.register(theme);
      
      // ذخیره تم‌های سفارشی
      themeRegistry.saveCustomThemes();
      
      // اعمال تم
      themeManager.apply(themeName);
      
      // بستن customizer
      this.close();
      
      // نمایش پیام موفقیت
      if (window.PristaraDS) {
        window.PristaraDS.components.toast({
          message: 'تم سفارشی با موفقیت ذخیره شد',
          type: 'success',
          duration: 3000
        });
      }
    },
    
    /**
     * بستن customizer
     */
    close: function() {
      if (!this.element || !this.isOpen) return;
      
      document.body.classList.remove('psa-theme-customizer-open');
      this.element.parentNode.removeChild(this.element);
      this.element = null;
      this.isOpen = false;
      
      utils.dispatchEvent('themeCustomizerClose');
    }
  };

  // ====== Theme Manager (Main) ======
  const themeManager = {
    /**
     * راه‌اندازی مدیر تم
     */
    init: function() {
      if (!utils.checkDependency()) return false;
      
      // بارگذاری تم‌های پیش‌فرض
      this.loadDefaultThemes();
      
      // بارگذاری تم‌های ذخیره شده
      themeRegistry.loadSavedThemes();
      
      // تنظیم تم فعلی
      const savedTheme = utils.getFromStorage('current_theme');
      if (savedTheme && themeRegistry.has(savedTheme)) {
        this.apply(savedTheme);
      } else {
        this.apply('light');
      }
      
      utils.log('مدیر تم Pristara راه‌اندازی شد');
      return true;
    },
    
    /**
     * بارگذاری تم‌های پیش‌فرض
     */
    loadDefaultThemes: function() {
      const defaultThemes = {
        light: {
          name: 'light',
          primary: '#1abc9c',
          primaryDark: '#16a085',
          primaryLight: '#48c9b0',
          secondary: '#3498db',
          accent: '#f39c12',
          success: '#27ae60',
          warning: '#f39c12',
          danger: '#e74c3c',
          info: '#2980b9',
          surface: '#ffffff',
          background: '#f8f9fa',
          text: {
            primary: '#212529',
            secondary: '#6c757d',
            disabled: '#adb5bd'
          }
        },
        
        dark: {
          name: 'dark',
          primary: '#1abc9c',
          primaryDark: '#16a085',
          primaryLight: '#48c9b0',
          secondary: '#3498db',
          accent: '#f39c12',
          success: '#27ae60',
          warning: '#f39c12',
          danger: '#e74c3c',
          info: '#2980b9',
          surface: '#2d2d2d',
          background: '#1a1a1a',
          text: {
            primary: '#f8f9fa',
            secondary: '#adb5bd',
            disabled: '#6c757d'
          }
        },
        
        blue: {
          name: 'blue',
          primary: '#3498db',
          primaryDark: '#2980b9',
          primaryLight: '#5dade2',
          secondary: '#2ecc71',
          accent: '#f39c12',
          success: '#27ae60',
          warning: '#f39c12',
          danger: '#e74c3c',
          info: '#2980b9',
          surface: '#ffffff',
          background: '#f0f7ff',
          text: {
            primary: '#2c3e50',
            secondary: '#34495e',
            disabled: '#7f8c8d'
          }
        },
        
        green: {
          name: 'green',
          primary: '#2ecc71',
          primaryDark: '#27ae60',
          primaryLight: '#58d68d',
          secondary: '#3498db',
          accent: '#f39c12',
          success: '#27ae60',
          warning: '#f39c12',
          danger: '#e74c3c',
          info: '#1abc9c',
          surface: '#ffffff',
          background: '#f0f9f0',
          text: {
            primary: '#2c3e50',
            secondary: '#34495e',
            disabled: '#7f8c8d'
          }
        },
        
        purple: {
          name: 'purple',
          primary: '#9b59b6',
          primaryDark: '#8e44ad',
          primaryLight: '#af7ac5',
          secondary: '#3498db',
          accent: '#f39c12',
          success: '#27ae60',
          warning: '#f39c12',
          danger: '#e74c3c',
          info: '#5c6bc0',
          surface: '#ffffff',
          background: '#f5f0ff',
          text: {
            primary: '#2c3e50',
            secondary: '#34495e',
            disabled: '#7f8c8d'
          }
        }
      };
      
      // ثبت تم‌های پیش‌فرض
      Object.values(defaultThemes).forEach(theme => {
        themeRegistry.register(theme);
      });
    },
    
    /**
     * اعمال تم
     */
    apply: function(themeName) {
      const theme = themeRegistry.get(themeName);
      if (!theme) {
        utils.error(`تم "${themeName}" یافت نشد`);
        return false;
      }
      
      // اعمال به CSS
      cssManager.applyTheme(theme);
      
      // تنظیم در registry
      themeRegistry.setCurrent(themeName);
      
      // ذخیره در localStorage
      utils.saveToStorage('current_theme', themeName);
      
      // همگام‌سازی با PristaraDS اصلی
      if (window.PristaraDS) {
        window.PristaraDS.theme.set(themeName);
      }
      
      utils.dispatchEvent('themeApplied', { theme: themeName });
      return true;
    },
    
    /**
     * بازنشانی به تم پیش‌فرض
     */
    reset: function() {
      this.apply('light');
      utils.removeFromStorage('current_theme');
      utils.dispatchEvent('themeReset');
    },
    
    /**
     * ایجاد تم سفارشی
     */
    createCustom: function(primaryColor, themeName) {
      const theme = themeGenerator.generateFromColor(primaryColor, themeName);
      if (!theme) return null;
      
      themeRegistry.register(theme);
      themeRegistry.saveCustomThemes();
      
      return theme;
    },
    
    /**
     * حذف تم سفارشی
     */
    deleteCustom: function(themeName) {
      if (!themeName.startsWith('custom_')) {
        utils.error('فقط می‌توان تم‌های سفارشی را حذف کرد');
        return false;
      }
      
      // اگر تم فعلی است، به تم light تغییر بده
      if (themeRegistry.getCurrent() === themeName) {
        this.apply('light');
      }
      
      // حذف از registry
      const success = themeRegistry.unregister(themeName);
      if (success) {
        themeRegistry.saveCustomThemes();
        utils.dispatchEvent('themeDeleted', { theme: themeName });
      }
      
      return success;
    },
    
    /**
     * دریافت لیست تم‌ها
     */
    list: function() {
      return themeRegistry.list();
    },
    
    /**
     * دریافت اطلاعات تم
     */
    get: function(themeName) {
      return themeRegistry.get(themeName);
    },
    
    /**
     * دریافت تم فعلی
     */
    getCurrent: function() {
      return themeRegistry.getCurrent();
    },
    
    /**
     * فعال‌سازی رابط کاربری تغییر تم
     */
    enableUI: function(container) {
      return themeSwitcher.createUI(container);
    },
    
    /**
     * غیرفعال‌سازی رابط کاربری تغییر تم
     */
    disableUI: function() {
      themeSwitcher.destroyUI();
    },
    
    /**
     * باز کردن سفارشی‌ساز تم
     */
    openCustomizer: function() {
      themeCustomizer.open();
    }
  };

  // ====== Public API ======
  return {
    /**
     * راه‌اندازی
     */
    init: themeManager.init,
    
    /**
     * ====== مدیریت تم ======
     */
    apply: themeManager.apply,
    reset: themeManager.reset,
    createCustom: themeManager.createCustom,
    deleteCustom: themeManager.deleteCustom,
    list: themeManager.list,
    get: themeManager.get,
    getCurrent: themeManager.getCurrent,
    
    /**
     * ====== رابط کاربری ======
     */
    enableUI: themeManager.enableUI,
    disableUI: themeManager.disableUI,
    openCustomizer: themeManager.openCustomizer,
    
    /**
     * ====== Utility Functions ======
     */
    utils: {
      generateColor: utils.generateRandomColor,
      getContrastRatio: utils.getContrastRatio,
      hexToRgb: utils.hexToRgb,
      rgbToHex: utils.rgbToHex
    },
    
    /**
     * ====== Version Info ======
     */
    version: '1.0.0'
  };
})();

// خودکار راه‌اندازی شود
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function() {
    PristaraThemeManager.init();
  });
} else {
  PristaraThemeManager.init();
}

// در دسترس قرار دادن در scope جهانی
if (typeof window !== 'undefined') {
  window.PristaraThemeManager = PristaraThemeManager;
}

// اتصال به PristaraDS اگر وجود دارد
if (window.PristaraDS) {
  window.PristaraDS.themeManager = PristaraThemeManager;
}

// export برای ماژول‌ها
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PristaraThemeManager;
}

export default PristaraThemeManager;