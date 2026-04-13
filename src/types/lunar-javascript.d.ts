declare module 'lunar-javascript' {
  export class Lunar {
    static fromDate(date: Date): Lunar;
    static fromYmd(year: number, month: number, day: number): Lunar;
    getDay(): number;
    getMonth(): number;
    getYear(): number;
    getSolar(): Solar;
  }
  
  export class Solar {
    static fromDate(date: Date): Solar;
    getLunar(): Lunar;
    getDay(): number;
    getMonth(): number;
    getYear(): number;
  }
}
