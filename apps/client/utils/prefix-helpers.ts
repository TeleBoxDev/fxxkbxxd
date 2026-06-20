import 'dotenv/config';

let cmd_prefixs: string[] = process.env.CMD_PREFIXES
  ? JSON.parse(process.env.CMD_PREFIXES)
  : ['.', '。'];
let cmd_dev_prefixs: string[] = process.env.CMD_DEV_PREFIXES
  ? JSON.parse(process.env.CMD_DEV_PREFIXES)
  : ['!', '！'];
console.log('env prefixes:', {
  production: process.env.CMD_PREFIXES,
  development: process.env.CMD_DEV_PREFIXES,
});
console.log(
  'Could change prefixes by setting CMD_PREFIXES or CMD_DEV_PREFIXES environment variable',
);

function currentPrefixes(): string[] {
  const prefixes =
    process.env.NODE_ENV === 'development' ? cmd_dev_prefixs : cmd_prefixs;
  console.log('Current prefixes:', prefixes);
  return prefixes;
}

export { currentPrefixes };
