#ifndef MODULAR_CONTROL_H
#define MODULAR_CONTROL_H

#include <string>
#include <vector>

/**
 * MODULE 3: CONVENTIONAL MODULAR PROGRAMMING IMPLEMENTATION
 * Procedural Implementation using plain structs and pure non-member functions.
 * Does not use classes, encapsulation, or virtual function tables.
 */
struct ModularObstacle {
    std::string id;
    std::string type;
    std::string lane;
    double distance;
};

struct ModularVehicle {
    double speed;
    std::string direction;
    std::string status;
    std::string currentLane;
    double safetyThreshold;
    double lastObstacleDist;
    bool emergencyBrakeActive;
    std::vector<ModularObstacle> activeObstacles;
};

void initModularVehicle(ModularVehicle& v, double threshold = 5.0);
bool modularStart(ModularVehicle& v);
bool modularStop(ModularVehicle& v);
bool modularAccelerate(ModularVehicle& v, double delta = 10.0);
bool modularDecelerate(ModularVehicle& v, double delta = 10.0);
bool modularChangeDirection(ModularVehicle& v, const std::string& newDir);
bool modularDetectObstacle(ModularVehicle& v, double distance,
                           const std::string& type = "Road Barricade",
                           const std::string& lane = "");
void modularDisplayObstacles(const ModularVehicle& v);
std::string modularGetDangerSolution(const ModularVehicle& v);
bool modularResolveDangerZone(ModularVehicle& v, const std::string& solutionType = "AUTO");
bool modularMove(ModularVehicle& v, const std::string& moveDir, double targetSpeed = 30.0);
void modularDisplayStatus(const ModularVehicle& v);
void modularReset(ModularVehicle& v);

#endif // MODULAR_CONTROL_H
