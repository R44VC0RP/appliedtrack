export function plain(obj: any )  {
    return JSON.parse(JSON.stringify(obj))
}