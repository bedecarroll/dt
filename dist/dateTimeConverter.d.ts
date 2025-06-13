export interface ConversionResult {
    parsedDate: Date | null;
    convertedDate: string;
    timezone: string;
    error?: string;
}
export type FormatType = 'long' | 'short' | 'iso';
export declare class DateTimeConverter {
    /** Format a Date object into a string in the given timezone, by style */
    static formatDate(date: Date, timezone: string, format?: FormatType): string;
    static parseAndConvert(input: string, targetTimezone: string): ConversionResult;
    static getAllTimezones(): string[];
}
//# sourceMappingURL=dateTimeConverter.d.ts.map