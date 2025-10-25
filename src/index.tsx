import { Plugin, registerPlugin } from 'enmity/managers/plugins';
import { getByName } from 'enmity/metro';
import { create } from 'enmity/patcher';
import manifest from '../manifest.json';

import { findInReactTree } from 'enmity/utilities';
import { Navigation, React, Token } from 'enmity/metro/common';
import { View } from 'enmity/components';

const Welcome = getByName('Welcome', { default: false });
import { DiscordButton } from './utils';
import TokenLogin from './components/TokenLogin';

const Patcher = create('account-switcher');

const AccountSwitcher: Plugin = {
   ...manifest,

   onStart() {
      const unpatchView = Patcher.before(View, 'render', (_ctx, [props], _res) => {
         const welcomeView: any = findInReactTree(props, r => r?.type?.name === 'Welcome');
         if (!welcomeView) return;
         welcomeView.type = () => (
            <TokenLogin
               settings={(window as any).enmity.settings.makeStore('token-login')}
               onLoginSuccess={() => (window as any).enmity.native.reload()}
            />
         );
         unpatchView();
      });
   },

   onStop() {
      Patcher.unpatchAll();
   },

   getSettingsPanel() {
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
   }
};

registerPlugin(AccountSwitcher);
