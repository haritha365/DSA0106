#include "ModularControl.h"
#include <iostream>
#include <iomanip>
#include <algorithm>

using namespace std;

const double MODULAR_MAX_SPEED = 120.0;

void initModularVehicle(ModularVehicle& v, double threshold) {
    v.speed = 0.0;
    v.direction = "FORWARD";
    v.status = "STOPPED";
    v.currentLane = "CENTER";
    v.safetyThreshold = threshold;
    v.lastObstacleDist = 100.0;
    v.emergencyBrakeActive = false;
    v.activeObstacles.clear();
}

bool modularStart(ModularVehicle& v) {
    if (v.status == "MOVING") {
        cout << "[Modular] Notice: Vehicle is already moving." << endl;
        return false;
    }
    v.status = "STOPPED";
    cout << "[Modular] Vehicle started successfully." << endl;
    return true;
}

bool modularStop(ModularVehicle& v) {
    v.speed = 0.0;
    v.status = "STOPPED";
    cout << "[Modular] Vehicle stopped successfully." << endl;
    return true;
}

bool modularAccelerate(ModularVehicle& v, double delta) {
    v.speed = min(MODULAR_MAX_SPEED, v.speed + delta);
    v.status = (v.speed > 0) ? "MOVING" : "STOPPED";
    cout << "[Modular] Vehicle moving at the selected speed: " << v.speed << " km/h." << endl;
    return true;
}

bool modularDecelerate(ModularVehicle& v, double delta) {
    if (v.speed <= 0.0) {
        cout << "[Modular] Vehicle is already at 0 km/h." << endl;
        return false;
    }
    v.speed = max(0.0, v.speed - delta);
    if (v.speed == 0.0) v.status = "STOPPED";
    cout << "[Modular] Speed reduced to: " << v.speed << " km/h." << endl;
    return true;
}

bool modularChangeDirection(ModularVehicle& v, const string& newDir) {
    if (newDir != "FORWARD" && newDir != "BACKWARD" && newDir != "LEFT" && newDir != "RIGHT") {
        cout << "[Modular] Error: Invalid direction." << endl;
        return false;
    }
    v.direction = newDir;
    cout << "[Modular] Vehicle direction changed to: " << v.direction << endl;
    return true;
}

void modularDisplayObstacles(const ModularVehicle& v) {
    cout << "\n[MODULAR OBSTACLE RADAR]" << endl;
    if (v.activeObstacles.empty()) {
        cout << " - No obstacles detected." << endl;
        return;
    }
    for (const auto& obs : v.activeObstacles) {
        string tag = (obs.distance <= v.safetyThreshold) ? "DANGER ZONE"
                   : (obs.distance <= v.safetyThreshold * 3.0 ? "WARNING" : "SAFE");
        cout << " - " << obs.id << " | " << obs.type
             << " | Lane: " << obs.lane
             << " | Dist: " << fixed << setprecision(1) << obs.distance << "m [" << tag << "]" << endl;
    }
}

string modularGetDangerSolution(const ModularVehicle& v) {
    if (v.lastObstacleDist > v.safetyThreshold) return "PATH_SAFE";

    auto laneClear = [&](const string& lane) {
        for (const auto& obs : v.activeObstacles) {
            if (obs.lane == lane && obs.distance <= v.safetyThreshold) return false;
        }
        return true;
    };

    if (v.currentLane == "CENTER") {
        if (laneClear("LEFT")) return "BYPASS_LEFT";
        if (laneClear("RIGHT")) return "BYPASS_RIGHT";
    } else if (v.currentLane == "RIGHT" && laneClear("CENTER")) {
        return "BYPASS_LEFT";
    } else if (v.currentLane == "LEFT" && laneClear("CENTER")) {
        return "BYPASS_RIGHT";
    }
    return "REVERSE_BACKOUT";
}

bool modularDetectObstacle(ModularVehicle& v, double distance, const string& type, const string& lane) {
    if (distance < 0.0) {
        cout << "[Modular] Error: Distance cannot be negative (" << distance << "m)!" << endl;
        return false;
    }

    string targetLane = lane.empty() ? v.currentLane : lane;
    bool updated = false;
    for (auto& obs : v.activeObstacles) {
        if (obs.lane == targetLane) {
            obs.type = type;
            obs.distance = distance;
            updated = true;
            break;
        }
    }
    if (!updated) {
        v.activeObstacles.push_back({"OBS-" + to_string(v.activeObstacles.size() + 1), type, targetLane, distance});
    }

    if (targetLane == v.currentLane) {
        v.lastObstacleDist = distance;
    }

    cout << "\n----------------------------------------" << endl;
    cout << "Obstacle distance: " << distance << " meters" << endl;
    cout << "Safety threshold : " << v.safetyThreshold << " meters" << endl;

    if (v.lastObstacleDist <= v.safetyThreshold) {
        v.emergencyBrakeActive = true;
        v.speed = 0.0;
        v.status = "EMERGENCY_STOP";
        cout << "Output: Obstacle detected!" << endl;
        cout << "Output: Emergency stop activated." << endl;
        cout << "Reason: Distance (" << v.lastObstacleDist << "m) <= safety threshold (" << v.safetyThreshold << "m)." << endl;
        modularDisplayObstacles(v);
        cout << "Recommended Danger Solution: " << modularGetDangerSolution(v) << endl;
        cout << "----------------------------------------\n" << endl;
        return false;
    } else {
        v.emergencyBrakeActive = false;
        if (v.status == "EMERGENCY_STOP") v.status = "STOPPED";
        cout << "Output: Path safe." << endl;
        cout << "----------------------------------------\n" << endl;
        return true;
    }
}

