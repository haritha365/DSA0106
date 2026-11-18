#ifndef VEHICLE_H
#define VEHICLE_H

#include <string>
#include <vector>

/**
 * Obstacle descriptor used by Module 2 (Navigation & Danger Resolution)
 */
struct Obstacle {
    std::string id;
    std::string type;     // e.g., "Road Barricade", "Stopped Vehicle", "Pedestrian", "Construction Cone"
    std::string lane;     // "LEFT", "CENTER", "RIGHT"
    double distance;      // Distance in meters
};

/**
 * MODULE 1: AUTONOMOUS VEHICLE CONTROL USING OOP
 * Base Class: Vehicle
 * Encapsulates speed, direction, and vehicle operating status.
 * Demonstrates runtime polymorphism via virtual member functions.
 */
class Vehicle {
protected:
    double speed;             // km/h
    std::string direction;    // "FORWARD", "BACKWARD", "LEFT", "RIGHT"
    std::string status;       // "STOPPED", "MOVING", "EMERGENCY_STOP", "WARNING"

public:
    Vehicle(std::string initialDirection = "FORWARD");
    virtual ~Vehicle() {}

    // Encapsulated Accessors
    double getSpeed() const;
    std::string getDirection() const;
    std::string getStatus() const;

    // Core Control Methods (Virtual for polymorphism)
    virtual bool start();
    virtual bool stop();
    virtual bool accelerate(double delta = 10.0);
    virtual bool decelerate(double delta = 10.0);
    virtual bool setDirection(const std::string& newDir);
    virtual void displayStatus() const;
};

/**
 * MODULE 2: NAVIGATION, OBSTACLE DETECTION & DANGER SOLUTIONS
 * Derived Class: AutonomousCar
 * Inherits from Vehicle. Implements multi-lane obstacle detection,
 * configurable safety threshold, emergency stop interlock, and
 * automated Danger Zone solution recommendations/execution.
 */
class AutonomousCar : public Vehicle {
private:
    double safetyThreshold;               // in meters (default 5.0m)
    double lastObstacleDist;              // in meters (for current lane)
    bool emergencyBrakeActive;            // true when obstacle <= threshold
    std::string currentLane;              // "LEFT", "CENTER", "RIGHT"
    std::vector<Obstacle> activeObstacles;

public:
    AutonomousCar(double threshold = 5.0);

    void setSafetyThreshold(double threshold);
    double getSafetyThreshold() const;
    double getLastObstacleDistance() const;
    std::string getCurrentLane() const;
    bool isEmergencyBrakeActive() const;
    const std::vector<Obstacle>& getActiveObstacles() const;

    // Obstacle detection & danger zone inspection
    bool detectObstacle(double distance,
                        const std::string& type = "Road Barricade",
                        const std::string& lane = "");
    void addSideObstacle(const std::string& type, const std::string& lane, double distance);
    void displayActiveObstacles() const;
    std::string getRecommendedDangerSolution() const;
    void displayDangerZoneSolution() const;

    // Danger Zone Resolution Actions
    // solutionType: "BYPASS_LEFT", "BYPASS_RIGHT", "REVERSE_BACKOUT", "CLEAR_OBSTACLE", "AUTO"
    bool resolveDangerZone(const std::string& solutionType = "AUTO");

    bool move(const std::string& moveDir, double targetSpeed = 30.0);
    void reset();

    void displayStatus() const override;
};

#endif // VEHICLE_H
