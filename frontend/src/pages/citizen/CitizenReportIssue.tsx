import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { issueService } from '../../services/issueService';
import { aiService } from '../../services/aiService';
import { useAuth } from '../../context/AuthContext';
import { LocationPicker } from '../../components/map/LocationPicker';
import { DemoBadge } from '../../components/common/DemoBadge';
import { SeverityBadge } from '../../components/common/SeverityBadge';
import { AIAnalysis, DuplicateCandidate, IssueCategory } from '../../types';
import {
  Camera,
  FileText,
  Mic,
  MapPin,
  Tag,
  Sparkles,
  GitMerge,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  Upload,
  X,
  AlertCircle,
  ThumbsUp,
  Navigation,
  ShieldCheck,
} from 'lucide-react';
import { getImageUrl, handleImageError } from '../../utils/imageUtils';

interface WizardState {
  // Step 1: Evidence
  imageFile: File | null;
  imageUrl: string;
  imageError: string;

  // Step 2: Description
  description: string;

  // Step 3: Voice
  isRecording: boolean;
  transcription: string;

  // Step 4: Location
  lat: number;
  lng: number;
  address: string;
  ward: string;

  // Step 5: Category
  category: string;
  aiSuggestedCategory: string;

  // Step 6: AI Analysis
  aiAnalysis: AIAnalysis | null;

  // Step 7: Similar Issues
  duplicates: DuplicateCandidate[];

  // Step 8: Final Submission
  trackingNumber: string;
  submittedIssueId: string;
}

const PRESET_IMAGES = [
  {
    label: 'Pothole Sample',
    url: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop',
  },
  {
    label: 'Water Leak Sample',
    url: 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b2?w=600&auto=format&fit=crop',
  },
  {
    label: 'Garbage Dump Sample',
    url: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=600&auto=format&fit=crop',
  },
];

const CATEGORIES = [
  'Pothole',
  'Road Damage',
  'Road Crack',
  'Garbage',
  'Streetlight',
  'Drainage',
  'Water Leakage',
  'Waterlogging',
  'Open Manhole',
  'Other',
];

