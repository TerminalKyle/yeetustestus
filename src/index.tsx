import { Plugin, registerPlugin } from 'enmity/managers/plugins';
import { Command, ApplicationCommandOptionType, ApplicationCommandType, ApplicationCommandInputType } from 'enmity/api/commands';
import { AccountUtils, fetchUser } from './utils';
import { sendReply } from 'enmity/api/clyde';
import manifest from '../manifest.json';

const TokenLogin: Plugin = {
   ...manifest,

   commands: [],

   onStart() {
      const tokenCommand: Command = {
         id: 'token-login-command',
         name: 'token',
         displayName: 'token',
         description: 'Login to Discord using a token',
         displayDescription: 'Login to Discord using a token',
         type: ApplicationCommandType.Chat,
         inputType: ApplicationCommandInputType.BuiltInText,
         options: [
            {
               name: 'token',
               displayName: 'token',
               description: 'Your Discord token',
               displayDescription: 'Your Discord token',
               required: true,
               type: ApplicationCommandOptionType.String
            }
         ],
         execute: async function(args: any[], message: any): Promise<any> {
            try {
               const token = args[0]?.value;
               
               if (!token) {
                  sendReply(message?.channel?.id || '', '❌ Please provide a token.');
                  return { send: false };
               }

               sendReply(message?.channel?.id || '', '⏳ Validating token...');

               try {
                  const user = await fetchUser(token);
                  
                  if (!user.id) {
                     sendReply(message?.channel?.id || '', '❌ Invalid token. Please check your token and try again.');
                     return { send: false };
                  }

                  // Save token and user info
                  const settings = (window as any).enmity.settings.makeStore('token-login');
                  settings.set('saved_token', token);
                  settings.set('user_info', user);

                  // Login with token
                  AccountUtils.loginToken(token);

                  sendReply(message?.channel?.id || '', `✅ Successfully logged in as **${user.username}#${user.discriminator}**! Reloading...`);
                  
                  // Reload Discord
                  setTimeout(() => {
                     (window as any).enmity.native.reload();
                  }, 1500);
                  
                  return { send: false };
               } catch (err) {
                  sendReply(message?.channel?.id || '', '❌ Failed to validate token. Please check your token and try again.');
                  return { send: false };
               }
            } catch (err) {
               return { send: false };
            }
         }
      };

      this.commands.push(tokenCommand);
   },

   onStop() {
      this.commands = [];
   }
};

registerPlugin(TokenLogin);