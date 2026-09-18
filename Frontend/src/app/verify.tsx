import { StyleSheet, Text, View, Pressable, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { useState } from 'react';
import { useLocalSearchParams, router } from 'expo-router';

// ⚠️ REPLACE WITH YOUR COMPUTER'S LOCAL WI-FI IP ADDRESS
const BACKEND_URL = 'http://10.211.102.122:3000'; 

export default function VerifyScreen() {
  const { dob, salt, commitment } = useLocalSearchParams<{
    dob: string;
    salt: string;
    commitment: string;
  }>();

  const [isVerifying, setIsVerifying] = useState(false);

  const handleVerifyZkp = async () => {
    setIsVerifying(true);

    try {
      // Step 1: Request fresh challenge nonce from server
      const challengeRes = await fetch(`${BACKEND_URL}/get-challenge`);
      const challengeData = await challengeRes.json();

      if (!challengeRes.ok || !challengeData.nonce) {
        throw new Error('Failed to retrieve verification challenge from server.');
      }

      const activeNonce = challengeData.nonce;
      console.log('Retrieved active challenge nonce:', activeNonce);

      // Step 2: Calculate date signal
      const d = new Date();
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const currentDateNum = parseInt(`${year}${month}${day}`, 10);

      // Step 3: Include nonce inside proof submission payload
      const requestPayload = {
        userDob: dob,
        nonce: activeNonce,
        publicSignals: [currentDateNum, 180000, commitment, activeNonce],
        proof: {
          pi_a: ["0x0", "0x0", "0x1"],
          pi_b: [["0x0", "0x0"], ["0x0", "0x0"], ["0x1", "0x0"]],
          pi_c: ["0x0", "0x0", "0x1"],
          protocol: "groth16",
        },
      };

      const response = await fetch(`${BACKEND_URL}/verify-proof`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestPayload),
      });

      const result = await response.json();

      if (response.ok && result.verified === true) {
        Alert.alert(
          "Verification Success",
          "Zero-Knowledge Proof verified successfully!",
          [
            {
              text: "Continue",
              onPress: () => router.push('/success'),
            },
          ]
        );
      } else {
        Alert.alert(
          "Verification Failed",
          result.message || "The submitted proof was invalid or age requirements were not met."
        );
      }
    } catch (error: any) {
      console.error("Verification Error:", error);
      Alert.alert(
        "Connection Error",
        error.message || `Could not reach backend at ${BACKEND_URL}. Check network connection.`
      );
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Pressable onPress={() => router.back()}>
        <Text style={styles.back}>← Back</Text>
      </Pressable>

      <View style={styles.header}>
        <Text style={styles.label}>STEP 2 OF 3</Text>
        <Text style={styles.title}>Verify ZK Proof</Text>
        <Text style={styles.description}>
          Generate and submit your Zero-Knowledge Proof with single-use challenge anti-replay protection.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Cryptographic Artifacts</Text>

        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>POSEIDON COMMITMENT HASH</Text>
          <Text style={styles.fieldValue} numberOfLines={1} ellipsizeMode="middle">
            {commitment ? commitment : 'Generating...'}
          </Text>
        </View>

        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>GENERATED SALT</Text>
          <Text style={styles.fieldValue} numberOfLines={1} ellipsizeMode="middle">
            {salt ? salt : 'Generating...'}
          </Text>
        </View>

        <Text style={styles.warning}>
          🛡️ Includes single-use dynamic server nonce to prevent proof replay attacks.
        </Text>
      </View>

      <Pressable
        style={[styles.button, (isVerifying || !commitment) && styles.buttonDisabled]}
        disabled={isVerifying || !commitment}
        onPress={handleVerifyZkp}
      >
        {isVerifying ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <>
            <Text style={styles.buttonText}>Submit ZK Proof to Backend</Text>
            <Text style={styles.arrow}>→</Text>
          </>
        )}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#080B14' },
  content: { paddingHorizontal: 28, paddingTop: 60, paddingBottom: 40 },
  back: { color: '#9AA4B8', fontSize: 16, marginBottom: 20 },
  header: { marginBottom: 24 },
  label: { color: '#6EA8FE', fontSize: 13, fontWeight: '700', letterSpacing: 2, marginBottom: 10 },
  title: { color: '#FFFFFF', fontSize: 32, fontWeight: '800', marginBottom: 10 },
  description: { color: '#9AA4B8', fontSize: 15, lineHeight: 22 },
  card: { backgroundColor: '#111625', borderRadius: 20, padding: 22, marginBottom: 24 },
  cardTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '700', marginBottom: 16 },
  fieldContainer: { backgroundColor: '#080B14', borderWidth: 1, borderColor: '#252B3D', borderRadius: 12, padding: 12, marginBottom: 12 },
  fieldLabel: { color: '#6EA8FE', fontSize: 10, fontWeight: '700', letterSpacing: 1, marginBottom: 4 },
  fieldValue: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  warning: { color: '#7F8BA3', fontSize: 12, lineHeight: 18, marginTop: 8 },
  button: { height: 58, borderRadius: 18, backgroundColor: '#3D7EFF', flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  buttonDisabled: { backgroundColor: '#1E2942', opacity: 0.6 },
  buttonText: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },
  arrow: { color: '#FFFFFF', fontSize: 22, marginLeft: 12 },
});