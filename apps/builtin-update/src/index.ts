import { PluginCore } from '@fxxkbxxd/plugin-core';
import { exec } from 'child_process';
import { promisify } from 'util';
import { MessageContext } from '@mtcute/dispatcher';

const execAsync = promisify(exec);

/**
 * 自动更新项目：拉取 Git 更新 + 安装依赖
 * @param force 是否强制重置为远程 master（丢弃本地改动）
 */
async function update(force = false, msg: MessageContext) {
  await msg.edit({ text: '🚀 正在更新项目...' });
  console.clear();
  console.log('🚀 开始更新项目...\n');

  try {
    await execAsync('git fetch --all');
    await msg.edit({ text: '🔄 正在拉取最新代码...' });

    if (force) {
      console.log('⚠️ 强制回滚到 origin/main...');
      await execAsync('git reset --hard origin/main');
      await msg.edit({ text: '🔄 强制更新中...' });
    }

    await execAsync('git pull');
    await msg.edit({ text: '🔄 正在合并最新代码...' });

    console.log('\n📦 安装依赖...');
    await execAsync('pnpm install');
    await msg.edit({ text: '📦 正在安装依赖...' });

    console.log('\n✅ 更新完成。');
    await msg.edit({ text: '✅ 更新完成！' });
    console.log('🚀 重新启动项目...');
    await execAsync('pnpm start');
  } catch (error: any) {
    console.error('❌ 更新失败:', error);
    await msg.edit({
      text:
        `❌ 更新失败\n失败命令行：${error.cmd}\n失败原因：${error.stderr}\n\n` +
        '如果是 Git 冲突，请手动解决后再更新，或使用 .update -f 强制更新（会丢弃本地改动）',
    });
  }
}

class BuiltinUpdate extends PluginCore {
  pluginName = 'update';
  pluginDescription = '使用 git pull 来更新 fxxkbxxd';
  pluginCommandHandlers = {
    update: async (msg: MessageContext) => {
      const args = msg.text.slice(1).split(' ').slice(1);
      const force = args.includes('--force') || args.includes('-f');
      await update(force, msg);
    },
  };
}

export { BuiltinUpdate };
