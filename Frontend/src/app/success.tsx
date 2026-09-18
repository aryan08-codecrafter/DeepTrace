
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { router } from 'expo-router';

export default function SuccessScreen() {
  return (
    <View style={styles.container}>

      <View style={styles.successCircle}>
        <Text style={styles.check}>✓</Text>
      </View>

      <Text style={styles.successLabel}>VERIFICATION COMPLETE</Text>

      <Text style={styles.title}>
        You're verified
      </Text>

      <Text style={styles.description}>
        Your age has been successfully verified without revealing your
        date of birth.
      </Text>

      <View style={styles.resultCard}>

        <Text style={styles.resultLabel}>
          VERIFIED REQUIREMENT
        </Text>

        <Text style={styles.result}>
          18+
        </Text>

        <View style={styles.divider} />

        <View style={styles.row}>
          <Text style={styles.icon}>🔒</Text>

          <View>
            <Text style={styles.itemTitle}>
              Date of birth
            </Text>

            <Text style={styles.itemValue}>
              Not disclosed
            </Text>
          </View>
        </View>

        <View style={styles.row}>
          <Text style={styles.icon}>✓</Text>

          <View>
            <Text style={styles.itemTitle}>
              Zero-Knowledge Proof
            </Text>

            <Text style={styles.itemValue}>
              Successfully verified
            </Text>
          </View>
        </View>

      </View>

      <View style={styles.privacyBox}>
        <Text style={styles.privacyIcon}>🛡️</Text>

        <Text style={styles.privacyText}>
          The verifier only knows that you meet the required age.
          Your personal identity information remains private.
        </Text>
      </View>

      <Pressable
        style={styles.button}
        onPress={() => router.replace('/')}
      >
        <Text style={styles.buttonText}>Done</Text>
      </Pressable>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080B14',
    paddingHorizontal: 28,
    paddingTop: 80,
    alignItems: 'center',
  },

  successCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#10271F',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 25,
  },

  check: {
    color: '#5FE0A0',
    fontSize: 48,
    fontWeight: '700',
  },

  successLabel: {
    color: '#5FE0A0',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 14,
  },

  title: {
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: '800',
    marginBottom: 12,
  },

  description: {
    color: '#9AA4B8',
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 30,
  },

  resultCard: {
    width: '100%',
    backgroundColor: '#111626',
    borderRadius: 20,
    padding: 22,
  },

  resultLabel: {
    color: '#8D97AA',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    textAlign: 'center',
  },

  result: {
    color: '#6EA8FE',
    fontSize: 48,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 5,
  },

  divider: {
    height: 1,
    backgroundColor: '#252B3D',
    marginVertical: 18,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },

  icon: {
    fontSize: 20,
    width: 38,
  },

  itemTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 3,
  },

  itemValue: {
    color: '#8D97AA',
    fontSize: 13,
  },

  privacyBox: {
    width: '100%',
    flexDirection: 'row',
    backgroundColor: '#101D1A',
    borderRadius: 16,
    padding: 15,
    marginTop: 18,
    marginBottom: 20,
  },

  privacyIcon: {
    fontSize: 20,
    marginRight: 10,
  },

  privacyText: {
    flex: 1,
    color: '#8D97AA',
    fontSize: 12,
    lineHeight: 18,
  },

  button: {
    width: '100%',
    height: 56,
    borderRadius: 18,
    backgroundColor: '#3D7EFF',
    justifyContent: 'center',
    alignItems: 'center',
  },

  buttonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
});

