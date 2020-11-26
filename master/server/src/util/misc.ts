export function get_date_time(): string {
    return new Date().toISOString().slice(0, 19).replace('T', ' ');
}