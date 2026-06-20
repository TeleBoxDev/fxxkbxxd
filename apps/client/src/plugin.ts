import { Dispatcher, filters, MessageContext } from '@mtcute/dispatcher';
import { currentPrefixes } from '@utils/prefix-helpers.js';
import { PluginCore } from '@fxxkbxxd/plugin-core';
import type {
  PluginName,
  PluginCommandHandleFunction,
} from '@fxxkbxxd/plugin-core';

// 基本插件
import { BuiltinHelp } from '@fxxkbxxd/help';
import { BuiltinUpdate } from '@fxxkbxxd/update';

// 官方功能性插件

import { AbanPlugin } from '@plugin/aban';

// 最基本的插件 help，由于会访问 plugins 等全局变量来展示用户安装的插件等信息，
// 可能引用循环造成内存泄漏，最好单独排列出来
let helpPlugin: BuiltinHelp;
let helpPluginCommandHandlers: Map<string, PluginCommandHandleFunction> =
  new Map();

// 记录所有插件 (help 除外)，随 PluginName 覆盖
let plugins: Map<PluginName, PluginCore> = new Map();
// 记录所有 Command Handler (help 除外)
let pluginCommandHandlers: Map<string, PluginCommandHandleFunction> = new Map();

function loadBuiltinPlugins(): void {
  const update = new BuiltinUpdate();
  let builtinPlugins = [update];
  builtinPlugins.forEach((plugin) => {
    plugins.set(plugin.pluginName, plugin);
  });
}

function loadOfficialPlugins(): void {
  const aban = new AbanPlugin();
  let officialPlugins = [aban];
  officialPlugins.forEach((plugin) => {
    plugins.set(plugin.pluginName, plugin);
  });
}

function loadHelpPluginAndHelpCommandHandlers(): void {
  helpPlugin = new BuiltinHelp(plugins);
  if (!helpPlugin) {
    throw new Error('Help plugin not found');
  }
  for (const [command, handler] of Object.entries(
    helpPlugin.pluginCommandHandlers,
  )) {
    helpPluginCommandHandlers.set(command, handler);
  }
}

function loadPluginCommandHandlers(): void {
  for (const plugin of plugins.values()) {
    for (const [command, handler] of Object.entries(
      plugin.pluginCommandHandlers,
    )) {
      pluginCommandHandlers.set(command, handler);
    }
  }
}

function loadPlugins(): void {
  // 加载 基本插件
  loadBuiltinPlugins();

  // 加载 官方提供的功能性插件
  loadOfficialPlugins();

  // 添加所有插件的 Command Handler
  loadPluginCommandHandlers();

  // 加载 help 插件，由于 help 插件需要访问 plugins 变量，所以必须在加载完基本插件后单独加载
  loadHelpPluginAndHelpCommandHandlers();
}

// 从信息中获取可能的命令
function getCommandFromMessage(msg: MessageContext): string | undefined {
  let prefixes = currentPrefixes();
  let text = msg.text;
  if (!text) return;
  const matched = prefixes.find((prefix) => text.startsWith(prefix));
  if (!matched) return;
  const rest = text.slice(matched.length).trim();
  const [cmd] = rest.split(/\s+/);
  if (!cmd) return;
  if (/^[a-z0-9_]+$/i.test(cmd)) return cmd;
}

function getCommandHandler(
  cmd: string,
): PluginCommandHandleFunction | undefined {
  // 优先 help 插件的命令
  if (helpPluginCommandHandlers.has(cmd)) {
    return helpPluginCommandHandlers.get(cmd);
  }
  // 其次是其他插件的命令
  return pluginCommandHandlers.get(cmd);
}

function injectSelfNewMessage(dp: Dispatcher): void {
  dp.onNewMessage(filters.outgoing, async (msg) => {
    const cmd = getCommandFromMessage(msg);
    if (!cmd) return;
    const handler = getCommandHandler(cmd);
    if (handler) {
      await handler(msg);
    }
  });
}

function injectSelfEditMessage(dp: Dispatcher): void {}

function injectSelfMessage(dp: Dispatcher): void {
  injectSelfNewMessage(dp);
  injectSelfEditMessage(dp);
}

function registerPlugins(dp: Dispatcher): void {
  // 加载插件
  loadPlugins();
  // 注册 listener 用于处理自己发出的命令
  injectSelfMessage(dp);
}

export { registerPlugins };
