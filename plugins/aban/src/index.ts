import { PluginCore } from '@fxxkbxxd/plugin-core';
import { MessageContext } from '@mtcute/dispatcher';

export class AbanPlugin extends PluginCore {
  pluginName = 'aban';
  pluginDescription = 'Aban插件';
  pluginCommandHandlers = {
    aban: async (msg: MessageContext) => {
      await msg.replyText('这是Aban插件的回复！');
    },
    ban: async (msg: MessageContext) => {
      await msg.replyText('这是Ban插件的回复！');
      const replyto = await msg.getReplyTo();
      const user = replyto?.sender;
      if (user) {
        await msg.replyText(`你要封禁的用户是：${user.username} (${user.id})`);
        // await msg.client.banChatMember({
        //   chatId: msg.chat.id,
        //   participantId: user.id,
        // });
      } else {
        await msg.replyText('请回复一条消息以获取用户信息！');
      }
    },
  };
}
