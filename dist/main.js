import { DateTimeConverter } from './dateTimeConverter.js';
import { AutocompleteInput } from './autocomplete.js';
// Map common abbreviations to IANA timezones
const TZ_ABBREVIATIONS = {
    'UTC': 'UTC',
    'GMT': 'UTC',
    'EST': 'America/New_York',
    'EDT': 'America/New_York',
    'CST': 'Asia/Shanghai',
    'CDT': 'America/Chicago',
    'MST': 'America/Denver',
    'MDT': 'America/Denver',
    'PST': 'America/Los_Angeles',
    'PDT': 'America/Los_Angeles',
    'CET': 'Europe/Paris',
    'CEST': 'Europe/Paris',
    'IST': 'Asia/Kolkata',
    'JST': 'Asia/Tokyo',
    'AEST': 'Australia/Sydney',
    'ACST': 'Australia/Adelaide',
    'AWST': 'Australia/Perth',
    'SGT': 'Asia/Singapore',
    'HKT': 'Asia/Hong_Kong'
};
// Colors used to differentiate timezone tags
const TAG_COLORS = [
    '#ff8a80', // red
    '#8c9eff', // indigo
    '#80d8ff', // light blue
    '#a7ffeb', // teal
    '#ccff90', // light green
    '#ffff8d', // yellow
    '#ffd180', // orange
    '#ff9e80' // peach
];
class App {
    constructor() {
        this.timezones = [];
        this.currentFormat = 'long';
        this.datetimeInput = document.getElementById('datetime-input');
        this.timezoneInput = document.getElementById('timezone-input');
        this.convertBtn = document.getElementById('convert-btn');
        this.resultsDiv = document.getElementById('results');
        this.setupTimezoneAutocomplete();
        this.loadTimezones();
        this.renderTimezoneList();
        this.bindEvents();
        this.attachCopyHandlers();
        this.loadFormatFromStorage();
        this.bindFormatButtons();
    }
    setupTimezoneAutocomplete() {
        // Prepare autocomplete options: include common abbreviations first
        const allZones = DateTimeConverter.getAllTimezones();
        const abbrevs = Object.keys(TZ_ABBREVIATIONS);
        const options = Array.from(new Set([...abbrevs, ...allZones]));
        this.timezoneAutocomplete = new AutocompleteInput(this.timezoneInput, options);
        // When selecting via autocomplete, immediately add
        this.timezoneAutocomplete.onSelect(value => {
            this.timezoneInput.value = value;
            this.addTimezone();
        });
    }
    bindEvents() {
        this.convertBtn.addEventListener('click', this.handleConvert.bind(this));
        this.datetimeInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleConvert();
            }
        });
        // Enter on timezone input adds a timezone
        this.timezoneInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.addTimezone();
            }
        });
    }
    /** Load saved timezones or default */
    loadTimezones() {
        const stored = localStorage.getItem('timezones');
        if (stored) {
            try {
                this.timezones = JSON.parse(stored);
            }
            catch {
                this.timezones = [];
            }
        }
        if (!this.timezones || this.timezones.length === 0) {
            this.timezones = ['America/Los_Angeles'];
            localStorage.setItem('timezones', JSON.stringify(this.timezones));
        }
    }
    /** Update the display of selected timezones */
    renderTimezoneList() {
        const list = document.getElementById('timezone-list');
        list.innerHTML = '';
        this.timezones.forEach((tz, idx) => {
            const tag = document.createElement('span');
            tag.className = 'tz-tag';
            // Color-code tags
            const color = TAG_COLORS[idx % TAG_COLORS.length];
            tag.style.backgroundColor = color;
            tag.style.color = '#000';
            tag.textContent = tz;
            const btn = document.createElement('button');
            btn.className = 'remove-btn';
            btn.textContent = '×';
            btn.title = 'Remove timezone';
            btn.addEventListener('click', () => {
                this.timezones = this.timezones.filter(t => t !== tz);
                localStorage.setItem('timezones', JSON.stringify(this.timezones));
                this.renderTimezoneList();
            });
            tag.appendChild(btn);
            list.appendChild(tag);
        });
    }
    /** Add a timezone from the input field */
    addTimezone() {
        const inputVal = this.timezoneInput.value.trim();
        if (!inputVal)
            return;
        // Map abbreviation if present
        let tz = inputVal;
        const abbr = inputVal.toUpperCase();
        if (TZ_ABBREVIATIONS[abbr]) {
            tz = TZ_ABBREVIATIONS[abbr];
        }
        // Validate against official list or known abbreviations
        const all = DateTimeConverter.getAllTimezones();
        const validZones = new Set([...all, ...Object.values(TZ_ABBREVIATIONS)]);
        if (!validZones.has(tz)) {
            alert(`Invalid timezone: ${inputVal}`);
            return;
        }
        if (!this.timezones.includes(tz)) {
            this.timezones.push(tz);
            localStorage.setItem('timezones', JSON.stringify(this.timezones));
            this.renderTimezoneList();
        }
        this.timezoneInput.value = '';
    }
    handleConvert() {
        const datetimeText = this.datetimeInput.value.trim();
        if (!datetimeText) {
            this.showError('Please enter a date/time string');
            return;
        }
        if (this.timezones.length === 0) {
            this.showError('Please add at least one timezone');
            return;
        }
        // Parse once using first timezone (for parsedDate)
        const parseResult = DateTimeConverter.parseAndConvert(datetimeText, this.timezones[0]);
        if (parseResult.error || !parseResult.parsedDate) {
            this.showError(parseResult.error || 'Error parsing date');
            return;
        }
        this.lastParsedDate = parseResult.parsedDate;
        this.displayResult(parseResult);
    }
    displayResult(result) {
        if (result.error) {
            this.showError(result.error);
            return;
        }
        // Show results container
        this.resultsDiv.style.display = 'block';
        // Render timeline for parsed date
        if (this.lastParsedDate) {
            this.renderTimeline(this.lastParsedDate);
            this.renderConversions(this.lastParsedDate);
        }
    }
    showError(message) {
        this.resultsDiv.innerHTML = `
      <div class="error-message">
        <h3>Error:</h3>
        <p>${message}</p>
      </div>
    `;
        this.resultsDiv.style.display = 'block';
    }
    /** Load output format from localStorage */
    loadFormatFromStorage() {
        const stored = localStorage.getItem('format');
        if (stored === 'long' || stored === 'short' || stored === 'iso') {
            this.currentFormat = stored;
        }
    }
    /** Generate a simple calendar view for the given date and timezone */
    /** Render conversion results for all selected timezones */
    renderConversions(parsedDate) {
        const list = document.getElementById('conversion-list');
        list.innerHTML = '';
        this.timezones.forEach(tz => {
            const converted = DateTimeConverter.formatDate(parsedDate, tz, this.currentFormat);
            const item = document.createElement('div');
            item.className = 'result-item';
            const h3 = document.createElement('h3');
            h3.textContent = tz;
            const p = document.createElement('p');
            p.textContent = converted;
            const pid = `conv-${tz.replace(/[^a-zA-Z0-9]/g, '_')}`;
            p.id = pid;
            const btn = document.createElement('button');
            btn.className = 'copy-btn';
            btn.setAttribute('data-target-id', pid);
            btn.textContent = 'Copy';
            // wrap paragraph and button inline
            const wrapper = document.createElement('div');
            wrapper.className = 'result-value';
            wrapper.appendChild(p);
            wrapper.appendChild(btn);
            item.appendChild(h3);
            item.appendChild(wrapper);
            list.appendChild(item);
        });
    }
    /** Render a 24-hour timeline highlighting each timezone's converted hour */
    renderTimeline(date) {
        const timelineEl = document.getElementById('timeline');
        timelineEl.innerHTML = '';
        this.timezones.forEach((tz, idx) => {
            // Determine hour in target timezone (0-23)
            const parts = new Intl.DateTimeFormat('en-US', { timeZone: tz, hour: 'numeric', hour12: false }).formatToParts(date);
            let hour = 0;
            for (const p of parts) {
                if (p.type === 'hour') {
                    hour = parseInt(p.value, 10);
                    break;
                }
            }
            // Determine day difference relative to original date
            const dayParts = new Intl.DateTimeFormat('en-US', { timeZone: tz, day: 'numeric' }).formatToParts(date);
            let tzDay = date.getDate();
            for (const p of dayParts) {
                if (p.type === 'day') {
                    tzDay = parseInt(p.value, 10);
                    break;
                }
            }
            const localDay = date.getDate();
            const dayDiff = tzDay - localDay;
            // Determine row color based on timezone index
            const color = TAG_COLORS[idx % TAG_COLORS.length];
            // Build row
            const row = document.createElement('div');
            row.className = 'timeline-row';
            const label = document.createElement('div');
            label.className = 'tz-label';
            let labelText = tz;
            if (dayDiff === -1)
                labelText += ' (prev day)';
            else if (dayDiff === 1)
                labelText += ' (next day)';
            label.textContent = labelText;
            // (Optional) color label background to match tag color
            label.style.backgroundColor = color;
            label.style.color = '#000';
            const hoursWrap = document.createElement('div');
            hoursWrap.className = 'timeline-hours';
            for (let i = 0; i < 24; i++) {
                const blk = document.createElement('div');
                blk.className = 'hour-block';
                blk.setAttribute('data-hour', i.toString());
                if (i === hour) {
                    blk.classList.add('highlight');
                    // color the highlighted hour block
                    blk.style.backgroundColor = color;
                }
                hoursWrap.appendChild(blk);
            }
            row.appendChild(label);
            row.appendChild(hoursWrap);
            timelineEl.appendChild(row);
        });
    }
    /** Attach global listener for copy buttons */
    attachCopyHandlers() {
        document.addEventListener('click', (e) => {
            const target = e.target;
            if (target && target.classList.contains('copy-btn')) {
                const id = target.getAttribute('data-target-id');
                if (id) {
                    const el = document.getElementById(id);
                    if (el) {
                        navigator.clipboard.writeText(el.textContent || '');
                        const orig = target.textContent;
                        target.textContent = 'Copied!';
                        setTimeout(() => { target.textContent = orig || 'Copy'; }, 2000);
                    }
                }
            }
        });
    }
    /** Bind format buttons to switch output style */
    bindFormatButtons() {
        const btns = Array.from(document.querySelectorAll('.fmt-btn'));
        // Initialize selection based on stored or default format
        btns.forEach(b => {
            const f = b.getAttribute('data-format');
            if (f === this.currentFormat) {
                b.classList.add('selected');
            }
            else {
                b.classList.remove('selected');
            }
        });
        // Bind click handlers
        btns.forEach(btn => {
            btn.addEventListener('click', () => {
                const fmt = btn.getAttribute('data-format');
                // Update UI
                btns.forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                // Store format
                this.currentFormat = fmt;
                localStorage.setItem('format', fmt);
                // Re-render conversions
                if (this.lastParsedDate) {
                    this.renderConversions(this.lastParsedDate);
                }
            });
        });
    }
}
document.addEventListener('DOMContentLoaded', () => {
    new App();
});
//# sourceMappingURL=main.js.map