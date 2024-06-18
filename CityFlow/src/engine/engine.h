#ifndef CITYFLOW_ENGINE_H
#define CITYFLOW_ENGINE_H

#include "flow/flow.h"
#include "roadnet/roadnet.h"
#include "engine/archive.h"
#include "utility/barrier.h"
#include "Signals/mySignal.h"
#include "Signals/classCebra.h"
#include <mutex>
#include <thread>
#include <set>
#include <random>
#include <fstream>

namespace CityFlow
{

    class Engine
    {
        friend class Archive;

    private:
        static bool vehicleCmp(const std::pair<Vehicle *, double> &a, const std::pair<Vehicle *, double> &b)
        {
            return a.second > b.second;
        }

        struct Cebra
        {
            std::string id;
            std::string road;
            bool is_activated;
            int contador_cebra;
            int pos_x;
            int pos_y;
            std::string direccion;
            int contador_volver_a_parar;
        };

        std::vector<Cebra> lista_cebras;

        struct Stop
        {
            std::string id;
            std::string road;
            int pos_x;
            int pos_y;
            std::string direccion;
        };
        std::vector<Stop> lista_stops;

        struct NotStop
        {
            std::string id;
            std::string road;
            int pos_x;
            int pos_y;
            std::string direccion;
        };
        std::vector<NotStop> lista_notSignals;

        struct Ceda
        {
            std::string id;
            std::string road;
            int pos_x;
            int pos_y;
            std::string direccion;
        };
        std::vector<Ceda> lista_cedas;

        std::vector<mySignal *> signals;

        std::map<int, std::pair<Vehicle *, int>> vehiclePool;
        std::map<std::string, Vehicle *> vehicleMap;
        std::vector<std::set<Vehicle *>> threadVehiclePool;
        std::vector<std::vector<Road *>> threadRoadPool;
        std::vector<std::vector<Intersection *>> threadIntersectionPool;
        std::vector<std::vector<Drivable *>> threadDrivablePool;
        std::vector<Flow> flows;
        RoadNet roadnet;
        int threadNum;
        double interval;
        bool saveReplay;
        bool saveReplayInConfig; // saveReplay option in config json
        bool warnings;
        std::vector<std::pair<Vehicle *, double>> pushBuffer;
        std::vector<Vehicle *> laneChangeNotifyBuffer;
        std::set<Vehicle *> vehicleRemoveBuffer;
        rapidjson::Document jsonRoot;
        std::string stepLog;

        size_t step = 0;
        size_t activeVehicleCount = 0;
        int seed;
        std::mutex lock;
        Barrier startBarrier, endBarrier;
        std::vector<std::thread> threadPool;
        bool finished = false;
        std::string dir;
        std::ofstream logOut;

        bool rlTrafficLight;
        bool laneChange;
        int manuallyPushCnt = 0;

        int finishedVehicleCnt = 0;
        double cumulativeTravelTime = 0;

    private:
        void vehicleControl(Vehicle &vehicle, std::vector<std::pair<Vehicle *, double>> &buffer);

        void planRoute();

        void getAction();

        void updateAction();

        void updateLocation();

        void updateLeaderAndGap();

        void planLaneChange();

        void threadController(std::set<Vehicle *> &vehicles,
                              std::vector<Road *> &roads,
                              std::vector<Intersection *> &intersections,
                              std::vector<Drivable *> &drivables);

        void threadPlanRoute(const std::vector<Road *> &roads);

        void threadGetAction(std::set<Vehicle *> &vehicles);

        void threadUpdateAction(std::set<Vehicle *> &vehicles);

        void threadUpdateLeaderAndGap(const std::vector<Drivable *> &drivables);

        void threadUpdateLocation(const std::vector<Drivable *> &drivables);

        void threadNotifyCross(const std::vector<Intersection *> &intersections);

        void threadInitSegments(const std::vector<Road *> &roads);

        void threadPlanLaneChange(const std::set<Vehicle *> &vehicles);

        void handleWaiting();

        void updateLog();

        bool checkWarning();

        bool loadRoadNet(const std::string &jsonFile);

        bool loadFlow(const std::string &jsonFilename);

        void scheduleLaneChange();

        void insertShadow(Vehicle *vehicle);

    public:
        std::mt19937 rnd;

        std::vector<const Vehicle *> getRunningVehicles(bool includeWaiting = false) const;

        Engine(const std::string &configFile, int threadNum);

        // Getter for the list of Cebras
        const std::vector<Cebra> &getCebras() const
        {
            return lista_cebras;
        }
        const std::vector<Stop> &getStops() const
        {
            return lista_stops;
        }
        const std::vector<NotStop> &getNotStops() const
        {
            return lista_notSignals;
        }
        const std::vector<Ceda> &getCedas() const
        {
            return lista_cedas;
        }
        // Setter for the list of Cebras
        void setCebras(const std::vector<Cebra> &newCebras)
        {
            lista_cebras = newCebras;
        }

        const std::vector<mySignal *> &getSignals() const
        {
            return signals;
        }
        void addSignal(mySignal* signal); // Declaración del método


        double getInterval() const { return interval; }

        bool hasLaneChange() const { return laneChange; }

        bool loadConfig(const std::string &configFile);

        void notifyCross();

        void nextStep();
        void crearReplayCebras();

        bool checkPriority(int priority);

        void pushVehicle(Vehicle *const vehicle, bool pushToDrivable = true);

        void setLogFile(const std::string &jsonFile, const std::string &logFile);

        void initSegments();

        ~Engine();

        // RL related api

        void pushVehicle(const std::map<std::string, double> &info, const std::vector<std::string> &roads);

        size_t getVehicleCount() const;

        std::vector<std::string> getVehicles(bool includeWaiting = false) const;

        std::map<std::string, int> getLaneVehicleCount() const;

        std::map<std::string, int> getLaneWaitingVehicleCount() const;

        std::map<std::string, std::vector<std::string>> getLaneVehicles();

        std::map<std::string, double> getVehicleSpeed() const;

        std::map<std::string, double> getVehicleDistance() const;

        std::string getLeader(const std::string &vehicleId) const;

        double getCurrentTime() const;

        double getAverageTravelTime() const;

        void setTrafficLightPhase(const std::string &id, int phaseIndex);

        void setReplayLogFile(const std::string &logFile);

        void setSaveReplay(bool open);

        void setVehicleSpeed(const std::string &id, double speed);

        void setRandomSeed(int seed) { rnd.seed(seed); }

        void reset(bool resetRnd = false);

        // archive
        void load(const Archive &archive) { archive.resume(*this); }
        Archive snapshot() { return Archive(*this); }
        void loadFromFile(const char *fileName);

        bool setRoute(const std::string &vehicle_id, const std::vector<std::string> &anchor_id);

        std::map<std::string, std::string> getVehicleInfo(const std::string &id) const;
    };

}

#endif // CITYFLOW_ENGINE_H
