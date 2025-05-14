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
    charisma: number;
    dumbness: number;
    single: number;
    total: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

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
      const charisma = Math.floor(Math.random() * 100);
      const dumbness = Math.floor(Math.random() * 100);
      const single = Math.floor(Math.random() * 100);
      const total = Math.floor((charisma * 0.4 + (100 - dumbness) * 0.3 + single * 0.3) * 0.8 + Math.random() * 20);

      setScores({
        charisma,
        dumbness,
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-purple-900 flex flex-col items-center justify-center p-4">
      <header className="mb-8 text-center">
        <h1 className="text-5xl font-bold text-white mb-2">Fund Score</h1>
        <p className="text-blue-200 text-lg md:text-xl max-w-xs md:max-w-md mx-auto">Do you look fundable enough? Let's find out!</p>
      </header>

      <main className="w-full max-w-4xl bg-white/10 backdrop-blur-md rounded-2xl shadow-xl overflow-hidden">
        <div className="grid md:grid-cols-2 gap-4 p-6">
          <div className="bg-black/20 rounded-xl overflow-hidden">
            {error ? (
              <div className="flex flex-col items-center justify-center h-[350px] bg-gray-900 p-4 text-white">
                <div className="text-red-400 text-4xl mb-3">😕</div>
                <p className="text-center font-semibold mb-2">Camera Error</p>
                <p className="text-center mb-4">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            ) : (
              <div className="relative h-[350px] bg-gray-900">
                {isLoading && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-gray-900">
                    <div className="spinner mb-4"></div>
                    <p className="text-white">{message}</p>
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
                {!isLoading && (
                  <div className="absolute bottom-0 left-0 right-0 p-4 text-center bg-gradient-to-t from-black/70 to-transparent">
                    <p className="text-2xl text-white font-medium">{message}</p>
                    <p className="text-sm text-blue-200 mt-1">{subMessage}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-col justify-center items-center">
            {scores ? (
              <div className="h-full w-full flex flex-col justify-center items-center p-4">
                <div className="text-center mb-6">
                  <h2 className="text-3xl font-bold text-white mb-3">Your Fundability Score</h2>
                  <div className="text-7xl font-bold text-white mb-2">{scores.total}</div>
                  <p className="text-xl text-blue-300 mb-6">
                    {scores.total >= 80 ? "VC Material! You're fundable!" :
                     scores.total >= 60 ? "Good potential for funding" :
                     scores.total >= 40 ? "You might get a small investment" :
                     "Maybe try bootstrapping instead"}
                  </p>

                  <div className="grid grid-cols-3 gap-3 mt-4">
                    <div className="bg-white/10 p-3 rounded-lg">
                      <div className="text-lg font-semibold text-white">Charisma</div>
                      <div className="text-2xl text-green-400">{scores.charisma}</div>
                    </div>
                    <div className="bg-white/10 p-3 rounded-lg">
                      <div className="text-lg font-semibold text-white">Dumbness</div>
                      <div className="text-2xl text-red-400">{scores.dumbness}</div>
                    </div>
                    <div className="bg-white/10 p-3 rounded-lg">
                      <div className="text-lg font-semibold text-white">Single</div>
                      <div className="text-2xl text-blue-400">{scores.single}</div>
                    </div>
                  </div>

                  <button
                    onClick={startAnalysis}
                    className="mt-6 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                  >
                    Analyze Again
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full">
                <div className="text-center text-white">
                  <p className="text-2xl mb-4">Looking for your face...</p>
                  <p className="text-sm opacity-70">Position yourself in front of the camera</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="mt-6 text-blue-200 text-sm text-center">
        <p className="md:w-[600px] mx-auto whitespace-normal md:whitespace-nowrap">
          This app is for entertainment purposes only. But you should take it seriously.
        </p>
      </footer>
    </div>
  );
}

export default App;
