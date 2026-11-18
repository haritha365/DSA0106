#include "Vehicle.h"
#include <iostream>
#include <iomanip>
#include <algorithm>

using namespace std;

const double MAX_VEHICLE_SPEED = 120.0;

// ============================================================================
// MODULE 1: Vehicle Base Class Implementation
// ============================================================================
Vehicle::Vehicle(string initialDirection)
    : speed(0.0), direction(initialDirection), status("STOPPED") {}

double Vehicle::getSpeed() const { return speed; }
string Vehicle::getDirection() const { return direction; }
string Vehicle::getStatus() const { return status; }

bool Vehicle::start() {
    if (status == "MOVING") {
        cout << "[OOP Vehicle] Notice: Vehicle is already running." << endl;
        return false;
    }
    status = "STOPPED";
    cout << "[OOP Vehicle] Vehicle started successfully." << endl;
    return true;
}

bool Vehicle::stop() {
    speed = 0.0;
    status = "STOPPED";
    cout << "[OOP Vehicle] Vehicle stopped successfully." << endl;
    return true;
}

bool Vehicle::accelerate(double delta) {
    if (speed + delta > MAX_VEHICLE_SPEED) {
        speed = MAX_VEHICLE_SPEED;
        cout << "[OOP Vehicle] Maximum speed reached (" << MAX_VEHICLE_SPEED << " km/h)." << endl;
    } else {
        speed += delta;
    }
    status = (speed > 0) ? "MOVING" : "STOPPED";
    cout << "[OOP Vehicle] Vehicle moving at the selected speed: " << speed << " km/h." << endl;
    return true;
}

bool Vehicle::decelerate(double delta) {
    if (speed <= 0.0) {
        cout << "[OOP Vehicle] Vehicle is already at 0 km/h." << endl;
        return false;
    }
    speed = max(0.0, speed - delta);
    if (speed == 0.0) {
        status = "STOPPED";
        cout << "[OOP Vehicle] Vehicle stopped successfully." << endl;
    } else {
        cout << "[OOP Vehicle] Vehicle decelerated. Current speed: " << speed << " km/h." << endl;
    }
    return true;
}

bool Vehicle::setDirection(const string& newDir) {
    if (newDir != "FORWARD" && newDir != "BACKWARD" && newDir != "LEFT" && newDir != "RIGHT") {
        cout << "[OOP Vehicle] Error: Invalid direction. Use FORWARD, BACKWARD, LEFT, or RIGHT." << endl;
        return false;
    }
    direction = newDir;
    cout << "[OOP Vehicle] Vehicle direction changed to: " << direction << endl;
    return true;
}

void Vehicle::displayStatus() const {
    cout << "\n========== OOP VEHICLE STATUS ==========" << endl;
    cout << " Status    : " << status << endl;
    cout << " Speed     : " << fixed << setprecision(1) << speed << " km/h" << endl;
    cout << " Direction : " << direction << endl;
    cout << "========================================\n" << endl;
}

// ============================================================================
// MODULE 1 (DERIVED): AutonomousCar Navigation, Obstacle Display & Danger Solutions
// ============================================================================
AutonomousCar::AutonomousCar(double threshold)
    : Vehicle("FORWARD"),
      safetyThreshold(threshold),
      lastObstacleDist(100.0),
      emergencyBrakeActive(false),
      currentLane("CENTER") {}

void AutonomousCar::setSafetyThreshold(double threshold) {
    if (threshold <= 0.0) {
        cout << "[Navigation] Error: Safety threshold must be greater than zero." << endl;
        return;
    }
    safetyThreshold = threshold;
    cout << "[Navigation] Safety threshold configured to: " << safetyThreshold << " meters." << endl;
}

double AutonomousCar::getSafetyThreshold() const { return safetyThreshold; }
double AutonomousCar::getLastObstacleDistance() const { return lastObstacleDist; }
string AutonomousCar::getCurrentLane() const { return currentLane; }
bool AutonomousCar::isEmergencyBrakeActive() const { return emergencyBrakeActive; }
const vector<Obstacle>& AutonomousCar::getActiveObstacles() const { return activeObstacles; }

