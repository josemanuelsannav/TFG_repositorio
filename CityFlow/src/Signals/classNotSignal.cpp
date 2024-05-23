#include <iostream>
#include "classNotSignal.h"
#include "classNotSignal.h"
#include "../engine/engine.h"

namespace CityFlow
{
    ClassNotSignal::ClassNotSignal(const std::string &id, const std::string &road, int pos_x, int pos_y, const std::string &direccion)
        : id(id), road(road), pos_x(pos_x), pos_y(pos_y), direccion(direccion) {}

    double ClassNotSignal::affectVehicle(Vehicle &vehicle , double v )
    {
       
        if(calleSinSenal(vehicle))
        {
           
            if(vehicle.contadorAux < 5){
                vehicle.contadorAux++;
            }else{
                
                rand() % 2 == 0 ? v = 16.0 : v = 0.0;
                
                if (vehicle.getLeader() != nullptr && vehicle.getLeader()->getCurLane() == vehicle.getCurLane() && vehicle.getLeader()->getSpeed() < v)
                {
                    v = vehicle.getLeader()->getSpeed();
                }
                
            }
        }
        return v;
    }

    void ClassNotSignal::addEngine(Engine *engine)
    {
        this->engine = engine;
    }

    bool ClassNotSignal::calleSinSenal(Vehicle &vehicle)
    {
        if(vehicle.getCurLane()==nullptr || vehicle.getCurLane()->getBelongRoad()==nullptr)
        {
            return false;
        }
        if(vehicle.getCurLane()->getBelongRoad()->getId() == this->road)
        {
            return true;
        }
        
        return false;
    }
}