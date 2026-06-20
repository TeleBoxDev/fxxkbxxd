import 'dotenv/config';
import { TelegramClient, User, tl } from '@mtcute/node';
import { registerPlugins } from './plugin.js';
import { Dispatcher } from '@mtcute/dispatcher';
import { encodeQR } from 'qr';

// 二维码登录
async function loginViaQRCodeLogin(tg: TelegramClient): Promise<User> {
  const self = await tg.start({
    qrCodeHandler: (url, expires) => {
      // display the `url` as the qr code to the user, for example print it to console:
      console.log(encodeQR(url, 'ascii'));
    },
    // logging in via qr still requires entering a 2fa password if you have one set up
    password: () => tg.input('Password > '),
  });

  return self;
}

// 手机密码登录
async function loginViaPhoneNumber(tg: TelegramClient): Promise<User> {
  const self = await tg.start({
    phone: () => tg.input('Phone number > '),
    code: () => tg.input('Code > '),
    password: () => tg.input('Password > '),
  });

  return self;
}

async function login(tg: TelegramClient): Promise<void> {
  let loginViaQRCode: boolean;

  let loginViaQRCodeMessage = 'Login via QR code. (Y/n) > ';

  let inputResult = await tg.input(loginViaQRCodeMessage);

  if (inputResult.toLowerCase() === 'n') {
    console.log('You chose not to login via QR code.');
    loginViaQRCode = false;
  } else {
    console.log('You chose to login via Phone number.');
    loginViaQRCode = true;
  }

  let self: User;

  if (loginViaQRCode) {
    self = await loginViaQRCodeLogin(tg);
  } else {
    self = await loginViaPhoneNumber(tg);
  }

  console.log(`✨ logged in as ${self.displayName}`);
}

// ----------------------

let envAPIId = process.env.API_ID;
if (!envAPIId) {
  throw new Error('API_ID is not defined in the environment variables.');
}
let envAPIHash = process.env.API_HASH;
if (!envAPIHash) {
  throw new Error('API_HASH is not defined in the environment variables.');
}

let apiId: number = Number.parseInt(envAPIId);
let apiHash: string = envAPIHash;

const tg = new TelegramClient({
  apiId,
  apiHash,
  storage: 'account-info/my-account',
});

const dp = Dispatcher.for(tg);

registerPlugins(dp);

async function run(): Promise<void> {
  try {
    // Try calling any method that requires authorization
    // (getMe is the simplest one and likely the most useful,
    // but you can use any other)
    await tg.getMe();
    tg.start();
    console.log('✨ already logged in');
  } catch (e) {
    if (tl.RpcError.is(e, 'AUTH_KEY_UNREGISTERED')) {
      // Not signed in, continue
      await login(tg);
    } else {
      // Some other error, rethrow
      throw e;
    }
  }
}

export { run };
