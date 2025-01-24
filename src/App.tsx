import React, { useState, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { PlusCircle, Building2, Presentation, FileText, CheckCircle, Sparkles } from 'lucide-react';
import { Logo } from './components/Logo';
import { FormData, Recording, UploadProgress, FormType } from './types';
import FormField from './components/FormField';
import RecordingField from './components/RecordingField';
import { uploadToS3 } from './lib/s3';
import { submitToWebhook } from './lib/webhook';

function App() {
  const [activeTab, setActiveTab] = useState<FormType>('sales');
  
  const getInitialFormData = (tab: FormType): FormData => ({
    fullName: '',
    email: '',
    recordings: [{
      id: '1',
      file: null,
      inputType: 'file',
      timestamp_notes: '',
      clientName: '',
      interactionDate: new Date().toISOString().split('T')[0],
      strengths: tab === 'sales' ? '' : 'Brand consistency, Visual appeal, Message clarity',
      improvements: tab === 'sales' ? '' : 'Target audience focus, Call-to-action placement, Content hierarchy'
    }],
    formType: tab
  });

  const [formData, setFormData] = useState<FormData>(() => getInitialFormData(activeTab));
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const validateForm = () => {
    const newErrors: Partial<FormData> = {};
    
    // Common validations
    if (!formData.fullName) {
      newErrors.fullName = 'Full name is required';
    }
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    // Validate each recording
    const recordingErrors = formData.recordings.map(recording => {
      const errors: any = {};
      
      if (!recording.clientName.trim()) {
        errors.clientName = activeTab === 'sales' ? 
          'Client name is required' : 
          'Document name is required';
      }
      
      if (activeTab === 'sales') {
        if (!recording.strengths.trim()) {
          errors.strengths = 'Strengths are required';
        }
        
        if (!recording.improvements.trim()) {
          errors.improvements = 'Areas for improvement are required';
        }
      }
      
      if (!recording.file && !recording.inputUrl) {
        errors.file = 'A recording is required';
      }
      
      return errors;
    });
    
    if (recordingErrors.some(errors => Object.keys(errors).length > 0)) {
      newErrors.recordings = [];
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      // Upload all recordings first and collect their URLs
      const uploadedRecordings: Recording[] = [];
      
      for (const recording of formData.recordings) {
        if (recording.inputType === 'file' && recording.file) {
          const sanitizedFileName = recording.file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
          const folder = activeTab === 'sales' ? 'recordings' : 'marketing';
          const key = `${folder}/${Date.now()}-${sanitizedFileName}`;
          const url = await uploadToS3(
            recording.file,
            key,
            (progress) => {
              setUploadProgress(prev => ({
                ...prev,
                [recording.id]: progress
              }));
            }
          );
          uploadedRecordings.push({
            ...recording,
            url,
            inputType: 'file'
          });
        } else if (recording.inputType === 'url' && recording.inputUrl) {
          uploadedRecordings.push({
            ...recording,
            url: recording.inputUrl
          });
        }
      }

      // Only make one webhook submission with all recordings
      await submitToWebhook({
        ...formData,
        strengths: activeTab === 'sales' ? formData.strengths : undefined,
        improvements: activeTab === 'sales' ? formData.improvements : undefined,
        recordings: uploadedRecordings,
        formType: activeTab,
        submissionDate: new Date().toISOString()
      });
    
      // Trigger confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });

      setShowSuccess(true);
      
      // Hide the form temporarily
      const formElement = document.querySelector('form');
      if (formElement) {
        formElement.style.opacity = '0';
        formElement.style.transform = 'scale(0.95)';
        formElement.style.transition = 'all 0.5s ease-out';
      }

      // Reset after celebration
      setTimeout(() => {
        setShowSuccess(false);
        setIsSubmitting(false);
        setFormData(getInitialFormData(activeTab));
        setUploadProgress({});
        
        // Show the form again
        if (formElement) {
          formElement.style.opacity = '1';
          formElement.style.transform = 'scale(1)';
        }
      }, 3000);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Upload Error:', errorMessage);
      alert(`Submission failed: ${errorMessage}. Please try again.`);
      setIsSubmitting(false);
    }
  };

  const addRecording = useCallback(() => {
    setFormData(prev => ({
      ...prev,
      recordings: [
        ...prev.recordings,
        {
          id: String(prev.recordings.length + 1),
          file: null,
          inputType: 'file',
          timestamp_notes: '',
          clientName: '',
          interactionDate: new Date().toISOString().split('T')[0],
          strengths: activeTab === 'sales' ? '' : 'Brand consistency, Visual appeal, Message clarity',
          improvements: activeTab === 'sales' ? '' : 'Target audience focus, Call-to-action placement, Content hierarchy'
        }
      ]
    }));
  }, []);

  const updateRecording = useCallback((index: number, recording: Recording) => {
    setFormData(prev => ({
      ...prev,
      recordings: prev.recordings.map((r, i) => i === index ? recording : r)
    }));
  }, []);

  const removeRecording = useCallback((index: number) => {
    setFormData(prev => ({
      ...prev,
      recordings: prev.recordings.filter((_, i) => i !== index)
    }));
  }, []);

  return (
    <div className="min-h-screen">
      <div className="sticky top-0 z-50 bg-gray-900/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <h1 className="text-xl font-bold tracking-tight flex items-center justify-center sm:justify-start">
            <Logo className="w-6 h-6 mr-2 text-blue-400" />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 animate-gradient">
              SalesGenius GameTape
            </span>
            <span className="ml-3 text-sm font-medium text-gray-400 hidden sm:inline border-l border-gray-700 pl-3">
              Submission Portal
            </span>
          </h1>
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 via-indigo-600/5 to-purple-600/5 pointer-events-none" />
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <div
            onClick={() => setActiveTab('sales')}
            className={`relative group cursor-pointer rounded-xl p-4 transition-all duration-300
              ${activeTab === 'sales'
                ? 'bg-blue-600/20 border-2 border-blue-400 shadow-[0_0_15px_0_rgba(59,130,246,0.5)]'
                : 'bg-gray-900/50 border-2 border-transparent hover:border-blue-500/10 hover:bg-gray-900/60'}
              backdrop-blur-sm`}
          >
            <div className="flex items-center space-x-4">
              <div className={`p-3 rounded-lg transition-all duration-300
                ${activeTab === 'sales'
                  ? 'bg-blue-400 text-white shadow-lg shadow-blue-500/50'
                  : 'bg-blue-900/50 text-blue-400 group-hover:bg-blue-800/50'}`}>
                <Presentation className="w-6 h-6" />
              </div>
              <div>
                <h3 className={`font-semibold transition-colors duration-300
                  ${activeTab === 'sales' ? 'text-white' : 'text-gray-200'}`}>
                  Sales Recordings
                </h3>
                <p className="text-sm text-gray-300 mt-1">
                  Upload call recordings for review and feedback
                </p>
              </div>
            </div>
            {activeTab === 'sales' && (
              <div className="absolute -inset-px bg-blue-400/10 rounded-xl pointer-events-none animate-pulse" />
            )}
          </div>

          <div
            onClick={() => setActiveTab('marketing')}
            className={`relative group cursor-pointer rounded-xl p-4 transition-all duration-300
              ${activeTab === 'marketing'
                ? 'bg-blue-600/20 border-2 border-blue-400 shadow-[0_0_15px_0_rgba(59,130,246,0.5)]'
                : 'bg-gray-900/50 border-2 border-transparent hover:border-blue-500/10 hover:bg-gray-900/60'}
              backdrop-blur-sm`}
          >
            <div className="flex items-center space-x-4">
              <div className={`p-3 rounded-lg transition-all duration-300
                ${activeTab === 'marketing'
                  ? 'bg-blue-400 text-white shadow-lg shadow-blue-500/50'
                  : 'bg-blue-900/50 text-blue-400 group-hover:bg-blue-800/50'}`}>
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h3 className={`font-semibold transition-colors duration-300
                  ${activeTab === 'marketing' ? 'text-white' : 'text-gray-200'}`}>
                  Marketing Materials
                </h3>
                <p className="text-sm text-gray-300 mt-1">
                  Submit documents and presentations for review
                </p>
              </div>
            </div>
            {activeTab === 'marketing' && (
              <div className="absolute -inset-px bg-blue-400/10 rounded-xl pointer-events-none animate-pulse" />
            )}
          </div>
        </div>

        <div className="mb-8 p-4 bg-gray-900/50 border border-white/10 rounded-lg backdrop-blur-sm">
          <p className="text-white text-sm">
            {activeTab === 'sales' ? (
              <>Submit your sales call recordings for review in the next Gametappe session. We'll analyze your conversations to help improve conversion rates.</>
            ) : (
              <>Upload marketing materials like PDFs, presentations, or other documents for review and feedback from the team.</>
            )}
          </p>
        </div>

        {showSuccess && (
          <div className="success-overlay">
            <div className="success-content">
              <CheckCircle className="success-icon" />
              <h2 className="text-4xl font-bold text-white mb-4" style={{ animation: 'slideUp 0.6s ease-out 0.3s forwards', opacity: 0 }}>
                Success! 🎉
              </h2>
              <p className="text-xl text-white/90 mb-6" style={{ animation: 'slideUp 0.6s ease-out 0.4s forwards', opacity: 0 }}>
                Your {activeTab === 'sales' ? 'recordings' : 'materials'} have been uploaded
              </p>
              <div className="flex items-center justify-center space-x-2" style={{ animation: 'slideUp 0.6s ease-out 0.5s forwards', opacity: 0 }}>
                <Sparkles className="w-5 h-5 text-yellow-300" />
                <p className="text-white/80">
                  We'll review your submission and get back to you soon
                </p>
                <Sparkles className="w-5 h-5 text-yellow-300" />
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-6">
            {formData.recordings.map((recording, index) => (
              <div key={recording.id} className="glass-card">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <FormField 
                    label={activeTab === 'sales' ? 'Client/Lead Name' : 'Document / Asset Name'} 
                    required 
                    error={errors.recordings?.[index]?.clientName}
                  >
                    <input
                      type="text"
                      value={recording.clientName}
                      onChange={e => updateRecording(index, { ...recording, clientName: e.target.value })}
                      className="form-input"
                      placeholder={activeTab === 'sales' ? 'Jane Smith' : 'Q4 Sales Deck'}
                    />
                  </FormField>

                  <FormField label={activeTab === 'sales' ? 'Date of Interaction' : 'Content Creation Date'}>
                    <input
                      type="date"
                      value={recording.interactionDate}
                      onChange={e => updateRecording(index, { ...recording, interactionDate: e.target.value })}
                      className="form-input"
                    />
                  </FormField>
                </div>

                <RecordingField
                  recording={recording}
                  activeTab={activeTab}
                  onUpdate={(updated) => updateRecording(index, updated)}
                  onRemove={() => removeRecording(index)}
                  progress={uploadProgress[recording.id]}
                  showRemove={formData.recordings.length > 1}
                  placeholder={activeTab === 'sales' ? 
                    "https://example.com/recording.mp3" : 
                    "https://example.com/presentation.pdf"}
                />

                {activeTab === 'sales' && (
                  <div className="space-y-4">
                    <FormField 
                      label="Strengths Demonstrated"
                      required 
                      error={errors.recordings?.[index]?.strengths}
                    >
                      <textarea
                        value={recording.strengths}
                        onChange={e => updateRecording(index, { ...recording, strengths: e.target.value })}
                        className="form-textarea"
                        rows={3}
                        placeholder="What went well in this interaction?"
                      />
                    </FormField>

                    <FormField 
                      label="Areas for Improvement"
                      required 
                      error={errors.recordings?.[index]?.improvements}
                    >
                      <textarea
                        value={recording.improvements}
                        onChange={e => updateRecording(index, { ...recording, improvements: e.target.value })}
                        className="form-textarea"
                        rows={3}
                        placeholder="What could be improved in the interaction?"
                      />
                    </FormField>
                  </div>
                )}
              </div>
            ))}
            
            <button
              type="button"
              onClick={addRecording}
              className="w-full flex items-center justify-center px-4 py-3 text-sm font-medium text-blue-400
                border-2 border-dashed border-blue-400/30 rounded-xl hover:bg-blue-400/5
                transition-all duration-200 hover:border-blue-400/50"
            >
              <PlusCircle className="w-5 h-5 mr-2" />
              Add Another {activeTab === 'sales' ? 'Client Recording' : 'Document'}
            </button>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 mt-8">
            <FormField label="Your Full Name" required error={errors.fullName}>
              <input
                name="fullName"
                type="text"
                value={formData.fullName}
                onChange={e => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                className="form-input"
                placeholder="John Doe"
              />
            </FormField>

            <FormField label="Email Address" required error={errors.email}>
              <input
                name="email"
                type="email"
                value={formData.email}
                onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="form-input"
                placeholder="john.doe@example.com"
              />
            </FormField>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-lg text-sm font-medium text-white
                shadow-md shadow-blue-500/10 backdrop-blur-sm
                ${isSubmitting ? 'bg-blue-400' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'}
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 
                transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200`}
            >
              {isSubmitting ? 'Uploading...' : `Submit ${activeTab === 'sales' ? 'Recordings' : 'Materials'}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default App;