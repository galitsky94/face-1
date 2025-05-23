import React, { useEffect, useState } from 'react';

interface ScoreDisplayProps {
  scores: {
    charismatic: number;
    dumb: number;
    single: number;
    total: number;
  } | null;
}

const ScoreDisplay: React.FC<ScoreDisplayProps> = ({ scores }) => {
  const [animatedTotal, setAnimatedTotal] = useState(0);
  const [animatedScores, setAnimatedScores] = useState({
    charismatic: 0,
    dumb: 0,
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
      let current = { charismatic: 0, dumb: 0, single: 0 };
      const increments = {
        charismatic: scores.charismatic / attrSteps,
        dumb: scores.dumb / attrSteps,
        single: scores.single / attrSteps
      };

      const attrTimer = setInterval(() => {
        current = {
          charismatic: Math.min(scores.charismatic, current.charismatic + increments.charismatic),
          dumb: Math.min(scores.dumb, current.dumb + increments.dumb),
          single: Math.min(scores.single, current.single + increments.single)
        };

        setAnimatedScores({
          charismatic: Math.round(current.charismatic),
          dumb: Math.round(current.dumb),
          single: Math.round(current.single)
        });

        if (
          current.charismatic >= scores.charismatic &&
          current.dumb >= scores.dumb &&
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
    if (name === "charismatic") {
      if (score >= 80) return "You could charm money from a VC's wallet!";
      if (score >= 50) return "You can hold a conversation without mentioning blockchain.";
      return "Maybe practice your elevator pitch in the mirror?";
    }

    if (name === "dumb") {
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
      className={`h-full w-full flex flex-col justify-center items-center p-4 transition-all duration-500 transform ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}
    >
      <div className="text-center mb-4">
        <h2 className="text-lg font-bold text-white mb-2">Your Fundability Score</h2>

        <div className="flex flex-col items-center mt-3">
          <div className="text-4xl font-bold text-white mb-1">{animatedTotal}</div>
          <div className="h-1.5 w-48 bg-white/20 rounded-full mt-1 mb-3">
            <div
              className="h-full bg-blue-400 rounded-full transition-all duration-1500"
              style={{ width: `${animatedTotal}%` }}
            ></div>
          </div>
          <p className="text-sm text-blue-200 mt-1">{getFundingVerdict(scores.total)}</p>
        </div>
      </div>

      {showDetails && (
        <div className={`w-full max-w-md space-y-3 transition-all duration-500 transform ${
          showDetails ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>
          <div className="bg-white/10 rounded-lg p-3">
            <div className="flex justify-between mb-1">
              <span className="font-medium text-white text-sm">Charismatic</span>
              <span className={`font-bold text-sm ${getScoreColor(scores.charismatic)}`}>{animatedScores.charismatic}/100</span>
            </div>
            <div className="h-1.5 bg-white/20 rounded-full mb-1">
              <div
                className="h-full bg-green-400 rounded-full transition-all duration-1000"
                style={{ width: `${animatedScores.charismatic}%` }}
              ></div>
            </div>
            <p className="text-xs text-blue-200/80">{getAttributeDescription("charismatic", scores.charismatic)}</p>
          </div>

          <div className="bg-white/10 rounded-lg p-3">
            <div className="flex justify-between mb-1">
              <span className="font-medium text-white text-sm">Dumb</span>
              <span className={`font-bold text-sm ${getScoreColor(scores.dumb, true)}`}>{animatedScores.dumb}/100</span>
            </div>
            <div className="h-1.5 bg-white/20 rounded-full mb-1">
              <div
                className="h-full bg-red-400 rounded-full transition-all duration-1000"
                style={{ width: `${animatedScores.dumb}%` }}
              ></div>
            </div>
            <p className="text-xs text-blue-200/80">{getAttributeDescription("dumb", scores.dumb)}</p>
          </div>

          <div className="bg-white/10 rounded-lg p-3">
            <div className="flex justify-between mb-1">
              <span className="font-medium text-white text-sm">Single</span>
              <span className={`font-bold text-sm ${getScoreColor(scores.single)}`}>{animatedScores.single}/100</span>
            </div>
            <div className="h-1.5 bg-white/20 rounded-full mb-1">
              <div
                className="h-full bg-blue-400 rounded-full transition-all duration-1000"
                style={{ width: `${animatedScores.single}%` }}
              ></div>
            </div>
            <p className="text-xs text-blue-200/80">{getAttributeDescription("single", scores.single)}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScoreDisplay;
