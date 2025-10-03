
import React, { useState, useEffect, useContext, useRef, useCallback, useMemo } from 'react';
import { Queue, Room, User as UserEntity } from '@/api/entities';
import { Badge } from '@/components/ui/badge';
import { Monitor, Activity, User, Clock, Volume2, Users } from 'lucide-react'; // Added Users icon
import { AnimatePresence, motion } from 'framer-motion';
import { LanguageContext } from './index.jsx';
import { API_CONFIG } from '@/config/constants.js';

const LANGUAGE_VOICES = {
  'th': { name: 'ภาษาไทย', code: 'th-TH' },
  'en': { name: 'English', code: 'en-US' },
  'zh': { name: '中文', code: 'zh-CN' }
};

// Function to build audio file path from Supabase Storage
const buildAudioPath = (roomId, language, patientType, queueNumber) => {
  const baseUrl = 'https://supabase3.rg.in.th/storage/v1/object/public/voice-queue';
  return `${baseUrl}/${roomId}/${language}/${patientType}/${queueNumber}.mp3`;
};

// Function to get patient type from queue number prefix
const getPatientTypeFromQueueNumber = (queueNumber) => {
  if (!queueNumber) return 'New';
  
  const firstChar = queueNumber.charAt(0).toUpperCase();
  switch (firstChar) {
    case 'A':
      return 'New';
    case 'B':
      return 'Returning';
    case 'C':
      return 'Appointment';
    default:
      return 'New';
  }
};

// Function to test if audio file exists in Supabase Storage
const testAudioFileExists = async (audioPath) => {
  try {
    console.log('🧪 Testing audio file existence:', audioPath);
    const response = await fetch(audioPath, { method: 'HEAD' });
    const exists = response.ok;
    console.log('🧪 Audio file exists:', exists, 'Status:', response.status);
    if (exists) {
      console.log('🧪 File size:', response.headers.get('content-length'), 'bytes');
      console.log('🧪 Content type:', response.headers.get('content-type'));
    }
    return exists;
  } catch (error) {
    console.log('🧪 Error testing audio file:', error);
    return false;
  }
};

// Function to get room data from queue's room_history
const getRoomDataFromHistory = (queue, rooms) => {
  let roomCode = queue.room_id; // fallback to original room_id
  let roomId = queue.room_id; // fallback to original room_id
  
  if (queue.room_history && queue.room_history.length > 0) {
    // Get the latest room from history (the one with left_at: null or the last one)
    const latestRoom = queue.room_history.find(room => room.left_at === null) || 
                      queue.room_history[queue.room_history.length - 1];
    
    if (latestRoom && latestRoom.room_name) {
      // Find the room in rooms array by room_name to get room_code and room_id
      const roomData = rooms.find(r => r.room_name === latestRoom.room_name);
      if (roomData && roomData.room_code) {
        roomCode = roomData.room_code;
        roomId = roomData.id || roomData.room_id || roomId; // Use room id from rooms data
        // console.log('📍 Found room from history:', {
        //   room_name: latestRoom.room_name,
        //   room_code: roomData.room_code,
        //   room_id: roomId,
        //   entered_at: latestRoom.entered_at,
        //   left_at: latestRoom.left_at
        // });
      } else {
        console.warn('⚠️ Room not found in rooms array:', latestRoom.room_name);
      }
    }
  }
  
  return { roomId, roomCode };
};

