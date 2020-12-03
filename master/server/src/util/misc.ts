export function get_date_time(): string {
    return new Date().toISOString().replace('T', ' ').replace('Z', '');
}