bool AutonomousCar::detectObstacle(double distance, const string& type, const string& lane) {
    if (distance < 0.0) {
        cout << "[Navigation] Error: Negative distance entered (" << distance << "m). Distance must be >= 0." << endl;
        return false;
    }

    string targetLane = lane.empty() ? currentLane : lane;

    // Update or insert obstacle in the target lane
    bool updated = false;
    for (auto& obs : activeObstacles) {
        if (obs.lane == targetLane) {
            obs.type = type;
            obs.distance = distance;
            updated = true;
            break;
        }
    }
    if (!updated) {
        activeObstacles.push_back({"OBS-" + to_string(activeObstacles.size() + 1), type, targetLane, distance});
    }

    if (targetLane == currentLane) {
        lastObstacleDist = distance;
    }

    cout << "\n----------------------------------------" << endl;
    cout << "Obstacle Type    : " << type << " [" << targetLane << " LANE]" << endl;
    cout << "Obstacle distance: " << distance << " meters" << endl;
    cout << "Safety threshold : " << safetyThreshold << " meters" << endl;

    if (lastObstacleDist <= safetyThreshold) {
        emergencyBrakeActive = true;
        speed = 0.0;
        status = "EMERGENCY_STOP";
        cout << "Output: Obstacle detected!" << endl;
        cout << "Output: Emergency stop activated." << endl;
        cout << "Reason: Obstacle distance (" << lastObstacleDist << "m) <= safety threshold ("
             << safetyThreshold << "m). Vehicle immobilized." << endl;
        displayActiveObstacles();
        displayDangerZoneSolution();
        cout << "----------------------------------------\n" << endl;
        return false; // Hazard present
    } else {
        emergencyBrakeActive = false;
        if (status == "EMERGENCY_STOP") {
            status = "STOPPED";
        }
        cout << "Output: Path safe." << endl;
        cout << "Status: Distance (" << lastObstacleDist << "m) > safety threshold ("
             << safetyThreshold << "m). Vehicle is clear to move." << endl;
        cout << "----------------------------------------\n" << endl;
        return true; // Path safe
    }
}

void AutonomousCar::addSideObstacle(const string& type, const string& lane, double distance) {
    if (distance < 0.0) return;
    for (auto& obs : activeObstacles) {
        if (obs.lane == lane) {
            obs.type = type;
            obs.distance = distance;
            return;
        }
    }
    activeObstacles.push_back({"OBS-" + to_string(activeObstacles.size() + 1), type, lane, distance});
}

void AutonomousCar::displayActiveObstacles() const {
    cout << "\n[DETECTED OBSTACLES RADAR]" << endl;
    if (activeObstacles.empty()) {
        cout << " - No obstacles within sensor range." << endl;
        return;
    }
    for (const auto& obs : activeObstacles) {
        string severity = (obs.distance <= safetyThreshold) ? "DANGER ZONE"
                        : (obs.distance <= safetyThreshold * 3.0 ? "WARNING" : "SAFE");
        cout << " - " << obs.id << " | " << obs.type
             << " | Lane: " << obs.lane
             << " | Dist: " << fixed << setprecision(1) << obs.distance << "m"
             << " | [" << severity << "]" << endl;
    }
}

string AutonomousCar::getRecommendedDangerSolution() const {
    if (lastObstacleDist > safetyThreshold) {
        return "PATH_SAFE";
    }
    auto isLaneClear = [&](const string& lane) {
        for (const auto& obs : activeObstacles) {
            if (obs.lane == lane && obs.distance <= safetyThreshold) return false;
        }
        return true;
    };

    if (currentLane == "CENTER") {
        if (isLaneClear("LEFT")) return "BYPASS_LEFT";
        if (isLaneClear("RIGHT")) return "BYPASS_RIGHT";
    } else if (currentLane == "RIGHT" && isLaneClear("CENTER")) {
        return "BYPASS_LEFT";
    } else if (currentLane == "LEFT" && isLaneClear("CENTER")) {
        return "BYPASS_RIGHT";
    }
    return "REVERSE_BACKOUT";
}

void AutonomousCar::displayDangerZoneSolution() const {
    string rec = getRecommendedDangerSolution();
    cout << "\n>>> DANGER ZONE RECOVERY SOLUTIONS <<<" << endl;
    cout << " Current Lane: " << currentLane << " (Blocked at " << lastObstacleDist << "m)" << endl;
    cout << " Recommended : " << rec << endl;
    cout << " 1. BYPASS_LEFT    : Steer into clear LEFT lane to avoid obstacle." << endl;
    cout << " 2. BYPASS_RIGHT   : Steer into clear RIGHT lane to avoid obstacle." << endl;
    cout << " 3. REVERSE_BACKOUT: Reverse +10.0m to restore safe distance (> " << safetyThreshold << "m)." << endl;
    cout << " 4. CLEAR_OBSTACLE : Wait until obstacle moves / hazard is removed." << endl;
}

