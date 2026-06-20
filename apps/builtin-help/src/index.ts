import { PluginCore } from '@fxxkbxxd/plugin-core';
import { MessageContext } from '@mtcute/dispatcher';
import { md } from '@mtcute/markdown-parser';

class BuiltinHelp extends PluginCore {
  private plugins: Map<string, PluginCore> = new Map();

  constructor(plugins: Map<string, PluginCore>) {
    super();
    this.plugins = plugins;
  }

  pluginName = 'help';
  pluginDescription = '显示可用插件列表';
  pluginCommandHandlers = {
    help: async (msg: MessageContext) => {
      let command = msg.text.trim();
      let args = command.split(/\s+/);
      if (args.length > 1) {
        const pluginName = args[1];
        if (!pluginName) {
          msg.replyText(md('请提供插件名称。'));
          return;
        }
        const plugin = this.plugins.get(pluginName);
        if (plugin) {
          msg.replyText(
            md(`**${plugin.pluginName}**: kkkkk ${plugin.pluginDescription}`),
          );
        } else {
          msg.replyText(md(`插件 **${pluginName}** 不存在。`));
        }
        return;
      }
      let text = 'Available plugins:\n';
      for (const plugin of this.plugins.values()) {
        text += `- **${plugin.pluginName}**: ${plugin.pluginDescription}\n`;
      }
      msg.replyText(md(text));
    },
  };
}

export { BuiltinHelp };
