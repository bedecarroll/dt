export declare class AutocompleteInput {
    private input;
    private dropdown;
    private options;
    private filteredOptions;
    private selectedIndex;
    private onSelectCallback?;
    constructor(inputElement: HTMLInputElement, options: string[]);
    private createDropdown;
    private bindEvents;
    private handleInput;
    private handleKeydown;
    private handleFocus;
    private handleDocumentClick;
    private renderDropdown;
    private updateSelection;
    private selectOption;
    private showDropdown;
    private hideDropdown;
    onSelect(callback: (value: string) => void): void;
}
//# sourceMappingURL=autocomplete.d.ts.map