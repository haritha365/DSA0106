/**
 * ============================================================================
 * Capstone Project: Autonomous Vehicle Control Simulation
 * ============================================================================
 * Language: C++ (Standard C++14 / C++17 compatible)
 * Compiler: GCC / MinGW / Clang / MSVC
 * IDE: Visual Studio Code
 * 
 * 3 Core Modules:
 * - Module 1: Autonomous Vehicle Control Using OOP (Base Class Vehicle)
 * - Module 2: Navigation & Obstacle Detection (Derived AutonomousCar & Danger Solutions)
 * - Module 3: Conventional Modular Programming Implementation (Procedural Structures & Functions)
 * ============================================================================
 */

#include <iostream>
#include <string>
#include <vector>
#include <iomanip>
#include <limits>
#include <cmath>
#include <algorithm>

using namespace std;

// ============================================================================
// GLOBAL CONSTANTS & CONFIGURATION
// ============================================================================
const double DEFAULT_SAFETY_THRESHOLD = 5.0; // in meters
const double MAX_SPEED = 120.0;              // in km/h
const double SPEED_STEP = 10.0;              // acceleration / deceleration step

struct Obstacle {
    string id;
    string type;
    string lane;
    double distance;
};

// ============================================================================
// MODULE 1: AUTONOMOUS VEHICLE CONTROL USING OOP (BASE CLASS Vehicle)
// ============================================================================
class Vehicle {
protected:
    double speed;       // Current speed in km/h
    string direction;   // "FORWARD", "BACKWARD", "LEFT", "RIGHT"
    string status;      // "STOPPED", "MOVING", "EMERGENCY_STOP", "WARNING"

public:
    Vehicle(string initialDirection = "FORWARD")
        : speed(0.0), direction(initialDirection), status("STOPPED") {}

    virtual ~Vehicle() {}

    double getSpeed() const { return speed; }
    string getDirection() const { return direction; }
    string getStatus() const { return status; }

    virtual bool start() {
        if (status == "MOVING") {
            cout << "[OOP Vehicle] Notice: Vehicle is already running." << endl;
            return false;
        }
        status = "STOPPED";
        cout << "[OOP Vehicle] Vehicle started successfully." << endl;
        return true;
    }

    virtual bool stop() {
        speed = 0.0;
        status = "STOPPED";
        cout << "[OOP Vehicle] Vehicle stopped successfully." << endl;
        return true;
    }

    virtual bool accelerate(double delta = SPEED_STEP) {
        if (speed + delta > MAX_SPEED) {
            speed = MAX_SPEED;
            cout << "[OOP Vehicle] Maximum speed reached (" << MAX_SPEED << " km/h)." << endl;
        } else {
            speed += delta;
        }
        status = (speed > 0) ? "MOVING" : "STOPPED";
        cout << "[OOP Vehicle] Vehicle moving at the selected speed: " << speed << " km/h." << endl;
        return true;
    }

    virtual bool decelerate(double delta = SPEED_STEP) {
        if (speed <= 0.0) {
            cout << "[OOP Vehicle] Vehicle is already at 0 km/h." << endl;
            return false;
        }
        speed = max(0.0, speed - delta);
        if (speed == 0.0) {
            status = "STOPPED";
            cout << "[OOP Vehicle] Decelerated to standstill. Vehicle stopped successfully." << endl;
        } else {
            cout << "[OOP Vehicle] Vehicle decelerated. Current speed: " << speed << " km/h." << endl;
        }
        return true;
    }

    virtual bool setDirection(const string& newDir) {
        if (newDir != "FORWARD" && newDir != "BACKWARD" && newDir != "LEFT" && newDir != "RIGHT") {
            cout << "[OOP Vehicle] Error: Invalid direction. Use FORWARD, BACKWARD, LEFT, or RIGHT." << endl;
            return false;
        }
        direction = newDir;
        cout << "[OOP Vehicle] Vehicle direction changed to: " << direction << endl;
        return true;
    }

