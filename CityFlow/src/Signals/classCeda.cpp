#include <iostream>
#include "classCeda.h"
#include "classNotSignal.h"
#include "../engine/engine.h"

namespace CityFlow
{
    ClassCeda::ClassCeda(const std::string &id, const std::string &road, int pos_x, int pos_y, const std::string &direccion)
        : id(id), road(road), pos_x(pos_x), pos_y(pos_y), direccion(direccion) {}

    double ClassCeda::affectVehicle(Vehicle &vehicle, double v)
    {
        if (estaEnCeda(vehicle))
        {
            if (vehicle.contadorStop == 4)
            {

                if (!hayCochesViniendo(vehicle))
                {
                    v = 16.0;
                    vehicle.contadorStop = 0;
                }
                else if (estaEncimaCeda(vehicle))
                {
                    v = 0.0;
                }
            }
            else
            {
                vehicle.contadorStop++;
                v = std::max(5.0, 16.0 - (3 * vehicle.contadorStop));
                v = min2double(v, vehicle.getCarFollowSpeed(2.0));
            }
        }
        return v;
    }

    void ClassCeda::addEngine(Engine *engine)
    {
        this->engine = engine;
    }

    bool ClassCeda::estaEnCeda(Vehicle &vehicle)
    {
        if (vehicle.getCurLane() != nullptr)
        {
            auto road = vehicle.getCurLane()->getBelongRoad();
            if (road->getId() == this->road)
            {
                if (vehicle.getPoint().x >= this->pos_x - 75 && vehicle.getPoint().x <= this->pos_x + 75 && vehicle.getPoint().y >= this->pos_y - 75 && vehicle.getPoint().y <= this->pos_y + 75)
                {
                    return true;
                }
            }
        }
        return false;
    }

    bool ClassCeda::hayCochesViniendo(Vehicle &vehicle)
    {
        if (vehicle.getCurLane() == nullptr || vehicle.getCurLane()->getBelongRoad() == nullptr)
        {
            return false;
        }
        const Intersection intersection = vehicle.getCurLane()->getBelongRoad()->getEndIntersection();
        std::vector<Road *> roads = intersection.getRoads();
        for (auto road : roads)
        {
            if (road == nullptr)
            {
                continue;
            }
            std::vector<mySignal *> signals = this->engine->getSignals();
            for (auto signal : signals)
            {
                ClassNotSignal *notSignal = dynamic_cast<ClassNotSignal *>(signal);
                if (notSignal)
                {
                    if (road->getId() == notSignal->road)
                    {
                        for (auto coche : engine->getRunningVehicles())
                        {
                            if (notSignal->direccion == "arriba")
                            {
                                if (coche->getPoint().x >= notSignal->pos_x - 6 && coche->getPoint().x <= notSignal->pos_x + 6 && coche->getPoint().y >= notSignal->pos_y - 70 && coche->getPoint().y <= notSignal->pos_y + 70)
                                {
                                    return true;
                                }
                            }
                            else if (notSignal->direccion == "abajo")
                            {
                                if (coche->getPoint().x >= notSignal->pos_x - 6 && coche->getPoint().x <= notSignal->pos_x + 6 && coche->getPoint().y <= notSignal->pos_y + 70 && coche->getPoint().y >= notSignal->pos_y - 70)
                                {
                                    return true;
                                }
                            }
                            else if (notSignal->direccion == "derecha")
                            {
                                if (coche->getPoint().x >= notSignal->pos_x - 70 && coche->getPoint().x <= notSignal->pos_x + 70 && coche->getPoint().y >= notSignal->pos_y - 6 && coche->getPoint().y <= notSignal->pos_y + 6)
                                {
                                    return true;
                                }
                            }
                            else if (notSignal->direccion == "izquierda")
                            {
                                if (coche->getPoint().x <= notSignal->pos_x + 70 && coche->getPoint().x >= notSignal->pos_x - 70 && coche->getPoint().y >= notSignal->pos_y - 6 && coche->getPoint().y <= notSignal->pos_y + 6)
                                {
                                    return true;
                                }
                            }
                        }
                    }
                }
            }
        }
        return false;
    }

    bool ClassCeda::estaEncimaCeda(Vehicle &vehicle)
    {
        if (vehicle.getCurLane() != nullptr)
        {
            auto road = vehicle.getCurLane()->getBelongRoad();
            if (road->getId() == this->road)
            {
                int dist = sqrt(pow(this->pos_x - vehicle.getPoint().x, 2) + pow(this->pos_y - vehicle.getPoint().y, 2));
                if (dist <= 25)
                {
                    return true;
                }
            }
        }
        return false;
    }
}