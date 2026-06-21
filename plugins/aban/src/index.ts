import { PluginCore } from '@fxxkbxxd/plugin-core';
import { MessageContext } from '@mtcute/dispatcher';
import { BanManager } from './ban-manager.js';
import type { Peer } from '@mtcute/node';

// 由于 BanManager 会保存用户拥有权限的对话列表，且需在多个命令中使用，我们在这里创建一个单例实例来管理它。
// 这样可以避免在每次命令调用时都重新创建 BanManager 实例。
let banManager: BanManager | null = null;

function getBanManager(msg: MessageContext): BanManager {
  if (!banManager) {
    banManager = new BanManager(msg);
  }
  return banManager;
}

async function getTargetUserId(msg: MessageContext): Promise<Peer | undefined> {
  const replyto = await msg.getReplyTo();
  if (!replyto) {
    await msg.replyText('请回复一条消息以获取用户信息！');
    return undefined;
  }
  const user = replyto.sender;
  return user;
}

export class AbanPlugin extends PluginCore {
  pluginName = 'aban';
  pluginDescription = `
  <b>封禁管理</b></br>
  <code>kick</code> - 踢出用户</br>
  <code>ban</code> - 封禁用户</br>
  <code>unban</code> - 解除封禁用户</br>
  <code>mute [time]</code> - 禁言用户（如60s/5m/1h/1d，不填则永久禁言）</br>
  <code>unmute</code> - 解除禁言用户</br>
  <code>sb</code> - 在所有管理员对话中封禁用户（慎用）</br>
  <code>unsb</code> - 在所有管理员对话中解除封禁用户（慎用）</br>
  <code>refreshAban</code> - 刷新管理员对话列表缓存</br>
  `;
  pluginCommandHandlers = {
    kick: async (msg: MessageContext) => {
      const user = await getTargetUserId(msg);
      if (!user) return;

      const manager = getBanManager(msg);
      await manager.kickUser(msg, user);
    },
    ban: async (msg: MessageContext) => {
      const user = await getTargetUserId(msg);
      if (!user) return;

      const manager = getBanManager(msg);
      await manager.banUser(msg, user);
    },
    unban: async (msg: MessageContext) => {
      const user = await getTargetUserId(msg);
      if (!user) return;

      const manager = getBanManager(msg);
      await manager.unbanUser(msg, user);
    },
    mute: async (msg: MessageContext) => {
      const user = await getTargetUserId(msg);
      if (!user) return;

      const args = msg.text.trim().split(' ').slice(1);
      let durationSeconds = 0; // 默认为永久禁言

      if (args.length > 0) {
        const timeStr = args[0];
        if (!timeStr) {
          await msg.replyText(
            '请提供禁言时间！如60s/5m/1h/1d，不填则永久禁言。',
          );
          return;
        }
        const match = timeStr.match(/^(\d+)(s|m|h|d)?$/);
        if (match && match[1]) {
          const value = parseInt(match[1], 10);
          const unit = match[2] || 's';

          switch (unit) {
            case 's':
              durationSeconds = value;
              break;
            case 'm':
              durationSeconds = value * 60;
              break;
            case 'h':
              durationSeconds = value * 3600;
              break;
            case 'd':
              durationSeconds = value * 86400;
              break;
            default:
              durationSeconds = value;
          }
        } else {
          await msg.replyText('时间格式错误！请使用如60s/5m/1h/1d的格式。');
          return;
        }
      }

      const manager = getBanManager(msg);
      await manager.muteUser(msg, user, durationSeconds);
    },
    unmute: async (msg: MessageContext) => {
      const user = await getTargetUserId(msg);
      if (!user) return;

      const manager = getBanManager(msg);
      await manager.unmuteUser(msg, user);
    },
    sb: async (msg: MessageContext) => {
      const user = await getTargetUserId(msg);
      if (!user) return;

      const manager = getBanManager(msg);
      await manager.banUserInAllAdminChats(msg, user);
    },
    unsb: async (msg: MessageContext) => {
      const user = await getTargetUserId(msg);
      if (!user) return;

      const manager = getBanManager(msg);
      await manager.unbanUserInAllAdminChats(msg, user);
    },
    refreshAban: async (msg: MessageContext) => {
      const manager = getBanManager(msg);
      await manager.refreshAdminDialogs(msg);
    },
  };
}
