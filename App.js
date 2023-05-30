import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Audio } from 'expo-av'
import { useEffect, useState } from 'react';
import * as FileSystem from 'expo-file-system';
import { moveAsync } from 'expo-file-system';

import { FontAwesome } from '@expo/vector-icons';

import { OPENAI_API_KEY } from '@env'

import axios from 'axios';

export default function App() {

  const [recording, setRecording] = useState(null);
  const [recordingStatus, setRecordingStatus] = useState('idle');
  const [audioPermission, setAudiPermission] = useState(null);

  // Checks on first render - Audi permission and cleans up active recording;  
  useEffect(() => {
    const audioCheck = async () => {
      await Audio.getPermissionsAsync().then((res) => {
        console.log(res.granted)
        setAudiPermission(res.granted);
      }).catch((err) => {
        console.log(err)
      })
    }

    audioCheck();

    return () => {
      if (recording) {
        stopRecording();
      }
    }

  }, []);


  async function startRecording() {
    try {
      // needed for IoS
      if (audioPermission) {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true
        })
      }
      Audio.IOSOutputFormat
      const newRecording = new Audio.Recording();

      const recordingOptions = {
        ios: {
          extension: '.mp4', // Specify the audio file extension,
          audioQuality: Audio.RECORDING_OPTION_IOS_AUDIO_QUALITY_HIGH, // Specify the audio quality
        },
        android: {
          extension: '.mp4', // Specify the audio file extension,
        }
      }
      console.log('Starting Recording')
      await newRecording.prepareToRecordAsync(
        recordingOptions
      );

      await newRecording.startAsync();
      setRecording(newRecording);
      setRecordingStatus('recording');

    } catch (error) {
      console.error('Failed to start recording', error);
    }
  }

  async function stopRecording() {
    try {
      if (recordingStatus == 'recording') {
        console.log('Stopping recording..');
        await recording.stopAndUnloadAsync();
        const recordingUri = recording.getURI();
        console.log('Recording stopped and stored at URI', recordingUri);

        // Calls openai translations endpoint
        try {
          const url = 'https://api.openai.com/v1/audio/transcriptions';
          const headers = {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'multipart/form-data',
          };

          const formData = new FormData();
          FileSystem.readAsStringAsync(recordingUri, { encoding: FileSystem.EncodingType.Base64 })
            .then(content => {
              formData.append('file', content);
              // console.log('File content:', content);
            })
            .catch(error => {
              console.error('Error reading file:', error);
            });

          formData.append('model', 'whisper-1');

          axios.post(url, formData, { headers })
            .then(response => {
              console.log('Transcription response:', response.data);
            })
            .catch(error => {
              console.error('Error:', error);
            });



        } catch (error) {
          console.error(error);
        }

        // Create a file name for the new MP4 recording
        const fileName = `recording-${Date.now()}.mp4`;

        // Move the recording to the new directory with the new file name
        // await FileSystem.makeDirectoryAsync(FileSystem.documentDirectory + 'recordings/', { intermediates: true });
        // await FileSystem.moveAsync({
        //   from: recordingUri,
        //   to: FileSystem.documentDirectory + 'recordings/' + `${fileName}`
        // });

        // TODO: IF USER WANTS AUTOMATIC PLAYBACK .  
        // This is for simply playing the sound back
        // const playbackObject = new Audio.Sound();
        // await playbackObject.loadAsync({ uri: FileSystem.documentDirectory + 'recordings/' + `${fileName}` });
        // await playbackObject.playAsync();
        // ('Playing Recording')

        // resert our states to record again
        setRecording(null);
        setRecordingStatus('idle');

      }
    }
    catch (error) {
      console.error('Failed to stop recording', error);
    }
  }
  // Starts/Stops Recording; 
  async function handleRecordButtonPress() {
    if (recording) {
      await stopRecording(recording);
    } else {
      await startRecording();
    }
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.button} onPress={handleRecordButtonPress}>
        <FontAwesome name={recording ? 'stop-circle' : 'circle'} size={64} color="white" />
      </TouchableOpacity>
      <View style={styles.recordingStatusText}>
        <Text >{`Status:`}</Text>
        <Text style={{ color: recordingStatus == 'recording' ? 'green' : 'red', marginLeft: 4, fontWeight: "800" }} >{`${recordingStatus}`}</Text>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    flex: '1',
    justifyContent: 'center',
    alignItems: 'center',
  }, recordingStatusText: {
    marginTop: 16,
    display: "flex",
    flexDirection: 'row',
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: 'red',
  },
});

