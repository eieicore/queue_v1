
import React, { useState, useEffect, useContext, useRef, useCallback, useMemo } from 'react';
import { Queue, Room } from '@/api/entities';
import { Badge } from '@/components/ui/badge';
import { Monitor, Activity, User, Clock, Volume2, Users } from 'lucide-react'; // Added Users icon
import { AnimatePresence, motion } from 'framer-motion';
import { LanguageContext } from './index.jsx';

const LANGUAGE_VOICES = {
  'th': { name: 'ภาษาไทย', code: 'th-TH' },
  'en': { name: 'English', code: 'en-US' },
  'zh': { name: '中文', code: 'zh-CN' }
};

export default function MonitorDisplay() {
  const [rooms, setRooms] = useState([]);
  const [servingQueues, setServingQueues] = useState([]);
  const [allQueues, setAllQueues] = useState([]); // New state for all queues
  const [recentlyCalled, setRecentlyCalled] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentPage, setCurrentPage] = useState(0); // New state for pagination
  const lastAnnouncedQueue = useRef({}); // เปลี่ยนเป็น object เก็บ queue ต่อห้อง
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
  const itemsPerPage = useMemo(() => (isPortrait ? 8 : 2), [isPortrait]);

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
      console.log('Auto-enabling audio...');
      
      // Play a silent audio to enable audio context
      const silentAudio = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQ=');
      silentAudio.volume = 0;
      
      const initializeAudio = () => {
        // Try to speak a test message with ResponsiveVoice
        if (window.responsiveVoice) {
          console.log('Initializing ResponsiveVoice...');
          
          // Speak with a very short delay to ensure the audio context is ready
          setTimeout(() => {
            window.responsiveVoice.speak(' ', 'UK English Female', { 
              onstart: () => {
                console.log('Audio context initialized successfully');
                // Process any pending announcements
                if (pendingAnnouncements.current?.length > 0) {
                  console.log('Processing', pendingAnnouncements.current.length, 'pending announcements');
                  processNextAnnouncement(true);
                }
              },
              volume: 0
            });
          }, 100);
        } else if (window.speechSynthesis) {
          // Fallback to Web Speech API if ResponsiveVoice is not available
          console.log('ResponsiveVoice not available, using Web Speech API');
          const utterance = new window.SpeechSynthesisUtterance(' ');
          utterance.onstart = () => {
            console.log('Web Speech API audio context initialized');
            processNextAnnouncement(true);
          };
          window.speechSynthesis.speak(utterance);
        }
      };
      
      // Play silent audio and initialize audio context
      silentAudio.play()
        .then(() => {
          console.log('Silent audio played successfully');
          initializeAudio();
        })
        .catch(e => {
          console.warn('Silent audio play failed, trying to initialize anyway:', e);
          initializeAudio();
        });
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

  // Process the next pending announcement
  const processNextAnnouncement = useCallback((isInitial = false) => {
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
    
    // Determine language for this announcement: use queue.language if available, else selectedLanguage
    const announceLang = queue.language || selectedLanguage;
    // Get the room name in the announcement language
    const room = rooms.find(r => r.room_code === queue.room_id);
    const localizedRoomName = room ? (room.room_names?.[announceLang] || room.room_name || queue.room_id) : queue.room_id;
    
    // Create and speak the announcement based on selected language
    let announcementText = '';
    const queueNumber = queue.queue_number;
    
    // More natural announcements for each language
    const announcements = {
      'th': `ขอเชิญคิว ${queueNumber} เข้ารับบริการที่ ${localizedRoomName}`, // More natural Thai
      'zh': `请${queueNumber}号到${localizedRoomName}`, // Natural Chinese
      'en': `Queue number ${queueNumber}, please proceed to ${localizedRoomName}`, // Natural English
      'ja': `${queueNumber}番の方は${localizedRoomName}へお越しください`, // Japanese
      'ko': `${queueNumber}번 고객님, ${localizedRoomName}으로 와 주세요`, // Korean
      'fr': `Numéro de file d'attente ${queueNumber}, veuillez vous rendre à ${localizedRoomName}`, // French
      'de': `Warteschlange Nummer ${queueNumber}, bitte gehen Sie zu ${localizedRoomName}`, // German
      'es': `Número de cola ${queueNumber}, por favor diríjase a ${localizedRoomName}`, // Spanish
      'it': `Numero di coda ${queueNumber}, si prega di recarsi a ${localizedRoomName}`, // Italian
      'pt': `Fila número ${queueNumber}, por favor, dirija-se a ${localizedRoomName}`, // Portuguese
      'ru': `Очередь номер ${queueNumber}, пожалуйста, пройдите в ${localizedRoomName}`, // Russian
      'ar': `الرقم ${queueNumber}، يرجى التوجه إلى ${localizedRoomName}`, // Arabic
      'hi': `कतार संख्या ${queueNumber}, कृपया ${localizedRoomName} पर जाएं` // Hindi
    };
    
    // Get the announcement text for the announcement language, fallback to English
    announcementText = announcements[announceLang] || announcements['en'];
    
    // Get voice parameters for the announcement language
    const { voice, parameters } = getVoiceParams(announceLang);
    
    // Set up event handlers
    const onStartCallback = () => {
      isSpeaking.current = true;
      console.log(`Started announcing queue ${queue.queue_number} for room ${queue.room_id}`);
      if (parameters.onstart) parameters.onstart();
    };
    
    const onEndCallback = () => {
      isSpeaking.current = false;
      currentRoomAnnouncement.current = null;
      // Remove the processed announcement and process next
      if (pendingAnnouncements.current.length > 0) {
        pendingAnnouncements.current.shift();
        setTimeout(processNextAnnouncement, 2000); // 2 second delay
      }
      if (parameters.onend) parameters.onend();
    };
    
    try {
      // Check if ResponsiveVoice is available
      if (window.responsiveVoice && typeof window.responsiveVoice.speak === 'function') {
        console.log('Using ResponsiveVoice with voice:', voice);
        console.log('Available voices:', window.responsiveVoice.voices);
        
        // Speak using ResponsiveVoice
        window.responsiveVoice.speak(
          announcementText,
          voice,
          {
            ...parameters,
            onstart: onStartCallback,
            onend: onEndCallback,
            onerror: onEndCallback
          }
        );
      } else {
        console.warn('ResponsiveVoice not properly initialized, falling back to Web Speech API');
        throw new Error('ResponsiveVoice not available');
      }
    } catch (error) {
      console.error('Error with ResponsiveVoice, falling back to Web Speech API:', error);
      // Fallback to Web Speech API
      const utterance = new window.SpeechSynthesisUtterance(announcementText);
      utterance.lang = announceLang === 'th' ? 'th-TH' : announceLang === 'zh' ? 'zh-CN' : 'en-US';
      utterance.rate = 0.8;
      utterance.onend = onEndCallback;
      utterance.onerror = onEndCallback;
      window.speechSynthesis.speak(utterance);
    }
    
  }, [selectedLanguage, rooms]);

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
      // ดึงข้อมูลห้อง
      const roomRes = await fetch('https://omtkvjdxjlseozakrzgl.supabase.co/rest/v1/rooms', {
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9tdGt2amR4amxzZW96YWtyemdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI1NTg2OTksImV4cCI6MjA2ODEzNDY5OX0.LMCdWVUGRyDj5-PTtjzMGeKQaIPz081IGEFh2863PTY',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9tdGt2amR4amxzZW96YWtyemdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI1NTg2OTksImV4cCI6MjA2ODEzNDY5OX0.LMCdWVUGRyDj5-PTtjzMGeKQaIPz081IGEFh2863PTY'
        }
      });
      const roomsData = await roomRes.json();
      setRooms(roomsData.filter(r => r.is_active));

      // ดึงข้อมูลคิว
      const queueRes = await fetch('https://omtkvjdxjlseozakrzgl.supabase.co/rest/v1/queue', {
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9tdGt2amR4amxzZW96YWtyemdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI1NTg2OTksImV4cCI6MjA2ODEzNDY5OX0.LMCdWVUGRyDj5-PTtjzMGeKQaIPz081IGEFh2863PTY',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9tdGt2amR4amxzZW96YWtyemdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI1NTg2OTksImV4cCI6MjA2ODEzNDY5OX0.LMCdWVUGRyDj5-PTtjzMGeKQaIPz081IGEFh2863PTY'
        }
      });
      const queuesData = await queueRes.json();
      setAllQueues(queuesData);
      // กำลังให้บริการ: status = 'serving' หรือ 'called'
      setServingQueues(queuesData.filter(q => q.status === 'serving' || q.status === 'called'));
    } catch (error) {
      console.error('Error loading rooms/queues:', error);
    }
  };

  const getRoomName = (room, language = 'th') => {
    return room?.room_names?.[selectedLanguage] || room?.room_name || 'Unknown Room';
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
      <main className={`relative z-10 ${isPortrait ? 'flex-1 px-4' : 'p-8 max-w-7xl mx-auto w-full'}`}>
        {isPortrait ? (
          (() => {
            const totalPages = Math.ceil(rooms.length / itemsPerPage);
            return (
              <div className="w-full flex flex-col" style={contentHeight ? { height: contentHeight } : undefined}>
                <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-md overflow-hidden flex-1 flex flex-col">
                  <div className="grid grid-cols-2 bg-blue-700 text-white font-semibold text-center py-3">
                    <div className="text-lg">ห้องตรวจ</div>
                    <div className="text-lg">คิวที่กำลังเรียก</div>
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
                          className="grid grid-cols-2 hover:bg-blue-50/50 transition-colors h-full"
                        >
                          <div className="p-2 border-r border-b border-gray-100 flex flex-col justify-center h-full w-full">
                            <div className="font-semibold text-gray-800 text-3xl leading-tight">{getRoomName(room, 'th')}</div>
                            {/* <div className="text-gray-600 text-sm leading-tight">{getRoomName(room, 'en')}</div>
                            <div className="mt-1">
                              <Badge variant="outline" className="text-xs border-blue-200 bg-blue-50 text-blue-700 px-2 py-0.5">
                                {room.department}
                              </Badge>
                            </div> */}
                          </div>
                          <div className="p-2 flex flex-col items-center justify-center h-full w-full border-b border-gray-100">
                            {queue ? (
                              <>
                                <div className="text-3xl font-bold text-blue-800 leading-tight">{queue.queue_number}</div>
                                <div className="text-xs text-gray-600 mt-1 leading-tight">
                                  กำลังให้บริการ • {getServiceDurationText(queue.called_at)}
                                </div>
                              </>
                            ) : (
                              <div className="text-2xl text-gray-400">-</div>
                            )}
                            {waitingCount > 0 && (
                              <div className="text-xs text-gray-700 mt-1 font-medium bg-blue-50 px-2 py-0.5 rounded-full">
                                รออีก {waitingCount} คิว
                              </div>
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
            {/* Page Indicator for Landscape */}
            {(() => {
              const sortedRooms = [...rooms].sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
              const totalPages = Math.ceil(sortedRooms.length / itemsPerPage);
              const currentRooms = sortedRooms.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage);
              
              return (
                <>
                  {totalPages > 1 && (
                    <div className="flex justify-center items-center mb-8">
                      <div className="flex items-center gap-4 bg-white/80 backdrop-blur-md rounded-full px-6 py-3 border border-blue-100 shadow-sm">
                        <span className="text-blue-700 text-sm font-medium">หน้า</span>
                        <div className="flex gap-2">
                          {Array.from({ length: totalPages }, (_, i) => (
                            <div
                              key={i}
                              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                                i === currentPage ? 'bg-blue-600 scale-125' : 'bg-blue-200'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-blue-700 text-sm font-medium">{currentPage + 1}/{totalPages}</span>
                      </div>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-8 min-h-[600px]">
                {currentRooms.map(room => {
                  const queue = getQueueForRoom(room.room_code);
                  const waitingCount = getWaitingCount(room.room_code);
                  return (
              <motion.div
                key={room.room_code || room.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="group relative"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/80 to-white/60 rounded-3xl blur-sm group-hover:blur-none transition-all duration-300 shadow-lg"></div>
                <div className="relative flex flex-col h-full bg-white/90 backdrop-blur-sm border border-blue-100 rounded-3xl p-4 md:p-6 lg:p-8 hover:bg-white transition-all duration-300 shadow-md hover:shadow-lg room-card">
                  
                  {/* Room Header */}
                  <div className="flex-shrink-0">
                    <div className="flex items-center gap-4 mb-6 pb-4 border-b border-white/20">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md">
                        {room.room_code}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-2xl font-semibold text-gray-800 mb-1">
                          {getRoomName(room, 'th')}
                        </h3>
                        <p className="text-gray-600 text-sm">
                          {getRoomName(room, 'en')}
                        </p>
                        <Badge variant="outline" className="mt-2 border-blue-200 bg-blue-50 text-blue-700">
                          {room.department}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Queue Status */}
                  <div className="flex-grow flex flex-col items-center justify-center text-center">
                    <AnimatePresence mode="wait">
                      {queue ? (
                        <motion.div
                          key={queue.id || queue.queue_number}
                          initial={{ opacity: 0, y: 30, scale: 0.8 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -30, scale: 0.8 }}
                          transition={{ type: "spring", stiffness: 300, damping: 25 }}
                          className="w-full"
                        >
                          {/* Status Indicator */}
                          <div className="flex items-center justify-center gap-2 mb-4">
                            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="text-green-700 text-sm font-semibold">กำลังให้บริการ</span>
                          </div>
                          {/* Queue Number */}
                          <div className="text-5xl font-extrabold text-blue-800 drop-shadow mb-4">
                              {queue.queue_number}
                          </div>

                          {/* Service Duration */}
                          <div className="flex items-center justify-center gap-2 text-blue-700 text-sm">
                            <Clock className="w-4 h-4" />
                            <span className="font-semibold">
                              {getServiceDurationText(queue.called_at)}
                            </span>
                          </div>

                          {/* Patient Type Badge */}
                          <div className="mt-3">
                            <Badge 
                              className={`${queue.patient_type === 'new' ? 'bg-blue-500/20 text-blue-200' : 
                                         queue.patient_type === 'returning' ? 'bg-green-100 text-green-800' : 
                                         'bg-blue-100 text-blue-800'} border-0`}
                            >
                              {queue.patient_type === 'new' ? 'ผู้ป่วยใหม่' : 
                               queue.patient_type === 'returning' ? 'ผู้ป่วยเก่า' : 'นัดหมาย'}
                            </Badge>
                          </div>
                        </motion.div>
                      ) : (
                        <motion.div
                          key={`waiting-${room.room_code || room.id}`}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="text-center"
                        >
                          <User className="w-16 h-16 mx-auto mb-4 text-blue-400 opacity-60"/>
                          <p className="text-lg text-blue-700 font-medium">รอเรียกคิว</p>
                          <div className="mt-4 flex items-center justify-center gap-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse animation-delay-200"></div>
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse animation-delay-400"></div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Footer Section */}
                  <div className='flex-shrink-0'>
                    {/* Waiting Count for this room */}
                    <div className="mt-4 pt-4 border-t border-blue-200 text-center">
                      <div className="flex items-center justify-center gap-2 text-blue-700">
                        <Users className="w-4 h-4" />
                        <span className="text-sm font-medium">คิวที่รอ: </span>
                        <span className="font-bold text-lg text-blue-800">{waitingCount}</span>
                        <span className="text-sm font-medium">คิว</span>
                      </div>
                    </div>

                    {/* Staff Info */}
                    {room.staff_assigned && (
                      <div className="mt-2 text-center">
                        <p className="text-blue-600 text-sm font-medium">เจ้าหน้าที่ประจำ</p>
                        <p className="text-gray-800 font-semibold">{room.staff_assigned}</p>
                      </div>
                    )}
                  </div>
                </div>
                    </motion.div>
                  );
                })}
              </div>
                </>
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
