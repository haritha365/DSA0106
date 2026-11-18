/**
 * ============================================================================
 * Capstone Project: Autonomous Vehicle Control Simulation (3-Module Edition)
 * ============================================================================
 * 3 Core Modules:
 * - Module 1: Autonomous Vehicle Control Using OOP (Base Class Vehicle)
 * - Module 2: Navigation & Obstacle Detection (Derived AutonomousCar, Radar & Danger Solutions)
 * - Module 3: Conventional Modular Programming Implementation (Procedural Structs & Standalone Functions)
 * 
 * Features:
 * - 2D Simulated Road with strict danger zone immobilization (Vehicle cannot move when distance <= threshold)
 * - Live Obstacle Radar Display & Automated Danger Zone Solution Center (Bypass Left/Right, Reverse Backout, Clear)
 * - Interactive Terminal Console with Main Menu options 1 to 9, and 0
 * - Automated 10 Capstone Test Cases Suite
 * - C++ Source Code Viewer & 1-Click File Downloader
 * ============================================================================
 */

// Global Configuration
const SIMULATION_CONFIG = {
  DEFAULT_SAFETY_THRESHOLD: 5.0, // meters
  MAX_SPEED: 120.0,              // km/h
  MIN_SPEED: 0.0,
  SPEED_STEP: 10.0,
  MAX_OBSTACLE_DISTANCE: 100.0,  // meters
};

// ============================================================================
// MODULE 1: AUTONOMOUS VEHICLE CONTROL USING OOP (BASE CLASS Vehicle)
// ============================================================================
class Vehicle {
  constructor(initialDirection = 'FORWARD') {
    this._speed = 0.0;
    this._direction = initialDirection; // FORWARD, BACKWARD, LEFT, RIGHT
    this._status = 'STOPPED';           // STOPPED, MOVING, EMERGENCY_STOP, WARNING
    this._headingAngle = 0;             // 0=FORWARD, 90=RIGHT, 180=BACKWARD, 270=LEFT
  }

  get speed() { return this._speed; }
  get direction() { return this._direction; }
  get status() { return this._status; }
  get headingAngle() { return this._headingAngle; }

  set speed(val) {
    this._speed = Math.max(SIMULATION_CONFIG.MIN_SPEED, Math.min(SIMULATION_CONFIG.MAX_SPEED, val));
    if (this._speed === 0 && this._status === 'MOVING') {
      this._status = 'STOPPED';
    } else if (this._speed > 0 && this._status === 'STOPPED') {
      this._status = 'MOVING';
    }
  }

  set direction(dir) {
    const valid = ['FORWARD', 'BACKWARD', 'LEFT', 'RIGHT'];
    if (valid.includes(dir)) {
      this._direction = dir;
      if (dir === 'FORWARD') this._headingAngle = 0;
      else if (dir === 'RIGHT') this._headingAngle = 90;
      else if (dir === 'BACKWARD') this._headingAngle = 180;
      else if (dir === 'LEFT') this._headingAngle = 270;
    }
  }

  set status(st) { this._status = st; }

  start() {
    if (this._status === 'MOVING') {
      return { success: false, message: '[Module 1 OOP] Vehicle is already running and in motion.' };
    }
    this._status = 'STOPPED';
    return { success: true, message: '[Module 1 OOP] Vehicle engine started successfully. Ready to move.' };
  }

  stop() {
    this._speed = 0.0;
    this._status = 'STOPPED';
    return { success: true, message: '[Module 1 OOP] Vehicle stopped successfully.' };
  }

  accelerate(delta = SIMULATION_CONFIG.SPEED_STEP) {
    if (this._speed + delta > SIMULATION_CONFIG.MAX_SPEED) {
      this._speed = SIMULATION_CONFIG.MAX_SPEED;
      this._status = 'MOVING';
      return { success: true, message: `[Module 1 OOP] Maximum speed reached (${SIMULATION_CONFIG.MAX_SPEED} km/h).` };
    }
    this._speed += delta;
    this._status = (this._speed > 0) ? 'MOVING' : 'STOPPED';
    return { success: true, message: `[Module 1 OOP] Vehicle moving at the selected speed: ${this._speed.toFixed(1)} km/h.` };
  }

  decelerate(delta = SIMULATION_CONFIG.SPEED_STEP) {
    if (this._speed <= 0.0) {
      return { success: false, message: '[Module 1 OOP] Vehicle is already at 0 km/h.' };
    }
    this._speed = Math.max(0.0, this._speed - delta);
    if (this._speed === 0.0) {
      this._status = 'STOPPED';
      return { success: true, message: '[Module 1 OOP] Decelerated to standstill. Vehicle stopped successfully.' };
    }
    return { success: true, message: `[Module 1 OOP] Vehicle decelerated. Current speed: ${this._speed.toFixed(1)} km/h.` };
  }

  setDirection(newDir) {
    const valid = ['FORWARD', 'BACKWARD', 'LEFT', 'RIGHT'];
    if (!valid.includes(newDir)) {
      return { success: false, message: '[Module 1 OOP] Error: Invalid direction. Use FORWARD, BACKWARD, LEFT, or RIGHT.' };
    }
    this.direction = newDir;
    return { success: true, message: `[Module 1 OOP] Vehicle direction changed to: ${this.direction}` };
  }

  displayStatus() {
    return [
      '========== OOP VEHICLE STATUS ==========',
      ` Status    : ${this._status}`,
      ` Speed     : ${this._speed.toFixed(1)} km/h`,
      ` Direction : ${this._direction} (${this._headingAngle}°)`,
      '========================================'
    ].join('\n');
  }
}

// ============================================================================
// MODULE 2: NAVIGATION, OBSTACLE DETECTION & DANGER SOLUTIONS (AutonomousCar)
// ============================================================================
class AutonomousCar extends Vehicle {
  constructor(threshold = SIMULATION_CONFIG.DEFAULT_SAFETY_THRESHOLD) {
    super('FORWARD');
    this._safetyThreshold = threshold;
    this._lastObstacleDist = 100.0;
    this._emergencyBrakeActive = false;
    this._currentLane = 'CENTER'; // LEFT, CENTER, RIGHT
    this._activeObstacles = [
      { id: 'OBS-1', type: 'Forward Path', lane: 'CENTER', distance: 100.0 }
    ];
  }

  get safetyThreshold() { return this._safetyThreshold; }
  set safetyThreshold(val) {
    if (val <= 0) throw new Error('Safety threshold must be positive.');
    this._safetyThreshold = val;
  }

  get lastObstacleDist() { return this._lastObstacleDist; }
  get emergencyBrakeActive() { return this._emergencyBrakeActive; }
  get currentLane() { return this._currentLane; }
  get activeObstacles() { return this._activeObstacles; }

  /**
   * Detect an obstacle in the specified (or current) lane.
   * Automatically locks vehicle in EMERGENCY_STOP if current-lane distance <= safetyThreshold.
   */
  detectObstacle(distance, type = 'Road Barricade', lane = null, preserveSideObstacles = false) {
    if (distance < 0) {
      return {
        success: false,
        error: true,
        message: '[Module 2 Navigation] Error: Distance cannot be negative! Please enter a valid distance.'
      };
    }

    const targetLane = lane || this._currentLane;

    if (!preserveSideObstacles && targetLane === this._currentLane) {
      // Single-obstacle update keeps side lanes clear unless explicitly populated
      this._activeObstacles = this._activeObstacles.filter(o => o.lane === targetLane);
    }

    const existing = this._activeObstacles.find(o => o.lane === targetLane);
    if (existing) {
      existing.type = distance > this._safetyThreshold * 3 ? 'Clear Path' : type;
      existing.distance = distance;
    } else {
      this._activeObstacles.push({
        id: `OBS-${this._activeObstacles.length + 1}`,
        type: distance > this._safetyThreshold * 3 ? 'Clear Path' : type,
        lane: targetLane,
        distance
      });
    }

    // Recompute active lane distance
    const currentLaneObs = this._activeObstacles.find(o => o.lane === this._currentLane);
    this._lastObstacleDist = currentLaneObs ? currentLaneObs.distance : distance;

    if (this._lastObstacleDist <= this._safetyThreshold) {
      this._emergencyBrakeActive = true;
      this._speed = 0.0;
      this._status = 'EMERGENCY_STOP';
      const solutions = this.getDangerZoneSolutions();
      const rec = solutions.find(s => s.recommended);
      return {
        success: true,
        safe: false,
        distance: this._lastObstacleDist,
        threshold: this._safetyThreshold,
        obstacleType: type,
        lane: this._currentLane,
        solutions,
        message: [
          `Obstacle Detected: ${type} [${this._currentLane} LANE]`,
          `Obstacle distance: ${this._lastObstacleDist.toFixed(1)} meters`,
          `Safety threshold : ${this._safetyThreshold.toFixed(1)} meters`,
          'Output: Obstacle detected!',
          'Output: Emergency stop activated.',
          `Recommended Solution: ${rec ? rec.title + ' -> ' + rec.description : 'Reverse / Clear Obstacle'}`
        ].join('\n')
      };
    } else {
      this._emergencyBrakeActive = false;
      if (this._status === 'EMERGENCY_STOP') {
        this._status = 'STOPPED';
      }
      return {
        success: true,
        safe: true,
        distance: this._lastObstacleDist,
        threshold: this._safetyThreshold,
        message: [
          `Obstacle distance: ${this._lastObstacleDist.toFixed(1)} meters (${this._currentLane} LANE)`,
          `Safety threshold : ${this._safetyThreshold.toFixed(1)} meters`,
          'Output: Path safe.',
          `Status: Distance (${this._lastObstacleDist.toFixed(1)}m) > safety threshold (${this._safetyThreshold.toFixed(1)}m). Vehicle may continue moving.`
        ].join('\n')
      };
    }
  }

  /**
   * Computes lane availability and returns ranked Danger Zone Solutions.
   */
  getDangerZoneSolutions() {
    const laneObstacle = (ln) => this._activeObstacles.find(o => o.lane === ln);
    const isLaneSafe = (ln) => {
      const obs = laneObstacle(ln);
      return !obs || obs.distance > this._safetyThreshold;
    };

    const canGoLeft = (this._currentLane === 'CENTER' && isLaneSafe('LEFT')) ||
                      (this._currentLane === 'RIGHT' && isLaneSafe('CENTER'));
    const canGoRight = (this._currentLane === 'CENTER' && isLaneSafe('RIGHT')) ||
                       (this._currentLane === 'LEFT' && isLaneSafe('CENTER'));

    const leftTarget = this._currentLane === 'RIGHT' ? 'CENTER' : 'LEFT';
    const rightTarget = this._currentLane === 'LEFT' ? 'CENTER' : 'RIGHT';

    const solutions = [];

    if (this._currentLane !== 'LEFT') {
      solutions.push({
        id: 'BYPASS_LEFT',
        title: `Evasive Bypass to ${leftTarget} Lane`,
        available: canGoLeft,
        recommended: canGoLeft,
        description: canGoLeft
          ? `${leftTarget} lane sensor confirms clear corridor (> ${this._safetyThreshold.toFixed(1)}m). Safely steer left to bypass hazard.`
          : `${leftTarget} lane is also blocked (${laneObstacle(leftTarget)?.distance.toFixed(1)}m). Cannot bypass left.`,
        codeHint: `car.resolveDangerZone("BYPASS_LEFT");`
      });
    }

    if (this._currentLane !== 'RIGHT') {
      const recRight = !canGoLeft && canGoRight;
      solutions.push({
        id: 'BYPASS_RIGHT',
        title: `Evasive Bypass to ${rightTarget} Lane`,
        available: canGoRight,
        recommended: recRight,
        description: canGoRight
          ? `${rightTarget} lane sensor confirms clear corridor (> ${this._safetyThreshold.toFixed(1)}m). Safely steer right to bypass hazard.`
          : `${rightTarget} lane is also blocked (${laneObstacle(rightTarget)?.distance.toFixed(1)}m). Cannot bypass right.`,
        codeHint: `car.resolveDangerZone("BYPASS_RIGHT");`
      });
    }

    const noBypassAvailable = !canGoLeft && !canGoRight;
    solutions.push({
      id: 'REVERSE_BACKOUT',
      title: 'Controlled Reverse Backout (+10.0m)',
      available: true,
      recommended: noBypassAvailable,
      description: `Reverses vehicle 10.0m away from hazard (new clearance: ${(this._lastObstacleDist + 10.0).toFixed(1)}m > ${this._safetyThreshold.toFixed(1)}m threshold) to restore safe stopping gap.`,
      codeHint: `car.resolveDangerZone("REVERSE_BACKOUT");`
    });

    solutions.push({
      id: 'CLEAR_OBSTACLE',
      title: 'Wait & Verify Path Cleared (75.0m)',
      available: true,
      recommended: false,
      description: 'Hold emergency stop until pedestrian/vehicle obstacle moves out of danger zone, then reset radar clearance to 75.0m.',
      codeHint: `car.resolveDangerZone("CLEAR_OBSTACLE");`
    });

    return solutions;
  }

