import { MessageContext } from '@mtcute/dispatcher';
import { Dialog, type Peer } from '@mtcute/node';

class BanManager {
  private adminDialogs: Dialog[] = [];

  constructor(msg: MessageContext) {
    this.loadAdminGroups(msg);
  }

  // 轮询获取我有管理员权限的对话列表
  private async loadAdminGroups(msg: MessageContext) {
    this.adminDialogs.length = 0; // 清空之前的管理员对话列表

    const iterDialogs = msg.client.iterDialogs();

    for await (const dialog of iterDialogs) {
      try {
        const member = await msg.client.getChatMember({
          chatId: dialog.peer,
          userId: 'self',
        });

        if (!member) continue;

        if (member.status === 'admin' || member.status === 'creator') {
          this.adminDialogs.push(dialog);
        }
      } catch (error) {
        // 这里可以忽略私聊、无法访问的对话等错误
        continue;
      }
    }

    console.log('我有管理员权限的 dialogs:', this.adminDialogs);
  }

  // 踢出用户
  private async kickUserFromChat(msg: MessageContext, chat: Peer, user: Peer) {
    await msg.client.kickChatMember({
      chatId: chat.id,
      userId: user,
    });
  }

  public async kickUser(msg: MessageContext, user: Peer) {
    try {
      await this.kickUserFromChat(msg, msg.chat, user);
    } catch (error) {
      await msg.edit({
        text: `踢出用户 ${user.displayName} ${user.id} 失败: ${error}`,
      });
    }
  }

  // 封禁用户
  private async banUserFromChat(msg: MessageContext, chat: Peer, user: Peer) {
    const client = msg.client;
    // 删除用户的聊天记录
    await client.deleteUserHistory({
      chatId: chat,
      participantId: user,
    });
    // 封禁用户
    await client.banChatMember({
      chatId: chat.id,
      participantId: user,
    });
  }

  public async banUser(msg: MessageContext, user: Peer) {
    try {
      await this.banUserFromChat(msg, msg.chat, user);
    } catch (error) {
      await msg.edit({
        text: `封禁用户 ${user.displayName} ${user.id} 失败: ${error}`,
      });
    }
  }

  // 解除封禁用户
  private async unbanUserFromChat(msg: MessageContext, chat: Peer, user: Peer) {
    await msg.client.unbanChatMember({
      chatId: chat.id,
      participantId: user,
    });
  }

  public async unbanUser(msg: MessageContext, user: Peer) {
    try {
      await this.unbanUserFromChat(msg, msg.chat, user);
    } catch (error) {
      await msg.edit({
        text: `解除封禁用户 ${user.displayName} ${user.id} 失败: ${error}`,
      });
    }
  }

  // 禁言用户
  private async muteUserInChat(
    msg: MessageContext,
    chat: Peer,
    user: Peer,
    untilDate: number,
  ) {
    await msg.client.restrictChatMember({
      chatId: chat,
      userId: user,
      restrictions: {
        sendMessages: false,
        sendMedia: false,
        sendStickers: false,
        sendGifs: false,
        sendGames: false,
        sendInline: false,
        sendPhotos: false,
        sendVideos: false,
        sendDocs: false,
        sendPlain: false,
      },
      until: new Date(untilDate * 1000),
    });
  }

  public async muteUser(
    msg: MessageContext,
    user: Peer,
    durationSeconds: number,
  ) {
    const untilDate = Math.floor(Date.now() / 1000) + durationSeconds;
    try {
      await this.muteUserInChat(msg, msg.chat, user, untilDate);
    } catch (error) {
      await msg.edit({
        text: `禁言用户 ${user.displayName} ${user.id} 失败: ${error}`,
      });
    }
  }

  // 解除禁言用户
  private async unmuteUserInChat(msg: MessageContext, chat: Peer, user: Peer) {
    await msg.client.restrictChatMember({
      chatId: chat,
      userId: user,
      restrictions: {
        sendMessages: true,
        sendMedia: true,
        sendStickers: true,
        sendGifs: true,
        sendGames: true,
        sendInline: true,
        sendPhotos: true,
        sendVideos: true,
        sendDocs: true,
        sendPlain: true,
      },
    });
  }

  public async unmuteUser(msg: MessageContext, user: Peer) {
    try {
      await this.unmuteUserInChat(msg, msg.chat, user);
    } catch (error) {
      await msg.edit({
        text: `解除禁言用户 ${user.displayName} ${user.id} 失败: ${error}`,
      });
    }
  }

  // 所有有管理员权限的对话中并发封禁用户，并返回结果汇总
  public async banUserInAllAdminChats(msg: MessageContext, user: Peer) {
    const total = this.adminDialogs.length;

    const results = await Promise.allSettled(
      this.adminDialogs.map(async (dialog) => {
        await this.banUserFromChat(msg, dialog.peer, user);
        return dialog;
      }),
    );

    const failedDialogs = results
      .map((result, index) => ({ result, dialog: this.adminDialogs[index] }))
      .filter(({ result }) => result.status === 'rejected')
      .map(({ dialog }) => dialog!.peer.displayName ?? `${dialog!.peer.id}`);

    const failedCount = failedDialogs.length;
    const summaryLines = [
      `总共${total}个群 ${failedCount}个封禁失败`,
      ...failedDialogs,
    ];
    const summary = summaryLines.join('\n');

    await msg.edit({ text: summary });
  }

  // 所有有管理员权限的对话中并发解除封禁用户，并返回结果汇总
  public async unbanUserInAllAdminChats(msg: MessageContext, user: Peer) {
    const total = this.adminDialogs.length;

    const results = await Promise.allSettled(
      this.adminDialogs.map(async (dialog) => {
        await this.unbanUserFromChat(msg, dialog.peer, user);
        return dialog;
      }),
    );

    const failedDialogs = results
      .map((result, index) => ({ result, dialog: this.adminDialogs[index] }))
      .filter(({ result }) => result.status === 'rejected')
      .map(({ dialog }) => dialog!.peer.displayName ?? `${dialog!.peer.id}`);

    const failedCount = failedDialogs.length;
    const summaryLines = [
      `总共${total}个群 ${failedCount}个解除封禁失败`,
      ...failedDialogs,
    ];
    const summary = summaryLines.join('\n');

    await msg.edit({ text: summary });
  }

  // 重新缓存管理员对话列表
  public async refreshAdminDialogs(msg: MessageContext) {
    await this.loadAdminGroups(msg);
    await msg.edit({ text: '管理员对话列表已刷新' });
  }
}

export { BanManager };
