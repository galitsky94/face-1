import React, { useState, useEffect, useRef } from 'react';
import * as faceapi from 'face-api.js';

function App() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [message, setMessage] = useState("Requesting camera access...");
  const [subMessage, setSubMessage] = useState("Position yourself in front of the camera");
  const [scores, setScores] = useState<{
    charismatic: number;
    dumb: number;
    single: number;
    total: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // For demo purposes - start in analyzing mode immediately
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!scores && !isAnalyzing && !isLoading) {
        startAnalysis();
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [isLoading, isAnalyzing, scores]);

  // Initialize webcam and face detection
  useEffect(() => {
    let stream: MediaStream | null = null;

    const initCamera = async () => {
      try {
        // Request camera access
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: "user"
          },
          audio: false
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play();
          };
        }

        setMessage("Loading face detection...");

        // Load face detection models
        const MODEL_URL = '/models';
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL)
        ]);

        setMessage("Face detection ready");
        setIsLoading(false);

        // Start analysis immediately
        startAnalysis();
      } catch (err: any) {
        console.error("Camera initialization error:", err);
        setError(`Camera access denied or not available. ${err.message || 'Unknown error'}`);
        setIsLoading(false);
      }
    };

    initCamera();

    // Cleanup function
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Run face detection
  useEffect(() => {
    if (!videoRef.current || !canvasRef.current || isLoading || error) return;

    let detectionInterval: number;

    const runFaceDetection = async () => {
      if (!videoRef.current || !canvasRef.current) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;

      // Match canvas dimensions to video
      const displaySize = {
        width: video.videoWidth || video.clientWidth,
        height: video.videoHeight || video.clientHeight
      };

      faceapi.matchDimensions(canvas, displaySize);

      try {
        // Detect faces
        const detections = await faceapi.detectAllFaces(
          video,
          new faceapi.TinyFaceDetectorOptions({ scoreThreshold: 0.5 })
        ).withFaceLandmarks();

        // Resize detection results to match display size
        const resizedDetections = faceapi.resizeResults(detections, displaySize);

        // Clear canvas and draw results
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          // Draw face detection results
          faceapi.draw.drawDetections(canvas, resizedDetections);
          faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
        }
      } catch (err) {
        console.error("Face detection error:", err);
      }
    };

    // Run face detection at 10 fps
    detectionInterval = window.setInterval(runFaceDetection, 100);

    return () => {
      clearInterval(detectionInterval);
    };
  }, [isLoading, error]);

  // Handle analysis process
  useEffect(() => {
    if (!isAnalyzing || isLoading || error) return;

    const analyzeMessages = [
      "Analyzing facial symmetry...",
      "Measuring VC appeal...",
      "Calculating charisma quotient...",
      "Checking founder potential...",
      "Evaluating funding potential..."
    ];

    let messageIndex = 0;
    const messageInterval = setInterval(() => {
      setMessage(analyzeMessages[messageIndex % analyzeMessages.length]);
      messageIndex++;
    }, 800);

    // Generate random scores after 3 seconds
    const scoreTimer = setTimeout(() => {
      // Generate random scores
      const charismatic = Math.floor(Math.random() * 100);
      const dumb = Math.floor(Math.random() * 100);
      const single = Math.floor(Math.random() * 100);
      const total = Math.floor((charismatic * 0.4 + (100 - dumb) * 0.3 + single * 0.3) * 0.8 + Math.random() * 20);

      setScores({
        charismatic,
        dumb,
        single,
        total: Math.min(100, total)
      });

      setIsAnalyzing(false);
      clearInterval(messageInterval);
    }, 3000);

    return () => {
      clearInterval(messageInterval);
      clearTimeout(scoreTimer);
    };
  }, [isAnalyzing, isLoading, error]);

  // Start analysis
  const startAnalysis = () => {
    setScores(null);
    setIsAnalyzing(true);
    setMessage("Looking for your face...");
  };

  // Progress bar component
  const ProgressBar = ({ attribute, value }: { attribute: string; value: number }) => {
    // Calculate color based on value (red for low, green for high - except Dumb which is reversed)
    const getColorClass = () => {
      const isReversed = attribute === "Dumb";
      const normalizedValue = isReversed ? 100 - value : value;

      if (normalizedValue < 30) return "bg-red-500";
      if (normalizedValue < 50) return "bg-orange-400";
      if (normalizedValue < 70) return "bg-yellow-400";
      return "bg-green-500";
    };

    return (
      <div className="mb-4">
        <div className="flex justify-between items-center mb-1">
          <span className="text-base text-white">{attribute}</span>
          <span className="text-3xl font-bold text-white">
            {value}
          </span>
        </div>
        <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-1000 ${getColorClass()}`}
            style={{ width: `${value}%` }}
          ></div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-purple-900 flex flex-col items-center justify-center p-4">
      <header className="mb-6 text-center">
        <h1 className="text-4xl font-bold text-white mb-2">Fund Score</h1>
        <p className="text-blue-200 text-lg max-w-xs md:max-w-md mx-auto">Do you look fundable enough? Let's find out!</p>
      </header>

      <main className="w-full max-w-4xl rounded-xl overflow-hidden grid grid-cols-1 md:grid-cols-2 shadow-xl">
        <div className="rounded-tl-xl rounded-bl-xl overflow-hidden">
          {error ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[350px] bg-gray-900 p-4 text-white">
              <div className="text-red-400 text-xl mb-2">😕</div>
              <p className="text-center font-semibold text-sm mb-1">Camera Error</p>
              <p className="text-center text-xs mb-3">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-3 py-1 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : (
            <div className="relative min-h-[350px] bg-gray-900">
              {isLoading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-gray-900">
                  <div className="spinner mb-3"></div>
                  <p className="text-white text-sm">{message}</p>
                </div>
              )}
              <video
                ref={videoRef}
                className="absolute inset-0 w-full h-full object-cover"
                playsInline
                muted
              />
              <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full"
              />
              {isAnalyzing && !isLoading && (
                <div className="scan-container pointer-events-none absolute inset-0 z-30">
                  <div className="scan-line"></div>
                  <div className="scan-corners">
                    <span></span>
                  </div>
                </div>
              )}
              {!isLoading && (
                <div className="absolute bottom-0 left-0 right-0 p-2 text-center bg-gradient-to-t from-black/70 to-transparent">
                  {isAnalyzing && (
                    <>
                      <p className="text-base text-white font-medium">{message}</p>
                      <p className="text-xs text-blue-200 mt-1">{subMessage}</p>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col justify-center bg-indigo-900 rounded-tr-xl rounded-br-xl p-6 min-h-[350px]">
          {scores ? (
            <div className="h-full w-full flex flex-col justify-center">
              <div className="mb-6">
                <div className="flex justify-between items-center mb-1">
                  <h2 className="text-base font-bold text-white">Your Fundability Score</h2>
                  <div className="text-4xl font-bold text-white">{scores.total}</div>
                </div>
                <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-1000 ${scores.total >= 70 ? 'bg-green-500' : scores.total >= 50 ? 'bg-yellow-400' : 'bg-red-500'}`}
                    style={{ width: `${scores.total}%` }}
                  ></div>
                </div>
                <p className="text-sm text-blue-300 mt-2">
                  {scores.total >= 80 ? "VC Material! You're fundable!" :
                   scores.total >= 60 ? "Good potential for funding" :
                   scores.total >= 40 ? "You might get a small investment" :
                   "Maybe try bootstrapping instead"}
                </p>
              </div>

              <div className="w-full">
                <ProgressBar attribute="Charismatic" value={scores.charismatic} />
                <ProgressBar attribute="Dumb" value={scores.dumb} />
                <ProgressBar attribute="Single" value={scores.single} />
              </div>

              <button
                onClick={startAnalysis}
                className="mt-4 px-4 py-2 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700 transition-colors self-center"
              >
                Scan Again
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="text-center text-white">
                <p className="text-base mb-2">Looking for your face...</p>
                <p className="text-xs opacity-70">Position yourself in front of the camera</p>
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="mt-4 text-blue-200 text-xs text-center">
        <p className="md:w-[400px] mx-auto whitespace-normal md:whitespace-nowrap">
          This app is for entertainment purposes only. But you should take it seriously.
        </p>
      </footer>

      {/* Scanning animation styles */}
      <style>{`
        .spinner {
          border: 4px solid #4f46e5;
          border-top: 4px solid #fff;
          border-radius: 50%;
          width: 36px;
          height: 36px;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          0% { transform: rotate(0deg);}
          100% { transform: rotate(360deg);}
        }
        .scan-container {
          position: absolute;
          inset: 0;
          overflow: hidden;
          pointer-events: none;
        }
        .scan-line {
          position: absolute;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, rgba(99, 102, 241, 0.2) 0%, rgba(99, 102, 241, 0.8) 20%, rgba(167, 139, 250, 0.9) 50%, rgba(99, 102, 241, 0.8) 80%, rgba(99, 102, 241, 0.2) 100%);
          border-radius: 2px;
          animation: scan-move 2s linear infinite;
          z-index: 2;
          box-shadow: 0 0 5px rgba(167, 139, 250, 0.8);
        }
        @keyframes scan-move {
          0% { top: 5%; opacity: 0.6;}
          10% { opacity: 0.9;}
          50% { top: 95%; opacity: 0.9;}
          90% { opacity: 0.9;}
          100% { top: 5%; opacity: 0.6;}
        }
        .scan-corners {
          position: absolute;
          left: 5%;
          right: 5%;
          top: 5%;
          bottom: 5%;
          z-index: 1;
          pointer-events: none;
        }
        .scan-corners span {
          display: block;
          width: 100%;
          height: 100%;
          border: 3px solid rgba(167, 139, 250, 0.6);
          border-radius: 10px;
          box-sizing: border-box;
          box-shadow: 0 0 10px rgba(99, 102, 241, 0.3) inset;
        }
      `}</style>
    </div>
  );
}

export default App;