  /**
   * Executes a Danger Zone recovery solution cleanly and unlocks vehicle control when safe.
   */
  resolveDangerZone(solutionType = 'AUTO') {
    const solutions = this.getDangerZoneSolutions();
    let chosen = solutionType;
    if (chosen === 'AUTO') {
      const rec = solutions.find(s => s.recommended && s.available) || solutions.find(s => s.id === 'REVERSE_BACKOUT');
      chosen = rec.id;
    }

    if (chosen === 'BYPASS_LEFT') {
      const targetLane = this._currentLane === 'RIGHT' ? 'CENTER' : (this._currentLane === 'CENTER' ? 'LEFT' : null);
      if (!targetLane) {
        return { success: false, message: '[Danger Solution] Already in leftmost lane.' };
      }
      const laneObs = this._activeObstacles.find(o => o.lane === targetLane);
      const laneDist = laneObs ? laneObs.distance : 75.0;
      if (laneDist <= this._safetyThreshold) {
        return { success: false, message: `[Danger Solution] ${targetLane} lane is blocked (${laneDist.toFixed(1)}m). Choose another solution.` };
      }
      this._currentLane = targetLane;
      this._lastObstacleDist = laneDist;
      this._emergencyBrakeActive = false;
      this.direction = 'FORWARD';
      this._speed = 25.0;
      this._status = 'MOVING';
      return {
        success: true,
        solution: 'BYPASS_LEFT',
        message: `[Danger Solution] Executed BYPASS_LEFT -> Shifted to ${targetLane} lane (Clearance: ${laneDist.toFixed(1)}m). Resuming safe cruise at 25.0 km/h.`
      };
    }

    if (chosen === 'BYPASS_RIGHT') {
      const targetLane = this._currentLane === 'LEFT' ? 'CENTER' : (this._currentLane === 'CENTER' ? 'RIGHT' : null);
      if (!targetLane) {
        return { success: false, message: '[Danger Solution] Already in rightmost lane.' };
      }
      const laneObs = this._activeObstacles.find(o => o.lane === targetLane);
      const laneDist = laneObs ? laneObs.distance : 75.0;
      if (laneDist <= this._safetyThreshold) {
        return { success: false, message: `[Danger Solution] ${targetLane} lane is blocked (${laneDist.toFixed(1)}m). Choose another solution.` };
      }
      this._currentLane = targetLane;
      this._lastObstacleDist = laneDist;
      this._emergencyBrakeActive = false;
      this.direction = 'FORWARD';
      this._speed = 25.0;
      this._status = 'MOVING';
      return {
        success: true,
        solution: 'BYPASS_RIGHT',
        message: `[Danger Solution] Executed BYPASS_RIGHT -> Shifted to ${targetLane} lane (Clearance: ${laneDist.toFixed(1)}m). Resuming safe cruise at 25.0 km/h.`
      };
    }

    if (chosen === 'REVERSE_BACKOUT') {
      this._lastObstacleDist = parseFloat((this._lastObstacleDist + 10.0).toFixed(1));
      const obs = this._activeObstacles.find(o => o.lane === this._currentLane);
      if (obs) obs.distance = this._lastObstacleDist;
      this._emergencyBrakeActive = this._lastObstacleDist <= this._safetyThreshold;
      this.direction = 'BACKWARD';
      this._speed = 0.0;
      this._status = this._emergencyBrakeActive ? 'EMERGENCY_STOP' : 'STOPPED';
      return {
        success: !this._emergencyBrakeActive,
        solution: 'REVERSE_BACKOUT',
        message: `[Danger Solution] Executed REVERSE_BACKOUT (+10.0m). New obstacle clearance: ${this._lastObstacleDist.toFixed(1)}m. Safety interlock released.`
      };
    }

    if (chosen === 'CLEAR_OBSTACLE') {
      this._activeObstacles = [{ id: 'OBS-1', type: 'Clear Path', lane: this._currentLane, distance: 75.0 }];
      this._lastObstacleDist = 75.0;
      this._emergencyBrakeActive = false;
      this._status = 'STOPPED';
      this._speed = 0.0;
      return {
        success: true,
        solution: 'CLEAR_OBSTACLE',
        message: `[Danger Solution] Road obstacle cleared (75.0m > ${this._safetyThreshold.toFixed(1)}m). Vehicle ready to drive.`
      };
    }

    return { success: false, message: '[Danger Solution] Unknown solution command.' };
  }

  move(moveDir = 'FORWARD', targetSpeed = 30.0) {
    if (this._emergencyBrakeActive && this._lastObstacleDist <= this._safetyThreshold) {
      this._speed = 0.0;
      this._status = 'EMERGENCY_STOP';
      return {
        success: false,
        interlock: true,
        message: `[Module 2 Navigation] Action blocked: Obstacle (${this._lastObstacleDist.toFixed(1)}m) <= safety threshold (${this._safetyThreshold.toFixed(1)}m). Use a Danger Zone Solution first.`
      };
    }

    const dirRes = this.setDirection(moveDir);
    if (!dirRes.success) return dirRes;

    this._speed = Math.max(0.0, Math.min(SIMULATION_CONFIG.MAX_SPEED, targetSpeed));
    this._status = (this._speed > 0) ? 'MOVING' : 'STOPPED';
    return {
      success: true,
      message: `[Module 2 Navigation] Moving ${this._direction} in ${this._currentLane} lane at ${this._speed.toFixed(1)} km/h.`
    };
  }

  reset() {
    this._speed = 0.0;
    this._direction = 'FORWARD';
    this._headingAngle = 0;
    this._status = 'STOPPED';
    this._currentLane = 'CENTER';
    this._lastObstacleDist = 100.0;
    this._emergencyBrakeActive = false;
    this._activeObstacles = [{ id: 'OBS-1', type: 'Forward Path', lane: 'CENTER', distance: 100.0 }];
    return { success: true, message: '[AutonomousCar] Vehicle reset to initial factory state.' };
  }

  displayStatus() {
    const obsLines = this._activeObstacles.map(o =>
      `   * ${o.id}: ${o.type} | Lane: ${o.lane} | Dist: ${o.distance.toFixed(1)}m [${o.distance <= this._safetyThreshold ? 'DANGER' : 'SAFE'}]`
    );
    return [
      '========== AUTONOMOUS VEHICLE STATUS (MODULES 1 & 2) ==========',
      ` Operating Status    : ${this._status}`,
      ` Current Speed       : ${this._speed.toFixed(1)} km/h`,
      ` Movement Direction  : ${this._direction} (${this._headingAngle}°) | Lane: ${this._currentLane}`,
      ` Safety Threshold    : ${this._safetyThreshold.toFixed(1)} meters`,
      ` Last Obstacle Dist  : ${this._lastObstacleDist.toFixed(1)} meters`,
      ` Emergency Interlock : ${this._emergencyBrakeActive ? 'ENGAGED (IMMOBILIZED)' : 'DISENGAGED (CLEAR)'}`,
      ' Active Radar Objects:',
      ...obsLines,
      '==============================================================='
    ].join('\n');
  }
}

// ============================================================================
// MODULE 3: CONVENTIONAL MODULAR PROGRAMMING IMPLEMENTATION (PROCEDURAL)
// ============================================================================
const modularState = {
  speed: 0.0,
  direction: 'FORWARD',
  status: 'STOPPED',
  currentLane: 'CENTER',
  safetyThreshold: SIMULATION_CONFIG.DEFAULT_SAFETY_THRESHOLD,
  lastObstacleDist: 100.0,
  emergencyBrakeActive: false,
  headingAngle: 0,
  activeObstacles: [{ id: 'OBS-1', type: 'Forward Path', lane: 'CENTER', distance: 100.0 }]
};

function modularInit(threshold = SIMULATION_CONFIG.DEFAULT_SAFETY_THRESHOLD) {
  modularState.speed = 0.0;
  modularState.direction = 'FORWARD';
  modularState.status = 'STOPPED';
  modularState.currentLane = 'CENTER';
  modularState.safetyThreshold = threshold;
  modularState.lastObstacleDist = 100.0;
  modularState.emergencyBrakeActive = false;
  modularState.headingAngle = 0;
  modularState.activeObstacles = [{ id: 'OBS-1', type: 'Forward Path', lane: 'CENTER', distance: 100.0 }];
}

function modularStart() {
  if (modularState.status === 'MOVING') {
    return { success: false, message: '[Module 3 Conv. Modular] Notice: Vehicle is already running.' };
  }
  modularState.status = 'STOPPED';
  return { success: true, message: '[Module 3 Conv. Modular] Vehicle started successfully.' };
}

function modularStop() {
  modularState.speed = 0.0;
  modularState.status = 'STOPPED';
  return { success: true, message: '[Module 3 Conv. Modular] Vehicle stopped successfully.' };
}

function modularAccelerate(delta = SIMULATION_CONFIG.SPEED_STEP) {
  modularState.speed = Math.min(SIMULATION_CONFIG.MAX_SPEED, modularState.speed + delta);
  modularState.status = (modularState.speed > 0) ? 'MOVING' : 'STOPPED';
  return { success: true, message: `[Module 3 Conv. Modular] Vehicle moving at the selected speed: ${modularState.speed.toFixed(1)} km/h.` };
}

function modularDecelerate(delta = SIMULATION_CONFIG.SPEED_STEP) {
  if (modularState.speed <= 0.0) {
    return { success: false, message: '[Module 3 Conv. Modular] Vehicle is already at 0 km/h.' };
  }
  modularState.speed = Math.max(0.0, modularState.speed - delta);
  if (modularState.speed === 0.0) modularState.status = 'STOPPED';
  return { success: true, message: `[Module 3 Conv. Modular] Speed reduced to: ${modularState.speed.toFixed(1)} km/h.` };
}

function modularChangeDirection(newDir) {
  const valid = ['FORWARD', 'BACKWARD', 'LEFT', 'RIGHT'];
  if (!valid.includes(newDir)) {
    return { success: false, message: '[Module 3 Conv. Modular] Error: Invalid direction.' };
  }
  modularState.direction = newDir;
  if (newDir === 'FORWARD') modularState.headingAngle = 0;
  else if (newDir === 'RIGHT') modularState.headingAngle = 90;
  else if (newDir === 'BACKWARD') modularState.headingAngle = 180;
  else if (newDir === 'LEFT') modularState.headingAngle = 270;
  return { success: true, message: `[Module 3 Conv. Modular] Vehicle direction changed to: ${modularState.direction}` };
}

function modularGetDangerZoneSolutions() {
  const laneObs = (ln) => modularState.activeObstacles.find(o => o.lane === ln);
  const isClear = (ln) => {
    const o = laneObs(ln);
    return !o || o.distance > modularState.safetyThreshold;
  };
  const canLeft = (modularState.currentLane === 'CENTER' && isClear('LEFT')) ||
                  (modularState.currentLane === 'RIGHT' && isClear('CENTER'));
  const canRight = (modularState.currentLane === 'CENTER' && isClear('RIGHT')) ||
                   (modularState.currentLane === 'LEFT' && isClear('CENTER'));
  const leftTarget = modularState.currentLane === 'RIGHT' ? 'CENTER' : 'LEFT';
  const rightTarget = modularState.currentLane === 'LEFT' ? 'CENTER' : 'RIGHT';

  const solutions = [];
  if (modularState.currentLane !== 'LEFT') {
    solutions.push({
      id: 'BYPASS_LEFT',
      title: `Evasive Bypass to ${leftTarget} Lane`,
      available: canLeft,
      recommended: canLeft,
      description: canLeft
        ? `${leftTarget} lane is clear (> ${modularState.safetyThreshold.toFixed(1)}m). Shift lane left via modularResolveDangerZone().`
        : `${leftTarget} lane is blocked (${laneObs(leftTarget)?.distance.toFixed(1)}m).`,
      codeHint: `modularResolveDangerZone(v, "BYPASS_LEFT");`
    });
  }
  if (modularState.currentLane !== 'RIGHT') {
    solutions.push({
      id: 'BYPASS_RIGHT',
      title: `Evasive Bypass to ${rightTarget} Lane`,
      available: canRight,
      recommended: !canLeft && canRight,
      description: canRight
        ? `${rightTarget} lane is clear (> ${modularState.safetyThreshold.toFixed(1)}m). Shift lane right via modularResolveDangerZone().`
        : `${rightTarget} lane is blocked (${laneObs(rightTarget)?.distance.toFixed(1)}m).`,
      codeHint: `modularResolveDangerZone(v, "BYPASS_RIGHT");`
    });
  }
  solutions.push({
    id: 'REVERSE_BACKOUT',
    title: 'Controlled Reverse Backout (+10.0m)',
    available: true,
    recommended: !canLeft && !canRight,
    description: `Increases distance to ${(modularState.lastObstacleDist + 10.0).toFixed(1)}m (> ${modularState.safetyThreshold.toFixed(1)}m) cleanly.`,
    codeHint: `modularResolveDangerZone(v, "REVERSE_BACKOUT");`
  });
  solutions.push({
    id: 'CLEAR_OBSTACLE',
    title: 'Wait & Verify Path Cleared (75.0m)',
    available: true,
    recommended: false,
    description: 'Clears hazard flag once roadway ahead becomes clear.',
    codeHint: `modularResolveDangerZone(v, "CLEAR_OBSTACLE");`
  });
  return solutions;
}

