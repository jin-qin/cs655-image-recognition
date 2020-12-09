export function get_date_time(): string {
    return new Date().toISOString().replace('T', ' ').replace('Z', '');
}

// milliseconds
export function get_timestamp(): number {
    return Date.now();
}

// milliseconds
export function date2timestamp(dt: string): number {
    return Date.parse(dt);
}