export default function MonitorDisplay() {
  const [rooms, setRooms] = useState([]);
  const [servingQueues, setServingQueues] = useState([]);
  const [allQueues, setAllQueues] = useState([]);
  const [users, setUsers] = useState([]); // New state for users
  const [recentlyCalled, setRecentlyCalled] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentPage, setCurrentPage] = useState(0);
  const lastAnnouncedQueue = useRef({});
  const hasMarkedInitial = useRef(false);
  const { selectedLanguage: contextLanguage } = useContext(LanguageContext);
  const [selectedLanguage, setSelectedLanguage] = useState(() => localStorage.getItem('queue_selected_language') || contextLanguage || 'th');
  const headerRef = useRef(null);
  const [contentHeight, setContentHeight] = useState(null);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const pendingAnnouncements = useRef([]);
  
  // Auto-enable audio on component mount
  useEffect(() => {
    handleUserInteraction();
  }, []);
  
  // Detect screen orientation and set rooms per page accordingly
  const [isPortrait, setIsPortrait] = useState(window.innerHeight > window.innerWidth);
  const itemsPerPage = useMemo(() => 4, [isPortrait]);

  // Listen for language changes from other tabs (QueueCalling)
  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === 'queue_selected_language' && e.newValue) {
        setSelectedLanguage(e.newValue);
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Also update if context changes (for same tab navigation)
  useEffect(() => {
    setSelectedLanguage(localStorage.getItem('queue_selected_language') || contextLanguage || 'th');
  }, [contextLanguage]);

  useEffect(() => {
    // Handle orientation change
    const handleResize = () => {
      setIsPortrait(window.innerHeight > window.innerWidth);
    };
    
    // Initial check
    handleResize();
    // compute content height
    const computeHeight = () => {
      const headerH = headerRef.current ? headerRef.current.offsetHeight : 0;
      const vh = window.innerHeight;
      setContentHeight(Math.max(0, vh - headerH));
    };
    computeHeight();
    
    // Load data
    loadData();
    const interval = setInterval(loadData, 5000); // Refresh data every 5 seconds
    const clockInterval = setInterval(() => setCurrentTime(new Date()), 1000);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      clearInterval(interval);
      clearInterval(clockInterval);
    };
  }, []);

  // Recompute content height on resize and when header size changes
  useEffect(() => {
    const onResize = () => {
      const headerH = headerRef.current ? headerRef.current.offsetHeight : 0;
      const vh = window.innerHeight;
      setContentHeight(Math.max(0, vh - headerH));
    };
    const ro = headerRef.current ? new ResizeObserver(onResize) : null;
    if (ro && headerRef.current) ro.observe(headerRef.current);
    window.addEventListener('resize', onResize);
    onResize();
    return () => {
      window.removeEventListener('resize', onResize);
      if (ro && headerRef.current) ro.disconnect();
    };
  }, [isPortrait]);

  // Get rooms for current page
  const currentRooms = useMemo(() => {
    const sorted = [...rooms].sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
    const start = currentPage * itemsPerPage;
    const end = start + itemsPerPage;
    const paginatedRooms = sorted.slice(start, end);
    
    // Fill empty slots if we don't have enough rooms for the current page
    if (paginatedRooms.length < itemsPerPage) {
      const emptyRooms = Array(itemsPerPage - paginatedRooms.length).fill(null);
      return [...paginatedRooms, ...emptyRooms];
    }
    
    return paginatedRooms;
  }, [rooms, currentPage, itemsPerPage]);

  // Compute total pages based on rooms and itemsPerPage
  const totalPages = useMemo(() => {
    const count = Math.ceil((rooms?.length || 0) / itemsPerPage);
    return Math.max(1, count);
  }, [rooms, itemsPerPage]);

  // Keep currentPage within bounds whenever totalPages changes
  useEffect(() => {
    if (currentPage >= totalPages) {
      setCurrentPage(0);
    }
  }, [totalPages, currentPage]);

  // Auto-cycle through pages every 10 seconds (independent from room refreshes)
  useEffect(() => {
    if (totalPages <= 1) return;
    const id = setInterval(() => {
      setCurrentPage(prev => (prev + 1) % totalPages);
    }, 10000);
    return () => clearInterval(id);
  }, [totalPages]);

  // Track if speech is currently in progress
  const isSpeaking = useRef(false);
  const currentRoomAnnouncement = useRef(null);
  
  // Initialize audio context and enable audio
  const handleUserInteraction = useCallback(() => {
    if (!hasUserInteracted) {
      setHasUserInteracted(true);
      console.log('Initializing audio...');
      
      const initializeAudio = async () => {
        try {
          // Wait for ResponsiveVoice to be ready
          if (window.ResponsiveVoiceReady) {
            console.log('Waiting for ResponsiveVoice to be ready...');
            const rv = await window.ResponsiveVoiceReady;
            
            if (rv) {
              console.log('ResponsiveVoice initialized successfully');
              // Process any pending announcements
              if (pendingAnnouncements.current?.length > 0) {
                console.log('Processing', pendingAnnouncements.current.length, 'pending announcements');
                processNextAnnouncement(true);
              }
              return;
            }
          }
          
          // Fallback to Web Speech API if ResponsiveVoice is not available
          if (window.speechSynthesis) {
            console.log('ResponsiveVoice not available, using Web Speech API');
            const utterance = new window.SpeechSynthesisUtterance(' ');
            utterance.onstart = () => {
              console.log('Web Speech API audio context initialized');
              processNextAnnouncement(true);
            };
            window.speechSynthesis.speak(utterance);
          }
        } catch (e) {
          console.error('Error initializing audio:', e);
          // Try Web Speech API as fallback
          if (window.speechSynthesis) {
            const utterance = new window.SpeechSynthesisUtterance(' ');
            utterance.onstart = () => {
              console.log('Fallback Web Speech API audio context initialized');
              processNextAnnouncement(true);
            };
            window.speechSynthesis.speak(utterance);
          }
        }
      };
      
      // Start audio initialization
      initializeAudio();
    }
  }, [hasUserInteracted]);

  // Get voice parameters based on language
  const getVoiceParams = useCallback((language) => {
    // Default parameters for all voices
    const defaultParams = { 
      rate: 0.8, 
      pitch: 1.0, 
      volume: 1.0,
      onstart: () => { isSpeaking.current = true; },
      onend: () => {
        isSpeaking.current = false;
        currentRoomAnnouncement.current = null;
        // Remove the processed announcement and process next
        if (pendingAnnouncements.current.length > 0) {
          pendingAnnouncements.current.shift();
          setTimeout(processNextAnnouncement, 2000); // 2 second delay
        }
      }
    };

    // Default voice mapping for ResponsiveVoice
    const voiceMap = {
      'th': 'Thai Female',
      'zh': 'Chinese Female',
      'en': 'UK English Female',
      'ja': 'Japanese Female',
      'ko': 'Korean Female',
      'fr': 'French Female',
      'de': 'Deutsch Female',
      'es': 'Spanish Female',
      'it': 'Italian Female',
      'pt': 'Portuguese Female',
      'ru': 'Russian Female',
      'ar': 'Arabic Female',
      'hi': 'Hindi Female'
    };

    // Get the best available voice for the language
    let voiceName = voiceMap[language] || 'UK English Female';
    
    // If ResponsiveVoice is available, try to find the best voice
    if (window.responsiveVoice) {
      const rv = window.responsiveVoice;
      const voices = rv.voices || [];
      
      // Try to find a voice that matches the language
      const langVoices = voices.filter(v => 
        v.lang && v.lang.toLowerCase().startsWith(language.toLowerCase())
      );
      
      if (langVoices.length > 0) {
        // Prefer female voices if available
        const femaleVoice = langVoices.find(v => 
          v.gender === 'f' || v.name.toLowerCase().includes('female')
        );
        
        if (femaleVoice) {
          voiceName = femaleVoice.name;
        } else {
          voiceName = langVoices[0].name;
        }
        console.log(`Using voice for ${language}:`, voiceName);
      } else {
        console.warn(`No voice found for language ${language}, using default:`, voiceName);
      }
    }
    
    return {
      voice: voiceName,
      parameters: defaultParams
    };
  }, []);

  // Process the next pending announcement using Supabase Storage audio files
  const processNextAnnouncement = useCallback(async (isInitial = false) => {
    if (isSpeaking.current || pendingAnnouncements.current.length === 0) return;
    
    // If user hasn't interacted yet, don't play audio
    if (!hasUserInteracted && !isInitial) {
      console.log('Waiting for user interaction before playing audio');
      return;
    }

    const { queue, roomName, announceKey } = pendingAnnouncements.current[0];
    const now = Date.now();
    
    // Update last announced time
    lastAnnouncedQueue.current[queue.room_id] = { 
      announceKey,
      lastAnnounced: now
    };
    
    // Set current room announcement
    currentRoomAnnouncement.current = queue.room_id;
    
    // Use the queue's language if available, otherwise fall back to selected language
    const announceLang = queue.language || selectedLanguage;
    console.log('Announcement language:', announceLang, 'Queue language:', queue.language, 'Selected language:', selectedLanguage);
    
    // Get patient type from queue number prefix
    const patientType = getPatientTypeFromQueueNumber(queue.queue_number);
    
    // Get room data from room_history (latest room)
    const { roomId, roomCode } = getRoomDataFromHistory(queue, rooms);
    
    // Build audio file path
    const audioPath = buildAudioPath(roomId, announceLang, patientType, queue.queue_number);
    // console.log('Playing audio from:', audioPath);
    // console.log('Room ID:', roomId, 'Room code:', roomCode, 'Queue number:', queue.queue_number, 'Patient type:', patientType);
    // console.log('Room history:', queue.room_history);
    
    // Set up event handlers
    const onStartCallback = () => {
      isSpeaking.current = true;
      console.log(`Started announcing queue ${queue.queue_number} for room ${queue.room_id}`);
    };
    
    const onEndCallback = () => {
      isSpeaking.current = false;
      currentRoomAnnouncement.current = null;
      // Remove the processed announcement and process next
      if (pendingAnnouncements.current.length > 0) {
        pendingAnnouncements.current.shift();
        setTimeout(processNextAnnouncement, 2000); // 2 second delay
      }
    };
    
    try {
      // First, check if the audio file exists by making a HEAD request
      console.log('🔍 Checking if audio file exists at:', audioPath);
      
      const response = await fetch(audioPath, { method: 'HEAD' });
      console.log('📡 Response status:', response.status);
      console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        console.log('❌ Audio file not found in Supabase Storage (Status:', response.status, ')');
        console.log('🔄 Falling back to TTS...');
        fallbackToTTS(queue, announceLang, onEndCallback);
        return;
      }
      
      console.log('✅ Audio file found in Supabase Storage!');
      console.log('🎵 File size:', response.headers.get('content-length'), 'bytes');
      console.log('🎵 Content type:', response.headers.get('content-type'));
      
      // Create audio element and play the file from Supabase Storage
      const audio = new Audio(audioPath);
      audio.volume = 1.0;
      
      // Set up event listeners with detailed logging
      audio.addEventListener('loadstart', () => {
        console.log('🎵 Audio loading started from Supabase Storage');
        onStartCallback();
      });
      
      audio.addEventListener('canplaythrough', () => {
        console.log('🎵 Audio ready to play from Supabase Storage');
      });
      
      audio.addEventListener('playing', () => {
        console.log('🎵 Audio is now playing from Supabase Storage');
      });
      
      audio.addEventListener('ended', () => {
        console.log('🎵 Audio playback completed from Supabase Storage');
        onEndCallback();
      });
      
      audio.addEventListener('error', (e) => {
        console.error('❌ Error playing audio file from Supabase Storage:', e);
        console.log('🔍 Audio error details:', {
          error: audio.error,
          networkState: audio.networkState,
          readyState: audio.readyState
        });
        console.log('Audio path:', audioPath);
        
        // Fallback to TTS if audio file is not found
        console.log('🔄 Falling back to TTS...');
        fallbackToTTS(queue, announceLang, onEndCallback);
      });
      
      // Try to play the audio
      console.log('▶️ Attempting to play audio from Supabase Storage...');
      await audio.play();
      console.log('✅ Successfully started playing audio from Supabase Storage!');
      
    } catch (error) {
      console.error('❌ Error playing audio from Supabase Storage:', error);
      console.log('🔍 Error details:', error);
      console.log('Audio path:', audioPath);
      
      // Fallback to TTS
      console.log('🔄 Falling back to TTS...');
      fallbackToTTS(queue, announceLang, onEndCallback);
    }
    
  }, [selectedLanguage, rooms]);

  // Fallback function to use TTS when audio file is not available
  const fallbackToTTS = useCallback((queue, announceLang, onEndCallback) => {
    console.log('🔊 Using TTS Fallback (audio file not found in Supabase Storage)');
    console.log('📝 Queue:', queue.queue_number, 'Room:', queue.room_id, 'Language:', announceLang);
    
    // Get room data from room_history (same logic as main function)
    const { roomId, roomCode } = getRoomDataFromHistory(queue, rooms);
    
    // Get room name from history for TTS
    let roomName = queue.room_id; // fallback
    if (queue.room_history && queue.room_history.length > 0) {
      const latestRoom = queue.room_history.find(room => room.left_at === null) || 
                        queue.room_history[queue.room_history.length - 1];
      if (latestRoom && latestRoom.room_name) {
        roomName = latestRoom.room_name;
      }
    }
    
    const room = rooms.find(r => r.room_code === roomCode);
    const localizedRoomName = room ? (room.room_names?.[announceLang] || room.room_name || roomName) : roomName;
    
    // Create announcement text
    let announcementText = '';
    const queueNumber = queue.queue_number;
    
    const announcements = {
      'th': `ขอเชิญคิว ${queueNumber} เข้ารับบริการที่ ${localizedRoomName}`,
      'zh': `请${queueNumber}号到${localizedRoomName}`,
      'en': `Queue number ${queueNumber}, please proceed to ${localizedRoomName}`,
      'ja': `${queueNumber}番の方は${localizedRoomName}へお越しください`,
      'ko': `${queueNumber}번 고객님, ${localizedRoomName}으로 와 주세요`,
      'fr': `Numéro de file d'attente ${queueNumber}, veuillez vous rendre à ${localizedRoomName}`,
      'de': `Warteschlange Nummer ${queueNumber}, bitte gehen Sie zu ${localizedRoomName}`,
      'es': `Número de cola ${queueNumber}, por favor diríjase a ${localizedRoomName}`,
      'it': `Numero di coda ${queueNumber}, si prega di recarsi a ${localizedRoomName}`,
      'pt': `Fila número ${queueNumber}, por favor, dirija-se a ${localizedRoomName}`,
      'ru': `Очередь номер ${queueNumber}, пожалуйста, пройдите в ${localizedRoomName}`,
      'ar': `الرقم ${queueNumber}، يرجى التوجه إلى ${localizedRoomName}`,
      'hi': `कतार संख्या ${queueNumber}, कृपया ${localizedRoomName} पर जाएं`
    };
    
    announcementText = announcements[announceLang] || announcements['en'];
    console.log('🔊 TTS Text:', announcementText);
    
    try {
      // Try ResponsiveVoice first
      if (window.responsiveVoice && typeof window.responsiveVoice.speak === 'function') {
        console.log('🔊 Using ResponsiveVoice TTS');
        const { voice, parameters } = getVoiceParams(announceLang);
        window.responsiveVoice.speak(announcementText, voice, {
          ...parameters,
          onstart: () => console.log('🔊 TTS started (ResponsiveVoice)'),
          onend: () => {
            console.log('🔊 TTS completed (ResponsiveVoice)');
            onEndCallback();
          },
          onerror: (error) => {
            console.error('❌ TTS error (ResponsiveVoice):', error);
            onEndCallback();
          }
        });
      } else {
        // Fallback to Web Speech API
        console.log('🔊 Using Web Speech API TTS');
        const utterance = new window.SpeechSynthesisUtterance(announcementText);
        utterance.lang = announceLang === 'th' ? 'th-TH' : announceLang === 'zh' ? 'zh-CN' : 'en-US';
        utterance.rate = 0.8;
        utterance.onstart = () => console.log('🔊 TTS started (Web Speech API)');
        utterance.onend = () => {
          console.log('🔊 TTS completed (Web Speech API)');
          onEndCallback();
        };
        utterance.onerror = (error) => {
          console.error('❌ TTS error (Web Speech API):', error);
          onEndCallback();
        };
        window.speechSynthesis.speak(utterance);
      }
    } catch (error) {
      console.error('❌ Error with TTS fallback:', error);
      onEndCallback(); // Still call onEnd to continue processing
    }
  }, [rooms, getVoiceParams]);

  // Attempt to auto-initialize audio on mount (for environments with autoplay allowed)
  useEffect(() => {
    let cancelled = false;
    const autoInit = async () => {
      if (hasUserInteracted) return; // already unlocked
      try {
        // Try silent audio to unlock
        const silentAudio = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQ=');
        silentAudio.volume = 0;
        await silentAudio.play();

        const onInitialized = () => {
          if (cancelled) return;
          setHasUserInteracted(true);
          setShowAudioPrompt(false);
          if (pendingAnnouncements.current && pendingAnnouncements.current.length > 0) {
            processNextAnnouncement(true);
          }
        };

        // Try ResponsiveVoice first
        if (window.responsiveVoice) {
          setTimeout(() => {
            try {
              window.responsiveVoice.speak(' ', 'UK English Female', {
                onstart: onInitialized,
                volume: 0
              });
            } catch (e) {
              // Fallback to Web Speech API
              if (window.speechSynthesis) {
                const u = new window.SpeechSynthesisUtterance(' ');
                u.onstart = onInitialized;
                window.speechSynthesis.speak(u);
              }
            }
          }, 50);
        } else if (window.speechSynthesis) {
          const u = new window.SpeechSynthesisUtterance(' ');
          u.onstart = onInitialized;
          window.speechSynthesis.speak(u);
        } else {
          // No TTS available but audio context likely unlocked by silent audio
          onInitialized();
        }
      } catch (e) {
        // Silent audio failed -> environment still blocks autoplay; fall back to manual prompt
        // Do nothing here; user can click the button
      }
    };
    autoInit();
    return () => { cancelled = true; };
  }, [hasUserInteracted, processNextAnnouncement]);

  // Mark all current queues as announced the first time servingQueues is populated
  useEffect(() => {
    if (!hasMarkedInitial.current && servingQueues.length > 0) {
      servingQueues.forEach(queue => {
        if (queue && queue.queue_number && queue.room_id) {
          const announceKey = `${queue.queue_number}:${queue.called_at || ''}`;
          lastAnnouncedQueue.current[queue.room_id] = { 
            announceKey,
            lastAnnounced: Date.now()
          };
        }
      });
      hasMarkedInitial.current = true;
    }
  }, [servingQueues]);

  // Handle queue announcements
  useEffect(() => {
    if (!hasMarkedInitial.current) return; // Skip announcements on first load
    
    // Process each queue that needs to be announced
    servingQueues.forEach((queue) => {
      if (!queue || !queue.queue_number || !queue.room_id) return;
      
      // Skip if this queue is already being announced
      if (currentRoomAnnouncement.current === queue.room_id) return;
      
      const announceKey = `${queue.queue_number}:${queue.called_at || ''}`;
      const lastAnnounced = lastAnnouncedQueue.current[queue.room_id];
      const now = Date.now();
      
      // Only announce if this is a new queue or the called_at timestamp has changed
      const shouldAnnounce = !lastAnnounced || lastAnnounced.announceKey !== announceKey;
      
      if (shouldAnnounce) {
        const room = rooms.find(r => r.room_code === queue.room_id);
        const roomName = room ? (room.room_names?.[selectedLanguage] || room.room_name || queue.room_id) : queue.room_id;
        
        // Check if this announcement is already in the pending queue
        const isAlreadyInQueue = pendingAnnouncements.current.some(
          item => item.queue.room_id === queue.room_id && 
                 item.announceKey === announceKey
        );
        
        if (!isAlreadyInQueue) {
          // Clear any existing announcements for this room
          pendingAnnouncements.current = pendingAnnouncements.current.filter(
            item => item.queue.room_id !== queue.room_id
          );
          
          // Add new announcement to the queue
          pendingAnnouncements.current.push({
            queue,
            roomName,
            announceKey
          });

          // If audio isn't enabled yet, show the prompt and don't try to speak
          if (!hasUserInteracted) {
            setShowAudioPrompt(true);
          } else {
            // Process the queue if not already processing
            if (!isSpeaking.current) {
              processNextAnnouncement();
            }
          }
        }
      }
    });
  }, [servingQueues, rooms, selectedLanguage, processNextAnnouncement]);

  const loadData = async () => {
    try {
      // ดึงข้อมูลผู้ใช้
      const usersData = await UserEntity.list();
      setUsers(usersData || []);

      // ดึงข้อมูลห้อง
      const roomsData = await Room.list();
      setRooms(roomsData.filter(r => r.is_active));

      // ดึงข้อมูลคิว
      const queuesData = await Queue.list();
      setAllQueues(queuesData);
      setServingQueues(queuesData.filter(q => q.status === 'serving' || q.status === 'called'));
      
      // Test audio files for current serving queues
      // console.log('🧪 Testing audio files for serving queues...');
      for (const queue of queuesData.filter(q => q.status === 'serving' || q.status === 'called')) {
        const patientType = getPatientTypeFromQueueNumber(queue.queue_number);
        
        // Get room data from room_history (same logic as main function)
        const { roomId, roomCode } = getRoomDataFromHistory(queue, roomsData.filter(r => r.is_active));
        
        const audioPath = buildAudioPath(roomId, roomCode, queue.language || selectedLanguage, patientType, queue.queue_number);
        // await testAudioFileExists(audioPath);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const getRoomName = (room, language = 'th') => {
    return room?.room_names?.[language] || room?.room_name || 'Unknown Room';
  };

  const getQueueForRoom = (roomCode) => {
    return servingQueues.find(q => q.room_id === roomCode);
  };

  const getWaitingCount = (roomCode) => { // New function to get waiting count per room
    return allQueues.filter(q => q.room_id === roomCode && q.status === 'waiting').length;
  };

  const getServiceDurationText = (calledAt) => {
    if (!calledAt) return '';
    const serviceDurationMinutes = Math.floor((new Date() - new Date(calledAt)) / 60000);

    if (serviceDurationMinutes < 0) return '0 นาที';

    if (serviceDurationMinutes < 60) {
        return `${serviceDurationMinutes} นาที`;
    } else {
        const hours = Math.floor(serviceDurationMinutes / 60);
        const minutes = serviceDurationMinutes % 60;
        return `${hours} ชม. ${minutes} นาที`;
    }
  };
  

  return (
    <div className={`min-h-screen bg-gradient-to-br from-blue-50 to-white text-gray-800 font-sans overflow-hidden relative flex flex-col ${isPortrait ? 'portrait-mode' : 'landscape-mode'}`}>
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -inset-[10px] opacity-30">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-100 rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-blob"></div>
          <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-2xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-blue-100 rounded-full mix-blend-multiply filter blur-2xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>
      </div>

      {/* Header */}
      <header ref={headerRef} className={`relative z-10 p-4 ${isPortrait ? 'py-3 mt-4' : 'p-6'} border-b border-blue-100 bg-white/80 backdrop-blur-sm shadow-sm`}>
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl flex items-center justify-center shadow-lg">
                <Monitor className="w-8 h-8 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center shadow-md">
                <Activity className="w-3 h-3 text-white" />
              </div>
            </div>
            <div>
              <h1 className={`${isPortrait ? 'text-3xl' : 'text-5xl'} font-bold text-blue-800 tracking-wide`}>
                Queue Monitor
              </h1>
              <p className="text-blue-600 text-xl mt-2">แสดงสถานะคิวแบบเรียลไทม์</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-4xl font-mono font-bold text-blue-800 mb-2">
              {currentTime.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false, timeZone: 'Asia/Bangkok' })}
            </div>
            <div className="text-blue-600 text-lg">
              {currentTime.toLocaleDateString('th-TH-u-ca-buddhist', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                weekday: 'long'
              })}
            </div>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className={`relative z-10 ${isPortrait ? 'flex-1 px-4' : ' w-full'}`}>
        {isPortrait ? (
          (() => {
            const totalPages = Math.ceil(rooms.length / itemsPerPage);
            return (
              <div className="w-full flex flex-col" style={contentHeight ? { height: contentHeight } : undefined}>
                <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-md overflow-hidden flex-1 flex flex-col">
                  <div className="grid grid-cols-3 bg-blue-700 text-white font-semibold text-center py-3">
                    <div className="text-3xl">คิวที่กำลังเรียก</div>
                    <div className="text-3xl">ห้องตรวจ</div>
                    <div className="text-3xl">แพทย์ผู้ตรวจ</div>
                  </div>
                  <div className="flex-1 min-h-0 grid grid-rows-8 px-8 py-4">
                    {currentRooms.map((room, index) => {
                      if (!room) return (
                        <div key={`empty-${index}`} className="h-full flex items-center justify-center border-b border-gray-100">
                          <div className="text-gray-300">-</div>
                        </div>
                      );
                      const queue = getQueueForRoom(room.room_code);
                      const waitingCount = getWaitingCount(room.room_code);
                      return (
                        <div 
                          key={room.room_code || room.id}
                          className="grid grid-cols-3 hover:bg-blue-50/50 transition-colors h-full"
                        >
                          
                          <div className="p-2 flex flex-col items-center justify-center h-full w-full border-b border-gray-100">
                            {queue ? (
                              <>
                                <div className="text-3xl font-bold text-blue-800 leading-tight">{queue.queue_number}</div>
                                <div className="text-xs text-gray-600 mt-1 leading-tight">
                                  กำลังให้บริการ • {getServiceDurationText(queue.called_at)}
                                </div>
                              </>
                            ) : (
                              <div className="text-3xl text-gray-400">-</div>
                            )}
                            {waitingCount > 0 && (
                              <div className="text-xs text-gray-700 mt-1 font-medium bg-blue-50 px-2 py-0.5 rounded-full">
                                รออีก {waitingCount} คิว
                              </div>
                            )}
                          </div>
                          <div className="p-2 border-r border-b border-gray-100 flex flex-col justify-center h-full w-full text-center">
                            <div className="font-extrabold text-gray-800 text-2xl leading-tight">{getRoomName(room, 'th')}</div>
                            <div className="text-gray-600 text-lg leading-tight">{getRoomName(room, 'en')}</div>
                          </div>
                          <div className="p-2 border-b border-gray-100 flex items-center justify-center h-full w-full text-center">
                            {room.doctor_assigned ? (
                              <span className="text-3xl font-semibold text-blue-900">{room.doctor_assigned}</span>
                            ) : (
                              <span className="text-3xl text-gray-400">-</span>
                            )}
                          </div>
                          
                        </div>
                      );
                    })}
                  </div>
                  
                  
                </div>
              </div>
            );
          })()
        ) : (
          <>
            {(() => {
              const sortedRooms = [...rooms].sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
              const totalPages = Math.ceil(sortedRooms.length / itemsPerPage);
              const currentRooms = sortedRooms.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage);
              return (
                <div className="w-full flex flex-col" style={contentHeight ? { height: contentHeight } : undefined}>
                  <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-md overflow-hidden flex-1 flex flex-col">
                    <div className="grid grid-cols-3 bg-blue-700 text-white font-semibold text-center py-3">
                      <div className="text-6xl">คิวที่กำลังเรียก</div>
                      <div className="text-6xl">ห้องตรวจ</div>
                      <div className="text-6xl">แพทย์ผู้ตรวจ</div>
                    </div>
                    <div className="flex-1 min-h-0 grid grid-rows-4 px-8 py-4">
                      {currentRooms.map((room, index) => {
                        if (!room) return (
                          <div key={`empty-${index}`} className="h-full flex items-center justify-center border-b border-gray-100">
                            <div className="text-gray-300">-</div>
                          </div>
                        );
                        const queue = getQueueForRoom(room.room_code);
                        const waitingCount = getWaitingCount(room.room_code);
                        // console.log("room",room);
                        return (
                          <div 
                            key={room.room_code || room.id}
                            className="grid grid-cols-3 place-items-center hover:bg-blue-50/50 transition-colors h-full"
                          >
                           
                            <div className="p-2 flex flex-col items-center justify-center h-full w-full border-b border-gray-100 text-center">
                              {queue ? (
                                <>
                                  <div className="text-6xl font-bold text-blue-800 leading-tight w-full text-center">{queue.queue_number}</div>
                                  <div className="text-lg text-gray-600 mt-1 leading-tight">
                                    กำลังให้บริการ • {getServiceDurationText(queue.called_at)}
                                  </div>
                                </>
                              ) : (
                                <div className="text-3xl text-gray-400 w-full text-center">-</div>
                              )}
                              {waitingCount > 0 && (
                                <div className="text-xl text-gray-700 mt-1 font-medium bg-blue-50 px-2 py-0.5 rounded-full">
                                  รออีก {waitingCount} คิว
                                </div>
                              )}
                            </div>
                            <div className="p-2 border-l border-r border-b border-gray-100 flex flex-col justify-center items-center h-full w-full">
                              <div className="font-bold text-gray-800 text-6xl leading-tight text-center">{getRoomName(room, 'th')}</div>
                              <div className="text-gray-600 text-lg leading-tight">{getRoomName(room, 'en')}</div>
                            </div>
                            <div className="p-2 border-b border-gray-100 flex items-center justify-center h-full w-full">
                              {room.doctor_assigned ? (
                                <span className="text-5xl font-semibold text-blue-900 text-center">{room.doctor_assigned}</span>
                              ) : (
                                <span className="text-3xl text-gray-400 text-center">-</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {totalPages > 1 && (
                      <div className="flex justify-center items-center mt-4">
                        <div className="flex items-center gap-2 bg-white/80 backdrop-blur-md rounded-full px-4 py-2 border border-blue-100 shadow-sm">
                          {Array.from({ length: totalPages }, (_, i) => (
                            <div
                              key={i}
                              className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${i === currentPage ? 'bg-blue-600 scale-125' : 'bg-blue-200'}`}
                            />
                          ))}
                          <span className="ml-3 text-blue-700 text-sm font-medium">{currentPage + 1}/{totalPages}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </>
        )}
      </main>

      {/* Footer Status Bar - Hidden in portrait mode */}
      {!isPortrait && (
        <footer className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-blue-100 p-4 z-50 shadow-inner">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-blue-700 font-medium">ระบบออนไลน์</span>
            </div>
            <div className="text-blue-600 text-sm">
              อัปเดตล่าสุด: {currentTime.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false, timeZone: 'Asia/Bangkok' })}
            </div>
          </div>
          <div className="flex items-center gap-6 text-blue-700 text-sm">
            <div className="flex items-center gap-2 font-medium">
              <User className="w-4 h-4" />
              <span>กำลังให้บริการ: {servingQueues.length}</span>
            </div>
            <div className="flex items-center gap-2 font-medium">
              <Users className="w-4 h-4" />
              <span>รอทั้งหมด: {allQueues.filter(q => q.status === 'waiting').length}</span>
            </div>
            <div className="flex items-center gap-2 font-medium">
              <Volume2 className="w-4 h-4" />
              <span>เสียงประกาศ: เปิด</span>
            </div>
            <button 
              onClick={async () => {
                console.log('🧪 Manual audio test...');
                const testPath = 'https://supabase3.rg.in.th/storage/v1/object/public/voice-queue/92f58023-db93-44b9-8153-95ca42853dfe/A/th/New/A001.mp3';
                await testAudioFileExists(testPath);
              }}
              className="px-3 py-1 bg-blue-100 hover:bg-blue-200 rounded text-xs font-medium transition-colors"
            >
              ทดสอบเสียง
            </button>
          </div>
        </div>
      </footer>
      )}

      <style>{`
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        .animation-delay-200 {
          animation-delay: 0.2s;
        }
        .animation-delay-400 {
          animation-delay: 0.4s;
        }
        
        /* Portrait mode specific styles */
        .portrait-mode {
          --tw-bg-opacity: 1;
          background-color: #f8fafc;
          padding-bottom: 0;
        }
        
        .portrait-mode .room-card {
          min-height: auto;
        }
        
        .portrait-mode main {
          flex: 1;
          display: flex;
          flex-direction: column;
          padding: 0;
        }
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
      `}</style>
    </div>
  );
}
