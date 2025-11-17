import React, { useState, useEffect } from 'react';
import { Dice1, Settings, X, TrendingUp, ArrowUp, ArrowDown, HelpCircle, Zap, Volume2, VolumeX, Lock, Unlock } from 'lucide-react';

export default function DiceBet() {
  // Game State
  const [chance, setChance] = useState(50);
  const [betAmount, setBetAmount] = useState(10);
  const [balance, setBalance] = useState(1000);
  const [payout, setPayout] = useState(0);
  const [multiplier, setMultiplier] = useState(0);
  const [netProfit, setNetProfit] = useState(0);
  const [isRolling, setIsRolling] = useState(false);
  const [lastRoll, setLastRoll] = useState(null);
  const [rollResult, setRollResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [pulseWin, setPulseWin] = useState(false);
  const [gameMode, setGameMode] = useState('manual');
  const [totalRolls, setTotalRolls] = useState(0);
  const [rollUnder, setRollUnder] = useState(true);
  const [autoSettings, setAutoSettings] = useState({
    increaseOnWin: 0,
    increaseOnLoss: 0,
    resetOnWin: false,
    resetOnLoss: false,
    stopOnProfit: 0,
    stopOnLoss: 0
  });
  const [startBalance, setStartBalance] = useState(1000);
  const [baseBet, setBaseBet] = useState(10);
  const [balanceHistory, setBalanceHistory] = useState([1000]);
  const [totalWagered, setTotalWagered] = useState(0);
  const [sessionProfitLoss, setSessionProfitLoss] = useState(0);
  
  // UI State
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [showTutorial, setShowTutorial] = useState(!localStorage.getItem('dicebet_tutorial_completed'));
  const [tutorialStep, setTutorialStep] = useState(0);
  const [uiSettings, setUiSettings] = useState({
    rollSpeed: 200,
    soundEnabled: true,
    animationsEnabled: true,
    compactMode: false
  });
  const [chartTimeframe, setChartTimeframe] = useState('session');
  const [directionLocked, setDirectionLocked] = useState(false);
  const [autoRunning, setAutoRunning] = useState(false);

  const magneticPoints = [5, 10, 15, 20, 25, 30, 40, 50, 60, 70, 75, 80, 85, 90, 95];
  const magnetThreshold = 1.5;

  const tutorialSteps = [
    {
      title: "Welcome to DiceBet! 🎲",
      description: "Let me show you how to play. Roll a number and win based on your chance settings!",
      highlight: null
    },
    {
      title: "Set Your Win Chance",
      description: "Use the slider to set your win probability. The green zone shows where you'll win. Click the slider knob to switch between UNDER and OVER.",
      highlight: "chance"
    },
    {
      title: "Choose Your Bet Amount",
      description: "Set how much you want to bet. Use MIN, ½, 2×, or MAX buttons for quick adjustments.",
      highlight: "bet"
    },
    {
      title: "Check Your Potential Profit",
      description: "See your multiplier, payout, and NET PROFIT before you roll. Higher risk = higher reward!",
      highlight: "profit"
    },
    {
      title: "Roll the Dice!",
      description: "Click the ROLL DICE button to play. If your result lands in the green zone, you win!",
      highlight: "roll"
    },
    {
      title: "Try Auto Mode",
      description: "Switch to AUTO mode for automated betting with advanced settings like stop on profit/loss and bet progression.",
      highlight: "modes"
    },
    {
      title: "Ready to Play! 🎉",
      description: "You're all set! Click the help button (?) anytime to see this tutorial again. Good luck!",
      highlight: null
    }
  ];

  const handleChanceChange = (value) => {
    const numValue = parseFloat(value);
    for (let point of magneticPoints) {
      if (Math.abs(numValue - point) < magnetThreshold) {
        setChance(point);
        return;
      }
    }
    setChance(numValue);
  };

  const toggleRollDirection = () => {
    if ((gameMode === 'manual' || !isRolling) && !directionLocked) {
      setRollUnder(!rollUnder);
    }
  };

  const sliderStyle = rollUnder ? {
    background: `linear-gradient(to right, 
      rgb(34 197 94) 0%, 
      rgb(34 197 94) ${chance}%, 
      rgb(239 68 68) ${chance}%, 
      rgb(239 68 68) 100%)`
  } : {
    background: `linear-gradient(to right, 
      rgb(239 68 68) 0%, 
      rgb(239 68 68) ${100 - chance}%, 
      rgb(34 197 94) ${100 - chance}%, 
      rgb(34 197 94) 100%)`
  };

  useEffect(() => {
    const calculatedMultiplier = (99.05 / chance).toFixed(4);
    const calculatedPayout = (betAmount * calculatedMultiplier).toFixed(2);
    const calculatedProfit = (calculatedPayout - betAmount).toFixed(2);
    setMultiplier(calculatedMultiplier);
    setPayout(calculatedPayout);
    setNetProfit(calculatedProfit);
  }, [chance, betAmount]);

  useEffect(() => {
    if (gameMode === 'auto' && autoRunning && !isRolling && balance >= betAmount && betAmount > 0) {
      const profit = balance - startBalance;
      const loss = startBalance - balance;
      
      if (autoSettings.stopOnProfit > 0 && profit >= autoSettings.stopOnProfit) {
        setAutoRunning(false);
        return;
      }
      
      if (autoSettings.stopOnLoss > 0 && loss >= autoSettings.stopOnLoss) {
        setAutoRunning(false);
        return;
      }
      
      const timer = setTimeout(() => {
        handleRoll();
      }, uiSettings.rollSpeed);
      return () => clearTimeout(timer);
    } else if (gameMode === 'auto' && autoRunning && (balance < betAmount || betAmount <= 0)) {
      setAutoRunning(false);
    }
  }, [gameMode, autoRunning, isRolling, balance, betAmount]);

  const handleRoll = async () => {
    if (betAmount > balance || betAmount <= 0) return;
    
    setIsRolling(true);
    setBalance(balance - betAmount);
    setTotalRolls(prev => prev + 1);
    setTotalWagered(prev => prev + betAmount);
    
    try {
      const delay = gameMode === 'flash' ? 50 : uiSettings.rollSpeed;
      await new Promise(resolve => setTimeout(resolve, delay));
      const roll = (Math.random() * 100).toFixed(2);
      const won = rollUnder ? parseFloat(roll) <= chance : parseFloat(roll) >= (100 - chance);
      
      setLastRoll(roll);
      setRollResult(won ? 'win' : 'loss');
      
      if (won) {
        const winAmount = parseFloat(payout);
        const profit = winAmount - betAmount;
        setBalance(prev => {
          const newBalance = prev + winAmount;
          setBalanceHistory(h => [...h.slice(-49), newBalance]);
          return newBalance;
        });
        setSessionProfitLoss(prev => prev + profit);
        setPulseWin(true);
        setTimeout(() => setPulseWin(false), 300);
        
        if (gameMode === 'auto') {
          if (autoSettings.resetOnWin) {
            setBetAmount(baseBet);
          } else if (autoSettings.increaseOnWin > 0) {
            setBetAmount(prev => prev * (1 + autoSettings.increaseOnWin / 100));
          }
        }
      } else {
        setBalanceHistory(h => [...h.slice(-49), balance - betAmount]);
        setSessionProfitLoss(prev => prev - betAmount);
        if (gameMode === 'auto') {
          if (autoSettings.resetOnLoss) {
            setBetAmount(baseBet);
          } else if (autoSettings.increaseOnLoss > 0) {
            setBetAmount(prev => prev * (1 + autoSettings.increaseOnLoss / 100));
          }
        }
      }
      
      setHistory(prev => [{
        roll: roll,
        chance: chance,
        bet: betAmount,
        result: won ? 'win' : 'loss',
        profit: won ? parseFloat(payout) - betAmount : -betAmount,
        rollUnder: rollUnder,
      }, ...prev.slice(0, 9)]);
      
      setIsRolling(false);
      const resultDelay = gameMode === 'flash' ? 200 : 800;
      setTimeout(() => setRollResult(null), resultDelay);
    } catch (error) {
      console.error('Bet failed:', error);
      setBalance(prev => prev + betAmount);
      setIsRolling(false);
    }
  };

  const startGameMode = (mode) => {
    if (mode !== 'manual') {
      setStartBalance(balance);
      setBaseBet(betAmount);
      setTotalRolls(0);
      setTotalWagered(0);
      setSessionProfitLoss(0);
    }
    setGameMode(mode);
    
    if (mode === 'flash') {
      handleRoll();
    }
  };

  const completeTutorial = () => {
    localStorage.setItem('dicebet_tutorial_completed', 'true');
    setShowTutorial(false);
    setTutorialStep(0);
  };

  const nextTutorialStep = () => {
    if (tutorialStep < tutorialSteps.length - 1) {
      setTutorialStep(tutorialStep + 1);
    } else {
      completeTutorial();
    }
  };

  const getChartData = () => {
    if (chartTimeframe === 'last100') return balanceHistory.slice(-100);
    if (chartTimeframe === 'last1000') return balanceHistory.slice(-1000);
    return balanceHistory;
  };
  
  const chartData = getChartData();
  const chartMax = Math.max(...chartData);
  const chartMin = Math.min(...chartData);
  const chartRange = chartMax - chartMin || 1;

  const getHighlightClass = (area) => {
    if (!showTutorial || tutorialSteps[tutorialStep].highlight !== area) return '';
    return 'ring-4 ring-yellow-400 ring-offset-4 relative z-50';
  };

  return (
    <div className="h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-pink-50 p-6 font-sans overflow-hidden flex flex-col">
      <style dangerouslySetInnerHTML={{
        __html: `
          .slider-thumb::-webkit-slider-thumb {
            appearance: none;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background: white;
            cursor: pointer;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
            border: 3px solid rgb(147 51 234);
            transition: all 0.2s;
          }
          
          .slider-thumb::-webkit-slider-thumb:hover {
            transform: scale(1.15);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
          }

          .slider-thumb::-moz-range-thumb {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background: white;
            cursor: pointer;
            border: 3px solid rgb(147 51 234);
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
          }

          @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }

          .animate-shimmer {
            animation: shimmer 3s infinite;
          }
        `
      }} />

      {/* Tutorial Overlay */}
      {showTutorial && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-3xl p-8 max-w-md shadow-2xl border-4 border-purple-500">
            <div className="text-center mb-6">
              <div className="text-4xl mb-4">{tutorialSteps[tutorialStep].title}</div>
              <p className="text-gray-600 text-lg">{tutorialSteps[tutorialStep].description}</p>
            </div>
            <div className="flex gap-2 mb-4">
              {tutorialSteps.map((_, idx) => (
                <div 
                  key={idx} 
                  className={`h-2 flex-1 rounded-full ${idx === tutorialStep ? 'bg-purple-600' : 'bg-gray-200'}`}
                />
              ))}
            </div>
            <div className="flex gap-3">
              <button
                onClick={completeTutorial}
                className="flex-1 py-3 bg-gray-200 hover:bg-gray-300 rounded-xl font-bold text-gray-700 transition-all"
              >
                Skip
              </button>
              <button
                onClick={nextTutorialStep}
                className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-bold transition-all"
              >
                {tutorialStep === tutorialSteps.length - 1 ? 'Start Playing!' : 'Next'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Options Modal */}
      {showOptionsModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 flex items-center justify-center" onClick={() => setShowOptionsModal(false)}>
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black text-gray-800">Options</h2>
              <button onClick={() => setShowOptionsModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-bold text-gray-700 mb-2 block">Roll Speed</label>
                <div className="flex items-center gap-3">
                  <Zap className="w-5 h-5 text-gray-400" />
                  <input
                    type="range"
                    min="50"
                    max="1000"
                    step="50"
                    value={uiSettings.rollSpeed}
                    onChange={(e) => setUiSettings({...uiSettings, rollSpeed: parseInt(e.target.value)})}
                    className="flex-1"
                  />
                  <span className="text-sm font-bold text-gray-600 w-16">{uiSettings.rollSpeed}ms</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  {uiSettings.soundEnabled ? <Volume2 className="w-5 h-5 text-gray-600" /> : <VolumeX className="w-5 h-5 text-gray-400" />}
                  <span className="text-sm font-bold text-gray-700">Sound Effects</span>
                </div>
                <button
                  onClick={() => setUiSettings({...uiSettings, soundEnabled: !uiSettings.soundEnabled})}
                  className={`w-12 h-6 rounded-full transition-all ${uiSettings.soundEnabled ? 'bg-purple-600' : 'bg-gray-300'}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full shadow transition-all ${uiSettings.soundEnabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
                </button>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-gray-700">Animations</span>
                </div>
                <button
                  onClick={() => setUiSettings({...uiSettings, animationsEnabled: !uiSettings.animationsEnabled})}
                  className={`w-12 h-6 rounded-full transition-all ${uiSettings.animationsEnabled ? 'bg-purple-600' : 'bg-gray-300'}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full shadow transition-all ${uiSettings.animationsEnabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
                </button>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-gray-700">Compact Mode</span>
                </div>
                <button
                  onClick={() => setUiSettings({...uiSettings, compactMode: !uiSettings.compactMode})}
                  className={`w-12 h-6 rounded-full transition-all ${uiSettings.compactMode ? 'bg-purple-600' : 'bg-gray-300'}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full shadow transition-all ${uiSettings.compactMode ? 'translate-x-6' : 'translate-x-0.5'}`} />
                </button>
              </div>
            </div>

            <button
              onClick={() => setShowOptionsModal(false)}
              className="w-full mt-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold hover:from-purple-700 hover:to-pink-700 transition-all"
            >
              Save Settings
            </button>
          </div>
        </div>
      )}

      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute -bottom-20 left-1/2 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>

      <div className="max-w-7xl mx-auto relative flex flex-col h-full w-full">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Dice1 className="w-9 h-9 text-purple-600" strokeWidth={1.5} />
              <div className="absolute inset-0 bg-purple-600 blur-xl opacity-30"></div>
            </div>
            <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
              DICE<span className="font-light">BET</span>
            </h1>
          </div>
          
          <div className="flex items-center gap-3">
            <div className={`flex gap-2 bg-white/70 backdrop-blur-sm rounded-2xl p-1.5 border border-purple-200/50 shadow-lg ${getHighlightClass('modes')}`}>
              <button
                onClick={() => startGameMode('manual')}
                className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                  gameMode === 'manual' 
                    ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg scale-105' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Manual
              </button>
              <button
                onClick={() => startGameMode('auto')}
                className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all relative ${
                  gameMode === 'auto' 
                    ? 'bg-gradient-to-r from-pink-600 to-pink-700 text-white shadow-lg scale-105' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Auto
                {gameMode === 'auto' && autoRunning && (
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                  </span>
                )}
              </button>
              <button
                onClick={() => startGameMode('flash')}
                className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                  gameMode === 'flash' 
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg scale-105' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Flash
              </button>
            </div>

            <button
              onClick={() => setShowOptionsModal(true)}
              className="p-3 bg-white/70 backdrop-blur-sm rounded-2xl border border-purple-200/50 shadow-lg hover:scale-105 transition-all"
            >
              <Settings className="w-5 h-5 text-gray-600" />
            </button>

            <button
              onClick={() => setShowTutorial(true)}
              className="p-3 bg-white/70 backdrop-blur-sm rounded-2xl border border-purple-200/50 shadow-lg hover:scale-105 transition-all"
            >
              <HelpCircle className="w-5 h-5 text-gray-600" />
            </button>
            
            <div className={`px-5 py-2.5 bg-white/70 backdrop-blur-sm rounded-2xl border border-purple-200/50 shadow-lg transition-all duration-300 ${pulseWin ? 'scale-110 bg-green-100/70' : ''}`}>
              <div className="text-xs font-medium text-gray-500">Balance</div>
              <div className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                ${balance.toFixed(2)}
              </div>
            </div>
            <div className="px-4 py-2 bg-gradient-to-r from-yellow-400 to-orange-400 text-white rounded-full text-xs font-bold shadow-lg">
              DEMO
            </div>
          </div>
        </div>

        <div className="flex-1 grid grid-cols-12 gap-4 min-h-0">
          
          <div className="col-span-4 space-y-4 flex flex-col min-h-0">
            <div className={`bg-white/80 backdrop-blur-md rounded-3xl p-6 border-2 transition-all duration-500 shadow-2xl flex flex-col justify-center ${
              rollResult === 'win' ? 'border-green-400 bg-green-50/80' : 
              rollResult === 'loss' ? 'border-red-400 bg-red-50/80' : 
              'border-purple-200/50'
            }`}>
              <div className="text-center">
                {lastRoll ? (
                  <>
                    <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Result</div>
                    <div className={`text-7xl font-black mb-4 transition-all duration-500 tabular-nums ${
                      rollResult === 'win' ? 'text-green-600 scale-110' : 
                      rollResult === 'loss' ? 'text-red-600' : 
                      'text-gray-800'
                    }`}>
                      {lastRoll}
                    </div>
                    <div className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl text-base font-black ${
                      rollResult === 'win' ? 'bg-green-500 text-white' : 
                      rollResult === 'loss' ? 'bg-red-500 text-white' : 
                      'bg-gray-200 text-gray-700'
                    }`}>
                      {rollResult === 'win' ? '🎉 WIN!' : rollResult === 'loss' ? '💔 LOSS' : '—'}
                      {rollResult && (
                        <span className="text-lg">
                          {rollResult === 'win' ? `+$${(parseFloat(payout) - betAmount).toFixed(2)}` : `-$${betAmount.toFixed(2)}`}
                        </span>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="py-12">
                    <Dice1 className="w-20 h-20 mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-400 text-sm font-medium">Place your bet</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-md rounded-3xl p-4 border border-purple-200/50 shadow-2xl flex-1">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-purple-600" />
                  <h3 className="font-bold text-gray-700 uppercase tracking-wider text-xs">Balance Chart</h3>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => setChartTimeframe('session')}
                    className={`px-2 py-1 rounded text-xs font-bold transition-all ${
                      chartTimeframe === 'session' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                    }`}
                  >
                    Session
                  </button>
                  <button
                    onClick={() => setChartTimeframe('last100')}
                    className={`px-2 py-1 rounded text-xs font-bold transition-all ${
                      chartTimeframe === 'last100' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                    }`}
                  >
                    100
                  </button>
                  <button
                    onClick={() => setChartTimeframe('last1000')}
                    className={`px-2 py-1 rounded text-xs font-bold transition-all ${
                      chartTimeframe === 'last1000' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                    }`}
                  >
                    1K
                  </button>
                </div>
              </div>
              <div className="h-32 relative mb-3">
                <svg className="w-full h-full" viewBox="0 0 300 100" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" style={{stopColor: 'rgb(147 51 234)', stopOpacity: 0.3}} />
                      <stop offset="100%" style={{stopColor: 'rgb(147 51 234)', stopOpacity: 0}} />
                    </linearGradient>
                  </defs>
                  
                  <line
                    x1="0"
                    y1={100 - ((startBalance - chartMin) / chartRange) * 80}
                    x2="300"
                    y2={100 - ((startBalance - chartMin) / chartRange) * 80}
                    stroke="rgb(156 163 175)"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                    opacity="0.5"
                  />
                  
                  <polygon
                    points={`0,100 ${chartData.map((bal, idx) => {
                      const x = (idx / (chartData.length - 1)) * 300;
                      const y = 100 - ((bal - chartMin) / chartRange) * 80;
                      return `${x},${y}`;
                    }).join(' ')} 300,100`}
                    fill="url(#areaGradient)"
                  />
                  <polyline
                    points={chartData.map((bal, idx) => {
                      const x = (idx / (chartData.length - 1)) * 300;
                      const y = 100 - ((bal - chartMin) / chartRange) * 80;
                      return `${x},${y}`;
                    }).join(' ')}
                    fill="none"
                    stroke="rgb(147 51 234)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Min: ${chartMin.toFixed(0)}</span>
                <span className="text-gray-400">Start: ${startBalance.toFixed(0)}</span>
                <span>Max: ${chartMax.toFixed(0)}</span>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-3 gap-2">
                <div className="text-center p-2 bg-purple-50 rounded-lg">
                  <div className="text-lg font-black text-purple-600">{totalRolls}</div>
                  <div className="text-xs text-gray-500 font-medium">Rolls</div>
                </div>
                <div className="text-center p-2 bg-blue-50 rounded-lg">
                  <div className="text-lg font-black text-blue-600">${totalWagered.toFixed(0)}</div>
                  <div className="text-xs text-gray-500 font-medium">Wagered</div>
                </div>
                <div className="text-center p-2 bg-gray-50 rounded-lg">
                  <div className={`text-lg font-black flex items-center justify-center gap-1 ${sessionProfitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {sessionProfitLoss >= 0 ? (
                      <ArrowUp className="w-4 h-4" />
                    ) : (
                      <ArrowDown className="w-4 h-4" />
                    )}
                    {sessionProfitLoss >= 0 ? '+' : ''}{sessionProfitLoss.toFixed(1)}
                  </div>
                  <div className="text-xs text-gray-500 font-medium">P/L</div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-span-5 space-y-4 flex flex-col min-h-0">
            
            <div className={`bg-white/80 backdrop-blur-md rounded-3xl p-5 border border-purple-200/50 shadow-2xl ${getHighlightClass('chance')}`}>
              <div className="flex items-center justify-between mb-4">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Win Chance
                </label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setDirectionLocked(!directionLocked)}
                    className={`p-1.5 rounded-lg transition-all ${
                      directionLocked ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                    }`}
                    title={directionLocked ? 'Direction Locked' : 'Lock Direction'}
                  >
                    {directionLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={toggleRollDirection}
                    disabled={gameMode !== 'manual' || directionLocked}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      rollUnder 
                        ? 'bg-green-500 text-white shadow-md' 
                        : 'bg-gray-200 text-gray-600'
                    } ${directionLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <ArrowDown className="w-3 h-3" />
                    Under
                  </button>
                  <button
                    onClick={toggleRollDirection}
                    disabled={gameMode !== 'manual' || directionLocked}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      !rollUnder 
                        ? 'bg-green-500 text-white shadow-md' 
                        : 'bg-gray-200 text-gray-600'
                    } ${directionLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <ArrowUp className="w-3 h-3" />
                    Over
                  </button>
                </div>
              </div>
              
              <div className="text-center mb-4">
                <div className="text-5xl font-black bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent tabular-nums">
                  {chance.toFixed(2)}<span className="text-3xl font-light text-gray-400">%</span>
                </div>
                <div className="text-sm font-bold text-gray-600 mt-2">
                  {rollUnder ? (
                    <span className="text-green-600">Roll 0.00 - {chance.toFixed(2)} to WIN</span>
                  ) : (
                    <span className="text-green-600">Roll {(100 - chance).toFixed(2)} - 100.00 to WIN</span>
                  )}
                </div>
              </div>
              
              <div className="relative pb-6">
                <input
                  type="range"
                  min="0.01"
                  max="97"
                  step="0.01"
                  value={chance}
                  onChange={(e) => handleChanceChange(e.target.value)}
                  disabled={gameMode !== 'manual'}
                  className="w-full h-4 rounded-full appearance-none cursor-pointer slider-thumb"
                  style={sliderStyle}
                />
                <div className="flex justify-between text-xs text-gray-500 font-bold mt-2">
                  <span className="text-green-600">WIN ZONE</span>
                  <span className="text-red-600">LOSS ZONE</span>
                </div>
              </div>
            </div>

            <div className={`bg-white/80 backdrop-blur-md rounded-3xl p-5 border border-purple-200/50 shadow-2xl ${getHighlightClass('bet')}`}>
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3 block">Bet Amount</label>
              <div className="mb-3">
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-3xl font-bold text-gray-400">$</span>
                  <input
                    type="number"
                    value={betAmount}
                    onChange={(e) => setBetAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full pl-10 pr-4 py-4 text-3xl font-bold bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-gray-300/50 focus:border-purple-400 focus:outline-none transition-all"
                    disabled={gameMode !== 'manual'}
                  />
                </div>
              </div>
              <div className="grid grid-cols-4 gap-2">
                <button
                  onClick={() => setBetAmount(0.01)}
                  disabled={gameMode !== 'manual'}
                  className="py-3 bg-gradient-to-br from-gray-200 to-gray-300 hover:from-gray-300 hover:to-gray-400 text-gray-700 rounded-xl font-bold text-sm transition-all hover:scale-105 shadow disabled:opacity-50"
                >
                  MIN
                </button>
                <button
                  onClick={() => setBetAmount(betAmount / 2)}
                  disabled={gameMode !== 'manual'}
                  className="py-3 bg-gradient-to-br from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white rounded-xl font-bold text-lg transition-all hover:scale-105 shadow-lg disabled:opacity-50"
                >
                  ½
                </button>
                <button
                  onClick={() => setBetAmount(betAmount * 2)}
                  disabled={gameMode !== 'manual'}
                  className="py-3 bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-xl font-bold text-lg transition-all hover:scale-105 shadow-lg disabled:opacity-50"
                >
                  2×
                </button>
                <button
                  onClick={() => setBetAmount(balance)}
                  disabled={gameMode !== 'manual'}
                  className="py-3 bg-gradient-to-br from-gray-200 to-gray-300 hover:from-gray-300 hover:to-gray-400 text-gray-700 rounded-xl font-bold text-sm transition-all hover:scale-105 shadow disabled:opacity-50"
                >
                  MAX
                </button>
              </div>
            </div>

            {gameMode === 'auto' && (
              <div className="bg-white/80 backdrop-blur-md rounded-3xl p-4 border border-pink-300/50 shadow-2xl">
                <label className="text-xs font-bold text-pink-700 uppercase tracking-wider mb-3 block">Auto Betting Settings</label>

                <div className="space-y-2 p-3 bg-pink-50/70 rounded-xl">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-bold text-gray-600 mb-1 block">On Win +%</label>
                      <input
                        type="number"
                        value={autoSettings.increaseOnWin}
                        onChange={(e) => setAutoSettings({...autoSettings, increaseOnWin: Math.max(0, parseFloat(e.target.value) || 0)})}
                        className="w-full px-2 py-1.5 bg-white rounded-lg border border-gray-300 text-xs font-bold focus:border-pink-400 focus:outline-none"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-600 mb-1 block">On Loss +%</label>
                      <input
                        type="number"
                        value={autoSettings.increaseOnLoss}
                        onChange={(e) => setAutoSettings({...autoSettings, increaseOnLoss: Math.max(0, parseFloat(e.target.value) || 0)})}
                        className="w-full px-2 py-1.5 bg-white rounded-lg border border-gray-300 text-xs font-bold focus:border-pink-400 focus:outline-none"
                        placeholder="0"
                      />
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <label className="flex items-center gap-1.5 flex-1 cursor-pointer bg-white px-2 py-1.5 rounded-lg border border-gray-300 text-xs">
                      <input
                        type="checkbox"
                        checked={autoSettings.resetOnWin}
                        onChange={(e) => setAutoSettings({...autoSettings, resetOnWin: e.target.checked})}
                        className="w-3 h-3 accent-pink-600"
                      />
                      <span className="font-bold text-gray-700">Reset Win</span>
                    </label>
                    <label className="flex items-center gap-1.5 flex-1 cursor-pointer bg-white px-2 py-1.5 rounded-lg border border-gray-300 text-xs">
                      <input
                        type="checkbox"
                        checked={autoSettings.resetOnLoss}
                        onChange={(e) => setAutoSettings({...autoSettings, resetOnLoss: e.target.checked})}
                        className="w-3 h-3 accent-pink-600"
                      />
                      <span className="font-bold text-gray-700">Reset Loss</span>
                    </label>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-bold text-gray-600 mb-1 block">Stop Profit $</label>
                      <input
                        type="number"
                        value={autoSettings.stopOnProfit}
                        onChange={(e) => setAutoSettings({...autoSettings, stopOnProfit: Math.max(0, parseFloat(e.target.value) || 0)})}
                        className="w-full px-2 py-1.5 bg-white rounded-lg border border-gray-300 text-xs font-bold focus:border-pink-400 focus:outline-none"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-600 mb-1 block">Stop Loss $</label>
                      <input
                        type="number"
                        value={autoSettings.stopOnLoss}
                        onChange={(e) => setAutoSettings({...autoSettings, stopOnLoss: Math.max(0, parseFloat(e.target.value) || 0)})}
                        className="w-full px-2 py-1.5 bg-white rounded-lg border border-gray-300 text-xs font-bold focus:border-pink-400 focus:outline-none"
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={() => {
                if (gameMode === 'manual') {
                  handleRoll();
                } else if (gameMode === 'auto') {
                  setAutoRunning(!autoRunning);
                } else {
                  setGameMode('manual');
                }
              }}
              disabled={isRolling || betAmount > balance || betAmount <= 0}
              className={`w-full py-6 rounded-2xl font-black text-2xl tracking-wider uppercase transition-all duration-300 shadow-2xl relative overflow-hidden ${getHighlightClass('roll')} ${
                isRolling || betAmount > balance || betAmount <= 0
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : gameMode === 'manual'
                  ? 'bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 hover:shadow-purple-500/50 hover:scale-[1.02] active:scale-[0.98] text-white'
                  : gameMode === 'auto'
                  ? autoRunning 
                    ? 'bg-gradient-to-r from-red-500 to-red-600 hover:shadow-red-500/50 hover:scale-[1.02] text-white animate-pulse'
                    : 'bg-gradient-to-r from-green-500 to-green-600 hover:shadow-green-500/50 hover:scale-[1.02] text-white'
                  : 'bg-gradient-to-r from-red-500 to-red-600 hover:shadow-red-500/50 hover:scale-[1.02] text-white'
              }`}
            >
              <div className="relative z-10 flex items-center justify-center gap-3">
                {gameMode === 'manual' ? (
                  <>
                    <Dice1 className="w-8 h-8" />
                    {isRolling ? 'Rolling...' : 'Roll Dice'}
                  </>
                ) : gameMode === 'auto' ? (
                  <>
                    {autoRunning ? (
                      <>
                        <X className="w-8 h-8" />
                        STOP AUTO BETTING
                      </>
                    ) : (
                      <>
                        <Zap className="w-8 h-8" />
                        START AUTO BETTING
                      </>
                    )}
                  </>
                ) : (
                  <>
                    <X className="w-8 h-8" />
                    Stop Flash
                  </>
                )}
              </div>
              {!isRolling && gameMode === 'manual' && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
              )}
              {gameMode === 'auto' && !autoRunning && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
              )}
            </button>
          </div>

          <div className="col-span-3 space-y-4 flex flex-col min-h-0">
            
            <div className={`bg-white/80 backdrop-blur-md rounded-3xl p-4 border border-purple-200/50 shadow-2xl ${getHighlightClass('profit')}`}>
              <div className="space-y-3">
                <div className="text-center p-4 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl text-white">
                  <div className="text-xs font-bold uppercase tracking-wider opacity-90 mb-1">Multiplier</div>
                  <div className="text-4xl font-black">{multiplier}×</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl text-white">
                  <div className="text-xs font-bold uppercase tracking-wider opacity-90 mb-1">Payout</div>
                  <div className="text-4xl font-black">${payout}</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-green-500 to-green-600 rounded-xl text-white">
                  <div className="text-xs font-bold uppercase tracking-wider opacity-90 mb-1">Net Profit</div>
                  <div className="text-4xl font-black">+${netProfit}</div>
                </div>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-md rounded-3xl p-4 border border-purple-200/50 shadow-2xl flex-1 overflow-hidden flex flex-col">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-purple-600" />
                <h3 className="font-bold text-gray-700 uppercase tracking-wider text-xs">Recent Rolls</h3>
              </div>
              <div className="space-y-2 overflow-y-auto flex-1">
                {history.length === 0 ? (
                  <p className="text-center text-gray-400 py-8 text-xs">No rolls yet</p>
                ) : (
                  history.map((item, idx) => (
                    <div key={idx} className={`p-2.5 rounded-xl transition-all ${
                      item.result === 'win' ? 'bg-green-100/70' : 'bg-red-100/70'
                    }`}>
                      <div className="flex items-center justify-between mb-1">
                        <div className={`text-xl font-black ${
                          item.result === 'win' ? 'text-green-600' : 'text-gray-400'
                        }`}>
                          {item.roll}
                        </div>
                        <div className={`text-lg font-black ${item.result === 'win' ? 'text-green-600' : 'text-red-600'}`}>
                          {item.profit > 0 ? '+' : ''}{item.profit.toFixed(2)}
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5">
                          {item.rollUnder ? (
                            <ArrowDown className="w-3 h-3 text-green-600" />
                          ) : (
                            <ArrowUp className="w-3 h-3 text-green-600" />
                          )}
                          <span className="font-bold text-gray-600">
                            {item.rollUnder ? '≤' : '≥'} {item.rollUnder ? item.chance.toFixed(1) : (100 - item.chance).toFixed(1)}%
                          </span>
                        </div>
                        <div className="text-gray-500">Bet: ${item.bet.toFixed(2)}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