bool AutonomousCar::resolveDangerZone(const string& solutionType) {
    string chosen = (solutionType == "AUTO") ? getRecommendedDangerSolution() : solutionType;

    if (chosen == "BYPASS_LEFT") {
        if (currentLane == "CENTER") currentLane = "LEFT";
        else if (currentLane == "RIGHT") currentLane = "CENTER";
        else {
            cout << "[Danger Solution] Cannot bypass further LEFT from LEFT lane." << endl;
            return false;
        }
        lastObstacleDist = 65.0;
        for (const auto& obs : activeObstacles) {
            if (obs.lane == currentLane) lastObstacleDist = obs.distance;
        }
        if (lastObstacleDist > safetyThreshold) {
            emergencyBrakeActive = false;
            status = "MOVING";
            speed = 25.0;
            direction = "LEFT";
            cout << "[Danger Solution] Executed BYPASS_LEFT into " << currentLane
                 << " lane. Safe clearance: " << lastObstacleDist << "m. Vehicle moving safely." << endl;
            return true;
        }
        return false;
    } else if (chosen == "BYPASS_RIGHT") {
        if (currentLane == "CENTER") currentLane = "RIGHT";
        else if (currentLane == "LEFT") currentLane = "CENTER";
        else {
            cout << "[Danger Solution] Cannot bypass further RIGHT from RIGHT lane." << endl;
            return false;
        }
        lastObstacleDist = 65.0;
        for (const auto& obs : activeObstacles) {
            if (obs.lane == currentLane) lastObstacleDist = obs.distance;
        }
        if (lastObstacleDist > safetyThreshold) {
            emergencyBrakeActive = false;
            status = "MOVING";
            speed = 25.0;
            direction = "RIGHT";
            cout << "[Danger Solution] Executed BYPASS_RIGHT into " << currentLane
                 << " lane. Safe clearance: " << lastObstacleDist << "m. Vehicle moving safely." << endl;
            return true;
        }
        return false;
    } else if (chosen == "REVERSE_BACKOUT") {
        lastObstacleDist += 10.0;
        for (auto& obs : activeObstacles) {
            if (obs.lane == currentLane) obs.distance = lastObstacleDist;
        }
        emergencyBrakeActive = (lastObstacleDist <= safetyThreshold);
        direction = "BACKWARD";
        status = emergencyBrakeActive ? "EMERGENCY_STOP" : "STOPPED";
        speed = 0.0;
        cout << "[Danger Solution] Executed REVERSE_BACKOUT (+10.0m). New clearance: "
             << lastObstacleDist << "m. Interlock released." << endl;
        return !emergencyBrakeActive;
    } else if (chosen == "CLEAR_OBSTACLE") {
        lastObstacleDist = 75.0;
        for (auto& obs : activeObstacles) {
            if (obs.lane == currentLane) obs.distance = 75.0;
        }
        emergencyBrakeActive = false;
        status = "STOPPED";
        speed = 0.0;
        cout << "[Danger Solution] Road obstacle cleared (75.0m). Path safe to resume." << endl;
        return true;
    }
    return false;
}

bool AutonomousCar::move(const string& moveDir, double targetSpeed) {
    if (emergencyBrakeActive && lastObstacleDist <= safetyThreshold) {
        cout << "[Navigation] Action blocked: Obstacle (" << lastObstacleDist
             << "m) <= safety threshold (" << safetyThreshold << "m). Vehicle immobilized." << endl;
        displayDangerZoneSolution();
        return false;
    }

    if (!setDirection(moveDir)) return false;
    speed = max(0.0, min(MAX_VEHICLE_SPEED, targetSpeed));
    status = (speed > 0) ? "MOVING" : "STOPPED";
    cout << "[Navigation] Moving " << direction << " at " << speed << " km/h." << endl;
    return true;
}

void AutonomousCar::reset() {
    speed = 0.0;
    direction = "FORWARD";
    status = "STOPPED";
    currentLane = "CENTER";
    lastObstacleDist = 100.0;
    emergencyBrakeActive = false;
    activeObstacles.clear();
    cout << "[AutonomousCar] Vehicle successfully reset to default initial state." << endl;
}

void AutonomousCar::displayStatus() const {
    cout << "\n========== AUTONOMOUS VEHICLE STATUS ==========" << endl;
    cout << " Operating Status    : " << status << endl;
    cout << " Current Speed       : " << fixed << setprecision(1) << speed << " km/h" << endl;
    cout << " Movement Direction  : " << direction << " (Lane: " << currentLane << ")" << endl;
    cout << " Safety Threshold    : " << safetyThreshold << " meters" << endl;
    cout << " Obstacle Distance   : " << lastObstacleDist << " meters" << endl;
    cout << " Collision Interlock : " << (emergencyBrakeActive ? "ENGAGED (IMMOBILIZED)" : "DISENGAGED (CLEAR)") << endl;
    cout << "================================================\n" << endl;
    displayActiveObstacles();
}
