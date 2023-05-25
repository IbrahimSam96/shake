import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { Audio } from 'expo-av'
import { useEffect, useState } from 'react';
import { Button } from 'react-native';
import { Pressable } from 'react-native';



const styles = StyleSheet.create({
  container: {
    backgroundColor: 'purple',
    flex: '1',
    justifyContent: 'center'
  },
});


export default function App() {

  const [recording, setRecording] = useState();

  const startRecording = async () => {

    try {
      console.log('');
      await Audio.requestPermissionsAsync();

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const recording = new Audio.Recording();
      console.log('Starting recording..');
      recording.prepareToRecordAsync(Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY);

      await recording.startAsync();
      setRecording(recording);

      console.log('Recording started');

    } catch {

    } finally {

    }
  }

  async function stopRecording() {
    console.log('Stopping recording..');
    setRecording(undefined);
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    console.log('Recording stopped and stored at', uri);
  }

  useEffect(() => {

  }, []);



  return (
    <View style={styles.container}>

      <Pressable style={{ padding: 15, margin: 20, backgroundColor: 'white', }} onPress={recording ? stopRecording : startRecording}>
        <Text style={{ alignSelf: 'center' }} >
          {recording ? 'Stop Recording' : 'Start Recording'}
        </Text>
      </Pressable>
    </View>
  );
}


