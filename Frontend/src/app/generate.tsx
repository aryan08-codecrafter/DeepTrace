
import { StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import { useEffect } from 'react';
import { router } from 'expo-router';

export default function GenerateScreen() {

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace('/success');
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>

      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#6EA8FE" />
      </View>

      <Text style={styles.step}>STEP 3 OF 3</Text>

      <Text style={styles.title}>
        Generating your proof
      </Text>

      <Text style={styles.description}>
        Creating a Zero-Knowledge Proof that confirms you are 18 or older.
      </Text>

      <View style={styles.card}>

        <View style={styles.row}>
          <Text style={styles.check}>✓</Text>
          <Text style={styles.item}>Identity information secured</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.check}>✓</Text>
          <Text style={styles.item}>Age requirement confirmed</Text>
        </View>

        <View style={styles.row}>
          <ActivityIndicator size="small" color="#6EA8FE" />
          <Text style={styles.item}>Generating cryptographic proof...</Text>
        </View>

      </View>

      <Text style={styles.footer}>
        Your date of birth is never included in the proof.
      </Text>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080B14',
    paddingHorizontal: 28,
    paddingTop: 100,
    alignItems: 'center',
  },

  loaderContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#111626',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },

  step: {
    color: '#6EA8FE',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 18,
  },

  title: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 14,
  },

  description: {
    color: '#9AA4B8',
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 32,
  },

  card: {
    width: '100%',
    backgroundColor: '#111626',
    borderRadius: 20,
    padding: 20,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },

  check: {
    color: '#5FE0A0',
    fontSize: 18,
    fontWeight: '700',
    width: 28,
  },

  item: {
    color: '#FFFFFF',
    fontSize: 14,
    marginLeft: 4,
    flex: 1,
  },

  footer: {
    color: '#555E70',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 30,
  },
});