    virtual void displayStatus() const {
        cout << "\n========== OOP VEHICLE STATUS ==========" << endl;
        cout << " Status    : " << status << endl;
        cout << " Speed     : " << fixed << setprecision(1) << speed << " km/h" << endl;
        cout << " Direction : " << direction << endl;
        cout << "========================================\n" << endl;
    }
};

// ============================================================================
// MODULE 2: NAVIGATION, OBSTACLE DETECTION & DANGER SOLUTIONS (AutonomousCar)
// ============================================================================
class AutonomousCar : public Vehicle {
private:
    double safetyThreshold;
    double lastObstacleDist;
    bool emergencyBrakeActive;
    string currentLane;
    vector<Obstacle> activeObstacles;

public:
    AutonomousCar(double threshold = DEFAULT_SAFETY_THRESHOLD)
        : Vehicle("FORWARD"),
          safetyThreshold(threshold),
          lastObstacleDist(100.0),
          emergencyBrakeActive(false),
          currentLane("CENTER") {}

    void setSafetyThreshold(double threshold) {
        if (threshold <= 0.0) {
            cout << "[Navigation] Error: Safety threshold must be positive." << endl;
            return;
        }
        safetyThreshold = threshold;
        cout << "[Navigation] Safety threshold updated to: " << safetyThreshold << " meters." << endl;
    }

    double getSafetyThreshold() const { return safetyThreshold; }
    double getLastObstacleDistance() const { return lastObstacleDist; }
    string getCurrentLane() const { return currentLane; }
    bool isEmergencyBrakeActive() const { return emergencyBrakeActive; }

    void displayActiveObstacles() const {
        cout << "\n[DETECTED OBSTACLES RADAR]" << endl;
        if (activeObstacles.empty()) {
            cout << " - No obstacles detected on roadway." << endl;
            return;
        }
        for (const auto& obs : activeObstacles) {
            string sev = (obs.distance <= safetyThreshold) ? "DANGER ZONE"
                       : (obs.distance <= safetyThreshold * 3.0 ? "WARNING" : "SAFE");
            cout << " - " << obs.id << " | " << obs.type
                 << " | Lane: " << obs.lane
                 << " | Dist: " << fixed << setprecision(1) << obs.distance << "m [" << sev << "]" << endl;
        }
    }

