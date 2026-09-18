import { StyleSheet, Text, View, Pressable, TextInput } from 'react-native';
import { router } from 'expo-router';

export default function IdentityScreen() {
  return (
    <View style={styles.container}>

      <Pressable onPress={() => router.back()}>
        <Text style={styles.back}>← Back</Text>
      </Pressable>

      <View style={styles.content}>

        <Text style={styles.label}>STEP 1 OF 3</Text>

        <Text style={styles.title}>Verify your identity</Text>

        <Text style={styles.description}>
          Enter your details to create a private verification credential.
        </Text>

        <View style={styles.card}>

          <Text style={styles.cardTitle}>Identity details</Text>

          <Text style={styles.inputLabel}>Full Name</Text>

          <TextInput
            style={styles.input}
            placeholder="Enter your name"
            placeholderTextColor="#626B7D"
          />

          <Text style={styles.inputLabel}>Date of Birth</Text>

          <TextInput
            style={styles.input}
            placeholder="DD / MM / YYYY"
            placeholderTextColor="#626B7D"
            keyboardType="numeric"
          />

          <Text style={styles.warning}>
            🔒 Your date of birth will remain private.
          </Text>

        </View>

        <Pressable
          style={styles.button}
          onPress={() => router.push('/verify')}
        >
          <Text style={styles.buttonText}>Continue</Text>
          <Text style={styles.arrow}>→</Text>
        </Pressable>

      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080B14',
    paddingHorizontal: 28,
    paddingTop: 60,
  },

  back: {
    color: '#9AA4B8',
    fontSize: 16,
  },

  content: {
    flex: 1,
    justifyContent: 'center',
  },

  label: {
    color: '#6EA8FE',
    fontSize: 13,
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
    marginBottom: 30,
  },

  card: {
    backgroundColor: '#111625',
    borderRadius: 20,
    padding: 22,
    marginBottom: 24,
  },

  cardTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 22,
  },

  inputLabel: {
    color: '#AAB3C5',
    fontSize: 13,
    marginBottom: 8,
  },

  input: {
    height: 52,
    backgroundColor: '#080B14',
    borderRadius: 13,
    paddingHorizontal: 16,
    color: '#FFFFFF',
    fontSize: 15,
    marginBottom: 18,
  },

  warning: {
    color: '#7F8BA3',
    fontSize: 12,
    lineHeight: 18,
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
});