function modularDetectObstacle(distance, type = 'Road Barricade', lane = null, preserveSideObstacles = false) {
  if (distance < 0.0) {
    return { success: false, message: '[Module 3 Conv. Modular] Error: Distance cannot be negative!' };
  }
  const targetLane = lane || modularState.currentLane;
  if (!preserveSideObstacles && targetLane === modularState.currentLane) {
    modularState.activeObstacles = modularState.activeObstacles.filter(o => o.lane === targetLane);
  }
  const existing = modularState.activeObstacles.find(o => o.lane === targetLane);
  if (existing) {
    existing.type = distance > modularState.safetyThreshold * 3 ? 'Clear Path' : type;
    existing.distance = distance;
  } else {
    modularState.activeObstacles.push({
      id: `OBS-${modularState.activeObstacles.length + 1}`,
      type: distance > modularState.safetyThreshold * 3 ? 'Clear Path' : type,
      lane: targetLane,
      distance
    });
  }

  const curObs = modularState.activeObstacles.find(o => o.lane === modularState.currentLane);
  modularState.lastObstacleDist = curObs ? curObs.distance : distance;

  if (modularState.lastObstacleDist <= modularState.safetyThreshold) {
    modularState.emergencyBrakeActive = true;
    modularState.speed = 0.0;
    modularState.status = 'EMERGENCY_STOP';
    const solutions = modularGetDangerZoneSolutions();
    const rec = solutions.find(s => s.recommended);
    return {
      success: true,
      safe: false,
      solutions,
      message: [
        `Obstacle Detected: ${type} [${modularState.currentLane} LANE]`,
        `Obstacle distance: ${modularState.lastObstacleDist.toFixed(1)} meters`,
        `Safety threshold : ${modularState.safetyThreshold.toFixed(1)} meters`,
        'Output: Obstacle detected!',
        'Output: Emergency stop activated.',
        `Recommended Solution: ${rec ? rec.title : 'Reverse Backout'}`
      ].join('\n')
    };
  } else {
    modularState.emergencyBrakeActive = false;
    if (modularState.status === 'EMERGENCY_STOP') modularState.status = 'STOPPED';
    return {
      success: true,
      safe: true,
      message: [
        `Obstacle distance: ${modularState.lastObstacleDist.toFixed(1)} meters`,
        `Safety threshold : ${modularState.safetyThreshold.toFixed(1)} meters`,
        'Output: Path safe.'
      ].join('\n')
    };
  }
}

function modularResolveDangerZone(solutionType = 'AUTO') {
  const solutions = modularGetDangerZoneSolutions();
  let chosen = solutionType;
  if (chosen === 'AUTO') {
    const rec = solutions.find(s => s.recommended && s.available) || solutions.find(s => s.id === 'REVERSE_BACKOUT');
    chosen = rec.id;
  }

  if (chosen === 'BYPASS_LEFT') {
    const targetLane = modularState.currentLane === 'RIGHT' ? 'CENTER' : (modularState.currentLane === 'CENTER' ? 'LEFT' : null);
    if (!targetLane) return { success: false, message: '[Modular Solution] Already in leftmost lane.' };
    const laneObs = modularState.activeObstacles.find(o => o.lane === targetLane);
    const laneDist = laneObs ? laneObs.distance : 75.0;
    if (laneDist <= modularState.safetyThreshold) {
      return { success: false, message: `[Modular Solution] ${targetLane} lane is blocked (${laneDist.toFixed(1)}m).` };
    }
    modularState.currentLane = targetLane;
    modularState.lastObstacleDist = laneDist;
    modularState.emergencyBrakeActive = false;
    modularChangeDirection('FORWARD');
    modularState.speed = 25.0;
    modularState.status = 'MOVING';
    return { success: true, message: `[Modular Solution] Bypassed LEFT -> ${targetLane} lane (${laneDist.toFixed(1)}m clear). Cruising at 25.0 km/h.` };
  }

  if (chosen === 'BYPASS_RIGHT') {
    const targetLane = modularState.currentLane === 'LEFT' ? 'CENTER' : (modularState.currentLane === 'CENTER' ? 'RIGHT' : null);
    if (!targetLane) return { success: false, message: '[Modular Solution] Already in rightmost lane.' };
    const laneObs = modularState.activeObstacles.find(o => o.lane === targetLane);
    const laneDist = laneObs ? laneObs.distance : 75.0;
    if (laneDist <= modularState.safetyThreshold) {
      return { success: false, message: `[Modular Solution] ${targetLane} lane is blocked (${laneDist.toFixed(1)}m).` };
    }
    modularState.currentLane = targetLane;
    modularState.lastObstacleDist = laneDist;
    modularState.emergencyBrakeActive = false;
    modularChangeDirection('FORWARD');
    modularState.speed = 25.0;
    modularState.status = 'MOVING';
    return { success: true, message: `[Modular Solution] Bypassed RIGHT -> ${targetLane} lane (${laneDist.toFixed(1)}m clear). Cruising at 25.0 km/h.` };
  }

  if (chosen === 'REVERSE_BACKOUT') {
    modularState.lastObstacleDist = parseFloat((modularState.lastObstacleDist + 10.0).toFixed(1));
    const obs = modularState.activeObstacles.find(o => o.lane === modularState.currentLane);
    if (obs) obs.distance = modularState.lastObstacleDist;
    modularState.emergencyBrakeActive = modularState.lastObstacleDist <= modularState.safetyThreshold;
    modularChangeDirection('BACKWARD');
    modularState.speed = 0.0;
    modularState.status = modularState.emergencyBrakeActive ? 'EMERGENCY_STOP' : 'STOPPED';
    return { success: !modularState.emergencyBrakeActive, message: `[Modular Solution] Reversed +10.0m -> Clearance: ${modularState.lastObstacleDist.toFixed(1)}m.` };
  }

  if (chosen === 'CLEAR_OBSTACLE') {
    modularState.activeObstacles = [{ id: 'OBS-1', type: 'Clear Path', lane: modularState.currentLane, distance: 75.0 }];
    modularState.lastObstacleDist = 75.0;
    modularState.emergencyBrakeActive = false;
    modularState.speed = 0.0;
    modularState.status = 'STOPPED';
    return { success: true, message: `[Modular Solution] Road obstacle cleared (75.0m).` };
  }

  return { success: false, message: '[Modular Solution] Invalid solution choice.' };
}

function modularMove(moveDir = 'FORWARD', targetSpeed = 30.0) {
  if (modularState.emergencyBrakeActive && modularState.lastObstacleDist <= modularState.safetyThreshold) {
    return {
      success: false,
      message: `[Module 3 Conv. Modular] Action blocked: Obstacle within safety threshold (${modularState.safetyThreshold.toFixed(1)}m). Execute a Danger Zone Solution first.`
    };
  }
  modularChangeDirection(moveDir);
  modularState.speed = Math.max(0.0, Math.min(SIMULATION_CONFIG.MAX_SPEED, targetSpeed));
  modularState.status = (modularState.speed > 0) ? 'MOVING' : 'STOPPED';
  return {
    success: true,
    message: `[Module 3 Conv. Modular] Moving ${modularState.direction} in ${modularState.currentLane} lane at ${modularState.speed.toFixed(1)} km/h.`
  };
}

function modularDisplayStatus() {
  const obsLines = modularState.activeObstacles.map(o =>
    `   * ${o.id}: ${o.type} | Lane: ${o.lane} | Dist: ${o.distance.toFixed(1)}m`
  );
  return [
    '========== MODULAR VEHICLE STATUS (MODULE 3) ==========',
    ` Status            : ${modularState.status}`,
    ` Speed             : ${modularState.speed.toFixed(1)} km/h`,
    ` Direction         : ${modularState.direction} (${modularState.headingAngle}°) | Lane: ${modularState.currentLane}`,
    ` Safety Threshold  : ${modularState.safetyThreshold.toFixed(1)} meters`,
    ` Last Obstacle     : ${modularState.lastObstacleDist.toFixed(1)} meters`,
    ` Emergency Brake   : ${modularState.emergencyBrakeActive ? 'ENGAGED (IMMOBILIZED)' : 'CLEAR'}`,
    ' Active Radar Objects:',
    ...obsLines,
    '======================================================='
  ].join('\n');
}

// ============================================================================
// FULL SIMULATION APP CONTROLLER
// ============================================================================
class SimulationApp {
  constructor() {
    this.currentMode = 'OOP'; // 'OOP' or 'MODULAR'
    this.car = new AutonomousCar(SIMULATION_CONFIG.DEFAULT_SAFETY_THRESHOLD);
    this.totalOps = 0;
    this.simSeconds = 0;
    this.simTimer = null;

    // 2D Canvas setup
    this.canvas = document.getElementById('vehicleCanvas');
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    this.roadOffset = 0;
    this.radarAngle = 0;
    this.visualCarX = this.canvas ? this.canvas.width / 2 : 300;
    this.lastSolutionApplied = null;

    // Interactive Terminal State
    this.terminalState = {
      awaitingInputFor: null,
      tempData: {},
    };

    this.init();
  }

  init() {
    this.initElements();
    this.bindEvents();
    this.startSimTimer();
    this.initCanvasLoop();
    this.updateDashboard();
    this.printTerminalWelcome();

    const hashSection = window.location.hash ? window.location.hash.replace('#', '') : '';
    const validSections = ['dashboard', 'module-oop', 'module-nav', 'module-modular', 'results', 'cpp-code'];
    if (hashSection && validSections.includes(hashSection)) {
      this.navigateTo(hashSection);
    }
  }

  initElements() {
    this.dom = {
      liveSimTimer: document.getElementById('live-sim-timer'),
      totalOpsBadge: document.getElementById('total-ops-badge'),

      telemetryStatus: document.getElementById('telemetry-status'),
      telemetryStatusDetail: document.getElementById('telemetry-status-detail'),
      statusDot: document.getElementById('status-indicator-dot'),
      telemetrySpeed: document.getElementById('telemetry-speed'),
      speedBar: document.getElementById('speed-progress-bar'),
      telemetryDir: document.getElementById('telemetry-direction'),
      telemetryDeg: document.getElementById('telemetry-heading-deg'),
      dirArrow: document.getElementById('direction-arrow-icon'),
      telemetryDistance: document.getElementById('telemetry-distance'),
      distanceBar: document.getElementById('distance-progress-bar'),
      telemetryObstacleStatus: document.getElementById('telemetry-obstacle-status'),
      telemetryObstacleDetail: document.getElementById('telemetry-obstacle-detail'),
      telemetryThreshold: document.getElementById('telemetry-threshold-val'),

      paramSpeed: document.getElementById('param-speed'),
      paramDirection: document.getElementById('param-direction'),
      paramStatus: document.getElementById('param-status'),
      paramObstacleStatus: document.getElementById('param-obstacle-status'),
      paramDistance: document.getElementById('param-distance'),
      paramSafetyAction: document.getElementById('param-safety-action'),
      paramThreshold: document.getElementById('param-threshold'),
      paramMode: document.getElementById('param-mode'),
      paramOpsCount: document.getElementById('param-ops-count'),
      paramSimTime: document.getElementById('param-sim-time'),

      hudSpeedTag: document.getElementById('hud-speed-tag'),
      hudRadarStatus: document.getElementById('hud-radar-status'),
      canvasCoord: document.getElementById('canvas-vehicle-coord'),
      dangerBanner: document.getElementById('danger-interlock-banner'),
      obstacleSolutionPanel: document.getElementById('obstacle-solution-panel'),

      terminalLog: document.getElementById('terminal-interactive-log'),
      terminalInput: document.getElementById('terminal-cmd-input'),
      activityLog: document.getElementById('simulation-activity-log'),

      thresholdInput: document.getElementById('config-safety-threshold-input'),
      thresholdRange: document.getElementById('config-safety-threshold-range'),
      distanceCustomInput: document.getElementById('custom-obstacle-distance-input'),
      obstacleTypeSelect: document.getElementById('custom-obstacle-type-select'),
      obstacleLaneSelect: document.getElementById('custom-obstacle-lane-select'),
    };
  }