    string getRecommendedDangerSolution() const {
        if (lastObstacleDist > safetyThreshold) return "PATH_SAFE";

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

    void displayDangerZoneSolution() const {
        string rec = getRecommendedDangerSolution();
        cout << "\n>>> DANGER ZONE RECOVERY SOLUTIONS <<<" << endl;
        cout << " Current Lane: " << currentLane << " | Recommended Action: " << rec << endl;
        cout << " 1. BYPASS_LEFT    : Steer to clear LEFT lane" << endl;
        cout << " 2. BYPASS_RIGHT   : Steer to clear RIGHT lane" << endl;
        cout << " 3. REVERSE_BACKOUT: Reverse +10m to exceed safety threshold" << endl;
        cout << " 4. CLEAR_OBSTACLE : Wait/remove obstacle to restore clear path" << endl;
    }

    bool resolveDangerZone(const string& solutionType = "AUTO") {
        string chosen = (solutionType == "AUTO") ? getRecommendedDangerSolution() : solutionType;

        if (chosen == "BYPASS_LEFT") {
            if (currentLane == "CENTER") currentLane = "LEFT";
            else if (currentLane == "RIGHT") currentLane = "CENTER";
            else return false;

            lastObstacleDist = 65.0;
            for (const auto& obs : activeObstacles) {
                if (obs.lane == currentLane) lastObstacleDist = obs.distance;
            }
            if (lastObstacleDist > safetyThreshold) {
                emergencyBrakeActive = false;
                status = "MOVING";
                speed = 25.0;
                direction = "LEFT";
                cout << "[Danger Solution] Bypassed LEFT into " << currentLane << " lane. Clear distance: " << lastObstacleDist << "m." << endl;
                return true;
            }
            return false;
        } else if (chosen == "BYPASS_RIGHT") {
            if (currentLane == "CENTER") currentLane = "RIGHT";
            else if (currentLane == "LEFT") currentLane = "CENTER";
            else return false;

            lastObstacleDist = 65.0;
            for (const auto& obs : activeObstacles) {
                if (obs.lane == currentLane) lastObstacleDist = obs.distance;
            }
            if (lastObstacleDist > safetyThreshold) {
                emergencyBrakeActive = false;
                status = "MOVING";
                speed = 25.0;
                direction = "RIGHT";
                cout << "[Danger Solution] Bypassed RIGHT into " << currentLane << " lane. Clear distance: " << lastObstacleDist << "m." << endl;
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
            cout << "[Danger Solution] Reversed +10.0m. New distance: " << lastObstacleDist << "m. Interlock cleared." << endl;
            return !emergencyBrakeActive;
        } else if (chosen == "CLEAR_OBSTACLE") {
            lastObstacleDist = 75.0;
            for (auto& obs : activeObstacles) {
                if (obs.lane == currentLane) obs.distance = 75.0;
            }
            emergencyBrakeActive = false;
            status = "STOPPED";
            speed = 0.0;
            cout << "[Danger Solution] Obstacle cleared (75.0m). Safe to resume." << endl;
            return true;
        }
        return false;
    }

    bool detectObstacle(double distance, const string& type = "Road Barricade", const string& lane = "") {
        if (distance < 0.0) {
            cout << "[Navigation] Error: Distance cannot be negative! Please enter a valid distance." << endl;
            return false;
        }

        string targetLane = lane.empty() ? currentLane : lane;
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
            return false;
        } else {
            emergencyBrakeActive = false;
            if (status == "EMERGENCY_STOP") {
                status = "STOPPED";
            }
            cout << "Output: Path safe." << endl;
            cout << "Status: Distance (" << lastObstacleDist << "m) > safety threshold ("
                 << safetyThreshold << "m). Vehicle may continue moving." << endl;
            cout << "----------------------------------------\n" << endl;
            return true;
        }
    }

    bool move(const string& moveDir, double targetSpeed = 30.0) {
        if (emergencyBrakeActive && lastObstacleDist <= safetyThreshold) {
            cout << "[Navigation] Action blocked: Obstacle (" << lastObstacleDist
                 << "m) <= safety threshold (" << safetyThreshold << "m). Apply a Danger Zone Solution first." << endl;
            displayDangerZoneSolution();
            return false;
        }

        setDirection(moveDir);
        speed = max(0.0, min(MAX_SPEED, targetSpeed));
        status = (speed > 0) ? "MOVING" : "STOPPED";
        cout << "[Navigation] Moving " << direction << " at " << speed << " km/h." << endl;
        return true;
    }

    void reset() {
        speed = 0.0;
        direction = "FORWARD";
        currentLane = "CENTER";
        status = "STOPPED";
        lastObstacleDist = 100.0;
        emergencyBrakeActive = false;
        activeObstacles.clear();
        cout << "[AutonomousCar] Vehicle reset to initial factory state." << endl;
    }

    void displayStatus() const override {
        cout << "\n========== AUTONOMOUS VEHICLE STATUS ==========" << endl;
        cout << " Operating Status    : " << status << endl;
        cout << " Current Speed       : " << fixed << setprecision(1) << speed << " km/h" << endl;
        cout << " Movement Direction  : " << direction << " (Lane: " << currentLane << ")" << endl;
        cout << " Safety Threshold    : " << safetyThreshold << " meters" << endl;
        cout << " Last Obstacle Dist  : " << lastObstacleDist << " meters" << endl;
        cout << " Emergency Interlock : " << (emergencyBrakeActive ? "ENGAGED (LOCKED)" : "DISENGAGED (CLEAR)") << endl;
        cout << "================================================\n" << endl;
        displayActiveObstacles();
    }
};

// ============================================================================
// MODULE 3: CONVENTIONAL MODULAR PROGRAMMING IMPLEMENTATION
// ============================================================================
struct ModularVehicle {
    double speed;
    string direction;
    string status;
    string currentLane;
    double safetyThreshold;
    double lastObstacleDist;
    bool emergencyBrakeActive;
    vector<Obstacle> activeObstacles;
};

void initModularVehicle(ModularVehicle& v, double threshold = DEFAULT_SAFETY_THRESHOLD) {
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
    if (v.status == "MOVING") return false;
    v.status = "STOPPED";
    return true;
}

bool modularStop(ModularVehicle& v) {
    v.speed = 0.0;
    v.status = "STOPPED";
    return true;
}

bool modularAccelerate(ModularVehicle& v, double delta = SPEED_STEP) {
    v.speed = min(MAX_SPEED, v.speed + delta);
    v.status = (v.speed > 0) ? "MOVING" : "STOPPED";
    return true;
}

bool modularDecelerate(ModularVehicle& v, double delta = SPEED_STEP) {
    if (v.speed <= 0.0) return false;
    v.speed = max(0.0, v.speed - delta);
    if (v.speed == 0.0) v.status = "STOPPED";
    return true;
}

bool modularChangeDirection(ModularVehicle& v, const string& newDir) {
    if (newDir != "FORWARD" && newDir != "BACKWARD" && newDir != "LEFT" && newDir != "RIGHT") return false;
    v.direction = newDir;
    return true;
}

bool modularDetectObstacle(ModularVehicle& v, double distance, const string& type = "Road Barricade") {
    if (distance < 0.0) return false;
    v.lastObstacleDist = distance;
    if (v.activeObstacles.empty()) {
        v.activeObstacles.push_back({"OBS-1", type, v.currentLane, distance});
    } else {
        v.activeObstacles[0] = {"OBS-1", type, v.currentLane, distance};
    }
    if (distance <= v.safetyThreshold) {
        v.emergencyBrakeActive = true;
        v.speed = 0.0;
        v.status = "EMERGENCY_STOP";
        return false;
    } else {
        v.emergencyBrakeActive = false;
        if (v.status == "EMERGENCY_STOP") v.status = "STOPPED";
        return true;
    }
}

bool modularResolveDangerZone(ModularVehicle& v, const string& solutionType = "AUTO") {
    if (solutionType == "BYPASS_LEFT" && v.currentLane == "CENTER") v.currentLane = "LEFT";
    else if (solutionType == "BYPASS_RIGHT" && v.currentLane == "CENTER") v.currentLane = "RIGHT";
    else if (solutionType == "REVERSE_BACKOUT") v.lastObstacleDist += 10.0;
    else v.lastObstacleDist = 75.0;

    if (solutionType == "BYPASS_LEFT" || solutionType == "BYPASS_RIGHT" || solutionType == "AUTO") {
        v.lastObstacleDist = 65.0;
    }
    v.emergencyBrakeActive = (v.lastObstacleDist <= v.safetyThreshold);
    v.status = "STOPPED";
    return !v.emergencyBrakeActive;
}

double getValidatedNumber(const string& prompt, double minVal = 0.0, double maxVal = 1000.0) {
    double value;
    while (true) {
        cout << prompt;
        if (cin >> value) {
            if (value >= minVal && value <= maxVal) return value;
            cout << "Error: Value must be between " << minVal << " and " << maxVal << "." << endl;
        } else {
            cout << "Error: Invalid numeric input!" << endl;
            cin.clear();
            cin.ignore(numeric_limits<streamsize>::max(), '\n');
        }
    }
}

int main() {
    AutonomousCar vehicle(DEFAULT_SAFETY_THRESHOLD);
    int choice = -1;

    cout << "================================================================" << endl;
    cout << "      AUTONOMOUS VEHICLE CONTROL SIMULATION (3-MODULE C++)      " << endl;
    cout << "================================================================" << endl;

    do {
        cout << "\n+----------------------- MAIN MENU ----------------------------+" << endl;
        cout << "| 1. Start Vehicle                                            |" << endl;
        cout << "| 2. Move Vehicle                                             |" << endl;
        cout << "| 3. Change Direction                                         |" << endl;
        cout << "| 4. Accelerate Vehicle                                       |" << endl;
        cout << "| 5. Decelerate Vehicle                                       |" << endl;
        cout << "| 6. Detect Obstacle & Resolve Danger Zone                    |" << endl;
        cout << "| 7. Display Vehicle Status & Active Obstacles                |" << endl;
        cout << "| 8. Reset Vehicle                                            |" << endl;
        cout << "| 0. Exit                                                     |" << endl;
        cout << "+--------------------------------------------------------------+" << endl;
        cout << "Enter your choice (0-8): ";

        if (!(cin >> choice)) {
            cout << "Error: Invalid menu choice!" << endl;
            cin.clear();
            cin.ignore(numeric_limits<streamsize>::max(), '\n');
            continue;
        }

        switch (choice) {
            case 1: vehicle.start(); break;
            case 2: {
                int dirChoice = 1;
                cout << "Direction (1=FORWARD, 2=BACKWARD, 3=LEFT, 4=RIGHT): ";
                cin >> dirChoice;
                string dirStr = (dirChoice == 2) ? "BACKWARD" : (dirChoice == 3 ? "LEFT" : (dirChoice == 4 ? "RIGHT" : "FORWARD"));
                double spd = getValidatedNumber("Speed (km/h, 5 - 120): ", 5.0, 120.0);
                vehicle.move(dirStr, spd);
                break;
            }
            case 3: {
                int dirChoice = 1;
                cout << "New Direction (1=FORWARD, 2=BACKWARD, 3=LEFT, 4=RIGHT): ";
                cin >> dirChoice;
                string dirStr = (dirChoice == 2) ? "BACKWARD" : (dirChoice == 3 ? "LEFT" : (dirChoice == 4 ? "RIGHT" : "FORWARD"));
                vehicle.setDirection(dirStr);
                break;
            }
            case 4: {
                double delta = getValidatedNumber("Speed increase (1 - 50): ", 1.0, 50.0);
                vehicle.accelerate(delta);
                break;
            }
            case 5: {
                double delta = getValidatedNumber("Speed decrease (1 - 50): ", 1.0, 50.0);
                vehicle.decelerate(delta);
                break;
            }
            case 6: {
                double dist = getValidatedNumber("Enter obstacle distance in meters (0 - 500): ", 0.0, 500.0);
                bool safe = vehicle.detectObstacle(dist, "Road Barricade");
                if (!safe) {
                    int sol = 0;
                    cout << "Apply Danger Zone Solution? (1=Auto Bypass, 2=Reverse +10m, 3=Clear Obstacle, 0=Keep Stop): ";
                    cin >> sol;
                    if (sol == 1) vehicle.resolveDangerZone("AUTO");
                    else if (sol == 2) vehicle.resolveDangerZone("REVERSE_BACKOUT");
                    else if (sol == 3) vehicle.resolveDangerZone("CLEAR_OBSTACLE");
                }
                break;
            }
            case 7: vehicle.displayStatus(); break;
            case 8: vehicle.reset(); break;
            case 0: cout << "\nExiting simulation. Thank you!" << endl; break;
            default: cout << "Error: Invalid option." << endl; break;
        }
    } while (choice != 0);

    return 0;
}
