class PeriodDetector {
    constructor() {
        this.data = {};
        this.animations = new Map();
        this.soundEnabled = true;
        this.init();
    }

    init() {
        document.addEventListener('DOMContentLoaded', () => {
            this.setupEventListeners();
            this.loadSavedData();
            this.initializeDefaults();
            this.createFloatingElements();
            this.setupTooltips();
        });
    }

    setupEventListeners() {
        const calculateBtn = document.getElementById('calculateBtn');
        if (calculateBtn) {
            calculateBtn.addEventListener('click', (e) => this.handleCalculateClick(e));
        }

        const inputs = ['lastPeriod', 'cycleLength', 'periodLength'];
        inputs.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('input', (e) => this.handleInputChange(e));
                element.addEventListener('focus', (e) => this.handleInputFocus(e));
                element.addEventListener('blur', (e) => this.handleInputBlur(e));
            }
        });

        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));
    }

    handleCalculateClick(e) {
        e.preventDefault();
        this.playClickSound();
        this.animateButton(e.target);
        
        setTimeout(() => {
            this.calculatePeriod();
        }, 200);
    }

    handleInputChange(e) {
        this.validateInput(e.target);
        this.saveDataDebounced();
    }

    handleInputFocus(e) {
        this.animateInputFocus(e.target);
    }

    handleInputBlur(e) {
        this.animateInputBlur(e.target);
        this.validateInput(e.target);
    }

    handleKeyboardShortcuts(e) {
        if (e.ctrlKey || e.metaKey) {
            switch(e.key) {
                case 'Enter':
                    e.preventDefault();
                    this.calculatePeriod();
                    break;
                case 's':
                    e.preventDefault();
                    this.saveData();
                    this.showNotification('💾 Data saved!', 'success');
                    break;
            }
        }
    }

    playClickSound() {
        if (!this.soundEnabled) return;
        
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
    }

    animateButton(button) {
        button.style.transform = 'translateY(-1px) scale(0.98)';
        button.style.boxShadow = '0 6px 20px rgba(255, 107, 157, 0.4)';
        
        setTimeout(() => {
            button.style.transform = '';
            button.style.boxShadow = '';
        }, 150);
    }

    animateInputFocus(input) {
        input.style.transform = 'translateY(-2px)';
        input.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
    }

    animateInputBlur(input) {
        input.style.transform = '';
    }

    validateInput(input) {
        const value = input.value;
        const inputType = input.id;
        let isValid = true;
        let message = '';

        switch(inputType) {
            case 'lastPeriod':
                const date = new Date(value);
                const today = new Date();
                if (isNaN(date.getTime()) || date > today) {
                    isValid = false;
                    message = 'Please enter a valid past date';
                }
                break;
            case 'cycleLength':
                const cycle = parseInt(value);
                if (isNaN(cycle) || cycle < 21 || cycle > 35) {
                    isValid = false;
                    message = 'Cycle length should be between 21-35 days';
                }
                break;
            case 'periodLength':
                const period = parseInt(value);
                if (isNaN(period) || period < 3 || period > 7) {
                    isValid = false;
                    message = 'Period length should be between 3-7 days';
                }
                break;
        }

        this.updateInputValidation(input, isValid, message);
        return isValid;
    }

    updateInputValidation(input, isValid, message) {
        const container = input.parentElement;
        let errorElement = container.querySelector('.error-message');
        
        if (!isValid) {
            input.style.borderColor = '#ff4757';
            input.classList.add('error');
            
            if (!errorElement) {
                errorElement = document.createElement('div');
                errorElement.className = 'error-message';
                errorElement.style.cssText = `
                    color: #ff4757;
                    font-size: 0.8rem;
                    margin-top: 0.5rem;
                    opacity: 0;
                    transform: translateY(-10px);
                    transition: all 0.3s ease;
                `;
                container.appendChild(errorElement);
            }
            
            errorElement.textContent = message;
            setTimeout(() => {
                errorElement.style.opacity = '1';
                errorElement.style.transform = 'translateY(0)';
            }, 50);
        } else {
            input.style.borderColor = '';
            input.classList.remove('error');
            
            if (errorElement) {
                errorElement.style.opacity = '0';
                errorElement.style.transform = 'translateY(-10px)';
                setTimeout(() => {
                    if (errorElement.parentElement) {
                        errorElement.parentElement.removeChild(errorElement);
                    }
                }, 300);
            }
        }
    }

    loadSavedData() {
        try {
            const savedData = JSON.parse(localStorage.getItem('periodData') || '{}');
            if (Object.keys(savedData).length > 0) {
                this.data = savedData;
                this.populateInputs();
                this.showNotification('💖 Welcome back! Your data has been restored.', 'info');
            }
        } catch (error) {
            console.warn('Failed to load saved data:', error);
        }
    }

    populateInputs() {
        Object.keys(this.data).forEach(key => {
            const element = document.getElementById(key);
            if (element && this.data[key]) {
                element.value = this.data[key];
                this.animateInputRestore(element);
            }
        });
    }

    animateInputRestore(element) {
        element.style.opacity = '0';
        element.style.transform = 'translateX(-20px)';
        
        setTimeout(() => {
            element.style.transition = 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
            element.style.opacity = '1';
            element.style.transform = 'translateX(0)';
        }, Math.random() * 200);
    }

    saveDataDebounced() {
        clearTimeout(this.saveTimeout);
        this.saveTimeout = setTimeout(() => {
            this.saveData();
        }, 1000);
    }

    saveData() {
        const inputs = ['lastPeriod', 'cycleLength', 'periodLength'];
        const newData = {};
        
        inputs.forEach(id => {
            const element = document.getElementById(id);
            if (element && element.value) {
                newData[id] = element.value;
            }
        });

        this.data = newData;
        localStorage.setItem('periodData', JSON.stringify(this.data));
    }

    initializeDefaults() {
        const lastPeriodInput = document.getElementById('lastPeriod');
        if (lastPeriodInput && !lastPeriodInput.value) {
            const today = new Date();
            lastPeriodInput.valueAsDate = today;
        }

        const cycleLengthInput = document.getElementById('cycleLength');
        if (cycleLengthInput && !cycleLengthInput.value) {
            cycleLengthInput.value = '28';
        }

        const periodLengthInput = document.getElementById('periodLength');
        if (periodLengthInput && !periodLengthInput.value) {
            periodLengthInput.value = '5';
        }
    }

    calculatePeriod() {
        const inputs = ['lastPeriod', 'cycleLength', 'periodLength'];
        let allValid = true;

        inputs.forEach(id => {
            const element = document.getElementById(id);
            if (element && !this.validateInput(element)) {
                allValid = false;
            }
        });

        if (!allValid) {
            this.showNotification('⚠️ Please fix the errors above', 'error');
            return;
        }

        const lastPeriodDate = new Date(document.getElementById('lastPeriod').value);
        const cycleLength = parseInt(document.getElementById('cycleLength').value);
        const periodLength = parseInt(document.getElementById('periodLength').value);

        if (!lastPeriodDate || isNaN(lastPeriodDate.getTime())) {
            this.showNotification('⚠️ Please enter a valid date', 'error');
            return;
        }

        this.saveData();

        this.showLoadingAnimation();

        setTimeout(() => {
            this.performCalculations(lastPeriodDate, cycleLength, periodLength);
        }, 800);
    }

    showLoadingAnimation() {
        const calculateBtn = document.getElementById('calculateBtn');
        const originalText = calculateBtn.innerHTML;
        
        calculateBtn.innerHTML = '✨ Calculating...';
        calculateBtn.disabled = true;
        calculateBtn.style.opacity = '0.7';

        setTimeout(() => {
            calculateBtn.innerHTML = originalText;
            calculateBtn.disabled = false;
            calculateBtn.style.opacity = '1';
        }, 800);
    }

    performCalculations(lastPeriodDate, cycleLength, periodLength) {
        const nextPeriodStart = new Date(lastPeriodDate);
        nextPeriodStart.setDate(lastPeriodDate.getDate() + cycleLength);

        const nextPeriodEnd = new Date(nextPeriodStart);
        nextPeriodEnd.setDate(nextPeriodStart.getDate() + periodLength - 1);

        const ovulationDay = new Date(nextPeriodStart);
        ovulationDay.setDate(nextPeriodStart.getDate() - 14);

        const fertileStart = new Date(ovulationDay);
        fertileStart.setDate(ovulationDay.getDate() - 5);

        const fertileEnd = new Date(ovulationDay);
        fertileEnd.setDate(ovulationDay.getDate() + 1);

        this.displayResults(nextPeriodStart, nextPeriodEnd, fertileStart, fertileEnd, ovulationDay);
        
        this.showEnhancedHealthTips(lastPeriodDate, nextPeriodStart);
        
        this.generateEnhancedCalendar(lastPeriodDate, nextPeriodStart, fertileStart, fertileEnd, ovulationDay);
        
        this.showResultsWithAnimation();

        this.showNotification('🎉 Your cycle has been calculated!', 'success');
    }

    displayResults(nextPeriodStart, nextPeriodEnd, fertileStart, fertileEnd, ovulationDay) {
        const nextPeriodElement = document.getElementById('nextPeriod');
        const fertileWindowElement = document.getElementById('fertileWindow');

        if (nextPeriodElement) {
            nextPeriodElement.innerHTML = `
                <div style="display: flex; align-items: center; gap: 10px;">
                    <span style="font-size: 1.5rem;">🌸</span>
                    <div>
                        <strong>Next Period:</strong><br>
                        <span style="color: #ff6b9d; font-weight: 600;">
                            ${this.formatDateEnhanced(nextPeriodStart)} to ${this.formatDateEnhanced(nextPeriodEnd)}
                        </span>
                    </div>
                </div>
            `;
        }

        if (fertileWindowElement) {
            fertileWindowElement.innerHTML = `
                <div style="display: flex; align-items: center; gap: 10px;">
                    <span style="font-size: 1.5rem;">💙</span>
                    <div>
                        <strong>Fertile Window:</strong><br>
                        <span style="color: #4a90e2; font-weight: 600;">
                            ${this.formatDateEnhanced(fertileStart)} to ${this.formatDateEnhanced(fertileEnd)}
                        </span>
                    </div>
                </div>
            `;
        }

        const ovulationElement = document.getElementById('ovulationDay') || this.createOvulationElement();
        if (ovulationElement) {
            ovulationElement.innerHTML = `
                <div style="display: flex; align-items: center; gap: 10px;">
                    <span style="font-size: 1.5rem;">🌟</span>
                    <div>
                        <strong>Ovulation Day:</strong><br>
                        <span style="color: #90ee90; font-weight: 600;">
                            ${this.formatDateEnhanced(ovulationDay)}
                        </span>
                    </div>
                </div>
            `;
        }
    }

    createOvulationElement() {
        const resultDiv = document.getElementById('result');
        if (resultDiv) {
            const ovulationDiv = document.createElement('div');
            ovulationDiv.id = 'ovulationDay';
            ovulationDiv.style.cssText = `
                margin-top: 1rem;
                padding: 1rem;
                background: linear-gradient(135deg, rgba(144, 238, 144, 0.1), rgba(144, 238, 144, 0.05));
                border-radius: 10px;
                border-left: 4px solid #90ee90;
            `;
            resultDiv.appendChild(ovulationDiv);
            return ovulationDiv;
        }
        return null;
    }

    formatDateEnhanced(date) {
        const options = { 
            weekday: 'short',
            month: 'short', 
            day: 'numeric',
            year: 'numeric'
        };
        return date.toLocaleDateString('en-US', options);
    }

    showEnhancedHealthTips(lastPeriod, nextPeriodStart) {
        const today = new Date();
        const daysSinceLastPeriod = Math.floor((today - lastPeriod) / (1000 * 60 * 60 * 24));
        const daysUntilNextPeriod = Math.floor((nextPeriodStart - today) / (1000 * 60 * 60 * 24));
        
        let tips = this.getContextualTips(daysSinceLastPeriod, daysUntilNextPeriod);
        let mood = this.getCurrentMoodPhase(daysSinceLastPeriod, daysUntilNextPeriod);
        
        const healthTipsElement = document.getElementById('healthTips');
        if (healthTipsElement) {
            healthTipsElement.innerHTML = `
                <div style="margin-bottom: 1rem;">
                    <h4 style="color: #ff6b9d; margin-bottom: 0.5rem;">${mood.title}</h4>
                    <p style="color: #666; font-style: italic; margin-bottom: 1rem;">${mood.description}</p>
                </div>
                ${tips}
            `;
        }
    }

    getContextualTips(daysSince, daysUntil) {
        if (daysUntil <= 3) {
            return `
                <div class="tip-section">
                    <h5>🌸 Period is Coming Soon!</h5>
                    <ul>
                        <li>Stock up on period products and comfort items</li>
                        <li>Increase magnesium intake (dark chocolate, nuts, leafy greens) 🍫</li>
                        <li>Reduce caffeine and salt to minimize bloating</li>
                        <li>Prepare your heating pad and cozy blankets</li>
                        <li>Plan lighter activities for the next few days</li>
                    </ul>
                </div>
            `;
        } else if (daysSince <= 7) {
            return `
                <div class="tip-section">
                    <h5>🩸 During Your Period</h5>
                    <ul>
                        <li>Stay hydrated with warm water, herbal teas ☕</li>
                        <li>Iron-rich foods: red meat, spinach, lentils, dark chocolate</li>
                        <li>Gentle movement: walking, stretching, yoga 🧘‍♀️</li>
                        <li>Listen to your body - rest when you need to</li>
                        <li>Use heat therapy for cramps (heating pad, warm bath)</li>
                    </ul>
                </div>
            `;
        } else if (daysUntil > 14) {
            return `
                <div class="tip-section">
                    <h5>💪 Follicular Phase - Energy Time!</h5>
                    <ul>
                        <li>Perfect time for high-intensity workouts 🏃‍♀️</li>
                        <li>Try new activities or challenges</li>
                        <li>Focus on protein and complex carbs</li>
                        <li>Great time for important meetings or presentations</li>
                        <li>Social activities will feel more enjoyable</li>
                    </ul>
                </div>
            `;
        } else {
            return `
                <div class="tip-section">
                    <h5>🌙 Luteal Phase - Self-Care Time</h5>
                    <ul>
                        <li>Focus on gentle, restorative exercises 🧘‍♀️</li>
                        <li>Prioritize sleep and stress management</li>
                        <li>Complex carbs can help stabilize mood</li>
                        <li>Perfect time for introspection and planning</li>
                        <li>Be gentle with yourself - mood changes are normal</li>
                    </ul>
                </div>
            `;
        }
    }

    getCurrentMoodPhase(daysSince, daysUntil) {
        if (daysUntil <= 3) {
            return {
                title: "Pre-Menstrual Phase",
                description: "You might feel more introspective and sensitive. This is completely normal! 💕"
            };
        } else if (daysSince <= 7) {
            return {
                title: "Menstrual Phase",
                description: "Time to slow down and nurture yourself. Your body is doing amazing work. 🌸"
            };
        } else if (daysUntil > 14) {
            return {
                title: "Follicular Phase",
                description: "You're likely feeling energetic and optimistic! Great time to tackle new projects. ✨"
            };
        } else {
            return {
                title: "Luteal Phase",
                description: "You might feel more contemplative. Perfect time for self-reflection and planning. 🌙"
            };
        }
    }

    generateEnhancedCalendar(lastPeriod, nextPeriod, fertileStart, fertileEnd, ovulationDay) {
        const calendarDiv = document.getElementById('calendar');
        if (!calendarDiv) return;

        const today = new Date();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();
        
        calendarDiv.innerHTML = '';
        
        const monthHeader = this.createMonthHeader(today);
        calendarDiv.appendChild(monthHeader);
        
        const calendarGrid = this.createCalendarGrid(
            currentYear, currentMonth, today, lastPeriod, 
            nextPeriod, fertileStart, fertileEnd, ovulationDay
        );
        calendarDiv.appendChild(calendarGrid);
        
        const legend = this.createEnhancedLegend();
        calendarDiv.appendChild(legend);

        this.animateCalendar(calendarDiv);
    }

    createMonthHeader(today) {
        const monthHeader = document.createElement('div');
        monthHeader.className = 'month-header';
        
        const prevBtn = document.createElement('button');
        prevBtn.innerHTML = '❮';
        prevBtn.style.cssText = 'background: none; border: none; color: white; font-size: 1.2rem; cursor: pointer; padding: 0.5rem;';
        
        const monthTitle = document.createElement('div');
        monthTitle.className = 'month-title';
        monthTitle.textContent = today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        
        const nextBtn = document.createElement('button');
        nextBtn.innerHTML = '❯';
        nextBtn.style.cssText = 'background: none; border: none; color: white; font-size: 1.2rem; cursor: pointer; padding: 0.5rem;';
        
        monthHeader.appendChild(prevBtn);
        monthHeader.appendChild(monthTitle);
        monthHeader.appendChild(nextBtn);
        
        prevBtn.addEventListener('click', () => this.navigateMonth(-1));
        nextBtn.addEventListener('click', () => this.navigateMonth(1));
        
        return monthHeader;
    }

    navigateMonth(direction) {
        this.showNotification('🗓️ Month navigation coming soon!', 'info');
    }

    createCalendarGrid(currentYear, currentMonth, today, lastPeriod, nextPeriod, fertileStart, fertileEnd, ovulationDay) {
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const calendarGrid = document.createElement('div');
        calendarGrid.className = 'calendar-grid';
        
        dayNames.forEach(day => {
            const dayHeader = document.createElement('div');
            dayHeader.className = 'day-header';
            dayHeader.textContent = day;
            calendarGrid.appendChild(dayHeader);
        });
        
        const firstDay = new Date(currentYear, currentMonth, 1);
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        
        for (let i = 0; i < firstDay.getDay(); i++) {
            const emptyDay = document.createElement('div');
            emptyDay.className = 'day empty';
            calendarGrid.appendChild(emptyDay);
        }
        
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(currentYear, currentMonth, day);
            const dayElement = this.createEnhancedDayElement(
                day, date, today, lastPeriod, nextPeriod, 
                fertileStart, fertileEnd, ovulationDay
            );
            calendarGrid.appendChild(dayElement);
        }
        
        return calendarGrid;
    }

    createEnhancedDayElement(day, date, today, lastPeriod, nextPeriod, fertileStart, fertileEnd, ovulationDay) {
        const dayElement = document.createElement('div');
        dayElement.className = 'day';
        dayElement.textContent = day;
        
        let tooltipText = '';
        
        if (this.isSameDate(date, today)) {
            dayElement.classList.add('today');
            tooltipText = 'Today';
        }
        
        const periodEnd = new Date(lastPeriod);
        periodEnd.setDate(lastPeriod.getDate() + 5);
        if (date >= lastPeriod && date < periodEnd) {
            dayElement.classList.add('period');
            tooltipText = tooltipText ? `${tooltipText} • Period Day` : 'Period Day';
        }
        
        if (date >= fertileStart && date <= fertileEnd) {
            dayElement.classList.add('fertile');
            tooltipText = tooltipText ? `${tooltipText} • Fertile Window` : 'Fertile Window';
        }
        
        if (this.isSameDate(date, ovulationDay)) {
            dayElement.classList.add('ovulation');
            tooltipText = tooltipText ? `${tooltipText} • Ovulation Day` : 'Ovulation Day';
        }
        
        if (tooltipText) {
            dayElement.title = tooltipText;
            dayElement.setAttribute('data-tooltip', tooltipText);
        }
        
        dayElement.addEventListener('click', () => this.handleDayClick(date, tooltipText));
        
        return dayElement;
    }

    isSameDate(date1, date2) {
        return date1.getDate() === date2.getDate() && 
               date1.getMonth() === date2.getMonth() && 
               date1.getFullYear() === date2.getFullYear();
    }

    handleDayClick(date, info) {
        if (info) {
            this.showNotification(`📅 ${this.formatDateEnhanced(date)}: ${info}`, 'info');
        }
    }

    createEnhancedLegend() {
        const legend = document.createElement('div');
        legend.style.cssText = `
            margin-top: 2rem;
            padding: 1.5rem;
            background: linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(255, 245, 247, 0.9));
            border-radius: 15px;
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
            gap: 1rem;
            backdrop-filter: blur(10px);
        `;
        
        const legendItems = [
            { class: 'today', label: 'Today', emoji: '📅' },
            { class: 'period', label: 'Period', emoji: '🌸' },
            { class: 'fertile', label: 'Fertile', emoji: '💙' },
            { class: 'ovulation', label: 'Ovulation', emoji: '🌟' }
        ];
        
        legendItems.forEach((item, index) => {
            const legendItem = document.createElement('div');
            legendItem.style.cssText = `
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 0.5rem;
                border-radius: 8px;
                background: rgba(255, 255, 255, 0.5);
                transition: all 0.3s ease;
                cursor: pointer;
            `;
            
            const colorBox = document.createElement('div');
            colorBox.style.cssText = `
                width: 16px;
                height: 16px;
                border-radius: 4px;
                flex-shrink: 0;
            `;
            colorBox.classList.add('day', item.class);
            
            const label = document.createElement('span');
            label.innerHTML = `${item.emoji} ${item.label}`;
            label.style.cssText = 'font-size: 0.9rem; font-weight: 500;';
            
            legendItem.appendChild(colorBox);
            legendItem.appendChild(label);
            legend.appendChild(legendItem);
            
            legendItem.addEventListener('mouseenter', () => {
                legendItem.style.transform = 'translateY(-2px)';
                legendItem.style.boxShadow = '0 4px 15px rgba(255, 107, 157, 0.2)';
            });
            
            legendItem.addEventListener('mouseleave', () => {
                legendItem.style.transform = '';
                legendItem.style.boxShadow = '';
            });
            
            legendItem.style.opacity = '0';
            legendItem.style.transform = 'translateY(20px)';
            setTimeout(() => {
                legendItem.style.transition = 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
                legendItem.style.opacity = '1';
                legendItem.style.transform = 'translateY(0)';
            }, 100 * index);
        });
        
        return legend;
    }

    animateCalendar(calendarDiv) {
        const days = calendarDiv.querySelectorAll('.day:not(.empty)');
        days.forEach((day, index) => {
            day.style.opacity = '0';
            day.style.transform = 'scale(0.8)';
            setTimeout(() => {
                day.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
                day.style.opacity = '1';
                day.style.transform = 'scale(1)';
            }, index * 30);
        });
    }

    showResultsWithAnimation() {
        const resultDiv = document.getElementById('result');
        if (resultDiv) {
            resultDiv.style.display = 'block';
            resultDiv.style.opacity = '0';
            resultDiv.style.transform = 'translateY(30px) scale(0.95)';
            
            setTimeout(() => {
                resultDiv.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
                resultDiv.style.opacity = '1';
                resultDiv.style.transform = 'translateY(0) scale(1)';
            }, 100);
        }
    }

    showNotification(message, type = 'info') {
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(notification => {
            notification.remove();
        });

        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.innerHTML = message;
        
        const colors = {
            success: { bg: '#d4edda', border: '#90ee90', text: '#155724' },
            error: { bg: '#f8d7da', border: '#ff4757', text: '#721c24' },
            info: { bg: '#d1ecf1', border: '#17a2b8', text: '#0c5460' },
            warning: { bg: '#fff3cd', border: '#ffc107', text: '#856404' }
        };
        
        const color = colors[type] || colors.info;
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${color.bg};
            color: ${color.text};
            border: 2px solid ${color.border};
            border-radius: 10px;
            padding: 1rem 1.5rem;
            box-shadow: 0 8px 30px rgba(0, 0, 0, 0.1);
            z-index: 1000;
            font-weight: 500;
            max-width: 300px;
            opacity: 0;
            transform: translateX(100%) scale(0.8);
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            backdrop-filter: blur(10px);
            cursor: pointer;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(0) scale(1)';
        }, 50);
        
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%) scale(0.8)';
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.parentElement.removeChild(notification);
                }
            }, 400);
        }, 4000);
        
        notification.addEventListener('click', () => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%) scale(0.8)';
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.parentElement.removeChild(notification);
                }
            }, 400);
        });
    }

    createFloatingElements() {
        const floatingContainer = document.createElement('div');
        floatingContainer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: -1;
            overflow: hidden;
        `;
        
        for (let i = 0; i < 6; i++) {
            const floatingElement = document.createElement('div');
            const symbols = ['💕', '✨', '🌸', '💎', '🦋', '🌙'];
            floatingElement.innerHTML = symbols[i];
            floatingElement.style.cssText = `
                position: absolute;
                font-size: ${Math.random() * 20 + 15}px;
                opacity: ${Math.random() * 0.3 + 0.1};
                animation: float${i} ${Math.random() * 10 + 15}s ease-in-out infinite;
                left: ${Math.random() * 100}%;
                top: ${Math.random() * 100}%;
            `;
            
            const keyframes = `
                @keyframes float${i} {
                    0%, 100% { 
                        transform: translateY(0px) rotate(0deg); 
                        opacity: ${Math.random() * 0.3 + 0.1};
                    }
                    50% { 
                        transform: translateY(-${Math.random() * 30 + 20}px) rotate(180deg); 
                        opacity: ${Math.random() * 0.5 + 0.2};
                    }
                }
            `;
            

            const style = document.createElement('style');
            style.textContent = keyframes;
            document.head.appendChild(style);
            
            floatingContainer.appendChild(floatingElement);
        }
        
        document.body.appendChild(floatingContainer);
    }

    setupTooltips() {
    
        const style = document.createElement('style');
        style.textContent = `
            [data-tooltip] {
                position: relative;
                cursor: help;
            }
            
            [data-tooltip]:hover::after {
                content: attr(data-tooltip);
                position: absolute;
                bottom: 125%;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(0, 0, 0, 0.9);
                color: white;
                padding: 0.5rem 1rem;
                border-radius: 8px;
                font-size: 0.8rem;
                white-space: nowrap;
                z-index: 1000;
                opacity: 0;
                animation: tooltipFadeIn 0.3s ease forwards;
                backdrop-filter: blur(10px);
                box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
            }
            
            [data-tooltip]:hover::before {
                content: '';
                position: absolute;
                bottom: 115%;
                left: 50%;
                transform: translateX(-50%);
                border: 5px solid transparent;
                border-top-color: rgba(0, 0, 0, 0.9);
                z-index: 1001;
                opacity: 0;
                animation: tooltipFadeIn 0.3s ease forwards;
            }
            
            @keyframes tooltipFadeIn {
                from { opacity: 0; transform: translateX(-50%) translateY(10px); }
                to { opacity: 1; transform: translateX(-50%) translateY(0); }
            }
        `;
        document.head.appendChild(style);
    }

    
    getCycleInsights(lastPeriodDate, cycleLength) {
        const today = new Date();
        const daysSinceLastPeriod = Math.floor((today - lastPeriodDate) / (1000 * 60 * 60 * 24));
        const currentCycleDay = (daysSinceLastPeriod % cycleLength) + 1;
        
        let phase = '';
        let phaseDescription = '';
        let emoji = '';
        
        if (currentCycleDay <= 5) {
            phase = 'Menstrual';
            phaseDescription = 'Rest and recharge time';
            emoji = '🌸';
        } else if (currentCycleDay <= 13) {
            phase = 'Follicular';
            phaseDescription = 'Energy building phase';
            emoji = '🌱';
        } else if (currentCycleDay <= 16) {
            phase = 'Ovulatory';
            phaseDescription = 'Peak energy and confidence';
            emoji = '🌟';
        } else {
            phase = 'Luteal';
            phaseDescription = 'Preparation and reflection time';
            emoji = '🌙';
        }
        
        return {
            phase,
            phaseDescription,
            emoji,
            currentCycleDay,
            daysSinceLastPeriod
        };
    }

    
    exportData() {
        const data = {
            ...this.data,
            exportDate: new Date().toISOString(),
            version: '2.0'
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'period-tracker-data.json';
        a.click();
        URL.revokeObjectURL(url);
        
        this.showNotification('📊 Data exported successfully!', 'success');
    }

    
    importData(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedData = JSON.parse(e.target.result);
                this.data = { ...importedData };
                this.saveData();
                this.populateInputs();
                this.showNotification('📥 Data imported successfully!', 'success');
            } catch (error) {
                this.showNotification('❌ Invalid file format', 'error');
            }
        };
        reader.readAsText(file);
    }

    
    resetData() {
        if (confirm('Are you sure you want to reset all data? This cannot be undone.')) {
            localStorage.removeItem('periodData');
            this.data = {};
            
            
            const inputs = ['lastPeriod', 'cycleLength', 'periodLength'];
            inputs.forEach(id => {
                const element = document.getElementById(id);
                if (element) {
                    element.value = '';
                }
            });
            
            
            const resultDiv = document.getElementById('result');
            if (resultDiv) {
                resultDiv.style.display = 'none';
            }
            
            this.initializeDefaults();
            this.showNotification('🗑️ All data has been reset', 'info');
        }
    }

    
    handleError(error, userMessage = 'Something went wrong') {
        console.error('Period Detector Error:', error);
        this.showNotification(`❌ ${userMessage}`, 'error');
    }

    
    checkBrowserCompatibility() {
        const features = {
            localStorage: typeof Storage !== 'undefined',
            dateInput: typeof document.createElement('input').valueAsDate !== 'undefined',
            cssVariables: CSS.supports('color', 'var(--fake-var)'),
            backdropFilter: CSS.supports('backdrop-filter', 'blur(1px)')
        };
        
        const unsupported = Object.entries(features)
            .filter(([feature, supported]) => !supported)
            .map(([feature]) => feature);
        
        if (unsupported.length > 0) {
            this.showNotification(
                `⚠️ Some features may not work in your browser: ${unsupported.join(', ')}`, 
                'warning'
            );
        }
    }
}


const periodDetector = new PeriodDetector();


document.addEventListener('keydown', function(e) {
    if (e.key === 'F1') {
        e.preventDefault();
        periodDetector.showNotification('💡 Shortcuts: Ctrl+Enter (Calculate), Ctrl+S (Save)', 'info');
    }
});



if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('/service-worker.js')
            .then(function(registration) {
                console.log('✅ Service Worker registered with scope:', registration.scope);
            })
            .catch(function(error) {
                console.error('❌ Service Worker registration failed:', error);
            });
    });
}