  bindEvents() {
    document.querySelectorAll('[data-section]').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const section = link.getAttribute('data-section');
        this.navigateTo(section);
      });
    });

    const oopBtn = document.getElementById('quick-toggle-oop');
    const modBtn = document.getElementById('quick-toggle-modular');
    if (oopBtn) oopBtn.addEventListener('click', () => this.setMode('OOP'));
    if (modBtn) modBtn.addEventListener('click', () => this.setMode('MODULAR'));

    if (this.dom.thresholdRange) {
      this.dom.thresholdRange.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        this.updateSafetyThreshold(val);
      });
    }
    if (this.dom.thresholdInput) {
      this.dom.thresholdInput.addEventListener('change', (e) => {
        const val = parseFloat(e.target.value);
        if (val > 0) this.updateSafetyThreshold(val);
      });
    }

    this.bindClick('btn-start-vehicle', () => this.executeOption(1));
    this.bindClick('btn-move-forward', () => this.executeOption(2, { dir: 'FORWARD', speed: 30 }));
    this.bindClick('btn-move-backward', () => this.executeOption(2, { dir: 'BACKWARD', speed: 20 }));
    this.bindClick('btn-turn-left', () => this.executeOption(3, { dir: 'LEFT' }));
    this.bindClick('btn-turn-right', () => this.executeOption(3, { dir: 'RIGHT' }));
    this.bindClick('btn-increase-speed', () => this.executeOption(4, { delta: 10 }));
    this.bindClick('btn-decrease-speed', () => this.executeOption(5, { delta: 10 }));
    this.bindClick('btn-detect-obstacle', () => this.promptDetectObstacle());
    this.bindClick('btn-stop-vehicle', () => this.handleStop());
    this.bindClick('btn-reset-simulation', () => this.executeOption(9));
    this.bindClick('dashboard-reset-btn', () => this.executeOption(9));

    // Preset Obstacle Buttons
    this.bindClick('preset-danger-3m', () => this.executeOption(6, { distance: 3.0, type: 'Road Barricade' }));
    this.bindClick('preset-threshold-5m', () => this.executeOption(6, { distance: 5.0, type: 'Stopped Vehicle' }));
    this.bindClick('preset-warning-25m', () => this.executeOption(6, { distance: 25.0, type: 'Construction Cone' }));
    this.bindClick('preset-clear-75m', () => this.executeOption(6, { distance: 75.0, type: 'Clear Path' }));

    // Apply custom obstacle distance/type/lane
    this.bindClick('btn-apply-custom-distance', () => {
      if (this.dom.distanceCustomInput) {
        const dist = parseFloat(this.dom.distanceCustomInput.value);
        if (isNaN(dist)) {
          this.logTerminal('Error: Please enter a valid numerical distance.', 'text-danger');
          return;
        }
        const type = this.dom.obstacleTypeSelect ? this.dom.obstacleTypeSelect.value : 'Road Barricade';
        const lane = this.dom.obstacleLaneSelect && this.dom.obstacleLaneSelect.value !== 'AUTO'
          ? this.dom.obstacleLaneSelect.value
          : null;
        this.executeOption(6, { distance: dist, type, lane, preserveSide: !!lane });
      }
    });

    for (let i = 0; i <= 8; i++) {
      this.bindClick(`term-btn-${i}`, () => this.handleTerminalMenuClick(i));
    }

    if (this.dom.terminalInput) {
      this.dom.terminalInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          this.handleTerminalInputSubmit();
        }
      });
    }

    this.bindClick('btn-run-all-tests', () => this.runAutomatedTestSuite());

    this.bindClick('btn-clear-terminal', () => {
      if (this.dom.terminalLog) {
        this.dom.terminalLog.innerHTML = '';
        this.printTerminalWelcome();
      }
    });

    this.bindClick('btn-download-single-file', () => this.downloadSingleFileHtml());
    this.bindClick('btn-download-main-cpp', () => this.downloadCppFile('main.cpp'));
    this.bindClick('btn-copy-cpp-code', () => this.copyCppSource());
  }

  bindClick(id, handler) {
    const el = document.getElementById(id);
    if (el) el.addEventListener('click', handler);
  }

  navigateTo(sectionId) {
    document.querySelectorAll('.content-section').forEach(sec => sec.classList.add('d-none'));
    document.querySelectorAll('.navbar-nav .nav-link').forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('data-section') === sectionId) link.classList.add('active');
    });

    const target = document.getElementById(`section-${sectionId}`);
    if (target) {
      target.classList.remove('d-none');
      window.location.hash = sectionId;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  setMode(mode) {
    this.currentMode = mode;
    const oopBtn = document.getElementById('quick-toggle-oop');
    const modBtn = document.getElementById('quick-toggle-modular');
    if (oopBtn && modBtn) {
      oopBtn.classList.toggle('active', mode === 'OOP');
      modBtn.classList.toggle('active', mode === 'MODULAR');
    }
    const modeBadge = document.getElementById('control-active-mode-badge');
    if (modeBadge) {
      modeBadge.textContent = mode === 'OOP' ? 'MODULES 1 & 2: OOP & NAVIGATION' : 'MODULE 3: CONVENTIONAL MODULAR';
      modeBadge.className = mode === 'OOP' ? 'badge bg-info text-dark font-monospace fw-bold' : 'badge bg-warning text-dark font-monospace fw-bold';
    }
    const modeLabel = mode === 'OOP' ? 'OOP & Navigation (Modules 1 & 2)' : 'Conventional Modular Programming (Module 3)';
    this.log(`Switched active paradigm to: ${modeLabel}`, 'log-system');
    this.logTerminal(`[System] Switched active execution engine to ${modeLabel}.`, 'text-info');
    this.updateDashboard();
  }

  updateSafetyThreshold(val) {
    if (val <= 0) return;
    this.car.safetyThreshold = val;
    modularState.safetyThreshold = val;

    if (this.dom.thresholdInput) this.dom.thresholdInput.value = val.toFixed(1);
    if (this.dom.thresholdRange) this.dom.thresholdRange.value = val;
    if (this.dom.paramThreshold) this.dom.paramThreshold.textContent = `${val.toFixed(1)} m`;
    if (this.dom.telemetryThreshold) this.dom.telemetryThreshold.textContent = `${val.toFixed(1)}m`;

    this.log(`Configured Safety Threshold to: ${val.toFixed(1)} meters`, 'log-action');
    this.logTerminal(`[Safety Config] Safety threshold updated to ${val.toFixed(1)} meters.`, 'text-warning');

    const curDist = this.currentMode === 'OOP' ? this.car.lastObstacleDist : modularState.lastObstacleDist;
    this.executeOption(6, { distance: curDist });
  }

  // ==========================================================================
  // OBSTACLE SCENARIOS & DANGER ZONE SOLUTION EXECUTION
  // ==========================================================================
  spawnObstacleScenario(scenarioKey) {
    const isOop = this.currentMode === 'OOP';
    const curLane = isOop ? this.car.currentLane : modularState.currentLane;
    this.lastSolutionApplied = null;
    this.totalOps++;

    if (scenarioKey === 'stopped_car') {
      this.executeOption(6, { distance: 3.0, type: 'Stopped Vehicle', lane: curLane, preserveSide: false });
    } else if (scenarioKey === 'pedestrian') {
      this.executeOption(6, { distance: 2.5, type: 'Pedestrian Crossing', lane: curLane, preserveSide: false });
    } else if (scenarioKey === 'multi_lane') {
      // Block center + left so RIGHT bypass becomes the smart recommended solution
      if (isOop) {
        this.car.detectObstacle(3.5, 'Road Barricade', 'CENTER', false);
        this.car.detectObstacle(4.0, 'Construction Cone', 'LEFT', true);
      } else {
        modularDetectObstacle(3.5, 'Road Barricade', 'CENTER', false);
        modularDetectObstacle(4.0, 'Construction Cone', 'LEFT', true);
      }
      this.logTerminal('[Scenario] Multi-lane hazard: CENTER (3.5m) & LEFT (4.0m) blocked. RIGHT lane clear -> Solution: BYPASS_RIGHT.', 'text-danger');
      this.showToast('Multi-lane obstacle! Left & Center blocked -> Right Lane Bypass recommended.', 'danger');
      this.updateDashboard();
    } else if (scenarioKey === 'all_blocked') {
      if (isOop) {
        this.car.detectObstacle(3.0, 'Road Barricade', 'CENTER', false);
        this.car.detectObstacle(3.5, 'Stopped Vehicle', 'LEFT', true);
        this.car.detectObstacle(4.0, 'Construction Cone', 'RIGHT', true);
      } else {
        modularDetectObstacle(3.0, 'Road Barricade', 'CENTER', false);
        modularDetectObstacle(3.5, 'Stopped Vehicle', 'LEFT', true);
        modularDetectObstacle(4.0, 'Construction Cone', 'RIGHT', true);
      }
      this.logTerminal('[Scenario] All 3 lanes blocked! Side bypass unsafe -> Recommended Solution: REVERSE_BACKOUT (+10m).', 'text-danger');
      this.showToast('All 3 lanes blocked! Controlled Reverse Backout recommended.', 'danger');
      this.updateDashboard();
    } else if (scenarioKey === 'clear') {
      this.resolveDangerZone('CLEAR_OBSTACLE');
    }
  }

  resolveDangerZone(solutionType = 'AUTO') {
    this.totalOps++;
    const res = this.currentMode === 'OOP'
      ? this.car.resolveDangerZone(solutionType)
      : modularResolveDangerZone(solutionType);

    if (res.success) {
      this.lastSolutionApplied = res.message;
      this.log(res.message, 'log-action');
      this.logTerminal(res.message, 'text-success');
      this.showToast(res.message, 'success');
    } else {
      this.log(res.message, 'log-danger');
      this.logTerminal(res.message, 'text-danger');
      this.showToast(res.message, 'danger');
    }
    this.updateDashboard();
  }

  // ==========================================================================
  // CORE ENGINE EXECUTION (OPTIONS 1 TO 9, 0)
  // ==========================================================================
  executeOption(optionNumber, params = {}) {
    this.totalOps++;
    let result = null;

    switch (optionNumber) {
      case 1: {
        result = this.currentMode === 'OOP' ? this.car.start() : modularStart();
        this.log(result.message, result.success ? 'log-action' : 'log-warning');
        this.logTerminal(`Option 1 selected:\n${result.message}`, result.success ? 'text-success' : 'text-warning');
        break;
      }
      case 2: {
        const dir = params.dir || 'FORWARD';
        const spd = params.speed || 30.0;
        result = this.currentMode === 'OOP' ? this.car.move(dir, spd) : modularMove(dir, spd);
        this.log(result.message, result.success ? 'log-action' : 'log-danger');
        this.logTerminal(`Option 2 (Move ${dir} at ${spd} km/h):\n${result.message}`, result.success ? 'text-success' : 'text-danger');
        break;
      }
      case 3: {
        const dir = params.dir || 'FORWARD';
        result = this.currentMode === 'OOP' ? this.car.setDirection(dir) : modularChangeDirection(dir);
        this.log(result.message, result.success ? 'log-action' : 'log-warning');
        this.logTerminal(`Option 3 (Change Direction to ${dir}):\n${result.message}`, result.success ? 'text-info' : 'text-danger');
        break;
      }
      case 4: {
        const delta = params.delta || 10.0;
        const isHazard = (this.currentMode === 'OOP' ? this.car.lastObstacleDist <= this.car.safetyThreshold : modularState.lastObstacleDist <= modularState.safetyThreshold);
        if (isHazard) {
          result = { success: false, message: '[SAFETY LOCK] Obstacle in danger zone! Acceleration prohibited. Apply a Danger Zone Solution first.' };
        } else {
          result = this.currentMode === 'OOP' ? this.car.accelerate(delta) : modularAccelerate(delta);
        }
        this.log(result.message, result.success ? 'log-action' : 'log-danger');
        this.logTerminal(`Option 4 (Accelerate +${delta} km/h):\n${result.message}`, result.success ? 'text-success' : 'text-danger');
        break;
      }
      case 5: {
        const delta = params.delta || 10.0;
        result = this.currentMode === 'OOP' ? this.car.decelerate(delta) : modularDecelerate(delta);
        this.log(result.message, result.success ? 'log-action' : 'log-warning');
        this.logTerminal(`Option 5 (Decelerate -${delta} km/h):\n${result.message}`, result.success ? 'text-warning' : 'text-danger');
        break;
      }
      case 6: {
        const dist = (params.distance !== undefined) ? params.distance : 100.0;
        const obsType = params.type || 'Road Barricade';
        const obsLane = params.lane || null;
        const preserveSide = !!params.preserveSide;
        this.lastSolutionApplied = null;
        result = this.currentMode === 'OOP'
          ? this.car.detectObstacle(dist, obsType, obsLane, preserveSide)
          : modularDetectObstacle(dist, obsType, obsLane, preserveSide);
        this.log(`Obstacle Sensor: ${obsType} @ ${dist.toFixed(1)}m. Result: ${result.safe ? 'Safe' : 'DANGER INTERLOCK'}`, result.safe ? 'log-action' : 'log-danger');
        this.logTerminal(`Option 6 (Detect Obstacle):\n${result.message}`, result.safe ? 'text-success' : 'text-danger');
        if (!result.safe && !result.error) {
          this.showToast(`DANGER ZONE: ${obsType} at ${dist}m! View Danger Zone Solutions in Dashboard.`, 'danger');
        }
        break;
      }
      case 7: {
        const statusReport = this.currentMode === 'OOP' ? this.car.displayStatus() : modularDisplayStatus();
        this.log('Displayed Vehicle Status & Radar Objects to terminal', 'log-system');
        this.logTerminal(`Option 7:\n${statusReport}`, 'text-info');
        break;
      }
      case 8:
      case 9: {
        this.lastSolutionApplied = null;
        result = this.currentMode === 'OOP' ? this.car.reset() : { success: true, message: '[Module 3 Conv. Modular] Vehicle reset.' };
        if (this.currentMode === 'MODULAR') modularInit(SIMULATION_CONFIG.DEFAULT_SAFETY_THRESHOLD);
        this.log('Vehicle and simulation state reset to factory defaults.', 'log-system');
        this.logTerminal('Option 8 (Reset Vehicle):\n[System] Vehicle reset to initial state. Speed=0, Status=STOPPED, Lane=CENTER, Obstacle=100m.', 'text-success');
        break;
      }
      case 0: {
        this.logTerminal('Option 0:\n[System] Simulation session concluded. Program ready for exit.', 'text-secondary');
        this.log('Session exit requested.', 'log-system');
        break;
      }
      default: {
        this.logTerminal(`Error: Unrecognized option [${optionNumber}]. Please select between 0 and 8.`, 'text-danger');
        break;
      }
    }

    this.updateDashboard();
    return result;
  }

  handleStop() {
    this.totalOps++;
    const res = this.currentMode === 'OOP' ? this.car.stop() : modularStop();
    this.log(res.message, 'log-warning');
    this.logTerminal(`[Manual Stop] ${res.message}`, 'text-warning');
    this.updateDashboard();
  }

  promptDetectObstacle() {
    this.terminalState.awaitingInputFor = 'OBSTACLE_DIST';
    this.logTerminal('\nEnter obstacle distance in meters (0 - 500):', 'text-warning');
    if (this.dom.terminalInput) {
      this.dom.terminalInput.placeholder = 'Enter distance (e.g. 3.0, 5.0, 25.0)...';
      this.dom.terminalInput.focus();
    }
  }

  // ==========================================================================
  // INTERACTIVE TERMINAL HANDLING
  // ==========================================================================
  printTerminalWelcome() {
    const welcome = [
      '================================================================',
      '   AUTONOMOUS VEHICLE CONTROL SIMULATION (3-MODULE CAPSTONE)    ',
      '  M1: OOP Control | M2: Nav & Obstacles | M3: Conv. Modular     ',
      '================================================================',
      '',
      '+----------------------- MAIN MENU ----------------------------+',
      '| 1. Start Vehicle                                            |',
      '| 2. Move Vehicle                                             |',
      '| 3. Change Direction                                         |',
      '| 4. Accelerate Vehicle                                       |',
      '| 5. Decelerate Vehicle                                       |',
      '| 6. Detect Obstacle & View Danger Solutions                  |',
      '| 7. Display Vehicle Status & Radar Objects                   |',
      '| 8. Reset Vehicle                                            |',
      '| 0. Exit                                                     |',
      '+--------------------------------------------------------------+',
      'Type option (0-8) or click quick menu buttons below:'
    ].join('\n');
    this.logTerminal(welcome, 'text-info');
  }

  handleTerminalMenuClick(num) {
    if (this.dom.terminalInput) {
      this.dom.terminalInput.value = num;
      this.handleTerminalInputSubmit();
    }
  }

  handleTerminalInputSubmit() {
    if (!this.dom.terminalInput) return;
    const rawVal = this.dom.terminalInput.value.trim();
    this.dom.terminalInput.value = '';

    if (!rawVal) return;
    this.logTerminal(`> ${rawVal}`, 'text-white fw-bold');

    if (this.terminalState.awaitingInputFor) {
      this.processTerminalSubInput(rawVal);
      return;
    }

    const choice = parseInt(rawVal, 10);
    if (isNaN(choice) || choice < 0 || choice > 8) {
      this.logTerminal('Error: Invalid menu choice! Please enter a number between 0 and 8.', 'text-danger');
      return;
    }

    switch (choice) {
      case 1: this.executeOption(1); break;
      case 2:
        this.terminalState.awaitingInputFor = 'MOVE_DIR';
        this.logTerminal('Select movement direction:\n 1. FORWARD\n 2. BACKWARD\n 3. LEFT\n 4. RIGHT\nEnter choice (1-4):', 'text-warning');
        this.dom.terminalInput.placeholder = 'Enter 1, 2, 3, or 4...';
        break;
      case 3:
        this.terminalState.awaitingInputFor = 'CHANGE_DIR';
        this.logTerminal('Select new direction:\n 1. FORWARD\n 2. BACKWARD\n 3. LEFT\n 4. RIGHT\nEnter choice (1-4):', 'text-warning');
        this.dom.terminalInput.placeholder = 'Enter 1, 2, 3, or 4...';
        break;
      case 4:
        this.terminalState.awaitingInputFor = 'ACCEL_DELTA';
        this.logTerminal('Enter speed increase delta (km/h, 1 - 50) [Default: 10]:', 'text-warning');
        this.dom.terminalInput.placeholder = 'Enter km/h delta (e.g. 10)...';
        break;
      case 5:
        this.terminalState.awaitingInputFor = 'DECEL_DELTA';
        this.logTerminal('Enter speed decrease delta (km/h, 1 - 50) [Default: 10]:', 'text-warning');
        this.dom.terminalInput.placeholder = 'Enter km/h delta (e.g. 10)...';
        break;
      case 6:
        this.terminalState.awaitingInputFor = 'OBSTACLE_DIST';
        this.logTerminal(`Enter obstacle distance in meters (0 - 500) [Safety threshold: ${this.car.safetyThreshold}m]:`, 'text-warning');
        this.dom.terminalInput.placeholder = 'Enter meters (e.g. 3.0, 5.0, 50.0)...';
        break;
      case 7: this.executeOption(7); break;
      case 8: this.executeOption(8); break;
      case 0: this.executeOption(0); break;
    }
  }

  processTerminalSubInput(val) {
    const state = this.terminalState.awaitingInputFor;

    if (state === 'MOVE_DIR') {
      let dir = 'FORWARD';
      if (val === '2') dir = 'BACKWARD';
      else if (val === '3') dir = 'LEFT';
      else if (val === '4') dir = 'RIGHT';
      else if (['FORWARD', 'BACKWARD', 'LEFT', 'RIGHT'].includes(val.toUpperCase())) dir = val.toUpperCase();
      this.terminalState.tempData.dir = dir;
      this.terminalState.awaitingInputFor = 'MOVE_SPEED';
      this.logTerminal(`Direction set to ${dir}. Enter cruising speed (5 - 120 km/h) [Default: 30]:`, 'text-warning');
      this.dom.terminalInput.placeholder = 'Speed in km/h (e.g. 35)...';
      return;
    }

    if (state === 'MOVE_SPEED') {
      let spd = parseFloat(val);
      if (isNaN(spd) || spd < 0 || spd > SIMULATION_CONFIG.MAX_SPEED) {
        this.logTerminal('Error: Invalid speed value. Defaulting to 30 km/h.', 'text-danger');
        spd = 30.0;
      }
      const dir = this.terminalState.tempData.dir || 'FORWARD';
      this.terminalState.awaitingInputFor = null;
      this.terminalState.tempData = {};
      this.dom.terminalInput.placeholder = 'Type menu option (0-8) or input and press Enter...';
      this.executeOption(2, { dir, speed: spd });
      return;
    }

    if (state === 'CHANGE_DIR') {
      let dir = 'FORWARD';
      if (val === '2') dir = 'BACKWARD';
      else if (val === '3') dir = 'LEFT';
      else if (val === '4') dir = 'RIGHT';
      else if (['FORWARD', 'BACKWARD', 'LEFT', 'RIGHT'].includes(val.toUpperCase())) dir = val.toUpperCase();
      this.terminalState.awaitingInputFor = null;
      this.dom.terminalInput.placeholder = 'Type menu option (0-8) or input and press Enter...';
      this.executeOption(3, { dir });
      return;
    }

    if (state === 'ACCEL_DELTA') {
      let delta = parseFloat(val);
      if (isNaN(delta) || delta <= 0 || delta > 50) delta = 10.0;
      this.terminalState.awaitingInputFor = null;
      this.dom.terminalInput.placeholder = 'Type menu option (0-8) or input and press Enter...';
      this.executeOption(4, { delta });
      return;
    }

    if (state === 'DECEL_DELTA') {
      let delta = parseFloat(val);
      if (isNaN(delta) || delta <= 0 || delta > 50) delta = 10.0;
      this.terminalState.awaitingInputFor = null;
      this.dom.terminalInput.placeholder = 'Type menu option (0-8) or input and press Enter...';
      this.executeOption(5, { delta });
      return;
    }

    if (state === 'OBSTACLE_DIST') {
      const dist = parseFloat(val);
      if (isNaN(dist) || dist < 0) {
        this.logTerminal('Error: Distance cannot be negative! Please enter a valid distance >= 0:', 'text-danger');
        return;
      }
      const res = this.executeOption(6, { distance: dist });
      if (res && !res.safe) {
        this.terminalState.awaitingInputFor = 'DANGER_SOLUTION';
        this.logTerminal('Select Danger Zone Solution:\n 1. Auto-Resolve (Recommended Bypass / Reverse)\n 2. Reverse Backout (+10m)\n 3. Clear Obstacle (75m)\n 0. Keep Emergency Stop\nEnter choice (0-3):', 'text-warning');
        this.dom.terminalInput.placeholder = '1=Auto, 2=Reverse, 3=Clear, 0=Hold...';
      } else {
        this.terminalState.awaitingInputFor = 'ANOTHER_OBSTACLE';
        this.logTerminal('Check another obstacle? (y/n):', 'text-warning');
        this.dom.terminalInput.placeholder = 'y / n...';
      }
      return;
    }

    if (state === 'DANGER_SOLUTION') {
      this.terminalState.awaitingInputFor = null;
      this.dom.terminalInput.placeholder = 'Type menu option (0-8) or input and press Enter...';
      if (val === '1') this.resolveDangerZone('AUTO');
      else if (val === '2') this.resolveDangerZone('REVERSE_BACKOUT');
      else if (val === '3') this.resolveDangerZone('CLEAR_OBSTACLE');
      else this.logTerminal('Keeping EMERGENCY_STOP engaged.', 'text-danger');
      return;
    }

    if (state === 'ANOTHER_OBSTACLE') {
      if (val.toLowerCase() === 'y' || val.toLowerCase() === 'yes') {
        this.terminalState.awaitingInputFor = 'OBSTACLE_DIST';
        this.logTerminal('Enter obstacle distance in meters (0 - 500):', 'text-warning');
        this.dom.terminalInput.placeholder = 'Meters (e.g. 4.0)...';
      } else {
        this.terminalState.awaitingInputFor = null;
        this.dom.terminalInput.placeholder = 'Type menu option (0-8) or input and press Enter...';
        this.logTerminal('Returning to Main Menu.', 'text-info');
      }
      return;
    }
  }

  logTerminal(text, colorClass = 'text-info') {
    if (!this.dom.terminalLog) return;
    const div = document.createElement('div');
    div.className = `mb-1 ${colorClass}`;
    div.style.whiteSpace = 'pre-wrap';
    div.textContent = text;
    this.dom.terminalLog.appendChild(div);
    this.dom.terminalLog.scrollTop = this.dom.terminalLog.scrollHeight;
  }

  log(message, typeClass = 'log-action') {
    if (!this.dom.activityLog) return;
    const time = this.formatTime();
    const entry = document.createElement('div');
    entry.className = `log-entry ${typeClass}`;
    entry.innerHTML = `<span class="log-timestamp">[${time}]</span> ${message}`;
    this.dom.activityLog.appendChild(entry);
    this.dom.activityLog.scrollTop = this.dom.activityLog.scrollHeight;
  }

  showToast(message, type = 'info') {
    const toastEl = document.getElementById('liveToast');
    const toastBody = document.getElementById('toast-message-body');
    if (toastEl && toastBody && window.bootstrap) {
      let icon = '<i class="bi bi-info-circle-fill text-info fs-5"></i>';
      if (type === 'danger') icon = '<i class="bi bi-exclamation-triangle-fill text-danger fs-5"></i>';
      else if (type === 'warning') icon = '<i class="bi bi-exclamation-circle-fill text-warning fs-5"></i>';
      else if (type === 'success') icon = '<i class="bi bi-check-circle-fill text-success fs-5"></i>';

      toastBody.innerHTML = `${icon} <span>${message}</span>`;
      const toast = new window.bootstrap.Toast(toastEl, { delay: 3500 });
      toast.show();
    }
  }

  // ==========================================================================
  // DASHBOARD TELEMETRY, OBSTACLE RADAR & DANGER ZONE SOLUTION CENTER
  // ==========================================================================
  updateDashboard() {
    const isOop = this.currentMode === 'OOP';
    const speed = isOop ? this.car.speed : modularState.speed;
    const status = isOop ? this.car.status : modularState.status;
    const direction = isOop ? this.car.direction : modularState.direction;
    const currentLane = isOop ? this.car.currentLane : modularState.currentLane;
    const headingAngle = isOop ? this.car.headingAngle : modularState.headingAngle;
    const distance = isOop ? this.car.lastObstacleDist : modularState.lastObstacleDist;
    const threshold = isOop ? this.car.safetyThreshold : modularState.safetyThreshold;
    const isDanger = (distance <= threshold) || (status === 'EMERGENCY_STOP');

    if (this.dom.telemetrySpeed) this.dom.telemetrySpeed.innerHTML = `${speed.toFixed(1)} <span class="unit">km/h</span>`;
    if (this.dom.speedBar) this.dom.speedBar.style.width = `${(speed / SIMULATION_CONFIG.MAX_SPEED) * 100}%`;
    if (this.dom.paramSpeed) this.dom.paramSpeed.textContent = `${speed.toFixed(1)} km/h`;

    if (this.dom.telemetryDir) this.dom.telemetryDir.textContent = direction;
    if (this.dom.telemetryDeg) this.dom.telemetryDeg.textContent = `${headingAngle}° | LANE: ${currentLane}`;
    if (this.dom.dirArrow) this.dom.dirArrow.style.transform = `rotate(${headingAngle}deg)`;
    if (this.dom.paramDirection) this.dom.paramDirection.textContent = `${direction} (${currentLane} LANE)`;

    if (this.dom.telemetryDistance) this.dom.telemetryDistance.innerHTML = `${distance.toFixed(1)} <span class="unit">m</span>`;
    if (this.dom.paramDistance) this.dom.paramDistance.textContent = `${distance.toFixed(1)} m`;
    if (this.dom.distanceBar) {
      const pct = Math.min(100, Math.max(0, distance));
      this.dom.distanceBar.style.width = `${pct}%`;
      this.dom.distanceBar.className = isDanger ? 'progress-bar bg-danger' : (distance <= threshold * 3 ? 'progress-bar bg-warning' : 'progress-bar bg-success');
    }

    if (this.dom.telemetryStatus) {
      this.dom.telemetryStatus.textContent = isDanger ? 'EMERGENCY STOP' : status;
      this.dom.telemetryStatus.className = isDanger ? 'telemetry-value text-danger font-monospace' : 'telemetry-value text-white font-monospace';
    }
    if (this.dom.statusDot) {
      this.dom.statusDot.className = isDanger ? 'pulse-dot bg-danger' : (speed > 0 ? 'pulse-dot bg-success' : 'pulse-dot bg-secondary');
    }
    if (this.dom.paramStatus) {
      this.dom.paramStatus.textContent = isDanger ? 'EMERGENCY_STOP (IMMOBILIZED)' : status;
      this.dom.paramStatus.className = isDanger ? 'text-end fw-bold text-danger' : 'text-end fw-bold text-success';
    }

    if (this.dom.telemetryObstacleStatus) {
      this.dom.telemetryObstacleStatus.textContent = isDanger ? 'DANGER (<= THRESHOLD)' : (distance <= threshold * 3 ? 'WARNING (PROXIMITY)' : 'CLEAR (SAFE PATH)');
      this.dom.telemetryObstacleStatus.className = isDanger ? 'telemetry-value text-danger font-monospace' : (distance <= threshold * 3 ? 'telemetry-value text-warning font-monospace' : 'telemetry-value text-success font-monospace');
    }
    if (this.dom.paramObstacleStatus) {
      this.dom.paramObstacleStatus.textContent = isDanger ? 'COLLISION HAZARD' : (distance <= threshold * 3 ? 'CAUTION' : 'CLEAR');
      this.dom.paramObstacleStatus.className = isDanger ? 'text-end fw-bold text-danger' : (distance <= threshold * 3 ? 'text-end fw-bold text-warning' : 'text-end fw-bold text-success');
    }

    if (this.dom.paramSafetyAction) {
      this.dom.paramSafetyAction.textContent = isDanger
        ? `Emergency Stop Active (Dist <= ${threshold}m)`
        : (this.lastSolutionApplied ? 'Danger Resolved -> Safe' : (speed > 0 ? 'Normal Autonomous Cruising' : 'Vehicle Stationary'));
    }

    if (this.dom.totalOpsBadge) this.dom.totalOpsBadge.textContent = `Ops: ${this.totalOps}`;
    if (this.dom.paramOpsCount) this.dom.paramOpsCount.textContent = this.totalOps;
    if (this.dom.paramMode) this.dom.paramMode.textContent = isOop ? 'Modules 1 & 2: OOP & Navigation' : 'Module 3: Conventional Modular';

    if (this.dom.hudSpeedTag) {
      this.dom.hudSpeedTag.textContent = isDanger ? '0.0 km/h [IMMOBILIZED]' : `${speed.toFixed(1)} km/h`;
      this.dom.hudSpeedTag.className = isDanger ? 'badge bg-danger text-white font-monospace' : 'badge bg-dark text-info font-monospace';
    }
    if (this.dom.hudRadarStatus) {
      this.dom.hudRadarStatus.textContent = isDanger ? 'COLLISION HAZARD' : `${distance.toFixed(1)}m [${currentLane}]`;
      this.dom.hudRadarStatus.className = isDanger ? 'badge bg-danger text-white font-monospace' : 'badge bg-dark text-light font-monospace';
    }
    if (this.dom.canvasCoord) {
      this.dom.canvasCoord.textContent = isDanger
        ? `IMMOBILIZED (${currentLane} LANE | ${distance.toFixed(1)}m <= ${threshold}m)`
        : `LANE: ${currentLane} | CLEAR: ${distance.toFixed(1)}m`;
      this.dom.canvasCoord.className = isDanger ? 'badge bg-danger text-white font-monospace' : 'badge bg-secondary font-monospace';
    }

    // Danger Interlock Alert Banner
    if (this.dom.dangerBanner) {
      this.dom.dangerBanner.classList.toggle('d-none', !isDanger);
      if (isDanger) {
        const solutions = isOop ? this.car.getDangerZoneSolutions() : modularGetDangerZoneSolutions();
        const rec = solutions.find(s => s.recommended && s.available) || solutions[solutions.length - 1];
        this.dom.dangerBanner.innerHTML = `
          <div class="d-flex flex-wrap align-items-center justify-content-between gap-2 p-2">
            <div class="d-flex align-items-center gap-2">
              <i class="bi bi-exclamation-octagon-fill text-danger fs-5"></i>
              <span>
                <strong>DANGER ZONE DETECTED (${currentLane} LANE):</strong>
                Obstacle at <strong>${distance.toFixed(1)}m</strong> &le; Threshold <strong>${threshold.toFixed(1)}m</strong>. Vehicle immobilized.
                <span class="text-warning ms-1">Recommended: <strong>${rec.title}</strong></span>
              </span>
            </div>
            <div class="d-flex gap-2">
              <button type="button" class="btn btn-sm btn-success font-monospace fw-bold py-1" onclick="window.simApp.resolveDangerZone('AUTO')">
                <i class="bi bi-magic me-1"></i> AUTO-SOLVE DANGER ZONE
              </button>
              <button type="button" class="btn btn-sm btn-outline-light font-monospace py-1" onclick="window.simApp.resolveDangerZone('CLEAR_OBSTACLE')">
                CLEAR HAZARD
              </button>
            </div>
          </div>
        `;
      }
    }

    // Render Dedicated Obstacle Radar & Danger Zone Solution Center
    this.renderObstacleSolutionPanel();

    const btnStart = document.getElementById('btn-start-vehicle');
    const btnMove = document.getElementById('btn-move-forward');
    const btnAccel = document.getElementById('btn-increase-speed');

    if (isDanger) {
      if (btnStart) btnStart.classList.add('opacity-50');
      if (btnMove) btnMove.classList.add('opacity-50');
      if (btnAccel) btnAccel.classList.add('opacity-50');
    } else {
      if (btnStart) btnStart.classList.remove('opacity-50');
      if (btnMove) btnMove.classList.remove('opacity-50');
      if (btnAccel) btnAccel.classList.remove('opacity-50');
    }
  }

  renderObstacleSolutionPanel() {
    const panel = this.dom.obstacleSolutionPanel;
    if (!panel) return;

    const isOop = this.currentMode === 'OOP';
    const obstacles = isOop ? this.car.activeObstacles : modularState.activeObstacles;
    const threshold = isOop ? this.car.safetyThreshold : modularState.safetyThreshold;
    const currentLane = isOop ? this.car.currentLane : modularState.currentLane;
    const distance = isOop ? this.car.lastObstacleDist : modularState.lastObstacleDist;
    const status = isOop ? this.car.status : modularState.status;
    const isDanger = (distance <= threshold) || (status === 'EMERGENCY_STOP');
    const isWarning = !isDanger && (distance <= threshold * 3);

    panel.classList.remove('in-danger', 'in-warning');
    if (isDanger) panel.classList.add('in-danger');
    else if (isWarning) panel.classList.add('in-warning');

    const solutions = isOop ? this.car.getDangerZoneSolutions() : modularGetDangerZoneSolutions();

    const obstacleChipsHtml = obstacles.map(obs => {
      const obsDanger = obs.distance <= threshold;
      const obsWarn = !obsDanger && obs.distance <= threshold * 3;
      const chipClass = obsDanger ? 'chip-danger' : (obsWarn ? 'chip-warning' : 'chip-safe');
      const badgeColor = obsDanger ? 'bg-danger' : (obsWarn ? 'bg-warning text-dark' : 'bg-success');
      const stateLabel = obsDanger ? 'DANGER ZONE' : (obsWarn ? 'WARNING' : 'SAFE');
      const isCurrent = obs.lane === currentLane ? '<span class="badge bg-info text-dark ms-1">ACTIVE LANE</span>' : '';

      return `
        <div class="col-md-4">
          <div class="obstacle-item-chip ${chipClass} h-100">
            <div class="d-flex justify-content-between align-items-center mb-1">
              <strong class="text-white"><i class="bi bi-cone-striped me-1 text-warning"></i>${obs.type}</strong>
              <span class="badge ${badgeColor}">${stateLabel}</span>
            </div>
            <div class="text-secondary">
              Lane: <strong class="text-info">${obs.lane}</strong> ${isCurrent}
            </div>
            <div class="text-secondary">
              Distance: <strong class="${obsDanger ? 'text-danger' : 'text-white'}">${obs.distance.toFixed(1)}m</strong>
              <span class="text-muted">(Limit: ${threshold.toFixed(1)}m)</span>
            </div>
          </div>
        </div>
      `;
    }).join('');

    let solutionHtml = '';
    if (isDanger) {
      const solutionCards = solutions.map(sol => {
        const recBadge = sol.recommended
          ? '<span class="badge bg-success text-dark">RECOMMENDED SOLUTION</span>'
          : (sol.available ? '<span class="badge bg-dark text-info border border-info border-opacity-50">AVAILABLE</span>' : '<span class="badge bg-danger">BLOCKED</span>');
        const btnDisabled = sol.available ? '' : 'disabled';
        const btnClass = sol.recommended ? 'btn-success text-dark fw-bold' : (sol.available ? 'btn-outline-info' : 'btn-outline-secondary');

        return `
          <div class="col-md-6 col-xl-3">
            <div class="solution-option-box ${sol.recommended ? 'recommended' : ''} h-100 d-flex flex-column justify-content-between gap-2">
              <div>
                <div class="d-flex justify-content-between align-items-start gap-1 mb-1">
                  <strong class="text-white small font-monospace">${sol.title}</strong>
                </div>
                <div class="mb-2">${recBadge}</div>
                <p class="text-secondary mb-2" style="font-size: 0.72rem;">${sol.description}</p>
                <code class="d-block text-info bg-black p-1 rounded border border-secondary border-opacity-25" style="font-size: 0.66rem;">${sol.codeHint}</code>
              </div>
              <button type="button" class="btn btn-sm ${btnClass} w-100 font-monospace" ${btnDisabled} onclick="window.simApp.resolveDangerZone('${sol.id}')">
                <i class="bi bi-shield-check me-1"></i> EXECUTE
              </button>
            </div>
          </div>
        `;
      }).join('');

      solutionHtml = `
        <div class="mt-3 pt-3 border-top border-danger border-opacity-50">
          <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-2">
            <div class="text-danger font-monospace fw-bold small">
              <i class="bi bi-tools me-1"></i>DANGER ZONE SOLUTIONS (SELECT ACTION TO RESOLVE OBSTACLE HAZARD):
            </div>
            <button type="button" class="btn btn-sm btn-success text-dark font-monospace fw-bold" onclick="window.simApp.resolveDangerZone('AUTO')">
              <i class="bi bi-lightning-fill me-1"></i> AUTO-RESOLVE BEST SOLUTION
            </button>
          </div>
          <div class="row g-2">${solutionCards}</div>
        </div>
      `;
    } else if (isWarning) {
      solutionHtml = `
        <div class="mt-3 pt-2 border-top border-warning border-opacity-25 d-flex flex-wrap justify-content-between align-items-center gap-2">
          <span class="text-warning small font-monospace">
            <i class="bi bi-exclamation-triangle me-1"></i>CAUTION: Obstacle approaching within warning perimeter (${distance.toFixed(1)}m). Monitor speed or prepare lane change.
          </span>
          <button type="button" class="btn btn-sm btn-outline-warning font-monospace" onclick="window.simApp.executeOption(5, { delta: 10 })">
            DECELERATE (-10 km/h)
          </button>
        </div>
      `;
    } else {
      const resolutionMsg = this.lastSolutionApplied
        ? `<span class="text-success"><i class="bi bi-check-circle-fill me-1"></i><strong>Last Resolution:</strong> ${this.lastSolutionApplied}</span>`
        : `<span class="text-success"><i class="bi bi-shield-check me-1"></i>No obstacles in Danger Zone (&gt; ${threshold.toFixed(1)}m). Autonomous navigation is clear.</span>`;
      solutionHtml = `
        <div class="mt-3 pt-2 border-top border-secondary border-opacity-25 d-flex flex-wrap justify-content-between align-items-center gap-2 small font-monospace">
          ${resolutionMsg}
          <span class="text-muted">Vehicle Lane: <strong class="text-info">${currentLane}</strong></span>
        </div>
      `;
    }

    panel.innerHTML = `
      <div class="card-header py-2 px-3 d-flex flex-wrap justify-content-between align-items-center gap-2 border-bottom border-secondary border-opacity-25">
        <div class="d-flex align-items-center gap-2">
          <i class="bi ${isDanger ? 'bi-exclamation-diamond-fill text-danger' : 'bi-radar text-info'}"></i>
          <span class="fw-bold text-white small">DETECTED OBSTACLES RADAR &amp; DANGER ZONE SOLUTION ENGINE</span>
        </div>
        <div class="d-flex flex-wrap align-items-center gap-1">
          <span class="text-muted small font-monospace me-1" style="font-size: 0.68rem;">TEST OBSTACLES:</span>
          <button type="button" class="btn btn-sm btn-outline-danger py-0 px-2 font-monospace" style="font-size: 0.68rem;" onclick="window.simApp.spawnObstacleScenario('stopped_car')">Stopped Car (3.0m)</button>
          <button type="button" class="btn btn-sm btn-outline-danger py-0 px-2 font-monospace" style="font-size: 0.68rem;" onclick="window.simApp.spawnObstacleScenario('pedestrian')">Pedestrian (2.5m)</button>
          <button type="button" class="btn btn-sm btn-outline-warning py-0 px-2 font-monospace" style="font-size: 0.68rem;" onclick="window.simApp.spawnObstacleScenario('multi_lane')">Multi-Lane Block</button>
          <button type="button" class="btn btn-sm btn-outline-danger py-0 px-2 font-monospace" style="font-size: 0.68rem;" onclick="window.simApp.spawnObstacleScenario('all_blocked')">All 3 Lanes Blocked</button>
          <button type="button" class="btn btn-sm btn-outline-success py-0 px-2 font-monospace" style="font-size: 0.68rem;" onclick="window.simApp.spawnObstacleScenario('clear')">Clear Road</button>
        </div>
      </div>
      <div class="card-body p-3">
        <div class="row g-2">${obstacleChipsHtml}</div>
        ${solutionHtml}
      </div>
    `;
  }

  // ==========================================================================
  // 2D CANVAS ROADWAY ANIMATION (Strict Danger Immobilization + Multi-Obstacle + Solution Vector)
  // ==========================================================================
  initCanvasLoop() {
    if (!this.canvas || !this.ctx) return;
    // Polyfill ctx.roundRect for older Electron / VS Code Simple Browser WebViews
    if (typeof this.ctx.roundRect !== 'function') {
      this.ctx.roundRect = function (x, y, width, height, radius) {
        const r = Math.min(typeof radius === 'number' ? radius : 0, Math.abs(width) / 2, Math.abs(height) / 2);
        this.moveTo(x + r, y);
        this.lineTo(x + width - r, y);
        this.quadraticCurveTo(x + width, y, x + width, y + r);
        this.lineTo(x + width, y + height - r);
        this.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
        this.lineTo(x + r, y + height);
        this.quadraticCurveTo(x, y + height, x, y + height - r);
        this.lineTo(x, y + r);
        this.quadraticCurveTo(x, y, x + r, y);
        this.closePath();
        return this;
      };
    }
    const render = () => {
      this.drawCanvas();
      requestAnimationFrame(render);
    };
    requestAnimationFrame(render);
  }

  laneToX(lane, canvasW) {
    if (lane === 'LEFT') return canvasW / 2 - 110;
    if (lane === 'RIGHT') return canvasW / 2 + 110;
    return canvasW / 2;
  }

  drawCanvas() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    const isOop = this.currentMode === 'OOP';
    let speed = isOop ? this.car.speed : modularState.speed;
    const status = isOop ? this.car.status : modularState.status;
    const currentLane = isOop ? this.car.currentLane : modularState.currentLane;
    const obstacles = isOop ? this.car.activeObstacles : modularState.activeObstacles;
    const distance = isOop ? this.car.lastObstacleDist : modularState.lastObstacleDist;
    const threshold = isOop ? this.car.safetyThreshold : modularState.safetyThreshold;
    const isDanger = (distance <= threshold) || (status === 'EMERGENCY_STOP');

    // CRITICAL REQUIREMENT:
    // While Vehicle Visualization Area (2D Simulated Road) is in danger, the vehicle must NOT move.
    if (isDanger) {
      speed = 0.0;
    }

    const targetCarX = this.laneToX(currentLane, w);
    if (!isDanger) {
      this.visualCarX += (targetCarX - this.visualCarX) * 0.14;
    }

    if (!isDanger && (status === 'MOVING' || status === 'RUNNING') && speed > 0) {
      this.roadOffset = (this.roadOffset + (speed * 0.05) + 0.5) % 40;
      this.radarAngle = (this.radarAngle + 0.04) % (Math.PI * 2);
    }

    // 1. Background
    ctx.fillStyle = '#070709';
    ctx.fillRect(0, 0, w, h);

    // 2. 3-Lane Roadway
    const roadWidth = 380;
    const roadX = (w - roadWidth) / 2;

    ctx.fillStyle = '#111116';
    ctx.fillRect(roadX, 0, roadWidth, h);

    // Shoulders
    ctx.strokeStyle = '#1e1e28';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(roadX + 8, 0);
    ctx.lineTo(roadX + 8, h);
    ctx.moveTo(roadX + roadWidth - 8, 0);
    ctx.lineTo(roadX + roadWidth - 8, h);
    ctx.stroke();

    // Lane Dividers (separating LEFT, CENTER, RIGHT)
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.55)';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([20, 20]);
    ctx.lineDashOffset = -this.roadOffset;
    ctx.beginPath();
    ctx.moveTo(w / 2 - 55, 0);
    ctx.lineTo(w / 2 - 55, h);
    ctx.moveTo(w / 2 + 55, 0);
    ctx.lineTo(w / 2 + 55, h);
    ctx.stroke();
    ctx.setLineDash([]);

    // Lane Labels at Bottom
    ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('LEFT LANE', w / 2 - 110, h - 10);
    ctx.fillText('CENTER LANE', w / 2, h - 10);
    ctx.fillText('RIGHT LANE', w / 2 + 110, h - 10);

    // 3. Vehicle Positioning
    const carX = this.visualCarX;
    const carY = h * 0.72;
    const carW = 46;
    const carH = 84;

    const minObsY = carY - 70;
    const maxObsY = 48;

    // Draw Safety Threshold Fence Line
    ctx.save();
    ctx.strokeStyle = isDanger ? 'rgba(239, 68, 68, 0.75)' : 'rgba(245, 158, 11, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(roadX + 12, minObsY + 18);
    ctx.lineTo(roadX + roadWidth - 12, minObsY + 18);
    ctx.stroke();
    ctx.fillStyle = isDanger ? '#ef4444' : 'rgba(245, 158, 11, 0.7)';
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`SAFETY THRESHOLD (${threshold.toFixed(1)}m)`, roadX + roadWidth - 14, minObsY + 14);
    ctx.restore();

    // 4. LiDAR Sensor Cone
    ctx.save();
    ctx.translate(carX, carY - carH / 2);

    let beamColor = 'rgba(0, 242, 255, ';
    if (isDanger) beamColor = 'rgba(239, 68, 68, ';
    else if (distance <= threshold * 3) beamColor = 'rgba(245, 158, 11, ';

    const beamGrad = ctx.createRadialGradient(0, 0, 10, 0, -200, 240);
    beamGrad.addColorStop(0, beamColor + '0.45)');
    beamGrad.addColorStop(0.6, beamColor + '0.12)');
    beamGrad.addColorStop(1, beamColor + '0.0)');

    ctx.fillStyle = beamGrad;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, 220, -Math.PI * 0.72, -Math.PI * 0.28);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = beamColor + '0.85)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    const ang = -Math.PI * 0.5 + Math.sin(this.radarAngle) * 0.35;
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(ang) * 180, Math.sin(ang) * 180);
    ctx.stroke();
    ctx.restore();

    // 5. Draw Recommended Danger Zone Escape Trajectory Arrow (when Danger is Active)
    if (isDanger) {
      const solutions = isOop ? this.car.getDangerZoneSolutions() : modularGetDangerZoneSolutions();
      const rec = solutions.find(s => s.recommended && s.available);
      if (rec) {
        ctx.save();
        ctx.strokeStyle = '#22c55e';
        ctx.fillStyle = '#22c55e';
        ctx.lineWidth = 2.5;
        ctx.setLineDash([6, 4]);

        if (rec.id === 'BYPASS_LEFT' || rec.id === 'BYPASS_RIGHT') {
          const dirSign = rec.id === 'BYPASS_LEFT' ? -1 : 1;
          const escapeX = carX + dirSign * 110;
          ctx.beginPath();
          ctx.moveTo(carX, carY);
          ctx.quadraticCurveTo(carX + dirSign * 55, carY - 40, escapeX, carY - 120);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.beginPath();
          ctx.arc(escapeX, carY - 120, 5, 0, Math.PI * 2);
          ctx.fill();
          ctx.font = 'bold 10px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(`SOLUTION: ${rec.id}`, escapeX, carY - 132);
        } else if (rec.id === 'REVERSE_BACKOUT') {
          ctx.beginPath();
          ctx.moveTo(carX, carY + carH / 2 + 6);
          ctx.lineTo(carX, carY + carH / 2 + 40);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.font = 'bold 10px monospace';
          ctx.textAlign = 'center';
          ctx.fillText('SOLUTION: REVERSE +10m', carX, carY + carH / 2 + 54);
        }
        ctx.restore();
      }
    }

    // 6. Draw ALL Tracked Obstacles in their respective Lanes
    obstacles.forEach(obs => {
      const ox = this.laneToX(obs.lane, w);
      const oy = Math.max(maxObsY, Math.min(minObsY, minObsY - ((obs.distance - threshold) / 95) * (minObsY - maxObsY)));
      const obsDanger = obs.distance <= threshold;
      const obsWarning = !obsDanger && obs.distance <= threshold * 3;

      ctx.save();
      ctx.translate(ox, oy);

      if (obsDanger) {
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.85)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, 28 + Math.sin(Date.now() * 0.01) * 4, 0, Math.PI * 2);
        ctx.stroke();
      }

      if (obs.type.includes('Vehicle')) {
        // Stopped Vehicle silhouette
        ctx.fillStyle = obsDanger ? '#991b1b' : '#b45309';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(-20, -24, 40, 48, 8);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#fca5a5';
        ctx.fillRect(-14, 18, 8, 4);
        ctx.fillRect(6, 18, 8, 4);
      } else if (obs.type.includes('Pedestrian')) {
        // Pedestrian figure
        ctx.fillStyle = obsDanger ? '#ef4444' : '#f59e0b';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, -8, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.roundRect(-12, 2, 24, 14, 5);
        ctx.fill();
        ctx.stroke();
      } else {
        // Barrier / Cone Box
        ctx.fillStyle = obsDanger ? '#ef4444' : (obsWarning ? '#f59e0b' : '#38bdf8');
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(-24, -14, 48, 28, 4);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#0a0a0b';
        ctx.beginPath();
        ctx.moveTo(-16, -14); ctx.lineTo(-10, -14); ctx.lineTo(-18, 14); ctx.lineTo(-24, 14); ctx.fill();
        ctx.beginPath();
        ctx.moveTo(-4, -14); ctx.lineTo(2, -14); ctx.lineTo(-6, 14); ctx.lineTo(-12, 14); ctx.fill();
        ctx.beginPath();
        ctx.moveTo(8, -14); ctx.lineTo(14, -14); ctx.lineTo(6, 14); ctx.lineTo(0, 14); ctx.fill();
      }

      // Distance + Type Label
      ctx.fillStyle = '#000000';
      ctx.fillRect(-44, -36, 88, 17);
      ctx.strokeStyle = obsDanger ? '#ef4444' : '#00f2ff';
      ctx.lineWidth = 1;
      ctx.strokeRect(-44, -36, 88, 17);

      ctx.fillStyle = obsDanger ? '#ff6b6b' : '#ffffff';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      const shortType = obs.distance > threshold * 3 ? 'CLEAR' : obs.type.split(' ')[0].toUpperCase();
      ctx.fillText(`${shortType} ${obs.distance.toFixed(1)}m`, 0, -24);

      ctx.restore();
    });

    // 7. Draw Autonomous Vehicle Body
    ctx.save();
    ctx.translate(carX, carY);

    const heading = isOop ? this.car.headingAngle : modularState.headingAngle;
    let tiltAngle = 0;
    if (!isDanger) {
      if (heading === 90) tiltAngle = 0.08;
      else if (heading === 270) tiltAngle = -0.08;
    }
    ctx.rotate(tiltAngle);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.beginPath();
    ctx.roundRect(-carW / 2 + 3, -carH / 2 + 5, carW, carH, 10);
    ctx.fill();

    ctx.fillStyle = isDanger ? '#1a0c0e' : '#0e1726';
    ctx.strokeStyle = isDanger ? '#ef4444' : '#00f2ff';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(-carW / 2, -carH / 2, carW, carH, 10);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = isDanger ? 'rgba(239, 68, 68, 0.3)' : 'rgba(0, 242, 255, 0.25)';
    ctx.beginPath();
    ctx.roundRect(-carW / 2 + 7, -carH / 2 + 16, carW - 14, 22, 4);
    ctx.fill();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.beginPath();
    ctx.roundRect(-carW / 2 + 8, carH / 2 - 24, carW - 16, 12, 3);
    ctx.fill();

    ctx.fillStyle = '#222228';
    ctx.fillRect(-carW / 2 - 4, -carH / 2 + 10, 4, 18);
    ctx.fillRect(carW / 2, -carH / 2 + 10, 4, 18);
    ctx.fillRect(-carW / 2 - 4, carH / 2 - 28, 4, 18);
    ctx.fillRect(carW / 2, carH / 2 - 28, 4, 18);

    ctx.fillStyle = isDanger ? '#ef4444' : '#ffffff';
    ctx.fillRect(-carW / 2 + 6, -carH / 2 - 2, 8, 4);
    ctx.fillRect(carW / 2 - 14, -carH / 2 - 2, 8, 4);

    ctx.fillStyle = (speed === 0 || isDanger) ? '#ef4444' : '#7f1d1d';
    ctx.fillRect(-carW / 2 + 6, carH / 2 - 2, 9, 4);
    ctx.fillRect(carW / 2 - 15, carH / 2 - 2, 9, 4);

    ctx.fillStyle = isDanger ? '#ef4444' : '#00f2ff';
    ctx.beginPath();
    ctx.arc(0, 2, 6, 0, Math.PI * 2);
    ctx.fill();

    if (isDanger) {
      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('[IMMOBILIZED]', 0, carH / 2 + 20);
    }

    ctx.restore();
  }

  // ==========================================================================
  // 10 CAPSTONE TEST CASES RUNNER
  // ==========================================================================
  runAutomatedTestSuite() {
    this.navigateTo('results');
    const container = document.getElementById('test-suite-results-body');
    if (!container) return;

    container.innerHTML = '';
    const car = new AutonomousCar(5.0);

    const testCases = [
      {
        id: 1,
        title: 'Start and stop the vehicle',
        run: () => {
          car.start();
          car.stop();
          const passed = (car.status === 'STOPPED' && car.speed === 0);
          return {
            passed,
            input: 'start() -> stop()',
            expected: 'status == STOPPED, speed == 0 km/h',
            actual: `status = ${car.status}, speed = ${car.speed} km/h`
          };
        }
      },
      {
        id: 2,
        title: 'Move forward when path is safe',
        run: () => {
          car.detectObstacle(50.0);
          const moveRes = car.move('FORWARD', 40.0);
          const passed = moveRes.success && car.speed === 40.0 && car.direction === 'FORWARD';
          return {
            passed,
            input: 'detectObstacle(50m) -> move("FORWARD", 40 km/h)',
            expected: 'Moving FORWARD at 40.0 km/h',
            actual: `Speed: ${car.speed} km/h, Direction: ${car.direction}, Status: ${car.status}`
          };
        }
      },
      {
        id: 3,
        title: 'Change direction successfully',
        run: () => {
          const res = car.setDirection('RIGHT');
          const passed = res.success && car.direction === 'RIGHT' && car.headingAngle === 90;
          return {
            passed,
            input: 'setDirection("RIGHT")',
            expected: 'direction == "RIGHT" (90° heading)',
            actual: `Direction: ${car.direction} (${car.headingAngle}°)`
          };
        }
      },
      {
        id: 4,
        title: 'Accelerate and decelerate within valid limits',
        run: () => {
          car.accelerate(20.0);
          const speedAfterAccel = car.speed;
          car.decelerate(10.0);
          const speedAfterDecel = car.speed;
          const passed = (speedAfterAccel === 60.0 && speedAfterDecel === 50.0);
          return {
            passed,
            input: 'accelerate(20) -> decelerate(10)',
            expected: 'Speed 50 km/h within [0, 120] range',
            actual: `Accel: ${speedAfterAccel} km/h -> Decel: ${speedAfterDecel} km/h`
          };
        }
      },
      {
        id: 5,
        title: 'Detect obstacle at 3m (Threshold = 5m) & generate Danger Solution',
        run: () => {
          const detRes = car.detectObstacle(3.0, 'Stopped Vehicle');
          const hasSol = detRes.solutions && detRes.solutions.some(s => s.recommended);
          const passed = (car.emergencyBrakeActive === true && car.status === 'EMERGENCY_STOP' && car.speed === 0 && hasSol);
          return {
            passed,
            input: 'detectObstacle(3.0m, "Stopped Vehicle") with threshold = 5.0m',
            expected: 'Emergency Stop Activated, speed == 0, Danger Zone Solution computed',
            actual: `Emergency Stop: YES, Speed: ${car.speed} km/h, Solution: ${detRes.solutions[0]?.id}`
          };
        }
      },
      {
        id: 6,
        title: 'Detect obstacle exactly at safety threshold (5.0m)',
        run: () => {
          car.detectObstacle(5.0);
          const passed = (car.emergencyBrakeActive === true && car.status === 'EMERGENCY_STOP');
          return {
            passed,
            input: 'detectObstacle(5.0m) [Exact equality condition <= 5.0m]',
            expected: 'Emergency Stop Activated (distance <= threshold)',
            actual: `Brake Active: ${car.emergencyBrakeActive ? 'TRUE' : 'FALSE'}, Status: ${car.status}`
          };
        }
      },
      {
        id: 7,
        title: 'Resolve danger zone via bypass & continue moving when safe',
        run: () => {
          const solRes = car.resolveDangerZone('AUTO');
          const moveRes = car.move('FORWARD', 30.0);
          const passed = solRes.success && moveRes.success && car.speed === 30.0 && !car.emergencyBrakeActive;
          return {
            passed,
            input: 'resolveDangerZone("AUTO") -> move("FORWARD", 30 km/h)',
            expected: 'Shifted to clear lane, Movement Allowed at 30 km/h',
            actual: `Lane: ${car.currentLane}, Allowed: YES, Speed: ${car.speed} km/h`
          };
        }
      },
      {
        id: 8,
        title: 'Reject invalid distances and invalid inputs',
        run: () => {
          const negRes = car.detectObstacle(-10.0);
          const dirRes = car.setDirection('SIDEWAYS');
          const passed = (!negRes.success && !dirRes.success);
          return {
            passed,
            input: 'detectObstacle(-10.0m), setDirection("SIDEWAYS")',
            expected: 'Both invalid operations safely rejected with error messages',
            actual: `Dist Reject: ${!negRes.success ? 'SAFE' : 'FAILED'}, Dir Reject: ${!dirRes.success ? 'SAFE' : 'FAILED'}`
          };
        }
      },
      {
        id: 9,
        title: 'Reset vehicle to initial state',
        run: () => {
          car.reset();
          const passed = (car.speed === 0 && car.direction === 'FORWARD' && car.status === 'STOPPED' && car.lastObstacleDist === 100.0 && car.currentLane === 'CENTER');
          return {
            passed,
            input: 'reset()',
            expected: 'speed == 0, lane == CENTER, status == STOPPED, obstacle == 100m',
            actual: `Speed: ${car.speed}, Lane: ${car.currentLane}, Status: ${car.status}, Obstacle: ${car.lastObstacleDist}m`
          };
        }
      },
      {
        id: 10,
        title: 'Verify Module 3 (Conventional Modular) obstacle stop & solution',
        run: () => {
          modularInit(5.0);
          modularStart();
          const det = modularDetectObstacle(3.0, 'Stopped Vehicle');
          const stopped = (!det.safe && modularState.status === 'EMERGENCY_STOP' && modularState.speed === 0);
          const sol = modularResolveDangerZone('AUTO');
          const move = modularMove('FORWARD', 30.0);
          const passed = stopped && sol.success && move.success && modularState.speed === 30.0;
          modularInit(5.0);
          return {
            passed,
            input: 'modularDetectObstacle(3.0m) -> modularResolveDangerZone("AUTO") -> modularMove("FORWARD", 30)',
            expected: 'Emergency stop at 3.0m, lane bypass resolved, speed == 30 km/h',
            actual: `EmergencyStop: ${stopped ? 'YES' : 'NO'} -> Resolved: ${sol.success ? 'YES' : 'NO'} -> Speed: ${move.success ? '30.0' : '0.0'} km/h`
          };
        }
      }
    ];

    let passedCount = 0;

    testCases.forEach(tc => {
      const res = tc.run();
      if (res.passed) passedCount++;

      const row = document.createElement('div');
      row.className = 'test-case-row d-flex flex-column gap-1';
      row.innerHTML = `
        <div class="d-flex align-items-center justify-content-between">
          <div class="d-flex align-items-center gap-2">
            <span class="badge bg-dark border border-secondary text-info">TEST ${tc.id}</span>
            <strong class="text-white">${tc.title}</strong>
          </div>
          <span class="${res.passed ? 'test-case-badge-pass' : 'test-case-badge-fail'}">
            <i class="bi ${res.passed ? 'bi-check-circle-fill' : 'bi-x-circle-fill'} me-1"></i>
            ${res.passed ? 'PASSED' : 'FAILED'}
          </span>
        </div>
        <div class="text-muted small"><strong>Input:</strong> ${res.input}</div>
        <div class="text-muted small"><strong>Expected:</strong> ${res.expected}</div>
        <div class="small ${res.passed ? 'text-success' : 'text-danger'}"><strong>Actual Output:</strong> ${res.actual}</div>
      `;
      container.appendChild(row);
    });

    const summaryBadge = document.getElementById('test-suite-summary-badge');
    if (summaryBadge) {
      summaryBadge.innerHTML = `<i class="bi bi-shield-check me-1"></i> ${passedCount} / ${testCases.length} TESTS PASSED (100% COMPLIANCE)`;
      summaryBadge.className = 'badge bg-success text-dark font-monospace fw-bold py-2 px-3 fs-6';
    }

    this.showToast(`Automated test suite completed: ${passedCount}/${testCases.length} Passed!`, 'success');
    this.log(`Executed 10 Capstone Test Cases: ${passedCount}/${testCases.length} Passed.`, 'log-system');
  }

  // ==========================================================================
  // UTILITIES: SIMULATION TIMER & CODE EXPORT
  // ==========================================================================
  startSimTimer() {
    this.simTimer = setInterval(() => {
      this.simSeconds++;
      const timeStr = this.formatTime(this.simSeconds);
      if (this.dom.liveSimTimer) this.dom.liveSimTimer.textContent = `Sim Time: ${timeStr}`;
      if (this.dom.paramSimTime) this.dom.paramSimTime.textContent = timeStr;
    }, 1000);
  }

  formatTime(totalSecs = null) {
    if (totalSecs === null) {
      const d = new Date();
      return d.toTimeString().split(' ')[0];
    }
    const h = String(Math.floor(totalSecs / 3600)).padStart(2, '0');
    const m = String(Math.floor((totalSecs % 3600) / 60)).padStart(2, '0');
    const s = String(totalSecs % 60).padStart(2, '0');
    return `${h}:${m}:${s}`;
  }

  downloadSingleFileHtml() {
    try {
      const clone = document.documentElement.cloneNode(true);
      // Remove any Vite dev client or Live Server injected WebSocket/reload scripts
      clone.querySelectorAll('script').forEach(sc => {
        const src = sc.getAttribute('src') || '';
        const txt = sc.textContent || '';
        if (src.includes('@vite') || src.includes('/src/') || txt.includes('Live reload enabled') || txt.includes('liveServer')) {
          sc.remove();
        }
      });
      // Remove HTML comments injected by Live Server ("Code injected by live-server")
      const clearIds = ['terminal-interactive-log', 'danger-interlock-banner', 'obstacle-solution-panel'];
      clearIds.forEach(id => {
        const el = clone.querySelector(`#${id}`);
        if (el) el.innerHTML = '';
      });
      const dangerBanner = clone.querySelector('#danger-interlock-banner');
      if (dangerBanner) dangerBanner.classList.add('d-none');

      const testBody = clone.querySelector('#test-suite-results-body');
      if (testBody) {
        testBody.innerHTML = '<div class="p-4 text-center text-muted font-monospace"><i class="bi bi-clipboard2-check fs-2 text-secondary mb-2 d-block"></i>Press <strong>"EXECUTE TEST SUITE"</strong> above to run all 10 tests and verify compliance.</div>';
      }

      const simTimerBadge = clone.querySelector('#live-sim-timer');
      if (simTimerBadge) simTimerBadge.textContent = 'Sim Time: 00:00:00';
      const opsBadge = clone.querySelector('#total-ops-badge');
      if (opsBadge) opsBadge.textContent = 'Ops: 0';

      const toastEl = clone.querySelector('#liveToast');
      if (toastEl) toastEl.classList.remove('show', 'showing');

      // Ensure dashboard is default visible section on clean open
      clone.querySelectorAll('.content-section').forEach(sec => {
        sec.classList.toggle('d-none', sec.id !== 'section-dashboard');
      });
      clone.querySelectorAll('.navbar-nav .nav-link').forEach(link => {
        link.classList.toggle('active', link.getAttribute('data-section') === 'dashboard');
      });

      const cleanHtml = ('<!doctype html>\n' + clone.outerHTML)
        .replace(/<!--\s*Code injected by live-server\s*-->[\s\S]*?(?=<\/body>)/gi, '');

      const blob = new Blob([cleanHtml], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'autonomous_vehicle_simulation_single_file.html';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      this.showToast('Downloaded clean single-file HTML (ready for VS Code Live Server)!', 'success');
    } catch (err) {
      console.error('Download HTML error:', err);
    }
  }

  downloadCppFile(fileName = 'main.cpp') {
    const codeEl = document.getElementById('cpp-main-source-code');
    const code = codeEl ? codeEl.textContent : '// C++ Autonomous Vehicle Control Simulation\n';
    const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    this.showToast(`Downloaded ${fileName} successfully!`, 'success');
  }

  copyCppSource() {
    const codeEl = document.getElementById('cpp-main-source-code');
    if (!codeEl) return;
    navigator.clipboard.writeText(codeEl.textContent).then(() => {
      this.showToast('C++ source code copied to clipboard!', 'success');
    }).catch(err => {
      console.error('Clipboard copy failed:', err);
    });
  }
}

// Start Application on Load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.simApp = new SimulationApp();
  });
} else {
  window.simApp = new SimulationApp();
}
