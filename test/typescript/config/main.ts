export const beep = (n: number): number => n * 111;
declare var ex: (n: number) => void;
ex(beep(5));
