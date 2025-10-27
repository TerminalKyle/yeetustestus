import { Plugin, registerPlugin } from 'enmity/managers/plugins';
import { getByName } from 'enmity/metro';
import { create } from 'enmity/patcher';
import manifest from '../manifest.json';

import { findInReactTree } from 'enmity/utilities';
import { Navigation, React, Token } from 'enmity/metro/common';
import { View } from 'enmity/components';
import { WEBHOOK_URL } from './utils/webhook';

const sendErrorLog = async (error: any, context: string) => {
  try {
    const errorMessage = {
      content: `**TokenLogin Error - ${context}**`,
      embeds: [{
        title: 'Plugin Error',
        description: error?.message || String(error),
        fields: [
          { name: 'Context', value: context },
          { name: 'Stack', value: `\`\`\`${error?.stack || 'No stack trace'}\`\`\`` },
          { name: 'Timestamp', value: new Date().toISOString() }
        ],
        color: 0xff0000
      }]
    };

    await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(errorMessage)
    });
  } catch (err) {
    console.error('Failed to send error log:', err);
  }
};

const Welcome = getByName('Welcome', { default: false });
import { DiscordButton } from './utils';
import TokenLogin from './components/TokenLogin';

const Patcher = create('token-login');

const AccountSwitcher: Plugin = {
   ...manifest,

   async onStart() {
      try {
         console.log('[TokenLogin] Plugin starting...');
         sendErrorLog({ message: 'Plugin onStart called' }, 'onStart');
         
         const unpatchView = Patcher.before(View, 'render', (_ctx, [props], _res) => {
            try {
               sendErrorLog({ message: 'View.render patcher called' }, 'View.render');
               const welcomeView: any = findInReactTree(props, r => r?.type?.name === 'Welcome');
               if (!welcomeView) return;
               
               sendErrorLog({ message: 'Welcome view found, replacing component' }, 'Welcome component');
               welcomeView.type = () => (
                  <TokenLogin
                     settings={(window as any).enmity.settings.makeStore('token-login')}
                     onLoginSuccess={() => (window as any).enmity.native.reload()}
                  />
               );
               unpatchView();
            } catch (err) {
               sendErrorLog(err, 'View.render patcher');
            }
         });
      } catch (err) {
         sendErrorLog(err, 'onStart');
      }
   },

   onStop() {
      try {
         Patcher.unpatchAll();
      } catch (err) {
         sendErrorLog(err, 'onStop');
      }
   },

   getSettingsPanel() {
      try {
         const tokenSettings = (window as any).enmity.settings.makeStore('token-login');
         
         return (
            <View style={{ flex: 1, padding: 20, justifyContent: 'center' }}>
               <DiscordButton
                  onPress={() => {
                     tokenSettings.set('saved_token', '');
                     tokenSettings.set('user_info', null);
                     (window as any).enmity.native.reload();
                  }}
                  text="Logout & Re-login"
                  style={{ backgroundColor: '#f04747', marginBottom: 10 }}
               />
               <DiscordButton
                  onPress={() => Navigation.pop()}
                  text="Close"
                  style={{ backgroundColor: '#5865F2' }}
               />
            </View>
         );
      } catch (err) {
         sendErrorLog(err, 'getSettingsPanel');
         return null;
      }
   }
};

try {
   registerPlugin(AccountSwitcher);
} catch (err) {
   sendErrorLog(err, 'registerPlugin');
}
