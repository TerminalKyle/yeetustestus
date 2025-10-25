import { React, Navigation, StyleSheet, Constants, Locale } from 'enmity/metro/common';
import { FormInput, View, Text, ScrollView } from 'enmity/components';
import { connectComponent } from 'enmity/api/settings';
import { DiscordButton } from '../utils';
import { AccountUtils, fetchUser, showConfirmDialog } from '../utils';

const { createThemedStyleSheet } = StyleSheet;

interface TokenLoginProps {
  settings: any;
  onLoginSuccess: () => void;
}

function TokenLoginComponent({ settings, onLoginSuccess }: TokenLoginProps) {
  const [token, setToken] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  const styles = createThemedStyleSheet({
    container: {
      flex: 1,
      backgroundColor: Constants.ThemeColorMap.BACKGROUND_MOBILE_PRIMARY,
      padding: 20,
      justifyContent: 'center',
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      color: Constants.ThemeColorMap.HEADER_PRIMARY,
      textAlign: 'center',
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      color: Constants.ThemeColorMap.TEXT_MUTED,
      textAlign: 'center',
      marginBottom: 32,
    },
    inputContainer: {
      marginBottom: 20,
    },
    errorText: {
      color: Constants.ThemeColorMap.STATUS_DANGER,
      fontSize: 14,
      textAlign: 'center',
      marginTop: 8,
    },
    infoText: {
      color: Constants.ThemeColorMap.TEXT_MUTED,
      fontSize: 14,
      textAlign: 'center',
      marginTop: 16,
      lineHeight: 20,
    },
    buttonContainer: {
      marginTop: 20,
    },
  });

  const handleLogin = async () => {
    if (!token.trim()) {
      setError('Please enter a Discord token');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const user = await fetchUser(token);
      
      if (!user.id) {
        setError('Invalid token. Please check your token and try again.');
        setIsLoading(false);
        return;
      }

      settings.set('saved_token', token);
      settings.set('user_info', user);
      AccountUtils.loginToken(token);
      onLoginSuccess();
    } catch (err) {
      setError('Failed to validate token. Please check your token and try again.');
      console.error('Token validation error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    showConfirmDialog({
      title: 'Logout',
      body: 'Are you sure you want to logout? You will need to enter your token again.',
      confirmColor: 'red',
      confirmText: 'Logout',
      onConfirm: () => {
        settings.set('saved_token', '');
        settings.set('user_info', null);
        AccountUtils.logout();
        setToken('');
        setError('');
      }
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
      <View>
        <Text style={styles.title}>Discord Token Login</Text>
        <Text style={styles.subtitle}>Enter your Discord token to continue</Text>
        
        <View style={styles.inputContainer}>
          <FormInput
            value={token}
            onChange={setToken}
            title="Discord Token"
            placeholder="Enter your Discord token here..."
            secureTextEntry={true}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </View>

        <View style={styles.buttonContainer}>
          <DiscordButton
            onPress={handleLogin}
            text={isLoading ? "Logging in..." : "Login"}
            style={{
              backgroundColor: isLoading ? '#666' : '#5865F2',
              opacity: isLoading ? 0.7 : 1,
            }}
            disabled={isLoading}
          />
        </View>

        <Text style={styles.infoText}>
          Enter your Discord token to login. You will need to re-enter it each time Discord starts.
        </Text>
      </View>
    </ScrollView>
  );
}

export default connectComponent(TokenLoginComponent, 'token-login');
