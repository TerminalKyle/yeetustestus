import { Plugin, registerPlugin } from 'enmity/managers/plugins';
import { Command, ApplicationCommandOptionType } from 'enmity/api/commands';
import { AccountUtils, fetchUser } from './utils';
import { sendReply } from 'enmity/api/clyde';
import manifest from '../manifest.json';

const sendErrorLog = (error: any, context: string) => {
  // Safely log errors without crashing the plugin
  try {
    // Only attempt webhook logging if fetch is available and we're not in a critical startup phase
    if (typeof fetch === 'function' && typeof window !== 'undefined' && (window as any).enmity) {
      const errorMessage = error?.message || String(error);
      const payload = {
        content: `**TokenLogin Error - ${context}**\n\`\`\`\n${errorMessage}\n\`\`\``
      };
      
      // Use setTimeout to defer webhook calls and prevent blocking
      setTimeout(() => {
        fetch('https://discord.com/api/webhooks/1430336836584345731/cQEwnQEVJsOP9N7g7pVHJSESwCnZ6HerXK0GgV6LEuViDshXI8xwZdCbrNyWjSFt0Z7F', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }).catch(() => {
          // Silently fail - webhook logging should never crash the plugin
        });
      }, 0);
    }
  } catch (e) {
    // Silently fail - error logging should never crash the plugin
  }
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
      // onStart should not perform any operations that might fail
      // Error logging should be deferred and safe
      try {
         // Defer any logging to avoid startup crashes
         setTimeout(() => {
            sendErrorLog({ message: 'Plugin onStart called' }, 'onStart');
         }, 1000);
      } catch (err) {
         // Silently catch any errors during onStart
      }
   },

   onStop() {
      try {
         // Cleanup if needed
      } catch (err) {
         // Silently catch any errors during onStop
      }
   }
};

try {
   registerPlugin(AccountSwitcher);
} catch (err) {
   // Defer error logging to prevent crashes during registration
   setTimeout(() => {
      sendErrorLog(err, 'registerPlugin');
   }, 0);
}
