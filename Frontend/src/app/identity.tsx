import { StyleSheet, Text, View, Pressable, Image, ScrollView, Alert, ActivityIndicator, TextInput } from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';

// ⚠️ REPLACE WITH YOUR COMPUTER'S LOCAL WI-FI IP ADDRESS
const BACKEND_URL = 'http://10.211.102.122:3000'; 

export default function IdentityScreen() {
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isIssuing, setIsIssuing] = useState(false);
  const [dob, setDob] = useState<string>('');
  const [parsingSuccess, setParsingSuccess] = useState(false);

  const handlePickDocument = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert('Permission Denied', 'Permission to access photo gallery is required.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets[0]) {
      const asset = result.assets[0];
      setSelectedImageUri(asset.uri);
      
      // Instant transition to manual confirmation mode for local testing
      setIsProcessing(false);
      setParsingSuccess(true);
    }
  };

  // 🔗 Connection to Node Backend: Generates Poseidon Commitment
  const handleContinue = async () => {
    if (!dob) {
      Alert.alert('Missing Date', 'Please enter a valid Date of Birth (DD/MM/YYYY).');
      return;
    }

    setIsIssuing(true);
    console.log("1. Starting handleContinue with DOB input:", dob);

    try {
      // Parse DD/MM/YYYY or DDMMYYYY into YYYYMMDD integer
      const numericDigits = dob.replace(/[^0-9]/g, '');
      let cleanDob = 0;

      if (numericDigits.length === 8) {
        const prefix = parseInt(numericDigits.substring(0, 4), 10);
        if (prefix > 1900 && prefix < 2100) {
          cleanDob = parseInt(numericDigits, 10); // YYYYMMDD
        } else {
          const dd = numericDigits.substring(0, 2);
          const mm = numericDigits.substring(2, 4);
          const yyyy = numericDigits.substring(4, 8);
          cleanDob = parseInt(`${yyyy}${mm}${dd}`, 10);
        }
      } else {
        cleanDob = parseInt(numericDigits, 10);
      }

      console.log("2. Sending request to:", `${BACKEND_URL}/issue-credential`, "Payload:", { dob: cleanDob });

      // Timeout controller to prevent hanging if IP is unreachable
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

      const response = await fetch(`${BACKEND_URL}/issue-credential`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dob: cleanDob }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      console.log("3. Server response status:", response.status);

      const data = await response.json();
      console.log("4. Server response data:", data);

      if (response.ok && data.commitment) {
        router.push({
          pathname: '/verify',
          params: {
            dob: cleanDob,
            salt: data.salt,
            commitment: data.commitment,
          },
        });
      } else {
        Alert.alert('Backend Error', data.error || 'Failed to issue credential commitment.');
      }
    } catch (error: any) {
      console.error('5. Network / Fetch Error:', error);
      if (error.name === 'AbortError') {
        Alert.alert(
          'Request Timeout',
          `Could not connect to ${BACKEND_URL} within 8 seconds. Verify your PC and phone are on the same Wi-Fi.`
        );
      } else {
        Alert.alert(
          'Connection Failed',
          `Unable to reach backend at ${BACKEND_URL}. Check network connection and firewall settings.`
        );
      }
    } finally {
      setIsIssuing(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Pressable onPress={() => router.back()}>
        <Text style={styles.back}>← Back</Text>
      </Pressable>

      <View style={styles.header}>
        <Text style={styles.label}>STEP 1 OF 3</Text>
        <Text style={styles.title}>Scan Identity Document</Text>
        <Text style={styles.description}>
          Select your document image and verify your extracted details.
        </Text>
      </View>

      {/* Upload Zone */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Identity Document</Text>

        <Pressable style={styles.uploadBox} onPress={handlePickDocument}>
          {selectedImageUri ? (
            <View style={styles.previewContainer}>
              <Image source={{ uri: selectedImageUri }} style={styles.imagePreview} />
              <Text style={styles.changeText}>Tap to choose a different photo</Text>
            </View>
          ) : (
            <View style={styles.uploadPlaceholder}>
              <Text style={styles.uploadIcon}>🪪</Text>
              <Text style={styles.uploadTitle}>Choose Photo from Device</Text>
              <Text style={styles.uploadSubtitle}>Supports JPG, PNG (Front side)</Text>
            </View>
          )}
        </Pressable>

        {/* Extracted Details & Manual Editing */}
        {parsingSuccess && (
          <View style={styles.extractedBox}>
            <Text style={styles.extractedBoxTitle}>Confirm Extracted Information</Text>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Date of Birth (DD/MM/YYYY)</Text>
              <TextInput
                style={styles.textInput}
                value={dob}
                onChangeText={setDob}
                placeholder="01/01/2000"
                placeholderTextColor="#626B7D"
                keyboardType="numeric"
                maxLength={10}
              />
            </View>
          </View>
        )}

        <Text style={styles.warning}>
          🔒 Extracted credentials are converted to cryptographic commitment hashes and are never stored.
        </Text>
      </View>

      <Pressable
        style={[styles.button, (!selectedImageUri || !dob || isIssuing) && styles.buttonDisabled]}
        disabled={!selectedImageUri || !dob || isIssuing}
        onPress={handleContinue}
      >
        {isIssuing ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <>
            <Text style={styles.buttonText}>Continue to Verification</Text>
            <Text style={styles.arrow}>→</Text>
          </>
        )}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080B14',
  },
  content: {
    paddingHorizontal: 28,
    paddingTop: 60,
    paddingBottom: 40,
  },
  back: {
    color: '#9AA4B8',
    fontSize: 16,
    marginBottom: 20,
  },
  header: {
    marginBottom: 24,
  },
  label: {
    color: '#6EA8FE',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 10,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 10,
  },
  description: {
    color: '#9AA4B8',
    fontSize: 15,
    lineHeight: 22,
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
    marginBottom: 16,
  },
  uploadBox: {
    borderWidth: 2,
    borderColor: '#252B3D',
    borderStyle: 'dashed',
    borderRadius: 16,
    backgroundColor: '#080B14',
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  uploadPlaceholder: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  uploadIcon: {
    fontSize: 40,
    marginBottom: 10,
  },
  uploadTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
  },
  uploadSubtitle: {
    color: '#626B7D',
    fontSize: 12,
    textAlign: 'center',
  },
  previewContainer: {
    alignItems: 'center',
    width: '100%',
  },
  imagePreview: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    marginBottom: 10,
    resizeMode: 'contain',
  },
  changeText: {
    color: '#6EA8FE',
    fontSize: 12,
    fontWeight: '600',
  },
  extractedBox: {
    backgroundColor: '#161C2E',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  extractedBoxTitle: {
    color: '#8D97AA',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 10,
  },
  inputContainer: {
    width: '100%',
  },
  inputLabel: {
    color: '#6EA8FE',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: '#080B14',
    borderColor: '#252B3D',
    borderWidth: 1,
    borderRadius: 10,
    color: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    fontWeight: '600',
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
  buttonDisabled: {
    backgroundColor: '#1E2942',
    opacity: 0.6,
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