
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { router } from 'expo-router';

export default function HomeScreen() {
  return (
    <View style={styles.container}>

      <View style={styles.iconContainer}>
        <Text style={styles.icon}>🔐</Text>
      </View>

      <Text style={styles.title}>AGEVERIFY</Text>

      <Text style={styles.heading}>
        Prove your age.{'\n'}
        Keep your identity private.
      </Text>

      <Text style={styles.description}>
        Verify that you're 18+ without revealing your date of birth.
      </Text>

      <Pressable
        style={styles.button}
        onPress={() => router.push('/identity')}
      >
        <Text style={styles.buttonText}>Get Started</Text>
        <Text style={styles.arrow}>→</Text>
      </Pressable>

      <View style={styles.security}>
        <Text style={styles.securityIcon}>✓</Text>
        <Text style={styles.securityText}>
          Privacy-first verification
        </Text>
      </View>

      <Text style={styles.zkp}>
        Powered by Zero-Knowledge Proofs
      </Text>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080B14',
    paddingHorizontal: 28,
    justifyContent: 'center',
  },

  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: '#151B2E',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 28,
  },

  icon: {
    fontSize: 36,
  },

  title: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 3,
    color: '#6EA8FE',
    marginBottom: 24,
  },

  heading: {
    fontSize: 38,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 46,
    marginBottom: 18,
  },

  description: {
    fontSize: 17,
    color: '#9AA4B8',
    lineHeight: 26,
    marginBottom: 42,
  },

  button: {
    height: 58,
    borderRadius: 18,
    backgroundColor: '#3D7EFF',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },

  buttonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },

  arrow: {
    color: '#FFFFFF',
    fontSize: 22,
    marginLeft: 12,
  },

  security: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 28,
  },

  securityIcon: {
    color: '#5FE0A0',
    fontSize: 16,
    fontWeight: '700',
    marginRight: 8,
  },

  securityText: {
    color: '#8D97AA',
    fontSize: 14,
  },

  zkp: {
    position: 'absolute',
    bottom: 35,
    alignSelf: 'center',
    color: '#555E70',
    fontSize: 12,
  },
});

