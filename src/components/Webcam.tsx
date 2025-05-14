import { useRef, useEffect, useState } from 'react';
import * as faceapi from 'face-api.js';

interface WebcamProps {
  onAnalysisComplete: (attributes: {
    charismatic: number;
    dumb: number;
    single: number;
    total: number;
  }) => void;
  isAnalyzing: boolean;
  onAnalysisStart: () => void;
}

const Webcam = ({ onAnalysisComplete, isAnalyzing, onAnalysisStart }: WebcamProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState("Initializing...");

  // Step 1: Set up the webcam
  useEffect(() => {
    const setupCamera = async () => {
      try {
        setMessage("Requesting camera access...");

        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error("Your browser doesn't support webcam access");
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: "user"
          },
          audio: false
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;

          // Wait for video to be ready
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play().catch(e => {
              console.error("Failed to play video:", e);
              setError("Failed to start video stream");
            });
          };

          videoRef.current.onplaying = () => {
            console.log("Camera is playing and ready");
            setIsCameraReady(true);
            setMessage("Camera ready");
          };
        }
      } catch (err: any) {
        console.error("Camera initialization error:", err);
        setError(`Camera access denied or not available. ${err.message || 'Unknown error'}`);
      }
    };

    setupCamera();

    // Cleanup function
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        const tracks = stream.getTracks();

        tracks.forEach(track => {
          track.stop();
        });
      }
    };
  }, []);

  // Step 2: Load the face detection models
  useEffect(() => {
    const loadModels = async () => {
      try {
        setMessage("Loading face detection models...");

        // Specify model path
        const MODEL_URL = '/models';

        // Load the required face-api.js models
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL)
        ]);

        console.log("Face detection models loaded successfully");
        setIsModelLoaded(true);
        setMessage("Face detection ready");
      } catch (err: any) {
        console.error("Error loading face detection models:", err);
        setError(`Failed to load face detection models: ${err.message || 'Unknown error'}`);
      }
    };

    loadModels();
  }, []);

  // Step 3: Use face detection when analyzing
  useEffect(() => {
    if (!isAnalyzing || !isCameraReady || !isModelLoaded || !videoRef.current || error) {
      return;
    }

    const video = videoRef.current;

    // Update analysis messages
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

    // Set up face detection
    let detectionInterval: number;

    const runFaceDetection = async () => {
      if (!videoRef.current || !canvasRef.current) return;

      const videoEl = videoRef.current;
      const canvas = canvasRef.current;

      // Match canvas dimensions to video
      const displaySize = {
        width: videoEl.width || videoEl.clientWidth,
        height: videoEl.height || videoEl.clientHeight
      };

      faceapi.matchDimensions(canvas, displaySize);

      try {
        // Detect faces
        const detections = await faceapi.detectAllFaces(
          videoEl,
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

          // Add detection box with label
          if (resizedDetections.length > 0) {
            const detection = resizedDetections[0];
            ctx.strokeStyle = '#4CAF50';
            ctx.lineWidth = 2;
            ctx.strokeRect(
              detection.detection.box.x,
              detection.detection.box.y,
              detection.detection.box.width,
              detection.detection.box.height
            );

            // Add label
            ctx.font = '16px Arial';
            ctx.fillStyle = '#4CAF50';
            ctx.fillText(
              'Face Detected',
              detection.detection.box.x,
              detection.detection.box.y - 5
            );
          }
        }
      } catch (err) {
        console.error("Face detection error:", err);
      }
    };

    // Run face detection
    detectionInterval = window.setInterval(runFaceDetection, 150);

    // Generate random scores after 3 seconds
    const scoreTimer = setTimeout(() => {
      // Generate random scores with constraints
      // 1. Dumb: never over 60
      const dumb = Math.floor(Math.random() * 61); // 0-60

      // 2. Charismatic: never below 40
      const charismatic = Math.floor(Math.random() * 61) + 40; // 40-100

      // 3. Single: either below 20 or over 80
      const single = Math.random() < 0.5
        ? Math.floor(Math.random() * 21)  // 0-20
        : Math.floor(Math.random() * 21) + 80; // 80-100

      // Calculate raw score
      const rawScore = (charismatic * 0.4 + (100 - dumb) * 0.3 + single * 0.3);

      // Map raw score to one of three ranges
      let total;
      if (rawScore < 40) {
        // Low range (below 30)
        total = Math.floor(Math.random() * 30);
      } else if (rawScore < 70) {
        // Medium range (40-60)
        total = Math.floor(Math.random() * 21) + 40;
      } else {
        // High range (70-90)
        total = Math.floor(Math.random() * 21) + 70;
      }

      onAnalysisComplete({
        charismatic,
        dumb,
        single,
        total
      });

      clearInterval(messageInterval);
      clearInterval(detectionInterval);
    }, 3000);

    return () => {
      clearInterval(messageInterval);
      clearInterval(detectionInterval);
      clearTimeout(scoreTimer);
    };
  }, [isAnalyzing, isCameraReady, isModelLoaded, error, onAnalysisComplete]);

  // Show loading/error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[350px] bg-gray-900 p-4 text-white rounded-xl">
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
    );
  }

  // Everything is ready, show the webcam
  return (
    <div className="relative bg-gray-900 rounded-xl overflow-hidden h-[350px]">
      {(!isCameraReady || !isModelLoaded) ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 text-white z-10">
          <div className="spinner mb-3"></div>
          <p className="text-center text-sm">{message}</p>
        </div>
      ) : null}

      <div className="relative h-full w-full">
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          width="640"
          height="480"
          muted
          playsInline
        />

        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full z-10"
          width="640"
          height="480"
        />

        {isAnalyzing && isCameraReady && isModelLoaded && (
          <>
            <div className="scan-container">
              <div className="scan-line"></div>
              <div className="scan-corners">
                <span></span>
              </div>
            </div>
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-40 z-20">
              <p className="text-base text-white mb-2 pulse-opacity">
                {message}
              </p>
              {/* Removing the "Position yourself in front of the camera" text */}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Webcam;
