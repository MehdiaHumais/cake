/* ==========================================================================
   WARM CLASSIC & AGENTIC DUAL MODE CONTROLLER
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // Mode Select Modal Elements
  const modeSelectModal = document.getElementById('mode-select-modal');
  const selectClassicBtn = document.getElementById('select-classic-btn');
  const selectAgenticBtn = document.getElementById('select-agentic-btn');
  const modeSwitchBtn = document.getElementById('mode-switch-btn');
  const switchIcon = document.getElementById('switch-icon');
  const switchText = document.getElementById('switch-text');

  // Scene Elements
  const hqContainer = document.getElementById('hq-container');
  const stageArea = document.getElementById('stage-area');
  const terminalOverlay = document.getElementById('terminal-overlay');
  const terminalText = document.getElementById('terminal-text');
  const speakerTag = document.getElementById('speaker-tag');
  const terminalActionBtn = document.getElementById('terminal-action-btn');
  const hudStatusText = document.getElementById('hud-status-text');
  const hudTitleText = document.getElementById('hud-title-text');
  const roboticArm = document.getElementById('robotic-arm');
  const outroOverlay = document.getElementById('outro-overlay');
  const outroMessage = document.getElementById('outro-message');
  const companyLogo = document.getElementById('company-logo');
  const restartBtn = document.getElementById('restart-btn');

  // Shared Banners & Canvas Elements
  const instructionBanner = document.getElementById('instruction-banner');
  const celebrationBanner = document.getElementById('celebration-banner');
  const slicePlate = document.getElementById('slice-plate');
  const audioToggle = document.getElementById('audio-toggle');
  const audioText = audioToggle.querySelector('.audio-text');

  // Classic Card Overlay Elements
  const classicCardOverlay = document.getElementById('classic-card-overlay');
  const classicCloseCardBtn = document.getElementById('classic-close-card-btn');

  // Mini Avatars
  const avatar1 = document.getElementById('avatar-1');
  const avatar2 = document.getElementById('avatar-2');
  const avatar3 = document.getElementById('avatar-3');

  let cakeEngine = null;
  let activeMode = 'CLASSIC';
  let isDeliveringCake = false;

  // Audio Toggle
  audioToggle.addEventListener('click', () => {
    if (window.audioEngine) {
      window.audioEngine.init();
      const isMuted = window.audioEngine.toggleMute();
      audioText.textContent = isMuted ? 'OFF' : 'SOUND ON';
    }
  });

  // Mode Switcher Header Button
  modeSwitchBtn.addEventListener('click', () => {
    openModeModal();
  });

  function openModeModal() {
    modeSelectModal.classList.remove('hidden');
  }

  function typeWriter(element, text, speed = 40, callback = null) {
    element.textContent = '';
    let i = 0;
    const timer = setInterval(() => {
      if (i < text.length) {
        element.textContent += text.charAt(i);
        i++;
      } else {
        clearInterval(timer);
        if (callback) callback();
      }
    }, speed);
  }

  // Trigger Robot Arm Cake Delivery (on Button click or Card click)
  function triggerCakeDelivery() {
    if (isDeliveringCake) return;
    isDeliveringCake = true;
    terminalActionBtn.classList.add('hidden');
    deliverRobotArmCake();
  }

  // Terminal Action Button Click Handler
  terminalActionBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    triggerCakeDelivery();
  });

  // Clicking Anywhere on Terminal Card also triggers cake delivery if ready
  terminalOverlay.addEventListener('click', () => {
    if (!terminalActionBtn.classList.contains('hidden')) {
      triggerCakeDelivery();
    }
  });

  // Startup Mode Selection Button Listeners
  selectClassicBtn.addEventListener('click', () => {
    if (window.audioEngine) window.audioEngine.init();
    startClassicMode();
  });

  selectAgenticBtn.addEventListener('click', () => {
    if (window.audioEngine) window.audioEngine.init();
    startAgenticMode();
  });

  // ------------------------------------------------------------------------
  // CLASSIC MODE FLOW
  // ------------------------------------------------------------------------
  function startClassicMode() {
    activeMode = 'CLASSIC';
    isDeliveringCake = false;
    document.body.className = 'classic-theme';
    modeSelectModal.classList.add('hidden');
    hqContainer.classList.add('hidden');
    classicCardOverlay.classList.add('hidden');
    stageArea.classList.remove('hidden');
    resetSceneUI();

    // Switcher Button Text
    switchIcon.textContent = '🤖';
    switchText.textContent = 'SWITCH TO AGENTIC';

    cakeEngine.setMode('CLASSIC');
    cakeEngine.setKnifeActive(true);

    instructionBanner.classList.remove('hidden');
  }

  // ------------------------------------------------------------------------
  // AGENTIC MODE FLOW
  // ------------------------------------------------------------------------
  function startAgenticMode() {
    activeMode = 'AGENTIC';
    isDeliveringCake = false;
    document.body.className = 'agentic-theme';
    modeSelectModal.classList.add('hidden');
    classicCardOverlay.classList.add('hidden');
    hqContainer.classList.remove('hidden');
    stageArea.classList.remove('hidden');
    resetSceneUI();

    // Switcher Button Text
    switchIcon.textContent = '🎂';
    switchText.textContent = 'SWITCH TO CLASSIC';

    hudTitleText.textContent = 'AI CORE // PROTOCOL 0x889';
    hudStatusText.textContent = 'PROTOCOL ACTIVE';

    cakeEngine.setMode('AGENTIC');

    // Launch Agent JST story intro
    terminalOverlay.classList.remove('hidden');
    speakerTag.textContent = '🤖 AGENT JST';

    typeWriter(terminalText, '"Sir, the celebration is incomplete."', 40, () => {
      setTimeout(() => {
        speakerTag.textContent = '🛸 AGENT BETA';
        typeWriter(terminalText, '"Initializing Birthday Cake Protocol..."', 35, () => {
          terminalActionBtn.classList.remove('hidden');
        });
      }, 1200);
    });
  }

  function deliverRobotArmCake() {
    hudStatusText.textContent = 'DELIVERING CELEBRATION CORE...';
    speakerTag.textContent = 'SYSTEM AI';

    if (window.audioEngine) window.audioEngine.playRobotArmSound();
    roboticArm.classList.add('delivered');

    setTimeout(() => {
      typeWriter(terminalText, '"Please make the first cut."', 40, () => {
        setTimeout(() => {
          terminalOverlay.classList.add('hidden');
          roboticArm.classList.remove('delivered');
          roboticArm.classList.add('retracted');
          instructionBanner.classList.remove('hidden');
          cakeEngine.setKnifeActive(true);
        }, 1500);
      });
    }, 2200);
  }

  // ------------------------------------------------------------------------
  // CAKE CUT & EAT CALLBACKS (HIDES STAGE SO CAKE DISAPPEARS & CARD IS ON TOP)
  // ------------------------------------------------------------------------
  function handleCutComplete() {
    instructionBanner.classList.add('hidden');
    celebrationBanner.classList.remove('hidden');

    setTimeout(() => {
      slicePlate.classList.remove('hidden');
      cakeEngine.state = 'SLICE_DRAGGABLE';
    }, 1200);
  }

  function handleSliceEaten() {
    celebrationBanner.classList.add('hidden');
    slicePlate.classList.add('hidden');

    // Hide the stage area immediately so the cake disappears completely!
    stageArea.classList.add('hidden');

    if (activeMode === 'CLASSIC') {
      // Reveal Classic Birthday Card Overlay cleanly on top!
      setTimeout(() => {
        classicCardOverlay.classList.remove('hidden');
      }, 400);
    } else {
      // Reveal AI Avatars & Outro Overlay cleanly on top!
      setTimeout(() => {
        triggerAIAvatarsPhase();
      }, 600);
    }
  }

  // Close Card Overlay Listener
  classicCloseCardBtn.addEventListener('click', () => {
    classicCardOverlay.classList.add('hidden');
    startClassicMode();
  });

  // ------------------------------------------------------------------------
  // AGENTIC AVATARS & OUTRO PHASE
  // ------------------------------------------------------------------------
  function triggerAIAvatarsPhase() {
    avatar1.classList.remove('hidden');
    setTimeout(() => { avatar2.classList.remove('hidden'); }, 800);
    setTimeout(() => { avatar3.classList.remove('hidden'); }, 1600);

    setTimeout(() => {
      triggerCinematicOutro();
    }, 5500);
  }

  function triggerCinematicOutro() {
    avatar1.classList.add('hidden');
    avatar2.classList.add('hidden');
    avatar3.classList.add('hidden');

    hqContainer.classList.add('zoomed-out');
    hudStatusText.textContent = 'COMMENCING HQ STANDBY MODE';

    setTimeout(() => {
      hqContainer.classList.add('dimmed');
      hqContainer.classList.add('clapping');

      outroOverlay.classList.remove('hidden');
      outroOverlay.classList.add('active');

      setTimeout(() => {
        outroMessage.classList.add('fade-in');

        setTimeout(() => {
          companyLogo.classList.remove('hidden');
          companyLogo.classList.add('fade-in');

          setTimeout(() => {
            if (window.audioEngine) window.audioEngine.fadeOutMusic(3);
            setTimeout(() => {
              restartBtn.classList.remove('hidden');
            }, 1500);
          }, 2500);
        }, 2500);
      }, 1000);
    }, 2500);
  }

  function resetSceneUI() {
    terminalOverlay.classList.add('hidden');
    instructionBanner.classList.add('hidden');
    celebrationBanner.classList.add('hidden');
    slicePlate.classList.add('hidden');
    outroOverlay.classList.add('hidden');
    outroOverlay.classList.remove('active');
    hqContainer.classList.remove('zoomed-out');
    hqContainer.classList.remove('dimmed');
    hqContainer.classList.remove('clapping');
    avatar1.classList.add('hidden');
    avatar2.classList.add('hidden');
    avatar3.classList.add('hidden');
    roboticArm.classList.remove('delivered');
    roboticArm.classList.remove('retracted');
  }

  restartBtn.addEventListener('click', () => {
    window.location.reload();
  });

  // Instantiate Canvas Engine
  cakeEngine = new CakeEngine(
    'cake-canvas',
    handleCutComplete,
    handleSliceEaten
  );

  // Open Mode Selection Modal on startup
  openModeModal();
});
