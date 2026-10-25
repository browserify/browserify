import { beep } from './beep';
import * as sub from './sub/index';

interface Result {
    x: number;
    y: string;
}

const res: Result = { x: beep(5), y: sub.name };
declare var ex: (r: Result) => void;
ex(res);
