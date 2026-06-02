export const resolve = (...args: string[]) => args.join('/')
export const dirname = (p: string) => p.split('/').slice(0, -1).join('/')
export const extname = (p: string) => { const m = p.match(/\.[^.]+$/); return m ? m[0] : '' }
export default { resolve, dirname, extname }
