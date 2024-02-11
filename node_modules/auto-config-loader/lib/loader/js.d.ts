import type { JITIOptions } from 'jiti/dist/types';
import { Options } from 'sucrase';
export interface LoadConfOption {
    jiti?: boolean;
    jitiOptions?: JITIOptions;
    transformOption?: Options;
}
export declare function loadConf<T>(path: string, option?: LoadConfOption): T;
export declare function jsLoader<T>(filepath: string, content: string, option?: LoadConfOption): T;