export const CitizenReportIssue: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [submitting, setSubmitting] = useState(false);

  const [state, setState] = useState<WizardState>({
    imageFile: null,
    imageUrl: PRESET_IMAGES[0].url,
    imageError: '',
    description: '',
    isRecording: false,
    transcription: '',
    lat: 19.0596,
    lng: 72.8295,
    address: 'SV Road, Bandra West, Mumbai',
    ward: currentUser.ward || 'Ward H/West (Bandra)',
    category: 'Pothole',
    aiSuggestedCategory: 'Pothole',
    aiAnalysis: null,
    duplicates: [],
    trackingNumber: '',
    submittedIssueId: '',
  });

  // Step Validation Handlers
  const canGoNext = (): boolean => {
    switch (currentStep) {
      case 1:
        return !!state.imageUrl && !state.imageError;
      case 2:
        return state.description.trim().length >= 15;
      case 3:
        return true; // Voice step optional
      case 4:
        return !!state.address && !!state.ward;
      case 5:
        return !!state.category;
      case 6:
        return true;
      case 7:
        return true;
      default:
        return true;
    }
  };

  // Image Upload Handler with validation
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setState((prev) => ({
        ...prev,
        imageError: 'Invalid file format. Only JPG, PNG, and WebP are allowed.',
      }));
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setState((prev) => ({
        ...prev,
        imageError: 'File size exceeds 5MB limit.',
      }));
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setState((prev) => ({
      ...prev,
      imageFile: file,
      imageUrl: previewUrl,
      imageError: '',
    }));
  };

  // Voice Recording Simulator
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [speechRec, setSpeechRec] = useState<any>(null);
  const liveTranscriptRef = React.useRef<string>('');
  const [transcribing, setTranscribing] = useState(false);
  const [voiceError, setVoiceError] = useState<string>('');

  // Real Speech-to-Text Voice Recording Handler
  const handleToggleVoiceRecording = async () => {
    if (state.isRecording) {
      if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
      }
      if (speechRec) {
        try {
          speechRec.stop();
        } catch (e) {}
      }
      setState((prev) => ({ ...prev, isRecording: false }));
    } else {
      setVoiceError('');
      liveTranscriptRef.current = '';

      // Initialize Web Speech API for real-time live browser transcription
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      let recognitionInstance: any = null;
      if (SpeechRecognition) {
        try {
          recognitionInstance = new SpeechRecognition();
          recognitionInstance.continuous = true;
          recognitionInstance.interimResults = true;
          recognitionInstance.lang = 'en-US';

          recognitionInstance.onresult = (event: any) => {
            let transcript = '';
            for (let i = 0; i < event.results.length; i++) {
              transcript += event.results[i][0].transcript + ' ';
            }
            if (transcript.trim()) {
              liveTranscriptRef.current = transcript.trim();
            }
          };
          recognitionInstance.start();
          setSpeechRec(recognitionInstance);
        } catch (e) {
          console.warn('Live SpeechRecognition start note:', e);
        }
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setVoiceError('Microphone recording is not supported in this browser.');
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);
        const chunks: Blob[] = [];

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunks.push(e.data);
        };

        recorder.onstop = async () => {
          stream.getTracks().forEach((t) => t.stop());
          const audioBlob = new Blob(chunks, { type: 'audio/webm' });
          const audioFile = new File([audioBlob], 'voice_report.webm', { type: 'audio/webm' });

          setTranscribing(true);
          try {
            // Check if live browser speech recognition caught the transcript
            const liveText = liveTranscriptRef.current.trim();
            if (liveText) {
              setState((prev) => ({
                ...prev,
                transcription: liveText,
                description: prev.description ? `${prev.description}\n${liveText}` : liveText,
              }));
              return;
            }

            // Fallback to AI service fast transcriber
            const res = await aiService.transcribeAudio(audioFile);
            if (res.status === 'available' && res.text) {
              setState((prev) => ({
                ...prev,
                transcription: res.text,
                description: prev.description ? `${prev.description}\n${res.text}` : res.text,
              }));
            } else {
              setVoiceError(res.error || 'Speech-to-text service is not available on backend server.');
            }
          } catch (err: any) {
            setVoiceError(err?.message || 'Failed to process audio recording.');
          } finally {
            setTranscribing(false);
          }
        };

        recorder.start();
        setMediaRecorder(recorder);
        setState((prev) => ({ ...prev, isRecording: true }));
      } catch (err: any) {
        setVoiceError('Could not access microphone: ' + (err?.message || 'Permission denied'));
      }
    }
  };

  // Trigger AI Analysis when moving to Step 6
  const triggerAIAnalysis = async () => {
    const aiRes = await aiService.analyzeReport(
      `${state.category} Complaint`,
      state.description || state.transcription,
      state.imageFile || undefined
    );
    const dups = await aiService.detectDuplicates(state.category, state.lat, state.lng);

    setState((prev) => ({
      ...prev,
      aiAnalysis: aiRes,
      aiSuggestedCategory: aiRes.detectedCategory,
      category: prev.category || aiRes.detectedCategory,
      duplicates: dups,
    }));
  };

  const handleNext = async () => {
    if (currentStep === 5) {
      await triggerAIAnalysis();
    }
    if (currentStep < 8) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setState((prev) => ({
            ...prev,
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            address: 'GPS Selected Location, Bandra West, Mumbai',
          }));
        },
        () => {
          // Fallback location
          setState((prev) => ({
            ...prev,
            lat: 19.0596,
            lng: 72.8295,
          }));
        }
      );
    }
  };

  const handleSubmitReport = async () => {
    setSubmitting(true);
    let mappedCat: IssueCategory = 'Roads & Potholes';
    if (state.category.includes('Garbage')) mappedCat = 'Garbage & Sanitation';
    if (state.category.includes('Water')) mappedCat = 'Water Supply & Leakage';
    if (state.category.includes('Streetlight')) mappedCat = 'Street Lighting';
    if (state.category.includes('Drainage')) mappedCat = 'Drainage & Sewage';

    const imageFiles = state.imageFile ? [state.imageFile] : [];

    const issue = await issueService.createReport(
      {
        citizenId: currentUser.id,
        citizenName: currentUser.name,
        title: `${state.category} reported at ${state.address}`,
        description: state.description || state.transcription || 'Municipal complaint reported',
        category: mappedCat,
        latitude: state.lat,
        longitude: state.lng,
        address: state.address,
        ward: state.ward,
        images: state.imageUrl
          ? [
              {
                id: `img-${Date.now()}`,
                url: state.imageUrl,
                caption: 'Citizen uploaded report photo',
                uploadedAt: new Date().toISOString(),
                uploadedByRole: 'Citizen',
              },
            ]
          : [],
      },
      imageFiles
    );

    setState((prev) => ({
      ...prev,
      trackingNumber: issue.trackingNumber,
      submittedIssueId: issue.id,
    }));
    setSubmitting(false);
  };

  const stepsList = [
    { num: 1, label: 'Evidence', icon: Camera },
    { num: 2, label: 'Details', icon: FileText },
    { num: 3, label: 'Voice', icon: Mic },
    { num: 4, label: 'Location', icon: MapPin },
    { num: 5, label: 'Category', icon: Tag },
    { num: 6, label: 'AI Review', icon: Sparkles },
    { num: 7, label: 'Duplicates', icon: GitMerge },
    { num: 8, label: 'Submit', icon: CheckCircle2 },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Wizard Step Progress Indicator */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between overflow-x-auto gap-2 pb-2 md:pb-0">
          {stepsList.map((st) => {
            const Icon = st.icon;
            const isActive = currentStep === st.num;
            const isCompleted = currentStep > st.num;

            return (
              <div
                key={st.num}
                onClick={() => isCompleted && setCurrentStep(st.num)}
                className={`flex items-center gap-1.5 shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                  isActive
                    ? 'bg-blue-700 text-white shadow-xs'
                    : isCompleted
                    ? 'bg-blue-50 text-blue-800'
                    : 'bg-slate-100 text-slate-400'
                }`}
              >
                <span className="w-5 h-5 rounded-full bg-current/20 flex items-center justify-center text-[10px]">
                  {st.num}
                </span>
                <Icon className="w-3.5 h-3.5 hidden sm:inline" />
                <span>{st.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Wizard Form Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8 space-y-6">
        {/* Step 1: Evidence Upload */}
        {currentStep === 1 && (
          <div className="space-y-5">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Camera className="w-5 h-5 text-blue-700" /> Step 1: Upload Photo Evidence
              </h2>
              <p className="text-xs text-slate-500">
                Attach a clear photo of the damage or municipal hazard (Max 5MB, JPG/PNG/WebP).
              </p>
            </div>

            {state.imageError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" /> {state.imageError}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Custom File Dropzone */}
              <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 flex flex-col items-center justify-center text-center space-y-3 hover:border-blue-500 transition-colors bg-slate-50">
                <Upload className="w-8 h-8 text-blue-700" />
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-800">Click to upload photo from camera</p>
                  <p className="text-[10px] text-slate-400">JPG, PNG, or WebP up to 5MB</p>
                </div>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload-input"
                />
                <label
                  htmlFor="file-upload-input"
                  className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold rounded-lg cursor-pointer transition-colors"
                >
                  Select Photo File
                </label>
              </div>

              {/* Image Preview Box */}
              <div className="space-y-3">
                <span className="text-xs font-semibold text-slate-700 block">
                  Current Selected Image Preview
                </span>
                {state.imageUrl ? (
                  <div className="relative rounded-xl overflow-hidden border border-slate-200 h-48 group">
                    <img
                      src={getImageUrl(state.imageUrl)}
                      onError={handleImageError}
                      alt="Upload preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() =>
                        setState((prev) => ({
                          ...prev,
                          imageUrl: '',
                          imageFile: null,
                        }))
                      }
                      className="absolute top-2 right-2 p-1.5 bg-rose-600 text-white rounded-full opacity-90 hover:opacity-100 shadow-md"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="h-48 bg-slate-100 rounded-xl border border-slate-200 flex items-center justify-center text-xs text-slate-400">
                    No image attached
                  </div>
                )}

                {/* Preset Selector */}
                <div className="space-y-1.5 pt-2">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">
                    Or Select Demo Sample Photo:
                  </span>
                  <div className="flex gap-2">
                    {PRESET_IMAGES.map((img) => (
                      <button
                        key={img.label}
                        type="button"
                        onClick={() =>
                          setState((prev) => ({
                            ...prev,
                            imageUrl: img.url,
                            imageError: '',
                          }))
                        }
                        className="text-[10px] font-semibold px-2 py-1 bg-slate-100 hover:bg-blue-50 border border-slate-200 rounded text-slate-700"
                      >
                        {img.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Description */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-700" /> Step 2: Issue Description
              </h2>
              <p className="text-xs text-slate-500">
                Provide specific details regarding the problem (Min 15 characters required).
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700">
                Describe the damage, hazard, or overflow *
              </label>
              <textarea
                rows={5}
                placeholder="e.g. Large 2-foot wide crater on the southbound carriageway causing severe vehicle damage and traffic bottlenecks..."
                value={state.description}
                onChange={(e) =>
                  setState((prev) => ({ ...prev, description: e.target.value }))
                }
                className="w-full p-3 text-xs border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-600"
              />
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>Min 15 characters</span>
                <span>{state.description.length} characters</span>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Voice Input */}
        {currentStep === 3 && (
          <div className="space-y-5">
            <div className="border-b border-slate-100 pb-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Mic className="w-5 h-5 text-blue-700" /> Step 3: Voice Input Assistant (Optional)
                </h2>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                  faster-whisper
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Dictate issue details using speech-to-text voice transcription.
              </p>
            </div>

            <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl text-center space-y-4">
              <button
                type="button"
                onClick={handleToggleVoiceRecording}
                disabled={transcribing}
                className={`p-5 rounded-full text-white shadow-lg transition-transform hover:scale-105 active:scale-95 ${
                  state.isRecording
                    ? 'bg-rose-600 animate-pulse'
                    : transcribing
                    ? 'bg-amber-500 animate-spin'
                    : 'bg-blue-700 hover:bg-blue-800'
                }`}
              >
                <Mic className="w-8 h-8" />
              </button>

              <p className="text-xs font-bold text-slate-800">
                {state.isRecording
                  ? 'Recording in progress... Click again to stop'
                  : transcribing
                  ? 'Transcribing audio via faster-whisper...'
                  : 'Click microphone to dictate issue'}
              </p>

              {voiceError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2 text-left">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{voiceError}</span>
                </div>
              )}

              {state.transcription && (
                <div className="p-3 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 space-y-1 text-left">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">
                    Transcribed Speech Text:
                  </span>
                  <p>"{state.transcription}"</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 4: Geolocation */}
        {currentStep === 4 && (
          <div className="space-y-4">
            <div className="border-b border-slate-100 pb-3 flex flex-col md:flex-row md:items-center justify-between gap-2">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-blue-700" /> Step 4: Pin Location on Map
                </h2>
                <p className="text-xs text-slate-500">
                  Drag the map marker or click to pinpoint exact complaint coordinates.
                </p>
              </div>

              <button
                type="button"
                onClick={handleGetCurrentLocation}
                className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shrink-0"
              >
                <Navigation className="w-3.5 h-3.5" /> Use Current GPS Location
              </button>
            </div>

            <LocationPicker
              lat={state.lat}
              lng={state.lng}
              onLocationChange={(newLat, newLng) =>
                setState((prev) => ({ ...prev, lat: newLat, lng: newLng }))
              }
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Street Address *
                </label>
                <input
                  type="text"
                  value={state.address}
                  onChange={(e) =>
                    setState((prev) => ({ ...prev, address: e.target.value }))
                  }
                  className="w-full p-2.5 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Municipal Ward *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Ward K-West or Ward 12"
                  value={state.ward}
                  onChange={(e) =>
                    setState((prev) => ({ ...prev, ward: e.target.value }))
                  }
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            <div className="p-2.5 bg-slate-100 rounded-lg text-[11px] font-mono text-slate-600 flex justify-between">
              <span>Latitude: {state.lat.toFixed(5)}</span>
              <span>Longitude: {state.lng.toFixed(5)}</span>
            </div>
          </div>
        )}

        {/* Step 5: Category Selection */}
        {currentStep === 5 && (
          <div className="space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Tag className="w-5 h-5 text-blue-700" /> Step 5: Select Category Taxonomy
              </h2>
              <p className="text-xs text-slate-500">
                Choose the standard municipal classification for this complaint.
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {CATEGORIES.map((cat) => {
                const isSelected = state.category === cat;
                const isAiSuggested = state.aiSuggestedCategory.includes(cat);

                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setState((prev) => ({ ...prev, category: cat }))}
                    className={`p-3.5 rounded-xl border text-left flex flex-col justify-between transition-all relative ${
                      isSelected
                        ? 'bg-blue-700 text-white border-blue-700 shadow-md font-bold'
                        : 'bg-white border-slate-200 text-slate-800 hover:border-blue-400'
                    }`}
                  >
                    <span className="text-xs">{cat}</span>
                    {isAiSuggested && (
                      <span className="mt-2 text-[9px] px-1.5 py-0.5 rounded font-semibold bg-sky-100 text-sky-800 w-fit flex items-center gap-1 border border-sky-300">
                        <Sparkles className="w-2.5 h-2.5" /> AI Suggested
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 6: AI Analysis Preview */}
        {currentStep === 6 && (
          <div className="space-y-5">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-sky-600" /> Step 6: AI Analysis Preview
                </h2>
                <p className="text-xs text-slate-500">
                  Automated category taxonomy, risk severity, and confidence assessment.
                </p>
              </div>
              {state.aiAnalysis?.isDemo ? (
                <DemoBadge label="rule-based" />
              ) : (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                  Gemini API Active
                </span>
              )}
            </div>

            {state.aiAnalysis ? (
              <div className="bg-sky-50 border border-sky-200 rounded-xl p-5 space-y-4 shadow-xs">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div className="bg-white p-3.5 rounded-xl border border-sky-100 shadow-2xs">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                      Detected Category
                    </span>
                    <p className="text-sm font-bold text-sky-950 mt-1">
                      {state.aiAnalysis.detectedCategory}
                    </p>
                  </div>

                  <div className="bg-white p-3.5 rounded-xl border border-sky-100 shadow-2xs">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                      Assigned Risk Severity
                    </span>
                    <div className="mt-1">
                      <SeverityBadge severity={state.aiAnalysis.suggestedSeverity} size="sm" />
                    </div>
                  </div>

                  <div className="bg-white p-3.5 rounded-xl border border-sky-100 shadow-2xs">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                      Confidence Score
                    </span>
                    <p className="text-sm font-bold text-sky-950 mt-1">
                      {Math.round(state.aiAnalysis.confidenceScore * 100)}% Match
                    </p>
                  </div>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-sky-100 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">
                    AI Inspection Reasoning
                  </span>
                  <p className="text-xs text-sky-900 italic">
                    "{state.aiAnalysis.aiReasoning}"
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500">Generating AI triage analysis...</p>
            )}
          </div>
        )}

        {/* Step 7: Similar Issues / Duplicate Check */}
        {currentStep === 7 && (
          <div className="space-y-5">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <GitMerge className="w-5 h-5 text-indigo-700" /> Step 7: Duplicate Candidate Check
                </h2>
                <p className="text-xs text-slate-500">
                  Scanned nearby complaints within 50m to prevent duplicate ticket clutter.
                </p>
              </div>
              <DemoBadge label="Geospatial Check" />
            </div>

            {state.duplicates.length > 0 ? (
              <div className="space-y-4">
                <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded-xl font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                  Possible Existing Issue Found nearby! Support the existing report to boost priority or create a new ticket.
                </div>

                {state.duplicates.map((dup) => (
                  <div
                    key={dup.candidateIssueId}
                    className="p-4 bg-white border border-indigo-200 rounded-xl space-y-3 shadow-xs"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-mono font-bold text-slate-400">
                          ID: {dup.candidateIssueId}
                        </span>
                        <h4 className="text-xs font-bold text-slate-900 mt-0.5">
                          {dup.candidateTitle}
                        </h4>
                      </div>
                      <span className="px-2.5 py-0.5 text-[11px] font-bold bg-indigo-100 text-indigo-800 rounded border border-indigo-200">
                        {dup.similarityScore}% Similar ({dup.distanceMeters}m away)
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded">
                      Reason: {dup.reason}
                    </p>

                    <div className="flex gap-3 pt-1">
                      <button
                        type="button"
                        onClick={() => navigate('/citizen/issues')}
                        className="px-4 py-2 bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5"
                      >
                        <ThumbsUp className="w-3.5 h-3.5" /> Support Existing Issue
                      </button>
                      <button
                        type="button"
                        onClick={handleNext}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg transition-colors"
                      >
                        Create New Separate Issue
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl text-center space-y-1">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                <h4 className="text-xs font-bold text-slate-900">No Nearby Duplicates Found</h4>
                <p className="text-xs text-slate-500">
                  Your report appears to be a unique grievance in this location.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Step 8: Final Review & Submit */}
        {currentStep === 8 && (
          <div className="space-y-6">
            {state.trackingNumber ? (
              /* Success Screen */
              <div className="p-8 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-4 shadow-sm">
                <div className="w-16 h-16 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto shadow-md">
                  <ShieldCheck className="w-8 h-8" />
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                    Official Ticket Generated
                  </span>
                  <h2 className="text-2xl font-extrabold text-slate-900">
                    {state.trackingNumber}
                  </h2>
                  <p className="text-xs text-slate-600 max-w-md mx-auto">
                    Your complaint has been logged in the official municipal system and routed to Ward H/West authorities.
                  </p>
                </div>

                <div className="pt-2 flex justify-center gap-3">
                  <Link
                    to={`/citizen/issues/${state.submittedIssueId}`}
                    className="px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold rounded-lg shadow-sm transition-colors"
                  >
                    View Live Ticket Progress
                  </Link>
                  <Link
                    to="/citizen"
                    className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg transition-colors"
                  >
                    Back to Dashboard
                  </Link>
                </div>
              </div>
            ) : (
              /* Summary Review Screen */
              <div className="space-y-5">
                <div className="border-b border-slate-100 pb-3">
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-blue-700" /> Step 8: Review & Submit Summary
                  </h2>
                  <p className="text-xs text-slate-500">
                    Confirm complaint parameters before submitting to municipal authority queue.
                  </p>
                </div>

                <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-3 text-xs">
                  <div className="flex justify-between border-b border-slate-200 pb-2">
                    <span className="text-slate-500">Category:</span>
                    <span className="font-bold text-slate-900">{state.category}</span>
                  </div>

                  <div className="flex justify-between border-b border-slate-200 pb-2">
                    <span className="text-slate-500">Address:</span>
                    <span className="font-semibold text-slate-900">{state.address} ({state.ward})</span>
                  </div>

                  <div className="border-b border-slate-200 pb-2 space-y-1">
                    <span className="text-slate-500 block">Description:</span>
                    <p className="text-slate-800 bg-white p-2 rounded border border-slate-100">
                      "{state.description}"
                    </p>
                  </div>

                  {state.imageUrl && (
                    <div className="flex items-center gap-3 pt-1">
                      <span className="text-slate-500">Attached Image:</span>
                      <img
                        src={getImageUrl(state.imageUrl)}
                        onError={handleImageError}
                        alt="Summary preview"
                        className="w-16 h-12 object-cover rounded border border-slate-300"
                      />
                    </div>
                  )}
                </div>

                <div className="pt-3 flex justify-end">
                  <button
                    type="button"
                    onClick={handleSubmitReport}
                    disabled={submitting}
                    className="px-6 py-3 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    {submitting ? 'Creating Official Ticket...' : 'Confirm & Submit Report'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step Navigation Bar */}
        {currentStep < 8 && !state.trackingNumber && (
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={handleBack}
              disabled={currentStep === 1}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 disabled:opacity-40"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>

            <button
              type="button"
              onClick={handleNext}
              disabled={!canGoNext()}
              className="px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-1 disabled:opacity-40"
            >
              Next Step <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
