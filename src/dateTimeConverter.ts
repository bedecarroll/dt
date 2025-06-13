// Sugar.js is loaded via CDN
declare const Sugar: any;

export interface ConversionResult {
  parsedDate: Date | null;
  convertedDate: string;
  timezone: string;
  error?: string;
}

export type FormatType = 'long' | 'short' | 'iso';

export class DateTimeConverter {
  /** Format a Date object into a string in the given timezone, by style */
  public static formatDate(date: Date, timezone: string, format: FormatType = 'long'): string {
    try {
      switch (format) {
        case 'short':
          return new Intl.DateTimeFormat('en-US', {
            timeZone: timezone,
            year: 'numeric',
            month: 'numeric',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }).format(date);
        case 'iso': {
          // Build ISO 8601 string (with timezone offset) for the given timezone
          const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: timezone,
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit', second: '2-digit',
            timeZoneName: 'shortOffset'
          });
          const parts = formatter.formatToParts(date);
          let year = '0000', month = '01', day = '01';
          let hour = '00', minute = '00', second = '00';
          let tzRaw = '';
          for (const p of parts) {
            switch (p.type) {
              case 'year': year = p.value; break;
              case 'month': month = p.value; break;
              case 'day': day = p.value; break;
              case 'hour': hour = p.value; break;
              case 'minute': minute = p.value; break;
              case 'second': second = p.value; break;
              case 'timeZoneName': {
                const m = p.value.match(/([+-].*)/);
                tzRaw = m ? m[1] : '';
                break;
              }
            }
          }
          // Build ISO offset
          let isoOffset = 'Z';
          if (tzRaw) {
            const m2 = tzRaw.match(/^([+-])(\d{1,2})(?::?(\d{2}))?$/);
            if (m2) {
              const sign = m2[1];
              const hh = m2[2].padStart(2, '0');
              const mm = (m2[3] || '00').padStart(2, '0');
              isoOffset = `${sign}${hh}:${mm}`;
            } else {
              isoOffset = tzRaw;
            }
          }
          return `${year}-${month}-${day}T${hour}:${minute}:${second}${isoOffset}`;
        }
        case 'long':
        default:
          return new Intl.DateTimeFormat('en-US', {
            timeZone: timezone,
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            timeZoneName: 'short'
          }).format(date);
      }
    } catch (error) {
      return `Error formatting date: ${error}`;
    }
  }

  static parseAndConvert(input: string, targetTimezone: string): ConversionResult {
    try {
      // Use Sugar.js to parse natural language dates
      const parsedDate = Sugar.Date.create(input);
      
      if (!parsedDate || isNaN(parsedDate.getTime())) {
        return {
          parsedDate: null,
          convertedDate: '',
          timezone: targetTimezone,
          error: 'Could not parse the date/time string. Try: "tomorrow at 3pm", "next Friday", "today at 2:30pm", or standard date formats.'
        };
      }

      const convertedDate = this.formatDate(parsedDate, targetTimezone);

      return {
        parsedDate,
        convertedDate,
        timezone: targetTimezone
      };
    } catch (error) {
      return {
        parsedDate: null,
        convertedDate: '',
        timezone: targetTimezone,
        error: `Error processing date: ${error}`
      };
    }
  }

  static getAllTimezones(): string[] {
    // Fallback list for older browsers that don't support Intl.supportedValuesOf
    const commonTimezones = [
      'UTC',
      'America/New_York', 'America/Los_Angeles', 'America/Chicago', 'America/Denver',
      'America/Toronto', 'America/Vancouver', 'America/Sao_Paulo', 'America/Argentina/Buenos_Aires',
      'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Europe/Rome', 'Europe/Madrid',
      'Europe/Amsterdam', 'Europe/Stockholm', 'Europe/Warsaw', 'Europe/Istanbul',
      'Asia/Tokyo', 'Asia/Shanghai', 'Asia/Seoul', 'Asia/Hong_Kong', 'Asia/Singapore',
      'Asia/Mumbai', 'Asia/Dubai', 'Asia/Bangkok', 'Asia/Jakarta',
      'Australia/Sydney', 'Australia/Melbourne', 'Australia/Perth',
      'Pacific/Auckland', 'Pacific/Honolulu'
    ];

    try {
      // Use modern API if available
      if ('supportedValuesOf' in Intl) {
        return (Intl as any).supportedValuesOf('timeZone').sort();
      }
      return commonTimezones.sort();
    } catch {
      return commonTimezones.sort();
    }
  }
}
