import { MessageContext } from '@mtcute/dispatcher';

export type PluginName = string;

type PluginDescription =
  | string
  | (() => string | void)
  | (() => Promise<string | void>);

export type PluginCommandHandleFunction = (
  msg: MessageContext,
  trigger?: MessageContext,
) => Promise<void>;

type PluginCommandHandlers = Record<string, PluginCommandHandleFunction>;

export abstract class PluginCore {
  abstract pluginName: PluginName;
  abstract pluginDescription: PluginDescription;
  abstract pluginCommandHandlers: PluginCommandHandlers;
}
