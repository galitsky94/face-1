import React, { useEffect, useState } from 'react';

interface ScoreDisplayProps {
  scores: {
    charisma: number;
    dumbness: number;
    single: number;
    total: number;
  } | null;
}

const ScoreDisplay: React.FC<ScoreDisplayProps> = ({ scores }) => {
  const [animatedTotal, setAnimatedTotal] = useState(0);
  const [animatedScores, setAnimatedScores] = useState({
    charisma: 0,
    dumbness: 0,
    single: 0
  });
  const [visible, setVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (!scores) return;

    // Trigger entrance animation
    setVisible(true);

    // Animate the total score counting up
    const totalDuration = 1500; // 1.5 seconds
    const totalInterval = 20; // Update every 20ms
    const totalSteps = totalDuration / totalInterval;
    const totalIncrement = scores.total / totalSteps;

    let currentTotal = 0;
    const totalTimer = setInterval(() => {
      currentTotal += totalIncrement;
      if (currentTotal >= scores.total) {
        currentTotal = scores.total;
        clearInterval(totalTimer);

        // Show details after total score animation completes
        setTimeout(() => {
          setShowDetails(true);
        }, 500);
      }
      setAnimatedTotal(Math.round(currentTotal));
    }, totalInterval);

    // Animate individual scores (will only show after total completes)
    const attrDuration = 1000; // 1 second
    const attrInterval = 20; // Update every 20ms
    const attrSteps = attrDuration / attrInterval;

    setTimeout(() => {
      let current = { charisma: 0, dumbness: 0, single: 0 };
      const increments = {
        charisma: scores.charisma / attrSteps,
        dumbness: scores.dumbness / attrSteps,
        single: scores.single / attrSteps
      };

      const attrTimer = setInterval(() => {
        current = {
          charisma: Math.min(scores.charisma, current.charisma + increments.charisma),
          dumbness: Math.min(scores.dumbness, current.dumbness + increments.dumbness),
          single: Math.min(scores.single, current.single + increments.single)
        };

        setAnimatedScores({
          charisma: Math.round(current.charisma),
          dumbness: Math.round(current.dumbness),
          single: Math.round(current.single)
        });

        if (
          current.charisma >= scores.charisma &&
          current.dumbness >= scores.dumbness &&
          current.single >= scores.single
        ) {
          clearInterval(attrTimer);
        }
      }, attrInterval);
    }, 2000); // Start after total score animation

    return () => {
      clearInterval(totalTimer);
    };
  }, [scores]);

  if (!scores) return null;

  // Get funding verdict based on total score
  const getFundingVerdict = (score: number): string => {
    if (score >= 90) return "You're VC gold! Term sheets are being prepared as we speak.";
    if (score >= 80) return "Series A material! Investors will fight over you.";
    if (score >= 70) return "Strong seed round potential! Practice your pitch.";
    if (score >= 60) return "Angel investors will give you a chance.";
    if (score >= 50) return "You might get some friends & family funding.";
    if (score >= 40) return "Consider bootstrapping your startup.";
    if (score >= 30) return "Maybe try a different hairstyle first?";
    if (score >= 20) return "Have you considered a career in accounting?";
    return "Even your mom wouldn't invest in your startup.";
  };

  // Get attribute descriptions
  const getAttributeDescription = (name: string, score: number): string => {
    if (name === "charisma") {
      if (score >= 80) return "You could charm money from a VC's wallet!";
      if (score >= 50) return "You can hold a conversation without mentioning blockchain.";
      return "Maybe practice your elevator pitch in the mirror?";
    }

    if (name === "dumbness") {
      if (score <= 30) return "Your intelligence is showing!";
      if (score <= 60) return "Smart enough to know what you don't know.";
      return "Have you tried turning your brain off and on again?";
    }

    if (name === "single") {
      if (score >= 80) return "Fully committed to your startup!";
      if (score >= 50) return "Just enough free time for founder networking events.";
      return "Your dating life might distract from fundraising.";
    }

    return "";
  };

  // Determine color based on score
  const getScoreColor = (score: number, isInverted: boolean = false): string => {
    const highScore = isInverted ? score <= 30 : score >= 70;
    const mediumScore = isInverted ? score <= 60 : score >= 40;

    if (highScore) return "text-green-400";
    if (mediumScore) return "text-blue-300";
    return "text-red-400";
  };

  return (
    <div
      className={`h-full w-full flex flex-col justify-center items-center p-8 transition-all duration-500 transform ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}
    >
      <div className="text-center mb-8">
        <h2 className="text-4xl font-bold text-white mb-3">Your Fundability Score</h2>

        <div className="flex flex-col items-center mt-6">
          <div className="text-8xl font-bold text-white mb-2">{animatedTotal}</div>
          <div className="h-2 w-64 bg-white/20 rounded-full mt-2 mb-6">
            <div
              className="h-full bg-blue-400 rounded-full transition-all duration-1500"
              style={{ width: `${animatedTotal}%` }}
            ></div>
          </div>
          <p className="text-xl text-blue-200 mt-2">{getFundingVerdict(scores.total)}</p>
        </div>
      </div>

      {showDetails && (
        <div className={`w-full max-w-md space-y-6 transition-all duration-500 transform ${
          showDetails ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>
          <div className="bg-white/10 rounded-lg p-4">
            <div className="flex justify-between mb-2">
              <span className="font-medium text-white">Charisma</span>
              <span className={`font-bold ${getScoreColor(scores.charisma)}`}>{animatedScores.charisma}/100</span>
            </div>
            <div className="h-2 bg-white/20 rounded-full mb-2">
              <div
                className="h-full bg-green-400 rounded-full transition-all duration-1000"
                style={{ width: `${animatedScores.charisma}%` }}
              ></div>
            </div>
            <p className="text-sm text-blue-200/80">{getAttributeDescription("charisma", scores.charisma)}</p>
          </div>

          <div className="bg-white/10 rounded-lg p-4">
            <div className="flex justify-between mb-2">
              <span className="font-medium text-white">Dumbness</span>
              <span className={`font-bold ${getScoreColor(scores.dumbness, true)}`}>{animatedScores.dumbness}/100</span>
            </div>
            <div className="h-2 bg-white/20 rounded-full mb-2">
              <div
                className="h-full bg-red-400 rounded-full transition-all duration-1000"
                style={{ width: `${animatedScores.dumbness}%` }}
              ></div>
            </div>
            <p className="text-sm text-blue-200/80">{getAttributeDescription("dumbness", scores.dumbness)}</p>
          </div>

          <div className="bg-white/10 rounded-lg p-4">
            <div className="flex justify-between mb-2">
              <span className="font-medium text-white">Single</span>
              <span className={`font-bold ${getScoreColor(scores.single)}`}>{animatedScores.single}/100</span>
            </div>
            <div className="h-2 bg-white/20 rounded-full mb-2">
              <div
                className="h-full bg-blue-400 rounded-full transition-all duration-1000"
                style={{ width: `${animatedScores.single}%` }}
              ></div>
            </div>
            <p className="text-sm text-blue-200/80">{getAttributeDescription("single", scores.single)}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScoreDisplay;
