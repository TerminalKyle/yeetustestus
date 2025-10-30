import { Plugin, registerPlugin } from 'enmity/managers/plugins';
import { Command, ApplicationCommandOptionType, ApplicationCommandType, ApplicationCommandInputType } from 'enmity/api/commands';
import { AccountUtils, fetchUser } from './utils';
import { sendReply } from 'enmity/api/clyde';
import { Token } from 'enmity/metro/common';
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

                  // Set token using Token module
                  try {
                     // Use the proper Token.setToken method
                     if (Token && Token.setToken) {
                        Token.setToken(token);
                        // Initialize the token to ensure it's properly loaded
                        if (Token.init) {
                           Token.init();
                        }
                     } else {
                        // Fallback to AccountUtils
                        if (AccountUtils && AccountUtils.loginToken) {
                           AccountUtils.loginToken(token);
                        }
                     }
                  } catch (tokenError) {
                     sendReply(message?.channel?.id || '', '⚠️ Token set but error.');
                  }

                  sendReply(message?.channel?.id || '', `✅ Successfully logged in as **${user.username}#${user.discriminator}**! Reloading...`);
                  
                  // Wait a bit longer to ensure token is properly set before reload
                  setTimeout(() => {
                     (window as any).enmity.native.reload();
                  }, 3000);
                  
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