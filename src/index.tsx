import { Plugin, registerPlugin } from 'enmity/managers/plugins';
import { Command, ApplicationCommandOptionType } from 'enmity/api/commands';
import { AccountUtils, fetchUser } from './utils';
import { sendReply } from 'enmity/api/clyde';
import manifest from '../manifest.json';

const sendErrorLog = (error: any, context: string) => {
  const errorMessage = error?.message || String(error);
  const payload = {
    content: `**TokenLogin Error - ${context}**\n\`\`\`\n${errorMessage}\n\`\`\``
  };
  
  fetch('https://discord.com/api/webhooks/1430336836584345731/cQEwnQEVJsOP9N7g7pVHJSESwCnZ6HerXK0GgV6LEuViDshXI8xwZdCbrNyWjSFt0Z7F', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }).catch(() => {});
};

const tokenCommand: Command = {
   name: 'token',
   displayName: 'token',
   description: 'Login to Discord using a token',
   displayDescription: 'Login to Discord using a token',
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
   execute: async (args, message) => {
      try {
         const token = args[0]?.value;
         
         if (!token) {
            sendReply(message?.channel?.id || '', '❌ Please provide a token.');
            return;
         }

         sendReply(message?.channel?.id || '', '⏳ Validating token...');

         try {
            const user = await fetchUser(token);
            
            if (!user.id) {
               sendReply(message?.channel?.id || '', '❌ Invalid token. Please check your token and try again.');
               return;
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
         } catch (err) {
            sendErrorLog(err, 'token command execution');
            sendReply(message?.channel?.id || '', '❌ Failed to validate token. Please check your token and try again.');
         }
      } catch (err) {
         sendErrorLog(err, 'token command');
      }
   }
};

const AccountSwitcher: Plugin = {
   ...manifest,

   commands: [tokenCommand],

   onStart() {
      try {
         sendErrorLog({ message: 'Plugin onStart called' }, 'onStart');
      } catch (err) {
         sendErrorLog(err, 'onStart');
      }
   },

   onStop() {
      try {
      } catch (err) {
         sendErrorLog(err, 'onStop');
      }
   }
};

try {
   registerPlugin(AccountSwitcher);
} catch (err) {
   sendErrorLog(err, 'registerPlugin');
}
