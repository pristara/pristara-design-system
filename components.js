// public/js/pristara/components.js
/**
 * Pristara Design System - Additional Components
 * کامپوننت‌های اضافی سیستم طراحی پریستارا
 */

const PristaraComponents = (function() {
  'use strict';

  // ====== Utility Functions ======
  const utils = {
    log: function(...args) {
      if (window.PristaraDS && window.PristaraDS.config.debug) {
        console.log('[PristaraComponents]', ...args);
      }
    },

    error: function(...args) {
      console.error('[PristaraComponents]', ...args);
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
        const event = new CustomEvent(`pristara.components.${eventName}`, { detail });
        document.dispatchEvent(event);
      }
    }
  };

  // ====== Dropdown Component ======
  const dropdown = {
    /**
     * فعال‌سازی dropdown ها
     */
    init: function(selector = '.psa-dropdown') {
      if (!utils.checkDependency()) return;

      const dropdowns = document.querySelectorAll(selector);
      
      dropdowns.forEach(dropdown => {
        // اگر قبلاً فعال شده باشد
        if (dropdown._dropdownInitialized) return;
        
        const toggle = dropdown.querySelector('.psa-dropdown-toggle');
        const menu = dropdown.querySelector('.psa-dropdown-menu');
        
        if (!toggle || !menu) {
          utils.error('ساختار dropdown نادرست است:', dropdown);
          return;
        }
        
        // تنظیم ARIA attributes
        toggle.setAttribute('aria-haspopup', 'true');
        toggle.setAttribute('aria-expanded', 'false');
        
        // رویداد toggle
        const toggleDropdown = (e) => {
          e.preventDefault();
          e.stopPropagation();
          
          const isOpen = menu.classList.contains('psa-show');
          
          // بستن بقیه dropdown ها
          this.closeAll(dropdown);
          
          if (isOpen) {
            this.close(dropdown);
          } else {
            this.open(dropdown);
          }
        };
        
        toggle.addEventListener('click', toggleDropdown);
        
        // بستن dropdown وقتی خارج از آن کلیک شود
        const closeOnClickOutside = (e) => {
          if (!dropdown.contains(e.target)) {
            this.close(dropdown);
          }
        };
        
        // بستن dropdown با کلید Escape
        const closeOnEscape = (e) => {
          if (e.key === 'Escape' && menu.classList.contains('psa-show')) {
            this.close(dropdown);
          }
        };
        
        document.addEventListener('click', closeOnClickOutside);
        document.addEventListener('keydown', closeOnEscape);
        
        // ذخیره reference ها برای تمیز کردن
        dropdown._dropdownHandlers = {
          toggle: toggleDropdown,
          clickOutside: closeOnClickOutside,
          escape: closeOnEscape
        };
        
        dropdown._dropdownInitialized = true;
      });
      
      utils.log(`${dropdowns.length} dropdown فعال شد`);
    },
    
    /**
     * باز کردن dropdown
     */
    open: function(dropdownElement) {
      const menu = dropdownElement.querySelector('.psa-dropdown-menu');
      const toggle = dropdownElement.querySelector('.psa-dropdown-toggle');
      
      if (!menu || !toggle) return;
      
      menu.classList.add('psa-show');
      toggle.setAttribute('aria-expanded', 'true');
      
      // موقعیت‌دهی
      this.positionMenu(dropdownElement);
      
      // انتشار رویداد
      utils.dispatchEvent('dropdownOpen', { element: dropdownElement });
    },
    
    /**
     * بستن dropdown
     */
    close: function(dropdownElement) {
      const menu = dropdownElement.querySelector('.psa-dropdown-menu');
      const toggle = dropdownElement.querySelector('.psa-dropdown-toggle');
      
      if (!menu || !toggle) return;
      
      menu.classList.remove('psa-show');
      toggle.setAttribute('aria-expanded', 'false');
      
      // انتشار رویداد
      utils.dispatchEvent('dropdownClose', { element: dropdownElement });
    },
    
    /**
     * بستن همه dropdown ها
     */
    closeAll: function(exclude = null) {
      const openDropdowns = document.querySelectorAll('.psa-dropdown-menu.psa-show');
      
      openDropdowns.forEach(menu => {
        const parent = menu.closest('.psa-dropdown');
        if (parent !== exclude) {
          this.close(parent);
        }
      });
    },
    
    /**
     * موقعیت‌دهی منو
     */
    positionMenu: function(dropdownElement) {
      const menu = dropdownElement.querySelector('.psa-dropdown-menu');
      const toggle = dropdownElement.querySelector('.psa-dropdown-toggle');
      
      if (!menu || !toggle) return;
      
      const rect = toggle.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;
      
      // بررسی موقعیت پیش‌فرض از data-attribute
      const position = dropdownElement.getAttribute('data-psa-dropdown-position') || 'bottom-start';
      
      // ریست موقعیت
      menu.style.top = '';
      menu.style.bottom = '';
      menu.style.left = '';
      menu.style.right = '';
      
      switch (position) {
        case 'bottom-start':
          menu.style.top = `${rect.bottom}px`;
          menu.style.right = `${viewportWidth - rect.right}px`;
          break;
          
        case 'bottom-end':
          menu.style.top = `${rect.bottom}px`;
          menu.style.left = `${rect.left}px`;
          break;
          
        case 'top-start':
          menu.style.bottom = `${viewportHeight - rect.top}px`;
          menu.style.right = `${viewportWidth - rect.right}px`;
          break;
          
        case 'top-end':
          menu.style.bottom = `${viewportHeight - rect.top}px`;
          menu.style.left = `${rect.left}px`;
          break;
          
        case 'left-start':
          menu.style.top = `${rect.top}px`;
          menu.style.right = `${viewportWidth - rect.left}px`;
          break;
          
        case 'left-end':
          menu.style.bottom = `${viewportHeight - rect.bottom}px`;
          menu.style.right = `${viewportWidth - rect.left}px`;
          break;
          
        case 'right-start':
          menu.style.top = `${rect.top}px`;
          menu.style.left = `${rect.right}px`;
          break;
          
        case 'right-end':
          menu.style.bottom = `${viewportHeight - rect.bottom}px`;
          menu.style.left = `${rect.right}px`;
          break;
          
        default:
          menu.style.top = `${rect.bottom}px`;
          menu.style.right = `${viewportWidth - rect.right}px`;
      }
      
      // بررسی برخورد با مرزهای viewport
      this.adjustForViewport(menu, position);
    },
    
    /**
     * تنظیم موقعیت برای جلوگیری از برخورد با viewport
     */
    adjustForViewport: function(menu, position) {
      const rect = menu.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;
      
      let adjustments = {};
      
      // بررسی برخورد با پایین
      if (rect.bottom > viewportHeight && position.includes('bottom')) {
        adjustments.top = viewportHeight - rect.height - 10;
      }
      
      // بررسی برخورد با بالا
      if (rect.top < 0 && position.includes('top')) {
        adjustments.bottom = viewportHeight - rect.height - 10;
      }
      
      // بررسی برخورد با راست
      if (rect.right > viewportWidth && position.includes('right')) {
        adjustments.left = viewportWidth - rect.width - 10;
      }
      
      // بررسی برخورد با چپ
      if (rect.left < 0 && position.includes('left')) {
        adjustments.right = viewportWidth - rect.width - 10;
      }
      
      // اعمال تنظیمات
      Object.keys(adjustments).forEach(key => {
        menu.style[key] = `${adjustments[key]}px`;
      });
    },
    
    /**
     * غیرفعال‌سازی dropdown
     */
    destroy: function(selector = '.psa-dropdown') {
      const dropdowns = document.querySelectorAll(selector);
      
      dropdowns.forEach(dropdown => {
        if (dropdown._dropdownHandlers) {
          const { toggle, clickOutside, escape } = dropdown._dropdownHandlers;
          
          const toggleBtn = dropdown.querySelector('.psa-dropdown-toggle');
          if (toggleBtn) {
            toggleBtn.removeEventListener('click', toggle);
          }
          
          document.removeEventListener('click', clickOutside);
          document.removeEventListener('keydown', escape);
          
          delete dropdown._dropdownHandlers;
          delete dropdown._dropdownInitialized;
        }
      });
      
      utils.log(`${dropdowns.length} dropdown غیرفعال شد`);
    }
  };

  // ====== Tabs Component ======
  const tabs = {
    /**
     * فعال‌سازی tab ها
     */
    init: function(selector = '.psa-tabs') {
      if (!utils.checkDependency()) return;

      const tabContainers = document.querySelectorAll(selector);
      
      tabContainers.forEach(container => {
        // اگر قبلاً فعال شده باشد
        if (container._tabsInitialized) return;
        
        const tabList = container.querySelector('.psa-tab-list');
        const tabs = container.querySelectorAll('.psa-tab');
        const panes = container.querySelectorAll('.psa-tab-pane');
        
        if (!tabList || tabs.length === 0 || panes.length === 0) {
          utils.error('ساختار tabs نادرست است:', container);
          return;
        }
        
        // تنظیم ARIA attributes
        tabList.setAttribute('role', 'tablist');
        
        tabs.forEach((tab, index) => {
          const paneId = tab.getAttribute('data-tab-target') || 
                        tab.getAttribute('href')?.substring(1);
          const pane = paneId ? document.getElementById(paneId) : panes[index];
          
          if (!pane) return;
          
          // تنظیم ARIA
          tab.setAttribute('role', 'tab');
          tab.setAttribute('aria-controls', pane.id);
          tab.setAttribute('aria-selected', index === 0 ? 'true' : 'false');
          tab.setAttribute('tabindex', index === 0 ? '0' : '-1');
          
          pane.setAttribute('role', 'tabpanel');
          pane.setAttribute('aria-labelledby', tab.id || `tab-${index}`);
          pane.setAttribute('tabindex', '0');
          
          // مخفی کردن pane ها به جز اولین
          if (index === 0) {
            tab.classList.add('psa-active');
            pane.classList.add('psa-show', 'psa-active');
          } else {
            pane.classList.remove('psa-show', 'psa-active');
          }
          
          // رویداد کلیک
          const handleClick = (e) => {
            e.preventDefault();
            this.show(container, index);
          };
          
          tab.addEventListener('click', handleClick);
          
          // رویدادهای کیبورد
          const handleKeydown = (e) => {
            switch (e.key) {
              case 'ArrowRight':
              case 'ArrowLeft':
                e.preventDefault();
                const direction = e.key === 'ArrowRight' ? 1 : -1;
                const nextIndex = (index + direction + tabs.length) % tabs.length;
                this.show(container, nextIndex);
                tabs[nextIndex].focus();
                break;
                
              case 'Home':
                e.preventDefault();
                this.show(container, 0);
                tabs[0].focus();
                break;
                
              case 'End':
                e.preventDefault();
                this.show(container, tabs.length - 1);
                tabs[tabs.length - 1].focus();
                break;
            }
          };
          
          tab.addEventListener('keydown', handleKeydown);
          
          // ذخیره handlers
          tab._tabHandlers = { click: handleClick, keydown: handleKeydown };
        });
        
        container._tabsInitialized = true;
      });
      
      utils.log(`${tabContainers.length} tab container فعال شد`);
    },
    
    /**
     * نمایش tab خاص
     */
    show: function(container, tabIndex) {
      const tabs = container.querySelectorAll('.psa-tab');
      const panes = container.querySelectorAll('.psa-tab-pane');
      
      if (tabIndex < 0 || tabIndex >= tabs.length) return;
      
      // غیرفعال کردن همه tab ها
      tabs.forEach(tab => {
        tab.classList.remove('psa-active');
        tab.setAttribute('aria-selected', 'false');
        tab.setAttribute('tabindex', '-1');
      });
      
      // مخفی کردن همه pane ها
      panes.forEach(pane => {
        pane.classList.remove('psa-show', 'psa-active');
      });
      
      // فعال کردن tab انتخاب شده
      const activeTab = tabs[tabIndex];
      const paneId = activeTab.getAttribute('data-tab-target') || 
                    activeTab.getAttribute('href')?.substring(1);
      const activePane = paneId ? document.getElementById(paneId) : panes[tabIndex];
      
      if (!activePane) return;
      
      activeTab.classList.add('psa-active');
      activeTab.setAttribute('aria-selected', 'true');
      activeTab.setAttribute('tabindex', '0');
      activeTab.focus();
      
      activePane.classList.add('psa-show', 'psa-active');
      
      // انتشار رویداد
      utils.dispatchEvent('tabChange', {
        container: container,
        tabIndex: tabIndex,
        tab: activeTab,
        pane: activePane
      });
    },
    
    /**
     * غیرفعال‌سازی tabs
     */
    destroy: function(selector = '.psa-tabs') {
      const containers = document.querySelectorAll(selector);
      
      containers.forEach(container => {
        const tabs = container.querySelectorAll('.psa-tab');
        
        tabs.forEach(tab => {
          if (tab._tabHandlers) {
            tab.removeEventListener('click', tab._tabHandlers.click);
            tab.removeEventListener('keydown', tab._tabHandlers.keydown);
            delete tab._tabHandlers;
          }
        });
        
        delete container._tabsInitialized;
      });
      
      utils.log(`${containers.length} tab container غیرفعال شد`);
    }
  };

  // ====== Accordion Component ======
  const accordion = {
    /**
     * فعال‌سازی accordion ها
     */
    init: function(selector = '.psa-accordion') {
      if (!utils.checkDependency()) return;

      const accordions = document.querySelectorAll(selector);
      
      accordions.forEach(accordion => {
        // اگر قبلاً فعال شده باشد
        if (accordion._accordionInitialized) return;
        
        const items = accordion.querySelectorAll('.psa-accordion-item');
        
        items.forEach((item, index) => {
          const header = item.querySelector('.psa-accordion-header');
          const body = item.querySelector('.psa-accordion-body');
          
          if (!header || !body) {
            utils.error('ساختار accordion item نادرست است:', item);
            return;
          }
          
          // تنظیم ARIA
          header.setAttribute('id', `accordion-header-${index}`);
          header.setAttribute('aria-expanded', 'false');
          header.setAttribute('aria-controls', `accordion-body-${index}`);
          
          body.setAttribute('id', `accordion-body-${index}`);
          body.setAttribute('aria-labelledby', `accordion-header-${index}`);
          body.setAttribute('role', 'region');
          
          // مخفی کردن body
          body.style.maxHeight = '0';
          body.style.overflow = 'hidden';
          body.style.transition = 'max-height 0.3s ease';
          
          // رویداد کلیک
          const handleClick = (e) => {
            e.preventDefault();
            
            // بستن سایر آیتم‌ها اگر accordion فقط یک مورد باز داشته باشد
            const isSingleOpen = accordion.classList.contains('psa-accordion-single');
            if (isSingleOpen && !item.classList.contains('psa-open')) {
              this.closeAll(accordion);
            }
            
            this.toggle(item);
          };
          
          header.addEventListener('click', handleClick);
          
          // رویدادهای کیبورد
          const handleKeydown = (e) => {
            switch (e.key) {
              case 'Enter':
              case ' ':
                e.preventDefault();
                handleClick(e);
                break;
                
              case 'ArrowDown':
                e.preventDefault();
                const nextItem = items[index + 1];
                if (nextItem) {
                  nextItem.querySelector('.psa-accordion-header').focus();
                }
                break;
                
              case 'ArrowUp':
                e.preventDefault();
                const prevItem = items[index - 1];
                if (prevItem) {
                  prevItem.querySelector('.psa-accordion-header').focus();
                }
                break;
                
              case 'Home':
                e.preventDefault();
                items[0].querySelector('.psa-accordion-header').focus();
                break;
                
              case 'End':
                e.preventDefault();
                items[items.length - 1].querySelector('.psa-accordion-header').focus();
                break;
            }
          };
          
          header.addEventListener('keydown', handleKeydown);
          
          // ذخیره handlers
          header._accordionHandlers = { click: handleClick, keydown: handleKeydown };
        });
        
        // باز کردن آیتم اول اگر data-open-first باشد
        if (accordion.getAttribute('data-open-first') === 'true') {
          const firstItem = items[0];
          if (firstItem) {
            this.open(firstItem);
          }
        }
        
        accordion._accordionInitialized = true;
      });
      
      utils.log(`${accordions.length} accordion فعال شد`);
    },
    
    /**
     * باز کردن accordion item
     */
    open: function(item) {
      const header = item.querySelector('.psa-accordion-header');
      const body = item.querySelector('.psa-accordion-body');
      
      if (!header || !body) return;
      
      item.classList.add('psa-open');
      header.setAttribute('aria-expanded', 'true');
      
      // محاسبه ارتفاع واقعی
      body.style.maxHeight = body.scrollHeight + 'px';
      
      // انتشار رویداد
      utils.dispatchEvent('accordionOpen', { item: item });
    },
    
    /**
     * بستن accordion item
     */
    close: function(item) {
      const header = item.querySelector('.psa-accordion-header');
      const body = item.querySelector('.psa-accordion-body');
      
      if (!header || !body) return;
      
      item.classList.remove('psa-open');
      header.setAttribute('aria-expanded', 'false');
      body.style.maxHeight = '0';
      
      // انتشار رویداد
      utils.dispatchEvent('accordionClose', { item: item });
    },
    
    /**
     * toggle accordion item
     */
    toggle: function(item) {
      if (item.classList.contains('psa-open')) {
        this.close(item);
      } else {
        this.open(item);
      }
    },
    
    /**
     * بستن همه آیتم‌های یک accordion
     */
    closeAll: function(accordion) {
      const items = accordion.querySelectorAll('.psa-accordion-item');
      items.forEach(item => this.close(item));
    },
    
    /**
     * باز کردن همه آیتم‌های یک accordion
     */
    openAll: function(accordion) {
      const items = accordion.querySelectorAll('.psa-accordion-item');
      items.forEach(item => this.open(item));
    },
    
    /**
     * غیرفعال‌سازی accordion
     */
    destroy: function(selector = '.psa-accordion') {
      const accordions = document.querySelectorAll(selector);
      
      accordions.forEach(accordion => {
        const headers = accordion.querySelectorAll('.psa-accordion-header');
        
        headers.forEach(header => {
          if (header._accordionHandlers) {
            header.removeEventListener('click', header._accordionHandlers.click);
            header.removeEventListener('keydown', header._accordionHandlers.keydown);
            delete header._accordionHandlers;
          }
          
          // ریست کردن استایل‌ها
          const body = accordion.querySelector('.psa-accordion-body');
          if (body) {
            body.style.maxHeight = '';
            body.style.overflow = '';
            body.style.transition = '';
          }
        });
        
        delete accordion._accordionInitialized;
      });
      
      utils.log(`${accordions.length} accordion غیرفعال شد`);
    }
  };

  // ====== Form Validation ======
  const formValidation = {
    /**
     * فعال‌سازی اعتبارسنجی فرم
     */
    init: function(selector = '.psa-form-validate') {
      if (!utils.checkDependency()) return;

      const forms = document.querySelectorAll(selector);
      
      forms.forEach(form => {
        // اگر قبلاً فعال شده باشد
        if (form._validationInitialized) return;
        
        // رویداد submit
        const handleSubmit = (e) => {
          if (!this.validate(form)) {
            e.preventDefault();
            e.stopPropagation();
            
            // تمرکز روی اولین فیلد نامعتبر
            const firstInvalid = form.querySelector('.psa-form-control-error');
            if (firstInvalid) {
              firstInvalid.focus();
            }
          }
        };
        
        form.addEventListener('submit', handleSubmit);
        
        // اعتبارسنجی real-time برای فیلدها
        const inputs = form.querySelectorAll('.psa-form-control[data-validate]');
        inputs.forEach(input => {
          const handleInput = () => this.validateField(input);
          const handleBlur = () => this.validateField(input, true);
          
          input.addEventListener('input', handleInput);
          input.addEventListener('blur', handleBlur);
          
          // ذخیره handlers
          input._validationHandlers = { input: handleInput, blur: handleBlur };
        });
        
        form._validationInitialized = true;
        form._validationHandlers = { submit: handleSubmit };
      });
      
      utils.log(`${forms.length} فرم برای اعتبارسنجی فعال شد`);
    },
    
    /**
     * اعتبارسنجی کل فرم
     */
    validate: function(form) {
      let isValid = true;
      const inputs = form.querySelectorAll('.psa-form-control[data-validate]');
      
      // پاک کردن خطاهای قبلی
      this.clearErrors(form);
      
      inputs.forEach(input => {
        if (!this.validateField(input, true)) {
          isValid = false;
        }
      });
      
      // انتشار رویداد
      utils.dispatchEvent('formValidation', { 
        form: form, 
        isValid: isValid 
      });
      
      return isValid;
    },
    
    /**
     * اعتبارسنجی یک فیلد
     */
    validateField: function(input, showError = false) {
      const rules = input.getAttribute('data-validate') || '';
      const value = input.value.trim();
      let isValid = true;
      let errorMessage = '';
      
      // بررسی required
      if (rules.includes('required') && !value) {
        isValid = false;
        errorMessage = input.getAttribute('data-error-required') || 'این فیلد الزامی است';
      }
      
      // بررسی ایمیل
      if (isValid && rules.includes('email') && value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          isValid = false;
          errorMessage = input.getAttribute('data-error-email') || 'ایمیل معتبر نیست';
        }
      }
      
      // بررسی شماره موبایل فارسی
      if (isValid && rules.includes('mobile') && value) {
        const mobileRegex = /^09[0-9]{9}$/;
        if (!mobileRegex.test(value)) {
          isValid = false;
          errorMessage = input.getAttribute('data-error-mobile') || 'شماره موبایل معتبر نیست';
        }
      }
      
      // بررسی حداقل طول
      if (isValid && rules.includes('minlength') && value) {
        const minLength = parseInt(input.getAttribute('data-minlength')) || 0;
        if (value.length < minLength) {
          isValid = false;
          errorMessage = input.getAttribute('data-error-minlength') || 
                        `حداقل ${minLength} کاراکتر لازم است`;
        }
      }
      
      // بررسی حداکثر طول
      if (isValid && rules.includes('maxlength') && value) {
        const maxLength = parseInt(input.getAttribute('data-maxlength')) || Infinity;
        if (value.length > maxLength) {
          isValid = false;
          errorMessage = input.getAttribute('data-error-maxlength') || 
                        `حداکثر ${maxLength} کاراکتر مجاز است`;
        }
      }
      
      // بررسی تطابق
      if (isValid && rules.includes('match') && value) {
        const matchSelector = input.getAttribute('data-match');
        const matchElement = matchSelector ? document.querySelector(matchSelector) : null;
        if (matchElement && value !== matchElement.value) {
          isValid = false;
          errorMessage = input.getAttribute('data-error-match') || 'مقادیر مطابقت ندارند';
        }
      }
      
      // نمایش یا مخفی کردن خطا
      if (showError) {
        if (!isValid) {
          this.showError(input, errorMessage);
        } else {
          this.showSuccess(input);
        }
      }
      
      return isValid;
    },
    
    /**
     * نمایش خطا برای فیلد
     */
    showError: function(input, message) {
      // حذف وضعیت success قبلی
      input.classList.remove('psa-form-control-success');
      
      // اضافه کردن وضعیت error
      input.classList.add('psa-form-control-error');
      
      // پیدا کردن یا ساخت عنصر خطا
      let errorElement = input.nextElementSibling;
      if (!errorElement || !errorElement.classList.contains('psa-form-error')) {
        errorElement = document.createElement('div');
        errorElement.className = 'psa-form-error';
        input.parentNode.insertBefore(errorElement, input.nextSibling);
      }
      
      errorElement.textContent = message;
      errorElement.style.display = 'block';
      
      // انتشار رویداد
      utils.dispatchEvent('fieldValidationError', {
        input: input,
        message: message
      });
    },
    
    /**
     * نمایش موفقیت برای فیلد
     */
    showSuccess: function(input) {
      // حذف وضعیت error قبلی
      input.classList.remove('psa-form-control-error');
      
      // اضافه کردن وضعیت success
      input.classList.add('psa-form-control-success');
      
      // حذف پیام خطا
      const errorElement = input.nextElementSibling;
      if (errorElement && errorElement.classList.contains('psa-form-error')) {
        errorElement.style.display = 'none';
      }
      
      // انتشار رویداد
      utils.dispatchEvent('fieldValidationSuccess', { input: input });
    },
    
    /**
     * پاک کردن همه خطاها
     */
    clearErrors: function(form) {
      const errorInputs = form.querySelectorAll('.psa-form-control-error');
      errorInputs.forEach(input => {
        input.classList.remove('psa-form-control-error');
        
        const errorElement = input.nextElementSibling;
        if (errorElement && errorElement.classList.contains('psa-form-error')) {
          errorElement.style.display = 'none';
        }
      });
      
      const successInputs = form.querySelectorAll('.psa-form-control-success');
      successInputs.forEach(input => {
        input.classList.remove('psa-form-control-success');
      });
    },
    
    /**
     * غیرفعال‌سازی اعتبارسنجی
     */
    destroy: function(selector = '.psa-form-validate') {
      const forms = document.querySelectorAll(selector);
      
      forms.forEach(form => {
        if (form._validationHandlers) {
          form.removeEventListener('submit', form._validationHandlers.submit);
          delete form._validationHandlers;
        }
        
        const inputs = form.querySelectorAll('.psa-form-control[data-validate]');
        inputs.forEach(input => {
          if (input._validationHandlers) {
            input.removeEventListener('input', input._validationHandlers.input);
            input.removeEventListener('blur', input._validationHandlers.blur);
            delete input._validationHandlers;
          }
        });
        
        delete form._validationInitialized;
      });
      
      utils.log(`${forms.length} فرم اعتبارسنجی غیرفعال شد`);
    }
  };

  // ====== Public API ======
  return {
    /**
     * راه‌اندازی همه کامپوننت‌ها
     */
    initAll: function() {
      if (!utils.checkDependency()) return false;
      
      dropdown.init();
      tabs.init();
      accordion.init();
      formValidation.init();
      
      utils.log('همه کامپوننت‌های Pristara فعال شدند');
      return true;
    },
    
    /**
     * تخریب همه کامپوننت‌ها
     */
    destroyAll: function() {
      dropdown.destroy();
      tabs.destroy();
      accordion.destroy();
      formValidation.destroy();
      
      utils.log('همه کامپوننت‌های Pristara غیرفعال شدند');
    },
    
    /**
     * ====== Dropdown API ======
     */
    dropdown: {
      init: dropdown.init,
      open: dropdown.open,
      close: dropdown.close,
      closeAll: dropdown.closeAll,
      destroy: dropdown.destroy
    },
    
    /**
     * ====== Tabs API ======
     */
    tabs: {
      init: tabs.init,
      show: tabs.show,
      destroy: tabs.destroy
    },
    
    /**
     * ====== Accordion API ======
     */
    accordion: {
      init: accordion.init,
      open: accordion.open,
      close: accordion.close,
      toggle: accordion.toggle,
      openAll: accordion.openAll,
      closeAll: accordion.closeAll,
      destroy: accordion.destroy
    },
    
    /**
     * ====== Form Validation API ======
     */
    formValidation: {
      init: formValidation.init,
      validate: formValidation.validate,
      validateField: formValidation.validateField,
      clearErrors: formValidation.clearErrors,
      destroy: formValidation.destroy
    },
    
    /**
     * ====== Version Info ======
     */
    version: '1.0.0'
  };
})();

// خودکار راه‌اندازی شود وقتی DOM آماده است
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function() {
    if (window.PristaraDS) {
      PristaraComponents.initAll();
    }
  });
} else {
  if (window.PristaraDS) {
    PristaraComponents.initAll();
  }
}

// در دسترس قرار دادن در scope جهانی
if (typeof window !== 'undefined') {
  window.PristaraComponents = PristaraComponents;
}

// اتصال به PristaraDS اگر وجود دارد
if (window.PristaraDS) {
  window.PristaraDS.components = {
    ...window.PristaraDS.components,
    dropdown: PristaraComponents.dropdown,
    tabs: PristaraComponents.tabs,
    accordion: PristaraComponents.accordion,
    formValidation: PristaraComponents.formValidation
  };
}

// export برای ماژول‌ها
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PristaraComponents;
}

export default PristaraComponents;