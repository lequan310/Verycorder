export type Target = {
    css: string;
    xpath: string;
}

export enum TargetEnum {
    'css' = 'CSS',
    'x-path' = 'X-path'
}

export type Value = {
    x: number
    y: number
};