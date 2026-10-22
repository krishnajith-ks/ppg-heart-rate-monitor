import { useState, useRef } from 'react';
import { usePpgSampler } from './hooks/usePpgSampler';
import { LandingPage } from './components/LandingPage';
import { DashboardView } from './components/DashboardView';

export function App() {
  const {
    state,
    videoRef,
    canvasRef,
    startCamera,
    stopCapture,
    toggleTorch,
    loadVideoFile,
    startSyntheticSimulation,
    setChannel
  } = usePpgSampler();

  const [view, setView] = useState<'landing' | 'dashboard'>('landing');
  const clickCountRef = useRef(0);
  const timerRef = useRef<number | null>(null);

  // 6-click easter egg trigger handler
  const handleSecretTriggerClick = () => {
    clickCountRef.current++;
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
    }
    timerRef.current = window.setTimeout(() => {
      clickCountRef.current = 0;
    }, 3000);

    if (clickCountRef.current >= 6) {
      setView('dashboard');
      clickCountRef.current = 0;
    }
  };

  const handleStartCameraFromLanding = () => {
    setView('dashboard');
    startCamera();
  };

  const handleUploadVideoFromLanding = (file: File) => {
    setView('dashboard');
    loadVideoFile(file);
  };

  return (
    <div>
      {/* Hidden processing video element - kept mounted across view switches */}
      <video
        ref={videoRef}
        playsInline
        muted
        style={{ display: 'none' }}
      />

      {view === 'landing' ? (
        <LandingPage
          currentBpm={state.currentBpm}
          isCapturing={state.isCapturing}
          consensus={state.consensus}
          onStartCamera={handleStartCameraFromLanding}
          onUploadVideo={handleUploadVideoFromLanding}
          onSecretTriggerClick={handleSecretTriggerClick}
        />
      ) : (
        <DashboardView
          canvasRef={canvasRef}
          currentChannel={state.channel}
          onSelectChannel={setChannel}
          isCapturing={state.isCapturing}
          sourceType={state.sourceType}
          torchSupported={state.torchSupported}
          torchActive={state.torchActive}
          statusMessage={state.statusMessage}
          consensus={state.consensus}
          rawBuffer={state.rawBuffer}
          filteredBuffer={state.filteredBuffer}
          fftSpectrum={state.fftSpectrum}
          peakIndices={state.peakIndices}
          onStartCamera={startCamera}
          onStopCapture={stopCapture}
          onToggleTorch={toggleTorch}
          onUploadFile={loadVideoFile}
          onStartSimulation={startSyntheticSimulation}
          onBackToLanding={() => setView('landing')}
          onSecretTriggerClick={handleSecretTriggerClick}
        />
      )}
    </div>
  );
}

export default App;
