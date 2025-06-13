export class AutocompleteInput {
    constructor(inputElement, options) {
        this.dropdown = document.createElement('div');
        this.filteredOptions = [];
        this.selectedIndex = -1;
        this.input = inputElement;
        this.options = options;
        this.createDropdown();
        this.bindEvents();
    }
    createDropdown() {
        this.dropdown = document.createElement('div');
        this.dropdown.className = 'autocomplete-dropdown';
        this.dropdown.style.display = 'none';
        this.input.parentNode?.appendChild(this.dropdown);
    }
    bindEvents() {
        this.input.addEventListener('input', this.handleInput.bind(this));
        this.input.addEventListener('keydown', this.handleKeydown.bind(this));
        this.input.addEventListener('focus', this.handleFocus.bind(this));
        document.addEventListener('click', this.handleDocumentClick.bind(this));
    }
    handleInput() {
        const query = this.input.value.toLowerCase();
        this.filteredOptions = this.options.filter(option => option.toLowerCase().includes(query));
        this.selectedIndex = -1;
        this.renderDropdown();
    }
    handleKeydown(event) {
        if (this.dropdown.style.display === 'none')
            return;
        switch (event.key) {
            case 'ArrowDown':
                event.preventDefault();
                this.selectedIndex = Math.min(this.selectedIndex + 1, this.filteredOptions.length - 1);
                this.updateSelection();
                break;
            case 'ArrowUp':
                event.preventDefault();
                this.selectedIndex = Math.max(this.selectedIndex - 1, -1);
                this.updateSelection();
                break;
            case 'Enter':
                event.preventDefault();
                if (this.selectedIndex >= 0) {
                    this.selectOption(this.filteredOptions[this.selectedIndex]);
                }
                break;
            case 'Escape':
                this.hideDropdown();
                break;
        }
    }
    handleFocus() {
        if (this.input.value.trim() === '') {
            this.filteredOptions = this.options;
            this.renderDropdown();
        }
    }
    handleDocumentClick(event) {
        if (!this.input.contains(event.target) &&
            !this.dropdown.contains(event.target)) {
            this.hideDropdown();
        }
    }
    renderDropdown() {
        this.dropdown.innerHTML = '';
        if (this.filteredOptions.length === 0) {
            this.hideDropdown();
            return;
        }
        this.filteredOptions.slice(0, 10).forEach((option, index) => {
            const item = document.createElement('div');
            item.className = 'autocomplete-item';
            item.textContent = option;
            item.addEventListener('click', () => this.selectOption(option));
            this.dropdown.appendChild(item);
        });
        this.showDropdown();
    }
    updateSelection() {
        const items = this.dropdown.querySelectorAll('.autocomplete-item');
        items.forEach((item, index) => {
            item.classList.toggle('selected', index === this.selectedIndex);
        });
    }
    selectOption(option) {
        this.input.value = option;
        this.hideDropdown();
        this.onSelectCallback?.(option);
    }
    showDropdown() {
        this.dropdown.style.display = 'block';
    }
    hideDropdown() {
        this.dropdown.style.display = 'none';
        this.selectedIndex = -1;
    }
    onSelect(callback) {
        this.onSelectCallback = callback;
    }
}
//# sourceMappingURL=autocomplete.js.map