bool modularResolveDangerZone(ModularVehicle& v, const string& solutionType) {
    string chosen = (solutionType == "AUTO") ? modularGetDangerSolution(v) : solutionType;

    if (chosen == "BYPASS_LEFT") {
        if (v.currentLane == "CENTER") v.currentLane = "LEFT";
        else if (v.currentLane == "RIGHT") v.currentLane = "CENTER";
        else return false;
        v.lastObstacleDist = 65.0;
        v.emergencyBrakeActive = false;
        v.direction = "LEFT";
        v.status = "MOVING";
        v.speed = 25.0;
        cout << "[Modular Solution] Executed BYPASS_LEFT -> Lane: " << v.currentLane << endl;
        return true;
    } else if (chosen == "BYPASS_RIGHT") {
        if (v.currentLane == "CENTER") v.currentLane = "RIGHT";
        else if (v.currentLane == "LEFT") v.currentLane = "CENTER";
        else return false;
        v.lastObstacleDist = 65.0;
        v.emergencyBrakeActive = false;
        v.direction = "RIGHT";
        v.status = "MOVING";
        v.speed = 25.0;
        cout << "[Modular Solution] Executed BYPASS_RIGHT -> Lane: " << v.currentLane << endl;
        return true;
    } else if (chosen == "REVERSE_BACKOUT") {
        v.lastObstacleDist += 10.0;
        for (auto& obs : v.activeObstacles) {
            if (obs.lane == v.currentLane) obs.distance = v.lastObstacleDist;
        }
        v.emergencyBrakeActive = (v.lastObstacleDist <= v.safetyThreshold);
        v.direction = "BACKWARD";
        v.status = v.emergencyBrakeActive ? "EMERGENCY_STOP" : "STOPPED";
        v.speed = 0.0;
        cout << "[Modular Solution] Reversed +10.0m -> Clearance: " << v.lastObstacleDist << "m" << endl;
        return !v.emergencyBrakeActive;
    } else if (chosen == "CLEAR_OBSTACLE") {
        v.lastObstacleDist = 75.0;
        for (auto& obs : v.activeObstacles) {
            if (obs.lane == v.currentLane) obs.distance = 75.0;
        }
        v.emergencyBrakeActive = false;
        v.status = "STOPPED";
        v.speed = 0.0;
        cout << "[Modular Solution] Obstacle cleared (75.0m)." << endl;
        return true;
    }
    return false;
}

bool modularMove(ModularVehicle& v, const string& moveDir, double targetSpeed) {
    if (v.emergencyBrakeActive && v.lastObstacleDist <= v.safetyThreshold) {
        cout << "[Modular] Action blocked: Obstacle within threshold (" << v.safetyThreshold << "m)." << endl;
        return false;
    }
    modularChangeDirection(v, moveDir);
    v.speed = max(0.0, min(MODULAR_MAX_SPEED, targetSpeed));
    v.status = (v.speed > 0) ? "MOVING" : "STOPPED";
    cout << "[Modular] Moving " << v.direction << " at " << v.speed << " km/h." << endl;
    return true;
}

void modularDisplayStatus(const ModularVehicle& v) {
    cout << "\n========== MODULAR VEHICLE STATUS ==========" << endl;
    cout << " Status            : " << v.status << endl;
    cout << " Speed             : " << fixed << setprecision(1) << v.speed << " km/h" << endl;
    cout << " Direction         : " << v.direction << " (Lane: " << v.currentLane << ")" << endl;
    cout << " Safety Threshold  : " << v.safetyThreshold << " meters" << endl;
    cout << " Obstacle Distance : " << v.lastObstacleDist << " meters" << endl;
    cout << " Emergency Brake   : " << (v.emergencyBrakeActive ? "ENGAGED" : "CLEAR") << endl;
    cout << "=============================================\n" << endl;
    modularDisplayObstacles(v);
}

void modularReset(ModularVehicle& v) {
    initModularVehicle(v, v.safetyThreshold);
    cout << "[Modular] Vehicle state reset to defaults." << endl;
}
